import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import useStore from '../../store/useStore'
import DotGrid from './DotGrid'
import RoomLayer from '../blueprint/RoomLayer'
import ShapeLayer from '../blueprint/ShapeLayer'
import DoorWindowLayer from '../blueprint/DoorWindowLayer'

const MIN_SCALE = 0.1
const MAX_SCALE = 8
const ZOOM_FACTOR = 1.08
const FIRST_POINT_SNAP_RADIUS = 12 // px in screen space

export default function Canvas() {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  const mode = useStore((s) => s.mode)
  const blueprintTool = useStore((s) => s.blueprintTool)
  const setBlueprintTool = useStore((s) => s.setBlueprintTool)
  const scale = useStore((s) => s.scale)
  const setScale = useStore((s) => s.setScale)
  const stagePos = useStore((s) => s.stagePos)
  const setStagePos = useStore((s) => s.setStagePos)
  const snapValue = useStore((s) => s.snapValue)

  // Room drawing
  const isDrawingRoom = useStore((s) => s.isDrawingRoom)
  const currentRoomPoints = useStore((s) => s.currentRoomPoints)
  const setDrawingRoom = useStore((s) => s.setDrawingRoom)
  const addRoomPoint = useStore((s) => s.addRoomPoint)
  const resetRoomPoints = useStore((s) => s.resetRoomPoints)
  const addRoom = useStore((s) => s.addRoom)

  // Shapes / doors / windows
  const addShape = useStore((s) => s.addShape)
  const addDoor = useStore((s) => s.addDoor)
  const addWindow = useStore((s) => s.addWindow)
  const setSelectedId = useStore((s) => s.setSelectedId)

  // Pan state
  const isPanning = useRef(false)
  const spaceDown = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  // ── Resize observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Keyboard listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceDown.current = true
      }
      if (e.code === 'Escape') {
        if (isDrawingRoom) resetRoomPoints()
        setBlueprintTool(null)
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceDown.current = false
        isPanning.current = false
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isDrawingRoom, resetRoomPoints, setBlueprintTool])

  // ── Mouse wheel zoom ────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const oldScale = scale
      const pointer = stage.getPointerPosition()
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      }

      const direction = e.evt.deltaY > 0 ? -1 : 1
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, oldScale * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))
      )

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      }

      setScale(newScale)
      setStagePos(newPos)
    },
    [scale, stagePos, setScale, setStagePos]
  )

  // ── Pan via spacebar + drag ─────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (spaceDown.current) {
      isPanning.current = true
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY }
      e.evt.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning.current) return
      const dx = e.evt.clientX - lastPointer.current.x
      const dy = e.evt.clientY - lastPointer.current.y
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY }
      setStagePos({ x: stagePos.x + dx, y: stagePos.y + dy })
    },
    [stagePos, setStagePos]
  )

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  // ── Convert screen point to world point ────────────────────────────────────
  const screenToWorld = (screenX, screenY) => ({
    x: (screenX - stagePos.x) / scale,
    y: (screenY - stagePos.y) / scale,
  })

  // ── Stage click: blueprint tool actions ────────────────────────────────────
  const handleStageClick = useCallback(
    (e) => {
      if (isPanning.current) return
      if (mode !== 'blueprint' || !blueprintTool) {
        // Deselect
        if (e.target === e.target.getStage()) setSelectedId(null)
        return
      }

      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getPointerPosition()
      const worldX = snapValue((pos.x - stagePos.x) / scale)
      const worldY = snapValue((pos.y - stagePos.y) / scale)

      if (blueprintTool === 'draw-room') {
        if (!isDrawingRoom) {
          setDrawingRoom(true)
          addRoomPoint(worldX, worldY)
          return
        }

        // Check if clicking the first point to close the room
        if (currentRoomPoints.length >= 6) {
          const firstX = currentRoomPoints[0]
          const firstY = currentRoomPoints[1]
          // Distance in screen space
          const dxScreen = (worldX - firstX) * scale
          const dyScreen = (worldY - firstY) * scale
          const dist = Math.sqrt(dxScreen * dxScreen + dyScreen * dyScreen)

          if (dist < FIRST_POINT_SNAP_RADIUS) {
            // Close the room
            addRoom({
              id: `room-${Date.now()}`,
              type: 'room',
              points: [...currentRoomPoints],
              strokeColor: '#1e3a5f',
              strokeWidth: 3,
              fillColor: 'rgba(219,234,254,0.15)',
            })
            resetRoomPoints()
            return
          }
        }

        addRoomPoint(worldX, worldY)
        return
      }

      if (blueprintTool === 'add-rectangle') {
        addShape({
          id: `shape-${Date.now()}`,
          type: 'rectangle',
          x: worldX,
          y: worldY,
          width: 100,
          height: 70,
          fillColor: '#bfdbfe',
          strokeColor: '#3b82f6',
          label: 'Rectangle',
          rotation: 0,
        })
        setBlueprintTool(null)
        return
      }

      if (blueprintTool === 'add-circle') {
        addShape({
          id: `shape-${Date.now()}`,
          type: 'circle',
          x: worldX,
          y: worldY,
          radius: 50,
          fillColor: '#bbf7d0',
          strokeColor: '#22c55e',
          label: 'Circle',
          rotation: 0,
        })
        setBlueprintTool(null)
        return
      }

      if (blueprintTool === 'add-door') {
        addDoor({
          id: `door-${Date.now()}`,
          type: 'door',
          x: worldX,
          y: worldY,
          width: 80,
          wallAngle: 0,
          openDirection: 1,
          label: 'Door',
        })
        setBlueprintTool(null)
        return
      }

      if (blueprintTool === 'add-window') {
        addWindow({
          id: `window-${Date.now()}`,
          type: 'window',
          x: worldX,
          y: worldY,
          width: 100,
          wallAngle: 0,
          label: 'Window',
        })
        setBlueprintTool(null)
        return
      }
    },
    [
      mode,
      blueprintTool,
      isDrawingRoom,
      currentRoomPoints,
      scale,
      stagePos,
      snapValue,
      addRoomPoint,
      addRoom,
      resetRoomPoints,
      setDrawingRoom,
      addShape,
      addDoor,
      addWindow,
      setBlueprintTool,
      setSelectedId,
    ]
  )

  // ── Cursor style ────────────────────────────────────────────────────────────
  const getCursor = () => {
    if (spaceDown.current) return isPanning.current ? 'grabbing' : 'grab'
    if (mode === 'blueprint' && blueprintTool) return 'crosshair'
    return 'default'
  }

  const isLocked = mode === 'lighting'

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-50 no-select"
      style={{ cursor: getCursor() }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* Background fill (infinite white canvas feel) */}
        <Layer listening={false}>
          <Rect
            x={-stagePos.x / scale - 10000}
            y={-stagePos.y / scale - 10000}
            width={20000 + dimensions.width / scale}
            height={20000 + dimensions.height / scale}
            fill="#f8fafc"
            listening={false}
          />
        </Layer>

        {/* Dot grid */}
        <DotGrid stageWidth={dimensions.width} stageHeight={dimensions.height} />

        {/* Blueprint layers */}
        <RoomLayer isLocked={isLocked} />
        <DoorWindowLayer isLocked={isLocked} />
        <ShapeLayer isLocked={isLocked} />

        {/* Lighting layer (future sessions) */}
        <Layer>{/* lighting elements will go here */}</Layer>
      </Stage>
    </div>
  )
}
