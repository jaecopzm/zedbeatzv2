import type { ReactNode } from "react"

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  icon: ReactNode
  color: string
  size?: "sm" | "md"
  caption?: ReactNode
}

export function StatCard({ label, value, icon, color, size = "md", caption }: StatCardProps) {
  const isSm = size === "sm"
  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: 14,
        padding: isSm ? "14px 16px" : "20px 22px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: isSm ? 38 : 44,
          height: isSm ? 38 : 44,
          borderRadius: 12,
          background: `rgba(${color},0.12)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: `rgb(${color})`,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: isSm ? 20 : 26,
            fontWeight: 800,
            color: "var(--foreground)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </p>
        <p
          style={{
            margin: isSm ? "2px 0 0" : "4px 0 0",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--muted-foreground)",
          }}
        >
          {label}
        </p>
        {caption && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>{caption}</p>
        )}
      </div>
    </div>
  )
}
