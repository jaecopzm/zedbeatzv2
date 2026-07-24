import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ArtistContent from "./artist-content"
import { SITE_URL } from "@/lib/seo"
import { Breadcrumbs } from "@/components/breadcrumbs"

interface Props {
  params: Promise<{ id: string }>
}

/** Server-side API base — always use the full backend URL (no rewrite needed). */
const SERVER_API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"

async function fetchArtist(id: string) {
  try {
    const res = await fetch(`${SERVER_API_BASE}/artists/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json() as Promise<import("@/types").Artist>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const artist = await fetchArtist(id)
  if (!artist) return { title: "Artist not found - ZedBeatz" }

  const title = `${artist.stage_name} - ZedBeatz`
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.stage_name,
    image: artist.photo_url || undefined,
    description: artist.bio || undefined,
    url: `${SITE_URL}/artist/${id}`,
    ...(typeof artist.follower_count === "number"
      ? { numberOfFollowers: artist.follower_count }
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
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <Breadcrumbs items={[
            { label: artist.stage_name },
          ]} />
        </div>
      </div>
      <ArtistContent artistId={id} initialArtist={artist} />
    </div>
  )
}
