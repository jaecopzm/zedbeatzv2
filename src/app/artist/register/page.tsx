"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"
import { toast } from "@/lib/toast-store"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1"

const MAX_NAME_LENGTH = 50

const perks = [
  { icon: "upload", title: "Upload unlimited music", desc: "Share your tracks, albums, and EPs with the world." },
  { icon: "chart", title: "Real-time analytics", desc: "Track plays, likes, and followers in real time." },
  { icon: "gift", title: "5 free credits", desc: "Upload 5 tracks free when you sign up. 1 credit per upload." },
  { icon: "broadcast", title: "Message your fans", desc: "Send announcements to all your followers instantly." },
  { icon: "verify", title: "Get verified", desc: "Claim your profile and earn the verified badge." },
]

export default function ArtistRegisterPage() {
  const router = useRouter()
  const setToken = useAuthStore((s) => s.setToken)
  const theme = useThemeStore((s) => s.theme)
  const [stageName, setStageName] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const handlePhoto = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB")
      return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError("")
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handlePhoto(f)
  }, [handlePhoto])

  const removePhoto = useCallback(() => {
    setPhoto(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = stageName.trim()
    if (!trimmed) {
      setError("Stage name is required")
      nameRef.current?.focus()
      return
    }
    setLoading(true)
    setError("")

    try {
      const fd = new FormData()
      fd.append("stage_name", trimmed)
      if (photo) fd.append("photo", photo)

      const token = localStorage.getItem("access_token")
      const res = await fetch(`${API_BASE}/artists/register`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Registration failed" }))
        throw new Error(body.error || "Registration failed")
      }

      // Refresh token for updated role
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (refreshRes.ok) {
          const tokens = await refreshRes.json()
          setToken(tokens.access_token)
          localStorage.setItem("refresh_token", tokens.refresh_token)
        }
      }

      toast("Welcome to ZedBeatz! Your artist profile is live.", "success")
      router.push("/artist/dashboard")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const charCount = stageName.trim().length
  const isOverLimit = charCount > MAX_NAME_LENGTH

  return (
    <div
      className="fade-in"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
      style={{
        display: "flex", minHeight: "100vh", background: "var(--background)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Left hero panel ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 48px", background: "linear-gradient(160deg, var(--brand) 0%, #0E35A3 100%)",
        color: "#fff", position: "relative", overflow: "hidden",
      }}
      className="register-hero"
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -20, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 13, fontWeight: 500, marginBottom: 40 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to ZedBeatz
          </Link>

          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 900, lineHeight: 1.08, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            Share your music<br />with Zambia
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, margin: "0 0 40px", lineHeight: 1.5, maxWidth: 420 }}>
            Join thousands of Zambian artists on ZedBeatz. Upload tracks, grow your fanbase, and track your analytics.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", maxWidth: 420 }}>
            {perks.map((p) => (
              <div key={p.icon} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <PerkIcon name={p.icon} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{p.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.7, lineHeight: 1.3 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "60px 48px", background: "var(--background)",
      }}
      className="register-form-panel"
      >
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ marginBottom: 32 }}>
            <img src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"} alt="ZedBeatz" style={{ height: 24, marginBottom: 16 }} />
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)", margin: "0 0 4px", letterSpacing: "-0.4px" }}>Create your profile</h2>
            <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>Fill in the details below to get started.</p>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444",
              fontSize: 13, fontWeight: 500, marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Photo upload */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }} style={{ display: "none" }} />

              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={handleDrop}
                style={{
                  width: 112, height: 112, borderRadius: "50%", margin: "0 auto 12px", cursor: "pointer",
                  background: preview ? `url(${preview}) center/cover` : dragOver ? "var(--brand-bg)" : "var(--hover-bg)",
                  border: dragOver ? "2px dashed var(--brand)" : preview ? "3px solid var(--brand)" : "2px dashed var(--border)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease", position: "relative", overflow: "hidden",
                }}
              >
                {preview ? (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    onClick={(e) => { e.stopPropagation(); removePhoto() }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
                  </div>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    {dragOver && <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--brand)", fontWeight: 600 }}>Drop here</p>}
                  </>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 0" }}>
                {preview ? (
                  <button type="button" onClick={removePhoto} style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                    Remove photo
                  </button>
                ) : (
                  "Add a photo (optional)"
                )}
              </p>
            </div>

            {/* Stage name */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>Stage Name</label>
                <span style={{ fontSize: 11, fontWeight: 500, color: isOverLimit ? "#ef4444" : charCount > MAX_NAME_LENGTH * 0.8 ? "var(--brand)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                  {charCount}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                ref={nameRef}
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value.slice(0, MAX_NAME_LENGTH + 10))}
                placeholder="e.g. Yo Maps, Chef 187, Macky 2"
                autoFocus
                style={{
                  width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 12,
                  border: isOverLimit ? "2px solid #ef4444" : error && !stageName.trim() ? "2px solid #ef4444" : "1.5px solid var(--border)",
                  background: "var(--card-bg)", color: "var(--foreground)", outline: "none",
                  boxSizing: "border-box", fontFamily: "inherit",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-bg)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = isOverLimit ? "#ef4444" : "var(--border)"; e.currentTarget.style.boxShadow = "none" }}
              />
              {isOverLimit && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ef4444" }}>Stage name is too long</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !stageName.trim() || isOverLimit}
              style={{
                width: "100%", padding: "14px", borderRadius: 999, border: "none",
                background: loading || !stageName.trim() || isOverLimit ? "var(--border)" : "var(--brand)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading || !stageName.trim() || isOverLimit ? "default" : "pointer",
                transition: "transform 0.1s, box-shadow 0.2s",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (!loading && stageName.trim() && !isOverLimit) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 4px 20px var(--brand-shadow)" } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                  Setting up your artist profile...
                </span>
              ) : (
                "Create Artist Profile"
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", margin: "20px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
            <Link href="/" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Cancel</Link>
          </p>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .register-hero { display: none !important; }
          .register-form-panel { padding: 40px 24px !important; }
        }
      `}</style>
    </div>
  )
}

function PerkIcon({ name }: { name: string }) {
  const size = 16
  const color = "rgba(255,255,255,0.85)"
  switch (name) {
    case "upload":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
    case "chart":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    case "broadcast":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2" /><path d="M4.93 4.93a10 10 0 000 14.14M19.07 4.93a10 10 0 010 14.14" /></svg>
    case "verify":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case "gift":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>
    default:
      return null
  }
}
