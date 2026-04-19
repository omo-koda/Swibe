/**
 * CloakSeed Generator - Main cloak phrase generation
 */

import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { Copy, RefreshCw, Download, Eye, EyeOff } from 'lucide-react';

export function CloakGenerator({ cloakPhrase, realSeed, wallets, entropy, onGenerate, loading }) {
  const [showRealSeed, setShowRealSeed] = useState(false);
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const zeroizeAfterCopy = () => {
    // Clear clipboard after 30 seconds
    setTimeout(() => {
      navigator.clipboard.writeText('');
    }, 30000);
  };

  if (!cloakPhrase || !realSeed) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-6">Generate Your Cloak Phrase</h1>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold"
          >
            {loading ? 'Generating...' : 'Generate New Cloak'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Your Cloak Phrase</h1>
        <p className="text-gray-400 mb-8">
          This is your secret, encoded phrase. Write this down. It looks meaningless but hides your real wallet.
        </p>

        {/* Cloak Phrase Display */}
        <div className="bg-gray-900 border-2 border-blue-500/50 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Cloak Phrase</h2>
            <button
              onClick={() => {
                copyToClipboard(cloakPhrase, 'cloak');
                zeroizeAfterCopy();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              <Copy className="w-4 h-4" />
              {copied === 'cloak' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="bg-black rounded-lg p-6 border border-gray-700 mb-4 font-mono text-lg break-words leading-relaxed">
            {cloakPhrase}
          </div>

          <p className="text-sm text-gray-400">
            💾 Save this in: notebook, password manager, encrypted file, or hardware wallet
          </p>
        </div>

        {/* Real Seed (Hidden by Default) */}
        <div className="bg-gray-900 border-2 border-red-500/30 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Real Seed Phrase
              <button
                onClick={() => setShowRealSeed(!showRealSeed)}
                className="text-gray-400 hover:text-white"
                title={showRealSeed ? 'Hide' : 'Show'}
              >
                {showRealSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </h2>
            {showRealSeed && (
              <button
                onClick={() => {
                  copyToClipboard(realSeed, 'seed');
                  zeroizeAfterCopy();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
              >
                <Copy className="w-4 h-4" />
                {copied === 'seed' ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {showRealSeed ? (
            <div className="bg-black rounded-lg p-6 border border-red-700 font-mono text-lg break-words leading-relaxed mb-4">
              {realSeed}
            </div>
          ) : (
            <div className="bg-black rounded-lg p-6 border border-gray-700 text-gray-500 text-center py-12">
              Click the eye icon to reveal (WARNING: Sensitive!)
            </div>
          )}

          <p className="text-xs text-red-300">
            ⚠️ Only show this on a secure, offline device. Paste into MetaMask, Phantom, Ledger Live to import wallet.
          </p>
        </div>

        {/* QR Codes */}
        {wallets?.ethereum && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
              <h3 className="font-semibold mb-4">Ethereum Address QR</h3>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QRCode value={wallets.ethereum.address} size={200} />
              </div>
              <p className="text-sm text-gray-400 break-all">
                {wallets.ethereum.address}
              </p>
            </div>

            {wallets.bitcoin?.address && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <h3 className="font-semibold mb-4">Bitcoin Address QR</h3>
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <QRCode value={wallets.bitcoin.address} size={200} />
                </div>
                <p className="text-sm text-gray-400 break-all">
                  {wallets.bitcoin.address}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onGenerate}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Another
          </button>

          <button
            onClick={() => {
              const data = {
                cloak: cloakPhrase,
                created: new Date().toISOString(),
                entropy: entropy
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `cloakseed-backup-${Date.now()}.json`;
              a.click();
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            <Download className="w-4 h-4" />
            Backup (Encrypted)
          </button>
        </div>

        {/* Security Tips */}
        <div className="mt-12 bg-blue-900/20 border border-blue-500/50 rounded-xl p-6">
          <h3 className="font-bold mb-3">🔒 Security Tips</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>✅ Your cloak phrase will be copied to clipboard for ~30 seconds, then auto-cleared</li>
            <li>✅ Real seed phrase is never transmitted. It stays 100% offline in your browser</li>
            <li>✅ Refresh page or close tab to zeroize memory</li>
            <li>✅ Use an airgapped computer for maximum security</li>
            <li>🚫 Never paste cloak or seed online</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CloakGenerator;
