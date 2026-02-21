import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

// Icon catalog — maps to SVG files in /icons folder
const ICON_CATEGORIES = [
  {
    name: 'Cameras',
    icons: [
      { name: 'Camera Blue', file: 'camera_blue.svg' },
      { name: 'Camera Gray', file: 'camera_gray.svg' },
      { name: 'Camera Green', file: 'camera_green.svg' },
      { name: 'Camera Orange', file: 'camera_orange.svg' },
      { name: 'Camera Purple', file: 'camera_purple.svg' },
      { name: 'Camera Red', file: 'camera_red.svg' },
      { name: 'Camera Yellow', file: 'camera_yellow.svg' },
    ],
  },
  {
    name: 'Light Sources',
    icons: [
      { name: 'Cob Fresnel', file: 'cob_fresnel.svg' },
      { name: 'Tube Light', file: 'tube_light.svg' },
      { name: 'Tube Light Big', file: 'tube_light_big.svg' },
      { name: 'Panel Light', file: 'panel_light.svg' },
      { name: 'China Ball', file: 'china_ball.svg' },
      { name: 'Practical Light', file: 'practical_light.svg' },
      { name: 'HMI Light', file: 'HMI_light.svg' },
      { name: 'HMI Light 2', file: 'hmi_light_2.svg' },
      { name: 'HMI Light 3', file: 'hmi_light_3.svg' },
      { name: 'HMI Light 4', file: 'hmi_light_4.svg' },
      { name: 'HMI Light 5', file: 'hmi_light_5.svg' },
      { name: 'HMI Light 6', file: 'hmi_light_6.svg' },
      { name: 'Spotlight', file: 'spotlight.svg' },
      { name: 'Sun Icon', file: 'sun_icon.svg' },
    ],
  },
  {
    name: 'Modifiers',
    icons: [
      { name: 'Diffusion', file: 'diffusion.svg' },
      { name: 'Diffusion 2', file: 'diffusion_2.svg' },
      { name: 'Negative Fill', file: 'negative_fill.svg' },
      { name: 'Black Floppy', file: 'black_floppy.svg' },
    ],
  },
  {
    name: 'Stands',
    icons: [
      { name: 'C Stand', file: 'c_stand.svg' },
    ],
  },
  {
    name: 'Subjects',
    icons: [
      { name: 'Actor Blue', file: 'actor_blue.svg' },
      { name: 'Actor Green', file: 'actor_green.svg' },
      { name: 'Actor Orange', file: 'actor_orange.svg' },
      { name: 'Actor Pink', file: 'actor_pink.svg' },
      { name: 'Actor Red', file: 'actor_red.svg' },
      { name: 'Actor Yellow', file: 'actor_yellow.svg' },
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
  const reorderScenes = useStore(s => s.reorderScenes)

  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

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

  const handleSceneDragStart = (e, id) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  const handleSceneDragOver = (e, id) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggingId) setDragOverId(id)
  }
  const handleSceneDrop = (e, targetId) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return }
    const srcIdx = scenes.findIndex(s => s.id === draggingId)
    const tgtIdx = scenes.findIndex(s => s.id === targetId)
    if (srcIdx < 0 || tgtIdx < 0) return
    const reordered = [...scenes]
    const [removed] = reordered.splice(srcIdx, 1)
    reordered.splice(tgtIdx, 0, removed)
    reorderScenes(reordered)
    setDraggingId(null)
    setDragOverId(null)
  }
  const handleSceneDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <div className="border-b border-gray-200 dark:border-white/10 pb-2">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">Scenes</span>
        <button
          className="text-gray-400 dark:text-white/50 hover:text-gray-800 dark:hover:text-white text-lg leading-none"
          onClick={addScene}
          title="Add Scene"
        >+</button>
      </div>
      <div className="space-y-0.5 px-2">
        {scenes.map(scene => (
          <div
            key={scene.id}
            draggable
            onDragStart={e => handleSceneDragStart(e, scene.id)}
            onDragOver={e => handleSceneDragOver(e, scene.id)}
            onDrop={e => handleSceneDrop(e, scene.id)}
            onDragEnd={handleSceneDragEnd}
            className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group transition-colors ${
              scene.id === currentSceneId
                ? 'bg-blue-100 dark:bg-white/15 text-blue-700 dark:text-white'
                : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'
            } ${dragOverId === scene.id && draggingId !== scene.id ? 'border-t-2 border-blue-400' : ''} ${
              draggingId === scene.id ? 'opacity-40' : ''
            }`}
            onClick={() => setCurrentScene(scene.id)}
          >
            {/* Drag handle */}
            <span className="opacity-0 group-hover:opacity-30 text-gray-500 dark:text-white cursor-grab text-xs select-none mr-0.5" title="Drag to reorder">⠿</span>
            {editingId === scene.id ? (
              <input
                className="flex-1 bg-transparent text-gray-900 dark:text-white text-xs outline-none border-b border-gray-300 dark:border-white/30"
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
                className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 text-xs"
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
  const projectName = useStore(s => s.projectName)
  const setProjectName = useStore(s => s.setProjectName)
  const currentFilePath = useStore(s => s.currentFilePath)
  const [openCategories, setOpenCategories] = useState({ 'Light Sources': true })

  // Editable project name
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(projectName)
  useEffect(() => { setNameValue(projectName) }, [projectName])

  const handleNameDoubleClick = () => {
    setNameValue(projectName)
    setEditingName(true)
  }
  const commitNameEdit = () => {
    const trimmed = nameValue.trim()
    if (trimmed) setProjectName(trimmed)
    setEditingName(false)
  }

  // Custom icons — persisted in localStorage
  const [customIcons, setCustomIcons] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lumalayout-custom-icons') || '[]') } catch { return [] }
  })
  const fileInputRef = useRef(null)

  const handleUploadIcon = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataURL = ev.target.result
      const iconName = file.name.replace(/\.svg$/i, '').replace(/[-_]/g, ' ')
      const newIcon = { name: iconName, file: dataURL, custom: true }
      const updated = [...customIcons, newIcon]
      setCustomIcons(updated)
      try { localStorage.setItem('lumalayout-custom-icons', JSON.stringify(updated)) } catch {}
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeCustomIcon = (idx) => {
    const updated = customIcons.filter((_, i) => i !== idx)
    setCustomIcons(updated)
    try { localStorage.setItem('lumalayout-custom-icons', JSON.stringify(updated)) } catch {}
  }

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
    img.src = icon.file.startsWith('data:') ? icon.file : `./icons/${encodeURIComponent(icon.file)}`
    e.dataTransfer.setDragImage(img, 30, 30)
  }

  if (sidebarCollapsed) return null

  // Build full category list including custom icons
  const allCategories = [
    ...ICON_CATEGORIES,
    ...(customIcons.length > 0 ? [{ name: 'Custom', icons: customIcons, isCustom: true }] : []),
  ]

  return (
    <div className="w-56 flex-shrink-0 bg-sidebar flex flex-col h-full border-r border-gray-200 dark:border-white/10">
      {/* Project name — double-click to rename */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10">
        {editingName ? (
          <input
            className="text-xs font-semibold bg-transparent border-b border-blue-400 dark:border-blue-300 outline-none w-full text-gray-900 dark:text-white"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitNameEdit}
            onKeyDown={e => { if (e.key === 'Enter') commitNameEdit(); if (e.key === 'Escape') setEditingName(false) }}
            autoFocus
          />
        ) : (
          <div
            className="text-xs font-semibold text-gray-800 dark:text-white/80 truncate cursor-pointer select-none"
            title="Double-click to rename"
            onDoubleClick={handleNameDoubleClick}
          >
            {projectName}
          </div>
        )}
        <div className="text-xs text-gray-400 dark:text-white/30 truncate mt-0.5">
          {currentFilePath ? currentFilePath.split(/[\\/]/).pop() : 'Unsaved'}
        </div>
      </div>

      {/* Scene panel */}
      <ScenePanel />

      {/* Icon library — only in lighting mode */}
      {mode === 'lighting' && (
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">Icon Library</span>
            <button
              className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1"
              onClick={() => fileInputRef.current?.click()}
              title="Upload custom SVG icon"
            >
              + Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={handleUploadIcon}
            />
          </div>
          {allCategories.map(cat => (
            <div key={cat.name}>
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                onClick={() => toggleCategory(cat.name)}
              >
                <span>{cat.name}</span>
                <span className="text-gray-400 dark:text-white/30">{openCategories[cat.name] ? '▾' : '▸'}</span>
              </button>
              {openCategories[cat.name] && (
                <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                  {cat.icons.map((icon, idx) => (
                    <div
                      key={cat.isCustom ? idx : icon.file}
                      className="icon-card relative group"
                      draggable
                      onDragStart={e => handleDragStart(e, icon)}
                      title={`${icon.name} — drag to canvas`}
                    >
                      <img
                        src={icon.file.startsWith('data:') ? icon.file : `./icons/${encodeURIComponent(icon.file)}`}
                        alt={icon.name}
                        onError={e => { e.target.src = './icons/camera_blue.svg' }}
                      />
                      <span>{icon.name}</span>
                      {cat.isCustom && (
                        <button
                          className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                          onClick={e => { e.stopPropagation(); removeCustomIcon(idx) }}
                          title="Remove custom icon"
                        >×</button>
                      )}
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
          <div className="text-gray-400 dark:text-white/30 text-xs leading-relaxed">
            <p className="font-semibold text-gray-500 dark:text-white/50 mb-2">Blueprint Mode</p>
            <p className="mb-1">Use the toolbar tools to:</p>
            <ul className="space-y-1 ml-2">
              <li><span className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-gray-500 dark:text-white/40">V</span> Selection tool</li>
              <li><span className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-gray-500 dark:text-white/40">P</span> Draw room outline</li>
              <li><span className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-gray-500 dark:text-white/40">R</span> Place rectangle</li>
              <li><span className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-gray-500 dark:text-white/40">C</span> Place circle</li>
              <li><span className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-gray-500 dark:text-white/40">T</span> Place triangle</li>
            </ul>
            <p className="mt-3">Elements placed here are locked in Lighting Mode.</p>
          </div>
        </div>
      )}
    </div>
  )
}
