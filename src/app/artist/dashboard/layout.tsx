"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"
import { api } from "@/lib/api"

const navLinks = [
  { href: "/artist/dashboard", label: "Overview", icon: "grid" },
  { href: "/artist/dashboard/tracks", label: "Tracks", icon: "music" },
  { href: "/artist/dashboard/albums", label: "Albums", icon: "disc" },
  { href: "/artist/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/artist/dashboard/credits", label: "Credits", icon: "credit" },
  { href: "/artist/dashboard/profile", label: "Profile", icon: "user" },
  { href: "/artist/dashboard/messages", label: "Messages", icon: "send" },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggle: toggleTheme } = useThemeStore()

  const { data: creditData } = useQuery({
    queryKey: ["artist-credits"],
    queryFn: () => api.artistGetCredits(),
    enabled: !!user,
  })

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.replace("/auth/login")
    } else if (user.role !== "artist" && user.role !== "admin") {
      router.replace("/")
    }
  }, [user, router])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileMenuOpen])

  if (!mounted || !user || (user.role !== "artist" && user.role !== "admin")) return null

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="dash-layout" style={{ display: "flex", height: "100vh", background: "var(--background)", overflow: "hidden" }}>
      {/* ── Mobile header ── */}
      <div className="mobile-dash-header">
        <button onClick={() => setMobileMenuOpen((p) => !p)} className="mobile-hamburger" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
        <img src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"} alt="ZedBeatz" style={{ height: 20 }} />
        <div style={{ width: 22 }} />
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMenu} />}

      {/* ── Studio Sidebar ── */}
      <aside className={`dash-sidebar ${mobileMenuOpen ? "dash-sidebar--open" : ""}`}>
        {/* Logo area */}
        <div style={{ padding: "20px 16px 16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"} alt="ZedBeatz" style={{ height: 22 }} />
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
              background: "var(--brand-bg)", color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Studio
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "4px 8px" }}>
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/artist/dashboard" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "var(--active-fg)" : "var(--foreground)",
                  background: active ? "var(--active-bg)" : "transparent",
                  textDecoration: "none",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)" }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                <NavIcon name={link.icon} active={active} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          {mounted && (
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
              borderRadius: 8, border: "none", background: "var(--hover-bg)",
              cursor: "pointer", color: "var(--foreground)", fontSize: 12, fontWeight: 500,
              width: "100%", marginBottom: 8, transition: "background 0.12s",
            }}
          >
            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          )}

          <Link href="/"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, color: "var(--muted-foreground)", fontSize: 12, fontWeight: 500, textDecoration: "none", transition: "background 0.12s", marginBottom: 8 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            Back to ZedBeatz
          </Link>

          {mounted && user && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: "var(--hover-bg)" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "var(--muted-foreground)" }}>Artist</p>
                </div>
                <button onClick={logout} title="Sign out"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2, borderRadius: 4, lineHeight: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
                  </svg>
                </button>
              </div>
              <Link href="/artist/dashboard/credits"
                style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "5px 10px", borderRadius: 8, textDecoration: "none", fontSize: 11, fontWeight: 600, color: (creditData?.balance?.balance ?? 0) > 0 ? "var(--brand)" : "#ef4444", transition: "background 0.12s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" /></svg>
                <span>{(creditData?.balance?.balance ?? "...") + " credits"}</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="dash-main">
        {children}
      </main>

      <style>{`
        .dash-main {
          flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden;
          padding: 28px 32px 40px; background: var(--content-bg);
        }
        .mobile-dash-header { display: none; }


        @media (max-width: 768px) {
          .dash-layout { flex-direction: column !important; }
          .dash-sidebar {
            position: fixed; top: 49px; left: 0; bottom: 0; z-index: 100;
            width: 280px; background: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            display: flex; flex-direction: column; overflow-y: auto;
            transform: translateX(-100%); transition: transform 0.25s ease;
          }
          .dash-sidebar--open { transform: translateX(0); }
          .mobile-overlay {
            position: fixed; top: 49px; left: 0; right: 0; bottom: 0; z-index: 99;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          .mobile-dash-header {
            display: flex !important; align-items: center; justify-content: center;
            padding: 10px 16px; border-bottom: 1px solid var(--border);
            background: var(--background); flex-shrink: 0;
            position: sticky; top: 0; z-index: 101;
          }
          .mobile-hamburger {
            position: absolute; left: 14px;
            background: none; border: none; cursor: pointer;
            color: var(--foreground); padding: 6px; border-radius: 0;
          }
          .dash-main {
            padding: 16px !important;
            flex: 1 !important; height: auto !important;
          }
        }
      `}</style>
    </div>
  )
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "var(--brand)" : "currentColor"
  const size = 18
  switch (name) {
    case "grid":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    case "music":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
    case "disc":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
    case "chart":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    case "user":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    case "send":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    case "credit":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" /></svg>
    default:
      return null
  }
}

function SunIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
}
function MoonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
}
