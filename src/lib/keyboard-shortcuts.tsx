"use client"

import { useEffect } from "react"
import { usePlayerStore } from "@/lib/store"

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      // Ignore when typing in inputs
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

      const store = usePlayerStore.getState()
      if (!store.currentTrack) return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          store.togglePlay()
          break
        case "ArrowLeft":
          e.preventDefault()
          store.seek(Math.max(0, store.progress - 5))
          break
        case "ArrowRight":
          e.preventDefault()
          store.seek(Math.min((store.currentTrack?.duration_sec || 0), store.progress + 5))
          break
        case "KeyM":
          e.preventDefault()
          store.setVolume(store.volume > 0.01 ? 0 : 0.7)
          break
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])
}

/** Mount this once, anywhere in the component tree. */
export function KeyboardShortcuts() {
  useKeyboardShortcuts()
  return null
}
