import React from 'react'
import { Layer, Line, Circle, Group, Text, Arc } from 'react-konva'
import useStore from '../../store/useStore'

/** Draws the closed room polygon + in-progress drawing outline */
export default function RoomLayer({ isLocked }) {
  const rooms = useStore((s) => s.rooms)
  const currentRoomPoints = useStore((s) => s.currentRoomPoints)
  const isDrawingRoom = useStore((s) => s.isDrawingRoom)

  return (
    <Layer listening={false}>
      {/* Completed rooms */}
      {rooms.map((room) => (
        <Group key={room.id} listening={false}>
          <Line
            points={room.points}
            closed
            stroke={room.strokeColor}
            strokeWidth={room.strokeWidth}
            fill={room.fillColor}
            listening={false}
            perfectDrawEnabled={false}
          />
        </Group>
      ))}

      {/* In-progress room drawing */}
      {isDrawingRoom && currentRoomPoints.length >= 2 && (
        <Line
          points={currentRoomPoints}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 4]}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}

      {/* Corner dots for in-progress room */}
      {isDrawingRoom &&
        Array.from({ length: currentRoomPoints.length / 2 }, (_, i) => ({
          x: currentRoomPoints[i * 2],
          y: currentRoomPoints[i * 2 + 1],
          isFirst: i === 0,
        })).map((pt, i) => (
          <Circle
            key={i}
            x={pt.x}
            y={pt.y}
            radius={pt.isFirst ? 7 : 4}
            fill={pt.isFirst ? '#3b82f6' : '#fff'}
            stroke="#3b82f6"
            strokeWidth={2}
            listening={false}
          />
        ))}
    </Layer>
  )
}
