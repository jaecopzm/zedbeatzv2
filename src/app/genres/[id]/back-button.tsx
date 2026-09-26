"use client"

import { useRouter } from "next/navigation"

export function GenreBackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="genre-back"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
