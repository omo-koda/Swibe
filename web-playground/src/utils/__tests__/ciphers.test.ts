import { describe, it, expect } from 'vitest'
import * as bip39 from 'bip39'
import {
  validateBip39Wordlist,
  encodePhrase,
  decodePhrase,
  validateCipher,
  hashCipher,
  generatePanicPhrase,
  validateCloak,
  exportCipherEncrypted,
  importCipherEncrypted,
} from '../ciphers'

// Build a valid test cipher: just reverse the BIP-39 wordlist
const BIP39_WORDS = bip39.wordlists.EN
const REVERSED_CIPHER = [...BIP39_WORDS].reverse()

// Known valid 12-word mnemonic
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('ciphers.ts', () => {
  describe('validateBip39Wordlist', () => {
    it('validates the loaded wordlist', () => {
      const result = validateBip39Wordlist()
      if (!result.valid) console.log('BIP-39 Error:', result.error)
      expect(result.valid).toBe(true)
    })
  })

  describe('encodePhrase / decodePhrase roundtrip', () => {
    it('encode then decode returns the original mnemonic', () => {
      const encoded = encodePhrase(TEST_MNEMONIC, REVERSED_CIPHER)
      expect(encoded).not.toBe(TEST_MNEMONIC)

      const decoded = decodePhrase(encoded, REVERSED_CIPHER)
      expect(decoded).toBe(TEST_MNEMONIC)
    })

    it('encoded words come from the cipher, not BIP-39', () => {
      const encoded = encodePhrase(TEST_MNEMONIC, REVERSED_CIPHER)
      const encodedWords = encoded.split(' ')
      // "abandon" is index 0 in BIP-39, so reversed cipher word at index 0 = "zoo"
      // (BIP39[0] = "abandon", reversed[0] = BIP39[2047] = "zoo")
      expect(encodedWords[0]).toBe('zoo')
    })
  })

  describe('encodePhrase — input validation', () => {
    it('throws on invalid mnemonic', () => {
      expect(() => encodePhrase('not a valid mnemonic phrase at all', REVERSED_CIPHER)).toThrow('Invalid BIP-39')
    })

    it('throws if cipher is wrong length', () => {
      expect(() => encodePhrase(TEST_MNEMONIC, ['only', 'two'])).toThrow('2048')
    })
  })

  describe('decodePhrase — input validation', () => {
    it('throws on unknown cloak word', () => {
      expect(() => decodePhrase('xyzzy unknown words here test one two three four five six seven eight', REVERSED_CIPHER)).toThrow('not found in cipher')
    })
  })

  describe('validateCipher', () => {
    it('accepts a valid 2048-word cipher', () => {
      expect(validateCipher(REVERSED_CIPHER).isValid).toBe(true)
    })

    it('rejects wrong length', () => {
      expect(validateCipher(['word']).isValid).toBe(false)
    })

    it('rejects duplicates', () => {
      const duped = Array(2048).fill('same')
      expect(validateCipher(duped).isValid).toBe(false)
    })

    it('rejects empty strings', () => {
      const withEmpty = [...REVERSED_CIPHER]
      withEmpty[500] = ''
      expect(validateCipher(withEmpty).isValid).toBe(false)
    })
  })

  describe('hashCipher', () => {
    it('returns a hex string', () => {
      const hash = hashCipher(REVERSED_CIPHER)
      expect(hash).toMatch(/^[0-9a-f]+$/)
    })

    it('is deterministic', () => {
      expect(hashCipher(REVERSED_CIPHER)).toBe(hashCipher(REVERSED_CIPHER))
    })

    it('changes when cipher changes', () => {
      const altered = [...REVERSED_CIPHER]
      altered[0] = 'zzzzchanged'
      expect(hashCipher(altered)).not.toBe(hashCipher(REVERSED_CIPHER))
    })
  })

  describe('generatePanicPhrase', () => {
    it('returns a valid BIP-39 seed and matching cloak', () => {
      const panic = generatePanicPhrase(REVERSED_CIPHER)
      expect(bip39.validateMnemonic(panic.seedPhrase)).toBe(true)
      expect(panic.cloakPhrase.split(' ').length).toBe(12)
      expect(panic.entropy).toMatch(/^[0-9a-f]{32}$/)
    })

    it('cloak decodes back to the panic seed', () => {
      const panic = generatePanicPhrase(REVERSED_CIPHER)
      const decoded = decodePhrase(panic.cloakPhrase, REVERSED_CIPHER)
      expect(decoded).toBe(panic.seedPhrase)
    })
  })

  describe('validateCloak', () => {
    it('validates a correct cloak phrase', () => {
      const encoded = encodePhrase(TEST_MNEMONIC, REVERSED_CIPHER)
      const result = validateCloak(encoded, REVERSED_CIPHER)
      expect(result.isValid).toBe(true)
      expect(result.confidence).toBe(100)
    })

    it('rejects words not in cipher', () => {
      const result = validateCloak('xyzzy bogus words here one two three four five six seven eight', REVERSED_CIPHER)
      expect(result.isValid).toBe(false)
    })
  })

  describe('exportCipherEncrypted / importCipherEncrypted', () => {
    it('roundtrip encrypt/decrypt preserves the cipher', async () => {
      const password = 'test-password-123'
      const exported = await exportCipherEncrypted(REVERSED_CIPHER, password)

      // Should be a valid JSON string with version 2
      const parsed = JSON.parse(exported)
      expect(parsed.version).toBe(2)
      expect(parsed.salt).toBeDefined()
      expect(parsed.iv).toBeDefined()
      expect(parsed.encrypted).toBeDefined()

      const imported = await importCipherEncrypted(exported, password)
      expect(imported).toEqual(REVERSED_CIPHER)
    })

    it('fails with wrong password', async () => {
      const exported = await exportCipherEncrypted(REVERSED_CIPHER, 'correct')
      await expect(importCipherEncrypted(exported, 'wrong')).rejects.toThrow()
    })
  })
})
