# Phase 0 Audit: Desktop Coupling and Migration Implementation Map

## A. Desktop/runtime dependencies found

### Electron main-process coupling
- `electron/main.js` owns app lifecycle (`app.whenReady`, macOS activate/window close behavior), native window creation, and platform behavior (`process.platform !== 'darwin'`).
- Native menu is the command surface for project actions (New/Open/Save/Save As/Export/Undo/Redo/etc.), with menu click handlers dispatching renderer events via `win.webContents.send(...)`.
- Native dialogs are used for all file/folder selection (`dialog.showOpenDialog`, `dialog.showSaveDialog`, `dialog.showErrorBox`).
- Node `fs` + absolute file paths are used for project I/O and export writing.
- OS-level recent document integration is used via `app.addRecentDocument`.

### Preload/bridge coupling
- `electron/preload.js` exposes `window.electronAPI` with hard-coded IPC channels for file operations, exports, and menu event listeners.

### Renderer coupling
- `src/App.jsx` directly checks for and calls `window.electronAPI` in autosave, menu wiring, save/save-as/open flows, export flows, and close interception.
- File-name extraction assumes path separators (`split(/[\\/]/)`), coupling UI state to desktop file-path semantics.

### Packaging/runtime coupling
- `package.json` uses Electron entrypoint (`main: electron/main.js`) and Electron-only scripts (`dev`, `build`, `dist`, `electron`) and packager config (`electron-builder`).

## B. Current save/open/export flow map

### Save (Cmd/Ctrl+S)
1. Native menu emits `menu-save` from `electron/main.js` to renderer.
2. `src/App.jsx` handles menu event, serializes project using store `exportData()`.
3. Renderer calls `window.electronAPI.saveFile({ filePath, data })`.
4. `ipcMain.handle('save-file')` either writes directly (existing `filePath`) or opens save dialog and writes selected path.
5. Main process updates OS recent docs + `recent-files.json`, rebuilds menu recent list; renderer updates Zustand `currentFilePath`, marks saved, and updates local recent projects list.

### Save As (Cmd/Ctrl+Shift+S)
1. Native menu emits `menu-save-as`.
2. Renderer calls `saveFile({ data })` with no file path.
3. Main process prompts save dialog, writes file, updates recent data, returns chosen path.
4. Renderer stores returned path and marks project saved.

### Open
- Desktop menu Open flow:
  1. Native menu Open uses file-open dialog in main process.
  2. Main reads file contents and emits `menu-open-file` with `{ path, data }`.
  3. Renderer imports JSON with `importData(data, path)` and updates recent projects.
- Recent Projects submenu flow:
  1. Menu item stores absolute path in sublabel.
  2. Click reads file and emits same `menu-open-file` payload.

### Export
- Export All Scenes PDF:
  1. Menu emits `menu-export-all-pdf`.
  2. Renderer runs `exportAllScenesPDF(scenes)` to produce base64.
  3. Renderer calls bridge `saveExport({ base64Data, defaultName, filters })`.
  4. Main opens save dialog and writes binary file.
- Export All Scenes PNG:
  1. Menu emits `menu-export-all-png`.
  2. Renderer runs `exportAllScenesPNG(scenes)` to build `{name, base64Data}[]`.
  3. Bridge `saveExportAllPng({ files })` triggers folder picker.
  4. Main writes each PNG into selected folder.

## C. Current persistence flow map

### Persistent stores in renderer
- `localStorage['lumalayout-recent']`: recent projects list for UI/state bootstrapping.
- `localStorage['lumalayout-custom-icons']`: uploaded custom icon data URLs.

### Persistent stores in main process (desktop runtime)
- `{userData}/recent-files.json`: recent projects for native menu population.
- `{userData}/autosave.lumalayout`: autosave snapshot written every 60 seconds from renderer.

### In-memory/editor state
- Zustand store keeps active project/scenes/history/dirty state; `exportData()` and `importData()` are serialization boundaries.

## D. Proposed interfaces

### `PlatformAdapter`
Responsibility: isolate runtime capabilities (desktop bridge vs browser fallback) and event wiring.

Proposed surface:

```ts
export type PlatformRuntime = 'electron' | 'web'

export interface PlatformAdapter {
  runtime: PlatformRuntime

  // lifecycle/menu command subscription
  onCommand(command: PlatformCommand, handler: () => void | Promise<void>): () => void

  // file dialogs + filesystem-like actions
  saveProject(input: { filePath?: string | null; data: string }): Promise<{ success: boolean; filePath?: string }>
  openProject(): Promise<{ success: boolean; filePath?: string; data?: string }>
  readProject(filePath: string): Promise<{ success: boolean; filePath?: string; data?: string }>

  // exports
  saveBinaryExport(input: { base64Data: string; defaultName: string; filters: Array<{ name: string; extensions: string[] }> }): Promise<{ success: boolean; filePath?: string }>
  saveManyPng(input: { files: Array<{ name: string; base64Data: string }> }): Promise<{ success: boolean; folder?: string }>

  // app lifecycle
  onBeforeAppClose?(handler: () => void): () => void
  forceCloseApp?(): Promise<void> | void

  // optional runtime persistence helpers
  writeAutosave?(data: string): Promise<{ success: boolean }>
}
```

Implementation targets:
- `ElectronPlatformAdapter`: wraps `window.electronAPI` with normalized return types.
- `WebPlatformAdapter`: no-op command listeners, browser-native download/file-picker fallbacks.

### `ProjectStorage`
Responsibility: own project serialization/deserialization + recent/autosave persistence policy.

Proposed surface:

```ts
export interface ProjectStorage {
  serializeProject(state: EditorProjectState): string
  deserializeProject(json: string): EditorProjectState

  saveProject(input: { data: string; filePath?: string | null }): Promise<{ success: boolean; filePath?: string }>
  openProject(): Promise<{ success: boolean; filePath?: string; data?: string }>

  listRecentProjects(): Promise<ProjectRef[]>
  rememberRecentProject(ref: ProjectRef): Promise<void>

  saveAutosave(data: string): Promise<void>
}
```

Notes:
- Keep current `useStore.exportData/importData` behavior initially by delegating to them.
- First extraction should orchestrate existing behavior, not move schema logic.

### Optional `FileCommand` / `ExportService`
Responsibility: split command intent from renderer event plumbing.

```ts
export interface ExportService {
  exportAllScenesPdf(input: { scenes: Scene[]; projectName: string }): Promise<void>
  exportAllScenesPng(input: { scenes: Scene[] }): Promise<void>
}
```

- Internally uses `exportUtils` for rendering and `PlatformAdapter` for save destination.
- Keeps `App.jsx` from directly touching bridge channels.

## E. Recommended file/module boundaries

1. `src/platform/PlatformAdapter.js`
   - interface + shared command constants.
2. `src/platform/electronPlatformAdapter.js`
   - wraps `window.electronAPI` channel names.
3. `src/platform/webPlatformAdapter.js`
   - browser fallbacks/no-op command subscriptions.
4. `src/platform/getPlatformAdapter.js`
   - runtime detection + singleton adapter.
5. `src/storage/ProjectStorage.js`
   - orchestration of project save/open/recent/autosave.
6. `src/services/ExportService.js`
   - export orchestration (`exportUtils` + adapter writes).
7. Minimal App entrypoints:
   - `src/App.jsx` consumes storage/platform/services rather than bridge directly.

Keep unchanged for now:
- `src/store/useStore.js` core editing state transitions.
- `src/exportUtils.js` render/export computation.

## F. Exact first code changes to make next

1. Add `src/platform/getPlatformAdapter.js` with runtime detection:
   - If `window.electronAPI` exists, return electron adapter; else web adapter.
2. Add `src/platform/electronPlatformAdapter.js` that 1:1 maps existing bridge methods/events.
3. Add `src/platform/webPlatformAdapter.js` with:
   - `saveProject`: Blob download fallback.
   - `openProject`: `<input type=file>` + FileReader fallback.
   - `saveBinaryExport`/`saveManyPng`: browser downloads.
   - no-op menu subscriptions.
4. Add `src/storage/ProjectStorage.js` to orchestrate:
   - `saveCurrentProject({ exportData, currentFilePath })`
   - `openProjectAndImport({ importData })`
   - `autosave({ exportData })`
5. Update only `src/App.jsx` to replace direct `window.electronAPI` calls with adapter/storage calls (no UI/flow changes).
6. Keep existing menu behavior in Electron main/preload untouched for this phase.

## G. Risk list

1. Double source of truth for recents (`localStorage` vs `recent-files.json`) can drift.
2. Browser fallback cannot guarantee overwrite-to-same-path semantics (no unrestricted fs path access).
3. Close interception behavior differs outside Electron (`forceCloseApp` unavailable).
4. Export performance/memory for many scenes in browser downloads may spike.
5. `read-file`/`open-file` IPC paths may become dead code if not reconciled during adapter introduction.
6. Filename derivation from path strings is currently repeated and fragile.

## H. Regression checklist

1. Save existing file path still overwrites same `.lumalayout` file in Electron.
2. Save As creates file and updates displayed filename in sidebar.
3. Open from File menu loads project, scenes, and current scene id correctly.
4. Open from Recent Projects submenu still works and rebuilds recent menu.
5. Auto-save still writes `{userData}/autosave.lumalayout` every 60s (Electron).
6. Export All Scenes PDF writes a valid multipage PDF with scene titles.
7. Export All Scenes PNG writes one PNG per scene into chosen folder.
8. Unsaved-close dialog appears and Save/Don’t Save/Cancel behavior remains identical.
9. Undo/redo shortcuts from native menu still invoke same store actions.
10. Renderer still runs in pure web dev mode without hard crash when `window.electronAPI` is absent.
