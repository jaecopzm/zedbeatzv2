"use client"

import { useToastStore } from "@/lib/toast-store"

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => remove(t.id)}
          style={{ cursor: "pointer" }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
