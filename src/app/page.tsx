"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { usePlayerStore, type TrackInfo, loadLocalResumePoints, removeLocalResumePoint } from "@/lib/store"
import { useState, useEffect } from "react"

import { HorizontalScroller, ScrollRegion, ScrollChevrons } from "@/components/home/horizontal-scroller"
import { SectionHeader, EmptyState, SkeletonCards, SkeletonRow } from "@/components/home/section-utils"
import { TrackRow, TrackCardRow } from "@/components/home/track-cards"
import { AlbumCard } from "@/components/home/album-card"
import { ArtistCard } from "@/components/home/artist-card"
import { RecommendedCard } from "@/components/home/recommended-card"
import { CoverImage } from "@/components/cover-image"
import { HeroBanner } from "@/components/home/hero-banner"

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

function Greeting() {
  const user = useAuthStore((s) => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="hp-greeting">
        <div className="skeleton hp-greeting-skel" />
      </div>
    )
  }

  const hour = new Date().getHours()
  let timeOfDay = "evening"
  if (hour < 12) timeOfDay = "morning"
  else if (hour < 17) timeOfDay = "afternoon"

  const name = user?.email?.split("@")[0]
  const dateLine = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="hp-greeting" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
      <h1>
        Good {timeOfDay}
        {name ? `, ${name}` : ""}
      </h1>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
        {dateLine} · Fresh drops daily
      </p>
    </div>
  )
}

function RecentlyPlayedSection() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getHistory(12),
    enabled: !!user,
  })
  const tracks = (data?.tracks ?? data?.history ?? []) as any[]
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!user) return null
  if (!isLoading && tracks.length === 0) return null

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    playQueue(tracks.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader
          label="Recently Played"
          size="sm"
          actions={<ScrollChevrons />}
          onPlayAll={tracks.length > 0 ? handlePlayAll : undefined}
        />
        {isLoading ? (
          <HorizontalScroller>
            <SkeletonCards count={6} />
          </HorizontalScroller>
        ) : (
          <HorizontalScroller>
            {tracks.map((track: any) => (
              <TrackCardRow key={track.id} track={track} />
            ))}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

function NewThisWeekSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", "new_this_week"],
    queryFn: () => api.listTracks(12, 0, "new_this_week"),
  })
  const items = data?.tracks ?? []
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!isLoading && items.length === 0) return null

  const handlePlayAll = () => {
    if (items.length === 0) return
    playQueue(items.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader
          label="New This Week"
          href="/section/new_this_week"
          size="sm"
          onPlayAll={items.length > 0 ? handlePlayAll : undefined}
          actions={<ScrollChevrons />}
        />
        {isLoading ? (
          <HorizontalScroller>
            <SkeletonCards count={6} />
          </HorizontalScroller>
        ) : (
          <HorizontalScroller>
            {items.map((track: any) => (
              <TrackCardRow key={track.id} track={track} />
            ))}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

function AlbumsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["albums-featured"],
    queryFn: () => api.listAlbums(12),
  })
  const albums = data?.albums ?? []
  if (!isLoading && albums.length === 0) return null

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader label="New Albums" href="/releases" size="sm" actions={<ScrollChevrons />} />
        {isLoading ? (
          <HorizontalScroller>
            <SkeletonCards count={6} />
          </HorizontalScroller>
        ) : albums.length === 0 ? (
          <EmptyState message="No albums published yet" />
        ) : (
          <HorizontalScroller>
            {albums.map((album: any) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

function FeaturedArtistsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["artists-featured"],
    queryFn: () => api.listFeaturedArtists(),
  })
  const artists = data?.artists ?? []
  if (!isLoading && artists.length === 0) return null

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader label="Featured Artists" size="sm" actions={<ScrollChevrons />} />
        {isLoading ? (
          <HorizontalScroller>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: "148px", textAlign: "center" }}>
                <div className="skeleton" style={{ width: "116px", height: "116px", borderRadius: "50%", margin: "0 auto 12px" }} />
                <div className="skeleton" style={{ width: "70%", height: "12px", margin: "0 auto 4px" }} />
                <div className="skeleton" style={{ width: "40%", height: "10px", margin: "0 auto" }} />
              </div>
            ))}
          </HorizontalScroller>
        ) : artists.length === 0 ? (
          <EmptyState message="No featured artists available" />
        ) : (
          <HorizontalScroller>
            {artists.map((artist: any) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

function RecommendationsSection() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.getRecommendations(12),
    enabled: !!user,
  })
  const tracks = data?.recommendations ?? []
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!user) return null
  if (!isLoading && tracks.length === 0) return null

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    playQueue(tracks.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader
          label="Made for You"
          size="sm"
          onPlayAll={tracks.length > 0 ? handlePlayAll : undefined}
          actions={<ScrollChevrons />}
        />
        {isLoading ? (
          <HorizontalScroller>
            <SkeletonCards count={6} />
          </HorizontalScroller>
        ) : tracks.length === 0 ? (
          <EmptyState
            message="Listen to a few tracks to get personalised picks"
            cta="Explore music"
            onCta={() => (window.location.href = "/releases")}
          />
        ) : (
          <HorizontalScroller>
            {tracks.map((t: any) => (
              <RecommendedCard key={t.id} track={t} />
            ))}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

const GENRE_DUOTONES: Array<[string, string]> = [
  ["#1E5BFF", "#0B2D8A"], ["#144AE0", "#101014"], ["#3B71FF", "#0E35A3"],
  ["#0B2D8A", "#131318"], ["#2B62F0", "#0A2472"], ["#144AE0", "#1B1B22"],
]

function GenreRail() {
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
            <div key={i} className="skeleton" style={{ flexShrink: 0, width: 148, height: 76, borderRadius: 14 }} />
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
                  flexShrink: 0, width: 148, height: 76, borderRadius: 14, border: "none",
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

function JumpBackInSection() {
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

function BestNewSongsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks"],
    queryFn: () => api.listTracks(12, 0, "best_new_songs"),
  })

  const tracks = data?.tracks ?? []
  const col1 = tracks.slice(0, 4)
  const col2 = tracks.slice(4, 8)
  const col3 = tracks.slice(8, 12)
  const columns = [col1, col2, col3]

  const playQueue = usePlayerStore((s) => s.playQueue)

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    playQueue(tracks.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <SectionHeader
        label="Top Charts"
        href="/section/best_new_songs"
        size="lg"
        onPlayAll={tracks.length > 0 ? handlePlayAll : undefined}
      />
      {isLoading ? (
        <div className="hp-bns-grid">
          {Array.from({ length: 3 }).map((_, colIdx) => (
            <div key={colIdx} className="hp-bns-column">
              {Array.from({ length: 4 }).map((_, rIdx) => (
                <div key={rIdx}>
                  <SkeletonRow index={colIdx * 4 + rIdx} />
                  {rIdx < 3 && <div className="hp-track-divider" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <EmptyState message="No new songs available right now — check back soon." />
      ) : (
        <div className="hp-bns-grid">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="hp-bns-column">
              {col.map((t: any, idx: number) => (
                <TrackRow key={t.id} track={t} index={colIdx * 4 + idx} isLast={idx === col.length - 1} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

type SectionDef = { sectionKey: string; label: string }

const browseSections: SectionDef[] = [
  { sectionKey: "zed_hip_hop", label: "Zambian Hip Hop" },
  { sectionKey: "zed_afrobeats", label: "Zambian Afrobeats" },
  { sectionKey: "zed_gospel", label: "Zambian Gospel" },
  { sectionKey: "zed_rnb", label: "Zambian R&B" },
  { sectionKey: "zed_dancehall", label: "Zambian Dancehall" },
  { sectionKey: "zed_kalindula", label: "Kalindula" },
  { sectionKey: "zed_oldies", label: "Zed Oldies" },
  { sectionKey: "zed_bangers", label: "Zed Bangers" },
  { sectionKey: "zed_collabos", label: "Big Collabos" },
  { sectionKey: "fresh_voices", label: "Fresh Voices" },
  { sectionKey: "throwback_thursday", label: "Throwback Thursday" },
]

function BrowseSection({ sectionKey, label }: SectionDef) {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", sectionKey],
    queryFn: () => api.listTracks(12, 0, sectionKey),
  })
  const items = data?.tracks ?? []
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!isLoading && items.length === 0) return null

  const handlePlayAll = () => {
    if (items.length === 0) return
    playQueue(items.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <ScrollRegion>
        <SectionHeader
          label={label}
          href={`/section/${sectionKey}`}
          size="sm"
          onPlayAll={items.length > 0 ? handlePlayAll : undefined}
          actions={<ScrollChevrons />}
        />
        {isLoading ? (
          <HorizontalScroller>
            <SkeletonCards count={6} />
          </HorizontalScroller>
        ) : (
          <HorizontalScroller>
            {items.map((track: any) => (
              <TrackCardRow key={track.id} track={track} />
            ))}
          </HorizontalScroller>
        )}
      </ScrollRegion>
    </section>
  )
}

function ExploreMore({ sections }: { sections: SectionDef[] }) {
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

export default function HomePage() {
  return (
    <div className="fade-in hp-page">
      <Greeting />
      <HeroBanner />
      <BestNewSongsSection />
      <GenreRail />
      <JumpBackInSection />
      <RecommendationsSection />
      <RecentlyPlayedSection />
      <NewThisWeekSection />
      <AlbumsSection />
      <FeaturedArtistsSection />
      {browseSections.slice(0, 4).map((s) => (
        <BrowseSection key={s.sectionKey} {...s} />
      ))}
      {browseSections.length > 4 && <ExploreMore sections={browseSections.slice(4)} />}
    </div>
  )
}
