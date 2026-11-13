# Changelog

## 2.0.0 — 14 November 2026

Full rebuild of the TEMS Academy site as a framework-free static site generated from `data/*.json`. The live site remains the content baseline; see `AUDIT.md` for the live-vs-rebuilt comparison.

### Added

- **Home**
  - Champion-led hero using the real BdMO/Chairman photograph.
  - Four-number proof strip: IJSO 2025, 91+ Regional BdMO 2026, IMSO delegation, APhO 2026, each with a source label.
  - Interactive “Find your batch” for class, experience and subject, including on-hold and no-science-batch outcomes.
  - Filterable achievements wall with years, source labels and an accessible lightbox.
  - Five-stage SVG method: Foundation → Problem Solving → Advanced Training → Competition → Mentorship.
  - Parent section with FAQ, fee card, campus map and first-month timeline.
  - Sticky mobile action bar: Apply · WhatsApp · Call.
- **Class structure**
  - Interactive 3×3 division × tier grid.
  - Batch drawer with syllabus, session, fee, status and a sample problem.
  - Greyed Secondary Gamma and Secondary Alpha cells with the staffing reason.
  - Weekly timetable grouped into morning, mid-day and afternoon windows.
  - Promotion-path diagram Γ → Α → Σ with the monthly benchmark rule.
- **New pages**
  - `/pathway` — maths, physics, chemistry, biology and junior-science routes with official links.
  - `/sample-problems` — 32 original problems across Gamma/Alpha/Sigma with hints, worked solutions and KaTeX rendering.
  - `/resources` — official olympiad links and practical study guidance.
  - `/results` — three-year archive with source labels and an explicitly “Undated” group.
  - `/faculty` — teaching model and role descriptions without invented names or credentials.
  - `/admissions` — four-step placement process, first-month timeline and fee card.
  - `/contact` — campus map, visit guidance and email/WhatsApp/call actions.
  - `/terms`, `/privacy` — rewritten for the new form, Resend delivery and optional rate limiting.
  - `/404` — designed not-found page with useful links.
- **Application flow**
  - Same-origin `POST /api/apply` Cloudflare Pages Function.
  - Server-side validation, body-size limit, same-origin check, honeypot, minimum fill time and IP rate limiting (KV or in-memory).
  - Resend HTML/text email templates with the guardian as `reply-to`.
  - Success state, visible failure state and WhatsApp fallback.
  - No “within 24 hours” promise.
- **Content and SEO**
  - All content moved into `data/*.json`: site, pages, batches, achievements, results, gallery, FAQ, pathway, problems, resources, faculty, admissions, legal.
  - Unique title, description, canonical, Open Graph and Twitter metadata per page.
  - JSON-LD: organisation, courses, FAQ, breadcrumbs, item lists and page schema.
  - Sitemap, robots, web manifest, favicons and OG image.
  - Social card cropped from the real champion photograph.
- **Assets**
  - Responsive AVIF/WebP derivatives for all 17 photographs plus a small responsive logo set.
  - Self-hosted Source Serif 4, DM Sans and DM Mono WOFF2 files.
  - Self-hosted KaTeX CSS and fonts; KaTeX CSS is loaded only on the sample-problems page.
  - Font optical-size axes pinned to cut the largest font from 122 KB to 51 KB.
- **Tooling**
  - `scripts/build.mjs` orchestrator and `scripts/pages/*.mjs` page builders.
  - `scripts/lib/core.mjs` shared layout, metadata, header/footer, apply modal, lightbox and picture helper.
  - `scripts/check.mjs` pre-flight validator.
  - `scripts/serve.mjs` clean-URL preview server with gzip and a mock apply endpoint.
  - `scripts/prepare-images.py` responsive image, OG image and icon generation.
  - `scripts/prepare-fonts.py` optical-size pinning.
  - `npm run build`, `npm run check`, `npm run dev`, `npm run serve`, `npm run images`, `npm run fonts`.
- **Deployment**
  - `wrangler.toml`, `.assetsignore`, `_headers`, `_redirects` and `functions/api/apply.js`.
  - Security headers and CSP that allows KaTeX inline styles but keeps scripts self-hosted.
  - Redirects from the old information architecture and from `.html` URLs to extensionless URLs.

### Changed

- Replaced the live site's third-party form endpoint with a first-party function.
- Replaced the live “within 24 hours” reply promise with an honest response-time note.
- Replaced generic gallery captions with activity-specific captions from the supplied material.
- Made the timetable, batch grid and achievement wall interactive without requiring JavaScript to read the underlying content.
- Corrected the Regional BdMO 2026 card to use the maths-winners photograph.
- Set the method SVG nodes to `100, 300, 500, 700, 900` so they align with the five labels.
- Loaded KaTeX only where mathematics is rendered.
- Added explicit `hidden` states to inactive pathway panels.
- Removed the empty lightbox `img src`.
- Added `scroll-margin-top` for in-page anchors and visible invalid-field styling.
- Attributed the faculty description to the academy's published material instead of implying a separate confirmation.
- Formatted batch-table fees consistently with thousands separators.
- Enforced the `/api/apply` body limit against the actual payload, not only the `Content-Length` header, and collapsed line breaks in the student name used in the email subject.

### Fixed

- Duplicate-ID false positives caused by matching `data-batch-id` as `id`.
- Image-manifest asset resolution relative to `data/` instead of the site root.
- Missing loading attributes on the header logo and lightbox image.
- Missing accessible name on the mobile menu button.
- Invalid ARIA tab structure in the method and list semantics in the batch grid.
- Accessible-name mismatches on photo buttons and batch cells.
- Footer/header brand labels that did not match their visible text.
- Contact and other clean URLs resolving to old directory pages during local preview.
- Font swap delaying the home LCP; the largest font is now 51 KB instead of 122 KB.
- Render-blocking KaTeX CSS on non-maths pages.
- 404 resource noise in local preview after the old directories were removed.

### Removed

- Obsolete old pages: `/about`, `/programs/*`, `/subjects`, `/olympiad`, `/achievements`, `/faculty`, `/events`, `/contact`, `/search`.
- Old `styles.css`, `app.js`, `data.js`.
- Old unused illustrations, `public/`, `dist/` and unused root logo variants.
- Duplicate mobile-nav resize handler.

### Verification

- `npm run check`: **passed** — 12 pages, 506 internal links, 68 images, 11 sitemap URLs.
- Lighthouse mobile, local preview with gzip:
  - Home: performance 96, accessibility 100, best practices 100, SEO 100.
  - Class structure: performance 99, accessibility 100, best practices 100, SEO 100.
  - Sample problems: performance 96, accessibility 100, best practices 100, SEO 100.
- Playwright smoke test: 18/18 checks (finder, method tabs, filters, lightbox, apply validation/success, mobile nav, drawer, pathway tabs, problem hints, map, 404).
- Application handler checks: 11/11 (valid JSON and urlencoded submissions, consent, phone, honeypot, cross-origin, minimum fill time, Resend failure path, name sanitising, oversized body).
- Responsive sweep at 360, 768 and 1280 across all 12 pages: no horizontal overflow, no page errors.
- Known content gaps are listed in `CONTENT_NEEDED.md`. Deployment steps are in `DEPLOY.md`.
