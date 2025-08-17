'use client'

import { ChatWidget } from '../components/ChatWidget'
import { PaymentButton } from '../components/PaymentButton'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-white">
      <header className="w-full max-w-2xl mb-4">
        <h1 className="text-2xl font-bold text-center">agent.base.eth</h1>
        <p className="text-center text-gray-600 mt-2">
          Your on-chain data and service agent
        </p>
      </header>
      
      <div className="w-full max-w-2xl flex-1">
        <ChatWidget />
      </div>
      
      <footer className="w-full max-w-2xl mt-4 p-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Powered by x402 payments
          </span>
          <PaymentButton />
        </div>
      </footer>
    </main>
  )
}