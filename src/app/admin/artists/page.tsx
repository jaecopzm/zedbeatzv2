"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { Artist } from "@/types"

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

export default function AdminArtistsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [deletingArtist, setDeletingArtist] = useState<Artist | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(),
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
            Manage Artists
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "4px 0 0" }}>
            {artists.length} artist{artists.length === 1 ? "" : "s"} registered
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or bio..."
          style={{
            width: "100%", maxWidth: 480, padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--background)",
            color: "var(--foreground)", fontSize: 14, outline: "none",
            transition: "border-color 0.15s ease",
          }}
        />
      </div>

      {/* Artists Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 12 }} />
              <div className="skeleton" style={{ width: "70%", height: 16 }} />
              <div className="skeleton" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </div>
      ) : filteredArtists.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
          padding: "64px 24px", textAlign: "center", color: "var(--muted-foreground)",
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
            {search.trim() ? "No matching artists" : "No artists registered yet"}
          </p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {search.trim() ? "Try a different search term." : "Artists will appear here once they register."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onEdit={() => setEditingArtist(artist)}
              onDelete={() => setDeletingArtist(artist)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingArtist && (
        <EditArtistModal
          artist={editingArtist}
          onClose={() => setEditingArtist(null)}
          onSubmit={(formData) => updateMutation.mutate(formData)}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {deletingArtist && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingArtist(null) }}
        >
          <div style={{
            background: "var(--background)", border: "1px solid var(--border)", borderRadius: 16,
            padding: "28px 32px", maxWidth: 420, width: "100%",
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>
              Delete Artist
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deletingArtist.stage_name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeletingArtist(null)}
                style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingArtist.id)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "none",
                  background: deleteMutation.isPending ? "var(--border)" : "rgb(239,68,68)", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: deleteMutation.isPending ? "default" : "pointer", fontFamily: "inherit",
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Artist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ArtistCard({ artist, onEdit, onDelete }: {
  artist: Artist; onEdit: () => void; onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
      overflow: "hidden", transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.05)" }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
    >
      <div style={{ position: "relative", aspectRatio: "1.2", overflow: "hidden", background: "linear-gradient(135deg, var(--brand-bg), var(--hover-bg))" }}>
        {artist.cover_url ? (
          <img src={artist.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
          {artist.verified && (
            <span style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: "rgba(59,130,246,0.15)", color: "rgb(59,130,246)",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 18px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist.stage_name}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgb(59,130,246)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist.email}
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
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 150, overflow: "hidden",
              }}>
                <button onClick={() => { onEdit(); setShowMenu(false) }} style={{ width: "100%", padding: "9px 14px", border: "none", background: "transparent", color: "var(--foreground)", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  Edit Profile
                </button>
                <button onClick={() => { onDelete(); setShowMenu(false) }} style={{ width: "100%", padding: "9px 14px", border: "none", background: "transparent", color: "rgb(239,68,68)", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  Delete Artist
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{
          margin: "8px 0 0", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {artist.bio || "No biography provided."}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, fontSize: 12, color: "var(--muted-foreground)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(artist.created_at)}
          </span>
        </div>
      </div>
    </div>
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
  const [coverPreview, setCoverPreview] = useState<string | null>(artist.cover_url)
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
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <form onSubmit={handleSubmit} style={{
        background: "var(--background)", border: "1px solid var(--border)", borderRadius: 20,
        width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Edit Artist</h2>
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
            {photoPreview ? (
              <img src={photoPreview} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 20, fontWeight: 700, border: "2px solid var(--border)",
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
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage Name *</label>
            <input value={stageName} onChange={(e) => setStageName(e.target.value)} required style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit",
            }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Artist biography..." style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical",
            }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit",
            }} />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Photo</label>
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
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cover Image</label>
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
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <input
              type="checkbox"
              id="verified"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--brand)", cursor: "pointer" }}
            />
            <label htmlFor="verified" style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", cursor: "pointer", flex: 1 }}>
              Verified Artist
            </label>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={verified ? "rgb(59,130,246)" : "var(--muted-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 10, border: "1.5px solid var(--border)", background: "transparent",
            color: "var(--foreground)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            Cancel
          </button>
          <button type="submit" disabled={isLoading || !stageName.trim()} style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: isLoading ? "var(--border)" : "var(--brand)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: isLoading ? "default" : "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
          }}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
