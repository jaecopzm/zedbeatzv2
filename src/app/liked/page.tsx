"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { TrackList } from "@/components/track-list"
import type { Track } from "@/types"

export default function LikedPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["my-likes"],
    queryFn: () => api.getMyLikes(),
    staleTime: 30_000,
  })

  const tracks: Track[] = data?.liked_tracks ?? []

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .liked-page { padding: 16px 12px 24px !important; }
        }
      `}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "0 0 24px", letterSpacing: "-0.5px" }}>
        Liked Songs
      </h1>

      {isLoading ? (
        <div style={{ background: "var(--card-bg)", borderRadius: 12, overflow: "hidden" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ width: "60%", height: 13 }} />
                <div className="skeleton" style={{ width: "40%", height: 11 }} />
              </div>
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted-foreground)" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No liked songs yet</p>
          <p style={{ fontSize: 14, margin: "0 0 24px" }}>Tap the heart on any track to save it here.</p>
          <button
            onClick={() => router.push("/")}
            style={{ padding: "10px 28px", borderRadius: 24, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Discover music
          </button>
        </div>
      ) : (
        <TrackList tracks={tracks} />
      )}
    </div>
  )
}
