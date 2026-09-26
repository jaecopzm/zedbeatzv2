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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>Blog</h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "2px 0 0" }}>
            Review queue{reviewCount > 0 ? ` — ${reviewCount} waiting for review` : ""} · only Published posts appear on the site
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/blog/new")}
          style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          + New post
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
              border: filter === v ? "none" : "1px solid var(--border)",
              background: filter === v ? "var(--foreground)" : "transparent",
              color: filter === v ? "var(--content-bg)" : "var(--foreground)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>Loading posts…</p>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>No posts here yet</p>
          <p style={{ fontSize: 14, margin: "0 0 16px" }}>Write the first story to kick off the blog.</p>
          <button onClick={() => router.push("/admin/blog/new")} style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + New post
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <div style={{ width: 72, height: 48, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }}>
                {p.cover_url && <img src={p.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/admin/blog/${p.id}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.title}
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12, color: "var(--muted-foreground)" }}>
                  <span style={{ fontWeight: 700, color: STATUS_COLORS[p.status] ?? "var(--muted-foreground)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>
                    {p.status}
                  </span>
                  <span>·</span>
                  <span>{p.post_type}</span>
                  <span>·</span>
                  <span>/blog/{p.slug}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {p.status !== "published" ? (
                  <button onClick={() => statusMutation.mutate({ id: p.id, status: "published" })} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Publish
                  </button>
                ) : (
                  <button onClick={() => statusMutation.mutate({ id: p.id, status: "draft" })} style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Unpublish
                  </button>
                )}
                <button onClick={() => router.push(`/admin/blog/${p.id}`)} style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => confirmDelete(p)} style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
