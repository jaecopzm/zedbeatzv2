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
import { highlightEntities } from "@/lib/highlight"
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
import { HeadphonesRoundIcon as HeadphonesLinear } from "@solar-icons/react/linear/headphones-round"
import { ShareableArtistCard } from "@/components/shareable-artist-card"
import { formatDuration } from "@/lib/utils"
import { toast } from "@/lib/toast-store"
import {
  Avatar,
  VerifiedBadge,
  PillButton,
  SectionHeading,
  EmptyState,
} from "@/components/artist/ui"

/* ─── helpers ─── */

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
  variant,
  showRank = true,
}: {
  track: Track
  index: number
  isActive: boolean
  isPlaying: boolean
  isHovered: boolean
  onPlay: () => void
  onHover: () => void
  onLeave: () => void
  variant?: "chart" | "default"
  showRank?: boolean
}) {
  const router = useRouter()
  const isActiveAndPlaying = isActive && isPlaying
  const isChart = variant === "chart"

  return (
    <div
      className="track-row"
      onClick={onPlay}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ position: "relative", ...(isChart ? { padding: "7px 12px 7px 6px" } : {}) }}
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

      {showRank && (isHovered ? (
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
      ))}

      <div className="track-cover-wrapper">
        {track.cover_url ? (
          <CoverImage src={track.cover_url} alt="" sizes="100px" />
        ) : (
          <div style={{
            width: "100%", height: "100%", borderRadius: 4,
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
  const playLoading = usePlayerStore((s) => s._loading)

  const [followed, setFollowed] = useState<boolean | null>(
    initialArtist && typeof initialArtist.is_followed === "boolean"
      ? initialArtist.is_followed
      : null,
  )
  const [followLoading, setFollowLoading] = useState(false)
  // Server prerenders the desktop layout; the real viewport is applied in
  // an effect after hydration so server HTML and the first client render
  // always agree (reading matchMedia during render breaks hydration on
  // mobile, forcing a full client re-render). Tablets in portrait (<= 1024px,
  // e.g. 12.9" tablets report exactly 1024px) use the mobile layout,
  // matching the app shell breakpoint.
  const [isDesktop, setIsDesktop] = useState(true)
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null)
  const [showAllSongs, setShowAllSongs] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"music" | "discography" | "about">("music")
  const [shareLabel, setShareLabel] = useState("Share")

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
  const showPodium = tracks.length >= 4
  const podiumTracks = showPodium ? visibleTracks.slice(0, 3) : []
  const chartTracks = showPodium ? visibleTracks.slice(3) : visibleTracks
  const chartOffset = showPodium ? 3 : 0
  const totalPlays = useMemo(
    () => tracks.reduce((sum, t) => sum + (t.play_count || 0), 0),
    [tracks],
  )
  /* Artist Pick slot: auto-features the latest release for now.
     Backend follow-up: add `pinned_release_id` on the artist + a dashboard
     control, then this becomes `pinned ?? latest` with a one-line change. */
  const artistPick = useMemo(() => {
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

  const primaryGenreId = artist?.genre_tags?.length
    ? genreMap.get(artist.genre_tags[0].toLowerCase())
    : undefined

  const { data: similarData, isLoading: similarLoading } = useQuery({
    queryKey: ["artist-similar", artistId, primaryGenreId ?? "featured"],
    queryFn: async () => {
      if (primaryGenreId) {
        const res = await api.getTracksByGenre(primaryGenreId, 30)
        return { tracks: res?.tracks ?? [] }
      }
      const res = await api.listFeaturedArtists()
      return { artists: res?.artists ?? [] }
    },
    enabled: !!artistId && !!artist,
    staleTime: 5 * 60 * 1000,
  })

  const similarArtists: { id: string; name: string; photo: string | null }[] = useMemo(() => {
    if (!similarData) return []
    if (primaryGenreId && Array.isArray((similarData as any).tracks)) {
      const seen = new Map<string, { id: string; name: string; photo: string | null }>()
      for (const t of (similarData as any).tracks) {
        if (!t?.artist_id || t.artist_id === artistId || seen.has(t.artist_id)) continue
        seen.set(t.artist_id, {
          id: t.artist_id,
          name: t.artist_name ?? "Unknown artist",
          photo: t.cover_url ?? null,
        })
        if (seen.size >= 8) break
      }
      return [...seen.values()]
    }
    const list = (similarData as any).artists ?? []
    return list
      .filter((a: any) => a?.id && a.id !== artistId)
      .slice(0, 8)
      .map((a: any) => ({ id: a.id, name: a.stage_name, photo: a.photo_url ?? null }))
  }, [similarData, primaryGenreId, artistId])

  const { data: claimStatus } = useQuery({
    queryKey: ["artist-claim", artistId],
    queryFn: () => api.getClaimStatus(artistId).catch(() => null),
    staleTime: 5 * 60 * 1000,
  })
  const [claimDismissed, setClaimDismissed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1025px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  /* ── actions ── */

  const handleFollowToggle = useCallback(async () => {
    if (followLoading || !artist || followed === null) return
    setFollowLoading(true)
    try {
      if (followed) {
        await api.unfollowArtist(artist.id)
        setFollowed(false)
        toast("Unfollowed", "success")
      } else {
        await api.followArtist(artist.id)
        setFollowed(true)
        toast("Followed", "success")
      }
    } catch {
      toast("Failed to update", "error")
    }
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

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share) {
        await navigator.share({ title: artist?.stage_name ?? "Artist", url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareLabel("Copied!")
      setTimeout(() => setShareLabel("Share"), 1600)
    } catch { /* dismissed */ }
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

  return (
    <>
      <style jsx global>{`
        .artist-hero-inner {
          display: flex;
          gap: 36px;
          align-items: center;
          padding: 72px 44px 44px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }
        .artist-hero-avatar-wrap { flex-shrink: 0; }
        .artist-hero-avatar-wrap > * { width: 180px !important; height: 180px !important; }
        .artist-hero-info { flex: 1; min-width: 0; }
        .artist-hero-name {
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px;
          line-height: 1.05;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .artist-hero-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .artist-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(6px);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.88);
        }
        .artist-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        .artist-hero-body { padding: 60px 40px 64px; }
        @media (max-width: 1024px) {
          /* Tablet portrait: keep the horizontal desktop composition, scaled
             down — avatar, name, stats and actions stay left-aligned in a row.
             The centered stacked phone layout only applies at phone widths. */
          .artist-hero-inner {
            gap: 24px;
            padding: 60px 28px 32px;
          }
          .artist-hero-avatar-wrap > * { width: 150px !important; height: 150px !important; }
          .artist-hero-body { padding: 40px 28px 56px; }
        }
        @media (max-width: 640px) {
          /* Phones: left-aligned editorial hero — big balanced name that
             handles long stage names, avatar anchoring top-left. */
          .artist-hero-inner {
            gap: 14px;
            padding: 44px 16px 22px;
            justify-content: flex-start;
            text-align: left;
          }
          .artist-hero-avatar-wrap > * { width: 104px !important; height: 104px !important; }
          .artist-hero-eyebrow { text-align: left; }
          .artist-hero-name {
            justify-content: flex-start;
            text-align: left;
            font-size: clamp(30px, 9.5vw, 40px) !important;
            line-height: 1.0 !important;
            text-wrap: balance;
            letter-spacing: -0.03em;
          }
          .artist-hero-stats { justify-content: flex-start; gap: 6px; margin-bottom: 12px; }
          .artist-hero-pill { gap: 3px; padding: 3px 8px; font-size: 11px; }
          .artist-hero-actions { justify-content: flex-start; gap: 8px; }
          .artist-hero-body { padding: 20px 16px 48px; }
        }
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
        /* chart variant: big rank numbers, denser rows */
        .artist-tracks.chart .track-num {
          width: 36px;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .artist-tracks.chart .track-play-icon {
          width: 36px;
        }
        @media (max-width: 480px) {
          .artist-tracks.chart .track-num {
            width: 28px;
            font-size: 18px;
          }
          .artist-tracks.chart .track-play-icon {
            width: 28px;
          }
        }
        /* top-3 podium (cardless) */
        .top3-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .top3-card {
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .top3-card.is-active .top3-art {
          box-shadow: 0 0 0 2px var(--brand);
        }
        .top3-art {
          position: relative;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 6px;
          background: linear-gradient(135deg, #e0e0ea 0%, #c8c8d6 100%);
        }
        .top3-rank {
          position: absolute;
          left: 10px;
          bottom: 4px;
          font-size: 46px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          color: #fff;
          text-shadow: 0 2px 16px rgba(0,0,0,0.65);
        }
        .top3-play {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--brand);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px var(--brand-shadow);
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .top3-card:hover .top3-play,
        .top3-card.is-active .top3-play {
          opacity: 1;
          transform: translateY(0);
        }
        @media (hover: none) {
          .top3-card .top3-play {
            opacity: 1;
            transform: none;
          }
        }
        .top3-body {
          padding: 10px 2px 0;
        }
        .top3-title {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: -0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .top3-meta {
          margin: 3px 0 0;
          font-size: 11px;
          color: var(--muted-foreground);
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 480px) {
          .top3-grid {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            scroll-snap-type: x proximity;
            padding: 2px 40px 8px 2px;
            margin: 0 -2px 16px;
          }
          .top3-grid::-webkit-scrollbar {
            display: none;
          }
          .top3-card {
            flex: 0 0 44%;
            scroll-snap-align: start;
          }
          .top3-rank {
            font-size: 36px;
          }
        }
        .artist-tracks .track-cover-wrapper {
          position: relative;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 4px;
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
          border-radius: 4px;
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

          {/* Apple-style: sharp full-bleed photo that blends into page content */}
          {artist.cover_url || artist.photo_url ? (
            <>
              <div style={{
                position: "absolute", inset: 0, zIndex: 0,
                backgroundImage: `url(${artist.cover_url || artist.photo_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center 25%",
                transform: "scale(1.02)",
              }} />
              {/* ambient color bleed so the photo tints the page like Apple Music */}
              <div style={{
                position: "absolute", inset: 0, zIndex: 0,
                backgroundImage: `url(${artist.cover_url || artist.photo_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center 25%",
                filter: "blur(70px) saturate(1.6)",
                opacity: 0.55,
                transform: "scale(1.2)",
              }} />
            </>
          ) : (
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "linear-gradient(135deg, var(--brand) 0%, #1a1a2e 100%)",
            }} />
          )}

          {/* readability scrim */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.82) 100%)",
          }} />
          {/* bottom blend into page background (Apple image-to-content melt) */}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1,
            height: isDesktop ? 96 : 72,
            background: "linear-gradient(to bottom, transparent 0%, var(--content-bg) 100%)",
            opacity: 0.9,
          }} />

          <div className="artist-hero-inner">

            <div className="artist-hero-avatar-wrap" style={{ position: "relative" }}>
              <Avatar
                src={artist.photo_url}
                name={artist.stage_name}
                size={180}
                shape="circle"
                ring
                fetchPriority="high"
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                className="artist-hero-eyebrow"
                style={{
                margin: "0 0 6px", fontSize: isDesktop ? 13 : 12, fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "rgba(255,255,255,0.72)",
              }}>
                Artist{artist.verified ? " · verified" : ""}
              </p>
              <h1
                className="artist-hero-name"
                style={{
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
                gap: "10px",
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

              <div className="artist-hero-stats">
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

                {totalPlays > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: isDesktop ? 5 : 3,
                    padding: isDesktop ? "4px 10px" : "3px 8px", borderRadius: 20,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                    fontSize: isDesktop ? 12 : 11, fontWeight: 600, color: "rgba(255,255,255,0.88)",
                  }}>
                    <HeadphonesLinear size={isDesktop ? 12 : 11} color="currentColor" strokeWidth={2} />
                    {formatCount(totalPlays)} plays
                  </span>
                )}
              </div>

              <div className="artist-hero-actions">
                {tracks.length > 0 && (
                  <PillButton
                    size="xs"
                    loading={!!playLoading}
                    iconLeft={
                      isFirstPlaying
                        ? <PauseBold size={14} color="#1d1d1f" />
                        : <PlayBold size={14} color="#1d1d1f" />
                    }
                    onClick={handlePlayFirst}
                    style={{
                      background: "#fff", color: "#1d1d1f",
                      border: "1.5px solid #fff",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                    }}
                  >
                    {isFirstPlaying ? "Pause" : "Play"}
                  </PillButton>
                )}

                <PillButton
                  variant="ghost"
                  size={isDesktop ? "md" : "xs"}
                  loading={followLoading}
                    iconLeft={
                      followed
                        ? <CheckLinear size={12} color="currentColor" strokeWidth={2.5} />
                        : <AddLinear size={12} color="currentColor" strokeWidth={2.5} />
                    }
                  onClick={handleFollowToggle}
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

                <PillButton
                  variant="ghost"
                  size={isDesktop ? "md" : "xs"}
                  onClick={handleShare}
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                >
                  {shareLabel}
                </PillButton>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SPOTIFY-STYLE TABS · APPLE-STYLE GLASS ══ */}
        <div style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "color-mix(in srgb, var(--content-bg) 84%, transparent)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            display: "flex", gap: 2,
            overflowX: "auto", scrollbarWidth: "none",
            padding: isDesktop ? "0 40px" : "0 12px",
          }}>
            {([
              { id: "music", label: "Music" },
              { id: "discography", label: `Discography${albums.length > 0 ? ` · ${albums.length}` : ""}` },
              { id: "about", label: "About" },
            ] as const).map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: isDesktop ? "15px 16px 13px" : "13px 13px 11px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: isDesktop ? 14 : 13, fontWeight: 700,
                    color: active ? "var(--foreground)" : "var(--muted-foreground)",
                    borderBottom: active ? "2.5px solid var(--brand)" : "2.5px solid transparent",
                    marginBottom: -1, whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {claimStatus && !claimStatus.claimed && !claimDismissed && (
          <div style={{ padding: isDesktop ? "16px 40px 0" : "12px 16px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: isDesktop ? 12 : 8,
              padding: isDesktop ? "12px 12px 12px 18px" : "8px 8px 8px 12px",
              borderRadius: 8,
              background: "var(--brand-bg)",
              border: "1px solid color-mix(in srgb, var(--brand) 25%, transparent)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: isDesktop ? 14 : 12, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                  Is this you?
                </p>
                {isDesktop && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                    Claim this profile to edit your bio, photos and picks.
                  </p>
                )}
              </div>
              <PillButton
                size="xs"
                onClick={() => router.push(`/artist/${artistId}/claim`)}
              >
                Claim profile
              </PillButton>
              <button
                onClick={() => setClaimDismissed(true)}
                aria-label="Dismiss"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  border: "none", background: "transparent", cursor: "pointer",
                  color: "var(--muted-foreground)", fontSize: 16, lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ══ BODY ══ */}
        <div style={{ padding: isDesktop ? "32px 40px 64px" : "20px 16px 48px" }}>
          {activeTab === "music" && (
          <div className="fade-in">

          {/* ── Latest Release spotlight ── */}
          {artistPick && (
            <section style={{ marginBottom: 40 }}>
              <div
                onClick={() => router.push(`/album/${artistPick.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: isDesktop ? 20 : 14,
                  padding: isDesktop ? "4px 0" : "2px 0",
                  cursor: "pointer",
                }}
              >
                <div style={{ position: "relative", width: isDesktop ? 104 : 84, height: isDesktop ? 104 : 84, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  {artistPick.cover_url ? (
                    <CoverImage src={artistPick.cover_url} alt={artistPick.title} sizes="160px" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlbumLinear size={32} color="rgba(255,255,255,0.8)" strokeWidth={1.4} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
                    Latest release
                  </p>
                  <p style={{ margin: 0, fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: isDesktop ? 24 : 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {artistPick.title}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
                    {albumTypeLabel(artistPick.type)}
                    {artistPick.released_at ? ` · ${new Date(artistPick.released_at).getFullYear()}` : ""}
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
              title="Top Songs"
              size="md"
            />

            {tracksLoading ? (
              <div className="artist-tracks">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="track-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px 9px 10px", borderBottom: "1px solid var(--border)" }}>
                    <div className="skeleton" style={{ width: 20, height: 14, borderRadius: 4, flexShrink: 0 }} />
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0 }} />
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
              <>
                {podiumTracks.length > 0 && (
                  <div className="top3-grid">
                    {podiumTracks.map((track, i) => {
                      const isActivePod = currentTrack?.id === track.id
                      const playingPod = isActivePod && isPlaying
                      return (
                        <div
                          key={track.id}
                          className={`top3-card${isActivePod ? " is-active" : ""}`}
                          onClick={() => handlePlayTrack(track)}
                        >
                          <div className="top3-art">
                            {track.cover_url ? (
                              <CoverImage src={track.cover_url} alt="" sizes="300px" />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
                                  <path d="M9 18V5l12-2v13" />
                                  <circle cx="6" cy="18" r="3" />
                                  <circle cx="18" cy="16" r="3" />
                                </svg>
                              </div>
                            )}
                            <span className="top3-rank">{i + 1}</span>
                            <span className="top3-play">
                              {playingPod
                                ? <PauseBold size={16} color="#fff" />
                                : <PlayBold size={16} color="#fff" />
                              }
                            </span>
                          </div>
                          <div className="top3-body">
                            <p className="top3-title">{track.title}</p>
                            <p className="top3-meta">{formatCount(track.play_count)} plays</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              <div className="artist-tracks chart" style={{ position: "relative" }}>
                {chartTracks.map((track, i) => {
                  const index = chartOffset + i
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
                      variant="chart"
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
              </>
            ) : (
              <EmptyState
                title="No tracks yet"
                compact
              />
            )}
          </section>

          </div>
          )}

          {activeTab === "discography" && (
          <div className="fade-in">
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

          </div>
          )}

          {activeTab === "music" && (
          <div className="fade-in">
          {/* ── Appears On · collaborations ── */}
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
                      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0 }} />
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
                        showRank={false}
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

          {/* ── Fans also like ── */}
          {(similarLoading || similarArtists.length > 0) && (
            <section style={{ marginBottom: 44 }}>
              <SectionHeading
                title="Fans also like"
                size="md"
                description={primaryGenreId && artist.genre_tags?.length
                  ? `More ${artist.genre_tags[0]} artists on ZedBeatz`
                  : undefined}
              />
              {similarLoading ? (
                <div className="scroll-row" style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: isDesktop ? 120 : 104, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div className="skeleton" style={{ width: isDesktop ? 96 : 88, height: isDesktop ? 96 : 88, borderRadius: "50%" }} />
                      <div className="skeleton" style={{ width: "70%", height: 12, marginTop: 10 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="scroll-row" style={{
                  display: "flex", gap: isDesktop ? 20 : 10, overflowX: "auto",
                  padding: "4px 24px 12px 2px", scrollbarWidth: "none",
                }}>
                  {similarArtists.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => router.push(`/artist/${a.id}`)}
                      style={{ flexShrink: 0, width: isDesktop ? 120 : 104, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer" }}
                    >
                      <div style={{ transition: "transform 0.18s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                      >
                        <Avatar src={a.photo} name={a.name} size={isDesktop ? 96 : 88} shape="circle" />
                      </div>
                      <p style={{
                        margin: "10px 0 0", width: "100%", fontSize: 13, fontWeight: 600, color: "var(--foreground)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {a.name}
                      </p>
                      <p style={{ margin: "2px 0 0", width: "100%", fontSize: 11, color: "var(--muted-foreground)" }}>
                        Artist
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          </div>
          )}

          {activeTab === "about" && (
          <div className="fade-in">
          {/* ── About ── */}
          {(artist.bio || artist.location || (artist.genre_tags && artist.genre_tags.length > 0)) && (
            <section style={{ marginBottom: 8 }}>
              <SectionHeading title="About" size="md" />
              <div style={{
                background: "var(--card-bg)", border: "1px solid var(--border)",
                borderRadius: 12, overflow: "hidden",
                boxShadow: "0 1px 2px rgba(18,18,28,0.05), 0 16px 40px -16px rgba(18,18,28,0.2)",
              }}>
                <div style={{
                  position: "relative", height: isDesktop ? 132 : 104,
                  background: artist.photo_url ? undefined : "linear-gradient(135deg, var(--brand), #1a1a2e)",
                  overflow: "hidden",
                }}>
                  {artist.photo_url && (
                    <img src={artist.photo_url} alt="" loading="lazy" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,8,22,0.05) 30%, rgba(5,8,22,0.45) 100%)" }} />
                </div>
                <div style={{ padding: isDesktop ? "0 24px 24px" : "0 18px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: isDesktop ? -36 : -30, marginBottom: artist.bio ? 14 : 0 }}>
                  <Avatar src={artist.photo_url} name={artist.stage_name} size={isDesktop ? 72 : 60} shape="circle" ring />
                  <div style={{ minWidth: 0, paddingBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: isDesktop ? 20 : 17, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 6 }}>
                      {artist.stage_name}
                      {artist.verified && <BadgeBold size={17} color="var(--brand)" secondaryColor="#fff" secondaryOpacity={1} />}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--muted-foreground)" }}>
                      {typeof artist.follower_count === "number" && artist.follower_count > 0
                        ? `${formatCount(artist.follower_count)} followers`
                        : "Artist"}
                      {artist.location ? ` · ${artist.location}` : ""}
                    </p>
                  </div>
                </div>
                {artist.bio && (
                  <>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--foreground)", maxWidth: 640, whiteSpace: "pre-wrap" }}>
                      {highlightEntities(
                        bioOpen || artist.bio.length <= 240 ? artist.bio : `${artist.bio.slice(0, 240).trimEnd()}…`,
                        [artist.stage_name, artist.location, ...(artist.genre_tags ?? [])]
                      )}
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
                  {typeof (artist as any).social_links === "object" && (artist as any).social_links !== null && (
                    Object.entries((artist as any).social_links as Record<string, string>)
                      .filter(([, v]) => typeof v === "string" && v.trim())
                      .map(([k, v]) => (
                        <a
                          key={k}
                          href={v.startsWith("http") ? v : `https://${v}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "var(--hover-bg)", color: "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                            {k}
                          </span>
                        </a>
                      ))
                  )}
                </div>
                </div>
              </div>
            </section>
          )}

          {/* ── About stats strip ── */}
          <section style={{ marginTop: 20, marginBottom: 8 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
              gap: 12,
            }}>
              {[
                { label: "Followers", value: typeof artist.follower_count === "number" ? formatCount(artist.follower_count) : "—", Icon: FansLinear },
                { label: "Tracks", value: typeof artist.track_count === "number" ? formatCount(artist.track_count) : String(tracks.length || "—"), Icon: MusicLinear },
                { label: "Releases", value: albums.length > 0 ? String(albums.length) : "—", Icon: AlbumLinear },
                { label: "Appears on", value: collabTracks.length > 0 ? String(collabTracks.length) : "—", Icon: HeadphonesLinear },
              ].map(({ label, value, Icon }) => (
                <div key={label} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: isDesktop ? "14px 16px" : "12px 13px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <Icon size={20} color="var(--brand)" strokeWidth={2} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: isDesktop ? 20 : 17, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--foreground)", lineHeight: 1.2 }}>
                      {value}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", marginTop: 1 }}>
                      {label}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Share poster ── */}
          <section style={{ marginTop: 20, marginBottom: 8 }}>
            <SectionHeading
              title="Share"
              size="md"
              description="A poster for socials, generated with live stats."
            />
            <ShareableArtistCard
              data={{
                stageName: artist.stage_name,
                photoUrl: artist.photo_url,
                verified: artist.verified,
                totalPlays,
                totalFollowers: artist.follower_count ?? 0,
                totalTracks: artist.track_count ?? tracks.length,
                topTrackTitle: tracks[0]?.title,
                topTrackPlays: tracks[0]?.play_count,
              }}
            />
          </section>
          </div>
          )}

        </div>
      </div>
    </>
  )
}
