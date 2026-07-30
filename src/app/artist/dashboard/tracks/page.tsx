"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef, useCallback, useEffect } from "react"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { toast } from "@/lib/toast-store"
import { TrackEditModal } from "@/components/track-edit-modal"
import { detectAudioDuration, formatDuration } from "@/lib/utils"
import { ConfirmDialog } from "@/components/confirm-dialog"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1"

const pillBtn: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 999, border: "none",
  background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600,
  cursor: "pointer", transition: "background 0.15s, transform 0.1s",
}
const pillBtnGhost: React.CSSProperties = {
  ...pillBtn, background: "transparent", color: "var(--foreground)",
  border: "1.5px solid var(--border)",
}
const pillBtnDanger: React.CSSProperties = {
  ...pillBtn, background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontSize: 11, padding: "5px 12px",
}
const inputStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
  background: "var(--background)", color: "var(--foreground)", fontSize: 13,
  outline: "none", boxSizing: "border-box",
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block",
}

const MAX_DESC = 500

export default function TracksPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genreId, setGenreId] = useState("")
  const [albumId, setAlbumId] = useState("")
  const [newAlbumTitle, setNewAlbumTitle] = useState("")
  const [featuredArtists, setFeaturedArtists] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [audioDrag, setAudioDrag] = useState(false)
  const [coverDrag, setCoverDrag] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [editingTrack, setEditingTrack] = useState<any>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploadedTrack, setUploadedTrack] = useState<{ id: string; title: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null)
  const [hoveredPlayId, setHoveredPlayId] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState("")
  const [bulkAlbumId, setBulkAlbumId] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const addToAlbumMut = useMutation({
    mutationFn: async ({ trackIds, albumId }: { trackIds: string[]; albumId: string }) => {
      for (const id of trackIds) await api.artistAddTrackToAlbum(albumId, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artist-tracks"] })
      qc.invalidateQueries({ queryKey: ["artist-albums"] })
      toast(`${selected.size} tracks added to album`, "success")
      setSelected(new Set())
      setBulkAlbumId("")
    },
    onError: () => toast("Failed to add tracks to album", "error"),
  })

  const updateTrackMut = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.artistUpdateTrack(id, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["artist-tracks"] }); toast("Title updated", "success") },
    onError: (e: any) => toast(e?.message || "Failed to update title", "error"),
  })

  const play = usePlayerStore((s) => s.play)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowForm((prev) => { if (!prev) resetForm(); return !prev })
      }
      if (e.key === "Escape" && showForm) {
        setShowForm(false)
        resetForm()
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && showForm) {
        const form = document.querySelector("form")
        if (form) form.requestSubmit()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  })

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpenId) return
    function handleClick() { setMenuOpenId(null) }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpenId])

  const { data, isLoading } = useQuery({ queryKey: ["artist-tracks"], queryFn: () => api.artistListTracks() })
  const { data: genresData } = useQuery({ queryKey: ["genres"], queryFn: () => api.listGenres(), staleTime: 5 * 60 * 1000 })
  const { data: albumsData } = useQuery({ queryKey: ["artist-albums"], queryFn: () => api.artistListAlbums() })
  const { data: creditData } = useQuery({ queryKey: ["artist-credits"], queryFn: () => api.artistGetCredits() })

  const tracks = data?.tracks ?? []
  const genres = genresData?.genres ?? []
  const albums = albumsData?.albums ?? []

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.artistDeleteTrack(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["artist-tracks"] }); toast("Track deleted", "success") },
  })

  const publishMut = useMutation({
    mutationFn: (id: string) => api.artistUpdateTrack(id, { status: "published" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["artist-tracks"] }); toast("Track published!", "success") },
    onError: (e: any) => toast(e?.message || "Failed to publish", "error"),
  })

  const unpublishMut = useMutation({
    mutationFn: (id: string) => api.artistUpdateTrack(id, { status: "draft" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["artist-tracks"] }); toast("Track unpublished", "info") },
  })

  // Bulk actions
  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await api.artistDeleteTrack(id) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artist-tracks"] })
      toast(`${selected.size} tracks deleted`, "success")
      setSelected(new Set())
    },
    onError: () => toast("Some tracks couldn't be deleted", "error"),
  })

  const bulkPublishMut = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await api.artistUpdateTrack(id, { status: "published" }) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artist-tracks"] })
      toast(`${selected.size} tracks published`, "success")
      setSelected(new Set())
    },
    onError: () => toast("Some tracks couldn't be published", "error"),
  })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selected.size === tracks.length) setSelected(new Set())
    else setSelected(new Set(tracks.map((t: any) => t.id)))
  }
  const isAllSelected = tracks.length > 0 && selected.size === tracks.length

  function resetForm() {
    setTitle(""); setDescription(""); setGenreId(""); setAlbumId(""); setNewAlbumTitle("")
    setFeaturedArtists(""); setAudioFile(null); setAudioDuration(0); setCoverFile(null); setCoverPreview(null)
    setPublishNow(true); setError("")
  }

  function handlePlayTrack(t: any) {
    if (currentTrack?.id === t.id) {
      togglePlay()
    } else {
      play({
        id: t.id,
        title: t.title,
        artist_name: t.artist_name || "",
        cover_url: t.cover_url,
        duration_sec: t.duration_sec || 0,
      })
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!audioFile) { setError("Audio file is required"); return }
    if (!title.trim()) { setError("Title is required"); return }
    setUploading(true)
    setUploadProgress(0)
    setError("")
    try {
      const fd = new FormData()
      fd.append("title", title.trim())
      fd.append("description", description.trim())
      fd.append("audio", audioFile)
      if (audioDuration > 0) fd.append("duration_sec", String(audioDuration))
      if (genreId) fd.append("genre_id", genreId)
      if (albumId) fd.append("album_id", albumId)
      if (newAlbumTitle.trim()) fd.append("album_title", newAlbumTitle.trim())
      if (featuredArtists.trim()) fd.append("featured_artists", featuredArtists.trim())
      if (coverFile) fd.append("cover", coverFile)

      // XHR upload with progress
      const created = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", `${API_BASE}/artists/me/tracks`)
        const token = localStorage.getItem("access_token")
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed")) }
            catch { reject(new Error("Upload failed")) }
          }
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.send(fd)
      })

      if (publishNow && created?.id) {
        await publishMut.mutateAsync(created.id)
      } else {
        toast("Track uploaded as draft", "info")
      }
      setUploadedTrack({ id: created.id, title: title.trim() })
      setLinkCopied(false)
      setShowForm(false)
      resetForm()
      qc.invalidateQueries({ queryKey: ["artist-tracks"] })
      qc.invalidateQueries({ queryKey: ["artist-albums"] })
    } catch (e: any) { setError(e?.message || "Upload failed") }
    setUploading(false)
    setUploadProgress(0)
  }

  return (
    <div className="tracks-page">
      <div className="tracks-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Your Tracks</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>{tracks.length} tracks</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); resetForm() }} style={showForm ? pillBtnGhost : pillBtn}>
          {showForm ? "Cancel" : "Upload Track"}
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderRadius: 12, background: "var(--brand-bg)", border: "1px solid var(--brand)", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--brand)" }}>{selected.size} selected</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => bulkPublishMut.mutate([...selected])} disabled={bulkPublishMut.isPending} style={{ ...pillBtn, padding: "6px 16px", fontSize: 12, background: "var(--brand)" }}>Publish</button>
            {bulkAlbumId ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={bulkAlbumId}
                  onChange={(e) => setBulkAlbumId(e.target.value)}
                  style={{ padding: "4px 10px", borderRadius: 8, border: "1.5px solid var(--brand)", background: "var(--background)", color: "var(--foreground)", fontSize: 12, outline: "none", fontFamily: "inherit" }}
                >
                  <option value="">Select album...</option>
                  {albums.map((a: any) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
                <button
                  onClick={() => { if (bulkAlbumId) addToAlbumMut.mutate({ trackIds: [...selected], albumId: bulkAlbumId }) }}
                  disabled={!bulkAlbumId || addToAlbumMut.isPending}
                  style={{ ...pillBtn, padding: "5px 12px", fontSize: 11, background: "var(--brand)" }}
                >
                  {addToAlbumMut.isPending ? "..." : "Add"}
                </button>
                <button onClick={() => setBulkAlbumId("")} style={pillBtnGhost}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setBulkAlbumId("_picker")} style={{ ...pillBtn, padding: "6px 16px", fontSize: 12, background: "var(--brand)" }}>Add to Album</button>
            )}
            <button onClick={() => setConfirmDelete({ id: "_bulk", title: `${selected.size} tracks` })} disabled={bulkDeleteMut.isPending} className="pill-btn-danger" style={{ ...pillBtnDanger, padding: "6px 16px" }}>Delete</button>
            <button onClick={() => setSelected(new Set())} style={{ padding: "6px 12px", borderRadius: 999, border: "none", background: "transparent", color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Clear</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 13, fontWeight: 500, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleUpload} className="tracks-form slide-down" style={{ background: "var(--card-bg)", borderRadius: 16, padding: "24px 28px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Upload New Track</h3>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" style={{ ...inputStyle, width: "100%" }} />
          </div>

          {/* Description */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={labelStyle}>Description</label>
              <span style={{ fontSize: 11, fontWeight: 500, color: description.length > MAX_DESC * 0.9 ? "var(--brand)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{description.length}/{MAX_DESC}</span>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))} rows={3}
              placeholder="Add a description for your track — credits, story, lyrics, or anything you want listeners to know..."
              style={{ ...inputStyle, width: "100%", lineHeight: 1.5, resize: "vertical" }} />
          </div>

          {/* Audio file — drag & drop */}
          <div>
            <label style={labelStyle}>Audio File *</label>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const f = e.target.files?.[0] || null
                setAudioFile(f)
                setAudioDuration(f ? await detectAudioDuration(f) : 0)
              }}
              style={{ display: "none" }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setAudioDrag(true) }}
              onDragLeave={(e) => { e.preventDefault(); setAudioDrag(false) }}
              onDrop={async (e) => {
                e.preventDefault(); setAudioDrag(false)
                const f = e.dataTransfer.files?.[0]
                if (f?.type.startsWith("audio/")) { setAudioFile(f); setAudioDuration(await detectAudioDuration(f)) }
              }}
              style={{
                border: audioDrag ? "2px dashed var(--brand)" : audioFile ? "2px solid var(--brand)" : "2px dashed var(--border)",
                borderRadius: 14, padding: audioFile ? "16px 20px" : "32px 20px",
                textAlign: "center", cursor: "pointer",
                background: audioDrag ? "var(--brand-bg)" : audioFile ? "var(--brand-bg)" : "var(--background)",
                transition: "all 0.2s ease",
              }}
            >
              {audioFile ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{audioFile.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>{(audioFile.size / (1024 * 1024)).toFixed(1)} MB · {audioFile.type || "audio"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAudioFile(null); if (fileRef.current) fileRef.current.value = "" }}
                    style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 4, borderRadius: 6 }}
                    title="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.4" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: audioDrag ? "var(--brand)" : "var(--foreground)" }}>
                    {audioDrag ? "Drop to upload" : "Drag & drop your audio file"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>or click to browse · MP3, FLAC, WAV, OGG, M4A</p>
                </>
              )}
            </div>
          </div>

          {/* Cover image — drag & drop */}
          <div>
            <label style={labelStyle}>Cover Art</label>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }}
              style={{ display: "none" }}
            />
            <div
              onClick={() => coverRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCoverDrag(true) }}
              onDragLeave={(e) => { e.preventDefault(); setCoverDrag(false) }}
              onDrop={(e) => {
                e.preventDefault(); setCoverDrag(false)
                const f = e.dataTransfer.files?.[0]
                if (f?.type.startsWith("image/")) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) }
              }}
              style={{
                border: coverDrag ? "2px dashed var(--brand)" : coverPreview ? "2px solid var(--brand)" : "2px dashed var(--border)",
                borderRadius: 14, padding: coverPreview ? 16 : 28,
                textAlign: "center", cursor: "pointer",
                background: coverDrag ? "var(--brand-bg)" : "var(--background)",
                transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 16,
              }}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>Cover image selected</p>
                    <p style={{ margin: "2px 0 4px", fontSize: 12, color: "var(--muted-foreground)" }}>Click or drop to replace</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); if (coverRef.current) coverRef.current.value = "" }}
                      style={{ padding: "4px 12px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%" }}>
                  <div style={{ marginBottom: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.4" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: coverDrag ? "var(--brand)" : "var(--foreground)" }}>
                    {coverDrag ? "Drop to upload" : "Drag & drop album art"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>or click to browse · Square image recommended</p>
                </div>
              )}
            </div>
          </div>

          {/* Genre + Album row */}
          <div className="genre-album-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Genre</label>
              <select value={genreId} onChange={(e) => setGenreId(e.target.value)} style={{ ...inputStyle, width: "100%", appearance: "auto" }}>
                <option value="">None</option>
                {genres.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Album</label>
              <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} style={{ ...inputStyle, width: "100%", appearance: "auto" }}>
                <option value="">None (single)</option>
                {albums.map((a: any) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          </div>

          {/* New album */}
          {!albumId && (
            <div>
              <label style={labelStyle}>Or create new album</label>
              <input value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)} placeholder="New album title" style={{ ...inputStyle, width: "100%" }} />
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>Leaving blank creates a standalone single</p>
            </div>
          )}

          {/* Featured artists */}
          <div>
            <label style={labelStyle}>Featured Artists</label>
            <input value={featuredArtists} onChange={(e) => setFeaturedArtists(e.target.value)} placeholder="e.g. Chef 187, Macky 2" style={{ ...inputStyle, width: "100%" }} />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>Comma-separated artist names. New artists auto-created if needed.</p>
          </div>

          {/* Publish toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "var(--hover-bg)" }}>
            <button type="button" onClick={() => setPublishNow(!publishNow)}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: publishNow ? "var(--brand)" : "var(--border)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, left: publishNow ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left 0.2s" }} />
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Publish immediately</p>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>{publishNow ? "Track will be live for listeners" : "Track will be saved as a draft"}</p>
            </div>
          </div>

          {/* Credit notice */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "var(--hover-bg)", fontSize: 12, color: "var(--muted-foreground)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" /></svg>
            <span>1 credit per upload · <strong style={{ color: creditData?.balance?.balance > 0 ? "var(--brand)" : "#ef4444" }}>{creditData?.balance?.balance ?? "..."} credits remaining</strong></span>
            {(creditData?.balance?.balance ?? 0) < 1 && (
              <a href="/artist/dashboard/credits" style={{ marginLeft: "auto", color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Buy credits →</a>
            )}
          </div>

          {/* Submit with progress bar */}
          <div>
            {uploading && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                    {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                    {audioFile && uploadProgress < 100 && ` ${(audioFile.size * uploadProgress / 100 / (1024 * 1024)).toFixed(1)} MB / ${(audioFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)", fontVariantNumeric: "tabular-nums" }}>{uploadProgress}%</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${uploadProgress}%`, height: "100%", background: "linear-gradient(90deg, var(--brand), var(--brand-light))", borderRadius: 999, transition: "width 0.2s ease" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => { setShowForm(false); resetForm() }} style={pillBtnGhost}>Cancel</button>
              <button type="submit" disabled={uploading || (creditData?.balance?.balance ?? 0) < 1} style={{ ...pillBtn, background: (uploading || (creditData?.balance?.balance ?? 0) < 1) ? "var(--border)" : "var(--brand)", cursor: (uploading || (creditData?.balance?.balance ?? 0) < 1) ? "default" : "pointer" }}>
                {uploading ? "Uploading..." : "Upload Track"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Upload success banner */}
      {uploadedTrack && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 18px", borderRadius: 12,
          background: "var(--brand-bg)", border: "1px solid var(--brand)",
          marginBottom: 16,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
              {uploadedTrack.title}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
              Track uploaded successfully
            </p>
          </div>
          <a
            href={`/track/${uploadedTrack.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 999,
              background: "transparent", color: "var(--brand)",
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            View Track
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/track/${uploadedTrack.id}`)
              setLinkCopied(true)
              setTimeout(() => setLinkCopied(false), 2000)
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 999, border: "1.5px solid var(--brand)",
              background: linkCopied ? "var(--brand)" : "transparent",
              color: linkCopied ? "#fff" : "var(--brand)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {linkCopied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            )}
            {linkCopied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={() => setUploadedTrack(null)}
            style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 4, lineHeight: 0 }}
            title="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editingTrack && (
        <TrackEditModal track={editingTrack} onClose={() => setEditingTrack(null)} />
      )}

      {/* Track list */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />)}
        </div>
      ) : tracks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--hover-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "var(--foreground)" }}>No tracks yet</p>
          <p style={{ fontSize: 13, margin: "0 0 20px" }}>Upload your first track to start building your catalog.</p>
          <button
            onClick={() => { setShowForm(true); resetForm() }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 999, border: "none",
              background: "var(--brand)", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 20px var(--brand-shadow)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Upload Your First Track
          </button>
        </div>
      ) : (
        <div>
          {/* Select-all header */}
          <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", marginBottom: 4 }}>
            <button onClick={toggleSelectAll}
              style={{ width: 18, height: 18, borderRadius: 4, border: isAllSelected ? "none" : "1.5px solid var(--border)", background: isAllSelected ? "var(--brand)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 12 }}
            >
              {isAllSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 }}>{selected.size > 0 ? `${selected.size} of ${tracks.length} selected` : "Select all"}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {tracks.map((t: any) => (
            <div
              key={t.id}
              onClick={() => setEditingTrack(t)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: selected.has(t.id) ? "var(--brand-bg)" : "var(--card-bg)", borderRadius: 12, transition: "background 0.1s", cursor: "pointer" }}
              onMouseEnter={(e) => { if (!selected.has(t.id)) e.currentTarget.style.background = "var(--hover-bg)" }}
              onMouseLeave={(e) => { if (!selected.has(t.id)) e.currentTarget.style.background = "var(--card-bg)" }}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(t.id) }}
                style={{ width: 18, height: 18, borderRadius: 4, border: selected.has(t.id) ? "none" : "1.5px solid var(--border)", background: selected.has(t.id) ? "var(--brand)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {selected.has(t.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
              <div
                onClick={(e) => { e.stopPropagation(); handlePlayTrack(t) }}
                onMouseEnter={() => setHoveredPlayId(t.id)}
                onMouseLeave={() => setHoveredPlayId(null)}
                style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
              >
                {t.cover_url ? <img src={t.cover_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", display: "block" }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18V5l12-2v13" /></svg></div>}
                {(hoveredPlayId === t.id || currentTrack?.id === t.id) && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 8,
                    background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {currentTrack?.id === t.id && isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <rect x="5" y="4" width="4" height="16" rx="1.5" />
                        <rect x="15" y="4" width="4" height="16" rx="1.5" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingTitleId === t.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (editingTitleValue.trim() && editingTitleValue.trim() !== t.title) {
                        updateTrackMut.mutate({ id: t.id, title: editingTitleValue.trim() })
                      }
                      setEditingTitleId(null)
                    }}
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <input
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1, padding: "4px 10px", borderRadius: 6, border: "1.5px solid var(--brand)",
                        background: "var(--background)", color: "var(--foreground)", fontSize: 14, fontWeight: 600,
                        outline: "none", fontFamily: "inherit",
                      }}
                      onBlur={() => {
                        if (editingTitleValue.trim() && editingTitleValue.trim() !== t.title) {
                          updateTrackMut.mutate({ id: t.id, title: editingTitleValue.trim() })
                        }
                        setEditingTitleId(null)
                      }}
                      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditingTitleId(null) } }}
                    />
                  </form>
                ) : (
                  <p
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTitleId(t.id)
                      setEditingTitleValue(t.title)
                    }}
                    style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text" }}
                    title="Click to rename"
                  >{t.title}</p>
                )}
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                  {formatDuration(t.duration_sec)} · {t.play_count ?? 0} plays · {t.like_count ?? 0} likes
                  {t.genre_name ? ` · ${t.genre_name}` : ""}
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: t.status === "published" ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.05)", color: t.status === "published" ? "#10b981" : "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t.status}
              </span>
              {t.status === "draft" ? (
                <button onClick={(e) => { e.stopPropagation(); publishMut.mutate(t.id) }} disabled={publishMut.isPending}
                  style={{ ...pillBtn, padding: "5px 14px", fontSize: 11, background: "var(--brand)" }}>
                  {publishMut.isPending ? "..." : "Publish"}
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); unpublishMut.mutate(t.id) }} disabled={unpublishMut.isPending}
                  style={{ ...pillBtnGhost, padding: "5px 14px", fontSize: 11 }}>
                  Unpublish
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(`${window.location.origin}/track/${t.id}`)
                  setCopiedTrackId(t.id)
                  setTimeout(() => setCopiedTrackId(null), 2000)
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "6px 8px",
                  borderRadius: 8, color: copiedTrackId === t.id ? "var(--brand)" : "var(--muted-foreground)",
                  fontSize: 12, fontWeight: 500, fontFamily: "inherit",
                  transition: "color 0.15s",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
                title="Copy share link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                {copiedTrackId === t.id ? "Copied!" : "Share"}
              </button>
              <div className="track-actions">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === t.id ? null : t.id) }}
                  className="track-more-btn"
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
                    borderRadius: 6, color: "var(--muted-foreground)", lineHeight: 0, display: "none",
                  }}
                  title="More"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                </button>
                {menuOpenId === t.id && (
                  <div className="track-more-dropdown" style={{
                    position: "absolute", right: 0, top: "100%", zIndex: 50,
                    background: "var(--card-bg)", border: "1px solid var(--border)",
                    borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    padding: 4, minWidth: 160,
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => { setMenuOpenId(null); deleteMut.mutate(t.id) }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: t.id, title: t.title }) }} className="track-delete-btn pill-btn-danger" style={pillBtnDanger} title="Delete">Delete</button>
            </div>
          ))}
        </div>
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        title={confirmDelete?.id === "_bulk" ? `Delete ${confirmDelete?.title}?` : "Delete track"}
        message={confirmDelete?.id === "_bulk" ? `Are you sure you want to delete ${confirmDelete?.title}? This action cannot be undone.` : `Delete "${confirmDelete?.title || ""}" permanently?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!confirmDelete) return
          if (confirmDelete.id === "_bulk") bulkDeleteMut.mutate([...selected])
          else deleteMut.mutate(confirmDelete.id)
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
      <style>{`
        .pill-btn-danger:hover { background: rgba(239,68,68,0.1) !important; }
        .slide-down { animation: slideDown 0.2s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 2000px; } }
        @media (max-width: 640px) {
          .tracks-page .tracks-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .tracks-page .bulk-bar { flex-wrap: wrap; gap: 8px; }
          .tracks-page .tracks-form { padding: 16px !important; }
          .tracks-page .genre-album-grid { grid-template-columns: 1fr !important; }
          .track-delete-btn { display: none !important; }
          .track-more-btn { display: inline-flex !important; }
          .track-actions { position: relative; }
        }
      `}</style>
    </div>
  )
}
