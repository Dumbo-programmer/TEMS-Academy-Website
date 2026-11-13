# CONTENT_NEEDED — decisions and facts the academy must confirm

Everything below is either unpublished, ambiguous in the source material, or a legal/operational decision that must come from TEMS Academy. Nothing in this list has been invented or silently guessed on the site.

The site is deployable without these answers. Where a fact is unknown, the page either omits it, says “To be confirmed”, or links to WhatsApp for a direct answer.

## Priority 1 — claims that appear in public copy

### 1. Exact meaning of “91+ BdMO winners & awardees”

- **Current site copy:** “91+ BdMO winners & awardees” with the source label “Regional BdMO 2026”. The supporting copy says “students and alumni”, mirroring the live site, but does not define who is counted.
- **Why it needs confirmation:** “winners”, “awardees” and “participants” are different claims. The count may include repeat winners, multiple rounds, school-level awards, alumni, or students who attended TEMS for only part of the year. The current site does not expand it further.
- **Needed:** the exact definition, the counting method, whether the number is a minimum, and the date/round the figure refers to.
- **Where:** `data/achievements.json` → achievement with `id: "regional-bdmo-2026"` (the Regional BdMO 2026 card), home proof strip, results archive.

### 2. IJSO 2025 result tally

- **Current site copy:** “IJSO 2025, Russia — international medalist(s)”, based on the supplied Silver Medal photograph and live-site wording.
- **Why it needs confirmation:** the exact number of medals, medal colours, student names and whether every medal winner trained at TEMS are not published.
- **Needed:** confirmed medal tally, competition year/city, student names (only with consent), and whether the result was individual or team.
- **Where:** `data/achievements.json`, `data/results.json`, home proof strip, results page.

### 3. IMSO, APhO, BDMSO, BdPhO wording

- **IMSO:** confirm the year, the number of students, and whether “delegation” means selected, participated or medalled.
- **APhO 2026:** confirm whether TEMS students were selected for the Bangladesh team, the training squad, or the national delegation. Current copy follows the supplied phrase “selected for APhO 2026 Bangladesh physics delegation.”
- **BDMSO:** confirm the expansion (Bangladesh Mathematical Olympiad? Bangladesh Math and Science Olympiad?) and the year of Nabeh's national championship.
- **BdPhO:** confirm the award level and year for the physics awardees.
- **Where:** `data/achievements.json`, `data/results.json`.

### 4. Student names and photo consent

- **Current site:** only “Nabeh” is named, because that name was supplied. All other students are “TEMS student” or “TEMS students”. Photographs are the real images from the live site.
- **Needed:** written guardian consent for every identifiable student, confirmation that the academy owns or may publish each photograph, and approved captions/years. If consent is missing for an image, it must be removed.
- **Where:** `images/_live/`, `data/gallery.json`, `data/achievements.json`, `data/results.json`.

### 5. Faculty names, roles and credentials

- **Current site:** the faculty page describes the teaching model and mentor roles but publishes no names, photographs or credentials.
- **Why:** the live site refers to “proven Olympiad medalists” and “senior academic faculty” without naming anyone. The rebuild does not invent profiles.
- **Needed:** approved names, roles, subjects, credentials, years of experience, photographs and consent for each mentor; or a decision to keep the page role-based indefinitely.
- **Where:** `data/faculty.json`, `faculty.html`.

## Priority 2 — admissions and operations

### 6. Classes 11–12

- **Current site:** all page copy says Classes 3–10. The application form still offers Classes 3–12, matching the live form.
- **Why it matters:** a Class 11 or 12 family can submit an application that the site cannot honestly place.
- **Needed:** either confirm that Classes 11–12 are accepted (and which batches), or remove 11–12 from the form and add a note.
- **Where:** `data/site.json` form options, `scripts/lib/core.mjs` apply form, `data/faq.json`, admissions copy.

### 7. Diagnostic test details

- **Current site:** explains the purpose and placement rule, but does not publish a fee, duration, format, syllabus or next test date.
- **Needed:** test fee (if any), duration, whether it is written/online/in person, what students should bring, and the next available dates.
- **Where:** `data/admissions.json`, `data/faq.json`, admissions page.

### 8. Office hours and visiting policy

- **Current site:** “To be confirmed”, with advice to message on WhatsApp before visiting.
- **Needed:** published office hours, days closed, and whether walk-in visits are allowed.
- **Where:** `data/site.json` → `org.officeHours`, contact page, footer.

### 9. Dedicated calling line

- **Current site:** the WhatsApp number is also used for the “Call” action, with an internal note that a dedicated line is unconfirmed.
- **Needed:** a dedicated phone number, or confirmation that the WhatsApp number may be published as the general calling line.
- **Where:** `data/site.json` → `org.call`, mobile action bar, contact page.

### 10. Fee terms

- **Current site:** Math Tk 2,500/month at any tier; Science Tk 2,700/month including Physics, Chemistry, Biology and labs; fee unchanged on promotion.
- **Needed:** effective date, accepted payment methods, whether materials/lab coats/books are extra, refund and withdrawal policy, and whether fees are monthly or term-based.
- **Where:** `data/site.json` / `data/batches.json`, admissions page, fee card, FAQ.

### 11. Scholarships and prizes

- **Current site:** says merit scholarships and contest prize money are awarded separately by the Chairman.
- **Needed:** eligibility, amount/coverage, application or nomination process, and whether awards are annual.
- **Where:** `data/admissions.json`, FAQ, results page.

### 12. Academic calendar

- **Current site:** weekly timetable and monthly benchmark are explained, but holidays, make-up classes and term dates are not published.
- **Needed:** term dates, Ramadan/Eid breaks, exam weeks and make-up policy.
- **Where:** `data/faq.json`, admissions page.

## Priority 3 — legal, technical and launch details

### 13. Legal review

- **Current site:** terms and privacy pages were rewritten for the new `/api/apply` flow, Resend delivery and optional KV rate limiting. They are accurate for the implemented behaviour but have not been reviewed by a lawyer.
- **Needed:** owner/legal review, especially data retention, guardian consent for minors, international email processing and the academy's official legal name.
- **Where:** `data/legal.json`, `terms.html`, `privacy.html`.

### 14. Final domain and canonical URLs

- **Current site:** canonical base is still `https://tems-website.jayeed-mahmud.workers.dev` because that is the live deployment. All canonicals, Open Graph URLs, JSON-LD IDs and the sitemap derive from it.
- **Needed:** the final production domain, then update `data/site.json` → `seo.canonicalBase` and rebuild. Add a redirect from the old worker URL if the domain changes.
- **Where:** `data/site.json`, all generated pages, `sitemap.xml`, `robots.txt`.

### 15. Resend sender and destination

- **Current site:** the form posts to `/api/apply` and delivers through Resend. The fallback sender is `onboarding@resend.dev`, which can only deliver to the Resend account owner.
- **Needed:** verify a domain in Resend, set `APPLY_FROM_EMAIL` to an address on that domain, confirm the destination inbox, and add `RESEND_API_KEY` as a Cloudflare secret.
- **Where:** `wrangler.toml`, `functions/api/apply.js`, deployment notes in `DEPLOY.md`.

### 16. Optional durable rate limiting

- **Current site:** in-memory rate limiting works per isolate; a KV binding named `RATE_LIMIT` provides a durable limit.
- **Needed:** create the KV namespace and uncomment the binding, or accept best-effort limiting.
- **Where:** `wrangler.toml`, `functions/api/apply.js`.

### 17. Photography years and captions

- **Current site:** captions describe the activity, but most photographs have no year. Undated results are explicitly labelled “Undated”.
- **Needed:** year, event and round for each photograph, plus confirmation that captions are accurate.
- **Where:** `data/gallery.json`, `data/results.json`, `data/achievements.json`.

### 18. Enrolment and outcome statistics

- **Current site:** no total enrolment, acceptance rate, average class size or outcome rate is published, because those figures were not supplied.
- **Needed:** only if the academy wants to publish them; they must be measurable and current.
- **Where:** home proof strip, admissions page.

## Answers already used, with sources

These facts were supplied by the live site or the academy and are used as-is:

- Address: House 06, Road 1/1, Shekertek Adabor, Mohammadpur-1207, Dhaka
- Map: `https://maps.app.goo.gl/YcTaqgoKpMDwbAfi7`
- Email: `temsonline3.14@gmail.com`
- WhatsApp: `+880 1771-396000` / `wa.me/8801771396000`
- Facebook: `https://www.facebook.com/TEMS.MathAcademy/`
- Established: 2013
- Math fee: Tk 2,500/month at every tier
- Science fee: Tk 2,700/month, including Physics, Chemistry, Biology and lab work
- Fee unchanged on promotion
- Divisions: Primary 3–5, Junior 6–8, Secondary 9–10
- Tiers: Gamma, Alpha, Sigma
- Placement: diagnostic → ability-based placement → weekly problem sets → monthly benchmark → promotion/re-placement
- Seven running math batches; Secondary Gamma and Secondary Alpha on hold for staffing
- Three science batches
- Contest pathways: BdMO/APMO/IMO, IMSO, IJSO, BdPhO/BdChO/BDBO, APhO
- All 17 live photographs and the logo

## How to update content

1. Edit the relevant JSON file in `data/`.
2. Run `npm run check` to rebuild and validate.
3. Preview with `npm run dev`.
4. Deploy only after the checker passes and the changed claims have owner approval.

Do not add a name, score, medal, testimonial, date, phone number or credential that is not confirmed in writing. When a fact is missing, leave the existing “To be confirmed” wording or add it to this file.
