"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { ArtistLinks } from "@/components/artist-links"
import { formatDuration } from "@/lib/utils"

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px" }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton" style={{ width: "60%", height: 13 }} />
        <div className="skeleton" style={{ width: "40%", height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 32, height: 11 }} />
    </div>
  )
}

export default function GenrePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    staleTime: 5 * 60 * 1000,
  })

  const genre = genresData?.genres?.find((g: any) => g.id === id)

  const { data, isLoading } = useQuery({
    queryKey: ["genre-tracks", id],
    queryFn: () => api.getTracksByGenre(id, 50),
    enabled: !!id,
  })

  const tracks = data?.tracks ?? []

  if (isLoading || !genresData) {
    return (
      <div style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
        <div className="skeleton" style={{ width: "30%", height: 28, marginBottom: 24 }} />
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .genre-page { padding: 16px 12px 24px !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--foreground)", transition: "background 0.12s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: 0, letterSpacing: "-0.5px" }}>
          {genre?.name || "Genre"}
        </h1>
      </div>

      {tracks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No tracks yet</p>
          <p style={{ fontSize: 14, margin: 0 }}>This genre doesn't have any tracks yet.</p>
        </div>
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: 12, overflow: "hidden" }}>
          {tracks.map((track: any, idx: number) => (
            <div
              key={track.id}
              onClick={() => play({
                id: track.id,
                artist_id: track.artist_id,
                title: track.title,
                artist_name: track.artist_name ?? "",
                cover_url: track.cover_url,
                duration_sec: track.duration_sec,
                collaborators: track.collaborators,
              })}
              className="track-row"
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "8px 12px",
                cursor: "pointer", borderBottom: idx < tracks.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.12s",
              }}
            >
              <span style={{ width: 30, textAlign: "center", fontSize: 14, color: "var(--muted-foreground)", fontWeight: 500, flexShrink: 0 }}>
                {idx + 1}
              </span>
              {track.cover_url ? (
                <img src={track.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "linear-gradient(135deg, #e8e8ec, #d0d0d8)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/track/${track.id}`} style={{ textDecoration: "none" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                </Link>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <ArtistLinks track={track} />
                </p>
              </div>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {formatDuration(track.duration_sec)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
