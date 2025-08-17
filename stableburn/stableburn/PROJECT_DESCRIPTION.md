# StableBurn Project Description

## 1. Short description (max 100 characters)

**AI agent ecosystem with micropayments, auto-burning tokenomics, and multi-channel communication.**

## 2. Description

**StableBurn** is a comprehensive Web3 agent platform that creates an autonomous AI ecosystem on Base blockchain. The project consists of multiple interconnected components:

At its core, it's an AI-powered agent (agent.base.eth) that operates 24/7 across multiple communication channels including XMTP messaging, HTTP APIs, and web interfaces. The agent provides blockchain data services, NFT marketplace integration via OpenSea's Model Context Protocol (MCP), and automated token trading capabilities.

The platform features a unique economic model with the $DATABURN token (deployed via Flaunch) that implements deflationary tokenomics. Every payment received by the agent - whether tips, service fees, or x402 micropayments - is automatically converted to $DATABURN tokens and burned, creating constant buy pressure and reducing supply.

Key features include:
- **Multi-channel AI Agent**: Accessible via XMTP chat, REST APIs, and web interface
- **x402 Payment Protocol**: Micropayment system for API monetization with pay-per-request pricing
- **Auto-burn Tokenomics**: DataBurnReceiver smart contract automatically swaps incoming USDC/PYUSD to $DATABURN and burns it
- **OpenSea MCP Integration**: Provides NFT marketplace data, collection analytics, and token information
- **Spend Permissions**: Integration with Base Account for gasless, permission-based spending
- **Discovery Service**: Dynamic registry of available x402-enabled services and MCP endpoints

The platform enables developers to deploy their own AI agents that can accept payments, provide services, and participate in the token economy, creating a sustainable ecosystem for AI-to-AI and human-to-AI commerce.

## 3. How it's made

**Technology Stack:**
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript, TailwindCSS
- **Backend**: Hono framework (migrated from Express) for high-performance HTTP routing
- **Blockchain**: Base L2, Solidity 0.8.30 (latest stable) for smart contracts, Foundry for contract development
- **AI/ML**: OpenAI GPT-4 with function calling, Model Context Protocol (MCP) for tool access
- **Messaging**: XMTP SDK v4.0.3+ for decentralized messaging
- **Payments**: x402 protocol for micropayments, Coinbase Developer Platform (CDP) for smart accounts
- **Package Management**: Bun (replacing npm) for faster dependency management
- **Monorepo**: Turborepo for efficient multi-app builds with shared packages

**Architecture Details:**

The project is structured as a monorepo with three main applications:
1. **apps/web** - Next.js app for Zora coin purchases with spend permissions
2. **apps/agent-base-eth** - Core agent service with XMTP, discovery, and MCP proxy
3. **apps/xmtp-agent** - XMTP messaging framework with multiple agent examples

**Smart Contract Integration:**
The DataBurnReceiver contract (deployed at `0x76a6ed9dece032d227b713010022c5e43a307d8a`) uses OpenZeppelin's security patterns (ReentrancyGuard, Pausable, Ownable) and integrates with BaseSwap DEX router for automatic token swapping. It accepts USDC/PYUSD payments and automatically swaps them to the target token for burning.

**Partner Technologies:**
- **Coinbase CDP**: Provides gasless transactions through smart accounts and paymasters, eliminating the need for users to hold ETH for gas
- **Base Account SDK**: Enables spend permissions where users grant limited USDC spending authority to the agent
- **OpenSea MCP**: Beta access to NFT marketplace data through Model Context Protocol
- **Zora Protocol**: Integration for creator coin swaps and transfers
- **BaseSwap**: Uniswap V2 fork on Base for DEX functionality

**Notable Technical Implementations:**

1. **Hot-reload Persistent Storage**: Server wallets stored in memory with global variable persistence across hot reloads during development

2. **Multi-stage Token Swapping**: Implements retry logic (max 3 attempts) for token swaps with slippage protection

3. **Automatic Environment Detection**: Scripts automatically detect and load environment variables from multiple locations (root and app-specific)

4. **MCP Proxy Pattern**: Re-serves OpenSea data through a proxy that adds x402 payment requirements, creating a monetization layer

5. **Idempotent Payment Processing**: Contract tracks processed payments via unique IDs to prevent double-spending

6. **Dynamic Contract Initialization**: Contracts can be deployed first and initialized later with different parameters, useful for testing

7. **Cross-app Type Safety**: Shared TypeScript definitions in `packages/shared-types` ensure type consistency across all applications

The architecture is designed for extensibility, allowing developers to add new agent capabilities, integrate additional MCP servers, and create custom payment flows while maintaining the core burn mechanism.