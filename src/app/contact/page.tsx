import type { Metadata } from "next"
import { SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Contact Us | ${SITE_NAME}`,
  description: "Get in touch with the ZedBeatz team.",
}

const socials = [
  { label: "YouTube", href: "https://www.youtube.com/@zedbeatzm", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", color: "#FF0000" },
  { label: "Facebook", href: "https://web.facebook.com/profile.php?id=61579237109236", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", color: "#1877F2" },
  { label: "WhatsApp", href: "https://whatsapp.com/channel/0029VbBhHE70LKZJPRGmBL35", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z", color: "#25D366" },
]

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

export default function ContactPage() {
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
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Contact Us</h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            We&apos;d love to hear from you. Here&apos;s how to reach us.
          </p>
        </div>

        <Section title="Email">
          <p style={{ margin: 0 }}>
            <a href="mailto:hello@zedbeatz.com" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
              hello@zedbeatz.com
            </a>
            {" "}&mdash; general inquiries
          </p>
        </Section>

        <Section title="Support">
          <p style={{ margin: 0 }}>
            Having trouble with the platform? Reach out to{" "}
            <a href="mailto:support@zedbeatz.com" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
              support@zedbeatz.com
            </a>.
          </p>
        </Section>

        <Section title="Social">
          <style>{`
            .contact-social-link {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 8px 14px; border-radius: 8px;
              background: color-mix(in srgb, var(--muted-foreground) 6%, var(--card-bg));
              border: 1px solid color-mix(in srgb, var(--muted-foreground) 10%, transparent);
              color: var(--muted-foreground);
              text-decoration: none; font-size: 13px; font-weight: 500;
              transition: all 0.15s;
            }
            .contact-social-link:hover { color: #fff !important; }
            .contact-social-link.s-youtube:hover { background: #FF0000; border-color: #FF0000; }
            .contact-social-link.s-facebook:hover { background: #1877F2; border-color: #1877F2; }
            .contact-social-link.s-whatsapp:hover { background: #25D366; border-color: #25D366; }
          `}</style>
          <div style={{ display: "flex", gap: 12 }}>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={`contact-social-link s-${s.label.toLowerCase()}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.path} />
                </svg>
                {s.label}
              </a>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
