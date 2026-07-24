"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect, type ReactNode } from "react"
import { startTokenRefresh } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { useLikesStore } from "@/lib/likes-store"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  )

  useEffect(() => {
    return startTokenRefresh()
  }, [])

  // Sync liked tracks when auth state changes
  const user = useAuthStore((s) => s.user)
  useEffect(() => {
    if (user && !useLikesStore.getState().loaded) {
      useLikesStore.getState().sync()
    }
    if (!user) {
      useLikesStore.getState().sync() // clear on logout
    }
  }, [user])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
