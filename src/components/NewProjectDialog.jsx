import React, { useState, useEffect, useRef } from 'react'

export default function NewProjectDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState('Untitled Project')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (trimmed) onConfirm(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-80">
        <h2 className="text-base font-semibold text-gray-800 mb-4">New Project</h2>
        <label className="block text-sm text-gray-600 mb-1">Project Name</label>
        <input
          ref={inputRef}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={80}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
