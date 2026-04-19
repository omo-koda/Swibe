import type { Profile, BatchJob, BatchStatus, ChainId } from './types'

/**
 * Encrypted profile & batch storage (AES-256-GCM)
 * Auto-locks after 5 minutes of inactivity.
 */

const STORAGE_KEY = 'vanity-profiles-v2'
const BATCH_QUEUE_KEY = 'vanity-batch-queue-v2'
const LOCK_TIMEOUT = 5 * 60 * 1000

// ── Secure memory helpers ──

export function secureWipe(buffer: Uint8Array): void {
  crypto.getRandomValues(buffer)
  buffer.fill(0)
}

export function wipeObject(obj: Record<string, unknown> | null): void {
  if (!obj || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    if (obj[key] instanceof Uint8Array) secureWipe(obj[key] as Uint8Array)
    obj[key] = null
  }
}

// ── AES-256-GCM ──

async function deriveKey(password: string, salt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  )
}

async function encryptData(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, 'encrypt')
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return JSON.stringify({ v: 2, s: bufToB64(salt), i: bufToB64(iv), d: bufToB64(new Uint8Array(ciphertext)) })
}

async function decryptData(stored: string, password: string): Promise<string> {
  const { v, s, i, d } = JSON.parse(stored)
  if (v !== 2) throw new Error('Unsupported storage version')
  const key = await deriveKey(password, b64ToBuf(s), 'decrypt')
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(i) }, key, b64ToBuf(d))
  return new TextDecoder().decode(plaintext)
}

function bufToB64(buf: Uint8Array): string {
  let s = ''; for (let i = 0; i < buf.byteLength; i++) s += String.fromCharCode(buf[i]); return btoa(s)
}
function b64ToBuf(b64: string): Uint8Array {
  const s = atob(b64); const buf = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i); return buf
}

// ── Session state (auto-lock) ──

let _sessionPassword: string | null = null
let _lockTimer: ReturnType<typeof setTimeout> | null = null

function resetLockTimer(): void {
  if (_lockTimer) clearTimeout(_lockTimer)
  _lockTimer = setTimeout(() => lock(), LOCK_TIMEOUT)
}

export function isUnlocked(): boolean { return _sessionPassword !== null }

export function unlock(password: string): void {
  _sessionPassword = password
  resetLockTimer()
}

export function lock(): void {
  _sessionPassword = null
  if (_lockTimer) { clearTimeout(_lockTimer); _lockTimer = null }
}

function requireUnlocked(): string {
  if (!_sessionPassword) throw new Error('Storage is locked. Call unlock(password) first.')
  resetLockTimer()
  return _sessionPassword
}

// ── Encrypted read / write ──

async function readStore<T>(storageKey: string): Promise<T[]> {
  const password = requireUnlocked()
  const raw = localStorage.getItem(storageKey)
  if (!raw) return []
  const json = await decryptData(raw, password)
  return JSON.parse(json) as T[]
}

async function writeStore<T>(storageKey: string, data: T[]): Promise<void> {
  const password = requireUnlocked()
  localStorage.setItem(storageKey, await encryptData(JSON.stringify(data), password))
}

// ── Profile CRUD ──

export async function createProfile(
  name: string, chain: ChainId, prefix = '', suffix = '', caseSensitive = false,
): Promise<Profile> {
  const profile: Profile = {
    id: generateId(), name, chain, prefix, suffix, caseSensitive,
    created: Date.now(), lastUsed: Date.now(),
  }
  const profiles = await getAllProfiles()
  profiles.push(profile)
  await writeStore(STORAGE_KEY, profiles)
  return profile
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
  const profiles = await getAllProfiles()
  const index = profiles.findIndex(p => p.id === id)
  if (index === -1) throw new Error('Profile not found')
  profiles[index] = { ...profiles[index], ...updates, lastUsed: Date.now() }
  await writeStore(STORAGE_KEY, profiles)
  return profiles[index]
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getAllProfiles()
  await writeStore(STORAGE_KEY, profiles.filter(p => p.id !== id))
}

export async function getAllProfiles(): Promise<Profile[]> {
  return readStore<Profile>(STORAGE_KEY)
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  return (await getAllProfiles()).find(p => p.id === id)
}

// ── Batch jobs ──

export async function createBatchJob(profiles: Profile[]): Promise<BatchJob> {
  const job: BatchJob = {
    id: generateId(), profiles, results: [], status: 'pending',
    startTime: Date.now(), endTime: null,
  }
  const queue = await getBatchQueue()
  queue.push(job)
  await writeStore(BATCH_QUEUE_KEY, queue)
  return job
}

export async function updateBatchJob(id: string, updates: Partial<BatchJob>): Promise<BatchJob> {
  const queue = await getBatchQueue()
  const index = queue.findIndex(j => j.id === id)
  if (index === -1) throw new Error('Job not found')
  queue[index] = { ...queue[index], ...updates }
  await writeStore(BATCH_QUEUE_KEY, queue)
  return queue[index]
}

export async function addBatchResult(jobId: string, result: any): Promise<BatchJob> {
  const queue = await getBatchQueue()
  const job = queue.find(j => j.id === jobId)
  if (!job) throw new Error('Job not found')
  job.results.push(result)
  await writeStore(BATCH_QUEUE_KEY, queue)
  return job
}

export async function getBatchQueue(): Promise<BatchJob[]> {
  return readStore<BatchJob>(BATCH_QUEUE_KEY)
}

export async function getBatchJob(id: string): Promise<BatchJob | undefined> {
  return (await getBatchQueue()).find(j => j.id === id)
}

export async function clearBatchQueue(): Promise<void> {
  requireUnlocked()
  localStorage.removeItem(BATCH_QUEUE_KEY)
}

// ── Stats / export / import ──

interface ProfileStats {
  totalProfiles: number
  chainBreakdown: Record<string, number>
  batchJobsTotal: number
  batchJobsCompleted: number
  totalResultsFound: number
}

export async function getProfileStats(): Promise<ProfileStats> {
  const profiles = await getAllProfiles()
  const queue = await getBatchQueue()
  return {
    totalProfiles: profiles.length,
    chainBreakdown: profiles.reduce<Record<string, number>>((acc, p) => { acc[p.chain] = (acc[p.chain] || 0) + 1; return acc }, {}),
    batchJobsTotal: queue.length,
    batchJobsCompleted: queue.filter(j => j.status === 'completed').length,
    totalResultsFound: queue.reduce((sum, j) => sum + j.results.length, 0),
  }
}

export async function exportProfiles(): Promise<string> {
  return JSON.stringify(await getAllProfiles(), null, 2)
}

export async function importProfiles(jsonString: string): Promise<number> {
  const profiles = JSON.parse(jsonString) as Profile[]
  if (!Array.isArray(profiles)) throw new Error('Invalid format')
  for (const p of profiles) {
    if (!p.id || !p.name || !p.chain) throw new Error('Invalid profile structure')
  }
  await writeStore(STORAGE_KEY, profiles)
  return profiles.length
}

export async function duplicateProfile(id: string, newName?: string): Promise<Profile> {
  const profile = await getProfile(id)
  if (!profile) throw new Error('Profile not found')
  return createProfile(newName || `${profile.name} (Copy)`, profile.chain, profile.prefix, profile.suffix, profile.caseSensitive)
}

export async function migrateFromV1(password: string): Promise<void> {
  unlock(password)
  const oldProfiles = localStorage.getItem('vanity-profiles')
  const oldBatch = localStorage.getItem('vanity-batch-queue')
  if (oldProfiles) { await writeStore(STORAGE_KEY, JSON.parse(oldProfiles)); localStorage.removeItem('vanity-profiles') }
  if (oldBatch) { await writeStore(BATCH_QUEUE_KEY, JSON.parse(oldBatch)); localStorage.removeItem('vanity-batch-queue') }
}

function generateId(): string {
  const rand = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(rand).map(b => b.toString(36)).join('') + Date.now().toString(36)
}
