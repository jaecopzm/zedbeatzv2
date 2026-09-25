"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUIStore } from "@/lib/ui-store"
import { useThemeStore } from "@/lib/theme-store"
import { Sidebar } from "@/components/sidebar"
import { MobileMenu } from "@/components/mobile-menu"
import { Footer } from "@/components/footer"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const theme = useThemeStore((s) => s.theme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname, setSidebarOpen])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = ""
      return
    }
    const mq = window.matchMedia("(max-width: 1023px)")
    if (mq.matches) document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-open" : ""}`}>
      <Sidebar />
      <MobileMenu />

      <button
        type="button"
        className="app-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div
        className="app-sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <div className="app-mobile-header">
        <img src={mounted ? (theme === "dark" ? "/logo-white.png" : "/logo-black.png") : "/logo-white.png"} alt="ZedBeatz" className="app-mobile-logo" width="120" height="28" suppressHydrationWarning onClick={() => router.push("/")} style={{ cursor: "pointer" }} />
        <button
          type="button"
          className="app-mobile-hamburger"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <main className="app-shell-main">
        {children}
        <Footer />
      </main>
    </div>
  )
}
