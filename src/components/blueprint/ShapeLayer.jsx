import React from 'react'
import { Layer, Rect, Circle, Group, Text } from 'react-konva'
import useStore from '../../store/useStore'

/**
 * Renders set pieces (rectangles and circles) placed in Blueprint Mode.
 * When isLocked=true (Lighting Mode), all shapes are non-interactive.
 */
export default function ShapeLayer({ isLocked }) {
  const shapes = useStore((s) => s.shapes)
  const selectedId = useStore((s) => s.selectedId)
  const setSelectedId = useStore((s) => s.setSelectedId)
  const updateShape = useStore((s) => s.updateShape)
  const mode = useStore((s) => s.mode)

  const handleSelect = (id) => {
    if (!isLocked) setSelectedId(id)
  }

  return (
    <Layer>
      {shapes.map((shape) => {
        const isSelected = selectedId === shape.id && !isLocked
        const commonProps = {
          fill: shape.fillColor,
          stroke: isSelected ? '#f59e0b' : shape.strokeColor,
          strokeWidth: isSelected ? 2.5 : 1.5,
          opacity: isLocked ? 0.75 : 1,
          listening: !isLocked,
          draggable: !isLocked,
          rotation: shape.rotation || 0,
          onClick: () => handleSelect(shape.id),
          onTap: () => handleSelect(shape.id),
          onDragEnd: (e) => {
            updateShape(shape.id, {
              x: e.target.x(),
              y: e.target.y(),
            })
          },
          // Subtle locked indicator: dashed stroke in lighting mode
          dash: isLocked ? [5, 3] : undefined,
        }

        return (
          <Group key={shape.id}>
            {shape.type === 'rectangle' ? (
              <Rect
                {...commonProps}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                offsetX={shape.width / 2}
                offsetY={shape.height / 2}
              />
            ) : (
              <Circle
                {...commonProps}
                x={shape.x}
                y={shape.y}
                radius={shape.radius}
              />
            )}

            {/* Label */}
            {shape.label && (
              <Text
                x={shape.x}
                y={shape.y}
                text={shape.label}
                fontSize={12}
                fontFamily="'Segoe UI', sans-serif"
                fontStyle="bold"
                fill={isLocked ? '#64748b' : '#1e293b'}
                align="center"
                verticalAlign="middle"
                offsetX={
                  shape.type === 'rectangle'
                    ? shape.width / 2
                    : 30
                }
                offsetY={
                  shape.type === 'rectangle'
                    ? shape.height / 2 + 6
                    : -shape.radius - 4
                }
                listening={false}
                rotation={shape.rotation || 0}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
