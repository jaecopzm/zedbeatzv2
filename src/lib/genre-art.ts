/**
 * Shared genre artwork system — single source for the home genre rail
 * and the genre detail hero, so a card feels like it expands into the page.
 * Art is stable public Unsplash CDN (no API key), accents are per-genre
 * tints used sparingly (eyebrow, current-track highlight).
 */

const IMG = (id: string) => `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`

export const GENRE_ART: Record<string, string> = {
  afrobeats: IMG("photo-1514525253161-7a46d19cd819"),
  "zambian-hip-hop": IMG("photo-1493225457124-a3eb161ffa5f"),
  kalindula: IMG("photo-1510915361894-db8b60106cb1"),
  gospel: IMG("photo-1438232992991-995b7058bbb3"),
  rnb: IMG("photo-1511671782779-c97d3d27a1d4"),
  reggae: IMG("photo-1524368535928-5b5e00ddc76b"),
  dancehall: IMG("photo-1530103862676-de8c9debad1d"),
  "afro-pop": IMG("photo-1470229722913-7c0e2dbbafd3"),
  jazz: IMG("photo-1511192336575-5a79af67a629"),
  traditional: IMG("photo-1519892300165-cb5542fb47c7"),
}

export const GENRE_ACCENT: Record<string, string> = {
  afrobeats: "#FF9F1C",
  "zambian-hip-hop": "#8B7CFF",
  kalindula: "#2ED573",
  gospel: "#FFD32A",
  rnb: "#FF6B81",
  reggae: "#20E3B2",
  dancehall: "#FF2E93",
  "afro-pop": "#4DC3FF",
  jazz: "#E2B857",
  traditional: "#FF7A45",
}

const ART_FALLBACK = Object.values(GENRE_ART)
const ACCENT_FALLBACK = Object.values(GENRE_ACCENT)

export type GenreLike = { slug?: string | null; name?: string | null }

function matchKey(g: GenreLike | null | undefined): string | null {
  if (!g) return null
  const slug = (g.slug ?? "").toLowerCase()
  if (slug && GENRE_ART[slug]) return slug
  const name = (g.name ?? "").toLowerCase()
  if (!name) return null
  for (const key of Object.keys(GENRE_ART)) {
    if (name.includes(key.replace(/-/g, " ")) || key.replace(/-/g, "").includes(name.replace(/\s+/g, ""))) return key
  }
  if (name.includes("hip")) return "zambian-hip-hop"
  if (name.includes("r&b") || name.includes("rnb")) return "rnb"
  if (name.includes("pop")) return "afro-pop"
  if (name.includes("trad") || name.includes("kal")) return "kalindula"
  return null
}

export function genreArt(g: GenreLike | null | undefined, i = 0): string {
  const key = matchKey(g)
  if (key) return GENRE_ART[key]
  return ART_FALLBACK[i % ART_FALLBACK.length]
}

export function genreAccent(g: GenreLike | null | undefined, i = 0): string {
  const key = matchKey(g)
  if (key && GENRE_ACCENT[key]) return GENRE_ACCENT[key]
  return ACCENT_FALLBACK[i % ACCENT_FALLBACK.length]
}
