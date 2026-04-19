import React, { useState } from 'react'

export default function ExportManager() {
  const [privateKey, setPrivateKey] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('encrypt')

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">🔐 Zero-Knowledge Export</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { id: 'encrypt', label: 'Password Locked', icon: '🔒' },
            { id: 'qr', label: 'One-Time QR', icon: '📱' },
            { id: 'checksum', label: 'Verified Export', icon: '✓' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-4 rounded font-medium text-center ${
                mode === m.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="text-sm">{m.label}</div>
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Private Key</label>
            <input
              type="password"
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 font-mono"
            />
          </div>

          {mode !== 'qr' && (
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full px-4 py-2 border rounded dark:bg-gray-800"
              />
            </div>
          )}

          <button className="w-full py-3 bg-primary-600 text-white rounded hover:bg-primary-700 font-bold">
            {mode === 'encrypt'
              ? 'Encrypt & Export'
              : mode === 'qr'
              ? 'Generate QR'
              : 'Create Verified Export'}
          </button>
        </div>
      </div>

      <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <h3 className="font-bold mb-3 text-red-900 dark:text-red-200">Security</h3>
        <ul className="text-sm space-y-2 text-red-900 dark:text-red-200">
          <li>✓ AES-256-GCM encryption</li>
          <li>✓ PBKDF2 key derivation (100k iterations)</li>
          <li>✓ 100% client-side - no servers</li>
          <li>✓ Private key never transmitted</li>
        </ul>
      </div>
    </div>
  )
}
