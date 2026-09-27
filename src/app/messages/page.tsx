"use client"

import { useEffect, useState } from "react"
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user)
  // Auth state is restored from localStorage, so it differs from the server
  // prerender — gate the authed branch until after hydration.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isAuthed = mounted && !!user

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages"],
    queryFn: () => api.getMyMessages(50),
    enabled: isAuthed,
  })

  const messages: Message[] = data?.messages ?? []
  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="fade-in msg-page">
      <h1 className="msg-title">
        Messages
        {unread > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 22,
              height: 22,
              padding: "0 7px",
              marginLeft: 10,
              borderRadius: 999,
              background: "var(--brand)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              verticalAlign: "middle",
            }}
          >
            {unread}
          </span>
        )}
      </h1>
      <p className="msg-sub">Updates from artists you follow.</p>

      {!isAuthed ? (
        <div className="empty">
          <p className="empty-title">Sign in to see your messages</p>
          <p className="empty-sub">Artists you follow send updates and announcements here.</p>
        </div>
      ) : isError ? (
        <div className="empty">
          <div className="empty-icon is-error" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <p className="empty-title">Failed to load messages</p>
          <p className="empty-sub">Please try again later.</p>
        </div>
      ) : isLoading ? (
        <div className="msg-list" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="msg-skel">
              <div className="skeleton" style={{ width: "40%", height: 15, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "85%", height: 13, marginBottom: 4 }} />
              <div className="skeleton" style={{ width: "60%", height: 13 }} />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="empty-title">No messages yet</p>
          <p className="empty-sub">Messages from artists you follow will appear here.</p>
        </div>
      ) : (
        <div className="msg-list">
          {messages.map((msg) => (
            <article key={msg.id} className={`msg-card${msg.read ? "" : " is-unread"}`}>
              <div className="msg-head">
                {!msg.read && <span className="msg-dot" aria-label="Unread" />}
                <p className="msg-subject">{msg.subject}</p>
                {msg.created_at && (
                  <span className="msg-date">{formatDate(msg.created_at)}</span>
                )}
              </div>
              <p className="msg-body">{msg.body}</p>
              <p className="msg-from">— {msg.artist_name}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
