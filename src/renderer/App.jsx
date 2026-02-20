import React, { useRef, useCallback, useEffect, useState } from 'react'
import Toolbar from './components/Toolbar'
import IconSidebar from './components/IconSidebar'
import Canvas from './components/Canvas'
import { useStore } from './store/useStore'

export default function App() {
  const canvasRef = useRef()
  const containerRef = useRef()
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const mode = useStore((s) => s.mode)
  const deleteBlueprintElement = useStore((s) => s.deleteBlueprintElement)
  const deleteLightingIcon = useStore((s) => s.deleteLightingIcon)
  const selectedBlueprintId = useStore((s) => s.selectedBlueprintId)
  const selectedLightingId = useStore((s) => s.selectedLightingId)

  // Measure container to size the canvas
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect()
        setCanvasSize({ width: r.width, height: r.height })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (mode === 'blueprint' && selectedBlueprintId) {
      deleteBlueprintElement(selectedBlueprintId)
    } else if (mode === 'lighting' && selectedLightingId) {
      deleteLightingIcon(selectedLightingId)
    }
  }, [mode, selectedBlueprintId, selectedLightingId, deleteBlueprintElement, deleteLightingIcon])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't fire if user is typing in an input
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return
        handleDeleteSelected()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleDeleteSelected])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#141517' }}>
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <Toolbar
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onResetView={() => canvasRef.current?.resetView()}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left icon sidebar ──────────────────────────────── */}
        <IconSidebar />

        {/* ── Canvas area ────────────────────────────────────── */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <Canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
          />

          {/* ── Status bar ─────────────────────────────────── */}
          <StatusBar />
        </div>
      </div>
    </div>
  )
}

// ── Status bar ────────────────────────────────────────────────────────────────

function StatusBar() {
  const mode = useStore((s) => s.mode)
  const stageScale = useStore((s) => s.stageScale)
  const blueprintElements = useStore((s) => s.blueprintElements)
  const lightingIcons = useStore((s) => s.lightingIcons)
  const selectedBlueprintId = useStore((s) => s.selectedBlueprintId)
  const selectedLightingId = useStore((s) => s.selectedLightingId)

  const zoom = Math.round(stageScale * 100)
  const isBlueprintMode = mode === 'blueprint'

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1 text-xs"
      style={{
        background: 'rgba(20,21,23,0.85)',
        borderTop: '1px solid #2a2b2f',
        color: '#555',
        height: '26px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span>
        {isBlueprintMode
          ? `${blueprintElements.length} shape${blueprintElements.length !== 1 ? 's' : ''}${selectedBlueprintId ? ' • 1 selected' : ''}`
          : `${lightingIcons.length} icon${lightingIcons.length !== 1 ? 's' : ''}${selectedLightingId ? ' • 1 selected' : ''}`}
      </span>
      <span>
        {isBlueprintMode
          ? 'Blueprint: draw room layout • Select tool to move shapes'
          : 'Lighting: drag icons from sidebar • Click to select • Delete to remove'}
      </span>
      <span>{zoom}%</span>
    </div>
  )
}
