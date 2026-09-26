"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"

const FILTERS: Array<[string, string]> = [
  ["", "All"],
  ["draft", "Drafts"],
  ["review", "In review"],
  ["published", "Published"],
]

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--muted-foreground)",
  review: "#f59e0b",
  published: "#22c55e",
}

export default function AdminBlogPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", filter],
    queryFn: () => api.adminListPosts(100, 0, filter || undefined),
  })
  const posts: any[] = data?.posts ?? []
  const reviewCount = posts.filter((p) => p.status === "review").length

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      const fd = new FormData()
      fd.append("status", status)
      return api.adminUpdatePost(id, fd)
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] })
      toast(v.status === "published" ? "Published" : "Moved to " + v.status, "success")
    },
    onError: (e: any) => toast(e?.message || "Update failed", "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] })
      toast("Post deleted", "success")
    },
    onError: (e: any) => toast(e?.message || "Delete failed", "error"),
  })

  function confirmDelete(p: any) {
    if (window.confirm(`Delete "${p.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(p.id)
    }
  }

  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
          <span className="admin-eyebrow"><span className="admin-eyebrow-dot" aria-hidden />Editorial</span>
          <h1 className="admin-title">Blog</h1>
          <p className="admin-sub">
            Review queue{reviewCount > 0 ? ` — ${reviewCount} waiting` : ""} · only Published posts appear on the site
          </p>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => router.push("/admin/blog/new")} className="admin-btn-primary">
            + New post
          </button>
        </div>
      </header>

      <div className="admin-chip-row" role="tablist" aria-label="Filter posts">
        {FILTERS.map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={filter === v}
            aria-pressed={filter === v}
            onClick={() => setFilter(v)}
            className={`admin-chip${filter === v ? " admin-chip-active" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14 }} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: "var(--foreground)" }}>No posts here yet</p>
          <p style={{ fontSize: 13.5, margin: "0 0 16px" }}>Write the first story to kick off the blog.</p>
          <button onClick={() => router.push("/admin/blog/new")} className="admin-btn-primary">
            + New post
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((p) => (
            <article key={p.id} className="admin-card admin-list-row" style={{ padding: 12, alignItems: "center" }}>
              <div style={{ width: 76, height: 52, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }}>
                {p.cover_url && <img src={p.cover_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <Link href={`/admin/blog/${p.id}`} style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--foreground)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.title}
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, fontSize: 12, color: "var(--muted-foreground)", minWidth: 0 }}>
                  <span style={{ fontWeight: 800, color: STATUS_COLORS[p.status] ?? "var(--muted-foreground)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em", flexShrink: 0 }}>
                    {p.status}
                  </span>
                  <span aria-hidden>·</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.post_type} · /blog/{p.slug}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                {p.status !== "published" ? (
                  <button onClick={() => statusMutation.mutate({ id: p.id, status: "published" })} className="admin-btn-primary admin-btn-sm">
                    Publish
                  </button>
                ) : (
                  <button onClick={() => statusMutation.mutate({ id: p.id, status: "draft" })} className="admin-btn-secondary admin-btn-sm">
                    Unpublish
                  </button>
                )}
                <button onClick={() => router.push(`/admin/blog/${p.id}`)} className="admin-btn-secondary admin-btn-sm">
                  Edit
                </button>
                <button onClick={() => confirmDelete(p)} className="admin-btn-secondary admin-btn-sm" style={{ color: "#ef4444" }} aria-label={`Delete ${p.title}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
