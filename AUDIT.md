# AUDIT — live site vs rebuilt site

Baseline inspected on 14 November 2026:

- Live home: `https://tems-website.jayeed-mahmud.workers.dev/`
- Live class structure: `https://tems-website.jayeed-mahmud.workers.dev/class-structure.html`
- Live sitemap: two indexable URLs (home and class structure)
- Live legal pages: `terms-and-conditions.html`, `privacy-policy.html`
- Live photography: 17 student, classroom, lab and award photographs, plus the logo

## What the live site does well

- A clear, memorable identity: “Think Beyond Textbooks. Train for the problems you haven't seen.”
- Real photography of real classrooms, laboratories and award ceremonies, with no stock imagery.
- A substantial class-structure page: placement by diagnostic, Primary/Junior/Secondary divisions, Gamma/Alpha/Sigma tiers, seven running math batches, three science batches, the two on-hold secondary batches, fees and session windows.
- Concrete, checkable achievement claims: IJSO 2025 medals, 91+ BdMO winners and awardees at Regional BdMO 2026, IMSO delegation, APhO 2026 selection, BDMSO national champion, BdPhO and math Olympiad awardees, Chairman's scholarships.
- The fee model is unusually clear: one math fee at every tier, one science fee that includes three subjects and lab work, and no increase on promotion.
- A working application form, WhatsApp chat link, campus address and map link.

## Where the live site falls short

- **Two indexable pages.** Pathway, results, faculty, admissions, contact, resources and sample problems have no dedicated pages at all.
- **No route from interest to problems.** A family cannot see the standard of work before applying, and there is no page that explains BdMO → national camp → APMO/IMO, IJSO, IMSO or the physics, chemistry and biology routes.
- **Achievements are a static gallery.** There is no filter, no result archive, no source label on most claims and no lightbox context.
- **The timetable is prose.** Batch cells are not interactive, do not expose syllabus or sample problems, and the on-hold reason is buried in body copy.
- **Contact is thin.** Address, a map link, email, Facebook and the form. No embedded map, no call action, no office hours and no WhatsApp-specific page.
- **The form relies on a third-party endpoint and promises a reply “within 24 hours.”** That promise is not supported by published staffing or service levels, and the form has no visible failure path other than trying again.
- **No faculty information.** The page has no named mentors, credentials or teaching model, and the live copy refers to “proven Olympiad medalists” without identifying anyone.
- **No sample problems, resources or study route.** Nothing demonstrates the teaching method in practice.
- **Maintenance is page-by-page.** No content source of truth, no build check, no broken-link or image validation and no generated sitemap beyond two entries.

## Rebuilt inventory

| Area | Live site | Rebuilt site |
| --- | --- | --- |
| Indexable pages | 2 | 11 (plus a designed 404) |
| Class structure | Long editorial page | Interactive 3×3 batch grid, drawer with syllabus/session/fee/sample problem, on-hold cells with reason, weekly timetable, promotion path |
| Finder | None | “Find your batch” by class, experience and subject |
| Achievements | Static gallery | Filterable wall with source labels, years and accessible lightbox |
| Method | Five text stages | Five-stage SVG method with keyboard-operable stage switcher |
| Sample problems | None | 32 original problems across Gamma/Alpha/Sigma with hints and worked solutions (KaTeX) |
| Pathway | None | Subject tabs for maths, physics, chemistry, biology and junior science, with official links |
| Results | Gallery captions | Three-year archive, source labels, undated items marked “Undated” |
| Faculty | Absent | Teaching model and role descriptions only; no invented names or credentials |
| Admissions | Form on home | Four-step admissions page, first-month timeline, fee card, diagnostic explanation |
| Contact | Footer details | Campus page with embedded map, visit guidance, email/WhatsApp/call actions |
| Resources | None | Official olympiad links and practical study guidance |
| Legal | Two pages | Terms and privacy rewritten for the new form and hosting, with review flags |
| Form | Third-party POST, “within 24 hours” | Same-origin `/api/apply`, server validation, honeypot, minimum fill time, rate limiting, Resend delivery, success state, WhatsApp fallback |
| SEO | Two sitemap URLs, limited metadata | Per-page title/description/canonical, Open Graph/Twitter, JSON-LD, 11-URL sitemap, robots, 404 |
| Accessibility | Partial | Skip link, focus states, reduced motion, semantic landmarks, 100 Lighthouse accessibility in tested pages |
| Performance | Not measured | Responsive AVIF/WebP, self-hosted fonts, no third-party scripts; 96–99 Lighthouse performance on tested pages |
| Maintenance | Hand-edited pages | Node generator from `data/*.json`, `npm run check` validator, image/font preparation scripts |

## What the rebuild deliberately does not copy

- **The “within 24 hours” promise.** The new copy says response times vary with the admissions queue, and the WhatsApp fallback is always visible.
- **Unverifiable superlatives.** “Elite”, “premier”, “world-class” and similar labels are replaced with specific, checkable statements about classes, batches, fees and competition routes.
- **Named student results that were not supplied.** Only “Nabeh” is named, because that name came from the supplied content. Every other result says “TEMS student” or “TEMS students”.
- **Invented faculty profiles.** The faculty page explains the mentoring model and role structure without names, photographs or credentials that the academy has not supplied.
- **Invented dates, statistics or testimonials.** There are no testimonials on the site. Ambiguous claims are flagged in `CONTENT_NEEDED.md` rather than expanded.

## Verification

Run from the repository root:

```bash
npm run check
```

The checker rebuilds all pages and validates:

- every internal link and anchor
- every image, `srcset` source and CSS asset
- alt text, dimensions, lazy/eager loading and lightbox hooks
- canonical URLs, unique titles/descriptions, Open Graph/Twitter and JSON-LD
- duplicate IDs, sitemap/robots consistency and required deployment files
- content invariants: 7 running math batches, 3 science batches, 32 sample problems, at least 17 photographs

Additional checks performed during the build:

- Lighthouse (mobile emulation, local preview with gzip): home 96 performance; class structure 99; sample problems 96; accessibility, best practices and SEO 100 on all three.
- Playwright smoke test: finder, method tabs, result filters, lightbox, application validation and success, mobile nav, batch drawer, pathway tabs, problem hints, contact map, 404 — 18/18 checks.
- Responsive sweep at 360, 768 and 1280 across all 12 pages: no horizontal overflow, no page errors.

## Remaining gaps

The site is complete and deployable, but these owner decisions are still required. They are tracked with exact file locations in `CONTENT_NEEDED.md`.

- exact definition and tally behind “91+ BdMO winners & awardees”
- exact IJSO 2025 medal count and names
- whether Classes 11–12 are accepted into regular batches
- approved faculty profiles and photography consent
- office hours and a dedicated calling line
- diagnostic fee, duration and next test dates
- scholarship criteria and amounts
- legal review of the rewritten terms and privacy pages
- final domain and Resend sender verification
