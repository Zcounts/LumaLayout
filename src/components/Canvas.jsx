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
// id is set on the Group so the Transformer can find it by id.
// The Transformer renders the selection border — no manual selection rect needed.
function BlueprintShapeNode({ shape, isSelected, onSelect, isSelectMode, onDragEnd, onDblClick }) {
  const strokeColor = isSelected ? '#2563eb' : shape.stroke
  const strokeWidth = isSelected ? Math.max(shape.strokeWidth, 2) : shape.strokeWidth
  const props = { fill: shape.fill, stroke: strokeColor, strokeWidth, listening: isSelectMode }
  return (
    <Group
      id={shape.id}
      x={shape.x} y={shape.y} rotation={shape.rotation}
      listening={isSelectMode}
      draggable={isSelectMode}
      onMouseDown={isSelectMode ? (e) => { e.cancelBubble = true; onSelect(shape.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) } : undefined}
      onDragStart={isSelectMode ? (e) => { e.cancelBubble = true } : undefined}
      onDragEnd={isSelectMode ? (e) => { e.cancelBubble = true; onDragEnd(shape.id, e.target.x(), e.target.y()) } : undefined}
      onDblClick={isSelectMode && onDblClick ? (e) => { e.evt.preventDefault(); e.cancelBubble = true; onDblClick(shape.id, e.evt.clientX, e.evt.clientY) } : undefined}
    >
      {shape.shapeType === 'rect' && <Rect width={shape.width} height={shape.height} offsetX={shape.width / 2} offsetY={shape.height / 2} {...props} />}
      {shape.shapeType === 'circle' && <Circle radius={Math.min(shape.width, shape.height) / 2} {...props} />}
      {shape.shapeType === 'triangle' && <RegularPolygon sides={3} radius={Math.min(shape.width, shape.height) / 2} {...props} />}
      {shape.label && (
        <Text
          text={shape.label}
          fontSize={12}
          fill="#333"
          align="center"
          verticalAlign="middle"
          width={shape.width}
          height={shape.height}
          offsetX={shape.width / 2}
          offsetY={shape.height / 2}
          listening={false}
        />
      )}
    </Group>
  )
}

// ---- Room Drawing / Selection ----
// In select mode the whole room group is draggable and selectable.
// The Transformer attaches to this group (id="__room__") for scale/rotate.
function RoomLayer({ scene, scale, isSelectMode, isSelected, onSelect, onDragEnd }) {
  const { roomPoints, roomClosed } = scene
  if (!roomPoints.length) return null
  const flatPts = roomPoints.flatMap(p => [p.x, p.y])
  const strokeColor = isSelected ? '#2563eb' : '#334155'
  const strokeWidth = (isSelected ? 4 : 3) / scale

  return (
    <Group
      id="__room__"
      draggable={isSelectMode}
      listening={isSelectMode}
      onMouseDown={isSelectMode ? (e) => { e.cancelBubble = true; onSelect('__room__', e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) } : undefined}
      onDragStart={isSelectMode ? (e) => { e.cancelBubble = true } : undefined}
      onDragEnd={isSelectMode ? onDragEnd : undefined}
    >
      <Line
        points={flatPts}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        closed={roomClosed}
        fill={roomClosed ? 'rgba(226,232,240,0.4)' : undefined}
        hitStrokeWidth={14 / scale}
      />
      {!roomClosed && roomPoints.map((p, i) => (
        <Circle key={i} x={p.x} y={p.y} radius={5 / scale} fill={i === 0 ? '#10b981' : '#3b82f6'} listening={false} />
      ))}
    </Group>
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
      {(() => {
        const lines = [
          element.label,
          element.accessories,
          element.colorTemperature,
          element.notes,
        ].filter(Boolean)
        if (lines.length === 0) return null
        const textW = Math.max(element.width, 80)
        const sx = element.scaleX || 1
        const sy = element.scaleY || 1
        // Strategy: always place the text STRAIGHT DOWN in screen space from the
        // icon's centre, at a distance that clears the icon at any rotation angle.
        //
        // The text node is counter-rotated and counter-scaled so it is always
        // upright and the same size.  But its POSITION is in the group's local
        // space, where axes are rotated by θ.  We need to invert the group's
        // transform to find the local (lx, ly) that maps to a pure screen-space
        // downward offset of d pixels:
        //
        //   screen_offset = Rotate(θ) · Scale(sx, sy) · (lx, ly) = (0, d)
        //   ⟹ (lx, ly) = Scale(1/sx, 1/sy) · Rotate(-θ) · (0, d)
        //               = ( d·sin(θ)/sx ,  d·cos(θ)/sy )
        //
        // For d we use the half-diagonal of the scaled icon plus fixed padding.
        // The half-diagonal is the radius of the smallest enclosing circle of
        // the icon — so the text always starts outside that circle regardless of
        // how the icon is rotated.
        const θ        = ((element.rotation || 0) * Math.PI) / 180
        const halfDiag = Math.hypot(element.width * sx / 2, element.height * sy / 2)
        const d        = halfDiag + 14
        const lx       = d * Math.sin(θ) / sx
        const ly       = d * Math.cos(θ) / sy
        return (
          <Text
            text={lines.join('\n')}
            fontSize={11}
            fill="#1e293b"
            align="center"
            width={textW}
            x={lx}
            y={ly}
            offsetX={textW / 2}
            fontFamily="'Segoe UI', sans-serif"
            lineHeight={1.35}
            listening={false}
            rotation={-(element.rotation || 0)}
            scaleX={1 / sx}
            scaleY={1 / sy}
          />
        )
      })()}
    </Group>
  )
}

// ---- Canvas ----
export default function Canvas() {
  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const layerRef = useRef(null)
  const containerRef = useRef(null)
  const blueprintLayerRef = useRef(null)
  const blueprintTransformerRef = useRef(null)

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
  const deleteSelectedShapes = useStore(s => s.deleteSelectedShapes)
  const updateShape = useStore(s => s.updateShape)
  const setRoomPoints = useStore(s => s.setRoomPoints)
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
  const [shiftDown, setShiftDown] = useState(false)

  // Blueprint drawing
  const [previewPoint, setPreviewPoint] = useState(null)
  const [shapeStart, setShapeStart] = useState(null)
  const [shapePreview, setShapePreview] = useState(null)

  // Blueprint inline label editor: { shapeId, label }
  const [shapeInlineEdit, setShapeInlineEdit] = useState(null)

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

  // Update Transformer (lighting) when selection changes
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return
    const nodes = selectedIds
      .map(id => layerRef.current.findOne(`#${id}`))
      .filter(Boolean)
    transformerRef.current.nodes(nodes)
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedIds])

  // Update blueprint Transformer when blueprint selection or tool changes
  useEffect(() => {
    if (!blueprintTransformerRef.current || !blueprintLayerRef.current) return
    if (blueprintTool !== 'select') {
      blueprintTransformerRef.current.nodes([])
      blueprintLayerRef.current.batchDraw()
      return
    }
    const nodes = selectedShapeIds
      .map(id => blueprintLayerRef.current.findOne(`#${id}`))
      .filter(Boolean)
    blueprintTransformerRef.current.nodes(nodes)
    blueprintLayerRef.current.batchDraw()
  }, [selectedShapeIds, blueprintTool])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Shift' && !e.repeat) { setShiftDown(true) }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ' && !e.repeat) { setIsSpaceDown(true); e.preventDefault(); return }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelectedElements(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); groupSelectedElements(); return }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (mode === 'lighting' && selectedIds.length > 0) { e.preventDefault(); deleteSelectedElements() }
        else if (mode === 'blueprint' && selectedShapeIds.length > 0) { e.preventDefault(); deleteSelectedShapes() }
        return
      }
      if (e.key === 'Escape') { clearSelection(); clearShapeSelection(); hideContextMenu(); setBlueprintState(); setShapeInlineEdit(null) }
      // Blueprint mode tool shortcuts
      if (mode === 'blueprint' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'v' || e.key === 'V') { setBlueprintTool('select'); return }
        if (e.key === 'p' || e.key === 'P') { setBlueprintTool('room'); return }
        if (e.key === 'r' || e.key === 'R') { setBlueprintTool('rect'); return }
        if (e.key === 'c' || e.key === 'C') { setBlueprintTool('circle'); return }
        if (e.key === 't' || e.key === 'T') { setBlueprintTool('triangle'); return }
      }
    }
    const onKeyUp = (e) => {
      if (e.key === ' ') setIsSpaceDown(false)
      if (e.key === 'Shift') setShiftDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [mode, selectedIds, selectedShapeIds, undo, redo, duplicateSelectedElements, groupSelectedElements, deleteSelectedElements, deleteSelectedShapes, clearSelection, clearShapeSelection, hideContextMenu, setBlueprintTool])

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
      const dx = x - startPos.x
      const dy = y - startPos.y
      updateMultipleElementsWithHistory(allIds, (el) => ({
        x: snapCoord((startPositions[el.id]?.x ?? el.x) + dx),
        y: snapCoord((startPositions[el.id]?.y ?? el.y) + dy),
      }))
    }
    dragStartPositions.current = {}
  }, [snapCoord, updateElementWithHistory, updateMultipleElementsWithHistory])

  // ---- Blueprint shape drag end ----
  const handleShapeDragEnd = useCallback((id, x, y) => {
    pushHistorySnapshot()
    updateShape(id, { x: snapCoord(x), y: snapCoord(y) })
  }, [pushHistorySnapshot, updateShape, snapCoord])

  // ---- Room drag end — move all room points by the group's drag delta ----
  const handleRoomDragEnd = useCallback((e) => {
    const group = e.target
    const dx = group.x()
    const dy = group.y()
    // Reset the group's position immediately so Konva doesn't accumulate offset
    group.x(0)
    group.y(0)
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
    const scene = getCurrentScene()
    if (!scene) return
    pushHistorySnapshot()
    setRoomPoints(scene.roomPoints.map(p => ({ x: snapCoord(p.x + dx), y: snapCoord(p.y + dy) })))
  }, [getCurrentScene, pushHistorySnapshot, setRoomPoints, snapCoord])

  // ---- Blueprint transform end (scale / rotate for shapes and room) ----
  const handleBlueprintTransformEnd = useCallback(() => {
    pushHistorySnapshot()
    selectedShapeIds.forEach(id => {
      const node = blueprintLayerRef.current?.findOne(`#${id}`)
      if (!node) return

      if (id === '__room__') {
        const scene = getCurrentScene()
        if (!scene) return
        // Apply the group's full transform matrix to each room point, then reset
        const transform = node.getTransform()
        const newPoints = scene.roomPoints.map(pt => {
          const tp = transform.point({ x: pt.x, y: pt.y })
          return { x: snapCoord(tp.x), y: snapCoord(tp.y) }
        })
        setRoomPoints(newPoints)
        node.x(0); node.y(0); node.rotation(0); node.scaleX(1); node.scaleY(1)
        return
      }

      // Regular blueprint shape
      const scene = getCurrentScene()
      const shape = scene?.shapes.find(s => s.id === id)
      if (!shape) return
      const newWidth = Math.max(10, Math.abs(shape.width * node.scaleX()))
      const newHeight = Math.max(10, Math.abs(shape.height * node.scaleY()))
      updateShape(id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: newWidth,
        height: newHeight,
      })
      // Bake scale into dimensions and reset to 1 so the next render is clean
      node.scaleX(1)
      node.scaleY(1)
    })
  }, [pushHistorySnapshot, selectedShapeIds, getCurrentScene, updateShape, setRoomPoints, snapCoord])

  // ---- Lighting transform end ----
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

  // ---- Double-click to edit icon info ----
  const handleElementDoubleClick = useCallback((id, cx, cy) => {
    const scene = getCurrentScene()
    const el = scene?.elements.find(e => e.id === id)
    if (!el) return
    showLabelEditor(id, cx, cy, el)
  }, [getCurrentScene, showLabelEditor])

  // ---- Double-click to edit blueprint shape label ----
  const handleShapeDblClick = useCallback((id) => {
    const scene = getCurrentScene()
    const shape = scene?.shapes.find(s => s.id === id)
    if (!shape) return
    setShapeInlineEdit({ shapeId: id, label: shape.label || '' })
  }, [getCurrentScene])

  const commitShapeLabel = useCallback(() => {
    if (!shapeInlineEdit) return
    pushHistorySnapshot()
    updateShape(shapeInlineEdit.shapeId, { label: shapeInlineEdit.label.trim() })
    setShapeInlineEdit(null)
  }, [shapeInlineEdit, pushHistorySnapshot, updateShape])

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
      // blueprintTool === 'select': only clear selection when clicking the empty canvas background,
      // not when clicking a shape or a transformer anchor (which would abort the drag).
      if (blueprintTool === 'select' && e.target === stageRef.current) {
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

  const isSelectMode = blueprintTool === 'select'

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
        <Layer ref={blueprintLayerRef} listening={mode === 'blueprint'}>
          {scene && (
            <RoomLayer
              scene={scene}
              scale={stageScale}
              isSelectMode={isSelectMode}
              isSelected={selectedShapeIds.includes('__room__')}
              onSelect={(id, multi) => selectShape(id, multi)}
              onDragEnd={handleRoomDragEnd}
            />
          )}
          {scene?.shapes.map(s => (
            <BlueprintShapeNode
              key={s.id} shape={s}
              isSelected={selectedShapeIds.includes(s.id)}
              onSelect={(id, multi) => selectShape(id, multi)}
              isSelectMode={isSelectMode}
              onDragEnd={handleShapeDragEnd}
              onDblClick={handleShapeDblClick}
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
          {/* Blueprint Transformer — move, scale, rotate for all blueprint shapes and room */}
          {mode === 'blueprint' && (
            <Transformer
              ref={blueprintTransformerRef}
              rotateEnabled
              enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10 ? oldBox : newBox)}
              onTransformEnd={handleBlueprintTransformEnd}
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

          {/* Transformer for resize/rotate/move in Lighting Mode.
              Default: proportional scaling (corner anchors only).
              Hold Shift: free/unconstrained scaling (all anchors).
              shiftBehavior="inverted" makes Konva read e.shiftKey directly in its
              mousemove handler: keepProportion = keepRatio && !e.shiftKey.
              With keepRatio={true} (always), no-shift → proportional, shift → free. */}
          {mode === 'lighting' && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              shiftBehavior="inverted"
              keepRatio={true}
              enabledAnchors={shiftDown
                ? ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']
                : ['top-left', 'top-right', 'bottom-left', 'bottom-right']}
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

      {/* Blueprint shape inline label editor */}
      {shapeInlineEdit && (() => {
        const scene = getCurrentScene()
        const shape = scene?.shapes.find(s => s.id === shapeInlineEdit.shapeId)
        if (!shape) return null
        const containerRect = containerRef.current?.getBoundingClientRect()
        const cx = (containerRect?.left || 0) + stageX + shape.x * stageScale
        const cy = (containerRect?.top || 0) + stageY + shape.y * stageScale
        const inputW = Math.max(shape.width * stageScale, 120)
        return (
          <div
            style={{
              position: 'fixed',
              left: cx - inputW / 2,
              top: cy - 14,
              width: inputW,
              zIndex: 200,
            }}
          >
            <input
              autoFocus
              value={shapeInlineEdit.label}
              onChange={e => setShapeInlineEdit(prev => ({ ...prev, label: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') { commitShapeLabel() }
                if (e.key === 'Escape') { setShapeInlineEdit(null) }
                e.stopPropagation()
              }}
              onBlur={commitShapeLabel}
              style={{
                width: '100%',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.97)',
                border: '1.5px solid #2563eb',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 12,
                outline: 'none',
                boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
              }}
              maxLength={60}
              placeholder="Label…"
            />
          </div>
        )
      })()}

      {/* Bottom status bar */}
      <div className="absolute bottom-2 right-3 bg-white/90 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-500 font-mono shadow-sm">
        {Math.round(stageScale * 100)}%{selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ''}{selectedShapeIds.length > 0 ? ` · ${selectedShapeIds.length} shape(s) selected` : ''}
      </div>
    </div>
  )
}
