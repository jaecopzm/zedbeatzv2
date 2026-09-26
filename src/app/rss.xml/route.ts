import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SERVER_API_BASE } from "@/lib/seo"

export const revalidate = 3600

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

type Track = {
  id: string
  title: string
  artist_name?: string
  cover_url?: string | null
  released_at?: string | null
  updated_at?: string
  created_at?: string
}

type Album = {
  id: string
  title: string
  cover_url?: string | null
  released_at?: string | null
  updated_at?: string
  created_at?: string
}

export async function GET() {
  const [tracksData, albumsData] = await Promise.all([
    fetchJSON<{ tracks: Track[] }>(`${SERVER_API_BASE}/tracks?limit=50`),
    fetchJSON<{ albums: Album[] }>(`${SERVER_API_BASE}/albums?limit=30`),
  ])

  const tracks = (tracksData?.tracks ?? []).slice(0, 50)
  const albums = (albumsData?.albums ?? []).slice(0, 30)

  const items = [
    ...tracks.map((t) => ({
      title: `${t.title} by ${t.artist_name ?? "Unknown Artist"}`,
      link: `${SITE_URL}/track/${t.id}`,
      guid: `${SITE_URL}/track/${t.id}`,
      pubDate: t.released_at || t.created_at || t.updated_at || new Date().toISOString(),
      description: `Listen to "${t.title}" by ${t.artist_name ?? "Unknown Artist"} on ${SITE_NAME}.`,
      image: t.cover_url ?? undefined,
    })),
    ...albums.map((a) => ({
      title: `${a.title} — New Release on ${SITE_NAME}`,
      link: `${SITE_URL}/album/${a.id}`,
      guid: `${SITE_URL}/album/${a.id}`,
      pubDate: a.released_at || a.created_at || a.updated_at || new Date().toISOString(),
      description: `Stream "${a.title}" on ${SITE_NAME}.`,
      image: a.cover_url ?? undefined,
    })),
  ]
    .sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
    .slice(0, 80)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${esc(SITE_NAME)} — New Zambian Music</title>
<link>${esc(SITE_URL)}</link>
<description>${esc(SITE_DESCRIPTION)}</description>
<language>en-zm</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(i.link)}</link>
<guid isPermaLink="true">${esc(i.guid)}</guid>
<pubDate>${new Date(i.pubDate).toUTCString()}</pubDate>
<description>${esc(i.description)}</description>
</item>`
  )
  .join("\n")}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
