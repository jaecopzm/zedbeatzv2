"use client"

import Link from "next/link"
import { BlogEditForm } from "../edit-form"

export default function AdminBlogNewPage() {
  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
          <Link href="/admin/blog" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)", textDecoration: "none" }}>
            ← Blog
          </Link>
          <h1 className="admin-title" style={{ marginTop: 4 }}>New post</h1>
        </div>
      </header>
      <BlogEditForm initial={null} />
    </div>
  )
}
