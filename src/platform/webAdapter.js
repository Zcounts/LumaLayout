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

const pickFileText = (accept = '.lumalayout,application/json') => new Promise((resolve) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return resolve({ success: false })
    const reader = new FileReader()
    reader.onload = (event) => resolve({
      success: true,
      data: String(event.target?.result || ''),
      fileName: file.name,
    })
    reader.onerror = () => resolve({ success: false })
    reader.readAsText(file)
  }
  input.click()
})

export function createWebAdapter() {
  return {
    runtime: 'web',
    capabilities: {
      hasNativeMenus: false,
      persistentFilePaths: false,
      supportsAutosave: true,
      supportsAppCloseControl: false,
      supportsRevealInFolder: false,
    },

    onCommand() {
      return () => {}
    },

    onBeforeClose() {
      return () => {}
    },

    async requestForceClose() {
      return
    },

    async saveProject({ data }) {
      const fileName = `lumalayout_${Date.now()}.lumalayout`
      downloadBlob(new Blob([data], { type: 'application/json' }), fileName)
      return { success: true, filePath: null }
    },

    async openProject() {
      return pickFileText('.lumalayout,application/json')
    },

    async readProject() {
      return { success: false }
    },

    async autoSave(data) {
      try {
        localStorage.setItem('lumalayout-autosave-web', data)
        return { success: true }
      } catch {
        return { success: false }
      }
    },

    async saveExportFile({ base64Data, defaultName, filters }) {
      const ext = filters?.[0]?.extensions?.[0] || 'bin'
      const mime = ext === 'pdf' ? 'application/pdf' : 'image/png'
      downloadBlob(b64ToBlob(base64Data, mime), defaultName)
      return { success: true }
    },

    async saveExportFiles(files) {
      for (const file of files || []) {
        downloadBlob(b64ToBlob(file.base64Data, 'image/png'), file.name)
      }
      return { success: true }
    },

    async revealInFolder() {
      return { success: false }
    },
  }
}
