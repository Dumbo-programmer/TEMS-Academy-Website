import {
  attr,
  breadcrumbSchema,
  canonical,
  esc,
  head,
  layout,
  lightbox,
  nextStepBand,
  organizationSchema,
  pageHero,
  picture,
  sectionHead
} from "../lib/core.mjs";

function lightboxData(ctx, key, fallbackAlt) {
  const meta = ctx.images[key];
  if (!meta) {
    return {
      avif: "",
      webp: "",
      src: "",
      width: 1200,
      height: 800,
      alt: fallbackAlt
    };
  }
  const sources = [...meta.sources].sort((a, b) => a.width - b.width);
  const fallback = sources.find((s) => s.width >= 1200) || sources[sources.length - 1];
  return {
    avif: sources.map((s) => `${s.avif} ${s.width}w`).join(", "),
    webp: sources.map((s) => `${s.webp} ${s.width}w`).join(", "),
    src: fallback.webp,
    width: fallback.width,
    height: fallback.height,
    alt: fallbackAlt
  };
}

function galleryItem(ctx, item) {
  const data = lightboxData(ctx, item.image, item.alt);
  return `
<article class="gallery-card" data-gallery-category="${attr(item.category)}">
  <button class="gallery-card-media" type="button" data-lightbox-open
    data-avif="${attr(data.avif)}" data-webp="${attr(data.webp)}" data-src="${attr(data.src)}"
    data-width="${attr(data.width)}" data-height="${attr(data.height)}"
    data-caption="${attr(item.caption)}" data-alt="${attr(item.alt)}">
    ${picture(ctx.images, item.image, {
      alt: item.alt,
      sizes: "(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 25vw"
    })}
    <span class="gallery-zoom" aria-hidden="true">View</span>
  </button>
  <div class="gallery-card-copy">
    <p class="index">${esc(item.categoryLabel)}</p>
    <p>${esc(item.caption)}</p>
  </div>
</article>`;
}

function resultEntry(ctx, entry, yearIndex, entryIndex) {
  const galleryItem = ctx.gallery.items.find((g) => g.image === entry.photo) || null;
  const data = lightboxData(ctx, entry.photo, galleryItem ? galleryItem.alt : entry.title);
  return `
<article class="result-entry">
  <button class="result-entry-media" type="button" data-lightbox-open
    data-avif="${attr(data.avif)}" data-webp="${attr(data.webp)}" data-src="${attr(data.src)}"
    data-width="${attr(data.width)}" data-height="${attr(data.height)}"
    data-caption="${attr(galleryItem ? galleryItem.caption : entry.title)}"
    data-alt="${attr(galleryItem ? galleryItem.alt : entry.title)}">
    ${picture(ctx.images, entry.photo, {
      alt: galleryItem ? galleryItem.alt : entry.title,
      sizes: "(max-width: 760px) 100vw, 30vw"
    })}
    <span class="gallery-zoom" aria-hidden="true">View</span>
  </button>
  <div class="result-entry-body">
    <p class="index">${esc(entry.title)}</p>
    <h3>${esc(entry.result)}</h3>
    <p class="result-entry-students">${esc(entry.students)}</p>
    <p>${esc(entry.note)}</p>
    <p class="result-source">Source: ${esc(entry.source)}</p>
  </div>
</article>`;
}

export default function buildResults(ctx) {
  const { pages, results, gallery } = ctx;
  const page = pages.results;

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Results", href: "/results" }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical("/results"),
      url: canonical("/results"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">Archive policy</p>
  <ul class="tick-list tick-list--compact">
    <li>Only supplied or confirmed results.</li>
    <li>Names only when supplied.</li>
    <li>Years only when confirmed.</li>
    <li>A source for every claim.</li>
  </ul>
</div>`;

  const main = `
${pageHero(ctx, "results", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Apply for a diagnostic</button>
      <a class="btn btn-quiet" href="#photographs">See the photograph archive</a>`,
    aside
  })}

<section class="section results-archive-section" id="archive">
  <div class="shell">
    ${sectionHead(
      "The archive",
      "Year by year, <span class=\"accent\">without invented detail.</span>",
      "Where the academy has not supplied a year, the record sits in the undated section rather than being assigned a guess."
    )}
    <nav class="year-nav" aria-label="Results by year">
      ${results.years.map((year) => `<a href="#year-${attr(year.year)}">${esc(year.label)}</a>`).join("")}
    </nav>

    <div class="policy-panel">
      <p class="index">Policy</p>
      <ul class="tick-list">
        ${results.policy.map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </div>

    ${results.years
      .map(
        (year, yearIndex) => `
    <section class="year-section" id="year-${attr(year.year)}">
      <header class="year-head">
        <h2 class="display">${esc(year.label)}</h2>
        <p>${esc(year.summary)}</p>
      </header>
      <div class="result-entry-grid">
        ${year.entries.map((entry, entryIndex) => resultEntry(ctx, entry, yearIndex, entryIndex)).join("")}
      </div>
    </section>`
      )
      .join("")}
  </div>
</section>

<section class="section photo-archive-section" id="photographs">
  <div class="shell">
    ${sectionHead(
      "Photographs",
      "The archive, <span class=\"accent\">as supplied.</span>",
      gallery.note
    )}
    <div class="filter-row" role="group" aria-label="Filter photographs" data-gallery-filters>
      ${gallery.filters
        .map(
          (filter, index) => `
      <button class="filter-chip${index === 0 ? " is-active" : ""}" type="button"
        data-gallery-filter="${attr(filter.id)}" aria-pressed="${index === 0}">${esc(filter.label)}</button>`
        )
        .join("")}
    </div>
    <p class="filter-count" aria-live="polite" data-gallery-count></p>
    <div class="gallery-grid">
      ${gallery.items.map((item) => galleryItem(ctx, item)).join("")}
    </div>
  </div>
</section>
${lightbox()}

${nextStepBand(
  ctx,
  "The next result is not in the archive yet.",
  "It starts with a diagnostic, a weekly set and a benchmark. Send an application when you are ready."
)}
`;

  return layout(ctx, {
    pageId: "results",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/results",
      graph
    }),
    main
  });
}
