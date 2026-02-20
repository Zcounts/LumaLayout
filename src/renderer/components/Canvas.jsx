import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Stage, Layer, Rect, Circle, Text, Image, Transformer, Group, Line } from 'react-konva'
import { useStore } from '../store/useStore'

// ── useImage hook ─────────────────────────────────────────────────────────────
// Simple hook to load an image URL into an HTMLImageElement for Konva.Image

function useImage(url) {
  const [image, setImage] = useState(null)
  useEffect(() => {
    if (!url) return
    const img = new window.Image()
    img.src = url
    img.onload = () => setImage(img)
    img.onerror = () => setImage(null)
  }, [url])
  return image
}

// ── Grid background ───────────────────────────────────────────────────────────

function CanvasGrid({ stageX, stageY, stageScale, width, height, mode }) {
  const gridSize = 40
  const color = mode === 'blueprint' ? '#1a2a3a' : '#1e1c18'
  const dotColor = mode === 'blueprint' ? '#2a3f55' : '#2a2720'

  const startX = Math.floor((-stageX / stageScale) / gridSize) * gridSize
  const startY = Math.floor((-stageY / stageScale) / gridSize) * gridSize
  const endX = startX + Math.ceil(width / stageScale / gridSize + 1) * gridSize
  const endY = startY + Math.ceil(height / stageScale / gridSize + 1) * gridSize

  const lines = []
  for (let x = startX; x <= endX; x += gridSize) {
    lines.push(
      <Line
        key={`vl-${x}`}
        points={[x, startY, x, endY]}
        stroke={dotColor}
        strokeWidth={0.5 / stageScale}
        listening={false}
      />
    )
  }
  for (let y = startY; y <= endY; y += gridSize) {
    lines.push(
      <Line
        key={`hl-${y}`}
        points={[startX, y, endX, y]}
        stroke={dotColor}
        strokeWidth={0.5 / stageScale}
        listening={false}
      />
    )
  }
  return <>{lines}</>
}

// ── Blueprint shape ───────────────────────────────────────────────────────────

function BlueprintShape({ element, isSelected, onSelect, onChange, locked }) {
  const shapeRef = useRef()
  const trRef = useRef()

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragEnd = useCallback(
    (e) => {
      onChange(element.id, { x: e.target.x(), y: e.target.y() })
    },
    [element.id, onChange]
  )

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    onChange(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, (element.width || 100) * scaleX),
      height: Math.max(10, (element.height || 60) * scaleY),
      rotation: node.rotation(),
    })
  }, [element, onChange])

  const commonProps = {
    ref: shapeRef,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    draggable: !locked,
    listening: !locked,
    onClick: locked ? undefined : () => onSelect(element.id),
    onTap: locked ? undefined : () => onSelect(element.id),
    onDragEnd: locked ? undefined : handleDragEnd,
    onTransformEnd: locked ? undefined : handleTransformEnd,
    stroke: isSelected ? '#4f96ff' : (locked ? '#1d3a5f' : '#4f96ff'),
    strokeWidth: isSelected ? 2 : 1.5,
    opacity: locked ? 0.45 : 1,
  }

  if (element.type === 'rect') {
    return (
      <>
        <Rect
          {...commonProps}
          width={element.width || 100}
          height={element.height || 60}
          fill={element.fill || 'rgba(79,150,255,0.08)'}
          cornerRadius={element.cornerRadius || 0}
        />
        {isSelected && !locked && (
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
            }
          />
        )}
      </>
    )
  }

  if (element.type === 'circle') {
    return (
      <>
        <Circle
          {...commonProps}
          radius={element.radius || 40}
          fill={element.fill || 'rgba(79,150,255,0.08)'}
        />
        {isSelected && !locked && (
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={true}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
            }
          />
        )}
      </>
    )
  }

  if (element.type === 'text') {
    return (
      <>
        <Text
          {...commonProps}
          text={element.text || 'Label'}
          fontSize={element.fontSize || 16}
          fill={locked ? '#1d3a5f' : '#4f96ff'}
          fontFamily="monospace"
        />
        {isSelected && !locked && <Transformer ref={trRef} rotateEnabled />}
      </>
    )
  }

  return null
}

// ── Lighting icon node ────────────────────────────────────────────────────────

function LightingIconNode({ icon, isSelected, onSelect, onChange }) {
  const image = useImage(icon.url)
  const imgRef = useRef()
  const trRef = useRef()

  useEffect(() => {
    if (isSelected && trRef.current && imgRef.current) {
      trRef.current.nodes([imgRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const SIZE = 64

  const handleDragEnd = useCallback(
    (e) => {
      onChange(icon.id, { x: e.target.x(), y: e.target.y() })
    },
    [icon.id, onChange]
  )

  const handleTransformEnd = useCallback(() => {
    const node = imgRef.current
    if (!node) return
    onChange(icon.id, {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    })
  }, [icon.id, onChange])

  if (!image) return null

  return (
    <>
      <Image
        ref={imgRef}
        image={image}
        x={icon.x}
        y={icon.y}
        width={SIZE}
        height={SIZE}
        offsetX={SIZE / 2}
        offsetY={SIZE / 2}
        scaleX={icon.scaleX || 1}
        scaleY={icon.scaleY || 1}
        rotation={icon.rotation || 0}
        draggable
        onClick={() => onSelect(icon.id)}
        onTap={() => onSelect(icon.id)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        shadowColor={isSelected ? '#f59e0b' : 'transparent'}
        shadowBlur={isSelected ? 12 : 0}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={true}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 16 ? oldBox : newBox
          }
        />
      )}
    </>
  )
}

// ── In-progress draw rect ─────────────────────────────────────────────────────

function DrawingRect({ rect }) {
  if (!rect) return null
  return (
    <Rect
      x={Math.min(rect.x1, rect.x2)}
      y={Math.min(rect.y1, rect.y2)}
      width={Math.abs(rect.x2 - rect.x1)}
      height={Math.abs(rect.y2 - rect.y1)}
      stroke="#4f96ff"
      strokeWidth={1.5}
      fill="rgba(79,150,255,0.08)"
      listening={false}
      dash={[6, 3]}
    />
  )
}

function DrawingCircle({ circle }) {
  if (!circle) return null
  const r = Math.sqrt(
    Math.pow(circle.x2 - circle.x1, 2) + Math.pow(circle.y2 - circle.y1, 2)
  ) / 2
  const cx = (circle.x1 + circle.x2) / 2
  const cy = (circle.y1 + circle.y2) / 2
  return (
    <Circle
      x={cx}
      y={cy}
      radius={Math.max(2, r)}
      stroke="#4f96ff"
      strokeWidth={1.5}
      fill="rgba(79,150,255,0.08)"
      listening={false}
      dash={[6, 3]}
    />
  )
}

// ── Canvas ────────────────────────────────────────────────────────────────────

const Canvas = forwardRef(function Canvas({ width, height }, ref) {
  const mode = useStore((s) => s.mode)
  const stageScale = useStore((s) => s.stageScale)
  const stageX = useStore((s) => s.stageX)
  const stageY = useStore((s) => s.stageY)
  const setStageView = useStore((s) => s.setStageView)

  const blueprintElements = useStore((s) => s.blueprintElements)
  const addBlueprintElement = useStore((s) => s.addBlueprintElement)
  const updateBlueprintElement = useStore((s) => s.updateBlueprintElement)
  const selectedBlueprintId = useStore((s) => s.selectedBlueprintId)
  const setSelectedBlueprintId = useStore((s) => s.setSelectedBlueprintId)

  const lightingIcons = useStore((s) => s.lightingIcons)
  const updateLightingIcon = useStore((s) => s.updateLightingIcon)
  const selectedLightingId = useStore((s) => s.selectedLightingId)
  const setSelectedLightingId = useStore((s) => s.setSelectedLightingId)

  const currentTool = useStore((s) => s.currentTool)

  const stageRef = useRef()
  const [drawing, setDrawing] = useState(null) // { type, x1, y1, x2, y2 }

  // Expose stage ref to parent
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const newScale = Math.min(stageScale * 1.2, 8)
      setStageView(newScale, stageX, stageY)
    },
    zoomOut: () => {
      const newScale = Math.max(stageScale / 1.2, 0.1)
      setStageView(newScale, stageX, stageY)
    },
    resetView: () => {
      setStageView(1, 0, 0)
    },
  }))

  // Wheel zoom
  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return
      const oldScale = stageScale
      const pointer = stage.getPointerPosition()
      const direction = e.evt.deltaY > 0 ? -1 : 1
      const factor = 1.1
      const newScale = direction > 0
        ? Math.min(oldScale * factor, 8)
        : Math.max(oldScale / factor, 0.1)

      const mousePointTo = {
        x: (pointer.x - stageX) / oldScale,
        y: (pointer.y - stageY) / oldScale,
      }
      setStageView(
        newScale,
        pointer.x - mousePointTo.x * newScale,
        pointer.y - mousePointTo.y * newScale
      )
    },
    [stageScale, stageX, stageY, setStageView]
  )

  // Stage pointer: get canvas coords from pointer
  const getCanvasPos = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const pos = stage.getPointerPosition()
    return {
      x: (pos.x - stageX) / stageScale,
      y: (pos.y - stageY) / stageScale,
    }
  }, [stageX, stageY, stageScale])

  // Mouse down on stage background
  const handleStageMouseDown = useCallback(
    (e) => {
      // Clicked on empty stage (not a shape)
      if (e.target !== stageRef.current && e.target !== e.target.getStage()) {
        return
      }

      if (mode === 'blueprint') {
        if (currentTool === 'select') {
          setSelectedBlueprintId(null)
          return
        }
        if (currentTool === 'text') {
          const pos = getCanvasPos()
          const label = window.prompt('Enter label text:', 'Label')
          if (label) {
            addBlueprintElement({ type: 'text', x: pos.x, y: pos.y, text: label })
          }
          return
        }
        // rect or circle — start drawing
        const pos = getCanvasPos()
        setDrawing({ type: currentTool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
      } else {
        // Lighting mode: deselect on background click
        setSelectedLightingId(null)
      }
    },
    [mode, currentTool, getCanvasPos, addBlueprintElement, setSelectedBlueprintId, setSelectedLightingId]
  )

  const handleStageMouseMove = useCallback(
    (e) => {
      if (!drawing) return
      const pos = getCanvasPos()
      setDrawing((d) => ({ ...d, x2: pos.x, y2: pos.y }))
    },
    [drawing, getCanvasPos]
  )

  const handleStageMouseUp = useCallback(() => {
    if (!drawing) return
    const { type, x1, y1, x2, y2 } = drawing
    if (type === 'rect') {
      const w = Math.abs(x2 - x1)
      const h = Math.abs(y2 - y1)
      if (w > 5 && h > 5) {
        addBlueprintElement({
          type: 'rect',
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: w,
          height: h,
        })
      }
    } else if (type === 'circle') {
      const r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2
      if (r > 5) {
        addBlueprintElement({
          type: 'circle',
          x: (x1 + x2) / 2,
          y: (y1 + y2) / 2,
          radius: r,
        })
      }
    }
    setDrawing(null)
  }, [drawing, addBlueprintElement])

  // Drop handler for icons dragged from sidebar — only active in Lighting Mode
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      const { mode: currentMode, addLightingIcon } = useStore.getState()
      if (currentMode !== 'lighting') return

      const data = e.dataTransfer.getData('application/lumalayout-icon')
      if (!data) return

      const icon = JSON.parse(data)
      const stage = stageRef.current
      if (!stage) return

      // Calculate drop position in canvas coordinates
      const stageContainer = stage.container()
      const rect = stageContainer.getBoundingClientRect()
      const canvasX = (e.clientX - rect.left - stageX) / stageScale
      const canvasY = (e.clientY - rect.top - stageY) / stageScale

      addLightingIcon({
        iconId: icon.id,
        label: icon.label,
        url: icon.url,
        x: canvasX,
        y: canvasY,
      })
    },
    [stageX, stageY, stageScale]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = mode === 'lighting' ? 'copy' : 'none'
  }, [mode])

  const isBlueprintMode = mode === 'blueprint'

  // Background color by mode
  const bgColor = isBlueprintMode ? '#0d1821' : '#141210'

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ cursor: isBlueprintMode && currentTool !== 'select' ? 'crosshair' : 'default' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Mode watermark */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest opacity-20"
        style={
          isBlueprintMode
            ? { color: '#4f96ff', border: '1px solid #4f96ff' }
            : { color: '#f59e0b', border: '1px solid #f59e0b' }
        }
      >
        {isBlueprintMode ? 'Blueprint Mode' : 'Lighting Mode'}
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        style={{ background: bgColor }}
      >
        {/* ── Grid layer ─────────────────────────────────────── */}
        <Layer listening={false}>
          <CanvasGrid
            stageX={stageX}
            stageY={stageY}
            stageScale={stageScale}
            width={width}
            height={height}
            mode={mode}
          />
        </Layer>

        {/* ── Blueprint elements layer ───────────────────────── */}
        <Layer>
          {blueprintElements.map((el) => (
            <BlueprintShape
              key={el.id}
              element={el}
              isSelected={isBlueprintMode && selectedBlueprintId === el.id}
              locked={!isBlueprintMode}
              onSelect={setSelectedBlueprintId}
              onChange={updateBlueprintElement}
            />
          ))}

          {/* In-progress drawing shape */}
          {drawing && drawing.type === 'rect' && <DrawingRect rect={drawing} />}
          {drawing && drawing.type === 'circle' && <DrawingCircle circle={drawing} />}
        </Layer>

        {/* ── Lighting icons layer ───────────────────────────── */}
        <Layer>
          {lightingIcons.map((icon) => (
            <LightingIconNode
              key={icon.id}
              icon={icon}
              isSelected={!isBlueprintMode && selectedLightingId === icon.id}
              onSelect={isBlueprintMode ? () => {} : setSelectedLightingId}
              onChange={updateLightingIcon}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
})

export default Canvas
