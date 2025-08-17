// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DataBurnReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DataBurnReceiverTest
 * @notice Comprehensive test suite for DataBurnReceiver contract
 */
contract DataBurnReceiverTest is Test {
    DataBurnReceiver public receiver;
    address public owner;
    address public user;
    address public dexRouter;
    
    // Mock tokens
    MockERC20 public usdc;
    MockERC20 public pyusd;
    MockERC20 public databurn;
    MockERC20 public randomToken;
    
    // Events
    event PaymentReceived(address indexed from, address indexed token, uint256 amount, bytes32 paymentId);
    event UnsupportedTokenReceived(address indexed from, address indexed token, uint256 amount);
    event TokensReturned(address indexed to, address indexed token, uint256 amount);
    event ETHWithdrawn(address indexed to, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        user = address(0x1);
        dexRouter = address(0x2);
        
        // Deploy contract
        receiver = new DataBurnReceiver();
        
        // Deploy mock tokens
        usdc = new MockERC20("USD Coin", "USDC", 6);
        pyusd = new MockERC20("PayPal USD", "PYUSD", 6);
        databurn = new MockERC20("DataBurn", "DATABURN", 18);
        randomToken = new MockERC20("Random", "RND", 18);
        
        // Fund user
        usdc.mint(user, 1000 * 10**6); // 1000 USDC
        pyusd.mint(user, 1000 * 10**6); // 1000 PYUSD
        randomToken.mint(user, 1000 * 10**18); // 1000 RND
        
        // Fund contract with ETH
        vm.deal(address(receiver), 10 ether);
    }
    
    // ============ Initialization Tests ============
    
    function testInitialization() public {
        assertEq(receiver.owner(), owner);
        assertEq(receiver.totalBurned(), 0);
        assertEq(receiver.totalValueReceived(), 0);
        assertEq(receiver.slippageTolerance(), 300);
    }
    
    function testInitializeContract() public {
        receiver.initialize(address(databurn), dexRouter);
        
        assertEq(receiver.databurnToken(), address(databurn));
        assertEq(receiver.dexRouter(), dexRouter);
    }
    
    function testCannotInitializeTwice() public {
        receiver.initialize(address(databurn), dexRouter);
        
        vm.expectRevert(DataBurnReceiver.AlreadyInitialized.selector);
        receiver.initialize(address(databurn), dexRouter);
    }
    
    function testCannotInitializeWithZeroAddress() public {
        vm.expectRevert(DataBurnReceiver.InvalidToken.selector);
        receiver.initialize(address(0), dexRouter);
        
        vm.expectRevert(DataBurnReceiver.InvalidToken.selector);
        receiver.initialize(address(databurn), address(0));
    }
    
    // ============ Payment Tests ============
    
    function testReceiveUSDCPayment() public {
        bytes32 paymentId = keccak256("payment1");
        uint256 amount = 100 * 10**6; // 100 USDC
        
        vm.startPrank(user);
        usdc.approve(address(receiver), amount);
        
        // Mock USDC calling receivePayment
        vm.stopPrank();
        vm.startPrank(address(usdc));
        
        vm.expectEmit(true, true, false, true);
        emit PaymentReceived(address(usdc), address(usdc), amount, paymentId);
        
        receiver.receivePayment(amount, paymentId);
        
        assertEq(receiver.totalValueReceived(), amount);
        assertTrue(receiver.isPaymentProcessed(paymentId));
    }
    
    function testCannotProcessSamePaymentTwice() public {
        bytes32 paymentId = keccak256("payment1");
        uint256 amount = 100 * 10**6;
        
        vm.prank(address(usdc));
        receiver.receivePayment(amount, paymentId);
        
        vm.prank(address(usdc));
        vm.expectRevert(DataBurnReceiver.PaymentAlreadyProcessed.selector);
        receiver.receivePayment(amount, paymentId);
    }
    
    function testRejectNonUSDCPYUSDPayment() public {
        bytes32 paymentId = keccak256("payment1");
        uint256 amount = 100 * 10**18;
        
        vm.prank(address(randomToken));
        vm.expectRevert(DataBurnReceiver.InvalidToken.selector);
        receiver.receivePayment(amount, paymentId);
    }
    
    // ============ Token Return Tests ============
    
    function testReceiveAndReturnUnsupportedToken() public {
        uint256 amount = 100 * 10**18;
        
        vm.startPrank(user);
        randomToken.approve(address(receiver), amount);
        
        vm.expectEmit(true, true, false, true);
        emit UnsupportedTokenReceived(user, address(randomToken), amount);
        
        receiver.receiveToken(address(randomToken), amount);
        
        assertEq(receiver.getReturnableBalance(user, address(randomToken)), amount);
        
        // Return tokens
        vm.expectEmit(true, true, false, true);
        emit TokensReturned(user, address(randomToken), amount);
        
        receiver.returnTokens(address(randomToken));
        
        assertEq(randomToken.balanceOf(user), 1000 * 10**18);
        assertEq(receiver.getReturnableBalance(user, address(randomToken)), 0);
        vm.stopPrank();
    }
    
    function testCannotReturnZeroTokens() public {
        vm.prank(user);
        vm.expectRevert(DataBurnReceiver.NoTokensToReturn.selector);
        receiver.returnTokens(address(randomToken));
    }
    
    // ============ Admin Tests ============
    
    function testOnlyOwnerCanPause() public {
        receiver.pause();
        assertTrue(receiver.paused());
        
        receiver.unpause();
        assertFalse(receiver.paused());
        
        vm.prank(user);
        vm.expectRevert();
        receiver.pause();
    }
    
    function testCannotReceivePaymentWhenPaused() public {
        receiver.pause();
        
        vm.prank(address(usdc));
        vm.expectRevert("Pausable: paused");
        receiver.receivePayment(100 * 10**6, keccak256("payment"));
    }
    
    function testWithdrawETH() public {
        uint256 initialBalance = owner.balance;
        uint256 contractBalance = address(receiver).balance;
        
        vm.expectEmit(true, false, false, true);
        emit ETHWithdrawn(owner, contractBalance);
        
        receiver.withdrawETH();
        
        assertEq(address(receiver).balance, 0);
        assertEq(owner.balance, initialBalance + contractBalance);
    }
    
    function testOnlyOwnerCanWithdrawETH() public {
        vm.prank(user);
        vm.expectRevert();
        receiver.withdrawETH();
    }
    
    function testEmergencyRecovery() public {
        // Send tokens to contract
        usdc.mint(address(receiver), 500 * 10**6);
        
        receiver.pause();
        
        uint256 balanceBefore = usdc.balanceOf(owner);
        receiver.emergencyRecover(address(usdc), 500 * 10**6);
        
        assertEq(usdc.balanceOf(owner), balanceBefore + 500 * 10**6);
    }
    
    function testCannotEmergencyRecoverWhenNotPaused() public {
        vm.expectRevert("Must be paused for emergency");
        receiver.emergencyRecover(address(usdc), 100 * 10**6);
    }
    
    // ============ Slippage Tests ============
    
    function testUpdateSlippageTolerance() public {
        receiver.updateSlippageTolerance(500);
        assertEq(receiver.slippageTolerance(), 500);
    }
    
    function testCannotSetSlippageAbove10Percent() public {
        vm.expectRevert("Slippage too high");
        receiver.updateSlippageTolerance(1001);
    }
    
    // ============ View Function Tests ============
    
    function testGetStatistics() public {
        receiver.initialize(address(databurn), dexRouter);
        
        (
            uint256 totalBurned,
            uint256 totalValue,
            address databurnAddr,
            address routerAddr,
            bool isPaused
        ) = receiver.getStatistics();
        
        assertEq(totalBurned, 0);
        assertEq(totalValue, 0);
        assertEq(databurnAddr, address(databurn));
        assertEq(routerAddr, dexRouter);
        assertFalse(isPaused);
    }
    
    // ============ ETH Receive Tests ============
    
    function testReceiveETH() public {
        uint256 amount = 1 ether;
        
        vm.expectEmit(true, true, false, false);
        emit PaymentReceived(user, address(0), amount, bytes32(0));
        
        vm.prank(user);
        (bool success,) = address(receiver).call{value: amount}("");
        assertTrue(success);
        
        assertEq(address(receiver).balance, 11 ether);
    }
}

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}