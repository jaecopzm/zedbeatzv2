import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Radio Stations",
  description: "Listen to curated Zambian music radio stations. Genre stations, personalised mixes, and more on ZedBeatz.",
  openGraph: {
    title: "Radio Stations — Zambian Music Radio",
    description: "Listen to curated Zambian music radio stations.",
    url: `${SITE_URL}/radio`,
  },
  alternates: { canonical: `${SITE_URL}/radio` },
}

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
