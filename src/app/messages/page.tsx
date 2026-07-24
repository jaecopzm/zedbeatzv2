"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

interface Message {
  id: string
  subject: string
  body: string
  artist_name: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  const isAuthed = !!useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => api.getMyMessages(50),
    enabled: isAuthed,
  })

  const messages: Message[] = data?.messages ?? []

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .messages-page { padding: 16px 12px 24px !important; }
        }
      `}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "0 0 24px", letterSpacing: "-0.5px" }}>
        Messages
      </h1>

      {!isAuthed ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Sign in to see your messages</p>
          <p style={{ fontSize: 14, margin: 0 }}>Artists you follow send updates and announcements here.</p>
        </div>
      ) : isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: "var(--card-bg)", borderRadius: 12, padding: 16 }}>
              <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "80%", height: 13, marginBottom: 4 }} />
              <div className="skeleton" style={{ width: "60%", height: 13 }} />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted-foreground)" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No messages yet</p>
          <p style={{ fontSize: 14, margin: 0 }}>Messages from artists you follow will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: msg.read ? "var(--card-bg)" : "var(--card-bg)",
                borderRadius: 12,
                border: msg.read ? "1px solid var(--border)" : "1.5px solid var(--brand)",
                padding: "16px 20px",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {!msg.read && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
                )}
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{msg.subject}</p>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: "auto", flexShrink: 0 }}>
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{msg.body}</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--brand)" }}>
                — {msg.artist_name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
