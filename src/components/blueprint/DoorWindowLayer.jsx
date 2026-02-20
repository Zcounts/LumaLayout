import React from 'react'
import { Layer, Group, Line, Arc, Text, Rect } from 'react-konva'
import useStore from '../../store/useStore'

/**
 * Door marker: a gap in the wall with an arc showing the swing.
 * Window marker: a gap with two parallel lines across the wall.
 */

function DoorMarker({ door, isLocked }) {
  const { x, y, width, wallAngle, openDirection = 1, label } = door
  const sw = isLocked ? 1.5 : 2

  // Door is drawn at (x, y) rotated by wallAngle.
  // The gap = width along the wall, arc from the hinge.
  return (
    <Group x={x} y={y} rotation={wallAngle} opacity={isLocked ? 0.7 : 1}>
      {/* Hinge side: small circle dot */}
      <Line
        points={[0, 0, 0, openDirection * width]}
        stroke={isLocked ? '#94a3b8' : '#1e3a5f'}
        strokeWidth={sw}
        lineCap="round"
        listening={false}
      />
      {/* Swing arc */}
      <Arc
        x={0}
        y={0}
        innerRadius={0}
        outerRadius={width}
        angle={90}
        rotation={openDirection === 1 ? 0 : -90}
        stroke={isLocked ? '#94a3b8' : '#1e3a5f'}
        strokeWidth={sw}
        fill="rgba(219,234,254,0.2)"
        listening={false}
      />
      {/* Wall gap cover (white line to "cut" the wall) */}
      <Line
        points={[0, 0, width, 0]}
        stroke="#f8fafc"
        strokeWidth={6}
        listening={false}
      />
      {/* Door opening line */}
      <Line
        points={[0, 0, width, 0]}
        stroke={isLocked ? '#cbd5e1' : '#3b82f6'}
        strokeWidth={sw}
        dash={[4, 2]}
        listening={false}
      />
      {label && (
        <Text
          x={width / 2}
          y={openDirection * (width + 8)}
          text={label}
          fontSize={10}
          fill={isLocked ? '#94a3b8' : '#1e3a5f'}
          align="center"
          offsetX={20}
          listening={false}
        />
      )}
    </Group>
  )
}

function WindowMarker({ win, isLocked }) {
  const { x, y, width, wallAngle, label } = win
  const sw = isLocked ? 1.5 : 2
  const depth = 8 // how wide the window sill is

  return (
    <Group x={x} y={y} rotation={wallAngle} opacity={isLocked ? 0.7 : 1}>
      {/* White gap to "cut" the wall */}
      <Line
        points={[0, 0, width, 0]}
        stroke="#f8fafc"
        strokeWidth={8}
        listening={false}
      />
      {/* Outer sill line */}
      <Line
        points={[0, -depth, width, -depth]}
        stroke={isLocked ? '#94a3b8' : '#1e3a5f'}
        strokeWidth={sw}
        listening={false}
      />
      {/* Inner sill line */}
      <Line
        points={[0, depth, width, depth]}
        stroke={isLocked ? '#94a3b8' : '#1e3a5f'}
        strokeWidth={sw}
        listening={false}
      />
      {/* Glass pane */}
      <Line
        points={[0, -depth, 0, depth]}
        stroke={isLocked ? '#94a3b8' : '#93c5fd'}
        strokeWidth={sw}
        listening={false}
      />
      <Line
        points={[width, -depth, width, depth]}
        stroke={isLocked ? '#94a3b8' : '#93c5fd'}
        strokeWidth={sw}
        listening={false}
      />
      <Rect
        x={0}
        y={-depth}
        width={width}
        height={depth * 2}
        fill="rgba(147,197,253,0.15)"
        listening={false}
      />
      {label && (
        <Text
          x={width / 2}
          y={depth + 6}
          text={label}
          fontSize={10}
          fill={isLocked ? '#94a3b8' : '#1e3a5f'}
          align="center"
          offsetX={20}
          listening={false}
        />
      )}
    </Group>
  )
}

export default function DoorWindowLayer({ isLocked }) {
  const doors = useStore((s) => s.doors)
  const windows = useStore((s) => s.windows)

  return (
    <Layer listening={false}>
      {doors.map((door) => (
        <DoorMarker key={door.id} door={door} isLocked={isLocked} />
      ))}
      {windows.map((win) => (
        <WindowMarker key={win.id} win={win} isLocked={isLocked} />
      ))}
    </Layer>
  )
}
