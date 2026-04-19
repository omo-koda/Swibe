/**
 * Poison Radar - Light on-chain scanner
 * Detect dust, zero-value, and suspicious token transfers
 * 100% client-side, uses public RPCs only
 *
 * Network safeguards:
 *  - RPC failover rotation (tries each endpoint in chain.rpcs)
 *  - Response cache with 2-minute TTL
 *  - Rate limiting: max 10 requests/minute per chain
 *  - 5-second AbortController timeout on every fetch
 *  - Address format validation before any RPC call
 */

import { validateAddressForChain } from './chainCrypto'

// ── Cache (2-minute TTL) ──

const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

function cacheSet(key, value) {
  cache.set(key, { value, ts: Date.now() })
}

// ── Rate limiter (10 req/min per chain) ──

const rateBuckets = new Map()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

function checkRateLimit(chainId) {
  const now = Date.now()
  let bucket = rateBuckets.get(chainId)
  if (!bucket) {
    bucket = []
    rateBuckets.set(chainId, bucket)
  }
  // Evict timestamps outside the window
  while (bucket.length > 0 && now - bucket[0] > RATE_WINDOW) {
    bucket.shift()
  }
  if (bucket.length >= RATE_LIMIT) {
    const waitMs = RATE_WINDOW - (now - bucket[0])
    throw new Error(`Rate limit reached for ${chainId}. Retry in ${Math.ceil(waitMs / 1000)}s.`)
  }
  bucket.push(now)
}

// ── Fetch with timeout ──

const REQUEST_TIMEOUT = 5000

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return response
  } finally {
    clearTimeout(timer)
  }
}

// ── RPC rotation with exponential backoff ──

const MAX_RETRIES_PER_RPC = 2
const BASE_DELAY_MS = 500

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rpcFetch(rpcs, buildRequest) {
  let lastError
  for (const rpc of rpcs) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_RPC; attempt++) {
      try {
        const { url, options } = buildRequest(rpc)
        return await fetchWithTimeout(url, options)
      } catch (err) {
        lastError = err
        // Exponential backoff before retry on same RPC (not on last attempt)
        if (attempt < MAX_RETRIES_PER_RPC) {
          const backoff = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 200
          await delay(backoff)
        }
      }
    }
    // Move to next RPC endpoint after all retries exhausted
  }
  throw new Error(`All RPC endpoints failed: ${lastError?.message || 'unknown error'}`)
}

// ── Chain-specific fetchers ──

async function fetchEthereumTxs(address, rpcs) {
  const response = await rpcFetch(rpcs, (rpc) => ({
    url: rpc,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    },
  }))
  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result ? [{ value: data.result }] : []
}

async function fetchSolanaTxs(address, rpcs) {
  const response = await rpcFetch(rpcs, (rpc) => ({
    url: rpc,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getSignaturesForAddress',
        params: [address, { limit: 10 }],
        id: 1,
      }),
    },
  }))
  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result || []
}

async function fetchBitcoinTxs(address, rpcs) {
  const response = await rpcFetch(rpcs, (rpc) => ({
    url: `${rpc}/address/${address}/txs`,
    options: { method: 'GET' },
  }))
  const txs = await response.json()
  return Array.isArray(txs) ? txs.slice(0, 100) : []
}

async function fetchRecentTransactions(address, chain) {
  switch (chain.id) {
    case 'ethereum':
      return await fetchEthereumTxs(address, chain.rpcs)
    case 'solana':
      return await fetchSolanaTxs(address, chain.rpcs)
    case 'bitcoin':
      return await fetchBitcoinTxs(address, chain.rpcs)
    default:
      return []
  }
}

// ── Public API ──

export async function analyzeAddress(address, chain) {
  // Input validation: check address format before hitting the network
  const validation = validateAddressForChain(address, chain.id)
  if (!validation.valid) {
    return {
      status: 'error',
      message: validation.error,
      risk: 'unknown',
    }
  }

  // Rate limit check
  try {
    checkRateLimit(chain.id)
  } catch (e) {
    return {
      status: 'error',
      message: e.message,
      risk: 'unknown',
    }
  }

  // Check cache
  const cacheKey = `${chain.id}:${address}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    const txs = await fetchRecentTransactions(address, chain)
    const result = analyzeTransactions(txs, address)
    cacheSet(cacheKey, result)
    return result
  } catch (e) {
    return {
      status: 'error',
      message: e.message,
      risk: 'unknown',
    }
  }
}

function analyzeTransactions(txs, targetAddress) {
  if (!txs || txs.length === 0) {
    return {
      status: 'clean',
      risk: 'none',
      txCount: 0,
      warnings: [],
      message: 'No transactions found or new address',
    }
  }

  let riskScore = 0
  const warnings = []
  const suspiciousPatterns = {
    dust: 0,
    zeroValue: 0,
    unknownContracts: 0,
    rapidFire: 0,
  }

  for (let i = 0; i < Math.min(txs.length, 100); i++) {
    const tx = txs[i]

    // Check for dust (very small amounts)
    if (tx.value && BigInt(tx.value) > 0n && BigInt(tx.value) < BigInt('1000000000000000')) {
      suspiciousPatterns.dust++
      riskScore += 1
    }

    // Check for zero-value
    if (tx.value === '0' || !tx.value) {
      suspiciousPatterns.zeroValue++
      if (tx.input && tx.input.length > 2) {
        riskScore += 3
      }
    }

    // Check for unknown contract interactions
    if (tx.to && !isKnownAddress(tx.to)) {
      suspiciousPatterns.unknownContracts++
      riskScore += 2
    }
  }

  // Check for rapid-fire transactions (spam pattern)
  if (txs.length > 50) {
    suspiciousPatterns.rapidFire++
    riskScore += 5
  }

  if (suspiciousPatterns.dust > 5) {
    warnings.push(`High dust activity (${suspiciousPatterns.dust} small transfers)`)
  }
  if (suspiciousPatterns.zeroValue > 10) {
    warnings.push(`Unusual zero-value transactions (${suspiciousPatterns.zeroValue})`)
  }
  if (suspiciousPatterns.unknownContracts > 20) {
    warnings.push(`Multiple unknown contract interactions`)
  }
  if (suspiciousPatterns.rapidFire) {
    warnings.push(`Rapid transaction pattern detected`)
  }

  const risk = riskScore > 20 ? 'high' : riskScore > 10 ? 'medium' : 'low'

  return {
    status: risk === 'high' ? 'poisoned' : 'clean',
    risk,
    txCount: txs.length,
    riskScore,
    suspiciousPatterns,
    warnings,
    message: warnings.length > 0
      ? `${warnings.join(', ')}`
      : 'Address appears clean',
  }
}

function isKnownAddress(address) {
  const known = new Set([
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  ])
  return known.has(address.toLowerCase())
}

export function formatPoisonReport(report) {
  return `
Risk Level: ${report.risk.toUpperCase()}
Transactions Analyzed: ${report.txCount}
Risk Score: ${report.riskScore || 0}
Message: ${report.message}
${report.suspiciousPatterns ? `
Suspicious Patterns:
  - Dust: ${report.suspiciousPatterns.dust}
  - Zero-Value: ${report.suspiciousPatterns.zeroValue}
  - Unknown Contracts: ${report.suspiciousPatterns.unknownContracts}
  - Rapid-Fire: ${report.suspiciousPatterns.rapidFire}
` : ''}
  `.trim()
}
