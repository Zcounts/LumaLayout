import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

export default function LabelEditor() {
  const labelEditor = useStore(s => s.labelEditor)
  const hideLabelEditor = useStore(s => s.hideLabelEditor)
  const setLabel = useStore(s => s.setLabel)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (labelEditor) {
      setValue(labelEditor.value || '')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [labelEditor])

  if (!labelEditor) return null

  const { id, x, y } = labelEditor

  const commit = () => {
    setLabel(id, value.trim())
    hideLabelEditor()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') hideLabelEditor()
  }

  // Keep in bounds
  const editorX = Math.min(x, window.innerWidth - 200)
  const editorY = Math.min(y, window.innerHeight - 60)

  return (
    <div className="label-editor-overlay" style={{ left: editorX, top: editorY }}>
      <input
        ref={inputRef}
        className="label-editor-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder="Enter label..."
        maxLength={40}
      />
    </div>
  )
}
