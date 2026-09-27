"use client"

import { useRouter } from "next/navigation"
import type { Track } from "@/types"
import { usePlayerStore } from "@/lib/store"
import { ArtistLinks } from "@/components/artist-links"
import { PremiumTrackMenu } from "@/components/track-menu"
import { CoverImage } from "@/components/cover-image"
import { EqBars } from "@/components/eq"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function isTrackPlaying(trackId: string) {
  const { currentTrack, isPlaying } = usePlayerStore.getState()
  return isPlaying && currentTrack?.id === trackId
}

export function useIsTrackPlaying(trackId: string) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  return isPlaying && currentTrack?.id === trackId
}

export function useIsCurrentTrack(trackId: string) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  return currentTrack?.id === trackId
}

export function TrackArt({ track, size = 168 }: { track: Track; size?: number }) {
  return track.cover_url ? (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CoverImage src={track.cover_url} alt={track.title} sizes="220px" />
    </div>
  ) : (
    <div className="hp-card-art-placeholder" style={{ width: size, height: size }}>
      <svg width={size * 0.26} height={size * 0.26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    </div>
  )
}

export function TrackCardRow({ track }: { track: Track }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const isPlaying = useIsTrackPlaying(track.id)
  const isCurrentTrack = useIsCurrentTrack(track.id)
  const loading = usePlayerStore((s) => s._loading) === track.id

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentTrack) {
      togglePlay()
    } else {
      play({
        id: track.id,
        artist_id: track.artist_id,
        title: track.title,
        artist_name: track.artist_name ?? "",
        cover_url: track.cover_url,
        duration_sec: track.duration_sec,
        collaborators: track.collaborators,
      })
    }
  }

  return (
    <div
      className={`hp-card ${isCurrentTrack && isPlaying ? "hp-card-playing" : ""}`}
      onClick={handlePlayClick}
    >
      <div className="hp-card-art">
        <TrackArt track={track} />
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
      <p
        className="hp-card-title hp-card-title-hoverable"
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/track/${track.id}`)
        }}
      >
        {track.title}{isCurrentTrack ? <span> <EqBars paused={!isPlaying} /></span> : null}
      </p>
      <p className="hp-card-meta">
        <ArtistLinks track={track} />
      </p>
    </div>
  )
}

export function TrackRow({ track, index, isLast }: { track: Track; index?: number; isLast?: boolean }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const isPlaying = useIsTrackPlaying(track.id)
  const isCurrentTrack = useIsCurrentTrack(track.id)
  const loading = usePlayerStore((s) => s._loading) === track.id

  const handleRowClick = () => {
    if (isCurrentTrack) {
      togglePlay()
    } else {
      play({
        id: track.id,
        artist_id: track.artist_id,
        title: track.title,
        artist_name: track.artist_name ?? "",
        cover_url: track.cover_url,
        duration_sec: track.duration_sec,
        collaborators: track.collaborators,
      })
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        className={`hp-track-row track-row-hover ${isCurrentTrack && isPlaying ? "hp-track-row-playing" : ""}`}
        onClick={handleRowClick}
      >
        {index !== undefined && (
          <>
            <span className="hp-track-number">{index + 1}</span>
            <button
              className="hp-track-play-num-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleRowClick()
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
              type="button"
            >
              {loading ? (
                <svg className="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
              ) : isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          </>
          )}
          <div className="hp-track-art">
          {track.cover_url ? (
            <CoverImage src={track.cover_url} alt={track.title} sizes="120px" />
          ) : (
            <div className="hp-track-art-placeholder">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          <div className="hp-track-play-badge">
            {isCurrentTrack && isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
            )}
          </div>
        </div>
        <div className="hp-track-info">
          <p className="hp-track-title">
            <span
              className="hp-track-title-text"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/track/${track.id}`)
              }}
            >
              {track.title}
            </span>
            {isPlaying ? <span> <EqBars /></span> : null}
          </p>
          <p className="hp-track-artist">
            <ArtistLinks track={track} />
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span className="track-duration" style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            {formatDuration(track.duration_sec)}
          </span>
          <PremiumTrackMenu track={track} />
        </div>
      </div>
      {!isLast && <div className="hp-track-divider" />}
    </div>
  )
}
