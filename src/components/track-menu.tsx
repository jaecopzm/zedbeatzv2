"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { useLikesStore } from "@/lib/likes-store"
import { toast } from "@/lib/toast-store"
import { CoverImage } from "@/components/cover-image"

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
  const [view, setView] = useState<"main" | "playlists">("main")
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [likeLoading, setLikeLoading] = useState(false)
  const router = useRouter()
  const { playNext, addToQueue, currentTrack } = usePlayerStore()
  const { isLiked, toggleLike: likesStoreToggle } = useLikesStore()
  const effectiveLiked = liked !== undefined ? liked : isLiked(track.id)
  const isActiveTrack = currentTrack?.id === track.id

  const { data: playlistsData, isLoading: playlistsLoading } = useQuery({
    queryKey: ["my-playlists"],
    queryFn: () => api.getMyPlaylists(),
    enabled: open && view === "playlists",
  })

  /* lock body scroll + close on Escape while the sheet is open */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open ])

  const close = useCallback(() => setOpen(false), [])

  function openSheet(e: React.MouseEvent) {
    e.stopPropagation()
    setView("main")
    setOpen(true)
  }

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

  const handleAddToPlaylist = useCallback(async (playlistId: string, playlistTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (addingTo) return
    setAddingTo(playlistId)
    try {
      await api.addTrackToPlaylist(playlistId, track.id)
      toast(`Added to ${playlistTitle}`, "success")
      setOpen(false)
    } catch {
      toast("Couldn't add to playlist", "error")
    }
    setAddingTo(null)
  }, [addingTo, track.id])

  function copyLink(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/track/${track.id}`)
      .then(() => toast("Link copied", "success"))
      .catch(() => toast("Couldn't copy link", "error"))
    setOpen(false)
  }

  const trackUrl = typeof window !== "undefined" ? `${window.location.origin}/track/${track.id}` : ""

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={openSheet}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 30, borderRadius: 8,
          border: "none",
          background: "transparent",
          color: isActiveTrack ? "var(--brand)" : "var(--muted-foreground)",
          cursor: "pointer", transition: "background 0.12s, color 0.12s",
        }}
        className="track-menu-btn"
        title="More options"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && createPortal(
        <div
          onClick={(e) => { e.stopPropagation(); close() }}
          style={{
            position: "fixed", inset: 0, zIndex: 3000,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            animation: "sheetFadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Options for ${track.title}`}
            style={{
              width: "min(480px, 100%)",
              maxHeight: "85dvh",
              overflowY: "auto",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -12px 48px rgba(0,0,0,0.3)",
              padding: "8px 8px calc(20px + env(safe-area-inset-bottom, 0px))",
              animation: "sheetSlideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* grab handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 10px" }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--border)" }} />
            </div>

            {view === "main" ? (
              <>
                {/* track header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 12px 14px" }}>
                  <div style={{ position: "relative", width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--hover-bg)" }}>
                    {track.cover_url ? (
                      <CoverImage src={track.cover_url} alt="" sizes="120px" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MusicIcon />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {track.title}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {track.artist_name || "Unknown artist"}
                    </p>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Close"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      border: "none", background: "var(--hover-bg)", color: "var(--muted-foreground)",
                      cursor: "pointer",
                    }}
                  >
                    <XIcon />
                  </button>
                </div>

                {/* quick actions */}
                <div style={{ display: "flex", gap: 8, padding: "0 12px 8px" }}>
                  <QuickAction
                    icon={effectiveLiked ? <HeartFilledIcon /> : <HeartIcon />}
                    label={effectiveLiked ? "Liked" : "Like"}
                    active={effectiveLiked}
                    activeColor="var(--like)"
                    onClick={handleLike}
                    loading={likeLoading}
                  />
                  <QuickAction
                    icon={<PlayNextIcon />}
                    label="Play next"
                    onClick={(e) => { e.stopPropagation(); playNext(toTrackInfo(track)); close() }}
                  />
                  <QuickAction
                    icon={<QueueIcon />}
                    label="Queue"
                    onClick={(e) => { e.stopPropagation(); addToQueue(toTrackInfo(track)); toast("Added to queue", "success"); close() }}
                  />
                </div>

                {/* options */}
                <div style={{ padding: "4px 0" }}>
                  <SheetRow
                    icon={<PlaylistIcon />}
                    label="Add to playlist"
                    right={<ChevronRightIcon />}
                    onClick={() => setView("playlists")}
                  />
                  <SheetRow
                    icon={<ArtistIcon />}
                    label="Go to artist"
                    onClick={() => { close(); router.push(`/artist/${track.artist_id}`) }}
                  />
                  <SheetRow
                    icon={<LinkIcon />}
                    label="Copy link"
                    onClick={copyLink}
                  />
                  <SheetRow
                    icon={<WhatsAppIcon />}
                    label="Share on WhatsApp"
                    onClick={(e) => {
                      e.stopPropagation()
                      const text = encodeURIComponent(`Listen to "${track.title}" on ZedBeatz: ${trackUrl}`)
                      window.open(`https://wa.me/?text=${text}`, "_blank")
                      close()
                    }}
                  />
                  {typeof navigator.share !== "undefined" && (
                    <SheetRow
                      icon={<ShareIcon />}
                      label="More share options"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.share({ title: track.title, text: `Listen to "${track.title}" on ZedBeatz`, url: trackUrl }).catch(() => {})
                        close()
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                {/* playlist picker */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 12px 10px" }}>
                  <button
                    onClick={() => setView("main")}
                    aria-label="Back"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: "50%",
                      border: "none", background: "transparent", color: "var(--foreground)",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronLeftIcon />
                  </button>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    Add to playlist
                  </p>
                </div>
                <div style={{ padding: "0 0 4px" }}>
                  {playlistsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px" }}>
                        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
                        <div className="skeleton" style={{ width: "45%", height: 14 }} />
                      </div>
                    ))
                  ) : playlistsData?.playlists?.length ? (
                    playlistsData.playlists.map((p: any) => (
                      <SheetRow
                        key={p.id}
                        icon={<PlaylistIcon />}
                        label={p.title}
                        right={addingTo === p.id ? <Spinner /> : <PlusIcon />}
                        onClick={(e) => handleAddToPlaylist(p.id, p.title, e)}
                      />
                    ))
                  ) : (
                    <p style={{ margin: 0, padding: "16px 20px 20px", fontSize: 13, color: "var(--muted-foreground)", textAlign: "center" }}>
                      No playlists yet — create one from your Library.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <style>{`
            @keyframes sheetFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes sheetSlideUp {
              from { opacity: 0.5; transform: translateY(48px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ─── sheet primitives ─── */

function QuickAction({ icon, label, active, activeColor, onClick, loading }: {
  icon: React.ReactNode
  label: string
  active?: boolean
  activeColor?: string
  onClick: (e: React.MouseEvent) => void
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "12px 4px 10px",
        borderRadius: 12,
        border: "none",
        background: "var(--hover-bg)",
        color: active && activeColor ? activeColor : "var(--foreground)",
        cursor: "pointer",
        fontSize: 11, fontWeight: 600,
        fontFamily: "inherit",
      }}
    >
      <span style={{ display: "flex", opacity: loading ? 0.4 : 1 }}>
        {loading ? <Spinner /> : icon}
      </span>
      {label}
    </button>
  )
}

function SheetRow({ icon, label, right, onClick }: {
  icon: React.ReactNode
  label: string
  right?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "9px 20px",
        cursor: "pointer",
        borderRadius: 12,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: "var(--hover-bg)", color: "var(--foreground)",
      }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
        {label}
      </span>
      {right && (
        <span style={{ display: "flex", flexShrink: 0, color: "var(--muted-foreground)" }}>
          {right}
        </span>
      )}
    </div>
  )
}

/* ─── Icons ─── */

function PlayNextIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4v16l12-8z" /><rect x="17" y="4" width="2" height="16" rx="1" /></svg>
}
function QueueIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M5 18h8" /><path d="M5 6h14" /><path d="M20 13v6" /><path d="M17 16h6" /></svg>
}
function PlaylistIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v10" /><path d="M3 10h18" /><path d="M14 14l4 2-4 2" /></svg>
}
function HeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
}
function HeartFilledIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
}
function ArtistIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function ShareIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
}
function MusicIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
}
function ChevronRightIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
}
function ChevronLeftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
}
function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.6s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeDasharray="30 70" strokeLinecap="round" />
    </svg>
  )
}
function LinkIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
}
function WhatsAppIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
}
