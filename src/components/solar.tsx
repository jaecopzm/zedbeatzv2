"use client"

import type { ComponentType } from "react"

export interface SolarIconProps {
  size?: number | string
  color?: string
  secondaryColor?: string
  secondaryOpacity?: number
  strokeWidth?: number | string
  className?: string
  style?: React.CSSProperties
}

type SolarComp = ComponentType<SolarIconProps>

/**
 * Sidebar nav icon system.
 * Idle  → Linear outline, inherits text color.
 * Active → Bold Duotone: solid glyph in brand with a soft
 *          brand wash behind it. This is the signature
 *          Spotify-meets-Linear moment: actives feel *filled*.
 */
export function SolarNavIcon({
  linear: Linear,
  duotone: Duotone,
  active,
  size = 20,
}: {
  linear: SolarComp
  duotone: SolarComp
  active: boolean
  size?: number
}) {
  if (active) {
    return (
      <Duotone
        size={size}
        color="var(--brand)"
        secondaryColor="var(--brand)"
        secondaryOpacity={0.3}
      />
    )
  }
  return <Linear size={size} color="currentColor" strokeWidth={1.8} />
}
