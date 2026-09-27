"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

import { HeartIcon as HeartLinear } from "@solar-icons/react/linear/heart"
import { ChatRoundDotsIcon as ChatLinear } from "@solar-icons/react/linear/chat-round-dots"
import { LibraryIcon as LibraryLinear } from "@solar-icons/react/linear/library"
import { SettingsMinimalisticIcon as SettingsLinear } from "@solar-icons/react/linear/settings-minimalistic"

const quickLinks = [
  { label: "Liked Songs", href: "/liked", tile: "#ff4e6a", icon: <HeartLinear size={16} color="currentColor" strokeWidth={1.8} /> },
  { label: "Messages", href: "/messages", tile: "#22b573", icon: <ChatLinear size={16} color="currentColor" strokeWidth={1.8} /> },
  { label: "Your Library", href: "/library", tile: "#4d7cff", icon: <LibraryLinear size={16} color="currentColor" strokeWidth={1.8} /> },
  { label: "Settings", href: "/settings", tile: "#8e8e93", icon: <SettingsLinear size={16} color="currentColor" strokeWidth={1.8} /> },
]

export default function ProfilePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  // Auth state is restored from localStorage, so it differs from the server
  // prerender — wait for mount so the signed-in/out branch always matches.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="pf-page" aria-hidden>
        <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "22px 0 24px" }}>
          <div className="skeleton" style={{ width: 76, height: 76, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "55%", height: 22, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 90, height: 18, borderRadius: 999 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 120, borderRadius: 6 }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="pf-page">
        <div className="pf-signin">
          <p className="empty-title">Sign in to view your profile</p>
          <p className="empty-sub" style={{ marginBottom: 20 }}>
            Your likes, library, and settings live here.
          </p>
          <button onClick={() => router.push("/login")} className="doc-cta" type="button">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const initials = user.email?.charAt(0).toUpperCase() || "?"

  return (
    <div className="fade-in pf-page">
      <div className="pf-head">
        <div className="pf-avatar" aria-hidden>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <h1 className="pf-name">{user.email}</h1>
          <span className="pf-role">{user.role}</span>
          {user.artist_id && (
            <div>
              <Link href={`/artist/${user.artist_id}`} className="pf-artist-btn">
                View Artist Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      <section className="set-group">
        <h2 className="set-group-label">Account</h2>
        <div className="set-kv">
          <span className="set-kv-label">Email</span>
          <span className="set-kv-value" style={{ textTransform: "none" }}>{user.email}</span>
        </div>
        <div className="set-kv">
          <span className="set-kv-label">Role</span>
          <span className="set-kv-value">{user.role}</span>
        </div>
      </section>

      <section className="set-group">
        <h2 className="set-group-label">Quick Links</h2>
        {quickLinks.map((l) => (
          <Link key={l.href} href={l.href} className="set-row" style={{ ["--tile" as string]: l.tile }}>
            <span className="set-tile">{l.icon}</span>
            <span className="set-row-text">{l.label}</span>
            <span className="set-chevron" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
