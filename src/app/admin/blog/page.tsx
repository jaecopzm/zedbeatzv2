"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { typeLabel } from "@/lib/blog"

const FILTERS: Array<[string, string]> = [
  ["", "All"],
  ["draft", "Drafts"],
  ["review", "In review"],
  ["published", "Published"],
]

const STATUS_BG: Record<string, string> = {
  draft: "var(--hover-bg)",
  review: "#fef3c7",
  published: "#dcfce7",
}
const STATUS_FG: Record<string, string> = {
  draft: "var(--muted-foreground)",
  review: "#b45309",
  published: "#15803d",
}

export default function AdminBlogPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState("")
  const [q, setQ] = useState("")
  const [pendingDelete, setPendingDelete] = useState<any | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", filter],
    queryFn: () => api.adminListPosts(100, 0, filter || undefined),
  })
  const all: any[] = data?.posts ?? []
  const posts = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter((p) =>
      (p.title ?? "").toLowerCase().includes(needle) ||
      (p.slug ?? "").toLowerCase().includes(needle)
    )
  }, [all, q])
  const reviewCount = all.filter((p) => p.status === "review").length

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      const fd = new FormData()
      fd.append("status", status)
      return api.adminUpdatePost(id, fd)
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] })
      toast(v.status === "published" ? "Published — live on /blog" : "Moved to " + v.status, "success")
    },
    onError: (e: any) => toast(e?.message || "Update failed", "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] })
      setPendingDelete(null)
      toast("Post deleted", "success")
    },
    onError: (e: any) => toast(e?.message || "Delete failed", "error"),
  })

  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
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

      <div className="admin-toolbar" style={{ marginBottom: 12 }}>
        <div className="admin-chip-row" role="tablist" aria-label="Filter posts" style={{ flex: "1 1 auto" }}>
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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or slug…"
          aria-label="Search posts"
          className="admin-input admin-search"
          style={{ maxWidth: 240 }}
        />
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
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: "var(--foreground)" }}>
            {q ? "No matches" : "No posts here yet"}
          </p>
          <p style={{ fontSize: 13.5, margin: "0 0 16px" }}>
            {q ? "Try a different search." : "Write the first story to kick off the blog."}
          </p>
          {!q && (
            <button onClick={() => router.push("/admin/blog/new")} className="admin-btn-primary">
              + New post
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((p) => (
            <article key={p.id} className="admin-card admin-list-row" style={{ padding: 12, alignItems: "center" }}>
              <div style={{ width: 76, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--hover-bg)" }}>
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--muted-foreground)" }}>
                    {typeLabel(p.post_type).charAt(0)}
                  </div>
                )}
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <Link href={`/admin/blog/${p.id}`} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--foreground)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.title}
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5, fontSize: 12, color: "var(--muted-foreground)", minWidth: 0, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: STATUS_FG[p.status] ?? "var(--muted-foreground)", background: STATUS_BG[p.status] ?? "var(--hover-bg)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 999, flexShrink: 0 }}>
                    {p.status}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeLabel(p.post_type)} · /blog/{p.slug}</span>
                  {p.status === "published" && (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", fontWeight: 650, textDecoration: "none", flexShrink: 0 }}>
                      View ↗
                    </a>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                {p.status !== "published" ? (
                  <button onClick={() => statusMutation.mutate({ id: p.id, status: "published" })} className="admin-btn-primary admin-btn-sm" disabled={statusMutation.isPending}>
                    Publish
                  </button>
                ) : (
                  <button onClick={() => statusMutation.mutate({ id: p.id, status: "draft" })} className="admin-btn-secondary admin-btn-sm" disabled={statusMutation.isPending}>
                    Unpublish
                  </button>
                )}
                <button onClick={() => router.push(`/admin/blog/${p.id}`)} className="admin-btn-secondary admin-btn-sm">
                  Edit
                </button>
                <button onClick={() => setPendingDelete(p)} className="admin-btn-secondary admin-btn-sm" style={{ color: "#ef4444" }} aria-label={`Delete ${p.title}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        message="This removes the post permanently. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
