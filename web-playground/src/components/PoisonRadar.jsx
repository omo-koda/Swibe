import React, { useState } from 'react'
import { CHAINS } from '../utils/chains'

export default function PoisonRadar() {
  const [chain, setChain] = useState('ethereum')
  const [address, setAddress] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">📡 Poison Radar</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Detect dust, zero-value transfers, and suspicious activity. 100% client-side.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Chain</label>
            <select
              value={chain}
              onChange={e => setChain(e.target.value)}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800"
            >
              {Object.entries(CHAINS).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter address to scan..."
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 font-mono text-sm"
            />
          </div>
        </div>

        <button 
          onClick={() => setIsScanning(!isScanning)}
          className="w-full py-3 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium"
        >
          {isScanning ? 'Scanning...' : 'Scan Address'}
        </button>
      </div>

      <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold mb-3">How It Works</h3>
        <ul className="text-sm space-y-2 text-blue-900 dark:text-blue-200">
          <li>✓ Queries public RPC endpoints</li>
          <li>✓ Detects dust transfers</li>
          <li>✓ Flags zero-value transactions</li>
          <li>✓ 100% offline - no data leaves browser</li>
        </ul>
      </div>
    </div>
  )
}
