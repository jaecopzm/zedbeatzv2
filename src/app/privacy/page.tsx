import type { Metadata } from "next"
import { SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: "Privacy Policy for ZedBeatz — how we collect, use, and protect your data.",
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

export default function PrivacyPage() {
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            Last updated: {new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Section title="Information We Collect">
          <p style={{ margin: 0 }}>We collect information you provide when creating an account, such as your email address and profile information. We also collect usage data including tracks you listen to, playlists you create, and interactions with the platform.</p>
        </Section>

        <Section title="How We Use Your Data">
          <p style={{ margin: 0 }}>Your data is used to provide and improve our music streaming service, personalise your experience, recommend music, and communicate with you about the platform.</p>
        </Section>

        <Section title="Data Sharing">
          <p style={{ margin: 0 }}>We do not sell your personal data. We may share anonymised analytics with partners and service providers essential to operating the platform (e.g., cloud hosting, analytics).</p>
        </Section>

        <Section title="Contact">
          <p style={{ margin: 0 }}>
            If you have questions about this policy, please{" "}
            <a href="/contact" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
              contact us
            </a>.
          </p>
        </Section>
      </div>
    </div>
  )
}
