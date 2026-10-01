"use client"

import { useMemo, type CSSProperties } from "react"
import { genreAccent, type GenreLike } from "@/lib/genre-art"

/**
 * Apple-Music-Top-100-style mosaic artwork: a deterministic chunky pixel
 * grid generated from a seed string. Color flows left → right — solid
 * accent-led tone on the left drifting through analogous hues toward
 * pale blocks on the right. An optional baked label (dark ink, top-left)
 * sits on the art like Apple's region titles. Zero network, instant,
 * stable per seed.
 */

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexToHue(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return 222
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 222
  const d = max - min
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  return h < 0 ? h + 360 : h
}

function buildCells(seed: string, baseHue: number, cols: number, rows: number): string[] {
  const rand = mulberry32(hashSeed(seed || "zedbeatz"))
  // Flow direction + reach: each mosaic drifts its own way across the row.
  const dir = rand() > 0.5 ? 1 : -1
  const spread = 55 + rand() * 50
  const rowWobble = Array.from({ length: rows }, () => (rand() - 0.5) * 10)
  const cells: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colT = cols === 1 ? 0 : c / (cols - 1)
      // Hue travels left → right; saturation eases off and lightness lifts
      // toward the right, like Apple's solid-to-pale flow.
      const h = baseHue + dir * colT * spread + rowWobble[r] + (rand() - 0.5) * 9
      // Pale blocks gather toward the right edge.
      if (rand() < 0.04 + colT * 0.22) {
        const l = 86 + rand() * 10
        const s = 28 + rand() * 22
        cells.push(`hsl(${Math.round(((h % 360) + 360) % 360)},${Math.round(s)}%,${Math.round(l)}%)`)
        continue
      }
      const s = Math.round(88 - colT * 22 + (rand() - 0.5) * 10)
      const l = Math.round(52 + colT * 26 + (rand() - 0.5) * 8)
      cells.push(`hsl(${Math.round(((h % 360) + 360) % 360)},${Math.round(s)}%,${Math.round(l)}%)`)
    }
  }
  return cells
}

export function MosaicArt({
  seed,
  accent = "#144AE0",
  kicker,
  label,
  dense = false,
  className,
  style,
  cols = 9,
  rows = 6,
}: {
  seed: string
  accent?: string
  kicker?: string
  label?: string
  dense?: boolean
  className?: string
  style?: CSSProperties
  cols?: number
  rows?: number
}) {
  const cells = useMemo(
    () => buildCells(seed, hexToHue(accent), cols, rows),
    [seed, accent, cols, rows]
  )
  const showText = !!(kicker || label)
  return (
    <div
      aria-hidden={!showText}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        overflow: "hidden",
        borderRadius: "inherit",
        background: "#f2f3f7",
        ...(className ? {} : { position: "relative" }),
        ...style,
      }}
    >
      {cells.map((c, i) => (
        <span key={i} style={{ background: c, minWidth: 0, minHeight: 0 }} />
      ))}
      {showText && (
        <div
          style={{
            position: "absolute",
            top: dense ? 8 : 12,
            left: dense ? 10 : 14,
            right: dense ? 8 : 12,
            pointerEvents: "none",
          }}
        >
          {kicker && (
            <p
              style={{
                margin: 0,
                fontSize: dense ? 10 : 12,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "#14141a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {kicker}
            </p>
          )}
          {label && (
            <p
              style={{
                margin: kicker ? "1px 0 0" : 0,
                fontSize: dense ? 15 : 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: "#14141a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Genre-flavored mosaic: palette follows the genre accent. */
export function GenreMosaic({
  genre,
  index = 0,
  kicker,
  label,
  dense = false,
  className,
  style,
  cols,
  rows,
}: {
  genre: GenreLike | null | undefined
  index?: number
  kicker?: string
  label?: string
  dense?: boolean
  className?: string
  style?: CSSProperties
  cols?: number
  rows?: number
}) {
  const g = genre ?? {}
  const seed = `${g.slug ?? ""}:${g.name ?? ""}:${index}`
  return (
    <MosaicArt
      seed={seed}
      accent={genreAccent(g, index)}
      kicker={kicker}
      label={label}
      dense={dense}
      className={className}
      style={style}
      cols={cols}
      rows={rows}
    />
  )
}
