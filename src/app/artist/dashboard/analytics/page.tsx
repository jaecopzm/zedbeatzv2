"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "@/lib/api"

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d")

  const { data: overview } = useQuery({ queryKey: ["artist-overview"], queryFn: () => api.artistOverview() })
  const { data: trends } = useQuery({ queryKey: ["artist-trends", period], queryFn: () => api.artistTrends(period) })
  const { data: topData } = useQuery({ queryKey: ["artist-toptracks"], queryFn: () => api.artistTopTracks() })

  const topTracks = (topData?.tracks ?? []).slice(0, 10)
  const playTrends = trends?.play_trends ?? []
  const maxPlays = Math.max(...playTrends.map((d: any) => d.plays), 1)
  const maxTop = Math.max(...topTracks.map((t: any) => t.play_count), 1)

  const stats = [
    { label: "Total Plays", value: overview?.total_plays ?? 0, color: "var(--brand)", icon: "<path d='M5 3l14 9-14 9V3z'/>" },
    { label: "Published Tracks", value: overview?.total_tracks ?? 0, color: "59,130,246", icon: "<path d='M9 18V5l12-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='18' cy='16' r='3'/>" },
    { label: "Followers", value: overview?.total_followers ?? 0, color: "249,115,22", icon: "<path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2'/><circle cx='9' cy='7' r='4'/>" },
    { label: "Total Likes", value: overview?.total_likes ?? 0, color: "239,68,68", icon: "<path d='M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'/>" },
  ]

  const periods = ["7d", "30d", "90d"]

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Analytics</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>Track your performance and audience growth</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--hover-bg)", borderRadius: 999, padding: 3 }}>
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding: "6px 16px", borderRadius: 999, border: "none",
                background: period === p ? "var(--card-bg)" : "transparent",
                color: period === p ? "var(--foreground)" : "var(--muted-foreground)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s",
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat strip ── */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }} className="stat-strip">
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--card-bg)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`rgb(${s.color})`} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}
                dangerouslySetInnerHTML={{ __html: s.icon }} />
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{formatCount(s.value)}</p>
                <p style={{ margin: "1px 0 0", fontSize: 11, fontWeight: 500, color: "var(--muted-foreground)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="analytics-grid">
        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Play Trends</h3>
          {playTrends.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.4" strokeLinecap="round" style={{ marginBottom: 12, opacity: 0.4 }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>No plays yet</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>Data will appear once listeners start streaming your tracks.</p>
            </div>
          ) : (
            <ChartBars values={playTrends.map((d: any) => ({ label: d.day.slice(5), value: d.plays }))} maxValue={maxPlays} color="var(--brand)" />
          )}
        </section>

        <section style={{ background: "var(--card-bg)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Top Tracks</h3>
          {topTracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.4" strokeLinecap="round" style={{ marginBottom: 12, opacity: 0.4 }}>
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>No published tracks</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>Publish your tracks to see which ones resonate most.</p>
            </div>
          ) : (
            <ChartBars values={topTracks.map((t: any) => ({ label: t.title.length > 18 ? t.title.slice(0, 16) + "..." : t.title, value: t.play_count }))} maxValue={maxTop} color="var(--brand)" horizontal />
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 768px) { .analytics-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .stat-strip { grid-template-columns: repeat(2, 1fr) !important; } }
        .chart-bar:hover { opacity: 1 !important; }
        .chart-bar:hover + text { font-weight: 700 !important; }
      `}</style>
    </div>
  )
}

// Lightweight SVG bar chart — vertical or horizontal
function ChartBars({ values, maxValue, color, horizontal }: {
  values: { label: string; value: number }[]
  maxValue: number
  color: string
  horizontal?: boolean
}) {
  const W = horizontal ? 360 : 560
  const H = horizontal ? Math.max(160, values.length * 32) : 200
  const pad = horizontal ? { l: 120, r: 20, t: 10, b: 10 } : { l: 40, r: 10, t: 20, b: 40 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b

  if (horizontal) {
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 480 }}>
        {values.map((v, i) => {
          const barW = Math.max(2, (v.value / maxValue) * chartW)
          const y = pad.t + i * (chartH / values.length) + (chartH / values.length) * 0.1
          const h = (chartH / values.length) * 0.8
          return (
    <g key={i}>
      <text x={pad.l - 6} y={y + h / 2 + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize={11}>{v.label}</text>
      <rect className="chart-bar" x={pad.l} y={y} width={barW} height={h} rx={4} fill={color} opacity={0.7} style={{ transition: "opacity 0.15s" }}>
        <title>{v.label}: {formatCount(v.value)} plays</title>
      </rect>
      <text x={pad.l + barW + 6} y={y + h / 2 + 4} fill="var(--foreground)" fontSize={11} fontWeight={600}>{formatCount(v.value)}</text>
    </g>
          )
        })}
      </svg>
    )
  }

  const barW = Math.max(4, (chartW / values.length) * 0.6)
  const gap = chartW / values.length

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 560 }}>
      {values.map((v, i) => {
        const barH = Math.max(2, (v.value / maxValue) * chartH)
        const x = pad.l + i * gap + gap * 0.2
        return (
          <g key={i}>
            <rect className="chart-bar" x={x} y={pad.t + chartH - barH} width={barW} height={barH} rx={3} fill={color} opacity={0.7} style={{ transition: "opacity 0.15s" }}>
              <title>{v.label}: {formatCount(v.value)} plays</title>
            </rect>
            <text x={x + barW / 2} y={H - pad.b + 16} textAnchor="middle" fill="var(--muted-foreground)" fontSize={10} style={{ transform: "rotate(-30deg)", transformOrigin: `${x + barW / 2}px ${H - pad.b + 16}px` }}>{v.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
