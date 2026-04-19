import * as secp256k1 from '@noble/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'

// ── Constants ──

const MAX_PATTERN_LENGTH = 10
const HEX_PATTERN = /^[0-9a-fA-F]*$/

// ── Helpers ──

function hexToBytes(hex) {
  const h = hex.replace('0x', '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < h.length; i += 2) {
    bytes[i / 2] = parseInt(h.substr(i, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Input sanitization ──

/**
 * Validate and sanitize a vanity pattern (prefix or suffix)
 * @param {string} pattern - Raw user input
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
export function sanitizePattern(pattern) {
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

/**
 * Validate both prefix and suffix together
 * @param {string} prefix
 * @param {string} suffix
 * @returns {{ valid: boolean, prefix: string, suffix: string, error?: string }}
 */
export function validatePatternInputs(prefix, suffix) {
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

/**
 * Generate a random private key using CSPRNG
 * @returns {string} 64-character hex string
 */
export function generatePrivateKey() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return bytesToHex(randomBytes)
}

/**
 * Derive public key from private key
 * @param {string} privateKey - 64-char hex string
 * @returns {string} 130-char hex string (uncompressed, with '04' prefix)
 */
export function getPublicKey(privateKey) {
  const privateKeyBytes = hexToBytes(privateKey)
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
  return bytesToHex(publicKeyBytes)
}

/**
 * Derive Ethereum address from public key
 * @param {string} publicKey - 130-char hex string (with '04' prefix)
 * @returns {string} 40-char hex string (checksum address)
 */
export function getAddressFromPublicKey(publicKey) {
  // Remove '04' prefix
  const publicKeyBytes = hexToBytes(publicKey.slice(2))
  // Hash with keccak256
  const hash = keccak_256(publicKeyBytes)
  // Take last 20 bytes (40 hex chars)
  const address = '0x' + bytesToHex(hash).slice(-40)
  return toChecksumAddress(address)
}

/**
 * Generate full address from private key
 * @param {string} privateKey - 64-char hex string
 * @returns {Object} { address, privateKey, publicKey }
 */
export function generateAddress(privateKey) {
  const publicKey = getPublicKey(privateKey)
  const address = getAddressFromPublicKey(publicKey)
  return { address, privateKey, publicKey }
}

/**
 * Convert address to EIP-55 checksum address
 * @param {string} address - 42-char hex string with '0x'
 * @returns {string} Checksummed address
 */
export function toChecksumAddress(address) {
  const addr = address.toLowerCase().slice(2)
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr)))

  let checksum = '0x'
  for (let i = 0; i < addr.length; i++) {
    const hashValue = parseInt(hash[i], 16)
    checksum += hashValue >= 8 ? addr[i].toUpperCase() : addr[i]
  }
  return checksum
}

/**
 * Check if address matches pattern (prefix and/or suffix)
 * Uses direct string comparison only — no regex, no ReDoS risk.
 * @param {string} address - 42-char checksummed address
 * @param {string} prefix - hex prefix (without '0x'), pre-sanitized
 * @param {string} suffix - hex suffix, pre-sanitized
 * @param {boolean} caseSensitive - whether to match case exactly
 * @returns {boolean}
 */
export function matchesPattern(address, prefix, suffix, caseSensitive = false) {
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

/**
 * Validate Ethereum address format
 * @param {string} address
 * @returns {boolean}
 */
export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Calculate expected attempts for pattern
 * @param {string} prefix
 * @param {string} suffix
 * @returns {number} Average attempts needed (50% probability)
 */
export function calculateDifficulty(prefix, suffix) {
  const prefixLength = prefix ? prefix.length : 0
  const suffixLength = suffix ? suffix.length : 0

  // Each hex character: 16 possibilities
  const totalChars = prefixLength + suffixLength
  const combinations = Math.pow(16, totalChars)

  // Average attempts for 50% probability
  return Math.log(2) * combinations
}

/**
 * Convert attempts to estimated time
 * @param {number} attempts
 * @param {number} hashesPerSecond
 * @returns {string} Human-readable time estimate
 */
export function formatTimeEstimate(attempts, hashesPerSecond) {
  const seconds = attempts / hashesPerSecond
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24

  if (seconds < 60) return `${seconds.toFixed(1)}s`
  if (minutes < 60) return `${minutes.toFixed(1)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${days.toFixed(1)}d`
}

/**
 * Format large numbers with commas
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
