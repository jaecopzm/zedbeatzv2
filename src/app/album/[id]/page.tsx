import { notFound } from "next/navigation"
import AlbumContent from "./album-content"
import { SERVER_API_BASE } from "@/lib/seo"

interface Props {
  params: Promise<{ id: string }>
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 60 } })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params
  const album = await fetchJSON<any>(`${SERVER_API_BASE}/albums/${id}`)
  if (!album) notFound()
  const moreAlbums = album.artist_id ? await fetchJSON<any>(`${SERVER_API_BASE}/artists/${album.artist_id}/albums`) : null
  return <AlbumContent id={id} initialAlbum={album} initialMoreAlbums={moreAlbums} />
}
