"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { TrackList } from "@/components/track-list"

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, gap: 6, display: "flex", flexDirection: "column" }}>
        <div className="skeleton" style={{ width: "60%", height: 13 }} />
        <div className="skeleton" style={{ width: "40%", height: 11 }} />
      </div>
    </div>
  )
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Try to find playlist from cached my-playlists data
  const cached = queryClient.getQueryData<{ playlists: any[] }>(["my-playlists"])
  const cachedPlaylist = cached?.playlists?.find((p: any) => p.id === id)

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => api.getPlaylist(id),
    enabled: !!id,
    retry: 0,
  })

  const display = playlist ?? cachedPlaylist
  const displayTracks: any[] = (playlist?.tracks ?? display?.tracks ?? []) as any[]
  const totalDuration = displayTracks.reduce((s, t) => s + (t.duration_sec || 0), 0)
  const totalMins = Math.floor(totalDuration / 60)
  const queueTracks = displayTracks.map((t: any) => ({
    id: t.id,
    artist_id: t.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec,
    collaborators: t.collaborators,
  }))
  const trackIds = new Set(displayTracks.map((t: any) => t.id))
  const anyPlaying = displayTracks.length > 0 && currentTrack && trackIds.has(currentTrack.id) && isPlaying

  function handlePlayAll() {
    if (displayTracks.length === 0) return
    if (currentTrack && trackIds.has(currentTrack.id)) {
      togglePlay()
    } else {
      playQueue(queueTracks, 0)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
        <div className="skeleton" style={{ width: "30%", height: 28, marginBottom: 24 }} />
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) { .playlist-page-body { padding: 16px 12px 32px !important; } }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {display?.cover_url && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${display.cover_url})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(60px) brightness(0.55) saturate(1.6)",
            transform: "scale(1.15)",
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: display?.cover_url
            ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)"
            : "linear-gradient(135deg, var(--brand) 0%, #1d1d1f 100%)",
        }} />
        {/* bottom melt into page background */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1,
          height: isMobile ? 72 : 96,
          background: "linear-gradient(to bottom, transparent 0%, var(--content-bg) 100%)",
          opacity: 0.9,
        }} />
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex",
          gap: isMobile ? 16 : 32,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-end",
          textAlign: isMobile ? "center" : "left",
          padding: isMobile ? "52px 14px 56px" : "64px 40px 72px",
        }}>
          <div style={{ width: isMobile ? 150 : 200, height: isMobile ? 150 : 200, borderRadius: 6, background: display?.cover_url ? `url(${display.cover_url}) center/cover` : "rgba(255,255,255,0.12)", flexShrink: 0, boxShadow: "0 18px 48px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {!display?.cover_url && (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4"><path d="M9 18H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v10" /><path d="M3 10h18" /><path d="M14 14l4 2-4 2" /></svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", justifyContent: "flex-end", color: "#fff" }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.72)", marginBottom: 8 }}>
              Playlist
            </span>
            <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(28px, 4.5vw, 52px)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              {display?.title || "Playlist"}
            </h1>
            {display?.description && (
              <p style={{ margin: "0 0 4px", fontSize: 14, opacity: 0.75, lineHeight: 1.45, maxWidth: 560 }}>{display.description}</p>
            )}
            <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, opacity: 0.75 }}>
              {displayTracks.length}{" "}track{displayTracks.length === 1 ? "" : "s"}{totalDuration > 0 ? ` · ${totalMins} min` : ""}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
              <button
                onClick={handlePlayAll}
                disabled={displayTracks.length === 0}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 999, border: "1.5px solid #fff", background: "#fff", color: "#111", fontSize: 14, fontWeight: 700, cursor: displayTracks.length ? "pointer" : "default", opacity: displayTracks.length ? 1 : 0.5, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
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
      </div>

      {/* Tracks */}
      <div className="playlist-page-body" style={{ padding: isMobile ? "16px 12px 32px" : "32px 40px 64px" }}>
      {displayTracks.length > 0 ? (
        <TrackList tracks={displayTracks} />
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: 10, padding: "32px 24px", textAlign: "center", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 4px" }}>No tracks yet</p>
          <p style={{ fontSize: 13, margin: "0 0 16px" }}>This playlist doesn&rsquo;t have any tracks.</p>
          <button
            onClick={() => router.push("/")}
            style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Discover music
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
