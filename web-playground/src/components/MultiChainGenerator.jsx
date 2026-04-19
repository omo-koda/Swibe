import React, { useState } from 'react'
import { CHAINS } from '../utils/chains'

export default function MultiChainGenerator() {
  const [selectedChain, setSelectedChain] = useState('ethereum')
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">⛓️ Multi-Chain Generator</h2>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          {Object.entries(CHAINS).map(([id, chain]) => (
            <button
              key={id}
              onClick={() => setSelectedChain(id)}
              className={`p-3 rounded text-center ${
                selectedChain === id ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <div className="text-2xl">{chain.icon}</div>
              <div className="text-xs">{chain.symbol}</div>
            </button>
          ))}
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded mb-6">
          <p className="text-sm"><strong>Curve:</strong> {CHAINS[selectedChain].curve}</p>
          <p className="text-sm"><strong>Hash:</strong> {CHAINS[selectedChain].hash}</p>
          <p className="text-sm"><strong>Path:</strong> {CHAINS[selectedChain].bip44}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Prefix"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            className="px-4 py-2 border rounded dark:bg-gray-800"
          />
          <input
            type="text"
            placeholder="Suffix"
            value={suffix}
            onChange={e => setSuffix(e.target.value)}
            className="px-4 py-2 border rounded dark:bg-gray-800"
          />
        </div>

        <button className="w-full py-3 bg-primary-600 text-white rounded font-bold hover:bg-primary-700">
          Start Search
        </button>

        <div className="grid grid-cols-4 gap-4 mt-6 text-center">
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Generated</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Speed</div>
            <div className="text-2xl font-bold">0/s</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Found</div>
            <div className="text-2xl font-bold text-green-600">0</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Elapsed</div>
            <div className="text-2xl font-bold">0s</div>
          </div>
        </div>
      </div>
    </div>
  )
}
