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

function subjectPanel(subject, index) {
  return `
<article class="pathway-panel${index === 0 ? " is-active" : ""}" id="pathway-${attr(subject.id)}"
  role="tabpanel" aria-labelledby="pathway-tab-${attr(subject.id)}"${index === 0 ? "" : " hidden"} data-pathway-panel>
  <div class="pathway-panel-head">
    <p class="index">${esc(subject.subject)}</p>
    <h2 class="display">${esc(subject.tagline)}</h2>
    <p class="lead">${esc(subject.summary)}</p>
  </div>

  <div class="pathway-layout">
    <div class="pathway-stages-wrap">
      <p class="index">The usual progression</p>
      <ol class="pathway-stages">
        ${subject.stages
          .map(
            (stage, stageIndex) => `
        <li>
          <span class="pathway-stage-number">${String(stageIndex + 1).padStart(2, "0")}</span>
          <div>
            <h3>${esc(stage.name)}</h3>
            <p>${esc(stage.description)}</p>
          </div>
        </li>`
          )
          .join("")}
      </ol>
    </div>

    <aside class="pathway-aside">
      <div class="international-block">
        <p class="index">International routes</p>
        ${subject.international
          .map(
            (competition) => `
        <article class="international-card">
          <div class="international-head">
            <strong>${esc(competition.name)}</strong>
            <span>${esc(competition.fullName)}</span>
          </div>
          <p>${esc(competition.note)}</p>
          <p class="eligibility"><strong>Eligibility</strong> ${esc(competition.eligibility)}</p>
          <a class="text-link" href="${attr(competition.url)}" target="_blank" rel="noopener noreferrer">Official site <span aria-hidden="true">↗</span></a>
        </article>`
          )
          .join("")}
      </div>

      <div class="facts-block">
        <p class="index">Facts checked</p>
        <dl class="fact-list">
          ${subject.facts.map((fact) => `<div><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`).join("")}
        </dl>
      </div>

      <div class="sources-block">
        <p class="index">Sources</p>
        <ul>
          ${subject.sources
            .map(
              (source) =>
                `<li><a href="${attr(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} <span aria-hidden="true">↗</span></a></li>`
            )
            .join("")}
        </ul>
      </div>
    </aside>
  </div>
</article>`;
}

export default function buildPathway(ctx) {
  const { pages, pathway } = ctx;
  const page = pages.pathway;

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Olympiad pathway", href: "/pathway" }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical("/pathway"),
      url: canonical("/pathway"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">Facts checked</p>
  <p class="hero-note-date">${esc(pathway.lastChecked)}</p>
  <p>Rules, dates and age limits change. We record what the official sources said on the check date.</p>
  <a class="text-link" href="#pathway-routes">Read the routes <span aria-hidden="true">↓</span></a>
</div>`;

  const main = `
${pageHero(ctx, "pathway", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Prepare with TEMS</button>
      <a class="btn btn-quiet" href="/sample-problems">Try a sample problem</a>`,
    aside
  })}

<section class="section pathway-section" id="pathway-routes">
  <div class="shell">
    ${sectionHead(
      "By subject",
      "Five routes, <span class=\"accent\">one official source each.</span>",
      pathway.intro
    )}
    <div class="pathway-tabs" data-pathway-tabs>
      <div class="tab-list" role="tablist" aria-label="Olympiad subjects">
        ${pathway.subjects
          .map(
            (subject, index) => `
        <button class="tab${index === 0 ? " is-active" : ""}" type="button" role="tab"
          id="pathway-tab-${attr(subject.id)}" aria-controls="pathway-${attr(subject.id)}"
          aria-selected="${index === 0}" data-pathway-tab="${attr(subject.id)}">
          <span>${esc(subject.subject)}</span>
          <small>${esc(subject.international.map((i) => i.name).join(" · "))}</small>
        </button>`
          )
          .join("")}
      </div>
      <div class="pathway-panels">
        ${pathway.subjects.map(subjectPanel).join("")}
      </div>
    </div>
    <div class="source-disclaimer">
      <p><strong>${esc(pathway.lastCheckedLabel)}.</strong> ${esc(pathway.disclaimer)}</p>
      <p>TEMS prepares students for the problem style at each stage. The academy does not register students for national rounds, select national teams or guarantee a place in any competition.</p>
    </div>
  </div>
</section>

${nextStepBand(
  ctx,
  "Train for the stage you are actually at.",
  "The diagnostic places a student by ability. From there, the weekly sets and monthly benchmark decide what comes next."
)}
`;

  return layout(ctx, {
    pageId: "pathway",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/pathway",
      graph
    }),
    main
  });
}
