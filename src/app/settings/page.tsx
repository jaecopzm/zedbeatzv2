"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "zedbeatz_settings"

interface StoredSettings {
  autoplay: boolean
  dataSaver: boolean
}

function loadSettings(): StoredSettings {
  if (typeof window === "undefined") return { autoplay: true, dataSaver: false }
  try {
    return { autoplay: true, dataSaver: false, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }
  } catch { return { autoplay: true, dataSaver: false } }
}

function saveSettings(s: StoredSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoredSettings>(loadSettings)

  useEffect(() => { saveSettings(settings) }, [settings])

  return (
    <div className="fade-in settings-page" style={{ padding: "32px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .settings-page { padding: 16px 12px 24px !important; }
        }
        .settings-link:hover { opacity: 0.7; }
      `}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--foreground)", margin: "0 0 24px", letterSpacing: "-0.5px" }}>Settings</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Playback</h3>

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
            last
          />
        </section>

        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Account</h3>
          <a href="/profile" className="settings-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", color: "var(--foreground)", fontSize: 14, textDecoration: "none", borderBottom: "1px solid var(--border)", transition: "opacity 0.15s" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0 }}>P</span>
            View Profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
          </a>
          <a href="/liked" className="settings-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", color: "var(--foreground)", fontSize: 14, textDecoration: "none", borderBottom: "1px solid var(--border)", transition: "opacity 0.15s" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0 }}>L</span>
            Liked Songs
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
          </a>
          <a href="/messages" className="settings-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", color: "var(--foreground)", fontSize: 14, textDecoration: "none", transition: "opacity 0.15s" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0 }}>M</span>
            Messages
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
          </a>
        </section>
      </div>
    </div>
  )
}

function ToggleRow({
  label, description, checked, onChange, last,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: last ? "none" : "1px solid var(--border)", gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{label}</p>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.35 }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 50, height: 30, borderRadius: 15, border: "none",
          background: checked ? "var(--brand)" : "var(--border)",
          cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
        role="switch"
        aria-checked={checked}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 24 : 3,
          width: 24, height: 24, borderRadius: "50%", background: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "left 0.2s",
        }} />
      </button>
    </div>
  )
}
