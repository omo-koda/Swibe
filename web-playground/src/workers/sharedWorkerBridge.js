/**
 * SharedArrayBuffer bridge for high-performance worker communication.
 *
 * Uses SharedArrayBuffer when available (requires HTTPS + COOP/COEP headers):
 *   Cross-Origin-Opener-Policy: same-origin
 *   Cross-Origin-Embedder-Policy: require-corp
 *
 * Falls back to standard postMessage when SharedArrayBuffer is unavailable.
 *
 * Layout of the shared buffer (Int32Array view):
 *   [0]  = control flag (0 = idle, 1 = running, 2 = stop requested)
 *   [1]  = total attempts (written by workers, read by main)
 *   [2]  = total found    (written by workers, read by main)
 *   [3]  = speed estimate  (addr/s, written by workers)
 */

const CONTROL_OFFSET = 0
const ATTEMPTS_OFFSET = 1
const FOUND_OFFSET = 2
const SPEED_OFFSET = 3
const BUFFER_SIZE = 4 // Int32 slots

const FLAG_IDLE = 0
const FLAG_RUNNING = 1
const FLAG_STOP = 2

export function isSharedArrayBufferAvailable() {
  try {
    return typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Create a shared stats buffer for workers.
 * @returns {{ buffer: SharedArrayBuffer, view: Int32Array } | null}
 */
export function createSharedStats() {
  if (!isSharedArrayBufferAvailable()) return null
  const buffer = new SharedArrayBuffer(BUFFER_SIZE * Int32Array.BYTES_PER_ELEMENT)
  const view = new Int32Array(buffer)
  Atomics.store(view, CONTROL_OFFSET, FLAG_IDLE)
  return { buffer, view }
}

/**
 * Read stats from the shared buffer (main thread).
 * @param {Int32Array} view
 * @returns {{ running: boolean, attempts: number, found: number, speed: number }}
 */
export function readSharedStats(view) {
  return {
    running: Atomics.load(view, CONTROL_OFFSET) === FLAG_RUNNING,
    attempts: Atomics.load(view, ATTEMPTS_OFFSET),
    found: Atomics.load(view, FOUND_OFFSET),
    speed: Atomics.load(view, SPEED_OFFSET),
  }
}

/**
 * Signal workers to start (main thread).
 * @param {Int32Array} view
 */
export function signalStart(view) {
  Atomics.store(view, CONTROL_OFFSET, FLAG_RUNNING)
  Atomics.store(view, ATTEMPTS_OFFSET, 0)
  Atomics.store(view, FOUND_OFFSET, 0)
  Atomics.store(view, SPEED_OFFSET, 0)
}

/**
 * Signal workers to stop (main thread).
 * @param {Int32Array} view
 */
export function signalStop(view) {
  Atomics.store(view, CONTROL_OFFSET, FLAG_STOP)
}

// ── Worker-side helpers (imported inside the worker) ──

/**
 * Check if main thread requested stop (worker side).
 * @param {Int32Array} view
 * @returns {boolean}
 */
export function shouldStop(view) {
  return Atomics.load(view, CONTROL_OFFSET) === FLAG_STOP
}

/**
 * Atomically increment the shared attempts counter (worker side).
 * @param {Int32Array} view
 * @param {number} delta
 */
export function addAttempts(view, delta) {
  Atomics.add(view, ATTEMPTS_OFFSET, delta)
}

/**
 * Atomically increment the shared found counter (worker side).
 * @param {Int32Array} view
 */
export function addFound(view) {
  Atomics.add(view, FOUND_OFFSET, 1)
}

/**
 * Update speed estimate (worker side — last writer wins, no atomics needed).
 * @param {Int32Array} view
 * @param {number} speed
 */
export function updateSpeed(view, speed) {
  Atomics.store(view, SPEED_OFFSET, Math.round(speed))
}
