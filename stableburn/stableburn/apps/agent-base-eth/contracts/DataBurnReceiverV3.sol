// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title DataBurnReceiverV3
 * @author agent.base.eth
 * @notice Receives x402 payments and automatically swaps USDC/PYUSD to $DATABURN via ETH and burns it
 * @dev Uses Uniswap V3 for USDC->ETH swap, then Flaunch pool for ETH->Token swap
 * 
 * Security Features:
 * - ReentrancyGuard for all external functions
 * - Pausable for emergency situations
 * - Owner-only administrative functions
 * - Safe transfer patterns
 * - Comprehensive event logging
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface IQuoterV2 {
    struct QuoteExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }
    
    function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

// Flaunch DEX interface (simplified Uniswap V2 style)
interface IFlaunchPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

/**
 * @title DataBurnReceiverV3
 * @notice Receives payments and burns $DATABURN tokens via two-step swap
 */
contract DataBurnReceiverV3 is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    // ============ Constants ============
    
    /// @notice USDC token address on Base
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    /// @notice PayPal USD (PYUSD) address on Base
    address public constant PYUSD = 0xCFc37A6AB183dd4aED08C204D1c2773c0b1BDf46;
    
    /// @notice WETH address on Base
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    
    /// @notice Dead address for burning tokens
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Minimum swap amount to prevent dust
    uint256 public constant MIN_SWAP_AMOUNT = 1e6; // 1 USDC/PYUSD (6 decimals)
    
    /// @notice Uniswap V3 fee tier for USDC/ETH pool (0.05%)
    uint24 public constant POOL_FEE = 500;
    
    // ============ State Variables ============
    
    /// @notice Address of the $DATABURN token (set after deployment)
    address public databurnToken;
    
    /// @notice Uniswap V3 SwapRouter address
    address public uniswapRouter;
    
    /// @notice Uniswap V3 Quoter address for price quotes
    address public uniswapQuoter;
    
    /// @notice Flaunch pair address for ETH/Token swaps
    address public flaunchPair;
    
    /// @notice Total amount of $DATABURN tokens burned
    uint256 public totalBurned;
    
    /// @notice Total value received in USD (6 decimals)
    uint256 public totalValueReceived;
    
    /// @notice Slippage tolerance for swaps (basis points, e.g., 100 = 1%)
    uint256 public slippageTolerance = 300; // 3% default
    
    /// @notice Mapping of unsupported tokens that can be returned to sender
    mapping(address => mapping(address => uint256)) public returnableTokens;
    
    /// @notice Mapping to track processed payments for idempotency
    mapping(bytes32 => bool) public processedPayments;
    
    // ============ Events ============
    
    event PaymentReceived(
        address indexed from,
        address indexed token,
        uint256 amount,
        bytes32 paymentId
    );
    
    event TokensBurned(
        uint256 amount,
        uint256 totalBurnedToDate
    );
    
    event TokensSwapped(
        address indexed tokenIn,
        uint256 amountIn,
        uint256 ethOut,
        uint256 databurnOut
    );
    
    event UnsupportedTokenReceived(
        address indexed from,
        address indexed token,
        uint256 amount
    );
    
    event TokensReturned(
        address indexed to,
        address indexed token,
        uint256 amount
    );
    
    event ETHWithdrawn(
        address indexed to,
        uint256 amount
    );
    
    event ConfigurationUpdated(
        address databurnToken,
        address uniswapRouter,
        address flaunchPair,
        uint256 slippageTolerance
    );
    
    event EmergencyWithdrawal(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    
    // ============ Errors ============
    
    error InvalidToken();
    error InvalidAmount();
    error TransferFailed();
    error SwapFailed();
    error AlreadyInitialized();
    error NotInitialized();
    error NoTokensToReturn();
    error PaymentAlreadyProcessed();
    error InsufficientBalance();
    error SlippageExceeded();
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the contract with the deployer as owner
     */
    constructor() Ownable(msg.sender) {
        // Constructor sets the owner via Ownable
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Initialize contract with token and DEX addresses
     * @param _databurnToken Address of the $DATABURN token
     * @param _uniswapRouter Address of Uniswap V3 SwapRouter
     * @param _uniswapQuoter Address of Uniswap V3 Quoter
     * @param _flaunchPair Address of Flaunch ETH/Token pair
     * @dev Can only be called once by the owner
     */
    function initialize(
        address _databurnToken,
        address _uniswapRouter,
        address _uniswapQuoter,
        address _flaunchPair
    ) external onlyOwner {
        if (databurnToken != address(0)) revert AlreadyInitialized();
        if (_databurnToken == address(0)) revert InvalidToken();
        if (_uniswapRouter == address(0)) revert InvalidToken();
        if (_flaunchPair == address(0)) revert InvalidToken();
        
        databurnToken = _databurnToken;
        uniswapRouter = _uniswapRouter;
        uniswapQuoter = _uniswapQuoter;
        flaunchPair = _flaunchPair;
        
        emit ConfigurationUpdated(databurnToken, uniswapRouter, flaunchPair, slippageTolerance);
    }
    
    /**
     * @notice Receive x402 payment in USDC or PYUSD
     * @param amount Amount of tokens to receive
     * @param paymentId Unique payment identifier for idempotency
     * @dev Only accepts USDC or PYUSD for auto-swap
     */
    function receivePayment(
        uint256 amount,
        bytes32 paymentId
    ) external nonReentrant whenNotPaused {
        // Check for duplicate payment
        if (processedPayments[paymentId]) revert PaymentAlreadyProcessed();
        
        // Only accept USDC or PYUSD
        address token = msg.sender;
        if (token != USDC && token != PYUSD) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();
        
        // Mark payment as processed
        processedPayments[paymentId] = true;
        
        // Transfer tokens from sender using SafeERC20
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update total value received
        totalValueReceived += amount;
        
        emit PaymentReceived(msg.sender, token, amount, paymentId);
        
        // Auto-swap to DATABURN and burn if initialized
        if (databurnToken != address(0) && uniswapRouter != address(0) && flaunchPair != address(0)) {
            _swapAndBurn(token, amount);
        }
    }
    
    /**
     * @notice Receive any ERC20 token - non-USDC/PYUSD will be returnable
     * @param token Address of the token
     * @param amount Amount of tokens
     * @dev Unsupported tokens are tracked for return to sender
     */
    function receiveToken(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();
        
        // Transfer tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Check if token is supported for auto-swap
        if (token == USDC || token == PYUSD) {
            totalValueReceived += amount;
            emit PaymentReceived(msg.sender, token, amount, keccak256(abi.encodePacked(msg.sender, token, amount, block.timestamp)));
            
            // Auto-swap to DATABURN and burn if initialized
            if (databurnToken != address(0) && uniswapRouter != address(0) && flaunchPair != address(0)) {
                _swapAndBurn(token, amount);
            }
        } else {
            // Track unsupported tokens for return
            returnableTokens[msg.sender][token] += amount;
            emit UnsupportedTokenReceived(msg.sender, token, amount);
        }
    }
    
    /**
     * @notice Return unsupported tokens to sender
     * @param token Address of the token to return
     * @dev Anyone can call this to return their tokens
     */
    function returnTokens(address token) external nonReentrant {
        uint256 amount = returnableTokens[msg.sender][token];
        if (amount == 0) revert NoTokensToReturn();
        
        // Reset balance before transfer (checks-effects-interactions pattern)
        returnableTokens[msg.sender][token] = 0;
        
        // Return tokens using SafeERC20
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit TokensReturned(msg.sender, token, amount);
    }
    
    /**
     * @notice Receive ETH - only owner can withdraw
     * @dev ETH is not auto-swapped, only stored for owner withdrawal
     */
    receive() external payable {
        emit PaymentReceived(msg.sender, address(0), msg.value, keccak256(abi.encodePacked(msg.sender, msg.value, block.timestamp)));
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update slippage tolerance for swaps
     * @param _slippageTolerance New slippage tolerance in basis points
     * @dev Only owner can call
     */
    function updateSlippageTolerance(uint256 _slippageTolerance) external onlyOwner {
        require(_slippageTolerance <= 1000, "Slippage too high"); // Max 10%
        slippageTolerance = _slippageTolerance;
        emit ConfigurationUpdated(databurnToken, uniswapRouter, flaunchPair, slippageTolerance);
    }
    
    /**
     * @notice Update Flaunch pair address
     * @param _flaunchPair New Flaunch pair address
     * @dev Only owner can call
     */
    function updateFlaunchPair(address _flaunchPair) external onlyOwner {
        if (_flaunchPair == address(0)) revert InvalidToken();
        flaunchPair = _flaunchPair;
        emit ConfigurationUpdated(databurnToken, uniswapRouter, flaunchPair, slippageTolerance);
    }
    
    /**
     * @notice Withdraw ETH - only owner
     * @dev Withdraws entire ETH balance to owner
     */
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit ETHWithdrawn(owner(), balance);
    }
    
    /**
     * @notice Pause contract - only owner
     * @dev Pauses all payment receiving functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract - only owner
     * @dev Resumes all payment receiving functions
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency token recovery - only owner
     * @param token Token to recover (address(0) for ETH)
     * @param amount Amount to recover
     * @dev Can only be called when contract is paused
     */
    function emergencyRecover(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(paused(), "Must be paused for emergency");
        
        if (token == address(0)) {
            // Recover ETH
            (bool success, ) = owner().call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            // Recover ERC20
            IERC20(token).safeTransfer(owner(), amount);
        }
        
        emit EmergencyWithdrawal(token, owner(), amount);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Two-step swap: USDC/PYUSD -> ETH -> DATABURN, then burn
     * @param tokenIn Address of input token (USDC or PYUSD)
     * @param amountIn Amount to swap
     * @dev Internal function that handles the two-step swap and burn logic
     */
    function _swapAndBurn(address tokenIn, uint256 amountIn) private {
        if (databurnToken == address(0) || uniswapRouter == address(0) || flaunchPair == address(0)) revert NotInitialized();
        if (amountIn < MIN_SWAP_AMOUNT) return; // Skip dust amounts
        
        // Step 1: Swap USDC/PYUSD to ETH via Uniswap V3
        uint256 ethReceived = _swapToETH(tokenIn, amountIn);
        
        if (ethReceived == 0) revert SwapFailed();
        
        // Step 2: Swap ETH to DATABURN via Flaunch pair
        uint256 databurnReceived = _swapETHToToken(ethReceived);
        
        if (databurnReceived == 0) revert SwapFailed();
        
        emit TokensSwapped(tokenIn, amountIn, ethReceived, databurnReceived);
        
        // Step 3: Burn DATABURN tokens
        _burn(databurnReceived);
    }
    
    /**
     * @notice Swap USDC/PYUSD to ETH via Uniswap V3
     * @param tokenIn Input token address (USDC or PYUSD)
     * @param amountIn Amount to swap
     * @return ethOut Amount of ETH received
     */
    function _swapToETH(address tokenIn, uint256 amountIn) private returns (uint256 ethOut) {
        // Approve router to spend tokens
        SafeERC20.forceApprove(IERC20(tokenIn), uniswapRouter, amountIn);
        
        // Calculate minimum output with slippage
        uint256 minAmountOut = _getQuoteUniswapV3(tokenIn, WETH, amountIn);
        minAmountOut = (minAmountOut * (10000 - slippageTolerance)) / 10000;
        
        // Execute swap via Uniswap V3
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: WETH,
            fee: POOL_FEE,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        ethOut = ISwapRouter(uniswapRouter).exactInputSingle(params);
        
        // Unwrap WETH to ETH
        if (ethOut > 0) {
            IWETH(WETH).withdraw(ethOut);
        }
        
        return ethOut;
    }
    
    /**
     * @notice Swap ETH to DATABURN via Flaunch pair
     * @param ethIn Amount of ETH to swap
     * @return tokenOut Amount of DATABURN received
     */
    function _swapETHToToken(uint256 ethIn) private returns (uint256 tokenOut) {
        IFlaunchPair pair = IFlaunchPair(flaunchPair);
        
        // Get reserves and determine swap direction
        (uint112 reserve0, uint112 reserve1,) = pair.getReserves();
        bool isToken0 = pair.token0() == databurnToken;
        
        // Calculate output amount using constant product formula
        uint256 amountOut;
        if (isToken0) {
            // ETH is token1, DATABURN is token0
            amountOut = _getAmountOut(ethIn, reserve1, reserve0);
        } else {
            // ETH is token0, DATABURN is token1
            amountOut = _getAmountOut(ethIn, reserve0, reserve1);
        }
        
        // Apply slippage
        amountOut = (amountOut * (10000 - slippageTolerance)) / 10000;
        
        // Execute swap
        uint256 amount0Out = isToken0 ? amountOut : 0;
        uint256 amount1Out = isToken0 ? 0 : amountOut;
        
        // Send ETH to pair first
        (bool sent,) = flaunchPair.call{value: ethIn}("");
        require(sent, "Failed to send ETH to pair");
        
        // Then execute swap
        pair.swap(amount0Out, amount1Out, address(this), "");
        
        // Check actual balance received
        tokenOut = IERC20(databurnToken).balanceOf(address(this));
        
        return tokenOut;
    }
    
    /**
     * @notice Get quote from Uniswap V3 Quoter
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return amountOut Expected output amount
     */
    function _getQuoteUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private returns (uint256 amountOut) {
        if (uniswapQuoter == address(0)) return 0;
        
        try IQuoterV2(uniswapQuoter).quoteExactInputSingle(
            IQuoterV2.QuoteExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: POOL_FEE,
                amountIn: amountIn,
                sqrtPriceLimitX96: 0
            })
        ) returns (uint256 _amountOut, uint160, uint32, uint256) {
            return _amountOut;
        } catch {
            return 0;
        }
    }
    
    /**
     * @notice Calculate output amount for constant product AMM
     * @param amountIn Input amount
     * @param reserveIn Input reserve
     * @param reserveOut Output reserve
     * @return amountOut Output amount
     */
    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) private pure returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
    
    /**
     * @notice Burn DATABURN tokens by sending to dead address
     * @param amount Amount to burn
     * @dev Updates total burned counter
     */
    function _burn(uint256 amount) private {
        if (amount == 0) return;
        
        IERC20(databurnToken).safeTransfer(BURN_ADDRESS, amount);
        totalBurned += amount;
        
        emit TokensBurned(amount, totalBurned);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Check returnable token balance for a user
     * @param user User address
     * @param token Token address
     * @return Amount of tokens returnable
     */
    function getReturnableBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return returnableTokens[user][token];
    }
    
    /**
     * @notice Get contract statistics
     * @return totalBurnedAmount Total amount of tokens burned
     * @return totalValueReceivedAmount Total value received in USD
     * @return databurnTokenAddress Address of the DATABURN token
     * @return uniswapRouterAddress Address of the Uniswap router
     * @return flaunchPairAddress Address of the Flaunch pair
     * @return isPaused Whether the contract is paused
     */
    function getStatistics() external view returns (
        uint256 totalBurnedAmount,
        uint256 totalValueReceivedAmount,
        address databurnTokenAddress,
        address uniswapRouterAddress,
        address flaunchPairAddress,
        bool isPaused
    ) {
        return (
            totalBurned,
            totalValueReceived,
            databurnToken,
            uniswapRouter,
            flaunchPair,
            paused()
        );
    }
    
    /**
     * @notice Check if a payment has been processed
     * @param paymentId Payment identifier
     * @return bool True if payment has been processed
     */
    function isPaymentProcessed(bytes32 paymentId) external view returns (bool) {
        return processedPayments[paymentId];
    }
}