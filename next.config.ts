import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "http://localhost:8080";

// Strict CSP in production; permissive in dev (ngrok, etc.)
const connectSrc = isDev ? "'self' http: https: wss:" : `'self' ${apiOrigin} https: wss:`;

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  media-src 'self' https:;
  font-src 'self' data:;
  connect-src ${connectSrc};
  frame-ancestors 'none';
`;

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["prescholastic-preabundantly-erline.ngrok-free.dev"],
  poweredByHeader: false,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp.replace(/\s{2,}/g, " ").trim() },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/:all(logo|favicon|manifest)\\.(png|ico|json)$",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8080/api/v1/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:8080/auth/:path*",
      },
    ];
  },
  experimental: {
    proxyTimeout: 10 * 60 * 1000,
  },
};

export default nextConfig;