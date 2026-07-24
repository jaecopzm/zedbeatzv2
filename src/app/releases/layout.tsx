import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: "New Music Releases",
  description: "Discover the latest Zambian music albums, EPs, and singles. New releases updated daily on ZedBeatz.",
  openGraph: {
    title: "New Music Releases — Zambian Albums & Singles",
    description: "Discover the latest Zambian music albums, EPs, and singles.",
    url: `${SITE_URL}/releases`,
  },
  alternates: { canonical: `${SITE_URL}/releases` },
}

export default function ReleasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
