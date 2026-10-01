"use client"

import { TrackTable } from "@/components/track-table"

export function TrackList({ tracks, accentColor, showHeader = true, showRank = true, showAlbum = true }: { tracks: any[]; accentColor?: string; showHeader?: boolean; showRank?: boolean; showAlbum?: boolean }) {
  if (!tracks || tracks.length === 0) return null
  return <TrackTable tracks={tracks} accentColor={accentColor} showHeader={showHeader} showRank={showRank} showAlbum={showAlbum} />
}

export function PlayIconSolid({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="5,3 19,12 5,21" /></svg>
}
export function PauseIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="5" y="4" width="4" height="16" rx="1.5" /><rect x="15" y="4" width="4" height="16" rx="1.5" /></svg>
}
