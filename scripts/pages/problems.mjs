import {
  attr,
  breadcrumbSchema,
  canonical,
  esc,
  head,
  layout,
  math,
  nextStepBand,
  organizationSchema,
  pageHero,
  sectionHead
} from "../lib/core.mjs";

const SUBJECTS = [
  { id: "all", label: "All subjects" },
  { id: "mathematics", label: "Mathematics" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "biology", label: "Biology" }
];

const TIERS = [
  { id: "all", label: "All tiers" },
  { id: "gamma", label: "Gamma · Foundation", glyph: "Γ" },
  { id: "alpha", label: "Alpha · Contest", glyph: "Α" },
  { id: "sigma", label: "Sigma · Advanced", glyph: "Σ" }
];

function problemCard(problem) {
  const tier = TIERS.find((t) => t.id === problem.tier);
  return `
<article class="problem-card" data-subject="${attr(problem.subject)}" data-tier="${attr(problem.tier)}">
  <header class="problem-head">
    <div>
      <p class="index">${esc(problem.subjectLabel)}</p>
      <h2>${esc(problem.title)}</h2>
    </div>
    <span class="tier-badge" title="${attr(tier ? tier.label : problem.tierLabel)}">
      <span aria-hidden="true">${esc(tier ? tier.glyph : "")}</span>
      <small>${esc(problem.tierLabel)}</small>
    </span>
  </header>
  <div class="problem-statement">${math(problem.statement)}</div>
  <details class="disclosure problem-disclosure">
    <summary>Hint</summary>
    <div class="disclosure-body">${math(problem.hint)}</div>
  </details>
  <details class="disclosure problem-disclosure">
    <summary>Worked solution</summary>
    <div class="disclosure-body">
      ${math(problem.solution)}
      <p class="problem-answer"><strong>Answer:</strong> ${math(problem.answer)}</p>
    </div>
  </details>
</article>`;
}

export default function buildProblems(ctx) {
  const { pages, problems, batches } = ctx;
  const page = pages["sample-problems"];

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Sample problems", href: "/sample-problems" }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical("/sample-problems"),
      url: canonical("/sample-problems"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">How to use this page</p>
  <ol class="hero-numbered">
    <li>Try the problem with the page closed.</li>
    <li>Open the hint only when you have written something down.</li>
    <li>Compare methods with the worked solution, not just the answer.</li>
  </ol>
  <p class="form-note">${esc(problems.note)}</p>
</div>`;

  const main = `
${pageHero(ctx, "sample-problems", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Apply for a diagnostic</button>
      <a class="btn btn-quiet" href="/resources">Find study material</a>`,
    aside
  })}

<section class="section problems-section" id="problems">
  <div class="shell">
    ${sectionHead(
      "The problem set",
      "Thirty-two original problems, <span class=\"accent\">three tiers.</span>",
      "Filter by subject and tier. Each problem has a hint and a full worked solution."
    )}
    <div class="problem-filters" data-problem-filters>
      <div class="filter-group" role="group" aria-label="Filter by subject">
        ${SUBJECTS.map(
          (subject, index) => `
        <button class="filter-chip${index === 0 ? " is-active" : ""}" type="button"
          data-problem-subject="${attr(subject.id)}" aria-pressed="${index === 0}">${esc(subject.label)}</button>`
        ).join("")}
      </div>
      <div class="filter-group" role="group" aria-label="Filter by tier">
        ${TIERS.map(
          (tier, index) => `
        <button class="filter-chip${index === 0 ? " is-active" : ""}" type="button"
          data-problem-tier="${attr(tier.id)}" aria-pressed="${index === 0}">${esc(tier.label)}</button>`
        ).join("")}
      </div>
    </div>
    <div class="filter-line">
      <p class="filter-count" aria-live="polite" data-problem-count></p>
      <button class="text-button" type="button" data-problem-reset>Reset filters</button>
    </div>
    <div class="problem-grid" data-problem-grid>
      ${problems.problems.map(problemCard).join("")}
    </div>
    <p class="problem-empty" data-problem-empty hidden>No problems match those filters. Try another subject or tier.</p>
  </div>
</section>

<section class="section tier-guide-section">
  <div class="shell">
    ${sectionHead(
      "The tiers",
      "Same subject. <span class=\"accent\">Different distance from the answer.</span>",
      "The tier names describe the problem style, not a student’s school class."
    )}
    <div class="tier-guide">
      ${batches.tiers
        .map(
          (tier) => `
      <article class="tier-card tier-card--${attr(tier.id)}">
        <span class="tier-glyph" aria-hidden="true">${esc(tier.glyph)}</span>
        <p class="index">${esc(tier.level)}</p>
        <h3>${esc(tier.name)}</h3>
        <p>${esc(tier.summary)}</p>
        <p class="tier-detail">${esc(tier.detail)}</p>
      </article>`
        )
        .join("")}
    </div>
  </div>
</section>

${nextStepBand(
  ctx,
  "A problem is a place to start thinking.",
  "If the Sigma problems feel like the right kind of hard, the diagnostic will tell us where to begin."
)}
`;

  return layout(ctx, {
    pageId: "sample-problems",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/sample-problems",
      needsMath: true,
      graph
    }),
    main
  });
}
