import type { Metadata } from "next"
import { SITE_NAME } from "@/lib/seo"
import BecomeArtistContent from "./content"

export const metadata: Metadata = {
  title: `Become an Artist | ${SITE_NAME}`,
  description: "Join ZedBeatz as an artist and start sharing your music with Zambia.",
}

export default function BecomeArtistPage() {
  return <BecomeArtistContent />
}
