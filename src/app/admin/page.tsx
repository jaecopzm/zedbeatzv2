"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { api } from "@/lib/api"

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

function todayLabel() {
  return new Date().toLocaleDateString("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
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
      tint: "var(--brand)",
      bg: "var(--brand-bg)",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
      ),
    },
    {
      label: "Artists",
      value: artists?.artists?.length ?? null,
      loading: artistsPending,
      href: "/admin/artists",
      tint: "rgb(59,130,246)",
      bg: "rgba(59,130,246,0.12)",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      ),
    },
    {
      label: "Albums",
      value: albums?.albums?.length ?? null,
      loading: albumsPending,
      href: "/admin/albums",
      tint: "rgb(168,85,247)",
      bg: "rgba(168,85,247,0.12)",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
      ),
    },
    {
      label: "Pending claims",
      value: claims?.total ?? null,
      loading: claimsPending,
      href: "/admin/claims",
      tint: "rgb(245,158,11)",
      bg: "rgba(245,158,11,0.14)",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      ),
    },
    {
      label: "Radio stations",
      value: stations?.stations?.length ?? null,
      loading: stationsPending,
      href: "/admin/radio",
      tint: "rgb(16,185,129)",
      bg: "rgba(16,185,129,0.12)",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5a6.36 6.36 0 0 0 0 9M16.5 7.5a6.36 6.36 0 0 1 0 9" /></svg>
      ),
    },
  ]

  const workflows = [
    {
      title: "Spotify Import",
      desc: "Search, configure metadata and bulk-import tracks in one flow.",
      href: "/admin/import",
      tag: "Fastest",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      highlight: true,
    },
    {
      title: "Upload Track",
      desc: "Manual upload with audio file, artwork and full metadata.",
      href: "/admin/upload",
      tag: "Manual",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
  ]

  const manage: Array<{
    title: string; desc: string; href: string; tint: string; bg: string;
    badge: string | null; urgent?: boolean; icon: ReactNode;
  }> = [
    {
      title: "Artists",
      desc: "Profiles, verification and stage names",
      href: "/admin/artists",
      tint: "rgb(59,130,246)", bg: "rgba(59,130,246,0.12)",
      badge: artists?.artists?.length != null ? formatNumber(artists.artists.length) : null,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      ),
    },
    {
      title: "Albums",
      desc: "EPs, singles and collections",
      href: "/admin/albums",
      tint: "rgb(168,85,247)", bg: "rgba(168,85,247,0.12)",
      badge: albums?.albums?.length != null ? formatNumber(albums.albums.length) : null,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
      ),
    },
    {
      title: "Claims",
      desc: "Approve artist verifications",
      href: "/admin/claims",
      tint: "rgb(245,158,11)", bg: "rgba(245,158,11,0.14)",
      badge: claims?.total != null && claims.total > 0 ? `${formatNumber(claims.total)} pending` : null,
      urgent: (claims?.total ?? 0) > 0,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      ),
    },
    {
      title: "Sections",
      desc: "Home page rails and order",
      href: "/admin/sections",
      tint: "rgb(20,74,224)", bg: "var(--brand-bg)",
      badge: null,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
      ),
    },
    {
      title: "Blog",
      desc: "Stories, charts and spotlights",
      href: "/admin/blog",
      tint: "rgb(236,72,153)", bg: "rgba(236,72,153,0.12)",
      badge: null,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
      ),
    },
    {
      title: "Radio",
      desc: "Curated stations and playlists",
      href: "/admin/radio",
      tint: "rgb(16,185,129)", bg: "rgba(16,185,129,0.12)",
      badge: stations?.stations?.length != null ? formatNumber(stations.stations.length) : null,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5a6.36 6.36 0 0 0 0 9M16.5 7.5a6.36 6.36 0 0 1 0 9" /></svg>
      ),
    },
    {
      title: "Credits",
      desc: "Grants, revokes and ledger",
      href: "/admin/credits",
      tint: "rgb(245,158,11)", bg: "rgba(245,158,11,0.14)",
      badge: null,
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2.5" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
      ),
    },
  ]

  const pendingClaims = claims?.total ?? 0

  return (
    <div className="admin-page fade-in">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-text">
          <span className="admin-eyebrow">
            <span className="admin-eyebrow-dot" aria-hidden />
            Live console · {todayLabel()}
          </span>
          <h1 className="admin-title">Good day — here&apos;s the catalog at a glance</h1>
          <p className="admin-sub">Import music, verify artists, curate the home page and keep the station fresh. Everything is one tap away.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/import" className="admin-btn-primary" style={{ textDecoration: "none" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
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
            display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
            background: "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.06))",
            border: "1px solid rgba(245,158,11,0.32)",
            borderRadius: 16, padding: "13px 16px",
          }}
        >
          <span aria-hidden style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: "rgb(245,158,11)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              {formatNumber(pendingClaims)} claim{pendingClaims === 1 ? "" : "s"} waiting for review
            </span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--muted-foreground)" }}>Artists are blocked until you approve — tap to clear the queue.</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      )}

      {/* Stats */}
      <section aria-label="Catalog stats" className="admin-grid-stats">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="admin-card admin-card-lift"
            style={{ textDecoration: "none", padding: "14px 15px", display: "flex", alignItems: "center", gap: 12, minHeight: 84 }}
          >
            <span aria-hidden style={{
              width: 40, height: 40, borderRadius: 13, flexShrink: 0,
              background: s.bg, color: s.tint,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {s.icon}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                {s.label}
              </span>
              {s.loading || s.value === null ? (
                <span className="skeleton" style={{ display: "block", width: 52, height: 24, borderRadius: 7, marginTop: 5 }} />
              ) : (
                <span style={{ display: "block", fontSize: 23, fontWeight: 850, letterSpacing: "-0.03em", color: "var(--foreground)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
                  {formatNumber(s.value)}
                </span>
              )}
            </span>
          </Link>
        ))}
      </section>

      {/* Workflows */}
      <section aria-label="Primary workflows">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Start here
          </h2>
        </div>
        <div className="admin-grid-2">
          {workflows.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="admin-card-lift"
              style={{
                display: "flex", gap: 14, alignItems: "flex-start", textDecoration: "none",
                background: c.highlight ? "linear-gradient(140deg, var(--brand) 0%, var(--brand-light) 100%)" : "var(--card-bg)",
                color: c.highlight ? "#fff" : "var(--foreground)",
                borderRadius: 18, padding: "20px",
                border: c.highlight ? "none" : "1px solid var(--border)",
                boxShadow: c.highlight ? "0 12px 32px var(--brand-shadow)" : "var(--admin-shadow-sm)",
                minHeight: 118,
              }}
            >
              <span aria-hidden style={{
                width: 48, height: 48, borderRadius: 15, flexShrink: 0,
                background: c.highlight ? "rgba(255,255,255,0.2)" : "var(--hover-bg)",
                color: c.highlight ? "#fff" : "var(--brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {c.icon}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>{c.title}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                    padding: "3px 9px", borderRadius: 999,
                    background: c.highlight ? "rgba(255,255,255,0.22)" : "var(--brand-bg)",
                    color: c.highlight ? "#fff" : "var(--brand)",
                  }}>
                    {c.tag}
                  </span>
                </span>
                <span style={{
                  display: "block", fontSize: 13, lineHeight: 1.5,
                  color: c.highlight ? "rgba(255,255,255,0.88)" : "var(--muted-foreground)",
                }}>
                  {c.desc}
                </span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10,
                  fontSize: 13, fontWeight: 750,
                  color: c.highlight ? "#fff" : "var(--brand)",
                }}>
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Manage */}
      <section aria-label="Management">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Manage
          </h2>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{manage.length} tools</span>
        </div>
        <div className="admin-grid-cards">
          {manage.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="admin-card admin-card-lift"
              style={{ textDecoration: "none", padding: 18, display: "flex", flexDirection: "column", gap: 12, minHeight: 148 }}
            >
              <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <span aria-hidden style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: c.bg, color: c.tint,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {c.icon}
                </span>
                {c.badge && (
                  <span className="admin-pill" style={{
                    background: c.urgent ? "rgba(245,158,11,0.16)" : "var(--hover-bg)",
                    color: c.urgent ? "rgb(180,110,5)" : "var(--muted-foreground)",
                    border: c.urgent ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                  }}>
                    {c.badge}
                  </span>
                )}
              </span>
              <span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
                  {c.title}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2.4" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
                <span style={{ display: "block", fontSize: 13, color: "var(--muted-foreground)", marginTop: 3, lineHeight: 1.45 }}>
                  {c.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
