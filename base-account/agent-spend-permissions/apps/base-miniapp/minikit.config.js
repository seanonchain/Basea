module.exports = {
  appId: process.env.BASE_APP_ID || 'agent-base-eth',
  appName: 'agent.base.eth',
  appDescription: 'Chat with agent.base.eth directly in Base App',
  appIcon: '/icon.png',
  appUrl: process.env.MINIKIT_APP_URL || 'https://agent.base.eth',
  
  // MiniKit configuration
  minikit: {
    version: '1.0.0',
    features: [
      'chat',
      'payments',
      'notifications'
    ],
    
    // Authentication
    auth: {
      required: true,
      type: 'wallet'
    },
    
    // Permissions
    permissions: [
      'wallet_address',
      'send_transactions',
      'notifications'
    ],
    
    // Theme
    theme: {
      primaryColor: '#0052FF',
      backgroundColor: '#FFFFFF',
      textColor: '#000000'
    }
  },
  
  // API endpoints
  api: {
    chat: '/api/chat',
    payment: '/api/payment',
    minikit: '/api/minikit'
  }
}