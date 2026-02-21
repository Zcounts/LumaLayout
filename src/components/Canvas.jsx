import React, { useRef, useEffect, useCallback, useState } from 'react'
import {
  Stage, Layer, Line, Rect, Circle, RegularPolygon,
  Group, Image as KonvaImage, Text, Transformer,
} from 'react-konva'
import useImage from 'use-image'
import { useStore } from '../store/useStore'
import { sharedStageRef } from '../canvasRef'

// ---- SVG dimension helpers ----
async function getSVGNaturalSize(src) {
  try {
    let text
    if (src.startsWith('data:')) {
      if (src.includes(';base64,')) {
        text = atob(src.split(';base64,')[1])
      } else {
        text = decodeURIComponent(src.split(',')[1])
      }
    } else {
      const resp = await fetch(src)
      text = await resp.text()
    }
    const parser = new DOMParser()
    const svg = parser.parseFromString(text, 'image/svg+xml')
    const svgEl = svg.querySelector('svg')
    if (!svgEl) return null
    const vb = svgEl.getAttribute('viewBox')
    if (vb) {
      const parts = vb.trim().split(/[\s,]+/).map(Number)
      const vbW = parts[2], vbH = parts[3]
      if (vbW > 0 && vbH > 0) return { w: vbW, h: vbH }
    }
    const w = parseFloat(svgEl.getAttribute('width'))
    const h = parseFloat(svgEl.getAttribute('height'))
    if (w > 0 && h > 0) return { w, h }
  } catch {}
  return null
}

function calcIconSize(natural, targetSize = 60) {
  if (!natural) return { width: targetSize, height: targetSize }
  const { w, h } = natural
  const ratio = w / h
  if (ratio >= 1) {
    return { width: targetSize, height: Math.round(targetSize / ratio) }
  } else {
    return { height: targetSize, width: Math.round(targetSize * ratio) }
  }
}

// ---- Grid Layer ----
function GridLayer({ width, height, scale, offsetX, offsetY, gridSize }) {
  const lines = []
  const color = 'rgba(0,0,0,0.06)'
  const startX = -offsetX / scale
  const startY = -offsetY / scale
  const endX = startX + width / scale
  const endY = startY + height / scale
  const firstX = Math.floor(startX / gridSize) * gridSize
  const firstY = Math.floor(startY / gridSize) * gridSize
  for (let x = firstX; x <= endX; x += gridSize)
    lines.push(<Line key={`v${x}`} points={[x, startY, x, endY]} stroke={color} strokeWidth={1 / scale} listening={false} />)
  for (let y = firstY; y <= endY; y += gridSize)
    lines.push(<Line key={`h${y}`} points={[startX, y, endX, y]} stroke={color} strokeWidth={1 / scale} listening={false} />)
  return <>{lines}</>
}

// ---- Blueprint Shape ----
function BlueprintShapeNode({ shape, isSelected, onSelect, isSelectMode, onDragEnd }) {
  const strokeColor = isSelected ? '#2563eb' : shape.stroke
  const strokeWidth = isSelected ? Math.max(shape.strokeWidth, 2) : shape.strokeWidth
  const props = { fill: shape.fill, stroke: strokeColor, strokeWidth, listening: isSelectMode }
  return (
    <Group
      x={shape.x} y={shape.y} rotation={shape.rotation}
      listening={isSelectMode}
      draggable={isSelectMode}
      onMouseDown={isSelectMode ? (e) => { e.cancelBubble = true; onSelect(shape.id) } : undefined}
      onDragStart={isSelectMode ? (e) => { e.cancelBubble = true } : undefined}
      onDragEnd={isSelectMode ? (e) => { e.cancelBubble = true; onDragEnd(shape.id, e.target.x(), e.target.y()) } : undefined}
    >
      {shape.shapeType === 'rect' && <Rect width={shape.width} height={shape.height} offsetX={shape.width / 2} offsetY={shape.height / 2} {...props} />}
      {shape.shapeType === 'circle' && <Circle radius={Math.min(shape.width, shape.height) / 2} {...props} />}
      {shape.shapeType === 'triangle' && <RegularPolygon sides={3} radius={Math.min(shape.width, shape.height) / 2} {...props} />}
      {isSelected && (
        <Rect
          offsetX={shape.width / 2 + 5} offsetY={shape.height / 2 + 5}
          width={shape.width + 10} height={shape.height + 10}
          stroke="#2563eb" strokeWidth={1.5} fill="rgba(37,99,235,0.08)"
          dash={[5, 3]} listening={false}
        />
      )}
      {shape.label && <Text text={shape.label} fontSize={12} fill="#333" y={shape.height / 2 + 4} offsetX={shape.width / 2} align="center" width={shape.width} listening={false} />}
    </Group>
  )
}

// ---- Room Drawing ----
function RoomLayer({ scene, scale }) {
  const { roomPoints, roomClosed } = scene
  if (!roomPoints.length) return null
  const flatPts = roomPoints.flatMap(p => [p.x, p.y])
  return (
    <>
      <Line points={flatPts} stroke="#334155" strokeWidth={3 / scale} closed={roomClosed} fill={roomClosed ? 'rgba(226,232,240,0.4)' : undefined} listening={false} />
      {!roomClosed && roomPoints.map((p, i) => (
        <Circle key={i} x={p.x} y={p.y} radius={5 / scale} fill={i === 0 ? '#10b981' : '#3b82f6'} listening={false} />
      ))}
    </>
  )
}

// ---- Element image (just the visual, no positioning) ----
function ElementImage({ element }) {
  const src = element.iconPath.startsWith('data:')
    ? element.iconPath
    : `./icons/${encodeURIComponent(element.iconPath)}`
  const [image] = useImage(src)
  const hw = element.width / 2
  const hh = element.height / 2
  if (image) {
    return <KonvaImage image={image} width={element.width} height={element.height} offsetX={hw} offsetY={hh} />
  }
  return <Rect width={element.width} height={element.height} offsetX={hw} offsetY={hh} fill="rgba(100,120,200,0.25)" stroke="rgba(100,120,200,0.5)" strokeWidth={1} />
}

// ---- Lighting element node ----
function LightingElementNode({ element, onSelect, onDragStart, onDragMove, onDragEnd, onContextMenu, onDoubleClick }) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      draggable
      onDragStart={(e) => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      onClick={(e) => { e.cancelBubble = true; onSelect(element.id, e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey) }}
      onTap={(e) => { e.cancelBubble = true; onSelect(element.id, false) }}
      onContextMenu={(e) => { e.evt.preventDefault(); e.cancelBubble = true; onContextMenu(element.id, e.evt.clientX, e.evt.clientY) }}
      onDblClick={(e) => { e.evt.preventDefault(); e.cancelBubble = true; onDoubleClick(element.id, e.evt.clientX, e.evt.clientY) }}
    >
      <ElementImage element={element} />
      {element.label ? (
        <Text
          text={element.label}
          fontSize={11}
          fill="#1e293b"
          align="center"
          width={Math.max(element.width, 80)}
          offsetX={Math.max(element.width, 80) / 2}
          y={element.height / 2 + 4}
          fontFamily="'Segoe UI', sans-serif"
          listening={false}
        />
      ) : null}
    </Group>
  )
}

// ---- Canvas ----
export default function Canvas() {
  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const layerRef = useRef(null)
  const containerRef = useRef(null)

  // Expose stage to App.jsx for export
  useEffect(() => {
    sharedStageRef.current = stageRef.current
    return () => { sharedStageRef.current = null }
  })

  const mode = useStore(s => s.mode)
  const snapToGrid = useStore(s => s.snapToGrid)
  const gridSize = useStore(s => s.gridSize)
  const showGrid = useStore(s => s.showGrid)
  const stageX = useStore(s => s.stageX)
  const stageY = useStore(s => s.stageY)
  const stageScale = useStore(s => s.stageScale)
  const setViewport = useStore(s => s.setViewport)
  const selectedIds = useStore(s => s.selectedIds)
  const setSelectedIds = useStore(s => s.setSelectedIds)
  const selectElement = useStore(s => s.selectElement)
  const clearSelection = useStore(s => s.clearSelection)
  const addElement = useStore(s => s.addElement)
  const updateElement = useStore(s => s.updateElement)
  const updateElementWithHistory = useStore(s => s.updateElementWithHistory)
  const updateMultipleElementsWithHistory = useStore(s => s.updateMultipleElementsWithHistory)
  const pushHistorySnapshot = useStore(s => s.pushHistorySnapshot)
  const showContextMenu = useStore(s => s.showContextMenu)
  const hideContextMenu = useStore(s => s.hideContextMenu)
  const showLabelEditor = useStore(s => s.showLabelEditor)
  const blueprintTool = useStore(s => s.blueprintTool)
  const setBlueprintTool = useStore(s => s.setBlueprintTool)
  const selectedShapeIds = useStore(s => s.selectedShapeIds)
  const selectShape = useStore(s => s.selectShape)
  const clearShapeSelection = useStore(s => s.clearShapeSelection)
  const updateShape = useStore(s => s.updateShape)
  const addRoomPoint = useStore(s => s.addRoomPoint)
  const closeRoom = useStore(s => s.closeRoom)
  const addShape = useStore(s => s.addShape)
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)
  const groupSelectedElements = useStore(s => s.groupSelectedElements)
  const duplicateSelectedElements = useStore(s => s.duplicateSelectedElements)
  const deleteSelectedElements = useStore(s => s.deleteSelectedElements)
  const getCurrentScene = useStore(s => s.getCurrentScene)

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [isSpaceDown, setIsSpaceDown] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  // Blueprint drawing
  const [previewPoint, setPreviewPoint] = useState(null)
  const [shapeStart, setShapeStart] = useState(null)
  const [shapePreview, setShapePreview] = useState(null)

  // Drag selection (screen coords)
  const [dragSel, setDragSel] = useState(null)
  const isDragSel = useRef(false)
  const dragSelStart = useRef(null)

  // Group drag tracking
  const dragStartPositions = useRef({})
  const dragSnapDelta = useRef(null)

  // Track stage size
  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight })
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const snapCoord = useCallback((v) => snapToGrid ? Math.round(v / gridSize) * gridSize : v, [snapToGrid, gridSize])

  const getCanvasPointer = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const pos = stage.getPointerPosition()
    if (!pos) return { x: 0, y: 0 }
    return { x: (pos.x - stageX) / stageScale, y: (pos.y - stageY) / stageScale }
  }, [stageX, stageY, stageScale])

  // Update Transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return
    const nodes = selectedIds
      .map(id => layerRef.current.findOne(`#${id}`))
      .filter(Boolean)
    transformerRef.current.nodes(nodes)
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedIds])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ' && !e.repeat) { setIsSpaceDown(true); e.preventDefault(); return }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelectedElements(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); groupSelectedElements(); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedIds.length > 0) { e.preventDefault(); deleteSelectedElements() } return }
      if (e.key === 'Escape') { clearSelection(); clearShapeSelection(); hideContextMenu(); setBlueprintState() }
      // Blueprint mode tool shortcuts
      if (mode === 'blueprint' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'v' || e.key === 'V') { setBlueprintTool('select'); return }
        if (e.key === 'p' || e.key === 'P') { setBlueprintTool('room'); return }
        if (e.key === 'r' || e.key === 'R') { setBlueprintTool('rect'); return }
        if (e.key === 'c' || e.key === 'C') { setBlueprintTool('circle'); return }
        if (e.key === 't' || e.key === 'T') { setBlueprintTool('triangle'); return }
      }
    }
    const onKeyUp = (e) => { if (e.key === ' ') setIsSpaceDown(false) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [mode, selectedIds, undo, redo, duplicateSelectedElements, groupSelectedElements, deleteSelectedElements, clearSelection, clearShapeSelection, hideContextMenu, setBlueprintTool])

  const setBlueprintState = () => { setShapeStart(null); setShapePreview(null); setPreviewPoint(null) }

  // ---- Element selection with group awareness ----
  const handleElementSelect = useCallback((id, multi) => {
    hideContextMenu()
    const scene = getCurrentScene()
    const el = scene?.elements.find(e => e.id === id)
    if (!el) return

    // If element is in a group, select all group members
    if (el.groupId) {
      const groupMembers = scene.elements.filter(e => e.groupId === el.groupId).map(e => e.id)
      if (multi) {
        const allSelected = groupMembers.every(gid => selectedIds.includes(gid))
        setSelectedIds(allSelected
          ? selectedIds.filter(sid => !groupMembers.includes(sid))
          : [...new Set([...selectedIds, ...groupMembers])])
      } else {
        setSelectedIds(groupMembers)
      }
    } else {
      selectElement(id, multi)
    }
  }, [hideContextMenu, getCurrentScene, selectedIds, setSelectedIds, selectElement])

  // ---- Group-aware drag ----
  const handleDragStart = useCallback((id) => {
    // If not selected, select it
    if (!selectedIds.includes(id)) {
      const scene = getCurrentScene()
      const el = scene?.elements.find(e => e.id === id)
      if (el?.groupId) {
        const groupMembers = scene.elements.filter(e => e.groupId === el.groupId).map(e => e.id)
        setSelectedIds(groupMembers)
      } else {
        selectElement(id, false)
      }
    }
    // Capture start positions of all selected elements
    const scene = getCurrentScene()
    const positions = {}
    const relevantIds = selectedIds.includes(id) ? selectedIds : [id]
    relevantIds.forEach(sid => {
      const el = scene?.elements.find(e => e.id === sid)
      if (el) positions[sid] = { x: el.x, y: el.y }
    })
    dragStartPositions.current = positions
    dragSnapDelta.current = null
  }, [selectedIds, getCurrentScene, setSelectedIds, selectElement])

  const handleDragMove = useCallback((id, x, y) => {
    const startPos = dragStartPositions.current[id]
    if (!startPos) return
    const dx = x - startPos.x
    const dy = y - startPos.y
    // Move sibling selected nodes visually (without state update)
    const relevantIds = Object.keys(dragStartPositions.current)
    relevantIds.forEach(sid => {
      if (sid === id) return
      const sp = dragStartPositions.current[sid]
      if (!sp) return
      const node = layerRef.current?.findOne(`#${sid}`)
      if (node) { node.x(sp.x + dx); node.y(sp.y + dy) }
    })
  }, [])

  const handleDragEnd = useCallback((id, x, y) => {
    const startPositions = dragStartPositions.current
    const startPos = startPositions[id]
    if (!startPos) {
      updateElementWithHistory(id, { x: snapCoord(x), y: snapCoord(y) })
      return
    }
    const allIds = Object.keys(startPositions)
    if (allIds.length === 1) {
      updateElementWithHistory(id, { x: snapCoord(x), y: snapCoord(y) })
    } else {
      // Raw delta from dragged element, snap each resulting position
      const dx = x - startPos.x
      const dy = y - startPos.y
      updateMultipleElementsWithHistory(allIds, (el) => ({
        x: snapCoord((startPositions[el.id]?.x ?? el.x) + dx),
        y: snapCoord((startPositions[el.id]?.y ?? el.y) + dy),
      }))
    }
    dragStartPositions.current = {}
  }, [snapCoord, snapToGrid, gridSize, updateElementWithHistory, updateMultipleElementsWithHistory])

  // ---- Blueprint shape drag end ----
  const handleShapeDragEnd = useCallback((id, x, y) => {
    pushHistorySnapshot()
    updateShape(id, { x: snapCoord(x), y: snapCoord(y) })
  }, [pushHistorySnapshot, updateShape, snapCoord])

  // ---- Transform end (scale/rotate via Transformer) ----
  const handleTransformEnd = useCallback(() => {
    pushHistorySnapshot()
    selectedIds.forEach(id => {
      const node = layerRef.current?.findOne(`#${id}`)
      if (!node) return
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      })
    })
  }, [pushHistorySnapshot, selectedIds, updateElement])

  // ---- Context menu ----
  const handleElementContextMenu = useCallback((id, cx, cy) => {
    if (!selectedIds.includes(id)) selectElement(id, false)
    showContextMenu(cx, cy, id)
  }, [selectedIds, selectElement, showContextMenu])

  // ---- Double-click for label ----
  const handleElementDoubleClick = useCallback((id, cx, cy) => {
    const scene = getCurrentScene()
    const el = scene?.elements.find(e => e.id === id)
    showLabelEditor(id, cx, cy, el?.label || '')
  }, [getCurrentScene, showLabelEditor])

  // ---- Wheel zoom ----
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldScale = stageScale
    const pointer = stage.getPointerPosition()
    const factor = e.evt.deltaY < 0 ? 1.08 : 1 / 1.08
    const newScale = Math.min(Math.max(oldScale * factor, 0.1), 5)
    const mx = (pointer.x - stageX) / oldScale
    const my = (pointer.y - stageY) / oldScale
    setViewport(pointer.x - mx * newScale, pointer.y - my * newScale, newScale)
  }, [stageX, stageY, stageScale, setViewport])

  // ---- Drop from sidebar ----
  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    if (mode !== 'lighting') return
    const data = e.dataTransfer.getData('application/json')
    if (!data) return
    const { iconFile, iconName } = JSON.parse(data)
    const rect = containerRef.current.getBoundingClientRect()
    const cx = (e.clientX - rect.left - stageX) / stageScale
    const cy = (e.clientY - rect.top - stageY) / stageScale
    // Parse SVG to preserve natural aspect ratio
    const src = iconFile.startsWith('data:') ? iconFile : `./icons/${encodeURIComponent(iconFile)}`
    const natural = await getSVGNaturalSize(src)
    const { width, height } = calcIconSize(natural, 60)
    addElement({ iconPath: iconFile, iconName, x: snapCoord(cx), y: snapCoord(cy), width, height, scaleX: 1, scaleY: 1 })
  }, [mode, stageX, stageY, stageScale, addElement, snapCoord])

  // ---- Stage mouse events ----
  const handleStageMouseDown = useCallback((e) => {
    hideContextMenu()
    if (isSpaceDown || e.evt.button === 1) { setIsPanning(true); return }

    if (mode === 'blueprint') {
      const pos = getCanvasPointer()
      const sx = snapCoord(pos.x), sy = snapCoord(pos.y)
      if (blueprintTool === 'room') {
        const scene = getCurrentScene()
        if (scene.roomClosed) return
        if (scene.roomPoints.length >= 3) {
          const first = scene.roomPoints[0]
          if (Math.hypot(sx - first.x, sy - first.y) < 15 / stageScale) { closeRoom(); return }
        }
        addRoomPoint({ x: sx, y: sy })
        return
      }
      if (['rect', 'circle', 'triangle'].includes(blueprintTool)) {
        setShapeStart({ x: sx, y: sy })
        return
      }
      // blueprintTool === 'select': clear shape selection on background click
      if (blueprintTool === 'select') {
        clearShapeSelection()
      }
      return
    }

    // Click on stage background → deselect + start drag-select
    if (e.target === stageRef.current || e.target.hasName('grid-bg')) {
      clearSelection()
      const pos = stageRef.current.getPointerPosition()
      isDragSel.current = true
      dragSelStart.current = { ...pos }
      setDragSel({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
    }
  }, [isSpaceDown, mode, blueprintTool, stageScale, getCanvasPointer, snapCoord, getCurrentScene, addRoomPoint, closeRoom, addShape, clearSelection, clearShapeSelection, hideContextMenu])

  const handleStageMouseMove = useCallback((e) => {
    if (isPanning) {
      setViewport(stageX + e.evt.movementX, stageY + e.evt.movementY, stageScale)
      return
    }
    if (mode === 'blueprint') {
      const pos = getCanvasPointer()
      setPreviewPoint({ x: snapCoord(pos.x), y: snapCoord(pos.y) })
      if (shapeStart) {
        const pos2 = getCanvasPointer()
        setShapePreview({
          x: Math.min(shapeStart.x, pos2.x), y: Math.min(shapeStart.y, pos2.y),
          width: Math.abs(pos2.x - shapeStart.x), height: Math.abs(pos2.y - shapeStart.y),
        })
      }
      return
    }
    if (isDragSel.current && dragSelStart.current) {
      const pos = stageRef.current.getPointerPosition()
      setDragSel({ x1: dragSelStart.current.x, y1: dragSelStart.current.y, x2: pos.x, y2: pos.y })
    }
  }, [isPanning, mode, stageX, stageY, stageScale, setViewport, getCanvasPointer, snapCoord, shapeStart])

  const handleStageMouseUp = useCallback((e) => {
    setIsPanning(false)

    // Blueprint shape finish
    if (mode === 'blueprint' && shapeStart && shapePreview && shapePreview.width > 5 && shapePreview.height > 5) {
      addShape({
        shapeType: blueprintTool,
        x: shapePreview.x + shapePreview.width / 2, y: shapePreview.y + shapePreview.height / 2,
        width: shapePreview.width, height: shapePreview.height,
        fill: '#e2e8f0', stroke: '#334155', strokeWidth: 2,
      })
      setShapeStart(null); setShapePreview(null)
      return
    }

    // Finalize drag selection
    if (isDragSel.current && dragSel) {
      const { x1, y1, x2, y2 } = dragSel
      const minX = Math.min(x1, x2), minY = Math.min(y1, y2)
      const maxX = Math.max(x1, x2), maxY = Math.max(y1, y2)
      if (maxX - minX > 5 || maxY - minY > 5) {
        const scene = getCurrentScene()
        if (scene) {
          const tl = { x: (minX - stageX) / stageScale, y: (minY - stageY) / stageScale }
          const br = { x: (maxX - stageX) / stageScale, y: (maxY - stageY) / stageScale }
          const hit = scene.elements.filter(el => {
            const hw = (el.width * el.scaleX) / 2, hh = (el.height * el.scaleY) / 2
            return el.x + hw >= tl.x && el.x - hw <= br.x && el.y + hh >= tl.y && el.y - hh <= br.y
          })
          setSelectedIds(hit.map(el => el.id))
        }
      }
    }
    isDragSel.current = false; setDragSel(null)
  }, [mode, blueprintTool, shapeStart, shapePreview, addShape, dragSel, stageX, stageY, stageScale, getCurrentScene, setSelectedIds])

  const scene = getCurrentScene()
  const sortedElements = scene ? [...scene.elements].sort((a, b) => a.zIndex - b.zIndex) : []
  const cursor = isPanning || isSpaceDown ? 'grabbing' : (mode === 'blueprint' && blueprintTool !== 'select' ? 'crosshair' : 'default')

  const selOverlay = dragSel && (Math.abs(dragSel.x2 - dragSel.x1) > 3 || Math.abs(dragSel.y2 - dragSel.y1) > 3)
    ? { left: Math.min(dragSel.x1, dragSel.x2), top: Math.min(dragSel.y1, dragSel.y2), width: Math.abs(dragSel.x2 - dragSel.x1), height: Math.abs(dragSel.y2 - dragSel.y1) }
    : null

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ background: '#ffffff', cursor }}
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={stageX} y={stageY}
        scaleX={stageScale} scaleY={stageScale}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        {/* Grid */}
        <Layer>
          <Rect
            x={(-stageX / stageScale) - 5000} y={(-stageY / stageScale) - 5000}
            width={10000 + stageSize.width / stageScale} height={10000 + stageSize.height / stageScale}
            fill="white" name="grid-bg"
          />
          {showGrid && (
            <GridLayer
              width={stageSize.width} height={stageSize.height}
              scale={stageScale} offsetX={stageX} offsetY={stageY} gridSize={gridSize}
            />
          )}
        </Layer>

        {/* Blueprint layer */}
        <Layer listening={mode === 'blueprint'}>
          {scene && <RoomLayer scene={scene} scale={stageScale} />}
          {scene?.shapes.map(s => (
            <BlueprintShapeNode
              key={s.id} shape={s}
              isSelected={selectedShapeIds.includes(s.id)}
              onSelect={(id) => selectShape(id, false)}
              isSelectMode={blueprintTool === 'select'}
              onDragEnd={handleShapeDragEnd}
            />
          ))}
          {/* Shape draw preview */}
          {shapePreview && blueprintTool === 'rect' && (
            <Rect x={shapePreview.x} y={shapePreview.y} width={shapePreview.width} height={shapePreview.height}
              fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={1.5 / stageScale} dash={[5 / stageScale, 3 / stageScale]} listening={false} />
          )}
          {shapePreview && blueprintTool === 'circle' && (
            <Circle x={shapePreview.x + shapePreview.width / 2} y={shapePreview.y + shapePreview.height / 2}
              radius={Math.min(shapePreview.width, shapePreview.height) / 2}
              fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={1.5 / stageScale} dash={[5 / stageScale, 3 / stageScale]} listening={false} />
          )}
          {shapePreview && blueprintTool === 'triangle' && (
            <RegularPolygon sides={3} x={shapePreview.x + shapePreview.width / 2} y={shapePreview.y + shapePreview.height / 2}
              radius={Math.min(shapePreview.width, shapePreview.height) / 2}
              fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={1.5 / stageScale} dash={[5 / stageScale, 3 / stageScale]} listening={false} />
          )}
          {/* Room draw preview */}
          {mode === 'blueprint' && blueprintTool === 'room' && scene && !scene.roomClosed && scene.roomPoints.length > 0 && previewPoint && (
            <Line
              points={[scene.roomPoints[scene.roomPoints.length - 1].x, scene.roomPoints[scene.roomPoints.length - 1].y, previewPoint.x, previewPoint.y]}
              stroke="#3b82f6" strokeWidth={2 / stageScale} dash={[6 / stageScale, 3 / stageScale]} listening={false}
            />
          )}
        </Layer>

        {/* Lighting elements layer */}
        <Layer ref={layerRef} listening={mode === 'lighting'}>
          {sortedElements.map(element => (
            mode === 'lighting' ? (
              <LightingElementNode
                key={element.id}
                element={element}
                onSelect={handleElementSelect}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onContextMenu={handleElementContextMenu}
                onDoubleClick={handleElementDoubleClick}
              />
            ) : (
              /* Ghost view in Blueprint Mode */
              <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation}
                scaleX={element.scaleX} scaleY={element.scaleY} opacity={0.25} listening={false}>
                <ElementImage element={element} />
              </Group>
            )
          ))}

          {/* Transformer for resize/rotate/move */}
          {mode === 'lighting' && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 15 || Math.abs(newBox.height) < 15 ? oldBox : newBox)}
              onTransformEnd={handleTransformEnd}
              anchorFill="#ffffff"
              anchorStroke="#2563eb"
              anchorSize={9}
              anchorCornerRadius={2}
              borderStroke="#2563eb"
              borderStrokeWidth={1.5}
              borderDash={[5, 3]}
              rotateAnchorOffset={22}
            />
          )}
        </Layer>
      </Stage>

      {/* Drag-select overlay */}
      {selOverlay && (
        <div className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm"
          style={{ left: selOverlay.left, top: selOverlay.top, width: selOverlay.width, height: selOverlay.height }} />
      )}

      {/* Bottom status bar */}
      <div className="absolute bottom-2 right-3 bg-white/90 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-500 font-mono shadow-sm">
        {Math.round(stageScale * 100)}% {selectedIds.length > 0 ? `· ${selectedIds.length} selected` : ''}
      </div>
    </div>
  )
}
