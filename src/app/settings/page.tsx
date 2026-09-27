"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useThemeStore } from "@/lib/theme-store"

import { SunIcon as SunLinear } from "@solar-icons/react/linear/sun"
import { MoonIcon as MoonLinear } from "@solar-icons/react/linear/moon"
import { UserIcon as UserLinear } from "@solar-icons/react/linear/user"
import { HeartIcon as HeartLinear } from "@solar-icons/react/linear/heart"
import { ChatRoundDotsIcon as ChatLinear } from "@solar-icons/react/linear/chat-round-dots"
import { Logout2Icon as LogoutLinear } from "@solar-icons/react/linear/logout-2"

const STORAGE_KEY = "zedbeatz_settings"

interface StoredSettings {
  autoplay: boolean
  dataSaver: boolean
}

const DEFAULTS: StoredSettings = { autoplay: true, dataSaver: false }

function loadSettings(): StoredSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }
  } catch {
    return DEFAULTS
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  // localStorage differs from the server prerender — load after mount so the
  // first render always matches, then persist changes.
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<StoredSettings>(DEFAULTS)
  useEffect(() => {
    setSettings(loadSettings())
    setMounted(true)
  }, [])
  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, mounted])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="fade-in set-page">
      <div className="set-inner">
        <h1 className="set-title">Settings</h1>
        <p className="set-sub">Tune ZedBeatz to how you listen.</p>

        {/* Appearance */}
        <section className="set-group">
          <h2 className="set-group-label">Appearance</h2>
          <div className="set-segmented" role="group" aria-label="Appearance">
            <button
              type="button"
              className={`set-segment${mounted && theme === "light" ? " is-active" : ""}`}
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
            >
              <SunLinear size={16} color="currentColor" strokeWidth={1.8} />
              Light
            </button>
            <button
              type="button"
              className={`set-segment${mounted && theme === "dark" ? " is-active" : ""}`}
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
            >
              <MoonLinear size={16} color="currentColor" strokeWidth={1.8} />
              Dark
            </button>
          </div>
        </section>

        {/* Playback */}
        <section className="set-group">
          <h2 className="set-group-label">Playback</h2>
          <ToggleRow
            label="Autoplay"
            description="Automatically play similar tracks when your queue ends"
            checked={settings.autoplay}
            onChange={(v) => setSettings((s) => ({ ...s, autoplay: v }))}
          />
          <ToggleRow
            label="Data Saver"
            description="Use lower audio quality to save mobile data"
            checked={settings.dataSaver}
            onChange={(v) => setSettings((s) => ({ ...s, dataSaver: v }))}
          />
        </section>

        {/* Account */}
        <section className="set-group">
          <h2 className="set-group-label">Account</h2>
          <SettingLink href="/profile" label="View Profile" tile="var(--brand)" icon={<UserLinear size={16} color="currentColor" strokeWidth={1.8} />} />
          <SettingLink href="/liked" label="Liked Songs" tile="#ff4e6a" icon={<HeartLinear size={16} color="currentColor" strokeWidth={1.8} />} />
          <SettingLink href="/messages" label="Messages" tile="#22b573" icon={<ChatLinear size={16} color="currentColor" strokeWidth={1.8} />} />
          {mounted && user && (
            <button type="button" className="set-row set-row-danger" onClick={handleLogout}>
              <span className="set-tile">
                <LogoutLinear size={16} color="currentColor" strokeWidth={1.8} />
              </span>
              <span className="set-row-text">Log out</span>
            </button>
          )}
        </section>
      </div>
    </div>
  )
}

function SettingLink({ href, label, tile, icon }: { href: string; label: string; tile: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="set-row" style={{ ["--tile" as string]: tile }}>
      <span className="set-tile">{icon}</span>
      <span className="set-row-text">{label}</span>
      <span className="set-chevron" aria-hidden>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  )
}

function ToggleRow({
  label, description, checked, onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="set-row" style={{ cursor: "default" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{label}</p>
        <p className="set-row-desc">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`set-switch${checked ? " is-on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span className="set-switch-knob" />
      </button>
    </div>
  )
}
