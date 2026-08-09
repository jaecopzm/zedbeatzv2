"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { useColorExtract } from "@/lib/use-color-extract"

function HeroPanel({
  track,
  index,
  isActive,
  onActivate,
}: {
  track: any
  index: number
  isActive: boolean
  onActivate: () => void
}) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const palette = useColorExtract(track.cover_url)

  const isCurrentTrack = currentTrack?.id === track.id
  const isTrackPlaying = isPlaying && isCurrentTrack
  const loadingTrackId = usePlayerStore((s) => s._loading)
  const loading = loadingTrackId === track.id

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isCurrentTrack) {
      togglePlay()
    } else {
      play({
        id: track.id,
        artist_id: track.artist_id,
        title: track.title,
        artist_name: track.artist_name ?? "",
        cover_url: track.cover_url,
        duration_sec: track.duration_sec,
        collaborators: track.collaborators,
      })
    }
  }

  const label = index === 0 ? "Featured" : "Top Pick"

  return (
    <article
      className={`hp-hero-panel${isActive ? " is-active" : ""}`}
      onClick={() => {
        onActivate()
        handlePlay()
      }}
      style={
        {
          "--hero-tint": palette.vibrant,
          "--hero-muted": palette.muted,
        } as CSSProperties
      }
    >
      <div className="hp-hero-panel-glow" aria-hidden />
      {track.cover_url ? (
        <img className="hp-hero-panel-bg" src={track.cover_url} alt="" {...(index === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })} />
      ) : (
        <div className="hp-hero-panel-fallback" />
      )}
      <div className="hp-hero-panel-scrim" />

      <div className="hp-hero-panel-art">
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} {...(index === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })} />
        ) : (
          <div className="hp-hero-panel-art-ph">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
      </div>

      <div className="hp-hero-panel-body">
        <p className="hp-hero-panel-label">{label}</p>
        <h2
          className="hp-hero-panel-title"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/track/${track.id}`)
          }}
        >
          {track.title}
        </h2>
        <p
          className="hp-hero-panel-artist"
          onClick={(e) => {
            e.stopPropagation()
            if (track.artist_id) router.push(`/artist/${track.artist_id}`)
          }}
        >
          {track.artist_name}
        </p>
        <button
          className="hp-hero-panel-play"
          onClick={handlePlay}
          aria-label={isTrackPlaying ? "Pause" : "Play"}
          type="button"
        >
          {loading ? (
            <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
          ) : isTrackPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
          <span>{loading ? "Loading" : isTrackPlaying ? "Pause" : "Play"}</span>
        </button>
      </div>
    </article>
  )
}

export function HeroBanner({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tracks", "hero"],
    queryFn: () => api.listTracks(5, 0, "best_new_songs"),
    ...(initialData ? { initialData, staleTime: 5 * 60 * 1000 } : {}),
  })
  const items = (data?.tracks ?? []).slice(0, 5)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollerRef.current
    if (!el) return
    const left = el.scrollLeft
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanLeft(left > 4)
    setCanRight(left < maxScroll - 4)

    const children = Array.from(el.children) as HTMLElement[]
    if (children.length === 0) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    children.forEach((child, i) => {
      const center = child.offsetLeft + child.offsetWidth / 2
      const dist = Math.abs(center - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActive(best)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      ro.disconnect()
    }
  }, [items.length])

  const scrollTo = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    const child = el.children[index] as HTMLElement | undefined
    if (!child) return
    el.scrollTo({ left: child.offsetLeft - 8, behavior: "smooth" })
    setActive(index)
  }

  const scrollByDir = (dir: -1 | 1) => {
    scrollTo(Math.max(0, Math.min(items.length - 1, active + dir)))
  }

  if (!isLoading && items.length === 0) return null

  const wrapClass = [
    "hp-hero-wrap",
    canLeft ? "can-scroll-left" : "",
    canRight ? "can-scroll-right" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <section className="hp-section hp-hero">
      {isLoading ? (
        <div className="hp-hero-scroller" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hp-hero-skeleton-card">
              <div className="skeleton hp-hero-skeleton-art" />
              <div className="hp-hero-skeleton-body">
                <div className="skeleton" style={{ width: "44%", height: 11, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "72%", height: 22, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: 72, height: 32, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={wrapClass}>
            <button
              className={`hp-scroll-btn hp-scroll-left${canLeft ? " can-scroll" : ""}`}
              onClick={() => scrollByDir(-1)}
              aria-label="Previous featured pick"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <div className="hp-hero-scroller" ref={scrollerRef}>
              {items.map((track: any, i: number) => (
                <HeroPanel
                  key={track.id}
                  track={track}
                  index={i}
                  isActive={active === i}
                  onActivate={() => scrollTo(i)}
                />
              ))}
            </div>
            <button
              className={`hp-scroll-btn hp-scroll-right${canRight ? " can-scroll" : ""}`}
              onClick={() => scrollByDir(1)}
              aria-label="Next featured pick"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          {items.length > 1 && (
            <div className="hp-hero-dots" role="tablist" aria-label="Featured picks">
              {items.map((track: any, i: number) => (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  className={`hp-hero-dot${active === i ? " is-active" : ""}`}
                  onClick={() => scrollTo(i)}
                  aria-label={`Show featured pick ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
