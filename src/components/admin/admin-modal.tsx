"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: number
}

export function AdminModal({ open, title, onClose, children, maxWidth = 520 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="admin-modal-panel"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  )
}
