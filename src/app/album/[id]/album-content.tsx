"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { ArtistLinks } from "@/components/artist-links"
import { EqBars } from "@/components/eq"
import { PremiumTrackMenu } from "@/components/track-menu"
import { SectionHeading } from "@/components/artist/ui"
import type { Album, Track } from "@/types"
import { useState, useEffect } from "react"
import { formatDuration } from "@/lib/utils"
import { toast } from "@/lib/toast-store"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function albumTypeLabel(type: string) {
  if (type === "single") return "Single"
  if (type === "ep") return "EP"
  return "Album"
}

export default function AlbumContent({
  id,
  initialAlbum,
  initialMoreAlbums,
}: {
  id: string
  initialAlbum?: any | null
  initialMoreAlbums?: any | null
}) {
  const router = useRouter()
  const { play, playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const playLoading = usePlayerStore((s) => s._loading)
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    const mqPhone = window.matchMedia("(max-width: 640px)")
    setIsPhone(mqPhone.matches)
    const phoneHandler = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    mqPhone.addEventListener("change", phoneHandler)
    return () => {
      mq.removeEventListener("change", handler)
      mqPhone.removeEventListener("change", phoneHandler)
    }
  }, [])

  const { data: album, isLoading, isError } = useQuery({
    queryKey: ["album", id],
    queryFn: () => api.getAlbum(id),
    enabled: !!id,
    ...(initialAlbum ? { initialData: initialAlbum, staleTime: 5 * 60 * 1000 } : {}),
  })

  const tracks: Track[] = album?.tracks ?? []
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_sec || 0), 0)

  const { data: moreAlbums } = useQuery({
    queryKey: ["artist-albums", album?.artist_id ?? initialAlbum?.artist_id],
    queryFn: () => api.getArtistAlbums(album!.artist_id),
    enabled: !!(album?.artist_id ?? initialAlbum?.artist_id),
    ...(initialMoreAlbums ? { initialData: initialMoreAlbums, staleTime: 5 * 60 * 1000 } : {}),
  })

  const otherAlbums = (moreAlbums?.albums ?? []).filter((a: any) => a.id !== id).slice(0, 6)

  const featuredArtists = (() => {
    const map = new Map<string, { artist_id: string; stage_name: string; photo_url?: string | null }>()
    for (const t of tracks) {
      if (t.collaborators) {
        for (const c of t.collaborators) {
          if (!map.has(c.artist_id)) {
            map.set(c.artist_id, { artist_id: c.artist_id, stage_name: c.stage_name, photo_url: c.photo_url })
          }
        }
      }
    }
    return Array.from(map.values())
  })()

  function handlePlayAll() {
    if (tracks.length === 0) return
    const albumTrackIds = new Set(tracks.map(t => t.id))
    if (currentTrack && albumTrackIds.has(currentTrack.id)) {
      togglePlay()
    } else {
      const queue = tracks.map(t => ({
        id: t.id,
        artist_id: t.artist_id,
        title: t.title,
        artist_name: t.artist_name ?? "",
        cover_url: t.cover_url,
        duration_sec: t.duration_sec,
        collaborators: t.collaborators,
      }))
      playQueue(queue, 0)
    }
  }

  function handlePlayTrack(track: Track, index: number) {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      const queue = tracks.map(t => ({
        id: t.id,
        artist_id: t.artist_id,
        title: t.title,
        artist_name: t.artist_name ?? "",
        cover_url: t.cover_url,
        duration_sec: t.duration_sec,
        collaborators: t.collaborators,
      }))
      playQueue(queue, index)
    }
  }

  const anyTrackPlaying = tracks.length > 0 && tracks.some(t => t.id === currentTrack?.id) && isPlaying
  const releaseYear = album?.released_at ? new Date(album.released_at).getFullYear() : null
  const heroMeta = [
    ...(releaseYear ? [String(releaseYear)] : []),
    `${tracks.length} song${tracks.length !== 1 ? "s" : ""}`,
    ...(totalDuration > 0 ? [formatDuration(totalDuration)] : []),
  ].join(" · ")

  if (isLoading) {
    const artSize = isPhone ? 160 : isMobile ? 180 : 260
    return (
      <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
        <div style={{ background: "linear-gradient(to bottom, var(--hover-bg) 0%, var(--content-bg) 100%)", padding: isPhone ? "48px 16px 16px" : isMobile ? "56px 28px 24px" : "64px 40px 40px" }}>
          <div style={{
            display: "flex",
            gap: isPhone ? 16 : isMobile ? 28 : 40,
            flexDirection: isPhone ? "column" : "row",
            alignItems: isPhone ? "center" : "flex-end",
            textAlign: isPhone ? "center" : "left",
            maxWidth: isPhone ? "100%" : 900,
            margin: isPhone ? 0 : "0 auto",
          }}>
            <div className="skeleton" style={{ width: artSize, height: artSize, borderRadius: 6, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: isPhone ? "center" : "flex-start", gap: 8, flex: 1 }}>
              <div className="skeleton" style={{ width: isPhone ? "30%" : 140, height: 14 }} />
              <div className="skeleton" style={{ width: isPhone ? "60%" : 280, height: 28 }} />
              <div className="skeleton" style={{ width: isPhone ? "40%" : 180, height: 14 }} />
              <div className="skeleton" style={{ width: isPhone ? "50%" : 220, height: 14, marginTop: 4 }} />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div className="skeleton" style={{ width: 110, height: 44, borderRadius: 999 }} />
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Track list skeleton (no column header — lists start straight into rows) */}
        <div style={{ padding: isPhone ? "16px 12px 48px" : isMobile ? "24px 20px 56px" : "32px 40px 64px" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "34px 1fr 52px 32px", alignItems: "center", padding: "7px 8px" }}>
              <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
              <div style={{ minWidth: 0 }}>
                <div className="skeleton" style={{ width: "55%", height: 14 }} />
              </div>
              <div className="skeleton" style={{ width: 30, height: 12, marginLeft: "auto" }} />
              <div />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, color: "var(--muted-foreground)", textAlign: "center", padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Failed to load album</p>
        <button onClick={() => router.refresh()} style={{ padding: "8px 20px", borderRadius: 20, border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--foreground)" }}>Try again</button>
      </div>
    )
  }

  if (!album) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, color: "var(--muted-foreground)" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Album not found</p>
        <button onClick={() => router.back()} style={{ padding: "8px 20px", borderRadius: 20, border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--foreground)" }}>Go back</button>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .alb-tl-row { grid-template-columns: minmax(0,1fr) 32px !important; padding: 8px 4px !important; }
          .alb-tl-num, .alb-tl-duration { display: none !important; }
        }
      `}</style>

      {/* ══ HERO ══ */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {album.cover_url && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${album.cover_url})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(60px) brightness(0.55) saturate(1.6)",
            transform: "scale(1.15)",
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: album.cover_url
            ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)"
            : "linear-gradient(135deg, var(--brand) 0%, #1d1d1f 100%)",
        }} />
        {/* bottom melt — fixed dark so white hero text stays legible in any theme */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1,
          height: isPhone ? 240 : 96,
          background: "linear-gradient(to bottom, transparent 0%, #0b0b10 100%)",
          opacity: isPhone ? 0.92 : 0.9,
        }} />

        {/* Hero content — on phones the details sit on top of the blurred art */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex",
          gap: isPhone ? 14 : isMobile ? 28 : 40,
          flexDirection: isPhone ? "column" : "row",
          alignItems: isPhone ? "flex-start" : "flex-end",
          textAlign: isPhone ? "left" : "left",
          justifyContent: isPhone ? "flex-start" : "flex-start",
          minHeight: undefined,
          padding: isPhone ? "72px 20px 14px" : isMobile ? "56px 28px 64px" : "64px 40px 72px",
          flexWrap: "wrap",
        }}>
          {/* Cover art — big, centered and sharp on phones (Spotify-style) */}
          <div style={{
            display: "block",
            alignSelf: isPhone ? "center" : undefined,
            width: isPhone ? "min(60vw, 260px)" : isMobile ? 180 : 260,
            height: isPhone ? "min(60vw, 260px)" : isMobile ? 180 : 260,
            borderRadius: isPhone ? 2 : 6,
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: isPhone ? "0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)" : "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
          }}>
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                fetchPriority="high"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M9 18V9l8-1.5v9" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="15" cy="16.5" r="2" />
                </svg>
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 200, width: isPhone ? "100%" : "auto" }}>
            {/* Type badge — desktop only */}
            {!isPhone && (
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.72)",
                letterSpacing: "-0.01em",
                marginBottom: 8,
                display: "block",
              }}>
                {albumTypeLabel(album.type)}
              </span>
            )}

            <h1 style={{
              fontSize: isPhone ? "clamp(24px, 7vw, 30px)" : isMobile ? "clamp(24px, 3.5vw, 36px)" : "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              fontFamily: "var(--font-display, inherit)",
              textTransform: isPhone ? "uppercase" : "none",
              color: "#fff",
              margin: "0 0 4px",
              lineHeight: 1.05,
              letterSpacing: isPhone ? "-0.01em" : "-0.02em",
              textShadow: "0 2px 16px rgba(0,0,0,0.4)",
              textWrap: "balance",
            }}>
              {album.title}
            </h1>

            {/* Artist — avatar row on phones, plain link otherwise */}
            {isPhone ? (
              <button
                type="button"
                onClick={() => router.push(`/artist/${album.artist_id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  margin: "6px 0 8px", fontFamily: "inherit", textAlign: "left",
                }}
                aria-label={`More by ${tracks[0]?.artist_name ?? "artist"}`}
              >
                <span aria-hidden style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,0.22)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>
                  {(tracks[0]?.artist_name ?? "A").charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: 17, fontWeight: 600, color: "#fff" }}>
                  {tracks[0]?.artist_name ?? "Artist"}
                </span>
              </button>
            ) : (
                <p style={{ fontSize: isMobile ? 13 : 16, fontWeight: 500, color: "rgba(255,255,255,0.82)", margin: "0 0 12px" }}>
                <Link
                  href={`/artist/${album.artist_id}`}
                  style={{ cursor: "pointer" }}
                >
                  {tracks[0]?.artist_name ?? "Artist"}
                </Link>
              </p>
            )}

            {/* Stats row — single meta line on phones */}
            {isPhone ? (
              heroMeta ? (
                <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
                  {heroMeta}
                </p>
              ) : null
            ) : (
              <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap", justifyContent: "flex-start" }}>
                <StatPill icon={<TrackIcon size={14} />} value={`${tracks.length} track${tracks.length !== 1 ? "s" : ""}`} compact={false} />
                {totalDuration > 0 && (
                  <StatPill icon={<ClockIcon size={14} />} value={formatDuration(totalDuration)} compact={false} />
                )}
                {album.released_at && (
                  <StatPill icon={<CalIcon size={14} />} value={formatDate(album.released_at)} compact={false} />
                )}
              </div>
            )}

            {/* Action buttons — Spotify-style split on phones: ghost share left, big round play right */}
            {isPhone ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 2 }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/album/${album.id}`); toast("Link copied", "success") }}
                  style={{
                    width: 46, height: 46, borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.85)",
                    flexShrink: 0,
                  }}
                  title="Share"
                  aria-label="Share album"
                >
                  <ShareIcon />
                </button>
                {tracks.length > 0 && (
                  <button
                    onClick={handlePlayAll}
                    disabled={!!playLoading}
                    aria-label={anyTrackPlaying ? "Pause" : "Play"}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      border: "none",
                      background: "var(--brand)",
                      color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: playLoading ? "default" : "pointer",
                      boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                      flexShrink: 0,
                    }}
                  >
                    {playLoading ? (
                      <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid currentColor", borderTopColor: "transparent", animation: "app-spin 0.6s linear infinite", display: "inline-block" }} />
                    ) : anyTrackPlaying ? (
                      <PauseBold size={26} color="#fff" />
                    ) : (
                      <span style={{ marginLeft: 4, display: "flex" }}><PlayBold size={26} color="#fff" /></span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-start" }}>
              {tracks.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  disabled={!!playLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: isPhone ? "8px 18px" : "12px 28px",
                    borderRadius: 999,
                    border: "1.5px solid #fff",
                    background: playLoading ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.95)",
                    color: "#1d1d1f",
                    fontSize: isPhone ? 13 : 15,
                    fontWeight: 700,
                    cursor: playLoading ? "default" : "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                    transition: "transform 0.12s ease, box-shadow 0.12s ease, background 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (!playLoading) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.3)" } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)" }}
                >
                  {playLoading ? (
                    <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "app-spin 0.6s linear infinite", display: "inline-block" }} />
                  ) : anyTrackPlaying ? (
                    <><PauseIconSolid size={16} /> Pause</>
                  ) : (
                    <><PlayIconSolid size={16} /> Play All</>
                  )}
                </button>
              )}

              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/album/${album.id}`); toast("Link copied", "success") }}
                style={{
                  width: isPhone ? 36 : 48, height: isPhone ? 36 : 48, borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.85)",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                title="Share"
              >
                <ShareIcon />
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ TRACK LIST ══ */}
      <div style={{ padding: isPhone ? "8px 12px 48px" : isMobile ? "24px 20px 56px" : "32px 40px 64px" }}>

        {/* Rows */}
        {tracks.map((track, index) => {
          const isActive = currentTrack?.id === track.id
          const isActiveAndPlaying = isActive && isPlaying
          const isHovered = hoveredTrackId === track.id

          return (
            <div
              key={track.id}
              className="alb-tl-row"
              onMouseEnter={() => setHoveredTrackId(track.id)}
              onMouseLeave={() => setHoveredTrackId(null)}
              onClick={() => handlePlayTrack(track, index)}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr 52px 32px",
                alignItems: "center",
                padding: "7px 8px",
                borderRadius: 6,
                borderTop: index === 0 ? "none" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                background: isHovered ? "var(--hover-bg)" : "transparent",
              }}
            >
              {/* Number + playing dot */}
              <div className="alb-tl-num" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: isActiveAndPlaying ? "var(--brand)" : "transparent" }} />
                <span style={{ color: isActive ? "var(--brand)" : undefined }}>
                  {index + 1}
                </span>
              </div>

              {/* Title (+ artist on multi-artist albums) */}
              <div style={{ minWidth: 0 }}>
                <p
                  style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display, inherit)", letterSpacing: "-0.01em", color: isActive ? "var(--brand)" : "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  <Link
                    href={`/track/${track.id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: "pointer" }}
                  >
                    {track.title}
                  </Link>{isActiveAndPlaying ? <span> <EqBars /></span> : null}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <ArtistLinks track={track} />
                </p>
              </div>

              {/* Duration */}
              <div className="alb-tl-duration" style={{ textAlign: "right", fontSize: 13, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {formatDuration(track.duration_sec)}
              </div>

              {/* Three-dots menu */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PremiumTrackMenu track={track} />
              </div>
            </div>
          )
        })}

        {/* Featured artists — aggregated from all tracks */}
        {featuredArtists.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionHeading title="Featured artists" />
            <div className="album-featured-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {featuredArtists.map((a) => (
                <div key={a.artist_id} onClick={() => router.push(`/artist/${a.artist_id}`)}
                  className="album-featured-card"
                  style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer" }}
                >
                  <div className="album-featured-avatar" style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 0 8px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.stage_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "var(--muted-foreground)" }}>
                        {a.stage_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, width: "100%", fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.stage_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More by this artist */}
        {otherAlbums.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionHeading title={`More by ${tracks[0]?.artist_name ?? "Artist"}`} />
            <div className="album-more-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {otherAlbums.map((alb: any) => (
                <div key={alb.id} onClick={() => router.push(`/album/${alb.id}`)}
                  className="album-more-card"
                  style={{ flexShrink: 0, width: 170, cursor: "pointer" }}
                >
                  <div style={{ marginBottom: 8 }}>
                    {alb.cover_url ? (
                      <img src={alb.cover_url} alt={alb.title}
                        className="album-more-art"
                        style={{ width: 170, height: 170, borderRadius: 4, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: "block" }}
                      />
                    ) : (
                      <div className="album-more-art" style={{ width: 170, height: 170, borderRadius: 4, background: "linear-gradient(135deg, #e8e8ec, #c8c8d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.2">
                          <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {alb.title}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>
                    {alb.type ? albumTypeLabel(alb.type) : ""}{alb.released_at ? ` · ${new Date(alb.released_at).getFullYear()}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: 24, padding: "0 16px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)" }}>
            {album.released_at && <>Released {formatDate(album.released_at)} &middot; </>}
            Updated {formatDate(album.updated_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── small components ─── */

function StatPill({ icon, value, compact }: { icon: React.ReactNode; value: string; compact?: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: compact ? 4 : 6,
      padding: compact ? "3px 8px" : "4px 10px", borderRadius: 20,
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(6px)",
      color: "rgba(255,255,255,0.88)",
      fontSize: compact ? 12 : 13,
    }}>
      {icon}
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/* ─── icons ─── */

function PlayIconSolid({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
}
function PauseIconSolid({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1.5" /><rect x="15" y="4" width="4" height="16" rx="1.5" /></svg>
}
function ShareIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
}
function TrackIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
}
function CalIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}
function ClockIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
}
