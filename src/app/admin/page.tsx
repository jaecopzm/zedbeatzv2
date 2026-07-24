"use client"

import Link from "next/link"

export default function AdminDashboard() {
  const cards = [
    {
      title: "Spotify Import",
      desc: "Search, customize, and bulk-import tracks directly from Spotify",
      href: "/admin/import",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      highlight: true,
    },
    {
      title: "Upload Track",
      desc: "Upload audio files, set metadata, assign to artists and albums manually",
      href: "/admin/upload",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      ),
    },
    {
      title: "Manage Artists",
      desc: "View and edit artist profiles, verification badges, and stage names",
      href: "/admin/artists",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "Manage Albums",
      desc: "Create new albums and EP collections, assign tracks, and upload cover art",
      href: "/admin/albums",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      title: "Pending Claims",
      desc: "Review and approve/reject verification requests from artists",
      href: "/admin/claims",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      title: "Sections Manager",
      desc: "Assign tracks to home page sections and rearrange",
      href: "/admin/sections",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      title: "Radio Stations",
      desc: "Create and manage curated radio stations",
      href: "/admin/radio",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 7v1" /><path d="M11 7a5 5 0 0 0 0 10" /><path d="M15 5a9 9 0 0 1 0 14" />
          <circle cx="11" cy="12" r="2" />
        </svg>
      ),
    },
    {
      title: "Manage Credits",
      desc: "Grant or revoke artist credits for track uploads",
      href: "/admin/credits",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" /></svg>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
          Admin Control Center
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: "4px 0 0 0" }}>
          Manage catalog metadata, verify claims, and run imports
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              display: "flex",
              flexDirection: "column",
              textDecoration: "none",
              background: card.highlight ? "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)" : "var(--card-bg)",
              color: card.highlight ? "#ffffff" : "var(--foreground)",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
              border: card.highlight ? "none" : "1px solid var(--border)",
              transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)"
              e.currentTarget.style.boxShadow = card.highlight 
                ? "0 8px 24px rgba(252, 60, 68, 0.35)" 
                : "0 10px 24px rgba(0,0,0,0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)"
            }}
          >
            {/* Icon container */}
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: card.highlight ? "rgba(255, 255, 255, 0.2)" : "var(--hover-bg)",
              color: card.highlight ? "#ffffff" : "var(--active-fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}>
              {card.icon}
            </div>

            <h2 style={{
              fontSize: "17px",
              fontWeight: 650,
              margin: "0 0 6px 0",
              letterSpacing: "-0.2px"
            }}>
              {card.title}
            </h2>
            <p style={{
              fontSize: "13px",
              lineHeight: "1.4",
              color: card.highlight ? "rgba(255,255,255,0.85)" : "var(--muted-foreground)",
              margin: 0,
            }}>
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
