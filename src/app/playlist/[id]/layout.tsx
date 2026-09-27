import type { Metadata } from "next"
import { SITE_URL, SITE_NAME, SERVER_API_BASE } from "@/lib/seo"
import { DetailTopbar } from "@/components/detail-topbar"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

async function getPlaylist(id: string) {
  try {
    const res = await fetch(`${SERVER_API_BASE}/playlists/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json() as Promise<{
      id: string
      title: string
      description: string | null
      cover_url: string | null
      tracks?: { id: string; title: string; artist_name: string; duration_sec: number }[]
    }>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const playlist = await getPlaylist(id)
  if (!playlist) return { title: "Playlist not found" }

  const title = `${playlist.title} — Playlist`
  const description = playlist.description || `Listen to "${playlist.title}" on ${SITE_NAME}. ${playlist.tracks?.length || 0} tracks.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: playlist.cover_url
        ? [{ url: playlist.cover_url, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: playlist.cover_url ? [playlist.cover_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/playlist/${id}` },
  }
}

export default async function PlaylistLayout({ params, children }: Props) {
  const { id } = await params
  const playlist = await getPlaylist(id)

  return (
    <div style={{ position: "relative" }}>
      {playlist && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicPlaylist",
              name: playlist.title,
              description: playlist.description || undefined,
              url: `${SITE_URL}/playlist/${id}`,
              image: playlist.cover_url || undefined,
              numTracks: playlist.tracks?.length || 0,
              ...(playlist.tracks?.length
                ? {
                    track: playlist.tracks.map((t) => ({
                      "@type": "MusicRecording",
                      name: t.title,
                      byArtist: { "@type": "MusicGroup", name: t.artist_name },
                      duration: `PT${Math.floor(t.duration_sec / 60)}M${t.duration_sec % 60}S`,
                    })),
                  }
                : {}),
            }),
          }}
        />
      )}
      {playlist && (
        <DetailTopbar
          tone="light"
          items={[
            { label: playlist.title },
          ]}
        />
      )}
      {children}
    </div>
  )
}
