# agent.base.eth Architecture

## Overview
agent.base.eth is a multi-channel AI agent that provides blockchain data and services through various communication protocols, with all services monetized via x402 micropayments.

## Core Components

### 1. Agent Core
- **Agent Orchestrator**: Main control logic
- **Personality Engine**: Response generation with consistent personality
- **Memory Management**: Conversation state and history tracking

### 2. Communication Channels

#### XMTP Channel
- 24/7 availability via XMTP protocol
- Integration with Coinbase AgentKit
- Persistent conversation management
- Async message handling

#### HTTP API
- RESTful endpoints for web integration
- WebSocket support for real-time communication
- CORS-enabled for browser access

### 3. Services

#### Discovery Service
- Lists all available x402-enabled resources
- Fetches from x402 Facilitator
- Value-add data formatting (JSON, Markdown, Charts)
- Dynamic service registration

#### MCP Proxy
- Re-serves OpenSea data through MCP
- Payment verification before data access
- Response caching for efficiency
- Usage tracking and analytics

#### Payment Handler
- x402 payment processing
- Tip acceptance in any token
- Automatic forwarding to burn contract
- Transaction verification

#### Tokenomics Manager
- $DATABURN token deployment via Clanker
- Automatic token burning
- Swap integration for incoming tokens
- Burn metrics tracking

## Data Flow

1. **Message Receipt**: Via XMTP or HTTP
2. **Context Loading**: Retrieve conversation history
3. **Intent Recognition**: Parse user request
4. **Payment Verification**: Check x402 payment if required
5. **Service Execution**: Route to appropriate service
6. **Response Generation**: Create personalized response
7. **Token Burning**: Convert tips to $DATABURN and burn

## Smart Contract Integration

### DataBurnReceiver Contract
- Accepts all incoming payments
- Auto-swaps to $DATABURN
- Burns tokens automatically
- Emits events for tracking

## Environment Configuration

Required environment variables:
- `XMTP_PRIVATE_KEY`: Agent's XMTP identity
- `X402_RECEIVER_ADDRESS`: Payment receiving address
- `DATABURN_CONTRACT_ADDRESS`: Token contract address
- `AGENT_ENS_NAME`: agent.base.eth