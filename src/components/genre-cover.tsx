"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { genreArt, type GenreLike } from "@/lib/genre-art"

export type GenreCoverLike = GenreLike & { id?: string | null }

/**
 * Real genre artwork: the most-played track's cover in that genre
 * (actual Zambian releases), falling back to the curated Unsplash set
 * while loading or when the genre has no tracks yet.
 */
export function useGenreCoverArt(genre: GenreCoverLike | null | undefined, index = 0): string {
  const id = genre?.id ?? null
  const { data } = useQuery({
    queryKey: ["genre-top-cover", id],
    queryFn: () => api.getTracksByGenre(id as string, 1),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  })
  const cover = (data?.tracks?.[0] as any)?.cover_url as string | undefined
  return cover || genreArt(genre, index)
}

export function GenreCoverImg({
  genre,
  index = 0,
  className,
  eager = false,
}: {
  genre: GenreCoverLike | null | undefined
  index?: number
  className?: string
  eager?: boolean
}) {
  const src = useGenreCoverArt(genre, index)
  return (
    <img
      className={className}
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  )
}
