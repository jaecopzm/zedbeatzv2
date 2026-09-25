"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { ArtistLinks } from "@/components/artist-links"
import { PremiumTrackMenu } from "@/components/track-menu"
import { SectionHeading } from "@/components/artist/ui"
import type { Album, Track } from "@/types"
import { useState, useEffect } from "react"

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

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function albumTypeLabel(type: string) {
  if (type === "single") return "Single"
  if (type === "ep") return "EP"
  return "Album"
}

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { play, playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: album, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: () => api.getAlbum(id),
    enabled: !!id,
  })

  const tracks: Track[] = album?.tracks ?? []
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_sec || 0), 0)

  const { data: moreAlbums } = useQuery({
    queryKey: ["artist-albums", album?.artist_id],
    queryFn: () => api.getArtistAlbums(album!.artist_id),
    enabled: !!album?.artist_id,
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

  if (isLoading) {
    const artSize = isMobile ? 150 : 260
    return (
      <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
        <div style={{ background: "linear-gradient(to bottom, var(--hover-bg) 0%, var(--content-bg) 100%)", padding: isMobile ? "52px 16px 16px" : "64px 40px 40px" }}>
          <div style={{
            display: "flex",
            gap: isMobile ? 16 : 40,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-end",
            textAlign: isMobile ? "center" : "left",
            maxWidth: isMobile ? "100%" : 900,
            margin: isMobile ? 0 : "0 auto",
          }}>
            <div className="skeleton" style={{ width: artSize, height: artSize, borderRadius: 6, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8, flex: 1 }}>
              <div className="skeleton" style={{ width: isMobile ? "30%" : 140, height: 14 }} />
              <div className="skeleton" style={{ width: isMobile ? "60%" : 280, height: 28 }} />
              <div className="skeleton" style={{ width: isMobile ? "40%" : 180, height: 14 }} />
              <div className="skeleton" style={{ width: isMobile ? "50%" : 220, height: 14, marginTop: 4 }} />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div className="skeleton" style={{ width: 110, height: 44, borderRadius: 999 }} />
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Track list skeleton (no column header — lists start straight into rows) */}
        <div style={{ padding: isMobile ? "16px 12px 48px" : "32px 40px 64px" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px 60px 40px", alignItems: "center", padding: "10px 16px" }}>
              <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="skeleton" style={{ width: "55%", height: 14, marginBottom: 4 }} />
                  <div className="skeleton" style={{ width: "35%", height: 11 }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: 36, height: 12, marginLeft: "auto" }} />
              <div className="skeleton" style={{ width: 30, height: 12, marginLeft: "auto" }} />
              <div />
            </div>
          ))}
        </div>
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
        {/* bottom melt into page background */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1,
          height: isMobile ? 72 : 96,
          background: "linear-gradient(to bottom, transparent 0%, var(--content-bg) 100%)",
          opacity: 0.9,
        }} />

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex",
          gap: isMobile ? 12 : 40,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-end",
          textAlign: isMobile ? "center" : "left",
          padding: isMobile ? "52px 14px 56px" : "64px 40px 72px",
          flexWrap: "wrap",
        }}>
          {/* Cover art */}
          <div style={{
            width: isMobile ? 120 : 260,
            height: isMobile ? 120 : 260,
            borderRadius: 6,
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: isMobile ? "0 8px 32px rgba(0,0,0,0.4)" : "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
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
          <div style={{ flex: 1, minWidth: 0, width: isMobile ? "100%" : "auto" }}>
            {/* Type badge */}
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

            <h1 style={{
              fontSize: isMobile ? "clamp(18px, 5vw, 22px)" : "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 4px",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 16px rgba(0,0,0,0.4)",
            }}>
              {album.title}
            </h1>

            {/* Artist — clickable */}
            <p style={{ fontSize: isMobile ? 13 : 16, fontWeight: 500, color: "rgba(255,255,255,0.82)", margin: "0 0 12px" }}>
              <span
                onClick={() => router.push(`/artist/${album.artist_id}`)}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {tracks[0]?.artist_name ?? "Artist"}
              </span>
            </p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: isMobile ? 8 : 20, marginBottom: isMobile ? 12 : 24, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
              <StatPill icon={<TrackIcon size={isMobile ? 12 : 14} />} value={`${tracks.length} track${tracks.length !== 1 ? "s" : ""}`} compact={isMobile} />
              {totalDuration > 0 && (
                <StatPill icon={<ClockIcon size={isMobile ? 12 : 14} />} value={formatDuration(totalDuration)} compact={isMobile} />
              )}
              {album.released_at && (
                <StatPill icon={<CalIcon size={isMobile ? 12 : 14} />} value={formatDate(album.released_at)} compact={isMobile} />
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start" }}>
              {tracks.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: isMobile ? "8px 18px" : "12px 28px",
                    borderRadius: 999,
                    border: "1.5px solid #fff",
                    background: "rgba(255,255,255,0.95)",
                    color: "#1d1d1f",
                    fontSize: isMobile ? 13 : 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                    transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)" }}
                >
                  {anyTrackPlaying
                    ? <><PauseIconSolid size={16} /> Pause</>
                    : <><PlayIconSolid size={16} /> Play All</>
                  }
                </button>
              )}

              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/album/${album.id}`) }}
                style={{
                  width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, borderRadius: "50%",
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
          </div>
        </div>
      </div>

      {/* ══ TRACK LIST ══ */}
      <div style={{ padding: isMobile ? "16px 12px 48px" : "32px 40px 64px" }}>

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
                gridTemplateColumns: "40px 1fr 100px 60px 40px",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                background: isActive ? "var(--brand-bg)" : isHovered ? "var(--hover-bg)" : "transparent",
              }}
            >
              {/* Index / play icon */}
              <div style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600 }}>
                {isHovered ? (
                  <button
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: isActive ? "var(--brand)" : "var(--foreground)", display: "flex", alignItems: "center" }}
                    onClick={(e) => { e.stopPropagation(); handlePlayTrack(track, index) }}
                  >
                    {isActiveAndPlaying ? <PauseIconSolid size={16} /> : <PlayIconSolid size={16} />}
                  </button>
                ) : (
                  isActive && isActiveAndPlaying ? (
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 12, width: 12 }}>
                      <div className="eq-bar" style={{ width: 2, height: "100%", background: "var(--brand)" }} />
                      <div className="eq-bar" style={{ width: 2, height: "100%", background: "var(--brand)" }} />
                      <div className="eq-bar" style={{ width: 2, height: "100%", background: "var(--brand)" }} />
                    </div>
                  ) : (
                    <span style={{ color: isActive ? "var(--brand)" : "var(--muted-foreground)" }}>
                      {index + 1}
                    </span>
                  )
                )}
              </div>

              {/* Cover + title + artist */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {track.cover_url ? (
                  <img src={track.cover_url} alt="" className="alb-tl-thumb" style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                ) : (
                  <div className="alb-tl-thumb" style={{ width: 40, height: 40, borderRadius: 4, background: "var(--hover-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.8"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p
                    onClick={(e) => { e.stopPropagation(); router.push(`/track/${track.id}`) }}
                    style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isActive ? "var(--brand)" : "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {track.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <ArtistLinks track={track} />
                  </p>
                </div>
              </div>

              {/* Play count */}
              <div className="alb-tl-plays" style={{ textAlign: "right", fontSize: 13, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {formatCount(track.play_count)}
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
