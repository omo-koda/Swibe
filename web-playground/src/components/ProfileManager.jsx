import React, { useState } from 'react'
import { CHAINS } from '../utils/chains'

export default function ProfileManager() {
  const [tab, setTab] = useState('profiles')
  const [profileName, setProfileName] = useState('')
  const [selectedChain, setSelectedChain] = useState('ethereum')
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'profiles', label: 'Profiles' },
          { id: 'batch', label: 'Batch Mode' },
          { id: 'queue', label: 'Queue' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 font-medium border-b-2 ${
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 dark:text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profiles' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Create Profile</h2>

          <div className="space-y-4">
            <input
              type="text"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              placeholder="Profile name (e.g., 'ETH Beef')"
              className="w-full px-4 py-2 border rounded dark:bg-gray-800"
            />

            <select
              value={selectedChain}
              onChange={e => setSelectedChain(e.target.value)}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800"
            >
              {Object.entries(CHAINS).map(([id, chain]) => (
                <option key={id} value={id}>
                  {chain.name} ({chain.symbol})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                placeholder="Prefix"
                className="px-4 py-2 border rounded dark:bg-gray-800"
              />
              <input
                type="text"
                value={suffix}
                onChange={e => setSuffix(e.target.value)}
                placeholder="Suffix"
                className="px-4 py-2 border rounded dark:bg-gray-800"
              />
            </div>

            <button className="w-full py-3 bg-primary-600 text-white rounded hover:bg-primary-700 font-bold">
              Create Profile
            </button>
          </div>
        </div>
      )}

      {tab === 'batch' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Batch Generator</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Select profiles above and run batch searches across multiple chains and patterns.
          </p>
          <button className="w-full py-3 bg-primary-600 text-white rounded hover:bg-primary-700 font-bold">
            Start Batch
          </button>
        </div>
      )}

      {tab === 'queue' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Batch Queue</h2>
          <p className="text-gray-600 dark:text-gray-400">
            No active batch jobs. Create a profile and start a batch search.
          </p>
        </div>
      )}
    </div>
  )
}
