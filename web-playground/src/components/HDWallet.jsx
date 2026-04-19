import React, { useState } from 'react'
import { CHAINS } from '../utils/chains'

export default function HDWallet() {
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">🌱 HD Wallet Generator</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">BIP-39 Seed Phrase (24 words)</label>
            <textarea
              value={mnemonic}
              onChange={e => setMnemonic(e.target.value)}
              className="w-full h-24 px-4 py-2 border rounded dark:bg-gray-800 font-mono text-sm"
              placeholder="Enter or generate a seed phrase..."
            />
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
              Generate New
            </button>
            <button className="flex-1 py-2 bg-secondary-600 text-white rounded hover:bg-secondary-700">
              Derive Wallets
            </button>
            <button 
              onClick={() => setShowMnemonic(!showMnemonic)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {showMnemonic ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {showMnemonic && mnemonic && (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 p-4 rounded mb-6">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              ⚠️ Never share this seed phrase. Anyone with it can access all wallets.
            </p>
          </div>
        )}

        <h3 className="text-lg font-bold mb-4">Derivation Paths</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(CHAINS).map(([id, chain]) => (
            <div key={id} className="bg-gray-100 dark:bg-gray-900 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{chain.icon}</span>
                <div className="font-bold">{chain.name}</div>
              </div>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{chain.bip44}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
