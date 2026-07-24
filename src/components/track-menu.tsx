"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { useLikesStore } from "@/lib/likes-store"

interface Props {
  track: {
    id: string
    title: string
    artist_id: string
    artist_name?: string
    album_id?: string | null
    cover_url?: string | null
    duration_sec: number
    collaborators?: { artist_id: string; stage_name: string }[]
  }
  liked?: boolean
  onLikeToggle?: (liked: boolean) => void
}

function toTrackInfo(track: Props["track"]): import("@/lib/store").TrackInfo {
  return {
    id: track.id,
    artist_id: track.artist_id,
    title: track.title,
    artist_name: track.artist_name ?? "",
    cover_url: track.cover_url ?? null,
    duration_sec: track.duration_sec,
    collaborators: track.collaborators?.map((c) => ({
      artist_id: c.artist_id,
      stage_name: c.stage_name,
      role: "featured",
    })),
  }
}

export function PremiumTrackMenu({ track, liked, onLikeToggle }: Props) {
  const [open, setOpen] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [likeLoading, setLikeLoading] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const { playNext, addToQueue, currentTrack } = usePlayerStore()
  const { isLiked, toggleLike: likesStoreToggle } = useLikesStore()
  const effectiveLiked = liked !== undefined ? liked : isLiked(track.id)
  const isActiveTrack = currentTrack?.id === track.id

  const { data: playlistsData } = useQuery({
    queryKey: ["my-playlists"],
    queryFn: () => api.getMyPlaylists(),
    enabled: open && showPlaylists,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setShowPlaylists(false)
        setShowShare(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    } else {
      setMenuPos(null)
    }
  }, [open])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likeLoading) return
    setLikeLoading(true)
    try {
      const newState = await likesStoreToggle(track.id)
      onLikeToggle?.(newState)
    } catch { /* ignore */ }
    setLikeLoading(false)
  }, [likeLoading, track.id, onLikeToggle, likesStoreToggle])

  const handleAddToPlaylist = useCallback(async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAddingTo(playlistId)
    try {
      await api.addTrackToPlaylist(playlistId, track.id)
    } catch { /* ignore */ }
    setAddingTo(null)
    setOpen(false)
    setShowPlaylists(false)
  }, [track.id])

  const handleClickBtn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const menuHeight = 320
    if (spaceBelow < menuHeight) {
      setMenuPos({ bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right })
    } else {
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((prev) => {
      if (prev) { setShowPlaylists(false); setShowShare(false) }
      return !prev
    })
  }, [])

  const triggerAction = useCallback((fn: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      fn()
      setOpen(false)
      setShowPlaylists(false)
      setShowShare(false)
    }
  }, [])

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={handleClickBtn}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 30, borderRadius: 6,
          border: "none",
          background: "transparent",
          color: isActiveTrack ? "var(--brand)" : open ? "var(--foreground)" : "var(--muted-foreground)",
          cursor: "pointer", transition: "all 0.12s",
          opacity: 1,
        }}
        className="track-menu-btn"
        title="More"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && menuPos && (
        <div
          ref={menuRef}
          className="premium-menu"
          style={{
            position: "fixed",
            right: menuPos.right,
            top: menuPos.top,
            bottom: menuPos.bottom,
            marginTop: menuPos.top !== undefined ? 0 : undefined,
            minWidth: 220,
            background: "rgba(30,30,35,0.92)",
            backdropFilter: "blur(20px) saturate(1.6)",
            WebkitBackdropFilter: "blur(20px) saturate(1.6)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)",
            padding: "6px",
            zIndex: 999999,
            animation: "menuFadeIn 0.12s ease-out",
            transformOrigin: menuPos.top !== undefined ? "top right" : "bottom right",
          }}
        >
          {/* Play Next */}
          <MenuItem
            icon={<PlayNextIcon />}
            label="Play Next"
            onClick={triggerAction(() => playNext(toTrackInfo(track)))}
          />

          {/* Add to Queue */}
          <MenuItem
            icon={<QueueIcon />}
            label="Add to Queue"
            onClick={triggerAction(() => addToQueue(toTrackInfo(track)))}
          />

          {/* Divider */}
          <MenuDivider />

          {/* Add to Playlist */}
          <div>
            <MenuItem
              icon={<PlaylistIcon />}
              label="Add to Playlist"
              onClick={(e) => { e.stopPropagation(); setShowPlaylists((p) => !p) }}
              right={showPlaylists ? <ChevronUp /> : <ChevronDown />}
            />
            {showPlaylists && (
              <div style={{ padding: "2px 0 2px 8px" }}>
                {playlistsData?.playlists?.length ? (
                  playlistsData.playlists.map((p: any) => (
                    <MenuItem
                      key={p.id}
                      label={p.title}
                      onClick={(e) => handleAddToPlaylist(p.id, e)}
                      right={addingTo === p.id ? <Spinner /> : undefined}
                      compact
                    />
                  ))
                ) : (
                  <MenuItem label="No playlists" disabled compact />
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <MenuDivider />

          {/* Like / Unlike */}
          <MenuItem
            icon={effectiveLiked ? <HeartFilledIcon /> : <HeartIcon />}
            label={effectiveLiked ? "Remove from Likes" : "Add to Likes"}
            onClick={handleLike}
          />

          {/* Divider */}
          <MenuDivider />

          {/* Go to Artist */}
          <MenuItem
            icon={<ArtistIcon />}
            label="Go to Artist"
            onClick={triggerAction(() => router.push(`/artist/${track.artist_id}`))}
          />

          {/* Share */}
          <div>
            <MenuItem
              icon={<ShareIcon />}
              label="Share"
              onClick={(e) => { e.stopPropagation(); setShowShare((p) => !p) }}
              right={showShare ? <ChevronUp /> : <ChevronDown />}
            />
            {showShare && (
              <div style={{ padding: "2px 0 2px 8px" }}>
                <MenuItem
                  label="Copy Link"
                  onClick={triggerAction(() => {
                    navigator.clipboard.writeText(`${window.location.origin}/track/${track.id}`)
                  })}
                  compact
                  icon={<LinkIcon />}
                />
                <MenuItem
                  label="WhatsApp"
                  onClick={triggerAction(() => {
                    const text = encodeURIComponent(`Listen to "${track.title}" on ZedBeatz: ${window.location.origin}/track/${track.id}`)
                    window.open(`https://wa.me/?text=${text}`, "_blank")
                  })}
                  compact
                  icon={<WhatsAppIcon />}
                />
                {typeof navigator.share !== "undefined" && (
                  <MenuItem
                    label="More..."
                    onClick={triggerAction(() => {
                      navigator.share({ title: track.title, text: `Listen to "${track.title}" on ZedBeatz`, url: `${window.location.origin}/track/${track.id}` }).catch(() => {})
                    })}
                    compact
                    icon={<ShareIcon />}
                  />
                )}
              </div>
            )}
          </div>

          <style>{`
            @keyframes menuFadeIn {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}


    </div>
  )
}

function MenuItem({ icon, label, onClick, right, disabled, compact }: {
  icon?: React.ReactNode
  label: string
  onClick?: (e: React.MouseEvent) => void
  right?: React.ReactNode
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <div
      onClick={disabled || !onClick ? undefined : onClick}
      style={{
        display: "flex", alignItems: "center", gap: compact ? 8 : 10,
        padding: compact ? "6px 10px" : "9px 12px",
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.88)",
        fontSize: 13,
        fontWeight: 500,
        transition: "background 0.1s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.08)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {icon && <span style={{ display: "flex", flexShrink: 0, opacity: 0.75 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {right && <span style={{ display: "flex", flexShrink: 0, opacity: 0.5 }}>{right}</span>}
    </div>
  )
}

function MenuDivider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "3px 8px" }} />
}

/* ─── Icons ─── */

function PlayNextIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4v16l12-8z" /><rect x="17" y="4" width="2" height="16" rx="1" /></svg>
}
function QueueIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M5 18h8" /><path d="M5 6h14" /><path d="M20 13v6" /><path d="M17 16h6" /></svg>
}
function PlaylistIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v10" /><path d="M3 10h18" /><path d="M14 14l4 2-4 2" /></svg>
}
function HeartIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
}
function HeartFilledIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
}
function ArtistIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function ShareIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
}
function ChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
}
function ChevronUp() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
}
function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.6s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeDasharray="30 70" strokeLinecap="round" />
    </svg>
  )
}
function LinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
}
function WhatsAppIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
}
