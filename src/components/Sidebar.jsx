import React, { useState } from 'react'
import { useStore } from '../store/useStore'

// Icon catalog — maps to SVG files in /icons folder
const ICON_CATEGORIES = [
  {
    name: 'Cameras',
    icons: [
      { name: 'DSLR', file: 'plot icons-01.svg' },
      { name: 'Cinema Cam', file: 'plot icons-02.svg' },
      { name: 'Mirrorless', file: 'plot icons-03.svg' },
      { name: 'Video Cam', file: 'plot icons-04.svg' },
    ],
  },
  {
    name: 'Light Sources',
    icons: [
      { name: 'Fresnel', file: 'plot icons-05.svg' },
      { name: 'Softbox', file: 'plot icons-06.svg' },
      { name: 'LED Panel', file: 'plot icons-07.svg' },
      { name: 'Beauty Dish', file: 'plot icons-08.svg' },
      { name: 'Practical', file: 'plot icons-09.svg' },
      { name: 'HMI', file: 'plot icons-10.svg' },
    ],
  },
  {
    name: 'Modifiers',
    icons: [
      { name: 'Umbrella', file: 'plot icons-11.svg' },
      { name: 'Reflector', file: 'plot icons-12.svg' },
      { name: 'Flag', file: 'plot icons-13.svg' },
      { name: 'Scrim', file: 'plot icons-14.svg' },
      { name: 'Diffusion', file: 'plot icons-15.svg' },
      { name: 'Grid', file: 'plot icons-16.svg' },
    ],
  },
  {
    name: 'Stands',
    icons: [
      { name: 'C-Stand', file: 'plot icons-17.svg' },
      { name: 'Light Stand', file: 'plot icons-18.svg' },
      { name: 'Boom Arm', file: 'plot icons-19.svg' },
      { name: 'Tripod', file: 'plot icons-20.svg' },
    ],
  },
  {
    name: 'Subjects',
    icons: [
      { name: 'Actor', file: 'plot icons-21.svg' },
      { name: 'Position', file: 'plot icons-22.svg' },
      { name: 'Subject A', file: 'plot icons-23.svg' },
      { name: 'Subject B', file: 'plot icons-24.svg' },
    ],
  },
  {
    name: 'Misc',
    icons: [
      { name: 'Arrow', file: 'plot icons-25.svg' },
      { name: 'Table', file: 'plot icons-26.svg' },
      { name: 'Chair', file: 'plot icons-27.svg' },
      { name: 'Monitor', file: 'plot icons-28.svg' },
      { name: 'Prop A', file: 'plot icons-29.svg' },
      { name: 'Prop B', file: 'plot icons-30.svg' },
      { name: 'Prop C', file: 'plot icons-31.svg' },
      { name: 'Element', file: 'plot icons-32.svg' },
    ],
  },
]

function ScenePanel() {
  const scenes = useStore(s => s.scenes)
  const currentSceneId = useStore(s => s.currentSceneId)
  const setCurrentScene = useStore(s => s.setCurrentScene)
  const addScene = useStore(s => s.addScene)
  const deleteScene = useStore(s => s.deleteScene)
  const renameScene = useStore(s => s.renameScene)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const startRename = (scene) => {
    setEditingId(scene.id)
    setEditValue(scene.name)
  }
  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameScene(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="border-b border-white/10 pb-2">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Scenes</span>
        <button
          className="text-white/50 hover:text-white text-lg leading-none"
          onClick={addScene}
          title="Add Scene"
        >+</button>
      </div>
      <div className="space-y-0.5 px-2">
        {scenes.map(scene => (
          <div
            key={scene.id}
            className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group ${
              scene.id === currentSceneId
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            }`}
            onClick={() => setCurrentScene(scene.id)}
          >
            {editingId === scene.id ? (
              <input
                className="flex-1 bg-transparent text-white text-xs outline-none border-b border-white/30"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null) }}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-xs truncate"
                onDoubleClick={e => { e.stopPropagation(); startRename(scene) }}
              >
                {scene.name}
              </span>
            )}
            {scenes.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 text-xs"
                onClick={e => { e.stopPropagation(); deleteScene(scene.id) }}
                title="Delete Scene"
              >×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const sidebarCollapsed = useStore(s => s.sidebarCollapsed)
  const mode = useStore(s => s.mode)
  const [openCategories, setOpenCategories] = useState({ 'Light Sources': true })

  const toggleCategory = (name) => {
    setOpenCategories(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const handleDragStart = (e, icon) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      iconFile: icon.file,
      iconName: icon.name,
    }))
    e.dataTransfer.effectAllowed = 'copy'
    // Create a drag image
    const img = new Image()
    img.src = `/icons/${encodeURIComponent(icon.file)}`
    e.dataTransfer.setDragImage(img, 30, 30)
  }

  if (sidebarCollapsed) return null

  return (
    <div className="w-56 flex-shrink-0 bg-sidebar flex flex-col h-full border-r border-white/10">
      {/* Scene panel */}
      <ScenePanel />

      {/* Icon library — only in lighting mode */}
      {mode === 'lighting' && (
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Icon Library</span>
          </div>
          {ICON_CATEGORIES.map(cat => (
            <div key={cat.name}>
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => toggleCategory(cat.name)}
              >
                <span>{cat.name}</span>
                <span className="text-white/30">{openCategories[cat.name] ? '▾' : '▸'}</span>
              </button>
              {openCategories[cat.name] && (
                <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                  {cat.icons.map(icon => (
                    <div
                      key={icon.file}
                      className="icon-card"
                      draggable
                      onDragStart={e => handleDragStart(e, icon)}
                      title={`${icon.name} — drag to canvas`}
                    >
                      <img
                        src={`/icons/${encodeURIComponent(icon.file)}`}
                        alt={icon.name}
                        onError={e => { e.target.src = '/icons/plot icons-01.svg' }}
                      />
                      <span>{icon.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Blueprint mode hint */}
      {mode === 'blueprint' && (
        <div className="flex-1 flex items-start px-4 py-4">
          <div className="text-white/30 text-xs leading-relaxed">
            <p className="font-semibold text-white/50 mb-2">Blueprint Mode</p>
            <p className="mb-1">Use the toolbar tools to:</p>
            <ul className="space-y-1 ml-2">
              <li>⬡ Draw room outline</li>
              <li>▭ Place rectangle</li>
              <li>○ Place circle</li>
              <li>△ Place triangle</li>
            </ul>
            <p className="mt-3">Elements placed here are locked in Lighting Mode.</p>
          </div>
        </div>
      )}
    </div>
  )
}
