"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { usePlayerStore } from "@/lib/store"
import type { Track, Artist, Album, Genre } from "@/types"
import { PremiumTrackMenu } from "@/components/track-menu"
import { ArtistLinks } from "@/components/artist-links"

const GENRE_GRADIENTS: [string, string][] = [
  ["#FF6B6B", "#FF8E53"], ["#4E54C8", "#8F94FB"], ["#11998E", "#38EF7D"],
  ["#F953C6", "#B91D73"], ["#F7971E", "#FFD200"], ["#00B4DB", "#0083B0"],
  ["#DA22FF", "#9733EE"], ["#56AB2F", "#A8E063"], ["#F2994A", "#F2C94C"],
  ["#4FACFE", "#00F2FE"], ["#43E97B", "#38F9D7"], ["#FA709A", "#FEE140"],
  ["#30CFD0", "#330867"], ["#A18CD1", "#FBC2EB"], ["#FD746C", "#FF9068"],
  ["#764BA2", "#667EEA"],
]

type Tab = "all" | "songs" | "artists" | "albums"

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, "0")
  return `${m}:${s}`
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [hoveredAlbum, setHoveredAlbum] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)

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

  return (
    <div className="fade-in" style={{ padding: "32px 32px 40px", minHeight: "100%", background: "var(--content-bg)" }}>
      <style>{`
        .search-track-row:last-child { border-bottom: none; }
        .search-track-row:hover { background: var(--hover-bg) !important; }
        @media (max-width: 640px) { .genre-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      <h1 style={{ fontSize: "30px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 20px", letterSpacing: "-0.6px" }}>Search</h1>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <svg style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: query ? "var(--foreground)" : "var(--muted-foreground)", pointerEvents: "none", transition: "color 0.15s" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setTab("all") }} placeholder="Songs, artists, genres\u2026" style={{ width: "100%", height: "52px", padding: "0 44px 0 48px", fontSize: "16px", borderRadius: "26px", border: "2px solid transparent", background: "var(--card-bg)", color: "var(--foreground)", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", transition: "border-color 0.2s, box-shadow 0.2s" }} />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus() }} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "var(--muted-foreground)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, opacity: 0.7 }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7" }} aria-label="Clear search">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Browse state */}
      {!isSearching && (
        genresLoading ? <GenreSkeleton /> : genres.length > 0 ? <GenreBrowse genres={genres} router={router} /> : (
          <div style={{ textAlign: "center", paddingTop: "60px", color: "var(--muted-foreground)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.35, marginBottom: "16px" }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <p style={{ fontSize: "15px", margin: 0 }}>Start typing to search</p>
          </div>
        )
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
              {showArtists && artists.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Artists</h2>
                  <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
                    {artists.map((artist) => <ArtistCard key={artist.id} artist={artist} router={router} />)}
                  </div>
                </section>
              )}
              {showAlbums && albums.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 12px" }}>Albums</h2>
                  <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
                    {albums.map((album) => (
                      <button key={album.id} onClick={() => router.push(`/album/${album.id}`)}
                        style={{ flexShrink: 0, width: 180, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                      >
                        <div style={{ position: "relative", marginBottom: 10, borderRadius: 8, overflow: "hidden" }}>
                          <div style={{ width: 180, height: 180, borderRadius: 8, background: album.cover_url ? `url(${album.cover_url}) center/cover no-repeat` : "linear-gradient(135deg, #c8c8d4, #a0a0b0)", boxShadow: hoveredAlbum === album.id ? "0 8px 24px rgba(0,0,0,0.2)" : "0 4px 12px rgba(0,0,0,0.1)", transition: "box-shadow 0.18s ease, transform 0.18s ease", transform: hoveredAlbum === album.id ? "scale(1.03)" : "scale(1)" }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{album.title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                          <span onClick={(e) => { e.stopPropagation(); router.push(`/artist/${album.artist_id}`) }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
                            style={{ cursor: "pointer" }}
                          >{album.artist_name || "Unknown Artist"}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {showTracks && tracks.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.2px", margin: "0 0 4px" }}>Songs</h2>
                  <div>
                    {tracks.map((track) => <TrackRow key={track.id} track={track} onPlay={play} />)}
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

/* ─── Track row ─── */

function TrackRow({ track, onPlay }: { track: Track; onPlay: any }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="search-track-row track-row"
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "8px 12px", cursor: "pointer",
        borderBottom: "1px solid var(--border)", transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay({
        id: track.id, title: track.title, artist_name: track.artist_name ?? "",
        cover_url: track.cover_url, duration_sec: track.duration_sec,
        collaborators: track.collaborators,
      })}
    >
      {/* Cover */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {track.cover_url ? (
          <img src={track.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 6, background: "linear-gradient(135deg, #e8e8ec, #d0d0d8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </div>
        )}
        {hovered && (
          <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        )}
      </div>

       {/* Title + artist */}
       <div style={{ flex: 1, minWidth: 0 }}>
         <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
           onClick={(e) => { e.stopPropagation(); router.push(`/track/${track.id}`) }}
           onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
           onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
         >{track.title}</p>
         <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
           <ArtistLinks track={track} />
         </p>
       </div>

       {/* Album */}
       {track.album_name ? (
         <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
           <span onClick={(e) => { e.stopPropagation(); router.push(`/album/${track.album_id}`) }}
             onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
             onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
             style={{ fontSize: 13, color: "var(--muted-foreground)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
           >{track.album_name}</span>
         </div>
       ) : null}

      {/* Play count */}
      <span style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0, width: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
        {formatCount(track.play_count)}
      </span>

      {/* Duration */}
      <span style={{ fontSize: 12, color: "var(--muted-foreground)", flexShrink: 0, width: 40, textAlign: "right" }}>
        {formatDuration(track.duration_sec)}
      </span>

      {/* Menu */}
      <PremiumTrackMenu track={track} />
    </div>
  )
}

/* ─── Artist card ─── */

function ArtistCard({ artist, router }: { artist: Artist; router: any }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={() => router.push(`/artist/${artist.id}`)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ flexShrink: 0, width: 130, background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "4px 4px 8px", borderRadius: 12, transition: "transform 0.18s ease", transform: hovered ? "scale(1.03)" : "scale(1)" }}
    >
      <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", background: artist.photo_url ? `url(${artist.photo_url}) center/cover no-repeat` : "linear-gradient(135deg, #c8c8d4, #a0a0b0)", boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.2)" : "0 4px 12px rgba(0,0,0,0.1)", transition: "box-shadow 0.18s ease" }} />
        {artist.verified && (
          <div style={{ position: "absolute", bottom: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "#4FACFE", border: "2px solid var(--content-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{artist.stage_name}</p>
      <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>Artist</p>
    </button>
  )
}

/* ─── Genre browse ─── */

function GenreBrowse({ genres, router }: { genres: Genre[]; router: any }) {
  return (
    <section>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--section-header)", margin: "0 0 16px", letterSpacing: "-0.3px" }}>Browse by genre</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }} className="genre-grid">
        {genres.map((genre, idx) => {
          const [from, to] = GENRE_GRADIENTS[idx % GENRE_GRADIENTS.length]
          return (
            <button key={genre.id} onClick={() => router.push(`/genres/${genre.id}`)}
              style={{ background: `linear-gradient(135deg, ${from}, ${to})`, border: "none", borderRadius: 14, padding: 0, height: 100, cursor: "pointer", position: "relative", overflow: "hidden", transition: "transform 0.18s ease, box-shadow 0.18s ease", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", textAlign: "left" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.12)" }}
            >
              <div style={{ position: "absolute", right: -14, bottom: -14, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
              <span style={{ position: "absolute", bottom: 14, left: 14, fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", textShadow: "0 1px 3px rgba(0,0,0,0.25)", lineHeight: 1.25, maxWidth: "calc(100% - 28px)" }}>{genre.name}</span>
            </button>
          )
        })}
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
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
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
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    </section>
  )
}
