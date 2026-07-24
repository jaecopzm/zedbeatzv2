import type { CSSProperties } from "react"

interface VerifiedBadgeProps {
  size?: "xs" | "sm" | "md"
  inline?: boolean
  withLabel?: boolean
  variant?: "blue" | "green" | "neutral"
  style?: CSSProperties
}

export function VerifiedBadge({
  size = "sm",
  inline,
  withLabel,
  variant = "neutral",
  style,
}: VerifiedBadgeProps) {
  const dims = {
    xs: { iconSize: 10, fontSize: 10, pad: "3px 7px", gap: 4 },
    sm: { iconSize: 12, fontSize: 11, pad: "4px 10px", gap: 5 },
    md: { iconSize: 14, fontSize: 12, pad: "5px 12px", gap: 6 },
  }[size]

  const palette = {
    neutral: {
      bg: "var(--brand-bg)",
      fg: "var(--brand)",
      icon: "var(--brand)",
      label: "Verified",
    },
    blue: {
      bg: "rgba(10,132,255,0.16)",
      fg: "#4fc3f7",
      icon: "#4fc3f7",
      label: "Verified",
    },
    green: {
      bg: "rgba(16,185,129,0.16)",
      fg: "#10b981",
      icon: "#10b981",
      label: "Verified",
    },
  }[variant]

  const CheckIcon = (
    <svg
      width={dims.iconSize}
      height={dims.iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={palette.icon}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )

  if (!withLabel) {
    return (
      <span
        aria-label="Verified"
        title="Verified"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: dims.iconSize + 8,
          height: dims.iconSize + 8,
          borderRadius: "50%",
          background: palette.bg,
          color: palette.fg,
          ...style,
        }}
      >
        {CheckIcon}
      </span>
    )
  }

  return (
    <span
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: dims.gap,
        padding: dims.pad,
        borderRadius: 999,
        background: palette.bg,
        color: palette.fg,
        fontSize: dims.fontSize,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        width: "fit-content",
        ...style,
      }}
    >
      {CheckIcon}
      {palette.label}
    </span>
  )
}
