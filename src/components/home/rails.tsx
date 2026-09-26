"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { usePlayerStore, type TrackInfo, loadLocalResumePoints, removeLocalResumePoint } from "@/lib/store"
import { useState, useEffect } from "react"

import { HorizontalScroller, ScrollRegion, ScrollChevrons } from "@/components/home/horizontal-scroller"
import { SectionHeader, EmptyState, SkeletonCards } from "@/components/home/section-utils"
import { CoverImage } from "@/components/cover-image"

import { genreArt } from "@/lib/genre-art"

export function GenreRail({ label = "Browse genres" }: { label?: string }) {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    staleTime: 5 * 60 * 1000,
  })
  const genres = data?.genres ?? []

  if (!isLoading && genres.length === 0) return null

  return (
    <section className="hp-section">
      <SectionHeader label={label} size="sm" />
      {isLoading ? (
        <HorizontalScroller>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton hp-genre-skel" />
          ))}
        </HorizontalScroller>
      ) : (
        <HorizontalScroller>
          {genres.map((g: any, i: number) => (
            <button
              key={g.id}
              type="button"
              onClick={() => router.push(`/genres/${g.id}`)}
              className="hp-genre-card"
              aria-label={`Browse ${g.name}`}
            >
              <img
                className="hp-genre-img"
                src={genreArt(g, i)}
                alt=""
                loading="lazy"
                draggable={false}
              />
              <span className="hp-genre-scrim" aria-hidden />
              <span className="hp-genre-label">{g.name}</span>
            </button>
          ))}
        </HorizontalScroller>
      )}
    </section>
  )
}

export function JumpBackInSection() {
  const user = useAuthStore((s) => s.user)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const playAt = usePlayerStore((s) => s.playAt)
  const queryClient = useQueryClient()
  const [localTick, setLocalTick] = useState(0)
  // Browser-only state (auth token, localStorage resume points) differs from
  // the server prerender, so defer rendering until after hydration to avoid
  // a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["resume"],
    queryFn: () => api.getResume(10),
    enabled: mounted && !!user,
    staleTime: 30_000,
  })

  // Re-read localStorage points when playback state changes.
  useEffect(() => {
    if (mounted) setLocalTick((t) => t + 1)
  }, [mounted, currentTrack?.id])

  const merged = (() => {
    // Server HTML and the first client render must agree: no localStorage
    // reads before mount.
    if (!mounted) return [] as { track: TrackInfo; position: number; duration: number; at: number }[]
    const byId = new Map<string, { track: TrackInfo; position: number; duration: number; at: number }>()
    if (localTick >= 0) {
      for (const p of loadLocalResumePoints()) {
        if (currentTrack && p.track.id === currentTrack.id) continue
        byId.set(p.track.id, { track: p.track, position: p.position, duration: p.duration, at: p.updatedAt })
      }
    }
    for (const r of serverData?.resume ?? []) {
      if (currentTrack && r.track_id === currentTrack.id) continue
      const at = Date.parse(r.updated_at || "") || 0
      const prev = byId.get(r.track_id)
      if (prev && prev.at >= at) continue
      if (!r.title) continue
      byId.set(r.track_id, {
        track: {
          id: r.track_id,
          artist_id: r.artist_id,
          title: r.title,
          artist_name: r.artist_name ?? "",
          cover_url: r.cover_url ?? null,
          duration_sec: r.duration_sec,
          collaborators: [],
        },
        position: r.position_sec,
        duration: r.duration_sec,
        at,
      })
    }
    return [...byId.values()]
      .filter((m) => m.position >= 5 && (m.duration <= 0 || m.position / m.duration <= 0.95))
      .sort((a, b) => b.at - a.at)
      .slice(0, 10)
  })()

  if (!mounted) return null
  if (!isLoading && merged.length === 0) return null

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`

  const dismiss = (trackId: string) => {
    removeLocalResumePoint(trackId)
    if (user) {
      api.deleteResume(trackId)
        .then(() => queryClient.invalidateQueries({ queryKey: ["resume"] }))
        .catch(() => {})
    }
    setLocalTick((t) => t + 1)
  }

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader label="Jump Back In" size="sm" actions={<ScrollChevrons />} />
        {isLoading && merged.length === 0 ? (
          <HorizontalScroller>
            <SkeletonCards count={4} />
          </HorizontalScroller>
        ) : (
          <HorizontalScroller>
            {merged.map(({ track, position, duration }) => {
              const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0
              return (
                <div
                  key={track.id}
                  onClick={() => playAt(track, position)}
                  className="hp-jump-card"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playAt(track, position) } }}
                >
                  {track.cover_url ? (
                    <span className="hp-jump-art">
                      <CoverImage src={track.cover_url} alt="" sizes="120px" />
                    </span>
                  ) : (
                    <span className="hp-jump-art hp-jump-art-ph" aria-hidden />
                  )}
                  <div className="hp-jump-body">
                    <p className="hp-jump-title">{track.title}</p>
                    <p className="hp-jump-resume">Resume from {fmt(position)}</p>
                    <div className="hp-jump-progress">
                      <div className="hp-jump-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    aria-label={`Dismiss ${track.title}`}
                    onClick={(e) => { e.stopPropagation(); dismiss(track.id) }}
                    className="hp-jump-dismiss"
                    type="button"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              )
            })}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

export function ExploreMore({ sections }: { sections: { sectionKey: string; label: string }[] }) {
  const router = useRouter()
  return (
    <section className="hp-section">
      <SectionHeader label="More to explore" size="sm" />
      <div className="hp-explore-wrap">
        {sections.map((s) => (
          <button
            key={s.sectionKey}
            type="button"
            onClick={() => router.push(`/section/${s.sectionKey}`)}
            className="hp-explore-pill"
          >
            {s.label}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>
    </section>
  )
}
