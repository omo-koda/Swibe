import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import { CHAINS } from './chains'

/**
 * HD Wallet generator - BIP-32/BIP-44
 * Create seed phrases and derive child wallets
 */

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateSeedPhrase() {
  const entropy = crypto.getRandomValues(new Uint8Array(32))
  const hexEntropy = bytesToHex(entropy)
  const mnemonic = bip39.entropyToMnemonic(hexEntropy)
  return mnemonic
}

export async function mnemonicToSeed(mnemonic) {
  return await bip39.mnemonicToSeed(mnemonic)
}

export function deriveFromSeed(seed, chainId = 'ethereum') {
  const chain = CHAINS[chainId] || CHAINS.ethereum
  const root = bip32.fromSeed(seed)
  
  // BIP44 derivation path: m/44'/coin_type'/account'/change/address_index
  // We'll use m/44'/coin'/0'/0/0 for the first address
  const path = chain.bip44
  const child = root.derivePath(path)
  
  return {
    privateKey: bytesToHex(child.privateKey),
    publicKey: bytesToHex(child.publicKey),
    path,
    chainId,
  }
}

export function getAllDerivations(seed) {
  /**
   * Derive first address for all supported chains from single seed
   */
  const chains = Object.keys(CHAINS)
  const derivations = {}
  
  for (const chainId of chains) {
    try {
      derivations[chainId] = deriveFromSeed(seed, chainId)
    } catch (e) {
      console.error(`Failed to derive ${chainId}:`, e)
    }
  }
  
  return derivations
}

export function validateMnemonic(mnemonic) {
  return bip39.validateMnemonic(mnemonic)
}

export function mnemonicToEntropy(mnemonic) {
  return bip39.mnemonicToEntropy(mnemonic)
}

export const WORDLIST = bip39.wordlists.EN
