"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
// ReactNode used by SectionHeader actions
import { usePlayerStore } from "@/lib/store"

export function SectionHeader({
  label,
  href,
  size = "lg",
  onPlayAll,
  actions,
}: {
  label: string
  href?: string
  size?: "lg" | "sm"
  onPlayAll?: () => void
  /** Extra header actions (e.g. Apple-style scroll chevrons) */
  actions?: ReactNode
}) {
  const router = useRouter()
  const clickable = !!href
  return (
    <div className="hp-section-header-row">
      <div
        className="hp-section-header"
        onClick={clickable ? () => router.push(href as string) : undefined}
        style={clickable ? undefined : { cursor: "default" }}
      >
        <h2 className={size === "lg" ? "hp-section-title" : "hp-section-title-sm"}>{label}</h2>
        {clickable && (
          <svg className="hp-section-chevron" width={size === "lg" ? 18 : 16} height={size === "lg" ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        )}
      </div>
      {(actions || onPlayAll) && (
        <div className="hp-section-actions">
          {actions}
          {onPlayAll && (
            <button
              className="hp-play-all-btn"
              onClick={(e) => {
                e.stopPropagation()
                onPlayAll()
              }}
              type="button"
              aria-label="Play all"
              title="Play all"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
              <span>Play</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function EmptyState({
  message,
  cta,
  onCta,
}: {
  message: string
  cta?: string
  onCta?: () => void
}) {
  return (
    <div className="hp-empty">
      <div className="hp-empty-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <span>{message}</span>
      {cta && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: 8,
            padding: "8px 18px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--foreground)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          type="button"
        >
          {cta}
        </button>
      )}
    </div>
  )
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="hp-skeleton-card" style={{ ["--i" as string]: i }}>
          <div className="skeleton hp-skeleton-art" />
          <div className="skeleton" style={{ width: "70%", height: "13px", marginBottom: 5 }} />
          <div className="skeleton" style={{ width: "50%", height: "11px" }} />
        </div>
      ))}
    </>
  )
}

export function SkeletonRow({ index = 0 }: { index?: number }) {
  return (
    <div className="hp-skeleton-track">
      <div className="skeleton hp-skeleton-num" style={{ animationDelay: `${index * 50}ms` }} />
      <div className="skeleton hp-skeleton-thumb" style={{ animationDelay: `${index * 50}ms` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div className="skeleton" style={{ width: `${52 + (index % 3) * 10}%`, height: "13px", animationDelay: `${index * 50}ms` }} />
        <div className="skeleton" style={{ width: `${30 + (index % 2) * 12}%`, height: "11px", animationDelay: `${index * 50}ms` }} />
      </div>
      <div className="skeleton" style={{ width: "32px", height: "11px", animationDelay: `${index * 50}ms` }} />
    </div>
  )
}
