'use client'

import { useState } from 'react'

export function PaymentButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('1.00')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTip = async () => {
    setIsProcessing(true)
    
    try {
      // TODO: Implement x402 payment
      console.log(`Sending tip of $${amount}`)
      
      // Simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(`Thank you for your $${amount} tip! It will be converted to $DATABURN and burned.`)
      setIsOpen(false)
      setAmount('1.00')
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        💰 Tip Agent
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Send a Tip</h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Tips are automatically converted to $DATABURN tokens and burned, supporting the ecosystem.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Amount (USDC)
              </label>
              <div className="flex items-center">
                <span className="text-lg mr-2">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.10"
                  step="0.10"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={isProcessing || parseFloat(amount) < 0.10}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Send $${amount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}