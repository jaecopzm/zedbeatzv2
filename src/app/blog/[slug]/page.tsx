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
  formatBlogDate,
  formatBlogDateShort,
  readingTimeFromAny,
  scoreRelated,
  extractToc,
  asString,
  asArray,
  keywordsToList,
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
  body: string | null
  cover_url?: string | null
  post_type: string
  keywords: string | string[] | null
  published_at?: string | null
  updated_at: string
  created_at?: string
  tracks?: LinkedTrack[] | null
  artists?: LinkedArtist[] | null
  linked_track_ids?: string[]
  linked_artist_ids?: string[]
}

interface Props {
  params: Promise<{ slug: string }>
}

async function fetchJSON<T>(url: string, ms = 10000): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ms)
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 300 } })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function getPost(slug: string): Promise<BlogPost | null> {
  return fetchJSON<BlogPost>(`${API_BASE}/posts/${slug}`)
}

async function getAll(): Promise<BlogPost[]> {
  const data = await fetchJSON<{ posts?: BlogPost[] }>(`${API_BASE}/posts?limit=50`)
  return data?.posts ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post not found" }

  const description = post.excerpt || `Read "${post.title}" on the ${SITE_NAME} Blog.`
  const tags = keywordsToList(post.keywords).slice(0, 8)
  return {
    title: post.title,
    description,
    keywords: tags.length ? tags : undefined,
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

  const body = asString(post.body)
  const tracks = asArray<LinkedTrack>(post.tracks)
  const artists = asArray<LinkedArtist>(post.artists)
  const tags = keywordsToList(post.keywords).slice(0, 8)
  const minutes = readingTimeFromAny(body)
  const pageUrl = `${SITE_URL}/blog/${slug}`
  const toc = extractToc(body)

  const related = scoreRelated(post, all as any, 3)

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
    <div style={{ minHeight: "100%", background: "var(--card-bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogProgress />
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: typeLabel(post.post_type) }, { label: post.title }]} />

      <div className="blog-article-shell">
        <div className="blog-layout">
          {/* Sticky share rail — desktop only */}
          <aside className="blog-rail" aria-label="Share">
            <BlogShare title={post.title} url={pageUrl} vertical />
          </aside>

          <article className="blog-main">
            <p className="blog-kicker">{typeLabel(post.post_type)}</p>
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
              </figure>
            )}

            {post.excerpt && <p className="blog-dek">{post.excerpt}</p>}

            <BlogBody markdown={body} />

            {tags.length > 0 && (
              <div className="blog-tags" aria-label="Tags">
                {tags.map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="blog-tag">
                    {t}
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
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section className="blog-related" aria-label="Keep reading">
                <h2 className="blog-subhead">Keep reading</h2>
                <div className="blog-related-grid">
                  {related.map((p: any) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="blog-card-link" aria-label={p.title}>
                      <article className="blog-card">
                        <p className="blog-date">{formatBlogDateShort(p.published_at ?? p.created_at)}</p>
                        <h3 className="blog-card-title">{p.title}</h3>
                        <span className="blog-card-meta">{readingTimeFromAny(p.body ?? p.excerpt ?? "")} min read</span>
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
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
