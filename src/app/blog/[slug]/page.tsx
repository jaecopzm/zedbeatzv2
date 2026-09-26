import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { BlogBody } from "@/components/blog-body"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CoverImage } from "@/components/cover-image"

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const tracks = post.tracks ?? []
  const artists = post.artists ?? []

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    url: `${SITE_URL}/blog/${slug}`,
    ...(post.cover_url ? { image: post.cover_url } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`@media (max-width: 640px) { .blog-article { padding: 24px 16px 48px !important; } .blog-related-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>

      <Breadcrumbs items={[{ label: "Blog", href: `${SITE_URL}/blog` }, { label: post.title }]} />

      <article className="blog-article" style={{ maxWidth: 760, margin: "0 auto", padding: "16px 32px 64px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)" }}>
          {post.post_type}
        </span>
        <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 700, margin: "8px 0 12px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {post.title}
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "0 0 24px" }}>
          {formatDate(post.published_at)} · {SITE_NAME}
        </p>

        {post.cover_url && (
          <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", marginBottom: 28 }}>
            <CoverImage src={post.cover_url} alt={post.title} sizes="(max-width: 760px) 100vw, 760px" priority />
          </div>
        )}

        {post.excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, fontWeight: 500, margin: "0 0 24px", color: "var(--foreground)" }}>
            {post.excerpt}
          </p>
        )}

        <BlogBody markdown={post.body} />

        {tracks.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
              Songs in this story
            </h2>
            <div className="blog-related-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/track/${t.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: 10,
                    background: "var(--card-bg)", border: "1px solid var(--border)",
                    borderRadius: 10, textDecoration: "none", color: "inherit",
                  }}
                >
                  <span style={{ position: "relative", width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0, display: "block" }}>
                    {t.cover_url ? (
                      <CoverImage src={t.cover_url} alt={t.title} sizes="96px" />
                    ) : (
                      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }} />
                    )}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)" }}>
                      {t.artist_name}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {artists.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
              Artists mentioned
            </h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {artists.map((a) => (
                <Link
                  key={a.id}
                  href={`/artist/${a.id}`}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", width: 88 }}
                >
                  <span style={{ position: "relative", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", display: "block" }}>
                    {a.photo_url ? (
                      <CoverImage src={a.photo_url} alt={a.stage_name} sizes="144px" />
                    ) : (
                      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff" }}>
                        {a.stage_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>
                    {a.stage_name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
