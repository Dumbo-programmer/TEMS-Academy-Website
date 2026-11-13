import {
  attr,
  breadcrumbSchema,
  canonical,
  coursesSchema,
  esc,
  head,
  layout,
  nextStepBand,
  organizationSchema,
  pageHero,
  sectionHead
} from "../lib/core.mjs";

function mathGrid(ctx) {
  const { batches } = ctx;
  const byId = new Map(batches.mathBatches.map((batch) => [batch.id, batch]));
  return `
<div class="batch-grid-wrap">
  <div class="batch-grid" role="group" aria-label="Mathematics batches by division and tier">
    <div class="batch-grid-corner" aria-hidden="true"><span>Division</span><span>Tier</span></div>
    ${batches.tiers
      .map(
        (tier) => `
    <div class="batch-grid-head">
      <span class="tier-glyph" aria-hidden="true">${esc(tier.glyph)}</span>
      <span><strong>${esc(tier.name)}</strong><small>${esc(tier.level)}</small></span>
    </div>`
      )
      .join("")}

    ${batches.divisions
      .map(
        (division) => `
    <div class="batch-grid-rowlabel">
      <strong>${esc(division.name)}</strong>
      <span>${esc(division.classes)}</span>
    </div>
    ${batches.tiers
      .map((tier) => {
        const batch = byId.get(`${division.id}-${tier.id}`);
        if (!batch) return `<div class="batch-cell batch-cell--empty">No batch</div>`;
        const hold = batch.status === "on-hold";
        return `
    <button class="batch-cell${hold ? " is-hold" : ""}" type="button" data-batch-id="${attr(batch.id)}">
      <span class="batch-cell-top">
        <span class="batch-status">${hold ? "On hold" : "Running"}</span>
        <span class="batch-session">${esc(batch.session)}</span>
      </span>
      <strong class="batch-cell-title">${esc(division.name)} ${esc(tier.name)}</strong>
      <span class="batch-cell-summary">${esc(batch.summary)}</span>
      <span class="batch-cell-foot">${hold ? "See reason" : esc(batch.time)} <span aria-hidden="true">→</span></span>
    </button>`;
      })
      .join("")}`
      )
      .join("")}
  </div>
</div>
<p class="grid-note"><span class="status-dot status-dot--hold" aria-hidden="true"></span> Greyed cells are on hold this cycle. Open the cell for the reason and the running alternative.</p>`;
}

function scienceCards(ctx) {
  const { batches } = ctx;
  return `
<div class="science-grid">
  ${batches.scienceBatches
    .map(
      (batch) => `
  <button class="science-card" type="button" data-batch-id="${attr(batch.id)}">
    <span class="science-card-top"><span class="tag tag--science">Science</span><span>${esc(batch.session)} · ${esc(batch.time)}</span></span>
    <strong>${esc(capitalise(batch.division))} · ${esc(capitalise(batch.tier))}</strong>
    <p>${esc(batch.summary)}</p>
    <span class="science-card-foot">${esc(batch.syllabus.length)} syllabus strands <span aria-hidden="true">→</span></span>
  </button>`
    )
    .join("")}
</div>`;
}

function capitalise(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function placement(ctx) {
  const { batches } = ctx;
  return `
<section class="section placement-section" id="placement">
  <div class="shell">
    ${sectionHead(
      "Placement",
      esc(batches.placement.heading) + " — <span class=\"accent\">in four moves.</span>",
      batches.placement.summary
    )}
    <ol class="step-grid">
      ${batches.placement.steps
        .map(
          (step) => `
      <li class="step-card">
        <span class="step-number">${esc(step.number)}</span>
        <h3>${esc(step.title)}</h3>
        <p>${esc(step.description)}</p>
      </li>`
        )
        .join("")}
    </ol>
    <div class="review-panel">
      <p class="index">How review works</p>
      <ul class="tick-list">
        ${batches.placement.reviews.map((review) => `<li>${esc(review)}</li>`).join("")}
      </ul>
    </div>
  </div>
</section>`;
}

function timetable(ctx) {
  const { batches } = ctx;
  const all = new Map([...batches.mathBatches, ...batches.scienceBatches].map((b) => [b.id, b]));
  return `
<section class="section timetable-section" id="timetable">
  <div class="shell">
    ${sectionHead(
      "Weekly timetable",
      "Three sessions, <span class=\"accent\">ten running batches.</span>",
      "Morning and mid-day times are fixed. Primary classes run in the afternoon; the exact time is confirmed at placement."
    )}
    <div class="timetable">
      ${batches.timetable
        .map(
          (slot) => `
      <section class="timetable-column">
        <header>
          <p class="index">${esc(slot.label)}</p>
          <h3>${esc(slot.time)}</h3>
        </header>
        <ul>
          ${slot.batchIds
            .map((id) => {
              const batch = all.get(id);
              if (!batch) return "";
              const tier = batches.tiers.find((t) => t.id === batch.tier);
              return `
          <li>
            <button type="button" data-batch-id="${attr(batch.id)}">
              <span class="timetable-subject">${esc(batch.subject)}</span>
              <strong>${esc(capitalise(batch.division))} ${esc(tier ? tier.name : capitalise(batch.tier))}</strong>
              <span>${esc(batch.summary)}</span>
            </button>
          </li>`;
            })
            .join("")}
        </ul>
      </section>`
        )
        .join("")}
    </div>
    <p class="grid-note">Secondary Gamma and Secondary Alpha are on hold this cycle. Students in Classes 9–10 who are ready for foundation or contest work can join Secondary Sigma or wait for the next intake.</p>
  </div>
</section>`;
}

function promotion(ctx) {
  const { batches } = ctx;
  return `
<section class="section promotion-section" id="promotion">
  <div class="shell promotion-shell">
    <div class="promotion-copy">
      <p class="index">Promotion path</p>
      <h2 class="display">Γ to Α to Σ — <span class="accent">when the evidence says so.</span></h2>
      <p class="section-lead">${esc(batches.promotion.summary)}</p>
      <ul class="tick-list">
        ${batches.promotion.rules.map((rule) => `<li>${esc(rule)}</li>`).join("")}
      </ul>
      <p class="form-note">Promotion is not automatic with age or time served. The monthly benchmark is the common review point; acceleration can happen sooner.</p>
    </div>
    <figure class="promotion-figure">
      <svg viewBox="0 0 760 260" role="img" aria-labelledby="promo-title promo-desc">
        <title id="promo-title">Promotion path from Gamma to Alpha to Sigma</title>
        <desc id="promo-desc">Three tiers connected by arrows. Movement is decided by the monthly benchmark and can happen in either direction.</desc>
        <defs>
          <marker id="promo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"></path>
          </marker>
        </defs>
        <g class="promo-nodes">
          <g class="promo-node promo-node--gamma">
            <circle cx="130" cy="112" r="74"></circle>
            <text x="130" y="128" class="promo-glyph">Γ</text>
            <text x="130" y="214" class="promo-name">Gamma</text>
            <text x="130" y="236" class="promo-level">Foundation</text>
          </g>
          <g class="promo-node promo-node--alpha">
            <circle cx="380" cy="112" r="74"></circle>
            <text x="380" y="128" class="promo-glyph">Α</text>
            <text x="380" y="214" class="promo-name">Alpha</text>
            <text x="380" y="236" class="promo-level">Contest</text>
          </g>
          <g class="promo-node promo-node--sigma">
            <circle cx="630" cy="112" r="74"></circle>
            <text x="630" y="128" class="promo-glyph">Σ</text>
            <text x="630" y="214" class="promo-name">Sigma</text>
            <text x="630" y="236" class="promo-level">Advanced</text>
          </g>
        </g>
        <g class="promo-arrows">
          <path d="M 216 92 H 292" marker-end="url(#promo-arrow)"></path>
          <path d="M 466 92 H 542" marker-end="url(#promo-arrow)"></path>
          <path d="M 292 134 H 216" marker-end="url(#promo-arrow)"></path>
          <path d="M 542 134 H 466" marker-end="url(#promo-arrow)"></path>
        </g>
        <text x="380" y="42" class="promo-caption">Monthly benchmark · movement in either direction</text>
      </svg>
      <figcaption>Promotion is a placement decision, not a reward for attendance.</figcaption>
    </figure>
  </div>
</section>`;
}

function batchDrawer(ctx) {
  const { batches, site } = ctx;
  return `
<dialog class="batch-drawer" id="batch-drawer" aria-labelledby="batch-drawer-title" data-batch-drawer>
  <div class="batch-drawer-inner">
    <div class="batch-drawer-head">
      <p class="index" data-drawer-kicker>Batch</p>
      <h2 class="display" id="batch-drawer-title" data-drawer-title>Batch details</h2>
      <button class="icon-button" type="button" aria-label="Close batch details" data-drawer-close><span aria-hidden="true">×</span></button>
    </div>
    <div data-drawer-content></div>
  </div>
</dialog>
<script type="application/json" data-batch-drawer-data>${JSON.stringify({
    batches: [...batches.mathBatches, ...batches.scienceBatches],
    divisions: batches.divisions,
    tiers: batches.tiers,
    fees: site.fees,
    whatsapp: site.org.whatsapp
  }).replace(/</g, "\\u003c")}</script>
<noscript>
  <section class="shell section">
    <h2 class="display">Every batch, without JavaScript</h2>
    <div class="table-scroll">
      <table class="data-table">
        <caption>Running and on-hold TEMS batches</caption>
        <thead><tr><th scope="col">Subject</th><th scope="col">Division / tier</th><th scope="col">Status</th><th scope="col">Session</th><th scope="col">Fee</th><th scope="col">Syllabus</th></tr></thead>
        <tbody>
          ${[...batches.mathBatches, ...batches.scienceBatches]
            .map(
              (batch) => `<tr><td>${esc(batch.subject)}</td><td>${esc(capitalise(batch.division))} ${esc(capitalise(batch.tier))}</td><td>${esc(batch.status)}</td><td>${esc(batch.session)} · ${esc(batch.time)}</td><td>Tk ${Number(batch.fee).toLocaleString("en-US")}</td><td>${esc(batch.syllabus.join("; "))}${batch.holdReason ? ` — ${esc(batch.holdReason)}` : ""}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </section>
</noscript>`;
}

export default function buildClassStructure(ctx) {
  const { pages, batches } = ctx;
  const page = pages["class-structure"];
  const runningMath = batches.mathBatches.filter((b) => b.status === "running").length;

  const graph = [
    organizationSchema(ctx),
    ...coursesSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Class structure", href: "/class-structure" }
    ]),
    {
      "@type": "WebPage",
      "@id": canonical("/class-structure"),
      url: canonical("/class-structure"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-stat-card">
  <p class="index">This cycle</p>
  <div><strong>${runningMath + batches.scienceBatches.length}</strong><span>running batches</span></div>
  <dl>
    <div><dt>Math</dt><dd>${runningMath} running</dd></div>
    <div><dt>Science</dt><dd>${batches.scienceBatches.length} running</dd></div>
    <div><dt>Tiers</dt><dd>Γ · Α · Σ</dd></div>
    <div><dt>Divisions</dt><dd>3–5 · 6–8 · 9–10</dd></div>
  </dl>
</div>`;

  const main = `
${pageHero(ctx, "class-structure", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Apply for placement</button>
      <a class="btn btn-quiet" href="#timetable">See the weekly timetable</a>`,
    aside
  })}

<section class="section batch-section" id="batches">
  <div class="shell">
    ${sectionHead(
      "Mathematics",
      "The 3 × 3 grid.",
      "Every division runs Gamma, Alpha and Sigma in mathematics. Open any cell for the syllabus, session, fee and a sample problem. Two Secondary cells are on hold this cycle."
    )}
    ${mathGrid(ctx)}
    <div class="hold-notice">
      <span class="index">On hold</span>
      <p><strong>Secondary Gamma and Secondary Alpha</strong> are on hold this cycle because staffing is not in place. The academy’s running alternative is Secondary Sigma, or the next intake when the foundation and contest groups reopen.</p>
    </div>
  </div>
</section>

<section class="section science-section">
  <div class="shell">
    ${sectionHead(
      "Science",
      "Physics, chemistry and biology — <span class=\"accent\">with the lab.</span>",
      "Science is one monthly fee and includes laboratory work. Three science batches run this cycle."
    )}
    ${scienceCards(ctx)}
    <p class="grid-note">Science fee: Tk ${esc(ctx.site.fees.scienceLabel)} per month, including Physics, Chemistry, Biology and labs.</p>
  </div>
</section>

${placement(ctx)}
${timetable(ctx)}
${promotion(ctx)}
${batchDrawer(ctx)}
${nextStepBand(
  ctx,
  "The grid is the map. The diagnostic is the route.",
  "Send an application and the academy will confirm the division, tier, session and fee in writing before the first class."
)}
`;

  return layout(ctx, {
    pageId: "class-structure",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/class-structure",
      graph
    }),
    main
  });
}
