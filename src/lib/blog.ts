export const TYPE_LABELS: Record<string, string> = {
  roundup: "Weekly Roundup",
  spotlight: "New Release",
  chart: "Charts",
  profile: "Artist Story",
  article: "News",
}

export const TYPE_TINTS: Record<string, string> = {
  roundup: "#7c3aed",
  spotlight: "#059669",
  chart: "#d97706",
  profile: "#db2777",
  article: "#144AE0",
}

export function typeLabel(t?: string | null): string {
  if (!t) return "News"
  return TYPE_LABELS[t] ?? "News"
}

export function typeTint(t?: string | null): string {
  if (!t) return TYPE_TINTS.article
  return TYPE_TINTS[t] ?? TYPE_TINTS.article
}

/** Defensive coercions — the API occasionally returns arrays/objects/null
 *  where the frontend types say string. A single non-string field used to
 *  500 the whole article page in production, so normalize at the boundary. */
export function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

export function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

export function keywordsToList(kw: unknown): string[] {
  if (Array.isArray(kw)) return kw.map((t) => String(t ?? "").trim()).filter(Boolean)
  if (typeof kw === "string") return kw.split(",").map((t) => t.trim()).filter(Boolean)
  return []
}

export function formatBlogDate(s?: string | null): string {
  if (!s) return ""
  const d = new Date(s)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export function formatBlogDateShort(s?: string | null): string {
  if (!s) return ""
  const d = new Date(s)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function readingTimeFromHtml(body: string): number {
  const text = stripHtml(body ?? "")
  const words = text ? text.split(" ").filter(Boolean).length : 0
  return Math.max(1, Math.round(words / 200))
}

export function readingTimeFromAny(body: string): number {
  if (!body) return 1
  if (/^\s*</.test(body)) return readingTimeFromHtml(body)
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export interface RelatedCandidate {
  id: string
  slug: string
  title: string
  excerpt?: string
  cover_url?: string | null
  post_type: string
  keywords?: string
  published_at?: string | null
  created_at: string
  tracks?: Array<{ id: string }>
  artists?: Array<{ id: string }>
  linked_track_ids?: string[]
  linked_artist_ids?: string[]
}

/** Score candidates against current post: type match, shared tags, shared tracks/artists, recency. */
export function scoreRelated(
  current: {
    post_type: string
    keywords?: unknown
    tracks?: unknown
    artists?: unknown
    linked_track_ids?: unknown
    linked_artist_ids?: unknown
    slug: string
  },
  candidates: RelatedCandidate[],
  limit = 3
): RelatedCandidate[] {
  const curTags = new Set(keywordsToList(current.keywords).map((t) => t.toLowerCase()))
  const curTrackIds = new Set([
    ...asArray<{ id: string }>(current.tracks).map((t) => t?.id),
    ...asArray<string>(current.linked_track_ids),
  ])
  const curArtistIds = new Set([
    ...asArray<{ id: string }>(current.artists).map((a) => a?.id),
    ...asArray<string>(current.linked_artist_ids),
  ])

  return candidates
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      let score = 0
      if (p.post_type === current.post_type) score += 3
      const pTags = keywordsToList(p.keywords)
      for (const t of pTags) if (curTags.has(t.toLowerCase())) score += 2
      const pTrackIds = new Set([
        ...asArray<{ id: string }>(p.tracks).map((t) => t?.id),
        ...asArray<string>(p.linked_track_ids),
      ])
      for (const id of pTrackIds) if (curTrackIds.has(id)) score += 4
      const pArtistIds = new Set([
        ...asArray<{ id: string }>(p.artists).map((a) => a?.id),
        ...asArray<string>(p.linked_artist_ids),
      ])
      for (const id of pArtistIds) if (curArtistIds.has(id)) score += 3
      // Recency tiebreak: newer first
      const ts = p.published_at ?? p.created_at
      const time = ts ? new Date(ts).getTime() || 0 : 0
      return { p, score, time }
    })
    .sort((a, b) => b.score - a.score || b.time - a.time)
    .slice(0, limit)
    .map((r) => r.p)
}

export interface TocHeading {
  id: string
  text: string
  level: 2 | 3
}

export function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

/** Extract h2/h3 headings from HTML (or markdown-lite) for TOC. */
export function extractToc(body: string, max = 6): TocHeading[] {
  const out: TocHeading[] = []
  if (/^\s*</.test(body)) {
    const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi
    let m: RegExpExecArray | null
    const seen = new Set<string>()
    while ((m = re.exec(body)) !== null && out.length < max) {
      const level = Number(m[1]) as 2 | 3
      const text = decodeEntities(m[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
      if (!text || text.length < 3) continue
      let id = slugifyHeading(text)
      if (!id) continue
      let n = 2
      let uniq = id
      while (seen.has(uniq)) uniq = `${id}-${n++}`
      seen.add(uniq)
      out.push({ id: uniq, text, level })
    }
    return out
  }
  // markdown-lite fallback
  for (const line of body.split("\n")) {
    const t = line.trim()
    if (out.length >= max) break
    if (t.startsWith("## ")) out.push({ id: slugifyHeading(t.slice(3)), text: t.slice(3).trim(), level: 2 })
    else if (t.startsWith("### ")) out.push({ id: slugifyHeading(t.slice(4)), text: t.slice(4).trim(), level: 3 })
  }
  return out.filter((h) => h.id && h.text)
}
