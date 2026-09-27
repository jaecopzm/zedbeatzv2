"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { ArtistLinks } from "@/components/artist-links"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

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

export default function SectionPage() {
  const { slug } = useParams()
  const play = usePlayerStore((s) => s.play)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const limit = 50

  const sectionKey = typeof slug === "string" ? slug : ""
  const label = SECTION_LABELS[sectionKey] || sectionKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

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

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="fade-in" style={{ padding: "4px 28px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", gap: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--section-header)", margin: 0, letterSpacing: "-0.3px", flexShrink: 0 }}>
          {label}
        </h1>
        <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks..."
            style={{
              width: "100%", padding: "8px 12px 8px 32px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "var(--card-bg)",
              color: "var(--foreground)", fontSize: "13px", outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--active-fg)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "52px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {tracks.map((track: any, idx: number) => (
              <div
                key={track.id}
                onClick={() => play({
                  id: track.id, artist_id: track.artist_id,
                  title: track.title, artist_name: track.artist_name ?? "",
                  cover_url: track.cover_url, duration_sec: track.duration_sec,
                  collaborators: track.collaborators,
                })}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {track.cover_url ? (
                  <img src={track.cover_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "44px", height: "44px", borderRadius: "6px", background: "var(--border)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/track/${track.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {track.title}
                    </div>
                  </Link>
                  <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                    <ArtistLinks track={track} />
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "var(--muted-foreground)", flexShrink: 0 }}>
                  {formatDuration(track.duration_sec)}
                </span>
              </div>
            ))}
            {tracks.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)", fontSize: "13px" }}>
                {search ? "No tracks match your search" : "No tracks in this section"}
              </div>
            )}
          </div>

          {!search && total >= limit && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)",
                background: "var(--card-bg)", color: page === 0 ? "var(--muted-foreground)" : "var(--foreground)",
                fontSize: "13px", fontWeight: 500, cursor: page === 0 ? "not-allowed" : "pointer",
              }}>
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "var(--muted-foreground)", padding: "0 8px" }}>
                Page {page + 1}
              </span>
              <button onClick={() => setPage(page + 1)} disabled={total < limit} style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)",
                background: "var(--card-bg)", color: total < limit ? "var(--muted-foreground)" : "var(--foreground)",
                fontSize: "13px", fontWeight: 500, cursor: total < limit ? "not-allowed" : "pointer",
              }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
