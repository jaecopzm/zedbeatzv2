"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useRef, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"

const MAX_BIO_LENGTH = 300

const GENRE_PRESETS = [
  "Hip Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Classical",
  "Country", "Folk", "Metal", "Punk", "Soul", "Funk", "Blues",
  "Reggae", "Latin", "Indie", "Ambient", "Lo-Fi", "House", "Techno",
]

export default function ArtistProfilePage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  const [stageName, setStageName] = useState("")
  const [bio, setBio] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoDrag, setPhotoDrag] = useState(false)
  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverDrag, setCoverDrag] = useState(false)
  const [location, setLocation] = useState("")
  const [genreTags, setGenreTags] = useState<string[]>([])
  const [genreInput, setGenreInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [socialLinks, setSocialLinks] = useState<{ [key: string]: string }>({})

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist-me"],
    queryFn: () => api.artistGetMe(),
  })

  const { data: overview } = useQuery({
    queryKey: ["artist-overview"],
    queryFn: () => api.artistOverview(),
  })

  useEffect(() => {
    if (artist) {
      setStageName((prev) => prev || artist.stage_name || "")
      setBio((prev) => prev || artist.bio || "")
      setLocation((prev) => prev || artist.location || "")
      setGenreTags((prev) => prev.length ? prev : (artist.genre_tags || []))
      if (artist.social_links) setSocialLinks(artist.social_links as any)
    }
  }, [artist])

  const handlePhotoChange = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast("Please select an image", "error"); return }
    if (file.size > 5 * 1024 * 1024) { toast("Photo must be under 5MB", "error"); return }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  const handleCoverChange = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast("Please select an image", "error"); return }
    if (file.size > 10 * 1024 * 1024) { toast("Cover must be under 10MB", "error"); return }
    setCover(file)
    setCoverPreview(URL.createObjectURL(file))
  }, [])

  const addGenreTag = useCallback((tag: string) => {
    const t = tag.trim()
    if (t && !genreTags.includes(t)) {
      setGenreTags((prev) => [...prev, t])
    }
    setGenreInput("")
  }, [genreTags])

  const removeGenreTag = useCallback((tag: string) => {
    setGenreTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!stageName.trim()) return toast("Stage name is required", "error")
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("stage_name", stageName.trim())
      if (bio.trim()) fd.append("bio", bio.trim())
      fd.append("location", location.trim())
      fd.append("genre_tags", JSON.stringify(genreTags))
      if (photo) fd.append("photo", photo)
      if (cover) fd.append("cover", cover)
      // Filter out empty social links
      const filteredLinks = Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v?.trim()))
      fd.append("social_links", JSON.stringify(filteredLinks))
      await api.artistUpdateMe(fd)
      qc.invalidateQueries({ queryKey: ["artist-me"] })
      qc.invalidateQueries({ queryKey: ["artist", artist?.id] })
      qc.invalidateQueries({ queryKey: ["artist-overview"] })
      toast("Profile updated", "success")
    } catch (e: any) { toast(e?.message || "Update failed", "error") }
    setSaving(false)
  }

  if (isLoading) {
    return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 14 }} />)}</div>
  }

  const displayPhoto = photoPreview || artist?.photo_url

  const cardBox: React.CSSProperties = {
    background: "var(--card-bg)", borderRadius: 16, padding: 24,
    border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 20,
  }

  const cardTitle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)",
    textTransform: "uppercase", letterSpacing: "0.06em", margin: 0,
  }

  const inputStyle = (): React.CSSProperties => ({
    width: "100%", padding: "12px 16px", fontSize: 14, borderRadius: 12,
    border: "1.5px solid var(--border)", background: "var(--background)",
    color: "var(--foreground)", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s",
  })

  const inputFocus = (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-bg)" }
  const inputBlur = (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none" }

  const dropzoneBase: React.CSSProperties = {
    borderRadius: 12, cursor: "pointer", transition: "all 0.2s ease",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", position: "relative",
  }

  return (
    <div>
      <form onSubmit={handleSave}>
        <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Profile Info ── */}
            <div style={cardBox}>
              <p style={cardTitle}>Profile Info</p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6, display: "block" }}>Stage Name</label>
                <input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Your artist name"
                  style={{ ...inputStyle(), fontSize: 18, fontWeight: 700 }}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)" }}>Bio</label>
                  <span style={{ fontSize: 11, fontWeight: 500, color: bio.length > MAX_BIO_LENGTH * 0.9 ? "var(--brand)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{bio.length}/{MAX_BIO_LENGTH}</span>
                </div>
                <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH + 10))} rows={4}
                  placeholder="Tell listeners about yourself, your influences, your sound..."
                  style={{ ...inputStyle(), lineHeight: 1.6, resize: "vertical" }}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6, display: "block" }}>Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Los Angeles, CA"
                  style={inputStyle()} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </div>

            {/* ── Media ── */}
            <div style={cardBox}>
              <p style={cardTitle}>Media</p>
              <div className="profile-media-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Profile photo */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6, display: "block" }}>Profile Photo</label>
                  <input ref={fileRef} type="file" accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f) }}
                    style={{ display: "none" }} />
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoDrag(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setPhotoDrag(false) }}
                    onDrop={(e) => { e.preventDefault(); setPhotoDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handlePhotoChange(f) }}
                    style={{
                      ...dropzoneBase, width: "100%", aspectRatio: "1", borderRadius: 16,
                      background: displayPhoto ? `url(${displayPhoto}) center/cover` : "linear-gradient(135deg, var(--brand), var(--brand-light))",
                      border: photoDrag ? "2px solid var(--brand)" : "2px solid transparent",
                    }}
                  >
                    {!displayPhoto && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                      </svg>
                    )}
                    {displayPhoto && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change</span>
                      </div>
                    )}
                  </div>
                  {displayPhoto && (
                    <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = "" }}
                      style={{ marginTop: 6, padding: "4px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Remove
                    </button>
                  )}
                </div>
                {/* Cover banner */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6, display: "block" }}>Cover Banner</label>
                  <input ref={coverFileRef} type="file" accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverChange(f) }}
                    style={{ display: "none" }} />
                  <div
                    onClick={() => coverFileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCoverDrag(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setCoverDrag(false) }}
                    onDrop={(e) => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleCoverChange(f) }}
                    style={{
                      ...dropzoneBase, width: "100%", aspectRatio: "1", borderRadius: 16,
                      background: (coverPreview || artist?.cover_url) ? `url(${coverPreview || artist?.cover_url}) center/cover` : "var(--hover-bg)",
                      border: coverDrag ? "2px dashed var(--brand)" : "2px dashed var(--border)",
                    }}
                  >
                    {!(coverPreview || artist?.cover_url) && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--muted-foreground)" }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                    {(coverPreview || artist?.cover_url) && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Genres & Social ── */}
            <div style={cardBox}>
              <p style={cardTitle}>Genres &amp; Social</p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6, display: "block" }}>Genres</label>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted-foreground)" }}>Press Enter or comma to add a genre. Click a tag to remove it.</p>
                <GenreTagInput
                  value={genreInput} onChange={setGenreInput}
                  onAdd={addGenreTag} onRemove={removeGenreTag}
                  tags={genreTags} presets={GENRE_PRESETS} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6, display: "block" }}>Social Links</label>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--muted-foreground)" }}>Connect your social profiles — they'll appear on your public page.</p>
                <div className="profile-social-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <SocialField icon="instagram" label="Instagram" value={socialLinks.instagram || ""} onChange={(v) => setSocialLinks((p) => ({ ...p, instagram: v }))} placeholder="https://instagram.com/yomaps" />
                  <SocialField icon="tiktok" label="TikTok" value={socialLinks.tiktok || ""} onChange={(v) => setSocialLinks((p) => ({ ...p, tiktok: v }))} placeholder="https://tiktok.com/@yomaps" />
                  <SocialField icon="youtube" label="YouTube" value={socialLinks.youtube || ""} onChange={(v) => setSocialLinks((p) => ({ ...p, youtube: v }))} placeholder="https://youtube.com/@yomaps" />
                  <SocialField icon="x" label="X / Twitter" value={socialLinks.x || ""} onChange={(v) => setSocialLinks((p) => ({ ...p, x: v }))} placeholder="https://x.com/yomaps" />
                  <SocialField icon="facebook" label="Facebook" value={socialLinks.facebook || ""} onChange={(v) => setSocialLinks((p) => ({ ...p, facebook: v }))} placeholder="https://facebook.com/yomaps" />
                  <SocialField icon="website" label="Website" value={socialLinks.website || ""} onChange={(v) => setSocialLinks((p) => ({ ...p, website: v }))} placeholder="https://yomaps.com" />
                </div>
              </div>
            </div>

            {/* ── Verification + Save row ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{
                flex: 1, padding: "14px 18px", borderRadius: 14,
                background: artist?.verified ? "rgba(16,185,129,0.08)" : "var(--hover-bg)",
                border: artist?.verified ? "1px solid rgba(16,185,129,0.2)" : "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 10, minWidth: 200,
              }}>
                {artist?.verified ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: artist?.verified ? "#10b981" : "var(--foreground)" }}>
                    {artist?.verified ? "Verified Artist" : "Get Verified"}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>
                    {artist?.verified ? "Your profile is verified and trusted." : "Claim your profile to earn the verified badge."}
                  </p>
                </div>
              </div>
              <button type="submit" disabled={saving || !stageName.trim()}
                style={{
                  padding: "12px 28px", borderRadius: 999, border: "none",
                  background: saving || !stageName.trim() ? "var(--border)" : "var(--brand)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: saving || !stageName.trim() ? "default" : "pointer",
                  transition: "transform 0.15s, box-shadow 0.2s", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { if (!saving && stageName.trim()) { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 4px 20px var(--brand-shadow)" } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none" }}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Stats ── */}
          <div>
            <div style={{
              ...cardBox, position: "sticky", top: 100,
            }}>
              <p style={cardTitle}>Your Stats</p>
              {overview ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <StatRow label="Published Tracks" value={overview.total_tracks ?? 0} color="59,130,246"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>} />
                  <StatRow label="Followers" value={overview.total_followers ?? 0} color="249,115,22"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} />
                  <StatRow label="Total Plays" value={overview.total_plays ?? 0} color="16,185,129"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5,3 19,12 5,21" /></svg>} />
                  <StatRow label="Total Likes" value={overview.total_likes ?? 0} color="239,68,68"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>} />
                </div>
              ) : (
                <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
              )}
            </div>
          </div>

        </div>
      </form>
      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-media-grid { grid-template-columns: 1fr !important; }
          .profile-social-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function StatRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ color: `rgb(${color})`, flexShrink: 0, display: "flex" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{value.toLocaleString()}</p>
        <p style={{ margin: "1px 0 0", fontSize: 11, fontWeight: 500, color: "var(--muted-foreground)" }}>{label}</p>
      </div>
    </div>
  )
}

function SocialField({ icon, label, value, onChange, placeholder }: { icon: string; label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }}>
        <SocialIcon name={icon} />
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
    </div>
  )
}

function GenreTagInput({ value, onChange, onAdd, onRemove, tags, presets }: {
  value: string; onChange: (v: string) => void; onAdd: (t: string) => void; onRemove: (t: string) => void; tags: string[]; presets: string[]
}) {
  const [showPresets, setShowPresets] = useState(false)
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map((tag) => (
          <button key={tag} type="button" onClick={() => onRemove(tag)}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--brand-bg)", background: "rgba(var(--brand-rgb, 99,102,241),0.08)", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {tag}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        <input value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); onAdd(value) } }}
          onFocus={() => setShowPresets(true)} onBlur={() => setTimeout(() => setShowPresets(false), 200)}
          placeholder="Type a genre and press Enter..."
          style={{ width: "100%", padding: "10px 14px", fontSize: 13, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        {showPresets && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, marginTop: 4, padding: 8, borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", flexWrap: "wrap", gap: 4 }}>
            {presets.filter((p) => !tags.includes(p)).map((p) => (
              <button key={p} type="button" onMouseDown={(e) => { e.preventDefault(); onAdd(p) }}
                style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SocialIcon({ name }: { name: string }) {
  const size = 16
  switch (name) {
    case "instagram":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
    case "tiktok":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.36V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43V8.65a8.16 8.16 0 004.77 1.52V6.69z" /></svg>
    case "youtube":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23 9.71a8.5 8.5 0 00-.91-4.13 2.92 2.92 0 00-1.72-1A78.36 78.36 0 0012 4.5a78.45 78.45 0 00-8.34.58 2.87 2.87 0 00-1.7 1A12.37 12.37 0 001 9.71 47.5 47.5 0 00.5 12 47.5 47.5 0 001 14.29a8.5 8.5 0 00.91 4.13 2.92 2.92 0 001.72 1A78.36 78.36 0 0012 19.5a78.45 78.45 0 008.34-.58 2.87 2.87 0 001.7-1 12.37 12.37 0 00.96-4.13 47.5 47.5 0 00.5-2.79 47.5 47.5 0 00-.5-2.79zM9.74 14.85V8.55l5.92 3.15-5.92 3.15z" /></svg>
    case "x":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    case "facebook":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    case "website":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
    default:
      return null
  }
}
