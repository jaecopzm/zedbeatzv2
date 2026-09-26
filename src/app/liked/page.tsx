"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { TrackList } from "@/components/track-list"
import type { Track } from "@/types"

export default function LikedPage() {
  const router = useRouter()
  const { playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-likes"],
    queryFn: () => api.getMyLikes(),
    staleTime: 30_000,
  })

  const tracks: Track[] = data?.liked_tracks ?? []
  const queueTracks = tracks.map((t: any) => ({
    id: t.id,
    artist_id: t.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec,
    collaborators: t.collaborators,
  }))
  const trackIds = new Set(tracks.map((t: any) => t.id))
  const anyPlaying = tracks.length > 0 && currentTrack && trackIds.has(currentTrack.id) && isPlaying

  function handlePlayAll() {
    if (tracks.length === 0) return
    if (currentTrack && trackIds.has(currentTrack.id)) {
      togglePlay()
    } else {
      playQueue(queueTracks, 0)
    }
  }

  return (
    <div className="fade-in" style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #E0264B 0%, #8E1B3C 55%, #1B1B22 130%)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 90% at 15% 10%, rgba(255,255,255,0.16) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{
          position: "relative",
          display: "flex",
          gap: isMobile ? 14 : 24,
          alignItems: "center",
          padding: isMobile ? "40px 16px 24px" : "64px 40px 40px",
          color: "#fff",
        }}>
          <div style={{ width: isMobile ? 72 : 120, height: isMobile ? 72 : 120, borderRadius: isMobile ? 18 : 24, background: "rgba(255,255,255,0.16)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>
            <svg width={isMobile ? 32 : 52} height={isMobile ? 32 : 52} viewBox="0 0 24 24" fill="#fff">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.75 }}>
              Collection
            </span>
            <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(30px, 4.5vw, 54px)", fontWeight: 700, margin: "6px 0 8px", letterSpacing: "-0.02em", lineHeight: 1.02 }}>
              Liked Songs
            </h1>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, opacity: 0.8 }}>
              {tracks.length} track{tracks.length === 1 ? "" : "s"} you couldn&rsquo;t let go of
            </p>
            {tracks.length > 0 && (
              <button
                onClick={handlePlayAll}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "12px 28px", borderRadius: 999, border: "none", background: "#fff", color: "#111", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
              >
                {anyPlaying ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="6,4 20,12 6,20" /></svg>
                )}
                {anyPlaying ? "Pause" : "Play All"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px 12px 32px" : "32px 40px 64px" }}>
        {isError ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Failed to load liked songs</p>
            <p style={{ fontSize: 14, margin: "0 0 24px" }}>Please try again later.</p>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 28px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Try again</button>
          </div>
        ) : isLoading ? (
          <div style={{ background: "var(--card-bg)", borderRadius: 12, overflow: "hidden" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton" style={{ width: "60%", height: 13 }} />
                  <div className="skeleton" style={{ width: "40%", height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No liked songs yet</p>
            <p style={{ fontSize: 14, margin: "0 0 24px" }}>Tap the heart on any track to save it here.</p>
            <button
              onClick={() => router.push("/")}
              style={{ padding: "10px 28px", borderRadius: 24, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Discover music
            </button>
          </div>
        ) : (
          <TrackList tracks={tracks} />
        )}
      </div>
    </div>
  )
}
