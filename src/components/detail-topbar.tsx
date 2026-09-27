"use client"

import { useRouter } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"

export interface DetailCrumb {
  label: string
  href?: string
}

/**
 * Shared detail-page top bar: back chevron + breadcrumbs in one flex row,
 * centered by construction. `tone` matches the surface it floats over
 * (`light` = white on dark heroes, `dark` = default on light pages).
 * `overlay` floats over a hero; `false` renders in-flow for plain pages.
 */
export function DetailTopbar({
  items,
  tone = "light",
  overlay = true,
}: {
  items: DetailCrumb[]
  tone?: "light" | "dark"
  overlay?: boolean
}) {
  const router = useRouter()
  return (
    <div className={`detail-topbar tone-${tone}${overlay ? "" : " is-static"}`}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="detail-back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <Breadcrumbs items={items} />
    </div>
  )
}
