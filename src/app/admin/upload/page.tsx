"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { SectionSelect, getSectionLabel } from "@/lib/sections"

type Step = 1 | 2 | 3

const STEPS: Array<{ n: Step; label: string; hint: string }> = [
  { n: 1, label: "Audio & Art", hint: "Files" },
  { n: 2, label: "Details", hint: "Metadata" },
  { n: 3, label: "Release", hint: "Publish" },
]

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const u = ["B", "KB", "MB", "GB"]
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`
}

function formatTime(sec: number | null) {
  if (sec == null || Number.isNaN(sec)) return "--:--"
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// Deterministic fake waveform so every file gets a stable shape
function waveHeights(seed: string, count = 42) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    out.push(22 + ((h >> 8) % 78))
  }
  return out
}

export default function AdminUploadPage() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(1)
  const [artistId, setArtistId] = useState("")
  const [newArtistName, setNewArtistName] = useState("")
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
  const [success, setSuccess] = useState(false)
  const [dragAudio, setDragAudio] = useState(false)
  const [dragCover, setDragCover] = useState(false)
  const [detectedSec, setDetectedSec] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement>(null)

  const { data: artists } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(1000, 0),
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

  // Object URLs for previews
  const audioUrl = useMemo(() => (audioFile ? URL.createObjectURL(audioFile) : null), [audioFile])
  const coverUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (coverUrl) URL.revokeObjectURL(coverUrl)
    }
  }, [audioUrl, coverUrl])

  // Auto-detect audio duration from file metadata
  useEffect(() => {
    if (!audioUrl) {
      setDetectedSec(null)
      return
    }
    const el = new Audio()
    el.preload = "metadata"
    el.src = audioUrl
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        const rounded = Math.round(el.duration)
        setDetectedSec(rounded)
        setDurationSec((prev) => (prev.trim() ? prev : String(rounded)))
      }
    }
    el.addEventListener("loadedmetadata", onMeta)
    return () => el.removeEventListener("loadedmetadata", onMeta)
  }, [audioUrl])

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      if (artistId) fd.append("artist_id", artistId)
      else if (newArtistName.trim()) fd.append("artist_name", newArtistName.trim())
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] })
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] })
      // If the backend just created (or matched) the artist, select it so
      // follow-up uploads use the dropdown instead of re-typing the name.
      if (data?.artist_id) {
        setArtistId(data.artist_id)
        setNewArtistName("")
      }
      setSuccess(true)
      setError("")
    },
    onError: (err: any) => {
      setError(err.message || "Upload failed")
      setSuccess(false)
    },
  })

  const selectedArtist = artists?.artists.find((a) => a.id === artistId)
  const creatingNewArtist = !artistId && newArtistName.trim().length > 0
  const effectiveArtistName = selectedArtist?.stage_name ?? (creatingNewArtist ? newArtistName.trim() : "")
  const selectedGenre = genres?.genres.find((g) => g.id === genreId)
  const selectedAlbum = albums?.albums.find((a) => a.id === albumId)
  const creatingNewAlbum = !albumId && albumTitle.trim().length > 0
  const albumLabel = albumId
    ? (selectedAlbum?.title ?? "Album")
    : creatingNewAlbum
      ? `${albumTitle.trim()} · New`
      : "Single release"

  const canSubmit = (artistId || newArtistName.trim()) && title.trim() && audioFile && !uploadMutation.isPending
  const step1Done = !!audioFile
  const step2Done = !!((artistId || newArtistName.trim()) && title.trim())
  const waves = useMemo(
    () => waveHeights(audioFile ? `${audioFile.name}-${audioFile.size}` : "empty"),
    [audioFile]
  )
  const effectiveSec = durationSec.trim() ? Number(durationSec) : detectedSec

  function acceptAudio(f: File | undefined | null) {
    if (!f) return
    if (!f.type.startsWith("audio/")) {
      setError("That file doesn't look like audio. Please choose an MP3, WAV or M4A.")
      return
    }
    setError("")
    setSuccess(false)
    setAudioFile(f)
  }

  function acceptCover(f: File | undefined | null) {
    if (!f) return
    if (!f.type.startsWith("image/")) {
      setError("Cover must be an image (JPG or PNG).")
      return
    }
    setError("")
    setSuccess(false)
    setCoverFile(f)
  }

  function togglePreview() {
    const el = previewAudioRef.current
    if (!el || !audioUrl) return
    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }

  function resetAll() {
    setTitle("")
    setArtistId("")
    setNewArtistName("")
    setGenreId("")
    setSection("")
    setAlbumId("")
    setAlbumTitle("")
    setFeaturedArtists("")
    setDescription("")
    setDurationSec("")
    setTrackOrder("")
    setPublish(false)
    setAudioFile(null)
    setCoverFile(null)
    setDetectedSec(null)
    setIsPlaying(false)
    setError("")
    setSuccess(false)
    setStep(1)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    uploadMutation.mutate()
  }

  function goNext() {
    if (step === 1 && step1Done) setStep(2)
    else if (step === 2 && step2Done) setStep(3)
  }

  return (
    <div className="fade-in" style={{ width: "100%" }}>
      <style>{`
        .up-grid { display: grid; gap: 16px; grid-template-columns: minmax(0,1fr); align-items: start; }
        @media (min-width: 1024px) { .up-grid { grid-template-columns: minmax(0,1fr) 340px; gap: 20px; } }
        .up-preview-sticky { position: static; }
        @media (min-width: 1024px) { .up-preview-sticky { position: sticky; top: 16px; } }
        .up-steps { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
        .up-step { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--card-bg); cursor: pointer; text-align: left; font-family: inherit; width: 100%; }
        .up-step.is-active { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 14%, transparent); }
        .up-step.is-done { border-color: color-mix(in srgb, #16a34a 45%, var(--border)); }
        .up-num { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 700; background: var(--hover-bg); color: var(--muted-foreground); flex-shrink: 0; }
        .up-step.is-active .up-num { background: var(--brand); color: #fff; }
        .up-step.is-done .up-num { background: #16a34a; color: #fff; }
        .up-drop { border: 1.5px dashed color-mix(in srgb, var(--foreground) 22%, var(--border)); border-radius: 12px; background: var(--card-bg); padding: 14px; cursor: pointer; transition: border-color .15s ease, background .15s ease; }
        .up-drop:hover { border-color: var(--brand); background: var(--background); }
        .up-drop.is-drag { border-color: var(--brand); background: var(--brand-bg); border-style: solid; }
        .up-wave { display: flex; align-items: center; gap: 2.5px; height: 44px; }
        .up-wave span { flex: 1; min-width: 2px; border-radius: 2px; background: color-mix(in srgb, var(--foreground) 28%, var(--border)); height: var(--h); }
        .up-wave.is-playing span { background: var(--brand); animation: up-eq .7s ease-in-out infinite alternate; animation-delay: calc(var(--i) * 45ms); }
        @keyframes up-eq { from { transform: scaleY(.45); } to { transform: scaleY(1); } }
        .up-wave span { transform-origin: center; }
        .up-progress { height: 6px; border-radius: 99px; background: var(--border); overflow: hidden; }
        .up-progress > div { height: 100%; width: 40%; border-radius: 99px; background: var(--brand); animation: up-slide 1.1s ease-in-out infinite; }
        @keyframes up-slide { 0% { margin-left: -40%; } 100% { margin-left: 100%; } }
        .up-switch { position: relative; width: 44px; height: 26px; border-radius: 99px; border: none; cursor: pointer; background: var(--border); transition: background .15s ease; flex-shrink: 0; padding: 0; }
        .up-switch[aria-checked="true"] { background: var(--brand); }
        .up-switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .15s ease; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
        .up-switch[aria-checked="true"]::after { transform: translateX(18px); }
        .up-kv { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; padding: 7px 0; border-bottom: 1px solid var(--border); }
        .up-kv:last-child { border-bottom: none; }
        @media (max-width: 560px) { .up-step-hint { display: none; } .up-step { padding: 8px 10px; gap: 8px; } }
      `}</style>

      {/* Header */}
      <header className="admin-header" style={{ marginBottom: 14 }}>
        <div className="admin-header-text">
          <h1 className="admin-title">New release</h1>
          <p className="admin-sub">
            Drop the audio and artwork, add the story, then ship it — draft or published.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="admin-pill"
            style={{
              background: publish ? "#e6f4ea" : "var(--hover-bg)",
              color: publish ? "#15803d" : "var(--muted-foreground)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            {publish ? "Will publish" : "Draft"}
          </span>
          {step1Done && step2Done && (
            <span className="admin-pill" style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
              Ready to ship
            </span>
          )}
        </div>
      </header>

      {/* Step tabs */}
      <div className="up-steps" role="tablist" aria-label="Upload steps" style={{ marginBottom: 14 }}>
        {STEPS.map((s) => {
          const done = s.n === 1 ? step1Done : s.n === 2 ? step2Done : false
          return (
            <button
              key={s.n}
              type="button"
              role="tab"
              aria-selected={step === s.n}
              onClick={() => setStep(s.n)}
              className={`up-step${step === s.n ? " is-active" : ""}${done ? " is-done" : ""}`}
            >
              <span className="up-num">{done ? "✓" : s.n}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 650, color: "var(--foreground)", lineHeight: 1.2 }}>
                  {s.label}
                </span>
                <span className="up-step-hint" style={{ display: "block", fontSize: 11.5, color: "var(--muted-foreground)" }}>
                  {s.hint}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="up-grid">
        {/* ── Main wizard column ── */}
        <form onSubmit={handleSubmit} className="admin-panel" style={{ minWidth: 0 }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "28px 12px" }}>
              <div
                aria-hidden
                style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
                  background: "#e6f4ea", color: "#15803d",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700,
                }}
              >
                ✓
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 650, color: "var(--foreground)" }}>
                Track shipped
              </h2>
                <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                  “{title || "Untitled"}” by {effectiveArtistName || "artist"} is{" "}
                  {publish ? "live" : "saved as a draft"}.
                </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={resetAll} className="admin-btn-primary">
                  Upload another
                </button>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="admin-btn-secondary"
                >
                  Edit details
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              {/* STEP 1 */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Audio dropzone */}
                  <div className="admin-field">
                    <label className="admin-label">Audio file *</label>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload audio file"
                      className={`up-drop${dragAudio ? " is-drag" : ""}`}
                      onClick={() => audioInputRef.current?.click()}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") audioInputRef.current?.click() }}
                      onDragOver={(e) => { e.preventDefault(); setDragAudio(true) }}
                      onDragLeave={() => setDragAudio(false)}
                      onDrop={(e) => { e.preventDefault(); setDragAudio(false); acceptAudio(e.dataTransfer.files?.[0]) }}
                    >
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        hidden
                        onChange={(e) => acceptAudio(e.target.files?.[0])}
                      />
                      {!audioFile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            aria-hidden
                            style={{
                              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                              background: "var(--brand-bg)", color: "var(--brand)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>
                              Drop audio here or browse
                            </span>
                            <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
                              MP3, WAV or M4A · duration auto-detected
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); togglePreview() }}
                              aria-label={isPlaying ? "Pause preview" : "Play preview"}
                              style={{
                                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                                border: "none", background: "var(--brand)", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                              }}
                            >
                              {isPlaying ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                              )}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={`up-wave${isPlaying ? " is-playing" : ""}`} aria-hidden>
                                {waves.map((h, i) => (
                                  <span key={i} style={{ ["--h" as any]: `${h}%`, ["--i" as any]: i, height: `${h}%` }} />
                                ))}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6, fontSize: 11.5, color: "var(--muted-foreground)" }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{audioFile.name}</span>
                                <span style={{ flexShrink: 0 }}>{formatBytes(audioFile.size)} · {formatTime(effectiveSec ?? null)}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAudioFile(null); setDetectedSec(null); setIsPlaying(false) }}
                              className="admin-icon-btn admin-icon-btn-sm"
                              aria-label="Remove audio"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                          <audio
                            ref={previewAudioRef}
                            src={audioUrl ?? undefined}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            controls
                            preload="metadata"
                            style={{ width: "100%", height: 32 }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cover dropzone */}
                  <div className="admin-field">
                    <label className="admin-label">Cover artwork</label>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload cover artwork"
                      className={`up-drop${dragCover ? " is-drag" : ""}`}
                      onClick={() => coverInputRef.current?.click()}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") coverInputRef.current?.click() }}
                      onDragOver={(e) => { e.preventDefault(); setDragCover(true) }}
                      onDragLeave={() => setDragCover(false)}
                      onDrop={(e) => { e.preventDefault(); setDragCover(false); acceptCover(e.dataTransfer.files?.[0]) }}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => acceptCover(e.target.files?.[0])}
                      />
                      {!coverFile || !coverUrl ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            aria-hidden
                            style={{
                              width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                              background: "var(--hover-bg)", color: "var(--muted-foreground)",
                              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                            }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                          </span>
                          <span>
                            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>
                              Drop artwork or browse
                            </span>
                            <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
                              Square JPG/PNG · 3000×3000 ideal · optional
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img
                            src={coverUrl}
                            alt="Cover preview"
                            style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {coverFile.name}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                              {formatBytes(coverFile.size)} · looks sharp
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click() }}
                              className="admin-btn-secondary admin-btn-sm"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setCoverFile(null) }}
                              className="admin-icon-btn admin-icon-btn-sm"
                              aria-label="Remove cover"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration override */}
                  <div className="admin-field" style={{ maxWidth: 280 }}>
                    <label className="admin-label">
                      Duration (sec){detectedSec != null && <span style={{ fontWeight: 400, textTransform: "none" }}> · detected {formatTime(detectedSec)}</span>}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={durationSec}
                      onChange={(e) => setDurationSec(e.target.value)}
                      placeholder={detectedSec ? String(detectedSec) : "Auto-detected"}
                      className="admin-input"
                    />
                  </div>

                  {!step1Done && (
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted-foreground)" }}>
                      Add an audio file to continue — everything else can wait.
                    </p>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="admin-form-grid admin-form-grid-2">
                    <div className="admin-field">
                      <label className="admin-label">Artist owner *</label>
                      <select
                        value={artistId}
                        onChange={(e) => { setArtistId(e.target.value); setNewArtistName(""); setAlbumId(""); setAlbumTitle("") }}
                        required={!creatingNewArtist}
                        className="admin-input"
                        style={{ cursor: "pointer" }}
                      >
                        <option value="">Select artist</option>
                        {artists?.artists.map((a) => (
                          <option key={a.id} value={a.id}>{a.stage_name}</option>
                        ))}
                      </select>
                      {!artistId && (
                        <input
                          type="text"
                          value={newArtistName}
                          onChange={(e) => setNewArtistName(e.target.value)}
                          placeholder="Or type a name to add a new artist…"
                          maxLength={80}
                          className="admin-input"
                          style={{ marginTop: 8 }}
                        />
                      )}
                      {creatingNewArtist && (
                        <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: "6px 0 0" }}>
                          ✓ New artist “{newArtistName.trim()}” will be created.
                        </p>
                      )}
                    </div>
                    <div className="admin-field">
                      <label className="admin-label">Song title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Copperbelt Anthem"
                        required
                        maxLength={120}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Album collection</label>
                    <select
                      value={albumId}
                      onChange={(e) => { setAlbumId(e.target.value); if (e.target.value) setAlbumTitle("") }}
                      disabled={!artistId}
                      className="admin-input"
                      style={{ cursor: artistId ? "pointer" : "not-allowed", opacity: artistId ? 1 : 0.5 }}
                    >
                      <option value="">No album — single release</option>
                      {albums?.albums.map((a) => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                    {!albumId && (artistId || creatingNewArtist) && (
                      <input
                        type="text"
                        value={albumTitle}
                        onChange={(e) => setAlbumTitle(e.target.value)}
                        placeholder="Or type a title to create a new album…"
                        className="admin-input"
                        style={{ marginTop: 8 }}
                      />
                    )}
                    {creatingNewAlbum && (
                      <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: "6px 0 0" }}>
                        ✓ New album “{albumTitle.trim()}” will be created.
                      </p>
                    )}
                  </div>

                  <div className="admin-form-grid admin-form-grid-2">
                    <div className="admin-field">
                      <label className="admin-label">Genre</label>
                      <select
                        value={genreId}
                        onChange={(e) => setGenreId(e.target.value)}
                        className="admin-input"
                        style={{ cursor: "pointer" }}
                      >
                        <option value="">Select genre</option>
                        {genres?.genres.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <label className="admin-label">Featured artists</label>
                      <input
                        type="text"
                        value={featuredArtists}
                        onChange={(e) => setFeaturedArtists(e.target.value)}
                        placeholder="Slapdee, Macky2"
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">
                      Description <span style={{ fontWeight: 400, textTransform: "none" }}>· {description.length}/500</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      placeholder="Credits, inspiration, story — what should listeners know?"
                      rows={4}
                      className="admin-input"
                      style={{ lineHeight: 1.55, resize: "vertical" }}
                    />
                  </div>

                  <div className="admin-field" style={{ maxWidth: 200 }}>
                    <label className="admin-label">Track order</label>
                    <input
                      type="number"
                      min={1}
                      value={trackOrder}
                      onChange={(e) => setTrackOrder(e.target.value)}
                      placeholder="e.g. 1"
                      className="admin-input"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="admin-form-grid admin-form-grid-2">
                    <div className="admin-field">
                      <label className="admin-label">Home page section</label>
                      <SectionSelect value={section} onChange={setSection} />
                    </div>
                    <div className="admin-field">
                      <label className="admin-label">Visibility</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={publish}
                        onClick={() => setPublish((v) => !v)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                          minHeight: "var(--admin-touch)", padding: "8px 12px", borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: publish ? "var(--brand-bg)" : "var(--card-bg)",
                          fontFamily: "inherit", textAlign: "left", width: "100%",
                        }}
                      >
                        <span className="up-switch" aria-checked={publish} />
                        <span style={{ fontSize: 13.5, fontWeight: 550, color: "var(--foreground)" }}>
                          {publish ? "Publish immediately" : "Save as draft"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Review summary */}
                  <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "6px 14px", background: "var(--background)" }}>
                    <p style={{ margin: "8px 0 2px", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                      Review
                    </p>
                    <div className="up-kv"><span style={{ color: "var(--muted-foreground)" }}>Track</span><strong style={{ color: "var(--foreground)", textAlign: "right" }}>{title.trim() || "—"}</strong></div>
                    <div className="up-kv"><span style={{ color: "var(--muted-foreground)" }}>Artist</span><strong style={{ color: "var(--foreground)", textAlign: "right" }}>{effectiveArtistName || "—"}{creatingNewArtist ? " · New" : ""}</strong></div>
                    <div className="up-kv"><span style={{ color: "var(--muted-foreground)" }}>Release</span><span style={{ color: "var(--foreground)", textAlign: "right" }}>{albumLabel}</span></div>
                    <div className="up-kv"><span style={{ color: "var(--muted-foreground)" }}>Audio</span><span style={{ color: "var(--foreground)", textAlign: "right" }}>{audioFile ? `${audioFile.name} · ${formatTime(effectiveSec ?? null)}` : "—"}</span></div>
                    <div className="up-kv"><span style={{ color: "var(--muted-foreground)" }}>Section</span><span style={{ color: "var(--foreground)", textAlign: "right" }}>{getSectionLabel(section)}</span></div>
                  </div>

                  {uploadMutation.isPending && (
                    <div>
                      <div className="up-progress" role="progressbar" aria-label="Uploading"><div /></div>
                      <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--muted-foreground)" }}>
                        Uploading audio{coverFile ? " and artwork" : ""}… keep this tab open.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div style={{
                      padding: 12, borderRadius: 10,
                      background: "var(--brand-error-bg)", color: "#c53030",
                      fontSize: 13, fontWeight: 500, border: "1px solid transparent",
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="admin-btn-primary admin-btn-block"
                    style={{ opacity: canSubmit ? 1 : 0.55 }}
                  >
                    {uploadMutation.isPending ? "Uploading…" : publish ? "Publish track" : "Save draft"}
                  </button>
                  {!canSubmit && (
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted-foreground)", textAlign: "center" }}>
                      {!audioFile ? "Audio file missing — go back to step 1." : "Artist and song title are required."}
                    </p>
                  )}
                </div>
              )}

              {/* Wizard nav (steps 1–2) */}
              {step < 3 && (
                <div className="admin-sticky-bar">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep((s) => (s === 3 ? 2 : 1) as Step)} className="admin-btn-secondary" style={{ flex: 1 }}>
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={(step === 1 && !step1Done) || (step === 2 && !step2Done)}
                    className="admin-btn-primary"
                    style={{ flex: 2, opacity: ((step === 1 && !step1Done) || (step === 2 && !step2Done)) ? 0.55 : 1 }}
                  >
                    Continue →
                  </button>
                </div>
              )}
              {step === 3 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setStep(2)} className="admin-btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        {/* ── Live preview column ── */}
        <aside className="up-preview-sticky" aria-label="Listener preview" style={{ minWidth: 0 }}>
          <div className="admin-card" style={{ overflow: "hidden" }}>
            <p style={{ margin: 0, padding: "12px 14px 0", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              Listener preview
            </p>
            {/* Cover */}
            <div style={{ padding: 14 }}>
              <div
                style={{
                  position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: 12,
                  overflow: "hidden", background: "var(--hover-bg)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ color: "var(--muted-foreground)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                    No artwork yet
                  </span>
                )}
                {audioUrl && (
                  <button
                    type="button"
                    onClick={togglePreview}
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    style={{
                      position: "absolute", right: 12, bottom: 12,
                      width: 48, height: 48, borderRadius: "50%", border: "none",
                      background: "var(--brand)", color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 8px 24px rgba(0,0,0,.3)",
                    }}
                  >
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                    )}
                  </button>
                )}
              </div>

              {/* Meta */}
              <div style={{ marginTop: 12, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-.01em" }}>
                  {title.trim() || "Untitled track"}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {effectiveArtistName || "Select or add an artist"}
                  {featuredArtists.trim() ? ` · feat. ${featuredArtists.trim()}` : ""}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  <span className="admin-pill" style={{ background: "var(--hover-bg)", color: "var(--foreground)" }}>
                    {albumLabel}
                  </span>
                  {selectedGenre && (
                    <span className="admin-pill" style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
                      {selectedGenre.name}
                    </span>
                  )}
                  <span className="admin-pill" style={{ background: "var(--hover-bg)", color: "var(--muted-foreground)" }}>
                    {formatTime(effectiveSec ?? null)}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px 14px" }}>
              {[
                { ok: !!audioFile, label: "Audio attached" },
                { ok: !!coverFile, label: "Artwork attached" },
                { ok: !!((artistId || newArtistName.trim()) && title.trim()), label: "Artist + title set" },
                { ok: !!section, label: `Section · ${getSectionLabel(section)}` },
              ].map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12.5, color: c.ok ? "var(--foreground)" : "var(--muted-foreground)" }}>
                  <span
                    aria-hidden
                    style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: c.ok ? "#16a34a" : "var(--hover-bg)",
                      color: c.ok ? "#fff" : "var(--muted-foreground)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                    }}
                  >
                    {c.ok ? "✓" : "·"}
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
