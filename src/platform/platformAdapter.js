import { createDesktopAdapter } from './desktopAdapter'
import { createWebAdapter } from './webAdapter'

export const PlatformCommand = {
  NEW_PROJECT: 'new-project',
  OPEN_PROJECT: 'open-project',
  SAVE_PROJECT: 'save-project',
  SAVE_PROJECT_AS: 'save-project-as',
  EXPORT_ALL_PDF: 'export-all-pdf',
  EXPORT_ALL_PNG: 'export-all-png',
  UNDO: 'undo',
  REDO: 'redo',
  DUPLICATE: 'duplicate',
  DELETE: 'delete',
}

export function createPlatformAdapter() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return createDesktopAdapter(window.electronAPI)
  }
  return createWebAdapter()
}
