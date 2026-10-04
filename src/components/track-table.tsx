"use client"

import Link from "next/link"
import { usePlayerStore, type TrackInfo } from "@/lib/store"
import { CoverImage } from "@/components/cover-image"
import { PremiumTrackMenu } from "@/components/track-menu"
import { ArtistLinks } from "@/components/artist-links"
import { EqBars } from "@/components/eq"

/**
 * The one tracklist used across the app (everything except album pages,
 * which keep bespoke rows): Apple-Music-chart-style table with a
 * Song | Artist | Album | Time header, cover + rank + Grotesk title,
 * hairline dividers and no playing-row background (eq bars mark playback).
 */

function formatDuration(sec: number | null | undefined) {
  if (sec == null || Number.isNaN(sec)) return "--:--"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatCount(n: number | null | undefined) {
  if (n == null) return "—"
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

function toInfo(t: any): TrackInfo {
  return {
    id: t.id,
    artist_id: t.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec ?? 0,
    collaborators: t.collaborators,
  }
}

export interface TrackTableProps {
  tracks: any[]
  showHeader?: boolean
  showRank?: boolean
  showAlbum?: boolean
  showArtist?: boolean
  mobileSub?: "artist" | "plays"
  rankOffset?: number
  accentColor?: string
}

export function TrackTable({
  tracks,
  showHeader = true,
  showRank = true,
  showAlbum = true,
  showArtist = true,
  mobileSub = "artist",
  rankOffset = 0,
  accentColor,
}: TrackTableProps) {
  const playQueue = usePlayerStore((s) => s.playQueue)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  if (!tracks || tracks.length === 0) return null

  const color = accentColor || "var(--brand)"
  const cols =
    !showArtist && showRank && !showAlbum
      ? "tt-cols-chart"
      : showRank && showAlbum
        ? "tt-cols-ra"
        : showRank
          ? "tt-cols-r"
          : showAlbum
            ? "tt-cols-a"
            : "tt-cols-min"
  const queue = tracks.map(toInfo)

  const headCell = (label: string, align: "left" | "right", key: string) => (
    <span
      key={key}
      className={`tt-head-cell tt-h-${align}`}
      style={{ textAlign: align }}
    >
      {label}
    </span>
  )

  return (
    <div className="tt-table">
      <style>{`
        .tt-grid { display: grid; align-items: center; column-gap: 12px; }
        .tt-cols-ra { grid-template-columns: 36px 30px minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,1.2fr) 52px 36px; }
        .tt-cols-chart { grid-template-columns: 36px 30px minmax(0,2.4fr) 52px 36px; }
        .tt-cols-r { grid-template-columns: 36px 30px minmax(0,2.2fr) minmax(0,1.4fr) 52px 36px; }
        .tt-cols-a { grid-template-columns: 36px minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,1.2fr) 52px 36px; }
        .tt-cols-min { grid-template-columns: 36px minmax(0,2.4fr) minmax(0,1.4fr) 52px 36px; }
        .tt-head { padding: 0 8px 8px; border-bottom: 1px solid var(--border); }
        .tt-head-cell { font-size: 12px; font-weight: 600; color: var(--muted-foreground); white-space: nowrap; }
        .tt-row { padding: 7px 8px; border-radius: 0; border-top: 1px solid var(--border); cursor: pointer; transition: background-color 0.15s ease; }
        .tt-body .tt-row:first-child { border-top: none; }
        .tt-row:hover { background: var(--hover-bg); }
        .tt-rank { font-size: 13px; font-weight: 500; color: var(--muted-foreground); font-variant-numeric: tabular-nums; text-align: left; }
        .tt-title { margin: 0; font-size: 14px; font-weight: 600; font-family: var(--font-display, inherit); letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tt-title-text { cursor: pointer; }
        .tt-title-text:hover { text-decoration: underline; }
        .tt-artist-sub { display: none; }
        .tt-cell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 1100px) {
          .tt-col-album { display: none; }
          .tt-cols-ra, .tt-cols-a { grid-template-columns: 36px 30px minmax(0,2.2fr) minmax(0,1.4fr) 52px 36px; }
          .tt-cols-r { grid-template-columns: 36px 30px minmax(0,2.2fr) minmax(0,1.4fr) 52px 36px; }
          .tt-cols-min { grid-template-columns: 36px minmax(0,2.4fr) minmax(0,1.4fr) 52px 36px; }
        }
        @media (max-width: 1100px) {
          .tt-cols-a { grid-template-columns: 36px minmax(0,2.2fr) minmax(0,1.4fr) 52px 36px; }
        }
        @media (max-width: 680px) {
          .tt-head { display: none; }
          .tt-grid { grid-template-columns: 44px minmax(0,1fr) 36px !important; }
          .tt-row { padding: 10px 8px; }
          .tt-row.is-playing { background: color-mix(in srgb, var(--brand) 10%, transparent); }
          .tt-row.is-playing:hover { background: color-mix(in srgb, var(--brand) 13%, transparent); }
          .tt-cover { width: 44px !important; height: 44px !important; }
          .tt-col-rank, .tt-col-artist, .tt-col-album, .tt-col-duration { display: none; }
          .tt-artist-sub { display: block; margin: 1px 0 0; font-size: 12px; color: var(--muted-foreground); overflow: hidden; textOverflow: ellipsis; white-space: nowrap; }
        }
      `}</style>

      {showHeader && (
        <div className={`tt-grid ${cols} tt-head`} role="row" aria-hidden>
          <span />
          {showRank && <span />}
          {headCell("Song", "left", "song")}
          {showArtist && <span className="tt-col-artist">{headCell("Artist", "left", "artist")}</span>}
          {showAlbum && <span className="tt-col-album">{headCell("Album", "left", "album")}</span>}
          {headCell("Time", "right", "time")}
          <span />
        </div>
      )}

      <div className="tt-body">
        {tracks.map((t: any, i: number) => {
          const isCurrent = currentTrack?.id === t.id
          const playingNow = isCurrent && isPlaying
          const albumName = t.album_name || t.albumName || ""
          return (
            <div
              key={t.id}
              className={`tt-grid tt-row ${cols}${playingNow ? " is-playing" : ""}`}
              onClick={() => {
                if (isCurrent) togglePlay()
                else void playQueue(queue, i)
              }}
            >
              <span className="tt-cover" style={{ position: "relative", width: 36, height: 36, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "var(--hover-bg)", display: "block" }}>
                {t.cover_url ? (
                  <CoverImage src={t.cover_url} alt={t.title} sizes="100px" />
                ) : (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }} aria-hidden>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                  </span>
                )}
              </span>
              {showRank && (
                <span className="tt-rank tt-col-rank" style={isCurrent ? { color } : undefined}>
                  {rankOffset + i + 1}
                </span>
              )}
              <span className="tt-cell">
                <p className="tt-title" style={isCurrent ? { color } : undefined}>
                  <Link
                    className="tt-title-text"
                    href={`/track/${t.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.title}
                  </Link>
                  {playingNow ? <span> <EqBars /></span> : null}
                </p>
                <p className="tt-artist-sub">
                  {mobileSub === "plays" ? (
                    <>{formatCount(t.play_count)} plays</>
                  ) : (
                    <ArtistLinks track={t} />
                  )}
                </p>
              </span>
              {showArtist && (
                <span className="tt-cell tt-col-artist" style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  <ArtistLinks track={t} />
                </span>
              )}
              {showAlbum && (
                <span className="tt-cell tt-col-album" style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  {albumName ? (
                    <Link
                      href={`/album/${t.album_id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer" }}
                    >
                      {albumName}
                    </Link>
                  ) : (
                    <span aria-hidden style={{ opacity: 0.5 }}>—</span>
                  )}
                </span>
              )}
              <span className="tt-col-duration" style={{ textAlign: "right", fontSize: 13, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {formatDuration(t.duration_sec)}
              </span>
              <span style={{ display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                <PremiumTrackMenu track={{ ...toInfo(t), artist_id: t.artist_id || "" }} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
