"use client"

import { useRef, useState, useEffect } from "react"
import { usePlayerStore, type TrackInfo } from "@/lib/store"
import { useUIStore } from "@/lib/ui-store"
import { useLikesStore } from "@/lib/likes-store"
import { useColorExtract } from "@/lib/use-color-extract"
import { ArtistLinks } from "@/components/artist-links"

function fmt(sec: number) {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function Player() {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    shuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    queue,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore()
  const { openNowPlaying, queuePanelOpen, toggleQueuePanel, closeQueuePanel } = useUIStore()
  const loading = usePlayerStore((s) => s._loading)
  const { isLiked, toggleLike } = useLikesStore()
  const palette = useColorExtract(currentTrack?.cover_url)

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
  const accentAlpha = (a: number) => `rgba(${accentRgb}, ${a})`

  if (isMobile) {
    return (
      <MobileMiniPlayer
        track={track}
        isPlaying={isPlaying}
        loading={!!loading}
        duration={duration}
        progressPct={progressPct}
        liked={liked}
        palette={palette}
        onTogglePlay={togglePlay}
        onNext={next}
        onPrev={prev}
        onSeek={seek}
        onToggleLike={() => { if (track) toggleLike(track.id) }}
        onOpenNowPlaying={openNowPlaying}
      />
    )
  }

  return (
    <>
    {/* ─── Player Bar (relative so queue panel can live inside it) ─── */}
    <div
      className="player-bar"
      style={{
        position: "fixed",
        bottom: "var(--player-bottom, 20px)",
        left: "var(--player-left, calc(var(--sidebar-width, 260px) + 36px))",
        right: "var(--player-right, 24px)",
        zIndex: 200,
        width: "auto",
        maxWidth: "var(--player-max-w, none)",
        margin: 0,
        boxSizing: "border-box",
        background: track ? `rgba(${accentRgb}, 0.6)` : "var(--player-bg)",
        backdropFilter: "blur(48px) saturate(200%)",
        WebkitBackdropFilter: "blur(48px) saturate(200%)",
        borderRadius: "var(--player-border-radius, 999px)",
        border: track
          ? `1px solid ${accentAlpha(0.22)}`
          : "1px solid var(--border)",
        boxShadow: track
          ? `0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px ${accentAlpha(0.08)}`
          : "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        transition: "border-color 1s ease, box-shadow 1s ease, background 1s ease, left 0.3s ease, right 0.3s ease, bottom 0.3s ease",
      }}
    >
      {/* ─── Queue Panel (absolute child of player bar → stays aligned) ─── */}
      <QueuePanel
        open={queuePanelOpen}
        onClose={closeQueuePanel}
        currentTrack={track}
        queue={queue}
        currentIndex={usePlayerStore.getState().queueIndex}
        onRemove={removeFromQueue}
        onClear={clearQueue}
        onPlay={(t, i) => usePlayerStore.getState().play(t, { tracks: queue, index: i })}
        palette={palette}
      />
        {/* Main player row */}
        <div
          className="player-row"
          style={{
            display: "grid",
            gridTemplateColumns: "var(--player-grid-cols, 1fr auto 1fr)",
            alignItems: "center",
            padding: "var(--player-padding, 10px 20px 6px)",
            gap: "var(--player-grid-gap, 16px)",
          }}
        >
          {/* LEFT — track info */}
          <div
            onClick={() => { if (currentTrack) openNowPlaying() }}
            title={currentTrack ? "Open Now Playing" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: 0,
              cursor: currentTrack ? "pointer" : "default",
              borderRadius: "12px",
              padding: "4px 8px 4px 0",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (currentTrack) e.currentTarget.style.background = "var(--hover-bg)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            {track ? (
              <div key={track.id} className="fade-in" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div style={{ flexShrink: 0, position: "relative" }}>
                  {track.cover_url && (
                    <img src={track.cover_url} alt="" aria-hidden style={{ position: "absolute", inset: "-6px", width: "calc(100% + 12px)", height: "calc(100% + 12px)", borderRadius: "2px", objectFit: "cover", filter: "blur(12px) brightness(0.9)", opacity: 0.25, zIndex: 0, pointerEvents: "none" }} />
                  )}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt={track.title} style={{ width: "var(--player-art-size, 44px)", height: "var(--player-art-size, 44px)", borderRadius: "2px", objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", display: "block", transition: "box-shadow 0.3s ease" }} />
                    ) : (
                      <div style={{ width: "var(--player-art-size, 44px)", height: "var(--player-art-size, 44px)", borderRadius: "2px", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px var(--brand-shadow)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                        {track.title}
                      </p>
                    </div>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                    <ArtistLinks track={track} />
                  </p>
                </div>
                </div>
            ) : null}
          </div>

          {/* CENTER — playback controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <CtrlBtn className="player-extra-btn" title={shuffle ? "Shuffle on" : "Shuffle"} dim={!shuffle} active={shuffle} onClick={toggleShuffle} noHover>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </CtrlBtn>

            <span className="player-nav-btn">
              <CtrlBtn title="Previous" onClick={prev} noHover>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="2.5" height="16" rx="1.2" />
                </svg>
              </CtrlBtn>
            </span>

            <button onClick={() => { if (track) toggleLike(track.id) }} title={liked ? "Unlike" : "Like"}
              className="player-mobile-like"
              style={{ background: "none", border: "none", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", padding: "6px", borderRadius: "8px", color: liked ? "var(--like)" : "rgba(255,255,255,0.8)", lineHeight: 0, transition: "color 0.15s, transform 0.1s" }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.85)" }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "var(--like)" : "none"} stroke={liked ? "var(--like)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <button onClick={togglePlay} title={loading ? "Loading" : isPlaying ? "Pause" : "Play"}
              style={{ width: "var(--player-btn-size, 38px)", height: "var(--player-btn-size, 38px)", borderRadius: "50%", background: "linear-gradient(135deg, #fff 0%, #e8e8ec 100%)", border: "none", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", transition: "transform 0.1s ease, box-shadow 0.1s ease", margin: "0 4px", flexShrink: 0, position: "relative" }}
              onMouseDown={(e) => { if (!loading) { e.currentTarget.style.transform = "scale(0.91)"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.18)" } }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)" }}
            >
              {loading ? (
                <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
              ) : isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d1d1f"><rect x="5" y="4" width="4.5" height="16" rx="1.5" /><rect x="14.5" y="4" width="4.5" height="16" rx="1.5" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d1d1f" style={{ marginLeft: "2px" }}><polygon points="5,3 20,12 5,21" /></svg>
              )}
            </button>

            <span className="player-nav-btn">
              <CtrlBtn title="Next" onClick={next} noHover>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,4 15,12 5,20" /><rect x="16.5" y="4" width="2.5" height="16" rx="1.2" />
                </svg>
              </CtrlBtn>
            </span>

            <CtrlBtn className="player-extra-btn" title={repeatMode === "one" ? "Repeat one" : repeatMode === "all" ? "Repeat all" : "Repeat"} dim={repeatMode === "off"} active={repeatMode !== "off"} onClick={toggleRepeat} noHover style={{ position: "relative" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              {repeatMode === "one" && (
                <span style={{
                  position: "absolute", bottom: "-1px", right: "-1px",
                  width: 12, height: 12, borderRadius: "50%",
                  background: "var(--brand)",
                  color: "#fff", fontSize: 8, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}>1</span>
              )}
            </CtrlBtn>
          </div>

          {/* RIGHT — time, like, volume, queue */}
          <div className="player-right-controls" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", minWidth: 0 }}>
            {track && (
              <span className="player-time" style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", minWidth: "40px", textAlign: "right" }}>
                {fmt(progress)} / {fmt(duration)}
              </span>
            )}

            {/* Like button */}
            <CtrlBtn title={liked ? "Unlike" : "Like"} dim={!liked} active={liked} onClick={() => { if (track) toggleLike(track.id) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "var(--like)" : "none"} stroke={liked ? "var(--like)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </CtrlBtn>

            <CtrlBtn className="player-extra-btn" title="Up Next" dim={!queuePanelOpen} active={queuePanelOpen} onClick={toggleQueuePanel}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><line x1="4" y1="6" x2="4.01" y2="6" strokeWidth="2.5" /><line x1="4" y1="12" x2="4.01" y2="12" strokeWidth="2.5" /><line x1="4" y1="18" x2="4.01" y2="18" strokeWidth="2.5" />
              </svg>
            </CtrlBtn>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M15.54 8.46a5 5 0 010 7.07" />
              </svg>
              <div style={{ position: "relative", width: "var(--player-volume-width, 70px)", height: "24px", display: "flex", alignItems: "center" }}>
                <div className="player-volume-track" style={{ position: "absolute", left: 0, height: "4px", width: "100%", borderRadius: "2px", background: "var(--border)", overflow: "hidden" }}>
                  <div className="player-volume-fill" suppressHydrationWarning style={{ height: "100%", width: `${volume * 100}%`, background: "var(--foreground)", borderRadius: "2px", transition: "width 0.05s" }} />
                </div>
                <input type="range" min={0} max={1} step={0.02} value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: "24px", margin: 0, zIndex: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {track && (
        <div className="player-progress-bar" style={{ display: "flex", justifyContent: "center", padding: "var(--player-progress-padding, 0 20px 10px)" }}>
          <div style={{ maxWidth: "500px", flex: 1 }}>
            <div className="player-progress-track" style={{ height: "3px", background: "var(--border)", position: "relative", cursor: "pointer", borderRadius: "999px", overflow: "hidden" }}
              onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; seek(Math.round(pct * duration)) }}>
              <div className="player-progress-fill" style={{ height: "100%", width: `${progressPct}%`, background: palette.vibrant, borderRadius: "999px", transition: "width 0.12s linear, background 1s ease", position: "relative" }} />
              <div className="player-progress-dot" style={{ position: "absolute", top: "50%", left: `${progressPct}%`, transform: "translate(-50%, -50%)", width: "10px", height: "10px", borderRadius: "50%", background: palette.vibrant, opacity: progressPct > 0 ? 1 : 0, transition: "left 0.12s linear, opacity 0.2s, background 1s ease", pointerEvents: "none" }} />
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  )
}

// ─── Mobile Mini Player ───────────────────────────────────────────────────────

function MobileMiniPlayer({
  track,
  isPlaying,
  loading,
  duration,
  progressPct,
  liked,
  palette,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleLike,
  onOpenNowPlaying,
}: {
  track: TrackInfo | null
  isPlaying: boolean
  loading: boolean
  duration: number
  progressPct: number
  liked: boolean
  palette: { vibrant: string; r: number; g: number; b: number }
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  onSeek: (s: number) => void
  onToggleLike: () => void
  onOpenNowPlaying: () => void
}) {
  const swipeStartY = useRef(0)
  const swipeStartX = useRef(0)
  const titleRef = useRef<HTMLSpanElement>(null)
  const titleContainerRef = useRef<HTMLDivElement>(null)
  const [titleOverflows, setTitleOverflows] = useState(false)

  const accentRgb = `${palette.r}, ${palette.g}, ${palette.b}`
  const accentAlpha = (a: number) => `rgba(${accentRgb}, ${a})`
  const hasTrack = Boolean(track)

  useEffect(() => {
    const el = titleRef.current
    const container = titleContainerRef.current
    if (!el || !container) return
    setTitleOverflows(el.scrollWidth > container.clientWidth + 2)
  }, [track?.title])

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY
    swipeStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = swipeStartY.current - e.changedTouches[0].clientY
    const deltaX = Math.abs(e.changedTouches[0].clientX - swipeStartX.current)
    if (deltaY > 40 && deltaX < 60 && track) {
      onOpenNowPlaying()
    }
  }

  const handleProgressClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    onSeek(Math.round(pct * duration))
  }

  return (
    <div
      className="player-bar"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed",
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        left: "max(12px, env(safe-area-inset-left, 12px))",
        right: "max(12px, env(safe-area-inset-right, 12px))",
        zIndex: 200,
        boxSizing: "border-box",
        background: track ? `rgba(${accentRgb}, 0.65)` : "var(--player-bg)",
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        borderRadius: "999px",
        border: track
          ? `1px solid ${accentAlpha(0.25)}`
          : "1px solid var(--border)",
        boxShadow: track
          ? `0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.12)`
          : "0 4px 16px rgba(0,0,0,0.10)",
        transition: "background 1s ease, border-color 1s ease, box-shadow 1s ease",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 10px 10px 12px",
          gap: "8px",
          minHeight: "64px",
        }}
      >
        {track && (
          <div
            onClick={() => onOpenNowPlaying()}
            style={{
              flexShrink: 0,
              position: "relative",
              cursor: "pointer",
              borderRadius: "12px",
              overflow: "visible",
            }}
          >
            {track?.cover_url && (
              <img
                src={track.cover_url}
                alt=""
                aria-hidden
                className="player-mobile-art-glow"
                style={{
                  position: "absolute",
                  inset: "-8px",
                  width: "calc(100% + 16px)",
                  height: "calc(100% + 16px)",
                  borderRadius: "16px",
                  objectFit: "cover",
                  filter: "blur(14px) saturate(200%) brightness(0.85)",
                  opacity: isPlaying ? 0.55 : 0.2,
                  pointerEvents: "none",
                  zIndex: 0,
                  transition: "opacity 0.6s ease",
                }}
              />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              {track.cover_url ? (
                <img
                  src={track.cover_url}
                  alt={track.title}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    objectFit: "cover",
                    display: "block",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    transform: isPlaying ? "scale(1)" : "scale(0.94)",
                    transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px var(--brand-shadow)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}

        {track && (
          <div
            onClick={() => onOpenNowPlaying()}
            style={{
              flex: 1,
              minWidth: 0,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              ref={titleContainerRef}
              className="player-mobile-title"
              style={{ position: "relative" }}
            >
              <span
                ref={titleRef}
                className={`player-mobile-title-inner${titleOverflows ? " marquee" : ""}`}
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.97)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.2px",
                }}
              >
                {track.title}
              </span>
            </div>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.58)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {track.artist_name}
              {track.collaborators && track.collaborators.length > 0
                ? ", " + track.collaborators.map((c) => c.stage_name).join(", ")
                : ""}
            </p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0, marginLeft: "auto" }}>
          <button
            onClick={(e) => { e.stopPropagation(); if (hasTrack) onToggleLike() }}
            disabled={!hasTrack}
            title={liked ? "Unlike" : "Like"}
            style={{
              background: "none",
              border: "none",
              cursor: hasTrack ? "pointer" : "default",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: liked ? "var(--like)" : track ? "rgba(255,255,255,0.65)" : "var(--muted-foreground)",
              lineHeight: 0,
              WebkitTapHighlightColor: "transparent",
              transition: "color 0.15s",
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill={liked ? "var(--like)" : "none"} stroke={liked ? "var(--like)" : "currentColor"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            disabled={!hasTrack}
            title="Previous"
            style={{
              background: "none",
              border: "none",
              cursor: hasTrack ? "pointer" : "default",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: track ? "rgba(255,255,255,0.75)" : "var(--foreground)",
              lineHeight: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="2.5" height="16" rx="1.2" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); if (!loading) onTogglePlay() }}
            title={loading ? "Loading" : isPlaying ? "Pause" : "Play"}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: track
                ? "linear-gradient(135deg, #ffffff 0%, #e8e8ec 100%)"
                : "linear-gradient(135deg, var(--card-bg) 0%, var(--muted) 100%)",
              border: "none",
              cursor: loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
              flexShrink: 0,
              WebkitTapHighlightColor: "transparent",
              transition: "transform 0.1s ease, box-shadow 0.1s ease",
            }}
          >
            {loading ? (
              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={track ? "#1d1d1f" : "var(--foreground)"} strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
            ) : isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={track ? "#1d1d1f" : "var(--foreground)"}>
                <rect x="5" y="4" width="4.5" height="16" rx="1.5" />
                <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={track ? "#1d1d1f" : "var(--foreground)"} style={{ marginLeft: "2px" }}>
                <polygon points="5,3 20,12 5,21" />
              </svg>
            )}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            disabled={!hasTrack}
            title="Next"
            style={{
              background: "none",
              border: "none",
              cursor: hasTrack ? "pointer" : "default",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: track ? "rgba(255,255,255,0.75)" : "var(--foreground)",
              lineHeight: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,4 15,12 5,20" /><rect x="16.5" y="4" width="2.5" height="16" rx="1.2" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="player-mobile-progress"
        onClick={handleProgressClick}
      >
        <div
          className="player-mobile-progress-fill"
          suppressHydrationWarning
          style={{
            width: `${progressPct}%`,
            background: palette.vibrant !== "var(--brand)" ? palette.vibrant : track ? "rgba(255,255,255,0.85)" : "var(--foreground)",
          }}
        />
      </div>
    </div>
  )
}

// ─── Queue Panel ──────────────────────────────────────────────────────────────────────

function QueuePanel({
  open,
  onClose,
  currentTrack,
  queue,
  currentIndex,
  onRemove,
  onClear,
  onPlay,
  palette,
}: {
  open: boolean
  onClose: () => void
  currentTrack: TrackInfo | null
  queue: TrackInfo[]
  currentIndex: number
  onRemove: (index: number) => void
  onClear: () => void
  onPlay: (track: TrackInfo, index: number) => void
  palette: { vibrant: string; r: number; g: number; b: number }
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const accentRgb = `${palette.r}, ${palette.g}, ${palette.b}`
  const accentAlpha = (a: number) => `rgba(${accentRgb}, ${a})`

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 199,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Panel (absolute inside player bar → stays glued to it) */}
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          bottom: "100%",
          right: 0,
          marginBottom: 10,
          width: "min(480px, calc(100vw - var(--player-left, 300px) - var(--player-right, 24px)))",
          maxHeight: "calc(100vh - 260px)",
          maxWidth: "480px",
          background: "var(--card-bg)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
borderRadius: "999px",
          border: `1px solid ${accentAlpha(0.15)}`,
          boxShadow: `0 12px 48px rgba(0,0,0,0.18), 0 0 0 1px ${accentAlpha(0.06)}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "opacity 0.2s",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--foreground)" }}>Up Next</h3>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 500, padding: "4px 10px", borderRadius: "8px" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
              Clear
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 500, padding: "4px 10px", borderRadius: "8px" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
              Close
            </button>
          </div>
        </div>

        {/* Now Playing */}
        {currentTrack && (
          <div
            onClick={() => onPlay(currentTrack, currentIndex)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 16px", cursor: "pointer",
              borderBottom: "1px solid var(--border)",
              background: accentAlpha(0.06),
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = accentAlpha(0.12) }}
            onMouseLeave={(e) => { e.currentTarget.style.background = accentAlpha(0.06) }}
          >
            {currentTrack.cover_url ? (
              <img src={currentTrack.cover_url} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 4, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: palette.vibrant, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.title}</p>
              <p style={{ margin: "1px 0 0", fontSize: "11px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.artist_name}</p>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--brand)", flexShrink: 0 }}>Now Playing</span>
          </div>
        )}

        {/* Queue list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
            {queue.slice(currentIndex + 1).length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "13px" }}>
              <p style={{ margin: 0 }}>Queue is empty</p>
              <p style={{ margin: "4px 0 0", fontSize: "11px" }}>Add tracks from the search or track menu</p>
            </div>
          ) : (
            queue.slice(currentIndex + 1).map((t, i) => {
              const actualIndex = currentIndex + 1 + i
              return (
                <div
                  key={`${t.id}-${actualIndex}`}
                  onClick={() => onPlay(t, actualIndex)}
                  className="queue-row"
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 12px", cursor: "pointer",
                    borderRadius: "10px", margin: "0 6px",
                    transition: "background 0.1s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                  >
                    <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, width: "22px", textAlign: "center", flexShrink: 0 }}>{actualIndex}</span>
                  {t.cover_url ? (
                    <img src={t.cover_url} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 4, background: "linear-gradient(135deg, #e8e8ec, #d0d0d8)", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                    <p style={{ margin: "1px 0 0", fontSize: "11px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artist_name}</p>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)", flexShrink: 0 }}>
                    {Math.floor(t.duration_sec / 60)}:{String(t.duration_sec % 60).padStart(2, "0")}
                  </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(actualIndex) }}
                      title="Remove"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px", borderRadius: "6px", lineHeight: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

// ─── CtrlBtn ──────────────────────────────────────────────────────────────────────────

function CtrlBtn({
  children,
  onClick,
  title,
  dim,
  active,
  noHover,
  className,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  dim?: boolean
  active?: boolean
  noHover?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const baseColor = active ? "var(--brand)" : dim ? "var(--muted-foreground)" : "var(--foreground)"

  return (
    <button
      onClick={onClick}
      title={title}
      className={className}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: baseColor,
        padding: "6px", display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "8px", transition: "background 0.12s ease, color 0.12s ease, transform 0.1s ease",
        lineHeight: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (noHover) return
        e.currentTarget.style.background = "var(--hover-bg)"
        if (dim && !active) e.currentTarget.style.color = "var(--foreground)"
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.88)" }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
        e.currentTarget.style.transform = "scale(1)"
        e.currentTarget.style.color = baseColor
      }}
    >
      {children}
    </button>
  )
}
