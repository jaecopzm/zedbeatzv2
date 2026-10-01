"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { TrackTable } from "@/components/track-table"
import type { RadioStationTrack } from "@/types"
import { useState, useEffect } from "react"
import { formatDuration } from "@/lib/utils"

function stationTypeLabel(type: string) {
  if (type === "genre") return "Genre Station"
  if (type === "curated") return "Curated Station"
  if (type === "playlist") return "Radio Playlist"
  if (type === "personalized") return "Personalized"
  return "Station"
}

function PlayIconSolid({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
}
function PauseIconSolid({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1.5" /><rect x="15" y="4" width="4" height="16" rx="1.5" /></svg>
}
function ShareIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
}
function TrackIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
}

function StatPill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
      {icon}
      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>{value}</span>
    </div>
  )
}

export default function StationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { play, playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()
  const [isMobile, setIsMobile] = useState(false)
  const [isPhone, setIsPhone] = useState(false)
  const [playLoading, setPlayLoading] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    setIsPhone(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const isPersonalized = id === "personalized"

  const { data, isLoading } = useQuery({
    queryKey: isPersonalized ? ["radio-personalized"] : ["radio-station", id],
    queryFn: () => isPersonalized ? api.getPersonalizedRadio() : api.getRadioStation(id),
    enabled: !!id,
  })

  const station = data?.station
  const tracks: RadioStationTrack[] = data?.tracks ?? []
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_sec || 0), 0)

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

  useEffect(() => { setPlayLoading(false) }, [currentTrack])

  function handlePlayAll() {
    if (tracks.length === 0 || playLoading) return
    const trackIds = new Set(tracks.map(t => t.id))
    if (currentTrack && trackIds.has(currentTrack.id)) {
      togglePlay()
    } else {
      setPlayLoading(true)
      playQueue(tracks as any, 0)
    }
  }

  const anyTrackPlaying = tracks.length > 0 && tracks.some(t => t.id === currentTrack?.id) && isPlaying

  if (isLoading) {
    const artSize = isMobile ? 150 : 260
    return (
      <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
        <div style={{ background: "linear-gradient(to bottom, var(--hover-bg) 0%, var(--content-bg) 100%)", padding: isMobile ? "52px 16px 16px" : "64px 40px 40px" }}>
          <div style={{ display: "flex", gap: isMobile ? 16 : 40, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-end", textAlign: isMobile ? "center" : "left", maxWidth: isMobile ? "100%" : 900, margin: isMobile ? 0 : "0 auto" }}>
            <div className="skeleton" style={{ width: artSize, height: artSize, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8, flex: 1 }}>
              <div className="skeleton" style={{ width: isMobile ? "30%" : 140, height: 14 }} />
              <div className="skeleton" style={{ width: isMobile ? "60%" : 280, height: 28 }} />
              <div className="skeleton" style={{ width: isMobile ? "40%" : 180, height: 14 }} />
              <div className="skeleton" style={{ width: isMobile ? "50%" : 220, height: 14, marginTop: 4 }} />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div className="skeleton" style={{ width: 110, height: 44, borderRadius: 22 }} />
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 22 }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "16px 12px 48px" : "32px 40px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px 60px 40px", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
            <span>#</span><span>Title</span><span style={{ textAlign: "right" }}>Plays</span>
            <span style={{ textAlign: "right" }}><ClockIcon /></span><span />
          </div>
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

  if (!station) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, color: "var(--muted-foreground)" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5zm7 0l-5-5 5-5z" /></svg>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Station not found</p>
        <button onClick={() => router.back()} style={{ padding: "8px 20px", borderRadius: 20, border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--foreground)" }}>Go back</button>
      </div>
    )
  }

  const coverUrl = station.cover_url || (tracks.length > 0 ? tracks[0].cover_url : null) || null

  return (
    <div className="fade-in" style={{ minHeight: "100%", background: "var(--content-bg)" }}>

      {/* ══ HERO ══ */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {coverUrl && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(60px) brightness(0.55) saturate(1.6)",
            transform: "scale(1.15)",
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: coverUrl
            ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)"
            : "linear-gradient(135deg, var(--brand) 0%, #1d1d1f 100%)",
        }} />
        {/* bottom melt — fixed dark so white hero text stays legible in any theme */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 1,
          height: 96,
          background: "linear-gradient(to bottom, transparent 0%, #0b0b10 100%)",
          opacity: 0.9,
        }} />

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex",
          gap: isMobile ? 16 : 40,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isPhone ? "stretch" : isMobile ? "center" : "flex-end",
          textAlign: isPhone ? "left" : isMobile ? "center" : "left",
          padding: isPhone ? "72px 20px 22px" : isMobile ? "52px 16px 16px" : "64px 40px 40px",
          flexWrap: "wrap",
        }}>
          {/* Cover art */}
          <div style={{
            width: isPhone ? "min(60vw, 260px)" : isMobile ? 150 : 260,
            height: isPhone ? "min(60vw, 260px)" : isMobile ? 150 : 260,
            borderRadius: isPhone ? 2 : 8,
            flexShrink: 0,
            alignSelf: isPhone ? "center" : undefined,
            overflow: "hidden",
            boxShadow: isPhone ? "0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)" : isMobile ? "0 8px 32px rgba(0,0,0,0.4)" : "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
          }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={station.name}
                fetchPriority="high"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5zm7 0l-5-5 5-5z" />
                </svg>
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 0, width: isMobile ? "100%" : "auto" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 11, fontWeight: 800, letterSpacing: "0.16em",
              color: "#fff", background: "rgba(255,45,85,0.9)",
              padding: "5px 12px 5px 10px", borderRadius: 999, marginBottom: 10,
              boxShadow: "0 4px 16px rgba(255,45,85,0.45)",
            }}>
              <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", opacity: 0.7, animation: "eq-bar 1.2s ease-in-out infinite" }} />
                <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
              </span>
              ON AIR
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.02em",
              marginBottom: 8,
              display: "block",
            }}>
              {stationTypeLabel(station.type)}
            </span>

            <h1 style={{
              fontSize: isPhone ? "clamp(26px, 8vw, 34px)" : isMobile ? 22 : "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              fontFamily: "var(--font-display, inherit)",
              textTransform: isPhone ? "uppercase" : "none",
              color: "#fff",
              margin: "0 0 4px",
              lineHeight: 1.1,
              letterSpacing: isPhone ? "-0.01em" : "-0.5px",
              textShadow: "0 2px 16px rgba(0,0,0,0.4)",
            }}>
              {station.name}
            </h1>

            {station.description && (
              <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 500, color: "rgba(255,255,255,0.82)", margin: "0 0 12px" }}>
                {station.description}
              </p>
            )}

            {/* Stats row — single meta line on phones */}
            {isPhone ? (
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
                {tracks.length} track{tracks.length !== 1 ? "s" : ""}{totalDuration > 0 ? ` · ${formatDuration(totalDuration)}` : ""}
              </p>
            ) : (
              <div style={{ display: "flex", gap: isMobile ? 12 : 20, marginBottom: isMobile ? 16 : 24, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                <StatPill icon={<TrackIcon />} value={`${tracks.length} track${tracks.length !== 1 ? "s" : ""}`} />
                {totalDuration > 0 && (
                  <StatPill icon={<ClockIcon />} value={formatDuration(totalDuration)} />
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: isPhone ? "space-between" : isMobile ? "center" : "flex-start", width: isPhone ? "100%" : undefined }}>
              {!isPhone && tracks.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: isMobile ? "10px 22px" : "12px 28px",
                    borderRadius: 24,
                    border: "none",
                    background: "rgba(255,255,255,0.95)",
                    color: "#1d1d1f",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                    transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)" }}
                >
                  {playLoading ? (
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                  ) : anyTrackPlaying ? (
                    <><PauseIconSolid size={16} /> Pause</>
                  ) : (
                    <><PlayIconSolid size={16} /> Play All</>
                  )}
                </button>
              )}

              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/radio/${id}`) }}
                style={{
                  width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.4)",
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
              {isPhone && tracks.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  aria-label={anyTrackPlaying ? "Pause" : "Play"}
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    border: "none", background: "var(--brand)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                    flexShrink: 0,
                  }}
                >
                  {playLoading ? (
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                  ) : anyTrackPlaying ? (
                    <PauseIconSolid size={24} />
                  ) : (
                    <PlayIconSolid size={24} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TRACK LIST ══ */}
      <div style={{ padding: isMobile ? "16px 12px 48px" : "32px 40px 64px" }}>

        {/* Rows */}
        {tracks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
            <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>No tracks</p>
            <p style={{ fontSize: 14, margin: 0 }}>This station doesn't have any tracks yet.</p>
          </div>
        ) : (
          <TrackTable tracks={tracks} />
        )}

        {/* Featured artists */}
        {featuredArtists.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: "0 0 14px" }}>
              Featured Artists
            </h3>
            <div className="radio-featured-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {featuredArtists.map((a) => (
                <div key={a.artist_id} onClick={() => router.push(`/artist/${a.artist_id}`)}
                  className="radio-featured-card"
                  style={{ flexShrink: 0, width: 100, textAlign: "center", cursor: "pointer" }}
                >
                  <div className="radio-featured-avatar" style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto 8px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.stage_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "var(--muted-foreground)" }}>
                        {a.stage_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.stage_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
