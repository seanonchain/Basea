import { X402Resource } from '@agent-spend-permissions/shared-types'

export class DiscoveryService {
  private services: Map<string, X402Resource> = new Map()

  async initialize() {
    console.log('🔍 Initializing discovery service...')
    
    // Register internal services
    this.registerInternalServices()
    
    // Fetch from x402 facilitator
    await this.fetchFacilitatorServices()
  }

  private registerInternalServices() {
    this.services.set('opensea-data', {
      id: 'opensea-data',
      name: 'OpenSea NFT Data',
      description: 'Access NFT marketplace data, collection stats, and token information',
      endpoint: '/api/mcp/opensea',
      pricing: [
        { tool: 'search', price: '0.001', description: 'Search NFT collections' },
        { tool: 'collection', price: '0.0005', description: 'Get collection details' },
        { tool: 'token_balance', price: '0.001', description: 'Check token balances' }
      ]
    })

    this.services.set('discovery', {
      id: 'discovery',
      name: 'Service Discovery',
      description: 'List all available x402-enabled services',
      endpoint: '/api/discovery',
      pricing: [
        { tool: 'list', price: '0', description: 'Free service listing' }
      ]
    })
  }

  private async fetchFacilitatorServices() {
    try {
      // TODO: Implement fetching from x402 facilitator
      console.log('📡 Fetching services from x402 facilitator...')
    } catch (error) {
      console.error('Failed to fetch facilitator services:', error)
    }
  }

  async listServices(): Promise<X402Resource[]> {
    return Array.from(this.services.values())
  }

  async getService(id: string): Promise<X402Resource | undefined> {
    return this.services.get(id)
  }

  async registerService(service: X402Resource) {
    this.services.set(service.id, service)
  }
}