"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { Album } from "@/types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { KebabMenu } from "@/components/admin/kebab-menu"
import { AdminModal } from "@/components/admin/admin-modal"
import { Pagination } from "@/components/admin/pagination"

type AlbumType = "album" | "ep" | "single"

const ALBUM_TYPES: AlbumType[] = ["album", "ep", "single"]
const STATUS_OPTIONS = ["draft", "published", "archived"]
const PAGE_SIZE = 24

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

export default function AdminAlbumsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null)

  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["admin-albums"],
    queryFn: () => api.adminListAlbums(1000, 0),
  })

  const { data: artistsData } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(1000, 0),
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

  const pageAlbums = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredAlbums.slice(start, start + PAGE_SIZE)
  }, [filteredAlbums, page])

  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

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
          className="admin-btn-primary"
          style={{ background: showCreate ? "var(--border)" : "var(--brand)", color: showCreate ? "var(--foreground)" : "#fff" }}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div>
              <label className="admin-label">Artist Owner *</label>
              <select value={createArtistId} onChange={(e) => setCreateArtistId(e.target.value)} required className="admin-input" style={{ cursor: "pointer" }}>
                <option value="">Select artist...</option>
                {artists.map((a: any) => <option key={a.id} value={a.id}>{a.stage_name}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Album Title *</label>
              <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="Album title" required className="admin-input" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <div>
              <label className="admin-label">Type</label>
              <select value={createType} onChange={(e) => setCreateType(e.target.value as AlbumType)} className="admin-input" style={{ cursor: "pointer" }}>
                {ALBUM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Status</label>
              <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)} className="admin-input" style={{ cursor: "pointer" }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Cover Art</label>
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
          <button type="submit" disabled={!createArtistId || !createTitle.trim() || createMutation.isPending} className="admin-btn-primary" style={{ alignSelf: "flex-end" }}>
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
          className="admin-search"
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
        <div className="admin-empty">
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
            {search.trim() ? "No matching albums" : "No albums yet"}
          </p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {search.trim() ? "Try a different search term." : "Create your first album to get started."}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {pageAlbums.map((album) => {
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
          <Pagination page={page} pageSize={PAGE_SIZE} total={filteredAlbums.length} onPageChange={setPage} />
        </>
      )}

      {/* Edit Modal */}
      <AdminModal open={!!editingAlbum} title="Edit Album" onClose={() => setEditingAlbum(null)} maxWidth={480}>
        {editingAlbum && (
          <EditAlbumModal
            album={editingAlbum}
            onClose={() => setEditingAlbum(null)}
            onSubmit={(formData) => updateMutation.mutate({ id: editingAlbum.id, formData })}
            isLoading={updateMutation.isPending}
          />
        )}
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingAlbum}
        title="Delete Album"
        message={`Are you sure you want to delete ${deletingAlbum?.title}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deletingAlbum) deleteMutation.mutate(deletingAlbum.id) }}
        onCancel={() => setDeletingAlbum(null)}
      />
    </div>
  )
}

function AlbumCard({ album, artistName, onEdit, onDelete }: {
  album: Album; artistName: string; onEdit: () => void; onDelete: () => void
}) {
  const statusColor = album.status === "published" ? "rgb(16,185,129)" : album.status === "draft" ? "rgb(245,158,11)" : "rgb(148,163,184)"
  const typeLabel = album.type.toUpperCase()

  return (
    <div className="admin-card-lift" style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
      overflow: "hidden",
    }}>
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
          <KebabMenu label={`Actions for ${album.title}`} items={[
            {
              label: "Edit Album",
              onClick: onEdit,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
            },
            {
              label: "Delete Album",
              onClick: onDelete,
              danger: true,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>,
            },
          ]} />
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
  album, onClose, onSubmit, isLoading,
}: {
  album: Album; onClose: () => void; onSubmit: (formData: FormData) => void; isLoading: boolean
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
    <form onSubmit={handleSubmit} style={{ maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Edit Album</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="admin-icon-btn">
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
          <label className="admin-label">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="admin-input" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <div>
            <label className="admin-label">Type</label>
            <select value={type_} onChange={(e) => setType(e.target.value as AlbumType)} className="admin-input" style={{ cursor: "pointer" }}>
              {ALBUM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="admin-label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input" style={{ cursor: "pointer" }}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="admin-label">Cover Art</label>
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
        <button type="button" onClick={onClose} className="admin-btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !title.trim()} className="admin-btn-primary">
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
