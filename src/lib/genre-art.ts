/**
 * Shared genre identity system — single source for the home genre rail
 * and the genre detail hero, so a card feels like it expands into the page.
 * Artwork is generated mosaic art (see mosaic-art) tinted per genre;
 * accents are used sparingly (eyebrow, current-track highlight).
 */

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

const ACCENT_FALLBACK = Object.values(GENRE_ACCENT)

export type GenreLike = { slug?: string | null; name?: string | null }

function matchKey(g: GenreLike | null | undefined): string | null {
  if (!g) return null
  const slug = (g.slug ?? "").toLowerCase()
  if (slug && GENRE_ACCENT[slug]) return slug
  const name = (g.name ?? "").toLowerCase()
  if (!name) return null
  for (const key of Object.keys(GENRE_ACCENT)) {
    if (name.includes(key.replace(/-/g, " ")) || key.replace(/-/g, "").includes(name.replace(/\s+/g, ""))) return key
  }
  if (name.includes("hip")) return "zambian-hip-hop"
  if (name.includes("r&b") || name.includes("rnb")) return "rnb"
  if (name.includes("pop")) return "afro-pop"
  if (name.includes("trad") || name.includes("kal")) return "kalindula"
  return null
}

export function genreAccent(g: GenreLike | null | undefined, i = 0): string {
  const key = matchKey(g)
  if (key && GENRE_ACCENT[key]) return GENRE_ACCENT[key]
  return ACCENT_FALLBACK[i % ACCENT_FALLBACK.length]
}
