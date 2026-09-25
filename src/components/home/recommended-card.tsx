"use client"

import { useRouter } from "next/navigation"
import type { RecommendedTrack } from "@/types"
import { usePlayerStore } from "@/lib/store"
import { useIsTrackPlaying, useIsCurrentTrack } from "@/components/home/track-cards"
import { CoverImage } from "@/components/cover-image"

export function RecommendedCard({ track }: { track: RecommendedTrack }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const isPlaying = useIsTrackPlaying(track.id)
  const isCurrentTrack = useIsCurrentTrack(track.id)
  const loading = usePlayerStore((s) => s._loading) === track.id

  const playTrack = () =>
    play({
      id: track.id,
      title: track.title,
      artist_name: track.artist_name ?? "",
      cover_url: track.cover_url,
      duration_sec: track.duration_sec,
    })

  const handleClick = () => {
    if (isCurrentTrack) {
      togglePlay()
    } else {
      playTrack()
    }
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClick()
  }

  return (
    <div
      className={`hp-card ${isCurrentTrack && isPlaying ? "hp-card-playing" : ""}`}
      onClick={handleClick}
    >
      <div className="hp-card-art">
        {track.cover_url ? (
          <CoverImage src={track.cover_url} alt={track.title} sizes="220px" />
        ) : (
          <div className="hp-card-art-placeholder" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        <div className="hp-card-eq">
          <div className="hp-card-eq-bar" />
          <div className="hp-card-eq-bar" />
          <div className="hp-card-eq-bar" />
          <div className="hp-card-eq-bar" />
        </div>
        <button
          className="hp-play-overlay"
          onClick={handlePlayClick}
          aria-label={isPlaying ? "Pause" : "Play"}
          type="button"
        >
          {loading ? (
            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
          ) : isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>
      </div>
      <p
        className="hp-card-title hp-card-title-hoverable"
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/track/${track.id}`)
        }}
      >
        {track.title}
      </p>
      <p className="hp-card-meta">{track.artist_name}</p>
    </div>
  )
}
