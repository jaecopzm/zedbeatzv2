"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"
import { PillButton, FieldFrame, VerifiedBadge } from "@/components/artist/ui"

type Step = "idle" | "method" | "social" | "manual" | "submitted"

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
]

/* ─── Loading skeleton ─── */

function Skeleton() {
  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: "50%", height: 22, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "30%", height: 14 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "100%", height: 160, borderRadius: 16 }} />
    </div>
  )
}

/* ─── Step indicator ─── */

const steps = [
  { key: "idle", label: "Start" },
  { key: "method", label: "Method" },
  { key: "social", label: "Verify" },
  { key: "submitted", label: "Done" },
] as const

function stepIndex(s: Step): number {
  if (s === "social" || s === "manual") return 2
  const idx = steps.findIndex((x) => x.key === s)
  return Math.max(0, idx)
}

function StepBar({ current }: { current: Step }) {
  const idx = stepIndex(current)
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        marginBottom: 32,
      }}
    >
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              background: i <= idx ? "var(--brand)" : "var(--border)",
              color: i <= idx ? "#fff" : "var(--muted-foreground)",
              transition: "background 0.2s",
            }}
          >
            {i < idx ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 48,
                height: 2,
                background: i < idx ? "var(--brand)" : "var(--border)",
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Trust signal icons ─── */

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function UserCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  )
}

/* ─── Main component ─── */

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<Step>("idle")
  const [method, setMethod] = useState<"social_media" | "manual_review" | "">("")
  const [platform, setPlatform] = useState("")
  const [postUrl, setPostUrl] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [claimId, setClaimId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const codeRef = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState(false)

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: () => api.getArtist(id),
    enabled: !!id,
  })

  const { data: claimStatus, refetch: refetchClaim } = useQuery({
    queryKey: ["claim-status", id],
    queryFn: () => api.getClaimStatus(id),
    enabled: !!id,
  })

  const initiateMutation = useMutation({
    mutationFn: () => api.initiateClaim(id, method),
    onSuccess: (data) => {
      setClaimId(data.id)
      if (method === "social_media") setStep("social")
      else setStep("manual")
      setError("")
    },
    onError: (err: { message?: string }) => {
      setError(err?.message || "Failed to initiate claim")
    },
  })

  const submitSocialMutation = useMutation({
    mutationFn: () => api.submitSocialVerification(claimId!, platform, postUrl),
    onSuccess: () => {
      setStep("submitted")
      refetchClaim()
    },
    onError: (err: { message?: string }) => {
      setError(err?.message || "Failed to submit verification")
    },
  })

  const submitManualMutation = useMutation({
    mutationFn: () => api.submitDocuments(claimId!, files),
    onSuccess: () => {
      setStep("submitted")
      refetchClaim()
    },
    onError: (err: { message?: string }) => {
      setError(err?.message || "Failed to submit documents")
    },
  })

  const copyCode = useCallback(() => {
    const code = initiateMutation.data?.verification_code
    if (!code) return
    navigator.clipboard.writeText(String(code)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [initiateMutation.data?.verification_code])

  if (artistLoading) return <Skeleton />
  if (!artist) return <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>Artist not found</div>

  const existingClaim = claimStatus?.claimed ? claimStatus.claim : null
  // Auth state is restored from localStorage, so it differs from the server
  // prerender — gate auth branches until after hydration.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isAuthed = mounted && !!user

  const pageStyle: React.CSSProperties = {
    maxWidth: 560,
    margin: "0 auto",
    padding: "40px 20px 64px",
  }

  return (
    <div className="fade-in" style={pageStyle}>
      {/* Step bar — only show after authed and not on idle */}
      {isAuthed && !existingClaim && step !== "idle" && <StepBar current={step} />}

      {/* Artist header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
          padding: "20px 24px",
          background: "var(--card-bg)",
          borderRadius: 16,
          border: "1px solid var(--border)",
        }}
      >
        {artist.photo_url ? (
          <img
            src={artist.photo_url}
            alt={artist.stage_name}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {artist.stage_name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--foreground)",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            {artist.stage_name}
          </h1>
          {artist.verified && (
            <VerifiedBadge size="xs" withLabel variant="green" style={{ marginBottom: 0 }} />
          )}
          {artist.bio && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "var(--muted-foreground)",
                lineHeight: 1.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {artist.bio}
            </p>
          )}
        </div>
      </div>

      {!isAuthed && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.2)",
            fontSize: 13,
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>
            You need to{" "}
            <a href="/login" style={{ color: "var(--brand)", textDecoration: "underline", fontWeight: 600 }}>
              sign in
            </a>{" "}
            to claim this profile.
          </span>
        </div>
      )}

      {isAuthed && existingClaim && (
        <div style={{ marginBottom: 24 }}>
          <ClaimStatusDisplay claim={existingClaim} artistName={artist.stage_name} />
        </div>
      )}

      {isAuthed && !existingClaim && step === "idle" && (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 16,
            padding: "32px 28px",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--brand-bg)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              color: "var(--brand)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "var(--foreground)" }}>
            Claim this profile
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "0 0 24px", lineHeight: 1.5 }}>
            Are you {artist.stage_name}? Verify your identity to manage this
            artist profile, upload tracks, and access your dashboard.
          </p>
          <PillButton size="lg" onClick={() => setStep("method")}>
            Start verification
          </PillButton>
        </div>
      )}

      {isAuthed && !existingClaim && step === "method" && (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 16,
            padding: "32px 28px",
            border: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 20px", color: "var(--foreground)" }}>
            Choose verification method
          </h2>

          {/* Social Media */}
          <div
            onClick={() => setMethod("social_media")}
            style={{
              cursor: "pointer",
              borderRadius: 12,
              border: method === "social_media" ? "2px solid var(--brand)" : "1.5px solid var(--border)",
              background: method === "social_media" ? "var(--brand-bg)" : "var(--background)",
              padding: "16px 20px",
              marginBottom: 12,
              transition: "border-color 0.15s, background 0.15s",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: method === "social_media" ? "var(--brand)" : "var(--hover-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: method === "social_media" ? "#fff" : "var(--muted-foreground)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                Social Media Post
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                Post a verification code on your official Instagram, Twitter/X, Facebook, or TikTok account.
                We&apos;ll check the post exists and contains the code.
              </p>
            </div>
          </div>

          {/* Manual Review */}
          <div
            onClick={() => setMethod("manual_review")}
            style={{
              cursor: "pointer",
              borderRadius: 12,
              border: method === "manual_review" ? "2px solid var(--brand)" : "1.5px solid var(--border)",
              background: method === "manual_review" ? "var(--brand-bg)" : "var(--background)",
              padding: "16px 20px",
              marginBottom: 20,
              transition: "border-color 0.15s, background 0.15s",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: method === "manual_review" ? "var(--brand)" : "var(--hover-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: method === "manual_review" ? "#fff" : "var(--muted-foreground)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                Manual Review
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                Upload government ID or other documentation. An admin will review
                and approve your claim.
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <PillButton variant="ghost" size="md" onClick={() => setStep("idle")}>
              Back
            </PillButton>
            <PillButton
              size="md"
              onClick={() => initiateMutation.mutate()}
              disabled={!method || initiateMutation.isPending}
              loading={initiateMutation.isPending}
            >
              {initiateMutation.isPending ? "Processing..." : "Continue"}
            </PillButton>
          </div>
        </div>
      )}

      {isAuthed && step === "social" && claimId && (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 16,
            padding: "32px 28px",
            border: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 20px", color: "var(--foreground)" }}>
            Social Media Verification
          </h2>

          <div
            style={{
              background: "var(--hover-bg)",
              borderRadius: 12,
              padding: "18px 20px",
              marginBottom: 20,
            }}
          >
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              Post the following verification code on your official social media account, then paste the post URL below:
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--background)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <span
                ref={codeRef}
                style={{
                  flex: 1,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  letterSpacing: "0.08em",
                  color: "var(--brand)",
                }}
              >
                {String(initiateMutation.data?.verification_code ?? "")}
              </span>
              <button
                type="button"
                onClick={copyCode}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1.5px solid var(--border)",
                  background: "var(--card-bg)",
                  color: copied ? "#10b981" : "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "color 0.15s, border-color 0.15s",
                  ...(copied ? { borderColor: "#10b981" } : {}),
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <FieldFrame label="Platform">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--card-bg)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                  appearance: "auto",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-bg)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none" }}
              >
                <option value="">Select platform</option>
                {platformOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </FieldFrame>
          </div>

          <div style={{ marginBottom: 20 }}>
            <FieldFrame label="Post URL">
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://twitter.com/yourhandle/status/..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--card-bg)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-bg)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none" }}
              />
            </FieldFrame>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <PillButton variant="ghost" size="md" onClick={() => setStep("method")}>
              Back
            </PillButton>
            <PillButton
              size="md"
              onClick={() => submitSocialMutation.mutate()}
              disabled={!platform || !postUrl || submitSocialMutation.isPending}
              loading={submitSocialMutation.isPending}
            >
              {submitSocialMutation.isPending ? "Verifying..." : "Submit for review"}
            </PillButton>
          </div>
        </div>
      )}

      {isAuthed && step === "manual" && claimId && (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 16,
            padding: "32px 28px",
            border: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px", color: "var(--foreground)" }}>
            Manual Review
          </h2>

          <div
            style={{
              background: "var(--hover-bg)",
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 20,
              fontSize: 13,
              color: "var(--muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            Upload a clear photo of your government-issued ID (passport, NRC, or driver&apos;s license).
            An admin will review your documents manually. This typically takes 1–3 business days.
          </div>

          <div style={{ marginBottom: 20 }}>
            <FieldFrame label="Upload documents">
              <div
                style={{
                  border: files.length > 0 ? "2px solid var(--brand)" : "2px dashed var(--border)",
                  borderRadius: 12,
                  padding: files.length > 0 ? "14px 18px" : "28px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "var(--background)",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onClick={() => {
                  const input = document.getElementById("claim-file-input") as HTMLInputElement
                  input?.click()
                }}
              >
                <input
                  id="claim-file-input"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  style={{ display: "none" }}
                />
                {files.length > 0 ? (
                  <div style={{ textAlign: "left", fontSize: 14, color: "var(--foreground)", fontWeight: 500 }}>
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)", fontWeight: 400 }}>
                      Click or drop to change
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 8, color: "var(--muted-foreground)" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ display: "block", margin: "0 auto" }}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                      Click to upload documents
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                      PNG, JPG, PDF accepted
                    </p>
                  </>
                )}
              </div>
            </FieldFrame>
          </div>

          {/* Trust signals */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "14px 18px",
              borderRadius: 12,
              background: "var(--hover-bg)",
              marginBottom: 20,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your security
            </p>
            {[
              { icon: <ShieldIcon />, text: "Documents encrypted in transit and at rest" },
              { icon: <ClockIcon />, text: "Typically reviewed within 1–3 business days" },
              { icon: <UserCheckIcon />, text: "Your documents are never shared publicly" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--muted-foreground)" }}>
                <span style={{ flexShrink: 0, color: "var(--brand)", opacity: 0.8 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <PillButton variant="ghost" size="md" onClick={() => setStep("method")}>
              Back
            </PillButton>
            <PillButton
              size="md"
              onClick={() => submitManualMutation.mutate()}
              disabled={files.length === 0 || submitManualMutation.isPending}
              loading={submitManualMutation.isPending}
            >
              {submitManualMutation.isPending ? "Uploading..." : "Submit for review"}
            </PillButton>
          </div>
        </div>
      )}

      {step === "submitted" && (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 16,
            padding: "36px 28px",
            border: "1px solid rgba(16,185,129,0.2)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              color: "#10b981",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#10b981" }}>
            Verification submitted!
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "0 0 24px", lineHeight: 1.5, maxWidth: 380, display: "inline-block" }}>
            Your claim has been submitted for review. You&apos;ll be notified once it&apos;s approved.
            This typically takes 1–3 business days.
          </p>
          <div>
            <PillButton onClick={() => router.push(`/artist/${id}`)}>
              Back to artist profile
            </PillButton>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Claim status display ─── */

function ClaimStatusDisplay({
  claim,
  artistName,
}: {
  claim: import("@/types").Claim
  artistName: string
}) {
  const statusMeta: Record<string, { label: string; border: string; bg: string; fg: string }> = {
    pending: {
      label: "Pending",
      border: "rgba(234,179,8,0.2)",
      bg: "rgba(234,179,8,0.08)",
      fg: "#ca8a04",
    },
    under_review: {
      label: "Under Review",
      border: "rgba(59,130,246,0.2)",
      bg: "rgba(59,130,246,0.08)",
      fg: "#3b82f6",
    },
    approved: {
      label: "Approved ✓",
      border: "rgba(16,185,129,0.2)",
      bg: "rgba(16,185,129,0.08)",
      fg: "#10b981",
    },
    rejected: {
      label: "Rejected",
      border: "rgba(239,68,68,0.2)",
      bg: "rgba(239,68,68,0.08)",
      fg: "#ef4444",
    },
  }

  const meta = statusMeta[claim.status]
  const statusText = meta?.label ?? claim.status

  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: 16,
        padding: "24px 28px",
        border: `1px solid ${meta?.border ?? "var(--border)"}`,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--foreground)" }}>
        Claim Status
      </h2>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 999,
          background: meta?.bg ?? "var(--hover-bg)",
          color: meta?.fg ?? "var(--muted-foreground)",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {claim.status === "approved" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {statusText}
      </div>

      {claim.method === "social_media" && claim.verification_code && (
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--muted-foreground)" }}>
          Verification code:{" "}
          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
            {claim.verification_code}
          </span>
        </p>
      )}

      {claim.status === "pending" && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          Follow the instructions provided to complete verification for {artistName}.
        </p>
      )}

      {claim.status === "under_review" && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          Your verification is being reviewed by our team. This typically takes 1–3 business days.
        </p>
      )}

      {claim.status === "approved" && (
        <p style={{ margin: 0, fontSize: 13, color: "#10b981", lineHeight: 1.5 }}>
          Congratulations! You are now verified as {artistName}. You can now manage your profile,
          upload tracks, and view analytics.
        </p>
      )}

      {claim.status === "rejected" && (
        <>
          {claim.rejection_reason && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
                marginBottom: 10,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: "#ef4444", fontWeight: 500 }}>
                Reason: {claim.rejection_reason}
              </p>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
            You can re-apply with additional verification.
          </p>
        </>
      )}

      {claim.social_platform && claim.social_post_url && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--muted-foreground)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>Platform: <strong style={{ color: "var(--foreground)" }}>{claim.social_platform}</strong></span>
          <span>·</span>
          <a
            href={claim.social_post_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--brand)",
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            View post
          </a>
        </div>
      )}
    </div>
  )
}
