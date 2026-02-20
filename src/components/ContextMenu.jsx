import React, { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export default function ContextMenu() {
  const contextMenu = useStore(s => s.contextMenu)
  const hideContextMenu = useStore(s => s.hideContextMenu)
  const selectedIds = useStore(s => s.selectedIds)
  const duplicateElement = useStore(s => s.duplicateElement)
  const duplicateSelectedElements = useStore(s => s.duplicateSelectedElements)
  const deleteElement = useStore(s => s.deleteElement)
  const deleteSelectedElements = useStore(s => s.deleteSelectedElements)
  const bringToFront = useStore(s => s.bringToFront)
  const sendToBack = useStore(s => s.sendToBack)
  const showLabelEditor = useStore(s => s.showLabelEditor)
  const getCurrentScene = useStore(s => s.getCurrentScene)
  const groupSelectedElements = useStore(s => s.groupSelectedElements)
  const ref = useRef(null)

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        hideContextMenu()
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') hideContextMenu()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [contextMenu, hideContextMenu])

  if (!contextMenu) return null

  const { x, y, targetId } = contextMenu
  const scene = getCurrentScene()
  const target = scene?.elements.find(e => e.id === targetId)
  const isMulti = selectedIds.length > 1

  // Position menu so it doesn't go off-screen
  const menuStyle = {
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 250),
  }

  const act = (fn) => {
    fn()
    hideContextMenu()
  }

  const openLabelEditor = () => {
    if (!target) return
    // Show the label editor at menu position
    showLabelEditor(targetId, x, y, target.label || '')
    hideContextMenu()
  }

  return (
    <div className="context-menu" style={menuStyle} ref={ref}>
      {isMulti ? (
        <>
          <div className="context-menu-item" onClick={() => act(duplicateSelectedElements)}>
            <span>⧉</span> Duplicate All ({selectedIds.length})
          </div>
          <div className="context-menu-item" onClick={() => act(groupSelectedElements)}>
            <span>⊞</span> Group (Ctrl+G)
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item danger" onClick={() => act(deleteSelectedElements)}>
            <span>✕</span> Delete All
          </div>
        </>
      ) : (
        <>
          <div className="context-menu-item" onClick={() => act(() => duplicateElement(targetId))}>
            <span>⧉</span> Duplicate
          </div>
          <div className="context-menu-item" onClick={openLabelEditor}>
            <span>✎</span> {target?.label ? 'Edit Label' : 'Add Label'}
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => act(() => bringToFront(targetId))}>
            <span>↑</span> Bring to Front
          </div>
          <div className="context-menu-item" onClick={() => act(() => sendToBack(targetId))}>
            <span>↓</span> Send to Back
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item danger" onClick={() => act(() => deleteElement(targetId))}>
            <span>✕</span> Delete
          </div>
        </>
      )}
    </div>
  )
}
