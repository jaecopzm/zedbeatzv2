"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

const txTypeLabel: Record<string, { label: string; color: string }> = {
  free_grant: { label: "Free Grant", color: "rgb(16,185,129)" },
  admin_grant: { label: "Admin Grant", color: "rgb(59,130,246)" },
  purchase: { label: "Purchase", color: "rgb(16,185,129)" },
  deduction: { label: "Upload", color: "rgb(239,68,68)" },
  admin_revoke: { label: "Admin Revoke", color: "rgb(239,68,68)" },
  refund: { label: "Refund", color: "rgb(59,130,246)" },
}

export default function CreditsPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["artist-credits"],
    queryFn: () => api.artistGetCredits(),
    enabled: !!user?.artist_id,
  })

  const balance = data?.balance
  const transactions: any[] = data?.transactions ?? []

  const numbers = [
    { label: "Airtel Money", number: "097 118 5807" },
    { label: "MTN MoMo", number: "096 584 1548" },
  ]

  return (
    <div className="credits-page">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Credits</h2>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
          1 credit = 1 track upload
        </p>
      </div>

      {/* ── Balance card ── */}
      {isLoading ? (
        <div className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 24 }} />
      ) : (
        <div style={{
          background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
          borderRadius: 16, padding: "28px 32px", marginBottom: 24,
          color: "#fff",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Available Credits</p>
          <p style={{ margin: 0, fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{balance?.balance ?? 0}</p>
          <div className="credits-balance-stats" style={{ display: "flex", gap: 24, marginTop: 16, opacity: 0.8, fontSize: 12 }}>
            <span>Granted: {balance?.lifetime_granted ?? 0}</span>
            <span>Purchased: {balance?.lifetime_purchased ?? 0}</span>
            <span>Used: {balance?.lifetime_spent ?? 0}</span>
            <span>Refunded: {balance?.lifetime_refunded ?? 0}</span>
          </div>
        </div>
      )}

      {/* ── Buy Credits — Manual ── */}
      <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Buy Credits</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--muted-foreground)" }}>
          Send mobile money to any of the numbers below, then send the payment screenshot on WhatsApp. We&apos;ll credit your account once verified.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {numbers.map((n) => (
            <div key={n.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--background)",
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{n.label}</p>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--brand)", letterSpacing: "1px", fontVariantNumeric: "tabular-nums" }}>
                {n.number}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          padding: "14px 18px", borderRadius: 12,
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(59,130,246)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgb(59,130,246)", flex: 1 }}>
            Send screenshot to WhatsApp: <span style={{ fontSize: 15 }}>097 118 5807</span>
          </span>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          Pricing: K30/credit (K28 each for 10+, K25 each for 20+, K20 each for 50+).
          Credits are added manually once payment is confirmed — usually within a few hours.
        </p>
      </div>

      {/* ── Transaction history ── */}
      <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: "20px 24px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Transaction History</h3>
        {transactions.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>No transactions yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {transactions.map((tx: any) => {
              const info = txTypeLabel[tx.type] ?? { label: tx.type, color: "var(--muted-foreground)" }
              return (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10, transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: tx.amount > 0 ? "rgb(16,185,129)" : "rgb(239,68,68)",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                      {info.label}{tx.description ? ` — ${tx.description}` : ""}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: tx.amount > 0 ? "rgb(16,185,129)" : "rgb(239,68,68)",
                  }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .credits-page .credits-balance-stats { flex-wrap: wrap; gap: 8px 16px; }
        }
      `}</style>
    </div>
  )
}
