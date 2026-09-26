"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { BlogEditForm, type BlogPostForm } from "../edit-form"

export default function AdminBlogEditPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => api.adminGetPost(id),
    enabled: !!id,
  })

  if (isLoading) return <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>Loading post…</p>
  if (isError || !data) {
    return (
      <div>
        <Link href="/admin/blog" style={{ fontSize: 13, color: "var(--muted-foreground)", textDecoration: "none" }}>
          ← Back to blog
        </Link>
        <p style={{ color: "#ef4444", fontSize: 14, marginTop: 12 }}>Post not found.</p>
      </div>
    )
  }

  const initial: BlogPostForm = {
    id: data.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    excerpt: data.excerpt ?? "",
    body: data.body ?? "",
    cover_url: data.cover_url ?? null,
    status: data.status ?? "draft",
    post_type: data.post_type ?? "article",
    keywords: data.keywords ?? "",
    linked_track_ids: data.linked_track_ids ?? [],
    linked_artist_ids: data.linked_artist_ids ?? [],
    tracks: data.tracks ?? [],
    artists: data.artists ?? [],
  }

  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
          <Link href="/admin/blog" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)", textDecoration: "none" }}>
            ← Blog
          </Link>
          <h1 className="admin-title" style={{ marginTop: 4 }}>Edit post</h1>
        </div>
        {data.status === "published" && (
          <div className="admin-header-actions">
            <Link href={`/blog/${data.slug}`} target="_blank" className="admin-btn-secondary admin-btn-sm" style={{ textDecoration: "none" }}>
              View live →
            </Link>
          </div>
        )}
      </header>
      <BlogEditForm key={data.id + (data.updated_at ?? "")} initial={initial} />
    </div>
  )
}
