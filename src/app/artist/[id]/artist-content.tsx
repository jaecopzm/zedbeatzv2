"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import type { Track, Album, Artist } from "@/types"
import { useState, useEffect, useCallback, useMemo } from "react"
import { PremiumTrackMenu } from "@/components/track-menu"
import { CoverImage } from "@/components/cover-image"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"
import { CheckCircleIcon as BadgeBold } from "@solar-icons/react/bold/check-circle"
import { AddIcon as AddLinear } from "@solar-icons/react/linear/add"
import { CheckIcon as CheckLinear } from "@solar-icons/react/linear/check"
import { PointOnMapIcon as PinLinear } from "@solar-icons/react/linear/point-on-map"
import { UsersGroupRoundedIcon as FansLinear } from "@solar-icons/react/linear/users-group-rounded"
import { MusicNoteIcon as MusicLinear } from "@solar-icons/react/linear/music-note"
import { AltArrowDownIcon as ChevronDownLinear } from "@solar-icons/react/linear/alt-arrow-down"
import { AlbumIcon as AlbumLinear } from "@solar-icons/react/linear/album"
import { CalendarIcon as CalendarLinear } from "@solar-icons/react/linear/calendar"
import {
  Avatar,
  VerifiedBadge,
  PillButton,
  SectionHeading,
  EmptyState,
} from "@/components/artist/ui"

/* ─── helpers ─── */

function formatDuration(sec: number) {
  if (!sec || sec <= 0) return "--:--"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

function albumTypeLabel(type: string) {
  if (type === "single") return "Single"
  if (type === "ep") return "EP"
  return "Album"
}

/* ─── TrackRow (used in Songs + Featured Collaborations) ─── */

function TrackRow({
  track,
  index,
  isActive,
  isPlaying,
  isHovered,
  onPlay,
  onHover,
  onLeave,
}: {
  track: Track
  index: number
  isActive: boolean
  isPlaying: boolean
  isHovered: boolean
  onPlay: () => void
  onHover: () => void
  onLeave: () => void
}) {
  const router = useRouter()
  const isActiveAndPlaying = isActive && isPlaying

  return (
    <div
      className="track-row"
      onClick={onPlay}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ position: "relative" }}
    >
      {isActive && (
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: "var(--brand)",
          borderRadius: "0 2px 2px 0",
        }} />
      )}

      {isHovered ? (
        <div className="track-play-icon" style={{ display: "flex" }}>
          {isActiveAndPlaying
            ? <PauseBold size={14} color="currentColor" />
            : <PlayBold size={14} color="currentColor" />
          }
        </div>
      ) : (
      <div className="track-num" style={{
        color: isActive ? "var(--brand)" : "var(--muted-foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {isActiveAndPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--brand)">
            <rect x="5" y="4" width="4" height="16" rx="1.5" />
            <rect x="15" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          index + 1
        )}
      </div>
      )}

      <div className="track-cover-wrapper">
        {track.cover_url ? (
          <CoverImage src={track.cover_url} alt="" sizes="100px" />
        ) : (
          <div style={{
            width: "100%", height: "100%", borderRadius: 6,
            background: "linear-gradient(135deg, #e0e0ea 0%, #c8c8d6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        <div className="track-cover-overlay">
          {isActiveAndPlaying
            ? <PauseBold size={16} color="#fff" />
            : <PlayBold size={16} color="#fff" />
          }
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0, fontSize: 14, fontWeight: 500,
            color: isActive ? "var(--brand)" : "var(--foreground)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          <span
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/track/${track.id}`)
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
            style={{ cursor: "pointer" }}
          >
            {track.title}
          </span>
        </p>
        <p style={{
          margin: "2px 0 0", fontSize: 12,
          color: "var(--muted-foreground)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          <span
            onClick={(e) => { e.stopPropagation(); router.push(`/artist/${track.artist_id}`) }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
            style={{ cursor: "pointer" }}
          >
            {track.artist_name}
          </span>
          {track.collaborators && track.collaborators.length > 0 && (
            <span>
              {track.collaborators.map((c, i, arr) => (
                <span key={c.artist_id}>
                  <span>, </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); router.push(`/artist/${c.artist_id}`) }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
                    style={{ cursor: "pointer" }}
                  >
                    {c.stage_name}
                  </span>
                </span>
              ))}
            </span>
          )}
        </p>
      </div>

      <span className="track-play-count" style={{
        fontSize: 11, color: "var(--muted-foreground)",
        flexShrink: 0, width: 36, textAlign: "center",
      }}>
        {formatCount(track.play_count)}
      </span>

      <span className="track-duration" style={{
        fontSize: 12, color: "var(--muted-foreground)",
        flexShrink: 0, fontVariantNumeric: "tabular-nums",
        width: 40, textAlign: "right",
      }}>
        {formatDuration(track.duration_sec)}
      </span>

      <PremiumTrackMenu track={track} />
    </div>
  )
}

/* ─── AlbumRail (Albums / Singles & EPs share one card) ─── */

function AlbumRail({ albums }: { albums: Album[] }) {
  const router = useRouter()
  return (
    <div className="scroll-row" style={{
      display: "flex", gap: 18, overflowX: "auto",
      padding: "4px 24px 12px 2px",
      scrollbarWidth: "none",
    }}>
      {albums.map((album) => (
        <div key={album.id} className="album-card" onClick={() => router.push(`/album/${album.id}`)}>
          <div className="album-cover" style={{ position: "relative", overflow: "hidden" }}>
            {album.cover_url ? (
              <CoverImage src={album.cover_url} alt={album.title} sizes="220px" />
            ) : (
              <div className="album-cover-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a0a0b0" strokeWidth="1.4" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M9 18V9l8-1.5v9" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="15" cy="16.5" r="2" />
                </svg>
              </div>
            )}
          </div>
          <p style={{
            margin: "9px 0 2px",
            fontSize: 13, fontWeight: 600,
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {album.title}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted-foreground)" }}>
            {albumTypeLabel(album.type)}
            {album.released_at ? ` · ${new Date(album.released_at).getFullYear()}` : ""}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── main page component ─── */

interface ArtistContentProps {
  artistId: string
  initialArtist: Artist
}

export default function ArtistContent({ artistId, initialArtist }: ArtistContentProps) {
  const router = useRouter()
  const playQueue = usePlayerStore((s) => s.playQueue)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  const [followed, setFollowed] = useState<boolean | null>(
    initialArtist && typeof initialArtist.is_followed === "boolean"
      ? initialArtist.is_followed
      : null,
  )
  const [followLoading, setFollowLoading] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true
    return window.matchMedia("(min-width: 768px)").matches
  })
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null)
  const [showAllSongs, setShowAllSongs] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: artist } = useQuery({
    queryKey: ["artist", artistId],
    queryFn: () => api.getArtist(artistId),
    initialData: initialArtist,
  })

  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ["artist-tracks", artistId],
    queryFn: () => api.getArtistTracks(artistId),
    enabled: !!artistId,
  })

  const { data: collabTracksData, isLoading: collabLoading } = useQuery({
    queryKey: ["artist-collaborations", artistId],
    queryFn: () => api.getCollaboratorTracks(artistId, 10),
    enabled: !!artistId,
  })

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    staleTime: 5 * 60 * 1000,
  })
  const genreMap = useMemo(() => {
    const map = new Map<string, string>()
    if (genresData?.genres) {
      for (const g of genresData.genres) {
        map.set(g.name.toLowerCase(), g.id)
      }
    }
    return map
  }, [genresData])

  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["artist-albums", artistId],
    queryFn: () => api.getArtistAlbums(artistId),
    enabled: !!artistId,
  })

  const tracks = useMemo(
    () => (tracksData?.tracks ?? []).slice(0, 10),
    [tracksData],
  )
  const visibleTracks = showAllSongs ? tracks : tracks.slice(0, 5)
  const latestRelease = useMemo(() => {
    const list = albumsData?.albums ?? []
    if (list.length === 0) return null
    return [...list].sort((a: any, b: any) =>
      String(b.released_at || b.created_at || "").localeCompare(String(a.released_at || a.created_at || "")),
    )[0]
  }, [albumsData])
  const collabTracks = useMemo(
    () => collabTracksData?.tracks ?? [],
    [collabTracksData],
  )
  const albums = useMemo(
    () => albumsData?.albums ?? [],
    [albumsData],
  )

  /* ── actions ── */

  const handleFollowToggle = useCallback(async () => {
    if (followLoading || !artist || followed === null) return
    setFollowLoading(true)
    try {
      if (followed) {
        await api.unfollowArtist(artist.id)
        setFollowed(false)
      } else {
        await api.followArtist(artist.id)
        setFollowed(true)
      }
    } catch { /* ignore */ }
    setFollowLoading(false)
  }, [followed, followLoading, artist])

  function handlePlayFirst() {
    if (tracks.length === 0) return
    const first = tracks[0]
    if (currentTrack?.id === first.id) {
      togglePlay()
    } else {
      playQueue(tracks, 0)
    }
  }

  function handlePlayTrack(track: Track) {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      const idx = tracks.findIndex((t) => t.id === track.id)
      playQueue(tracks, idx >= 0 ? idx : 0)
    }
  }

  function handlePlayCollabTrack(track: Track) {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      const idx = collabTracks.findIndex((t) => t.id === track.id)
      playQueue(collabTracks, idx >= 0 ? idx : 0)
    }
  }

  if (!artist) return null

  const isFirstPlaying =
    tracks.length > 0 && currentTrack?.id === tracks[0].id && isPlaying

  const photoSize = isDesktop ? 180 : 100
  const heroPad = isDesktop ? "72px 44px 44px" : "40px 14px 16px"

  return (
    <>
      <style jsx global>{`
        .artist-tracks .track-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px 9px 10px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.12s;
          position: relative;
        }
        .artist-tracks .track-row:last-child {
          border-bottom: none;
        }
        .artist-tracks .track-row:hover {
          background: var(--hover-bg);
        }
        .artist-tracks .track-row:hover .track-num {
          display: none;
        }
        .artist-tracks .track-row:hover .track-play-icon {
          display: flex;
        }
        .artist-tracks .track-row:hover .track-cover-overlay {
          opacity: 1;
        }
        @media (hover: none) {
          .artist-tracks .track-row .track-num {
            display: none;
          }
          .artist-tracks .track-row .track-play-icon {
            display: flex;
          }
          .artist-tracks .track-row .track-cover-overlay {
            opacity: 1;
          }
        }
        .artist-tracks .track-num {
          font-size: 13px;
          color: var(--muted-foreground);
          width: 20px;
          text-align: center;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
        .artist-tracks .track-play-icon {
          display: none;
          align-items: center;
          justify-content: center;
          width: 20px;
          flex-shrink: 0;
          color: var(--foreground);
        }
        .artist-tracks .track-cover-wrapper {
          position: relative;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
        }
        @media (max-width: 480px) {
          .artist-tracks .track-row {
            gap: 8px;
            padding: 8px 8px 8px 6px;
          }
          .artist-tracks .track-cover-wrapper {
            width: 38px;
            height: 38px;
          }
          .artist-tracks .track-row .track-play-count,
          .artist-tracks .track-row .track-duration {
            display: none;
          }
          .artist-tracks .track-row > .skeleton:last-child,
          .artist-tracks .track-row > .skeleton:nth-last-child(2) {
            display: none;
          }
        }
        .artist-tracks .track-cover-overlay {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          background: rgba(0,0,0,0.42);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
          color: #fff;
        }
        .album-card {
          flex-shrink: 0;
          width: 160px;
          cursor: pointer;
          transition: transform 0.18s ease;
        }
        .album-card:hover {
          transform: scale(1.03);
        }
        .album-cover {
          width: 160px;
          height: 160px;
          border-radius: 4px;
          object-fit: cover;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          display: block;
          transition: box-shadow 0.18s ease;
        }
        .album-card:hover .album-cover {
          box-shadow: 0 12px 36px rgba(0,0,0,0.25);
        }
        .album-cover-placeholder {
          width: 160px;
          height: 160px;
          border-radius: 4px;
          background: linear-gradient(135deg, #e0e0ea 0%, #c8c8d6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          transition: box-shadow 0.18s ease;
        }
        .album-card:hover .album-cover-placeholder {
          box-shadow: 0 12px 36px rgba(0,0,0,0.22);
        }
        @media (max-width: 480px) {
          .album-card {
            width: 130px;
          }
          .album-cover {
            width: 130px;
            height: 130px;
          }
          .album-cover-placeholder {
            width: 130px;
            height: 130px;
          }
        }

        .scroll-row {
          scroll-snap-type: x proximity;
          scrollbar-width: none;
        }
        .scroll-row::-webkit-scrollbar {
          display: none;
        }
        .album-card {
          scroll-snap-align: start;
        }
      `}</style>

      <div className="fade-in" style={{ minHeight: "100%", background: "var(--content-bg)" }}>

        {/* ══ HERO ══ */}
        <div style={{ position: "relative", overflow: "hidden" }}>

          {artist.cover_url || artist.photo_url ? (
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              backgroundImage: `url(${artist.cover_url || artist.photo_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              filter: "blur(55px) brightness(0.5) saturate(1.5)",
              transform: "scale(1.15)",
            }} />
          ) : (
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "linear-gradient(135deg, var(--brand) 0%, #1a1a2e 100%)",
            }} />
          )}

          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: artist.cover_url || artist.photo_url
              ? "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.62) 100%)"
              : "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)",
          }} />

          <div style={{
            position: "relative", zIndex: 2,
            display: "flex",
            gap: isDesktop ? 36 : 16,
            alignItems: "center",
            padding: heroPad,
            flexWrap: "wrap",
          }}>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar
                src={artist.photo_url}
                name={artist.stage_name}
                size={photoSize}
                shape="circle"
                ring
                fetchPriority="high"
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: "var(--font-display, Inter, sans-serif)",
                fontSize: isDesktop ? "clamp(32px, 5vw, 56px)" : "clamp(24px, 8vw, 32px)",
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 8px",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                {artist.stage_name}
                {artist.verified && (
                  <span
                    title="Verified"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <BadgeBold size={isDesktop ? 26 : 20} color="var(--brand)" secondaryColor="#fff" secondaryOpacity={1} />
                  </span>
                )}
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 10 : 6, flexWrap: "wrap", marginBottom: isDesktop ? 22 : 12 }}>
                {artist.location && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: isDesktop ? 4 : 3,
                    padding: isDesktop ? "4px 10px" : "3px 8px", borderRadius: 20,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                    fontSize: isDesktop ? 12 : 11, fontWeight: 600, color: "rgba(255,255,255,0.88)",
                  }}>
                    <PinLinear size={isDesktop ? 11 : 10} color="currentColor" strokeWidth={2} />
                    {artist.location}
                  </span>
                )}

                {typeof artist.follower_count === "number" && artist.follower_count > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: isDesktop ? 5 : 3,
                    padding: isDesktop ? "4px 10px" : "3px 8px", borderRadius: 20,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                    fontSize: isDesktop ? 12 : 11, fontWeight: 600, color: "rgba(255,255,255,0.88)",
                  }}>
                    <FansLinear size={isDesktop ? 11 : 10} color="currentColor" strokeWidth={2} />
                    {formatCount(artist.follower_count as number)} followers
                  </span>
                )}

                {typeof artist.track_count === "number" && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: isDesktop ? 5 : 3,
                    padding: isDesktop ? "4px 10px" : "3px 8px", borderRadius: 20,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                    fontSize: isDesktop ? 12 : 11, fontWeight: 600, color: "rgba(255,255,255,0.88)",
                  }}>
                    <MusicLinear size={isDesktop ? 11 : 10} color="currentColor" strokeWidth={2} />
                    {formatCount(artist.track_count as number)} tracks
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: isDesktop ? 12 : 8, flexWrap: "wrap", alignItems: "center" }}>
                {tracks.length > 0 && (
                  <PillButton
                    size={isDesktop ? "md" : "xs"}
                    iconLeft={
                      isFirstPlaying
                        ? <PauseBold size={14} color="#1d1d1f" />
                        : <PlayBold size={14} color="#1d1d1f" />
                    }
                    onClick={handlePlayFirst}
                    style={{
                      background: "#fff", color: "#1d1d1f",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                    }}
                  >
                    {isFirstPlaying ? "Pause" : "Play"}
                  </PillButton>
                )}

                <PillButton
                  variant="ghost"
                  size={isDesktop ? "md" : "xs"}
                    iconLeft={
                      followed
                        ? <CheckLinear size={12} color="currentColor" strokeWidth={2.5} />
                        : <AddLinear size={12} color="currentColor" strokeWidth={2.5} />
                    }
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    ...(followed
                      ? { background: "rgba(255,255,255,0.22)", borderColor: "rgba(255,255,255,0.9)" }
                      : {}),
                  }}
                >
                  {followed ? "Following" : "Follow"}
                </PillButton>
              </div>
            </div>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ padding: isDesktop ? "40px 40px 64px" : "20px 16px 48px" }}>

          {/* ── Latest Release spotlight ── */}
          {latestRelease && (
            <section style={{ marginBottom: 40 }}>
              <div
                onClick={() => router.push(`/album/${latestRelease.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: isDesktop ? 20 : 14,
                  padding: isDesktop ? 20 : 14, borderRadius: 16,
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(18,18,28,0.05), 0 16px 40px -16px rgba(18,18,28,0.22)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)" }}
              >
                <div style={{ position: "relative", width: isDesktop ? 104 : 84, height: isDesktop ? 104 : 84, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                  {latestRelease.cover_url ? (
                    <CoverImage src={latestRelease.cover_url} alt={latestRelease.title} sizes="160px" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlbumLinear size={32} color="rgba(255,255,255,0.8)" strokeWidth={1.4} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand)" }}>
                    Latest release
                  </p>
                  <p style={{ margin: 0, fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: isDesktop ? 24 : 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {latestRelease.title}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
                    {albumTypeLabel(latestRelease.type)}
                    {latestRelease.released_at ? ` · ${new Date(latestRelease.released_at).getFullYear()}` : ""}
                  </p>
                </div>
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: isDesktop ? 48 : 40, height: isDesktop ? 48 : 40, borderRadius: "50%",
                  background: "var(--brand)", color: "#fff", flexShrink: 0,
                  boxShadow: "0 8px 20px var(--brand-shadow)",
                }}>
                  <PlayBold size={isDesktop ? 18 : 15} color="#fff" />
                </span>
              </div>
            </section>
          )}

          {/* ── Popular ── */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeading
              title="Popular"
              size="md"
            />

            {tracksLoading ? (
              <div className="artist-tracks">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="track-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px 9px 10px", borderBottom: "1px solid var(--border)" }}>
                    <div className="skeleton" style={{ width: 20, height: 14, borderRadius: 4, flexShrink: 0 }} />
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="skeleton" style={{ width: "50%", height: 14, marginBottom: 4 }} />
                      <div className="skeleton" style={{ width: "30%", height: 11 }} />
                    </div>
                    <div className="skeleton" style={{ width: 36, height: 11, flexShrink: 0 }} />
                    <div className="skeleton" style={{ width: 30, height: 11, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            ) : tracks.length > 0 ? (
              <div className="artist-tracks" style={{ position: "relative" }}>
                {visibleTracks.map((track, index) => {
                  const isActive = currentTrack?.id === track.id
                  const isHovered = hoveredTrackId === track.id
                  return (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={index}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      isHovered={isHovered}
                      onPlay={() => handlePlayTrack(track)}
                      onHover={() => setHoveredTrackId(track.id)}
                      onLeave={() => setHoveredTrackId(null)}
                    />
                  )
                })}
                {tracks.length > 5 && (
                  <button
                    onClick={() => setShowAllSongs((v) => !v)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      marginTop: 12, padding: "9px 20px", borderRadius: 999,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--foreground)", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                  >
                    {showAllSongs ? "Show less" : `Show all ${tracks.length}`}
                    <span style={{ display: "inline-flex", transform: showAllSongs ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
                      <ChevronDownLinear size={14} color="currentColor" strokeWidth={2} />
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <EmptyState
                title="No tracks yet"
                compact
              />
            )}
          </section>

          {/* ── Discography ── */}
          {(albumsLoading || albums.length > 0) && (
            <>
              {(() => {
                const fullAlbums = albums.filter((a) => a.type !== "single" && a.type !== "ep")
                const singlesEps = albums.filter((a) => a.type === "single" || a.type === "ep")
                return (
                  <>
                    {(albumsLoading || fullAlbums.length > 0) && (
                      <section style={{ marginBottom: 44 }}>
                        <SectionHeading title="Albums" size="md" />
                        {albumsLoading ? (
                          <div className="scroll-row" style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="album-card" style={{ flexShrink: 0, width: 160 }}>
                                <div className="skeleton" style={{ width: 160, height: 160, borderRadius: 4 }} />
                                <div className="skeleton" style={{ width: "70%", height: 13, marginTop: 9, marginBottom: 4 }} />
                                <div className="skeleton" style={{ width: "40%", height: 11 }} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <AlbumRail albums={fullAlbums} />
                        )}
                      </section>
                    )}
                    {!albumsLoading && singlesEps.length > 0 && (
                      <section style={{ marginBottom: 44 }}>
                        <SectionHeading title="Singles & EPs" size="md" />
                        <AlbumRail albums={singlesEps} />
                      </section>
                    )}
                  </>
                )
              })()}
            </>
          )}

          {/* ── Appears On ── */}
          {(collabLoading || collabTracks.length > 0) && (
            <section style={{ marginBottom: 44 }}>
              <SectionHeading
                title="Appears On"
                size="md"
              />

              {collabLoading ? (
                <div className="artist-tracks">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="track-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px 9px 10px", borderBottom: "1px solid var(--border)" }}>
                      <div className="skeleton" style={{ width: 20, height: 14, borderRadius: 4, flexShrink: 0 }} />
                      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="skeleton" style={{ width: "50%", height: 14, marginBottom: 4 }} />
                        <div className="skeleton" style={{ width: "30%", height: 11 }} />
                      </div>
                      <div className="skeleton" style={{ width: 36, height: 11, flexShrink: 0 }} />
                      <div className="skeleton" style={{ width: 30, height: 11, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="artist-tracks">
                  {collabTracks.map((track, index) => {
                    const isActive = currentTrack?.id === track.id
                    const isHovered = hoveredTrackId === track.id
                    return (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        isActive={isActive}
                        isPlaying={isPlaying}
                        isHovered={isHovered}
                        onPlay={() => handlePlayCollabTrack(track)}
                        onHover={() => setHoveredTrackId(track.id)}
                        onLeave={() => setHoveredTrackId(null)}
                      />
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── About ── */}
          {(artist.bio || artist.location || (artist.genre_tags && artist.genre_tags.length > 0)) && (
            <section style={{ marginBottom: 8 }}>
              <SectionHeading title="About" size="md" />
              <div style={{
                background: "var(--card-bg)", border: "1px solid var(--border)",
                borderRadius: 16, padding: isDesktop ? 24 : 18,
                boxShadow: "0 1px 2px rgba(18,18,28,0.05), 0 16px 40px -16px rgba(18,18,28,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: artist.bio ? 14 : 0 }}>
                  <Avatar src={artist.photo_url} name={artist.stage_name} size={isDesktop ? 64 : 52} shape="circle" />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: isDesktop ? 18 : 16, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                      {artist.stage_name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                      {typeof artist.follower_count === "number" && artist.follower_count > 0
                        ? `${formatCount(artist.follower_count)} followers`
                        : "Artist"}
                      {artist.location ? ` · ${artist.location}` : ""}
                    </p>
                  </div>
                </div>
                {artist.bio && (
                  <>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--muted-foreground)", maxWidth: 640 }}>
                      {bioOpen || artist.bio.length <= 240 ? artist.bio : `${artist.bio.slice(0, 240).trimEnd()}…`}
                    </p>
                    {artist.bio.length > 240 && (
                      <button
                        onClick={() => setBioOpen((v) => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontSize: 13, fontWeight: 700, color: "var(--brand)" }}
                      >
                        {bioOpen ? "Show less" : "Read more"}
                      </button>
                    )}
                  </>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {artist.location && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--hover-bg)", fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                      <PinLinear size={13} color="currentColor" strokeWidth={2} /> {artist.location}
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--hover-bg)", fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                    <CalendarLinear size={13} color="currentColor" strokeWidth={2} /> On ZedBeatz since {new Date(artist.created_at).getFullYear()}
                  </span>
                  {(artist.genre_tags ?? []).map((tag) => {
                    const genreId = genreMap.get(tag.toLowerCase())
                    return genreId ? (
                      <Link key={tag} href={`/genres/${genreId}`} style={{ textDecoration: "none" }}>
                        <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "var(--brand-bg)", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {tag}
                        </span>
                      </Link>
                    ) : (
                      <span key={tag} style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "var(--brand-bg)", color: "var(--brand)", fontSize: 12, fontWeight: 600 }}>
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  )
}
