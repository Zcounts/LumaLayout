import React, { useMemo } from 'react'
import { Layer, Circle } from 'react-konva'
import useStore from '../../store/useStore'

/**
 * Renders a subtle dot grid that fills the visible canvas area.
 * The grid is drawn in canvas (stage) coordinates and stays fixed
 * relative to the world, so it scrolls naturally with the stage.
 */
export default function DotGrid({ stageWidth, stageHeight }) {
  const scale = useStore((s) => s.scale)
  const stagePos = useStore((s) => s.stagePos)
  const gridSize = useStore((s) => s.gridSize)

  const dots = useMemo(() => {
    // Compute world-space bounds of the visible viewport
    const worldLeft = -stagePos.x / scale
    const worldTop = -stagePos.y / scale
    const worldRight = worldLeft + stageWidth / scale
    const worldBottom = worldTop + stageHeight / scale

    // Snap to grid boundaries
    const startX = Math.floor(worldLeft / gridSize) * gridSize
    const startY = Math.floor(worldTop / gridSize) * gridSize

    const result = []
    for (let x = startX; x <= worldRight; x += gridSize) {
      for (let y = startY; y <= worldBottom; y += gridSize) {
        result.push({ x, y })
      }
    }
    return result
  }, [scale, stagePos, stageWidth, stageHeight, gridSize])

  // Dot radius shrinks when zoomed out, grows slightly when zoomed in
  const dotRadius = Math.max(0.8, Math.min(1.5, scale * 1.2))
  const dotOpacity = Math.max(0.15, Math.min(0.4, scale * 0.5))

  return (
    <Layer listening={false}>
      {dots.map((d, i) => (
        <Circle
          key={i}
          x={d.x}
          y={d.y}
          radius={dotRadius}
          fill="#94a3b8"
          opacity={dotOpacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Layer>
  )
}
