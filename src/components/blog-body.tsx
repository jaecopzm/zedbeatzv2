// Blog body renderer — rich HTML (visual editor, sanitized) with legacy
// markdown-lite fallback. Supports embeds (YouTube / Spotify), figures,
// tables, code, pull-quotes. Inspired by Pitchfork / Genius / Medium.
//
// NOTE: sanitization uses sanitize-html (pure JS, no jsdom) instead of
// DOMPurify — jsdom cannot load inside the production serverless function
// (ERR_REQUIRE_ESM via html-encoding-sniffer) and 500s every article page.
import React from "react"
import sanitizeHtml from "sanitize-html"
import { slugifyHeading } from "@/lib/blog"

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  // **bold** first, then *italic*, then [text](url). Single-* requires no
  // adjacent asterisk so bullets and bold leftovers stay literal.
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith("**")) {
      out.push(<strong key={`${keyPrefix}-b${k++}`}>{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith("*")) {
      out.push(<em key={`${keyPrefix}-i${k++}`}>{tok.slice(1, -1)}</em>)
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
            className="blog-a"
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

// Line-based parser (real markdown behavior): AI drafts use single-\n line
// breaks, so every line is classified on its own — headings, bullets,
// numbers, quotes, hr, or paragraph text. Consecutive text lines merge.
function renderMarkdownLite(markdown: string): React.ReactNode {
  const lines = markdown.split("\n")
  const nodes: React.ReactNode[] = []
  let para: string[] = []
  let quote: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const key = () => nodes.length
  const flushPara = () => {
    if (!para.length) return
    nodes.push(<p key={`p-${key()}`} className="blog-p">{renderInline(para.join(" "), `p-${key()}`)}</p>)
    para = []
  }
  const flushQuote = () => {
    if (!quote.length) return
    nodes.push(<blockquote key={`q-${key()}`} className="blog-quote">{renderInline(quote.join(" "), `q-${key()}`)}</blockquote>)
    quote = []
  }
  const flushList = () => {
    if (!list || !list.items.length) {
      list = null
      return
    }
    const { ordered, items } = list
    const n = key()
    list = null
    nodes.push(
      ordered ? (
        <ol key={`ol-${n}`} className="blog-ul">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it, `oli${n}-${i}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={`ul-${n}`} className="blog-ul">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it, `uli${n}-${i}`)}</li>
          ))}
        </ul>
      )
    )
  }
  const flushAll = () => {
    flushPara()
    flushQuote()
    flushList()
  }

  const pushListItem = (ordered: boolean, item: string) => {
    flushPara()
    flushQuote()
    if (!list || list.ordered !== ordered) flushList()
    if (!list) list = { ordered, items: [] }
    list.items.push(item)
  }

  lines.forEach((raw) => {
    const line = raw.trim()
    if (!line) {
      flushAll()
      return
    }
    let hm = /^(#{1,3})\s+(.+)$/.exec(line)
    if (hm) {
      flushAll()
      const text = hm[2].trim()
      const n = key()
      if (hm[1].length >= 3) {
        nodes.push(<h3 key={`h-${n}`} id={slugifyHeading(text)} className="blog-h3">{renderInline(text, `h3-${n}`)}</h3>)
      } else {
        nodes.push(<h2 key={`h-${n}`} id={slugifyHeading(text)} className="blog-h2">{renderInline(text, `h2-${n}`)}</h2>)
      }
      return
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushAll()
      nodes.push(<hr key={`hr-${key()}`} className="blog-hr" />)
      return
    }
    if (line.startsWith("> ")) {
      flushPara()
      flushList()
      quote.push(line.slice(2).trim())
      return
    }
    const ulm = /^[-*•]\s+(.+)$/.exec(line)
    if (ulm) {
      pushListItem(false, ulm[1].trim())
      return
    }
    const olm = /^\d{1,3}[.)]\s+(.+)$/.exec(line)
    if (olm) {
      pushListItem(true, olm[1].trim())
      return
    }
    flushQuote()
    flushList()
    para.push(line)
  })
  flushAll()

  return <>{nodes}</>
}

const ALLOWED_TAGS = [
  "p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "code", "pre",
  "ul", "ol", "li", "blockquote", "a", "img", "hr",
  "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
  "iframe", "audio", "source",
]

// Per-tag attributes (mirrors the old DOMPurify allowlist). id/class are
// permitted everywhere so heading anchors and editor classes survive.
const ID_CLASS = ["id", "class"]
const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "title", "target", "rel", ...ID_CLASS],
  img: ["src", "alt", "title", "width", "height", "loading", ...ID_CLASS],
  iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "frameborder", "referrerpolicy", "loading", ...ID_CLASS],
  audio: ["src", "controls", ...ID_CLASS],
  source: ["src", "type", ...ID_CLASS],
  p: [...ID_CLASS], h2: [...ID_CLASS], h3: [...ID_CLASS], h4: [...ID_CLASS],
  blockquote: [...ID_CLASS], ul: [...ID_CLASS], ol: [...ID_CLASS], li: [...ID_CLASS],
  pre: [...ID_CLASS], code: [...ID_CLASS], figure: [...ID_CLASS], figcaption: [...ID_CLASS],
  table: [...ID_CLASS], thead: [...ID_CLASS], tbody: [...ID_CLASS], tr: [...ID_CLASS],
  th: [...ID_CLASS], td: [...ID_CLASS], hr: [...ID_CLASS],
  strong: [...ID_CLASS], em: [...ID_CLASS], u: [...ID_CLASS], s: [...ID_CLASS],
  br: [...ID_CLASS],
}

const EMBED_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "open.spotify.com",
  "player.spotify.com",
  "w.soundcloud.com",
  "soundcloud.com",
  "audiomack.com",
]

function isEmbedAllowed(src: string): boolean {
  try {
    const u = new URL(src, "https://x.local")
    if (!/^https?:$/.test(u.protocol)) return false
    return EMBED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    let id = ""
    if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("/")[0]
    else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v") ?? ""
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? ""
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? ""
    }
    id = id.split(/[?&#]/)[0]
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return null
  }
}

function spotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes("spotify.com")) return null
    const m = u.pathname.match(/\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/)
    if (!m) return null
    return `https://open.spotify.com/embed/${m[1]}/${m[2]}`
  } catch {
    return null
  }
}

function autoEmbedUrl(url: string): { src: string; height?: number } | null {
  const yt = youtubeEmbed(url)
  if (yt) return { src: yt }
  const sp = spotifyEmbed(url)
  if (sp) return { src: sp, height: url.includes("/track/") ? 152 : 352 }
  return null
}

// Add heading ids + lazy images + auto-embed bare media links (string-level).
function enhanceHtml(clean: string): string {
  const seen = new Set<string>()
  // h2/h3 ids
  clean = clean.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag, attrs, inner) => {
    if (/id\s*=/.test(attrs)) return _m
    const text = inner.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
    let id = slugifyHeading(text)
    if (!id) return _m
    let uniq = id
    let n = 2
    while (seen.has(uniq)) uniq = `${id}-${n++}`
    seen.add(uniq)
    return `<${tag}${attrs} id="${uniq}">${inner}</${tag}>`
  })
  // lazy images
  clean = clean.replace(/<img(?![^>]*loading=)([^>]*)>/gi, "<img loading=\"lazy\" decoding=\"async\"$1>")
  // Raw iframes (from older posts) → responsive wrapper first…
  clean = clean.replace(
    /<iframe([^>]*)>(?:<\/iframe>)?/gi,
    (_m, attrs) => `<div class="blog-embed"><iframe${attrs} loading="lazy" title="Embedded player"></iframe></div>`
  )
  // …then auto-embed bare YouTube/Spotify link paragraphs (already wrapped, no double-wrap).
  // Handles <p><a href="...">...</a></p> and bare <p>https://...</p>.
  clean = clean.replace(
    /<p>\s*(?:<a[^>]*href="([^"]+)"[^>]*>.*?<\/a>|(https?:\/\/[^\s<]+))\s*<\/p>/gi,
    (m, href, bare) => {
      const url = String(href ?? bare ?? "").trim()
      const emb = autoEmbedUrl(url)
      if (!emb) return m
      const style = emb.height ? ` style="aspect-ratio:auto;height:${emb.height}px"` : ""
      const esc = emb.src.replace(/"/g, "&quot;")
      return `<div class="blog-embed"${style}><iframe src="${esc}" loading="lazy" title="Embedded player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`
    }
  )
  return clean
}

export function BlogBody({ markdown, dropCap = false }: { markdown: string; dropCap?: boolean }) {
  const source = markdown ?? ""
  if (/^\s*</.test(source)) {
    const clean = sanitizeHtml(source, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: ALLOWED_ATTR,
      allowedIframeHostnames: EMBED_HOSTS,
      allowIframeRelativeUrls: false,
    })
    // Strip disallowed iframes (non-whitelisted hosts) post-sanitize —
    // belt and suspenders alongside allowedIframeHostnames. The second
    // pass drops iframes whose src was stripped entirely (no src at all).
    const withoutBadIframes = String(clean)
      .replace(
        /<iframe[^>]*src="([^"]*)"[^>]*>(?:<\/iframe>)?/gi,
        (m, src) => (isEmbedAllowed(String(src)) ? m : "")
      )
      .replace(/<iframe(?![^>]*\ssrc=)[^>]*>(?:<\/iframe>)?/gi, "")
    const html = enhanceHtml(withoutBadIframes)
    return <div className={`blog-rich${dropCap ? " blog-dropcap" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <div className={`blog-rich${dropCap ? " blog-dropcap" : ""}`}>{renderMarkdownLite(source)}</div>
}
