"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/lib/api"
import { CoverImage } from "@/components/cover-image"
import type { Album } from "@/types"

type Filter = "all" | "album" | "single" | "ep"

const FILTERS: Array<[Filter, string]> = [
  ["all", "All"],
  ["album", "Albums"],
  ["single", "Singles"],
  ["ep", "EPs"],
]

export default function NewReleasesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["recent-albums"],
    queryFn: () => api.listAlbums(50),
  })

  const albums: Album[] = data?.albums ?? []
  const shown = filter === "all" ? albums : albums.filter((a) => a.type === filter)

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`@media (max-width: 640px) { .releases-page { padding: 16px 12px 24px !important; } }`}</style>

      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
        Fresh drops
      </span>
      <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700, color: "var(--foreground)", margin: "6px 0 4px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
        New Releases
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)" }}>
        {albums.length} release{albums.length === 1 ? "" : "s"} this season
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {FILTERS.map(([id, label]) => {
          const active = filter === id
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                padding: "8px 18px", borderRadius: 999, cursor: "pointer",
                border: active ? "none" : "1px solid var(--border)",
                background: active ? "var(--foreground)" : "transparent",
                color: active ? "var(--content-bg)" : "var(--foreground)",
                fontSize: 13, fontWeight: 600, transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ padding: 0 }}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 8, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: "70%", height: 14, marginBottom: 4 }} />
              <div className="skeleton" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Nothing here yet</p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {filter === "all" ? "New albums and EPs will appear here." : `No ${FILTERS.find(([f]) => f === filter)?.[1].toLowerCase()} out right now — try another filter.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
          {shown.map((album) => (
            <div
              key={album.id}
              onClick={() => router.push(`/album/${album.id}`)}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginBottom: 10 }}>
                {album.cover_url ? (
                  <CoverImage src={album.cover_url} alt={album.title} sizes="(max-width: 640px) 45vw, 240px" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  </div>
                )}
              </div>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)" }}>
                {album.artist_name || "Artist"} {album.released_at ? `· ${new Date(album.released_at).getFullYear()}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
