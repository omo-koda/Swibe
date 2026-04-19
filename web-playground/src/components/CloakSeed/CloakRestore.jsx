/**
 * CloakSeed Restore - Decode cloak phrase back to real seed
 */

import React, { useState } from 'react';
import { Copy, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function CloakRestore({ wallets, realSeed, onRestore, error, loading }) {
  const [cloakInput, setCloakInput] = useState('');
  const [showSeed, setShowSeed] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleRestore = () => {
    if (!cloakInput.trim()) {
      return;
    }
    onRestore(cloakInput.trim());
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      navigator.clipboard.writeText('');
      setCopied(false);
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Restore Your Wallet</h1>
        <p className="text-gray-400 mb-8">
          Paste your cloak phrase to recover your real seed phrase and wallet addresses.
        </p>

        {/* Input Section */}
        <div className="bg-gray-900 border-2 border-blue-500/50 rounded-xl p-8 mb-8">
          <label className="block text-sm font-semibold mb-3">
            Paste Your Cloak Phrase
          </label>
          <textarea
            value={cloakInput}
            onChange={(e) => setCloakInput(e.target.value)}
            placeholder="fluff spark moon rabbit..."
            className="w-full bg-black text-white border border-gray-700 rounded-lg p-4 font-mono text-lg focus:border-blue-500 focus:outline-none resize-none"
            rows="4"
          />
          <p className="text-xs text-gray-500 mt-2">
            Example: "fluff spark moon rabbit dollar judge..."
          </p>
        </div>

        {/* Restore Button */}
        <button
          onClick={handleRestore}
          disabled={loading || !cloakInput.trim()}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold mb-8 transition"
        >
          {loading ? 'Restoring...' : 'Restore Wallet'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Error</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Success: Show Real Seed */}
        {realSeed && !error && (
          <div className="space-y-8">
            {/* Real Seed Phrase */}
            <div className="bg-gray-900 border-2 border-green-500/50 rounded-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Your Real Seed Phrase
                  <button
                    onClick={() => setShowSeed(!showSeed)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </h2>
                {showSeed && (
                  <button
                    onClick={() => copyToClipboard(realSeed)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              {showSeed ? (
                <div className="bg-black rounded-lg p-6 border border-green-700 font-mono text-lg break-words leading-relaxed mb-4">
                  {realSeed}
                </div>
              ) : (
                <div className="bg-black rounded-lg p-6 border border-gray-700 text-gray-500 text-center py-12">
                  Click eye icon to reveal
                </div>
              )}

              <p className="text-xs text-green-300 mt-3">
                ✅ Valid BIP-39 seed phrase. Safe to import into MetaMask, Phantom, Ledger Live, etc.
              </p>
            </div>

            {/* Wallet Addresses */}
            {wallets && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Derived Wallet Addresses</h3>

                {wallets.ethereum && (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Ethereum (ETH)</h4>
                      <button
                        onClick={() => copyToClipboard(wallets.ethereum.address)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 font-mono break-all">
                      {wallets.ethereum.address}
                    </p>
                  </div>
                )}

                {wallets.bitcoin?.address && (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Bitcoin (BTC)</h4>
                      <button
                        onClick={() => copyToClipboard(wallets.bitcoin.address)}
                        className="text-orange-400 hover:text-orange-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 font-mono break-all">
                      {wallets.bitcoin.address}
                    </p>
                  </div>
                )}

                {wallets.solana?.address && (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Solana (SOL)</h4>
                      <button
                        onClick={() => copyToClipboard(wallets.solana.address)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 font-mono break-all">
                      {wallets.solana.address}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-6">
              <h3 className="font-bold mb-3">📋 Next Steps</h3>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Copy the real seed phrase (click button above)</li>
                <li>Open MetaMask / Phantom / Ledger Live on an offline device</li>
                <li>Select "Import seed phrase" or "Restore wallet"</li>
                <li>Paste and confirm</li>
                <li>Your wallet will be restored with all assets</li>
              </ol>
            </div>
          </div>
        )}

        {/* Security Warning */}
        <div className="mt-12 bg-red-900/20 border border-red-500/50 rounded-xl p-6">
          <h3 className="font-bold text-red-300 mb-3">⚠️ Security Reminders</h3>
          <ul className="text-sm text-red-200 space-y-2">
            <li>🚫 Only decode on an offline/airgapped device</li>
            <li>🚫 Never paste seed phrase online</li>
            <li>🚫 Never share your cloak phrase with anyone</li>
            <li>✅ Once imported, delete all traces from this device</li>
            <li>✅ Close browser tab or restart device after importing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CloakRestore;
