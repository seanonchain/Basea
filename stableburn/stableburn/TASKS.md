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

## 📱 apps/web - Spend Permissions Application

### ✅ Completed Features

#### Migration to Bun
**Status:** ✅ Completed  
- Successfully migrated from npm to Bun
- Updated all documentation

### 🔴 Not Started

#### OpenSea MCP Server Integration
**Status:** 🔴 Not Started  
- Will implement MCP server at `src/lib/mcp/opensea-server.ts`
- Create all OpenSea tool definitions
- Add HTTP/SSE endpoint
- Configure authentication

#### x402 Payment Protocol Integration
**Status:** 🔴 Not Started  
- Build payment middleware
- Create dynamic endpoint wrapper
- Implement usage-based billing
- Add Bazaar discovery

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

### ✅ Completed Features

#### OpenSea MCP Integration with AI SDK
**Status:** ✅ Completed  
- Integrated OpenSea MCP using AI SDK's experimental_createMCPClient
- Successfully connected to OpenSea's SSE endpoint
- Configured 17 tools for NFT marketplace operations
- Created AIMessageHandlers for XMTP integration

#### x402 Payment Protocol
**Status:** ✅ Completed  
- Integrated x402-hono middleware for payment processing
- Configured payment requirements for premium endpoints
- Set up receiver address for micropayments

#### Hono HTTP Server
**Status:** ✅ Completed  
- Migrated from Express to Hono framework
- Created landing page with API documentation
- Implemented health checks and status endpoints

#### Remove All Zora References
**Status:** ✅ Completed  
- Removed all Zora service code from MCP proxy
- Updated documentation to remove Zora mentions
- Cleaned up routes and API endpoints
- Focus now entirely on OpenSea MCP

### XMTP Integration
**Status:** 🟡 Partially Complete  
**Priority:** High  
**Intention:** Enable agent communication via XMTP protocol for 24/7 availability.

#### Completed Steps:
- [x] Installed XMTP SDK dependencies (@xmtp/node-sdk v4.0.3+)
- [x] Created XMTP client initialization code
- [x] Implemented AIMessageHandlers with OpenSea MCP tools
- [x] Set up conversation management structure
- [x] Added response generation with GPT-4

#### Remaining Steps:
- [ ] Fix XMTP signer initialization error
- [ ] Test with XMTP network at xmtp.chat
- [ ] Implement group conversation support
- [ ] Add attachment handling

#### Dependencies:
- `@xmtp/node-sdk` - XMTP client SDK (v4.0.3+)
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
**Status:** ✅ Completed  
**Priority:** High  
**Intention:** Re-serve OpenSea data through MCP with x402 payment requirements.

#### Completed Steps:
- [x] Integrated OpenSea MCP with AI SDK
- [x] Added x402 payment verification
- [x] Implemented request proxying
- [x] Set up SSE transport for MCP
- [x] Created 17 tool integrations
- [x] Added authentication with beta token

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
- [ ] Deploy token via Flaunch UI (flaunch.gg)
- [ ] Create burn mechanism smart contract
- [ ] Implement auto-swap functionality
- [ ] Add event tracking
- [ ] Create monitoring dashboard
- [ ] Test burn mechanics
- [ ] Deploy to Base mainnet

#### Smart Contract Components:
- Token contract (via Flaunch UI at flaunch.gg)
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

## 🎯 Next Priority Tasks

### Immediate Priorities (This Week)

#### 1. Fix XMTP Signer Issue
**Status:** 🔴 Not Started  
**Blocker:** Yes - prevents XMTP functionality  
**Error:** `signer.getIdentifier is not a function`

**Solution Steps:**
- [ ] Review XMTP node-sdk documentation for proper signer creation
- [ ] Update XMTPClient initialization in `src/channels/xmtp/client.ts`
- [ ] Test connection to XMTP network
- [ ] Verify message sending/receiving works

#### 2. Test OpenSea MCP Integration End-to-End
**Status:** 🔴 Not Started  
**Priority:** High  

**Test Cases:**
- [ ] Test "What's the floor price of Based Punks?" query
- [ ] Test trending collections query
- [ ] Test wallet NFT balance check
- [ ] Verify all 17 tools are accessible
- [ ] Test response formatting for XMTP

#### 3. Deploy $DATABURN Token
**Status:** 🔴 Not Started  
**Priority:** High  

**Steps:**
- [ ] Visit flaunch.gg and deploy token
- [ ] Update DATABURN_CONTRACT_ADDRESS in .env
- [ ] Deploy DataBurnReceiverV3 contract
- [ ] Initialize contract with token address
- [ ] Test automatic burn mechanism

### Next Sprint (Next 2 Weeks)

#### 4. Complete Discovery Service
**Status:** 🔴 Not Started  
**Priority:** Medium  

**Implementation:**
- [ ] Build service registry
- [ ] Add visualization generators
- [ ] Create search/filtering
- [ ] Implement caching layer

#### 5. Production Deployment
**Status:** 🔴 Not Started  
**Priority:** Medium  

**Checklist:**
- [ ] Set up production environment variables
- [ ] Deploy to Railway/Vercel
- [ ] Configure domain (agent.base.eth)
- [ ] Set up monitoring
- [ ] Create backup strategy

---

## 🚀 Quick Start Commands

```bash
# Monorepo setup
bun install
bun run build

# Development
bun run dev:web        # Start web app
bun run dev:agent      # Start agent service

# Testing
bun test              # Run all tests
bun test:web         # Test web app
bun test:agent       # Test agent service

# Deployment
bun run deploy:web    # Deploy web app
bun run deploy:agent  # Deploy agent service
```

---

## 📊 Progress Summary

### Overall Completion
- **apps/web**: 25% complete (needs OpenSea MCP and x402 integration)
- **apps/agent-base-eth**: 60% complete (OpenSea MCP done, XMTP partial, discovery pending)
- **Infrastructure**: 10% complete (basic structure exists)

### Priority Order
1. ✅ Basic monorepo structure (done)
2. ✅ OpenSea MCP integration with AI SDK (done)
3. 🟡 Fix XMTP integration (in progress)
4. 🔴 Deploy $DATABURN token (high priority)
5. 🔴 Complete discovery service
6. 🔴 Production deployment
7. 🔴 Launch full system

---

Last Updated: 2025-08-17