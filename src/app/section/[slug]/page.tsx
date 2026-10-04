import SectionContent from "./section-content"
import { SERVER_API_BASE } from "@/lib/seo"

interface Props {
  params: Promise<{ slug: string }>
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 300 } })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function SectionPage({ params }: Props) {
  const { slug } = await params
  const tracksData = await fetchJSON<any>(`${SERVER_API_BASE}/tracks?limit=50&offset=0&section=${encodeURIComponent(slug)}`)
  return <SectionContent slug={slug} initialTracksData={tracksData} />
}
