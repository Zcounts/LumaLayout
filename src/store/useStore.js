import { create } from 'zustand'

const MAX_HISTORY = 50

// Generate unique IDs
let _id = 1
export const genId = () => `el_${Date.now()}_${_id++}`

// Deep clone helper
const clone = (obj) => JSON.parse(JSON.stringify(obj))

// Default lighting element
export const makeElement = (overrides = {}) => ({
  id: genId(),
  type: 'lighting', // 'lighting' | 'blueprint-shape' | 'group'
  iconPath: '',
  iconName: '',
  x: 100,
  y: 100,
  width: 60,
  height: 60,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  label: '',
  zIndex: 0,
  groupId: null,
  ...overrides,
})

// Default blueprint shape
export const makeShape = (overrides = {}) => ({
  id: genId(),
  type: 'blueprint-shape',
  shapeType: 'rect', // 'rect' | 'circle' | 'triangle'
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  rotation: 0,
  fill: '#cccccc',
  stroke: '#333333',
  strokeWidth: 2,
  label: '',
  zIndex: 0,
  ...overrides,
})

// Initial scene
const makeScene = (name = 'Scene 1') => ({
  id: genId(),
  name,
  elements: [],       // lighting elements
  shapes: [],         // blueprint shapes
  roomPoints: [],     // array of {x, y} for room polygon
  roomClosed: false,
  doors: [],          // [{x, y, angle, width}]
  windows: [],        // [{pointIndex, offset, width}]
})

const initialState = {
  // App-level state
  mode: 'lighting',         // 'blueprint' | 'lighting'
  darkMode: false,
  snapToGrid: true,
  gridSize: 20,
  showGrid: true,
  sidebarCollapsed: false,

  // Canvas viewport
  stageX: 0,
  stageY: 0,
  stageScale: 1,

  // Scenes
  scenes: [makeScene('Scene 1')],
  currentSceneId: null, // set after init

  // Selection (in lighting mode)
  selectedIds: [],

  // Blueprint drawing state
  blueprintTool: 'select', // 'select' | 'room' | 'rect' | 'circle' | 'triangle'
  drawingRoom: false,

  // History for undo/redo
  history: [],
  historyIndex: -1,

  // UI state
  contextMenu: null, // { x, y, targetId }
  labelEditor: null, // { id, x, y, value }
  dragSelecting: false,
  selectionRect: null, // { x1, y1, x2, y2 }
}

// Get current scene helper
const getCurrentScene = (state) => {
  const id = state.currentSceneId || state.scenes[0]?.id
  return state.scenes.find(s => s.id === id) || state.scenes[0]
}

const updateCurrentScene = (state, updater) => {
  const sceneId = state.currentSceneId || state.scenes[0]?.id
  return {
    scenes: state.scenes.map(s =>
      s.id === sceneId ? { ...s, ...updater(s) } : s
    ),
  }
}

// Snapshot current scene for history
const snapshot = (state) => {
  const scene = getCurrentScene(state)
  return clone({
    elements: scene.elements,
    shapes: scene.shapes,
    roomPoints: scene.roomPoints,
    roomClosed: scene.roomClosed,
    doors: scene.doors,
    windows: scene.windows,
  })
}

const pushHistory = (state, snap) => {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(snap)
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

export const useStore = create((set, get) => ({
  ...initialState,
  currentSceneId: initialState.scenes[0]?.id,

  // ---- Mode ----
  setMode: (mode) => set({ mode, selectedIds: [] }),
  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
  toggleSnapToGrid: () => set(s => ({ snapToGrid: !s.snapToGrid })),
  toggleShowGrid: () => set(s => ({ showGrid: !s.showGrid })),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ---- Blueprint tool ----
  setBlueprintTool: (tool) => set({ blueprintTool: tool }),

  // ---- Viewport ----
  setViewport: (x, y, scale) => set({ stageX: x, stageY: y, stageScale: scale }),

  // ---- Scenes ----
  getCurrentScene: () => getCurrentScene(get()),

  addScene: () => {
    const name = `Scene ${get().scenes.length + 1}`
    const scene = makeScene(name)
    set(s => ({ scenes: [...s.scenes, scene], currentSceneId: scene.id }))
  },

  setCurrentScene: (id) => set({ currentSceneId: id, selectedIds: [] }),

  renameScene: (id, name) =>
    set(s => ({ scenes: s.scenes.map(sc => sc.id === id ? { ...sc, name } : sc) })),

  deleteScene: (id) =>
    set(s => {
      const remaining = s.scenes.filter(sc => sc.id !== id)
      if (remaining.length === 0) {
        const newScene = makeScene('Scene 1')
        return { scenes: [newScene], currentSceneId: newScene.id }
      }
      const newCurrentId = s.currentSceneId === id
        ? remaining[remaining.length - 1].id
        : s.currentSceneId
      return { scenes: remaining, currentSceneId: newCurrentId }
    }),

  reorderScenes: (newOrder) => set({ scenes: newOrder }),

  // ---- Elements (Lighting Mode) ----
  addElement: (elementData) => {
    const state = get()
    const snap = snapshot(state)
    const scene = getCurrentScene(state)
    const maxZ = scene.elements.length > 0
      ? Math.max(...scene.elements.map(e => e.zIndex)) + 1
      : 0
    const element = makeElement({ ...elementData, zIndex: maxZ })
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: [...sc.elements, element],
      })),
      ...pushHistory(s, snap),
      selectedIds: [element.id],
    }))
  },

  updateElement: (id, updates) => {
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => el.id === id ? { ...el, ...updates } : el),
      })),
    }))
  },

  updateElementWithHistory: (id, updates) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => el.id === id ? { ...el, ...updates } : el),
      })),
      ...pushHistory(s, snap),
    }))
  },

  updateMultipleElements: (ids, updater) => {
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => ids.includes(el.id) ? { ...el, ...updater(el) } : el),
      })),
    }))
  },

  updateMultipleElementsWithHistory: (ids, updater) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => ids.includes(el.id) ? { ...el, ...updater(el) } : el),
      })),
      ...pushHistory(s, snap),
    }))
  },

  deleteElement: (id) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.filter(el => el.id !== id),
      })),
      selectedIds: s.selectedIds.filter(sid => sid !== id),
      ...pushHistory(s, snap),
    }))
  },

  deleteSelectedElements: () => {
    const state = get()
    const snap = snapshot(state)
    const { selectedIds } = state
    if (selectedIds.length === 0) return
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.filter(el => !selectedIds.includes(el.id)),
      })),
      selectedIds: [],
      ...pushHistory(s, snap),
    }))
  },

  duplicateElement: (id) => {
    const state = get()
    const snap = snapshot(state)
    const scene = getCurrentScene(state)
    const el = scene.elements.find(e => e.id === id)
    if (!el) return
    const maxZ = scene.elements.length > 0
      ? Math.max(...scene.elements.map(e => e.zIndex)) + 1 : 0
    const newEl = makeElement({ ...clone(el), x: el.x + 20, y: el.y + 20, zIndex: maxZ })
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: [...sc.elements, newEl],
      })),
      selectedIds: [newEl.id],
      ...pushHistory(s, snap),
    }))
  },

  duplicateSelectedElements: () => {
    const state = get()
    const snap = snapshot(state)
    const scene = getCurrentScene(state)
    const { selectedIds } = state
    if (selectedIds.length === 0) return
    let maxZ = scene.elements.length > 0
      ? Math.max(...scene.elements.map(e => e.zIndex)) : -1
    const newEls = selectedIds
      .map(id => scene.elements.find(e => e.id === id))
      .filter(Boolean)
      .map(el => makeElement({ ...clone(el), x: el.x + 20, y: el.y + 20, zIndex: ++maxZ }))
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: [...sc.elements, ...newEls],
      })),
      selectedIds: newEls.map(e => e.id),
      ...pushHistory(s, snap),
    }))
  },

  bringToFront: (id) => {
    const state = get()
    const snap = snapshot(state)
    const scene = getCurrentScene(state)
    const maxZ = scene.elements.length > 0
      ? Math.max(...scene.elements.map(e => e.zIndex)) + 1 : 0
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => el.id === id ? { ...el, zIndex: maxZ } : el),
      })),
      ...pushHistory(s, snap),
    }))
  },

  sendToBack: (id) => {
    const state = get()
    const snap = snapshot(state)
    const scene = getCurrentScene(state)
    const minZ = scene.elements.length > 0
      ? Math.min(...scene.elements.map(e => e.zIndex)) - 1 : 0
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => el.id === id ? { ...el, zIndex: minZ } : el),
      })),
      ...pushHistory(s, snap),
    }))
  },

  setLabel: (id, label) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el => el.id === id ? { ...el, label } : el),
      })),
      ...pushHistory(s, snap),
    }))
  },

  // ---- Grouping ----
  groupSelectedElements: () => {
    const state = get()
    const { selectedIds } = state
    if (selectedIds.length < 2) return
    const snap = snapshot(state)
    const groupId = genId()
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el =>
          selectedIds.includes(el.id) ? { ...el, groupId } : el
        ),
      })),
      ...pushHistory(s, snap),
    }))
  },

  ungroupElements: (groupId) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        elements: sc.elements.map(el =>
          el.groupId === groupId ? { ...el, groupId: null } : el
        ),
      })),
      ...pushHistory(s, snap),
    }))
  },

  // ---- Selection ----
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectElement: (id, multiSelect = false) => {
    set(s => {
      if (multiSelect) {
        const already = s.selectedIds.includes(id)
        return {
          selectedIds: already
            ? s.selectedIds.filter(sid => sid !== id)
            : [...s.selectedIds, id],
        }
      }
      return { selectedIds: [id] }
    })
  },

  clearSelection: () => set({ selectedIds: [] }),

  // ---- Drag selection ----
  setDragSelecting: (val) => set({ dragSelecting: val }),
  setSelectionRect: (rect) => set({ selectionRect: rect }),

  // ---- Blueprint shapes ----
  addShape: (shapeData) => {
    const state = get()
    const snap = snapshot(state)
    const scene = getCurrentScene(state)
    const maxZ = scene.shapes.length > 0
      ? Math.max(...scene.shapes.map(s => s.zIndex)) + 1 : 0
    const shape = makeShape({ ...shapeData, zIndex: maxZ })
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        shapes: [...sc.shapes, shape],
      })),
      ...pushHistory(s, snap),
    }))
  },

  updateShape: (id, updates) => {
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        shapes: sc.shapes.map(sh => sh.id === id ? { ...sh, ...updates } : sh),
      })),
    }))
  },

  deleteShape: (id) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        shapes: sc.shapes.filter(sh => sh.id !== id),
      })),
      ...pushHistory(s, snap),
    }))
  },

  // ---- Room drawing (Blueprint Mode) ----
  addRoomPoint: (point) => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        roomPoints: [...sc.roomPoints, point],
      })),
      ...pushHistory(s, snap),
    }))
  },

  closeRoom: () => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        roomClosed: true,
      })),
      ...pushHistory(s, snap),
    }))
  },

  clearRoom: () => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({
      ...updateCurrentScene(s, sc => ({
        roomPoints: [],
        roomClosed: false,
        doors: [],
        windows: [],
      })),
      ...pushHistory(s, snap),
    }))
  },

  // ---- Undo / Redo ----
  undo: () => {
    const state = get()
    if (state.historyIndex < 0) return
    const snap = state.history[state.historyIndex]
    const sceneId = state.currentSceneId || state.scenes[0]?.id
    set(s => ({
      scenes: s.scenes.map(sc =>
        sc.id === sceneId ? { ...sc, ...clone(snap) } : sc
      ),
      historyIndex: s.historyIndex - 1,
      selectedIds: [],
    }))
  },

  redo: () => {
    const state = get()
    if (state.historyIndex >= state.history.length - 1) return
    const newIndex = state.historyIndex + 1
    const snap = state.history[newIndex]
    const sceneId = state.currentSceneId || state.scenes[0]?.id
    set(s => ({
      scenes: s.scenes.map(sc =>
        sc.id === sceneId ? { ...sc, ...clone(snap) } : sc
      ),
      historyIndex: newIndex,
      selectedIds: [],
    }))
  },

  // Push manual history snapshot (e.g., before drag end)
  pushHistorySnapshot: () => {
    const state = get()
    const snap = snapshot(state)
    set(s => ({ ...pushHistory(s, snap) }))
  },

  // ---- Context menu ----
  showContextMenu: (x, y, targetId) => set({ contextMenu: { x, y, targetId } }),
  hideContextMenu: () => set({ contextMenu: null }),

  // ---- Label editor ----
  showLabelEditor: (id, x, y, value) => set({ labelEditor: { id, x, y, value } }),
  hideLabelEditor: () => set({ labelEditor: null }),

  // ---- Save / Load ----
  exportData: () => {
    const state = get()
    return JSON.stringify({
      version: 1,
      scenes: state.scenes,
      currentSceneId: state.currentSceneId,
    }, null, 2)
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json)
      set({
        scenes: data.scenes || [makeScene()],
        currentSceneId: data.currentSceneId || data.scenes?.[0]?.id,
        selectedIds: [],
        history: [],
        historyIndex: -1,
      })
    } catch (e) {
      console.error('Failed to import data:', e)
    }
  },
}))
