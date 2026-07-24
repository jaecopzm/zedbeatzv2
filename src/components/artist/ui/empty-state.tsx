import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: compact ? "32px 16px" : "56px 24px",
        color: "var(--muted-foreground)",
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--hover-bg)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            color: "var(--muted-foreground)",
          }}
        >
          {icon}
        </div>
      )}
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 15,
          fontWeight: 700,
          color: "var(--foreground)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            margin: "0 auto",
            fontSize: 13,
            maxWidth: 380,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>{action}</div>}
    </div>
  )
}
