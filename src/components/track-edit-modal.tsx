"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"

interface Track {
  id: string
  title: string
  genre_id?: string
  genre_name?: string
  status: string
  cover_url?: string
  album_id?: string
  album_name?: string
  duration_sec: number
  play_count: number
  like_count: number
  description?: string | null
}

interface Props {
  track: Track | null
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
  background: "var(--background)", color: "var(--foreground)", fontSize: 13,
  outline: "none", boxSizing: "border-box", width: "100%",
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block",
}

export function TrackEditModal({ track, onClose }: Props) {
  const qc = useQueryClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genreId, setGenreId] = useState("")
  const [status, setStatus] = useState("draft")

  const { data: genresData } = useQuery({ queryKey: ["genres"], queryFn: () => api.listGenres(), staleTime: 5 * 60 * 1000 })
  const genres = genresData?.genres ?? []

  useEffect(() => {
    if (track) {
      setTitle(track.title)
      setDescription(track.description || "")
      setGenreId(track.genre_id || "")
      setStatus(track.status)
    }
  }, [track])

  const updateMut = useMutation({
    mutationFn: (data: { title: string; genre_id?: string; status: string; description?: string | null }) =>
      api.artistUpdateTrack(track!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artist-tracks"] })
      toast("Track updated", "success")
      onClose()
    },
    onError: (e: any) => toast(e?.message || "Update failed", "error"),
  })

  if (!track) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return toast("Title is required", "error")
    updateMut.mutate({ title: title.trim(), description: description.trim() || null, genre_id: genreId || undefined, status })
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 1001, width: "90%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto",
        background: "var(--card-bg)", borderRadius: 20, padding: "28px 32px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Edit Track</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Track info header */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, padding: "14px 16px", borderRadius: 14, background: "var(--hover-bg)" }}>
          {track.cover_url ? (
            <img src={track.cover_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 10, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18V5l12-2v13" /></svg>
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{track.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
              {Math.floor(track.duration_sec / 60)}:{String(track.duration_sec % 60).padStart(2, "0")} · {track.play_count} plays · {track.like_count} likes
              {track.album_name ? ` · ${track.album_name}` : ""}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={labelStyle}>Description</label>
              <span style={{ fontSize: 10, fontWeight: 500, color: description.length > 400 ? "var(--brand)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{description.length}/500</span>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} rows={3}
              placeholder="Credits, story, lyrics, or anything you want listeners to know..."
              style={{ ...inputStyle, lineHeight: 1.5, resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Genre</label>
              <select value={genreId} onChange={(e) => setGenreId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
                <option value="">None</option>
                {genres.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 24px", borderRadius: 999, border: "1.5px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={updateMut.isPending} style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: updateMut.isPending ? "var(--border)" : "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {updateMut.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
