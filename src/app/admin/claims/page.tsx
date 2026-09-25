"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Claim } from "@/types"
import { AdminModal } from "@/components/admin/admin-modal"
import { Pagination } from "@/components/admin/pagination"

const PAGE_SIZE = 10

export default function AdminClaimsPage() {
  const queryClient = useQueryClient()
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionError, setActionError] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-claims", page],
    queryFn: () => api.adminListClaims(PAGE_SIZE, (page - 1) * PAGE_SIZE),
  })

  const approveMutation = useMutation({
    mutationFn: (claimId: string) => api.adminReviewClaim(claimId, "approve"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] })
      setSelectedClaim(null)
      setActionError("")
    },
    onError: (err: any) => {
      setActionError(err.message || "Failed to approve claim")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (claimId: string) =>
      api.adminReviewClaim(claimId, "reject", rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] })
      setSelectedClaim(null)
      setRejectReason("")
      setActionError("")
    },
    onError: (err: any) => {
      setActionError(err.message || "Failed to reject claim")
    },
  })

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.5px", margin: 0 }}>
          Artist Profile Claims
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: "4px 0 0 0" }}>
          Review and approve verification claims from artists asserting ownership
        </p>
      </div>

      {error && (
        <div style={{
          padding: "12px",
          borderRadius: "8px",
          background: "var(--brand-error-bg)",
          color: "#c53030",
          fontSize: "14px",
          border: "1px solid var(--brand-error-bg)",
          marginBottom: "16px",
        }}>
          {(error as any).message || "Failed to load claims"}
        </div>
      )}

      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton" style={{ height: "100px", width: "100%" }} />
          <div className="skeleton" style={{ height: "100px", width: "100%" }} />
        </div>
      )}

      {data && data.claims.length === 0 && !isLoading && (
        <div className="admin-empty">
          No pending claims found. All artist accounts are processed!
        </div>
      )}

      {data && data.claims.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted-foreground)", margin: 0 }}>
            {data.total} verification request{data.total !== 1 ? "s" : ""} pending review
          </p>
          {data.claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onReview={() => setSelectedClaim(claim)}
            />
          ))}
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </div>
      )}

      {/* Review modal */}
      <AdminModal open={!!selectedClaim} title="Review Verification Claim" onClose={() => { setSelectedClaim(null); setRejectReason(""); setActionError("") }} maxWidth={520}>
        {selectedClaim && (
          <>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 16px 0", letterSpacing: "-0.3px" }}>
                Review Verification Claim
              </h2>
              <div style={{
                display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px",
                padding: "16px", borderRadius: "10px", background: "var(--background)",
                border: "1px solid var(--border)", marginBottom: "4px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>Artist Target ID:</span>
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 600 }}>{selectedClaim.artist_id}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>Requesting User ID:</span>
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 600 }}>{selectedClaim.user_id}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>Verification Method:</span>
                  <span style={{
                    background: "var(--card-bg)", border: "1px solid var(--border)",
                    padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                  }}>
                    {selectedClaim.method.replace("_", " ")}
                  </span>
                </div>
                {selectedClaim.verification_code && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Verification Code:</span>
                    <span style={{ fontFamily: "monospace", color: "var(--active-fg)", fontWeight: 700, fontSize: "14px" }}>
                      {selectedClaim.verification_code}
                    </span>
                  </div>
                )}
                {selectedClaim.social_platform && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Social Platform:</span>
                    <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{selectedClaim.social_platform}</span>
                  </div>
                )}
                {selectedClaim.social_post_url && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Verification Post Link:</span>
                    <a
                      href={selectedClaim.social_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--active-fg)", wordBreak: "break-all", fontWeight: 500 }}
                    >
                      {selectedClaim.social_post_url}
                    </a>
                  </div>
                )}
                {selectedClaim.document_keys && selectedClaim.document_keys.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Uploaded Proofs:</span>
                    <span style={{ fontWeight: 600 }}>{selectedClaim.document_keys.length} File(s)</span>
                  </div>
                )}
              </div>

              {actionError && (
                <div style={{
                  padding: "8px 12px", borderRadius: "6px",
                  background: "var(--brand-error-bg)", color: "#c53030", fontSize: "12px", marginBottom: "8px",
                }}>
                  {actionError}
                </div>
              )}

              <div>
                <label className="admin-label">
                  Reject Feedback / Notes (Required if rejecting)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. The verification code is missing from the social post. Please update the post content..."
                  rows={3}
                  className="admin-input"
                />
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setSelectedClaim(null)
                  setRejectReason("")
                  setActionError("")
                }}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate(selectedClaim.id)}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="admin-btn-danger"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Claim"}
              </button>
              <button
                onClick={() => approveMutation.mutate(selectedClaim.id)}
                disabled={approveMutation.isPending}
                className="admin-btn-primary"
              >
                {approveMutation.isPending ? "Approving..." : "Approve & Verify"}
              </button>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  )
}

function ClaimCard({
  claim,
  onReview,
}: {
  claim: Claim
  onReview: () => void
}) {
  const isSocial = claim.method === "social_media"
  const methodIcon = isSocial ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )
  const methodLabel = isSocial ? "Social Verification" : "Manual Document Upload"

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ color: "var(--active-fg)", display: "flex", alignItems: "center" }}>
            {methodIcon}
          </span>
          <span style={{ fontSize: "13px", fontWeight: 650, color: "var(--foreground)" }}>
            {methodLabel}
          </span>
          <span style={{
            background: "var(--brand-bg)",
            color: "var(--active-fg)",
            fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
            padding: "2px 8px", borderRadius: "8px",
          }}>
            {claim.status.replace("_", " ")}
          </span>
        </div>

        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px", color: "var(--muted-foreground)" }}>
          {claim.verification_code && (
            <div>
              Code: <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--foreground)" }}>{claim.verification_code}</span>
            </div>
          )}
          {claim.social_platform && (
            <div>
              Platform: <span style={{ textTransform: "capitalize", fontWeight: 500, color: "var(--foreground)" }}>{claim.social_platform}</span>
            </div>
          )}
          {claim.social_post_url && (
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Post URL: <a href={claim.social_post_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--active-fg)", textDecoration: "underline" }}>{claim.social_post_url}</a>
            </div>
          )}
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "6px" }}>
          Submitted: {new Date(claim.created_at).toLocaleString()}
        </div>
      </div>

      <button onClick={onReview} className="admin-btn-primary" style={{ padding: "8px 16px", fontSize: 12, flexShrink: 0 }}>
        Review Claim
      </button>
    </div>
  )
}
