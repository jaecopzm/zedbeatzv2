import type { Metadata } from "next"
import { SITE_URL, SITE_NAME, SERVER_API_BASE } from "@/lib/seo"
import { Breadcrumbs } from "@/components/breadcrumbs"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

async function getStation(id: string) {
  try {
    const res = await fetch(`${SERVER_API_BASE}/radio/stations/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json() as Promise<{
      station: {
        id: string
        name: string
        description: string | null
        cover_url: string | null
        type: string
        track_count: number
      }
    }>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getStation(id)
  if (!data) return { title: "Station not found" }

  const station = data.station
  const title = `${station.name} — Radio Station`
  const description = station.description || `Listen to "${station.name}" radio on ${SITE_NAME}. ${station.track_count} tracks.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: station.cover_url
        ? [{ url: station.cover_url, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: station.cover_url ? [station.cover_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/radio/${id}` },
  }
}

export default async function RadioLayout({ params, children }: Props) {
  const { id } = await params
  const data = await getStation(id)

  return (
    <div style={{ position: "relative" }}>
      {data?.station && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RadioStation",
              name: data.station.name,
              description: data.station.description || undefined,
              url: `${SITE_URL}/radio/${id}`,
              image: data.station.cover_url || undefined,
              numberOfPlaylists: data.station.track_count,
            }),
          }}
        />
      )}
      {data?.station && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <Breadcrumbs items={[
              { label: "Radio", href: `${SITE_URL}/radio` },
              { label: data.station.name },
            ]} />
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
