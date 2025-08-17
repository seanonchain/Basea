// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../contracts/DataBurnReceiver.sol";

/**
 * @title DeployDataBurnReceiver
 * @notice Deployment script for DataBurnReceiver contract on Base
 * @dev Run with: forge script script/DeployDataBurnReceiver.s.sol --rpc-url base --broadcast --verify
 */
contract DeployDataBurnReceiver is Script {
    // Base mainnet addresses
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant PYUSD = 0xCFc37A6AB183dd4aED08C204D1c2773c0b1BDf46;
    
    // DEX Routers on Base (choose one)
    address constant BASESWAP_ROUTER = 0x327Df1E6de05895d2ab08513aaDD9313Fe505d86; // BaseSwap (Uniswap V2 fork)
    address constant AERODROME_ROUTER = 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43; // Aerodrome
    address constant SUSHI_ROUTER = 0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891; // SushiSwap V2
    
    // Placeholder for DATABURN token (will be updated after deployment)
    address constant PLACEHOLDER_DATABURN = address(0x1);
    
    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("DEPLOYING DATABURN RECEIVER");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");
        console.log("Network: Base Mainnet");
        console.log("========================================");
        
        // Start broadcast
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy DataBurnReceiver
        DataBurnReceiver databurnReceiver = new DataBurnReceiver();
        
        console.log("\nContract deployed to:", address(databurnReceiver));
        
        // Verify constants are correct
        require(databurnReceiver.USDC() == USDC, "USDC address mismatch");
        require(databurnReceiver.PYUSD() == PYUSD, "PYUSD address mismatch");
        require(databurnReceiver.owner() == deployer, "Owner mismatch");
        
        console.log("\nVerifying addresses:");
        console.log("USDC:", databurnReceiver.USDC());
        console.log("PYUSD:", databurnReceiver.PYUSD());
        console.log("Owner:", databurnReceiver.owner());
        console.log("Burn Address:", databurnReceiver.BURN_ADDRESS());
        
        // Initialize with BaseSwap router (can be changed later)
        console.log("\nInitializing contract...");
        console.log("DEX Router:", BASESWAP_ROUTER);
        console.log("Placeholder DATABURN:", PLACEHOLDER_DATABURN);
        
        databurnReceiver.initialize(PLACEHOLDER_DATABURN, BASESWAP_ROUTER);
        
        console.log("Contract initialized successfully!");
        
        // Stop broadcast
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("DataBurnReceiver:", address(databurnReceiver));
        console.log("Owner:", deployer);
        console.log("DEX Router:", BASESWAP_ROUTER);
        console.log("========================================");
        console.log("\nNEXT STEPS:");
        console.log("1. Deploy $DATABURN token on flaunch.gg");
        console.log("2. Call initialize() again with real DATABURN address");
        console.log("3. Update .env with contract address");
        console.log("4. Verify on Basescan if not auto-verified");
        console.log("========================================");
        
        // Save deployment info to file
        string memory deploymentInfo = string(abi.encodePacked(
            "DATABURN_RECEIVER_ADDRESS=", vm.toString(address(databurnReceiver)), "\n",
            "DEPLOYER=", vm.toString(deployer), "\n",
            "DEX_ROUTER=", vm.toString(BASESWAP_ROUTER), "\n",
            "TIMESTAMP=", vm.toString(block.timestamp), "\n"
        ));
        
        vm.writeFile("./deployments/base-mainnet.txt", deploymentInfo);
        console.log("\nDeployment info saved to ./deployments/base-mainnet.txt");
    }
}