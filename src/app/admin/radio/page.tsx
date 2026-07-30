"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { RadioStation, RadioStationTrack } from "@/types"
import { formatDuration } from "@/lib/utils"

const ADMIN_RADIO_QS_KEY = ["admin-radio"]

type TxFilter = "all" | "grant" | "revoke" | "deduction"

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

function timeAgo(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

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

  const [search, setSearch] = useState("")
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [trackStationId, setTrackStationId] = useState<string | null>(null)
  const [trackSearch, setTrackSearch] = useState("")
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const trackSearchRef = useRef<HTMLInputElement>(null)

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => api.adminCreateStation(fd),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY }); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => api.adminUpdateStation(id, fd),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY }); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteStation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY }),
  })

  const setTracksMutation = useMutation({
    mutationFn: ({ id, trackIds }: { id: string; trackIds: string[] }) => api.adminSetStationTracks(id, trackIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY })
      queryClient.invalidateQueries({ queryKey: ["radio-station-tracks", trackStationId] })
      toast("Station tracks updated", "success")
      setShowTrackModal(false)
      setTrackStationId(null)
      setTrackSearch("")
      setSelectedTrackIds([])
    },
    onError: (e: any) => toast(e?.message || "Failed to update tracks", "error"),
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

  const { data: stationTracksData, isLoading: stationTracksLoading } = useQuery({
    queryKey: ["radio-station-tracks", trackStationId],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"}/radio/stations/${trackStationId}?limit=100`).then(r => r.json()).then((d: any) => d.tracks ?? []),
    enabled: !!trackStationId,
  })

  const currentStation = trackStationId ? allStations.find((s) => s.id === trackStationId) : null
  const currentTracks: RadioStationTrack[] = stationTracksData ?? []

  const handleManageTracks = (station: RadioStation) => {
    setTrackStationId(station.id)
    setShowTrackModal(true)
    setTrackSearch("")
    setSelectedTrackIds([])
  }

  const handleSaveTracks = () => {
    if (!trackStationId) return
    const uniqueIds = Array.from(new Set(selectedTrackIds))
    setTracksMutation.mutate({ id: trackStationId, trackIds: uniqueIds })
  }

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    )
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
    if (editingId) {
      api.adminUpdateStation(editingId, fd)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY })
          toast("Station updated", "success")
          resetForm()
        })
        .catch((e: any) => toast(e?.message || "Failed to update station", "error"))
    } else {
      api.adminCreateStation(fd)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ADMIN_RADIO_QS_KEY })
          toast("Station created", "success")
          resetForm()
        })
        .catch((e: any) => toast(e?.message || "Failed to create station", "error"))
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
            Radio Stations
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "4px 0 0" }}>
            Create and manage curated radio stations
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          + New Station
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--card-bg)", padding: 24, borderRadius: 16, marginBottom: 28, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Station name" required style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
              <select value={stationType} onChange={(e) => setStationType(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                <option value="curated">Curated</option>
                <option value="genre">Genre</option>
                <option value="playlist">Playlist</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cover Image</label>
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
                style={{ fontSize: 13, color: "var(--foreground)" }}
              />
              {coverPreview && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <img src={coverPreview} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null) }} style={{ fontSize: 12, color: "rgb(239,68,68)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Remove</button>
                </div>
              )}
              {!coverPreview && (
                <input value={coverUrl} onChange={(e) => { setCoverUrl(e.target.value); setCoverFile(null); setCoverPreview(null) }} placeholder="Or paste image URL..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit", marginTop: 8 }} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {editingId ? "Update Station" : "Create Station"}
            </button>
            <button type="button" onClick={resetForm} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 12 }} />
              <div className="skeleton" style={{ width: "70%", height: 16 }} />
              <div className="skeleton" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </div>
      ) : !hasAny ? (
        <div style={{
          background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
          padding: "64px 24px", textAlign: "center", color: "var(--muted-foreground)",
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>No stations yet</p>
          <p style={{ fontSize: 14, margin: 0 }}>Create your first radio station to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
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
                    onDelete={() => {
                      if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id)
                    }}
                    onManageTracks={() => handleManageTracks(s)}
                  />
                ))}
              </Section>
            )
          })}
        </div>
      )}

      {/* Track Management Modal */}
      {showTrackModal && trackStationId && (
        <TrackManagementModal
          station={currentStation}
          tracks={currentTracks}
          trackSearch={trackSearch}
          setTrackSearch={setSearch}
          selectedTrackIds={selectedTrackIds}
          toggleTrackSelection={toggleTrackSelection}
          trackSearchResults={trackSearchData?.tracks ?? []}
          trackSearchLoading={trackSearchLoading}
          handleSaveTracks={handleSaveTracks}
          handleQuickAdd={handleQuickAdd}
          handleQuickRemove={handleQuickRemove}
          addTrackLoading={addTrackMutation.isPending}
          removeTrackLoading={removeTrackMutation.isPending}
          setTracksMutation={setTracksMutation}
          onClose={() => { setShowTrackModal(false); setTrackStationId(null); setTrackSearch(""); setSelectedTrackIds([]) }}
        />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 16px", letterSpacing: "-0.3px", textTransform: "capitalize" }}>
        {title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
        {children}
      </div>
    </div>
  )
}

function StationCard({ station, onEdit, onDelete, onManageTracks }: {
  station: RadioStation; onEdit: () => void; onDelete: () => void; onManageTracks: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
      overflow: "hidden", transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.06)" }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
    >
      <div style={{ position: "relative", aspectRatio: "1.5", overflow: "hidden", background: "linear-gradient(135deg, var(--brand-bg), var(--hover-bg))" }}>
        {station.cover_url ? (
          <img src={station.cover_url} alt={station.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.7}>
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
          <span style={{
            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: station.is_active ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.15)",
            color: station.is_active ? "rgb(16,185,129)" : "rgb(148,163,184)",
            textTransform: "capitalize",
          }}>
            {station.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {station.name}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {station.description || `${station.track_count} tracks · /${station.slug}`}
            </p>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--muted-foreground)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </button>
            {showMenu && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4,
                background: "var(--background)", border: "1px solid var(--border)", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 160, overflow: "hidden",
              }}>
                <button onClick={() => { onEdit(); setShowMenu(false) }} style={{ width: "100%", padding: "9px 14px", border: "none", background: "transparent", color: "var(--foreground)", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  Edit Station
                </button>
                <button onClick={() => { onManageTracks(); setShowMenu(false) }} style={{ width: "100%", padding: "9px 14px", border: "none", background: "transparent", color: "var(--foreground)", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                  Manage Tracks
                </button>
                <button onClick={() => { onDelete(); setShowMenu(false) }} style={{ width: "100%", padding: "9px 14px", border: "none", background: "transparent", color: "rgb(239,68,68)", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  Deactivate
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 12, color: "var(--muted-foreground)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            {station.track_count} tracks
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            /{station.slug}
          </span>
        </div>
      </div>
    </div>
  )
}

function TrackManagementModal({
  station, tracks, trackSearch, setTrackSearch, selectedTrackIds, toggleTrackSelection,
  trackSearchResults, trackSearchLoading, handleSaveTracks, handleQuickAdd, handleQuickRemove,
  addTrackLoading, removeTrackLoading, setTracksMutation, onClose,
}: {
  station: RadioStation | null | undefined; tracks: RadioStationTrack[]; trackSearch: string;
  setTrackSearch: (v: string) => void; selectedTrackIds: string[]; toggleTrackSelection: (id: string) => void;
  trackSearchResults: any[]; trackSearchLoading: boolean;
  handleSaveTracks: () => void; handleQuickAdd: (id: string) => void; handleQuickRemove: (id: string) => void;
  addTrackLoading: boolean; removeTrackLoading: boolean; setTracksMutation: any; onClose: () => void;
}) {
  const hasChanges = selectedTrackIds.length !== tracks.length || tracks.some((t) => !selectedTrackIds.includes(t.id))

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "var(--background)", border: "1px solid var(--border)", borderRadius: 20,
        width: "100%", maxWidth: 720, maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
      }}>
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
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Current Tracks */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Tracks</h3>
            {hasChanges && (
              <button onClick={handleSaveTracks} disabled={setTracksMutation.isPending} style={{
                padding: "6px 16px", borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
              }}>
                {setTracksMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            )}
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
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent",
                      color: "rgb(239,68,68)", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
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
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: "var(--card-bg)", color: "var(--foreground)", fontSize: 14, outline: "none", fontFamily: "inherit",
              marginBottom: 12,
            }}
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
      </div>
    </div>
  )
}
