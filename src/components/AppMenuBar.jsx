import React, { useEffect, useMemo, useRef, useState } from 'react'

function MenuDropdown({ items, onClose, onAction }) {
  return (
    <div className="absolute top-full left-0 mt-1 min-w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-slate-900 z-40">
      {items.map((item) => {
        if (item.type === 'separator') {
          return <div key={item.key} className="my-1 h-px bg-gray-200 dark:bg-white/15" />
        }

        const disabled = !!item.disabled
        return (
          <button
            key={item.key}
            type="button"
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between ${
              disabled
                ? 'text-gray-400 dark:text-white/30 cursor-not-allowed'
                : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
            onClick={() => {
              if (disabled || !item.action) return
              onAction(item.action)
              onClose()
            }}
            disabled={disabled}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-[11px] opacity-60 ml-6">{item.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function AppMenuBar({ menus, onAction }) {
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!openMenuKey) return

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpenMenuKey(null)
      }
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuKey(null)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onEscape)
    }
  }, [openMenuKey])

  const openMenu = useMemo(() => menus.find(menu => menu.key === openMenuKey), [menus, openMenuKey])

  return (
    <div
      ref={rootRef}
      className="flex items-center gap-1 px-3 h-9 border-b border-gray-200 bg-toolbar dark:border-white/10 select-none relative z-50"
    >
      {menus.map((menu) => {
        const isOpen = menu.key === openMenuKey
        return (
          <div key={menu.key} className="relative">
            <button
              type="button"
              className={`px-2 py-1 text-sm rounded transition-colors ${
                isOpen
                  ? 'bg-gray-200 text-gray-900 dark:bg-white/15 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10'
              }`}
              onClick={() => setOpenMenuKey(prev => prev === menu.key ? null : menu.key)}
              onMouseEnter={() => {
                if (openMenuKey) setOpenMenuKey(menu.key)
              }}
            >
              {menu.label}
            </button>
            {isOpen && openMenu && (
              <MenuDropdown
                items={openMenu.items}
                onClose={() => setOpenMenuKey(null)}
                onAction={onAction}
              />
            )}
          </div>
        )
      })}
      <div className="ml-3 text-xs font-semibold text-gray-500 dark:text-white/50">LumaLayout</div>
    </div>
  )
}
