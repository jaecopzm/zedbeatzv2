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

export default function HomePage() {
  return (
    <div className="fade-in hp-page">
      <Greeting />
      <HeroBanner />
      <BestNewSongsSection />
      <RecommendationsSection />
      <RecentlyPlayedSection />
      <NewThisWeekSection />
      <AlbumsSection />
      <FeaturedArtistsSection />
      {browseSections.map((s) => (
        <BrowseSection key={s.sectionKey} {...s} />
      ))}
    </div>
  )
}
