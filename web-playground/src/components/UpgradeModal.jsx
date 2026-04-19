import React, { useState } from 'react'
import { X, Check, Zap } from 'lucide-react'
import { TIER_PRICES } from '../utils/features'
import { createCheckoutSession, PRICE_IDS } from '../utils/stripe'
import { trackEvent, AnalyticsEvents } from '../utils/analytics'
import { captureError } from '../utils/sentry'

const PRO_FEATURES = [
  'All 6 chains (ETH, SOL, BTC, SUI, Cosmos, Aptos)',
  'Up to 16 worker threads',
  '100 results per session',
  'Batch generation',
  'Priority support',
]

const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Up to 64 worker threads',
  '1,000 results per session',
  'REST API access (1M req/day)',
  'Dedicated support',
]

export default function UpgradeModal({ isOpen, onClose }) {
  const [billingInterval, setBillingInterval] = useState('monthly')
  const [loading, setLoading] = useState(null) // 'pro' | 'enterprise' | null
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubscribe = async (tier) => {
    setLoading(tier)
    setError(null)
    trackEvent(AnalyticsEvents.UPGRADE_CLICKED, { tier, interval: billingInterval })

    try {
      const priceId = tier === 'pro'
        ? (billingInterval === 'yearly' ? PRICE_IDS.pro_yearly : PRICE_IDS.pro_monthly)
        : PRICE_IDS.enterprise_monthly

      await createCheckoutSession(priceId)
      // Redirects to Stripe — won't reach here unless error
    } catch (err) {
      captureError(err, { tier, billingInterval })
      setError('Payment service unavailable. Please try again later.')
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap size={24} className="text-yellow-400" />
            Upgrade Your Plan
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Billing interval toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              billingInterval === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              billingInterval === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-green-400 text-xs ml-1">Save 20%</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pro */}
          <div className="p-5 bg-gray-800 rounded-xl border border-blue-500/50 relative">
            <div className="absolute -top-3 left-4 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
              POPULAR
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Pro</h3>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {billingInterval === 'yearly' ? '$7.99' : '$9.99'}
              <span className="text-sm text-gray-400 font-normal">/mo</span>
            </p>
            {billingInterval === 'yearly' && (
              <p className="text-xs text-green-400">Billed $95.88/year</p>
            )}
            <ul className="mt-4 space-y-2">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading !== null}
              className="w-full mt-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold text-white transition-colors"
            >
              {loading === 'pro' ? 'Redirecting...' : 'Subscribe to Pro'}
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-5 bg-gray-800 rounded-xl border border-gray-600">
            <h3 className="text-lg font-bold text-white">Enterprise</h3>
            <p className="text-2xl font-bold text-gray-300 mt-1">
              $49.99<span className="text-sm text-gray-400 font-normal">/mo</span>
            </p>
            <ul className="mt-4 space-y-2">
              {ENTERPRISE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('enterprise')}
              disabled={loading !== null}
              className="w-full mt-5 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold text-white transition-colors"
            >
              {loading === 'enterprise' ? 'Redirecting...' : 'Subscribe to Enterprise'}
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-4 py-2 text-gray-500 text-sm">
          Maybe later
        </button>
      </div>
    </div>
  )
}
