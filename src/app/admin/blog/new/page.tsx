"use client"

import Link from "next/link"
import { BlogEditForm } from "../edit-form"

export default function AdminBlogNewPage() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/blog" style={{ fontSize: 13, color: "var(--muted-foreground)", textDecoration: "none" }}>
          ← Back to blog
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "4px 0 0", letterSpacing: "-0.4px" }}>New post</h1>
      </div>
      <BlogEditForm initial={null} />
    </div>
  )
}
