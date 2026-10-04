import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for ZedBeatz — rules and guidelines for using the platform.",
  alternates: { canonical: `${SITE_URL}/terms` },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="doc-section">
      <h2 className="doc-h2">{title}</h2>
      <div className="doc-body">{children}</div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <div className="fade-in doc-page">
      <p className="doc-eyebrow">Legal</p>
      <h1 className="doc-title">Terms of Service</h1>
      <p className="doc-sub">
        Last updated: {new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <div className="doc-divider" />

      <Section title="Acceptance of Terms">
        <p className="doc-body">By using ZedBeatz, you agree to these terms. If you do not agree, do not use the service.</p>
      </Section>

      <Section title="User Responsibilities">
        <p className="doc-body">You are responsible for maintaining the confidentiality of your account. You agree not to misuse the platform, including attempting to circumvent streaming limits, uploading unauthorised content, or engaging in activities that disrupt the service.</p>
      </Section>

      <Section title="Content">
        <p className="doc-body">All music and content on ZedBeatz is provided for personal, non-commercial streaming. Artists retain ownership of their work.</p>
      </Section>

      <Section title="Contact">
        <p className="doc-body">
          Questions about these terms?{" "}
          <a href="/contact" className="doc-link">
            Get in touch
          </a>.
        </p>
      </Section>
    </div>
  )
}
