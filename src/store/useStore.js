import { create } from 'zustand'

/**
 * Global application state.
 * Expanded significantly in Sessions 2–5.
 */
const useStore = create((set) => ({
  // UI state
  mode: 'lighting', // 'blueprint' | 'lighting'
  sidebarCollapsed: false,
  darkMode: true,
  zoom: 1,

  // Project state (placeholder for Session 5)
  projectName: 'Untitled Project',
  scenes: [{ id: 'scene-1', name: 'Scene 1', elements: [] }],
  activeSceneId: 'scene-1',

  // Actions
  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.1), 5) }),
}))

export default useStore
