import { recordDiagnostic } from '../diagnostics/runtimeDiagnostics'

const b64ToBlob = (base64Data, mimeType = 'application/octet-stream') => {
  const bytes = atob(base64Data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mimeType })
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const pickFileTextFallback = (accept = '.lumalayout,application/json') => new Promise((resolve) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return resolve({ success: false, canceled: true })
    const reader = new FileReader()
    reader.onload = (event) => resolve({
      success: true,
      data: String(event.target?.result || ''),
      fileName: file.name,
      method: 'file-input',
    })
    reader.onerror = () => resolve({ success: false, error: 'File read failed' })
    reader.readAsText(file)
  }
  input.click()
})

const createWritable = async (fileHandle) => {
  const writable = await fileHandle.createWritable()
  return {
    async writeText(content) {
      await writable.write(content)
      await writable.close()
    },
    async writeBlob(blob) {
      await writable.write(blob)
      await writable.close()
    },
  }
}

export function createWebAdapter() {
  let projectFileHandle = null

  const supportsFsAccess =
    typeof window !== 'undefined' &&
    typeof window.showOpenFilePicker === 'function' &&
    typeof window.showSaveFilePicker === 'function'

  const supportsDirectoryPicker =
    typeof window !== 'undefined' &&
    typeof window.showDirectoryPicker === 'function'

  recordDiagnostic('platform-web-capabilities', { supportsFsAccess, supportsDirectoryPicker })

  return {
    runtime: 'web',
    capabilities: {
      hasNativeMenus: false,
      persistentFilePaths: false,
      supportsAutosave: true,
      supportsAppCloseControl: false,
      supportsRevealInFolder: false,
      supportsFsAccess,
      supportsDirectoryPicker,
    },

    onCommand() { return () => {} },
    onBeforeClose() { return () => {} },
    async requestForceClose() { return },

    async saveProject({ data, suggestedName = 'project.lumalayout', forceSaveAs = false }) {
      if (supportsFsAccess) {
        try {
          if (!projectFileHandle || forceSaveAs) {
            projectFileHandle = await window.showSaveFilePicker({
              suggestedName,
              types: [{
                description: 'LumaLayout Project',
                accept: { 'application/json': ['.lumalayout', '.json'] },
              }],
            })
          }
          const writable = await createWritable(projectFileHandle)
          await writable.writeText(data)
          return { success: true, fileName: projectFileHandle.name, method: 'file-system-access' }
        } catch (err) {
          if (err?.name === 'AbortError') return { success: false, canceled: true }
          recordDiagnostic('project-save-failed', { method: 'file-system-access', error: err.message }, 'error')
          return { success: false, error: err.message }
        }
      }

      downloadBlob(new Blob([data], { type: 'application/json' }), suggestedName)
      recordDiagnostic('project-save-fallback-download', { suggestedName }, 'warn')
      return { success: true, fileName: suggestedName, method: 'download', fallbackUsed: true }
    },

    async openProject() {
      if (supportsFsAccess) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{
              description: 'LumaLayout Project',
              accept: { 'application/json': ['.lumalayout', '.json'] },
            }],
            excludeAcceptAllOption: false,
            multiple: false,
          })
          if (!fileHandle) return { success: false, canceled: true }
          const file = await fileHandle.getFile()
          projectFileHandle = fileHandle
          return { success: true, fileName: file.name, data: await file.text(), method: 'file-system-access' }
        } catch (err) {
          if (err?.name === 'AbortError') return { success: false, canceled: true }
          recordDiagnostic('project-open-failed', { method: 'file-system-access', error: err.message }, 'error')
          return { success: false, error: err.message }
        }
      }

      recordDiagnostic('project-open-fallback-input', {}, 'warn')
      return pickFileTextFallback('.lumalayout,application/json')
    },

    async readProject() { return { success: false } },

    async autoSave(data) {
      try {
        localStorage.setItem('lumalayout-autosave-web', data)
        return { success: true }
      } catch {
        recordDiagnostic('autosave-localstorage-failed', {}, 'warn')
        return { success: false }
      }
    },

    async saveExportFile({ base64Data, defaultName, filters }) {
      const ext = filters?.[0]?.extensions?.[0] || 'bin'
      const mime = ext === 'pdf' ? 'application/pdf' : 'image/png'
      const blob = b64ToBlob(base64Data, mime)

      if (supportsFsAccess) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: defaultName,
            types: filters?.length
              ? filters.map((f) => ({
                  description: f.name,
                  accept: { [mime]: f.extensions.map((item) => `.${item}`) },
                }))
              : undefined,
          })
          const writable = await createWritable(handle)
          await writable.writeBlob(blob)
          return { success: true, fileName: handle.name, method: 'file-system-access' }
        } catch (err) {
          if (err?.name === 'AbortError') return { success: false, canceled: true }
          recordDiagnostic('export-file-failed', { method: 'file-system-access', error: err.message }, 'error')
          return { success: false, error: err.message }
        }
      }

      downloadBlob(blob, defaultName)
      recordDiagnostic('export-file-fallback-download', { defaultName }, 'warn')
      return { success: true, fileName: defaultName, method: 'download', fallbackUsed: true }
    },

    async saveExportFiles(files) {
      if (supportsDirectoryPicker) {
        try {
          const directoryHandle = await window.showDirectoryPicker()
          for (const file of files || []) {
            const child = await directoryHandle.getFileHandle(file.name, { create: true })
            const writable = await createWritable(child)
            await writable.writeBlob(b64ToBlob(file.base64Data, 'image/png'))
          }
          return { success: true, method: 'directory-picker' }
        } catch (err) {
          if (err?.name === 'AbortError') return { success: false, canceled: true }
          recordDiagnostic('export-png-batch-failed', { method: 'directory-picker', error: err.message }, 'error')
          return { success: false, error: err.message }
        }
      }

      recordDiagnostic('export-png-batch-fallback-download', { count: (files || []).length }, 'warn')
      for (const file of files || []) {
        downloadBlob(b64ToBlob(file.base64Data, 'image/png'), file.name)
      }
      return { success: true, method: 'download', fallbackUsed: true }
    },

    async revealInFolder() { return { success: false, unsupported: true } },
  }
}
