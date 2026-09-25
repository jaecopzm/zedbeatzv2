import type { Metadata } from "next"
import { SITE_URL, SITE_NAME, SERVER_API_BASE } from "@/lib/seo"
import { Breadcrumbs } from "@/components/breadcrumbs"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

async function getAlbum(id: string) {
  try {
    const res = await fetch(`${SERVER_API_BASE}/albums/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json() as Promise<{
      id: string
      title: string
      cover_url: string | null
      type: string
      artist_name?: string
      artist_id?: string
      tracks: { id: string; title: string; duration_sec: number; artist_name?: string }[]
      released_at: string | null
      updated_at: string
    }>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const album = await getAlbum(id)
  if (!album) return { title: "Album not found" }

  const artist = album.artist_name || album.tracks?.[0]?.artist_name || "Unknown Artist"
  const typeLabel = album.type === "single" ? "Single" : album.type === "ep" ? "EP" : "Album"
  const title = `${album.title} — ${artist}`
  const description = `Stream "${album.title}" by ${artist} on ${SITE_NAME}. ${album.tracks?.length || 0} tracks.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "music.album",
      images: album.cover_url
        ? [{ url: album.cover_url, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: album.cover_url ? [album.cover_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/album/${id}` },
  }
}

export default async function AlbumLayout({ params, children }: Props) {
  const { id } = await params
  const album = await getAlbum(id)
  const artistName = album?.artist_name || album?.tracks?.[0]?.artist_name

  return (
    <div style={{ position: "relative" }}>
      {album && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicAlbum",
              name: album.title,
              url: `${SITE_URL}/album/${id}`,
              image: album.cover_url || undefined,
              ...(artistName
                ? {
                    byArtist: {
                      "@type": "MusicGroup",
                      name: artistName,
                    },
                  }
                : {}),
              ...(album.released_at ? { datePublished: album.released_at } : {}),
              ...(album.tracks?.length
                ? {
                    track: {
                      "@type": "ItemList",
                      itemListElement: album.tracks.map((t, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        item: {
                          "@type": "MusicRecording",
                          name: t.title,
                          duration: `PT${Math.floor(t.duration_sec / 60)}M${t.duration_sec % 60}S`,
                          url: `${SITE_URL}/track/${t.id}`,
                        },
                      })),
                    },
                  }
                : {}),
            }),
          }}
        />
      )}
      {artistName && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <Breadcrumbs items={[
              { label: artistName, href: `${SITE_URL}/artist/${album!.artist_id}` },
              { label: album!.title },
            ]} />
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
