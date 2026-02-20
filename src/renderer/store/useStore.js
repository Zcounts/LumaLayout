import { create } from 'zustand'

let nextId = 1
const uid = () => `el-${nextId++}`

export const useStore = create((set, get) => ({
  // ── Mode ────────────────────────────────────────────────────────────────
  mode: 'blueprint', // 'blueprint' | 'lighting'
  setMode: (mode) => set({ mode }),

  // ── Blueprint elements (shapes drawn in Blueprint Mode) ─────────────────
  blueprintElements: [],

  addBlueprintElement: (element) =>
    set((state) => ({
      blueprintElements: [...state.blueprintElements, { id: uid(), ...element }],
    })),

  updateBlueprintElement: (id, changes) =>
    set((state) => ({
      blueprintElements: state.blueprintElements.map((el) =>
        el.id === id ? { ...el, ...changes } : el
      ),
    })),

  deleteBlueprintElement: (id) =>
    set((state) => ({
      blueprintElements: state.blueprintElements.filter((el) => el.id !== id),
      selectedBlueprintId: state.selectedBlueprintId === id ? null : state.selectedBlueprintId,
    })),

  // ── Lighting icons (placed in Lighting Mode) ─────────────────────────────
  lightingIcons: [],

  addLightingIcon: (icon) =>
    set((state) => ({
      lightingIcons: [...state.lightingIcons, { id: uid(), rotation: 0, ...icon }],
    })),

  updateLightingIcon: (id, changes) =>
    set((state) => ({
      lightingIcons: state.lightingIcons.map((ic) =>
        ic.id === id ? { ...ic, ...changes } : ic
      ),
    })),

  deleteLightingIcon: (id) =>
    set((state) => ({
      lightingIcons: state.lightingIcons.filter((ic) => ic.id !== id),
      selectedLightingId: state.selectedLightingId === id ? null : state.selectedLightingId,
    })),

  // ── Selection ────────────────────────────────────────────────────────────
  selectedBlueprintId: null,
  setSelectedBlueprintId: (id) => set({ selectedBlueprintId: id }),

  selectedLightingId: null,
  setSelectedLightingId: (id) => set({ selectedLightingId: id }),

  // ── Blueprint drawing tool ───────────────────────────────────────────────
  currentTool: 'select', // 'select' | 'rect' | 'circle' | 'text'
  setCurrentTool: (tool) => set({ currentTool: tool }),

  // ── Canvas viewport ──────────────────────────────────────────────────────
  stageScale: 1,
  stageX: 0,
  stageY: 0,
  setStageView: (scale, x, y) => set({ stageScale: scale, stageX: x, stageY: y }),
}))
