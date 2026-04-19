import { describe, it, expect } from 'vitest'
import { generateAddressForChain, validateAddressForChain, matchesPatternForChain } from '../chainCrypto'
import { CHAINS } from '../chains'

/**
 * Known test vectors per chain.
 * Each uses a deterministic private key so the expected address is stable.
 */
const TEST_PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000001'

describe('chainCrypto — multi-chain address derivation', () => {
  describe('Ethereum', () => {
    it('derives a valid checksummed 0x address', async () => {
      const result = await generateAddressForChain(CHAINS.ethereum, TEST_PRIVATE_KEY)
      expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(validateAddressForChain(result.address, 'ethereum').valid).toBe(true)
    })

    it('derives the known address for private key 1', async () => {
      const result = await generateAddressForChain(CHAINS.ethereum, TEST_PRIVATE_KEY)
      // secp256k1 private key 1 => well-known Ethereum address
      expect(result.address.toLowerCase()).toBe('0x7e5f4552091a69125d5dfcb7b8c2659029395bdf')
    })
  })

  describe('Solana', () => {
    it('derives a valid base58 address (32-byte pubkey)', async () => {
      const result = await generateAddressForChain(CHAINS.solana, TEST_PRIVATE_KEY)
      // Solana addresses are base58-encoded 32-byte ed25519 public keys
      expect(result.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
      expect(validateAddressForChain(result.address, 'solana').valid).toBe(true)
    })
  })

  describe('Bitcoin', () => {
    it('derives a valid P2PKH address starting with 1', async () => {
      const result = await generateAddressForChain(CHAINS.bitcoin, TEST_PRIVATE_KEY)
      expect(result.address).toMatch(/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/)
      expect(validateAddressForChain(result.address, 'bitcoin').valid).toBe(true)
    })

    it('passes base58check validation', async () => {
      const result = await generateAddressForChain(CHAINS.bitcoin, TEST_PRIVATE_KEY)
      const validation = validateAddressForChain(result.address, 'bitcoin')
      expect(validation.valid).toBe(true)
    })
  })

  describe('Sui', () => {
    it('derives a valid 0x + 64-char hex address', async () => {
      const result = await generateAddressForChain(CHAINS.sui, TEST_PRIVATE_KEY)
      expect(result.address).toMatch(/^0x[0-9a-f]{64}$/)
      expect(validateAddressForChain(result.address, 'sui').valid).toBe(true)
    })
  })

  describe('Cosmos', () => {
    it('derives a valid bech32 cosmos1... address', async () => {
      const result = await generateAddressForChain(CHAINS.cosmos, TEST_PRIVATE_KEY)
      expect(result.address).toMatch(/^cosmos1[a-z0-9]{38}$/)
      expect(validateAddressForChain(result.address, 'cosmos').valid).toBe(true)
    })
  })

  describe('Aptos', () => {
    it('derives a valid 0x + 64-char hex address', async () => {
      const result = await generateAddressForChain(CHAINS.aptos, TEST_PRIVATE_KEY)
      expect(result.address).toMatch(/^0x[0-9a-f]{64}$/)
      expect(validateAddressForChain(result.address, 'aptos').valid).toBe(true)
    })
  })
})

describe('validateAddressForChain', () => {
  it('rejects invalid Ethereum address', () => {
    expect(validateAddressForChain('0x123', 'ethereum').valid).toBe(false)
  })
  it('rejects invalid Solana address', () => {
    expect(validateAddressForChain('not-base58!!!', 'solana').valid).toBe(false)
  })
  it('rejects invalid Bitcoin address (bad checksum)', () => {
    expect(validateAddressForChain('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfXx', 'bitcoin').valid).toBe(false)
  })
  it('returns error for unknown chain', () => {
    expect(validateAddressForChain('anything', 'dogecoin').valid).toBe(false)
  })
})

describe('matchesPatternForChain', () => {
  it('matches hex prefix on Ethereum', () => {
    const addr = '0xDeadBeef0000000000000000000000000000CAFE'
    expect(matchesPatternForChain(addr, CHAINS.ethereum, 'dead', '')).toBe(true)
    expect(matchesPatternForChain(addr, CHAINS.ethereum, '', 'cafe')).toBe(true)
  })

  it('matches bech32 suffix on Cosmos', () => {
    const addr = 'cosmos1qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5abcde'
    expect(matchesPatternForChain(addr, CHAINS.cosmos, 'qypq', '')).toBe(true)
    expect(matchesPatternForChain(addr, CHAINS.cosmos, '', 'abcde')).toBe(true)
  })
})
