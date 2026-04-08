const KEY = 'lumalayout-runtime-diagnostics'
const MAX_ENTRIES = 200

function readEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function writeEntries(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    // ignore storage failures
  }
}

export function recordDiagnostic(event, details = {}, level = 'info') {
  const entry = {
    ts: Date.now(),
    level,
    event,
    details,
  }

  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  logFn(`[diag:${event}]`, details)

  const entries = readEntries()
  entries.push(entry)
  writeEntries(entries)
}

export function installGlobalDiagnostics() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    recordDiagnostic('window-error', {
      message: event.message,
      file: event.filename,
      line: event.lineno,
      col: event.colno,
    }, 'error')
  })

  window.addEventListener('unhandledrejection', (event) => {
    recordDiagnostic('unhandled-rejection', {
      reason: String(event.reason?.message || event.reason || 'unknown'),
    }, 'error')
  })
}
