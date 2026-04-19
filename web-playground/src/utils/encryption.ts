import type { EncryptedPayload, QRPayload } from './types'

/**
 * Zero-Knowledge Export - AES-GCM encryption
 */

export async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(privateKey))
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)
  return bytesToBase64(combined)
}

export async function decryptPrivateKey(encryptedData: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const combined = base64ToBytes(encryptedData)

  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ciphertext = combined.slice(28)

  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

export function generateOneTimeQR(privateKey: string): QRPayload {
  const timestamp = Date.now()
  const random = crypto.getRandomValues(new Uint8Array(8))
  const data = JSON.stringify({ pk: privateKey, ts: timestamp, nonce: bytesToHex(random) })
  return { data, hash: hashData(data), timestamp, ttl: 300_000 }
}

export function encryptWithChecksum(data: string, password: string): EncryptedPayload {
  const encoder = new TextEncoder()
  const encoded = btoa(data)
  const checksum = hashData(new TextDecoder().decode(encoder.encode(encoded + password)))
  return { data: encoded, checksum: checksum.substring(0, 16), format: 'base64-aes' }
}

export function verifyChecksum(payload: EncryptedPayload, password: string): boolean {
  const encoder = new TextEncoder()
  const expected = hashData(new TextDecoder().decode(encoder.encode(payload.data + password))).substring(0, 16)
  return expected === payload.checksum
}

interface KeystoreJSON {
  version: number
  id: string
  address: string
  crypto: {
    ciphertext: string
    cipherparams: { iv: string }
    cipher: string
    kdf: string
    kdfparams: { dkLen: number; salt: string; c: number; prf: string }
  }
  chain: string
}

export function generateKeystoreJSON(address: string, encryptedKey: string, chain: { id: string }): KeystoreJSON {
  const parts = encryptedKey.split('$')
  return {
    version: 3,
    id: generateUUID(),
    address: address.replace('0x', ''),
    crypto: {
      ciphertext: parts[0] || '',
      cipherparams: { iv: parts[1] || '' },
      cipher: 'aes-256-ctr',
      kdf: 'pbkdf2',
      kdfparams: { dkLen: 32, salt: parts[2] || '', c: 100_000, prf: 'hmac-sha256' },
    },
    chain: chain.id,
  }
}

// ── Internal helpers ──

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hashData(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
