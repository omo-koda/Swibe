/**
 * Web Worker for parallel address generation
 * Offloads CPU-intensive generation to background thread
 */

import { generatePrivateKey, getPublicKey, getAddressFromPublicKey, matchesPattern } from '../utils/crypto'

let isRunning = false

self.onmessage = async (event) => {
  const { action, payload } = event.data

  if (action === 'start') {
    await startGeneration(payload)
  } else if (action === 'stop') {
    isRunning = false
  }
}

/**
 * Main generation loop
 */
async function startGeneration(payload) {
  const { workerId, prefix, suffix, caseSensitive, maxResults } = payload
  
  isRunning = true
  let found = 0
  let attempts = 0
  const startTime = Date.now()
  const results = []

  while (isRunning && found < maxResults) {
    try {
      // Generate random private key
      const privateKey = generatePrivateKey()
      
      // Derive public key
      const publicKey = getPublicKey(privateKey)
      
      // Derive address
      const address = getAddressFromPublicKey(publicKey)
      
      // Check if matches pattern
      if (matchesPattern(address, prefix, suffix, caseSensitive)) {
        results.push({ address, privateKey })
        found++

        // Send result immediately
        self.postMessage({
          type: 'result',
          payload: { workerId, address, privateKey },
        })
      }

      attempts++

      // Send stats update every 10000 attempts (less UI overhead)
      if (attempts % 10000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000
        const speed = elapsed > 0 ? attempts / elapsed : 0

        self.postMessage({
          type: 'stats',
          payload: { workerId, attempts, speed, found },
        })
      }
    } catch (error) {
      console.error(`Worker ${workerId} error:`, error)
      self.postMessage({
        type: 'error',
        payload: { workerId, error: error.message },
      })
    }
  }

  // Final stats
  const elapsed = (Date.now() - startTime) / 1000
  self.postMessage({
    type: 'complete',
    payload: {
      workerId,
      attempts,
      found,
      elapsed,
      speed: elapsed > 0 ? attempts / elapsed : 0,
    },
  })
}
