# TASKS.md

This file tracks implementation tasks, features, and work progress for the Agent Spend Permissions project. Tasks are organized by application within the monorepo structure.

---

## 🏗️ Monorepo Infrastructure

### Setup Turborepo
**Status:** 🔴 Not Started  
**Intention:** Configure monorepo structure with Turborepo for efficient builds and caching.

#### Implementation Steps:
- [ ] Install Turborepo as dev dependency
- [ ] Create turbo.json configuration
- [ ] Set up workspace structure in root package.json
- [ ] Configure build pipelines for each app
- [ ] Set up shared tsconfig.json files
- [ ] Test parallel builds and caching

### Create Shared Packages
**Status:** 🔴 Not Started  
**Intention:** Extract common code into reusable packages.

#### Implementation Steps:
- [ ] Create packages/shared-types for TypeScript definitions
- [ ] Move x402 client code to packages/x402-client
- [ ] Move MCP tools to packages/mcp-tools
- [ ] Create packages/config for shared constants
- [ ] Set up package.json for each shared package
- [ ] Configure inter-package dependencies

---

## 📱 apps/web - Zora + Spend Permissions

### ✅ Completed Features

#### OpenSea MCP Server Integration
**Status:** ✅ Completed  
- Implemented MCP server at `src/lib/mcp/opensea-server.ts`
- Created all OpenSea tool definitions
- Added HTTP/SSE endpoint
- Configured authentication

#### x402 Payment Protocol Integration
**Status:** ✅ Completed  
- Built payment middleware
- Created dynamic endpoint wrapper
- Implemented usage-based billing
- Added Bazaar discovery

#### Migration to Bun
**Status:** ✅ Completed  
- Successfully migrated from npm to Bun
- Updated all documentation

### 🟡 In Progress

#### Migrate to Monorepo Structure
**Status:** 🟡 In Progress  
**Intention:** Move current application to apps/web directory.

#### Implementation Steps:
- [ ] Create apps/web directory
- [ ] Move src/ to apps/web/src/
- [ ] Move public/ to apps/web/public/
- [ ] Update import paths
- [ ] Configure Next.js for monorepo
- [ ] Test existing functionality

---

## 🤖 apps/agent-base-eth - Main Agent Service

### XMTP Integration
**Status:** 🔴 Not Started  
**Priority:** High  
**Intention:** Enable agent communication via XMTP protocol for 24/7 availability.

#### Implementation Steps:
- [ ] Research XMTP AgentKit example implementation
- [ ] Install XMTP SDK dependencies
- [ ] Create XMTP client initialization
- [ ] Implement message handlers
- [ ] Set up conversation management
- [ ] Add response generation logic
- [ ] Test with XMTP network
- [ ] Implement error handling and reconnection

#### Dependencies:
- `@xmtp/xmtp-js` - XMTP client SDK
- `@coinbase/agentkit` - Agent utilities

### Discovery Service
**Status:** 🔴 Not Started  
**Priority:** High  
**Intention:** Serve x402 Facilitator discovery list with value-add data presentation.

#### Implementation Steps:
- [ ] Connect to x402 Facilitator API
- [ ] Fetch available resources list
- [ ] Create service registry database
- [ ] Implement data formatters (JSON, Markdown, HTML)
- [ ] Add visualization generators (charts, graphs)
- [ ] Create caching layer
- [ ] Build REST API endpoints
- [ ] Add WebSocket support for real-time updates
- [ ] Implement search and filtering

#### API Endpoints:
- `GET /api/discovery` - List all services
- `GET /api/discovery/search` - Search services
- `GET /api/discovery/{id}` - Get service details
- `POST /api/discovery/register` - Register new service

### OpenSea MCP Proxy
**Status:** 🔴 Not Started  
**Priority:** High  
**Intention:** Re-serve OpenSea data through MCP with x402 payment requirements.

#### Implementation Steps:
- [ ] Import existing MCP server code
- [ ] Add x402 payment verification
- [ ] Implement request proxying
- [ ] Add response caching
- [ ] Create usage tracking
- [ ] Set up pricing tiers
- [ ] Add rate limiting
- [ ] Implement billing aggregation

#### Pricing Structure:
- Search queries: $0.001
- Collection lookups: $0.0005
- Swap quotes: $0.002
- Balance checks: $0.001

### $DATABURN Token Implementation
**Status:** 🔴 Not Started  
**Priority:** High  
**Intention:** Deploy deflationary token with automatic burn mechanism.

#### Implementation Steps:
- [ ] Design token economics
- [ ] Deploy token via Clanker API
- [ ] Create burn mechanism smart contract
- [ ] Implement auto-swap functionality
- [ ] Add event tracking
- [ ] Create monitoring dashboard
- [ ] Test burn mechanics
- [ ] Deploy to Base mainnet

#### Smart Contract Components:
- Token contract (via Clanker)
- DataBurnReceiver.sol
- Auto-swap integration
- Event emission

### Payment Receiver Contract
**Status:** 🔴 Not Started  
**Priority:** High  
**Intention:** Smart contract to receive all x402 income and auto-burn tokens.

#### Implementation Steps:
- [ ] Write DataBurnReceiver.sol contract
- [ ] Implement receive() function for ETH
- [ ] Add ERC20 token reception
- [ ] Integrate DEX for auto-swapping
- [ ] Implement burn function calls
- [ ] Add access controls
- [ ] Write comprehensive tests
- [ ] Deploy with Foundry
- [ ] Verify on Basescan

### Core Agent Architecture
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Intention:** Build the main agent orchestration system.

#### Implementation Steps:
- [ ] Create agent personality system
- [ ] Implement memory/context management
- [ ] Build response generation
- [ ] Add tool calling capabilities
- [ ] Create routing logic
- [ ] Implement error handling
- [ ] Add logging and monitoring
- [ ] Create health check endpoints

### API Development
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Intention:** Build REST API for agent services.

#### Implementation Steps:
- [ ] Set up Express/Fastify server
- [ ] Create /api/xmtp endpoints
- [ ] Create /api/discovery endpoints
- [ ] Create /api/mcp proxy endpoints
- [ ] Add /api/x402 payment endpoints
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Create API documentation

---

## 📲 apps/base-miniapp - Base App Integration

### MiniKit Setup
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Intention:** Create Base App miniapp for in-app agent chat.

#### Implementation Steps:
- [ ] Install MiniKit SDK
- [ ] Create minikit.config.js
- [ ] Set up authentication flow
- [ ] Configure app manifest
- [ ] Register with Base App
- [ ] Test in Base App sandbox
- [ ] Submit for review
- [ ] Deploy to production

### Chat Interface
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Intention:** Build user-friendly chat UI for agent interaction.

#### Implementation Steps:
- [ ] Create ChatWidget component
- [ ] Implement message display
- [ ] Add input handling
- [ ] Create typing indicators
- [ ] Add message history
- [ ] Implement auto-scroll
- [ ] Add emoji support
- [ ] Create payment UI elements

### Agent Client Connection
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Intention:** Connect miniapp to agent.base.eth backend.

#### Implementation Steps:
- [ ] Create agent-client.ts
- [ ] Implement WebSocket connection
- [ ] Add message queueing
- [ ] Handle connection errors
- [ ] Implement retry logic
- [ ] Add authentication
- [ ] Create state management
- [ ] Test real-time messaging

### Payment Integration
**Status:** 🔴 Not Started  
**Priority:** Low  
**Intention:** Enable x402 payments and tipping within miniapp.

#### Implementation Steps:
- [ ] Create PaymentButton component
- [ ] Integrate x402 client
- [ ] Add tip functionality
- [ ] Implement payment confirmation
- [ ] Add transaction history
- [ ] Create payment analytics
- [ ] Test payment flows
- [ ] Add error handling

---

## 🔮 Future Enhancements

### Phase 2: Extended Features
- [ ] NFT sales with x402 payments
- [ ] Implement auction mechanism
- [ ] Create NFT minting interface
- [ ] Add metadata generation

### Phase 3: Subdomain Marketplace
- [ ] Build subdomain registration system
- [ ] Create *.agent.base.eth auction platform
- [ ] Implement ENS integration
- [ ] Add subdomain management UI

### Phase 4: Multi-Agent Network
- [ ] Design agent coordination protocol
- [ ] Implement agent discovery
- [ ] Create inter-agent communication
- [ ] Build reputation system

### Phase 5: Cross-Chain Expansion
- [ ] Research cross-chain bridges
- [ ] Implement multi-chain support
- [ ] Add chain selection UI
- [ ] Test cross-chain transactions

---

## 📝 Development Guidelines

### Testing Requirements
- Every feature must have tests
- Aim for >80% code coverage
- Include unit and integration tests
- Mock external services
- Run tests before committing

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Implement proper error handling
- Add comprehensive logging
- Document all APIs

### Deployment Process
- Each app deploys independently
- Use CI/CD pipelines
- Implement staging environments
- Add rollback capabilities
- Monitor with observability tools

---

## 🚀 Quick Start Commands

```bash
# Monorepo setup
bun install
bun run build

# Development
bun run dev:web        # Start web app
bun run dev:agent      # Start agent service
bun run dev:miniapp    # Start miniapp

# Testing
bun test              # Run all tests
bun test:web         # Test web app
bun test:agent       # Test agent service
bun test:miniapp     # Test miniapp

# Deployment
bun run deploy:web    # Deploy web app
bun run deploy:agent  # Deploy agent service
bun run deploy:miniapp # Deploy miniapp
```

---

## 📊 Progress Summary

### Overall Completion
- **apps/web**: 75% complete (migration pending)
- **apps/agent-base-eth**: 0% complete (not started)
- **apps/base-miniapp**: 0% complete (not started)
- **Infrastructure**: 0% complete (not started)

### Priority Order
1. Monorepo infrastructure setup
2. Migrate existing app to apps/web
3. Build agent.base.eth XMTP integration
4. Implement discovery service
5. Deploy $DATABURN token
6. Create Base miniapp
7. Launch full system

---

Last Updated: 2025-08-17