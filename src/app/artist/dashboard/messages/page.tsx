"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"

export default function MessagesPage() {
  const qc = useQueryClient()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sent, setSent] = useState(false)

  const { data: history } = useQuery({
    queryKey: ["artist-sent-messages"],
    queryFn: () => api.artistListSentMessages(),
  })

  const broadcastMut = useMutation({
    mutationFn: () => api.artistBroadcast(subject, body),
    onSuccess: () => {
      toast("Message broadcast to followers!", "success")
      setSent(true); setSubject(""); setBody("")
      qc.invalidateQueries({ queryKey: ["artist-sent-messages"] })
    },
    onError: (e: any) => toast(e?.message || "Failed to send", "error"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || !body) return toast("Subject and body are required", "error")
    broadcastMut.mutate()
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>Broadcast Message</h2>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "0 0 20px" }}>
        Send a message to all your followers. They&apos;ll see it in their inbox.
      </p>

      {sent && !broadcastMut.isPending && (
        <div style={{ background: "rgba(16,185,129,0.12)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#10b981", fontSize: 14, fontWeight: 600 }}>
          ✔ Message sent! Your followers will see it in their inbox.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. New single out now!" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write your message to fans..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        <button type="submit" disabled={broadcastMut.isPending}
          style={{ padding: "10px 28px", borderRadius: 999, border: "none", background: broadcastMut.isPending ? "var(--border)" : "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
          {broadcastMut.isPending ? "Sending..." : "Send to Followers"}
        </button>
      </form>

      {/* Sent messages history */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 16px" }}>Message History</h2>
        {history?.messages?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.messages.map((m: any) => (
              <div key={m.id} style={{ background: "var(--card-bg)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{m.subject}</p>
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {new Date(m.created_at).toLocaleDateString()} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{m.body}</p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "var(--brand)" }}>
                  Delivered to {m.recipient_count.toLocaleString()} {m.recipient_count === 1 ? "follower" : "followers"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>No messages sent yet.</p>
        )}
      </div>
    </div>
  )
}
