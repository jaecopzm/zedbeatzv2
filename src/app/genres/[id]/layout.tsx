import type { Metadata } from "next"
import { SITE_URL, SITE_NAME, SERVER_API_BASE } from "@/lib/seo"
import { DetailTopbar } from "@/components/detail-topbar"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

async function getGenre(id: string) {
  try {
    const res = await fetch(`${SERVER_API_BASE}/genres`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { genres: { id: string; name: string; slug: string }[] }
    return data.genres.find((g) => g.id === id) || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const genre = await getGenre(id)
  if (!genre) return { title: "Genre not found" }

  const title = `${genre.name} Music — Zambian ${genre.name} Songs`
  const description = `Stream the best Zambian ${genre.name} music on ${SITE_NAME}. Discover new ${genre.name} songs, artists, and albums.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: { canonical: `${SITE_URL}/genres/${id}` },
  }
}

export default async function GenreLayout({ params, children }: Props) {
  const { id } = await params
  const genre = await getGenre(id)

  return (
    <div style={{ position: "relative" }}>
      {genre && (
        <DetailTopbar
          tone="light"
          items={[
            { label: "Genres", href: "/search" },
            { label: `${genre.name} Music` },
          ]}
        />
      )}
      {children}
    </div>
  )
}
