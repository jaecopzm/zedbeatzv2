"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import type { Track, Album, Artist } from "@/types"
import { useState, useEffect, useCallback, useMemo } from "react"
import { PremiumTrackMenu } from "@/components/track-menu"
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
            ? <PauseIconSolid size={14} />
            : <PlayIconSolid size={14} />
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
          <img
            src={track.cover_url}
            alt=""
            style={{
              width: "100%", height: "100%",
              borderRadius: 6, objectFit: "cover",
              display: "block",
            }}
          />
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
            ? <PauseIconSolid size={16} />
            : <PlayIconSolid size={16} />
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

        .scroll-row::-webkit-scrollbar {
          height: 4px;
        }
        .scroll-row::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
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
                fontSize: isDesktop ? "clamp(28px, 5vw, 52px)" : "clamp(20px, 7vw, 30px)",
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 8px",
                lineHeight: 1.05,
                letterSpacing: "-0.5px",
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
                      width: isDesktop ? 26 : 20,
                      height: isDesktop ? 26 : 20,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "var(--brand)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    }}
                  >
                    <svg width={isDesktop ? 13 : 10} height={isDesktop ? 13 : 10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
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
                    <svg width={isDesktop ? 11 : 10} height={isDesktop ? 11 : 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
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
                    <svg width={isDesktop ? 11 : 10} height={isDesktop ? 11 : 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
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
                    <svg width={isDesktop ? 11 : 10} height={isDesktop ? 11 : 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
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
                        ? <PauseIconSolid size={14} />
                        : <PlayIconSolid size={14} />
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
                      ? <CheckIcon size={12} />
                      : <PlusIcon size={12} />
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

          {artist.bio && (
            <section style={{ marginBottom: 36 }}>
              <p style={{
                fontSize: 14, lineHeight: 1.65,
                color: "var(--muted-foreground)", maxWidth: 620, margin: 0,
              }}>
                {artist.bio}
              </p>
            </section>
          )}

          {artist.genre_tags && artist.genre_tags.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {artist.genre_tags.map((tag) => {
                  const genreId = genreMap.get(tag.toLowerCase())
                  return genreId ? (
                    <Link key={tag} href={`/genres/${genreId}`} style={{ textDecoration: "none" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: "var(--brand-bg)",
                        color: "var(--brand)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8" }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}>
                        {tag}
                      </span>
                    </Link>
                  ) : (
                    <span key={tag} style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "var(--brand-bg)",
                      color: "var(--brand)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {tag}
                    </span>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Songs ── */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeading
              title="Songs"
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
                {tracks.map((track, index) => {
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
              </div>
            ) : (
              <EmptyState
                title="No tracks yet"
                compact
              />
            )}
          </section>

          {/* ── Albums ── */}
          {(albumsLoading || albums.length > 0) && (
            <section style={{ marginBottom: 44 }}>
              <SectionHeading
                title="Albums & EPs"
                size="md"
              />

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
                <div className="scroll-row" style={{
                  display: "flex", gap: 18, overflowX: "auto",
                  paddingBottom: 8,
                  scrollbarWidth: "thin",
                }}>
                  {albums.map((album) => (
                    <div key={album.id} className="album-card" onClick={() => router.push(`/album/${album.id}`)}>
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="album-cover"
                        />
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
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Featured Collaborations ── */}
          {(collabLoading || collabTracks.length > 0) && (
            <section style={{ marginBottom: 44 }}>
              <SectionHeading
                title="Featured Collaborations"
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

        </div>
      </div>
    </>
  )
}

/* ─── Icons ─── */

function PlayIconSolid({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIconSolid({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="4" width="4" height="16" rx="1.5" />
      <rect x="15" y="4" width="4" height="16" rx="1.5" />
    </svg>
  )
}

function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
