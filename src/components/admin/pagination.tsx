"use client"

import { useMemo } from "react"

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set<number>([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages])
    return Array.from(set)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b)
  }, [page, totalPages])

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, marginTop: 20, flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
        <strong style={{ color: "var(--foreground)" }}>{from}–{to}</strong> of {total} · page {page}/{totalPages}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }} role="navigation" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="admin-icon-btn admin-icon-btn-sm"
          aria-label="Previous page"
          style={{ opacity: page <= 1 ? 0.35 : 1, width: 36, height: 36, minWidth: 36 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        {pages.map((p, i) => {
          const gap = i > 0 && p - pages[i - 1] > 1
          return (
            <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {gap && <span aria-hidden style={{ color: "var(--muted-foreground)", fontSize: 13 }}>…</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                style={{
                  minWidth: 32, height: 32, padding: "0 8px", borderRadius: 8, border: "none",
                  background: p === page ? "var(--brand)" : "transparent",
                  color: p === page ? "#fff" : "var(--foreground)",
                  fontSize: 13, fontWeight: p === page ? 600 : 450, cursor: "pointer", fontFamily: "inherit",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {p}
              </button>
            </span>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="admin-icon-btn admin-icon-btn-sm"
          aria-label="Next page"
          style={{ opacity: page >= totalPages ? 0.35 : 1, width: 36, height: 36, minWidth: 36 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  )
}
