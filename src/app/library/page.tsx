"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import { HorizontalScroller } from "@/components/home/horizontal-scroller"
import type { Track, Album, Artist } from "@/types"
import "./library.css"

export default function LibraryPage() {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const playNext = usePlayerStore((s) => s.playNext)
  const [activeTab, setActiveTab] = useState<"playlists" | "albums" | "artists" | "tracks">("playlists")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "title" | "artist" | "plays">("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showHistory, setShowHistory] = useState(true)
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; items: { label: string; action: () => void }[]
  } | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    document.addEventListener("click", close)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", onKey) }
  }, [contextMenu])

  const showCtx = useCallback((e: React.MouseEvent, items: { label: string; action: () => void }[]) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, items })
  }, [])

  const { data: likes, isLoading: likesLoading } = useQuery({
    queryKey: ["my-likes"],
    queryFn: () => api.getMyLikes(),
  })

  const { data: playlistsData, isLoading: playlistsLoading } = useQuery({
    queryKey: ["my-playlists"],
    queryFn: () => api.getMyPlaylists(),
  })

  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["my-albums"],
    queryFn: () => api.getMyAlbums(),
  })

  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ["my-artists"],
    queryFn: () => api.getFollowedArtists(),
  })

  const { data: history } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getHistory(20),
  })

  const likedTracks: Track[] = likes?.liked_tracks ?? []
  const historyEntries: any[] = history?.history ?? history?.tracks ?? []
  const playlistItems = playlistsData?.playlists ?? []
  const albumItems: Album[] = albumsData?.albums ?? []
  const artistItems: Artist[] = artistsData?.artists ?? []

  const likedPlaylist = {
    id: "liked",
    title: "Liked Songs",
    description: "Songs you've liked",
    cover_url: likedTracks[0]?.cover_url ?? null,
    track_count: likedTracks.length,
    is_liked: true as const,
  }

  const filterItems = <T extends { title?: string; stage_name?: string; artist_name?: string }>(items: T[]) =>
    !search ? items : items.filter((item) => {
      const q = search.toLowerCase()
      const title = (item as any).title ?? (item as any).stage_name ?? ""
      const artist = (item as any).artist_name ?? ""
      return title.toLowerCase().includes(q) || artist.toLowerCase().includes(q)
    })

  const filteredPlaylists = (() => {
    const rest = filterItems(playlistItems)
    const q = search.toLowerCase()
    const showLiked = !search || likedPlaylist.title.toLowerCase().includes(q) || "liked".includes(q)
    return showLiked ? [likedPlaylist, ...rest] : rest
  })()
  const filteredAlbums = filterItems(albumItems)
  const filteredArtists = filterItems(artistItems)

  const filteredLikedTracks = !search ? likedTracks : likedTracks.filter((t) => {
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || (t.artist_name?.toLowerCase() ?? "").includes(q)
  })

  const sortedTracks = [...filteredLikedTracks].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title)
    if (sortBy === "artist") return (a.artist_name ?? "").localeCompare(b.artist_name ?? "")
    if (sortBy === "plays") return (b.play_count ?? 0) - (a.play_count ?? 0)
    return (b.like_count ?? 0) - (a.like_count ?? 0)
  })

  const isLoading = (activeTab === "playlists" && playlistsLoading) ||
    (activeTab === "albums" && albumsLoading) ||
    (activeTab === "artists" && artistsLoading) ||
    (activeTab === "tracks" && likesLoading)

  const currentItems = activeTab === "playlists" ? filteredPlaylists :
    activeTab === "albums" ? filteredAlbums :
    activeTab === "artists" ? filteredArtists : sortedTracks

  const tabs = [
    { id: "playlists" as const, label: "Playlists", count: filteredPlaylists.length, total: playlistItems.length + 1 },
    { id: "albums" as const, label: "Albums", count: filteredAlbums.length, total: albumItems.length },
    { id: "artists" as const, label: "Artists", count: filteredArtists.length, total: artistItems.length },
    { id: "tracks" as const, label: "Tracks", count: sortedTracks.length, total: likedTracks.length },
  ]

  return (
    <div className="fade-in lib-page">
      <header className="lib-header">
        <p className="lib-eyebrow">Library</p>
        <h1 className="lib-title">Your Library</h1>
        <div className="lib-search">
          <svg className="lib-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Find in Your Library"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lib-search-input"
          />
          {search && (
            <button type="button" className="lib-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
      </header>

      {historyEntries.length > 0 && showHistory && (
        <section className="lib-section">
          <div className="lib-section-head">
            <h2 className="lib-section-title">Recently Played</h2>
            <button type="button" className="lib-text-btn" onClick={() => setShowHistory(false)}>
              Hide
            </button>
          </div>
          <HorizontalScroller>
            {historyEntries.slice(0, 20).map((t: any, i: number) => (
              <button
                key={`${t.id}-${i}`}
                type="button"
                className="lib-recent-card"
                onClick={() => play({
                  id: t.id,
                  title: t.title,
                  artist_name: t.artist_name ?? "",
                  cover_url: t.cover_url,
                  duration_sec: t.duration_sec,
                })}
              >
                <div
                  className="lib-recent-art"
                  style={{
                    background: t.cover_url
                      ? `url(${t.cover_url}) center/cover`
                      : "linear-gradient(135deg, var(--brand), var(--brand-light))",
                  }}
                />
                <p className="lib-card-title">{t.title}</p>
                <p className="lib-card-meta">{t.artist_name}</p>
              </button>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {historyEntries.length > 0 && !showHistory && (
        <div className="lib-history-collapsed">
          <button type="button" className="lib-text-btn" onClick={() => setShowHistory(true)}>
            Show Recently Played
          </button>
        </div>
      )}

      <nav className="lib-tabs" aria-label="Library filters">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`lib-tab${activeTab === tab.id ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.total > 0 && (
              <span className="lib-tab-count">
                {search ? `${tab.count}/${tab.total}` : tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="lib-content">
        {isLoading ? (
          <LibSkeleton tab={activeTab} />
        ) : currentItems.length === 0 ? (
          <EmptyState
            tab={activeTab}
            search={search}
            onCreate={activeTab === "playlists" ? () => router.push("/create-playlist") : undefined}
          />
        ) : (
          <>
            <div className="lib-toolbar">
              <p className="lib-toolbar-count">
                {currentItems.length} {activeTab}
              </p>
              <div className="lib-toolbar-actions">
                {(activeTab === "playlists" || activeTab === "albums") && (
                  <div className="lib-view-toggle">
                    <button
                      type="button"
                      className={viewMode === "grid" ? "is-active" : ""}
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={viewMode === "list" ? "is-active" : ""}
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
                {activeTab === "tracks" && (
                  <select
                    className="lib-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="recent">Recently added</option>
                    <option value="title">Title</option>
                    <option value="artist">Artist</option>
                    <option value="plays">Most played</option>
                  </select>
                )}
              </div>
            </div>

            {activeTab === "playlists" && (
              viewMode === "grid"
                ? <PlaylistGrid items={filteredPlaylists} showCtx={showCtx} />
                : <PlaylistList items={filteredPlaylists} showCtx={showCtx} />
            )}
            {activeTab === "albums" && (
              viewMode === "grid"
                ? <AlbumGrid items={filteredAlbums} showCtx={showCtx} />
                : <AlbumList items={filteredAlbums} showCtx={showCtx} />
            )}
            {activeTab === "artists" && (
              <ArtistGrid items={filteredArtists} showCtx={showCtx} />
            )}
            {activeTab === "tracks" && (
              <TrackList items={sortedTracks} onPlay={play} showCtx={showCtx} addToQueue={addToQueue} playNext={playNext} />
            )}
          </>
        )}
      </div>

      {contextMenu && (
        <div
          className="lib-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.items.map((item, i) => (
            <button
              key={i}
              type="button"
              className="lib-menu-item"
              onClick={() => { item.action(); setContextMenu(null) }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LibSkeleton({ tab }: { tab: string }) {
  if (tab === "artists") {
    return (
      <div className="lib-grid lib-grid-artists">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lib-artist-card">
            <div className="skeleton lib-artist-avatar" />
            <div className="skeleton" style={{ width: "70%", height: 12, margin: "0 auto 4px" }} />
            <div className="skeleton" style={{ width: "40%", height: 10, margin: "0 auto" }} />
          </div>
        ))}
      </div>
    )
  }
  if (tab === "tracks") {
    return (
      <div className="lib-list">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lib-list-row">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ width: "55%", height: 12 }} />
              <div className="skeleton" style={{ width: "35%", height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="lib-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="lib-media-card">
          <div className="skeleton lib-media-art" />
          <div className="skeleton" style={{ width: "70%", height: 12, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: "45%", height: 10 }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ tab, search, onCreate }: { tab: string; search?: string; onCreate?: () => void }) {
  const configs: Record<string, { title: string; description: string; cta?: string }> = {
    playlists: {
      title: search ? "No matching playlists" : "No playlists yet",
      description: search ? "Try a different search term" : "Liked Songs is always here — create more playlists to organize your music",
      cta: search ? undefined : "Create Playlist",
    },
    albums: {
      title: search ? "No matching albums" : "No saved albums",
      description: search ? "Try a different search term" : "Save albums from artists you love to find them here",
    },
    artists: {
      title: search ? "No matching artists" : "No followed artists",
      description: search ? "Try a different search term" : "Follow artists to see their new releases and updates",
    },
    tracks: {
      title: search ? "No matching tracks" : "No liked tracks",
      description: search ? "Try a different search term" : "Tap the heart on any track to save it to your library",
    },
  }
  const config = configs[tab] ?? configs.playlists

  return (
    <div className="lib-empty">
      <h3>{config.title}</h3>
      <p>{config.description}</p>
      {config.cta && onCreate && (
        <button type="button" className="lib-empty-cta" onClick={onCreate}>
          {config.cta}
        </button>
      )}
    </div>
  )
}

function PlaylistCover({ playlist }: { playlist: any }) {
  if (playlist.is_liked) {
    return (
      <div className="lib-liked-art">
        {playlist.cover_url ? (
          <div className="lib-liked-art-bg" style={{ backgroundImage: `url(${playlist.cover_url})` }} />
        ) : null}
        <div className="lib-liked-art-scrim" />
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className="lib-media-art"
      style={{
        background: playlist.cover_url
          ? `url(${playlist.cover_url}) center/cover`
          : "linear-gradient(135deg, var(--brand), var(--brand-light))",
      }}
    />
  )
}

function playlistHref(playlist: any) {
  return playlist.is_liked ? "/liked" : `/playlist/${playlist.id}`
}

function PlaylistGrid({ items, showCtx }: { items: any[]; showCtx: (e: React.MouseEvent, items: { label: string; action: () => void }[]) => void }) {
  const router = useRouter()
  return (
    <div className="lib-grid">
      {items.map((p) => {
        const href = playlistHref(p)
        return (
          <button
            key={p.id}
            type="button"
            className="lib-media-card"
            onClick={() => router.push(href)}
            onContextMenu={(e) => showCtx(e, [
              { label: p.is_liked ? "Open Liked Songs" : "Go to Playlist", action: () => router.push(href) },
            ])}
          >
            <PlaylistCover playlist={p} />
            <p className="lib-card-title">{p.title}</p>
            <p className="lib-card-meta">{p.track_count ?? 0} songs</p>
          </button>
        )
      })}
    </div>
  )
}

function PlaylistList({ items, showCtx }: { items: any[]; showCtx: (e: React.MouseEvent, items: { label: string; action: () => void }[]) => void }) {
  const router = useRouter()
  return (
    <div className="lib-list">
      {items.map((p) => {
        const href = playlistHref(p)
        return (
          <button
            key={p.id}
            type="button"
            className="lib-list-row"
            onClick={() => router.push(href)}
            onContextMenu={(e) => showCtx(e, [
              { label: p.is_liked ? "Open Liked Songs" : "Go to Playlist", action: () => router.push(href) },
            ])}
          >
            {p.is_liked ? (
              <div className="lib-liked-art lib-liked-art-sm">
                {p.cover_url ? (
                  <div className="lib-liked-art-bg" style={{ backgroundImage: `url(${p.cover_url})` }} />
                ) : null}
                <div className="lib-liked-art-scrim" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            ) : (
              <div
                className="lib-list-thumb"
                style={{
                  background: p.cover_url
                    ? `url(${p.cover_url}) center/cover`
                    : "linear-gradient(135deg, var(--brand), var(--brand-light))",
                }}
              />
            )}
            <div className="lib-list-info">
              <p className="lib-card-title">{p.title}</p>
              <p className="lib-card-meta">{p.description ?? `${p.track_count ?? 0} songs`}</p>
            </div>
            <span className="lib-list-aside">{p.track_count ?? 0} songs</span>
          </button>
        )
      })}
    </div>
  )
}

function AlbumGrid({ items, showCtx }: { items: Album[]; showCtx: (e: React.MouseEvent, items: { label: string; action: () => void }[]) => void }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  return (
    <div className="lib-grid">
      {items.map((alb) => (
        <button
          key={alb.id}
          type="button"
          className="lib-media-card"
          onClick={() => router.push(`/album/${alb.id}`)}
          onContextMenu={(e) => showCtx(e, [
            {
              label: "Play",
              action: () => play({
                id: alb.tracks[0]?.id ?? alb.id,
                artist_id: alb.artist_id,
                title: alb.tracks[0]?.title ?? alb.title,
                artist_name: alb.artist_name ?? "",
                cover_url: alb.cover_url,
                duration_sec: alb.tracks[0]?.duration_sec ?? 0,
              }),
            },
            { label: "Go to Album", action: () => router.push(`/album/${alb.id}`) },
            { label: "Go to Artist", action: () => router.push(`/artist/${alb.artist_id}`) },
          ])}
        >
          <div
            className="lib-media-art"
            style={{
              background: alb.cover_url
                ? `url(${alb.cover_url}) center/cover`
                : "linear-gradient(135deg, var(--brand), var(--brand-light))",
            }}
          />
          <p className="lib-card-title">{alb.title}</p>
          <p className="lib-card-meta">{alb.artist_name}</p>
        </button>
      ))}
    </div>
  )
}

function AlbumList({ items, showCtx }: { items: Album[]; showCtx: (e: React.MouseEvent, items: { label: string; action: () => void }[]) => void }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  return (
    <div className="lib-list">
      {items.map((alb) => (
        <button
          key={alb.id}
          type="button"
          className="lib-list-row"
          onClick={() => router.push(`/album/${alb.id}`)}
          onContextMenu={(e) => showCtx(e, [
            {
              label: "Play",
              action: () => play({
                id: alb.tracks[0]?.id ?? alb.id,
                artist_id: alb.artist_id,
                title: alb.tracks[0]?.title ?? alb.title,
                artist_name: alb.artist_name ?? "",
                cover_url: alb.cover_url,
                duration_sec: alb.tracks[0]?.duration_sec ?? 0,
              }),
            },
            { label: "Go to Album", action: () => router.push(`/album/${alb.id}`) },
            { label: "Go to Artist", action: () => router.push(`/artist/${alb.artist_id}`) },
          ])}
        >
          <div
            className="lib-list-thumb"
            style={{
              background: alb.cover_url
                ? `url(${alb.cover_url}) center/cover`
                : "linear-gradient(135deg, var(--brand), var(--brand-light))",
            }}
          />
          <div className="lib-list-info">
            <p className="lib-card-title">{alb.title}</p>
            <p className="lib-card-meta">
              {alb.artist_name}
              {alb.released_at ? ` · ${new Date(alb.released_at).getFullYear()}` : ""}
            </p>
          </div>
          <span className="lib-list-aside">{alb.tracks?.length ?? 0} tracks</span>
        </button>
      ))}
    </div>
  )
}

function ArtistGrid({ items, showCtx }: { items: Artist[]; showCtx: (e: React.MouseEvent, items: { label: string; action: () => void }[]) => void }) {
  const router = useRouter()
  return (
    <div className="lib-grid lib-grid-artists">
      {items.map((a) => (
        <button
          key={a.id}
          type="button"
          className="lib-artist-card"
          onClick={() => router.push(`/artist/${a.id}`)}
          onContextMenu={(e) => showCtx(e, [
            { label: "Go to Artist", action: () => router.push(`/artist/${a.id}`) },
          ])}
        >
          <div className="lib-artist-avatar">
            {a.photo_url ? (
              <img src={a.photo_url} alt="" />
            ) : (
              <span>{a.stage_name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <p className="lib-card-title">{a.stage_name}</p>
          <p className="lib-card-meta">
            {a.follower_count
              ? a.follower_count >= 1000
                ? `${(a.follower_count / 1000).toFixed(1)}k followers`
                : `${a.follower_count} followers`
              : "Artist"}
          </p>
        </button>
      ))}
    </div>
  )
}

function TrackList({ items, onPlay, showCtx, addToQueue, playNext }: {
  items: Track[]
  onPlay: (t: any) => void
  showCtx: (e: React.MouseEvent, items: { label: string; action: () => void }[]) => void
  addToQueue: (t: any) => void
  playNext: (t: any) => void
}) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)

  const formatArtist = (t: Track) => {
    const name = t.artist_name
    const collabs = t.collaborators
    if (!collabs || collabs.length === 0) return name
    return name + ", " + collabs.map((c) => c.stage_name).join(", ")
  }

  const toTrackInfo = (t: Track) => ({
    id: t.id,
    artist_id: t.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url,
    duration_sec: t.duration_sec,
    collaborators: t.collaborators || [],
  })

  return (
    <div className="lib-tracks">
      <div className="lib-tracks-head">
        <span>#</span>
        <span>Title</span>
        <span className="lib-tracks-album">Album</span>
        <span className="lib-tracks-plays">Plays</span>
        <span className="lib-tracks-time">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
        </span>
      </div>
      {items.map((t, idx) => (
        <button
          key={t.id}
          type="button"
          className="lib-tracks-row"
          onClick={() => onPlay(toTrackInfo(t))}
          onContextMenu={(e) => showCtx(e, [
            { label: "Play", action: () => play(toTrackInfo(t)) },
            { label: "Play Next", action: () => playNext(toTrackInfo(t)) },
            { label: "Add to Queue", action: () => addToQueue(toTrackInfo(t)) },
            { label: "Go to Artist", action: () => router.push(`/artist/${t.artist_id}`) },
            ...(t.album_id ? [{ label: "Go to Album", action: () => router.push(`/album/${t.album_id}`) }] : []),
          ])}
        >
          <span className="lib-tracks-num">{idx + 1}</span>
          <div className="lib-tracks-title">
            {t.cover_url ? (
              <img src={t.cover_url} alt="" className="lib-list-thumb" />
            ) : (
              <div className="lib-list-thumb lib-list-thumb-ph" />
            )}
            <div className="lib-list-info">
              <p className="lib-card-title">{t.title}</p>
              <p className="lib-card-meta">{formatArtist(t)}</p>
            </div>
          </div>
          <span className="lib-tracks-album lib-card-meta">{t.album_name ?? "—"}</span>
          <span className="lib-tracks-plays lib-card-meta">{(t.play_count ?? 0).toLocaleString()}</span>
          <span className="lib-tracks-time lib-card-meta">
            {Math.floor(t.duration_sec / 60)}:{String(t.duration_sec % 60).padStart(2, "0")}
          </span>
        </button>
      ))}
    </div>
  )
}
