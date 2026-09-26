import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ToastContainer } from "@/components/toast-container"
import { KeyboardShortcuts } from "@/lib/keyboard-shortcuts"
import { ThemeInit } from "@/lib/theme-store"
import { AppShell } from "@/components/app-shell"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TITLE, SITE_KEYWORDS } from "@/lib/seo"

const inter = Inter({ subsets: ["latin"], display: "swap" })
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", variable: "--font-display" })

const preInit = `(function(){try{var t=localStorage.getItem("zedbeatz_theme")||((window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"dark"));document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`

const titleTemplate = `%s | ${SITE_NAME}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: titleTemplate,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.png", sizes: "432x400", type: "image/png" }],
    apple: "/logo-white.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_ZM",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  keywords: SITE_KEYWORDS,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION
      ? {
          other: {
            "facebook-domain-verification": process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION,
          },
        }
      : {}),
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const apiOrigin = (() => {
    try {
      const u = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
      return new URL(u.replace(/\/api\/.*/, "")).origin
    } catch {
      return "http://localhost:8080"
    }
  })()

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-white.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      "https://www.youtube.com/@zedbeatzm",
      "https://web.facebook.com/profile.php?id=61579237109236",
      "https://whatsapp.com/channel/0029VbBhHE70LKZJPRGmBL35",
      "https://www.instagram.com/zedbeatzm/",
    ],
  }

  return (
    <html lang="en" className={`${inter.className} ${grotesk.variable}`} style={{ height: "100%", overflow: "hidden" }} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {apiOrigin && (
          <>
            <link rel="dns-prefetch" href={apiOrigin} />
            <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
          </>
        )}
        <script dangerouslySetInnerHTML={{ __html: preInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-LD26CHY2WQ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-LD26CHY2WQ');`}
        </Script>
      </head>
      <body style={{ display: "flex", flexDirection: "column", height: "100%", margin: 0, overflow: "hidden" }}>
        <Providers>
          <ThemeInit />
          <KeyboardShortcuts />
          <AppShell>
            {children}
          </AppShell>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
