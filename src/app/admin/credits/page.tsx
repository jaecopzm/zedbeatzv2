"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Pagination } from "@/components/admin/pagination"

const GRANT_OPTIONS = [1, 5, 10, 25, 50, 100]
const REVOKE_OPTIONS = [1, 5, 10, 25]
const TX_PAGE_SIZE = 20

const txTypeLabel: Record<string, { label: string; color: string; bg: string }> = {
  free_grant: { label: "Free Grant", color: "rgb(16,185,129)", bg: "rgba(16,185,129,0.1)" },
  admin_grant: { label: "Admin Grant", color: "rgb(59,130,246)", bg: "rgba(59,130,246,0.1)" },
  purchase: { label: "Purchase", color: "rgb(16,185,129)", bg: "rgba(16,185,129,0.1)" },
  deduction: { label: "Upload", color: "rgb(239,68,68)", bg: "rgba(239,68,68,0.1)" },
  admin_revoke: { label: "Admin Revoke", color: "rgb(239,68,68)", bg: "rgba(239,68,68,0.1)" },
  refund: { label: "Refund", color: "rgb(59,130,246)", bg: "rgba(59,130,246,0.1)" },
}

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })
}

type TxFilter = "all" | "grant" | "revoke" | "deduction"

export default function AdminCreditsPage() {
  const [search, setSearch] = useState("")
  const [selectedArtist, setSelectedArtist] = useState<string>("")
  const [grantAmount, setGrantAmount] = useState(1)
  const [grantReason, setGrantReason] = useState("")
  const [revokeAmount, setRevokeAmount] = useState(1)
  const [revokeReason, setRevokeReason] = useState("")
  const [customGrant, setCustomGrant] = useState("")
  const [customRevoke, setCustomRevoke] = useState("")
  const [txFilter, setTxFilter] = useState<TxFilter>("all")
  const [txPage, setTxPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<"grant" | "revoke" | null>(null)

  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(5000, 0),
  })

  const filteredArtists = useMemo(() => {
    const list = artistsData?.artists ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((a: any) =>
      a.stage_name.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)),
    )
  }, [artistsData, search])

  const { data: creditData, refetch: refetchCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ["admin-artist-credits", selectedArtist],
    queryFn: () => api.adminGetArtistCredits(selectedArtist),
    enabled: !!selectedArtist,
  })

  const grantMut = useMutation({
    mutationFn: () => api.adminGrantCredits(selectedArtist, grantAmount, grantReason || "admin grant"),
    onSuccess: () => {
      refetchCredits()
      toast(`${grantAmount} credit${grantAmount === 1 ? "" : "s"} granted`, "success")
      setGrantReason("")
      setCustomGrant("")
      setConfirmAction(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to grant credits", "error"),
  })

  const revokeMut = useMutation({
    mutationFn: () => api.adminRevokeCredits(selectedArtist, revokeAmount, revokeReason || "admin revoke"),
    onSuccess: () => {
      refetchCredits()
      toast(`${revokeAmount} credit${revokeAmount === 1 ? "" : "s"} revoked`, "success")
      setRevokeReason("")
      setCustomRevoke("")
      setConfirmAction(null)
    },
    onError: (e: any) => toast(e?.message || "Failed to revoke credits", "error"),
  })

  const bal = creditData?.balance
  const allTxs: any[] = creditData?.transactions ?? []

  const filteredTxs = useMemo(() => {
    if (txFilter === "all") return allTxs
    if (txFilter === "grant") return allTxs.filter((tx: any) => tx.amount > 0 && tx.type !== "refund" && tx.type !== "deduction")
    if (txFilter === "revoke") return allTxs.filter((tx: any) => tx.amount < 0)
    if (txFilter === "deduction") return allTxs.filter((tx: any) => tx.type === "deduction")
    return allTxs
  }, [allTxs, txFilter])

  const pageTxs = useMemo(() => {
    const start = (txPage - 1) * TX_PAGE_SIZE
    return filteredTxs.slice(start, start + TX_PAGE_SIZE)
  }, [filteredTxs, txPage])

  const handleGrantCustom = (val: string) => {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n > 0) {
      setGrantAmount(n)
      setCustomGrant(val)
    } else if (val === "") {
      setCustomGrant("")
    }
  }

  const handleRevokeCustom = (val: string) => {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n > 0) {
      setRevokeAmount(n)
      setCustomRevoke(val)
    } else if (val === "") {
      setCustomRevoke("")
    }
  }

  const isGrantCustom = !GRANT_OPTIONS.includes(grantAmount)
  const isRevokeCustom = !REVOKE_OPTIONS.includes(revokeAmount)

  const selectedArtistData = artistsData?.artists?.find((a: any) => a.id === selectedArtist)

  return (
    <div className="fade-in">
      <header className="admin-header">
        <div className="admin-header-text">
          <h1 className="admin-title">Credits</h1>
          <p className="admin-sub">
            {selectedArtist ? "Balance, grants, revokes and full history." : "Pick an artist to manage their credit balance."}
          </p>
        </div>
      </header>

      {!selectedArtist ? (
        <>
          {/* Search */}
          <div className="admin-toolbar">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artist…"
              className="admin-search"
              aria-label="Search artists"
            />
          </div>

          {/* Artist Grid */}
          {artistsLoading ? (
            <div className="admin-grid-stats">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14 }} />
              ))}
            </div>
          ) : filteredArtists.length === 0 ? (
            <div className="admin-empty" style={{ fontSize: 14 }}>
              {search.trim() ? "No matching artists found." : "No artists registered yet."}
            </div>
          ) : (
            <div className="admin-grid-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}>
              {filteredArtists.map((artist: any) => (
                <button
                  key={artist.id}
                  onClick={() => setSelectedArtist(artist.id)}
                  className="admin-card admin-card-lift"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    borderRadius: 14, padding: "13px 14px", cursor: "pointer", textAlign: "left",
                    width: "100%", fontFamily: "inherit",
                  }}
                >
                  {artist.photo_url ? (
                    <img
                      src={artist.photo_url}
                      alt=""
                      loading="lazy"
                      style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <div aria-hidden style={{
                      width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                      background: "var(--brand)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 15, fontWeight: 600,
                    }}>
                      {artist.stage_name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 13.5, fontWeight: 750, letterSpacing: "-0.01em", color: "var(--foreground)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {artist.stage_name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                      {artist.verified ? "Verified" : "Artist"}
                    </p>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Artist Header */}
          <div className="admin-card admin-list-row" style={{ padding: "16px 18px" }}>
            {selectedArtistData?.photo_url ? (
              <img
                src={selectedArtistData.photo_url}
                alt=""
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                background: "var(--brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 20, fontWeight: 600, border: "1px solid var(--border)",
              }}>
                {selectedArtistData?.stage_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.3px" }}>
                {selectedArtistData?.stage_name ?? "Unknown Artist"}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
                {selectedArtistData?.verified ? "Verified artist" : "Managing credits"}
              </p>
            </div>
            <button
              onClick={() => { setSelectedArtist(""); setTxFilter("all"); setTxPage(1) }}
              className="admin-btn-secondary"
              style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Change Artist
            </button>
          </div>

          {/* Balance Card */}
          {creditsLoading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 10 }} />
          ) : bal ? (
            <div className="admin-card" style={{ padding: "18px 20px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                Available credits
              </p>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums", color: "var(--foreground)" }}>
                {formatNumber(bal.balance)}
              </p>
              <div style={{ display: "flex", gap: "8px 20px", marginTop: 12, fontSize: 12.5, flexWrap: "wrap", fontVariantNumeric: "tabular-nums", color: "var(--muted-foreground)" }}>
                <span>Granted <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{formatNumber(bal.lifetime_granted)}</strong></span>
                <span>Purchased <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{formatNumber(bal.lifetime_purchased)}</strong></span>
                <span>Spent <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{formatNumber(bal.lifetime_spent)}</strong></span>
                <span>Refunded <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{formatNumber(bal.lifetime_refunded ?? 0)}</strong></span>
              </div>
            </div>
          ) : (
            <div style={{
              background: "var(--card-bg)", borderRadius: 16, padding: "28px 32px", marginBottom: 24,
              border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: 14,
            }}>
              No credit data available for this artist.
            </div>
          )}

          {/* Stats Row */}
          {bal && (
            <div className="admin-grid-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
              {[
                { label: "Granted", value: bal.lifetime_granted },
                { label: "Purchased", value: bal.lifetime_purchased },
                { label: "Spent", value: bal.lifetime_spent },
                { label: "Refunded", value: bal.lifetime_refunded ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="admin-card" style={{ padding: "14px 16px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(stat.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Grant + Revoke */}
          <div className="admin-grid-2" style={{ marginBottom: 4 }}>
            {/* Grant form */}
            <div className="admin-panel">
              <h3 style={{ margin: "0 0 14px", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>Grant credits</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="admin-chip-row" role="group" aria-label="Grant amount">
                  {GRANT_OPTIONS.map((n) => {
                    const selected = grantAmount === n && !isGrantCustom
                    return (
                      <button key={n} type="button" aria-pressed={selected} onClick={() => { setGrantAmount(n); setCustomGrant("") }}
                        className="admin-chip"
                        style={selected ? { borderColor: "#22c55e", background: "rgba(34,197,94,0.1)", color: "#16a34a" } : undefined}>
                        {n}
                      </button>
                    )
                  })}
                  <input
                    type="number"
                    min="1"
                    value={customGrant}
                    onChange={(e) => handleGrantCustom(e.target.value)}
                    placeholder="Custom"
                    aria-label="Custom grant amount"
                    className="admin-input"
                    style={{ width: 96, minHeight: 38, borderRadius: 999, textAlign: "center", fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
                <input value={grantReason} onChange={(e) => setGrantReason(e.target.value)} placeholder="Reason for grant" aria-label="Reason for grant" className="admin-input" />
                <button type="button" onClick={() => setConfirmAction("grant")} disabled={grantMut.isPending || !selectedArtist}
                  className="admin-btn-success admin-btn-block">
                  {grantMut.isPending ? "Granting…" : `Grant ${formatNumber(grantAmount)} credit${grantAmount === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>

            {/* Revoke form */}
            <div className="admin-panel">
              <h3 style={{ margin: "0 0 14px", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>Revoke credits</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="admin-chip-row" role="group" aria-label="Revoke amount">
                  {REVOKE_OPTIONS.map((n) => {
                    const selected = revokeAmount === n && !isRevokeCustom
                    return (
                      <button key={n} type="button" aria-pressed={selected} onClick={() => { setRevokeAmount(n); setCustomRevoke("") }}
                        className="admin-chip"
                        style={selected ? { borderColor: "#ef4444", background: "rgba(239,68,68,0.08)", color: "#ef4444" } : undefined}>
                        {n}
                      </button>
                    )
                  })}
                  <input
                    type="number"
                    min="1"
                    value={customRevoke}
                    onChange={(e) => handleRevokeCustom(e.target.value)}
                    placeholder="Custom"
                    aria-label="Custom revoke amount"
                    className="admin-input"
                    style={{ width: 96, minHeight: 38, borderRadius: 999, textAlign: "center", fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
                <input value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Reason for revoke" aria-label="Reason for revoke" className="admin-input" />
                <button type="button" onClick={() => setConfirmAction("revoke")} disabled={revokeMut.isPending || !selectedArtist}
                  className="admin-btn-danger admin-btn-block">
                  {revokeMut.isPending ? "Revoking…" : `Revoke ${formatNumber(revokeAmount)} credit${revokeAmount === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="admin-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--foreground)" }}>History</h3>
              <div className="admin-chip-row" role="group" aria-label="Filter transactions">
                {([
                  { key: "all", label: "All" },
                  { key: "grant", label: "Grants" },
                  { key: "revoke", label: "Revokes" },
                  { key: "deduction", label: "Uploads" },
                ] as { key: TxFilter; label: string }[]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setTxFilter(f.key); setTxPage(1) }}
                    aria-pressed={txFilter === f.key}
                    className={`admin-chip${txFilter === f.key ? " admin-chip-active" : ""}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {creditsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 38, borderRadius: 10 }} />
                ))}
              </div>
            ) : filteredTxs.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "32px 16px", color: "var(--muted-foreground)", fontSize: 13,
              }}>
                {txFilter === "all" ? "No transactions yet." : `No ${txFilter} transactions found.`}
              </div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                      Credit transactions for {selectedArtistData?.stage_name}
                    </caption>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Type</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Description</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Amount</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageTxs.map((tx: any) => {
                        const info = txTypeLabel[tx.type] ?? { label: tx.type || "Transaction", color: "var(--muted-foreground)", bg: "var(--hover-bg)" }
                        return (
                          <tr key={tx.id} style={{ transition: "background 0.1s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                          >
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                                color: info.color, background: info.bg,
                              }}>
                                {info.label}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", color: "var(--foreground)" }}>
                              {tx.description || "—"}
                            </td>
                            <td style={{
                              padding: "10px 12px", borderBottom: "1px solid var(--border)", textAlign: "right",
                              fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums",
                              color: tx.amount > 0 ? "rgb(16,185,129)" : "rgb(239,68,68)",
                            }}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </td>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--muted-foreground)", fontSize: 12, whiteSpace: "nowrap" }}>
                              {formatDate(tx.created_at)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={txPage} pageSize={TX_PAGE_SIZE} total={filteredTxs.length} onPageChange={setTxPage} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Grant confirmation */}
      <ConfirmDialog
        open={confirmAction === "grant"}
        title="Grant Credits"
        message={`Confirm granting ${formatNumber(grantAmount)} credit${grantAmount === 1 ? "" : "s"} to ${selectedArtistData?.stage_name ?? "this artist"}?`}
        confirmLabel="Grant Credits"
        destructive={false}
        onConfirm={() => grantMut.mutate()}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={confirmAction === "revoke"}
        title="Revoke Credits"
        message={`Confirm revoking ${formatNumber(revokeAmount)} credit${revokeAmount === 1 ? "" : "s"} from ${selectedArtistData?.stage_name ?? "this artist"}?`}
        confirmLabel="Revoke Credits"
        onConfirm={() => revokeMut.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
