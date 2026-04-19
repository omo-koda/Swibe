/**
 * Shared type definitions for VanityCloakSeed
 */

// ── Chain types ──

export type CurveType = 'secp256k1' | 'ed25519'
export type HashType = 'keccak256' | 'sha256' | 'blake2b' | 'sha3'
export type ChainId = 'ethereum' | 'solana' | 'bitcoin' | 'sui' | 'cosmos' | 'aptos'

export interface Chain {
  id: ChainId
  name: string
  symbol: string
  curve: CurveType
  hash: HashType
  addressLength: number
  prefix: string
  icon: string
  bip44: string
  rpcs: string[]
  rpc: string // backward compat — always rpcs[0]
  explorerTx: string
}

// ── Wallet types ──

export interface KeyPair {
  privateKey: string
  publicKey: string
  privateKeyBytes?: Uint8Array
  publicKeyBytes?: Uint8Array
}

export interface GeneratedAddress extends KeyPair {
  address: string
}

export interface DerivedWallet {
  address: string
  publicKey: string
  privateKey?: string
  derivationPath: string
  mnemonic?: string
}

export interface MultiChainWallets {
  ethereum?: DerivedWallet
  bitcoin?: DerivedWallet
  solana?: DerivedWallet
  sui?: DerivedWallet
  cosmos?: DerivedWallet
  aptos?: DerivedWallet
}

// ── Cipher / CloakSeed types ──

export interface CipherMap {
  [word: string]: number
}

export interface CipherValidation {
  isValid: boolean
  error?: string
}

export interface CloakValidation {
  isValid: boolean
  matchCount: number
  totalWords: number
  confidence: number
}

export interface PanicPhrase {
  cloakPhrase: string
  seedPhrase: string
  entropy: string
}

export interface EncryptedCipherV2 {
  version: 2
  salt: string
  iv: string
  encrypted: string
}

// ── Profile / Batch types ──

export interface Profile {
  id: string
  name: string
  chain: ChainId
  prefix: string
  suffix: string
  caseSensitive: boolean
  created: number
  lastUsed: number
}

export type BatchStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface BatchJob {
  id: string
  profiles: Profile[]
  results: GeneratedAddress[]
  status: BatchStatus
  startTime: number
  endTime: number | null
  error?: string
}

// ── Poison Radar types ──

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'unknown'

export interface SuspiciousPatterns {
  dust: number
  zeroValue: number
  unknownContracts: number
  rapidFire: number
}

export interface PoisonReport {
  status: 'clean' | 'poisoned' | 'error'
  risk: RiskLevel
  txCount?: number
  riskScore?: number
  suspiciousPatterns?: SuspiciousPatterns
  warnings?: string[]
  message: string
}

// ── Validation types ──

export interface ValidationResult {
  valid: boolean
  error: string | null
}

export interface PatternValidation {
  valid: boolean
  sanitized: string
  error?: string
}

export interface PatternInputsValidation {
  valid: boolean
  prefix: string
  suffix: string
  error?: string
}

export interface Bip39WordlistValidation {
  valid: boolean
  error?: string
}

// ── Encryption types ──

export interface EncryptedPayload {
  data: string
  checksum: string
  format: string
}

export interface QRPayload {
  data: string
  hash: string
  timestamp: number
  ttl: number
}
