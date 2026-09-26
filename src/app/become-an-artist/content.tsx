"use client"

import Link from "next/link"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="doc-section">
      <h2 className="doc-h2">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

export default function BecomeArtistContent() {
  return (
    <div className="fade-in doc-page">
      <p className="doc-eyebrow">Artists</p>
      <h1 className="doc-title">Become an Artist</h1>
      <p className="doc-sub">
        Join Zambia&rsquo;s fastest-growing music platform and share your talent with thousands of listeners.
      </p>
      <div className="doc-divider" />

      <Section title="Why Join ZedBeatz?">
        <ul className="doc-list">
          <li>Upload unlimited music and release tracks, albums, and EPs</li>
          <li>Real-time analytics to track your streams, likes, and followers</li>
          <li>Claim your verified profile and stand out to fans</li>
          <li>Connect directly with your audience through fan messages</li>
          <li>5 free upload credits when you sign up</li>
        </ul>
      </Section>

      <Section title="How to Become an Artist">
        <ol className="doc-steps">
          <li><span><strong>Create your artist profile</strong> — head to our secure registration page.</span></li>
          <li><span><strong>Fill in your stage name</strong> — use the name you perform under (e.g., Yo Maps, Chef 187).</span></li>
          <li><span><strong>Add a photo</strong> — upload your artist headshot or logo (optional but recommended).</span></li>
          <li><span><strong>Verify your identity</strong> — we&rsquo;ll send a verification email to confirm your account.</span></li>
          <li><span><strong>Start uploading</strong> — once verified, upload your first track and start building your fanbase.</span></li>
        </ol>
      </Section>

      <Section title="Eligibility Requirements">
        <p className="doc-body">Anyone can become an artist on ZedBeatz. We welcome:</p>
        <ul className="doc-list">
          <li>Singers, rappers, producers, and composers</li>
          <li>Independent artists and music groups</li>
          <li>Aspiring talent looking to grow their audience</li>
        </ul>
        <p className="doc-body">You must be at least 16 years old to create an artist profile. If under 18, parental consent is required.</p>
      </Section>

      <Section title="Ready to start your journey?">
        <p className="doc-body">Join thousands of Zambian artists already sharing their music on ZedBeatz.</p>
        <Link href="/artist/register" className="doc-cta">
          Create Artist Profile
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </Section>
    </div>
  )
}
