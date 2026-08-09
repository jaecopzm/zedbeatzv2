import HomePage, { type HomeInitialData } from "./home-page"
import { SITE_URL } from "@/lib/seo"

export const revalidate = 300

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"

type TrackList = { tracks: Record<string, unknown>[] }
type AlbumList = { albums: Record<string, unknown>[] }
type ArtistList = { artists: Record<string, unknown>[] }

interface Track {
  id?: string
  title?: string | null
  artist_name?: string | null
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 },
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

const browseSectionSlugs = [
  "zed_hip_hop", "zed_afrobeats", "zed_gospel", "zed_rnb",
  "zed_dancehall", "zed_kalindula", "zed_oldies", "zed_bangers",
  "zed_collabos", "fresh_voices", "throwback_thursday",
]

export default async function HomePageServer() {
  const [best, fresh, albums, artists, ...sectionResults] = await Promise.all([
    fetchJSON<TrackList>(`${API_BASE}/tracks?limit=12&section=best_new_songs`),
    fetchJSON<TrackList>(`${API_BASE}/tracks?limit=12&section=new_this_week`),
    fetchJSON<AlbumList>(`${API_BASE}/albums?limit=12`),
    fetchJSON<ArtistList>(`${API_BASE}/artists/featured`),
    ...browseSectionSlugs.map((slug) =>
      fetchJSON<TrackList>(`${API_BASE}/tracks?limit=12&section=${slug}`)
    ),
  ])

  const sections: Record<string, TrackList | null> = {}
  browseSectionSlugs.forEach((slug, i) => {
    sections[slug] = sectionResults[i] ?? null
  })

  const initialData: HomeInitialData = {
    best_new_songs: best,
    new_this_week: fresh,
    albums,
    artists,
    sections,
  }

  const topTracks: Track[] = (best?.tracks ?? []).filter(
    (t): t is Record<string, unknown> & Track => Boolean(t && t.id)
  ).slice(0, 20)

  const chartJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top Zed Beatz Charts",
    description: "The biggest and newest Zambian songs trending on ZedBeatz.",
    numberOfItems: topTracks.length,
    itemListElement: topTracks.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/track/${t.id}`,
      name: t.title,
    })),
  }

  const allTracks: Track[] = [...(best?.tracks ?? []), ...(fresh?.tracks ?? [])].filter(
    (t): t is Record<string, unknown> & Track => Boolean(t && t.id)
  ).slice(0, 24)

  const allAlbums = (albums?.albums ?? []).filter((a) => a && a.id).slice(0, 12)
  const allArtists = (artists?.artists ?? []).filter((a) => a && a.id).slice(0, 12)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chartJsonLd) }}
      />
      <nav aria-label="Browse" className="seo-link-list">
        {allTracks.map((t) => (
          <a key={`t-${t.id}`} href={`/track/${t.id}`}>
            {t.title} by {t.artist_name ?? "Unknown Artist"}
          </a>
        ))}
        {allAlbums.map((a) => (
          <a key={`a-${a.id}`} href={`/album/${a.id}`}>
            {String(a.title ?? "")}
          </a>
        ))}
        {allArtists.map((ar) => (
          <a key={`ar-${ar.id}`} href={`/artist/${ar.id}`}>
            {String(ar.stage_name ?? "")}
          </a>
        ))}
        {["best_new_songs", "new_this_week", ...browseSectionSlugs].map((slug) => (
          <a key={`s-${slug}`} href={`/section/${slug}`}>
            {slug.replace(/_/g, " ")}
          </a>
        ))}
      </nav>
      <HomePage initialData={initialData} />
    </>
  )
}