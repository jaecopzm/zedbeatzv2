import { useRouter } from "next/navigation"

interface Props {
  track: {
    artist_id?: string
    artist_name?: string
    collaborators?: { artist_id: string; stage_name: string }[]
  }
}

export function ArtistLinks({ track }: Props) {
  const router = useRouter()
  const artists: { id?: string; name: string }[] = []
  if (track.artist_name) {
    artists.push({ id: track.artist_id, name: track.artist_name })
  }
  if (track.collaborators) {
    for (const c of track.collaborators) {
      if (c.stage_name) artists.push({ id: c.artist_id, name: c.stage_name })
    }
  }

  if (artists.length === 0) return null

  return (
    <>
      {artists.map((a, i) => (
        <span key={a.id ?? a.name}>
          {i > 0 && <span style={{ color: "var(--muted-foreground)" }}>, </span>}
          {a.id ? (
            <span
              onClick={(e) => { e.stopPropagation(); router.push(`/artist/${a.id}`) }}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {a.name}
            </span>
          ) : (
            <span
              onClick={(e) => { e.stopPropagation(); router.push(`/search?q=${encodeURIComponent(a.name)}`) }}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {a.name}
            </span>
          )}
        </span>
      ))}
    </>
  )
}
