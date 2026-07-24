"use client"

import Link from "next/link"

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

export default function BecomeArtistContent() {
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
              <path d="M2 20a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2" />
              <path d="M20 20v-5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v5" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Become an Artist</h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            Join Zambia's fastest-growing music platform and share your talent with thousands of listeners.
          </p>
        </div>

        <Section title="Why Join ZedBeatz?">
          <ul style={{ margin: "0 0 12px 0", paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Upload unlimited music and release tracks, albums, and EPs</li>
            <li>Real-time analytics to track your streams, likes, and followers</li>
            <li>Claim your verified profile and stand out to fans</li>
            <li>Connect directly with your audience through fan messages</li>
            <li>5 free upload credits when you sign up</li>
          </ul>
        </Section>

        <Section title="How to Become an Artist">
          <ol style={{ margin: "0 0 12px 0", paddingLeft: 18, lineHeight: 1.8 }}>
            <li><strong>Click "Create Artist Profile" below</strong> — This takes you to our secure registration page.</li>
            <li><strong>Fill in your stage name</strong> — Use the name you perform under (e.g., Yo Maps, Chef 187).</li>
            <li><strong>Add a photo</strong> — Upload your artist headshot or logo (optional but recommended).</li>
            <li><strong>Verify your identity</strong> — We'll send a verification email to confirm your account.</li>
            <li><strong>Start uploading</strong> — Once verified, upload your first track and start building your fanbase.</li>
          </ol>
        </Section>

        <Section title="Eligibility Requirements">
          <p style={{ margin: "0 0 8px" }}>
            Anyone can become an artist on ZedBeatz. We welcome:
          </p>
          <ul style={{ margin: "0 0 12px 0", paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Singers, rappers, producers, and composers</li>
            <li>Independent artists and music groups</li>
            <li>Aspiring talent looking to grow their audience</li>
          </ul>
          <p style={{ margin: 0 }}>
            You must be at least 16 years old to create an artist profile. If under 18, parental consent is required.
          </p>
        </Section>

        <Section title="Ready to start your journey?">
          <p style={{ margin: "0 0 16px", color: "var(--brand)", fontWeight: 600 }}>
            Join thousands of Zambian artists already sharing their music on ZedBeatz.
          </p>
          <Link
            href="/artist/register"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 999,
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
              transition: "transform 0.1s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px var(--brand-shadow)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
          >
            Create Artist Profile
          </Link>
        </Section>
      </div>
    </div>
  )
}
