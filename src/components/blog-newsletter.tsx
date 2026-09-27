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
      <h3>Subscribe to receive notifications of new posts</h3>
      {done ? (
        <p className="blog-news-done">You&apos;re on the list. Check your inbox. ✓</p>
      ) : (
        <form className="blog-news-form" onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
          />
          <button type="submit">Subscribe</button>
        </form>
      )}
      {error ? (
        <p className="blog-news-note" role="alert">{error}</p>
      ) : (
        !done && <p className="blog-news-note">We&apos;ll never share your email address.</p>
      )}
    </section>
  )
}
