"use client"

import { useMemo, type CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { genreAccent } from "@/lib/genre-art"
import { GenreMosaic } from "@/components/mosaic-art"
import { TrackList } from "@/components/track-list"
import { GenreRail } from "@/components/home/rails"
import { HorizontalScroller, ScrollRegion, ScrollChevrons } from "@/components/home/horizontal-scroller"
import { SectionHeader } from "@/components/home/section-utils"

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function GenreSkeleton() {
  return (
    <div className="genre-page" aria-hidden>
      <div className="genre-hero">
        <div className="skeleton genre-hero-bg-skel" />
        <div className="genre-hero-inner">
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 90, height: 11, marginTop: 18 }} />
          <div className="skeleton" style={{ width: "55%", height: 34, marginTop: 8 }} />
          <div className="skeleton" style={{ width: 140, height: 12, marginTop: 10 }} />
          <div className="skeleton" style={{ width: 128, height: 40, borderRadius: 999, marginTop: 16 }} />
        </div>
      </div>
      <div className="genre-body">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="genre-skel-row">
            <div className="skeleton genre-skel-num" />
            <div className="skeleton genre-skel-thumb" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ width: "55%", height: 13 }} />
              <div className="skeleton" style={{ width: "35%", height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GenrePage() {
  const { id } = useParams<{ id: string }>()
  const { playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore()

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    staleTime: 5 * 60 * 1000,
  })

  const genre = genresData?.genres?.find((g: any) => g.id === id)
  const accent = genreAccent(genre, 0)

  const { data, isLoading } = useQuery({
    queryKey: ["genre-tracks", id],
    queryFn: () => api.getTracksByGenre(id, 50),
    enabled: !!id,
  })

  const tracks = data?.tracks ?? []
  // Real artwork: the genre's most-played track cover (no extra request —
  // tracks are already loaded), generated mosaic while loading/empty.
  const topCover = (tracks[0] as any)?.cover_url as string | undefined
  const queueTracks = tracks.map((t: any) => ({
    id: t.id,
    artist_id: t.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec,
    collaborators: t.collaborators,
  }))
  const trackIds = new Set(tracks.map((t: any) => t.id))
  const anyPlaying = tracks.length > 0 && currentTrack && trackIds.has(currentTrack.id) && isPlaying
  const totalPlays = tracks.reduce((sum: number, t: any) => sum + (t.play_count ?? 0), 0)

  function handlePlayAll() {
    if (tracks.length === 0) return
    if (currentTrack && trackIds.has(currentTrack.id)) {
      togglePlay()
    } else {
      playQueue(queueTracks, 0)
    }
  }

  const topArtists = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; cover: string | null; count: number; plays: number }>()
    for (const t of tracks) {
      const key = t.artist_id ?? t.artist_name ?? "unknown"
      const prev = byId.get(key)
      if (prev) {
        prev.count += 1
        prev.plays += t.play_count ?? 0
        if (!prev.cover && t.cover_url) prev.cover = t.cover_url
      } else {
        byId.set(key, {
          id: t.artist_id,
          name: t.artist_name ?? "Unknown Artist",
          cover: t.cover_url ?? null,
          count: 1,
          plays: t.play_count ?? 0,
        })
      }
    }
    return [...byId.values()].sort((a, b) => b.plays - a.plays || b.count - a.count).slice(0, 8)
  }, [tracks])

  if (isLoading || !genresData) return <GenreSkeleton />

  return (
    <div
      className="fade-in genre-page"
      style={{ "--genre-accent": accent } as CSSProperties}
    >
      {/* ── Hero — the home card, expanded ── */}
      <header className="genre-hero">
        {topCover ? (
          <img className="genre-hero-bg" src={topCover} alt="" draggable={false} />
        ) : (
          <GenreMosaic genre={genre} index={0} className="genre-hero-bg" />
        )}
        <div className="genre-hero-scrim" aria-hidden />
        <div className="genre-hero-inner">
          <p className="genre-eyebrow">Genre</p>
          <h1 className="genre-title">{genre?.name || "Genre"}</h1>
          <p className="genre-meta">
            {tracks.length}{" "}track{tracks.length === 1 ? "" : "s"}
            {totalPlays > 0 && <>{" "}·{" "}{formatCount(totalPlays)} plays</>}
          </p>
          <button
            type="button"
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
            className="genre-play"
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
        </div>
      </header>

      {/* ── Top artists in this genre ── */}
      {topArtists.length > 1 && (
        <section className="genre-section">
          <ScrollRegion>
            <div className="genre-section-head">
              <SectionHeader label="Top artists" size="sm" actions={<ScrollChevrons />} />
            </div>
            <HorizontalScroller>
              {topArtists.map((a) => {
                const inner = (
                  <>
                    <span className="genre-artist-avatar">
                      {a.cover ? (
                        <img src={a.cover} alt={a.name} loading="lazy" draggable={false} />
                      ) : (
                        <span className="genre-artist-ph">{a.name.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <p className="genre-artist-name">{a.name}</p>
                  <p className="genre-artist-meta">
                    {a.count}{" "}track{a.count === 1 ? "" : "s"}
                  </p>
                  </>
                )
                return a.id ? (
                  <Link
                    key={a.id}
                    href={`/artist/${a.id}`}
                    className="genre-artist"
                    aria-label={`${a.name} — artist page`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={a.name} className="genre-artist">
                    {inner}
                  </div>
                )
              })}
            </HorizontalScroller>
          </ScrollRegion>
        </section>
      )}

      {/* ── Tracks ── */}
      <div className="genre-body">
        {tracks.length === 0 ? (
          <div className="genre-empty">
            <p className="genre-empty-title">No tracks yet</p>
            <p className="genre-empty-sub">This genre doesn&rsquo;t have any tracks yet.</p>
          </div>
        ) : (
          <TrackList tracks={tracks} accentColor={accent} />
        )}
      </div>

      {/* ── Endless: more genres ── */}
      <div className="genre-more">
        <GenreRail label="More genres" />
      </div>
    </div>
  )
}
