import type { MetadataRoute } from "next"
import { SITE_URL, SERVER_API_BASE } from "@/lib/seo"

export const revalidate = 3600

async function fetchJSON<T>(url: string): Promise<T | null> {
  // Retry a few times: the backend is occasionally slow/flaky under
  // intermittent network loss, and a single dropped fetch would otherwise
  // silently truncate the sitemap.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(url, { signal: controller.signal, next: { revalidate: 300 } })
      clearTimeout(timeout)
      if (!res.ok) return null
      return await res.json()
    } catch {
      // back off briefly before the next attempt
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  return null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sectionSlugs = [
    "best_new_songs", "new_this_week", "zed_hip_hop", "zed_afrobeats",
    "zed_gospel", "zed_rnb", "zed_dancehall", "zed_kalindula",
    "zed_oldies", "zed_bangers", "zed_collabos", "fresh_voices",
    "throwback_thursday",
  ]
  const sectionPages: MetadataRoute.Sitemap = sectionSlugs.map((slug) => ({
    url: `${SITE_URL}/section/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/releases`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/radio`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/become-an-artist`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ]

  const sitemapData = await fetchJSON<{
    tracks: { id: string; updated_at: string }[]
    albums: { id: string; updated_at: string }[]
    artists: { id: string; updated_at: string }[]
  }>(`${SERVER_API_BASE}/sitemap`)

  const albumPages: MetadataRoute.Sitemap = (sitemapData?.albums ?? []).map((a) => ({
    url: `${SITE_URL}/album/${a.id}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const genreData = await fetchJSON<{ genres: { id: string; name: string }[] }>(
    `${SERVER_API_BASE}/genres`
  )
  const genrePages: MetadataRoute.Sitemap = (genreData?.genres ?? []).map((g) => ({
    url: `${SITE_URL}/genres/${g.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }))

  const stationData = await fetchJSON<{
    stations: {
      curated: { id: string; updated_at: string }[]
      genre: { id: string; name: string; slug: string }[]
    }
  }>(`${SERVER_API_BASE}/radio/stations`)
  const curatedStations = (stationData?.stations?.curated ?? []).map((s) => ({
    url: `${SITE_URL}/radio/${s.id}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))
  const genreStationSlugs = ["personalized", ...(stationData?.stations?.genre ?? []).map((g) => g.slug)]
  const genreStationPages: MetadataRoute.Sitemap = genreStationSlugs.map((slug) => ({
    url: `${SITE_URL}/radio/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  const postData = await fetchJSON<{
    posts: { slug: string; updated_at: string }[]
  }>(`${SERVER_API_BASE}/posts/sitemap`)
  const postPages: MetadataRoute.Sitemap = (postData?.posts ?? []).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const trackPages: MetadataRoute.Sitemap = (sitemapData?.tracks ?? []).map((t) => ({
    url: `${SITE_URL}/track/${t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  const artistPages: MetadataRoute.Sitemap = (sitemapData?.artists ?? []).map((a) => ({
    url: `${SITE_URL}/artist/${a.id}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    ...postPages,
    ...sectionPages,
    ...albumPages,
    ...genrePages,
    ...curatedStations,
    ...genreStationPages,
    ...trackPages,
    ...artistPages,
  ]
}
