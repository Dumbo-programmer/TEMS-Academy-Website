/**
 * Pre-flight checks for the generated site.
 * Verifies SEO metadata, internal links and anchors, images and alt text,
 * asset references, structured data, manifest and sitemap consistency.
 *
 * Exit code 1 on any error. Warnings are printed but do not fail the build.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "site.json"), "utf8"));
const images = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "images.json"), "utf8"));
const batches = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "batches.json"), "utf8"));
const problems = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "problems.json"), "utf8"));
const gallery = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "gallery.json"), "utf8"));

const BASE = site.seo.canonicalBase.replace(/\/$/, "");
const errors = [];
const warnings = [];

function add(list, file, message, line) {
  list.push({ file, message, line });
}

function fail(file, message, line) {
  add(errors, file, message, line);
}

function warn(file, message, line) {
  add(warnings, file, message, line);
}

function lineAt(text, index) {
  if (typeof index !== "number" || index < 0) return 0;
  return text.slice(0, index).split("\n").length;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function exists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getAttr(attrs, name) {
  const pattern = new RegExp(
    `(?:^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = attrs.match(pattern);
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? "");
}

function hasAttr(attrs, name) {
  return new RegExp(`(?:^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s*=|\\s|$)`, "i").test(
    attrs
  );
}

function stripHash(url) {
  const index = url.indexOf("#");
  return index === -1 ? url : url.slice(0, index);
}

function hashOf(url) {
  const index = url.indexOf("#");
  return index === -1 ? "" : url.slice(index + 1);
}

function isExternal(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
}

function isFileUrl(url) {
  return !isExternal(url) && !url.startsWith("#") && url !== "";
}

function routeFor(file) {
  const name = path.basename(file);
  if (name === "index.html") return "/";
  if (name === "404.html") return "/404";
  return `/${name.replace(/\.html$/, "")}`;
}

function fileForUrl(urlPath, fromFile) {
  let clean = stripHash(urlPath).split("?")[0];
  if (!clean) return fromFile;
  try {
    clean = decodeURIComponent(clean);
  } catch {
    return null;
  }

  const target = clean.startsWith("/")
    ? path.join(ROOT, clean.replace(/^\/+/, ""))
    : path.resolve(path.dirname(fromFile), clean);

  if (exists(target)) return target;

  if (!path.extname(target)) {
    if (exists(`${target}.html`)) return `${target}.html`;
    if (exists(path.join(target, "index.html"))) return path.join(target, "index.html");
  }
  return null;
}

function assetFor(url, fromFile) {
  let clean = stripHash(url).split("?")[0];
  if (!clean) return null;
  try {
    clean = decodeURIComponent(clean);
  } catch {
    return null;
  }
  const target = clean.startsWith("/")
    ? path.join(ROOT, clean.replace(/^\/+/, ""))
    : path.resolve(path.dirname(fromFile), clean);
  return exists(target) ? target : null;
}

function srcsetUrls(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function checkAsset(file, html, url, context, index) {
  if (!url) {
    fail(file, `${context} has an empty URL`, lineAt(html, index));
    return;
  }
  if (!isFileUrl(url)) return;
  if (!assetFor(url, file)) {
    fail(file, `${context} points to a missing file: ${url}`, lineAt(html, index));
  }
}

/* ------------------------------------------------------------------ */
/* Pick up the built pages                                            */
/* ------------------------------------------------------------------ */

const pageFiles = fs
  .readdirSync(ROOT)
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)))
  .map((name) => path.join(ROOT, name));

if (!pageFiles.length) {
  console.error("No HTML pages found. Run `npm run build` first.");
  process.exit(1);
}

const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
const allIds = new Map();
const pageHtml = new Map();
const pageRoute = new Map();

/* ------------------------------------------------------------------ */
/* Per-page checks                                                    */
/* ------------------------------------------------------------------ */

for (const file of pageFiles) {
  const html = fs.readFileSync(file, "utf8");
  pageHtml.set(file, html);
  pageRoute.set(file, routeFor(file));

  if (!/<html\b[^>]*\blang="en"/i.test(html)) fail(file, "Missing lang=\"en\" on <html>");
  if (!/<meta\s+name="viewport"\s+content="[^"]*width=device-width/i.test(html)) {
    fail(file, "Missing responsive viewport meta tag");
  }
  if (!/<meta\s+charset="utf-8"/i.test(html)) fail(file, "Missing UTF-8 charset");

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    fail(file, "Missing or empty <title>");
  } else {
    const title = titleMatch[1].trim();
    if (titles.has(title)) fail(file, `Duplicate title also used by ${rel(titles.get(title))}: ${title}`);
    else titles.set(title, file);
    if (title.length > 70) warn(file, `Title is ${title.length} characters (recommended ≤ 70)`, lineAt(html, titleMatch.index));
  }

  const metaTags = [...html.matchAll(/<meta\b([^>]*)>/gi)];
  const getMeta = (name) => {
    for (const match of metaTags) {
      if ((getAttr(match[1], "name") || "").toLowerCase() === name) return getAttr(match[1], "content");
    }
    return null;
  };

  const description = getMeta("description");
  if (!description) {
    fail(file, "Missing meta description");
  } else {
    if (descriptions.has(description)) {
      fail(file, `Duplicate meta description also used by ${rel(descriptions.get(description))}`);
    } else {
      descriptions.set(description, file);
    }
    if (description.length < 70) warn(file, `Meta description is short (${description.length} characters)`);
    if (description.length > 165) warn(file, `Meta description is long (${description.length} characters)`);
  }

  if (!getMeta("robots")) fail(file, "Missing robots meta tag");
  if (file.endsWith("404.html") && !/noindex/i.test(getMeta("robots") || "")) {
    fail(file, "404 page must be noindex");
  }

  const linkTags = [...html.matchAll(/<link\b([^>]*)>/gi)];
  let canonicalUrl = null;
  for (const match of linkTags) {
    const relValue = (getAttr(match[1], "rel") || "").toLowerCase();
    if (relValue === "canonical") canonicalUrl = getAttr(match[1], "href");
    if (relValue === "stylesheet") checkAsset(file, html, getAttr(match[1], "href"), "Stylesheet", match.index);
    if (relValue === "preload") checkAsset(file, html, getAttr(match[1], "href"), "Preload", match.index);
    if (relValue === "icon" || relValue === "apple-touch-icon" || relValue === "manifest") {
      checkAsset(file, html, getAttr(match[1], "href"), "Site icon/manifest", match.index);
    }
  }

  const expectedCanonical = routeFor(file) === "/" ? `${BASE}/` : `${BASE}${routeFor(file)}`;
  if (!canonicalUrl) {
    fail(file, "Missing canonical link");
  } else {
    if (canonicalUrl !== expectedCanonical) {
      fail(file, `Canonical is ${canonicalUrl}; expected ${expectedCanonical}`);
    }
    if (canonicals.has(canonicalUrl)) fail(file, `Duplicate canonical also used by ${rel(canonicals.get(canonicalUrl))}`);
    else canonicals.set(canonicalUrl, file);
  }

  const ogImage = (() => {
    for (const match of metaTags) {
      if ((getAttr(match[1], "property") || "").toLowerCase() === "og:image") {
        return getAttr(match[1], "content");
      }
    }
    return null;
  })();
  if (!ogImage) {
    fail(file, "Missing og:image");
  } else {
    const relative = ogImage.startsWith(BASE) ? ogImage.slice(BASE.length) : ogImage;
    checkAsset(file, html, relative, "og:image", ogImage ? html.indexOf(ogImage) : 0);
  }
  if (!getMeta("twitter:card")) fail(file, "Missing twitter:card");

  const h1s = [...html.matchAll(/<h1\b[^>]*>/gi)];
  if (h1s.length !== 1) fail(file, `Expected exactly one <h1>, found ${h1s.length}`);

  if (!/<a[^>]*class="skip-link"[^>]*href="#main"/i.test(html)) fail(file, "Missing skip link to #main");
  if (!/<main\b[^>]*\bid="main"/i.test(html)) fail(file, "Missing <main id=\"main\">");
  if (!/<header\b[^>]*class="site-header"/i.test(html)) fail(file, "Missing shared site header");
  if (!/<footer\b[^>]*class="site-footer"/i.test(html)) fail(file, "Missing shared site footer");
  if (!/data-apply-dialog/.test(html)) fail(file, "Missing application dialog");
  if (!/data-apply-form/.test(html)) fail(file, "Missing application form");
  if (!/class="mobile-bar"/.test(html)) fail(file, "Missing mobile action bar");

  /* IDs and ARIA references */
  const ids = new Set();
  for (const match of html.matchAll(/(?<![-\w])id\s*=\s*"([^"]+)"/gi)) {
    const id = match[1];
    if (ids.has(id)) fail(file, `Duplicate id="${id}"`, lineAt(html, match.index));
    ids.add(id);
  }
  allIds.set(routeFor(file), ids);

  for (const match of html.matchAll(/\baria-(controls|labelledby|describedby|owns)="([^"]+)"/gi)) {
    for (const ref of match[2].split(/\s+/).filter(Boolean)) {
      if (!ids.has(ref)) {
        fail(file, `aria-${match[1]}="${ref}" does not match an id on this page`, lineAt(html, match.index));
      }
    }
  }

  /* Every button should have a type */
  for (const match of html.matchAll(/<button\b([^>]*)>/gi)) {
    if (!hasAttr(match[1], "type")) warn(file, "Button without a type attribute", lineAt(html, match.index));
  }

  /* Images */
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = match[1];
    const alt = getAttr(attrs, "alt");
    const src = getAttr(attrs, "src");
    if (alt === null) fail(file, "Image is missing an alt attribute", lineAt(html, match.index));
    if (!src) {
      if (!/data-lightbox-img/.test(attrs)) fail(file, "Image has no src", lineAt(html, match.index));
    } else {
      checkAsset(file, html, src, "Image", match.index);
    }
    if (!hasAttr(attrs, "width") || !hasAttr(attrs, "height")) {
      warn(file, "Image without width and height (layout shift risk)", lineAt(html, match.index));
    }
    if (!hasAttr(attrs, "loading") && !/fetchpriority="high"/i.test(attrs)) {
      warn(file, "Image without loading attribute", lineAt(html, match.index));
    }
    if (alt === "" && src && !/logo|favicon|icon/i.test(src) && !/data-lightbox-img/.test(attrs)) {
      warn(file, "Non-decorative image has empty alt text", lineAt(html, match.index));
    }
  }

  for (const match of html.matchAll(/<source\b([^>]*)>/gi)) {
    const srcset = getAttr(match[1], "srcset");
    if (!srcset) continue;
    for (const url of srcsetUrls(srcset)) {
      checkAsset(file, html, url, "Picture source", match.index);
    }
  }

  for (const match of html.matchAll(/\bdata-(avif|webp|src)="([^"]+)"/gi)) {
    const kind = match[1];
    const value = match[2];
    if (!value) continue;
    if (kind === "src") checkAsset(file, html, value, "Lightbox image", match.index);
    else for (const url of srcsetUrls(value)) checkAsset(file, html, url, "Lightbox source", match.index);
  }

  /* Links */
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = match[1];
    const href = getAttr(attrs, "href");
    if (href === null || href === "") {
      fail(file, "Anchor without href", lineAt(html, match.index));
      continue;
    }
    if (isExternal(href) || href.startsWith("#")) continue;

    const target = fileForUrl(href, file);
    if (!target) {
      fail(file, `Broken internal link: ${href}`, lineAt(html, match.index));
      continue;
    }

    if (href.includes(".html")) {
      warn(file, `Internal link uses .html; prefer the clean URL: ${href}`, lineAt(html, match.index));
    }

    const hash = hashOf(href);
    if (hash && hash !== "apply") {
      const targetHtml = pageHtml.get(target) || fs.readFileSync(target, "utf8");
      const decoded = decodeURIComponent(hash);
      const targetIds = allIds.get(routeFor(target));
      const found =
        (targetIds && targetIds.has(decoded)) ||
        new RegExp(`\\bid\\s*=\\s*"${decoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(targetHtml);
      if (!found) fail(file, `Link target has no matching id: ${href}`, lineAt(html, match.index));
    }

    if ((getAttr(attrs, "target") || "") === "_blank") {
      const relValue = getAttr(attrs, "rel") || "";
      if (!/\bnoopener\b/i.test(relValue) && !/\bnoreferrer\b/i.test(relValue)) {
        fail(file, `target="_blank" link without rel="noopener": ${href}`, lineAt(html, match.index));
      }
    }
  }

  /* Forms */
  for (const match of html.matchAll(/<form\b([^>]*)>/gi)) {
    const action = getAttr(match[1], "action");
    const method = (getAttr(match[1], "method") || "get").toLowerCase();
    if (action && action.startsWith("/")) {
      if (!fileForUrl(action, file) && !exists(path.join(ROOT, "functions", `${action.slice(1)}.js`))) {
        fail(file, `Form action does not resolve: ${action}`, lineAt(html, match.index));
      }
    }
    if (method === "post" && action && !action.startsWith("https://")) {
      /* Expected: same-origin server endpoint. */
    }
  }

  /* Iframes */
  for (const match of html.matchAll(/<iframe\b([^>]*)>/gi)) {
    const src = getAttr(match[1], "src");
    if (!src) fail(file, "Iframe has no src", lineAt(html, match.index));
    if (!getAttr(match[1], "title")) fail(file, "Iframe has no title", lineAt(html, match.index));
    if (!src.startsWith("https://")) warn(file, "Iframe is not HTTPS", lineAt(html, match.index));
  }

  /* Structured data */
  const jsonLdBlocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!jsonLdBlocks.length && !file.endsWith("404.html")) fail(file, "Missing JSON-LD structured data");
  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      fail(file, `JSON-LD does not parse: ${error.message}`, lineAt(html, block.index));
    }
  }

  /* No inline executable scripts (CSP script-src 'self') */
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    const type = (getAttr(attrs, "type") || "").toLowerCase();
    const src = getAttr(attrs, "src");
    if (!src && type !== "application/ld+json" && type !== "application/json") {
      fail(file, "Inline executable script will be blocked by the CSP", lineAt(html, match.index));
    }
    if (src) checkAsset(file, html, src, "Script", match.index);
  }

  /* Placeholder and lorem checks */
  if (/lorem ipsum/i.test(html)) fail(file, "Lorem ipsum placeholder found");
  if (/\b(TODO|TBD)\b/.test(html)) fail(file, "TODO/TBD marker found");
}

/* ------------------------------------------------------------------ */
/* Cross-page checks                                                  */
/* ------------------------------------------------------------------ */

const home = pageHtml.get(path.join(ROOT, "index.html")) || "";
if (home) {
  for (const type of ["EducationalOrganization", "Course", "FAQPage"]) {
    if (!home.includes(`"@type":"${type}"`)) fail(path.join(ROOT, "index.html"), `Missing ${type} schema`);
  }
}

const expectedSitemap = [...pageFiles]
  .filter((file) => !file.endsWith("404.html"))
  .map((file) => {
    const route = routeFor(file);
    return route === "/" ? `${BASE}/` : `${BASE}${route}`;
  });

const sitemapFile = path.join(ROOT, "sitemap.xml");
if (!exists(sitemapFile)) {
  fail(sitemapFile, "sitemap.xml is missing");
} else {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => decodeEntities(match[1]));
  const expectedSet = new Set(expectedSitemap);
  const sitemapSet = new Set(locs);
  for (const loc of expectedSet) {
    if (!sitemapSet.has(loc)) fail(sitemapFile, `Sitemap is missing ${loc}`);
  }
  for (const loc of sitemapSet) {
    if (!expectedSet.has(loc)) fail(sitemapFile, `Sitemap has an unexpected URL: ${loc}`);
  }
  if (locs.length !== sitemapSet.size) fail(sitemapFile, "Sitemap contains duplicate URLs");
}

const robotsFile = path.join(ROOT, "robots.txt");
if (!exists(robotsFile)) fail(robotsFile, "robots.txt is missing");
else {
  const robots = fs.readFileSync(robotsFile, "utf8");
  if (!robots.includes(`${BASE}/sitemap.xml`)) fail(robotsFile, "robots.txt does not point to the sitemap");
  if (!/User-agent:\s*\*/i.test(robots)) fail(robotsFile, "robots.txt has no User-agent rule");
}

const manifestFile = path.join(ROOT, "site.webmanifest");
if (!exists(manifestFile)) {
  fail(manifestFile, "site.webmanifest is missing");
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    for (const icon of manifest.icons || []) {
      if (!assetFor(icon.src, manifestFile)) fail(manifestFile, `Manifest icon is missing: ${icon.src}`);
    }
  } catch (error) {
    fail(manifestFile, `Manifest does not parse: ${error.message}`);
  }
}

for (const required of ["_headers", "_redirects", ".assetsignore", "functions/api/apply.js", "wrangler.toml"]) {
  if (!exists(path.join(ROOT, required))) fail(path.join(ROOT, required), `${required} is missing`);
}

const headerFile = path.join(ROOT, "_headers");
if (exists(headerFile)) {
  const headers = fs.readFileSync(headerFile, "utf8");
  if (!/Content-Security-Policy:/i.test(headers)) fail(headerFile, "No Content-Security-Policy in _headers");
  if (!/Strict-Transport-Security:/i.test(headers)) fail(headerFile, "No HSTS header in _headers");
}

/* Every page should be reachable from a link somewhere on the site. */
const linkedPaths = new Set();
for (const [file, html] of pageHtml) {
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const href = getAttr(match[1], "href");
    if (!href || isExternal(href) || href.startsWith("#")) continue;
    const target = fileForUrl(href, file);
    if (target) linkedPaths.add(routeFor(target));
  }
}
for (const [file] of pageHtml) {
  const route = routeFor(file);
  if (route === "/404") continue;
  if (!linkedPaths.has(route)) warn(file, `Page ${route} is not linked from any page`);
}

/* Check all CSS asset references (fonts, images). */
const cssFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".css")) cssFiles.push(full);
  }
}
walk(path.join(ROOT, "assets"));

for (const cssFile of cssFiles) {
  const css = fs.readFileSync(cssFile, "utf8");
  for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    const url = match[2].trim();
    if (!url || url.startsWith("data:") || url.startsWith("#") || isExternal(url)) continue;
    if (!assetFor(url, cssFile)) {
      fail(cssFile, `CSS references a missing file: ${url}`, lineAt(css, match.index));
    }
  }
}

/* Image manifest consistency. */
for (const [key, image] of Object.entries(images)) {
  if (!image || !Array.isArray(image.sources) || !image.sources.length) {
    fail(path.join(ROOT, "data", "images.json"), `Image "${key}" has no responsive sources`);
    continue;
  }
  for (const source of image.sources) {
    for (const format of ["webp", "avif"]) {
      if (!source[format]) fail(path.join(ROOT, "data", "images.json"), `Image "${key}" is missing ${format}`);
      else if (!assetFor("/" + source[format].replace(/^\/+/, ""), path.join(ROOT, "data", "images.json"))) {
        fail(path.join(ROOT, "data", "images.json"), `Image "${key}" ${format} file is missing: ${source[format]}`);
      }
    }
  }
}

/* Data integrity spot checks. */
const runningMath = batches.mathBatches.filter((batch) => batch.status === "running").length;
const runningScience = batches.scienceBatches.filter((batch) => batch.status === "running").length;
if (runningMath !== 7) fail(path.join(ROOT, "data", "batches.json"), `Expected 7 running math batches, found ${runningMath}`);
if (runningScience !== 3) fail(path.join(ROOT, "data", "batches.json"), `Expected 3 running science batches, found ${runningScience}`);
if (problems.problems.length !== 32) {
  fail(path.join(ROOT, "data", "problems.json"), `Expected 32 sample problems, found ${problems.problems.length}`);
}
if (gallery.items.length < 17) {
  warn(path.join(ROOT, "data", "gallery.json"), `Expected at least 17 photographs, found ${gallery.items.length}`);
}

/* ------------------------------------------------------------------ */
/* Output                                                             */
/* ------------------------------------------------------------------ */

function print(list, label) {
  if (!list.length) return;
  console.log(`\n${label} (${list.length})`);
  for (const item of list) {
    const location = item.line ? `${rel(item.file)}:${item.line}` : rel(item.file);
    console.log(`  ${location} — ${item.message}`);
  }
}

console.log("TEMS Academy site check");
console.log(`  Pages: ${pageFiles.length}`);
console.log(`  Internal links: ${[...pageHtml.values()].reduce((count, html) => count + (html.match(/<a\b/g) || []).length, 0)}`);
console.log(`  Images: ${[...pageHtml.values()].reduce((count, html) => count + (html.match(/<img\b/g) || []).length, 0)}`);
console.log(`  CSS files scanned: ${cssFiles.length}`);
console.log(`  Sitemap URLs: ${expectedSitemap.length}`);

print(warnings, "Warnings");
print(errors, "Errors");

if (errors.length) {
  console.log(`\nCheck failed: ${errors.length} error${errors.length === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log(`\nCheck passed${warnings.length ? ` with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : ""}.`);
