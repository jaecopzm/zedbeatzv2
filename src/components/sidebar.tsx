"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useUIStore } from "@/lib/ui-store"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"
import { LoginModal } from "@/components/login-modal"
import { SolarNavIcon } from "@/components/solar"

import { HomeIcon as HomeLinear } from "@solar-icons/react/linear/home"
import { HomeIcon as HomeDuotone } from "@solar-icons/react/bold-duotone/home"
import { MagnifierIcon as SearchLinear } from "@solar-icons/react/linear/magnifier"
import { MagnifierIcon as SearchDuotone } from "@solar-icons/react/bold-duotone/magnifier"
import { RadioIcon as RadioLinear } from "@solar-icons/react/linear/radio"
import { RadioIcon as RadioDuotone } from "@solar-icons/react/bold-duotone/radio"
import { VinylIcon as VinylLinear } from "@solar-icons/react/linear/vinyl"
import { VinylIcon as VinylDuotone } from "@solar-icons/react/bold-duotone/vinyl"
import { MicrophoneIcon as MicLinear } from "@solar-icons/react/linear/microphone"
import { MicrophoneIcon as MicDuotone } from "@solar-icons/react/bold-duotone/microphone"
import { LibraryIcon as LibraryLinear } from "@solar-icons/react/linear/library"
import { LibraryIcon as LibraryDuotone } from "@solar-icons/react/bold-duotone/library"
import { HeartIcon as HeartLinear } from "@solar-icons/react/linear/heart"
import { HeartIcon as HeartDuotone } from "@solar-icons/react/bold-duotone/heart"
import { ChatRoundDotsIcon as ChatLinear } from "@solar-icons/react/linear/chat-round-dots"
import { ChatRoundDotsIcon as ChatDuotone } from "@solar-icons/react/bold-duotone/chat-round-dots"
import { UserIcon as UserLinear } from "@solar-icons/react/linear/user"
import { UserIcon as UserDuotone } from "@solar-icons/react/bold-duotone/user"
import { SettingsMinimalisticIcon as SettingsLinear } from "@solar-icons/react/linear/settings-minimalistic"
import { SettingsMinimalisticIcon as SettingsDuotone } from "@solar-icons/react/bold-duotone/settings-minimalistic"
import { WidgetIcon as WidgetLinear } from "@solar-icons/react/linear/widget"
import { WidgetIcon as WidgetDuotone } from "@solar-icons/react/bold-duotone/widget"
import { ShieldCheckIcon as ShieldLinear } from "@solar-icons/react/linear/shield-check"
import { ShieldCheckIcon as ShieldDuotone } from "@solar-icons/react/bold-duotone/shield-check"
import { SunIcon as SunLinear } from "@solar-icons/react/linear/sun"
import { MoonIcon as MoonLinear } from "@solar-icons/react/linear/moon"
import { Logout2Icon as LogoutLinear } from "@solar-icons/react/linear/logout-2"
import { CloseCircleIcon as CloseLinear } from "@solar-icons/react/linear/close-circle"

function NavRow({
  href,
  label,
  active,
  onNavigate,
  linear,
  duotone,
}: {
  href: string
  label: string
  active: boolean
  onNavigate?: () => void
  linear: React.ComponentType<any>
  duotone: React.ComponentType<any>
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "var(--sidebar-link-padding, 8px 10px)",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--active-fg)" : "var(--foreground)",
        background: active ? "var(--active-bg)" : "transparent",
        textDecoration: "none",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)" }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
    >
      <span key={`${href}-${active ? "on" : "off"}`} className={`sb-icon${active ? " sb-icon-active" : ""}`}>
        <SolarNavIcon linear={linear} duotone={duotone} active={active} size={20} />
      </span>
      {label}
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 10px", margin: "0 0 6px" }}>
      {children}
    </p>
  )
}

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
  const closeOnNavigate = () => setSidebarOpen(false)

  return (
    <>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    <aside className={`app-sidebar${sidebarOpen ? " is-open" : ""}`}>
      {/* Logo */}
      <div className="app-sidebar-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "var(--sidebar-logo-margin, 12px)" }}>
        <img
          src={mounted ? (theme === "dark" ? "/logo-white.png" : "/logo-black.png") : "/logo-white.png"}
          alt="ZedBeatz"
          width="132"
          height="32"
          suppressHydrationWarning
          style={{ height: 32, width: "auto", objectFit: "contain", display: "block" }}
        />
        <button
          type="button"
          className="app-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <CloseLinear size={18} color="currentColor" strokeWidth={1.8} />
        </button>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", minHeight: 0 }}>
        <NavRow href="/" label="Home" active={pathname === "/"} onNavigate={closeOnNavigate} linear={HomeLinear} duotone={HomeDuotone} />
        <NavRow href="/search" label="Search" active={pathname === "/search"} onNavigate={closeOnNavigate} linear={SearchLinear} duotone={SearchDuotone} />
        <NavRow href="/radio" label="Radio" active={pathname === "/radio"} onNavigate={closeOnNavigate} linear={RadioLinear} duotone={RadioDuotone} />
        <NavRow href="/releases" label="New Releases" active={pathname === "/releases"} onNavigate={closeOnNavigate} linear={VinylLinear} duotone={VinylDuotone} />
        {isAuthed && !isArtist && (
          <NavRow href="/artist/register" label="Become an Artist" active={pathname === "/artist/register"} onNavigate={closeOnNavigate} linear={MicLinear} duotone={MicDuotone} />
        )}

        {/* Your Library */}
        {isAuthed && (
          <div style={{ marginTop: "18px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
            <SectionLabel>Your Library</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <NavRow href="/library" label="Overview" active={pathname === "/library"} onNavigate={closeOnNavigate} linear={LibraryLinear} duotone={LibraryDuotone} />
              <NavRow href="/liked" label="Liked Songs" active={pathname === "/liked"} onNavigate={closeOnNavigate} linear={HeartLinear} duotone={HeartDuotone} />
              <NavRow href="/messages" label="Messages" active={pathname === "/messages"} onNavigate={closeOnNavigate} linear={ChatLinear} duotone={ChatDuotone} />
              <NavRow href="/profile" label="Profile" active={pathname === "/profile"} onNavigate={closeOnNavigate} linear={UserLinear} duotone={UserDuotone} />
              <NavRow href="/settings" label="Settings" active={pathname === "/settings"} onNavigate={closeOnNavigate} linear={SettingsLinear} duotone={SettingsDuotone} />
            </div>
          </div>
        )}

        {/* Artist Studio */}
        {isArtist && (
          <div style={{ marginTop: "18px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
            <SectionLabel>Studio</SectionLabel>
            <NavRow href="/artist/dashboard" label="Artist Studio" active={pathname.startsWith("/artist/dashboard")} onNavigate={closeOnNavigate} linear={WidgetLinear} duotone={WidgetDuotone} />
          </div>
        )}

        {/* Admin */}
        {isAdmin && (
          <div style={{ marginTop: "18px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
            <SectionLabel>Admin</SectionLabel>
            <NavRow href="/admin" label="Dashboard" active={pathname.startsWith("/admin")} onNavigate={closeOnNavigate} linear={ShieldLinear} duotone={ShieldDuotone} />
          </div>
        )}
      </nav>

      {/* Bottom — theme / user / sign in */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--sidebar-bottom-padding, 16px)" }}>
        {mounted && (
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "6px 10px",
            borderRadius: 10, border: "none", background: "transparent",
            cursor: "pointer", color: "var(--foreground)", fontSize: 13, fontWeight: 500,
            width: "100%", marginBottom: 10, transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {theme === "dark" ? (
            <SunLinear size={20} color="var(--brand)" strokeWidth={1.8} />
          ) : (
            <MoonLinear size={20} color="var(--brand)" strokeWidth={1.8} />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        )}

        {isAuthed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                <LogoutLinear size={16} color="currentColor" strokeWidth={2} />
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
            <UserLinear size={16} color="#fff" strokeWidth={2.2} />
            Sign In
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
