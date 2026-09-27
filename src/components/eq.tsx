"use client"

/**
 * The one equalizer used across the entire app — three bouncy bars shown
 * right after the playing song's title.
 */
export function EqBars({ paused = false, className = "" }: { paused?: boolean; className?: string }) {
  return (
    <span className={`eq${paused ? " is-paused" : ""}${className ? ` ${className}` : ""}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  )
}
