# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `bun run dev` - Start Next.js development server on localhost:3000
- `bun run build` - Build production bundle
- `bun run lint` - Run ESLint checks
- `bun test` - Run tests (once configured)

**Dependencies**
- `bun install` - Install all dependencies
- `bun add <package>` - Add new dependency
- `bun remove <package>` - Remove dependency

## Architecture Overview

This is a Next.js 14 application that enables AI-powered Zora creator coin purchases using Base Account spend permissions. The system allows users to grant limited spending authority to a server-managed smart account, which then executes gas-sponsored transactions on their behalf.

### Core Flow

1. **Authentication**: User signs in with Base Account via wallet signature verification
2. **Spend Permissions**: User grants daily spending limit ($1-$2) to server's CDP smart account
3. **AI Chat**: GPT-4 processes natural language requests and identifies purchase intent
4. **Transaction Execution**: 
   - Frontend prepares spend permission calls using Base Account SDK
   - Backend executes via CDP Smart Account with gas sponsorship
   - USDC is swapped for creator coins and transferred to user's wallet

### Key Technical Components

**Base Account Integration** (`src/lib/spend-permissions.ts`)
- Uses `@base-org/account` SDK for spend permission management
- USDC token address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Operates on Base mainnet (chain ID: 8453)

**CDP Smart Accounts** (`src/lib/cdp.ts`)
- Server creates a unique CDP smart account per user session
- Stored in memory (persists across hot reloads via global variable)
- All transactions gas-sponsored via CDP paymaster

**Transaction Processing** (`src/app/api/zora/buy/route.ts`)
- Executes spend permission calls to receive USDC
- Approves Permit2 contract (`0x000000000022d473030f116ddee9f6b43ac78ba3`)
- Performs token swap with retry logic (max 3 attempts)
- Transfers purchased creator coins to user's wallet

### Environment Configuration

Required environment variables:
- `CDP_API_KEY_ID` - Coinbase Developer Platform credentials
- `CDP_API_KEY_SECRET`
- `CDP_WALLET_SECRET`
- `OPENAI_API_KEY` - For AI chat functionality
- `PAYMASTER_URL` - CDP paymaster for gas sponsorship
- `ZORA_API_KEY` - Optional, prevents rate limiting

### API Routes

- `POST /api/auth/verify` - Wallet signature verification
- `GET/POST /api/wallet/create` - Create/retrieve server wallet and smart account
- `POST /api/spend-permission/request` - Request spend permission from user
- `POST /api/zora/buy` - Execute creator coin purchase
- `POST /api/chat` - AI chat interface

### Important Notes

- Server wallets are stored in memory and will be lost on server restart
- All transactions are gas-sponsored (users don't need ETH)
- Spend permissions are limited to $1-$2 daily for safety
- Creator coins are automatically transferred to user's wallet after purchase

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
- `@zoralabs/coins-sdk@latest` - Zora creator coins integration
- `viem@^2.21.0` - TypeScript-first Ethereum library

**AI Integration**
- `openai@^4.63.0` - OpenAI GPT-4 for natural language processing

### Upcoming Integrations

**OpenSea MCP** (To be added)
- Model Context Protocol server for NFT marketplace data
- Provides tools for collection search, token balances, swap quotes
- Requires beta access token from OpenSea

**x402 Payment Protocol** (To be added)
- `@coinbase/x402-axios` - Client for making x402 payments
- `@coinbase/x402-express` - Server middleware for receiving payments
- Enables micropayments for API monetization

**Testing Framework** (To be added)
- `vitest` - Fast unit testing framework
- `@testing-library/react` - React component testing
- `@vitest/ui` - Test UI dashboard

### Key Integration Points

1. **CDP Smart Accounts** - Server creates unique smart accounts per user for gas-sponsored transactions
2. **Base Account Spend Permissions** - Users grant daily USDC spending limits to server wallets
3. **OpenAI Function Calling** - GPT-4 identifies purchase intent and executes transactions
4. **Zora Protocol** - Handles creator coin swaps and transfers
5. **MCP Servers** - Will provide extensible tool access for AI agents
6. **x402 Payments** - Will enable agent-to-agent commerce and API monetization

## Multi-App Monorepo Architecture

The project is evolving into a multi-app monorepo structure to support the agent.base.eth ecosystem, consisting of two main applications:

### Application Structure

**apps/web/** - Original Zora + spend permissions application
- Current Next.js app with AI-powered creator coin purchases
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
ZORA_API_KEY=

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

**DataBurnReceiver.sol** - Main payment receiver
- Accepts x402 payments and tips
- Automatic token swapping via DEX
- Burns $DATABURN tokens on receipt
- Event emission for tracking

### API Structure

Each app maintains its own API routes:
- `apps/web/api/` - Original Zora and spend permission endpoints
- `apps/agent-base-eth/api/` - Agent services and discovery

### Future Expansions

1. **Phase 1**: Core agent.base.eth implementation
2. **Phase 2**: NFT sales with x402 payments
3. **Phase 3**: Subdomain marketplace (*.agent.base.eth)
4. **Phase 4**: Multi-agent coordination network
5. **Phase 5**: Cross-chain agent services

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