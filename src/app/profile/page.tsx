"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

export default function ProfilePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  if (!user) {
    return (
      <div style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 16, color: "var(--muted-foreground)" }}>Sign in to view your profile</p>
        <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
      </div>
    )
  }

  const initials = user.email?.charAt(0).toUpperCase() || "?"

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`@media (max-width: 640px) { .profile-page { padding: 16px 12px 24px !important; } }`}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "0 0 28px", letterSpacing: "-0.5px" }}>Profile</h1>

      <div style={{ display: "flex", gap: 24, marginBottom: 36, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 36, fontWeight: 800, flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {initials}
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>{user.email}</h2>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)", textTransform: "capitalize", display: "block", marginBottom: 4 }}>
            {user.role}
          </span>
          {user.artist_id && (
            <button
              onClick={() => router.push(`/artist/${user.artist_id}`)}
              style={{ padding: "4px 12px", borderRadius: 12, border: "1.5px solid var(--brand)", background: "transparent", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              View Artist Profile
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Account</h3>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
          <InfoRow label="User ID" value={user.user_id} mono />
          {token && (
            <button
              onClick={async () => {
                try {
                  const payload = JSON.parse(atob(token.split(".")[1]))
                  await navigator.clipboard.writeText(token)
                  alert(`Token copied. Expires: ${new Date(payload.exp * 1000).toLocaleString()}`)
                } catch { /* ignore */ }
              }}
              style={{ marginTop: 8, padding: "4px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}
            >
              Copy access token
            </button>
          )}
        </section>

        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Quick Links</h3>
          {[
            { label: "Liked Songs", href: "/liked" },
            { label: "Messages", href: "/messages" },
            { label: "Your Library", href: "/library" },
            { label: "Settings", href: "/settings" },
          ].map((l) => (
            <button key={l.href} onClick={() => router.push(l.href)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 0", border: "none", background: "none", color: "var(--foreground)", fontSize: 14, cursor: "pointer", borderBottom: "1px solid var(--border)" }}
            >
              {l.label}
            </button>
          ))}
        </section>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{label}</span>
      <span style={{ fontWeight: 500, color: "var(--foreground)", fontFamily: mono ? "monospace" : undefined, fontSize: mono ? 11 : 13, textTransform: "capitalize" }}>
        {value}
      </span>
    </div>
  )
}
