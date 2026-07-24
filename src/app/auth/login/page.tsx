"use client"

import { useThemeStore } from "@/lib/theme-store"
import { AUTH_BASE } from "@/lib/api"

export default function LoginPage() {
  const theme = useThemeStore((s) => s.theme)

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background)",
      padding: 24,
    }}>
      <div style={{
        background: "var(--card-bg)",
        borderRadius: 16,
        padding: "40px 36px",
        maxWidth: 380,
        width: "100%",
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
        textAlign: "center",
        border: "1px solid var(--border)",
      }}>
        <img src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"} alt="ZedBeatz" style={{ height: 32, margin: "0 auto 10px", display: "block" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>
          Sign in to ZedBeatz
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "0 0 28px" }}>
          Discover and stream the best Zambian music
        </p>

        <a
          href={`${AUTH_BASE}/auth/google`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 999,
            background: "#fff",
            color: "#1d1d1f",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            border: "1px solid rgba(0,0,0,0.1)",
            transition: "background 0.12s",
            width: "100%",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f7"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </a>
      </div>
    </div>
  )
}
