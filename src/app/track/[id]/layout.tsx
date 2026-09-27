import type { Metadata } from "next"
import { SITE_URL, SITE_NAME, SERVER_API_BASE } from "@/lib/seo"
import { DetailTopbar } from "@/components/detail-topbar"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

type TrackSEO = {
  id: string
  title: string
  artist_name: string
  artist_id: string
  cover_url: string | null
  duration_sec: number
  album_name?: string
  album_id?: string | null
  play_count?: number
  description?: string | null
  genre_id?: string | null
  released_at?: string | null
  collaborators?: { artist_id: string; stage_name: string; role?: string }[]
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 },
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function getTrack(id: string) {
  return fetchJSON<TrackSEO>(`${SERVER_API_BASE}/tracks/${id}`)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const track = await getTrack(id)
  if (!track) return { title: "Track not found" }

  const title = `${track.title} by ${track.artist_name}`
  const description = track.description || `Listen to "${track.title}" by ${track.artist_name} on ${SITE_NAME}. Stream Zambian music online.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "music.song",
      images: track.cover_url
        ? [{ url: track.cover_url, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: track.cover_url ? [track.cover_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/track/${id}` },
  }
}

export default async function TrackLayout({ params, children }: Props) {
  const { id } = await params
  const track = await getTrack(id)

  // Best-effort related links so crawlers see real HTML + internal links
  // even before the client player hydrates. Never blocks rendering.
  const [artistTracks, radio] = track
    ? await Promise.all([
        track.artist_id
          ? fetchJSON<{ tracks: { id: string; title: string; artist_name?: string }[] }>(
              `${SERVER_API_BASE}/artists/${track.artist_id}/tracks`
            )
          : Promise.resolve(null),
        fetchJSON<{ queue: { id: string; title: string; artist_name?: string }[] }>(
          `${SERVER_API_BASE}/tracks/${id}/radio?limit=10`
        ),
      ])
    : [null, null]

  const related = [
    ...(artistTracks?.tracks ?? []),
    ...(radio?.queue ?? []),
  ]
    .filter((t) => t?.id && t.id !== id)
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
    .slice(0, 10)

  const collaboratorNames = track?.collaborators?.map((c) => c.stage_name) ?? []

  return (
    <div style={{ position: "relative" }}>
      {track && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicRecording",
              name: track.title,
              url: `${SITE_URL}/track/${id}`,
              image: track.cover_url || undefined,
              duration: `PT${Math.max(0, Math.floor((track.duration_sec || 0) / 60))}M${Math.max(0, (track.duration_sec || 0) % 60)}S`,
              isAccessibleForFree: true,
              byArtist: [
                {
                  "@type": "MusicGroup",
                  name: track.artist_name,
                  url: `${SITE_URL}/artist/${track.artist_id}`,
                },
                ...collaboratorNames.map((name) => ({
                  "@type": "MusicGroup",
                  name,
                })),
              ],
              ...(track.album_name
                ? {
                    inAlbum: {
                      "@type": "MusicAlbum",
                      name: track.album_name,
                      ...(track.album_id ? { url: `${SITE_URL}/album/${track.album_id}` } : {}),
                    },
                  }
                : {}),
              ...(typeof track.play_count === "number"
                ? { interactionStatistic: { "@type": "InteractionCounter", interactionType: "ListenAction", userInteractionCount: track.play_count } }
                : {}),
            }),
          }}
        />
      )}
      {track && (
        <DetailTopbar
          tone="light"
          items={[
            { label: track.artist_name, href: `${SITE_URL}/artist/${track.artist_id}` },
            ...(track.album_name && track.album_id ? [{ label: track.album_name, href: `${SITE_URL}/album/${track.album_id}` }] : []),
            { label: track.title },
          ]}
        />
      )}
      {track && (
        <nav aria-label="Related tracks" className="seo-link-list">
          <a href={`/track/${id}`}>
            {track.title} by {track.artist_name}
          </a>
          <a href={`/artist/${track.artist_id}`}>{track.artist_name}</a>
          {track.album_id && (
            <a href={`/album/${track.album_id}`}>{track.album_name ?? "Album"}</a>
          )}
          {track.genre_id && (
            <a href={`/genres/${track.genre_id}`}>More in this genre</a>
          )}
          {(track.collaborators ?? []).map((c) => (
            <a key={c.artist_id} href={`/artist/${c.artist_id}`}>
              {c.stage_name}
            </a>
          ))}
          {related.map((t) => (
            <a key={t.id} href={`/track/${t.id}`}>
              {t.title} by {t.artist_name ?? track.artist_name}
            </a>
          ))}
          <span>
            {track.description ||
              `Listen to "${track.title}" by ${track.artist_name} on ${SITE_NAME}. Stream Zambian music online.`}
          </span>
        </nav>
      )}
      {children}
    </div>
  )
}
