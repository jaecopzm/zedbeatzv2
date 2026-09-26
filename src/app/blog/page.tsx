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

export const TYPE_LABELS: Record<string, string> = {
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
    <div style={{ minHeight: "100%", background: "var(--content-bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        .blog-hub { max-width: 1060px; margin: 0 auto; padding: 44px 32px 72px; }
        .blog-featured { display: grid; grid-template-columns: 1.15fr 1fr; }
        .blog-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        .blog-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, border-color 0.15s ease; }
        @media (hover: hover) {
          .blog-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(16,18,55,0.12); border-color: color-mix(in srgb, var(--brand) 30%, var(--border)); }
          .blog-card:hover .blog-card-img { transform: scale(1.04); }
        }
        .blog-card-img { transition: transform 0.55s cubic-bezier(0.22,1,0.36,1); }
        @media (max-width: 820px) { .blog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } }
        @media (max-width: 720px) {
          .blog-hub { padding: 28px 16px 56px; }
          .blog-featured { grid-template-columns: 1fr; }
          .blog-featured-media { aspect-ratio: 16/9; min-height: 0 !important; }
        }
        @media (max-width: 560px) { .blog-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="blog-hub">
        {/* Hero */}
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          <span aria-hidden style={{ width: 22, height: 22, borderRadius: 7, background: "var(--brand)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>Z</span>
          {SITE_NAME} Blog
        </p>
        <h1 style={{ fontFamily: "var(--font-display, Inter, sans-serif)", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, margin: "10px 0 8px", letterSpacing: "-0.03em", lineHeight: 1.04, textWrap: "balance" }}>
          Zambian music, told properly.
        </h1>
        <p style={{ margin: "0 0 30px", fontSize: 15, lineHeight: 1.6, color: "var(--muted-foreground)", maxWidth: "60ch" }}>
          New songs, artist stories, and charts — fresh every week.
        </p>

        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 24px", color: "var(--muted-foreground)", background: "var(--card-bg)", border: "1px dashed var(--border)", borderRadius: 20 }}>
            <p style={{ fontSize: 17, fontWeight: 750, margin: "0 0 8px", color: "var(--foreground)" }}>Stories coming soon</p>
            <p style={{ fontSize: 14, margin: 0 }}>Our first posts are in the works — check back shortly.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: 28 }}>
                <article className="blog-card blog-featured" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
                  <div className="blog-featured-media" style={{ position: "relative", minHeight: 300, overflow: "hidden" }}>
                    {featured.cover_url ? (
                      <CoverImage src={featured.cover_url} alt={featured.title} sizes="(max-width: 720px) 100vw, 600px" priority className="blog-card-img" />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 800, letterSpacing: "0.14em" }}>
                        {SITE_NAME.toUpperCase()}
                      </div>
                    )}
                    <span style={{ position: "absolute", top: 14, left: 14, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", background: "rgba(10,14,30,0.55)", backdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: 999 }}>
                      Featured
                    </span>
                  </div>
                  <div style={{ padding: "clamp(20px, 3.4vw, 34px)", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)" }}>
                      {TYPE_LABELS[featured.post_type] ?? "News"}
                    </span>
                    <h2 style={{ fontSize: "clamp(22px, 2.6vw, 29px)", fontWeight: 800, margin: "10px 0", letterSpacing: "-0.025em", lineHeight: 1.18, textWrap: "balance" }}>
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p style={{ fontSize: 14.5, color: "var(--muted-foreground)", lineHeight: 1.65, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {featured.excerpt}
                      </p>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--muted-foreground)" }}>
                      {formatDate(featured.published_at ?? featured.created_at)}
                      <span aria-hidden>·</span>
                      <span style={{ fontWeight: 700, color: "var(--brand)" }}>Read story →</span>
                    </span>
                  </div>
                </article>
              </Link>
            )}

            {rest.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, margin: "0 0 16px" }}>
                  <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                    Latest stories
                  </h2>
                  <span style={{ fontSize: 12.5, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                    {rest.length} more
                  </span>
                </div>
                <div className="blog-grid">
                  {rest.map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}>
                      <article className="blog-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
                        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", flexShrink: 0 }}>
                          {p.cover_url ? (
                            <CoverImage src={p.cover_url} alt={p.title} sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, 340px" className="blog-card-img" />
                          ) : (
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }} />
                          )}
                        </div>
                        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)" }}>
                            {TYPE_LABELS[p.post_type] ?? "News"}
                          </span>
                          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.35, letterSpacing: "-0.015em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.title}
                          </h3>
                          {p.excerpt && (
                            <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {p.excerpt}
                            </p>
                          )}
                          <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: "auto", paddingTop: 8 }}>
                            {formatDate(p.published_at ?? p.created_at)}
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
