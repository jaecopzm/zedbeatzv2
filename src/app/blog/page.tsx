import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { CoverImage } from "@/components/cover-image"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Blog — Zambian Music News, New Songs & Charts",
  description:
    "ZedBeatz Blog: the latest Zambian music news, new song releases, artist stories, and charts. Discover what's trending in Zed music.",
  openGraph: {
    title: "ZedBeatz Blog — Zambian Music News & Charts",
    description: "New Zambian songs, artist stories, and charts, updated weekly.",
    url: `${SITE_URL}/blog`,
  },
  alternates: { canonical: `${SITE_URL}/blog` },
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_url?: string | null
  post_type: string
  published_at?: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  roundup: "Weekly Roundup",
  spotlight: "New Release",
  chart: "Charts",
  profile: "Artist Story",
  article: "News",
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts?limit=30`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.posts ?? []
  } catch {
    return []
  }
}

function formatDate(s?: string | null) {
  if (!s) return ""
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export default async function BlogHub() {
  const posts = await getPosts()
  const [featured, ...rest] = posts

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} Blog`,
    url: `${SITE_URL}/blog`,
    description: "Zambian music news, new releases, artist stories, and charts.",
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      ...(p.published_at ? { datePublished: p.published_at } : {}),
    })),
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--content-bg)", padding: "40px 32px 64px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`@media (max-width: 640px) { .blog-hub { padding: 24px 16px 48px !important; } .blog-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div className="blog-hub" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          {SITE_NAME} Blog
        </span>
        <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700, margin: "6px 0 4px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          Zambian Music News & Charts
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--muted-foreground)" }}>
          New songs, artist stories, and charts — updated weekly.
        </p>

        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
            <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Stories coming soon</p>
            <p style={{ fontSize: 14, margin: 0 }}>Our first posts are in the works — check back shortly.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginBottom: 32, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ position: "relative", minHeight: 240 }}>
                    {featured.cover_url ? (
                      <CoverImage src={featured.cover_url} alt={featured.title} sizes="(max-width: 640px) 100vw, 600px" priority />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }} />
                    )}
                  </div>
                  <div style={{ padding: "28px 28px 28px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)" }}>
                      {TYPE_LABELS[featured.post_type] ?? "News"}
                    </span>
                    <h2 style={{ fontSize: 26, fontWeight: 700, margin: "8px 0", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {featured.title}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6, margin: "0 0 12px" }}>
                      {featured.excerpt}
                    </p>
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                      {formatDate(featured.published_at ?? featured.created_at)}
                    </span>
                  </div>
                </article>
              </Link>
            )}

            <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {rest.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <article style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", height: "100%" }}>
                    <div style={{ position: "relative", aspectRatio: "16/9" }}>
                      {p.cover_url ? (
                        <CoverImage src={p.cover_url} alt={p.title} sizes="(max-width: 640px) 100vw, 320px" />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }} />
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)" }}>
                        {TYPE_LABELS[p.post_type] ?? "News"}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "6px 0", lineHeight: 1.35 }}>
                        {p.title}
                      </h3>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        {formatDate(p.published_at ?? p.created_at)}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
