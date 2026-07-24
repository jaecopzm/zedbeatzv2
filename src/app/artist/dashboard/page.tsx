"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { ShareableArtistCard } from "@/components/shareable-artist-card"

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export default function DashboardHub() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const { data: overview, isLoading } = useQuery({
    queryKey: ["artist-overview"],
    queryFn: () => api.artistOverview(),
    enabled: !!user?.artist_id,
  })

  const { data: creditData } = useQuery({
    queryKey: ["artist-credits"],
    queryFn: () => api.artistGetCredits(),
    enabled: !!user?.artist_id,
  })

  const { data: topData } = useQuery({
    queryKey: ["artist-toptracks"],
    queryFn: () => api.artistTopTracks(),
    enabled: !!user?.artist_id,
  })

  const { data: artistData } = useQuery({
    queryKey: ["artist-me"],
    queryFn: () => api.artistGetMe(),
    enabled: !!user?.artist_id,
  })

  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }} suppressHydrationWarning>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 96, borderRadius: 14 }} />
        ))}
      </div>
    )
  }

  const quickLinks = [
    { label: "Manage Tracks", href: "/artist/dashboard/tracks", icon: "<path d='M9 18V5l12-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='18' cy='16' r='3'/>", desc: "Upload, edit, and publish your music" },
    { label: "View Analytics", href: "/artist/dashboard/analytics", icon: "<polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/>", desc: "Track plays, trends, and growth" },
    { label: "Edit Profile", href: "/artist/dashboard/profile", icon: "<path d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2'/><circle cx='12' cy='7' r='4'/>", desc: "Update your artist bio and photos" },
    { label: "Buy Credits", href: "/artist/dashboard/credits", icon: "<circle cx='12' cy='12' r='10'/><path d='M12 6v12M9 9l3-3 3 3'/>", desc: `${creditData?.balance?.balance ?? 0} credit(s) remaining` },
  ]

  const stats = [
    { label: "Total Plays", value: formatNumber(overview?.total_plays ?? 0), color: "var(--brand)" },
    { label: "Followers", value: formatNumber(overview?.total_followers ?? 0), color: "rgb(249,115,22)" },
    { label: "Total Likes", value: formatNumber(overview?.total_likes ?? 0), color: "rgb(239,68,68)" },
    { label: "Published Tracks", value: formatNumber(overview?.total_tracks ?? 0), color: "rgb(16,185,129)" },
  ]

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
          Welcome{artistData?.stage_name ? `, ${artistData.stage_name}` : ""}
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>Here&apos;s what&apos;s happening with your music</p>
      </div>

      {/* ── Stat strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--card-bg)", borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 500, color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 36 }}>
        {quickLinks.map((link) => (
          <button key={link.href} onClick={() => router.push(link.href)}
            style={{
              background: "var(--card-bg)", borderRadius: 14, padding: "18px 20px",
              border: "1px solid var(--border)", cursor: "pointer", textAlign: "left",
              transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-bg)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}
                dangerouslySetInnerHTML={{ __html: link.icon }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{link.label}</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", paddingLeft: 30 }}>{link.desc}</p>
          </button>
        ))}
      </div>

      {/* ── Top Performing Songs ── */}
      {topData?.tracks && topData.tracks.length > 0 && (
        <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Top Performing Songs</h3>
            </div>
            <button onClick={() => router.push("/artist/dashboard/analytics")}
              style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              View all
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {topData.tracks.slice(0, 5).map((t: { id: string; title: string; play_count: number; like_count: number }, i: number) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, transition: "background 0.1s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{ width: 20, fontSize: 12, fontWeight: 700, color: i < 3 ? "var(--brand)" : "var(--muted-foreground)", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatNumber(t.play_count)} plays</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatNumber(t.like_count)} likes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shareable Artist Card ── */}
      {artistData && (
        <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
            </svg>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Promote Your Profile</h3>
              <p style={{ margin: "1px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>Generate a beautiful card to share on Instagram or WhatsApp</p>
            </div>
          </div>
          <ShareableArtistCard
            data={{
              stageName: artistData.stage_name,
              photoUrl: artistData.photo_url,
              verified: artistData.verified,
              totalPlays: overview?.total_plays,
              totalFollowers: overview?.total_followers,
              totalTracks: overview?.total_tracks,
              topTrackTitle: topData?.tracks?.[0]?.title,
              topTrackPlays: topData?.tracks?.[0]?.play_count,
            }}
          />
        </div>
      )}
    </div>
  )
}
