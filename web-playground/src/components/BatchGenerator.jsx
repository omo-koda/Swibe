import React, { useState } from 'react'
import { Plus, Trash2, Play, Download, Lock } from 'lucide-react'
import { hasFeature, getCurrentTier } from '../utils/features'
import { generatePrivateKey, getPublicKey, getAddressFromPublicKey, matchesPattern, validatePatternInputs } from '../utils/crypto'
import { trackEvent } from '../utils/analytics'
import UpgradeModal from './UpgradeModal'

function generateSingleAddress(prefix, suffix, maxAttempts = 500000) {
  const start = Date.now()
  for (let i = 0; i < maxAttempts; i++) {
    const privateKey = generatePrivateKey()
    const publicKey = getPublicKey(privateKey)
    const address = getAddressFromPublicKey(publicKey)
    if (matchesPattern(address, prefix, suffix, false)) {
      return { success: true, address, privateKey, attempts: i + 1, duration: (Date.now() - start) / 1000 }
    }
  }
  return { success: false, address: null, privateKey: null, attempts: maxAttempts, duration: (Date.now() - start) / 1000 }
}

export default function BatchGenerator() {
  const [patterns, setPatterns] = useState([{ prefix: '', suffix: '' }])
  const [results, setResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (!hasFeature('batchGeneration')) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Batch Generation</h2>
          <p className="text-gray-400 mb-6">Generate up to 10 vanity addresses in parallel. Available on Pro.</p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium"
          >
            Upgrade to Pro
          </button>
          <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </div>
      </div>
    )
  }

  const addPattern = () => {
    if (patterns.length < 10) {
      setPatterns([...patterns, { prefix: '', suffix: '' }])
    }
  }

  const removePattern = (idx) => {
    if (patterns.length > 1) {
      setPatterns(patterns.filter((_, i) => i !== idx))
    }
  }

  const updatePattern = (idx, field, value) => {
    const updated = [...patterns]
    updated[idx] = { ...updated[idx], [field]: value.replace(/[^0-9a-fA-F]/g, '').slice(0, 10) }
    setPatterns(updated)
  }

  const startBatch = async () => {
    const valid = patterns.filter(p => p.prefix || p.suffix)
    if (valid.length === 0) return

    setIsGenerating(true)
    setResults([])
    setProgress(0)

    trackEvent('batch_generation_started', { pattern_count: valid.length })

    const batchResults = []
    for (let i = 0; i < valid.length; i++) {
      const { prefix, suffix } = valid[i]
      // Yield to UI between patterns
      await new Promise(r => setTimeout(r, 0))
      const result = generateSingleAddress(prefix, suffix)
      batchResults.push({ ...result, pattern: `${prefix}...${suffix}` })
      setResults([...batchResults])
      setProgress(Math.round(((i + 1) / valid.length) * 100))
    }

    trackEvent('batch_generation_completed', {
      count: valid.length,
      successful: batchResults.filter(r => r.success).length,
    })

    setIsGenerating(false)
  }

  const exportResults = () => {
    const exportData = results
      .filter(r => r.success)
      .map(r => ({
        address: r.address,
        privateKey: r.privateKey,
        pattern: r.pattern,
        attempts: r.attempts,
        duration: r.duration,
        generatedAt: new Date().toISOString(),
      }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-vanity-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Batch Generation</h2>

        <div className="space-y-3 mb-4">
          {patterns.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-500 w-5">{i + 1}</span>
              <input
                value={p.prefix}
                onChange={(e) => updatePattern(i, 'prefix', e.target.value)}
                placeholder="Prefix"
                disabled={isGenerating}
                className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white text-sm"
                maxLength="10"
              />
              <input
                value={p.suffix}
                onChange={(e) => updatePattern(i, 'suffix', e.target.value)}
                placeholder="Suffix"
                disabled={isGenerating}
                className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white text-sm"
                maxLength="10"
              />
              {patterns.length > 1 && (
                <button
                  onClick={() => removePattern(i)}
                  disabled={isGenerating}
                  className="p-2 text-red-400 hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {patterns.length < 10 && (
          <button
            onClick={addPattern}
            disabled={isGenerating}
            className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 mb-4"
          >
            <Plus size={14} /> Add pattern
          </button>
        )}

        {isGenerating && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button
          onClick={startBatch}
          disabled={isGenerating || patterns.every(p => !p.prefix && !p.suffix)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
        >
          <Play size={18} />
          {isGenerating ? 'Generating...' : 'Generate All'}
        </button>

        {results.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">Results ({results.filter(r => r.success).length}/{results.length})</h3>
              <button
                onClick={exportResults}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Download size={14} /> Export JSON
              </button>
            </div>
            {results.map((r, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${
                  r.success
                    ? 'bg-green-900/20 border border-green-700/50'
                    : 'bg-red-900/20 border border-red-700/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <code className="text-xs text-gray-300 break-all">
                    {r.success ? r.address : `No match for ${r.pattern}`}
                  </code>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                    {r.attempts.toLocaleString()} tries / {r.duration.toFixed(1)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
