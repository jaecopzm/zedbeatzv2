"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import type { RadioStationsResponse } from "@/types"

function SkeletonCard() {
  return (
    <div style={{ padding: 0 }}>
      <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 10, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "70%", height: 14, marginBottom: 4 }} />
      <div className="skeleton" style={{ width: "50%", height: 12 }} />
    </div>
  )
}

function StationCard({ name, description, coverUrl, trackCount, onClick }: {
  name: string; description?: string | null; coverUrl?: string | null; trackCount: number; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="radio-card"
      style={{ cursor: "pointer", transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)", borderRadius: 4, padding: "4px 2px 8px" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ position: "relative", marginBottom: 10, borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        {coverUrl ? (
          <img src={coverUrl} alt={name} loading="lazy" className="radio-card-img" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)" }} />
        ) : (
          <div style={{ width: "100%", aspectRatio: "1", background: "linear-gradient(135deg, var(--brand-bg), var(--hover-bg))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.7}>
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
            </svg>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="radio-play-btn"
          style={{
            position: "absolute", right: 10, bottom: 10,
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--brand)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px var(--brand-shadow)",
            opacity: 0, transform: "translateY(10px) scale(0.85)",
            transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1), background 0.15s, box-shadow 0.15s",
            zIndex: 2, border: "none", cursor: "pointer",
          }}
          aria-label={`Play ${name}`}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </button>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </p>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {description || `${trackCount} tracks`}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", margin: "0 0 16px", letterSpacing: "-0.3px" }}>
        {title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

export default function RadioPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ["radio-stations"],
    queryFn: () => api.getRadioStations(),
    staleTime: 2 * 60 * 1000,
  })

  const stations: RadioStationsResponse["stations"] = data?.stations ?? {
    genre: [], curated: [], playlists: [],
  }
  const hasAny = stations.genre.length > 0 || stations.curated.length > 0 || stations.playlists.length > 0

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) { .radio-page { padding: 16px 12px 24px !important; } }
        .radio-card:hover .radio-play-btn { opacity: 1 !important; transform: translateY(0) scale(1) !important; }
        .radio-card:hover .radio-card-img { transform: scale(1.04); }
        .radio-play-btn:hover { transform: translateY(0) scale(1.1) !important; background: var(--brand-light) !important; box-shadow: 0 10px 28px var(--brand-shadow) !important; }
      `}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "0 0 32px", letterSpacing: "-0.5px" }}>
        Radio
      </h1>

      {isLoading ? (
        <>
          <div className="skeleton" style={{ width: "30%", height: 20, marginBottom: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : !hasAny ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>No stations yet</p>
          <p style={{ fontSize: 14, margin: 0 }}>Radio stations will appear here once created.</p>
        </div>
      ) : (
        <>
          {/* Personalized */}
          {user && (
            <div
              onClick={() => router.push("/radio/personalized")}
              style={{
                cursor: "pointer", marginBottom: 32, padding: 24, borderRadius: 14,
                background: "linear-gradient(135deg, var(--brand) 0%, #1d1d1f 100%)",
                display: "flex", alignItems: "center", gap: 20,
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 12, flexShrink: 0,
                background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="white" opacity={0.9}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5zm7 0l-5-5 5-5z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Made for You</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                  Personalized radio based on your likes
                </p>
              </div>
            </div>
          )}

          {/* Genre stations */}
          {stations.genre.length > 0 && (
            <Section title="Genre Stations">
              {stations.genre.map((g) => (
                <StationCard
                  key={g.id}
                  name={g.name}
                  coverUrl={g.cover_url}
                  trackCount={g.track_count}
                  onClick={() => router.push(`/radio/${g.id}`)}
                />
              ))}
            </Section>
          )}

          {/* Curated stations */}
          {stations.curated.length > 0 && (
            <Section title="Curated Stations">
              {stations.curated.map((s) => (
                <StationCard
                  key={s.id}
                  name={s.name}
                  description={s.description}
                  coverUrl={s.cover_url}
                  trackCount={s.track_count}
                  onClick={() => router.push(`/radio/${s.id}`)}
                />
              ))}
            </Section>
          )}

          {/* Radio playlists */}
          {stations.playlists.length > 0 && (
            <Section title="Radio Playlists">
              {stations.playlists.map((p) => (
                <StationCard
                  key={p.id}
                  name={p.name}
                  description={p.description}
                  coverUrl={p.cover_url}
                  trackCount={p.track_count}
                  onClick={() => router.push(`/radio/${p.id}`)}
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  )
}
