"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CoverImage } from "@/components/cover-image"
import { SITE_NAME } from "@/lib/seo"
import { formatBlogDateShort, readingTimeFromAny, typeLabel, typeTint } from "@/lib/blog"

export interface HubPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body?: string
  cover_url?: string | null
  post_type: string
  keywords?: string
  published_at?: string | null
  created_at: string
}

const TABS: Array<{ v: string; l: string }> = [
  { v: "", l: "All" },
  { v: "article", l: "News" },
  { v: "spotlight", l: "New Releases" },
  { v: "profile", l: "Artist Stories" },
  { v: "chart", l: "Charts" },
  { v: "roundup", l: "Roundups" },
]

function minutes(p: HubPost): number {
  return readingTimeFromAny(p.body ?? p.excerpt ?? "")
}

export function BlogHubClient({ posts }: { posts: HubPost[] }) {
  const [tab, setTab] = useState("")
  const [q, setQ] = useState("")
  const [visible, setVisible] = useState(9)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return posts.filter((p) => {
      if (tab && p.post_type !== tab) return false
      if (!needle) return true
      return (
        p.title.toLowerCase().includes(needle) ||
        (p.excerpt ?? "").toLowerCase().includes(needle) ||
        (p.keywords ?? "").toLowerCase().includes(needle)
      )
    })
  }, [posts, tab, q])

  const [featured, ...rest] = tab || q ? [] : filtered
  const grid = tab || q ? filtered : rest
  const shown = grid.slice(0, visible)

  return (
    <>
      {/* Filter bar — sticky, glassy, like Spotify editorial */}
      <div className="blog-filterbar" role="search">
        <div className="blog-tabs" role="tablist" aria-label="Filter stories">
          {TABS.map((t) => (
            <button
              key={t.v}
              role="tab"
              aria-selected={tab === t.v}
              onClick={() => { setTab(t.v); setVisible(9) }}
              className={`blog-tab${tab === t.v ? " is-active" : ""}`}
            >
              {t.l}
            </button>
          ))}
        </div>
        <label className="blog-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setVisible(9) }}
            placeholder="Search stories, artists, songs…"
            aria-label="Search stories"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="blog-search-clear">×</button>
          )}
        </label>
      </div>

      {(tab || q) && (
        <p className="blog-resultline" role="status">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
          {tab ? ` in ${typeLabel(tab)}` : ""}
          {q ? ` for “${q.trim()}”` : ""}
        </p>
      )}

      {!tab && !q && featured && (
        <Link href={`/blog/${featured.slug}`} className="blog-hero-link" aria-label={featured.title}>
          <article className="blog-hero">
            <div className="blog-hero-media">
              {featured.cover_url ? (
                <CoverImage src={featured.cover_url} alt={featured.title} sizes="(max-width: 900px) 100vw, 1100px" priority className="blog-zoom" />
              ) : (
                <div className="blog-hero-fallback" aria-hidden>{SITE_NAME.toUpperCase()}</div>
              )}
              <div className="blog-hero-scrim" aria-hidden />
              <span className="blog-badge blog-badge-light">Featured</span>
              <div className="blog-hero-copy">
                <span className="blog-kicker" style={{ color: "#fff" }}>
                  <i className="blog-dot" style={{ background: typeTint(featured.post_type) }} />
                  {typeLabel(featured.post_type)}
                </span>
                <h2 className="blog-hero-title">{featured.title}</h2>
                {featured.excerpt && <p className="blog-hero-excerpt">{featured.excerpt}</p>}
                <span className="blog-hero-meta">
                  {formatBlogDateShort(featured.published_at ?? featured.created_at)}
                  <span aria-hidden> · </span>{minutes(featured)} min read
                  <span aria-hidden> · </span><span className="blog-read">Read story →</span>
                </span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {shown.length > 0 ? (
        <>
          {!tab && !q && (
            <div className="blog-sectionhead">
              <h2>Latest stories</h2>
              <span>{rest.length} more</span>
            </div>
          )}
          <div className="blog-grid">
            {shown.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="blog-card-link" aria-label={p.title}>
                <article className="blog-card">
                  <div className="blog-card-media">
                    {p.cover_url ? (
                      <CoverImage src={p.cover_url} alt={p.title} sizes="(max-width: 560px) 100vw, (max-width: 1024px) 50vw, 360px" className="blog-zoom" />
                    ) : (
                      <div className="blog-card-fallback" aria-hidden style={{ background: `linear-gradient(135deg, ${typeTint(p.post_type)}, var(--brand-light))` }} />
                    )}
                    <span className="blog-badge" style={{ background: typeTint(p.post_type) }}>{typeLabel(p.post_type)}</span>
                  </div>
                  <div className="blog-card-body">
                    <h3 className="blog-card-title">{p.title}</h3>
                    {p.excerpt && <p className="blog-card-excerpt">{p.excerpt}</p>}
                    <span className="blog-card-meta">
                      {formatBlogDateShort(p.published_at ?? p.created_at)}
                      <span aria-hidden> · </span>{minutes(p)} min read
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {grid.length > visible && (
            <div className="blog-more">
              <button type="button" className="blog-more-btn" onClick={() => setVisible((v) => v + 9)}>
                Load more stories ({grid.length - visible} left)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="blog-empty">
          <div className="blog-empty-icon" aria-hidden>✎</div>
          <p className="blog-empty-title">No stories found</p>
          <p className="blog-empty-sub">Try a different keyword or category.</p>
          {(tab || q) && (
            <button type="button" className="blog-more-btn" onClick={() => { setTab(""); setQ("") }}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  )
}
