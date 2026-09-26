"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { SectionSelect } from "@/lib/sections"

export default function AdminUploadPage() {
  const queryClient = useQueryClient()
  const [artistId, setArtistId] = useState("")
  const [albumId, setAlbumId] = useState("")
  const [albumTitle, setAlbumTitle] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genreId, setGenreId] = useState("")
  const [section, setSection] = useState("")
  const [featuredArtists, setFeaturedArtists] = useState("")
  const [durationSec, setDurationSec] = useState("")
  const [trackOrder, setTrackOrder] = useState("")
  const [publish, setPublish] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [error, setError] = useState("")

  const { data: artists } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(1000, 0),
  })

  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
  })

  const { data: albums } = useQuery({
    queryKey: ["admin-albums", artistId],
    queryFn: () => api.adminListAlbums(100, 0, artistId),
    enabled: !!artistId,
  })

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append("artist_id", artistId)
      fd.append("title", title)
      if (description.trim()) fd.append("description", description.trim())
      if (genreId) fd.append("genre_id", genreId)
      if (section) fd.append("section", section)
      if (albumId) fd.append("album_id", albumId)
      if (!albumId && albumTitle.trim()) fd.append("album_title", albumTitle.trim())
      if (featuredArtists.trim()) fd.append("featured_artists", featuredArtists.trim())
      if (durationSec) fd.append("duration_sec", durationSec)
      if (trackOrder) fd.append("track_order", trackOrder)
      if (publish) fd.append("publish", "true")
      if (audioFile) fd.append("audio", audioFile)
      if (coverFile) fd.append("cover", coverFile)
      return api.adminUploadTrack(fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] })
      setTitle("")
      setGenreId("")
      setSection("")
      setAlbumId("")
      setAlbumTitle("")
      setFeaturedArtists("")
      setDurationSec("")
      setTrackOrder("")
      setPublish(false)
      setAudioFile(null)
      setCoverFile(null)
      setError("")
    },
    onError: (err: any) => setError(err.message || "Upload failed"),
  })

  const canSubmit = artistId && title.trim() && audioFile
  const creatingNewAlbum = !albumId && albumTitle.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    uploadMutation.mutate()
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <header className="admin-header" style={{ marginBottom: 4 }}>
        <div className="admin-header-text">
          <span className="admin-eyebrow"><span className="admin-eyebrow-dot" aria-hidden />Manual upload</span>
          <h1 className="admin-title">Upload a track</h1>
          <p className="admin-sub">Audio, artwork and metadata — publish now or save as a draft.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="admin-panel">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Artist selector */}
          <div className="admin-field">
            <label className="admin-label">Artist Owner *</label>
            <select
              value={artistId}
              onChange={(e) => { setArtistId(e.target.value); setAlbumId(""); setAlbumTitle("") }}
              required
              className="admin-input"
              style={{ cursor: "pointer" }}
            >
              <option value="">Select artist owner</option>
              {artists?.artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stage_name}
                </option>
              ))}
            </select>
          </div>

          {/* Album Selector */}
          <div className="admin-field">
            <label className="admin-label">Album Collection</label>
            <select
              value={albumId}
              onChange={(e) => { setAlbumId(e.target.value); if (e.target.value) setAlbumTitle("") }}
              disabled={!artistId}
              className="admin-input"
              style={{ cursor: artistId ? "pointer" : "not-allowed", opacity: artistId ? 1 : 0.5 }}
            >
              <option value="">No album collection (Single Release)</option>
              {albums?.albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            {!albumId && artistId && (
              <input
                type="text"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                placeholder="Or enter title to create a new album..."
                className="admin-input"
                style={{ marginTop: "8px" }}
              />
            )}
            {creatingNewAlbum && (
              <p style={{ fontSize: "11px", color: "#22c55e", fontWeight: 600, margin: "4px 0 0 0" }}>
                ✓ A new album titled &ldquo;{albumTitle}&rdquo; will be created automatically.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="admin-field">
            <label className="admin-label">Song Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Copperbelt Anthem"
              required
              className="admin-input"
            />
          </div>

          {/* Description */}
          <div className="admin-field">
            <label className="admin-label">Description <span style={{ fontWeight: 400, color: "var(--muted-foreground)", textTransform: "none", letterSpacing: "normal" }}>— SEO + story</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. credits, inspiration, featured artists, or anything listeners should know..."
              rows={3}
              className="admin-input"
              style={{ lineHeight: 1.5, resize: "vertical" }}
            />
          </div>

          {/* Genre and Duration Grid */}
          <div className="admin-form-grid admin-form-grid-2">
            <div className="admin-field">
              <label className="admin-label">Genre</label>
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                className="admin-input"
                style={{ cursor: "pointer" }}
              >
                <option value="">Select genre</option>
                {genres?.genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Duration (sec)</label>
              <input
                type="number"
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
                placeholder="Auto-detected if left empty"
                className="admin-input"
              />
            </div>
          </div>

          {/* Section */}
          <div className="admin-field">
            <label className="admin-label">Home Page Section</label>
            <SectionSelect value={section} onChange={setSection} />
          </div>

          {/* Featured Artists */}
          <div className="admin-field">
            <label className="admin-label">Featured Artists</label>
            <input
              type="text"
              value={featuredArtists}
              onChange={(e) => setFeaturedArtists(e.target.value)}
              placeholder="Comma-separated list (e.g. Slapdee, Macky2)"
              className="admin-input"
            />
          </div>

          {/* Track Order & Publish */}
          <div className="admin-form-grid admin-form-grid-2">
            <div className="admin-field">
              <label className="admin-label">Track Order</label>
              <input
                type="number"
                value={trackOrder}
                onChange={(e) => setTrackOrder(e.target.value)}
                placeholder="e.g. 1"
                className="admin-input"
              />
            </div>
            <div className="admin-field" style={{ justifyContent: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "13.5px", fontWeight: 650, minHeight: "var(--admin-touch)", padding: "8px 12px", borderRadius: 12, border: "1.5px solid var(--border)", background: publish ? "var(--brand-bg)" : "var(--card-bg)" }}>
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: "var(--brand)", flexShrink: 0 }}
                />
                Publish immediately
              </label>
            </div>
          </div>

          {/* File Upload Fields */}
          <div className="admin-field">
            <label className="admin-label">Audio File * {audioFile && <span style={{ color: "rgb(16,185,129)", textTransform: "none" }}>— {audioFile.name}</span>}</label>
            <label className="admin-file">
              <input
                type="file"
                accept="audio/*"
                required
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="admin-field">
            <label className="admin-label">Cover Artwork {coverFile && <span style={{ color: "rgb(16,185,129)", textTransform: "none" }}>— {coverFile.name}</span>}</label>
            <label className="admin-file">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {error && (
            <div style={{
              padding: "10px", borderRadius: "6px",
              background: "var(--brand-error-bg)", color: "#c53030", fontSize: "13px", fontWeight: 500,
              border: "1px solid var(--brand-error-bg)",
            }}>
              {error}
            </div>
          )}

          <div className="admin-sticky-bar">
            <button
              type="submit"
              disabled={!canSubmit || uploadMutation.isPending}
              className="admin-btn-primary admin-btn-block"
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload track"}
            </button>
          </div>

          {uploadMutation.data && (
            <div style={{
              padding: "12px", borderRadius: "8px",
              background: "#f4fbf7", color: "#22543d", fontSize: "14px", fontWeight: 500,
              border: "1px solid #e6f4ea", textAlign: "center", marginTop: "8px",
            }}>
              ✓ Track uploaded successfully!
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
