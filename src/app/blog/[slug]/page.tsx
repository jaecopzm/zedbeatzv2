import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { BlogBody } from "@/components/blog-body"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CoverImage } from "@/components/cover-image"
import { TYPE_LABELS } from "../page"

export const revalidate = 300

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"

interface LinkedTrack {
  id: string
  title: string
  artist_name: string
  cover_url?: string | null
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
  tracks?: LinkedTrack[]
  artists?: LinkedArtist[]
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

async function getRelated(currentSlug: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts?limit=12`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.posts ?? []).filter((p: BlogPost) => p.slug !== currentSlug).slice(0, 3)
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

function formatDate(s?: string | null) {
  if (!s) return ""
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function readingTime(body: string): number {
  const text = (body ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const words = text ? text.split(" ").length : 0
  return Math.max(1, Math.round(words / 200))
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, related] = await Promise.all([getPost(slug), getRelated(slug)])
  if (!post) notFound()

  const tracks = post.tracks ?? []
  const artists = post.artists ?? []
  const tags = (post.keywords ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
  const minutes = readingTime(post.body)
  const pageUrl = `${SITE_URL}/blog/${slug}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(pageUrl)

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
      <style>{`
        .blog-article { max-width: 780px; margin: 0 auto; padding: 20px 32px 72px; }
        .blog-share-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 8px 16px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--foreground); font-size: 13px; font-weight: 700; text-decoration: none; transition: background 0.14s ease, transform 0.14s ease; }
        @media (hover: hover) { .blog-share-btn:hover { background: var(--hover-bg); } }
        .blog-share-btn:active { transform: scale(0.96); }
        .blog-related-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        @media (max-width: 680px) {
          .blog-article { padding: 16px 16px 56px; }
          .blog-related-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

      <article className="blog-article">
        {/* Header */}
        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: "var(--brand)", padding: "6px 14px", borderRadius: 999 }}>
          {TYPE_LABELS[post.post_type] ?? "News"}
        </span>
        <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(30px, 4.6vw, 44px)", fontWeight: 800, margin: "14px 0 12px", letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: "var(--muted-foreground)", margin: "0 0 22px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>
              {SITE_NAME.charAt(0)}
            </span>
            <strong style={{ color: "var(--foreground)", fontWeight: 700 }}>{SITE_NAME}</strong>
          </span>
          <span aria-hidden>·</span>
          <span>{formatDate(post.published_at)}</span>
          <span aria-hidden>·</span>
          <span>{minutes} min read</span>
        </div>

        {post.cover_url && (
          <figure style={{ margin: "0 0 26px" }}>
            <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)" }}>
              <CoverImage src={post.cover_url} alt={post.title} sizes="(max-width: 780px) 100vw, 780px" priority />
            </div>
          </figure>
        )}

        {post.excerpt && (
          <p style={{ fontSize: "clamp(17px, 2.2vw, 19px)", lineHeight: 1.65, fontWeight: 550, margin: "0 0 24px", color: "var(--foreground)", textWrap: "pretty" }}>
            {post.excerpt}
          </p>
        )}

        <BlogBody markdown={post.body} />

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 32 }}>
            {tags.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                style={{ fontSize: 12.5, fontWeight: 650, color: "var(--muted-foreground)", background: "var(--card-bg)", border: "1px solid var(--border)", padding: "7px 14px", borderRadius: 999, textDecoration: "none" }}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Share */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 28, padding: "18px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginRight: 4 }}>
            Share
          </span>
          <a className="blog-share-btn" href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a className="blog-share-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a className="blog-share-btn" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer">
            X
          </a>
        </div>

        {tracks.length > 0 && (
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", margin: "0 0 14px" }}>
              Songs in this story
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 10 }}>
              {tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/track/${t.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: 10,
                    background: "var(--card-bg)", border: "1px solid var(--border)",
                    borderRadius: 14, textDecoration: "none", color: "inherit",
                  }}
                >
                  <span style={{ position: "relative", width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, display: "block" }}>
                    {t.cover_url ? (
                      <CoverImage src={t.cover_url} alt={t.title} sizes="100px" />
                    ) : (
                      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }} />
                    )}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.artist_name} · Play →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {artists.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", margin: "0 0 14px" }}>
              Artists mentioned
            </h2>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {artists.map((a) => (
                <Link
                  key={a.id}
                  href={`/artist/${a.id}`}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", width: 84 }}
                >
                  <span style={{ position: "relative", width: 68, height: 68, borderRadius: "50%", overflow: "hidden", display: "block", border: "2px solid var(--border)" }}>
                    {a.photo_url ? (
                      <CoverImage src={a.photo_url} alt={a.stage_name} sizes="136px" />
                    ) : (
                      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>
                        {a.stage_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 650, textAlign: "center", lineHeight: 1.35 }}>
                    {a.stage_name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, margin: "0 0 14px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", margin: 0 }}>
                Keep reading
              </h2>
              <Link href="/blog" style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}>
                All stories →
              </Link>
            </div>
            <div className="blog-related-grid">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}>
                  <article style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", height: "100%" }}>
                    <div style={{ position: "relative", aspectRatio: "16/9" }}>
                      {p.cover_url ? (
                        <CoverImage src={p.cover_url} alt={p.title} sizes="(max-width: 680px) 100vw, 240px" />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }} />
                      )}
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)" }}>
                        {TYPE_LABELS[p.post_type] ?? "News"}
                      </span>
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: "6px 0 0", lineHeight: 1.4, letterSpacing: "-0.01em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
