"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Album } from "@/types"

export default function NewReleasesPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["recent-albums"],
    queryFn: () => api.listAlbums(50),
  })

  const albums: Album[] = data?.albums ?? []

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`@media (max-width: 640px) { .releases-page { padding: 16px 12px 24px !important; } }`}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "0 0 24px", letterSpacing: "-0.5px" }}>
        New Releases
      </h1>

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
      ) : albums.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>No releases yet</p>
          <p style={{ fontSize: 14, margin: 0 }}>New albums and EPs will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => router.push(`/album/${album.id}`)}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {album.cover_url ? (
                <img src={album.cover_url} alt={album.title} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginBottom: 10, display: "block" }} />
              ) : (
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                </div>
              )}
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
