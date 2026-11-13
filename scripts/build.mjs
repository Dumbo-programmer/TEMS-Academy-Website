import fs from "fs";
import path from "path";
import { canonical, loadData, ROOT } from "./lib/core.mjs";
import buildHome from "./pages/home.mjs";
import buildClassStructure from "./pages/class-structure.mjs";
import buildPathway from "./pages/pathway.mjs";
import buildProblems from "./pages/problems.mjs";
import buildResources from "./pages/resources.mjs";
import buildResults from "./pages/results.mjs";
import buildFaculty from "./pages/faculty.mjs";
import buildAdmissions from "./pages/admissions.mjs";
import buildContact from "./pages/contact.mjs";
import { build404, buildPrivacy, buildTerms } from "./pages/legal.mjs";

const ctx = loadData();

const pages = [
  { file: "index.html", route: "/", html: buildHome(ctx), inSitemap: true },
  { file: "class-structure.html", route: "/class-structure", html: buildClassStructure(ctx), inSitemap: true },
  { file: "pathway.html", route: "/pathway", html: buildPathway(ctx), inSitemap: true },
  { file: "sample-problems.html", route: "/sample-problems", html: buildProblems(ctx), inSitemap: true },
  { file: "resources.html", route: "/resources", html: buildResources(ctx), inSitemap: true },
  { file: "results.html", route: "/results", html: buildResults(ctx), inSitemap: true },
  { file: "faculty.html", route: "/faculty", html: buildFaculty(ctx), inSitemap: true },
  { file: "admissions.html", route: "/admissions", html: buildAdmissions(ctx), inSitemap: true },
  { file: "contact.html", route: "/contact", html: buildContact(ctx), inSitemap: true },
  { file: "terms.html", route: "/terms", html: buildTerms(ctx), inSitemap: true },
  { file: "privacy.html", route: "/privacy", html: buildPrivacy(ctx), inSitemap: true },
  { file: "404.html", route: "/404", html: build404(ctx), inSitemap: false }
];

for (const page of pages) {
  fs.writeFileSync(path.join(ROOT, page.file), page.html, "utf8");
}

const sitemapEntries = pages
  .filter((page) => page.inSitemap)
  .map(
    (page) =>
      `  <url>\n    <loc>${canonical(page.route)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${page.route === "/" ? "1.0" : page.route === "/class-structure" || page.route === "/admissions" ? "0.9" : "0.7"}</priority>\n  </url>`
  )
  .join("\n");

fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
  "utf8"
);

fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${canonical("/sitemap.xml")}\n`,
  "utf8"
);

fs.writeFileSync(
  path.join(ROOT, "site.webmanifest"),
  `${JSON.stringify(
    {
      name: ctx.site.org.name,
      short_name: ctx.site.org.shortName,
      description: ctx.site.seo.defaultDescription,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#f7f2e8",
      theme_color: ctx.site.seo.themeColor,
      lang: "en",
      icons: [
        { src: "/assets/img/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/assets/img/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Built ${pages.length} pages.`);
console.log(`Sitemap: ${pages.filter((page) => page.inSitemap).length} URLs.`);
console.log("Wrote sitemap.xml, robots.txt and site.webmanifest.");
