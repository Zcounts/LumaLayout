import React from 'react'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import CanvasArea from './components/CanvasArea'
import useStore from './store/useStore'

/**
 * Root application layout.
 * Structure:
 *   ┌──────────────────────────────┐
 *   │         Toolbar              │ ← top, full width
 *   ├──────────┬───────────────────┤
 *   │ Sidebar  │   CanvasArea      │ ← fills remaining height
 *   │ (left)   │   (main content)  │
 *   └──────────┴───────────────────┘
 */
export default function App() {
  const { darkMode } = useStore()

  return (
    <div className={`${darkMode ? 'dark' : ''} flex flex-col h-full`}>
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <CanvasArea />
      </div>
    </div>
  )
}
