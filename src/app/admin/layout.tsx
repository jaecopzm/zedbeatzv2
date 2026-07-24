"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/upload", label: "Upload Track", icon: "upload" },
  { href: "/admin/import", label: "Spotify Import", icon: "download" },
  { href: "/admin/artists", label: "Artists", icon: "users" },
  { href: "/admin/albums", label: "Albums", icon: "disc" },
  { href: "/admin/claims", label: "Claims", icon: "check" },
  { href: "/admin/sections", label: "Sections", icon: "layout" },
  { href: "/admin/radio", label: "Radio", icon: "radio" },
  { href: "/admin/credits", label: "Credits", icon: "credit" },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
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

  if (!mounted || !user || user.role !== "admin") return null

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--background)", overflow: "hidden" }}>
      <aside style={{
        width: 240, flexShrink: 0,
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        <div style={{ padding: "20px 16px 16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"} alt="ZedBeatz" style={{ height: 22 }} />
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
              background: "var(--brand-bg)", color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Admin
            </span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: "4px 8px" }}>
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: "var(--hover-bg)" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                <p style={{ margin: 0, fontSize: 10, color: "var(--muted-foreground)" }}>Admin</p>
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
          )}
        </div>
      </aside>

      <main style={{
        flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden",
        padding: "28px 32px 40px", background: "var(--content-bg)",
      }}>
        {children}
      </main>
    </div>
  )
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "var(--brand)" : "currentColor"
  const size = 18
  switch (name) {
    case "grid":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    case "upload":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
    case "download":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
    case "users":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case "disc":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
    case "check":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case "layout":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
    case "radio":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M22 2L11 7v1" /><path d="M11 7a5 5 0 0 0 0 10" /><path d="M15 5a9 9 0 0 1 0 14" /><circle cx="11" cy="12" r="2" /></svg>
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
