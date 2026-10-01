"use client"

import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { useLikesStore } from "@/lib/likes-store"
import { DetailHero } from "@/components/detail-hero"
import { ArtistLinks } from "@/components/artist-links"
import { TrackList } from "@/components/track-list"
import { PremiumTrackMenu } from "@/components/track-menu"
import { CoverImage } from "@/components/cover-image"
import { highlightEntities } from "@/lib/highlight"
import { SectionHeading } from "@/components/artist/ui"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"
import { toast } from "@/lib/toast-store"
import { CheckCircleIcon as BadgeBold } from "@solar-icons/react/bold/check-circle"
import { HeartIcon as HeartLinear } from "@solar-icons/react/linear/heart"
import { HeartIcon as HeartBold } from "@solar-icons/react/bold/heart"
import { ShareIcon as ShareLinear } from "@solar-icons/react/linear/share"
import { CheckIcon as CheckLinear } from "@solar-icons/react/linear/check"

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

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
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 8 }} />
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
  const [downloading, setDownloading] = useState(false)
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    setIsPhone(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: track, isLoading, isError } = useQuery({
    queryKey: ["track", id],
    queryFn: () => api.getTrack(id),
    enabled: !!id,
  })

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

  const highlightTerms = useMemo(
    () => [
      track?.title,
      track?.artist_name,
      (album as any)?.title ?? (track as any)?.album_name,
      ...((track?.collaborators ?? []) as any[]).map((c) => c.stage_name ?? c.name),
      genreName,
    ],
    [track?.title, track?.artist_name, track?.collaborators, (track as any)?.album_name, (album as any)?.title, genreName]
  )

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

  async function handleDownload() {
    if (!track || downloading) return
    setDownloading(true)
    try {
      const { url } = await api.getDownloadURL(track.id)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      const a = document.createElement("a")
      a.href = url
      const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 80) || "track"
      a.download = `${safe(track.artist_name ?? "Unknown Artist")} - ${safe(track.title)}.mp3`
      if (isIOS) a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast("Download started", "success")
    } catch {
      toast("Download failed. Please try again.", "error")
    } finally {
      setDownloading(false)
    }
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
      {isPhone ? (
        <DetailHero
          art={track.cover_url}
          artAlt={track.title}
          title={track.title}
          artistName={track.artist_name ?? "Unknown Artist"}
          artistId={track.artist_id}
          artistPhoto={artist?.photo_url ?? null}
          meta={[
            track.title,
            track.released_at ? new Date(track.released_at).getFullYear() : null,
            track.duration_sec ? formatDuration(track.duration_sec) : null,
          ].filter((v) => v != null).join(" · ")}
          playing={isCurrentlyPlaying}
          loading={loading}
          onPlay={handlePlay}
          actionsLeft={<>
            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading}
              aria-label={liked ? "Unlike" : "Like"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", color: liked ? "var(--like)" : "rgba(255,255,255,0.85)" }}
            >
              {liked ? (
                <HeartBold size={24} color="var(--like)" />
              ) : (
                <HeartLinear size={24} color="currentColor" strokeWidth={1.8} />
              )}
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", color: "rgba(255,255,255,0.85)" }}
            >
              {shareCopied ? (
                <CheckLinear size={22} color="currentColor" strokeWidth={2.4} />
              ) : (
                <ShareLinear size={22} color="currentColor" strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              aria-label="Download track"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", color: "rgba(255,255,255,0.85)" }}
            >
              {downloading ? (
                <svg className="spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              )}
            </button>
            <span style={{ color: "rgba(255,255,255,0.7)", display: "flex" }}>
              <PremiumTrackMenu track={playerTrack} liked={liked} onLikeToggle={setLiked} />
            </span>
          </>}
        />
      ) : (
      <>
      {/* Hero */}
      <div style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 45%, #0b0b10 100%)",
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
            <div className="track-hero-art" style={{ position: "relative" }}>
                {track.cover_url ? (
                  <CoverImage src={track.cover_url} alt={track.title} sizes="(max-width: 768px) 40vw, 300px" priority />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
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
                fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em",
                color: "rgba(255,255,255,0.72)", marginBottom: 6, display: "block",
              }}>
                {album ? "Song" : "Single"}
              </span>
              <h1 className="track-hero-title" style={{
                fontFamily: "var(--font-display, Inter, sans-serif)",
                fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 700, color: "#fff",
                margin: "0 0 16px", lineHeight: 1.02, letterSpacing: "-0.02em",
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
              </div>
            </div>
          </div>

          <div className="track-actions">
            <button
              className="play-btn-hero"
              onClick={handlePlay}
              style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "1.5px solid #fff",
                background: "#fff", color: "#1d1d1f",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                transition: "transform 0.15s", padding: 0, flexShrink: 0,
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
                <PauseBold size={24} color="#1d1d1f" />
              ) : (
                <span style={{ marginLeft: "2px", display: "flex" }}><PlayBold size={24} color="#1d1d1f" /></span>
              )}
            </button>
            <button
              className="icon-btn-hero"
              onClick={handleLike}
              disabled={likeLoading}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: liked ? "1.5px solid var(--like)" : "1.5px solid rgba(255,255,255,0.55)",
                background: liked ? "color-mix(in srgb, var(--like) 15%, transparent)" : "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: liked ? "var(--like)" : "rgba(255,255,255,0.85)",
                transition: "all 0.2s", padding: 0, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
              title={liked ? "Unlike" : "Like"}
            >
              <span key={liked ? "liked" : "plain"} className={liked ? "like-burst" : undefined} style={{ display: "flex" }}>
                {liked ? (
                  <HeartBold size={20} color="var(--like)" />
                ) : (
                  <HeartLinear size={20} color="currentColor" strokeWidth={2} />
                )}
              </span>
            </button>
            <button
              className="icon-btn-hero"
              onClick={handleShare}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                color: "#fff", transition: "transform 0.15s",
                padding: 0, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
              title={shareCopied ? "Link copied" : "Share"}
            >
              {shareCopied ? <CheckLinear size={18} color="currentColor" strokeWidth={2.4} /> : <ShareLinear size={18} color="currentColor" strokeWidth={2} />}
            </button>
            <button
              className="icon-btn-hero"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: downloading ? "default" : "pointer",
                color: "#fff", transition: "transform 0.15s",
                padding: 0, flexShrink: 0, opacity: downloading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
              title="Download"
              aria-label="Download track"
            >
              {downloading ? (
                <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              )}
            </button>
            <div className="track-hero-menu" style={{ color: "rgba(255,255,255,0.7)" }}>
              <PremiumTrackMenu track={playerTrack} liked={liked} onLikeToggle={setLiked} />
            </div>
          </div>
        </div>
      </div>
      </>)}

      {/* Body */}
      <div className="track-body">
        {track.description && (
          <section style={{ marginBottom: 28 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
              About this track
            </p>
            <p
              className={`track-about-text${aboutExpanded ? "" : " clamped"}`}
              style={{
                fontSize: 14, lineHeight: 1.65, color: "var(--foreground)",
                margin: 0, whiteSpace: "pre-wrap", maxWidth: 680, letterSpacing: "-0.005em",
              }}
            >
              {highlightEntities(track.description, highlightTerms)}
            </p>
            {track.description.length > 180 && (
              <button
                onClick={() => setAboutExpanded((v) => !v)}
                className="track-about-toggle"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontSize: 13, fontWeight: 700, color: "var(--brand)" }}
              >
                {aboutExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </section>
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
                background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
                flexShrink: 0, transition: "transform 0.15s", position: "relative",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
            >
              {artist.photo_url ? (
                <CoverImage src={artist.photo_url} alt={artist.stage_name} sizes="120px" />
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
                {artist.verified && <BadgeBold size={16} color="var(--brand)" secondaryColor="#fff" secondaryOpacity={1} />}
              </h3>
              <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
                {formatCount(artist.follower_count ?? 0)} followers
              </div>
            </div>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                padding: "8px 22px", borderRadius: 999,
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
              fontSize: 13, fontWeight: 700, color: "var(--foreground)",
              letterSpacing: "-0.01em", display: "block", marginBottom: 10,
            }}>
              Featuring
            </span>
            {track.collaborators.map((c: any, i: number) => (
              <CollaboratorRow key={c.id || c.artist_id || i} collaborator={c} />
            ))}
          </div>
        )}

        {/* Credits (Tidal-style) */}
        <section style={{ marginBottom: 32 }}>
          <div style={{
            background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "20px 22px",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
              Credits
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "4px 24px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Performed by</span>
                <button onClick={() => router.push(`/artist/${track.artist_id}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)", textAlign: "right" }}>
                  {track.artist_name}
                </button>
              </div>
              {track.collaborators && track.collaborators.map((c: any) => (
                <div key={c.artist_id || c.stage_name} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "capitalize" }}>{c.role || "Featuring"}</span>
                  <button onClick={() => c.artist_id && router.push(`/artist/${c.artist_id}`)} style={{ background: "none", border: "none", cursor: c.artist_id ? "pointer" : "default", padding: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)", textAlign: "right" }}>
                    {c.stage_name}
                  </button>
                </div>
              ))}
              {track.released_at && (
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Released</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                    {new Date(track.released_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
              {track.genre_id && genreName && (
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Genre</span>
                  <button onClick={() => router.push(`/genres/${track.genre_id}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                    {genreName}
                  </button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Length</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{formatDuration(track.duration_sec)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0 2px" }}>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Plays</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{formatCount(track.play_count)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Popular tracks */}
        {popularLoading ? (
          <SectionSkeleton rows={4} />
        ) : popularTracks.length > 0 ? (
          <section style={{ marginBottom: 32 }} className="fade-in">
            <SectionHeading
              title="Popular tracks"
              description={`More from ${track.artist_name}`}
              action={(
                <button
                  onClick={() => router.push(`/artist/${track.artist_id}`)}
                  style={{
                    padding: "7px 14px", borderRadius: 999,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--foreground)", fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  See artist
                </button>
              )}
            />
            <TrackList tracks={popularTracks} showHeader={false} showRank={false} />
          </section>
        ) : null}

        {/* Recommended */}
        {radioLoading ? (
          <SectionSkeleton rows={3} />
        ) : recommended.length > 0 ? (
          <section style={{ marginBottom: 32 }} className="fade-in">
            <SectionHeading title="Recommended" description="Based on this song" />
            <TrackList tracks={recommended} showHeader={false} showRank={false} />
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
            <SectionHeading title="Popular releases" />
            <div className="track-album-scroll">
                {albums.map((alb: any) => (
                  <div
                    key={alb.id}
                    className="track-album-card"
                    onClick={() => router.push(`/album/${alb.id}`)}
                  >
                    <div className="track-album-art" style={{ position: "relative", overflow: "hidden" }}>
                      {alb.cover_url ? (
                        <CoverImage src={alb.cover_url} alt={alb.title} sizes="220px" />
                      ) : (
                        <div className="track-album-art-ph">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
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
              <SectionHeading title={`More from ${c.stage_name}`} />
              <TrackList tracks={tracks} showHeader={false} showRank={false} />
            </section>
          )
        })}

        <CommentsSection trackId={track.id} />
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

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function CommentsSection({ trackId }: { trackId: string }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)
  // Auth state is restored from localStorage, so it differs from the server
  // prerender — gate the comment form until after hydration.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["comments", trackId],
    queryFn: () => api.getComments(trackId, 20),
  })
  const comments: any[] = data?.comments ?? []

  const post = async () => {
    const text = body.trim()
    if (!text || posting || !user) return
    setPosting(true)
    try {
      await api.addComment(trackId, text)
      setBody("")
      queryClient.invalidateQueries({ queryKey: ["comments", trackId] })
    } catch {}
    setPosting(false)
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeading
        title={`Comments${comments.length > 0 ? ` (${comments.length})` : ""}`}
        description="Join the conversation"
      />

      {mounted && user ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {(user.email?.charAt(0) || "?").toUpperCase()}
          </div>
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") post() }}
              placeholder="Share your thoughts on this track…"
              maxLength={500}
              style={{
                flex: 1, minWidth: 0, padding: "10px 16px", borderRadius: 999,
                border: "1px solid var(--border)", background: "var(--card-bg)",
                color: "var(--foreground)", fontSize: 14, outline: "none",
              }}
            />
            <button
              onClick={post}
              disabled={!body.trim() || posting}
              style={{
                padding: "10px 22px", borderRadius: 999, border: "none",
                background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: body.trim() && !posting ? "pointer" : "default",
                opacity: body.trim() && !posting ? 1 : 0.5, flexShrink: 0,
              }}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push("/login")}
          style={{
            width: "100%", padding: "14px", borderRadius: 10, marginBottom: 18,
            border: "1px dashed var(--border)", background: "transparent",
            color: "var(--muted-foreground)", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Sign in to join the conversation
        </button>
      )}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "30%", height: 12, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "85%", height: 13 }} />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
          No comments yet — be the first to say something.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((c: any) => (
            <div key={c.id} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {String(c.user_name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)" }}>
                  <span style={{ fontWeight: 700, color: "var(--foreground)" }}>{c.user_name || "Listener"}</span>
                  {" · "}{c.created_at ? timeAgo(c.created_at) : ""}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--foreground)", overflowWrap: "anywhere" }}>
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: collapsed ? 0 : 8,
          width: "100%",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--foreground)" }}>Lyrics</h2>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 0.2s" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        {collapsed && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "var(--hover-bg)", color: "var(--muted-foreground)" }}>
            Coming soon
          </span>
        )}
      </button>

      {!collapsed && (
        <div style={{ padding: "28px 8px 32px", textAlign: "center", color: "var(--muted-foreground)" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ marginBottom: 14, opacity: 0.45 }}>
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "var(--foreground)" }}>
            Lyrics for &ldquo;{title}&rdquo;{artistName ? ` by ${artistName}` : ""}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>Lyrics aren&apos;t available for this track yet.</p>
        </div>
      )}
    </section>
  )
}
