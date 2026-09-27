"use client"

import { useEffect, useState } from "react"

/** Slim top reading-progress bar for article pages. Tracks the blog
 *  scroll container (`.blog-app-main`), falling back to the document. */
export function BlogProgress() {
  const [p, setP] = useState(0)

  useEffect(() => {
    const scroller = document.querySelector(".blog-app-main")
    const target = scroller ?? document.documentElement
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const total = target.scrollHeight - target.clientHeight
        setP(total <= 0 ? 0 : Math.min(1, Math.max(0, target.scrollTop / total)))
      })
    }
    onScroll()
    target.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(raf)
      target.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div className="blog-progress" aria-hidden>
      <div className="blog-progress-fill" style={{ transform: `scaleX(${p})` }} />
    </div>
  )
}
