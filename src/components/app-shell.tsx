"use client"

import { usePathname } from "next/navigation"
import { LayoutShell } from "@/components/layout-shell"
import { Player } from "@/components/player"
import { PlaylistModal } from "@/components/playlist-modal"
import { NowPlayingScreen } from "@/components/now-playing-screen"
import type { ReactNode } from "react"

// Pages that need a full-screen experience without sidebar/player
const fullscreenPaths = ["/artist/register", "/auth/login", "/login"]
const fullscreenPrefixes = ["/artist/dashboard", "/admin"]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isFullscreen = fullscreenPaths.includes(pathname) || fullscreenPrefixes.some((p) => pathname.startsWith(p))

  if (isFullscreen) {
    return <>{children}</>
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
