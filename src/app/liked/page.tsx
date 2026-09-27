"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { TrackList } from "@/components/track-list"
import type { Track } from "@/types"

import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"
import { HeartIcon as HeartBold } from "@solar-icons/react/bold/heart"

export default function LikedPage() {
  const router = useRouter()
  const { playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()

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
      <header className="liked-hero">
        <div className="liked-hero-glow" aria-hidden />
        <div className="liked-hero-inner">
          <div className="liked-tile" aria-hidden>
            <HeartBold size={52} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="liked-eyebrow">Collection</p>
            <h1 className="liked-title">Liked Songs</h1>
            <p className="liked-meta">
              {tracks.length}{" "}track{tracks.length === 1 ? "" : "s"}{" "}you couldn&rsquo;t let go of
            </p>
            {tracks.length > 0 && (
              <button type="button" onClick={handlePlayAll} className="play-pill">
                {anyPlaying ? (
                  <PauseBold size={15} color="currentColor" />
                ) : (
                  <span style={{ marginLeft: 2, display: "flex" }}>
                    <PlayBold size={15} color="currentColor" />
                  </span>
                )}
                {anyPlaying ? "Pause" : "Play All"}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="liked-body">
        {isError ? (
          <div className="empty">
            <div className="empty-icon is-error" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <p className="empty-title">Failed to load liked songs</p>
            <p className="empty-sub" style={{ marginBottom: 20 }}>Please try again later.</p>
            <button type="button" onClick={() => window.location.reload()} className="doc-cta">
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="liked-skel-card" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="liked-skel-row">
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton" style={{ width: "60%", height: 13 }} />
                  <div className="skeleton" style={{ width: "40%", height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="empty">
            <div className="empty-icon is-liked" aria-hidden>
              <HeartBold size={30} color="#fff" />
            </div>
            <p className="empty-title">No liked songs yet</p>
            <p className="empty-sub" style={{ marginBottom: 20 }}>Tap the heart on any track to save it here.</p>
            <button type="button" onClick={() => router.push("/")} className="doc-cta">
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
