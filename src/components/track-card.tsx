"use client"

import type { Track, RecommendedTrack } from "@/types"
import { usePlayerStore } from "@/lib/store"

type TrackLike = Track | RecommendedTrack

interface TrackCardProps {
  track: TrackLike
  onLike?: () => void
  liked?: boolean
}

export function TrackCard({ track, onLike, liked }: TrackCardProps) {
  const play = usePlayerStore((s) => s.play)

  return (
    <div className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
      {track.cover_url && (
        <img
          src={track.cover_url}
          alt=""
          className="h-12 w-12 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {"artist_name" in track ? track.artist_name : ""}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {Math.floor(track.duration_sec / 60)}:
        {(track.duration_sec % 60).toString().padStart(2, "0")}
      </span>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() =>
            play({
              id: track.id,
              artist_id: "artist_id" in track ? track.artist_id : undefined,
              title: track.title,
              artist_name: "artist_name" in track ? track.artist_name : "",
              cover_url: track.cover_url,
              duration_sec: track.duration_sec,
              collaborators: "collaborators" in track ? track.collaborators : undefined,
            })
          }
          className="rounded p-1.5 hover:bg-muted"
          title="Play"
        >
          ▶
        </button>
        {onLike && (
          <button
            onClick={onLike}
            className="rounded p-1.5 hover:bg-muted"
            title={liked ? "Unlike" : "Like"}
          >
            {liked ? "❤️" : "🤍"}
          </button>
        )}
      </div>
    </div>
  )
}
