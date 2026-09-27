import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { CoverImage } from "@/components/cover-image"
import { BlogHubClient, type HubPost } from "@/components/blog-hub-client"
import { BlogNewsletter } from "@/components/blog-newsletter"
import { typeLabel } from "@/lib/blog"

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

async function getPosts(): Promise<HubPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts?limit=50`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.posts ?? []
  } catch {
    return []
  }
}

export default async function BlogHub() {
  const posts = await getPosts()
  const trending = posts.slice(0, 4)

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
      <div className="blog-shell">
        {/* Masthead — editorial, like Pitchfork / FADER */}
        <p className="blog-masthead-eyebrow">
          <span className="blog-masthead-mark" aria-hidden>Z</span>
          {SITE_NAME} Blog
        </p>
        <h1 className="blog-display">
          Zambian music, <em>told properly.</em>
        </h1>
        <p className="blog-lede">
          New songs, artist stories, and charts — fresh every week. Follow the sound from Lusaka to the Copperbelt and beyond.
        </p>

        {posts.length === 0 ? (
          <div className="blog-empty">
            <div className="blog-empty-icon" aria-hidden>✎</div>
            <p className="blog-empty-title">Stories coming soon</p>
            <p className="blog-empty-sub" style={{ margin: 0 }}>Our first posts are in the works — check back shortly.</p>
          </div>
        ) : (
          <>
            {/* Trending strip */}
            {trending.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <span className="blog-trend-label">Trending</span>
                <div className="blog-trending" aria-label="Trending stories">
                  {trending.map((p, i) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="blog-trend">
                      <span className="blog-trend-rank">{String(i + 1).padStart(2, "0")}</span>
                      {p.cover_url && (
                        <span className="blog-trend-thumb">
                          <CoverImage src={p.cover_url} alt="" sizes="68px" />
                        </span>
                      )}
                      <span className="blog-trend-title">{p.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <BlogHubClient posts={posts} />
            <BlogNewsletter />

            {/* Crawlable type index for SEO */}
            <nav className="seo-link-list" aria-hidden>
              {["article", "spotlight", "profile", "chart", "roundup"].map((t) => (
                <Link key={t} href={`/blog#${t}`}>{typeLabel(t)}</Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
