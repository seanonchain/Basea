# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

**Stableburn Agent** is an AI-powered NFT marketplace agent that integrates OpenSea's Model Context Protocol (MCP) to provide natural language interactions with NFT data. The agent operates as `agent.base.eth` and offers:

- **OpenSea MCP Integration**: Access to 17 tools for NFT collections, trending data, token information, and wallet analytics
- **AI-Powered Chat**: Natural language processing using GPT-4 with integrated MCP tools via the AI SDK
- **x402 Payment Protocol**: Micropayment support for API monetization
- **XMTP Messaging**: 24/7 availability through decentralized messaging
- **$DATABURN Tokenomics**: Automatic token burn mechanism for deflationary economics

The system uses Base Account spend permissions for gas-sponsored transactions and provides both HTTP and XMTP interfaces for user interaction.

## Important Directives

**ALWAYS use Bun instead of npm** - This project uses Bun for package management. Replace any npm commands with their Bun equivalents:
- Use `bun install` instead of `npm install`
- Use `bun run dev` instead of `npm run dev`
- Use `bun add <package>` instead of `npm install <package>`

**ALWAYS reference TASKS.md** - Before starting any work:
1. Check TASKS.md for existing tasks and their status
2. Update TASKS.md with your intended work before beginning
3. Mark tasks as in_progress when starting
4. Update task completion status when finished
5. Add any new discovered tasks to the list

## Commands

**Development**
- `bun run dev` - Start agent development server on localhost:3001 (agent-base-eth app)
- `bun run build` - Build production bundle
- `bun run lint` - Run ESLint checks
- `bun test` - Run tests (once configured)

**Dependencies**
- `bun install` - Install all dependencies
- `bun add <package>` - Add new dependency
- `bun remove <package>` - Remove dependency

## Architecture Overview

This is a monorepo containing AI-powered applications using Base Account spend permissions and OpenSea MCP integration. The system allows users to interact with NFT marketplaces through natural language and execute gas-sponsored transactions.

### Core Flow

1. **OpenSea MCP Integration**: AI SDK connects to OpenSea's MCP server via SSE transport
2. **Natural Language Processing**: GPT-4 processes user queries with access to NFT marketplace tools
3. **Multi-Channel Access**: Users interact via HTTP API or XMTP messaging
4. **Payment Processing**: Optional x402 micropayments for premium features
5. **Data Delivery**: NFT data, collection stats, and market trends delivered in multiple formats

### Key Technical Components

**Base Account Integration** (`src/lib/spend-permissions.ts`)
- Uses `@base-org/account` SDK for spend permission management
- USDC token address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Operates on Base mainnet (chain ID: 8453)

**CDP Smart Accounts** (`src/lib/cdp.ts`)
- Server creates a unique CDP smart account per user session
- Stored in memory (persists across hot reloads via global variable)
- All transactions gas-sponsored via CDP paymaster

**Transaction Processing**
- Executes spend permission calls to receive USDC
- Approves Permit2 contract (`0x000000000022d473030f116ddee9f6b43ac78ba3`)
- Performs token operations with retry logic (max 3 attempts)
- Transfers purchased assets to user's wallet

### Environment Configuration

Required environment variables:
- `CDP_API_KEY_ID` - Coinbase Developer Platform credentials
- `CDP_API_KEY_SECRET`
- `CDP_WALLET_SECRET`
- `OPENAI_API_KEY` - For AI chat functionality
- `PAYMASTER_URL` - CDP paymaster for gas sponsorship
- `OPENSEA_ACCESS_TOKEN` - OpenSea MCP beta access token

### API Routes

- `POST /api/auth/verify` - Wallet signature verification
- `GET/POST /api/wallet/create` - Create/retrieve server wallet and smart account
- `POST /api/spend-permission/request` - Request spend permission from user
- `POST /api/chat` - AI chat interface

### Important Notes

- Server wallets are stored in memory and will be lost on server restart
- All transactions are gas-sponsored (users don't need ETH)
- Spend permissions are limited to $1-$2 daily for safety
- Purchased NFTs are automatically transferred to user's wallet

## SDK/Libraries Overview

### Current Dependencies

**Core Framework**
- `next@14.0.0` - React framework with App Router
- `react@18.2.0` - UI library
- `typescript@5.0.0` - Type safety
- `tailwindcss@3.3.0` - Styling framework

**Blockchain & Web3**
- `@base-org/account@^2.0.0` - Base Account SDK for spend permissions
- `@base-org/account-ui@^1.0.0` - UI components for Base Account
- `@coinbase/cdp-sdk@latest` - Coinbase Developer Platform for smart accounts
- `viem@^2.21.0` - TypeScript-first Ethereum library

**AI Integration**
- `openai@^4.63.0` - OpenAI GPT-4 for natural language processing
- `ai@^5.0.15` - Vercel AI SDK for streaming responses and MCP integration
- `@ai-sdk/openai@^2.0.15` - OpenAI provider for AI SDK

### Integrated Features

**OpenSea MCP**
- Model Context Protocol server for NFT marketplace data
- Provides 17 tools for collection search, token balances, trending NFTs
- Uses AI SDK with experimental_createMCPClient for SSE transport
- Requires beta access token from OpenSea

**x402 Payment Protocol**
- `@coinbase/x402` - Core x402 protocol implementation
- `x402-hono` - Hono middleware for receiving x402 payments
- Enables micropayments for API monetization

**Testing Framework** (To be added)
- `vitest` - Fast unit testing framework
- `@testing-library/react` - React component testing
- `@vitest/ui` - Test UI dashboard

### Key Integration Points

1. **CDP Smart Accounts** - Server creates unique smart accounts per user for gas-sponsored transactions
2. **Base Account Spend Permissions** - Users grant daily USDC spending limits to server wallets
3. **OpenAI with MCP Tools** - GPT-4 uses OpenSea MCP tools for NFT data queries
4. **OpenSea MCP** - Provides real-time NFT marketplace data through 17 specialized tools
5. **AI SDK Integration** - Seamless MCP tool integration with streaming responses
6. **x402 Payments** - Enables micropayments for premium API features

## Multi-App Monorepo Architecture

The project is evolving into a multi-app monorepo structure to support the agent.base.eth ecosystem, consisting of two main applications:

### Application Structure

**apps/web/** - Original spend permissions application
- Current Next.js app with AI-powered NFT interactions
- Base Account spend permissions integration
- OpenSea MCP server with x402 payments

**apps/agent-base-eth/** - Main agent.base.eth service
- XMTP messaging integration for agent communication
- Discovery service for x402 resources and MCP endpoints
- OpenSea data proxy with payment requirements
- $DATABURN tokenomics with auto-burn mechanism
- Smart contract for receiving and converting payments

**apps/xmtp-agent/** - XMTP Agent Framework
- Built with `@xmtp/node-sdk` v4.0.3+ (never use deprecated `@xmtp/xmtp-js`)
- Multiple example agents in `examples/` directory
- Supports group conversations, DMs, and attachments
- Production-ready patterns for message streaming and error handling
- Railway deployment support with persistent database storage

### agent.base.eth Features

1. **XMTP Communication**
   - Available 24/7 via XMTP protocol
   - Integration with Coinbase AgentKit
   - Persistent conversation management
   - Multi-channel response capability

2. **Discovery Service**
   - Serves x402 Facilitator discovery list
   - Value-add data presentation (JSON, markdown, visualizations)
   - Dynamic service registry
   - Agent-to-agent resource sharing

3. **OpenSea MCP Proxy**
   - Re-serves OpenSea data through MCP protocol
   - Requires x402 micropayments
   - Cached responses for efficiency
   - Usage-based pricing tiers

4. **$DATABURN Tokenomics**
   - Token deployed via Flaunch UI (flaunch.gg) on Base
   - Smart contract auto-converts incoming payments
   - Automatic token burn mechanism
   - Deflationary token model

5. **Payment Features**
   - x402 payment requirements for all services
   - Tip acceptance in any token
   - Automatic conversion to $DATABURN
   - Future: NFT sales and subdomain auctions

### Shared Infrastructure

**packages/** - Shared code and utilities
- `shared-types/` - TypeScript definitions
- `x402-client/` - Reusable x402 client
- `mcp-tools/` - MCP server utilities
- `config/` - Shared configuration

### Environment Variables

```env
# Core Services
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=
CDP_WALLET_SECRET=
OPENAI_API_KEY=
OPENSEA_ACCESS_TOKEN=
PAYMASTER_URL=

# agent.base.eth Specific
XMTP_ENV=production
XMTP_PRIVATE_KEY=
X402_FACILITATOR_URL=
X402_RECEIVER_ADDRESS=
DATABURN_CONTRACT_ADDRESS=
# Flaunch deployment (manual via flaunch.gg UI)
AGENT_ENS_NAME=agent.base.eth

```

### Development Workflow

1. **Monorepo Management**: Uses Turborepo for efficient builds
2. **Package Manager**: Bun for all package operations
3. **Shared Dependencies**: Centralized in root package.json
4. **Independent Deployment**: Each app can be deployed separately
5. **Type Safety**: Shared TypeScript definitions across apps

### Smart Contract Architecture

**DataBurnReceiverV3.sol** - Advanced payment receiver with two-step swap
- Accepts x402 payments in USDC/PYUSD
- Two-step swap mechanism:
  1. USDC/PYUSD → ETH via Uniswap V3 (0.05% fee pool)
  2. ETH → $DATABURN via Flaunch pair
- Automatic token burning to dead address
- Full event logging and idempotent payment processing

**Key Contract Features:**
- Uses Uniswap V3 for efficient USDC→ETH swaps
- Integrates with Flaunch DEX for ETH→Token swaps
- ReentrancyGuard for security
- Pausable for emergency situations
- Owner-controlled slippage tolerance
- Support for returning unsupported tokens

## Contract Deployment

### Prerequisites

**1. Install Foundry Dependencies**
```bash
cd apps/agent-base-eth
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

**2. Environment Setup**
Create `.env` file in `apps/agent-base-eth/` with:
```env
# Deployment wallet private key (with ETH for gas)
DEPLOYER_PRIVATE_KEY=your-private-key-here

# Token addresses
TEST_TOKEN_ADDRESS=0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb  # Test token for development
DATABURN_CONTRACT_ADDRESS=                                      # Will be set after Flaunch deployment

# Contract addresses (set after deployment)
DATABURN_RECEIVER_ADDRESS=
```

**3. Compile Contracts**
```bash
cd apps/agent-base-eth
forge build
```

**Note:** Contracts use Solidity v0.8.30 (latest stable version)

### Deployment Process

**Option 1: TypeScript Deployment (Recommended)**
```bash
# Deploy and initialize in one step
bun run scripts/deploy-databurn-receiver.ts

# Or initialize an already deployed contract
bun run scripts/initialize-databurn-receiver.ts <contract-address>
```

**Option 2: Foundry Deployment**
```bash
cd apps/agent-base-eth
forge script script/DeployDataBurnReceiver.s.sol --rpc-url base --broadcast --verify
```

### Post-Deployment

**1. Update Environment Variables**
Add to root `.env`:
```env
X402_RECEIVER_ADDRESS=<deployed-contract-address>
DATABURN_CONTRACT_ADDRESS=<token-address>
```

**2. Verify on Basescan**
```bash
forge verify-contract <contract-address> DataBurnReceiver \
  --chain base \
  --etherscan-api-key <basescan-api-key>
```

### Contract Addresses (Base Mainnet)

**Current Deployments**
- DataBurnReceiver (V1): `0x76a6ed9dece032d227b713010022c5e43a307d8a` 
- DataBurnReceiverV3: *To be deployed*
- Test Token: `0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb`

**Token Addresses**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- PYUSD: `0xCFc37A6AB183dd4aED08C204D1c2773c0b1BDf46`
- WETH: `0x4200000000000000000000000000000000000006`

**DEX Infrastructure**
- Uniswap V3 SwapRouter02: `0x2626664c2603336E57B271c5C0b26F421741e481`
- Uniswap V3 Quoter V2: `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a`
- USDC/ETH Pool (0.05%): `0xd0b53D9277642d899DF5C87A3966A349A798F224`
- Flaunch Pair: *Set via FLAUNCH_PAIR_ADDRESS env var*

### Testing the Contract

**1. Send Test Payment**
```javascript
// Example: Send USDC to the contract
const tx = await usdcContract.transfer(
  DATABURN_RECEIVER_ADDRESS,
  parseUnits("1", 6) // 1 USDC
);
```

**2. Check Contract State**
```bash
# Read contract state
cast call <contract-address> "totalBurned()" --rpc-url base
cast call <contract-address> "totalValueReceived()" --rpc-url base
```

### Token Deployment via Flaunch

The $DATABURN token must be deployed manually through the Flaunch UI:

1. Visit [flaunch.gg](https://flaunch.gg)
2. Connect your wallet
3. Deploy your token with desired parameters
4. Update `DATABURN_CONTRACT_ADDRESS` in `.env`
5. Re-initialize the DataBurnReceiver contract with the new token address

### Troubleshooting

**Common Issues:**

1. **"Unknown evm version: prague"**
   - Fix: Update `foundry.toml` and OpenZeppelin's `foundry.toml` to use `evm_version = "paris"`

2. **Import path errors**
   - Fix: Create `remappings.txt`:
   ```
   @openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
   forge-std/=lib/forge-std/src/
   ```

3. **"Address has invalid checksum"**
   - Fix: Use checksummed addresses (correct capitalization)
   - Tool: `cast to-checksum-address <address>`

4. **Contract already initialized**
   - The contract can only be initialized once
   - To change token/router, deploy a new contract

### Deployment Scripts

**`scripts/deploy-databurn-receiver-v3.ts`** (Latest)
- Deploys DataBurnReceiverV3 contract with Uniswap V3 integration
- Initializes with Uniswap V3 router, quoter, and Flaunch pair
- Implements two-step swap: USDC→ETH→Token
- Saves deployment info to `deployments/`

**`scripts/deploy-databurn-receiver.ts`** (V1)
- Deploys original DataBurnReceiver contract
- Uses single DEX router approach
- Legacy deployment for BaseSwap integration

**`scripts/initialize-databurn-receiver.ts`**
- Initializes already deployed contracts
- Useful for fixing failed deployments
- Updates deployment tracking files

### API Structure

Each app maintains its own API routes:
- `apps/web/api/` - Original spend permission endpoints
- `apps/agent-base-eth/api/` - Agent services and discovery

### Future Expansions

1. **Phase 1**: Core agent.base.eth implementation
2. **Phase 2**: NFT sales with x402 payments
3. **Phase 3**: Subdomain marketplace (*.agent.base.eth)
4. **Phase 4**: Multi-agent coordination network
5. **Phase 5**: Cross-chain agent services

## OpenSea MCP Integration

### Overview

OpenSea MCP (Model Context Protocol) provides AI tools with secure access to OpenSea's NFT marketplace data, token information, and blockchain analytics. The agent uses the hosted MCP server at `https://mcp.opensea.io/mcp`.

### Configuration

**Required Environment Variable:**
```env
OPENSEA_ACCESS_TOKEN=your-access-token-here
```

**Note:** OpenSea MCP is in beta. Request access at [OpenSea MCP Beta Access Form](https://opensea.io/mcp-beta-access).

### Connection Methods

**1. Streamable HTTP (Recommended):**
```json
{
  "url": "https://mcp.opensea.io/mcp",
  "headers": {
    "Authorization": "Bearer ACCESS_TOKEN"
  }
}
```

**2. Inline Token (if headers not supported):**
```
https://mcp.opensea.io/ACCESS_TOKEN/mcp
```

### Available Tools

**Collection Tools:**
- `search_collections` - Search NFT collections by name/metadata
- `get_collection` - Get detailed collection info (stats, floor price, volume)
- `get_trending_collections` - Get trending collections by timeframe
- `get_top_collections` - Get top collections by various metrics

**Token Tools:**
- `search_tokens` - Search cryptocurrencies and ERC-20 tokens
- `get_token` - Get detailed token information
- `get_token_swap_quote` - Get swap quotes and gas estimates
- `get_trending_tokens` - Get tokens with highest price changes

**Wallet Tools:**
- `get_token_balances` - Get all token balances for a wallet
- `get_nft_balances` - Get all NFTs owned by a wallet
- `get_profile` - Get comprehensive wallet profile

**Market Tools:**
- `search` - AI-powered search across all OpenSea data
- `fetch` - Retrieve entity by unique identifier

### Usage Examples

**Check Collection Floor Price:**
```javascript
await mcpProxy.handleRequest('opensea_get_collection', {
  slug: 'boredapeyachtclub'
})
```

**Search for Tokens:**
```javascript
await mcpProxy.handleRequest('opensea_search_tokens', {
  query: 'USDC',
  chain: 'base'
})
```

**Get Wallet NFTs:**
```javascript
await mcpProxy.handleRequest('opensea_get_nft_balances', {
  wallet: '0x123...',
  chain: 'ethereum'
})
```

### Chain Support

OpenSea MCP supports all chains available on OpenSea:
- Ethereum
- Polygon  
- Base
- Solana
- Arbitrum
- Optimism
- Avalanche
- BNB Chain
- Klaytn

### Best Practices

1. **Use Collection Slugs** - Use the OpenSea slug (e.g., 'boredapeyachtclub' not 'Bored Ape Yacht Club')
2. **Specify Chains** - Include chain parameter when targeting specific blockchains
3. **Combine Tools** - Use multiple tools together for comprehensive insights
4. **Check Balances First** - Verify wallet balances before requesting swap quotes
5. **Use Includes Parameters** - Many tools support optional data (activity, analytics, offers)

### Error Handling

Common errors and solutions:
- **404 Not Found** - Check collection slug is correct
- **Invalid Chain** - Verify chain name is supported
- **Rate Limited** - Reduce request frequency
- **Authentication Failed** - Verify access token is valid

### Implementation in agent.base.eth

The MCP proxy in `src/services/mcp-proxy/router.ts` handles OpenSea MCP requests by:
1. Accepting tool requests at `/api/mcp/:tool`
2. Forwarding to OpenSea MCP server with authentication
3. Processing responses for the agent
4. Caching results where appropriate

### Testing OpenSea MCP

**Test Collection Data:**
```bash
curl -X POST http://localhost:3001/api/mcp/opensea_get_collection \
  -H "Content-Type: application/json" \
  -d '{"slug": "boredapeyachtclub"}'
```

**Test Token Search:**
```bash
curl -X POST http://localhost:3001/api/mcp/opensea_search_tokens \
  -H "Content-Type: application/json" \
  -d '{"query": "USDC", "chain": "base"}'
```

## XMTP Agent Development

### Key Patterns and Best Practices

**Client Initialization**
```typescript
import { Client, type XmtpEnv } from "@xmtp/node-sdk"
// Use helpers with @helpers/client path alias
import { createSigner, getEncryptionKeyFromHex } from "@helpers/client"
```

**Message Streaming Pattern**
```typescript
await client.conversations.sync();
const stream = await client.conversations.streamAllMessages();
for await (const message of stream) {
  // CRITICAL: Skip own messages to prevent loops
  if (message.senderInboxId.toLowerCase() === client.inboxId.toLowerCase()) continue;
  // Check content type with string literals
  if (message.contentType?.typeId !== "text") continue;
  // Process message
}
```

**Environment Variables for XMTP**
- `WALLET_KEY` - Private key for agent wallet
- `ENCRYPTION_KEY` - Database encryption key
- `XMTP_ENV` - Network environment (local/dev/production)

**Group Management**
- Use `groupName`, `groupDescription`, `groupImageUrlSquare` options
- All conversations have `members()` method (both DMs and Groups)
- Member roles: Member, Admin, Super Admin
- Max 10 installations per inbox

**Available Example Agents** (in `apps/xmtp-agent/examples/`)
- `xmtp-gm` - Simple "gm" reply bot
- `xmtp-gpt` - GPT-powered conversational agent
- `xmtp-coinbase-agentkit` - CDP integration for gasless USDC
- `xmtp-attachments` - Image handling example
- `xmtp-transactions` - Onchain transaction support
- `xmtp-group-welcome` - Group management bot
- `xmtp-nft-gated-group` - NFT-based group access

**XMTP-Specific Commands**
```bash
# Generate XMTP wallet and encryption keys
bun run gen:keys

# Revoke XMTP installations
bun run revoke <inbox-id> <installations-to-exclude>

# Run specific example
bun run dev  # Runs xmtp-gm with hot reload
bun run start  # Production mode
```

**Testing**
- Test agents at [xmtp.chat](https://xmtp.chat)
- Use `logAgentDetails()` helper to display inbox ID and stats
- Railway deployment: Use `RAILWAY_VOLUME_MOUNT_PATH` for persistent storage