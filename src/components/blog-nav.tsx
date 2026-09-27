"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useThemeStore } from "@/lib/theme-store"

/** Minimal distraction-free top nav for the blog reading experience. */
export function BlogNav() {
  const pathname = usePathname()
  const router = useRouter()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const scroller = document.querySelector(".blog-app-main")
    const target = scroller ?? window
    const getY = () => (scroller ? (scroller as HTMLElement).scrollTop : window.scrollY)
    const onScroll = () => setScrolled(getY() > 8)
    onScroll()
    target.addEventListener("scroll", onScroll, { passive: true })
    return () => target.removeEventListener("scroll", onScroll)
  }, [])

  const link = (href: string, label: string) => {
    const active = href === "/blog" ? pathname === "/blog" || pathname.startsWith("/blog/") : pathname === href
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`blog-nav-link${active ? " is-active" : ""}`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className={`blog-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="blog-nav-inner">
        <button
          type="button"
          className="blog-nav-brand"
          onClick={() => router.push("/")}
          aria-label="Back to ZedBeatz app"
          title="Back to app"
        >
          <img
            src={mounted ? (theme === "dark" ? "/logo-white.png" : "/logo-black.png") : "/logo-white.png"}
            alt="ZedBeatz"
            width="110"
            height="26"
            suppressHydrationWarning
          />
          <span className="blog-nav-blog">Blog</span>
        </button>

        <nav className="blog-nav-links" aria-label="Blog sections">
          {link("/", "App")}
          {link("/blog", "Stories")}
          {link("/search", "Search")}
          {link("/radio", "Radio")}
        </nav>

        <div className="blog-nav-actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="blog-nav-iconbtn"
            aria-label={!mounted || theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={!mounted || theme === "dark" ? "Light mode" : "Dark mode"}
            suppressHydrationWarning
          >
            {!mounted || theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="4.9" y1="4.9" x2="6.3" y2="6.3" /><line x1="17.7" y1="17.7" x2="19.1" y2="19.1" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /><line x1="4.9" y1="19.1" x2="6.3" y2="17.7" /><line x1="17.7" y1="6.3" x2="19.1" y2="4.9" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
          <button type="button" className="blog-nav-cta" onClick={() => router.push("/")}>
            Listen in app
          </button>
        </div>
      </div>
    </header>
  )
}
