"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { toast } from "@/lib/toast-store"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1"

function detectAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.addEventListener("loadedmetadata", () => {
      resolve(Math.round(audio.duration))
      URL.revokeObjectURL(url)
    })
    audio.addEventListener("error", () => {
      resolve(0)
      URL.revokeObjectURL(url)
    })
    audio.src = url
    audio.load()
  })
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export default function AlbumsPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const artistId = user?.artist_id

  // Create album form
  const [albumTitle, setAlbumTitle] = useState("")
  const [albumType, setAlbumType] = useState("album")
  const [albumCover, setAlbumCover] = useState<File | null>(null)
  const [albumCoverPreview, setAlbumCoverPreview] = useState<string | null>(null)
  const [coverDrag, setCoverDrag] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  // Expand / inline upload state
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null)
  const [uploadAlbumId, setUploadAlbumId] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadFeaturedArtists, setUploadFeaturedArtists] = useState("")
  const [uploadAudio, setUploadAudio] = useState<File | null>(null)
  const [uploadDuration, setUploadDuration] = useState(0)
  const [uploadCover, setUploadCover] = useState<File | null>(null)
  const [uploadCoverPreview, setUploadCoverPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["artist-albums", artistId],
    queryFn: () => api.getArtistAlbums(artistId!),
    enabled: !!artistId,
  })
  const albums = data?.albums ?? []

  const { data: creditData } = useQuery({
    queryKey: ["artist-credits"],
    queryFn: () => api.artistGetCredits(),
  })

  const createMut = useMutation({
    mutationFn: (d: { title: string; type: string; cover?: File }) => api.artistCreateAlbum(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["artist-albums"] }); toast("Album created", "success"); resetForm() },
    onError: (e: any) => toast(e?.message || "Failed", "error"),
  })

  const removeTrackMut = useMutation({
    mutationFn: ({ albumId, trackId }: { albumId: string; trackId: string }) => api.artistRemoveTrackFromAlbum(albumId, trackId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["artist-albums"] }); toast("Track removed", "success") },
  })

  function resetForm() {
    setShowForm(false); setAlbumTitle(""); setAlbumType("album")
    setAlbumCover(null); setAlbumCoverPreview(null)
  }

  function resetUpload() {
    setUploadAlbumId(null); setUploadTitle(""); setUploadFeaturedArtists(""); setUploadAudio(null)
    setUploadDuration(0); setUploadCover(null); setUploadCoverPreview(null)
  }

  async function handleUploadToAlbum(albumId: string) {
    if (!uploadTitle.trim() || !uploadAudio) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("title", uploadTitle.trim())
      fd.append("album_id", albumId)
      fd.append("audio", uploadAudio)
      if (uploadDuration > 0) fd.append("duration_sec", String(uploadDuration))
      if (uploadFeaturedArtists.trim()) fd.append("featured_artists", uploadFeaturedArtists.trim())
      if (uploadCover) fd.append("cover", uploadCover)
      const token = localStorage.getItem("access_token")
      await fetch(`${API_BASE}/artists/me/tracks`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Upload failed" }))
          if (res.status === 402) throw new Error("Insufficient credits. Buy more on the Credits page.")
          throw new Error(body.error || "Upload failed")
        }
        return res.json()
      })
      qc.invalidateQueries({ queryKey: ["artist-albums"] })
      qc.invalidateQueries({ queryKey: ["artist-tracks"] })
      toast("Track uploaded to album", "success")
      resetUpload()
    } catch (e: any) { toast(e?.message || "Upload failed", "error") }
    setUploading(false)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Albums</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>{albums.length} albums</p>
        </div>
        <button onClick={() => { showForm ? resetForm() : setShowForm(true) }}
          style={{ padding: "8px 20px", borderRadius: 999, border: showForm ? "1.5px solid var(--border)" : "none", background: showForm ? "transparent" : "var(--brand)", color: showForm ? "var(--foreground)" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Cancel" : "Create Album"}
        </button>
      </div>

      {/* ── Create album form ── */}
      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); if (albumTitle) createMut.mutate({ title: albumTitle, type: albumType, cover: albumCover || undefined }) }}
          style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>New Album</h3>
          <input ref={coverRef} type="file" accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAlbumCover(f); setAlbumCoverPreview(URL.createObjectURL(f)) } }}
            style={{ display: "none" }} />
          <div onClick={() => coverRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setCoverDrag(true) }}
            onDragLeave={(e) => { e.preventDefault(); setCoverDrag(false) }}
            onDrop={(e) => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) { setAlbumCover(f); setAlbumCoverPreview(URL.createObjectURL(f)) } }}
            style={{
              borderRadius: 12, border: coverDrag ? "2px dashed var(--brand)" : albumCoverPreview ? "2px solid var(--brand)" : "2px dashed var(--border)",
              background: coverDrag ? "var(--brand-bg)" : "var(--background)", cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 12, padding: albumCoverPreview ? 8 : 20, overflow: "hidden",
            }}>
            {albumCoverPreview ? (
              <>
                <img src={albumCoverPreview} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Cover selected</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>Click to replace</p></div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setAlbumCover(null); setAlbumCoverPreview(null) }}
                  style={{ padding: "4px 12px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 11, cursor: "pointer" }}>Remove</button>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
                <div><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: coverDrag ? "var(--brand)" : "var(--foreground)" }}>{coverDrag ? "Drop to upload" : "Add cover art"}</p></div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="Album title" autoFocus
              style={{ padding: "8px 14px", borderRadius: 999, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, outline: "none", flex: 1, minWidth: 150 }} />
            <select value={albumType} onChange={(e) => setAlbumType(e.target.value)} style={{ padding: "8px 14px", borderRadius: 999, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, appearance: "none", cursor: "pointer" }}>
              <option value="album">Album</option><option value="ep">EP</option><option value="single">Single</option>
            </select>
            <button type="submit" disabled={createMut.isPending}
              style={{ padding: "8px 18px", borderRadius: 999, border: "none", background: createMut.isPending ? "var(--border)" : "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: createMut.isPending ? "default" : "pointer" }}>
              {createMut.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* ── Album list ── */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}</div>
      ) : albums.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--hover-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "var(--foreground)" }}>No albums yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Create your first album to organize your tracks.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {albums.map((a: any) => {
            const albumTracks = a.tracks || []
            const totalPlays = albumTracks.reduce((s: number, t: any) => s + (t.play_count || 0), 0)
            const isExpanded = expandedAlbum === a.id
            const isUploading = uploadAlbumId === a.id

            return (
              <div key={a.id} style={{ background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* ── Album header (clickable) ── */}
                <div onClick={() => setExpandedAlbum(isExpanded ? null : a.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {a.cover_url ? (
                    <img src={a.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{a.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase" }}>{a.type}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{albumTracks.length} tracks</span>
                      {totalPlays > 0 && (
                        <>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{formatCount(totalPlays)} plays</span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* ── Expanded content: tracks + upload ── */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {/* Track list */}
                    {albumTracks.length > 0 && (
                      <div style={{ padding: "8px 12px" }}>
                        {albumTracks.map((t: any, i: number) => (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, transition: "background 0.1s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <span style={{ width: 18, fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                            </div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{formatCount(t.play_count)} plays</span>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{Math.floor((t.duration_sec || 0) / 60)}:{String((t.duration_sec || 0) % 60).padStart(2, "0")}</span>
                            <button onClick={() => { if (confirm("Remove track from album?")) removeTrackMut.mutate({ albumId: a.id, trackId: t.id }) }}
                              style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 2, borderRadius: 4, lineHeight: 0, opacity: 0.5, transition: "opacity 0.1s" }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                              title="Remove">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Inline upload ── */}
                    {isUploading ? (
                      <div style={{ padding: "12px 16px", borderTop: albumTracks.length > 0 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Track title" autoFocus
                            style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                          <input value={uploadFeaturedArtists} onChange={(e) => setUploadFeaturedArtists(e.target.value)} placeholder="Featured artists (comma-separated)"
                            style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                          {uploadAudio ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "var(--brand-bg)" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><polygon points="5,3 19,12 5,21" /></svg>
                              <span style={{ flex: 1, fontSize: 12, color: "var(--brand)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadAudio.name}</span>
                              <button onClick={() => setUploadAudio(null)} style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", padding: 2, lineHeight: 0 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              </button>
                            </div>
                          ) : (
                            <label style={{ padding: "10px", borderRadius: 8, border: "1.5px dashed var(--border)", cursor: "pointer", textAlign: "center", fontSize: 12, color: "var(--muted-foreground)", fontFamily: "inherit", display: "block" }}>
                              <input type="file" accept="audio/*" onChange={async (e) => { const f = e.target.files?.[0] || null; setUploadAudio(f); setUploadDuration(f ? await detectAudioDuration(f) : 0) }} style={{ display: "none" }} />
                              Click to select audio file
                            </label>
                          )}
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginRight: "auto" }}>
                              <strong style={{ color: (creditData?.balance?.balance ?? 0) > 0 ? "var(--brand)" : "#ef4444" }}>{creditData?.balance?.balance ?? "..."}</strong> credits left
                            </span>
                            <button onClick={resetUpload} style={{ padding: "6px 14px", borderRadius: 999, border: "1.5px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                              Cancel
                            </button>
                            <button onClick={() => handleUploadToAlbum(a.id)} disabled={uploading || !uploadTitle.trim() || !uploadAudio}
                              style={{ padding: "6px 14px", borderRadius: 999, border: "none", background: (uploading || !uploadTitle.trim() || !uploadAudio) ? "var(--border)" : "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: (uploading || !uploadTitle.trim() || !uploadAudio) ? "default" : "pointer", fontFamily: "inherit" }}>
                              {uploading ? "Uploading..." : "Upload"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "8px 16px 12px" }}>
                        <button onClick={() => setUploadAlbumId(a.id)}
                          style={{ background: "none", border: "1px dashed var(--border)", borderRadius: 8, padding: "6px 14px", color: "var(--muted-foreground)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s, color 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted-foreground)" }}>
                          + Upload track to album
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
