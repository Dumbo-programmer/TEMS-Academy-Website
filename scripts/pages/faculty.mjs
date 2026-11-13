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
  picture,
  sectionHead
} from "../lib/core.mjs";

export default function buildFaculty(ctx) {
  const { pages, faculty, gallery, images } = ctx;
  const page = pages.faculty;
  const classroom = gallery.items.find((item) => item.id === "teacher");

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Faculty", href: "/faculty" }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical("/faculty"),
      url: canonical("/faculty"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">What is published</p>
  <p class="faculty-statement">${esc(faculty.statement)}</p>
  <p class="form-note">${esc(faculty.statementNote)}</p>
</div>`;

  const areas = faculty.areas
    .map(
      (area, index) => `
  <article class="faculty-area">
    <span class="faculty-area-number">${String(index + 1).padStart(2, "0")}</span>
    <h3>${esc(area.subject)}</h3>
    <p class="faculty-focus">${esc(area.focus)}</p>
    <p>${esc(area.detail)}</p>
  </article>`
    )
    .join("");

  const main = `
${pageHero(ctx, "faculty", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Apply for a diagnostic</button>
      <a class="btn btn-quiet" href="#teaching">How teaching works</a>`,
    aside
  })}

<section class="section faculty-statement-section">
  <div class="shell faculty-statement-grid">
    <figure class="faculty-figure">
      ${classroom
        ? picture(images, classroom.image, {
            alt: classroom.alt,
            sizes: "(max-width: 860px) 100vw, 48vw"
          })
        : ""}
      <figcaption>${classroom ? esc(classroom.caption) : "A TEMS classroom session."}</figcaption>
    </figure>
    <div>
      <p class="index">The teaching team</p>
      <h2 class="display">${esc(faculty.statement)}</h2>
      <p class="lead">That is the description the academy publishes. The site does not invent names, qualifications or competition records to fill a page.</p>
      <p>Mentors work through problems alongside students, mark written solutions and connect the method to the competition style. Individual profiles are added only when the academy supplies and approves them.</p>
    </div>
  </div>
</section>

<section class="section faculty-areas-section" id="teaching">
  <div class="shell">
    ${sectionHead(
      "Subjects",
      "Who teaches <span class=\"accent\">what.</span>",
      "Five teaching areas. The subject focus is published; individual biographies are not yet."
    )}
    <div class="faculty-area-grid">${areas}</div>
  </div>
</section>

<section class="section mentor-profiles-section">
  <div class="shell faculty-statement-grid">
    <div>
      ${sectionHead(
        "In class",
        "What the teaching team <span class=\"accent\">does.</span>",
        "The teaching model follows the academy’s published approach. Individual names, subjects and biographies are published only when the academy supplies and approves them."
      )}
      <ul class="tick-list">
        <li>Mentors work through problems alongside students rather than only lecturing from a textbook.</li>
        <li>Written solutions are read and marked for the argument, not only the final answer.</li>
        <li>Weekly problem sets and the monthly benchmark show when a placement should change.</li>
        <li>The batch, session and fee are confirmed at placement; ask who will teach the group.</li>
      </ul>
    </div>
    <div class="policy-panel">
      <p class="index">Publication policy</p>
      <ul class="tick-list">
        ${faculty.policy.map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </div>
  </div>
</section>

${nextStepBand(
  ctx,
  "Ask about the mentor at the diagnostic.",
  "The batch, session and fee are confirmed at placement. Ask who will teach the group before the first class."
)}
`;

  return layout(ctx, {
    pageId: "faculty",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/faculty",
      graph
    }),
    main
  });
}
