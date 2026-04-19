import { validateAddressForChain } from './chainCrypto'
import { sha256 } from '@noble/hashes/sha256'
import type { Chain, PoisonReport, SuspiciousPatterns, RiskLevel } from './types'

// ── Cache (2-minute TTL) ──

interface CacheEntry { value: PoisonReport; ts: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 2 * 60 * 1000

function cacheGet(key: string): PoisonReport | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return undefined }
  return entry.value
}

function cacheSet(key: string, value: PoisonReport): void {
  cache.set(key, { value, ts: Date.now() })
}

// ── Rate limiter (10 req/min per chain) ──

const rateBuckets = new Map<string, number[]>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

function checkRateLimit(chainId: string): void {
  const now = Date.now()
  let bucket = rateBuckets.get(chainId)
  if (!bucket) { bucket = []; rateBuckets.set(chainId, bucket) }
  while (bucket.length > 0 && now - bucket[0] > RATE_WINDOW) bucket.shift()
  if (bucket.length >= RATE_LIMIT) {
    throw new Error(`Rate limit reached for ${chainId}. Retry in ${Math.ceil((RATE_WINDOW - (now - bucket[0])) / 1000)}s.`)
  }
  bucket.push(now)
}

// ── Fetch with timeout ──

const REQUEST_TIMEOUT = 5000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response
  } finally {
    clearTimeout(timer)
  }
}

// ── RPC rotation with exponential backoff ──

const MAX_RETRIES_PER_RPC = 2
const BASE_DELAY_MS = 500

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface RpcRequest { url: string; options: RequestInit }

async function rpcFetch(rpcs: string[], buildRequest: (rpc: string) => RpcRequest): Promise<Response> {
  let lastError: Error | undefined
  for (const rpc of rpcs) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_RPC; attempt++) {
      try {
        const { url, options } = buildRequest(rpc)
        return await fetchWithTimeout(url, options)
      } catch (err) {
        lastError = err as Error
        if (attempt < MAX_RETRIES_PER_RPC) {
          await delay(BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 200)
        }
      }
    }
  }
  throw new Error(`All RPC endpoints failed: ${lastError?.message || 'unknown error'}`)
}

// ── Chain-specific fetchers ──

interface TxRecord { value?: string; to?: string; input?: string }

async function fetchEthereumTxs(address: string, rpcs: string[]): Promise<TxRecord[]> {
  const response = await rpcFetch(rpcs, (rpc) => ({
    url: rpc,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }),
    },
  }))
  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result ? [{ value: data.result }] : []
}

async function fetchSolanaTxs(address: string, rpcs: string[]): Promise<TxRecord[]> {
  const response = await rpcFetch(rpcs, (rpc) => ({
    url: rpc,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'getSignaturesForAddress', params: [address, { limit: 10 }], id: 1 }),
    },
  }))
  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result || []
}

async function fetchBitcoinTxs(address: string, rpcs: string[]): Promise<TxRecord[]> {
  const response = await rpcFetch(rpcs, (rpc) => ({
    url: `${rpc}/address/${address}/txs`,
    options: { method: 'GET' },
  }))
  const txs = await response.json()
  return Array.isArray(txs) ? txs.slice(0, 100) : []
}

async function fetchRecentTransactions(address: string, chain: Chain): Promise<TxRecord[]> {
  switch (chain.id) {
    case 'ethereum': return fetchEthereumTxs(address, chain.rpcs)
    case 'solana':   return fetchSolanaTxs(address, chain.rpcs)
    case 'bitcoin':  return fetchBitcoinTxs(address, chain.rpcs)
    default:         return []
  }
}

// ── Public API ──

export async function analyzeAddress(address: string, chain: Chain): Promise<PoisonReport> {
  const validation = validateAddressForChain(address, chain.id)
  if (!validation.valid) {
    return { status: 'error', message: validation.error!, risk: 'unknown' }
  }
  try { checkRateLimit(chain.id) }
  catch (e) { return { status: 'error', message: (e as Error).message, risk: 'unknown' } }

  const cacheKey = `${chain.id}:${address}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    const txs = await fetchRecentTransactions(address, chain)
    const result = analyzeTransactions(txs, address)
    cacheSet(cacheKey, result)
    return result
  } catch (e) {
    return { status: 'error', message: (e as Error).message, risk: 'unknown' }
  }
}

function analyzeTransactions(txs: TxRecord[], _targetAddress: string): PoisonReport {
  if (!txs || txs.length === 0) {
    return { status: 'clean', risk: 'none', txCount: 0, warnings: [], message: 'No transactions found or new address' }
  }

  let riskScore = 0
  const warnings: string[] = []
  const suspiciousPatterns: SuspiciousPatterns = { dust: 0, zeroValue: 0, unknownContracts: 0, rapidFire: 0 }

  for (let i = 0; i < Math.min(txs.length, 100); i++) {
    const tx = txs[i]
    if (tx.value && BigInt(tx.value) > 0n && BigInt(tx.value) < BigInt('1000000000000000')) {
      suspiciousPatterns.dust++; riskScore += 1
    }
    if (tx.value === '0' || !tx.value) {
      suspiciousPatterns.zeroValue++
      if (tx.input && tx.input.length > 2) riskScore += 3
    }
    if (tx.to && !isKnownAddress(tx.to)) {
      suspiciousPatterns.unknownContracts++; riskScore += 2
    }
  }

  if (txs.length > 50) { suspiciousPatterns.rapidFire++; riskScore += 5 }
  if (suspiciousPatterns.dust > 5) warnings.push(`High dust activity (${suspiciousPatterns.dust} small transfers)`)
  if (suspiciousPatterns.zeroValue > 10) warnings.push(`Unusual zero-value transactions (${suspiciousPatterns.zeroValue})`)
  if (suspiciousPatterns.unknownContracts > 20) warnings.push(`Multiple unknown contract interactions`)
  if (suspiciousPatterns.rapidFire) warnings.push(`Rapid transaction pattern detected`)

  const risk: RiskLevel = riskScore > 20 ? 'high' : riskScore > 10 ? 'medium' : 'low'

  return {
    status: risk === 'high' ? 'poisoned' : 'clean',
    risk, txCount: txs.length, riskScore, suspiciousPatterns, warnings,
    message: warnings.length > 0 ? warnings.join(', ') : 'Address appears clean',
  }
}

const KNOWN_ADDRESSES = new Set([
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0x6b175474e89094c44da98b954eedeac495271d0f',
])

function isKnownAddress(address: string): boolean {
  return KNOWN_ADDRESSES.has(address.toLowerCase())
}

export function formatPoisonReport(report: PoisonReport): string {
  return `
Risk Level: ${report.risk.toUpperCase()}
Transactions Analyzed: ${report.txCount || 0}
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
