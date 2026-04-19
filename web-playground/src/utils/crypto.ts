import * as secp256k1 from '@noble/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'
import type { GeneratedAddress, PatternValidation, PatternInputsValidation } from './types'

// ── Constants ──

const MAX_PATTERN_LENGTH = 10
const HEX_PATTERN = /^[0-9a-fA-F]*$/

// ── Helpers ──

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace('0x', '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < h.length; i += 2) {
    bytes[i / 2] = parseInt(h.substr(i, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Input sanitization ──

export function sanitizePattern(pattern: string): PatternValidation {
  if (!pattern || pattern.length === 0) {
    return { valid: true, sanitized: '' }
  }
  const trimmed = pattern.trim()
  if (trimmed.length > MAX_PATTERN_LENGTH) {
    return { valid: false, sanitized: '', error: `Pattern exceeds ${MAX_PATTERN_LENGTH} characters` }
  }
  if (!HEX_PATTERN.test(trimmed)) {
    return { valid: false, sanitized: '', error: 'Pattern must contain only hex characters (0-9, a-f)' }
  }
  return { valid: true, sanitized: trimmed }
}

export function validatePatternInputs(prefix: string, suffix: string): PatternInputsValidation {
  const p = sanitizePattern(prefix)
  if (!p.valid) return { valid: false, prefix: '', suffix: '', error: `Prefix: ${p.error}` }
  const s = sanitizePattern(suffix)
  if (!s.valid) return { valid: false, prefix: '', suffix: '', error: `Suffix: ${s.error}` }
  if (p.sanitized.length + s.sanitized.length > MAX_PATTERN_LENGTH) {
    return { valid: false, prefix: '', suffix: '', error: `Combined pattern exceeds ${MAX_PATTERN_LENGTH} characters` }
  }
  return { valid: true, prefix: p.sanitized, suffix: s.sanitized }
}

// ── Key generation ──

export function generatePrivateKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return bytesToHex(randomBytes)
}

export function getPublicKey(privateKey: string): string {
  const privateKeyBytes = hexToBytes(privateKey)
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
  return bytesToHex(publicKeyBytes)
}

export function getAddressFromPublicKey(publicKey: string): string {
  const publicKeyBytes = hexToBytes(publicKey.slice(2))
  const hash = keccak_256(publicKeyBytes)
  const address = '0x' + bytesToHex(hash).slice(-40)
  return toChecksumAddress(address)
}

export function generateAddress(privateKey: string): GeneratedAddress {
  const publicKey = getPublicKey(privateKey)
  const address = getAddressFromPublicKey(publicKey)
  return { address, privateKey, publicKey }
}

export function toChecksumAddress(address: string): string {
  const addr = address.toLowerCase().slice(2)
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr)))
  let checksum = '0x'
  for (let i = 0; i < addr.length; i++) {
    checksum += parseInt(hash[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i]
  }
  return checksum
}

export function matchesPattern(
  address: string,
  prefix: string,
  suffix: string,
  caseSensitive: boolean = false
): boolean {
  if (!address || address.length !== 42) return false
  let addr = address.slice(2)

  if (!caseSensitive) {
    addr = addr.toLowerCase()
    prefix = (prefix || '').toLowerCase()
    suffix = (suffix || '').toLowerCase()
  }

  if (prefix && addr.slice(0, prefix.length) !== prefix) return false
  if (suffix && addr.slice(-suffix.length) !== suffix) return false
  return true
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function calculateDifficulty(prefix: string, suffix: string): number {
  const totalChars = (prefix ? prefix.length : 0) + (suffix ? suffix.length : 0)
  return Math.log(2) * Math.pow(16, totalChars)
}

export function formatTimeEstimate(attempts: number, hashesPerSecond: number): string {
  const seconds = attempts / hashesPerSecond
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  if (minutes < 60) return `${minutes.toFixed(1)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${days.toFixed(1)}d`
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
