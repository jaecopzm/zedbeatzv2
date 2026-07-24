"use client"

import { useMemo, useState } from "react"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | number
type AvatarShape = "circle" | "square"

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  shape?: AvatarShape
  ring?: boolean
  verified?: boolean
  alt?: string
  className?: string
  style?: React.CSSProperties
  fetchPriority?: "high" | "low" | "auto"
  loading?: "lazy" | "eager"
}

const sizeTokens: Record<string, number> = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 72,
  xl: 112,
}

function resolvePixelSize(size: AvatarSize | undefined): number {
  if (typeof size === "number") return size
  return sizeTokens[size ?? "md"] ?? sizeTokens.md
}

function initialsOf(name?: string | null): string {
  if (!name) return "?"
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return "?"
  if (tokens.length === 1) return tokens[0].slice(0, 1).toUpperCase()
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase()
}

function hashHue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h % 360
}

export function Avatar({
  src,
  name,
  size = "md",
  shape = "circle",
  ring,
  verified,
  alt,
  className,
  style,
  fetchPriority,
  loading,
}: AvatarProps) {
  const [errored, setErrored] = useState(false)
  const px = resolvePixelSize(size)

  const fallback = useMemo(() => {
    const seed = name ?? ""
    const hue = hashHue(seed)
    const c1 = `hsl(${hue}, 70%, 52%)`
    const c2 = `hsl(${(hue + 40) % 360}, 70%, 38%)`
    return { c1, c2, text: initialsOf(name) }
  }, [name])

  const borderRadius = shape === "circle" ? "50%" : 12

  const ringStyle: React.CSSProperties =
    ring && shape === "circle"
      ? { border: "3px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }
      : ring
      ? { border: "2px solid rgba(255,255,255,0.85)" }
      : {}

  const showImage = !!src && !errored

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: px,
        height: px,
        borderRadius,
        overflow: "hidden",
        flexShrink: 0,
        background: showImage ? "var(--hover-bg)" : `linear-gradient(135deg, ${fallback.c1} 0%, ${fallback.c2} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...ringStyle,
        ...style,
      }}
      aria-label={alt ?? (verified ? `${name ?? ""} (verified)` : name ?? "Avatar")}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={alt ?? name ?? "avatar"}
          {...(fetchPriority ? { fetchPriority } : {})}
          {...(loading ? { loading } : {})}
          onError={() => setErrored(false)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            color: "#fff",
            fontSize: Math.round(px * 0.38),
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {fallback.text}
        </span>
      )}
      {verified && shape === "circle" && px >= 48 && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: Math.round(px * 0.32),
            height: Math.round(px * 0.32),
            minWidth: 16,
            minHeight: 16,
            background: "#10b981",
            borderRadius: "50%",
            border: `2px solid var(--card-bg)`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <svg
            width={Math.max(8, Math.round(px * 0.18))}
            height={Math.max(8, Math.round(px * 0.18))}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      )}
    </div>
  )
}
