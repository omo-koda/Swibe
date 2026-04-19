/**
 * PanicPhrase: Generate fake wallet for coerced transfers
 */

import React, { useState } from 'react';
import { AlertCircle, Copy, RefreshCw } from 'lucide-react';

export function PanicPhrase({ onGenerate, panicPhrase, panicWallets, onCopy, loading, isPremium }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isPremium) {
    return (
      <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
        <div className="flex gap-3 mb-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h3 className="font-semibold text-purple-300">Panic Phrase Generator</h3>
            <p className="text-sm text-purple-200/80 mt-1">
              Create a fake wallet address to show under duress. Available in Pro tier.
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold text-sm mt-4">
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
        <div className="flex gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-300 mb-2">Emergency Panic Phrase</h3>
            <p className="text-sm text-red-200/80">
              If you're ever forced to reveal your seed phrase, use this fake one instead. 
              It will show a completely different, worthless wallet.
            </p>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-semibold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Generate Panic Phrase
        </button>
      </div>

      {panicPhrase && (
        <div className="space-y-4">
          {/* Panic Phrase */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">Fake Cloak Phrase</p>
            <div className="bg-gray-900 rounded p-3 mb-3">
              <p className="text-white font-mono text-sm break-words">
                {panicPhrase}
              </p>
            </div>
            <button
              onClick={() => onCopy(panicPhrase)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>

          {/* Show/Hide Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            {showDetails ? 'Hide' : 'Show'} fake wallet addresses
          </button>

          {showDetails && panicWallets && (
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <WalletCardSmall title="ETH" address={panicWallets.ethereum?.address} onCopy={onCopy} />
              <WalletCardSmall title="BTC" address={panicWallets.bitcoin?.address} onCopy={onCopy} />
              <WalletCardSmall title="SOL" address={panicWallets.solana?.address} onCopy={onCopy} />
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 text-sm text-yellow-200">
            <p className="font-semibold mb-2">Remember:</p>
            <ul className="space-y-1 ml-4">
              <li>• This is a completely different, empty wallet</li>
              <li>• Sending to it = attacker loses money</li>
              <li>• Only reveal under extreme duress</li>
              <li>• Have law enforcement present if safe</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletCardSmall({ title, address, onCopy }) {
  if (!address) return null;
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded p-3">
      <p className="text-xs text-gray-400 mb-2">{title}</p>
      <p className="text-xs font-mono text-gray-300 truncate mb-2">{address}</p>
      <button
        onClick={() => onCopy(address)}
        className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition flex items-center justify-center gap-1"
      >
        <Copy className="w-3 h-3" />
        Copy
      </button>
    </div>
  );
}

export default PanicPhrase;
