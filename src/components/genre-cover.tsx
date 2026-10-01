"use client"

import type { CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { GenreLike } from "@/lib/genre-art"
import { GenreMosaic } from "@/components/mosaic-art"

export type GenreCoverLike = GenreLike & { id?: string | null }

/**
 * Real genre artwork: the most-played track's cover in that genre
 * (actual Zambian releases), falling back to generated mosaic art
 * while loading or when the genre has no tracks yet.
 */
export function useGenreCoverArt(genre: GenreCoverLike | null | undefined, index = 0): string | null {
  const id = genre?.id ?? null
  const { data } = useQuery({
    queryKey: ["genre-top-cover", id],
    queryFn: () => api.getTracksByGenre(id as string, 1),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  })
  const cover = (data?.tracks?.[0] as any)?.cover_url as string | undefined
  return cover || null
}

const PHOTO_SCRIM: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "linear-gradient(180deg, rgba(5, 8, 22, 0.02) 30%, rgba(5, 8, 22, 0.72) 100%)",
}

const PHOTO_LABEL: CSSProperties = {
  position: "absolute",
  left: 10,
  right: 10,
  bottom: 8,
  fontSize: 13,
  fontWeight: 700,
  color: "#fff",
  letterSpacing: "-0.2px",
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textShadow: "0 1px 8px rgba(0, 0, 0, 0.45)",
  pointerEvents: "none",
}

export function GenreCoverImg({
  genre,
  index = 0,
  className,
  eager = false,
  baked = false,
}: {
  genre: GenreCoverLike | null | undefined
  index?: number
  className?: string
  eager?: boolean
  baked?: boolean
}) {
  const src = useGenreCoverArt(genre, index)
  const name = genre?.name ?? ""
  if (src) {
    return (
      <>
        <img
          className={className}
          src={src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          draggable={false}
        />
        {baked && name && (
          <>
            <span aria-hidden style={PHOTO_SCRIM} />
            <span style={PHOTO_LABEL}>{name}</span>
          </>
        )}
      </>
    )
  }
  return (
    <GenreMosaic
      genre={genre}
      index={index}
      label={baked ? name || undefined : undefined}
      dense={baked}
      className={className}
    />
  )
}
