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
    <div className="fade-in">
      <div style={{ marginBottom: "24px", maxWidth: "680px", margin: "0 auto 24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
          Upload New Song Catalog
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: "4px 0 0 0" }}>
          Provide details to manually populate individual track records
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        maxWidth: "680px",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Artist selector */}
          <div>
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
          <div>
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
          <div>
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
          <div>
            <label className="admin-label">Description <span style={{ fontWeight: 400, color: "var(--muted-foreground)", textTransform: "none", letterSpacing: "normal" }}>— helps SEO, tell the story behind the track</span></label>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
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
            <div>
              <label className="admin-label">Duration (Seconds)</label>
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
          <div>
            <label className="admin-label">Home Page Section</label>
            <SectionSelect value={section} onChange={setSection} />
          </div>

          {/* Featured Artists */}
          <div>
            <label className="admin-label">Collaborators / Featured Artists</label>
            <input
              type="text"
              value={featuredArtists}
              onChange={(e) => setFeaturedArtists(e.target.value)}
              placeholder="Comma-separated list (e.g. Slapdee, Macky2)"
              className="admin-input"
            />
          </div>

          {/* Track Order & Publish */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label className="admin-label">Track Catalog Number (Order)</label>
              <input
                type="number"
                value={trackOrder}
                onChange={(e) => setTrackOrder(e.target.value)}
                placeholder="e.g. 1"
                className="admin-input"
              />
            </div>
            <div style={{ display: "flex", alignItems: "end", paddingBottom: "10px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 550 }}>
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--active-fg)" }}
                />
                Publish Immediately
              </label>
            </div>
          </div>

          {/* File Upload Fields */}
          <div>
            <label className="admin-label">Audio Track File *</label>
            <input
              type="file"
              accept="audio/*"
              required
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              style={{ fontSize: "13px", color: "var(--muted-foreground)" }}
            />
          </div>

          <div>
            <label className="admin-label">Cover Image Artwork</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              style={{ fontSize: "13px", color: "var(--muted-foreground)" }}
            />
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

          <button
            type="submit"
            disabled={!canSubmit || uploadMutation.isPending}
            className="admin-btn-primary"
            style={{ width: "100%", padding: "14px", marginTop: "10px" }}
          >
            {uploadMutation.isPending ? "Uploading Track..." : "Upload Track Metadata"}
          </button>

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
