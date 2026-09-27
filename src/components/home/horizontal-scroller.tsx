"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

type ScrollApi = {
  canLeft: boolean
  canRight: boolean
  scrollByDir: (dir: 1 | -1) => void
  setScroller: (el: HTMLDivElement | null) => void
}

const ScrollCtx = createContext<ScrollApi | null>(null)

export function ScrollRegion({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = scrollerRef.current
    if (!el) {
      setCanLeft(false)
      setCanRight(false)
      return
    }
    const left = el.scrollLeft
    const maxScroll = el.scrollWidth - el.clientWidth
    const overflow = maxScroll > 8
    setCanLeft(overflow && left > 4)
    setCanRight(overflow && left < maxScroll - 4)
  }, [])

  const setScroller = useCallback((el: HTMLDivElement | null) => {
    scrollerRef.current = el
    // measure after paint
    requestAnimationFrame(update)
  }, [update])

  const scrollByDir = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    // Apple-like: scroll by roughly one “page” of visible cards
    const amount = Math.min(el.clientWidth * 0.9, 720)
    el.scrollBy({ left: amount * dir, behavior: "smooth" })
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [update, children])

  const api = useMemo(
    () => ({ canLeft, canRight, scrollByDir, setScroller }),
    [canLeft, canRight, scrollByDir, setScroller],
  )

  return (
    <ScrollCtx.Provider value={api}>
      <div className="hp-scroll-region">{children}</div>
    </ScrollCtx.Provider>
  )
}

function useScrollApi() {
  return useContext(ScrollCtx)
}

/** Apple Music–style circular chevrons for the section header */
export function ScrollChevrons() {
  const api = useScrollApi()
  if (!api) return null
  const { canLeft, canRight, scrollByDir } = api
  const show = canLeft || canRight
  if (!show) return null

  return (
    <div className="hp-scroll-chevrons" role="group" aria-label="Scroll section">
      <button
        type="button"
        className="hp-chevron-btn"
        onClick={() => scrollByDir(-1)}
        disabled={!canLeft}
        aria-label="Scroll left"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <span className="hp-chevron-divider" aria-hidden />
      <button
        type="button"
        className="hp-chevron-btn"
        onClick={() => scrollByDir(1)}
        disabled={!canRight}
        aria-label="Scroll right"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}

export function HorizontalScroller({ children }: { children: ReactNode }) {
  const api = useScrollApi()
  const localRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const updateLocal = useCallback(() => {
    const el = localRef.current
    if (!el) return
    const left = el.scrollLeft
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanLeft(left > 4)
    setCanRight(left < maxScroll - 4)
  }, [])

  useEffect(() => {
    const el = localRef.current
    if (!el) return
    if (api) {
      api.setScroller(el)
    }
    updateLocal()
    el.addEventListener("scroll", updateLocal, { passive: true })
    const ro = new ResizeObserver(() => {
      updateLocal()
      api?.setScroller(el)
    })
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateLocal)
      ro.disconnect()
      if (api) api.setScroller(null)
    }
  }, [api, updateLocal, children])

  const scrollBy = (dir: 1 | -1) => {
    if (api) {
      api.scrollByDir(dir)
      return
    }
    const el = localRef.current
    if (!el) return
    const amount = Math.min(el.clientWidth * 0.9, 720)
    el.scrollBy({ left: amount * dir, behavior: "smooth" })
  }

  const left = api?.canLeft ?? canLeft
  const right = api?.canRight ?? canRight
  // Overlay arrows only when NOT inside a ScrollRegion (fallback)
  const showOverlay = !api

  const className = [
    "hp-scroller",
    left ? "can-scroll-left" : "",
    right ? "can-scroll-right" : "",
  ].filter(Boolean).join(" ")

  return (
    <div className={className}>
      {showOverlay && (
        <button
          className={`hp-scroll-btn hp-scroll-left ${left ? "can-scroll" : ""}`}
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}
      <div className="hp-scroller-inner" ref={localRef}>
        {children}
      </div>
      {showOverlay && (
        <button
          className={`hp-scroll-btn hp-scroll-right ${right ? "can-scroll" : ""}`}
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
      <div className="hp-scroller-fade-left" />
      <div className="hp-scroller-fade-right" />
    </div>
  )
}
