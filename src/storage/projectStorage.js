import { createBrowserProjectStorage } from './browserProjectStorage'
import { createDesktopProjectStorage } from './desktopProjectStorage'

export function createProjectStorage(platformAdapter) {
  if (platformAdapter?.runtime === 'desktop') {
    return createDesktopProjectStorage()
  }
  return createBrowserProjectStorage()
}
