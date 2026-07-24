import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Search Music",
  description: "Search for Zambian music, artists, albums, and playlists on ZedBeatz.",
  alternates: { canonical: `${SITE_URL}/search` },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
