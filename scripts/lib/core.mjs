import fs from "fs";
import path from "path";
import katex from "katex";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data");

export function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
}

export function loadData() {
  return {
    site: readJson("site.json"),
    pages: readJson("pages.json"),
    batches: readJson("batches.json"),
    achievements: readJson("achievements.json"),
    results: readJson("results.json"),
    gallery: readJson("gallery.json"),
    faq: readJson("faq.json"),
    pathway: readJson("pathway.json"),
    problems: readJson("problems.json"),
    resources: readJson("resources.json"),
    faculty: readJson("faculty.json"),
    admissions: readJson("admissions.json"),
    legal: readJson("legal.json"),
    images: readJson("images.json")
  };
}

/* ------------------------------------------------------------------ */
/* Text and URL helpers                                               */
/* ------------------------------------------------------------------ */

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function attr(value) {
  return esc(value);
}

const SITE_BASE = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "site.json"), "utf8")).seo.canonicalBase;

export function canonical(route) {
  return route === "/" ? `${SITE_BASE}/` : `${SITE_BASE}${route}`;
}

export function yearsSince(year) {
  return new Date().getFullYear() - Number(year);
}

/* ------------------------------------------------------------------ */
/* Build-time KaTeX                                                   */
/* ------------------------------------------------------------------ */

function renderTex(tex, displayMode) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: "htmlAndMathml"
    });
  } catch {
    return esc(displayMode ? `$$${tex}$$` : `$${tex}$`);
  }
}

/**
 * Renders inline `$...$` and display `$$...$$` math in a trusted string.
 * Everything outside math is HTML-escaped.
 */
export function math(text) {
  const source = String(text ?? "");
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let out = "";
  let last = 0;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    out += esc(source.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("$$")) {
      out += `<span class="math-display">${renderTex(token.slice(2, -2).trim(), true)}</span>`;
    } else {
      out += renderTex(token.slice(1, -1).trim(), false);
    }
    last = match.index + token.length;
  }
  out += esc(source.slice(last));
  return out;
}

/** Renders plain text safely, without math. */
export function plain(text) {
  return esc(text);
}

/* ------------------------------------------------------------------ */
/* Images                                                             */
/* ------------------------------------------------------------------ */

/**
 * Responsive <picture> built from data/images.json.
 * `key` is the image id, e.g. "nabeh-bdmso".
 */
export function picture(images, key, options = {}) {
  const image = images[key];
  if (!image) return "";
  const {
    alt = "",
    className = "",
    sizes = "(max-width: 700px) 100vw, 50vw",
    loading = "lazy",
    fetchpriority = "auto",
    decoding = "async",
    width,
    height,
    fallbackWidth
  } = options;

  const sources = image.sources || [];
  if (!sources.length) return "";
  const sorted = [...sources].sort((a, b) => a.width - b.width);
  const webpSet = sorted.map((s) => `${s.webp} ${s.width}w`).join(", ");
  const avifSet = sorted.map((s) => `${s.avif} ${s.width}w`).join(", ");

  let fallback = sorted.find((s) => s.width >= (fallbackWidth || 800)) || sorted[sorted.length - 1];
  const w = width || fallback.width || image.width;
  const h = height || fallback.height || image.height;
  const classes = className ? ` class="${attr(className)}"` : "";
  const fp = fetchpriority !== "auto" ? ` fetchpriority="${attr(fetchpriority)}"` : "";
  const dims = w && h ? ` width="${w}" height="${h}"` : "";

  return `<picture${classes ? "" : ""}>
<source type="image/avif" srcset="${attr(avifSet)}" sizes="${attr(sizes)}">
<source type="image/webp" srcset="${attr(webpSet)}" sizes="${attr(sizes)}">
<img src="${attr(fallback.webp)}" alt="${attr(alt)}"${classes}${dims} loading="${attr(loading)}" decoding="${attr(decoding)}"${fp}>
</picture>`;
}

export function imageMeta(images, key) {
  return images[key] || null;
}

/* ------------------------------------------------------------------ */
/* Structured data                                                    */
/* ------------------------------------------------------------------ */

export function organizationSchema(ctx) {
  const { site } = ctx;
  const org = site.org;
  return {
    "@type": "EducationalOrganization",
    "@id": `${canonical("/")}#organization`,
    name: org.name,
    legalName: org.legalName,
    alternateName: org.shortName,
    url: canonical("/"),
    logo: `${canonical("/")}assets/img/icon-512.png`,
    image: `${canonical("/")}assets/img/og-image.jpg`,
    description:
      "Offline olympiad mathematics and science academy in Dhaka, Bangladesh, training Classes 3–10 since 2013.",
    foundingDate: String(org.established),
    email: org.email,
    telephone: `+${org.whatsapp}`,
    sameAs: [org.facebook, org.mapUrl],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${org.address.line1}, ${org.address.line2}`,
      addressLocality: "Dhaka",
      postalCode: "1207",
      addressCountry: "BD"
    },
    areaServed: { "@type": "City", name: "Dhaka" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "admissions",
        telephone: `+${org.call}`,
        email: org.email,
        availableLanguage: org.languages
      }
    ]
  };
}

export function coursesSchema(ctx) {
  const { site, batches } = ctx;
  const orgId = `${canonical("/")}#organization`;
  const math = {
    "@type": "Course",
    "@id": `${canonical("/class-structure")}#course-mathematics`,
    name: "Olympiad Mathematics — Classes 3–10",
    description:
      "Ability-placed olympiad mathematics in Primary, Junior and Secondary divisions, with weekly problem sets and a monthly benchmark.",
    provider: { "@id": orgId },
    educationalLevel: "Classes 3–10",
    teaches: batches.tiers.map((t) => `${t.name} (${t.level}): ${t.summary}`),
    offers: {
      "@type": "Offer",
      price: site.fees.math,
      priceCurrency: "BDT",
      category: "Monthly tuition",
      url: canonical("/admissions")
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      location: { "@type": "Place", name: "TEMS Academy", address: site.org.address.full }
    }
  };
  const science = {
    "@type": "Course",
    "@id": `${canonical("/class-structure")}#course-science`,
    name: "Olympiad Science — Classes 3–10",
    description:
      "Integrated physics, chemistry and biology with laboratory work, from primary science through IJSO-level junior science.",
    provider: { "@id": orgId },
    educationalLevel: "Classes 3–10",
    offers: {
      "@type": "Offer",
      price: site.fees.science,
      priceCurrency: "BDT",
      category: "Monthly tuition",
      url: canonical("/admissions")
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      location: { "@type": "Place", name: "TEMS Academy", address: site.org.address.full }
    }
  };
  return [math, science];
}

export function faqSchema(items) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };
}

export function breadcrumbSchema(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: canonical(item.href)
    }))
  };
}

/* ------------------------------------------------------------------ */
/* Head and layout                                                    */
/* ------------------------------------------------------------------ */

const FONT_PRELOADS = [
  '<link rel="preload" href="/assets/fonts/source-serif-latin.woff2" as="font" type="font/woff2" crossorigin>',
  '<link rel="preload" href="/assets/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>'
];

export function head(ctx, options) {
  const { site } = ctx;
  const {
    title,
    description,
    route = "/",
    ogType = "website",
    robots = "index,follow",
    graph = [],
    extra = [],
    needsMath = false
  } = options;

  const url = canonical(route);
  const ogImage = `${canonical("/")}${site.seo.ogImage}`;
  const fullTitle = title ? `${title} — ${site.seo.siteName}` : `${site.seo.siteNameFull}`;
  const desc = description || site.seo.defaultDescription;

  const jsonLd = graph.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`
    : "";

  return [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${attr(desc)}">`,
    `<meta name="robots" content="${attr(robots)}">`,
    `<link rel="canonical" href="${attr(url)}">`,
    `<meta property="og:locale" content="${attr(site.seo.locale)}">`,
    `<meta property="og:type" content="${attr(ogType)}">`,
    `<meta property="og:site_name" content="${attr(site.seo.siteName)}">`,
    `<meta property="og:title" content="${attr(fullTitle)}">`,
    `<meta property="og:description" content="${attr(desc)}">`,
    `<meta property="og:url" content="${attr(url)}">`,
    `<meta property="og:image" content="${attr(ogImage)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="TEMS Academy of Olympiad Math &amp; Science, Dhaka.">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${attr(fullTitle)}">`,
    `<meta name="twitter:description" content="${attr(desc)}">`,
    `<meta name="twitter:image" content="${attr(ogImage)}">`,
    `<meta name="theme-color" content="${attr(site.seo.themeColor)}">`,
    `<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">`,
    `<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
    ...FONT_PRELOADS,
    needsMath ? `<link rel="stylesheet" href="/assets/vendor/katex/katex.min.css">` : "",
    `<link rel="stylesheet" href="/assets/css/site.css">`,
    jsonLd,
    ...extra
  ]
    .filter(Boolean)
    .join("\n    ");
}

function navItem(ctx, item, pageId) {
  const active = item.id === pageId;
  return `<a${active ? ' class="is-active" aria-current="page"' : ""} href="${attr(item.href)}">${esc(item.label)}</a>`;
}

export function siteHeader(ctx, pageId) {
  const { site } = ctx;
  return `
<header class="site-header" data-header>
  <a class="skip-link" href="#main">Skip to main content</a>
  <div class="header-inner">
    <a class="brand" href="/">
      ${picture(ctx.images, "logo", { alt: "", sizes: "48px", loading: "eager", width: 48, height: 48, fallbackWidth: 96 })}
      <span class="brand-copy">
        <strong>TEMS</strong>
        <span>Academy of Olympiad<br>Math &amp; Science</span>
      </span>
    </a>

    <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
      <span class="nav-toggle-label">Menu</span>
      <span class="nav-toggle-bars" aria-hidden="true"></span>
    </button>

    <nav class="primary-nav" id="primary-nav" aria-label="Primary" data-nav>
      <div class="primary-nav-links">
        ${site.nav.map((item) => navItem(ctx, item, pageId)).join("\n        ")}
      </div>
      <button class="btn btn-primary nav-apply" type="button" data-apply-open>Apply now</button>
    </nav>
  </div>
</header>`;
}

export function siteFooter(ctx) {
  const { site } = ctx;
  const org = site.org;
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="footer-top shell">
    <div class="footer-brand">
      <a class="brand brand--footer" href="/">
        ${picture(ctx.images, "logo", { alt: "", sizes: "52px", width: 52, height: 52, fallbackWidth: 96 })}
        <span class="brand-copy"><strong>TEMS</strong><span>Academy of Olympiad<br>Math &amp; Science</span></span>
      </a>
      <p class="footer-promise">${esc(site.identity.promise)}</p>
      <p class="footer-note">${esc(site.identity.audience)} · ${esc(site.identity.since)}</p>
      <div class="footer-contact">
        <a href="${attr(org.mapUrl)}" target="_blank" rel="noopener noreferrer">${esc(org.address.full)}</a>
        <a href="mailto:${attr(org.email)}">${esc(org.email)}</a>
        <a href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp ${esc(org.whatsappDisplay)}</a>
      </div>
    </div>

    <div class="footer-nav">
      ${site.footerNav
        .map(
          (group) => `
      <div>
        <p class="footer-heading">${esc(group.title)}</p>
        <ul>${group.links.map((link) => `<li><a href="${attr(link.href)}">${esc(link.label)}</a></li>`).join("")}</ul>
      </div>`
        )
        .join("")}
      <div>
        <p class="footer-heading">Fees</p>
        <ul>
          <li>Math ${esc(site.fees.currency)} ${esc(site.fees.mathLabel)} / month</li>
          <li>Science ${esc(site.fees.currency)} ${esc(site.fees.scienceLabel)} / month</li>
          <li><a href="/admissions">Fees &amp; admissions</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-heading">Academy</p>
        <ul>
          <li><a href="/terms">Terms &amp; conditions</a></li>
          <li><a href="/privacy">Privacy policy</a></li>
          <li><a href="${attr(org.facebook)}" target="_blank" rel="noopener noreferrer">Facebook</a></li>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-bottom shell">
    <p>© ${year} ${esc(org.name)}. Dhaka, Bangladesh.</p>
    <p>Results and photographs are published only when supplied or confirmed by the academy.</p>
  </div>
</footer>`;
}

export function applyModal(ctx) {
  const { site } = ctx;
  const org = site.org;
  return `
<dialog class="apply-dialog" id="apply-dialog" aria-labelledby="apply-title" data-apply-dialog>
  <div class="apply-dialog-inner">
    <div class="apply-dialog-head">
      <div>
        <p class="index">Application</p>
        <h2 id="apply-title">Start with a diagnostic.</h2>
        <p class="apply-intro">Tell us who is applying. The academy will arrange the placement test and confirm the batch in writing before the first class.</p>
      </div>
      <button class="icon-button" type="button" aria-label="Close application form" data-apply-close>
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <form class="apply-form" action="/api/apply" method="post" data-apply-form novalidate>
      <div class="field-grid">
        <label class="field field--wide">
          <span>Student’s name</span>
          <input type="text" name="studentName" id="apply-student" autocomplete="off" required minlength="2" maxlength="80">
        </label>
        <label class="field">
          <span>Guardian email</span>
          <input type="email" name="guardianEmail" id="apply-email" autocomplete="email" required maxlength="120">
        </label>
        <label class="field">
          <span>WhatsApp number</span>
          <input type="tel" name="whatsapp" id="apply-whatsapp" autocomplete="tel" inputmode="tel" required maxlength="20" placeholder="+880 1XXX-XXXXXX">
        </label>
        <label class="field">
          <span>Class</span>
          <select name="studentClass" id="apply-class" required>
            <option value="">Select class</option>
            ${["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
              .map((n) => `<option value="${n}">Class ${n}</option>`)
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Track</span>
          <select name="track" id="apply-track" required>
            <option value="">Select track</option>
            <option value="mathematics">Mathematics</option>
            <option value="science">Science</option>
            <option value="both">Both</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </label>
        <label class="field field--wide">
          <span>Past contest experience <em>(optional)</em></span>
          <textarea name="experience" id="apply-experience" rows="2" maxlength="600" placeholder="BdMO, BdPhO, BdJSO, IMSO or school contests — round and year if known."></textarea>
        </label>
        <label class="field field--wide">
          <span>Anything else we should know? <em>(optional)</em></span>
          <textarea name="message" id="apply-message" rows="3" maxlength="1500"></textarea>
        </label>
      </div>

      <div class="honeypot" aria-hidden="true">
        <label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
      </div>
      <input type="hidden" name="startedAt" value="" data-started-at>

      <label class="consent">
        <input type="checkbox" name="consent" value="yes" required>
        <span>I am the parent or guardian, and I consent to TEMS Academy using these details to respond to this application. I have read the <a href="/privacy">privacy policy</a>.</span>
      </label>

      <p class="form-note">${esc(site.form.emailNote)} ${esc(site.form.responseNote)}</p>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Send application</button>
        <a class="btn btn-quiet" href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">Use WhatsApp instead</a>
      </div>

      <div class="form-status" role="status" aria-live="polite" data-apply-status></div>
      <p class="form-fallback" data-apply-fallback hidden>
        ${esc(site.form.fallbackNote)}
        <a href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">Open WhatsApp</a>.
      </p>
    </form>

    <div class="apply-success" data-apply-success hidden tabindex="-1">
      <p class="index">Received</p>
      <h3>Application noted.</h3>
      <p>Keep an eye on WhatsApp and the guardian email address you supplied. If you do not hear back, message the academy directly — the same details will help.</p>
      <div class="form-actions">
        <a class="btn btn-primary" href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>
        <button class="btn btn-quiet" type="button" data-apply-close>Close</button>
      </div>
    </div>
  </div>
</dialog>`;
}

export function mobileBar(ctx) {
  const { site } = ctx;
  return `
<div class="mobile-bar" aria-label="Quick actions">
  <button class="mobile-bar-apply" type="button" data-apply-open>Apply</button>
  <a href="https://wa.me/${attr(site.org.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
  <a href="tel:+${attr(site.org.call)}">Call</a>
</div>`;
}

export function layout(ctx, options) {
  const { pageId, main, headHtml, bodyClass = "", script = "" } = options;
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${headHtml}
</head>
<body class="page page--${attr(pageId)}${bodyClass ? ` ${attr(bodyClass)}` : ""}" data-page="${attr(pageId)}">
    ${siteHeader(ctx, pageId)}
    <main id="main" tabindex="-1">
${main}
    </main>
    ${siteFooter(ctx)}
    ${applyModal(ctx)}
    ${mobileBar(ctx)}
    <script src="/assets/js/site.js" defer></script>
    ${script}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Reusable page components                                           */
/* ------------------------------------------------------------------ */

export function pageHero(ctx, key, options = {}) {
  const page = ctx.pages[key];
  const { actions = "", aside = "", extraClass = "" } = options;
  return `
<section class="page-hero shell ${extraClass}">
  <div class="page-hero-copy">
    <p class="kicker">${esc(page.kicker)}</p>
    <h1 class="display">${esc(page.heading)} <span class="accent">${esc(page.headingAccent)}</span></h1>
    <p class="lead">${esc(page.lead)}</p>
    ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
  </div>
  ${aside ? `<div class="page-hero-aside">${aside}</div>` : ""}
</section>`;
}

export function sectionHead(index, heading, lead = "", link = "") {
  return `
<div class="section-head">
  <div>
    <p class="index">${esc(index)}</p>
    <h2 class="display">${heading}</h2>
    ${lead ? `<p class="section-lead">${esc(lead)}</p>` : ""}
  </div>
  ${link || ""}
</div>`;
}

export function details(summary, bodyHtml, options = {}) {
  const { open = false, className = "" } = options;
  return `<details class="disclosure ${attr(className)}"${open ? " open" : ""}>
  <summary>${esc(summary)}</summary>
  <div class="disclosure-body">${bodyHtml}</div>
</details>`;
}

export function tag(text, modifier = "") {
  return `<span class="tag${modifier ? ` tag--${attr(modifier)}` : ""}">${esc(text)}</span>`;
}

export function nextStepBand(ctx, title, text) {
  return `
<section class="cta-band">
  <div class="shell cta-band-inner">
    <div>
      <p class="index">Next step</p>
      <h2 class="display">${esc(title)}</h2>
      <p>${esc(text)}</p>
    </div>
    <div class="cta-band-actions">
      <button class="btn btn-light" type="button" data-apply-open>Apply now</button>
      <a class="btn btn-outline-light" href="https://wa.me/${attr(ctx.site.org.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp the academy</a>
    </div>
  </div>
</section>`;
}

export function lightbox() {
  return `
<dialog class="lightbox" id="lightbox" aria-labelledby="lightbox-caption" data-lightbox>
  <div class="lightbox-inner">
    <button class="lightbox-close icon-button" type="button" aria-label="Close photograph" data-lightbox-close><span aria-hidden="true">×</span></button>
    <div class="lightbox-media">
      <picture>
        <source type="image/avif" data-lightbox-avif>
        <source type="image/webp" data-lightbox-webp>
        <img alt="" width="1200" height="800" loading="lazy" data-lightbox-img>
      </picture>
    </div>
    <div class="lightbox-foot">
      <p id="lightbox-caption" data-lightbox-caption></p>
      <span data-lightbox-count></span>
    </div>
    <button class="lightbox-prev" type="button" aria-label="Previous photograph" data-lightbox-prev>←</button>
    <button class="lightbox-next" type="button" aria-label="Next photograph" data-lightbox-next>→</button>
  </div>
</dialog>`;
}
