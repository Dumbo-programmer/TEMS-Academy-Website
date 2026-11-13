import {
  attr,
  breadcrumbSchema,
  canonical,
  esc,
  head,
  layout,
  organizationSchema,
  pageHero
} from "../lib/core.mjs";

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function legalPage(ctx, key, sections, updated) {
  const page = ctx.pages[key];
  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: page.title, href: `/${key}` }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical(`/${key}`),
      url: canonical(`/${key}`),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">Last updated</p>
  <p class="hero-note-date">${esc(updated)}</p>
  <p class="form-note">Questions about this page: <a href="mailto:${attr(ctx.site.org.email)}">${esc(ctx.site.org.email)}</a>.</p>
</div>`;

  const main = `
${pageHero(ctx, key, { aside })}

<section class="section legal-section">
  <div class="shell legal-layout">
    <nav class="legal-toc" aria-label="On this page">
      <p class="index">On this page</p>
      <ol>
        ${sections.map((section) => `<li><a href="#${attr(slug(section.title))}">${esc(section.title)}</a></li>`).join("")}
      </ol>
    </nav>
    <div class="legal-body">
      ${sections
        .map(
          (section) => `
      <section id="${attr(slug(section.title))}">
        <h2>${esc(section.title)}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      </section>`
        )
        .join("")}
      <p class="legal-updated">Last updated: ${esc(updated)}.</p>
    </div>
  </div>
</section>
`;

  return layout(ctx, {
    pageId: key,
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: `/${key}`,
      graph
    }),
    main
  });
}

export function buildTerms(ctx) {
  return legalPage(ctx, "terms", ctx.legal.terms.sections, ctx.legal.updated);
}

export function buildPrivacy(ctx) {
  return legalPage(ctx, "privacy", ctx.legal.privacy.sections, ctx.legal.updated);
}

export function build404(ctx) {
  const page = ctx.pages["404"];
  const main = `
${pageHero(ctx, "404", {
    actions: `<a class="btn btn-primary" href="/">Go to the homepage</a>
      <a class="btn btn-quiet" href="/class-structure">See the class structure</a>`
  })}

<section class="section notfound-section">
  <div class="shell notfound-grid">
    <a class="notfound-link" href="/class-structure"><span class="index">01</span><strong>Class structure</strong><p>Every batch, session and fee.</p></a>
    <a class="notfound-link" href="/sample-problems"><span class="index">02</span><strong>Sample problems</strong><p>32 original problems with solutions.</p></a>
    <a class="notfound-link" href="/admissions"><span class="index">03</span><strong>Admissions</strong><p>The four-step placement process.</p></a>
    <a class="notfound-link" href="/contact"><span class="index">04</span><strong>Contact</strong><p>The campus, WhatsApp and email.</p></a>
  </div>
</section>
`;

  return layout(ctx, {
    pageId: "404",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/404",
      robots: "noindex,follow"
    }),
    main
  });
}
