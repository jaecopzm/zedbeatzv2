"use client"

import { usePlayerStore, type TrackInfo } from "@/lib/store"
import { CoverImage } from "@/components/cover-image"

export interface BlogTrack {
  id: string
  title: string
  artist_name: string
  cover_url?: string | null
  duration_sec?: number | null
}

/** Premium song row with inline play — hooks into the global player. */
export function BlogTrackList({ tracks }: { tracks: BlogTrack[] }) {
  const playQueue = usePlayerStore((s) => s.playQueue)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  if (tracks.length === 0) return null

  const queue: TrackInfo[] = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist_name: t.artist_name,
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec ?? 0,
  }))

  return (
    <div className="blog-tracks" role="list" aria-label="Songs in this story">
      {tracks.map((t, i) => {
        const active = currentTrack?.id === t.id
        return (
          <div
            key={t.id}
            role="listitem"
            className={`blog-track${active ? " is-active" : ""}`}
            onClick={() => {
              if (active) togglePlay()
              else void playQueue(queue, i)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                if (active) togglePlay()
                else void playQueue(queue, i)
              }
            }}
            tabIndex={0}
            aria-label={`Play ${t.title} by ${t.artist_name}`}
          >
            <span className="blog-track-index" aria-hidden>
              {active && isPlaying ? (
                <span className="blog-eq"><span /><span /><span /></span>
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <span className="blog-track-art">
              {t.cover_url ? (
                <CoverImage src={t.cover_url} alt={t.title} sizes="112px" />
              ) : (
                <span className="blog-track-art-fallback" aria-hidden>
                  {t.title.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="blog-track-play" aria-hidden>
                {active && isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </span>
            </span>
            <span className="blog-track-meta">
              <span className="blog-track-title">{t.title}</span>
              <span className="blog-track-artist">{t.artist_name}</span>
            </span>
            <span className="blog-track-cta" aria-hidden>
              {active ? (isPlaying ? "Playing" : "Paused") : "Play"}
            </span>
          </div>
        )
      })}
    </div>
  )
}
