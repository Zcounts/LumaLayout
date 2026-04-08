// Phase 4A foundational utilities for optional cloud sync.
// Intentionally side-effect free and not wired into save flows yet.

const DEVICE_ID_KEY = 'lumalayout-device-id'

export function getOrCreateDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return 'dev_unavailable'
  }
}

export async function hashPayload(payload) {
  try {
    const data = new TextEncoder().encode(payload)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return 'hash_unavailable'
  }
}

export async function createSyncEnvelope({ projectId, payload, localRevision = 1, baseCloudRevision = null }) {
  const payloadHash = await hashPayload(payload)
  return {
    schemaVersion: 1,
    projectId,
    localRevision,
    baseCloudRevision,
    payloadHash,
    payload,
    deviceId: getOrCreateDeviceId(),
    updatedAt: Date.now(),
  }
}
