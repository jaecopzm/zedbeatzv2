"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Artist } from "@/types"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

export function ArtistCard({ artist }: { artist: Artist }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [followed, setFollowed] = useState(artist.is_followed ?? false)

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      router.push("/login")
      return
    }
    try {
      if (followed) {
        await api.unfollowArtist(artist.id)
        setFollowed(false)
      } else {
        await api.followArtist(artist.id)
        setFollowed(true)
      }
    } catch {}
  }

  return (
    <div className="hp-artist-card">
      <Link href={`/artist/${artist.id}`} style={{ textDecoration: "none" }}>
        <div className="hp-artist-avatar-wrap">
          {artist.photo_url ? (
            <img src={artist.photo_url} alt={artist.stage_name} loading="lazy" />
          ) : (
            <div className="hp-artist-placeholder">
              {artist.stage_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>
      <Link href={`/artist/${artist.id}`} style={{ textDecoration: "none" }}>
        <p className="hp-artist-name">{artist.stage_name}</p>
      </Link>
      <p className="hp-artist-meta">
        {artist.follower_count ?? 0} {artist.follower_count === 1 ? "follower" : "followers"}
      </p>
      {user && (
        <button
          onClick={handleFollow}
          style={{
            marginTop: 6,
            padding: "4px 14px",
            borderRadius: 999,
            border: followed ? "1px solid var(--border)" : "none",
            background: followed ? "transparent" : "var(--brand)",
            color: followed ? "var(--foreground)" : "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (followed) {
              e.currentTarget.textContent = "Unfollow"
              e.currentTarget.style.borderColor = "var(--like)"
              e.currentTarget.style.color = "var(--like)"
            }
          }}
          onMouseLeave={(e) => {
            if (followed) {
              e.currentTarget.textContent = "Following"
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.color = "var(--foreground)"
            }
          }}
          type="button"
        >
          {followed ? "Following" : "Follow"}
        </button>
      )}
    </div>
  )
}
