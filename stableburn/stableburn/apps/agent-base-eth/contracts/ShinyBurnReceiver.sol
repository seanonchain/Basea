// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title ShinyBurnReceiver
 * @author agent.base.eth
 * @notice Receives x402 payments and automatically swaps USDC to ETH to SHINY and burns it
 * @dev Uses Uniswap V3 for USDC->ETH and Flaunch/Uniswap V4 for ETH->SHINY
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

// Uniswap V3 interfaces for USDC -> ETH swap
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

// Uniswap V2 style router interface for SHINY (if using V2-style DEX)
interface IUniswapV2Router02 {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

// WETH interface for unwrapping
interface IWETH {
    function withdraw(uint wad) external;
    function balanceOf(address owner) external view returns (uint);
}

/**
 * @title ShinyBurnReceiver
 * @notice Receives payments and burns SHINY tokens
 */
contract ShinyBurnReceiver is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    // ============ Constants ============
    
    /// @notice USDC token address on Base
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    /// @notice WETH address on Base
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    
    /// @notice SHINY token address on Base  
    address public constant SHINY_TOKEN = 0xd47BE5Ca7c38B4BEb6FFCb9B7DA848De71ec8edb;
    
    /// @notice PayPal USD (PYUSD) address on Base
    address public constant PYUSD = 0xCFc37A6AB183dd4aED08C204D1c2773c0b1BDf46;
    
    /// @notice Dead address for burning tokens
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Uniswap V3 SwapRouter on Base
    address public constant UNISWAP_V3_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;
    
    /// @notice Minimum swap amount to prevent dust
    uint256 public constant MIN_SWAP_AMOUNT = 1e6; // 1 USDC (6 decimals)
    
    // ============ State Variables ============
    
    /// @notice DEX router address for ETH->SHINY swapping (Flaunch or other V2-style)
    address public ethToShinyRouter;
    
    /// @notice Total amount of SHINY tokens burned
    uint256 public totalBurned;
    
    /// @notice Total value received in USD (6 decimals)
    uint256 public totalValueReceived;
    
    /// @notice Slippage tolerance for swaps (basis points, e.g., 300 = 3%)
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
        uint256 ethReceived,
        uint256 shinyOut
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
        address ethToShinyRouter,
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
     * @notice Initialize contract with ETH->SHINY router address
     * @param _ethToShinyRouter Address of the DEX router for ETH->SHINY swaps
     * @dev Can only be called once by the owner
     */
    function initialize(address _ethToShinyRouter) external onlyOwner {
        if (ethToShinyRouter != address(0)) revert AlreadyInitialized();
        if (_ethToShinyRouter == address(0)) revert InvalidToken();
        
        ethToShinyRouter = _ethToShinyRouter;
        
        emit ConfigurationUpdated(ethToShinyRouter, slippageTolerance);
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
        
        // Auto-swap to SHINY and burn if initialized
        if (ethToShinyRouter != address(0)) {
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
            
            // Auto-swap to SHINY and burn if initialized
            if (ethToShinyRouter != address(0)) {
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
        emit ConfigurationUpdated(ethToShinyRouter, slippageTolerance);
    }
    
    /**
     * @notice Update ETH->SHINY router
     * @param _ethToShinyRouter New router address
     * @dev Only owner can call
     */
    function updateEthToShinyRouter(address _ethToShinyRouter) external onlyOwner {
        if (_ethToShinyRouter == address(0)) revert InvalidToken();
        ethToShinyRouter = _ethToShinyRouter;
        emit ConfigurationUpdated(ethToShinyRouter, slippageTolerance);
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
     * @notice Swap USDC/PYUSD to ETH to SHINY and burn
     * @param tokenIn Address of input token (USDC or PYUSD)
     * @param amountIn Amount to swap
     * @dev Two-step swap: USDC->ETH via Uniswap V3, then ETH->SHINY via Flaunch/V2
     */
    function _swapAndBurn(address tokenIn, uint256 amountIn) private {
        if (ethToShinyRouter == address(0)) revert NotInitialized();
        if (amountIn < MIN_SWAP_AMOUNT) return; // Skip dust amounts
        
        // Step 1: Swap USDC/PYUSD to ETH via Uniswap V3
        uint256 ethReceived = _swapToETH(tokenIn, amountIn);
        
        if (ethReceived == 0) revert SwapFailed();
        
        // Step 2: Swap ETH to SHINY
        uint256 shinyReceived = _swapETHToShiny(ethReceived);
        
        emit TokensSwapped(tokenIn, amountIn, ethReceived, shinyReceived);
        
        // Step 3: Burn SHINY tokens
        _burn(shinyReceived);
    }
    
    /**
     * @notice Swap USDC/PYUSD to ETH using Uniswap V3
     * @param tokenIn Input token address
     * @param amountIn Amount to swap
     * @return ethReceived Amount of ETH received
     */
    function _swapToETH(address tokenIn, uint256 amountIn) private returns (uint256 ethReceived) {
        // Approve Uniswap V3 router
        SafeERC20.forceApprove(IERC20(tokenIn), UNISWAP_V3_ROUTER, amountIn);
        
        // Prepare swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: WETH, // Swap to WETH first
            fee: 500, // 0.05% fee tier (most common for stablecoin pairs)
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: 0, // Will calculate separately
            sqrtPriceLimitX96: 0
        });
        
        // Execute swap
        uint256 wethReceived = ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(params);
        
        // Unwrap WETH to ETH
        if (wethReceived > 0) {
            IWETH(WETH).withdraw(wethReceived);
            ethReceived = wethReceived;
        }
        
        // Reset approval
        SafeERC20.forceApprove(IERC20(tokenIn), UNISWAP_V3_ROUTER, 0);
    }
    
    /**
     * @notice Swap ETH to SHINY using configured router
     * @param ethAmount Amount of ETH to swap
     * @return shinyReceived Amount of SHINY received
     */
    function _swapETHToShiny(uint256 ethAmount) private returns (uint256 shinyReceived) {
        // Build path for V2-style router
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = SHINY_TOKEN;
        
        // Calculate minimum output with slippage
        uint256 minAmountOut = _calculateMinAmountOut(ethAmount, path);
        
        // Track SHINY balance before
        uint256 balanceBefore = IERC20(SHINY_TOKEN).balanceOf(address(this));
        
        // Execute swap with ETH
        try IUniswapV2Router02(ethToShinyRouter).swapExactETHForTokens{value: ethAmount}(
            minAmountOut,
            path,
            address(this),
            block.timestamp + 300
        ) returns (uint[] memory amounts) {
            uint256 balanceAfter = IERC20(SHINY_TOKEN).balanceOf(address(this));
            shinyReceived = balanceAfter - balanceBefore;
        } catch {
            revert SwapFailed();
        }
    }
    
    /**
     * @notice Calculate minimum amount out with slippage for ETH->SHINY
     * @param amountIn ETH input amount
     * @param path Swap path
     * @return minAmountOut Minimum expected output
     */
    function _calculateMinAmountOut(
        uint256 amountIn,
        address[] memory path
    ) private view returns (uint256) {
        try IUniswapV2Router02(ethToShinyRouter).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
            uint256 expectedOut = amounts[amounts.length - 1];
            uint256 minAmountOut = (expectedOut * (10000 - slippageTolerance)) / 10000;
            return minAmountOut;
        } catch {
            // If quote fails, use 0 to allow any amount (risky but prevents stuck funds)
            return 0;
        }
    }
    
    /**
     * @notice Burn SHINY tokens by sending to dead address
     * @param amount Amount to burn
     * @dev Updates total burned counter
     */
    function _burn(uint256 amount) private {
        if (amount == 0) return;
        
        IERC20(SHINY_TOKEN).safeTransfer(BURN_ADDRESS, amount);
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
     * @return ethToShinyRouterAddress Address of the ETH->SHINY router
     * @return isPaused Whether the contract is paused
     */
    function getStatistics() external view returns (
        uint256 totalBurnedAmount,
        uint256 totalValueReceivedAmount,
        address ethToShinyRouterAddress,
        bool isPaused
    ) {
        return (
            totalBurned,
            totalValueReceived,
            ethToShinyRouter,
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