"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { usePlayerStore, type TrackInfo } from "@/lib/store"
import { useUIStore } from "@/lib/ui-store"
import { useLikesStore } from "@/lib/likes-store"
import { useColorExtract } from "@/lib/use-color-extract"
import { EqBars } from "@/components/eq"
import { ShuffleIcon as ShuffleLinear } from "@solar-icons/react/linear/shuffle"
import { RepeatIcon as RepeatLinear } from "@solar-icons/react/linear/repeat"
import { SkipPreviousIcon as PrevBold } from "@solar-icons/react/bold/skip-previous"
import { SkipNextIcon as NextBold } from "@solar-icons/react/bold/skip-next"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"
import { HeartIcon as HeartLinear } from "@solar-icons/react/linear/heart"
import { HeartIcon as HeartBold } from "@solar-icons/react/bold/heart"
import { ArrowLeftIcon as BackLinear } from "@solar-icons/react/linear/arrow-left"
import { PremiumTrackMenu } from "@/components/track-menu"

function fmt(sec: number) {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function formatArtist(t: TrackInfo) {
  const name = t.artist_name
  const collabs = t.collaborators
  if (!collabs || collabs.length === 0) return name
  return name + ", " + collabs.map((c) => c.stage_name).join(", ")
}

function NpBtn({ children, onClick, title, subtle, active, style }: { children: React.ReactNode; onClick?: () => void; title?: string; subtle?: boolean; active?: boolean; style?: React.CSSProperties }) {
  const baseColor = active ? "var(--brand)" : subtle ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)"
  return (
    <button onClick={onClick} title={title} style={{ background: "none", border: "none", cursor: "pointer", color: baseColor, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", transition: "color 0.12s", lineHeight: 0, ...style }}>
      {children}
    </button>
  )
}

export function NowPlayingScreen() {
  const {
    currentTrack, isPlaying, progress, volume, togglePlay, next, prev, seek, setVolume,
    shuffle, toggleShuffle, repeatMode, toggleRepeat,
  } = usePlayerStore()
  const { nowPlayingOpen, closeNowPlaying } = useUIStore()
  const { isLiked, toggleLike } = useLikesStore()
  const palette = useColorExtract(currentTrack?.cover_url)
  const [tab, setTab] = useState<"now" | "queue" | "details">("now")
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)
  const playTrack = usePlayerStore((s) => s.play)

  const overlayRef = useRef<HTMLDivElement>(null)
  const scrubberRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const track = currentTrack
  const duration = track?.duration_sec || 1
  const progressPct = Math.min((progress / duration) * 100, 100)
  const liked = track ? isLiked(track.id) : false

  const accentRgb = `${palette.r}, ${palette.g}, ${palette.b}`
  const accentColor = palette.vibrant
  const accentAlpha = (a: number) => `rgba(${accentRgb}, ${a})`

  const swipeStartY = useRef(0)

  useEffect(() => {
    if (!nowPlayingOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNowPlaying()
      if (e.key === " " || e.code === "Space") { e.preventDefault(); togglePlay() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [nowPlayingOpen, closeNowPlaying, togglePlay])

  useEffect(() => {
    if (nowPlayingOpen) {
      document.body.style.overflow = "hidden"
      setTab("now")
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [nowPlayingOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - swipeStartY.current
    if (deltaY > 100) closeNowPlaying()
  }

  const seekFromEvent = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!scrubberRef.current) return
    const rect = scrubberRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    seek(Math.round(pct * duration))
  }, [seek, duration])

  const handleScrubberMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    seekFromEvent(e)
    const onMove = (ev: MouseEvent) => { if (isDragging.current) seekFromEvent(ev) }
    const onUp = () => { isDragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const handleScrubberTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    seekFromEvent(e)
  }

  const handleScrubberTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current) seekFromEvent(e)
  }

  const handleScrubberTouchEnd = () => {
    isDragging.current = false
  }

  if (!nowPlayingOpen) return null

  return (
    <div ref={overlayRef} className="np-overlay" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : 0, paddingBottom: isMobile ? "env(safe-area-inset-bottom, 0px)" : 0 }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: track?.cover_url ? `linear-gradient(160deg, ${palette.muted} 0%, #0a0a0f 100%)` : "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)", overflow: "hidden", transition: "background 1.2s ease" }}>
        {track?.cover_url && (
          <>
            <div style={{ position: "absolute", inset: 0, background: "#0a0a0f" }} />
            <img src={track.cover_url} alt="" aria-hidden key={`bg-${track?.id ?? "none"}`} className="np-bg-swap" style={{ position: "absolute", inset: "-40px", width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: "blur(80px) saturate(180%) brightness(0.55)", transform: "scale(1.05)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
          </>
        )}
        <div style={{ position: "absolute", inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', backgroundSize: "200px 200px", opacity: 0.4, pointerEvents: "none" }} />
      </div>

      {/* Top bar — always visible at the top of the screen */}
      <div style={{ position: "relative", zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "20px 32px", flexShrink: 0 }}>
        <button onClick={closeNowPlaying} aria-label="Close Now Playing" style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <BackLinear size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} />
        </button>
        <p style={{ margin: 0, fontSize: isMobile ? "11px" : "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Now Playing</p>
        {track ? (
          <PremiumTrackMenu track={{ ...track, artist_id: track.artist_id || "" }} />
        ) : (
          <div style={{ width: isMobile ? "32px" : "36px" }} />
        )}
      </div>

      {/* Tabs */}
      <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", flexShrink: 0, padding: "0 16px 4px" }}>
        <div className="np-tabs" role="tablist" aria-label="Now playing views">
          {([
            ["now", "Now Playing"],
            ["queue", `Up Next${queue.length > 1 ? ` · ${queue.length - queueIndex - 1}` : ""}`],
            ["details", "Details"],
          ] as Array<["now" | "queue" | "details", string]>).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`np-tab${tab === id ? " np-tab-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab !== "now" && (
        <div className="np-panel" style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", flexDirection: "column", paddingTop: isMobile ? 128 : 148, background: "linear-gradient(180deg, rgba(8,8,12,0.66) 0%, rgba(8,8,12,0.9) 30%)" }}>
          <div className="np-panel-scroll" style={{ width: "100%", maxWidth: isMobile ? "100%" : 460, margin: "0 auto", padding: isMobile ? "8px 16px 32px" : "12px 24px 40px", overflowY: "auto", flex: 1, minHeight: 0 }}>
            {tab === "queue" ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                    Up Next{queue.length > 0 ? ` — ${Math.max(0, queue.length - queueIndex - 1)}` : ""}
                  </p>
                  {queue.length > 1 && (
                    <button onClick={clearQueue} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", padding: "4px 0" }}>
                      Clear
                    </button>
                  )}
                </div>
                {track && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.08)", marginBottom: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title} <EqBars paused={!isPlaying} /></p>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Now playing</p>
                    </div>
                  </div>
                )}
                {queue.slice(queueIndex + 1).map((q, i) => {
                  const idx = queueIndex + 1 + i
                  return (
                    <div
                      key={`${q.id}-${idx}`}
                      onClick={() => playTrack(q, { tracks: queue, index: idx })}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}
                      className="np-qrow"
                    >
                      {q.cover_url ? (
                        <img src={q.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} loading="lazy" />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 6, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.artist_name}</p>
                      </div>
                      {q.duration_sec > 0 && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmt(q.duration_sec)}</span>
                      )}
                      <button
                        aria-label={`Remove ${q.title} from queue`}
                        onClick={(e) => { e.stopPropagation(); removeFromQueue(idx) }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 6, display: "flex", flexShrink: 0 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )
                })}
                {queue.length - queueIndex - 1 <= 0 && (
                  <p style={{ margin: "20px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6 }}>
                    Nothing queued —<br />anything you play lands here.
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  About this track
                </p>
                {track ? (
                  <>
                    {track.cover_url && (
                      <img src={track.cover_url} alt={track.title} style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, display: "block", marginBottom: 16 }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {([
                        ["Title", track.title, null],
                        ["Artist", track.artist_name, track.artist_id ? `/artist/${track.artist_id}` : null],
                        ...(track.collaborators ?? []).map((c): [string, string, string | null] => [
                          c.role === "producer" || c.role === "Producer" ? "Producer" : "Featuring",
                          c.stage_name,
                          c.artist_id ? `/artist/${c.artist_id}` : null,
                        ]),
                        ["Length", fmt(track.duration_sec || 0), null],
                      ] as Array<[string, string, string | null]>).map(([label, value, href]) => (
                        <div key={`${label}-${value}`} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>{label}</span>
                          {href ? (
                            <button
                              onClick={() => { closeNowPlaying(); window.location.href = href }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "right" }}
                            >
                              {value} →
                            </button>
                          ) : (
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "right" }}>{value}</span>
                          )}
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <button
                      onClick={() => { closeNowPlaying(); window.location.href = `/track/${track.id}` }}
                      style={{ marginTop: 16, width: "100%", padding: "13px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                    >
                      Open track page
                    </button>
                  </>
                ) : (
                  <p style={{ margin: "20px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                    Play something to see the details.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Centered content */}
      <div className="np-content" style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", flex: 1, width: "100%", maxWidth: isMobile ? "100%" : "440px", margin: "0 auto", padding: isMobile ? "0 24px calc(12px + env(safe-area-inset-bottom, 0px))" : "16px 24px 32px", justifyContent: isMobile ? "space-between" : "center" }}>
        {/* Top section: artwork + info */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", flex: isMobile ? 1 : 0, justifyContent: isMobile ? "center" : "flex-start" }}>
        {/* Artwork */}
        <div style={{ position: "relative", marginBottom: isMobile ? "16px" : "24px" }}>
          {track?.cover_url && (
            <img src={track.cover_url} alt="" aria-hidden style={{ position: "absolute", inset: isMobile ? "-20px" : "-24px", width: `calc(100% + ${isMobile ? "40px" : "48px"})`, height: `calc(100% + ${isMobile ? "40px" : "48px"})`, borderRadius: "28px", objectFit: "cover", filter: "blur(36px) saturate(220%) brightness(0.75)", opacity: isPlaying ? 0.75 : 0.35, transition: "opacity 0.6s ease", pointerEvents: "none" }} />
          )}
          <div style={{ position: "relative", width: isMobile ? "min(88vw, 380px)" : "260px", height: isMobile ? "min(88vw, 380px)" : "260px", borderRadius: isMobile ? "8px" : "4px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)", transform: isPlaying ? "scale(1)" : "scale(0.88)", transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.5s ease" }}>
            {track?.cover_url ? (
              <img key={track.id} src={track.cover_url} alt={track?.title || "Now playing"} className="np-art-swap" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Track info + like */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? "10px" : "16px", gap: "12px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: isMobile ? "18px" : "20px", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.3px", lineHeight: 1.2 }}>{track?.title || "Nothing Playing"}</p>
            <p style={{ margin: "2px 0 0", fontSize: isMobile ? "13px" : "14px", fontWeight: 500, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: track?.artist_id ? "pointer" : "default" }}
              onClick={() => { if (track?.artist_id) { closeNowPlaying(); window.location.href = `/artist/${track.artist_id}` } }}>
              {track ? formatArtist(track) : "Select a track to start"}
            </p>
          </div>

          {/* Heart / like */}
          <button aria-label={liked ? "Unlike" : "Like"}
            onClick={() => { if (track) toggleLike(track.id) }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span key={`${track?.id ?? "none"}-${liked ? "liked" : "plain"}`} className={liked ? "like-burst" : undefined} style={{ display: "flex" }}>
            {liked ? (
              <HeartBold size={24} color="var(--like)" />
            ) : (
              <HeartLinear size={24} color="rgba(255,255,255,0.6)" strokeWidth={1.8} />
            )}
            </span>
          </button>
        </div>
        </div>

        {/* Scrubber */}
        <div style={{ width: "100%", marginBottom: "6px" }}>
          <div ref={scrubberRef} onMouseDown={handleScrubberMouseDown} onTouchStart={handleScrubberTouchStart} onTouchMove={handleScrubberTouchMove} onTouchEnd={handleScrubberTouchEnd} style={{ height: isMobile ? "4px" : "5px", borderRadius: "999px", background: "rgba(255,255,255,0.2)", position: "relative", cursor: "pointer", marginBottom: "8px", touchAction: "none" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progressPct}%`, borderRadius: "999px", background: `linear-gradient(90deg, ${accentColor} 0%, #ffffff 100%)`, transition: isDragging.current ? "none" : "width 0.25s linear, background 1s ease" }} />
            <div style={{ position: "absolute", top: "50%", left: `${progressPct}%`, transform: "translate(-50%, -50%)", width: isMobile ? "12px" : "14px", height: isMobile ? "12px" : "14px", borderRadius: "50%", background: "#ffffff", boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 6px ${accentAlpha(0.6)}`, opacity: progressPct > 0 ? 1 : 0, transition: isDragging.current ? "none" : "left 0.25s linear, box-shadow 1s ease", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>{fmt(progress)}</span>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>-{fmt(Math.max(0, duration - progress))}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", width: "100%", margin: isMobile ? "8px 0 12px" : "12px 0 16px" }}>
          {/* Shuffle */}
          <NpBtn title={shuffle ? "Shuffle on" : "Shuffle"} subtle={!shuffle} active={shuffle} style={{ marginRight: "auto" }} onClick={toggleShuffle}>
            <ShuffleLinear size={isMobile ? 18 : 20} color="currentColor" strokeWidth={1.8} />
          </NpBtn>

          <NpBtn title="Previous" onClick={prev} style={{ padding: isMobile ? "8px" : "10px" }}>
            <PrevBold size={isMobile ? 24 : 28} color="currentColor" />
          </NpBtn>

          <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"} style={{ width: isMobile ? "56px" : "68px", height: isMobile ? "56px" : "68px", borderRadius: "50%", background: "#ffffff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 3px ${accentAlpha(0.25)}`, transition: "box-shadow 1s ease", margin: "0 8px", flexShrink: 0 }}>
            {isPlaying ? (
              <PauseBold size={isMobile ? 20 : 24} color="#1d1d1f" />
            ) : (
              <span style={{ marginLeft: "3px", display: "flex" }}><PlayBold size={isMobile ? 20 : 24} color="#1d1d1f" /></span>
            )}
          </button>

          <NpBtn title="Next" onClick={next} style={{ padding: isMobile ? "8px" : "10px" }}>
            <NextBold size={isMobile ? 24 : 28} color="currentColor" />
          </NpBtn>

          {/* Repeat */}
          <NpBtn title={repeatMode === "one" ? "Repeat one" : repeatMode === "all" ? "Repeat all" : "Repeat"} subtle={repeatMode === "off"} active={repeatMode !== "off"} style={{ marginLeft: "auto", position: "relative" }} onClick={toggleRepeat}>
            <RepeatLinear size={isMobile ? 18 : 20} color="currentColor" strokeWidth={1.8} />
            {repeatMode === "one" && (
              <span style={{ position: "absolute", top: "3px", right: "2px", fontSize: "8px", fontWeight: 900, color: "var(--brand)" }}>1</span>
            )}
          </NpBtn>
        </div>

        {/* Volume — hidden on mobile */}
        {!isMobile && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          </svg>
          <div style={{ flex: 1, position: "relative", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.2)", cursor: "pointer" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${volume * 100}%`, borderRadius: "999px", background: `linear-gradient(90deg, ${accentAlpha(0.9)} 0%, rgba(255,255,255,0.85) 100%)`, transition: "width 0.05s, background 1s ease" }} />
            <input type="range" min={0} max={1} step={0.02} value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ position: "absolute", inset: "-8px 0", width: "100%", height: "21px", opacity: 0, cursor: "pointer", zIndex: 1 }} />
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        </div>
        )}
      </div>
    </div>
  )
}


