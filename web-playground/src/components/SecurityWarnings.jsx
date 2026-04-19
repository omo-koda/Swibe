import React from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function SecurityWarnings() {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Security & Best Practices</h2>

      <div className="space-y-6">
        {/* Address Poisoning */}
        <div>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2">⚠️ Address Poisoning Risk</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Attackers can create vanity addresses that look similar to yours by matching only the first and last few characters.
              </p>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Always verify the COMPLETE 40-character address before sending funds.
              </p>
            </div>
          </div>
        </div>

        {/* Key Management */}
        <div>
          <h3 className="font-bold text-lg mb-3">🔐 Private Key Security</h3>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>✓ Store private keys in encrypted vaults (1Password, Bitwarden, etc.)</p>
            <p>✓ Use hardware wallets (Ledger, Trezor) for high-value funds</p>
            <p>✓ Never share your private key with anyone</p>
            <p>✓ Never type your private key into unsecured websites</p>
            <p>✓ Back up recovery phrases offline in secure locations</p>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="font-bold text-lg mb-3">👥 Privacy</h3>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>✓ All computation happens locally in your browser</p>
            <p>✓ No data is sent to any server</p>
            <p>✓ No analytics, tracking, or telemetry</p>
            <p>✓ You can use offline - disconnect internet after page loads</p>
            <p>✓ 100% open source - code is auditable</p>
          </div>
        </div>

        {/* Pattern Warnings */}
        <div>
          <h3 className="font-bold text-lg mb-3">⏱️ Patience & Time</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Exponential Time Complexity:</strong>
            </p>
            <ul className="text-gray-700 dark:text-gray-300 space-y-1">
              <li>3 chars: ~0.3 seconds</li>
              <li>4 chars: ~5 seconds</li>
              <li>5 chars: ~1 minute</li>
              <li>6 chars: ~16 minutes</li>
              <li>7 chars: ~4 hours</li>
              <li>8 chars: ~3 days</li>
            </ul>
          </div>
        </div>

        {/* Best Practices */}
        <div>
          <h3 className="font-bold text-lg mb-3">✅ Best Practices Checklist</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" disabled defaultChecked className="w-4 h-4" />
              <span>I understand vanity addresses don't increase security</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" disabled defaultChecked className="w-4 h-4" />
              <span>I will verify full addresses before sending funds</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" disabled defaultChecked className="w-4 h-4" />
              <span>I will keep my private key secure and never share it</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" disabled defaultChecked className="w-4 h-4" />
              <span>I understand the risks of smart contract interaction</span>
            </label>
          </div>
        </div>

        {/* Educational */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2">📚 Learn More</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            For more information about Ethereum security, address poisoning, and best practices:
          </p>
          <ul className="text-sm space-y-1">
            <li>• <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">ethereum.org - Wallets</a></li>
            <li>• <a href="https://github.com/bokub/vanity-eth" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Original Vanity-ETH</a></li>
            <li>• <a href="https://eips.ethereum.org/EIPS/eip-55" target="_blank" rel="noopener" className="text-blue-600 hover:underline">EIP-55 Checksum Address</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
