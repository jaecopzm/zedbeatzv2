import RadioContent from "./radio-content"
import { SERVER_API_BASE } from "@/lib/seo"

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

export default async function RadioPage() {
  const stations = await fetchJSON<any>(`${SERVER_API_BASE}/radio/stations`)
  return <RadioContent initialStations={stations} />
}
