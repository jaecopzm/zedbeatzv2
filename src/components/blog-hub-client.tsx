"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CoverImage } from "@/components/cover-image"
import { SITE_NAME } from "@/lib/seo"
import { formatBlogDateShort, readingTimeFromAny, typeLabel, keywordsToList } from "@/lib/blog"

export interface HubPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body?: string
  cover_url?: string | null
  post_type: string
  keywords?: string | string[] | null
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

function dateOf(p: HubPost): string {
  return formatBlogDateShort(p.published_at ?? p.created_at)
}

function Byline({ post }: { post: HubPost }) {
  return (
    <span className="blog-by">
      <span className="blog-by-avatar" aria-hidden>
        {SITE_NAME.charAt(0)}
      </span>
      <span className="blog-by-name">{SITE_NAME} Editorial</span>
      <span aria-hidden className="blog-by-sep">·</span>
      <span>{minutes(post)} min read</span>
    </span>
  )
}

export function BlogHubClient({ posts }: { posts: HubPost[] }) {
  const [tab, setTab] = useState("")
  const [q, setQ] = useState("")
  const [visible, setVisible] = useState(10)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return posts.filter((p) => {
      if (tab && p.post_type !== tab) return false
      if (!needle) return true
      return (
        p.title.toLowerCase().includes(needle) ||
        (p.excerpt ?? "").toLowerCase().includes(needle) ||
        keywordsToList(p.keywords).join(" ").toLowerCase().includes(needle)
      )
    })
  }, [posts, tab, q])

  const [featured, ...rest] = tab || q ? [] : filtered
  const grid = tab || q ? filtered : rest
  const shown = grid.slice(0, visible)

  return (
    <>
      {/* Filter bar — Cloudflare-style: plain text tabs + inline search */}
      <div className="blog-filterbar" role="search">
        <div className="blog-tabs" role="tablist" aria-label="Filter stories">
          {TABS.map((t) => (
            <button
              key={t.v}
              role="tab"
              aria-selected={tab === t.v}
              onClick={() => { setTab(t.v); setVisible(10) }}
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
            onChange={(e) => { setQ(e.target.value); setVisible(10) }}
            placeholder="Search stories…"
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
            <div className="blog-hero-text">
              <p className="blog-date">{dateOf(featured)}</p>
              <h2 className="blog-hero-title">{featured.title}</h2>
              {featured.excerpt && <p className="blog-hero-excerpt">{featured.excerpt}</p>}
              <Byline post={featured} />
            </div>
            {featured.cover_url && (
              <div className="blog-hero-thumb" aria-hidden>
                <CoverImage src={featured.cover_url} alt="" sizes="(max-width: 900px) 100vw, 420px" priority />
              </div>
            )}
          </article>
        </Link>
      )}

      {shown.length > 0 ? (
        <>
          <div className="blog-grid">
            {shown.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="blog-card-link" aria-label={p.title}>
                <article className="blog-card">
                  <p className="blog-date">{dateOf(p)}</p>
                  <h3 className="blog-card-title">{p.title}</h3>
                  {p.excerpt && <p className="blog-card-excerpt">{p.excerpt}</p>}
                  <Byline post={p} />
                </article>
              </Link>
            ))}
          </div>
          {grid.length > visible ? (
            <div className="blog-more">
              <button type="button" className="blog-more-btn" onClick={() => setVisible((v) => v + 10)}>
                Load more
              </button>
            </div>
          ) : (
            <div className="blog-more">
              <span className="blog-end">You&apos;ve reached the end</span>
            </div>
          )}
        </>
      ) : filtered.length === 0 ? (
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
      ) : (
        <div className="blog-more">
          <span className="blog-end">You&apos;ve reached the end</span>
        </div>
      )}
    </>
  )
}
