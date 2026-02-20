import React from 'react'
import useStore from '../store/useStore'

/**
 * Left sidebar panel.
 * Session 1: Shows scene list and a placeholder icon library section.
 * Session 2+: Blueprint shape tools.
 * Session 3+: Full draggable icon library.
 * Session 5+: Scene management (add, rename, delete, reorder).
 */
export default function Sidebar() {
  const { sidebarCollapsed, mode, scenes, activeSceneId } = useStore()

  if (sidebarCollapsed) return null

  return (
    <aside className="
      flex flex-col w-56 shrink-0
      bg-sidebar-bg border-r border-sidebar-border
      overflow-hidden
    ">
      {/* Scenes panel */}
      <SectionHeader label="Scenes" />
      <div className="flex-none overflow-y-auto scrollbar-thin px-2 pb-2">
        {scenes.map((scene) => (
          <SceneItem
            key={scene.id}
            scene={scene}
            active={scene.id === activeSceneId}
          />
        ))}
        <AddButton label="+ Add Scene" onClick={() => {}} disabled />
      </div>

      <Divider />

      {/* Icon / tool library — placeholder for Sessions 2–3 */}
      <SectionHeader label={mode === 'blueprint' ? 'Blueprint Tools' : 'Icon Library'} />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        <PlaceholderLibrary mode={mode} />
      </div>
    </aside>
  )
}

function SceneItem({ scene, active }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm
        transition-colors
        ${active
          ? 'bg-accent-lighting/20 text-white'
          : 'text-sidebar-text hover:bg-sidebar-hover'
        }
      `}
    >
      <span className="text-sidebar-muted text-xs">▶</span>
      <span className="truncate">{scene.name}</span>
    </div>
  )
}

function SectionHeader({ label }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-sidebar-muted">
      {label}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-sidebar-border mx-2 my-1" />
}

function AddButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        w-full mt-1 px-2 py-1 text-xs text-sidebar-muted
        border border-dashed border-sidebar-border rounded-md
        hover:border-sidebar-text hover:text-sidebar-text
        transition-colors disabled:opacity-30 disabled:cursor-not-allowed
      "
    >
      {label}
    </button>
  )
}

function PlaceholderLibrary({ mode }) {
  const categories = mode === 'blueprint'
    ? ['Shapes', 'Room Tools']
    : ['Cameras', 'Light Sources', 'Modifiers', 'Stands', 'Subjects', 'Misc']

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="text-xs text-sidebar-muted mb-1 px-1">{cat}</div>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                title={`${cat} icon ${i} (available in Session 3)`}
                className="
                  aspect-square rounded-md
                  bg-sidebar-hover border border-sidebar-border
                  flex items-center justify-center
                  text-sidebar-muted text-xs
                  opacity-30 cursor-not-allowed
                "
              >
                <IconPlaceholder />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function IconPlaceholder() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
      stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="12" height="12" rx="2" />
      <circle cx="9" cy="9" r="3" />
    </svg>
  )
}
