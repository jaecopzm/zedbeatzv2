"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

interface Item {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

interface Props {
  items: Item[]
  label?: string
}

interface MenuPos {
  top?: number
  bottom?: number
  right: number
}

export function KebabMenu({ items, label = "Actions" }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const place = () => {
      const el = btnRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const right = Math.max(8, window.innerWidth - r.right)
      // Flip upward when there isn't room below the button.
      if (r.bottom + 240 > window.innerHeight && r.top > 240) {
        setPos({ bottom: Math.max(8, window.innerHeight - r.top + 6), right })
      } else {
        setPos({ top: r.bottom + 6, right })
      }
    }
    place()
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    // The menu is portaled to document.body so it can never be clipped by
    // an overflowing ancestor or trapped under a sidebar stacking context.
    // Close (rather than track) on scroll/resize to avoid a detached menu.
    const onScrollOrResize = () => setOpen(false)
    document.addEventListener("mousedown", onDocClick)
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onScrollOrResize)
    document.addEventListener("scroll", onScrollOrResize, true)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onScrollOrResize)
      document.removeEventListener("scroll", onScrollOrResize, true)
    }
  }, [open ])

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="admin-icon-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} role="menu" className="admin-menu" style={{ position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right, zIndex: 9999 }}>
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick() }}
              className={`admin-menu-item${item.danger ? " admin-menu-item-danger" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
