"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"

const GRANT_OPTIONS = [1, 5, 10, 25, 50, 100]
const REVOKE_OPTIONS = [1, 5, 10, 25]

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

  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ["admin-artists"],
    queryFn: () => api.adminListArtists(),
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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
          Manage Credits
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "4px 0 0" }}>
          Select an artist to view balance, transaction history, and manage credits
        </p>
      </div>

      {!selectedArtist ? (
        <>
          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artist by name or email..."
              style={{
                width: "100%", maxWidth: 420, padding: "12px 16px", borderRadius: 12,
                border: "1.5px solid var(--border)", background: "var(--background)",
                color: "var(--foreground)", fontSize: 14, outline: "none",
                transition: "border-color 0.15s ease",
              }}
            />
          </div>

          {/* Artist Grid */}
          {artistsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />
              ))}
            </div>
          ) : filteredArtists.length === 0 ? (
            <div style={{
              background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
              padding: "48px 24px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 14,
            }}>
              {search.trim() ? "No matching artists found." : "No artists registered yet."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filteredArtists.map((artist: any) => (
                <button
                  key={artist.id}
                  onClick={() => setSelectedArtist(artist.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "var(--card-bg)", border: "1.5px solid var(--border)", borderRadius: 14,
                    padding: "16px 18px", cursor: "pointer", textAlign: "left",
                    transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.15s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)"
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"
                    e.currentTarget.style.borderColor = "var(--brand)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                    e.currentTarget.style.borderColor = "var(--border)"
                  }}
                >
                  {artist.photo_url ? (
                    <img
                      src={artist.photo_url}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                    }}>
                      {artist.stage_name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {artist.stage_name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                      {artist.verified ? "Verified" : "Artist"}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="fade-in">
          {/* Artist Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
            background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
            padding: "20px 24px",
          }}>
            {selectedArtistData?.photo_url ? (
              <img
                src={selectedArtistData.photo_url}
                alt=""
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 22, fontWeight: 700, border: "2px solid var(--border)",
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
              onClick={() => { setSelectedArtist(""); setTxFilter("all") }}
              style={{
                padding: "8px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Change Artist
            </button>
          </div>

          {/* Balance Card */}
          {creditsLoading ? (
            <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 24 }} />
          ) : bal ? (
            <div style={{
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)",
              borderRadius: 16, padding: "28px 32px", marginBottom: 24,
              color: "#fff", boxShadow: "0 8px 24px rgba(252, 60, 68, 0.2)",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Available Credits</p>
              <p style={{ margin: 0, fontSize: 48, fontWeight: 900, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {formatNumber(bal.balance)}
              </p>
              <div style={{ display: "flex", gap: 24, marginTop: 16, opacity: 0.9, fontSize: 13, flexWrap: "wrap" }}>
                <span>Granted: {formatNumber(bal.lifetime_granted)}</span>
                <span>Purchased: {formatNumber(bal.lifetime_purchased)}</span>
                <span>Spent: {formatNumber(bal.lifetime_spent)}</span>
                <span>Refunded: {formatNumber(bal.lifetime_refunded ?? 0)}</span>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Granted", value: bal.lifetime_granted, color: "rgb(16,185,129)" },
                { label: "Purchased", value: bal.lifetime_purchased, color: "rgb(59,130,246)" },
                { label: "Spent", value: bal.lifetime_spent, color: "rgb(239,68,68)" },
                { label: "Refunded", value: bal.lifetime_refunded ?? 0, color: "rgb(168,85,247)" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14,
                  padding: "18px 20px",
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: stat.color, fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(stat.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Grant + Revoke */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Grant form */}
            <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--border)", padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(16,185,129)" strokeWidth="2.2" strokeLinecap="round"><polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" /></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Grant Credits</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {GRANT_OPTIONS.map((n) => (
                    <button key={n} onClick={() => { setGrantAmount(n); setCustomGrant("") }}
                      style={{
                        padding: "7px 16px", borderRadius: 999, fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                        border: grantAmount === n && !isGrantCustom ? "2px solid rgb(16,185,129)" : "1.5px solid var(--border)",
                        background: grantAmount === n && !isGrantCustom ? "rgba(16,185,129,0.08)" : "transparent",
                        color: grantAmount === n && !isGrantCustom ? "rgb(16,185,129)" : "var(--foreground)",
                        cursor: "pointer", transition: "all 0.12s ease",
                      }}>
                      {n}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={customGrant}
                    onChange={(e) => handleGrantCustom(e.target.value)}
                    placeholder="Custom"
                    style={{
                      width: 85, padding: "7px 10px", borderRadius: 999, border: isGrantCustom ? "2px solid rgb(16,185,129)" : "1.5px solid var(--border)",
                      background: isGrantCustom ? "rgba(16,185,129,0.08)" : "transparent",
                      color: isGrantCustom ? "rgb(16,185,129)" : "var(--foreground)",
                      fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit", textAlign: "center",
                    }}
                  />
                </div>
                <input value={grantReason} onChange={(e) => setGrantReason(e.target.value)} placeholder="Reason for grant" style={{
                  padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                  background: "var(--background)", color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit",
                  transition: "border-color 0.15s ease",
                }} />
                <button onClick={() => grantMut.mutate()} disabled={grantMut.isPending || !selectedArtist}
                  style={{
                    padding: "11px 20px", borderRadius: 999, border: "none",
                    background: grantMut.isPending ? "var(--border)" : "rgb(16,185,129)", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: grantMut.isPending ? "default" : "pointer", fontFamily: "inherit",
                    transition: "opacity 0.15s ease, transform 0.1s ease",
                  }}>
                  {grantMut.isPending ? "Granting..." : `Grant ${formatNumber(grantAmount)} Credit${grantAmount === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>

            {/* Revoke form */}
            <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--border)", padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="2.2" strokeLinecap="round"><polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" /></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Revoke Credits</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {REVOKE_OPTIONS.map((n) => (
                    <button key={n} onClick={() => { setRevokeAmount(n); setCustomRevoke("") }}
                      style={{
                        padding: "7px 16px", borderRadius: 999, fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                        border: revokeAmount === n && !isRevokeCustom ? "2px solid rgb(239,68,68)" : "1.5px solid var(--border)",
                        background: revokeAmount === n && !isRevokeCustom ? "rgba(239,68,68,0.08)" : "transparent",
                        color: revokeAmount === n && !isRevokeCustom ? "rgb(239,68,68)" : "var(--foreground)",
                        cursor: "pointer", transition: "all 0.12s ease",
                      }}>
                      {n}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={customRevoke}
                    onChange={(e) => handleRevokeCustom(e.target.value)}
                    placeholder="Custom"
                    style={{
                      width: 85, padding: "7px 10px", borderRadius: 999, border: isRevokeCustom ? "2px solid rgb(239,68,68)" : "1.5px solid var(--border)",
                      background: isRevokeCustom ? "rgba(239,68,68,0.08)" : "transparent",
                      color: isRevokeCustom ? "rgb(239,68,68)" : "var(--foreground)",
                      fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit", textAlign: "center",
                    }}
                  />
                </div>
                <input value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Reason for revoke" style={{
                  padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                  background: "var(--background)", color: "var(--foreground)", fontSize: 13, outline: "none", fontFamily: "inherit",
                  transition: "border-color 0.15s ease",
                }} />
                <button onClick={() => revokeMut.mutate()} disabled={revokeMut.isPending || !selectedArtist}
                  style={{
                    padding: "11px 20px", borderRadius: 999, border: "none",
                    background: revokeMut.isPending ? "var(--border)" : "rgb(239,68,68)", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: revokeMut.isPending ? "default" : "pointer", fontFamily: "inherit",
                    transition: "opacity 0.15s ease, transform 0.1s ease",
                  }}>
                  {revokeMut.isPending ? "Revoking..." : `Revoke ${formatNumber(revokeAmount)} Credit${revokeAmount === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--border)", padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Transaction History</h3>
              <div style={{ display: "flex", gap: 6, background: "var(--background)", borderRadius: 999, padding: 3 }}>
                {([
                  { key: "all", label: "All" },
                  { key: "grant", label: "Grants" },
                  { key: "revoke", label: "Revokes" },
                  { key: "deduction", label: "Uploads" },
                ] as { key: TxFilter; label: string }[]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTxFilter(f.key)}
                    style={{
                      padding: "5px 14px", borderRadius: 999, border: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                      background: txFilter === f.key ? "var(--brand-bg)" : "transparent",
                      color: txFilter === f.key ? "var(--brand)" : "var(--muted-foreground)",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {creditsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />
                ))}
              </div>
            ) : filteredTxs.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "32px 16px", color: "var(--muted-foreground)", fontSize: 13,
              }}>
                {txFilter === "all" ? "No transactions yet." : `No ${txFilter} transactions found.`}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%", borderCollapse: "collapse", fontSize: 13,
                }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>Type</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>Description</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>Amount</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.map((tx: any) => {
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
