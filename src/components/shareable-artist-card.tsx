"use client"

import { useRef, useState, useEffect } from "react"

interface ArtistCardData {
  stageName: string
  photoUrl?: string | null
  verified?: boolean
  totalPlays?: number
  totalFollowers?: number
  totalTracks?: number
  topTrackTitle?: string
  topTrackPlays?: number
}

interface Props {
  data: ArtistCardData
}

export function ShareableArtistCard({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  async function generate() {
    if (!canvasRef.current) return
    setGenerating(true)

    const canvas = canvasRef.current
    const size = 1080
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!
    const C = (color: string, alpha = 1) => { ctx.fillStyle = color; ctx.globalAlpha = alpha }

    // ── Background gradient (brand colors) ──
    const bg = ctx.createLinearGradient(0, 0, size, size)
    bg.addColorStop(0, "#144AE0")
    bg.addColorStop(0.5, "#0E35A3")
    bg.addColorStop(1, "#0B2D8A")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)

    // ── Decorative circles ──
    ctx.globalAlpha = 0.12
    ctx.fillStyle = "#ffffff"
    ctx.beginPath(); ctx.arc(size + 100, 100, 200, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(-50, size - 200, 180, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1

    // ── Brand watermark ──
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.font = "bold 28px Inter, -apple-system, sans-serif"
    ctx.fillText("ZEDSTREAM", 60, 80)

    ctx.fillStyle = "rgba(255,255,255,0.6)"
    ctx.font = "500 22px Inter, sans-serif"
    ctx.fillText("ARTIST PROFILE", 60, 110)

    // ── Photo (circle) ──
    const photoY = 380
    const photoR = 160
    const photoX = size / 2

    // Glow ring
    const glow = ctx.createRadialGradient(photoX, photoY, photoR, photoX, photoY, photoR + 40)
    glow.addColorStop(0, "rgba(255,255,255,0.4)")
    glow.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(photoX, photoY, photoR + 40, 0, Math.PI * 2); ctx.fill()

    // White ring
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 8
    ctx.beginPath(); ctx.arc(photoX, photoY, photoR + 4, 0, Math.PI * 2); ctx.stroke()

    // Photo
    ctx.save()
    ctx.beginPath()
    ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    if (data.photoUrl) {
      try {
        const img = await loadImage(data.photoUrl)
        ctx.drawImage(img, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2)
      } catch {
        drawInitials(ctx, data.stageName, photoX, photoY, photoR)
      }
    } else {
      drawInitials(ctx, data.stageName, photoX, photoY, photoR)
    }
    ctx.restore()

    // Verified badge
    if (data.verified) {
      const badgeX = photoX + photoR - 10
      const badgeY = photoY + photoR - 10
      ctx.fillStyle = "#10b981"
      ctx.beginPath(); ctx.arc(badgeX, badgeY, 40, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(badgeX, badgeY, 40, 0, Math.PI * 2); ctx.stroke()
      // Checkmark
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 6
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(badgeX - 16, badgeY)
      ctx.lineTo(badgeX - 4, badgeY + 12)
      ctx.lineTo(badgeX + 18, badgeY - 14)
      ctx.stroke()
    }

    // ── Name ──
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 64px Inter, -apple-system, sans-serif"
    ctx.textAlign = "center"
    const displayName = (data.stageName || "Artist").slice(0, 22)
    ctx.fillText(displayName, size / 2, photoY + photoR + 100)

    // ── Stats row ──
    const statY = photoY + photoR + 170
    const stats = [
      { label: "PLAYS", value: formatCount(data.totalPlays ?? 0) },
      { label: "FOLLOWERS", value: formatCount(data.totalFollowers ?? 0) },
      { label: "TRACKS", value: formatCount(data.totalTracks ?? 0) },
    ]
    const colW = size / 3
    stats.forEach((s, i) => {
      const x = colW * i + colW / 2
      ctx.font = "bold 48px Inter, sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.fillText(s.value, x, statY)
      ctx.font = "500 20px Inter, sans-serif"
      ctx.fillStyle = "rgba(255,255,255,0.75)"
      ctx.fillText(s.label, x, statY + 32)
    })

    // ── Top track (if available) ──
    if (data.topTrackTitle) {
      const boxY = statY + 90
      const boxH = 140
      const boxX = 100
      const boxW = size - 200
      ctx.fillStyle = "rgba(255,255,255,0.12)"
      ctx.beginPath()
      roundRect(ctx, boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.strokeStyle = "rgba(255,255,255,0.2)"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.font = "500 18px Inter, sans-serif"
      ctx.fillStyle = "rgba(255,255,255,0.65)"
      ctx.textAlign = "left"
      ctx.fillText("TOP TRACK", boxX + 24, boxY + 32)

      ctx.font = "bold 32px Inter, sans-serif"
      ctx.fillStyle = "#ffffff"
      const trackTitle = data.topTrackTitle.length > 30 ? data.topTrackTitle.slice(0, 28) + "..." : data.topTrackTitle
      ctx.fillText(trackTitle, boxX + 24, boxY + 72)

      ctx.font = "500 18px Inter, sans-serif"
      ctx.fillStyle = "rgba(255,255,255,0.7)"
      ctx.fillText(`${formatCount(data.topTrackPlays ?? 0)} plays`, boxX + 24, boxY + 104)
    }

    // ── Footer ──
    ctx.font = "500 20px Inter, sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.6)"
    ctx.textAlign = "center"
    ctx.fillText("Listen now on ZedBeatz", size / 2, size - 60)
    ctx.font = "bold 22px Inter, sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.fillText("zedbeatz.com", size / 2, size - 30)

    setPreviewUrl(canvas.toDataURL("image/png"))
    setGenerating(false)
  }

  function handleDownload() {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `${(data.stageName || "artist").replace(/\s+/g, "-").toLowerCase()}-zedbeatz.png`
    a.click()
  }

  function handleShare() {
    if (!canvasRef.current) return
    if (typeof navigator.share === "undefined") {
      handleDownload()
      return
    }
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], "zedbeatz.png", { type: "image/png" })
      try {
        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: data.stageName, text: "Listen on ZedBeatz", files: [file] })
        } else {
          await navigator.share({ title: data.stageName, text: "Listen on ZedBeatz", url: window.location.origin })
        }
      } catch { /* user cancelled */ }
    })
  }

  return (
    <div>
      <button onClick={generate} disabled={generating} style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: generating ? "default" : "pointer" }}>
        {generating ? "Generating..." : "Generate Artist Card"}
      </button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {previewUrl && (
        <div style={{ marginTop: 16, position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPreviewUrl(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <img src={previewUrl} alt="Artist Card" style={{ width: "100%", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
              <button onClick={handleDownload} style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "#ffffff", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Download</button>
              <button onClick={handleShare} style={{ padding: "10px 24px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Share</button>
              <button onClick={() => setPreviewUrl(null)} style={{ padding: "10px 24px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── helpers ──

function drawInitials(ctx: CanvasRenderingContext2D, name: string, cx: number, cy: number, r: number) {
  const gradient = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  gradient.addColorStop(0, "#4B77F5")
  gradient.addColorStop(1, "#0B2D8A")
  ctx.fillStyle = gradient
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.fillStyle = "rgba(255,255,255,0.95)"
  ctx.font = `bold ${r * 0.7}px Inter, -apple-system, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText((name || "A").charAt(0).toUpperCase(), cx, cy)
  ctx.textBaseline = "alphabetic"
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}
