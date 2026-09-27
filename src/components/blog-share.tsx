"use client"

import { useState } from "react"

interface Props {
  title: string
  url: string
  vertical?: boolean
}

function iconWA() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zm-3.2 4.1c-.2 0-.4 0-.6.2-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4 1.9.8 2.3.6 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3l-1.5-.7c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a7.5 7.5 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5L8.9 8.4c-.2-.2-.3-.3-.9-.3z" /></svg>
  )
}
function iconFB() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.7V14h2.7v8h3.1z" /></svg>
  )
}
function iconX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.5 22H3.3l7.3-8.3L1 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.4 3.9H5.6L17.8 20z" /></svg>
  )
}
function iconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
  )
}
function iconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
  )
}
function iconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg>
  )
}

export function BlogShare({ title, url, vertical = false }: Props) {
  const [copied, setCopied] = useState(false)
  const shareText = encodeURIComponent(title)
  const shareUrl = encodeURIComponent(url)
  const canNative = typeof navigator !== "undefined" && !!(navigator as any).share

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback: select via prompt-less textarea
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  async function native() {
    try {
      await (navigator as any).share({ title, url, text: title })
    } catch {}
  }

  return (
    <div className={`blog-share${vertical ? " blog-share-vertical" : ""}`} role="group" aria-label="Share this story">
      {!vertical && <span className="blog-share-label">Share</span>}
      <a
        className="blog-share-btn"
        href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        title="WhatsApp"
      >
        {iconWA()}<span className="blog-share-word">WhatsApp</span>
      </a>
      <a
        className="blog-share-btn"
        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        title="Facebook"
      >
        {iconFB()}<span className="blog-share-word">Facebook</span>
      </a>
      <a
        className="blog-share-btn"
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        title="X"
      >
        {iconX()}<span className="blog-share-word">Post</span>
      </a>
      <button type="button" className="blog-share-btn" onClick={copy} aria-label="Copy link" title="Copy link">
        {copied ? iconCheck() : iconLink()}
        <span className="blog-share-word">{copied ? "Copied" : "Copy"}</span>
      </button>
      {canNative && (
        <button type="button" className="blog-share-btn blog-share-native" onClick={native} aria-label="More share options">
          {iconShare()}<span className="blog-share-word">More</span>
        </button>
      )}
    </div>
  )
}
