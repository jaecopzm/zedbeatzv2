"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useUIStore } from "@/lib/ui-store"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"
import { LoginModal } from "@/components/login-modal"

const mainLinks = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--brand)" : "none"} stroke={active ? "var(--brand)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const [showLogin, setShowLogin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthed = mounted && !!user
  const isArtist = mounted && (user?.role === "artist" || user?.role === "admin")
  const isAdmin = mounted && user?.role === "admin"

  return (
    <>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    <aside className={`app-sidebar${sidebarOpen ? " is-open" : ""}`}>


      {/* Search */}
      <Link
        href="/search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "var(--sidebar-link-padding, 8px 10px)",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--muted-foreground)",
          textDecoration: "none",
          transition: "background 0.15s ease, color 0.15s ease",
          marginBottom: "4px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--hover-bg)"
          e.currentTarget.style.color = "var(--foreground)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.color = "var(--muted-foreground)"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        Search
      </Link>

      {/* Main nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", minHeight: 0 }}>
        {mainLinks.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "var(--sidebar-link-padding, 8px 10px)",
                borderRadius: "2px",
                fontSize: "14px",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--active-fg)" : "var(--foreground)",
                background: active ? "var(--active-bg)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
            >
              {link.icon(active)}
              {link.label}
            </Link>
          )
        })}

        {/* Radio */}
        <Link
          href="/radio"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "var(--sidebar-link-padding, 8px 10px)",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: pathname === "/radio" ? "var(--active-fg)" : "var(--foreground)",
            background: pathname === "/radio" ? "var(--active-bg)" : "transparent",
            textDecoration: "none",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => { if (pathname !== "/radio") e.currentTarget.style.background = "var(--hover-bg)" }}
          onMouseLeave={(e) => { if (pathname !== "/radio") e.currentTarget.style.background = "transparent" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pathname === "/radio" ? "var(--brand)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <path d="M4.93 4.93a10 10 0 000 14.14M19.07 4.93a10 10 0 010 14.14" />
            <path d="M7.76 7.76a6 6 0 000 8.49M16.24 7.76a6 6 0 010 8.49" />
          </svg>
          Radio
        </Link>

          <Link
            href="/releases"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "var(--sidebar-link-padding, 8px 10px)",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: pathname === "/releases" ? "var(--active-fg)" : "var(--foreground)",
              background: pathname === "/releases" ? "var(--active-bg)" : "transparent",
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { if (pathname !== "/releases") e.currentTarget.style.background = "var(--hover-bg)" }}
            onMouseLeave={(e) => { if (pathname !== "/releases") e.currentTarget.style.background = "transparent" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pathname === "/releases" ? "var(--brand)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          New Releases
        </Link>

        {isAuthed && !isArtist && (
          <Link
            href="/artist/register"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "var(--sidebar-link-padding, 8px 10px)",
                borderRadius: "2px",
                fontSize: "14px",
                fontWeight: 500,
                color: pathname === "/artist/register" ? "var(--active-fg)" : "var(--foreground)",
                background: pathname === "/artist/register" ? "var(--active-bg)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (pathname !== "/artist/register") e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { if (pathname !== "/artist/register") e.currentTarget.style.background = "transparent" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
            </svg>
            Become an Artist
          </Link>
        )}

        {/* Your Library section */}
        {isAuthed && (
          <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: "4px" }}>
              Your Library
            </p>
            {[
              { href: "/library", label: "Overview" },
              { href: "/liked", label: "Liked Songs" },
              { href: "/messages", label: "Messages" },
              { href: "/profile", label: "Profile" },
              { href: "/settings", label: "Settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                padding: "var(--sidebar-link-padding, 7px 10px)",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: pathname === link.href ? 600 : 400,
                color: pathname === link.href ? "var(--active-fg)" : "var(--foreground)",
                background: pathname === link.href ? "var(--active-bg)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (pathname !== link.href) e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { if (pathname !== link.href) e.currentTarget.style.background = "transparent" }}
            >
              {link.label}
            </Link>
            ))}
          </div>
        )}

        {/* Artist Studio section */}
        {isArtist && (
          <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <Link
              href="/artist/dashboard"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "var(--sidebar-link-padding, 8px 10px)",
                borderRadius: 2, fontSize: 13, fontWeight: 600,
                color: pathname.startsWith("/artist/dashboard") ? "var(--active-fg)" : "var(--foreground)",
                background: "transparent",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!pathname.startsWith("/artist/dashboard")) e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pathname.startsWith("/artist/dashboard") ? "var(--brand)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Artist Studio
            </Link>
          </div>
        )}

        {/* Admin section */}
        {isAdmin && (
          <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <Link
              href="/admin"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "var(--sidebar-link-padding, 8px 10px)",
                borderRadius: 2, fontSize: 13, fontWeight: 600,
                color: pathname.startsWith("/admin") ? "var(--active-fg)" : "var(--foreground)",
                background: "transparent",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!pathname.startsWith("/admin")) e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pathname.startsWith("/admin") ? "var(--brand)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Admin Dashboard
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom — user / sign in / sign out */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--sidebar-bottom-padding, 16px)" }}>
        {mounted && (
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
            borderRadius: 2, border: "none", background: "transparent",
            cursor: "pointer", color: "var(--foreground)", fontSize: 13, fontWeight: 500,
            width: "100%", marginBottom: 10, transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        )}

        {isAuthed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* User info row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 10px", borderRadius: 10,
              background: "var(--hover-bg)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "capitalize" }}>
                  {user?.role}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  logout()
                  router.push("/")
                }}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted-foreground)", flexShrink: 0,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                title="Sign Out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            style={{
              width: "100%",
              padding: "var(--sidebar-btn-padding, 11px)",
              borderRadius: "20px",
              border: "none",
              background: "var(--brand)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.15s ease, transform 0.1s ease",
              boxShadow: "0 4px 14px var(--brand-shadow)",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88" }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Sign In
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
