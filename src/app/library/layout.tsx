import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Your Library",
  description: "Your music library on ZedBeatz — saved albums, artists, and playlists.",
  alternates: { canonical: `${SITE_URL}/library` },
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
