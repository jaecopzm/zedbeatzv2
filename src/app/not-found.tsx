"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "80vh", gap: 16, background: "var(--background)", color: "var(--foreground)",
      padding: "40px", textAlign: "center",
    }}>
      <p style={{ fontSize: 72, fontWeight: 900, color: "var(--brand)", margin: 0, lineHeight: 1 }}>404</p>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Page not found</h1>
      <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0, maxWidth: 360 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" style={{ padding: "10px 28px", borderRadius: 20, border: "none", background: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: 8 }}>
        Back to home
      </Link>
    </div>
  )
}
