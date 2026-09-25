"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  color: "var(--foreground)",
  fontSize: 14,
  textDecoration: "none",
  borderBottom: "1px solid var(--border)",
  cursor: "pointer",
  transition: "opacity 0.15s",
  background: "none",
  border: "none",
  width: "100%",
  textAlign: "left" as const,
  fontFamily: "inherit",
}

const iconMap: Record<string, string> = {
  "Liked Songs": "M",
  "Messages": "E",
  "Your Library": "L",
  "Settings": "G",
}

export default function ProfilePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  if (!user) {
    return (
      <div style={{ padding: "32px", minHeight: "100%", background: "var(--content-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 16, color: "var(--muted-foreground)" }}>Sign in to view your profile</p>
        <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
      </div>
    )
  }

  const initials = user.email?.charAt(0).toUpperCase() || "?"

  return (
    <div className="fade-in profile-page" style={{ padding: "32px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .profile-page { padding: 16px 12px 24px !important; }
          .profile-page .pp-header { flex-direction: column !important; text-align: center !important; }
          .profile-page .pp-links { max-width: 100% !important; }
        }
        .profile-link-btn:hover { opacity: 0.7; }
      `}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--foreground)", margin: "0 0 24px", letterSpacing: "-0.5px" }}>Profile</h1>

      <div className="pp-header" style={{ display: "flex", gap: 20, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 36, fontWeight: 800, flexShrink: 0, boxShadow: "0 4px 20px var(--brand-shadow)" }}>
          {initials}
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", margin: "0 0 2px", wordBreak: "break-word" }}>{user.email}</h2>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "capitalize", display: "block", marginBottom: 6 }}>
            {user.role}
          </span>
          {user.artist_id && (
            <button
              onClick={() => router.push(`/artist/${user.artist_id}`)}
              style={{ padding: "4px 12px", borderRadius: 12, border: "1.5px solid var(--brand)", background: "transparent", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "0.12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand)"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand)" }}
            >
              View Artist Profile
            </button>
          )}
        </div>
      </div>

      <div className="pp-links" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>
        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Account</h3>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
          <InfoRow label="User ID" value={user.user_id} mono />
          {token && (
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(token)
                } catch { /* ignore */ }
              }}
              style={{ marginTop: 8, padding: "4px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace", cursor: "pointer", transition: "0.12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted-foreground)" }}
            >
              Copy access token
            </button>
          )}
        </section>

        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Quick Links</h3>
          {[
            { label: "Liked Songs", href: "/liked" },
            { label: "Messages", href: "/messages" },
            { label: "Your Library", href: "/library" },
            { label: "Settings", href: "/settings" },
          ].map((l) => (
            <button key={l.href} onClick={() => router.push(l.href)}
              className="profile-link-btn"
              style={linkStyle}
            >
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0 }}>{iconMap[l.label]}</span>
              {l.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </section>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
      <span style={{ fontSize: 13, color: "var(--muted-foreground)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, color: "var(--foreground)", fontFamily: mono ? "monospace" : undefined, fontSize: mono ? 11 : 13, textTransform: "capitalize", textAlign: "right", wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  )
}
