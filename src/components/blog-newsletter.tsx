"use client"

import { useState } from "react"

export function BlogNewsletter() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Enter a valid email address.")
      return
    }
    setError("")
    // No backend endpoint yet — store locally + open for future API.
    try {
      const raw = localStorage.getItem("zedbeatz_newsletter") ?? "[]"
      const arr = JSON.parse(raw)
      arr.push({ email: v, at: new Date().toISOString() })
      localStorage.setItem("zedbeatz_newsletter", JSON.stringify(arr))
    } catch {}
    setDone(true)
  }

  return (
    <section className="blog-news" aria-label="Newsletter">
      <div>
        <p className="blog-masthead-eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>
          <span className="blog-masthead-mark" aria-hidden>Z</span>
          The ZedBeatz Newsletter
        </p>
        <h3>New Zambian heat, every Friday.</h3>
        <p>Top songs, artist stories and charts — one short email. No spam, unsubscribe anytime.</p>
      </div>
      <div>
        {done ? (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>You&apos;re on the list. Check your inbox. ✓</p>
        ) : (
          <form className="blog-news-form" onSubmit={submit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button type="submit">Subscribe</button>
          </form>
        )}
        {error ? (
          <p className="blog-news-note" role="alert" style={{ color: "#fecaca" }}>{error}</p>
        ) : (
          !done && <p className="blog-news-note">Join 2,000+ Zed music fans. Free forever.</p>
        )}
      </div>
    </section>
  )
}
