import type { ReactNode } from "react"

interface SectionHeadingProps {
  title: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  description?: ReactNode
  size?: "sm" | "md" | "lg"
  id?: string
}

export function SectionHeading({
  title,
  eyebrow,
  action,
  description,
  size = "md",
  id,
}: SectionHeadingProps) {
  const titleStyle: React.CSSProperties = {
    margin: 0,
    color: "var(--foreground)",
    letterSpacing: "-0.02em",
    fontWeight: 700,
  }

  const sizes = {
    sm: { fontSize: 15, gap: "0 10px" },
    md: { fontSize: 18, gap: "0 10px" },
    lg: { fontSize: 22, gap: "0 12px" },
  } as const

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: size === "lg" ? 18 : 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted-foreground)",
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          style={{ ...titleStyle, fontSize: sizes[size].fontSize }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--muted-foreground)",
              lineHeight: 1.5,
              maxWidth: 560,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {action}
        </div>
      )}
    </header>
  )
}
