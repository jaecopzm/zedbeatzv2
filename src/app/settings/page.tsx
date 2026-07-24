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
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`@media (max-width: 640px) { .settings-page { padding: 16px 12px 24px !important; } }`}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "0 0 28px", letterSpacing: "-0.5px" }}>Settings</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 520 }}>
        {/* Playback */}
        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Playback</h3>

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

        {/* Account */}
        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Account</h3>

          <a href="/profile" style={{ display: "block", padding: "10px 0", color: "var(--foreground)", fontSize: 14, textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
            View Profile
          </a>
          <a href="/liked" style={{ display: "block", padding: "10px 0", color: "var(--foreground)", fontSize: 14, textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
            Liked Songs
          </a>
          <a href="/messages" style={{ display: "block", padding: "10px 0", color: "var(--foreground)", fontSize: 14, textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
            Messages
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
      padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.3 }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48, height: 28, borderRadius: 14, border: "none",
          background: checked ? "var(--brand)" : "var(--border)",
          cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
        role="switch"
        aria-checked={checked}
      >
        <div style={{
          position: "absolute", top: 2, left: checked ? 22 : 2,
          width: 24, height: 24, borderRadius: "50%", background: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)", transition: "left 0.2s",
        }} />
      </button>
    </div>
  )
}
