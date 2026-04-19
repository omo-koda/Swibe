import React from 'react'

export default function Statistics() {
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Tips & Statistics</h2>
      
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold mb-2">Difficulty Guide</h3>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>🟢 1-2 chars: Very easy (instant)</li>
            <li>🟡 3-4 chars: Easy (seconds)</li>
            <li>🟠 5-6 chars: Medium (minutes)</li>
            <li>🔴 7+ chars: Hard (hours/days)</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Performance Factors</h3>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>✓ Shorter patterns = faster</li>
            <li>✓ More workers = faster</li>
            <li>✓ Case-insensitive = faster</li>
            <li>✓ Chrome = fastest browser</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Best Practices</h3>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>🔒 Back up private keys securely</li>
            <li>🔒 Never share your private key</li>
            <li>🔒 Use hardware wallet for storage</li>
            <li>🔒 Verify full addresses, not just ends</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
