import { describe, it, expect } from 'vitest'
import {
  generateRandomSeed,
  validateSeedPhrase,
  isValidBip39Word,
  getBip39Wordlist,
  suggestWords,
} from '../bip39Helper'

const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('bip39Helper.ts', () => {
  describe('generateRandomSeed', () => {
    it('generates a valid 12-word seed', () => {
      const result = generateRandomSeed(12)
      expect(result.wordCount).toBe(12)
      expect(result.seedPhrase.split(' ').length).toBe(12)
      expect(result.entropy).toMatch(/^[0-9a-f]+$/)
      expect(validateSeedPhrase(result.seedPhrase)).toBe(true)
    })

    it('generates a valid 24-word seed', () => {
      const result = generateRandomSeed(24)
      expect(result.wordCount).toBe(24)
      expect(result.seedPhrase.split(' ').length).toBe(24)
      expect(validateSeedPhrase(result.seedPhrase)).toBe(true)
    })

    it('seeds are unique', () => {
      const a = generateRandomSeed(12)
      const b = generateRandomSeed(12)
      expect(a.seedPhrase).not.toBe(b.seedPhrase)
    })
  })

  describe('validateSeedPhrase', () => {
    it('accepts a valid 12-word mnemonic', () => {
      expect(validateSeedPhrase(VALID_MNEMONIC)).toBe(true)
    })

    it('rejects an invalid checksum', () => {
      // Replace last word to break checksum
      expect(validateSeedPhrase('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon')).toBe(false)
    })

    it('rejects wrong word count', () => {
      expect(validateSeedPhrase('abandon abandon abandon')).toBe(false)
    })

    it('rejects non-BIP39 words', () => {
      expect(validateSeedPhrase('xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy xyzzy')).toBe(false)
    })

    it('rejects empty/null/undefined', () => {
      expect(validateSeedPhrase('')).toBe(false)
      expect(validateSeedPhrase(null as any)).toBe(false)
      expect(validateSeedPhrase(undefined as any)).toBe(false)
    })
  })

  describe('isValidBip39Word', () => {
    it('accepts valid BIP-39 words', () => {
      expect(isValidBip39Word('abandon')).toBe(true)
      expect(isValidBip39Word('zoo')).toBe(true)
    })

    it('rejects non-BIP-39 words', () => {
      expect(isValidBip39Word('xyzzy')).toBe(false)
    })
  })

  describe('getBip39Wordlist', () => {
    it('returns exactly 2048 words', () => {
      expect(getBip39Wordlist().length).toBe(2048)
    })

    it('first word is abandon, last is zoo', () => {
      const list = getBip39Wordlist()
      expect(list[0]).toBe('abandon')
      expect(list[2047]).toBe('zoo')
    })
  })

  describe('suggestWords', () => {
    it('returns matching completions', () => {
      const results = suggestWords('aban')
      expect(results).toContain('abandon')
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('returns empty for no match', () => {
      expect(suggestWords('xyzzy')).toEqual([])
    })
  })
})
