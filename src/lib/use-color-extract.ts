"use client"

import { useState, useEffect, useRef } from "react"

export interface ExtractedPalette {
  /** Most vibrant/saturated color from the image */
  vibrant: string
  /** A darker muted version good for backgrounds */
  muted: string
  /** Raw r,g,b components of the vibrant color */
  r: number
  g: number
  b: number
}

const DEFAULT: ExtractedPalette = {
  vibrant: "#144AE0",
  muted: "#0B2D8A",
  r: 20,
  g: 74,
  b: 224,
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h, s, l }
}

function scorePixel(r: number, g: number, b: number): number {
  const { s, l } = rgbToHsl(r, g, b)
  if (l < 0.1 || l > 0.92) return 0
  return s * (1 - Math.abs(l - 0.45) * 1.5)
}

function extractPalette(img: HTMLImageElement): ExtractedPalette {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return DEFAULT

  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  // Bucket scores by hue to avoid picking one narrow hue range
  const buckets: { score: number; r: number; g: number; b: number }[] = []

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 200) continue
    const score = scorePixel(r, g, b)
    if (score > 0.05) {
      buckets.push({ score, r, g, b })
    }
  }

  if (buckets.length === 0) return DEFAULT

  // Sort by score descending and pick from top candidates spread across hues
  buckets.sort((a, b) => b.score - a.score)

  // Group top candidates by rough hue and pick the best from each
  const used: typeof buckets = []
  const hueBuckets = new Map<number, typeof buckets[0]>()
  for (const px of buckets) {
    const { h } = rgbToHsl(px.r, px.g, px.b)
    const hueKey = Math.floor(h * 12) // 12 hue buckets
    if (!hueBuckets.has(hueKey)) {
      hueBuckets.set(hueKey, px)
      used.push(px)
    }
    if (used.length >= 6) break
  }

  // Pick the highest-scored candidate
  const best = used[0]
  if (!best) return DEFAULT

  const { h, s } = rgbToHsl(best.r, best.g, best.b)
  const muted = `hsl(${Math.round(h * 360)}, ${Math.round(s * 60)}%, 18%)`

  return {
    vibrant: `rgb(${best.r},${best.g},${best.b})`,
    muted,
    r: best.r,
    g: best.g,
    b: best.b,
  }
}

function proxyUrl(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

const cache = new Map<string, ExtractedPalette>()

export function useColorExtract(imageUrl: string | null | undefined): ExtractedPalette {
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!imageUrl) { setPalette(DEFAULT); return }
    if (imageUrl === urlRef.current) return
    urlRef.current = imageUrl

    if (cache.has(imageUrl)) {
      setPalette(cache.get(imageUrl)!)
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const p = extractPalette(img)
        cache.set(imageUrl, p)
        setPalette(p)
      } catch {
        setPalette(DEFAULT)
      }
    }
    img.onerror = () => {
      // Retry via proxy
      const img2 = new Image()
      img2.crossOrigin = "anonymous"
      img2.onload = () => {
        try {
          const p = extractPalette(img2)
          cache.set(imageUrl, p)
          setPalette(p)
        } catch {
          setPalette(DEFAULT)
        }
      }
      img2.onerror = () => setPalette(DEFAULT)
      img2.src = proxyUrl(imageUrl)
    }
    img.src = imageUrl
  }, [imageUrl])

  return palette
}
