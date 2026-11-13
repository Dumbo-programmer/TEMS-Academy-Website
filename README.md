# TEMS Academy of Olympiad Math & Science

Static website for TEMS Academy, an offline olympiad math and science academy in Dhaka for Classes 3–10. The site is generated from structured content in `data/` and deployed to Cloudflare Pages.

## Commands

```bash
npm ci
npm run check     # build + full link/SEO/asset/content validation
npm run dev       # build + local preview with mock form endpoint
npm run build     # regenerate all root .html pages, sitemap, robots, manifest
npm run serve     # preview without rebuilding
npm run images    # regenerate responsive photos, OG image and icons
npm run fonts     # pin optical-size axes on the self-hosted fonts
```

See `DEPLOY.md` for Cloudflare Pages, Resend and KV setup.

## Structure

- `data/*.json` — content source of truth (pages, batches, achievements, results, gallery, FAQ, pathway, problems, resources, faculty, admissions, legal)
- `scripts/lib/core.mjs` — shared layout, head/metadata, schema, header/footer, apply modal, lightbox
- `scripts/pages/*.mjs` — page builders
- `scripts/build.mjs` — build orchestrator
- `scripts/check.mjs` — pre-flight validator
- `scripts/serve.mjs` — local clean-URL preview server
- `scripts/prepare-images.py` — responsive AVIF/WebP generation and image manifest
- `scripts/prepare-fonts.py` — self-hosted font optimisation
- `assets/css/site.css` — design system
- `assets/js/site.js` — progressive enhancements (finder, filters, drawer, tabs, lightbox, apply form, mobile nav)
- `functions/api/apply.js` — Cloudflare Pages Function for applications
- `images/_live/` — source photographs (not deployed)
- `_headers`, `_redirects`, `.assetsignore`, `wrangler.toml` — deployment configuration

## Documentation

- `AUDIT.md` — live site comparison and rebuild inventory
- `CHANGELOG.md` — release notes
- `CONTENT_NEEDED.md` — unanswered content and owner decisions
- `DEPLOY.md` — deployment and form configuration
