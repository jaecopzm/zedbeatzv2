"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SearchResultTrack, BulkImportItem } from "@/types"
import { SECTIONS } from "@/lib/sections"
import { toast } from "@/lib/toast-store"

// ── Types ────────────────────────────────────────────────────────────────────

type ImportEvent = { type: "progress" | "error" | "done"; index: number; total: number; title?: string; error?: string }
type TrackLog = { index: number; title: string; status: "pending" | "importing" | "done" | "error"; error?: string; startedAt?: number; finishedAt?: number }

const SPOTIFY_TRACK_RE = /open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/([A-Za-z0-9]{22})/

function isSpotifyTrackQuery(q: string): boolean {
  if (SPOTIFY_TRACK_RE.test(q)) return true
  return /^[A-Za-z0-9]{22}$/.test(q.trim())
}

function extractSpotifyTrackId(q: string): string {
  const m = q.match(SPOTIFY_TRACK_RE)
  if (m) return m[1]
  return q.trim()
}

function catalogKey(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()} - ${title.toLowerCase().trim()}`
}

// ── Micro components ─────────────────────────────────────────────────────────

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><label className="admin-label">{title}</label>{children}</div>
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminImportPage() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTracks, setSelectedTracks] = useState<Map<string, BulkImportItem>>(new Map())
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<TrackLog[]>([])
  const [importDone, setImportDone] = useState(false)
  const [aiEnriching, setAiEnriching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    abortRef.current?.abort()
  }, [])

  const isUrlOrId = isSpotifyTrackQuery(searchQuery)

  const search = useQuery({
    queryKey: ["admin-import-search", searchQuery, isUrlOrId],
    queryFn: () =>
      isUrlOrId
        ? api.adminImportLookup(extractSpotifyTrackId(searchQuery))
        : api.adminImportSearch(searchQuery),
    enabled: searchQuery.length > 1,
    staleTime: 60_000,
  })

  // Existing catalog, for duplicate detection
  const catalog = useQuery({
    queryKey: ["admin-catalog-tracks"],
    queryFn: () => api.adminListTracks(5000, 0),
    staleTime: 5 * 60_000,
  })
  const catalogKeys = useMemo(() => {
    const set = new Set<string>()
    catalog.data?.tracks.forEach((t) => {
      if (t.artist_name && t.title) set.add(catalogKey(t.artist_name, t.title))
    })
    return set
  }, [catalog.data])

  const { data: genres } = useQuery({ queryKey: ["genres"], queryFn: () => api.listGenres() })

  const searchResults: SearchResultTrack[] = search.data?.tracks ?? []
  const selected = Array.from(selectedTracks.values())

  function handleSearchInput(v: string) {
    setSearchInput(v)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setSearchQuery(v.trim()), 400)
  }

  function runSearchNow() {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearchQuery(searchInput.trim())
  }

  function toggleTrack(t: SearchResultTrack) {
    const next = new Map(selectedTracks)
    if (next.has(t.spotify_id)) {
      next.delete(t.spotify_id)
    } else {
      next.set(t.spotify_id, { spotify_id: t.spotify_id, override_title: t.title, override_artist: t.artists[0], featured_artists: t.artists.slice(1).join(", "), album_title: t.album_name, publish: true, description: "" })
    }
    setSelectedTracks(next)
  }

  function toggleAll() {
    const next = new Map(selectedTracks)
    const allSelected = searchResults.every((t) => next.has(t.spotify_id))
    searchResults.forEach((t) => {
      if (allSelected) next.delete(t.spotify_id)
      else if (!next.has(t.spotify_id)) next.set(t.spotify_id, { spotify_id: t.spotify_id, override_title: t.title, override_artist: t.artists[0], featured_artists: t.artists.slice(1).join(", "), album_title: t.album_name, publish: true, description: "" })
    })
    setSelectedTracks(next)
  }

  function updateTrack(id: string, field: keyof BulkImportItem, value: unknown) {
    const next = new Map(selectedTracks)
    if (next.has(id)) next.set(id, { ...next.get(id)!, [field]: value })
    setSelectedTracks(next)
  }

  function applyToAll(field: keyof BulkImportItem, value: unknown) {
    const next = new Map(selectedTracks)
    for (const [id, item] of next) next.set(id, { ...item, [field]: value })
    setSelectedTracks(next)
  }

  async function enrichWithAI() {
    const tracks = Array.from(selectedTracks.values())
    if (!tracks.length) return
    setAiEnriching(true)
    try {
      const payload = tracks.map((t) => {
        const orig = searchResults.find((r) => r.spotify_id === t.spotify_id)
        return { title: t.override_title || orig?.title || "", artist: t.override_artist || orig?.artists[0] || "", album: t.album_title || orig?.album_name || "" }
      })
      const res = await api.adminImportAIEnrich(payload)
      if (res?.results) {
        const next = new Map(selectedTracks)
        res.results.forEach((r) => {
          const item = tracks[r.index]
          if (item?.spotify_id && next.has(item.spotify_id)) {
            const updated = { ...next.get(item.spotify_id)! }
            if (r.description) updated.description = r.description
            if (r.genre) {
              const match = genres?.genres.find((g) => g.name.toLowerCase() === r.genre.toLowerCase() || g.slug.toLowerCase() === r.genre.toLowerCase())
              if (match) updated.genre_id = match.slug
            }
            next.set(item.spotify_id, updated)
          }
        })
        setSelectedTracks(next)
        toast("AI enrichment applied", "success")
      }
    } catch {
      toast("AI enrichment failed", "error")
    } finally {
      setAiEnriching(false)
    }
  }

  async function startImport() {
    const tracks = Array.from(selectedTracks.values())
    if (!tracks.length) return
    setLogs(tracks.map((t, i) => ({ index: i, title: t.override_title || t.search || "track " + t.spotify_id, status: "pending" })))
    setImporting(true)
    setImportDone(false)
    const abort = new AbortController()
    abortRef.current = abort
    const token = localStorage.getItem("access_token")
    const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1"
    try {
      const res = await fetch(`${base}/admin/import/bulk/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ tracks }),
        signal: abort.signal,
      })
      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({ error: "Stream failed" }))
        throw new Error(errBody.error || "Stream failed")
      }
      setLogs((p) => p.map((l) => l.index === 0 ? { ...l, status: "importing", startedAt: Date.now() } : l))
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ""
      let finished = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n"); buf = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          let evt: ImportEvent
          try {
            evt = JSON.parse(line.slice(6))
          } catch {
            continue
          }
          if (evt.type === "done") {
            setImporting(false)
            setImportDone(true)
            finished = true
            break
          }
          setLogs((p) => p.map((l) => {
            if (l.index === evt.index) return { ...l, status: evt.type === "error" ? "error" : "done", error: evt.error, finishedAt: Date.now() }
            if (l.index === evt.index + 1 && l.status === "pending") return { ...l, status: "importing", startedAt: Date.now() }
            return l
          }))
        }
        if (finished) break
      }
      if (finished) {
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-tracks"] })
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") setLogs((p) => p.map((l) => l.status !== "done" ? { ...l, status: "error", error: "Connection lost" } : l))
      setImporting(false)
    }
  }

  function clearAll() {
    setSelectedTracks(new Map())
    setLogs([])
    setImportDone(false)
    setImporting(false)
    setSearchInput("")
    setSearchQuery("")
  }

  const doneCount = logs.filter((l) => l.status === "done").length
  const errorCount = logs.filter((l) => l.status === "error").length

  return (
    <div className="fade-in">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "0 0 20px" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.847-.88 7.143-.5 9.816 1.134.296.18.388.564.21.859zm1.223-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.078-1.182-.413.125-.847-.107-.972-.52-.125-.413.108-.847.52-.972 3.666-1.112 8.243-.574 11.345 1.337.367.226.488.707.26 1.076zm.105-2.81c-3.26-1.937-8.643-2.12-11.758-1.173-.5.152-1.025-.133-1.177-.633-.15-.5.133-1.025.633-1.177 3.616-1.1 9.544-.89 13.3 1.343.45.267.6.845.333 1.295-.267.45-.845.6-1.297.332z"/></svg>
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.4px", margin: 0 }}>Spotify Import</h1>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "2px 0 0" }}>Search, configure metadata, bulk-import to catalog</p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearchNow() }}
            placeholder="Song name, artist, or paste a Spotify track URL / ID..."
            className="admin-search"
            style={{ padding: "10px 30px 10px 34px" }}
            aria-label="Search Spotify"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearchQuery("") }} aria-label="Clear search" className="admin-icon-btn" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 24, height: 24 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <button
          onClick={runSearchNow}
          disabled={!searchInput.trim() || search.isFetching}
          className="admin-btn-primary"
          style={{ whiteSpace: "nowrap" }}
        >
          {search.isFetching ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Search hint for URL/ID input */}
      {isUrlOrId && searchQuery.length > 1 && !search.isFetching && (
        <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "12px" }}>
          Detected a Spotify track reference — showing the matching track directly.
        </div>
      )}

      {/* Skeleton */}
      {search.isFetching && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {[0,1,2].map((i) => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "10px" }} />)}
        </div>
      )}

      {/* Search error */}
      {search.isError && !search.isFetching && (
        <div style={{ marginBottom: "16px", padding: "14px 16px", borderRadius: "10px", background: "var(--brand-bg)", color: "#c53030", fontSize: "13px", fontWeight: 500, border: "1px solid var(--brand-bg)" }}>
          Search failed: {(search.error as Error)?.message || "Something went wrong"}
        </div>
      )}

      {/* Search results */}
      {!search.isFetching && searchQuery.length > 1 && search.isSuccess && searchResults.length === 0 && (
        <div className="admin-empty">
          No tracks found for <strong>{searchQuery}</strong>. Try a different name, or paste a full Spotify track URL.
        </div>
      )}

      {searchResults.length > 0 && !search.isFetching && (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>
              Results <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>({searchResults.length})</span>
            </span>
            <button onClick={toggleAll} className="admin-nav-link" style={{ background: "none", border: "none", color: "var(--active-fg)", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: "3px 6px", borderRadius: "5px" }}>
              {searchResults.every((t) => selectedTracks.has(t.spotify_id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {searchResults.map((t) => {
              const sel = selectedTracks.has(t.spotify_id)
              const dup = catalogKeys.has(catalogKey(t.artists[0], t.title))
              return (
                <button
                  key={t.spotify_id}
                  type="button"
                  onClick={() => toggleTrack(t)}
                  aria-pressed={sel}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px",
                    border: `1.5px solid ${sel ? "var(--active-fg)" : "var(--border)"}`,
                    background: sel ? "var(--active-bg)" : "transparent",
                    cursor: "pointer", transition: "all 0.12s", textAlign: "left", fontFamily: "inherit",
                    opacity: dup && !sel ? 0.55 : 1, width: "100%",
                  }}
                >
                  {t.cover_url
                    ? <img src={t.cover_url} alt="" style={{ width: 40, height: 40, borderRadius: "5px", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: "5px", background: "var(--border)", flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artists.join(", ")} · {t.album_name}</div>
                  </div>
                  {dup && (
                    <span className="admin-pill" style={{ background: "rgba(234,179,8,0.15)", color: "rgb(180,130,10)", flexShrink: 0 }} title="Already in the catalog">
                      In catalog
                    </span>
                  )}
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? "var(--active-fg)" : "#b0b0b8"}`, background: sel ? "var(--active-fg)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Metadata editor */}
      {selected.length > 0 && (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>
              Configure — {selected.length} track{selected.length > 1 ? "s" : ""}
            </div>
            <button onClick={enrichWithAI} disabled={aiEnriching || importing}
              className="admin-btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", fontSize: "11px" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 16l-5.5 4.5L8 13.5 3 9l6.5-.5z"/></svg>
              {aiEnriching ? "Filling…" : "Auto-fill with AI"}
            </button>
          </div>

          {/* Bulk apply-to-all */}
          {selected.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", border: "1px dashed var(--border)", background: "var(--background)", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)" }}>Apply to all:</span>
              <select value="" onChange={(e) => { if (e.target.value !== "") applyToAll("section", e.target.value); e.target.value = "" }} className="admin-input" style={{ width: "auto", padding: "6px 10px", fontSize: "12px", cursor: "pointer" }} aria-label="Set section for all selected tracks">
                <option value="">Section…</option>
                {SECTIONS.filter((s) => s.key).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select value="" onChange={(e) => { if (e.target.value !== "") applyToAll("genre_id", e.target.value); e.target.value = "" }} className="admin-input" style={{ width: "auto", padding: "6px 10px", fontSize: "12px", cursor: "pointer" }} aria-label="Set genre for all selected tracks">
                <option value="">Genre…</option>
                {genres?.genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
              </select>
              <button onClick={() => applyToAll("publish", true)} className="admin-btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>Publish all</button>
              <button onClick={() => applyToAll("publish", false)} className="admin-btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>Draft all</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {selected.map((item) => {
              const orig = searchResults.find((r) => r.spotify_id === item.spotify_id)
              return (
                <div key={item.spotify_id} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", background: "var(--background)", position: "relative" }}>
                  {/* Remove button */}
                  <button onClick={() => { const n = new Map(selectedTracks); n.delete(item.spotify_id!); setSelectedTracks(n) }} aria-label={`Remove ${item.override_title || item.spotify_id}`}
                    className="admin-icon-btn" style={{ position: "absolute", right: 8, top: 8, width: 26, height: 26, color: "var(--muted-foreground)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>

                  {/* Identity row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", paddingRight: "20px" }}>
                    {orig?.cover_url && <img src={orig.cover_url} alt="" style={{ width: 28, height: 28, borderRadius: "3px", objectFit: "cover", flexShrink: 0 }} />}
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{orig?.title ?? item.spotify_id}</span>
                    {catalogKeys.has(catalogKey(orig?.artists[0] || item.override_artist || "", orig?.title || item.override_title || "")) && (
                      <span className="admin-pill" style={{ background: "rgba(234,179,8,0.15)", color: "rgb(180,130,10)", flexShrink: 0 }}>In catalog</span>
                    )}
                  </div>

                  {/* Fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                    <Field title="Title">
                      <input type="text" value={item.override_title ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "override_title", e.target.value)} className="admin-input" style={{ padding: "7px 10px", fontSize: "13px" }} />
                    </Field>
                    <Field title="Description">
                      <textarea rows={2} value={item.description ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "description", e.target.value)} placeholder="SEO description — tell the story behind the track" className="admin-input" style={{ padding: "7px 10px", fontSize: "13px", resize: "vertical" }} />
                    </Field>
                    <Field title="Primary Artist">
                      <input type="text" value={item.override_artist ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "override_artist", e.target.value)} className="admin-input" style={{ padding: "7px 10px", fontSize: "13px" }} />
                    </Field>
                    <Field title="Genre">
                      <select value={item.genre_id ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "genre_id", e.target.value || null)} className="admin-input" style={{ padding: "7px 10px", fontSize: "13px", cursor: "pointer" }}>
                        <option value="">Auto</option>
                        {genres?.genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
                      </select>
                    </Field>
                    <Field title="Collaborators">
                      <input type="text" value={item.featured_artists ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "featured_artists", e.target.value)} placeholder="e.g. Slapdee, Chef 187" className="admin-input" style={{ padding: "7px 10px", fontSize: "13px" }} />
                    </Field>
                    <Field title="Album">
                      <input type="text" value={item.album_title ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "album_title", e.target.value)} placeholder="Single / Album" className="admin-input" style={{ padding: "7px 10px", fontSize: "13px" }} />
                    </Field>
                    <Field title="Section">
                      <select value={item.section ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "section", e.target.value)} className="admin-input" style={{ padding: "7px 10px", fontSize: "13px", cursor: "pointer" }}>
                        {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </Field>
                    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--foreground)" }}>
                        <input type="checkbox" checked={item.publish ?? true} onChange={(e) => updateTrack(item.spotify_id!, "publish", e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--active-fg)" }} />
                        Publish
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Import button row */}
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={startImport} disabled={importing}
              className="admin-btn-primary"
              style={{ flex: 1, minWidth: 200 }}
            >
              {importing ? `Importing… (${doneCount + errorCount} / ${logs.length})` : `Import ${selected.length} Track${selected.length > 1 ? "s" : ""}`}
            </button>
            {importing && (
              <button onClick={() => { abortRef.current?.abort(); setImporting(false) }} className="admin-btn-secondary">
                Cancel
              </button>
            )}
            {importDone && (
              <button onClick={clearAll} className="admin-btn-secondary">
                Clear & start over
              </button>
            )}
          </div>

          {/* Progress */}
          {logs.length > 0 && (() => {
            const pct = logs.length ? Math.round(((doneCount + errorCount) / logs.length) * 100) : 0
            return (
              <div style={{ marginTop: "14px" }}>
                {importDone ? (
                  <div style={{ fontSize: "13px", fontWeight: 600, color: errorCount ? "#c53030" : "#22543d", marginBottom: "8px" }}>
                    {errorCount ? `Import finished — ${doneCount} done, ${errorCount} failed` : `Import complete — all ${doneCount} track${doneCount === 1 ? "" : "s"} imported`}
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "5px" }}>
                    <span>Processing {Math.min(doneCount + errorCount + 1, logs.length)} of {logs.length}…</span>
                    <span>{pct}%</span>
                  </div>
                )}
                <div style={{ height: "5px", borderRadius: "99px", background: "var(--border)", overflow: "hidden", marginBottom: "10px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: "99px", background: errorCount ? "#c53030" : "#22c55e", transition: "width 0.35s ease" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {logs.map((log) => {
                    const elapsed = log.startedAt && log.finishedAt ? ((log.finishedAt - log.startedAt) / 1000).toFixed(1) + "s" : null
                    const s = log.status
                    return (
                      <div key={log.index} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, border: `1px solid ${s === "error" ? "var(--brand-bg)" : s === "done" ? "#e6f4ea" : s === "importing" ? "var(--active-fg)" : "var(--border)"}`, background: s === "error" ? "var(--brand-bg)" : s === "done" ? "#f4fbf7" : s === "importing" ? "var(--active-bg)" : "transparent", color: s === "error" ? "#c53030" : s === "done" ? "#22543d" : "var(--foreground)", transition: "all 0.2s" }}>
                        <span style={{ width: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {s === "done" && <span style={{ color: "#22c55e" }}>✓</span>}
                          {s === "error" && <span style={{ color: "#c53030" }}>✗</span>}
                          {s === "importing" && <Spinner />}
                          {s === "pending" && <span style={{ color: "var(--muted-foreground)", fontSize: "9px" }}>○</span>}
                        </span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <strong>{log.index + 1}.</strong> {log.title}
                          {s === "error" && <span style={{ opacity: 0.75 }}> — {log.error}</span>}
                        </span>
                        {elapsed && <span style={{ flexShrink: 0, fontSize: "10px", color: "var(--muted-foreground)" }}>{elapsed}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
