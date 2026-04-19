/**
 * CloakDisplay: Show generated cloak + real seed + QR codes
 */

import React, { useState } from 'react';
import { Copy, Eye, EyeOff, Download, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode.react';

export function CloakDisplay({
  realSeed,
  cloakPhrase,
  wallets,
  onCopy,
  onGenerate,
  loading
}) {
  const [showRealSeed, setShowRealSeed] = useState(false);
  const [qrMode, setQrMode] = useState('cloak'); // 'cloak' or 'seed'

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `cloakseed-qr-${Date.now()}.png`;
      link.click();
    }
  };

  const CopyButton = ({ text, label }) => (
    <button
      onClick={() => onCopy(text)}
      className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
    >
      <Copy className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Your Cloak Phrase (WRITE THIS DOWN)</h3>
        
        <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-4">
          <p className="text-white font-mono text-sm leading-relaxed break-words">
            {cloakPhrase}
          </p>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          This is what you write down. It looks random. Only you know it's your seed.
        </p>

        <CopyButton text={cloakPhrase} label="Copy Cloak" />
      </div>

      {/* Real Seed (Hidden) */}
      <div className="border border-red-700/50 rounded-lg p-6 bg-red-900/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Real BIP-39 Seed</h3>
          <button
            onClick={() => setShowRealSeed(!showRealSeed)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            {showRealSeed ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show
              </>
            )}
          </button>
        </div>

        {showRealSeed ? (
          <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-4">
            <p className="text-white font-mono text-sm leading-relaxed break-words">
              {realSeed}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded p-4 mb-4 text-gray-400 text-center">
            ••••••••••••••••••••••••• (hidden)
          </div>
        )}

        <p className="text-sm text-gray-300 mb-4">
          Import this into MetaMask, Phantom, Ledger, or any BIP-39 wallet. Never share.
        </p>

        {showRealSeed && <CopyButton text={realSeed} label="Copy Real Seed" />}
      </div>

      {/* Wallets */}
      <div className="grid md:grid-cols-3 gap-4">
        <WalletCard title="Ethereum" chain="ethereum" wallet={wallets?.ethereum} onCopy={onCopy} />
        <WalletCard title="Bitcoin" chain="bitcoin" wallet={wallets?.bitcoin} onCopy={onCopy} />
        <WalletCard title="Solana" chain="solana" wallet={wallets?.solana} onCopy={onCopy} />
      </div>

      {/* QR Code */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">QR Code Backup</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setQrMode(qrMode === 'cloak' ? 'seed' : 'cloak')}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              {qrMode === 'cloak' ? 'Show Seed QR' : 'Show Cloak QR'}
            </button>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="flex justify-center bg-white p-4 rounded">
          <QRCode value={qrMode === 'cloak' ? cloakPhrase : realSeed} size={256} />
        </div>
      </div>

      {/* Regenerate */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        Generate New Cloak
      </button>

      {/* Security Warning */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 text-sm text-yellow-200">
        <p className="font-semibold mb-2">⚠️ Never:</p>
        <ul className="space-y-1 ml-4">
          <li>• Take screenshots of seed phrases</li>
          <li>• Paste online (Discord, Telegram, etc.)</li>
          <li>• Share with anyone</li>
          <li>• Use on untrusted networks</li>
        </ul>
      </div>
    </div>
  );
}

function WalletCard({ title, chain, wallet, onCopy }) {
  if (!wallet) return null;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h4 className="font-semibold mb-2 text-sm">{title}</h4>
      <div className="bg-gray-900 rounded p-2 mb-3 overflow-hidden">
        <p className="text-xs text-gray-300 font-mono break-all">
          {wallet.address}
        </p>
      </div>
      <button
        onClick={() => onCopy(wallet.address)}
        className="w-full flex items-center justify-center gap-2 px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
      >
        <Copy className="w-3 h-3" />
        Copy
      </button>
    </div>
  );
}

export default CloakDisplay;
