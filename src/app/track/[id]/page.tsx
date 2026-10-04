import { notFound } from "next/navigation"
import TrackContent from "./track-content"
import { SERVER_API_BASE } from "@/lib/seo"

interface Props {
  params: Promise<{ id: string }>
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 300 } })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params
  const track = await fetchJSON<any>(`${SERVER_API_BASE}/tracks/${id}`)
  if (!track) notFound()

  const [album, artist, radioData, artistTracksData, artistAlbumsData, genresData] = await Promise.all([
    track.album_id ? fetchJSON<any>(`${SERVER_API_BASE}/albums/${track.album_id}`) : Promise.resolve(null),
    track.artist_id ? fetchJSON<any>(`${SERVER_API_BASE}/artists/${track.artist_id}`) : Promise.resolve(null),
    fetchJSON<any>(`${SERVER_API_BASE}/tracks/${id}/radio?limit=5`),
    track.artist_id ? fetchJSON<any>(`${SERVER_API_BASE}/artists/${track.artist_id}/tracks`) : Promise.resolve(null),
    track.artist_id ? fetchJSON<any>(`${SERVER_API_BASE}/artists/${track.artist_id}/albums`) : Promise.resolve(null),
    fetchJSON<any>(`${SERVER_API_BASE}/genres`),
  ])

  return (
    <TrackContent
      id={id}
      initialTrack={track}
      initialAlbum={album}
      initialArtist={artist}
      initialRadioData={radioData}
      initialArtistTracksData={artistTracksData}
      initialArtistAlbumsData={artistAlbumsData}
      initialGenresData={genresData}
    />
  )
}
