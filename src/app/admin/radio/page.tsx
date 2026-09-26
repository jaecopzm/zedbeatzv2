"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { RadioStation, RadioStationTrack } from "@/types"
import { formatDuration } from "@/lib/utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { KebabMenu } from "@/components/admin/kebab-menu"
import { AdminModal } from "@/components/admin/admin-modal"

const ADMIN_RADIO_QS_KEY = ["admin-radio"]

export default function AdminRadioPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ADMIN_RADIO_QS_KEY,
    queryFn: () => api.adminListStations(),
  })

  const allStations: RadioStation[] = data?.stations ?? []

  const stations = useMemo(() => ({
    genre: allStations.filter((s) => s.type === "genre"),
    curated: allStations.filter((s) => s.type === "curated"),
    playlist: allStations.filter((s) => s.type === "playlist"),
  }), [allStations])

  const hasAny = stations.genre.length > 0 || stations.curated.length > 0 || stations.playlist.length > 0

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [genreId, setGenreId] = useState("")
  const [stationType, setStationType] = useState("curated")

  const [showTrackModal, setShowTrackModal] = useState(false)
  const [trackStationId, setTrackStationId] = useState<string | null>(null)
  const [trackSearch, setTrackSearch] = useState("")
  const [deletingStation, setDeletingStation] = useState<RadioStation | null>(null)

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => api.adminCreateStation(fd),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY }); resetForm(); toast("Station created", "success") },
    onError: (e: any) => toast(e?.message || "Failed to create station", "error"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => api.adminUpdateStation(id, fd),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY }); resetForm(); toast("Station updated", "success") },
    onError: (e: any) => toast(e?.message || "Failed to update station", "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY })
      toast("Station deleted", "success")
      setDeletingStation(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to delete station", "error"),
  })

  const addTrackMutation = useMutation({
    mutationFn: ({ id, trackId, order }: { id: string; trackId: string; order?: number }) =>
      api.adminAddStationTrack(id, trackId, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY })
      if (trackStationId) queryClient.invalidateQueries({ queryKey: ["radio-station-tracks", trackStationId] })
      toast("Track added", "success")
    },
    onError: (e: any) => toast(e?.message || "Failed to add track", "error"),
  })

  const removeTrackMutation = useMutation({
    mutationFn: ({ id, trackId }: { id: string; trackId: string }) => api.adminRemoveStationTrack(id, trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY })
      if (trackStationId) queryClient.invalidateQueries({ queryKey: ["radio-station-tracks", trackStationId] })
      toast("Track removed", "success")
    },
    onError: (e: any) => toast(e?.message || "Failed to remove track", "error"),
  })

  const { data: trackSearchData, isLoading: trackSearchLoading } = useQuery({
    queryKey: ["track-search", trackSearch],
    queryFn: () => api.searchTracks(trackSearch),
    enabled: trackSearch.length > 1,
  })

  const { data: stationTracksData } = useQuery({
    queryKey: ["radio-station-tracks", trackStationId],
    queryFn: () => api.getRadioStation(trackStationId!).then((d) => d.tracks ?? []),
    enabled: !!trackStationId,
  })

  const currentStation = trackStationId ? allStations.find((s) => s.id === trackStationId) : null
  const currentTracks: RadioStationTrack[] = stationTracksData ?? []

  const handleManageTracks = (station: RadioStation) => {
    setTrackStationId(station.id)
    setShowTrackModal(true)
    setTrackSearch("")
  }

  const handleQuickAdd = (trackId: string) => {
    if (!trackStationId) return
    addTrackMutation.mutate({ id: trackStationId, trackId, order: 0 })
  }

  const handleQuickRemove = (trackId: string) => {
    if (!trackStationId) return
    removeTrackMutation.mutate({ id: trackStationId, trackId })
  }

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setName("")
    setDescription("")
    setCoverUrl("")
    setCoverFile(null)
    setCoverPreview(null)
    setGenreId("")
    setStationType("curated")
  }

  function startEdit(s: RadioStation) {
    setEditingId(s.id)
    setName(s.name)
    setDescription(s.description || "")
    setCoverUrl(s.cover_url || "")
    setCoverFile(null)
    setCoverPreview(s.cover_url || null)
    setGenreId(s.genre_id || "")
    setStationType(s.type)
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("name", name)
    if (description) fd.append("description", description)
    if (genreId) fd.append("genre_id", genreId)
    if (coverFile) fd.append("cover", coverFile)
    else if (coverUrl) fd.append("cover_url", coverUrl)
    if (editingId) updateMutation.mutate({ id: editingId, fd })
    else createMutation.mutate(fd)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
          <span className="admin-eyebrow"><span className="admin-eyebrow-dot" aria-hidden />Curation</span>
          <h1 className="admin-title">Radio</h1>
          <p className="admin-sub">Curated stations, genre feeds and playlists.</p>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="admin-btn-primary"
          >
            + New station
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
            {editingId ? "Edit station" : "New station"}
          </h2>
          <div className="admin-form-grid admin-form-grid-2">
            <div className="admin-field">
              <label className="admin-label">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Station name" required className="admin-input" />
            </div>
            <div className="admin-field">
              <label className="admin-label">Type</label>
              <select value={stationType} onChange={(e) => setStationType(e.target.value)} className="admin-input">
                <option value="curated">Curated</option>
                <option value="genre">Genre</option>
                <option value="playlist">Playlist</option>
              </select>
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-label">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="admin-input" />
          </div>
          <div className="admin-field">
            <label className="admin-label">Cover {coverPreview && <span style={{ color: "rgb(16,185,129)", textTransform: "none" }}>— attached</span>}</label>
            <label className="admin-file">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setCoverFile(f)
                    setCoverPreview(URL.createObjectURL(f))
                    setCoverUrl("")
                  }
                }}
              />
            </label>
            {coverPreview && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <img src={coverPreview} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null) }} style={{ fontSize: 12.5, color: "rgb(239,68,68)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}>Remove</button>
              </div>
            )}
            {!coverPreview && (
              <input value={coverUrl} onChange={(e) => { setCoverUrl(e.target.value); setCoverFile(null); setCoverPreview(null) }} placeholder="Or paste image URL…" className="admin-input" style={{ marginTop: 8 }} />
            )}
          </div>
          <div className="admin-sticky-bar">
            <button type="submit" className="admin-btn-primary" style={{ flex: 1 }} disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Saving…" : (editingId ? "Update station" : "Create station")}
            </button>
            <button type="button" onClick={resetForm} className="admin-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="admin-skel-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="admin-card" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "1.5", borderRadius: 12 }} />
              <div className="skeleton" style={{ width: "70%", height: 15 }} />
              <div className="skeleton" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </div>
      ) : !hasAny ? (
        <div className="admin-empty">
          <div className="admin-empty-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5a6.36 6.36 0 0 0 0 9M16.5 7.5a6.36 6.36 0 0 1 0 9" /></svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: "var(--foreground)" }}>No stations yet</p>
          <p style={{ fontSize: 13.5, margin: 0 }}>Create your first radio station to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {(["curated", "genre", "playlist"] as const).map((type) => {
            const list = stations[type]
            if (list.length === 0) return null
            const title = type === "curated" ? "Curated Stations" : type === "genre" ? "Genre Stations" : "Radio Playlists"
            return (
              <Section key={type} title={title}>
                {list.map((s) => (
                  <StationCard
                    key={s.id}
                    station={s}
                    onEdit={() => startEdit(s)}
                    onDelete={() => setDeletingStation(s)}
                    onManageTracks={() => handleManageTracks(s)}
                  />
                ))}
              </Section>
            )
          })}
        </div>
      )}

      {/* Track Management Modal */}
      <AdminModal open={showTrackModal && !!trackStationId} title={currentStation?.name ?? "Manage Tracks"} onClose={() => { setShowTrackModal(false); setTrackStationId(null); setTrackSearch("") }} maxWidth={720}>
        <TrackManagementModal
          station={currentStation}
          tracks={currentTracks}
          trackSearch={trackSearch}
          setTrackSearch={setTrackSearch}
          trackSearchResults={trackSearchData?.tracks ?? []}
          trackSearchLoading={trackSearchLoading}
          handleQuickAdd={handleQuickAdd}
          handleQuickRemove={handleQuickRemove}
          addTrackLoading={addTrackMutation.isPending}
          removeTrackLoading={removeTrackMutation.isPending}
          onClose={() => { setShowTrackModal(false); setTrackStationId(null); setTrackSearch("") }}
        />
      </AdminModal>

      <ConfirmDialog
        open={!!deletingStation}
        title="Delete Station"
        message={`Are you sure you want to delete "${deletingStation?.name}"? This will remove the station and its track assignments.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deletingStation) deleteMutation.mutate(deletingStation.id) }}
        onCancel={() => setDeletingStation(null)}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--muted-foreground)", margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {title}
      </h2>
      <div className="admin-tiles">
        {children}
      </div>
    </div>
  )
}

function StationCard({ station, onEdit, onDelete, onManageTracks }: {
  station: RadioStation; onEdit: () => void; onDelete: () => void; onManageTracks: () => void
}) {
  return (
    <article className="admin-card admin-card-lift" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative", aspectRatio: "1.6", overflow: "hidden", background: "linear-gradient(135deg, var(--brand-bg), var(--hover-bg))" }}>
        {station.cover_url ? (
          <img src={station.cover_url} alt={station.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.7}>
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
            </svg>
          </div>
        )}
        <span className="admin-pill" style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(10,14,30,0.55)", color: "#fff",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          textTransform: "capitalize",
        }}>
          <span aria-hidden style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: station.is_active ? "#22c55e" : "#94a3b8", marginRight: 2 }} />
          {station.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="admin-tile-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {station.name}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {station.description || `${station.track_count} tracks · /${station.slug}`}
            </p>
          </div>
          <KebabMenu label={`Actions for ${station.name}`} items={[
            {
              label: "Edit Station",
              onClick: onEdit,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
            },
            {
              label: "Manage Tracks",
              onClick: onManageTracks,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
            },
            {
              label: "Delete Station",
              onClick: onDelete,
              danger: true,
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>,
            },
          ]} />
        </div>
        <button
          type="button"
          onClick={onManageTracks}
          className="admin-btn-secondary admin-btn-sm admin-btn-block"
          style={{ marginTop: 10 }}
        >
          Manage tracks · {station.track_count}
        </button>
      </div>
    </article>
  )
}

function TrackManagementModal({
  station, tracks, trackSearch, setTrackSearch,
  trackSearchResults, trackSearchLoading, handleQuickAdd, handleQuickRemove,
  addTrackLoading, removeTrackLoading, onClose,
}: {
  station: RadioStation | null | undefined; tracks: RadioStationTrack[]; trackSearch: string;
  setTrackSearch: (v: string) => void;
  trackSearchResults: any[]; trackSearchLoading: boolean;
  handleQuickAdd: (id: string) => void; handleQuickRemove: (id: string) => void;
  addTrackLoading: boolean; removeTrackLoading: boolean; onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        {station?.cover_url ? (
          <img src={station.cover_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" /></svg>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--foreground)" }}>{station?.name ?? "Manage Tracks"}</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
            {tracks.length} tracks in station
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="admin-icon-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Current Tracks */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Tracks</h3>
        </div>
        {tracks.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", textAlign: "center", padding: "24px 0" }}>No tracks in this station. Search and add tracks below.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tracks.map((tx) => (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
                background: "var(--card-bg)", border: "1px solid var(--border)",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--active-fg)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)" }}
              >
                {tx.cover_url ? (
                  <img src={tx.cover_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: "var(--hover-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /></svg>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.title}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>{tx.artist_name}</p>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0 }}>{formatDuration(tx.duration_sec)}</span>
                <button
                  onClick={() => handleQuickRemove(tx.id)}
                  disabled={removeTrackLoading}
                  aria-label={`Remove ${tx.title} from station`}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent",
                    color: "rgb(239,68,68)", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  title="Remove from station"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Add */}
      <div style={{ borderTop: "1px solid var(--border)", padding: 16, flexShrink: 0 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Add Tracks</h3>
        <input
          type="text"
          value={trackSearch}
          onChange={(e) => setTrackSearch(e.target.value)}
          placeholder="Search tracks by title or artist..."
          className="admin-input"
          style={{ marginBottom: 12, background: "var(--card-bg)" }}
        />
        {trackSearch.length > 1 && (
          <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            {trackSearchLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />
                ))}
              </div>
            ) : trackSearchResults.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted-foreground)", textAlign: "center", padding: "16px 0" }}>No tracks found.</p>
            ) : (
              trackSearchResults.slice(0, 20).map((track: any) => {
                const isInStation = tracks.some((t) => t.id === track.id)
                return (
                  <div key={track.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8,
                    background: "var(--card-bg)", border: "1px solid var(--border)", opacity: isInStation ? 0.5 : 1,
                  }}>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt="" style={{ width: 32, height: 32, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 5, background: "var(--hover-bg)", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>{track.artist_name}</p>
                    </div>
                    {isInStation ? (
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600 }}>Added</span>
                    ) : (
                      <button
                        onClick={() => handleQuickAdd(track.id)}
                        disabled={addTrackLoading}
                        style={{
                          padding: "5px 12px", borderRadius: 6, border: "none", background: "var(--brand)", color: "#fff",
                          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                        }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )
}
