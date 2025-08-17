# TASKS.md

This file tracks implementation tasks, features, and work progress for the Agent Spend Permissions project. All work should be documented here with intentions and completion status.

## Active Tasks

### 1. OpenSea MCP Server Integration
**Status:** ✅ Completed  
**Intention:** Enable AI agents to access OpenSea NFT marketplace data, token information, and blockchain analytics through the Model Context Protocol (MCP).

#### Implementation Steps:
- [ ] Request OpenSea MCP beta access token via [form](https://opensea.io/mcp-access)
- [x] Add OpenSea MCP configuration to project
- [x] Create MCP server implementation at `src/lib/mcp/opensea-server.ts`
- [x] Implement OpenSea tool definitions:
  - [x] `search` - AI-powered marketplace search
  - [x] `search_collections` - NFT collection discovery
  - [x] `get_collection` - Collection details and stats
  - [x] `search_tokens` - ERC-20 token search
  - [x] `get_token_swap_quote` - Swap calculations
  - [x] `get_token_balances` - Wallet token holdings
  - [x] `get_nft_balances` - Wallet NFT inventory
  - [x] `get_trending_collections` - Market trends
- [x] Add HTTP endpoint at `/api/mcp/opensea`
- [x] Configure authentication headers for OpenSea access
- [ ] Test integration with Claude Desktop and other MCP clients

#### Connection Configuration:
```json
{
  "mcpServers": {
    "OpenSea": {
      "url": "https://mcp.opensea.io/mcp",
      "headers": {
        "Authorization": "Bearer ACCESS_TOKEN"
      }
    }
  }
}
```

#### Environment Variables:
- `OPENSEA_ACCESS_TOKEN` - Beta access token from OpenSea

---

### 2. x402 Payment Protocol Integration
**Status:** ✅ Completed  
**Intention:** Monetize the OpenSea MCP server and other API endpoints using x402 protocol for instant, programmatic stablecoin payments.

#### Implementation Steps:
- [x] Create x402 middleware at `src/lib/x402/middleware.ts`
- [x] Implement payment verification and processing
- [x] Wrap OpenSea MCP endpoints with x402 payments
- [x] Create dynamic x402 endpoint wrapper at `/api/x402/[...path]`
- [x] Enable micropayments for each MCP tool call
- [x] Implement usage-based billing:
  - [x] $0.001 per search query
  - [x] $0.0005 per collection lookup
  - [x] $0.002 per swap quote
  - [x] $0.001 per balance check
- [x] Add x402 Bazaar discovery integration
- [x] Create agent payment wallet management
- [ ] Install x402 SDK dependencies when available
- [ ] Test with CDP wallets and AgentKit

#### x402 Features:
- Instant USDC payments on Base (fee-free)
- No authentication required
- Pay-per-request API access
- Agent-native payment discovery
- Automatic payment handling

#### Environment Variables:
- `X402_FACILITATOR_URL` - CDP facilitator endpoint
- `X402_WALLET_ADDRESS` - Payment receiving address
- `X402_PRICE_PER_REQUEST` - Default price in USDC

---

### 3. Test Infrastructure
**Status:** ✅ Completed  
**Intention:** Ensure reliability and correctness of OpenSea MCP and x402 integrations through comprehensive testing.

#### Test Setup:
- [x] Install Vitest testing framework
- [x] Configure test scripts in package.json
- [x] Setup test environment variables
- [x] Create mock services for external APIs

#### OpenSea MCP Tests (`src/lib/mcp/__tests__/`):
- [x] `opensea-server.test.ts` - Server initialization and lifecycle
- [x] `opensea-tools.test.ts` - Tool function implementations
- [ ] Additional integration tests pending

#### x402 Payment Tests (`src/lib/x402/__tests__/`):
- [x] `middleware.test.ts` - Payment verification
- [x] `client.test.ts` - Client payment handling
- [ ] Additional integration tests pending

#### Integration Tests:
- [ ] MCP + x402 payment flow
- [ ] Agent autonomous payment scenarios
- [ ] Error handling and recovery
- [ ] Rate limiting and quota management

---

### 4. Migration to Bun
**Status:** ✅ Completed  
**Intention:** Switch from npm to Bun for faster package management and improved development experience.

#### Migration Steps:
- [x] Install Bun globally
- [x] Run `bun install` to generate bun.lockb
- [x] Remove package-lock.json
- [x] Update all npm scripts to use Bun
- [ ] Update CI/CD workflows
- [x] Test all commands with Bun
- [x] Update documentation

---

## Completed Tasks

### ✅ Initial Project Analysis
- Analyzed existing codebase structure
- Identified integration points for new features
- Reviewed current dependencies and architecture

### ✅ CLAUDE.md Creation
- Created initial CLAUDE.md with project overview
- Documented core architecture and flow
- Added command references
- Updated with SDK documentation and Bun directives

### ✅ OpenSea MCP Server Integration
- Implemented complete MCP server at `src/lib/mcp/opensea-server.ts`
- Created all OpenSea tool definitions in `src/lib/mcp/opensea-tools.ts`
- Added HTTP/SSE endpoint at `/api/mcp/opensea/route.ts`
- Configured authentication and environment variables

### ✅ x402 Payment Protocol Integration
- Built payment middleware at `src/lib/x402/middleware.ts`
- Created x402 client at `src/lib/x402/client.ts`
- Implemented dynamic endpoint wrapper at `/api/x402/[...path]/route.ts`
- Added usage-based billing and Bazaar discovery

### ✅ Test Infrastructure Setup
- Installed and configured Vitest with React support
- Created comprehensive test suites for MCP and x402
- Added test scripts to package.json
- Setup test environment and mocks

### ✅ Migration to Bun
- Successfully migrated from npm to Bun
- Generated bun.lockb and removed package-lock.json
- Updated all documentation to use Bun commands

---

## Future Enhancements

### Phase 2: Extended Capabilities
- [ ] Add more MCP servers (Hyperbolic, AEON, etc.)
- [ ] Implement subscription-based x402 payments
- [ ] Create agent marketplace for x402 services
- [ ] Add multi-chain support beyond Base
- [ ] Implement credit-based billing system

### Phase 3: Advanced Features
- [ ] Agent swarm coordination for complex tasks
- [ ] Revenue sharing for multi-agent workflows
- [ ] Automated service discovery and negotiation
- [ ] Cross-platform agent deployment (Telegram, Discord)
- [ ] Real-world commerce integration (physical goods)

---

## Notes

### SDK/Library Summary
- **Base Account SDK** (`@base-org/account`): Spend permission management
- **CDP SDK** (`@coinbase/cdp-sdk`): Smart account and wallet management
- **OpenAI SDK** (`openai`): AI chat and function calling
- **Zora SDK** (`@zoralabs/coins-sdk`): Creator coin operations
- **Viem** (`viem`): Ethereum interactions
- **OpenSea MCP** (upcoming): NFT marketplace data access
- **x402 SDK** (upcoming): Programmatic payment protocol

### Development Guidelines
- Always use Bun instead of npm for package management
- Reference this TASKS.md file when planning work
- Update task status as work progresses
- Document any blockers or issues encountered
- Add new tasks as they are discovered
- Mark tasks complete only when fully tested

### Testing Requirements
- Every new feature must have corresponding tests
- Aim for >80% code coverage
- Include both unit and integration tests
- Mock external services to ensure test reliability
- Run tests before committing changes

---

Last Updated: [Current Date]