"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  const [details, setDetails] = useState("")

  useEffect(() => {
    console.error(error)
    setDetails(error?.message || error?.digest || "")
  }, [error])

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "70vh", gap: 16, background: "var(--background)", color: "var(--foreground)",
      padding: "40px", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0, maxWidth: 360 }}>
        An unexpected error occurred. Please try again.
      </p>
      {details && (
        <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0, maxWidth: 360, wordBreak: "break-all", opacity: 0.5 }}>
          {details}
        </p>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Try again
        </button>
        <button onClick={() => router.push("/")} style={{ padding: "10px 24px", borderRadius: 20, border: "1.5px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Go home
        </button>
      </div>
    </div>
  )
}
