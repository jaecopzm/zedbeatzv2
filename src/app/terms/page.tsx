import type { Metadata } from "next"
import { SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: "Terms of Service for ZedBeatz — rules and guidelines for using the platform.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: "var(--brand)", flexShrink: 0 }} />
        <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 13, fontSize: 14, lineHeight: 1.7, color: "var(--muted-foreground)" }}>
        {children}
      </div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <div className="fade-in" style={{ padding: "48px 28px 64px" }}>
      <div style={{
        background: "var(--card-bg)",
        borderRadius: 16,
        border: "1px solid color-mix(in srgb, var(--muted-foreground) 12%, transparent)",
        padding: "40px 44px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid color-mix(in srgb, var(--muted-foreground) 10%, transparent)" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, var(--brand-bg), var(--brand))",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            Last updated: {new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Section title="Acceptance of Terms">
          <p style={{ margin: 0 }}>By using ZedBeatz, you agree to these terms. If you do not agree, do not use the service.</p>
        </Section>

        <Section title="User Responsibilities">
          <p style={{ margin: 0 }}>You are responsible for maintaining the confidentiality of your account. You agree not to misuse the platform, including attempting to circumvent streaming limits, uploading unauthorised content, or engaging in activities that disrupt the service.</p>
        </Section>

        <Section title="Content">
          <p style={{ margin: 0 }}>All music and content on ZedBeatz is provided for personal, non-commercial streaming. Artists retain ownership of their work.</p>
        </Section>

        <Section title="Contact">
          <p style={{ margin: 0 }}>
            Questions about these terms?{" "}
            <a href="/contact" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
              Get in touch
            </a>.
          </p>
        </Section>
      </div>
    </div>
  )
}
