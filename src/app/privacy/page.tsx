import type { Metadata } from "next"
import { SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: "Privacy Policy for ZedBeatz — how we collect, use, and protect your data.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="doc-section">
      <h2 className="doc-h2">{title}</h2>
      <div className="doc-body">{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="fade-in doc-page">
      <p className="doc-eyebrow">Legal</p>
      <h1 className="doc-title">Privacy Policy</h1>
      <p className="doc-sub">
        Last updated: {new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <div className="doc-divider" />

      <Section title="Information We Collect">
        <p className="doc-body">We collect information you provide when creating an account, such as your email address and profile information. We also collect usage data including tracks you listen to, playlists you create, and interactions with the platform.</p>
      </Section>

      <Section title="How We Use Your Data">
        <p className="doc-body">Your data is used to provide and improve our music streaming service, personalise your experience, recommend music, and communicate with you about the platform.</p>
      </Section>

      <Section title="Data Sharing">
        <p className="doc-body">We do not sell your personal data. We may share anonymised analytics with partners and service providers essential to operating the platform (e.g., cloud hosting, analytics).</p>
      </Section>

      <Section title="Contact">
        <p className="doc-body">
          If you have questions about this policy, please{" "}
          <a href="/contact" className="doc-link">
            contact us
          </a>.
        </p>
      </Section>
    </div>
  )
}
