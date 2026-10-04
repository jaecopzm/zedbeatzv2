import Link from "next/link"

interface Props {
  track: {
    artist_id?: string
    artist_name?: string
    collaborators?: { artist_id: string; stage_name: string }[]
  }
}

export function ArtistLinks({ track }: Props) {
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
            <Link
              href={`/artist/${a.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: "pointer" }}
            >
              {a.name}
            </Link>
          ) : (
            <Link
              href={`/search?q=${encodeURIComponent(a.name)}`}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: "pointer" }}
            >
              {a.name}
            </Link>
          )}
        </span>
      ))}
    </>
  )
}
