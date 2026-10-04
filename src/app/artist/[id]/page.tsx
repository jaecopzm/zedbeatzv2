import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ArtistContent from "./artist-content"
import { SITE_URL } from "@/lib/seo"
import { DetailTopbar } from "@/components/detail-topbar"

interface Props {
  params: Promise<{ id: string }>
}

/** Server-side API base — always use the full backend URL (no rewrite needed). */
const SERVER_API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"

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

async function fetchArtist(id: string) {
  return fetchJSON<import("@/types").Artist>(`${SERVER_API_BASE}/artists/${id}`)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const artist = await fetchArtist(id)
  if (!artist) return { title: "Artist not found - ZedBeatz" }

  const title = artist.stage_name
  const description = artist.bio || `Listen to ${artist.stage_name} on ZedBeatz.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: artist.photo_url
        ? [{ url: artist.photo_url, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: artist.photo_url ? [artist.photo_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/artist/${id}` },
  }
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params
  const artist = await fetchArtist(id)
  if (!artist) notFound()

  const [tracksData, albumsData] = await Promise.all([
    fetchJSON<{ tracks: { id: string; title: string; artist_name?: string; cover_url?: string | null; duration_sec?: number; play_count?: number; album_id?: string | null; album_name?: string | null; genre_id?: string | null }[] }>(
      `${SERVER_API_BASE}/artists/${id}/tracks`
    ),
    fetchJSON<{ albums: { id: string; title: string; cover_url?: string | null; type?: string; artist_name?: string; released_at?: string | null }[] }>(
      `${SERVER_API_BASE}/artists/${id}/albums`
    ),
  ])
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.stage_name,
    image: artist.photo_url || undefined,
    description: artist.bio || undefined,
    url: `${SITE_URL}/artist/${id}`,
    ...(Array.isArray(artist.genre_tags) && artist.genre_tags.length > 0
      ? { genre: artist.genre_tags }
      : {}),
    ...(typeof artist.follower_count === "number"
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "FollowAction",
            userInteractionCount: artist.follower_count,
          },
        }
      : {}),
    ...(typeof artist.track_count === "number"
      ? { numberOfTracks: artist.track_count }
      : {}),
  }

  return (
    <div style={{ position: "relative" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DetailTopbar
        tone="light"
        items={[
          { label: artist.stage_name },
        ]}
      />
      <ArtistContent artistId={id} initialArtist={artist} initialTracksData={tracksData} initialAlbumsData={albumsData} />
    </div>
  )
}
