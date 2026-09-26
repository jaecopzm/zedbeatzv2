"use client"

import { useCallback, useState } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"

/** Escape raw text, then convert the legacy markdown-lite dialect to HTML. */
export function markdownLiteToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  const blocks = md.split(/\n{2,}/)
  const out: string[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`)
      list = []
    }
  }
  for (const raw of blocks) {
    const block = raw.trim()
    if (!block) continue
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length && lines.every((l) => l.startsWith("- "))) {
      list.push(...lines.map((l) => l.slice(2)))
      continue
    }
    flush()
    if (block.startsWith("### ")) out.push(`<h3>${inline(block.slice(4))}</h3>`)
    else if (block.startsWith("## ")) out.push(`<h2>${inline(block.slice(3))}</h2>`)
    else out.push(`<p>${inline(lines.join(" "))}</p>`)
  }
  flush()
  return out.join("")
}

export function looksLikeHtml(s: string): boolean {
  return /^\s*</.test(s)
}

export function countWordsFromHtml(html: string): number {
  const text = html
    .replace(/<(img|hr|br)[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!text) return 0
  return text.split(" ").length
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={!!active}
      onClick={onClick}
      style={{
        minWidth: 36, height: 36, padding: "0 8px", borderRadius: 9, border: "none",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--brand)" : "transparent",
        color: active ? "#fff" : "var(--foreground)",
        fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0,
        boxShadow: active ? "0 3px 10px var(--brand-shadow)" : "none",
        transition: "background 0.12s, transform 0.12s",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />
}

export function BlogEditor({
  value,
  onChange,
  onWordCount,
}: {
  value: string
  onChange: (html: string) => void
  onWordCount?: (n: number) => void
}) {
  const [urlBar, setUrlBar] = useState<null | { mode: "link" | "image"; value: string }>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Write the story… Select text to format it.",
      }),
    ],
    content: value ? (looksLikeHtml(value) ? value : markdownLiteToHtml(value)) : "",
    editorProps: {
      attributes: {
        class: "blog-editor-content",
        "aria-label": "Post body",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      onWordCount?.(countWordsFromHtml(editor.getText() ? editor.getHTML() : ""))
    },
  })

  const applyUrl = useCallback(() => {
    if (!editor || !urlBar) return
    const url = urlBar.value.trim()
    if (urlBar.mode === "link") {
      if (!url) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run()
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
      }
    } else {
      if (url) editor.chain().focus().setImage({ src: url }).run()
    }
    setUrlBar(null)
  }, [editor, urlBar])

  if (!editor) {
    return <div className="skeleton" style={{ height: 320, borderRadius: 14 }} aria-label="Loading editor" />
  }

  const btn = (
    label: string,
    isActive: string | null,
    action: () => void,
    glyph: React.ReactNode,
  ) => (
    <ToolButton label={label} active={!!(isActive && editor.isActive(isActive as never))} onClick={action}>
      {glyph}
    </ToolButton>
  )

  return (
    <div
      className="admin-card"
      style={{ overflow: "hidden" }}
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Formatting"
        style={{
          display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
          padding: 8, borderBottom: "1px solid var(--border)",
          background: "var(--card-bg)",
          position: "sticky", top: 0, zIndex: 5,
        }}
      >
        {btn("Heading 2", "heading", () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          <span style={{ fontSize: 13, fontWeight: 850 }}>H2</span>)}
        {btn("Heading 3", "heading", () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          <span style={{ fontSize: 13, fontWeight: 850 }}>H3</span>)}
        <Divider />
        {btn("Bold", "bold", () => editor.chain().focus().toggleBold().run(),
          <span style={{ fontWeight: 900 }}>B</span>)}
        {btn("Italic", "italic", () => editor.chain().focus().toggleItalic().run(),
          <span style={{ fontStyle: "italic", fontWeight: 700 }}>I</span>)}
        {btn("Underline", "underline", () => editor.chain().focus().toggleUnderline().run(),
          <span style={{ textDecoration: "underline", fontWeight: 700 }}>U</span>)}
        {btn("Strikethrough", "strike", () => editor.chain().focus().toggleStrike().run(),
          <span style={{ textDecoration: "line-through", fontWeight: 700 }}>S</span>)}
        <Divider />
        {btn("Bullet list", "bulletList", () => editor.chain().focus().toggleBulletList().run(),
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="9" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="9" y1="18" x2="21" y2="18" /><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" /></svg>)}
        {btn("Numbered list", "orderedList", () => editor.chain().focus().toggleOrderedList().run(),
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-1.5 2-3s-1.5-1.5-2-1" /></svg>)}
        {btn("Quote", "blockquote", () => editor.chain().focus().toggleBlockquote().run(),
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 7H6a3 3 0 0 0-3 3v7h7v-7H6.5A1.5 1.5 0 0 1 8 8.5V8h2V7zm11 0h-4a3 3 0 0 0-3 3v7h7v-7h-3.5a1.5 1.5 0 0 1 1.5-1.5V8h2V7z" /></svg>)}
        <Divider />
        <ToolButton
          label="Add link"
          active={editor.isActive("link")}
          onClick={() => {
            const prev = editor.getAttributes("link").href ?? ""
            setUrlBar({ mode: "link", value: prev })
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        </ToolButton>
        <ToolButton
          label="Insert image"
          onClick={() => setUrlBar({ mode: "image", value: "" })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        </ToolButton>
        <ToolButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>
        </ToolButton>
        <ToolButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
        </ToolButton>
        <Divider />
        <ToolButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></svg>
        </ToolButton>
        <ToolButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 15-6.7L21 13" /></svg>
        </ToolButton>
        <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7V5h16v2M9 20h6M12 5v15" /></svg>
        </ToolButton>
      </div>

      {/* URL bar for link / image */}
      {urlBar && (
        <div style={{ display: "flex", gap: 8, padding: 10, borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
          <input
            autoFocus
            type="url"
            inputMode="url"
            value={urlBar.value}
            onChange={(e) => setUrlBar({ ...urlBar, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyUrl()
              if (e.key === "Escape") setUrlBar(null)
            }}
            placeholder={urlBar.mode === "link" ? "Paste link URL… (empty + Apply removes the link)" : "Paste image URL…"}
            className="admin-input"
            style={{ minHeight: 40 }}
            aria-label={urlBar.mode === "link" ? "Link URL" : "Image URL"}
          />
          <button type="button" onClick={applyUrl} className="admin-btn-primary admin-btn-sm" style={{ flexShrink: 0 }}>
            Apply
          </button>
          <button type="button" onClick={() => setUrlBar(null)} className="admin-btn-secondary admin-btn-sm" style={{ flexShrink: 0 }} aria-label="Cancel">
            ✕
          </button>
        </div>
      )}

      {/* Canvas */}
      <EditorContent editor={editor} />
    </div>
  )
}

export type { Editor }
