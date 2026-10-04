"use client"

import Link from "next/link"
import type { RecommendedTrack } from "@/types"
import { usePlayerStore } from "@/lib/store"
import { useIsTrackPlaying, useIsCurrentTrack } from "@/components/home/track-cards"
import { CoverImage } from "@/components/cover-image"
import { EqBars } from "@/components/eq"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"

export function RecommendedCard({ track }: { track: RecommendedTrack }) {
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
            <PauseBold size={17} color="currentColor" />
          ) : (
            <span style={{ marginLeft: 2, display: "flex" }}>
              <PlayBold size={17} color="currentColor" />
            </span>
          )}
        </button>
      </div>
      <p className="hp-card-title hp-card-title-hoverable">
        <Link href={`/track/${track.id}`} onClick={(e) => e.stopPropagation()}>
          {track.title}
        </Link>
        {isCurrentTrack ? <span> <EqBars paused={!isPlaying} /></span> : null}
      </p>
      <p className="hp-card-meta">{track.artist_name}</p>
    </div>
  )
}
