"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Processing...")
  const setToken = useAuthStore((s) => s.setToken)

  useEffect(() => {
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (accessToken && refreshToken) {
      localStorage.setItem("access_token", accessToken)
      localStorage.setItem("refresh_token", refreshToken)
      setToken(accessToken)
      setStatus("Signed in! Redirecting...")
      const target = sessionStorage.getItem("post_login_redirect") || "/"
      sessionStorage.removeItem("post_login_redirect")
      setTimeout(() => router.push(target), 500)
    } else {
      setStatus("Authentication failed. Please try again.")
    }
  }, [searchParams, router, setToken])

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, color: "var(--muted-foreground)" }}>
      {status === "Signed in! Redirecting..." ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" style={{ animation: "spin 0.6s linear infinite" }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="30 70" strokeLinecap="round" />
        </svg>
      ) : null}
      <p>{status}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted-foreground)" }}><p>Loading...</p></div>}>
      <CallbackContent />
    </Suspense>
  )
}
