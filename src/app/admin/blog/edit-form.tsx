"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import { BlogBody } from "@/components/blog-body"
import { BlogEditor, countWordsFromHtml } from "@/components/admin/blog-editor"

export interface BlogPostForm {
  id?: string
  title: string
  slug: string
  excerpt: string
  body: string
  cover_url?: string | null
  status: string
  post_type: string
  keywords: string
  linked_track_ids: string[]
  linked_artist_ids: string[]
  tracks?: { id: string; title: string; artist_name?: string }[]
  artists?: { id: string; stage_name: string }[]
}

const TYPES: Array<[string, string]> = [
  ["article", "News article"],
  ["roundup", "Weekly roundup"],
  ["spotlight", "Release spotlight"],
  ["chart", "Charts"],
  ["profile", "Artist story"],
]

const STATUSES: Array<[string, string]> = [
  ["draft", "Draft"],
  ["review", "In review"],
  ["published", "Published"],
]

function slugifyInput(s: string) {
  return s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function BlogEditForm({ initial }: { initial: BlogPostForm | null }) {
  const router = useRouter()
  const isNew = !initial?.id
  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(false)
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
  const [body, setBody] = useState(initial?.body ?? "")
  const [status, setStatus] = useState(initial?.status ?? "draft")
  const [postType, setPostType] = useState(initial?.post_type ?? "article")
  const [keywords, setKeywords] = useState(initial?.keywords ?? "")
  const [trackIds, setTrackIds] = useState<string[]>(initial?.linked_track_ids ?? [])
  const [artistIds, setArtistIds] = useState<string[]>(initial?.linked_artist_ids ?? [])
  const [trackNames, setTrackNames] = useState<Record<string, string>>(() =>
    Object.fromEntries((initial?.tracks ?? []).map((t) => [t.id, `${t.title} — ${t.artist_name ?? ""}`]))
  )
  const [artistNames, setArtistNames] = useState<Record<string, string>>(() =>
    Object.fromEntries((initial?.artists ?? []).map((a) => [a.id, a.stage_name]))
  )
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.cover_url ?? null)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [trackQuery, setTrackQuery] = useState("")
  const [artistQuery, setArtistQuery] = useState("")
  const [trackResults, setTrackResults] = useState<any[]>([])
  const [artistResults, setArtistResults] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [wordCount, setWordCount] = useState(() => countWordsFromHtml(initial?.body ?? ""))
  const fileRef = useRef<HTMLInputElement>(null)

  function onTitleChange(v: string) {
    setTitle(v)
    if (!slugTouched) setSlug(slugifyInput(v))
  }

  async function searchTracks() {
    const q = trackQuery.trim()
    if (!q) return
    try {
      const res = await api.searchTracks(q)
      setTrackResults(res?.tracks ?? res?.results ?? [])
    } catch {
      toast("Track search failed", "error")
    }
  }

  async function searchArtists() {
    const q = artistQuery.trim()
    if (!q) return
    try {
      const res = await api.searchArtists(q)
      setArtistResults(res?.artists ?? res?.results ?? [])
    } catch {
      toast("Artist search failed", "error")
    }
  }

  function onCoverFile(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith("image/")) {
      toast("Cover must be an image", "error")
      return
    }
    setCoverPreview(URL.createObjectURL(f))
    setCoverRemoved(false)
  }

  async function save(nextStatus?: string) {
    if (!title.trim()) {
      toast("Title is required", "error")
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("title", title.trim())
      if (slug.trim()) fd.append("slug", slug.trim())
      fd.append("excerpt", excerpt)
      fd.append("body", body)
      fd.append("status", nextStatus ?? status)
      fd.append("post_type", postType)
      fd.append("keywords", keywords)
      fd.append("linked_track_ids", JSON.stringify(trackIds))
      fd.append("linked_artist_ids", JSON.stringify(artistIds))
      const file = fileRef.current?.files?.[0]
      if (file) {
        fd.append("cover", file)
      } else if (coverRemoved) {
        fd.append("cover_url", "")
      }
      let saved: any
      if (isNew) {
        saved = await api.adminCreatePost(fd)
        toast("Post created", "success")
        router.replace(`/admin/blog/${saved.id}`)
      } else {
        saved = await api.adminUpdatePost(initial!.id!, fd)
        toast(nextStatus === "published" ? "Published" : "Saved", "success")
        router.refresh()
      }
      if (nextStatus) setStatus(nextStatus)
      if (saved?.cover_url !== undefined) {
        setCoverPreview(saved.cover_url)
        setCoverRemoved(false)
        if (fileRef.current) fileRef.current.value = ""
      }
    } catch (e: any) {
      toast(e?.message || "Save failed", "error")
    }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: 14, outline: "none" }
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em" }

  return (
    <div className="blog-edit-wrap">
      <style>{`
        .blog-edit-wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
        @media (min-width: 1024px) { .blog-edit-wrap { grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; } }
        @media (max-width: 1023px) { .blog-edit-aside { position: static !important; } }
      `}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="10 Hottest Zambian Songs This Week" style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
          </div>
          <div>
            <label style={labelStyle}>Slug</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }} placeholder="auto-from-title" style={{ ...inputStyle, fontFamily: "monospace" }} />
              <button onClick={() => { setSlug(slugifyInput(title)); setSlugTouched(true) }} style={{ padding: "0 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                Regenerate
              </button>
            </div>
            {!isNew && <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "6px 0 0" }}>Live URL: /blog/{slug}</p>}
          </div>
          <div>
            <label style={labelStyle}>Excerpt (shows on cards + Google snippet)</label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={300} placeholder="One or two sentences…" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Body</label>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{wordCount} words</span>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  aria-pressed={showPreview}
                  className={`admin-chip${showPreview ? " admin-chip-active" : ""}`}
                  style={{ minHeight: 32, padding: "4px 12px", fontSize: 12 }}
                >
                  {showPreview ? "Editing" : "Preview"}
                </button>
              </span>
            </div>
            {showPreview ? (
              <div className="admin-card" style={{ padding: "clamp(16px, 3vw, 24px)" }}>
                {body.trim() ? (
                  <BlogBody markdown={body} />
                ) : (
                  <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: 0 }}>Nothing to preview yet — switch back to Editing and write the story.</p>
                )}
              </div>
            ) : (
              <BlogEditor
                value={body}
                onChange={setBody}
                onWordCount={setWordCount}
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>SEO keywords (comma separated)</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="new zambian songs, yo maps, ..." style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }} />
          </div>

          <div>
            <label style={labelStyle}>Linked tracks (appear as “Songs in this story”)</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={trackQuery} onChange={(e) => setTrackQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") searchTracks() }} placeholder="Search tracks…" style={inputStyle} />
              <button onClick={searchTracks} style={{ padding: "0 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", cursor: "pointer", fontSize: 13 }}>Search</button>
            </div>
            {trackResults.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8, maxHeight: 180, overflowY: "auto" }}>
                {trackResults.map((t: any) => (
                  <div key={t.id} onClick={() => { if (!trackIds.includes(t.id)) { setTrackIds([...trackIds, t.id]); setTrackNames({ ...trackNames, [t.id]: `${t.title} — ${t.artist_name ?? ""}` }) } setTrackResults([]); setTrackQuery("") }} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                    {t.title} — {t.artist_name ?? "Unknown"}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {trackIds.map((id) => (
                <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 6px 4px 12px", borderRadius: 999, background: "var(--hover-bg)", fontSize: 12 }}>
                  {trackNames[id] ?? id}
                  <button onClick={() => setTrackIds(trackIds.filter((x) => x !== id))} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 14 }}>×</button>
                </span>
              ))}
              {trackIds.length === 0 && <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No tracks linked — posts without song links earn less SEO value.</span>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Linked artists</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={artistQuery} onChange={(e) => setArtistQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") searchArtists() }} placeholder="Search artists…" style={inputStyle} />
              <button onClick={searchArtists} style={{ padding: "0 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", cursor: "pointer", fontSize: 13 }}>Search</button>
            </div>
            {artistResults.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8, maxHeight: 180, overflowY: "auto" }}>
                {artistResults.map((a: any) => (
                  <div key={a.id} onClick={() => { if (!artistIds.includes(a.id)) { setArtistIds([...artistIds, a.id]); setArtistNames({ ...artistNames, [a.id]: a.stage_name }) } setArtistResults([]); setArtistQuery("") }} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                    {a.stage_name}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {artistIds.map((id) => (
                <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 6px 4px 12px", borderRadius: 999, background: "var(--hover-bg)", fontSize: 12 }}>
                  {artistNames[id] ?? id}
                  <button onClick={() => setArtistIds(artistIds.filter((x) => x !== id))} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="blog-edit-aside" style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "6px 0 0", lineHeight: 1.5 }}>
              Draft → Review → Published. Only Published appears on the site.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={postType} onChange={(e) => setPostType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Featured image</label>
            {coverPreview ? (
              <div>
                <img src={coverPreview} alt="Cover preview" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, display: "block" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", cursor: "pointer", fontSize: 13 }}>Replace</button>
                  <button onClick={() => { setCoverPreview(null); setCoverRemoved(true); if (fileRef.current) fileRef.current.value = "" }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>Remove</button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "28px 12px", borderRadius: 8, border: "1px dashed var(--border)", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 13 }}>
                Upload featured image (16:9 works best)
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onCoverFile(e.target.files?.[0])} style={{ display: "none" }} />
          </div>
          <div className="admin-sticky-bar" style={{ flexDirection: "column" }}>
            <button onClick={() => save()} disabled={saving} className="admin-btn-secondary admin-btn-block">
              {saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
            </button>
            {!isNew && status !== "published" && (
              <button onClick={() => save("published")} disabled={saving} className="admin-btn-primary admin-btn-block">
                Save & publish
              </button>
            )}
            {!isNew && status === "published" && (
              <button onClick={() => save("draft")} disabled={saving} className="admin-btn-secondary admin-btn-block">
                Unpublish to draft
              </button>
            )}
          </div>
        </aside>
    </div>
  )
}
