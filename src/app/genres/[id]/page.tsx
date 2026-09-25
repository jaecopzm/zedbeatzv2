"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { TrackList } from "@/components/track-list"

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px" }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton" style={{ width: "60%", height: 13 }} />
        <div className="skeleton" style={{ width: "40%", height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 32, height: 11 }} />
    </div>
  )
}

export default function GenrePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    staleTime: 5 * 60 * 1000,
  })

  const genre = genresData?.genres?.find((g: any) => g.id === id)

  const { data, isLoading } = useQuery({
    queryKey: ["genre-tracks", id],
    queryFn: () => api.getTracksByGenre(id, 50),
    enabled: !!id,
  })

  const tracks = data?.tracks ?? []
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

  if (isLoading || !genresData) {
    return (
      <div style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
        <div className="skeleton" style={{ width: "30%", height: 28, marginBottom: 24 }} />
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--brand) 0%, #0B2D8A 60%, #131318 130%)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 90% at 85% 10%, rgba(255,255,255,0.14) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{
          position: "relative",
          display: "flex",
          gap: isMobile ? 12 : 24,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "flex-end",
          padding: isMobile ? "40px 16px 24px" : "64px 40px 40px",
          color: "#fff",
        }}>
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.35)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.75 }}>
              Genre
            </span>
            <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 700, margin: "6px 0 8px", letterSpacing: "-0.02em", lineHeight: 1.02 }}>
              {genre?.name || "Genre"}
            </h1>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, opacity: 0.8 }}>
              {tracks.length} track{tracks.length === 1 ? "" : "s"}
            </p>
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "12px 28px", borderRadius: 999, border: "none", background: "#fff", color: "#111", fontSize: 14, fontWeight: 700, cursor: tracks.length ? "pointer" : "default", opacity: tracks.length ? 1 : 0.5, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
            >
              {anyPlaying ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="6,4 20,12 6,20" /></svg>
              )}
              {anyPlaying ? "Pause" : "Play All"}
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div style={{ padding: isMobile ? "16px 12px 32px" : "32px 40px 64px" }}>
        {tracks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No tracks yet</p>
            <p style={{ fontSize: 14, margin: 0 }}>This genre doesn&rsquo;t have any tracks yet.</p>
          </div>
        ) : (
          <TrackList tracks={tracks} />
        )}
      </div>
    </div>
  )
}
