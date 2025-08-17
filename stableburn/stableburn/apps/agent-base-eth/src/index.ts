import { AgentBaseEth } from './core/agent'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from root .env first
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
// Then load local .env to override if needed
dotenv.config()

async function main() {
  console.log('====================================')
  console.log('        agent.base.eth v1.0.0      ')
  console.log('====================================')
  
  try {
    const agent = new AgentBaseEth()
    await agent.initialize()
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\\n👋 Shutting down agent.base.eth...')
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ Failed to start agent:', error)
    process.exit(1)
  }
}

main()