import { keccak_256 } from '@noble/hashes/sha3'
import { toChecksumAddress } from './crypto'

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace('0x', '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < h.length; i += 2) {
    bytes[i / 2] = parseInt(h.substr(i, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length }
  return result
}

function normalizeBytesInput(input: string, expectedLength: number | null = null): Uint8Array {
  const hex = input.startsWith('0x') ? input.slice(2) : input
  const padded = expectedLength && hex.length < expectedLength * 2
    ? hex.padStart(expectedLength * 2, '0')
    : hex
  return hexToBytes(padded)
}

export interface Create2Result {
  salt: string
  address: string
  attempts: number
}

export function calculateCreate2Address(deployer: string, salt: string, bytecode: string): string {
  const deployerBytes = hexToBytes(deployer.slice(2))
  const saltBytes = normalizeBytesInput(salt, 32)
  const bytecodeBytes = normalizeBytesInput(bytecode)
  const initCodeHash = keccak_256(bytecodeBytes)
  const input = concatBytes(new Uint8Array([0xff]), deployerBytes, saltBytes, initCodeHash)
  const address = bytesToHex(keccak_256(input))
  return toChecksumAddress('0x' + address.slice(-40))
}

export async function findVanitySalt(
  deployer: string, bytecode: string, pattern: string, maxAttempts: number = 1_000_000,
): Promise<Create2Result> {
  const patternLower = pattern.toLowerCase()
  let attempts = 0

  while (attempts < maxAttempts) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(32))
    const salt = '0x' + bytesToHex(saltBytes)
    try {
      const address = calculateCreate2Address(deployer, salt, bytecode)
      if (address.slice(2).toLowerCase().includes(patternLower)) {
        return { salt, address, attempts }
      }
    } catch { /* skip */ }
    attempts++
    if (attempts % 10_000 === 0) await new Promise(resolve => setTimeout(resolve, 0))
  }

  throw new Error(`Failed to find vanity salt after ${maxAttempts} attempts`)
}

export function calculateCreateAddress(deployer: string, nonce: string): string {
  const deployerBytes = hexToBytes(deployer.slice(2))
  const nonceNum = parseInt(nonce)

  let nonceRlp: Uint8Array
  if (nonceNum === 0) {
    nonceRlp = new Uint8Array([0x80])
  } else if (nonceNum < 128) {
    nonceRlp = new Uint8Array([nonceNum])
  } else {
    const nonceHex = nonceNum.toString(16)
    const padded = nonceHex.padStart(nonceHex.length % 2 ? nonceHex.length + 1 : nonceHex.length, '0')
    const nonceBytes = hexToBytes(padded)
    nonceRlp = new Uint8Array([0x80 + nonceBytes.length, ...nonceBytes])
  }

  const addressRlp = new Uint8Array([0x94, ...deployerBytes])
  const combined = concatBytes(addressRlp, nonceRlp)

  let rlpEncoded: Uint8Array
  if (combined.length < 56) {
    rlpEncoded = new Uint8Array([0xc0 + combined.length, ...combined])
  } else {
    const lengthHex = combined.length.toString(16)
    const padded = lengthHex.padStart(lengthHex.length % 2 ? lengthHex.length + 1 : lengthHex.length, '0')
    const lengthBytes = hexToBytes(padded)
    rlpEncoded = concatBytes(new Uint8Array([0xf7 + lengthBytes.length]), lengthBytes, combined)
  }

  const hash = keccak_256(rlpEncoded)
  return toChecksumAddress('0x' + bytesToHex(hash).slice(-40))
}

export function getSampleBytecode(): string {
  return '0x60806040523660003760006000f3'
}
