"use client"

import { useState } from "react"
import { api } from "@/lib/api"

export interface AssistDraft {
  title: string
  excerpt: string
  keywords: string
  body: string
}

interface AssistPanelProps {
  postType: string
  trackIds: string[]
  artistIds: string[]
  onApplyDraft: (d: AssistDraft) => void
  onApplyTitle: (t: string) => void
  onAddTrack: (id: string, label: string) => void
  onAddArtist: (id: string, label: string) => void
}

type Mode = "music" | "open"

interface AssistResult {
  title?: string
  excerpt?: string
  keywords?: string
  body?: string
  outline?: string[]
  titles?: string[]
  suggested_tracks?: Array<{ id: string; title: string; artist?: string }>
  suggested_artists?: Array<{ id: string; title: string }>
  warnings?: string[]
}

const TONES: Array<[string, string]> = [
  ["energetic", "Energetic"],
  ["bold", "Bold takes"],
  ["professional", "Professional"],
  ["playful", "Playful"],
]

const LENGTHS: Array<[number, string]> = [
  [300, "Short · ~300 words"],
  [450, "Standard · ~450 words"],
  [600, "Deep dive · ~600 words"],
]

export function AssistPanel(props: AssistPanelProps) {
  const [open, setOpen] = useState(true)
  const [mode, setMode] = useState<Mode>("music")
  const [brief, setBrief] = useState("")
  const [tone, setTone] = useState("energetic")
  const [targetWords, setTargetWords] = useState(450)
  const [busy, setBusy] = useState<"outline" | "draft" | "titles" | null>(null)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AssistResult | null>(null)
  const [lastAction, setLastAction] = useState<"outline" | "draft" | "titles" | null>(null)
  const [pickedTitle, setPickedTitle] = useState("")

  async function run(action: "outline" | "draft" | "titles") {
    if (brief.trim().length < 10) {
      setError("Give the AI a sentence or two of angle first.")
      return
    }
    setBusy(action)
    setError("")
    try {
      const res = await api.adminAssistWrite({
        action,
        topic_mode: mode,
        post_type: props.postType,
        brief: brief.trim(),
        track_ids: props.trackIds,
        artist_ids: props.artistIds,
        tone,
        target_words: targetWords,
      })
      setResult(res)
      setLastAction(action)
      setPickedTitle(res.title ?? res.titles?.[0] ?? "")
    } catch (e: any) {
      setError(e?.message || "AI assist failed")
    }
    setBusy(null)
  }

  const titles = result?.titles ?? []
  const showTitles = (lastAction === "outline" || lastAction === "titles") && titles.length > 0

  return (
    <section className="admin-card" aria-label="AI co-writer" style={{ overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "inherit", textAlign: "left",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: "var(--brand-bg)", color: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800,
          }}
        >
          ✦
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--foreground)" }}>
            AI co-writer
          </span>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)" }}>
            Outline → draft → you review. Never publishes on its own.
          </span>
        </span>
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Mode toggle */}
          <div className="admin-chip-row" role="tablist" aria-label="Topic mode">
            <button
              type="button" role="tab" aria-selected={mode === "music"}
              onClick={() => setMode("music")}
              className={`admin-chip${mode === "music" ? " admin-chip-active" : ""}`}
              style={{ minHeight: 34, fontSize: 12.5 }}
            >
              🎵 Music story
            </button>
            <button
              type="button" role="tab" aria-selected={mode === "open"}
              onClick={() => setMode("open")}
              className={`admin-chip${mode === "open" ? " admin-chip-active" : ""}`}
              style={{ minHeight: 34, fontSize: 12.5 }}
            >
              📈 Trends & buzz
            </button>
          </div>

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              mode === "music"
                ? "e.g. Roundup angle: the Copperbelt sound taking over this week, lead with the two linked bangers…"
                : "e.g. Why dance challenges are breaking Zambian songs faster than radio — listicle with 5 examples…"
            }
            className="admin-input"
            style={{ resize: "vertical", lineHeight: 1.55 }}
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="admin-input"
              style={{ flex: "1 1 140px", cursor: "pointer", minHeight: 40 }}
              aria-label="Tone"
            >
              {TONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select
              value={targetWords}
              onChange={(e) => setTargetWords(Number(e.target.value))}
              className="admin-input"
              style={{ flex: "1 1 160px", cursor: "pointer", minHeight: 40 }}
              aria-label="Length"
            >
              {LENGTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => run("outline")} disabled={!!busy} className="admin-btn-secondary admin-btn-sm" style={{ flex: 1 }}>
              {busy === "outline" ? "Outlining…" : "1 · Outline"}
            </button>
            <button type="button" onClick={() => run("draft")} disabled={!!busy} className="admin-btn-primary admin-btn-sm" style={{ flex: 1 }}>
              {busy === "draft" ? "Drafting…" : "2 · Draft article"}
            </button>
            <button type="button" onClick={() => run("titles")} disabled={!!busy} className="admin-btn-secondary admin-btn-sm" style={{ flex: 1 }}>
              {busy === "titles" ? "Thinking…" : "Titles"}
            </button>
          </div>

          {error && (
            <div style={{ padding: 10, borderRadius: 8, background: "var(--brand-error-bg)", color: "#c53030", fontSize: 12.5, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Warnings (e.g. unverified gossip flag) */}
          {result?.warnings?.map((w) => (
            <div key={w} style={{ padding: 10, borderRadius: 8, background: "#fef9e7", color: "#92610f", fontSize: 12.5, fontWeight: 500, border: "1px solid #f5e3a8" }}>
              ⚠ {w}
            </div>
          ))}

          {/* Outline + title options */}
          {showTitles && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                Pick a headline
              </p>
              {titles.map((t) => (
                <label key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer", color: "var(--foreground)" }}>
                  <input type="radio" name="ai-title" checked={pickedTitle === t} onChange={() => setPickedTitle(t)} style={{ marginTop: 3, accentColor: "var(--brand)" }} />
                  <span>{t}</span>
                </label>
              ))}
              <button
                type="button"
                disabled={!pickedTitle}
                onClick={() => pickedTitle && props.onApplyTitle(pickedTitle)}
                className="admin-btn-secondary admin-btn-sm"
                style={{ alignSelf: "flex-start" }}
              >
                Use this headline
              </button>
              {result?.outline && result.outline.length > 0 && (
                <>
                  <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                    Proposed structure
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--foreground)", display: "flex", flexDirection: "column", gap: 4 }}>
                    {result.outline.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </>
              )}
            </div>
          )}

          {/* Full draft proposal */}
          {lastAction === "draft" && result?.body && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                Draft proposal — review before applying
              </p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{result.title}</p>
              {result.excerpt && <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted-foreground)", fontStyle: "italic" }}>{result.excerpt}</p>}
              <pre style={{
                margin: 0, maxHeight: 220, overflowY: "auto", whiteSpace: "pre-wrap",
                fontSize: 12.5, lineHeight: 1.6, fontFamily: "inherit",
                background: "var(--background)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 10, color: "var(--foreground)",
              }}>
                {result.body}
              </pre>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => result.title && result.excerpt != null && result.keywords != null && result.body && props.onApplyDraft({
                    title: result.title, excerpt: result.excerpt ?? "", keywords: result.keywords ?? "", body: result.body,
                  })}
                  className="admin-btn-primary admin-btn-sm"
                >
                  Apply full draft
                </button>
                {result.title && (
                  <button type="button" onClick={() => props.onApplyTitle(result.title!)} className="admin-btn-secondary admin-btn-sm">Title only</button>
                )}
                <button type="button" onClick={() => run("draft")} disabled={!!busy} className="admin-btn-secondary admin-btn-sm">
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Suggested internal links */}
          {((result?.suggested_tracks?.length ?? 0) > 0 || (result?.suggested_artists?.length ?? 0) > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                Suggested links (SEO)
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result?.suggested_tracks?.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => props.onAddTrack(t.id, t.artist ? `${t.title} — ${t.artist}` : t.title)}
                    className="admin-chip"
                    style={{ minHeight: 32, fontSize: 12 }}
                    title="Link this track"
                  >
                    ♪ {t.artist ? `${t.title} — ${t.artist}` : t.title} ＋
                  </button>
                ))}
                {result?.suggested_artists?.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => props.onAddArtist(a.id, a.title)}
                    className="admin-chip"
                    style={{ minHeight: 32, fontSize: 12 }}
                    title="Link this artist"
                  >
                    ★ {a.title} ＋
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
