import type { ReactNode } from "react"

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Bold known entities (names, titles, …) wherever they are mentioned in
// free text. Longest match wins, case-insensitive, minimum 3 characters.
export function highlightEntities(text: string, entities: Array<string | null | undefined>): ReactNode[] {
  const terms = [...new Set(
    entities.map((e) => (e ?? "").trim()).filter((e) => e.length >= 3)
  )].sort((a, b) => b.length - a.length)
  if (terms.length === 0) return [text]
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi")
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part
  )
}
