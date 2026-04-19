import { describe, it, expect } from 'vitest'
import {
  generatePrivateKey,
  getPublicKey,
  getAddressFromPublicKey,
  generateAddress,
  toChecksumAddress,
  matchesPattern,
  isValidAddress,
  calculateDifficulty,
  formatTimeEstimate,
  sanitizePattern,
  validatePatternInputs,
} from '../crypto'

// ── Known test vector (Ethereum) ──
// Private key from the well-known "test" vector
const TEST_PRIVATE_KEY = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat account #0

describe('crypto.ts', () => {
  describe('generatePrivateKey', () => {
    it('returns a 64-char hex string', () => {
      const key = generatePrivateKey()
      expect(key).toMatch(/^[0-9a-f]{64}$/)
    })

    it('generates unique keys', () => {
      const keys = new Set(Array.from({ length: 100 }, () => generatePrivateKey()))
      expect(keys.size).toBe(100)
    })
  })

  describe('getPublicKey', () => {
    it('returns an uncompressed public key (130 hex chars, 04 prefix)', () => {
      const pubKey = getPublicKey(TEST_PRIVATE_KEY)
      expect(pubKey).toMatch(/^04[0-9a-f]{128}$/)
    })
  })

  describe('getAddressFromPublicKey', () => {
    it('derives the correct checksummed address from a known key', () => {
      const pubKey = getPublicKey(TEST_PRIVATE_KEY)
      const address = getAddressFromPublicKey(pubKey)
      expect(address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase())
    })
  })

  describe('generateAddress', () => {
    it('returns matching address, privateKey, and publicKey', () => {
      const result = generateAddress(TEST_PRIVATE_KEY)
      expect(result.privateKey).toBe(TEST_PRIVATE_KEY)
      expect(result.address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase())
      expect(result.publicKey).toMatch(/^04/)
    })
  })

  describe('toChecksumAddress (EIP-55)', () => {
    it('correctly checksums a known address', () => {
      // Known EIP-55 test vectors
      const vectors = [
        ['0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'],
        ['0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359', '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'],
      ]
      for (const [input, expected] of vectors) {
        expect(toChecksumAddress(input)).toBe(expected)
      }
    })

    it('is idempotent', () => {
      const addr = toChecksumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')
      expect(toChecksumAddress(addr)).toBe(addr)
    })
  })

  describe('matchesPattern', () => {
    const addr = '0xDeadBeefCafe1234567890abcdef1234567890ab'

    it('matches a correct prefix (case-insensitive)', () => {
      expect(matchesPattern(addr, 'dead', '', false)).toBe(true)
      expect(matchesPattern(addr, 'DEAD', '', false)).toBe(true)
    })

    it('matches a correct suffix (case-insensitive)', () => {
      expect(matchesPattern(addr, '', '90ab', false)).toBe(true)
    })

    it('matches prefix + suffix together', () => {
      expect(matchesPattern(addr, 'dead', '90ab', false)).toBe(true)
    })

    it('rejects a wrong prefix', () => {
      expect(matchesPattern(addr, 'ffff', '', false)).toBe(false)
    })

    it('rejects a wrong suffix', () => {
      expect(matchesPattern(addr, '', 'ffff', false)).toBe(false)
    })

    it('case-sensitive mode rejects wrong case', () => {
      expect(matchesPattern(addr, 'dead', '', true)).toBe(false) // actual is 'Dead'
      expect(matchesPattern(addr, 'Dead', '', true)).toBe(true)
    })

    it('rejects addresses that are not 42 chars', () => {
      expect(matchesPattern('0x1234', 'dead', '', false)).toBe(false)
      expect(matchesPattern('', 'dead', '', false)).toBe(false)
      expect(matchesPattern(null as any, 'dead', '', false)).toBe(false)
    })

    it('empty prefix/suffix matches everything', () => {
      expect(matchesPattern(addr, '', '', false)).toBe(true)
    })
  })

  describe('isValidAddress', () => {
    it('accepts valid addresses', () => {
      expect(isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true)
    })
    it('rejects invalid addresses', () => {
      expect(isValidAddress('0x123')).toBe(false)
      expect(isValidAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false)
      expect(isValidAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false)
    })
  })

  describe('calculateDifficulty', () => {
    it('returns 1 * ln(2) for empty pattern', () => {
      expect(calculateDifficulty('', '')).toBeCloseTo(Math.log(2))
    })
    it('returns 16^n * ln(2) for n-char pattern', () => {
      expect(calculateDifficulty('ab', '')).toBeCloseTo(Math.log(2) * 256)
      expect(calculateDifficulty('a', 'b')).toBeCloseTo(Math.log(2) * 256)
    })
  })

  describe('formatTimeEstimate', () => {
    it('formats seconds', () => {
      expect(formatTimeEstimate(50, 100)).toBe('0.5s')
    })
    it('formats minutes', () => {
      expect(formatTimeEstimate(6000, 100)).toBe('1.0m')
    })
    it('formats hours', () => {
      expect(formatTimeEstimate(360000, 100)).toBe('1.0h')
    })
    it('formats days', () => {
      expect(formatTimeEstimate(8640000, 100)).toBe('1.0d')
    })
  })

  describe('sanitizePattern', () => {
    it('accepts valid hex', () => {
      expect(sanitizePattern('deadBEEF')).toEqual({ valid: true, sanitized: 'deadBEEF' })
    })
    it('accepts empty', () => {
      expect(sanitizePattern('')).toEqual({ valid: true, sanitized: '' })
    })
    it('rejects non-hex', () => {
      const result = sanitizePattern('xyz')
      expect(result.valid).toBe(false)
    })
    it('rejects over 10 chars', () => {
      const result = sanitizePattern('12345678901')
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePatternInputs', () => {
    it('rejects combined > 10', () => {
      const result = validatePatternInputs('123456', '12345')
      expect(result.valid).toBe(false)
    })
    it('accepts combined <= 10', () => {
      const result = validatePatternInputs('12345', '12345')
      expect(result.valid).toBe(true)
    })
  })
})
