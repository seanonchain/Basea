# DataBurnReceiver Smart Contract

Production-ready smart contract that receives x402 payments and automatically swaps USDC/PYUSD to $DATABURN tokens for burning.

## Features

### Security
- ✅ ReentrancyGuard protection
- ✅ Pausable for emergencies
- ✅ Owner-only admin functions
- ✅ SafeERC20 for token transfers
- ✅ Custom errors for gas efficiency
- ✅ Comprehensive event logging
- ✅ Payment idempotency checks

### Functionality
- **Accept USDC/PYUSD only** - Rejects other tokens
- **Auto-swap to $DATABURN** - Using DEX router
- **Auto-burn mechanism** - Sends to dead address
- **Return unsupported tokens** - Users can reclaim
- **ETH withdrawal** - Owner only
- **Emergency recovery** - When paused

## Deployment Guide

### Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install dependencies:
```bash
make install
# or
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit
```

3. Setup environment:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### Testing

Run comprehensive test suite:
```bash
# Run all tests
make test

# Run with gas reporting
make test-gas

# Generate coverage report
make coverage
```

### Deployment

#### 1. Deploy to Base Sepolia (Testnet)

```bash
make deploy-base-sepolia
```

#### 2. Deploy to Base Mainnet

```bash
make deploy-base

# Or manually:
forge script script/DeployDataBurnReceiver.s.sol \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

#### 3. Verify on Basescan

If auto-verification fails:
```bash
make verify
# Enter contract address when prompted
```

Or manually:
```bash
forge verify-contract \
  --chain base \
  --etherscan-api-key $BASESCAN_API_KEY \
  --compiler-version v0.8.20+commit.a1b79de6 \
  CONTRACT_ADDRESS \
  DataBurnReceiver
```

### Post-Deployment

1. **Deploy $DATABURN token** on flaunch.gg

2. **Update contract with DATABURN address**:
```solidity
// Call from owner account
databurnReceiver.initialize(DATABURN_TOKEN_ADDRESS, DEX_ROUTER_ADDRESS);
```

3. **Update .env**:
```bash
DATABURN_RECEIVER_ADDRESS=0x... # Your deployed contract
DATABURN_TOKEN_ADDRESS=0x... # Your token from flaunch.gg
```

4. **Test with small payment**:
```javascript
// Send 1 USDC to test
const tx = await usdc.transfer(DATABURN_RECEIVER_ADDRESS, 1000000);
```

## Contract Addresses

### Base Mainnet

| Contract | Address |
|----------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| PYUSD | `0xCfC37A6AB183dd4aED08C204D1c2773c0b1BDf46` |
| BaseSwap Router | `0x327Df1E6de05895d2ab08513aaDD9313Fe505d86` |
| Aerodrome Router | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` |
| SushiSwap Router | `0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891` |
| DataBurnReceiver | *[To be deployed]* |
| $DATABURN Token | *[To be deployed via flaunch.gg]* |

## Gas Costs (Estimated)

| Operation | Gas Used | Cost (at 0.1 gwei) |
|-----------|----------|-------------------|
| Deployment | ~2,500,000 | ~0.00025 ETH |
| Receive USDC/PYUSD | ~150,000 | ~0.000015 ETH |
| Swap & Burn | ~200,000 | ~0.00002 ETH |
| Return Tokens | ~50,000 | ~0.000005 ETH |

## Security Considerations

1. **Owner Key Security**: Store private key securely, use hardware wallet for mainnet
2. **Initialization**: Can only be done once, ensure correct addresses
3. **Slippage**: Default 3%, adjustable up to 10%
4. **Minimum Swap**: 1 USDC/PYUSD to prevent dust attacks
5. **Emergency Pause**: Owner can pause all operations
6. **Reentrancy**: Protected via OpenZeppelin's ReentrancyGuard

## Integration

### Receiving x402 Payments

```javascript
// From x402 payment handler
async function handleX402Payment(amount, paymentId) {
  // Payment goes to DataBurnReceiver
  const tx = await databurnReceiver.receivePayment(
    amount,
    paymentId
  );
  
  // Contract auto-swaps to $DATABURN and burns
}
```

### Checking Statistics

```javascript
const stats = await databurnReceiver.getStatistics();
console.log('Total Burned:', stats.totalBurnedAmount);
console.log('Total Value:', stats.totalValueReceivedAmount);
```

## Troubleshooting

### Common Issues

1. **"AlreadyInitialized"**: Contract can only be initialized once
2. **"InvalidToken"**: Only USDC/PYUSD accepted for auto-swap
3. **"SwapFailed"**: Check DEX liquidity for USDC→DATABURN path
4. **"Must be paused"**: Emergency functions require paused state

### Support

- Documentation: https://docs.base.org
- Base Discord: https://discord.gg/base
- GitHub Issues: https://github.com/base/agent-base-eth/issues

## License

MIT