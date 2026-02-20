import React, { useRef, useEffect, useState } from 'react'
import useStore from '../store/useStore'

/**
 * Main canvas area.
 * Session 1: Renders a placeholder canvas with mode indicator.
 * Session 2: Blueprint drawing tools (react-konva Stage).
 * Session 3+: Full interactive canvas with icons and interactions.
 */
export default function CanvasArea() {
  const { mode, zoom } = useStore()
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Track container size for react-konva Stage sizing (used from Session 2+)
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const isBlueprintMode = mode === 'blueprint'
  const modeColor = isBlueprintMode ? 'text-accent-blueprint' : 'text-accent-lighting'
  const modeBg = isBlueprintMode ? 'bg-accent-blueprint/10 border-accent-blueprint/30' : 'bg-accent-lighting/10 border-accent-lighting/30'

  return (
    <main
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-canvas-bg"
      style={{ cursor: 'default' }}
    >
      {/* Grid background (subtle, always visible) */}
      <GridBackground zoom={zoom} />

      {/* Canvas placeholder — replaced by react-konva Stage in Session 2 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className={`
          flex flex-col items-center gap-3 px-6 py-5 rounded-xl
          border ${modeBg} backdrop-blur-sm
        `}>
          <CanvasIcon isBlueprintMode={isBlueprintMode} />
          <div className="text-center">
            <p className={`font-semibold text-sm ${modeColor}`}>
              {isBlueprintMode ? 'Blueprint Mode' : 'Lighting Mode'}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {isBlueprintMode
                ? 'Canvas coming in Session 2 — draw rooms, walls, and shapes'
                : 'Canvas coming in Session 2 — place and arrange lighting icons'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <StatusBar zoom={zoom} mode={mode} size={size} />
    </main>
  )
}

function GridBackground({ zoom }) {
  const spacing = Math.max(10, 20 * zoom)
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.5" cy="0.5" r="0.5" fill="#c8ccd4" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

function StatusBar({ zoom, mode, size }) {
  return (
    <div className="
      absolute bottom-0 left-0 right-0
      flex items-center gap-4 px-3 py-1
      bg-white/80 border-t border-gray-200
      text-xs text-gray-500
      backdrop-blur-sm
    ">
      <span className={`
        font-medium px-1.5 py-0.5 rounded text-xs
        ${mode === 'blueprint'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700'
        }
      `}>
        {mode === 'blueprint' ? 'Blueprint' : 'Lighting'}
      </span>
      <span className="tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      {size.width > 0 && (
        <span className="text-gray-400">
          {Math.round(size.width)} × {Math.round(size.height)}px
        </span>
      )}
      <div className="flex-1" />
      <span className="text-gray-400">LightPlot v0.1</span>
    </div>
  )
}

function CanvasIcon({ isBlueprintMode }) {
  if (isBlueprintMode) {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
        className="text-accent-blueprint" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="5" width="30" height="30" rx="2" />
        <path d="M5 15h30M15 5v30" />
        <path d="M20 20l6-6M20 20l-6 6" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
      className="text-accent-lighting" stroke="currentColor" strokeWidth="1.5">
      <circle cx="20" cy="20" r="6" />
      <path d="M20 4v4M20 32v4M4 20h4M32 20h4" strokeLinecap="round" />
      <path d="M8.7 8.7l2.8 2.8M28.5 28.5l2.8 2.8M31.3 8.7l-2.8 2.8M11.5 28.5l-2.8 2.8"
        strokeLinecap="round" />
    </svg>
  )
}
