import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"
import BecomeArtistContent from "./content"

export const metadata: Metadata = {
  title: "Become an Artist",
  description: "Join ZedBeatz as an artist and start sharing your music with Zambia.",
  alternates: { canonical: `${SITE_URL}/become-an-artist` },
}

export default function BecomeArtistPage() {
  return <BecomeArtistContent />
}
