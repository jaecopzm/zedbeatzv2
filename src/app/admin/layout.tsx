"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"

type NavItem = { href: string; label: string; icon: string }

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "grid" }],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/upload", label: "Upload Track", icon: "upload" },
      { href: "/admin/import", label: "Spotify Import", icon: "download" },
      { href: "/admin/artists", label: "Artists", icon: "users" },
      { href: "/admin/albums", label: "Albums", icon: "disc" },
    ],
  },
  {
    title: "Curation",
    items: [
      { href: "/admin/claims", label: "Claims", icon: "check" },
      { href: "/admin/sections", label: "Sections", icon: "layout" },
      { href: "/admin/blog", label: "Blog", icon: "pen" },
      { href: "/admin/radio", label: "Radio", icon: "radio" },
    ],
  },
  {
    title: "System",
    items: [{ href: "/admin/credits", label: "Credits", icon: "credit" }],
  },
]

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/upload": "Upload Track",
  "/admin/import": "Spotify Import",
  "/admin/artists": "Artists",
  "/admin/albums": "Albums",
  "/admin/claims": "Claims",
  "/admin/sections": "Sections",
  "/admin/blog": "Blog",
  "/admin/radio": "Radio",
  "/admin/credits": "Credits",
}

function titleFor(pathname: string) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  const match = Object.keys(ROUTE_TITLES)
    .filter((k) => k !== "/admin")
    .find((k) => pathname.startsWith(k + "/"))
  return match ? ROUTE_TITLES[match] : "Admin"
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(href + "/")
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggle: toggleTheme } = useThemeStore()

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.replace("/auth/login")
    } else if (user.role !== "admin") {
      router.replace("/")
    }
  }, [user, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [sidebarOpen])

  const crumbs = useMemo(() => {
    const current = titleFor(pathname)
    return current === "Dashboard" ? ["Admin"] : ["Admin", current]
  }, [pathname])

  if (!mounted || !user || user.role !== "admin") {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--brand)", animation: "app-spin 0.8s linear infinite" }} />
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>Checking access…</p>
        </div>
      </div>
    )
  }

  const initial = user.email?.charAt(0).toUpperCase() ?? "A"

  return (
    <div style={{ display: "flex", flex: "1 1 0", height: "100dvh", minHeight: 0, overflow: "hidden", background: "var(--background)" }}>
      {/* Mobile scrim */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="admin-sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`admin-sidebar${sidebarOpen ? " admin-sidebar-open" : ""}`}
        aria-label="Admin navigation"
        style={{
          width: 240, flexShrink: 0,
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", overscrollBehavior: "contain",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Link href="/" aria-label="Back to ZedBeatz home" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", minWidth: 0 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"} alt="" style={{ height: 14, filter: "brightness(0) invert(1)" }} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.2 }}>ZedBeatz</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--muted-foreground)" }}>
                Admin
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="admin-icon-btn admin-icon-btn-sm"
            style={{ display: "none" }}
            data-close-btn
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <style>{`@media (max-width: 900px) { [data-close-btn] { display: inline-flex !important; } }`}</style>

        {/* Nav */}
        <nav aria-label="Admin sections" style={{ flex: 1, padding: "8px 8px 12px", display: "flex", flexDirection: "column", gap: 16 }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p style={{
                margin: "0 0 4px", padding: "0 8px",
                fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}>
                {group.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {group.items.map((link) => {
                  const active = isActive(pathname, link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 9,
                        padding: "7px 9px", borderRadius: 7, minHeight: 34,
                        fontSize: 13, fontWeight: active ? 600 : 450,
                        color: active ? "var(--foreground)" : "var(--muted-foreground)",
                        background: active ? "var(--hover-bg)" : "transparent",
                        textDecoration: "none",
                        transition: "background 0.12s ease, color 0.12s ease",
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: active ? "var(--brand)" : "currentColor",
                      }}>
                        <NavIcon name={link.icon} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {link.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="admin-icon-btn"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{ flex: 1, width: "auto", height: 32, gap: 6, fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <Link
              href="/"
              aria-label="Back to ZedBeatz site"
              className="admin-icon-btn"
              style={{ flex: 1, width: "auto", height: 32, gap: 6, fontSize: 12, fontWeight: 500, color: "var(--foreground)", textDecoration: "none" }}
              onClick={() => setSidebarOpen(false)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>
              <span>Site</span>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--hover-bg)" }}>
            <div aria-hidden style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 600,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="admin-icon-btn admin-icon-btn-sm"
              style={{ border: "none", background: "transparent" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content column ── */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Mobile slim topbar */}
        <header
          className="admin-topbar"
          style={{
            position: "sticky", top: 0, zIndex: 800,
            alignItems: "center", gap: 10,
            padding: "10px 14px",
            paddingTop: "calc(10px + env(safe-area-inset-top))",
            background: "color-mix(in srgb, var(--background) 90%, transparent)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button type="button" aria-label="Open menu" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="admin-icon-btn admin-icon-btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
          </button>
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, minWidth: 0, flex: 1 }}>
            {crumbs.map((c, i) => (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {i > 0 && <span aria-hidden style={{ color: "var(--muted-foreground)" }}>/</span>}
                <span style={{
                  fontWeight: i === crumbs.length - 1 ? 600 : 450,
                  color: i === crumbs.length - 1 ? "var(--foreground)" : "var(--muted-foreground)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {c}
                </span>
              </span>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="admin-icon-btn admin-icon-btn-sm"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <main
          className="admin-main"
          style={{
            flex: 1, minWidth: 0, width: "100%",
            minHeight: 0,
            overflowY: "auto", overflowX: "hidden",
            padding: "24px clamp(14px, 3.2vw, 32px) 48px",
            background: "var(--content-bg)",
          }}
        >
          <div className="admin-page">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function NavIcon({ name }: { name: string }) {
  const size = 16
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" } as const
  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    case "upload":
      return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
    case "download":
      return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
    case "users":
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case "disc":
      return <svg {...common}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
    case "check":
      return <svg {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case "layout":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case "radio":
      return <svg {...common}><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5a6.36 6.36 0 0 0 0 9M16.5 7.5a6.36 6.36 0 0 1 0 9M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" /></svg>
    case "credit":
      return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
    case "pen":
      return <svg {...common}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
    default:
      return null
  }
}

function SunIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="4.9" y1="4.9" x2="6.3" y2="6.3" /><line x1="17.7" y1="17.7" x2="19.1" y2="19.1" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /><line x1="4.9" y1="19.1" x2="6.3" y2="17.7" /><line x1="17.7" y1="6.3" x2="19.1" y2="4.9" /></svg>
}
function MoonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
}
