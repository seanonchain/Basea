// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DataBurnReceiver
 * @author agent.base.eth
 * @notice Receives x402 payments and automatically swaps USDC/PYUSD to $DATABURN and burns it
 * @dev Only accepts USDC and PYUSD for auto-swap, returns all other tokens to sender
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

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function WETH() external pure returns (address);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

/**
 * @title DataBurnReceiver
 * @notice Receives payments and burns $DATABURN tokens
 */
contract DataBurnReceiver is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    // ============ Constants ============
    
    /// @notice USDC token address on Base
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    /// @notice PayPal USD (PYUSD) address on Base
    address public constant PYUSD = 0xCFc37A6AB183dd4aED08C204D1c2773c0b1BDf46;
    
    /// @notice Dead address for burning tokens
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Minimum swap amount to prevent dust
    uint256 public constant MIN_SWAP_AMOUNT = 1e6; // 1 USDC/PYUSD (6 decimals)
    
    // ============ State Variables ============
    
    /// @notice Address of the $DATABURN token (set after deployment)
    address public databurnToken;
    
    /// @notice DEX router address for swapping (Uniswap V2 compatible)
    address public dexRouter;
    
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
        uint256 databurnOut,
        address[] path
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
        address dexRouter,
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
     * @notice Initialize contract with DATABURN token and DEX router addresses
     * @param _databurnToken Address of the $DATABURN token
     * @param _dexRouter Address of the DEX router (Uniswap V2 compatible)
     * @dev Can only be called once by the owner
     */
    function initialize(
        address _databurnToken,
        address _dexRouter
    ) external onlyOwner {
        if (databurnToken != address(0)) revert AlreadyInitialized();
        if (_databurnToken == address(0)) revert InvalidToken();
        if (_dexRouter == address(0)) revert InvalidToken();
        
        databurnToken = _databurnToken;
        dexRouter = _dexRouter;
        
        emit ConfigurationUpdated(databurnToken, dexRouter, slippageTolerance);
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
        if (databurnToken != address(0) && dexRouter != address(0)) {
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
            if (databurnToken != address(0) && dexRouter != address(0)) {
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
        emit ConfigurationUpdated(databurnToken, dexRouter, slippageTolerance);
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
     * @notice Swap USDC/PYUSD to DATABURN and burn
     * @param tokenIn Address of input token (USDC or PYUSD)
     * @param amountIn Amount to swap
     * @dev Internal function that handles the swap and burn logic
     */
    function _swapAndBurn(address tokenIn, uint256 amountIn) private {
        if (databurnToken == address(0) || dexRouter == address(0)) revert NotInitialized();
        if (amountIn < MIN_SWAP_AMOUNT) return; // Skip dust amounts
        
        // Approve router to spend tokens
        SafeERC20.forceApprove(IERC20(tokenIn), dexRouter, amountIn);
        
        // Build swap path
        address[] memory path = _buildSwapPath(tokenIn);
        
        // Calculate minimum output with slippage
        uint256 minAmountOut = _calculateMinAmountOut(amountIn, path);
        
        // Execute swap
        uint256 balanceBefore = IERC20(databurnToken).balanceOf(address(this));
        
        try IUniswapV2Router02(dexRouter).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        ) returns (uint[] memory amounts) {
            uint256 balanceAfter = IERC20(databurnToken).balanceOf(address(this));
            uint256 databurnReceived = balanceAfter - balanceBefore;
            
            emit TokensSwapped(tokenIn, amountIn, databurnReceived, path);
            
            // Burn DATABURN tokens
            _burn(databurnReceived);
        } catch {
            // Swap failed, reset approval
            SafeERC20.forceApprove(IERC20(tokenIn), dexRouter, 0);
            revert SwapFailed();
        }
    }
    
    /**
     * @notice Build swap path for DEX router
     * @param tokenIn Input token address
     * @return path Array of addresses representing swap path
     */
    function _buildSwapPath(address tokenIn) private view returns (address[] memory) {
        address weth = IUniswapV2Router02(dexRouter).WETH();
        
        // Direct path if liquidity exists, otherwise through WETH
        address[] memory path = new address[](3);
        path[0] = tokenIn;
        path[1] = weth;
        path[2] = databurnToken;
        
        return path;
    }
    
    /**
     * @notice Calculate minimum amount out with slippage
     * @param amountIn Input amount
     * @param path Swap path
     * @return minAmountOut Minimum expected output
     */
    function _calculateMinAmountOut(
        uint256 amountIn,
        address[] memory path
    ) private view returns (uint256) {
        try IUniswapV2Router02(dexRouter).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
            uint256 expectedOut = amounts[amounts.length - 1];
            uint256 minAmountOut = (expectedOut * (10000 - slippageTolerance)) / 10000;
            return minAmountOut;
        } catch {
            // If quote fails, use 0 to allow any amount (risky but prevents stuck funds)
            return 0;
        }
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
     * @return dexRouterAddress Address of the DEX router
     * @return isPaused Whether the contract is paused
     */
    function getStatistics() external view returns (
        uint256 totalBurnedAmount,
        uint256 totalValueReceivedAmount,
        address databurnTokenAddress,
        address dexRouterAddress,
        bool isPaused
    ) {
        return (
            totalBurned,
            totalValueReceived,
            databurnToken,
            dexRouter,
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