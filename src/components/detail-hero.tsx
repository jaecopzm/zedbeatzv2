"use client"

import { useRouter } from "next/navigation"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"
import { PauseIcon as PauseBold } from "@solar-icons/react/bold/pause"

/**
 * The one detail hero used across the app (album / track / playlist /
 * radio / artist phone layouts all converge here): Spotify-style stacked
 * hero — vivid cover-derived wash, big centered art, heavyweight title,
 * avatar + artist row, single meta line, ghost actions left and one big
 * round brand play button right.
 */

export interface DetailHeroProps {
  art: string | null
  artAlt: string
  shape?: "square" | "circle"
  eyebrow?: string
  title: string
  uppercaseTitle?: boolean
  artistName: string
  artistId?: string | null
  artistPhoto?: string | null
  meta?: string
  playing: boolean
  loading?: boolean
  onPlay: () => void
  playLabel?: string
  actionsLeft?: React.ReactNode
}

export function DetailHero({
  art,
  artAlt,
  shape = "square",
  eyebrow,
  title,
  uppercaseTitle = false,
  artistName,
  artistId,
  artistPhoto,
  meta,
  playing,
  loading = false,
  onPlay,
  playLabel,
  actionsLeft,
}: DetailHeroProps) {
  const router = useRouter()
  const round = shape === "circle"
  const initial = (artistName || "A").charAt(0).toUpperCase()

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Vivid wash extracted from the art */}
      {art && (
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${art})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(70px) brightness(0.6) saturate(1.8)",
            transform: "scale(1.2)",
            pointerEvents: "none",
          }}
        />
      )}
      {!art && (
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, var(--brand) 0%, #1d1d1f 100%)",
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* Fixed dark melt so white text stays legible in any theme */}
      <div
        aria-hidden
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: 220,
          background: "linear-gradient(to bottom, transparent 0%, #0b0b10 100%)",
          opacity: 0.92,
        }}
      />

      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: "stretch", textAlign: "left",
        padding: "72px 20px 22px",
      }}>
        {/* Art */}
        <div style={{
          alignSelf: "center",
          width: "min(60vw, 260px)",
          height: "min(60vw, 260px)",
          borderRadius: round ? "50%" : 2,
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)",
        }}>
          {art ? (
            <img
              src={art}
              alt={artAlt}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ width: "100%", marginTop: 18 }}>
          {eyebrow && (
            <p style={{
              margin: "0 0 6px", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
            }}>
              {eyebrow}
            </p>
          )}
          <h1 style={{
            fontFamily: "var(--font-display, inherit)",
            fontSize: "clamp(24px, 7vw, 30px)",
            fontWeight: 800,
            textTransform: uppercaseTitle ? "uppercase" : "none",
            color: "#fff",
            margin: "0 0 4px",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            textShadow: "0 2px 16px rgba(0,0,0,0.4)",
            textWrap: "balance",
          }}>
            {title}
          </h1>
          <button
            type="button"
            onClick={() => { if (artistId) router.push(`/artist/${artistId}`) }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", padding: 0,
              cursor: artistId ? "pointer" : "default",
              margin: "0 0 8px", fontFamily: "inherit", textAlign: "left",
            }}
            aria-label={artistId ? `More by ${artistName}` : undefined}
          >
            <span aria-hidden style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              overflow: "hidden", background: "rgba(255,255,255,0.22)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
            }}>
              {artistPhoto ? (
                <img src={artistPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
              ) : (
                initial
              )}
            </span>
            <span style={{ fontSize: 17, fontWeight: 600, color: "#fff" }}>
              {artistName}
            </span>
          </button>
          {meta && (
            <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
              {meta}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {actionsLeft}
            </div>
            <button
              type="button"
              onClick={onPlay}
              disabled={loading}
              aria-label={playLabel ?? (playing ? "Pause" : "Play")}
              style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "none", background: "var(--brand)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: loading ? "default" : "pointer",
                boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                flexShrink: 0,
              }}
            >
              {loading ? (
                <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid currentColor", borderTopColor: "transparent", animation: "app-spin 0.6s linear infinite", display: "inline-block" }} />
              ) : playing ? (
                <PauseBold size={26} color="#fff" />
              ) : (
                <span style={{ marginLeft: 4, display: "flex" }}><PlayBold size={26} color="#fff" /></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
