/**
 * CloakSeed Landing Page
 * Hero section with value proposition
 */

import React from 'react';
import { ArrowRight, Shield, Lock, Eye } from 'lucide-react';

export function CloakSeedLanding({ onStart }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-blue-900/30 border border-blue-500/50 rounded-full text-sm text-blue-300 mb-6">
            🔐 Stealth Seed Technology
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Turn your seed phrase into a{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            love poem
          </span>
          <br />
          no thief will ever understand
        </h1>

        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          CloakSeed lets you create a personal 2048-word cipher overlay on top of your real BIP-39 seed phrase. 
          Write down only your secret words. Everyone sees gibberish. Only you can recover your wallet.
        </p>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 my-16 text-left">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition">
            <Shield className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-semibold mb-2">100% Client-Side</h3>
            <p className="text-sm text-gray-400">
              All encryption happens in your browser. No servers. No tracking. No telemetry.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition">
            <Lock className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="font-semibold mb-2">Your Secret Cipher</h3>
            <p className="text-sm text-gray-400">
              Choose from 5 themes (animals, colors, food, fantasy, nonsense) or create custom words.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition">
            <Eye className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">Invisible Recovery</h3>
            <p className="text-sm text-gray-400">
              Paste your cloak phrase → instantly see your real ETH, SOL, BTC wallet addresses.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 mb-12 text-left">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="text-2xl font-bold text-blue-400 w-8 flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold mb-1">Choose Your Theme</h4>
                <p className="text-gray-400 text-sm">
                  Pick animals, colors, food, fantasy, or create custom 2048-word cipher.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl font-bold text-blue-400 w-8 flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold mb-1">Generate Your Cloak</h4>
                <p className="text-gray-400 text-sm">
                  App generates a real BIP-39 seed, then encodes it with your cipher.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl font-bold text-blue-400 w-8 flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold mb-1">Write Down Your Cloak Phrase</h4>
                <p className="text-gray-400 text-sm">
                  "fluff spark moon rabbit..." looks like random words. Only you know it's your wallet key.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl font-bold text-blue-400 w-8 flex-shrink-0">4</div>
              <div>
                <h4 className="font-semibold mb-1">Store Anywhere (Safely)</h4>
                <p className="text-gray-400 text-sm">
                  Notebook. Photo. Hardware. No one suspects it's a seed phrase.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl font-bold text-blue-400 w-8 flex-shrink-0">5</div>
              <div>
                <h4 className="font-semibold mb-1">Recovery</h4>
                <p className="text-gray-400 text-sm">
                  Paste your cloak phrase → get real seed → import into MetaMask, Phantom, Ledger, etc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 mb-12 text-left">
          <div className="flex gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <h3 className="font-bold text-red-300">Critical: Never Share</h3>
          </div>
          <ul className="text-sm text-red-200/80 space-y-2 ml-8">
            <li>🚫 Never take screenshots of your seed phrase</li>
            <li>🚫 Never paste it into online pastebin tools</li>
            <li>🚫 Never use it on untrusted networks</li>
            <li>✅ Use this app offline (disconnect internet)</li>
            <li>✅ Store seed in secure location (safe, vault, Trezor)</li>
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-bold text-lg transition transform hover:scale-105 active:scale-95"
        >
          Start Creating Your Cloak
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Footer Text */}
        <p className="text-gray-500 text-sm mt-12">
          100% open source • Client-side encryption • No telemetry • MIT licensed
        </p>
      </div>
    </div>
  );
}

export default CloakSeedLanding;
