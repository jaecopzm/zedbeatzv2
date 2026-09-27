import type { Metadata } from "next"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { DetailTopbar } from "@/components/detail-topbar"

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

const SECTION_LABELS: Record<string, string> = {
  best_new_songs: "Best New Songs",
  new_this_week: "New This Week",
  zed_hip_hop: "Zambian Hip Hop",
  zed_oldies: "Zed Oldies",
  zed_afrobeats: "Zambian Afrobeats",
  zed_gospel: "Zambian Gospel",
  zed_rnb: "Zambian R&B",
  zed_dancehall: "Zambian Dancehall",
  zed_kalindula: "Kalindula",
  zed_bangers: "Zed Bangers",
  zed_collabos: "Big Collabos",
  fresh_voices: "Fresh Voices",
  throwback_thursday: "Throwback Thursday",
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const label = SECTION_LABELS[slug] || slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const title = `${label} — Zambian Music`
  const description = `Listen to the best ${label} music on ${SITE_NAME}. Stream Zambian ${label.toLowerCase()} songs online.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/section/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/section/${slug}` },
  }
}

export default async function SectionLayout({ params, children }: Props) {
  const { slug } = await params
  const label = SECTION_LABELS[slug] || slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div style={{ position: "relative" }}>
      <DetailTopbar tone="dark" overlay={false} items={[{ label }]} />
      {children}
    </div>
  )
}
