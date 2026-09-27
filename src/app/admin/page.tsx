"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

export default function AdminDashboard() {
  const { data: artists, isPending: artistsPending } = useQuery({
    queryKey: ["admin-stats-artists"],
    queryFn: () => api.adminListArtists(5000, 0),
    staleTime: 60_000,
  })
  const { data: albums, isPending: albumsPending } = useQuery({
    queryKey: ["admin-stats-albums"],
    queryFn: () => api.adminListAlbums(5000, 0),
    staleTime: 60_000,
  })
  const { data: claims, isPending: claimsPending } = useQuery({
    queryKey: ["admin-stats-claims"],
    queryFn: () => api.adminListClaims(1, 0),
    staleTime: 30_000,
  })
  const { data: tracks, isPending: tracksPending } = useQuery({
    queryKey: ["admin-stats-tracks"],
    queryFn: () => api.adminListTracks(5000, 0),
    staleTime: 60_000,
  })
  const { data: stations, isPending: stationsPending } = useQuery({
    queryKey: ["admin-stats-stations"],
    queryFn: () => api.adminListStations(),
    staleTime: 60_000,
  })

  const stats = [
    {
      label: "Tracks",
      value: tracks?.tracks?.length ?? null,
      loading: tracksPending,
      href: "/admin/sections",
    },
    {
      label: "Artists",
      value: artists?.artists?.length ?? null,
      loading: artistsPending,
      href: "/admin/artists",
    },
    {
      label: "Albums",
      value: albums?.albums?.length ?? null,
      loading: albumsPending,
      href: "/admin/albums",
    },
    {
      label: "Pending claims",
      value: claims?.total ?? null,
      loading: claimsPending,
      href: "/admin/claims",
    },
    {
      label: "Radio stations",
      value: stations?.stations?.length ?? null,
      loading: stationsPending,
      href: "/admin/radio",
    },
  ]

  const manage: Array<{
    title: string; desc: string; href: string;
    badge: string | null; urgent?: boolean;
  }> = [
    {
      title: "Artists",
      desc: "Profiles, verification and stage names",
      href: "/admin/artists",
      badge: artists?.artists?.length != null ? formatNumber(artists.artists.length) : null,
    },
    {
      title: "Albums",
      desc: "EPs, singles and collections",
      href: "/admin/albums",
      badge: albums?.albums?.length != null ? formatNumber(albums.albums.length) : null,
    },
    {
      title: "Claims",
      desc: "Approve artist verifications",
      href: "/admin/claims",
      badge: claims?.total != null && claims.total > 0 ? `${formatNumber(claims.total)} pending` : null,
      urgent: (claims?.total ?? 0) > 0,
    },
    {
      title: "Sections",
      desc: "Home page rails and track order",
      href: "/admin/sections",
      badge: null,
    },
    {
      title: "Blog",
      desc: "Stories, charts and spotlights",
      href: "/admin/blog",
      badge: null,
    },
    {
      title: "Radio",
      desc: "Curated stations and playlists",
      href: "/admin/radio",
      badge: stations?.stations?.length != null ? formatNumber(stations.stations.length) : null,
    },
    {
      title: "Credits",
      desc: "Grants, revokes and ledger",
      href: "/admin/credits",
      badge: null,
    },
    {
      title: "Spotify Import",
      desc: "Search and bulk-import tracks",
      href: "/admin/import",
      badge: null,
    },
    {
      title: "Upload Track",
      desc: "Manual upload with audio and cover",
      href: "/admin/upload",
      badge: null,
    },
  ]

  const pendingClaims = claims?.total ?? 0

  return (
    <div className="admin-page fade-in">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-text">
          <h1 className="admin-title">Overview</h1>
          <p className="admin-sub">Manage catalog, curation and system credits.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/import" className="admin-btn-primary" style={{ textDecoration: "none" }}>
            Import
          </Link>
          <Link href="/admin/upload" className="admin-btn-secondary" style={{ textDecoration: "none" }}>
            Upload
          </Link>
        </div>
      </header>

      {/* Attention banner */}
      {pendingClaims > 0 && (
        <Link
          href="/admin/claims"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textDecoration: "none",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "12px 16px",
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
              {formatNumber(pendingClaims)} claim{pendingClaims === 1 ? "" : "s"} waiting for review
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)" }}>Artists are pending verification.</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "rgb(217,119,6)" }}>Review →</span>
        </Link>
      )}

      {/* Stats */}
      <section aria-label="Catalog stats" className="admin-grid-stats">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="admin-card admin-card-lift"
            style={{ textDecoration: "none", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              {s.label}
            </span>
            {s.loading || s.value === null ? (
              <span className="skeleton" style={{ display: "block", width: 48, height: 20, borderRadius: 4, marginTop: 2 }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                {formatNumber(s.value)}
              </span>
            )}
          </Link>
        ))}
      </section>

      {/* Manage */}
      <section aria-label="Management">
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          Manage
        </p>
        <div className="admin-grid-cards">
          {manage.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="admin-card admin-card-lift"
              style={{ textDecoration: "none", padding: 14, display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>
                  {c.title}
                </span>
                {c.badge && (
                  <span className="admin-pill" style={{
                    background: c.urgent ? "rgba(245,158,11,0.12)" : "var(--hover-bg)",
                    color: c.urgent ? "rgb(180,110,5)" : "var(--muted-foreground)",
                    border: c.urgent ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)",
                  }}>
                    {c.badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                {c.desc}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
