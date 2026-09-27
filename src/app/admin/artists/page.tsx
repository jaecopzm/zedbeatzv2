"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { Artist } from "@/types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { KebabMenu } from "@/components/admin/kebab-menu"
import { AdminModal } from "@/components/admin/admin-modal"
import { Pagination } from "@/components/admin/pagination"

const PAGE_SIZE = 24

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

export default function AdminArtistsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [deletingArtist, setDeletingArtist] = useState<Artist | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(1000, 0),
  })

  const artists: Artist[] = data?.artists ?? []

  const filteredArtists = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return artists
    return artists.filter((a) =>
      a.stage_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.bio && a.bio.toLowerCase().includes(q)),
    )
  }, [artists, search])

  const pageArtists = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredArtists.slice(start, start + PAGE_SIZE)
  }, [filteredArtists, page])

  // Reset to page 1 when search changes
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.adminUpdateArtist(editingArtist!.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] })
      toast("Artist updated successfully", "success")
      setEditingArtist(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to update artist", "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteArtist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] })
      toast("Artist deleted", "success")
      setDeletingArtist(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to delete artist", "error"),
  })

  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
          <h1 className="admin-title">Artists</h1>
          <p className="admin-sub">
            {artists.length} artist{artists.length === 1 ? "" : "s"} registered
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="admin-toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or bio…"
          className="admin-search"
          aria-label="Search artists"
        />
      </div>

      {/* Artists Grid */}
      {isLoading ? (
        <div className="admin-skel-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="admin-card" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "1.2", borderRadius: 12 }} />
              <div className="skeleton" style={{ width: "70%", height: 15 }} />
              <div className="skeleton" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: "var(--foreground)" }}>
            {search.trim() ? "No matching artists" : "No artists yet"}
          </p>
          <p style={{ fontSize: 13.5, margin: 0 }}>
            {search.trim() ? "Try a different search term." : "Artists will appear here once they register."}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-tiles">
            {pageArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onEdit={() => setEditingArtist(artist)}
                onDelete={() => setDeletingArtist(artist)}
              />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filteredArtists.length} onPageChange={setPage} />
        </>
      )}

      {/* Edit Modal */}
      <AdminModal open={!!editingArtist} title="Edit Artist" onClose={() => setEditingArtist(null)} maxWidth={520}>
        {editingArtist && (
          <EditArtistModal
            artist={editingArtist}
            onClose={() => setEditingArtist(null)}
            onSubmit={(formData) => updateMutation.mutate(formData)}
            isLoading={updateMutation.isPending}
          />
        )}
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingArtist}
        title="Delete Artist"
        message={`Are you sure you want to delete ${deletingArtist?.stage_name}? This action cannot be undone.`}
        confirmLabel="Delete Artist"
        onConfirm={() => { if (deletingArtist) deleteMutation.mutate(deletingArtist.id) }}
        onCancel={() => setDeletingArtist(null)}
      />
    </div>
  )
}

function ArtistCard({ artist, onEdit, onDelete }: {
  artist: Artist; onEdit: () => void; onDelete: () => void
}) {
  return (
    <article className="admin-card admin-card-lift" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative", aspectRatio: "1.35", overflow: "hidden", background: "var(--hover-bg)" }}>
        {artist.cover_url ? (
          <img src={artist.cover_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", opacity: 0.4 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
            </svg>
          </div>
        )}
        {artist.verified && (
          <span className="admin-pill" style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.65)", color: "#fff",
          }}>
            Verified
          </span>
        )}
      </div>

      <div className="admin-tile-body" style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist.stage_name}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist.email}
            </p>
          </div>
          <KebabMenu label={`Actions for ${artist.stage_name}`} items={[
            {
              label: "Edit Profile",
              onClick: onEdit,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
            },
            {
              label: "Delete Artist",
              onClick: onDelete,
              danger: true,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>,
            },
          ]} />
        </div>

        <p style={{
          margin: "7px 0 0", fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {artist.bio || "No biography provided."}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11.5, color: "var(--muted-foreground)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(artist.created_at)}
        </div>
      </div>
    </article>
  )
}

function EditArtistModal({
  artist, onClose, onSubmit, isLoading,
}: {
  artist: Artist; onClose: () => void; onSubmit: (formData: FormData) => void; isLoading: boolean
}) {
  const [stageName, setStageName] = useState(artist.stage_name)
  const [bio, setBio] = useState(artist.bio || "")
  const [location, setLocation] = useState(artist.location || "")
  const [verified, setVerified] = useState(artist.verified)
  const [photoPreview, setPhotoPreview] = useState<string | null>(artist.photo_url)
  const photoRef = useRef<HTMLInputElement | null>(null)
  const coverRef = useRef<HTMLInputElement | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.append("stage_name", stageName)
    formData.append("bio", bio)
    formData.append("location", location)
    formData.append("verified", verified ? "true" : "false")
    if (photoRef.current?.files?.[0]) formData.append("photo", photoRef.current.files[0])
    if (coverRef.current?.files?.[0]) formData.append("cover", coverRef.current.files[0])
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Edit Artist</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="admin-icon-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {photoPreview ? (
            <img src={photoPreview} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18, fontWeight: 600, border: "1px solid var(--border)",
            }}>
              {artist.stage_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{artist.email}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
              ID: {artist.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div>
          <label className="admin-label">Stage Name *</label>
          <input value={stageName} onChange={(e) => setStageName(e.target.value)} required className="admin-input" />
        </div>

        <div>
          <label className="admin-label">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Artist biography..." className="admin-input" style={{ resize: "vertical" }} />
        </div>

        <div>
          <label className="admin-label">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="admin-input" />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px", minWidth: 180 }}>
            <label className="admin-label">Photo</label>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setPhotoPreview(URL.createObjectURL(f))
              }}
              style={{ fontSize: 13, color: "var(--foreground)" }}
            />
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 180 }}>
            <label className="admin-label">Cover Image</label>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              style={{ fontSize: 13, color: "var(--foreground)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <input
            type="checkbox"
            id="verified"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--brand)", cursor: "pointer" }}
          />
          <label htmlFor="verified" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--foreground)", cursor: "pointer", flex: 1 }}>
            Verified Artist
          </label>
        </div>
      </div>

      <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
        <button type="button" onClick={onClose} className="admin-btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !stageName.trim()} className="admin-btn-primary">
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
