"use client"

/**
 * The one equalizer used across the entire app — bouncy orange bars shown
 * in front of the playing song's title (or over its artwork on cards).
 */
export function EqBars({ paused = false, className = "" }: { paused?: boolean; className?: string }) {
  return (
    <span className={`eq${paused ? " is-paused" : ""}${className ? ` ${className}` : ""}`} aria-hidden>
      <span />
      <span />
      <span />
      <span />
    </span>
  )
}
