import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

export default function LabelEditor() {
  const labelEditor = useStore(s => s.labelEditor)
  const hideLabelEditor = useStore(s => s.hideLabelEditor)
  const setIconInfo = useStore(s => s.setIconInfo)

  const [label, setLabel] = useState('')
  const [accessories, setAccessories] = useState('')
  const [colorTemperature, setColorTemperature] = useState('')
  const [notes, setNotes] = useState('')

  const labelRef = useRef(null)

  useEffect(() => {
    if (labelEditor) {
      setLabel(labelEditor.label || '')
      setAccessories(labelEditor.accessories || '')
      setColorTemperature(labelEditor.colorTemperature || '')
      setNotes(labelEditor.notes || '')
      setTimeout(() => labelRef.current?.focus(), 50)
    }
  }, [labelEditor])

  if (!labelEditor) return null

  const { id, x, y } = labelEditor

  const commit = () => {
    setIconInfo(id, {
      label: label.trim(),
      accessories: accessories.trim(),
      colorTemperature: colorTemperature.trim(),
      notes: notes.trim(),
    })
    hideLabelEditor()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { hideLabelEditor(); return }
    // Allow Enter inside textarea for newlines; Save with Ctrl/Cmd+Enter
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') commit()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit()
  }

  // Keep panel within viewport
  const panelW = 260
  const panelH = 290
  const editorX = Math.min(x, window.innerWidth - panelW - 12)
  const editorY = Math.min(y, window.innerHeight - panelH - 12)

  return (
    <div
      className="icon-info-panel"
      style={{ left: editorX, top: editorY }}
      onKeyDown={handleKeyDown}
    >
      <div className="icon-info-panel-title">Icon Info</div>

      <div className="icon-info-field">
        <label>Label</label>
        <input
          ref={labelRef}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Main Camera"
          maxLength={60}
        />
      </div>

      <div className="icon-info-field">
        <label>Accessories</label>
        <input
          value={accessories}
          onChange={e => setAccessories(e.target.value)}
          placeholder="e.g. Barn doors, ND .9"
          maxLength={80}
        />
      </div>

      <div className="icon-info-field">
        <label>Color Temperature</label>
        <input
          value={colorTemperature}
          onChange={e => setColorTemperature(e.target.value)}
          placeholder="e.g. 5600K"
          maxLength={40}
        />
      </div>

      <div className="icon-info-field">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="General notes… (Ctrl+Enter to save)"
          maxLength={200}
        />
      </div>

      <div className="icon-info-actions">
        <button className="icon-info-btn" onClick={hideLabelEditor}>Cancel</button>
        <button className="icon-info-btn primary" onClick={commit}>Save</button>
      </div>
    </div>
  )
}
