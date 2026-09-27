"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { useLikesStore } from "@/lib/likes-store"
import { toast } from "@/lib/toast-store"
import { MenuDotsIcon } from "@solar-icons/react/linear/menu-dots"
import { SkipNextIcon } from "@solar-icons/react/linear/skip-next"
import { ListIcon } from "@solar-icons/react/linear/list"
import { PlaylistIcon } from "@solar-icons/react/linear/playlist"
import { HeartIcon as HeartLinear } from "@solar-icons/react/linear/heart"
import { HeartIcon as HeartBold } from "@solar-icons/react/bold/heart"
import { UserIcon } from "@solar-icons/react/linear/user"
import { AlbumIcon } from "@solar-icons/react/linear/album"
import { ShareIcon } from "@solar-icons/react/linear/share"
import { LinkIcon as LinkLinear } from "@solar-icons/react/linear/link"
import { AltArrowDownIcon as ChevronDownLinear } from "@solar-icons/react/linear/alt-arrow-down"
import { AltArrowUpIcon as ChevronUpLinear } from "@solar-icons/react/linear/alt-arrow-up"

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
  const [isMobile, setIsMobile] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
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
    const mq = window.matchMedia("(max-width: 640px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setShowPlaylists(false)
      setShowShare(false)
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  // Escape closes the sheet.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likeLoading) return
    setLikeLoading(true)
    try {
      const newState = await likesStoreToggle(track.id)
      onLikeToggle?.(newState)
    } catch { /* ignore */ }
    setLikeLoading(false)
    close()
  }, [likeLoading, track.id, onLikeToggle, likesStoreToggle, close])

  const handleAddToPlaylist = useCallback(async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAddingTo(playlistId)
    try {
      await api.addTrackToPlaylist(playlistId, track.id)
      toast("Added to playlist", "success")
    } catch { toast("Failed to add", "error") }
    setAddingTo(null)
    close()
  }, [track.id, close])

  const triggerAction = useCallback((fn: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      fn()
      close()
    }
  }, [close])

  const triggerActionWithToast = useCallback((fn: () => void, msg: string) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      fn()
      toast(msg, "success")
      close()
    }
  }, [close])

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, minWidth: 44, minHeight: 44, height: 30, borderRadius: 6,
          border: "none",
          background: "transparent",
          color: isActiveTrack ? "var(--brand)" : open ? "var(--foreground)" : "var(--muted-foreground)",
          cursor: "pointer", transition: "all 0.12s",
          opacity: 1,
        }}
        className="track-menu-btn"
        title="More"
        aria-label={`More options for ${track.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MenuDotsIcon size={18} color="currentColor" strokeWidth={2} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <div
            // Close on click (not pointerdown): closing on pointerdown unmounts
            // the shield before the tap's click dispatches, so the click lands
            // on whatever is underneath and activates it. Click-to-close keeps
            // the tap fully absorbed by the backdrop.
            onClick={(e) => { e.stopPropagation(); close() }}
            aria-hidden
            style={{
              position: "fixed", inset: 0, zIndex: 999998,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              animation: "sheetFadeIn 0.2s ease",
              touchAction: "none",
            }}
          />

          <div
            ref={sheetRef}
            className="bottom-sheet"
            role="menu"
            aria-label={`Options for ${track.title}`}
            style={{
              position: "fixed",
              left: isMobile ? 0 : 24,
              right: isMobile ? 0 : 24,
              bottom: isMobile ? 0 : 24,
              margin: isMobile ? 0 : "0 auto",
              maxWidth: isMobile ? "none" : 440,
              zIndex: 999999,
              maxHeight: isMobile ? "96vh" : "80vh",
              background: "rgba(20,20,25,0.98)",
              backdropFilter: "blur(24px) saturate(1.6)",
              WebkitBackdropFilter: "blur(24px) saturate(1.6)",
              borderRadius: isMobile ? "20px 20px 0 0" : 20,
              border: isMobile ? "none" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
              display: "flex", flexDirection: "column",
              animation: "sheetSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)",
              overflow: "hidden",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px", flexShrink: 0 }}>
              <div style={{ width: 40, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.2)" }} />
            </div>

            {/* Track header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 16px 10px", flexShrink: 0 }}>
              {track.cover_url ? (
                <img src={track.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist_name}</p>
              </div>
            </div>

            {/* Scrollable menu items */}
            <div style={{ overflowY: "auto", flex: 1, padding: "0 8px 12px", WebkitOverflowScrolling: "touch" }}>
              <SheetItem
                icon={<SkipNextIcon size={19} color="currentColor" strokeWidth={1.8} />}
                label="Play Next"
                onClick={triggerActionWithToast(() => playNext(toTrackInfo(track)), "Playing next")}
              />
              <SheetItem
                icon={<ListIcon size={19} color="currentColor" strokeWidth={1.8} />}
                label="Add to Queue"
                onClick={triggerActionWithToast(() => addToQueue(toTrackInfo(track)), "Added to queue")}
              />

              <SheetDivider />

              <SheetItem
                icon={<PlaylistIcon size={19} color="currentColor" strokeWidth={1.8} />}
                label="Add to Playlist"
                onClick={(e) => { e.stopPropagation(); setShowPlaylists((p) => !p) }}
                right={showPlaylists
                  ? <ChevronUpLinear size={14} color="currentColor" strokeWidth={2.2} />
                  : <ChevronDownLinear size={14} color="currentColor" strokeWidth={2.2} />}
              />
              {showPlaylists && (
                <div style={{ paddingLeft: 12 }}>
                  {playlistsData?.playlists?.length ? (
                    playlistsData.playlists.map((p: any) => (
                      <SheetItem
                        key={p.id}
                        label={p.title}
                        onClick={(e) => handleAddToPlaylist(p.id, e)}
                        right={addingTo === p.id ? <Spinner /> : undefined}
                        compact
                      />
                    ))
                  ) : (
                    <SheetItem label="No playlists" disabled compact />
                  )}
                </div>
              )}

              <SheetDivider />

              <SheetItem
                icon={effectiveLiked
                  ? <HeartBold size={19} color="var(--like)" />
                  : <HeartLinear size={19} color="currentColor" strokeWidth={1.8} />}
                label={effectiveLiked ? "Remove from Likes" : "Add to Likes"}
                onClick={handleLike}
              />

              <SheetDivider />

              <SheetItem
                icon={<UserIcon size={19} color="currentColor" strokeWidth={1.8} />}
                label="Go to Artist"
                onClick={triggerAction(() => router.push(`/artist/${track.artist_id}`))}
              />

              {track.album_id && (
                <SheetItem
                  icon={<AlbumIcon size={19} color="currentColor" strokeWidth={1.8} />}
                  label="Go to Album"
                  onClick={triggerAction(() => router.push(`/album/${track.album_id}`))}
                />
              )}

              <SheetItem
                icon={<ShareIcon size={19} color="currentColor" strokeWidth={1.8} />}
                label="Share"
                onClick={(e) => { e.stopPropagation(); setShowShare((p) => !p) }}
                right={showShare
                  ? <ChevronUpLinear size={14} color="currentColor" strokeWidth={2.2} />
                  : <ChevronDownLinear size={14} color="currentColor" strokeWidth={2.2} />}
              />
              {showShare && (
                <div style={{ paddingLeft: 12 }}>
                  <SheetItem
                    label="Copy Link"
                    onClick={triggerActionWithToast(() => {
                      navigator.clipboard.writeText(`${window.location.origin}/track/${track.id}`)
                    }, "Link copied")}
                    compact
                    icon={<LinkLinear size={16} color="currentColor" strokeWidth={1.8} />}
                  />
                  <SheetItem
                    label="WhatsApp"
                    onClick={triggerAction(() => {
                      const text = encodeURIComponent(`Listen to "${track.title}" on ZedBeatz: ${window.location.origin}/track/${track.id}`)
                      window.open(`https://wa.me/?text=${text}`, "_blank")
                    })}
                    compact
                    icon={<WhatsAppIcon />}
                  />
                  {typeof navigator.share !== "undefined" && (
                    <SheetItem
                      label="More..."
                      onClick={triggerAction(() => {
                        navigator.share({ title: track.title, text: `Listen to "${track.title}" on ZedBeatz`, url: `${window.location.origin}/track/${track.id}` }).catch(() => {})
                      })}
                      compact
                      icon={<ShareIcon size={16} color="currentColor" strokeWidth={1.8} />}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes sheetSlideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
            @keyframes sheetFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
        </>,
        document.body
      )}
    </div>
  )
}

function SheetItem({ icon, label, onClick, right, disabled, compact }: {
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
        display: "flex", alignItems: "center", gap: compact ? 10 : 12,
        padding: compact ? "8px 12px" : "10px 12px",
        borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.88)",
        fontSize: 14,
        fontWeight: 500,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {icon && (
        <span style={{ display: "flex", flexShrink: 0, color: "rgba(255,255,255,0.75)" }}>
          {icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {right && <span style={{ display: "flex", flexShrink: 0, opacity: 0.5 }}>{right}</span>}
    </div>
  )
}

function SheetDivider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "2px 12px" }} />
}

/* ─── Icons (Solar; WhatsApp brand glyph stays custom) ─── */

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.6s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeDasharray="30 70" strokeLinecap="round" />
    </svg>
  )
}
function WhatsAppIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
}
