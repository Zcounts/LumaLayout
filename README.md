# LightPlot — Lighting Diagram Desktop App

## Full Project Specification

Build a Windows 11 desktop application using Electron + React for creating
professional film and photography lighting diagrams. The app provides a
top-down canvas view where users can design lighting setups by placing and
arranging icons representing lights, cameras, stands, flags, practicals,
and set elements.

## Two Modes

### Blueprint Mode
Used to design the physical space being lit. In this mode the user can:
- Draw room outlines by clicking to place corner points, closing the shape
  to complete it
- Add doors (arc symbol) and windows (gap in wall) to the room outline
- Place basic shapes: rectangle, circle, triangle — scalable and rotatable
- Change the fill color of any shape
- Label any shape with custom text
- Shapes placed in Blueprint Mode are locked in Lighting Mode and cannot
  be accidentally moved

### Lighting Mode
Used to place and arrange lighting equipment and other production elements.
In this mode the user can:
- Drag and drop icons from a sidebar panel onto the canvas
- Move, rotate, and scale any placed icon
- Label any icon with custom text
- Blueprint shapes are visible but not selectable or movable
- All lighting icons are fully interactive

## Canvas Features
- Infinite scrollable canvas with zoom in/out (mouse wheel or buttons)
- Pan by holding spacebar and dragging
- Snap to grid toggle (grid visible as subtle dots or lines)
- Undo/redo (Ctrl+Z / Ctrl+Y)
- Duplicate any element (Ctrl+D)
- Delete selected element (Delete key or right-click menu)
- Group multiple elements together and move as one
- Select multiple elements by dragging a selection box

## Icon Library (Sidebar Panel)
Icons are SVG files stored in the /icons folder. Categories:
- Cameras (various camera body icons)
- Light Sources (fresnel, softbox, beauty dish, practical, LED panel, etc.)
- Light Modifiers (umbrella, reflector, flag, scrim, diffusion frame, etc.)
- Stands (C-stand, light stand, boom arm)
- Subjects (actor marker, position marker)
- Shapes (rectangle, circle, triangle — Blueprint Mode only)
- Misc (arrow, text label, ruler)

Each icon in the sidebar is draggable onto the canvas. Once placed:
- Click to select
- Drag to move
- Rotate handle appears on selection
- Scale handles appear on corners of selection
- Right-click for context menu: Duplicate, Delete, Add Label, Bring to Front,
  Send to Back

## Scenes
- A single .lightplot file can contain multiple scenes
- Each scene has its own canvas, name, and set of elements
- Scenes are listed in a left sidebar and can be added, renamed, reordered,
  or deleted
- Switching scenes preserves all elements on each scene

## Project Management
- New Project: blank canvas, prompts for project name
- Save: saves to .lightplot JSON file (all element positions, rotations,
  scales, colors, labels, and SVG references)
- Load: opens .lightplot file and restores full state
- Auto-save: every 60 seconds to a temp file
- Recent Projects: list of last 5 opened files on home screen

## Export
- Export current scene as PDF (print-ready, landscape or portrait)
- Export current scene as PNG (high resolution)
- Export all scenes as multi-page PDF
- Each export includes the scene name as a title at the top

## UI & Settings
- Light/dark mode toggle (UI only — canvas background stays white/light)
- Sidebar can be collapsed to maximize canvas space
- App name: LightPlot
- Zoom level displayed in bottom bar
- Current mode (Blueprint/Lighting) clearly indicated in toolbar

## Tech Stack
- Electron + React + TailwindCSS
- Zustand for state management
- Konva.js (react-konva) for the canvas — handles drag, rotate, scale,
  and SVG rendering natively
- electron-builder for Windows installer
- GitHub Actions for automatic .exe release builds

## Visual Style
- Clean, minimal, professional
- White canvas with subtle grid
- Dark sidebar panel for icon library
- Clear visual distinction between Blueprint Mode and Lighting Mode
  (toolbar indicator, cursor change)

## Icon Files
All icons are individual SVG files in the /icons folder. They are named
clearly by category and type, e.g.:
- camera-dslr.svg
- light-fresnel.svg
- light-softbox.svg
- modifier-umbrella.svg
- stand-cstand.svg
- flag.svg
- marker-actor.svg

## File Format
Projects are saved as `.lightplot` files — JSON files containing:
- Project name and metadata
- Array of scenes, each with name and elements array
- Each element: type, svgRef, x, y, rotation, scaleX, scaleY, fill, label,
  zIndex, mode (blueprint/lighting)

## Build Sessions
- Session 1: Scaffold ✅
- Session 2: Canvas and Blueprint Mode
- Session 3: Icon sidebar and Lighting Mode
- Session 4: Element interactions (rotate, scale, label, group, undo/redo)
- Session 5: Scenes, save/load, settings
- Session 6: Export and final polish
- Session 7: GitHub Actions Windows installer
