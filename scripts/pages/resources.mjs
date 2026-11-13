import {
  attr,
  breadcrumbSchema,
  canonical,
  esc,
  head,
  layout,
  nextStepBand,
  organizationSchema,
  pageHero,
  sectionHead
} from "../lib/core.mjs";

export default function buildResources(ctx) {
  const { pages, resources } = ctx;
  const page = pages.resources;

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Resources", href: "/resources" }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical("/resources"),
      url: canonical("/resources"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">About this shelf</p>
  <p>Guides are written by TEMS. Book entries are reference suggestions, not academy publications. Archive links go to the official organisers.</p>
  <a class="text-link" href="#archives">Official past-paper archives <span aria-hidden="true">↓</span></a>
</div>`;

  const main = `
${pageHero(ctx, "resources", {
    actions: `<a class="btn btn-primary" href="#guides">Start with the guides</a>
      <a class="btn btn-quiet" href="/sample-problems">Try the problems</a>`,
    aside
  })}

<section class="section resources-section" id="library">
  <div class="shell">
    ${sectionHead(
      "The library",
      "A short shelf, <span class=\"accent\">kept useful.</span>",
      "Filter by subject. “All subjects” guides stay visible because they apply everywhere."
    )}
    <div class="filter-row" role="group" aria-label="Filter resources by subject" data-resource-filters>
      ${resources.subjects
        .map(
          (subject, index) => `
      <button class="filter-chip${index === 0 ? " is-active" : ""}" type="button"
        data-resource-filter="${attr(subject.id)}" aria-pressed="${index === 0}">${esc(subject.label)}</button>`
        )
        .join("")}
    </div>

    <div class="resource-block" id="guides">
      <div class="resource-block-head">
        <p class="index">Study guides</p>
        <h2 class="display">How to work, not just what to read.</h2>
      </div>
      <div class="guide-grid">
        ${resources.guides
          .map(
            (guide) => `
        <article class="guide-card" data-resource-item data-subject="${attr(guide.subject)}">
          <div class="guide-head">
            <span class="tag">${esc(guide.subjectLabel)}</span>
            <span class="tag tag--quiet">${esc(guide.tierLabel)}</span>
          </div>
          <h3>${esc(guide.title)}</h3>
          <p>${esc(guide.summary)}</p>
          <ul class="tick-list">
            ${guide.points.map((point) => `<li>${esc(point)}</li>`).join("")}
          </ul>
        </article>`
          )
          .join("")}
      </div>
    </div>

    <div class="resource-block" id="books">
      <div class="resource-block-head">
        <p class="index">Reference shelf</p>
        <h2 class="display">Books worth owning.</h2>
        <p class="section-lead">These are suggestions for wider reading. They are not required purchases, and the academy does not sell them through this site.</p>
      </div>
      <div class="book-grid">
        ${resources.books
          .map(
            (book) => `
        <article class="book-card" data-resource-item data-subject="${attr(book.subject)}">
          <p class="book-subject">${esc(book.subjectLabel)} <span>${esc(book.level)}</span></p>
          <h3>${esc(book.title)}</h3>
          <p class="book-author">${esc(book.author)}</p>
          <p>${esc(book.note)}</p>
        </article>`
          )
          .join("")}
      </div>
    </div>

    <div class="resource-block" id="archives">
      <div class="resource-block-head">
        <p class="index">Past papers</p>
        <h2 class="display">Go to the official archive.</h2>
        <p class="section-lead">We link to the organiser rather than mirroring papers. Some archives require a teacher account or a password supplied by the organiser.</p>
      </div>
      <ul class="archive-list">
        ${resources.archives
          .map(
            (archive) => `
        <li data-resource-item data-subject="${attr(archive.subject)}">
          <div class="archive-subject">${esc(archive.subjectLabel)}</div>
          <div class="archive-body">
            <h3><a href="${attr(archive.url)}" target="_blank" rel="noopener noreferrer">${esc(archive.name)} <span aria-hidden="true">↗</span></a></h3>
            <p>${esc(archive.note)}</p>
          </div>
          <a class="archive-go" href="${attr(archive.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${attr(archive.name)}">Open</a>
        </li>`
          )
          .join("")}
      </ul>
    </div>
  </div>
</section>

<section class="section tips-section">
  <div class="shell tips-grid">
    <div>
      <p class="index">Study habits</p>
      <h2 class="display">Six habits that <span class="accent">compound.</span></h2>
      <p class="section-lead">None of these require a new book. They require a notebook and a week of consistency.</p>
    </div>
    <ol class="tips-list">
      ${resources.tips.map((tip, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><p>${esc(tip)}</p></li>`).join("")}
    </ol>
  </div>
</section>

${nextStepBand(
  ctx,
  "A shelf is not a syllabus.",
  "The batch sets decide what to work on next. Bring the book you are stuck in and a mentor will help you place it."
)}
`;

  return layout(ctx, {
    pageId: "resources",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/resources",
      graph
    }),
    main
  });
}
