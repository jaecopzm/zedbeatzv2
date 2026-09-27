"use client"

import { useRouter } from "next/navigation"
import type { Album } from "@/types"
import { CoverImage } from "@/components/cover-image"
import { PlayIcon as PlayBold } from "@solar-icons/react/bold/play"

export function AlbumCard({ album }: { album: Album }) {
  const router = useRouter()

  return (
    <div className="hp-card" onClick={() => router.push(`/album/${album.id}`)}>
      <div className="hp-card-art">
        {album.cover_url ? (
          <CoverImage src={album.cover_url} alt={album.title} sizes="220px" />
        ) : (
          <div className="hp-card-art-placeholder">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 18V9l8-1.5v9" /><circle cx="7" cy="18" r="2" /><circle cx="15" cy="16.5" r="2" />
            </svg>
          </div>
        )}
        <button
          className="hp-play-overlay"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/album/${album.id}`)
          }}
          aria-label="Open album"
          type="button"
        >
          <span style={{ marginLeft: 2, display: "flex" }}>
            <PlayBold size={17} color="currentColor" />
          </span>
        </button>
      </div>
      <p
        className="hp-card-title hp-card-title-hoverable"
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/album/${album.id}`)
        }}
      >
        {album.title}
      </p>
      <p className="hp-card-meta">
        <span
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/artist/${album.artist_id}`)
          }}
          style={{ cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {album.artist_name}
        </span>
      </p>
    </div>
  )
}
