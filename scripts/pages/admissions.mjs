import {
  attr,
  breadcrumbSchema,
  canonical,
  esc,
  faqSchema,
  head,
  layout,
  nextStepBand,
  organizationSchema,
  pageHero,
  sectionHead
} from "../lib/core.mjs";

export default function buildAdmissions(ctx) {
  const { pages, admissions, site, faq } = ctx;
  const page = pages.admissions;

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Admissions", href: "/admissions" }
    ]),
    faqSchema(faq.items),
    {
      "@type": "WebPage",
      "@id": canonical("/admissions"),
      url: canonical("/admissions"),
      name: page.title,
      description: page.description
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">The short version</p>
  <ol class="hero-numbered">
    <li>Send an application.</li>
    <li>Sit the diagnostic.</li>
    <li>Receive the placement in writing.</li>
    <li>Attend the first class.</li>
  </ol>
  <p class="form-note">No entrance exam to pass. The diagnostic decides the starting point.</p>
</div>`;

  const main = `
${pageHero(ctx, "admissions", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Open the application</button>
      <a class="btn btn-quiet" href="https://wa.me/${attr(site.org.whatsapp)}" target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>`,
    aside
  })}

<section class="section admission-steps-section" id="apply">
  <div class="shell">
    ${sectionHead(
      "The process",
      "Four steps from <span class=\"accent\">question to first class.</span>",
      "The application is a request for a diagnostic and a placement conversation. It is not an offer of a place."
    )}
    <ol class="admission-steps">
      ${admissions.steps
        .map(
          (step) => `
      <li class="admission-step">
        <span class="admission-step-number">${esc(step.number)}</span>
        <div>
          <h3>${esc(step.title)}</h3>
          <p>${esc(step.description)}</p>
        </div>
      </li>`
        )
        .join("")}
    </ol>
    <div class="apply-panel">
      <div>
        <p class="index">Application</p>
        <h3 class="display">Send the details once. We will take it from there.</h3>
        <p>The form asks for the student’s name, guardian email, WhatsApp number, class, track and any past contest experience. A guardian must consent.</p>
        <p class="form-note">${esc(site.form.responseNote)}</p>
      </div>
      <div class="apply-panel-actions">
        <button class="btn btn-primary" type="button" data-apply-open>Apply now</button>
        <a class="text-link" href="https://wa.me/${attr(site.org.whatsapp)}" target="_blank" rel="noopener noreferrer">Apply on WhatsApp instead <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </div>
</section>

<section class="section diagnostic-section">
  <div class="shell diagnostic-grid">
    <div>
      <p class="index">${esc(admissions.diagnostic.heading)}</p>
      <h2 class="display">${esc(admissions.diagnostic.summary)}</h2>
      <ul class="tick-list">
        ${admissions.diagnostic.points.map((point) => `<li>${esc(point)}</li>`).join("")}
      </ul>
    </div>
    <div class="bring-card">
      <p class="index">${esc(admissions.bring.heading)}</p>
      <ul class="tick-list">
        ${admissions.bring.items.map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
      <p class="form-note">${esc(admissions.bring.summary)}</p>
    </div>
  </div>
</section>

<section class="section fees-section" id="fees">
  <div class="shell">
    ${sectionHead(
      "Fees",
      "One monthly fee. <span class=\"accent\">No promotion surcharge.</span>",
      admissions.fees.summary
    )}
    <div class="fee-table">
      ${admissions.fees.items
        .map(
          (item) => `
      <div class="fee-table-row">
        <span>${esc(item.label)}</span>
        <strong>${esc(item.value)}</strong>
        <p>${esc(item.note)}</p>
      </div>`
        )
        .join("")}
    </div>
    <p class="form-note">${esc(admissions.fees.paymentNote)}</p>
  </div>
</section>

<section class="section first-month-section">
  <div class="shell">
    ${sectionHead(
      "The first month",
      "What happens, <span class=\"accent\">and when.</span>",
      admissions.firstMonth.summary
    )}
    <ol class="month-track">
      ${admissions.firstMonth.steps
        .map(
          (step) => `
      <li>
        <span class="month-label">${esc(step.label)}</span>
        <h3>${esc(step.title)}</h3>
        <p>${esc(step.description)}</p>
      </li>`
        )
        .join("")}
    </ol>
  </div>
</section>

<section class="section scholarship-section">
  <div class="shell scholarship-grid">
    <article>
      <p class="index">${esc(admissions.scholarships.heading)}</p>
      <h2 class="display">${esc(admissions.scholarships.summary)}</h2>
      <p>${esc(admissions.scholarships.note)}</p>
    </article>
    <article>
      <p class="index">${esc(admissions.visit.heading)}</p>
      <h2 class="display">${esc(admissions.visit.summary)}</h2>
      <p>${esc(admissions.visit.note)}</p>
      <a class="text-link" href="${attr(site.org.mapUrl)}" target="_blank" rel="noopener noreferrer">Open the campus map <span aria-hidden="true">→</span></a>
    </article>
  </div>
</section>

<section class="section faq-section" id="faq">
  <div class="shell faq-layout">
    <div>
      <p class="index">Questions</p>
      <h2 class="display">Before you apply.</h2>
      <p class="section-lead">The answers we can give without guessing. Anything else, ask on WhatsApp.</p>
      <a class="btn btn-primary" href="https://wa.me/${attr(site.org.whatsapp)}" target="_blank" rel="noopener noreferrer">Ask a question</a>
    </div>
    <div class="faq-list">
      ${faq.items
        .map(
          (item, index) => `
      <details class="disclosure"${index === 0 ? " open" : ""}>
        <summary>${esc(item.q)}</summary>
        <div class="disclosure-body"><p>${esc(item.a)}</p></div>
      </details>`
        )
        .join("")}
    </div>
  </div>
</section>

${nextStepBand(
  ctx,
  "Start with the diagnostic.",
  "The academy will confirm the batch, session and fee in writing before the first class."
)}
`;

  return layout(ctx, {
    pageId: "admissions",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/admissions",
      graph
    }),
    main
  });
}
