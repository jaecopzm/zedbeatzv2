"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { Album } from "@/types"

type AlbumType = "album" | "ep" | "single"

const ALBUM_TYPES: AlbumType[] = ["album", "ep", "single"]
const STATUS_OPTIONS = ["draft", "published", "archived"]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

export default function AdminAlbumsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null)

  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["admin-albums"],
    queryFn: () => api.adminListAlbums(),
  })

  const { data: artistsData } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(),
  })

  const albums: Album[] = albumsData?.albums ?? []
  const artists = artistsData?.artists ?? []

  const filteredAlbums = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return albums
    return albums.filter((a) => {
      const artistName = a.artist_name || artists.find((ar: any) => ar.id === a.artist_id)?.stage_name || ""
      return (
        a.title.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        artistName.toLowerCase().includes(q)
      )
    })
  }, [albums, artists, search])

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.adminCreateAlbum(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] })
      toast("Album created", "success")
      setShowCreate(false)
      resetCreateForm()
    },
    onError: (e: any) => toast(e?.message || "Failed to create album", "error"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.adminUpdateAlbum(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] })
      toast("Album updated", "success")
      setEditingAlbum(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to update album", "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteAlbum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] })
      toast("Album deleted", "success")
      setDeletingAlbum(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to delete album", "error"),
  })

  const [createArtistId, setCreateArtistId] = useState("")
  const [createTitle, setCreateTitle] = useState("")
  const [createType, setCreateType] = useState<AlbumType>("album")
  const [createStatus, setCreateStatus] = useState("draft")
  const [createCover, setCreateCover] = useState<File | null>(null)
  const [createCoverPreview, setCreateCoverPreview] = useState<string | null>(null)

  function resetCreateForm() {
    setCreateArtistId("")
    setCreateTitle("")
    setCreateType("album")
    setCreateStatus("draft")
    setCreateCover(null)
    setCreateCoverPreview(null)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("artist_id", createArtistId)
    fd.append("title", createTitle)
    fd.append("type", createType)
    fd.append("status", createStatus)
    if (createStatus === "published") fd.append("publish", "true")
    if (createCover) fd.append("cover", createCover)
    createMutation.mutate(fd)
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
            Manage Albums
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "4px 0 0" }}>
            {albums.length} album{albums.length === 1 ? "" : "s"} · EPs, singles, and compilations
          </p>
        </div>
        <button
          onClick={() => { resetCreateForm(); setShowCreate(!showCreate) }}
          style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: showCreate ? "var(--border)" : "var(--brand)", color: showCreate ? "var(--foreground)" : "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {showCreate ? "Cancel" : "+ New Album"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{
          background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
          padding: "24px 28px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 16,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Create New Album</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Artist Owner *</label>
              <select value={createArtistId} onChange={(e) => setCreateArtistId(e.target.value)} required style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                <option value="">Select artist...</option>
                {artists.map((a: any) => <option key={a.id} value={a.id}>{a.stage_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Album Title *</label>
              <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="Album title" required style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit",
              }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
              <select value={createType} onChange={(e) => setCreateType(e.target.value as AlbumType)} style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                {ALBUM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
              <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)} style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cover Art</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) { setCreateCover(f); setCreateCoverPreview(URL.createObjectURL(f)) }
              }} style={{ fontSize: 13, color: "var(--foreground)" }} />
            </div>
          </div>
          {createCoverPreview && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src={createCoverPreview} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
              <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Cover preview</span>
            </div>
          )}
          <button type="submit" disabled={!createArtistId || !createTitle.trim() || createMutation.isPending} style={{
            alignSelf: "flex-end", padding: "10px 24px", borderRadius: 10, border: "none",
            background: createMutation.isPending ? "var(--border)" : "var(--brand)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
            opacity: (!createArtistId || !createTitle.trim() || createMutation.isPending) ? 0.5 : 1,
          }}>
            {createMutation.isPending ? "Creating..." : "Create Album"}
          </button>
        </form>
      )}

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search albums by title, artist, type..."
          style={{
            width: "100%", maxWidth: 480, padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--background)",
            color: "var(--foreground)", fontSize: 14, outline: "none",
            transition: "border-color 0.15s ease",
          }}
        />
      </div>

      {/* Albums Grid */}
      {albumsLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 12 }} />
              <div className="skeleton" style={{ width: "70%", height: 16 }} />
              <div className="skeleton" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
          padding: "64px 24px", textAlign: "center", color: "var(--muted-foreground)",
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
            {search.trim() ? "No matching albums" : "No albums yet"}
          </p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {search.trim() ? "Try a different search term." : "Create your first album to get started."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {filteredAlbums.map((album) => {
            const artist = artists.find((a: any) => a.id === album.artist_id)
            return (
              <AlbumCard
                key={album.id}
                album={album}
                artistName={artist?.stage_name || album.artist_name || "Unknown"}
                onEdit={() => setEditingAlbum(album)}
                onDelete={() => setDeletingAlbum(album)}
              />
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingAlbum && (
        <EditAlbumModal
          album={editingAlbum}
          artists={artists}
          onClose={() => setEditingAlbum(null)}
          onSubmit={(formData) => updateMutation.mutate({ id: editingAlbum.id, formData })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {deletingAlbum && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingAlbum(null) }}
        >
          <div style={{
            background: "var(--background)", border: "1px solid var(--border)", borderRadius: 16,
            padding: "28px 32px", maxWidth: 420, width: "100%",
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>
              Delete Album
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deletingAlbum.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeletingAlbum(null)} style={{
                padding: "9px 18px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "transparent", color: "var(--foreground)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(deletingAlbum.id)} disabled={deleteMutation.isPending} style={{
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: deleteMutation.isPending ? "var(--border)" : "rgb(239,68,68)", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AlbumCard({ album, artistName, onEdit, onDelete }: {
  album: Album; artistName: string; onEdit: () => void; onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const statusColor = album.status === "published" ? "rgb(16,185,129)" : album.status === "draft" ? "rgb(245,158,11)" : "rgb(148,163,184)"
  const typeLabel = album.type.toUpperCase()

  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
      overflow: "hidden", transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.05)" }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
    >
      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", background: "linear-gradient(135deg, var(--brand-bg), var(--hover-bg))" }}>
        {album.cover_url ? (
          <img src={album.cover_url} alt={album.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: "rgba(0,0,0,0.45)", color: "#fff", backdropFilter: "blur(4px)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {typeLabel}
          </span>
          <span style={{
            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: `${statusColor}20`, color: statusColor,
            backdropFilter: "blur(4px)", textTransform: "capitalize",
          }}>
            {album.status}
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 16px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {album.title}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artistName}
            </p>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--muted-foreground)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4,
                background: "var(--background)", border: "1px solid var(--border)", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 140, overflow: "hidden",
              }}>
                <button onClick={() => { onEdit(); setShowMenu(false) }} style={{
                  width: "100%", padding: "9px 14px", border: "none", background: "transparent",
                  color: "var(--foreground)", fontSize: 13, cursor: "pointer", textAlign: "left",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  Edit Album
                </button>
                <button onClick={() => { onDelete(); setShowMenu(false) }} style={{
                  width: "100%", padding: "9px 14px", border: "none", background: "transparent",
                  color: "rgb(239,68,68)", fontSize: 13, cursor: "pointer", textAlign: "left",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  Delete Album
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12, color: "var(--muted-foreground)" }}>
          <span>{album.tracks?.length ?? 0} tracks</span>
          <span>·</span>
          <span>{formatDate(album.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function EditAlbumModal({
  album, artists, onClose, onSubmit, isLoading,
}: {
  album: Album; artists: any[]; onClose: () => void; onSubmit: (formData: FormData) => void; isLoading: boolean
}) {
  const [title, setTitle] = useState(album.title)
  const [type_, setType] = useState<AlbumType>(album.type as AlbumType)
  const [status, setStatus] = useState(album.status)
  const [coverPreview, setCoverPreview] = useState<string | null>(album.cover_url)
  const coverRef = useRef<HTMLInputElement | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("title", title)
    fd.append("type", type_)
    fd.append("status", status)
    if (coverRef.current?.files?.[0]) fd.append("cover", coverRef.current.files[0])
    onSubmit(fd)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <form onSubmit={handleSubmit} style={{
        background: "var(--background)", border: "1px solid var(--border)", borderRadius: 20,
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Edit Album</h2>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {coverPreview ? (
              <img src={coverPreview} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
                display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--border)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{album.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                ID: {album.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit",
            }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
              <select value={type_} onChange={(e) => setType(e.target.value as AlbumType)} style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                {ALBUM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cover Art</label>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setCoverPreview(URL.createObjectURL(f))
              }}
              style={{ fontSize: 13, color: "var(--foreground)" }}
            />
            {coverPreview && (
              <div style={{ marginTop: 8 }}>
                <img src={coverPreview} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 10, border: "1.5px solid var(--border)", background: "transparent",
            color: "var(--foreground)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            Cancel
          </button>
          <button type="submit" disabled={isLoading || !title.trim()} style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: isLoading ? "var(--border)" : "var(--brand)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
          }}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
