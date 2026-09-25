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

const GENRE_DUOTONES: Array<[string, string]> = [
  ["#1E5BFF", "#0B2D8A"], ["#144AE0", "#101014"], ["#3B71FF", "#0E35A3"],
  ["#0B2D8A", "#131318"], ["#2B62F0", "#0A2472"], ["#144AE0", "#1B1B22"],
]

export function GenreRail() {
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
      <SectionHeader label="Browse genres" size="sm" />
      {isLoading ? (
        <HorizontalScroller>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ flexShrink: 0, width: 148, height: 104, borderRadius: 10 }} />
          ))}
        </HorizontalScroller>
      ) : (
        <HorizontalScroller>
          {genres.map((g: any, i: number) => {
            const [from, to] = GENRE_DUOTONES[i % GENRE_DUOTONES.length]
            return (
              <button
                key={g.id}
                onClick={() => router.push(`/genres/${g.id}`)}
                style={{
                  flexShrink: 0, width: 148, height: 104, borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${from}, ${to})`,
                  cursor: "pointer", position: "relative", overflow: "hidden", textAlign: "left",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  boxShadow: "0 6px 18px -6px rgba(8,10,25,0.45)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 30px -8px rgba(8,10,25,0.55)" }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 18px -6px rgba(8,10,25,0.45)" }}
              >
                <span style={{ position: "absolute", right: -18, bottom: -18, width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
                <span style={{ position: "absolute", left: 14, bottom: 12, right: 12, fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.name}
                </span>
              </button>
            )
          })}
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

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["resume"],
    queryFn: () => api.getResume(10),
    enabled: !!user,
    staleTime: 30_000,
  })

  // Re-read localStorage points when playback state changes.
  useEffect(() => {
    setLocalTick((t) => t + 1)
  }, [currentTrack?.id])

  const merged = (() => {
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
                style={{
                  flexShrink: 0, width: 300, display: "flex", alignItems: "center", gap: 12,
                  padding: 10, borderRadius: 12, background: "var(--card-bg)",
                  border: "1px solid var(--border)", cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(18,18,28,0.06), 0 10px 28px -12px rgba(18,18,28,0.18)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(18,18,28,0.07), 0 16px 36px -12px rgba(18,18,28,0.25)" }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(18,18,28,0.06), 0 10px 28px -12px rgba(18,18,28,0.18)" }}
              >
                {track.cover_url ? (
                  <span style={{ position: "relative", width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, display: "block" }}>
                    <CoverImage src={track.cover_url} alt="" sizes="120px" />
                  </span>
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.title}
                  </p>
                  <p style={{ margin: "2px 0 6px", fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>
                    Resume from {fmt(position)}
                  </p>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--hover-bg)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "var(--brand)" }} />
                  </div>
                </div>
                <button
                  aria-label={`Dismiss ${track.title}`}
                  onClick={(e) => { e.stopPropagation(); dismiss(track.id) }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 6, flexShrink: 0, alignSelf: "flex-start" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )
          })}
        </HorizontalScroller>
      )}
    </section>
  )
}

export function ExploreMore({ sections }: { sections: { sectionKey: string; label: string }[] }) {
  const router = useRouter()
  return (
    <section className="hp-section">
      <SectionHeader label="More to explore" size="sm" />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "4px 0 8px" }}>
        {sections.map((s) => (
          <button
            key={s.sectionKey}
            onClick={() => router.push(`/section/${s.sectionKey}`)}
            style={{
              padding: "12px 22px", borderRadius: 999, cursor: "pointer",
              border: "1px solid var(--border)", background: "var(--card-bg)",
              color: "var(--foreground)", fontSize: 14, fontWeight: 600,
              transition: "background 0.15s ease, transform 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card-bg)" }}
          >
            {s.label} →
          </button>
        ))}
      </div>
    </section>
  )
}
