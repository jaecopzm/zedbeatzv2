"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { usePlayerStore, type TrackInfo } from "@/lib/store"
import { useState, useEffect } from "react"

import { HorizontalScroller, ScrollRegion, ScrollChevrons } from "@/components/home/horizontal-scroller"
import { SectionHeader, EmptyState, SkeletonCards, SkeletonRow } from "@/components/home/section-utils"
import { TrackRow, TrackCardRow } from "@/components/home/track-cards"
import { AlbumCard } from "@/components/home/album-card"
import { ArtistCard } from "@/components/home/artist-card"
import { RecommendedCard } from "@/components/home/recommended-card"
import { HeroBanner } from "@/components/home/hero-banner"
import { GenreRail, JumpBackInSection, ExploreMore } from "@/components/home/rails"

const HOME_STALE_TIME = 5 * 60 * 1000

export type HomeInitialData = {
  best_new_songs?: any
  best_new_songs_more?: any
  new_this_week?: any
  albums?: any
  artists?: any
  sections?: Record<string, any>
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

  return (
    <div className="hp-greeting">
      <h1>
        Good {timeOfDay}
        {name ? `, ${name}` : ""}
      </h1>
    </div>
  )
}

function RecentlyPlayedSection() {
  const user = useAuthStore((s) => s.user)
  // Auth state is restored from localStorage, so it differs from the server
  // prerender — defer until after hydration to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getHistory(12),
    enabled: mounted && !!user,
  })
  const tracks = (data?.tracks ?? data?.history ?? []) as any[]
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!mounted) return null
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

function NewThisWeekSection({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", "new_this_week"],
    queryFn: () => api.listTracks(12, 0, "new_this_week"),
    ...(initialData ? { initialData, staleTime: HOME_STALE_TIME } : {}),
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

function AlbumsSection({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["albums-featured"],
    queryFn: () => api.listAlbums(12),
    ...(initialData ? { initialData, staleTime: HOME_STALE_TIME } : {}),
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

function FeaturedArtistsSection({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["artists-featured"],
    queryFn: () => api.listFeaturedArtists(),
    ...(initialData ? { initialData, staleTime: HOME_STALE_TIME } : {}),
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
              <div key={i} className="hp-artist-skel">
                <div className="skeleton hp-artist-skel-avatar" />
                <div className="skeleton hp-artist-skel-line" style={{ width: "70%" }} />
                <div className="skeleton hp-artist-skel-line-sm" style={{ width: "40%" }} />
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
  // Auth state is restored from localStorage, so it differs from the server
  // prerender — defer until after hydration to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.getRecommendations(12),
    enabled: mounted && !!user,
  })
  const tracks = data?.recommendations ?? []
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!mounted) return null
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

function BestNewSongsSection({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks"],
    queryFn: () => api.listTracks(12, 0, "best_new_songs"),
    ...(initialData ? { initialData, staleTime: HOME_STALE_TIME } : {}),
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

/** Second page of the charts in the same numbered-row look — keeps home scrolling endlessly. */
function MoreChartsSection({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", "best_new_songs_more"],
    queryFn: () => api.listTracks(12, 12, "best_new_songs"),
    ...(initialData ? { initialData, staleTime: HOME_STALE_TIME } : {}),
  })

  const tracks = data?.tracks ?? []
  const offset = 12
  const col1 = tracks.slice(0, 4)
  const col2 = tracks.slice(4, 8)
  const col3 = tracks.slice(8, 12)
  const columns = [col1, col2, col3]

  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!isLoading && tracks.length === 0) return null

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    playQueue(tracks.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <SectionHeader
        label="Still trending"
        href="/section/best_new_songs"
        size="sm"
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
      ) : (
        <div className="hp-bns-grid">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="hp-bns-column">
              {col.map((t: any, idx: number) => (
                <TrackRow key={t.id} track={t} index={offset + colIdx * 4 + idx} isLast={idx === col.length - 1} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** New Releases — newest uploads first, in the Top Charts numbered-row look. */
function NewReleasesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", "new_releases"],
    queryFn: () => api.listTracks(12, 0, undefined, "newest"),
    staleTime: HOME_STALE_TIME,
  })

  const tracks = (data?.tracks ?? []) as any[]

  const col1 = tracks.slice(0, 4)
  const col2 = tracks.slice(4, 8)
  const col3 = tracks.slice(8, 12)
  const columns = [col1, col2, col3]

  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!isLoading && tracks.length === 0) return null

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    playQueue(tracks.map(toTrackInfo), 0)
  }

  return (
    <section className="hp-section">
      <SectionHeader
        label="New Releases"
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

function BrowseSection({ sectionKey, label, initialData }: SectionDef & { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", sectionKey],
    queryFn: () => api.listTracks(12, 0, sectionKey),
    ...(initialData ? { initialData, staleTime: HOME_STALE_TIME } : {}),
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

export default function HomePage({ initialData }: { initialData?: HomeInitialData }) {
  return (
    <div className="fade-in hp-page">
      <Greeting />
      <HeroBanner initialData={initialData?.best_new_songs} />
      <BestNewSongsSection initialData={initialData?.best_new_songs} />
      <GenreRail />
      <JumpBackInSection />
      <RecommendationsSection />
      <RecentlyPlayedSection />
      <NewThisWeekSection initialData={initialData?.new_this_week} />
      <AlbumsSection initialData={initialData?.albums} />
      <NewReleasesSection />
      <FeaturedArtistsSection initialData={initialData?.artists} />
      <MoreChartsSection initialData={initialData?.best_new_songs_more} />
      {browseSections.slice(0, 4).map((s) => (
        <BrowseSection key={s.sectionKey} {...s} initialData={initialData?.sections?.[s.sectionKey]} />
      ))}
      {browseSections.length > 4 && <ExploreMore sections={browseSections.slice(4)} />}
    </div>
  )
}