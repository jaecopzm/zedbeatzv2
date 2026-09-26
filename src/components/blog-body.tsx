// Server-safe markdown-lite renderer for blog posts.
// Supports: ## / ### headings, - bullet lists, paragraphs,
// **bold**, and [text](url) links. Everything else is plain text.
import React from "react"

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  // Split on **bold** and [text](url), keeping delimiters.
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith("**")) {
      out.push(<strong key={`${keyPrefix}-b${k++}`}>{tok.slice(2, -2)}</strong>)
    } else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)
      if (lm) {
        const href = lm[2]
        const external = /^https?:\/\//.test(href)
        out.push(
          <a
            key={`${keyPrefix}-a${k++}`}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            style={{ color: "var(--brand)", fontWeight: 600 }}
          >
            {lm[1]}
          </a>
        )
      } else {
        out.push(tok)
      }
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function BlogBody({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/)
  const nodes: React.ReactNode[] = []
  let listBuf: string[] = []
  const flushList = () => {
    if (listBuf.length === 0) return
    const items = listBuf
    listBuf = []
    nodes.push(
      <ul key={`ul-${nodes.length}`} style={{ paddingLeft: 22, margin: "0 0 18px", lineHeight: 1.75, fontSize: 16 }}>
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{renderInline(it, `li${nodes.length}-${i}`)}</li>
        ))}
      </ul>
    )
  }

  blocks.forEach((raw, bi) => {
    const block = raw.trim()
    if (!block) return
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
      listBuf.push(...lines.map((l) => l.slice(2)))
      return
    }
    flushList()
    if (block.startsWith("### ")) {
      nodes.push(
        <h3 key={bi} style={{ fontSize: 20, fontWeight: 700, margin: "28px 0 10px", letterSpacing: "-0.01em" }}>
          {renderInline(block.slice(4), `h3-${bi}`)}
        </h3>
      )
    } else if (block.startsWith("## ")) {
      nodes.push(
        <h2 key={bi} style={{ fontSize: 24, fontWeight: 700, margin: "32px 0 12px", letterSpacing: "-0.02em" }}>
          {renderInline(block.slice(3), `h2-${bi}`)}
        </h2>
      )
    } else {
      nodes.push(
        <p key={bi} style={{ fontSize: 16, lineHeight: 1.8, margin: "0 0 18px", color: "var(--foreground)" }}>
          {renderInline(lines.join(" "), `p-${bi}`)}
        </p>
      )
    }
  })
  flushList()

  return <>{nodes}</>
}
