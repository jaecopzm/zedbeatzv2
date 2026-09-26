#!/usr/bin/env node
/**
 * Bulk URL Inspection for play.zedbeatz.com — the "lazy" replacement for
 * clicking Inspect > Request Indexing 200+ times in Search Console.
 *
 * What it does:
 *  1. Fetches your /sitemap.xml (or /rss.xml) to get all track/artist/album URLs
 *  2. Calls the Search Console URL Inspection API for each URL (2,000 quota/day)
 *  3. Prints index status so you can see what's actually blocked
 *
 * Setup (one time, ~5 min):
 *  1. Google Cloud Console > Enable "Search Console API" +
 *     "Web Search Indexing URL Inspection API" for your project
 *  2. Create OAuth Client ID (Desktop) > download JSON
 *  3. Get an access token with Search Console scope:
 *       gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters
 *       GSC_ACCESS_TOKEN=$(gcloud auth application-default print-access-token)
 *     Or use OAuth Playground (scope: https://www.googleapis.com/auth/webmasters)
 *  4. Run:
 *       SITE_URL=https://play.zedbeatz.com \
 *       GSC_SITE=sc-domain:zedbeatz.com \
 *       GSC_ACCESS_TOKEN=ya29... \
 *       node scripts/gsc-bulk-inspect.mjs
 *
 *     If your GSC property is URL-prefix (https://play.zedbeatz.com/), set:
 *       GSC_SITE=https://play.zedbeatz.com/
 *
 * Options via env:
 *  SITE_URL=https://play.zedbeatz.com  source of sitemap.xml (default)
 *  SOURCE=sitemap|rss                   use sitemap.xml or rss.xml (default: sitemap)
 *  LIMIT=200                            max URLs per run (default: 500)
 *  OFFSET=0                             skip first N (for paging through quota)
 *  DELAY_MS=1200                        delay between calls to avoid 429 (default: 1200)
 *  FILTER=/track/                       only inspect URLs containing this string
 */

const SITE_URL = (process.env.SITE_URL || "https://play.zedbeatz.com").replace(/\/+$/, "");
const GSC_SITE = process.env.GSC_SITE || "https://play.zedbeatz.com/";
const TOKEN = process.env.GSC_ACCESS_TOKEN;
const SOURCE = process.env.SOURCE || "sitemap";
const LIMIT = parseInt(process.env.LIMIT || "500", 10);
const OFFSET = parseInt(process.env.OFFSET || "0", 10);
const DELAY_MS = parseInt(process.env.DELAY_MS || "1200", 10);
const FILTER = process.env.FILTER || "";

if (!TOKEN) {
  console.error("Missing GSC_ACCESS_TOKEN. See header comments for setup.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getUrls() {
  const src = SOURCE === "rss" ? `${SITE_URL}/rss.xml` : `${SITE_URL}/sitemap.xml`;
  console.log(`Fetching ${src} ...`);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
  const xml = await res.text();
  // sitemap.xml from Next can be an index (<sitemap><loc>) — follow it
  const sitemapLocs = [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  let locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (sitemapLocs.length > 0 && locs.length <= sitemapLocs.length) {
    // It's an index — fetch children
    locs = [];
    for (const s of sitemapLocs) {
      const r = await fetch(s);
      if (!r.ok) continue;
      const x = await r.text();
      locs.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }
  }
  // RSS fallback: <link> tags
  if (locs.length === 0) {
    locs = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1].trim());
  }
  let urls = [...new Set(locs)].filter((u) => u.startsWith(SITE_URL));
  if (FILTER) urls = urls.filter((u) => u.includes(FILTER));
  return urls;
}

async function inspect(url) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: GSC_SITE }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { url, error: body?.error?.message || `HTTP ${res.status}` };
  }
  const r = body.inspectionResult || {};
  return {
    url,
    indexStatus: r.indexStatusResult?.verdict,
    coverageState: r.indexStatusResult?.coverageState,
    robotsTxtState: r.indexStatusResult?.robotsTxtState,
    indexingState: r.indexStatusResult?.indexingState,
    pageFetchState: r.indexStatusResult?.pageFetchState,
    lastCrawlTime: r.indexStatusResult?.lastCrawlTime,
  };
}

const urls = await getUrls();
console.log(`Found ${urls.length} URLs. Inspecting ${OFFSET}..${OFFSET + LIMIT}`);
const slice = urls.slice(OFFSET, OFFSET + LIMIT);

let ok = 0, notIndexed = 0, errors = 0;
for (let i = 0; i < slice.length; i++) {
  const url = slice[i];
  const result = await inspect(url);
  if (result.error) {
    errors++;
    console.log(`[${OFFSET + i + 1}/${urls.length}] ERROR ${url} :: ${result.error}`);
    if (result.error.includes("Quota") || result.error.includes("429")) {
      console.log("Quota hit — resume later with OFFSET=" + (OFFSET + i));
      break;
    }
  } else {
    const cov = result.coverageState || "";
    const isIndexed = /indexed/i.test(cov) && !/not indexed/i.test(cov);
    const isDiscovered = /discovered/i.test(cov);
    const label = isIndexed ? "INDEXED " : isDiscovered ? "DISCOVRD" : "UNKNOWN ";
    if (isIndexed) ok++; else notIndexed++;
    console.log(
      `[${OFFSET + i + 1}/${urls.length}] ${label} ${url} :: ${result.coverageState || result.indexStatus} / fetch=${result.pageFetchState}`
    );
  }
  await sleep(DELAY_MS);
}

console.log(`\nDone. indexed=${ok} not-indexed=${notIndexed} errors=${errors}` +
  (notIndexed > 0 ? "\nNOT-IDX pages usually need the SSR fix (deployed now) + internal links, not more submits." : ""));
