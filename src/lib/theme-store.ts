"use client"

import { useLayoutEffect } from "react"
import { create } from "zustand"

type Theme = "light" | "dark"

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function loadStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  // Read from the data-theme attribute set by the preInit script before React hydrates
  const fromDOM = document.documentElement.getAttribute("data-theme") as Theme | null
  if (fromDOM === "light" || fromDOM === "dark") return fromDOM
  const stored = localStorage.getItem("zedbeatz_theme") as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return getSystemTheme()
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.setAttribute("data-theme", t)
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: typeof window !== "undefined"
    ? (document.documentElement.getAttribute("data-theme") as Theme) || loadStoredTheme()
    : "dark",
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark"
    set({ theme: next })
    localStorage.setItem("zedbeatz_theme", next)
    applyTheme(next)
  },
  setTheme: (t) => {
    set({ theme: t })
    localStorage.setItem("zedbeatz_theme", t)
    applyTheme(t)
  },
}))

export function ThemeInit() {
  const setTheme = useThemeStore((s) => s.setTheme)

  useLayoutEffect(() => {
    const stored = loadStoredTheme()
    if (stored !== useThemeStore.getState().theme) {
      useThemeStore.getState().setTheme(stored)
    }
  }, [setTheme])

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("zedbeatz_theme")) {
        useThemeStore.getState().setTheme(e.matches ? "dark" : "light")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [setTheme])

  return null
}
