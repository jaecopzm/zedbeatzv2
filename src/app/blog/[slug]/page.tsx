import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { BlogBody } from "@/components/blog-body"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CoverImage } from "@/components/cover-image"
import { BlogProgress } from "@/components/blog-progress"
import { BlogShare } from "@/components/blog-share"
import { BlogTrackList } from "@/components/blog-track-row"
import { BlogNewsletter } from "@/components/blog-newsletter"
import {
  typeLabel,
  typeTint,
  formatBlogDate,
  readingTimeFromAny,
  scoreRelated,
  extractToc,
} from "@/lib/blog"

export const revalidate = 300

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"

interface LinkedTrack {
  id: string
  title: string
  artist_name: string
  cover_url?: string | null
  duration_sec?: number | null
}

interface LinkedArtist {
  id: string
  stage_name: string
  photo_url?: string | null
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  cover_url?: string | null
  post_type: string
  keywords: string
  published_at?: string | null
  updated_at: string
  created_at?: string
  tracks?: LinkedTrack[]
  artists?: LinkedArtist[]
  linked_track_ids?: string[]
  linked_artist_ids?: string[]
}

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function getAll(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts?limit=50`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.posts ?? []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post not found" }

  const description = post.excerpt || `Read "${post.title}" on the ${SITE_NAME} Blog.`
  return {
    title: post.title,
    description,
    keywords: post.keywords || undefined,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `${SITE_URL}/blog/${slug}`,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      images: post.cover_url ? [{ url: post.cover_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_url ? [post.cover_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, all] = await Promise.all([getPost(slug), getAll()])
  if (!post) notFound()

  const tracks = post.tracks ?? []
  const artists = post.artists ?? []
  const tags = (post.keywords ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
  const minutes = readingTimeFromAny(post.body)
  const pageUrl = `${SITE_URL}/blog/${slug}`
  const toc = extractToc(post.body ?? "")

  const related = scoreRelated(post, all as any, 3)

  // Prev / next by recency (newest first)
  const sorted = [...all].sort((a, b) => {
    const ta = new Date(a.published_at ?? (a as any).created_at ?? 0).getTime() || 0
    const tb = new Date(b.published_at ?? (b as any).created_at ?? 0).getTime() || 0
    return tb - ta
  })
  const idx = sorted.findIndex((p) => p.slug === slug)
  const newer = idx > 0 ? sorted[idx - 1] : null
  const older = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null

  const tint = typeTint(post.post_type)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    url: pageUrl,
    ...(post.cover_url ? { image: post.cover_url } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogProgress />
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: typeLabel(post.post_type) }, { label: post.title }]} />

      <div className="blog-article-shell">
        <div className="blog-layout">
          {/* Sticky share rail — desktop only */}
          <aside className="blog-rail" aria-label="Share">
            <span className="blog-rail-label">Share</span>
            <BlogShare title={post.title} url={pageUrl} vertical />
          </aside>

          <article className="blog-main">
            <span className="blog-pill" style={{ background: tint }}>
              {typeLabel(post.post_type)}
            </span>
            <h1 className="blog-h1">{post.title}</h1>
            <div className="blog-byline">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="blog-avatar" aria-hidden>{SITE_NAME.charAt(0)}</span>
                <strong>{SITE_NAME} Editorial</strong>
              </span>
              <span aria-hidden>·</span>
              <span>{formatBlogDate(post.published_at)}</span>
              <span aria-hidden>·</span>
              <span>{minutes} min read</span>
            </div>

            {post.cover_url && (
              <figure className="blog-cover">
                <div className="blog-cover-media">
                  <CoverImage src={post.cover_url} alt={post.title} sizes="(max-width: 760px) 100vw, 760px" priority />
                </div>
                {post.excerpt && (
                  <figcaption className="blog-cover-cap">{post.title} — {SITE_NAME}</figcaption>
                )}
              </figure>
            )}

            {post.excerpt && <p className="blog-dek">{post.excerpt}</p>}

            <BlogBody markdown={post.body} dropCap />

            {tags.length > 0 && (
              <div className="blog-tags" aria-label="Tags">
                {tags.map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="blog-tag">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <BlogShare title={post.title} url={pageUrl} />

            {tracks.length > 0 && (
              <section className="blog-section" aria-label="Songs in this story">
                <h2 className="blog-subhead">Songs in this story — tap to play</h2>
                <BlogTrackList tracks={tracks} />
              </section>
            )}

            {artists.length > 0 && (
              <section className="blog-section" aria-label="Artists mentioned">
                <h2 className="blog-subhead">Artists mentioned</h2>
                <div className="blog-artists">
                  {artists.map((a) => (
                    <Link key={a.id} href={`/artist/${a.id}`} className="blog-artist">
                      <span className="blog-artist-face">
                        {a.photo_url ? (
                          <CoverImage src={a.photo_url} alt={a.stage_name} sizes="144px" />
                        ) : (
                          <span className="blog-artist-face-fallback" aria-hidden>
                            {a.stage_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="blog-artist-name">{a.stage_name}</span>
                      <span className="blog-artist-cta">View →</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Author box */}
            <aside className="blog-authorbox" aria-label="About the author">
              <span className="blog-authorbox-face" aria-hidden>{SITE_NAME.charAt(0)}</span>
              <div>
                <h3>{SITE_NAME} Editorial</h3>
                <p>
                  Covering Zambian music — new drops, artist stories and charts.
                  Our editors listen first, verify credits, and link every song so you can play it instantly.
                </p>
              </div>
            </aside>

            {/* Prev / Next */}
            {(newer || older) && (
              <nav className="blog-prevnext" aria-label="More stories">
                {older ? (
                  <Link href={`/blog/${older.slug}`} className="blog-pn">
                    <span>← Older story</span>
                    <strong>{older.title}</strong>
                  </Link>
                ) : <span />}
                {newer ? (
                  <Link href={`/blog/${newer.slug}`} className="blog-pn next">
                    <span>Newer story →</span>
                    <strong>{newer.title}</strong>
                  </Link>
                ) : <span />}
              </nav>
            )}

            {related.length > 0 && (
              <section className="blog-related" aria-label="Keep reading">
                <div className="blog-sectionhead">
                  <h2>Keep reading</h2>
                  <Link href="/blog" style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}>
                    All stories →
                  </Link>
                </div>
                <div className="blog-related-grid">
                  {related.map((p: any) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="blog-card-link" aria-label={p.title}>
                      <article className="blog-card">
                        <div className="blog-card-media">
                          {p.cover_url ? (
                            <CoverImage src={p.cover_url} alt={p.title} sizes="(max-width: 680px) 100vw, 240px" className="blog-zoom" />
                          ) : (
                            <div className="blog-card-fallback" style={{ background: `linear-gradient(135deg, ${typeTint(p.post_type)}, var(--brand-light))` }} />
                          )}
                          <span className="blog-badge" style={{ background: typeTint(p.post_type) }}>{typeLabel(p.post_type)}</span>
                        </div>
                        <div className="blog-card-body">
                          <h3 className="blog-card-title" style={{ fontSize: 14.5 }}>{p.title}</h3>
                          <span className="blog-card-meta">{formatBlogDate(p.published_at ?? p.created_at)} · {readingTimeFromAny(p.body ?? p.excerpt ?? "")} min</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div style={{ marginTop: 36 }}>
              <BlogNewsletter />
            </div>
          </article>

          {/* TOC rail */}
          <aside aria-label="On this page">
            {toc.length >= 2 ? (
              <div className="blog-toc-wrap">
                <nav className="blog-toc">
                  <h4>On this page</h4>
                  <ol>
                    {toc.map((h) => (
                      <li key={h.id}>
                        <a href={`#${h.id}`} className={h.level === 3 ? "lvl-3" : ""}>{h.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
                <div className="blog-toc">
                  <h4>Why ZedBeatz?</h4>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--muted-foreground)" }}>
                    Every story links the actual songs. Tap any track to play it instantly — no searching.
                  </p>
                </div>
              </div>
            ) : tracks.length > 0 ? (
              <div className="blog-toc-wrap">
                <div className="blog-toc">
                  <h4>Why ZedBeatz?</h4>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--muted-foreground)" }}>
                    Every story links the actual songs. Tap any track to play it instantly — no searching.
                  </p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
