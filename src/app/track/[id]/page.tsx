"use client"

import { useQuery, useQueries } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { useLikesStore } from "@/lib/likes-store"
import { ArtistLinks } from "@/components/artist-links"
import { TrackList, PlayIconSolid, PauseIcon } from "@/components/track-list"
import { PremiumTrackMenu } from "@/components/track-menu"
import { useColorExtract } from "@/lib/use-color-extract"
import { formatDuration } from "@/lib/utils"

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

function TrackPageSkeleton() {
  return (
    <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      <div style={{
        background: "linear-gradient(180deg, color-mix(in srgb, var(--muted-foreground) 12%, var(--content-bg)) 0%, var(--content-bg) 100%)",
      }}>
        <div className="track-skel-hero">
          <div className="skeleton track-skel-art" />
          <div className="track-skel-info">
            <div className="skeleton" style={{ width: 48, height: 12 }} />
            <div className="skeleton" style={{ width: "72%", maxWidth: 420, height: 40, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: "48%", maxWidth: 280, height: 14 }} />
            <div className="skeleton" style={{ width: "36%", maxWidth: 200, height: 12 }} />
          </div>
        </div>
        <div className="track-skel-actions">
          <div className="skeleton" style={{ width: 56, height: 56, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
        </div>
      </div>
      <div className="track-skel-body">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: "40%", height: 16 }} />
            <div className="skeleton" style={{ width: "24%", height: 12 }} />
          </div>
          <div className="skeleton" style={{ width: 96, height: 36, borderRadius: 20 }} />
        </div>
        <div>
          <div className="skeleton track-skel-section-title" style={{ marginBottom: 14 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="track-skel-row">
              <div className="skeleton" style={{ width: 18, height: 14 }} />
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ width: `${55 + (i % 3) * 10}%`, height: 13 }} />
                <div className="skeleton" style={{ width: `${30 + (i % 2) * 12}%`, height: 11 }} />
              </div>
              <div className="skeleton" style={{ width: 36, height: 12 }} />
            </div>
          ))}
        </div>
        <div>
          <div className="skeleton track-skel-section-title" style={{ marginBottom: 14 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="track-skel-row">
              <div className="skeleton" style={{ width: 18, height: 14 }} />
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ width: `${50 + i * 8}%`, height: 13 }} />
                <div className="skeleton" style={{ width: "28%", height: 11 }} />
              </div>
              <div className="skeleton" style={{ width: 36, height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div className="skeleton" style={{ width: 160, height: 12, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 220, height: 22, marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="track-skel-row">
          <div className="skeleton" style={{ width: 18, height: 14 }} />
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 4, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="skeleton" style={{ width: `${52 + (i % 3) * 12}%`, height: 13 }} />
            <div className="skeleton" style={{ width: `${28 + (i % 2) * 10}%`, height: 11 }} />
          </div>
          <div className="skeleton" style={{ width: 36, height: 12 }} />
        </div>
      ))}
    </div>
  )
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)

  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const loading = usePlayerStore((s) => s._loading) === id
  const { isLiked, toggleLike } = useLikesStore()
  const [likeLoading, setLikeLoading] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [liked, setLiked] = useState(() => (id ? isLiked(id) : false))
  const [shareCopied, setShareCopied] = useState(false)
  const [showSticky, setShowSticky] = useState(false)

  const { data: track, isLoading, isError } = useQuery({
    queryKey: ["track", id],
    queryFn: () => api.getTrack(id),
    enabled: !!id,
  })

  const palette = useColorExtract(track?.cover_url)
  const accentColor = palette.vibrant
  const accentRgb = `${palette.r}, ${palette.g}, ${palette.b}`
  const accentAlpha = (a: number) => `rgba(${accentRgb}, ${a})`

  const { data: album } = useQuery({
    queryKey: ["album", track?.album_id],
    queryFn: () => api.getAlbum(track!.album_id!),
    enabled: !!track?.album_id,
  })

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ["artist", track?.artist_id],
    queryFn: () => api.getArtist(track!.artist_id),
    enabled: !!track?.artist_id,
  })

  useEffect(() => {
    const val = artist?.is_followed
    if (val === true || val === false) setFollowing(val)
  }, [artist?.is_followed])

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 80)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    staleTime: 5 * 60 * 1000,
  })
  const genreName = genresData?.genres?.find((g) => g.id === track?.genre_id)?.name

  const { data: radioData, isLoading: radioLoading } = useQuery({
    queryKey: ["radio", id],
    queryFn: () => api.getRadio(id, 5),
    enabled: !!id && !!track,
  })

  const { data: artistTracksData, isLoading: popularLoading } = useQuery({
    queryKey: ["artist-tracks", track?.artist_id],
    queryFn: () => api.getArtistTracks(track!.artist_id),
    enabled: !!track?.artist_id,
  })

  const { data: artistAlbumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["artist-albums", track?.artist_id],
    queryFn: () => api.getArtistAlbums(track!.artist_id),
    enabled: !!track?.artist_id,
  })

  const collaboratorIds = track?.collaborators?.map((c: any) => c.artist_id || c.id) ?? []

  const collabTracksQueries = useQueries({
    queries: collaboratorIds.map((aid: string) => ({
      queryKey: ["artist-tracks", aid],
      queryFn: () => api.getArtistTracks(aid),
      enabled: !!aid,
    })),
  })

  const isCurrentTrack = currentTrack?.id === id
  const isCurrentlyPlaying = isCurrentTrack && isPlaying

  const toPlayerTrack = useCallback(() => {
    if (!track) return null
    return {
      id: track.id,
      artist_id: track.artist_id,
      title: track.title,
      artist_name: track.artist_name ?? "",
      cover_url: track.cover_url,
      duration_sec: track.duration_sec,
      collaborators: track.collaborators,
    }
  }, [track])

  function handlePlay() {
    const t = toPlayerTrack()
    if (!t) return
    if (isCurrentTrack) togglePlay()
    else play(t)
  }

  async function handleLike() {
    if (!track || likeLoading) return
    setLikeLoading(true)
    try {
      const newState = await toggleLike(track.id)
      setLiked(newState)
    } catch { /* ignore */ }
    setLikeLoading(false)
  }

  async function handleFollow() {
    if (!track?.artist_id || followLoading) return
    setFollowLoading(true)
    try {
      if (following) {
        await api.unfollowArtist(track.artist_id)
        setFollowing(false)
      } else {
        await api.followArtist(track.artist_id)
        setFollowing(true)
      }
    } catch { /* ignore */ }
    setFollowLoading(false)
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: track?.title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 1800)
      }
    } catch { /* ignore */ }
  }

  if (isLoading) return <TrackPageSkeleton />

  if (isError || !track) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", gap: 16, color: "var(--muted-foreground)", background: "var(--content-bg)",
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Track not found</p>
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 20px", borderRadius: 20, border: "1.5px solid var(--border)",
            background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--foreground)",
          }}
        >
          Go back
        </button>
      </div>
    )
  }

  const recommended = (radioData?.queue ?? []).filter((t: any) => t.id !== track.id).slice(0, 5)
  const popularTracks = (artistTracksData?.tracks ?? []).filter((t: any) => t.id !== track.id).slice(0, 5)
  const albums = (artistAlbumsData?.albums ?? []).slice(0, 6)
  const collabTracks = collabTracksQueries.map((q: any) => (q.data?.tracks ?? []).filter((t: any) => t.id !== track.id).slice(0, 5))
  const playerTrack = toPlayerTrack()!

  return (
    <div className="fade-in" style={{
      minHeight: "100%",
      background: "var(--content-bg)",
      color: "var(--foreground)",
      fontFamily: "var(--font-sans)",
      paddingBottom: 100,
    }}>
      {/* Sticky header bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        height: 56,
        background: `linear-gradient(180deg, ${accentAlpha(0.95)} 0%, ${accentAlpha(0.88)} 100%)`,
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        opacity: showSticky ? 1 : 0,
        pointerEvents: showSticky ? "auto" : "none",
        transition: "opacity 0.2s ease",
      }}>
        {track?.cover_url && (
          <img src={track.cover_url} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
            {track?.title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
            {track?.artist_name}
          </div>
        </div>
        <button
          onClick={handlePlay}
          style={{
            width: 34, height: 34, borderRadius: "50%", border: "none",
            background: accentColor || "var(--brand)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: loading ? "default" : "pointer",
            flexShrink: 0, padding: 0,
          }}
          title={loading ? "Loading" : isCurrentlyPlaying ? "Pause" : "Play"}
        >
          {loading ? (
            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
          ) : isCurrentlyPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
      </div>

      {/* Hero */}
      <div style={{
        position: "relative",
        background: `linear-gradient(180deg, ${accentAlpha(0.88)} 0%, ${accentAlpha(0.35)} 45%, var(--content-bg) 100%)`,
        color: "#ffffff",
        overflow: "hidden",
      }}>
        {track.cover_url && (
          <img
            src={track.cover_url}
            alt=""
            aria-hidden
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", filter: "blur(60px) saturate(1.4) brightness(0.55)",
              transform: "scale(1.2)", opacity: 0.55, pointerEvents: "none",
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1 }}>

          <div className="track-hero">
            <div className="track-hero-art">
                {track.cover_url ? (
                  <img src={track.cover_url} alt={track.title} fetchPriority="high" />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: `linear-gradient(135deg, ${accentColor} 0%, var(--brand-light) 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
            </div>
            <div className="track-hero-info" style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.75)", marginBottom: 6, display: "block",
              }}>
                Song
              </span>
              <h1 className="track-hero-title" style={{
                fontSize: "clamp(28px, 5.5vw, 72px)", fontWeight: 900, color: "#fff",
                margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-0.03em",
                textShadow: "0 2px 14px rgba(0,0,0,0.35)",
              }}>
                {track.title}
              </h1>
              <div className="track-hero-meta" style={{
                display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)",
              }}>
                <span style={{ color: "#fff", fontWeight: 700 }} className="track-hero-artists">
                  <ArtistLinks track={track} />
                </span>
                <span aria-hidden>•</span>
                {album ? (
                  <span
                    onClick={() => router.push(`/album/${album.id}`)}
                    style={{ cursor: "pointer", color: "#fff" }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
                  >
                    {album.title}
                  </span>
                ) : (
                  <span>Single</span>
                )}
                {track.released_at && (
                  <><span aria-hidden>•</span><span>{new Date(track.released_at).getFullYear()}</span></>
                )}
                <span aria-hidden>•</span>
                <span>{formatDuration(track.duration_sec)}</span>
                <span aria-hidden>•</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{formatCount(track.play_count)} plays</span>
                {track.genre_id && genreName && (
                  <>
                    <span aria-hidden>•</span>
                    <span onClick={() => router.push(`/genres/${track.genre_id}`)} style={{ cursor: "pointer", color: "#fff" }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}>
                      {genreName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="track-actions">
            <button
              className="play-btn-hero"
              onClick={handlePlay}
              style={{
                width: 56, height: 56, borderRadius: "50%", border: "none",
                background: accentColor || "var(--brand)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                transition: "transform 0.15s", padding: 0,
                paddingLeft: isCurrentlyPlaying ? 0 : 3, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = loading ? "scale(1)" : "scale(1.06)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
              title={loading ? "Loading" : isCurrentlyPlaying ? "Pause" : "Play"}
            >
              {loading ? (
                <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
              ) : isCurrentlyPlaying ? (
                <PauseIcon size={24} color="#fff" />
              ) : (
                <PlayIconSolid size={24} color="#fff" />
              )}
            </button>
            <button
              className="icon-btn-hero"
              onClick={handleLike}
              disabled={likeLoading}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: liked ? "var(--like)" : "rgba(255,255,255,0.7)",
                transition: "all 0.2s", padding: 0, flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = liked ? "var(--like)" : "#fff"
                e.currentTarget.style.transform = "scale(1.05)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = liked ? "var(--like)" : "rgba(255,255,255,0.7)"
                e.currentTarget.style.transform = "scale(1)"
              }}
              title={liked ? "Unlike" : "Like"}
            >
              <HeartIconBig filled={liked} />
            </button>
            <button
              className="icon-btn-hero"
              onClick={handleShare}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none", background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                color: shareCopied ? "#fff" : "rgba(255,255,255,0.7)", transition: "all 0.2s",
                padding: 0, flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff"
                e.currentTarget.style.background = "rgba(255,255,255,0.1)"
                e.currentTarget.style.transform = "scale(1.05)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = shareCopied ? "#fff" : "rgba(255,255,255,0.7)"
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.transform = "scale(1)"
              }}
              title={shareCopied ? "Link copied" : "Share"}
            >
              {shareCopied ? <CheckIcon /> : <ShareIcon />}
            </button>
            <div className="track-hero-menu" style={{ color: "rgba(255,255,255,0.7)" }}>
              <PremiumTrackMenu track={playerTrack} liked={liked} onLikeToggle={setLiked} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="track-body">
        {track.description && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{
              fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              margin: "0 0 10px",
            }}>
              About
            </h3>
            <p style={{
              fontSize: 14, lineHeight: 1.7, color: "var(--foreground)",
              margin: 0, whiteSpace: "pre-wrap",
            }}>
              {track.description}
            </p>
          </div>
        )}

        {/* Artist */}
        {artistLoading && !artist ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton" style={{ width: "36%", height: 16 }} />
              <div className="skeleton" style={{ width: "22%", height: 12 }} />
            </div>
            <div className="skeleton" style={{ width: 96, height: 36, borderRadius: 20 }} />
          </div>
        ) : artist ? (
          <div className="track-artist-row" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              className="track-artist-avatar"
              onClick={() => router.push(`/artist/${artist.id}`)}
              style={{
                width: 72, height: 72, borderRadius: "50%", overflow: "hidden", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                background: `linear-gradient(135deg, ${accentColor || "var(--brand)"}, var(--brand-light))`,
                flexShrink: 0, transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
            >
              {artist.photo_url ? (
                <img src={artist.photo_url} alt={artist.stage_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                onClick={() => router.push(`/artist/${artist.id}`)}
                style={{
                  margin: "2px 0 0", fontSize: 18, fontWeight: 800, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
              >
                {artist.stage_name}
                {artist.verified && <VerifiedIcon />}
              </h3>
              <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
                {formatCount(artist.follower_count ?? 0)} followers
              </div>
            </div>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                padding: "8px 22px", borderRadius: 20,
                border: `1.5px solid ${following ? "var(--border)" : "transparent"}`,
                background: following ? "transparent" : "var(--brand)",
                color: following ? "var(--foreground)" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s", flexShrink: 0, outline: "none",
                opacity: followLoading ? 0.7 : 1,
              }}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        ) : null}

        {track.collaborators && track.collaborators.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)",
              letterSpacing: "0.06em", display: "block", marginBottom: 10,
            }}>
              Featured
            </span>
            {track.collaborators.map((c: any, i: number) => (
              <CollaboratorRow key={c.id || c.artist_id || i} collaborator={c} />
            ))}
          </div>
        )}

        {/* Popular tracks */}
        {popularLoading ? (
          <SectionSkeleton rows={4} />
        ) : popularTracks.length > 0 ? (
          <section style={{ marginBottom: 32 }} className="fade-in">
            <div style={{ marginBottom: 14 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Popular tracks by
              </span>
              <h2
                onClick={() => router.push(`/artist/${track.artist_id}`)}
                style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 0", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
              >
                {track.artist_name}
              </h2>
            </div>
            <TrackList tracks={popularTracks} accentColor={accentColor} />
          </section>
        ) : null}

        {/* Recommended */}
        {radioLoading ? (
          <SectionSkeleton rows={3} />
        ) : recommended.length > 0 ? (
          <section style={{ marginBottom: 32 }} className="fade-in">
            <div style={{ marginBottom: 14 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Based on this song
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 0" }}>Recommended</h2>
            </div>
            <TrackList tracks={recommended} accentColor={accentColor} />
          </section>
        ) : null}

        {/* Popular Releases */}
        {albumsLoading ? (
          <div style={{ marginBottom: 32 }}>
            <div className="skeleton" style={{ width: 180, height: 22, marginBottom: 16 }} />
            <div className="track-album-scroll">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="track-album-card">
                  <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 8, marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: "70%", height: 13, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: "40%", height: 11 }} />
                </div>
              ))}
            </div>
          </div>
        ) : albums.length > 0 ? (
          <section style={{ marginBottom: 32 }} className="fade-in">
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Popular Releases</h2>
            <div className="track-album-scroll">
              {albums.map((alb: any) => (
                <div
                  key={alb.id}
                  className="track-album-card"
                  onClick={() => router.push(`/album/${alb.id}`)}
                >
                  {alb.cover_url ? (
                    <img
                      src={alb.cover_url}
                      alt={alb.title}
                      className="track-album-art"
                    />
                  ) : (
                    <div className="track-album-art track-album-art-ph">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                  <h4 className="track-album-title">{alb.title}</h4>
                  <p className="track-album-year">
                    {alb.released_at ? new Date(alb.released_at).getFullYear() : "Album"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Collaborator tracks */}
        {track.collaborators && track.collaborators.map((c: any, i: number) => {
          const tracks = collabTracks[i]
          const loading = collabTracksQueries[i]?.isLoading
          if (loading) return <SectionSkeleton key={c.id || c.artist_id || i} rows={3} />
          if (!tracks || tracks.length === 0) return null
          return (
            <section key={c.id || c.artist_id || i} style={{ marginBottom: 32 }} className="fade-in">
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
                More from {c.stage_name}
              </h2>
              <TrackList tracks={tracks} accentColor={accentColor} />
            </section>
          )
        })}

        <LyricsSection title={track.title} artistName={track.artist_name} />
      </div>

      <style>{`
        .track-hero-artists a,
        .track-hero-artists span {
          color: inherit !important;
        }
        .track-hero-menu .track-menu-btn {
          color: rgba(255,255,255,0.75) !important;
          opacity: 1 !important;
        }
        .track-hero-menu .track-menu-btn:hover {
          color: #fff !important;
        }
        @media (max-width: 1023px) {
          .track-back-wrap { padding-left: 60px !important; }
        }
      `}</style>
    </div>
  )
}

function CollaboratorRow({ collaborator }: { collaborator: any }) {
  const router = useRouter()
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const c = collaborator
  const artistId = c.artist_id || c.id

  const { data: artistData } = useQuery({
    queryKey: ["artist", artistId],
    queryFn: () => api.getArtist(artistId),
    enabled: !!artistId,
  })

  useEffect(() => {
    const val = artistData?.is_followed
    if (val === true || val === false) setFollowing(val)
  }, [artistData?.is_followed])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
      <div
        style={{
          width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
          background: "var(--hover-bg)", cursor: "pointer", flexShrink: 0,
        }}
        onClick={() => router.push(`/artist/${artistId}`)}
      >
        {(c.photo_url || artistData?.photo_url) ? (
          <img
            src={c.photo_url || artistData?.photo_url}
            alt={c.stage_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--muted-foreground)",
          }}>
            {c.stage_name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", cursor: "pointer" }}
          onClick={() => router.push(`/artist/${artistId}`)}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
        >
          {c.stage_name}
        </span>
        {typeof artistData?.follower_count === "number" && (
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 1 }}>
            {formatCount(artistData.follower_count)} followers
          </div>
        )}
      </div>
      <button
        onClick={async () => {
          if (followLoading || !artistId) return
          setFollowLoading(true)
          try {
            if (following) {
              await api.unfollowArtist(artistId)
              setFollowing(false)
            } else {
              await api.followArtist(artistId)
              setFollowing(true)
            }
          } catch { /* ignore */ }
          setFollowLoading(false)
        }}
        disabled={followLoading}
        style={{
          padding: "6px 18px", borderRadius: 20,
          border: `1.5px solid ${following ? "var(--border)" : "transparent"}`,
          background: following ? "transparent" : "var(--brand)",
          color: following ? "var(--foreground)" : "#fff",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          transition: "all 0.2s", flexShrink: 0, outline: "none",
          opacity: followLoading ? 0.7 : 1,
        }}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  )
}

function VerifiedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#3d91ff" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  )
}

function HeartIconBig({ filled }: { filled: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function LyricsSection({ title, artistName }: { title: string; artistName?: string }) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <section style={{ marginBottom: 40 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", gap: 6, marginBottom: collapsed ? 0 : 16,
          width: "100%",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--foreground)" }}>Lyrics</h2>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {!collapsed && (
        <div style={{
          background: "var(--card-bg)", borderRadius: 14,
          padding: "clamp(28px, 4vw, 44px) clamp(16px, 4vw, 32px)",
          textAlign: "center", color: "var(--muted-foreground)",
          border: "1px solid var(--border)",
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ marginBottom: 14, opacity: 0.45 }}>
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "var(--foreground)" }}>
            Lyrics for &ldquo;{title}&rdquo;{artistName ? ` by ${artistName}` : ""}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>Lyrics will be available soon.</p>
        </div>
      )}
    </section>
  )
}
