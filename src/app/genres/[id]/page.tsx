import GenreContent from "./genre-content"
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

export default async function GenrePage({ params }: Props) {
  const { id } = await params
  const [genresData, tracksData] = await Promise.all([
    fetchJSON<{ genres: { id: string; name: string; slug: string }[] }>(`${SERVER_API_BASE}/genres`),
    fetchJSON<any>(`${SERVER_API_BASE}/genres/${id}/tracks?limit=50`),
  ])
  return <GenreContent id={id} initialGenresData={genresData} initialGenreTracks={tracksData} />
}
