"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SearchResultTrack, BulkImportItem } from "@/types"
import Link from "next/link"

// ── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = { background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", marginBottom: "24px" }
const inputBase: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "13px", outline: "none" }
const lbl: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "3px" }

// ── Types ────────────────────────────────────────────────────────────────────

type ImportEvent = { type: "progress" | "error" | "done"; index: number; total: number; title?: string; error?: string }
type TrackLog = { index: number; title: string; status: "pending" | "importing" | "done" | "error"; error?: string; startedAt?: number; finishedAt?: number }

// ── Micro components ─────────────────────────────────────────────────────────

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{title}</label>{children}</div>
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
  const [query, setQuery] = useState("")
  const [selectedTracks, setSelectedTracks] = useState<Map<string, BulkImportItem>>(new Map())
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<TrackLog[]>([])
  const [importDone, setImportDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [aiEnriching, setAiEnriching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => setMounted(true), [])

  const search = useMutation({ mutationFn: (q: string) => api.adminImportSearch(q) })
  const aiEnrich = useMutation({
    mutationFn: (tracks: { title: string; artist: string; album: string }[]) =>
      api.adminImportAIEnrich(tracks),
  })
  const { data: genres } = useQuery({ queryKey: ["genres"], queryFn: () => api.listGenres() })

  const searchResults: SearchResultTrack[] = search.data?.tracks ?? []
  const selected = Array.from(selectedTracks.values())
  // canSearch is false on SSR (mounted=false) → disabled=true stable on both sides, no hydration mismatch
  const canSearch = mounted && Boolean(query.trim()) && !search.isPending

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
      }
    } catch {
      // ignore errors — button is best-effort
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
      if (!res.ok || !res.body) throw new Error("Stream failed")
      setLogs((p) => p.map((l) => l.index === 0 ? { ...l, status: "importing", startedAt: Date.now() } : l))
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n"); buf = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const evt: ImportEvent = JSON.parse(line.slice(6))
          if (evt.type === "done") { setImporting(false); setImportDone(true); setSelectedTracks(new Map()); break }
          setLogs((p) => p.map((l) => {
            if (l.index === evt.index) return { ...l, status: evt.type === "error" ? "error" : "done", error: evt.error, finishedAt: Date.now() }
            if (l.index === evt.index + 1 && l.status === "pending") return { ...l, status: "importing", startedAt: Date.now() }
            return l
          }))
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") setLogs((p) => p.map((l) => l.status !== "done" ? { ...l, status: "error", error: "Connection lost" } : l))
      setImporting(false)
    }
  }

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
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canSearch) search.mutate(query.trim()) }}
            placeholder="Song name, artist, or Spotify URL..."
            style={{ ...inputBase, padding: "9px 30px 9px 30px", borderRadius: "8px" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--active-fg)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 0, lineHeight: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <button
          onClick={() => search.mutate(query.trim())}
          disabled={!canSearch}
          suppressHydrationWarning
          style={{ borderRadius: "8px", background: canSearch ? "var(--brand)" : "var(--border)", color: canSearch ? "white" : "var(--muted-foreground)", padding: "0 16px", fontSize: "13px", fontWeight: 600, border: "none", cursor: canSearch ? "pointer" : "not-allowed", transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap" }}
        >
          {search.isPending ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Skeleton */}
      {search.isPending && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {[0,1,2].map((i) => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "10px" }} />)}
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && !search.isPending && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>
              Results <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>({searchResults.length})</span>
            </span>
            <button onClick={toggleAll} style={{ background: "none", border: "none", color: "var(--active-fg)", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: "3px 6px", borderRadius: "5px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {searchResults.every((t) => selectedTracks.has(t.spotify_id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {searchResults.map((t) => {
              const sel = selectedTracks.has(t.spotify_id)
              return (
                <div key={t.spotify_id} onClick={() => toggleTrack(t)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${sel ? "var(--active-fg)" : "var(--border)"}`, background: sel ? "var(--active-bg)" : "transparent", cursor: "pointer", transition: "all 0.12s" }}
                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = "var(--muted-foreground)" }}
                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = "var(--border)" }}
                >
                  {t.cover_url
                    ? <img src={t.cover_url} alt="" style={{ width: 40, height: 40, borderRadius: "5px", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: "5px", background: "var(--border)", flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artists.join(", ")} · {t.album_name}</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? "var(--active-fg)" : "#b0b0b8"}`, background: sel ? "var(--active-fg)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Metadata editor */}
      {selected.length > 0 && (
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>
              Configure — {selected.length} track{selected.length > 1 ? "s" : ""}
            </div>
            <button onClick={enrichWithAI} disabled={aiEnriching}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: aiEnriching ? "var(--border)" : "var(--brand)", color: aiEnriching ? "var(--muted-foreground)" : "white", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: aiEnriching ? "not-allowed" : "pointer", transition: "background 0.15s" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 16l-5.5 4.5L8 13.5 3 9l6.5-.5z"/></svg>
              {aiEnriching ? "Filling…" : "Auto-fill with AI"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {selected.map((item) => {
              const orig = searchResults.find((r) => r.spotify_id === item.spotify_id)
              return (
                <div key={item.spotify_id} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", background: "var(--background)", position: "relative" }}>
                  {/* Remove button */}
                  <button onClick={() => { const n = new Map(selectedTracks); n.delete(item.spotify_id!); setSelectedTracks(n) }}
                    style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 2, lineHeight: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>

                  {/* Identity row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", paddingRight: "20px" }}>
                    {orig?.cover_url && <img src={orig.cover_url} alt="" style={{ width: 28, height: 28, borderRadius: "3px", objectFit: "cover", flexShrink: 0 }} />}
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{orig?.title ?? item.spotify_id}</span>
                  </div>

                  {/* Fields — 3-col then 2-col on last row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                    <Field title="Title">
                      <input type="text" value={item.override_title ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "override_title", e.target.value)} style={inputBase} />
                    </Field>
                    <Field title="Description">
                      <textarea rows={2} value={item.description ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "description", e.target.value)} placeholder="SEO description — tell the story behind the track" style={{ ...inputBase, resize: "vertical" }} />
                    </Field>
                    <Field title="Primary Artist">
                      <input type="text" value={item.override_artist ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "override_artist", e.target.value)} style={inputBase} />
                    </Field>
                    <Field title="Genre">
                      <select value={item.genre_id ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "genre_id", e.target.value || null)} style={{ ...inputBase, cursor: "pointer" }}>
                        <option value="">Auto</option>
                        {genres?.genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
                      </select>
                    </Field>
                    <Field title="Collaborators">
                      <input type="text" value={item.featured_artists ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "featured_artists", e.target.value)} placeholder="e.g. Slapdee, Chef 187" style={inputBase} />
                    </Field>
                    <Field title="Album">
                      <input type="text" value={item.album_title ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "album_title", e.target.value)} placeholder="Single / Album" style={inputBase} />
                    </Field>
                    <Field title="Section">
                      <select value={item.section ?? ""} onChange={(e) => updateTrack(item.spotify_id!, "section", e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
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
          <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
            <button onClick={startImport} disabled={importing}
              style={{ flex: 1, background: importing ? "var(--border)" : "var(--brand)", color: importing ? "var(--muted-foreground)" : "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 600, cursor: importing ? "not-allowed" : "pointer", transition: "background 0.15s", boxShadow: importing ? "none" : "0 4px 12px var(--brand-shadow)" }}
            >
              {importing ? `Importing… (${logs.filter(l => l.status === "done" || l.status === "error").length} / ${logs.length})` : `Import ${selected.length} Track${selected.length > 1 ? "s" : ""}`}
            </button>
            {importing && (
              <button onClick={() => { abortRef.current?.abort(); setImporting(false) }}
                style={{ padding: "0 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Progress */}
          {logs.length > 0 && (() => {
            const done = logs.filter(l => l.status === "done" || l.status === "error").length
            const pct = Math.round((done / logs.length) * 100)
            return (
              <div style={{ marginTop: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "5px" }}>
                  <span>{importDone ? "Import complete" : `Processing ${done + 1} of ${logs.length}…`}</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: "5px", borderRadius: "99px", background: "var(--border)", overflow: "hidden", marginBottom: "10px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: "99px", background: importDone ? "#22c55e" : "var(--brand)", transition: "width 0.35s ease" }} />
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
