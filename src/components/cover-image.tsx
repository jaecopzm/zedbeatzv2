"use client"

import Image from "next/image"
import { useState } from "react"

/**
 * Cover art image with automatic AVIF/WebP, responsive sizes,
 * and a fade-in on load so grids don't pop.
 * Parent must be position:relative with an intrinsic size (all
 * hp-card-art / hp-track-art / avatar / thumb parents qualify).
 */
export function CoverImage({
  src,
  alt,
  sizes = "(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 400px",
  priority = false,
  className,
}: {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onLoad={() => setLoaded(true)}
      className={className}
      style={{
        objectFit: "cover",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.5s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    />
  )
}
