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

type IconPair = { linear: React.ComponentType<any>; duotone: React.ComponentType<any> }

interface RowDef {
  href: string
  label: string
  icons: IconPair
  matchPrefix?: boolean
}

function MRow({ href, label, icons, active, onNavigate }: RowDef & { active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`mm-row${active ? " is-active" : ""}`}
    >
      <span className="mm-row-icon">
        <SolarNavIcon linear={icons.linear} duotone={icons.duotone} active={active} size={21} />
      </span>
      <span className="mm-row-label">{label}</span>
    </Link>
  )
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <p className="mm-group-title">{children}</p>
}

export function MobileMenu() {
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
  const close = () => setSidebarOpen(false)

  const isActive = (href: string, prefix?: boolean) =>
    prefix ? pathname.startsWith(href) : pathname === href

  const row = (def: RowDef) => (
    <MRow
      key={def.href}
      {...def}
      active={isActive(def.href, def.matchPrefix)}
      onNavigate={close}
    />
  )

  const browse: RowDef[] = [
    { href: "/", label: "Home", icons: { linear: HomeLinear, duotone: HomeDuotone } },
    { href: "/search", label: "Search", icons: { linear: SearchLinear, duotone: SearchDuotone } },
    { href: "/radio", label: "Radio", icons: { linear: RadioLinear, duotone: RadioDuotone } },
    { href: "/releases", label: "New releases", icons: { linear: VinylLinear, duotone: VinylDuotone } },
  ]
  if (isAuthed && !isArtist) {
    browse.push({ href: "/artist/register", label: "Become an artist", icons: { linear: MicLinear, duotone: MicDuotone } })
  }
  const library: RowDef[] = [
    { href: "/library", label: "Overview", icons: { linear: LibraryLinear, duotone: LibraryDuotone } },
    { href: "/liked", label: "Liked songs", icons: { linear: HeartLinear, duotone: HeartDuotone } },
    { href: "/messages", label: "Messages", icons: { linear: ChatLinear, duotone: ChatDuotone } },
    { href: "/profile", label: "Profile", icons: { linear: UserLinear, duotone: UserDuotone } },
    { href: "/settings", label: "Settings", icons: { linear: SettingsLinear, duotone: SettingsDuotone } },
  ]

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <aside className={`mobile-menu${sidebarOpen ? " is-open" : ""}`} aria-hidden={!sidebarOpen}>
        {/* profile header */}
        <div className="mm-head">
          {isAuthed ? (
            <button type="button" className="mm-profile" onClick={() => { close(); router.push("/profile") }}>
              <span className="mm-avatar">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
              <span className="mm-profile-text">
                <span className="mm-profile-name">{user?.email}</span>
                <span className="mm-profile-role">{user?.role}</span>
              </span>
            </button>
          ) : (
            <div className="mm-guest">
              <img
                src={mounted && theme !== "dark" ? "/logo-black.png" : "/logo-white.png"}
                alt="ZedBeatz"
                className="mm-logo"
                suppressHydrationWarning
              />
              <button type="button" className="mm-signin" onClick={() => setShowLogin(true)}>
                Sign in
              </button>
            </div>
          )}
          <button type="button" className="mm-close" onClick={close} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* nav */}
        <nav className="mm-nav">
          <GroupTitle>Browse</GroupTitle>
          {browse.map(row)}
          {isAuthed && (
            <>
              <GroupTitle>Your library</GroupTitle>
              {library.map(row)}
            </>
          )}
          {isArtist && (
            <>
              <GroupTitle>Studio</GroupTitle>
              {row({ href: "/artist/dashboard", label: "Artist studio", icons: { linear: WidgetLinear, duotone: WidgetDuotone }, matchPrefix: true })}
            </>
          )}
          {isAdmin && (
            <>
              <GroupTitle>Admin</GroupTitle>
              {row({ href: "/admin", label: "Dashboard", icons: { linear: ShieldLinear, duotone: ShieldDuotone }, matchPrefix: true })}
            </>
          )}
        </nav>

        {/* footer */}
        <div className="mm-foot">
          {mounted && (
            <button type="button" className="mm-row" onClick={toggleTheme}>
              <span className="mm-row-icon mm-row-icon-tint">
                {theme === "dark" ? (
                  <SunLinear size={21} color="var(--brand)" strokeWidth={1.8} />
                ) : (
                  <MoonLinear size={21} color="var(--brand)" strokeWidth={1.8} />
                )}
              </span>
              <span className="mm-row-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
          )}
          {isAuthed && (
            <button
              type="button"
              className="mm-row mm-row-danger"
              onClick={() => { logout(); close(); router.push("/") }}
            >
              <span className="mm-row-icon mm-row-icon-danger">
                <LogoutLinear size={21} color="currentColor" strokeWidth={1.8} />
              </span>
              <span className="mm-row-label">Log out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
