"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore, type TrackInfo } from "@/lib/store"
import type { Track, Artist, Album, Genre } from "@/types"
import { PremiumTrackMenu } from "@/components/track-menu"
import { ArtistLinks } from "@/components/artist-links"
import { CoverImage } from "@/components/cover-image"
import { EqBars } from "@/components/eq"
import { TrackRow as ChartRow } from "@/components/home/track-cards"
import { GenreCoverImg } from "@/components/genre-cover"
import { formatDuration } from "@/lib/utils"

function toTrackInfo(t: Track): TrackInfo {
  const a = t as any
  return {
    id: t.id,
    artist_id: a.artist_id,
    title: t.title,
    artist_name: t.artist_name ?? "",
    cover_url: t.cover_url ?? null,
    duration_sec: t.duration_sec,
    collaborators: (a.collaborators ?? []).map((c: any) => ({
      artist_id: c.artist_id,
      stage_name: c.stage_name,
      role: "featured",
    })),
  }
}

type Tab = "all" | "songs" | "artists" | "albums"

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  const isSearching = query.trim().length >= 2

  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ["search-tracks", query],
    queryFn: () => api.searchTracks(query),
    enabled: isSearching,
  })

  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ["search-artists", query],
    queryFn: () => api.searchArtists(query),
    enabled: isSearching,
  })

  const { data: genresData, isLoading: genresLoading } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.listGenres(),
    enabled: !isSearching,
    staleTime: 5 * 60 * 1000,
  })

  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["search-albums", query],
    queryFn: () => api.searchAlbums(query),
    enabled: isSearching,
  })

  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ["browse-top-charts"],
    queryFn: () => api.listTracks(5, 0, "best_new_songs"),
    enabled: !isSearching,
    staleTime: 5 * 60 * 1000,
  })

  const { data: freshData, isLoading: freshLoading } = useQuery({
    queryKey: ["browse-new-releases"],
    queryFn: () => api.listTracks(5, 0, undefined, "newest"),
    enabled: !isSearching,
    staleTime: 5 * 60 * 1000,
  })

  const tracks: Track[] = tracksData?.results ?? []
  const artists: Artist[] = artistsData?.results ?? []
  const albums: Album[] = albumsData?.results ?? []
  const genres: Genre[] = genresData?.genres ?? []

  const isLoading = isSearching && (tracksLoading || artistsLoading || albumsLoading)
  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0
  const noResults = isSearching && !isLoading && !hasResults

  const showTracks = tab === "all" || tab === "songs"
  const showArtists = tab === "all" || tab === "artists"
  const showAlbums = tab === "all" || tab === "albums"

  // Best match spotlight (All tab only): exact artist hit wins, then first
  // artist / track / album. Spotlighted item is excluded from its list below.
  const topPick: TopPick | null = (() => {
    if (tab !== "all" || !hasResults) return null
    const q = query.trim().toLowerCase()
    const exact = artists.find((a) => a.stage_name.toLowerCase() === q)
    if (exact) return { kind: "artist", artist: exact }
    if (artists.length > 0) return { kind: "artist", artist: artists[0] }
    if (tracks.length > 0) return { kind: "track", track: tracks[0] }
    if (albums.length > 0) return { kind: "album", album: albums[0] }
    return null
  })()

  const listArtists = topPick?.kind === "artist" ? artists.filter((a) => a.id !== topPick.artist.id) : artists
  const listTracks = topPick?.kind === "track" ? tracks.filter((t) => t.id !== topPick.track.id) : tracks
  const listAlbums = topPick?.kind === "album" ? albums.filter((a) => a.id !== topPick.album.id) : albums

  return (
    <div className="fade-in search-page" style={{ padding: "32px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        .search-track-row:last-child { border-bottom: none; }
        .search-track-row:hover { background: var(--hover-bg) !important; }
        .search-page { padding: 32px; }
        @media (max-width: 1024px) { .search-page { padding: 24px; } }
        @media (max-width: 640px) {
          .search-page { padding: 16px 12px 24px !important; }
          .search-page h1 { font-size: 22px !important; margin-bottom: 16px !important; }
          .search-page input { font-size: 15px !important; height: 46px !important; padding: 0 40px 0 44px !important; }
          .search-page .genre-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .search-scroller { gap: 8px !important; }
          .search-album-card { width: 140px !important; }
          .search-album-card .search-album-art { width: 132px !important; height: 132px !important; }
          .search-artist-card { width: 120px !important; }
          .search-artist-card .search-artist-avatar { width: 100px !important; height: 100px !important; }
          .search-track-row { gap: 10px !important; padding: 10px 8px !important; }
          .search-track-row .sr-thumb { width: 36px !important; height: 36px !important; }
          .search-track-row .sr-album,
          .search-track-row .sr-plays,
          .search-track-row .sr-duration { display: none !important; }
        }
        @media (max-width: 480px) {
          .search-page .genre-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .search-album-card { width: 130px !important; }
          .search-album-card .search-album-art { width: 122px !important; height: 122px !important; }
          .search-artist-card { width: 110px !important; }
          .search-artist-card .search-artist-avatar { width: 90px !important; height: 90px !important; }
        }
      `}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--foreground)", margin: "0 0 20px", letterSpacing: "-0.5px" }}>Search</h1>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <svg style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: query ? "var(--foreground)" : "var(--muted-foreground)", pointerEvents: "none", transition: "color 0.15s" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setTab("all") }} placeholder="Songs, artists, genres…" style={{ width: "100%", height: "52px", padding: "0 44px 0 48px", fontSize: "16px", borderRadius: "26px", border: "2px solid transparent", background: "var(--card-bg)", color: "var(--foreground)", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", transition: "border-color 0.2s, box-shadow 0.2s" }} />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus() }} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "var(--muted-foreground)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, opacity: 0.7 }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7" }} aria-label="Clear search">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Browse state */}
      {!isSearching && (
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {(freshLoading || (freshData?.tracks ?? []).length > 0) && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--section-header)", margin: "0 0 8px", letterSpacing: "-0.3px" }}>New Releases</h2>
              {freshLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
                  ))}
                </div>
              ) : (
                <div>
                  {(freshData?.tracks ?? []).map((t: any, i: number, arr: any[]) => (
                    <ChartRow key={t.id} track={t} index={i} isLast={i === arr.length - 1} />
                  ))}
                </div>
              )}
            </section>
          )}
          {(chartsLoading || (chartsData?.tracks ?? []).length > 0) && (
            <section>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 8px" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--section-header)", margin: 0, letterSpacing: "-0.3px" }}>Top Charts</h2>
                <button
                  type="button"
                  onClick={() => router.push("/section/best_new_songs")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--brand)", fontFamily: "inherit", padding: 0 }}
                >
                  View all
                </button>
              </div>
              {chartsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
                  ))}
                </div>
              ) : (
                <div>
                  {(chartsData?.tracks ?? []).map((t: any, i: number, arr: any[]) => (
                    <ChartRow key={t.id} track={t} index={i} isLast={i === arr.length - 1} />
                  ))}
                </div>
              )}
            </section>
          )}
          {genresLoading ? <GenreSkeleton /> : genres.length > 0 ? <GenreBrowse genres={genres} router={router} /> : (
            <div style={{ textAlign: "center", paddingTop: "60px", color: "var(--muted-foreground)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.35, marginBottom: "16px" }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <p style={{ fontSize: "15px", margin: 0 }}>Start typing to search</p>
            </div>
          )}
        </div>
      )}

      {/* Search results */}
      {isSearching && (
        <div>
          {/* Tabs + result count */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "songs", "artists", "albums"] as Tab[]).map((t) => {
                const count = t === "all" ? tracks.length + artists.length + albums.length : t === "songs" ? tracks.length : t === "artists" ? artists.length : albums.length
                return (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: "8px 16px", borderRadius: 20, border: "none",
                    background: tab === t ? "var(--brand)" : "var(--card-bg)",
                    color: tab === t ? "#fff" : "var(--muted-foreground)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.12s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {isSearching && !isLoading && count > 0 && (
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {isLoading && <SkeletonAll />}

          {!isLoading && noResults && <NoResults query={query} />}

          {!isLoading && hasResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {topPick && <TopResult pick={topPick} tracks={tracks} />}
              {showArtists && listArtists.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Artists</h2>
                  <div className="search-scroller" style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
                    {listArtists.map((artist) => <ArtistCard key={artist.id} artist={artist} router={router} />)}
                  </div>
                </section>
              )}
              {showAlbums && listAlbums.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Albums</h2>
                  <div className="search-scroller" style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
                    {listAlbums.map((album) => (
                      <AlbumCard key={album.id} album={album} router={router} />
                    ))}
                  </div>
                </section>
              )}
              {showTracks && listTracks.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 4px" }}>Songs</h2>
                  <div>
                    {listTracks.map((track) => <TrackRow key={track.id} track={track} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Album card ─── */

function AlbumCard({ album, router }: { album: Album; router: any }) {
  return (
    <button onClick={() => router.push(`/album/${album.id}`)}
      className="search-album-card"
      style={{ flexShrink: 0, width: 176, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
    >
      <div className="search-album-art" style={{ marginBottom: 10, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: 168, height: 168, borderRadius: 4, background: album.cover_url ? `url(${album.cover_url}) center/cover no-repeat` : "linear-gradient(135deg, #c8c8d4, #a0a0b0)", transition: "box-shadow 0.18s ease, transform 0.18s ease" }} />
      </div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.title}</p>
      <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <span onClick={(e) => { e.stopPropagation(); router.push(`/artist/${album.artist_id}`) }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
          style={{ cursor: "pointer" }}
        >{album.artist_name || "Unknown Artist"}</span>
      </p>
    </button>
  )
}

/* ─── Track row ─── */

function TrackRow({ track }: { track: Track }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const loading = usePlayerStore((s) => s._loading) === track.id
  const isCurrent = currentTrack?.id === track.id
  const active = isCurrent && (isPlaying || loading)

  const handlePlay = () => {
    if (isCurrent) togglePlay()
    else play(toTrackInfo(track))
  }

  return (
    <div
      className={`search-track-row track-row${isCurrent ? " is-current" : ""}`}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "8px 12px", cursor: "pointer",
        borderBottom: "1px solid var(--border)", transition: "background 0.12s",
        position: "relative",
      }}
      onClick={handlePlay}
    >
      {/* Cover */}
      <span className="sr-thumb-wrap">
        {track.cover_url ? (
          <CoverImage src={track.cover_url} alt={track.title} sizes="88px" />
        ) : (
          <span className="sr-thumb-fallback" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </span>
        )}
        <span className="sr-play" aria-hidden>
          {loading ? (
            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
          ) : active ? (
            <EqBars paused={!isPlaying} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </span>
      </span>

       {/* Title + artist */}
       <div style={{ flex: 1, minWidth: 0 }}>
         <p className="sr-title" style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
           onClick={(e) => { e.stopPropagation(); router.push(`/track/${track.id}`) }}
         >{track.title}</p>
         <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
           <ArtistLinks track={track} />
         </p>
       </div>

        {/* Album */}
        {track.album_name ? (
          <div className="sr-album" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
           <span onClick={(e) => { e.stopPropagation(); router.push(`/album/${track.album_id}`) }}
             onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
             onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
             style={{ fontSize: 13, color: "var(--muted-foreground)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
           >{track.album_name}</span>
         </div>
       ) : null}

      {/* Play count */}
      <span className="sr-plays" style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0, width: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
        {formatCount(track.play_count)}
      </span>

      {/* Duration */}
      <span className="sr-duration" style={{ fontSize: 12, color: "var(--muted-foreground)", flexShrink: 0, width: 40, textAlign: "right" }}>
        {formatDuration(track.duration_sec)}
      </span>

      {/* Menu */}
      <PremiumTrackMenu track={track} />
    </div>
  )
}

/* ─── Artist card ─── */

function ArtistCard({ artist, router }: { artist: Artist; router: any }) {
  return (
    <button onClick={() => router.push(`/artist/${artist.id}`)}
      className="search-artist-card"
      style={{ flexShrink: 0, width: 148, background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: 0, borderRadius: 12 }}
    >
      <div className="search-artist-avatar" style={{ width: 116, height: 116, borderRadius: "50%", margin: "0 auto 10px", background: artist.photo_url ? `url(${artist.photo_url}) center/cover no-repeat` : "linear-gradient(135deg, #c8c8d4, #a0a0b0)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", position: "relative" }}>
        {artist.verified && (
          <div style={{ position: "absolute", bottom: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "#4FACFE", border: "2px solid var(--content-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.stage_name}</p>
      <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>Artist</p>
    </button>
  )
}

/* ─── Genre browse ─── */

function GenreBrowse({ genres, router }: { genres: Genre[]; router: any }) {
  return (
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--section-header)", margin: "0 0 16px", letterSpacing: "-0.3px" }}>Browse by genre</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }} className="genre-grid">
        {genres.map((genre, idx) => (
          <button
            key={genre.id}
            onClick={() => router.push(`/genres/${genre.id}`)}
            className="search-genre-tile"
            aria-label={`Browse ${genre.name}`}
          >
            <GenreCoverImg genre={genre} index={idx} className="search-genre-img" />
            <span className="hp-genre-scrim" aria-hidden />
            <span className="search-genre-label">{genre.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ─── Top result spotlight ─── */

type TopPick =
  | { kind: "artist"; artist: Artist }
  | { kind: "track"; track: Track }
  | { kind: "album"; album: Album }

function TopResult({ pick, tracks }: { pick: TopPick; tracks: Track[] }) {
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)

  if (pick.kind === "artist") {
    const a = pick.artist as any
    const first = tracks.find((t) => (t as any).artist_id === a.id || t.artist_name === a.stage_name) ?? tracks[0]
    const isCurrent = !!first && currentTrack?.id === first.id
    const active = isCurrent && isPlaying
    return (
      <section aria-label="Top result">
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Top result</h2>
        <div className="search-top">
          <span className="search-top-art is-round">
            {a.photo_url ? (
              <CoverImage src={a.photo_url} alt={a.stage_name} sizes="224px" />
            ) : (
              <span className="search-top-fallback" aria-hidden>{(a.stage_name ?? "?").charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="search-top-meta">
            <span className="search-top-eyebrow">Artist</span>
            <p className="search-top-title">{a.stage_name}</p>
            <p className="search-top-sub">
              {typeof a.follower_count === "number" && a.follower_count > 0
                ? `${formatCount(a.follower_count)} followers`
                : "Artist on ZedBeatz"}
            </p>
            <div className="search-top-actions">
              {first && (
                <button
                  type="button"
                  className="search-top-play"
                  aria-label={active ? "Pause" : `Play ${first.title}`}
                  onClick={() => (isCurrent ? togglePlay() : play(toTrackInfo(first)))}
                >
                  {active ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ marginLeft: 2 }}><polygon points="6,4 20,12 6,20" /></svg>
                  )}
                </button>
              )}
              <button type="button" className="search-top-view" onClick={() => router.push(`/artist/${a.id}`)}>
                View profile
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (pick.kind === "track") {
    const t = pick.track
    const isCurrent = currentTrack?.id === t.id
    const active = !!isCurrent && isPlaying
    return (
      <section aria-label="Top result">
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Top result</h2>
        <div className="search-top">
          <span className="search-top-art">
            {t.cover_url ? (
              <CoverImage src={t.cover_url} alt={t.title} sizes="224px" />
            ) : (
              <span className="search-top-fallback" aria-hidden>{(t.title ?? "?").charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="search-top-meta">
            <span className="search-top-eyebrow">Song</span>
            <p className="search-top-title">{t.title}</p>
            <p className="search-top-sub">{t.artist_name ?? "Unknown Artist"}{t.album_name ? ` · ${t.album_name}` : ""}</p>
            <div className="search-top-actions">
              <button
                type="button"
                className="search-top-play"
                aria-label={active ? "Pause" : `Play ${t.title}`}
                onClick={() => (isCurrent ? togglePlay() : play(toTrackInfo(t)))}
              >
                {active ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ marginLeft: 2 }}><polygon points="6,4 20,12 6,20" /></svg>
                )}
              </button>
              <button type="button" className="search-top-view" onClick={() => router.push(`/track/${t.id}`)}>
                Open track
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const al = pick.album as any
  return (
    <section aria-label="Top result">
      <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Top result</h2>
      <div className="search-top">
        <span className="search-top-art">
          {al.cover_url ? (
            <CoverImage src={al.cover_url} alt={al.title} sizes="224px" />
          ) : (
            <span className="search-top-fallback" aria-hidden>{(al.title ?? "?").charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="search-top-meta">
          <span className="search-top-eyebrow">{al.type === "single" ? "Single" : al.type === "ep" ? "EP" : "Album"}</span>
          <p className="search-top-title">{al.title}</p>
          <p className="search-top-sub">{al.artist_name ?? "Unknown Artist"}</p>
          <div className="search-top-actions">
            <button type="button" className="search-top-view search-top-view-primary" onClick={() => router.push(`/album/${al.id}`)}>
              Open {al.type === "single" ? "single" : al.type === "ep" ? "EP" : "album"}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Loading / empty states ─── */

function SkeletonAll() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 120, textAlign: "center" }}>
              <div className="skeleton" style={{ width: 120, height: 120, borderRadius: "50%", margin: "0 auto 10px" }} />
              <div className="skeleton" style={{ width: "80%", height: 12, margin: "0 auto 5px" }} />
              <div className="skeleton" style={{ width: "40%", height: 10, margin: "0 auto" }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="skeleton" style={{ width: 100, height: 16, marginBottom: 8 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ width: `${45 + (i % 4) * 10}%`, height: 13 }} />
              <div className="skeleton" style={{ width: `${25 + (i % 3) * 8}%`, height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "80px", paddingBottom: "40px", gap: 16, color: "var(--muted-foreground)", textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M8 11h6M11 8v6" /></svg>
      </div>
      <div>
        <p style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 600, color: "var(--foreground)" }}>No results found</p>
        <p style={{ margin: 0, fontSize: "14px" }}>No songs or artists matched &ldquo;{query}&rdquo;</p>
      </div>
    </div>
  )
}

function GenreSkeleton() {
  return (
    <section>
      <div className="skeleton" style={{ width: 160, height: 22, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }} className="genre-grid">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 8 }} />)}
      </div>
    </section>
  )
}
