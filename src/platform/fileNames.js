export function sanitizeFileBaseName(input, fallback = 'project') {
  const trimmed = String(input || '').trim()
  const sanitized = trimmed
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return sanitized || fallback
}

export function projectFileName(projectName) {
  return `${sanitizeFileBaseName(projectName, 'lumalayout_project')}.lumalayout`
}

export function allScenesPdfFileName(projectName) {
  return `${sanitizeFileBaseName(projectName, 'lumalayout_project')}_all_scenes.pdf`
}
