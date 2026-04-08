# Phase 4 Plan: Local-First + Optional Cloud Sync Architecture

## Current baseline audit (from cloud perspective)

- Local browser persistence is the primary source of truth for web users via IndexedDB project records (`id`, `name`, `data`, timestamps). This should remain authoritative while editing.
- Browser metadata in localStorage is intentionally small (last opened project id + diagnostics), which is good for sync readiness.
- File import/export is separate from local persistence and should stay that way (files are transfer artifacts, not live sync state).
- Desktop flows remain path-based through platform adapters and should not be disrupted by cloud work.

## Recommended architecture (additive, low-risk)

### 1) Keep 3 layers separate

1. Local Working Copy (authoritative while editing)
   - Existing IndexedDB record in browser / file path project in desktop
   - Fast autosave and full offline reliability

2. Cloud Snapshot/Commit (optional, async)
   - Immutable snapshot objects with metadata (`projectId`, `baseRevision`, `snapshotId`, `createdAt`, `deviceId`)
   - Uploaded in background when online and authenticated

3. Future Collaboration Layer (later)
   - Separate event/op model, separate sync engine
   - Must not be coupled to current editor mutation logic in this phase

### 2) Introduce cloud as a sidecar sync service

- Add a `SyncCoordinator` that observes local save checkpoints and decides whether to enqueue cloud backup.
- `SyncCoordinator` should never block local save or exports.
- Cloud failures become non-blocking status + retry queue entries.

### 3) Use revisioned snapshot envelopes

- Keep current project JSON payload unchanged.
- Wrap it in a sync envelope for cloud transport:
  - `projectId`
  - `localRevision`
  - `baseCloudRevision`
  - `payloadHash`
  - `payload` (existing exportData JSON)
  - `deviceId`, `updatedAt`

This avoids rewriting store/editor schema while enabling deterministic conflict detection.

## Data flow for sync

1. User edits locally -> existing local save/autosave pipeline writes working copy.
2. Save checkpoint triggers `SyncCoordinator.enqueueSnapshot(projectId, revision)`.
3. If offline or unauthenticated: keep queued (local queue store).
4. If online + authenticated: upload latest queued snapshot.
5. Cloud returns `cloudRevision`/`snapshotId`; local sync metadata updated.
6. On other device, cloud snapshot can be pulled and imported into local working copy as a new local revision.

## Conflict model (non-realtime phase)

- Detect conflict by `baseCloudRevision` mismatch at upload.
- Default policy: `no silent overwrite`.
- On conflict:
  - Keep local working copy untouched.
  - Keep cloud state untouched.
  - Create two named branches/snapshots locally:
    - `My local version (timestamp)`
    - `Cloud version (timestamp)`
  - Prompt user to choose “Keep local as new cloud version” or “Open cloud copy”.

This is safer than naive last-write-wins for creative diagram work.

## Offline/online rules

- Local save always succeeds first (or fails visibly if storage fails).
- Cloud sync is best-effort and deferred.
- Retry with exponential backoff + jitter.
- Never require network to open/edit/export.

## What should remain local-only

- Unsaved transient UI state (selection, viewport, active tools, dialogs).
- Runtime diagnostics buffers (can optionally be uploaded only with consent later).
- Device-specific preferences (theme/sidebar collapsed).
- In-progress conflict resolution drafts.

## Phased implementation plan

### Phase 4A (safe foundation)
- Add sync metadata schema + pure helpers (no runtime behavior change).
- Add project-level `cloud` metadata fields in persistence envelope (optional, backwards-compatible).
- Add `deviceId` utility and deterministic revision hash helper.

### Phase 4B (manual cloud backup)
- Add account auth shell and a manual “Backup to Cloud” action.
- Upload snapshots only when user clicks backup.
- Add read-only “Restore from Cloud Snapshot” flow.

### Phase 4C (background optional sync)
- Add queue + background worker for backup on save checkpoints.
- Add non-blocking sync status UI.
- Add conflict prompt flow.

### Phase 4D (cross-device polish)
- Add project list hydration from cloud + local merge view.
- Keep local copy as default open target unless user selects cloud snapshot.

### Future (collaboration, separate track)
- Prototype collaborative op-log model in isolated modules.
- Avoid modifying current editor/store mutation model until proven.

## Safest first code step

- Add a **pure sync envelope module** (`src/sync/syncEnvelope.js`) with:
  - backward-compatible snapshot envelope shape
  - deterministic payload hashing helper
  - device id helper

This step is isolated, testable, and does not alter existing save/open/export behavior.
