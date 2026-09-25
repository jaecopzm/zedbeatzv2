import type { Metadata } from "next"
import { SITE_URL, SITE_NAME, SERVER_API_BASE } from "@/lib/seo"
import { Breadcrumbs } from "@/components/breadcrumbs"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

async function getTrack(id: string) {
  try {
    const res = await fetch(`${SERVER_API_BASE}/tracks/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json() as Promise<{
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
      collaborators?: { artist_id: string; stage_name: string; role?: string }[]
    }>
  } catch {
    return null
  }
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <Breadcrumbs items={[
              { label: track.artist_name, href: `${SITE_URL}/artist/${track.artist_id}` },
              ...(track.album_name && track.album_id ? [{ label: track.album_name, href: `${SITE_URL}/album/${track.album_id}` }] : []),
              { label: track.title },
            ]} />
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
