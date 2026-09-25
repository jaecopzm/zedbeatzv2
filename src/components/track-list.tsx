"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePlayerStore } from "@/lib/store"
import { ArtistLinks } from "@/components/artist-links"
import { PremiumTrackMenu } from "@/components/track-menu"
import { CoverImage } from "@/components/cover-image"

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

export function TrackList({ tracks, accentColor }: { tracks: any[]; accentColor?: string }) {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div className="tl-header" style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px 44px 40px", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
        <span>#</span>
        <span>Title</span>
        <span>Album</span>
        <span style={{ textAlign: "right" }}>Plays</span>
        <span style={{ textAlign: "right" }}><ClockIcon /></span>
        <span />
      </div>
      {tracks.map((t, idx) => {
        const isCurrent = currentTrack?.id === t.id
        const isPlayingNow = isCurrent && isPlaying
        const isHovered = hoveredId === t.id
        const albumName = t.album_name || t.albumName || ""
        return (
          <div key={t.id} className="tl-row" onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)}
            onClick={() => { if (isCurrent) togglePlay(); else play({ id: t.id, artist_id: t.artist_id, title: t.title, artist_name: t.artist_name ?? "", cover_url: t.cover_url, duration_sec: t.duration_sec, collaborators: t.collaborators || [] }) }}
            style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px 44px 40px", alignItems: "center", padding: "8px 12px", borderRadius: 6, cursor: "pointer", transition: "background-color 0.15s", background: isCurrent ? "var(--brand-bg)" : isHovered ? "var(--hover-bg)" : "transparent" }}
          >
            <div style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600 }}>
              {isHovered ? (
                <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: isCurrent ? (accentColor || "var(--brand)") : "var(--foreground)", display: "flex", alignItems: "center" }}
                  onClick={(e) => { e.stopPropagation(); if (isCurrent) togglePlay(); else play({ id: t.id, artist_id: t.artist_id, title: t.title, artist_name: t.artist_name ?? "", cover_url: t.cover_url, duration_sec: t.duration_sec, collaborators: t.collaborators || [] }) }}
                >
                  {isPlayingNow ? <PauseIcon size={16} /> : <PlayIconSolid size={16} />}
                </button>
              ) : (
                isCurrent && isPlayingNow ? (
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 12, width: 12 }}>
                    <div className="eq-bar" style={{ width: 2, height: "100%", background: accentColor || "var(--brand)" }} />
                    <div className="eq-bar" style={{ width: 2, height: "100%", background: accentColor || "var(--brand)" }} />
                    <div className="eq-bar" style={{ width: 2, height: "100%", background: accentColor || "var(--brand)" }} />
                  </div>
                ) : (
                  <span style={{ color: isCurrent ? (accentColor || "var(--brand)") : "var(--muted-foreground)" }}>{idx + 1}</span>
                )
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              {t.cover_url ? (
                <span style={{ position: "relative", width: 40, height: 40, borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flexShrink: 0, display: "block" }}>
                  <CoverImage src={t.cover_url} alt="" sizes="100px" />
                </span>
              ) : (
                <div className="tl-thumb" style={{ width: 40, height: 40, borderRadius: 4, background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.8"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p onClick={(e) => { e.stopPropagation(); router.push(`/track/${t.id}`) }}
                  style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isCurrent ? (accentColor || "var(--brand)") : "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {t.title}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <ArtistLinks track={t} />
                </p>
              </div>
            </div>
            <div className="tl-album" style={{ fontSize: 13, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
              {albumName ? (
                <span
                  onClick={(e) => { e.stopPropagation(); router.push(`/album/${t.album_id}`) }}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {albumName}
                </span>
              ) : "—"}
            </div>
            <div className="tl-plays" style={{ textAlign: "right", fontSize: 13, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              {formatCount(t.play_count || 0)}
            </div>
            <div className="tl-duration" style={{ textAlign: "right", fontSize: 13, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              {formatDuration(t.duration_sec)}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
              <PremiumTrackMenu track={{ id: t.id, artist_id: t.artist_id, title: t.title, artist_name: t.artist_name, cover_url: t.cover_url, duration_sec: t.duration_sec, collaborators: t.collaborators }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PlayIconSolid({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="5,3 19,12 5,21" /></svg>
}
export function PauseIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="5" y="4" width="4" height="16" rx="1.5" /><rect x="15" y="4" width="4" height="16" rx="1.5" /></svg>
}
export function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: "inline-block", verticalAlign: "middle" }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
}
