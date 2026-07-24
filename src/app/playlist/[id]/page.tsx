"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { TrackList } from "@/components/track-list"

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, gap: 6, display: "flex", flexDirection: "column" }}>
        <div className="skeleton" style={{ width: "60%", height: 13 }} />
        <div className="skeleton" style={{ width: "40%", height: 11 }} />
      </div>
    </div>
  )
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Try to find playlist from cached my-playlists data
  const cached = queryClient.getQueryData<{ playlists: any[] }>(["my-playlists"])
  const cachedPlaylist = cached?.playlists?.find((p: any) => p.id === id)

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => api.getPlaylist(id),
    enabled: !!id,
    retry: 0,
  })

  const display = playlist ?? cachedPlaylist
  const displayTracks: any[] = (playlist?.tracks ?? display?.tracks ?? []) as any[]

  if (isLoading) {
    return (
      <div style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
        <div className="skeleton" style={{ width: "30%", height: 28, marginBottom: 24 }} />
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) { .playlist-page { padding: 16px 12px 24px !important; } }
      `}</style>

      <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
        {/* Cover */}
        <div style={{ width: 200, height: 200, borderRadius: 12, background: display?.cover_url ? `url(${display.cover_url}) center/cover` : "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", flexShrink: 0, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!display?.cover_url && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4"><path d="M9 18H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v10" /><path d="M3 10h18" /><path d="M14 14l4 2-4 2" /></svg>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6 }}>
            Playlist
          </span>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 48px)", fontWeight: 800, color: "var(--foreground)", margin: "0 0 8px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            {display?.title || "Playlist"}
          </h1>
          {display?.description && (
            <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{display.description}</p>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              onClick={() => router.push("/")}
              style={{ padding: "8px 24px", borderRadius: 24, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Browse Music
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      {displayTracks.length > 0 ? (
        <TrackList tracks={displayTracks} />
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "32px 24px", textAlign: "center", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 4px" }}>No tracks yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>This playlist doesn&rsquo;t have any tracks.</p>
        </div>
      )}
    </div>
  )
}
