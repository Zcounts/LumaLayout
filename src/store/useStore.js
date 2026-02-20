import { create } from 'zustand'

// ── helpers ──────────────────────────────────────────────────────────────────
const GRID_SIZE = 20 // px at zoom=1

function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize
}

// ── dummy Blueprint elements (hardcoded to verify canvas) ─────────────────────
const DUMMY_ROOM = {
  id: 'room-1',
  type: 'room',
  points: [
    100, 100,
    600, 100,
    600, 500,
    400, 500,
    400, 350,
    100, 350,
  ],
  strokeColor: '#1e3a5f',
  strokeWidth: 3,
  fillColor: 'rgba(219,234,254,0.15)',
}

const DUMMY_SHAPES = [
  {
    id: 'shape-1',
    type: 'rectangle',
    x: 150,
    y: 160,
    width: 120,
    height: 80,
    fillColor: '#a5b4fc',
    strokeColor: '#4338ca',
    label: 'Desk',
    rotation: 0,
  },
  {
    id: 'shape-2',
    type: 'circle',
    x: 480,
    y: 200,
    radius: 45,
    fillColor: '#86efac',
    strokeColor: '#15803d',
    label: 'Column',
    rotation: 0,
  },
  {
    id: 'shape-3',
    type: 'rectangle',
    x: 200,
    y: 270,
    width: 80,
    height: 50,
    fillColor: '#fcd34d',
    strokeColor: '#d97706',
    label: 'Chair',
    rotation: 15,
  },
]

const DUMMY_DOORS = [
  {
    id: 'door-1',
    type: 'door',
    // position on wall: start of wall segment (x1,y1) → (x2,y2), offset along wall
    x: 280,
    y: 100,
    width: 80,
    wallAngle: 0, // horizontal wall
    openDirection: 1, // 1 = opens downward, -1 = upward
    label: 'Door',
  },
]

const DUMMY_WINDOWS = [
  {
    id: 'window-1',
    type: 'window',
    x: 450,
    y: 100,
    width: 100,
    wallAngle: 0,
    label: 'Window',
  },
  {
    id: 'window-2',
    type: 'window',
    x: 600,
    y: 200,
    width: 100,
    wallAngle: 90,
    label: 'Side Window',
  },
]

// ── store ──────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  // ── App mode ──
  mode: 'blueprint', // 'blueprint' | 'lighting'
  setMode: (mode) => set({ mode, blueprintTool: null }),

  // ── Canvas viewport ──
  stagePos: { x: 0, y: 0 },
  setStagePos: (pos) => set({ stagePos: pos }),

  scale: 1,
  setScale: (scale) => set({ scale: Math.min(Math.max(scale, 0.1), 5) }),

  // ── Grid ──
  snapToGrid: false,
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  gridSize: GRID_SIZE,

  snapValue: (value) => {
    const { snapToGrid: snap, gridSize } = get()
    return snap ? snapToGrid(value, gridSize) : value
  },

  // ── Blueprint tool ──
  // null | 'draw-room' | 'add-rectangle' | 'add-circle' | 'add-door' | 'add-window'
  blueprintTool: null,
  setBlueprintTool: (tool) => set({ blueprintTool: tool }),

  // ── Room drawing state ──
  isDrawingRoom: false,
  currentRoomPoints: [], // flat [x,y,x,y,…]
  setDrawingRoom: (val) => set({ isDrawingRoom: val }),
  addRoomPoint: (x, y) =>
    set((s) => ({ currentRoomPoints: [...s.currentRoomPoints, x, y] })),
  resetRoomPoints: () => set({ currentRoomPoints: [], isDrawingRoom: false }),

  // ── Blueprint elements ──
  rooms: [DUMMY_ROOM],
  shapes: DUMMY_SHAPES,
  doors: DUMMY_DOORS,
  windows: DUMMY_WINDOWS,

  addRoom: (room) => set((s) => ({ rooms: [...s.rooms, room] })),
  addShape: (shape) => set((s) => ({ shapes: [...s.shapes, shape] })),
  addDoor: (door) => set((s) => ({ doors: [...s.doors, door] })),
  addWindow: (win) => set((s) => ({ windows: [...s.windows, win] })),

  updateShape: (id, updates) =>
    set((s) => ({
      shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...updates } : sh)),
    })),

  deleteShape: (id) => set((s) => ({ shapes: s.shapes.filter((sh) => sh.id !== id) })),

  // ── Selected element ──
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),

  // ── Lighting elements (for future sessions) ──
  lightingElements: [],
  addLightingElement: (el) =>
    set((s) => ({ lightingElements: [...s.lightingElements, el] })),
}))

export default useStore
