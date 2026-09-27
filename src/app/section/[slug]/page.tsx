"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { usePlayerStore, type TrackInfo } from "@/lib/store"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { TrackRow } from "@/components/home/track-cards"
import { genreArt } from "@/lib/genre-art"

const SECTION_LABELS: Record<string, string> = {
  best_new_songs: "Best New Songs",
  new_this_week: "New This Week",
  zed_hip_hop: "Zambian Hip Hop",
  zed_oldies: "Zed Oldies",
  zed_afrobeats: "Zambian Afrobeats",
  zed_gospel: "Zambian Gospel",
  zed_rnb: "Zambian R&B",
  zed_dancehall: "Zambian Dancehall",
  zed_kalindula: "Kalindula",
  zed_bangers: "Zed Bangers",
  zed_collabos: "Big Collabos",
  fresh_voices: "Fresh Voices",
  throwback_thursday: "Throwback Thursday",
}

function toTrackInfo(t: any): TrackInfo {
  return {
    id: t.id,
    artist_id: t.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec,
    collaborators: (t.collaborators ?? []).map((c: any) => ({
      artist_id: c.artist_id,
      stage_name: c.stage_name,
      role: "featured",
    })),
  }
}

function formatRuntime(totalSec: number): string {
  if (!totalSec) return ""
  const h = Math.floor(totalSec / 3600)
  const m = Math.round((totalSec % 3600) / 60)
  if (h > 0) return `${h} hr ${m} min`
  return `${m} min`
}

export default function SectionPage() {
  const { slug } = useParams()
  const playQueue = usePlayerStore((s) => s.playQueue)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const limit = 50

  const sectionKey = typeof slug === "string" ? slug : ""
  const label = SECTION_LABELS[sectionKey] || sectionKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const art = genreArt({ slug: sectionKey, name: label })

  const { data, isLoading } = useQuery({
    queryKey: ["tracks", sectionKey, page],
    queryFn: () => api.listTracks(limit, page * limit, sectionKey),
    enabled: !!sectionKey,
  })

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search-tracks", search],
    queryFn: () => api.searchTracks(search),
    enabled: search.length > 0,
  })

  const tracks = search ? (searchData?.results ?? []) : (data?.tracks ?? [])
  const loading = search ? searchLoading : isLoading
  const total = data?.tracks?.length ?? 0

  const runtime = useMemo(
    () => formatRuntime(tracks.reduce((sum: number, t: any) => sum + (t.duration_sec ?? 0), 0)),
    [tracks]
  )
  const anyPlaying = isPlaying && !!currentTrack && tracks.some((t: any) => t.id === currentTrack.id)

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    if (anyPlaying) togglePlay()
    else playQueue(tracks.map(toTrackInfo), 0)
  }

  return (
    <div className="fade-in sec-page">
      {/* ── Hero — the explore tile, expanded ── */}
      <header className="sec-hero">
        <img className="sec-hero-bg" src={art} alt="" draggable={false} />
        <div className="sec-hero-scrim" aria-hidden />
        <div className="sec-hero-inner">
          <p className="sec-eyebrow">Collection</p>
          <h1 className="sec-title">{label}</h1>
          <p className="sec-meta">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
            {runtime && <> · {runtime}</>}
          </p>
          <div className="sec-actions">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="sec-play"
            >
              {anyPlaying ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }} aria-hidden>
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
              {anyPlaying ? "Pause" : "Play All"}
            </button>
            <label className="sec-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracks..."
                aria-label="Search tracks"
              />
            </label>
          </div>
        </div>
      </header>

      {/* ── Tracklist ── */}
      <div className="sec-list">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="sec-empty">
            {search ? "No tracks match your search" : "No tracks in this section yet"}
          </div>
        ) : (
          <>
            {tracks.map((track: any, idx: number) => (
              <TrackRow
                key={track.id}
                track={track}
                index={search ? undefined : page * limit + idx}
                isLast={idx === tracks.length - 1}
              />
            ))}
            {!search && total >= limit && (
              <div className="sec-pager">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="sec-page-btn"
                >
                  Previous
                </button>
                <span className="sec-page-num">Page {page + 1}</span>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={total < limit}
                  className="sec-page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
