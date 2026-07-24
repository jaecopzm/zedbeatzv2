"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { forwardRef } from "react"

type Variant = "primary" | "ghost" | "danger" | "subtle"
type Size = "xs" | "sm" | "md" | "lg"

interface PillButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: Variant
  size?: Size
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  loading?: boolean
}

const sizeMap: Record<Size, { padding: string; fontSize: number; height: number }> = {
  xs: { padding: "5px 12px", fontSize: 11, height: 26 },
  sm: { padding: "7px 16px", fontSize: 12, height: 32 },
  md: { padding: "10px 22px", fontSize: 13, height: 38 },
  lg: { padding: "13px 28px", fontSize: 14, height: 44 },
}

function variantStyles(variant: Variant, transparent = false): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: transparent ? "transparent" : "var(--brand)",
        color: transparent ? "var(--brand)" : "#fff",
        border: transparent ? "1.5px solid var(--brand)" : "none",
        boxShadow: transparent ? "none" : "0 2px 10px var(--brand-shadow)",
      }
    case "ghost":
      return {
        background: "transparent",
        color: "var(--foreground)",
        border: "1.5px solid var(--border)",
      }
    case "danger":
      return {
        background: "transparent",
        color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.3)",
      }
    case "subtle":
      return {
        background: "var(--hover-bg)",
        color: "var(--foreground)",
        border: "none",
      }
  }
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      fullWidth,
      loading,
      disabled,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref,
  ) => {
    const sz = sizeMap[size]
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: sz.padding,
          fontSize: sz.fontSize,
          fontWeight: 600,
          borderRadius: 999,
          minHeight: sz.height,
          cursor: isDisabled ? "default" : "pointer",
          opacity: isDisabled ? 0.55 : 1,
          transition: "transform 0.12s ease, box-shadow 0.18s ease, background 0.14s ease, border-color 0.14s ease",
          width: fullWidth ? "100%" : undefined,
          fontFamily: "inherit",
          ...variantStyles(variant),
          ...style,
        }}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              animation: "app-spin 0.6s linear infinite",
              display: "inline-block",
            }}
          />
        ) : (
          iconLeft
        )}
        <span style={{ display: "inline-flex", alignItems: "center" }}>{children}</span>
        {!loading && iconRight}
      </button>
    )
  },
)

PillButton.displayName = "PillButton"
