import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import { CHAINS } from './chains'
import type { ChainId } from './types'

interface DerivedKey {
  privateKey: string
  publicKey: string
  path: string
  chainId: string
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateSeedPhrase(): Promise<string> {
  const entropy = crypto.getRandomValues(new Uint8Array(32))
  const hexEntropy = bytesToHex(entropy)
  return bip39.entropyToMnemonic(hexEntropy)
}

export async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  const seed = await bip39.mnemonicToSeed(mnemonic)
  return new Uint8Array(seed)
}

export function deriveFromSeed(seed: Uint8Array, chainId: ChainId = 'ethereum'): DerivedKey {
  const chain = CHAINS[chainId] || CHAINS.ethereum
  const root = bip32.fromSeed(seed as any) // bip32 expects seed as Uint8Array compatible type
  const path = chain.bip44
  const child = root.derivePath(path)
  return {
    privateKey: bytesToHex(child.privateKey!),
    publicKey: bytesToHex(child.publicKey),
    path,
    chainId,
  }
}

export function getAllDerivations(seed: Uint8Array): Record<string, DerivedKey> {
  const derivations: Record<string, DerivedKey> = {}
  for (const chainId of Object.keys(CHAINS) as ChainId[]) {
    try {
      derivations[chainId] = deriveFromSeed(seed, chainId)
    } catch (e) {
      console.error(`Failed to derive ${chainId}:`, e)
    }
  }
  return derivations
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic)
}

export function mnemonicToEntropy(mnemonic: string): string {
  return bip39.mnemonicToEntropy(mnemonic)
}

export const WORDLIST: string[] = bip39.wordlists.EN
