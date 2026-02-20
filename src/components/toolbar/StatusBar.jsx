import React from 'react'
import useStore from '../../store/useStore'

export default function StatusBar() {
  const scale = useStore((s) => s.scale)
  const mode = useStore((s) => s.mode)
  const snapToGrid = useStore((s) => s.snapToGrid)
  const blueprintTool = useStore((s) => s.blueprintTool)
  const isDrawingRoom = useStore((s) => s.isDrawingRoom)
  const currentRoomPoints = useStore((s) => s.currentRoomPoints)

  const toolHints = {
    'draw-room': isDrawingRoom
      ? `Placing points: ${currentRoomPoints.length / 2} placed — click first point to close`
      : 'Click to start drawing a room outline',
    'add-rectangle': 'Click on canvas to place a rectangle',
    'add-circle': 'Click on canvas to place a circle',
    'add-door': 'Click on canvas to place a door marker',
    'add-window': 'Click on canvas to place a window marker',
  }

  const hint = toolHints[blueprintTool] || (
    mode === 'blueprint'
      ? 'Select a Blueprint tool above, or scroll to zoom, Space+drag to pan'
      : 'Blueprint elements are locked — use the sidebar to add lighting equipment'
  )

  return (
    <footer className="flex items-center justify-between px-4 h-7 bg-slate-900 border-t border-slate-700 text-slate-500 text-xs flex-shrink-0">
      <span>{hint}</span>
      <div className="flex items-center gap-4">
        {snapToGrid && (
          <span className="text-blue-500">Grid snap ON</span>
        )}
        <span>Zoom: {Math.round(scale * 100)}%</span>
        <span className="text-slate-600">LumaLayout</span>
      </div>
    </footer>
  )
}
