"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import Link from "next/link"

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
    queryFn: () => api.adminListArtists(),
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

      <div style={{
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
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Artist Owner *
            </label>
            <select
              value={artistId}
              onChange={(e) => { setArtistId(e.target.value); setAlbumId(""); setAlbumTitle("") }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
              }}
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
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Album Collection
            </label>
            <select
              value={albumId}
              onChange={(e) => { setAlbumId(e.target.value); if (e.target.value) setAlbumTitle("") }}
              disabled={!artistId}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                opacity: artistId ? 1 : 0.5,
              }}
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
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  outline: "none",
                  marginTop: "8px",
                }}
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
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Song Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Copperbelt Anthem"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Description <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>— helps SEO, tell the story behind the track</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. credits, inspiration, featured artists, or anything listeners should know..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
                lineHeight: 1.5,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Genre and Duration Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
                Genre
              </label>
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
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
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
                Duration (Seconds)
              </label>
              <input
                type="number"
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
                placeholder="Auto-detected if left empty"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Section */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Home Page Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">None</option>
              <option value="best_new_songs">Best New Songs</option>
              <option value="new_this_week">New This Week</option>
              <option value="zed_hip_hop">Zambian Hip Hop</option>
              <option value="zed_oldies">Zed Oldies</option>
              <option value="zed_afrobeats">Zambian Afrobeats</option>
              <option value="zed_gospel">Zambian Gospel</option>
              <option value="zed_rnb">Zambian R&B</option>
              <option value="zed_dancehall">Zambian Dancehall</option>
              <option value="zed_kalindula">Kalindula</option>
              <option value="zed_bangers">Zed Bangers</option>
              <option value="zed_collabos">Big Collabos</option>
              <option value="fresh_voices">Fresh Voices</option>
              <option value="throwback_thursday">Throwback Thursday</option>
            </select>
          </div>

          {/* Featured Artists */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Collaborators / Featured Artists
            </label>
            <input
              type="text"
              value={featuredArtists}
              onChange={(e) => setFeaturedArtists(e.target.value)}
              placeholder="Comma-separated list (e.g. Slapdee, Macky2)"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {/* Track Order & Publish */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
                Track Catalog Number (Order)
              </label>
              <input
                type="number"
                value={trackOrder}
                onChange={(e) => setTrackOrder(e.target.value)}
                placeholder="e.g. 1"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  outline: "none",
                }}
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
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Audio Track File *
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              style={{
                fontSize: "13px",
                color: "var(--muted-foreground)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              Cover Image Artwork
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              style={{
                fontSize: "13px",
                color: "var(--muted-foreground)",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px",
              borderRadius: "6px",
              background: "var(--brand-bg)",
              color: "#c53030",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid var(--brand-bg)",
            }}>
              {error}
            </div>
          )}

          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!canSubmit || uploadMutation.isPending}
            style={{
              width: "100%",
              background: "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
              opacity: (!canSubmit || uploadMutation.isPending) ? 0.5 : 1,
              boxShadow: "0 4px 14px var(--brand-shadow)",
              marginTop: "10px"
            }}
          >
            {uploadMutation.isPending ? "Uploading Track..." : "Upload Track Metadata"}
          </button>

          {uploadMutation.data && (
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#f4fbf7",
              color: "#22543d",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #e6f4ea",
              textAlign: "center",
              marginTop: "8px",
            }}>
              ✓ Track uploaded successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
