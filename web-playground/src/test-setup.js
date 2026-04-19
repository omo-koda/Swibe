import { vi } from 'vitest'
import { etc } from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'
import * as nodeCrypto from 'node:crypto'

// Mock crypto if not present or incomplete
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  // @ts-ignore
  globalThis.crypto = nodeCrypto.webcrypto || nodeCrypto;
}

// Configure @noble/ed25519 to use @noble/hashes for sha512
// This is required in Node.js environments for version 2.x/3.x if WebCrypto is not used
try {
  if (etc && !etc.sha512Sync) {
    etc.sha512Sync = (...msgs) => sha512(etc.concatBytes(...msgs))
  }
  if (etc && !etc.sha512Async) {
    etc.sha512Async = (...msgs) => Promise.resolve(sha512(etc.concatBytes(...msgs)))
  }
} catch (e) {
  // Ignore if immutable
}

// Mock TextEncoder/TextDecoder if not present
if (typeof globalThis.TextEncoder === 'undefined') {
  const util = require('util')
  globalThis.TextEncoder = util.TextEncoder
  globalThis.TextDecoder = util.TextDecoder
}
