"use client"

import { usePathname } from "next/navigation"
import { LayoutShell } from "@/components/layout-shell"
import { Player } from "@/components/player"
import { PlaylistModal } from "@/components/playlist-modal"
import { NowPlayingScreen } from "@/components/now-playing-screen"
import { BlogNav } from "@/components/blog-nav"
import type { ReactNode } from "react"

// Pages that need a full-screen experience without sidebar/player
const fullscreenPaths = ["/artist/register", "/auth/login", "/login"]
const fullscreenPrefixes = ["/artist/dashboard", "/admin"]
// Blog is a distraction-free reading experience: no sidebar, no app player.
const blogPrefixes = ["/blog"]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isFullscreen = fullscreenPaths.includes(pathname) || fullscreenPrefixes.some((p) => pathname.startsWith(p))

  if (isFullscreen) {
    return <>{children}</>
  }

  if (blogPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return (
      <div className="blog-app">
        <BlogNav />
        <div className="blog-app-main">{children}</div>
      </div>
    )
  }

  return (
    <>
      <LayoutShell>
        {children}
      </LayoutShell>
      <Player />
      <PlaylistModal />
      <NowPlayingScreen />
    </>
  )
}
