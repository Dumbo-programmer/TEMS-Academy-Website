# Deployment notes

The site is a generated static site at the repository root. Netlify serves the
HTML, CSS, JS and asset files; a Netlify Function handles `POST /api/apply`.

## 1. Build locally

Requirements: Node 20+ (tested on 22), npm, Python 3 with Pillow and fonttools only if you need to regenerate images or fonts.

```bash
npm ci
npm run check
npm run dev
```

`npm run check` rebuilds every page and fails on broken links, missing assets, duplicate IDs, invalid JSON-LD, sitemap mismatches and content-count regressions. Do not deploy while it is failing.

`npm run dev` serves the clean URLs at `http://127.0.0.1:4173` and provides a mock `/api/apply` that logs applications without emailing them.

## 2. Create the Netlify site

In Netlify, choose **Add new site → Import an existing project**, connect the
repository, and use the settings in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Node version: 20 or newer

## 3. Configure the form

### Resend

1. Create a Resend account and verify the sending domain.
2. Create an API key with permission to send email.
3. In Netlify, open **Site configuration → Environment variables** and add:

```text
RESEND_API_KEY=your_resend_api_key
APPLY_TO_EMAIL=temsonline3.14@gmail.com
APPLY_FROM_EMAIL=TEMS Academy <apply@your-verified-domain.example>
```

Set the sender to an address on the verified domain. The destination defaults
to `temsonline3.14@gmail.com` if `APPLY_TO_EMAIL` is omitted.

The fallback `onboarding@resend.dev` can only deliver to the Resend account
owner, so it is not suitable for production.

4. Deploy and submit a real test application. Confirm:
   - the academy inbox receives the message
   - the guardian address is set as `reply-to`
   - the browser shows the success state only after a 200 response
   - an intentionally invalid submission is rejected
   - the WhatsApp fallback appears if delivery fails

The function uses an in-memory rate limit per function instance. Application
content is never stored by the site.

## 4. Deploy

### Git integration

```bash
npm run check
```

Push the repository or trigger a deploy from the Netlify dashboard. Netlify
builds the static site and deploys `netlify/functions/apply.mjs` as
`/.netlify/functions/apply`; the rewrite in `netlify.toml` exposes it as
`/api/apply`.

## 5. Verify the deployment

- `/` and `/class-structure` return 200.
- `/class-structure.html` returns 301 to `/class-structure`.
- `/terms-and-conditions.html` returns 301 to `/terms`.
- `/privacy-policy.html` returns 301 to `/privacy`.
- `/about` and `/programs/*` return 301 to the new pages.
- `POST /api/apply` reaches the Netlify Function and returns JSON.
- An unknown path returns the designed 404 with status 404.
- `/sitemap.xml` lists 11 URLs and uses the production domain.
- `/robots.txt` references the production sitemap.
- Browser console shows no CSP violations on home, class structure, sample problems and contact.
- The contact map iframe loads within the `frame-src` allow-list.
- Lighthouse mobile: accessibility, best practices and SEO 100; performance 95+ on home, class structure and sample problems.

## 6. Domain and canonical URLs

The current canonical base is the existing live deployment:

```text
https://tems-website.jayeed-mahmud.workers.dev
```

When the final domain is ready:

1. Change `data/site.json` → `seo.canonicalBase`.
2. Run `npm run check` so every canonical, Open Graph URL, JSON-LD ID, `sitemap.xml` and `robots.txt` is regenerated.
3. Deploy.
4. Add a redirect from the old worker hostname if it will remain reachable.
5. Update the Facebook page and any printed material with the new URL.

## 7. Content updates

Edit the relevant file in `data/`, then run:

```bash
npm run check
npm run dev
```

The checker enforces the content invariants:

- 7 running math batches and 3 science batches
- 32 sample problems
- at least 17 photographs
- valid image manifest and responsive sources
- all internal links, anchors and assets

Facts that are not confirmed must stay flagged in `CONTENT_NEEDED.md`. Do not add names, scores, medals, testimonials, dates, phone numbers or credentials without written approval.

## 8. Rollback

Netlify keeps previous deploys. Use the deploy list to restore the last
known-good deploy. Environment variables remain configured at the site level.
