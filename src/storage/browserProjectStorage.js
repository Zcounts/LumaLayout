import { recordDiagnostic } from '../diagnostics/runtimeDiagnostics'

const DB_NAME = 'lumalayout-web'
const DB_VERSION = 1
const PROJECT_STORE = 'projects'
const META_LAST_OPENED_ID = 'lumalayout-last-opened-project-id'
const LEGACY_AUTOSAVE_KEY = 'lumalayout-autosave-web'

const now = () => Date.now()

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        const store = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function withStore(mode, worker) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, mode)
    const store = tx.objectStore(PROJECT_STORE)

    let workerResult
    try {
      workerResult = worker(store)
    } catch (err) {
      reject(err)
      db.close()
      return
    }

    tx.oncomplete = () => { resolve(workerResult); db.close() }
    tx.onerror = () => { reject(tx.error); db.close() }
    tx.onabort = () => { reject(tx.error); db.close() }
  }))
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function makeId() {
  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function parseProjectName(data, fallback = 'Untitled Project') {
  try {
    const parsed = JSON.parse(data)
    return parsed?.projectName || fallback
  } catch {
    return fallback
  }
}

async function migrateLegacyAutosaveIfNeeded() {
  const legacy = localStorage.getItem(LEGACY_AUTOSAVE_KEY)
  if (!legacy) return

  const existing = await withStore('readonly', (store) => requestToPromise(store.count()))
  if (existing > 0) return

  const timestamp = now()
  const id = makeId()
  const record = {
    id,
    name: parseProjectName(legacy, 'Recovered Project'),
    data: legacy,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: 'legacy-autosave',
    schemaVersion: 1,
  }

  await withStore('readwrite', (store) => store.put(record))
  localStorage.setItem(META_LAST_OPENED_ID, id)
  recordDiagnostic('idb-legacy-migration-complete', { id })
}

export function createBrowserProjectStorage() {
  let migrated = false

  const ensureMigration = async () => {
    if (migrated) return
    await migrateLegacyAutosaveIfNeeded()
    migrated = true
  }

  const withDiagnostics = async (eventName, operation, fallback = { success: false }) => {
    try {
      await ensureMigration()
      return await operation()
    } catch (err) {
      recordDiagnostic(eventName, { error: err?.message || String(err) }, 'error')
      return { ...fallback, error: err?.message || String(err) }
    }
  }

  return {
    runtime: 'web',
    supportsPersistentProjects: true,

    async createProject({ name, data }) {
      return withDiagnostics('idb-create-failed', async () => {
        const timestamp = now()
        const id = makeId()
        const record = {
          id,
          name: name || parseProjectName(data),
          data,
          createdAt: timestamp,
          updatedAt: timestamp,
          schemaVersion: 1,
        }
        await withStore('readwrite', (store) => store.add(record))
        localStorage.setItem(META_LAST_OPENED_ID, id)
        return { success: true, id, record }
      })
    },

    async saveProject({ id, name, data }) {
      return withDiagnostics('idb-save-failed', async () => {
        const timestamp = now()

        if (!id) {
          return this.createProject({ name, data })
        }

        const existing = await withStore('readonly', (store) => requestToPromise(store.get(id)))
        const record = {
          id,
          name: name || parseProjectName(data, existing?.name || 'Untitled Project'),
          data,
          createdAt: existing?.createdAt || timestamp,
          updatedAt: timestamp,
          schemaVersion: 1,
        }

        await withStore('readwrite', (store) => store.put(record))
        localStorage.setItem(META_LAST_OPENED_ID, id)
        return { success: true, id, record }
      })
    },

    async loadProject(id) {
      return withDiagnostics('idb-load-failed', async () => {
        if (!id) return { success: false }
        const record = await withStore('readonly', (store) => requestToPromise(store.get(id)))
        if (!record) return { success: false }
        localStorage.setItem(META_LAST_OPENED_ID, id)
        return { success: true, project: record }
      })
    },

    async listProjects(limit = 20) {
      return withDiagnostics('idb-list-failed', async () => {
        const projects = await withStore('readonly', (store) => requestToPromise(store.getAll()))
        const sorted = (projects || [])
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
          .slice(0, limit)
          .map((item) => ({
            id: item.id,
            name: item.name,
            updatedAt: item.updatedAt,
            createdAt: item.createdAt,
          }))

        return { success: true, projects: sorted }
      }, { success: true, projects: [] })
    },

    async deleteProject(id) {
      return withDiagnostics('idb-delete-failed', async () => {
        if (!id) return { success: false }
        await withStore('readwrite', (store) => store.delete(id))
        if (localStorage.getItem(META_LAST_OPENED_ID) === id) {
          localStorage.removeItem(META_LAST_OPENED_ID)
        }
        return { success: true }
      })
    },

    async getLastOpenedProjectId() {
      await ensureMigration()
      return localStorage.getItem(META_LAST_OPENED_ID)
    },

    async setLastOpenedProjectId(id) {
      try {
        if (!id) localStorage.removeItem(META_LAST_OPENED_ID)
        else localStorage.setItem(META_LAST_OPENED_ID, id)
      } catch (err) {
        recordDiagnostic('last-opened-id-write-failed', { error: err?.message || String(err) }, 'warn')
      }
    },
  }
}
