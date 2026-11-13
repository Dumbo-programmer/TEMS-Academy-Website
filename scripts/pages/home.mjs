import {
  attr,
  canonical,
  coursesSchema,
  esc,
  faqSchema,
  head,
  layout,
  lightbox,
  math,
  nextStepBand,
  organizationSchema,
  picture,
  plain,
  sectionHead
} from "../lib/core.mjs";

const METHOD = [
  {
    number: "01",
    name: "Foundation",
    tag: "Build the tools",
    body: "Fluency, careful reading and a first repertoire of methods. Students learn to explain a step before they try to skip it."
  },
  {
    number: "02",
    name: "Problem solving",
    tag: "Work the set",
    body: "A weekly problem set is marked and returned with feedback. The problems are unfamiliar on purpose; the method is the lesson."
  },
  {
    number: "03",
    name: "Advanced",
    tag: "Extend the range",
    body: "Multi-step proofs, laboratory work and international-style papers. Students meet problems that combine two or three ideas at once."
  },
  {
    number: "04",
    name: "Competition",
    tag: "Test the training",
    body: "Preparation follows the national route in each subject — BdMO, BdPhO, BChO, BDBO and BdJSO — and the international competitions they feed."
  },
  {
    number: "05",
    name: "Mentorship",
    tag: "Pass it on",
    body: "Mentors include Olympiad medalists and national-team alumni. Older students learn to present a solution, defend it and coach a younger group."
  }
];

function proofStrip(achievements) {
  return `
<section class="proof-strip" aria-label="Academy record">
  <div class="shell proof-grid">
    ${achievements.proof
      .map(
        (item) => `
    <div class="proof-item">
      <p class="proof-value">${esc(item.value)}</p>
      <p class="proof-label">${esc(item.label)}</p>
      <p class="proof-source">${esc(item.source)}</p>
    </div>`
      )
      .join("")}
  </div>
</section>`;
}

function methodSection() {
  return `
<section class="section method-section" id="method">
  <div class="shell">
    ${sectionHead(
      "The method",
      "Five stages, one habit: <span class=\"accent\">think it through.</span>",
      "The work moves from fluency to unfamiliar problems, then to competition and mentorship. Nothing is skipped because an exam is near."
    )}
    <div class="method" data-method>
      <div class="method-rail" aria-hidden="true">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" focusable="false">
          <path class="method-path" d="M0 60 H1000" pathLength="1"></path>
          <circle cx="100" cy="60" r="7"></circle>
          <circle cx="300" cy="60" r="7"></circle>
          <circle cx="500" cy="60" r="7"></circle>
          <circle cx="700" cy="60" r="7"></circle>
          <circle cx="900" cy="60" r="7"></circle>
        </svg>
      </div>
      <div class="method-stages" role="tablist" aria-label="Five stages of the TEMS method">
        ${METHOD.map(
          (stage, index) => `
        <button class="method-stage${index === 0 ? " is-active" : ""}" type="button" role="tab"
          aria-selected="${index === 0}" aria-controls="method-panel-${index}" id="method-tab-${index}"
          data-method-tab="${index}">
          <span class="method-number">${esc(stage.number)}</span>
          <span class="method-name">${esc(stage.name)}</span>
        </button>`
        ).join("")}
      </div>
      <div class="method-panels">
        ${METHOD.map(
          (stage, index) => `
        <div class="method-panel${index === 0 ? " is-active" : ""}" role="tabpanel"
          id="method-panel-${index}" aria-labelledby="method-tab-${index}"${index === 0 ? "" : " hidden"}>
          <p class="index">${esc(stage.tag)}</p>
          <h3 class="display">${esc(stage.name)}</h3>
          <p>${esc(stage.body)}</p>
        </div>`
        ).join("")}
      </div>
    </div>
  </div>
</section>`;
}

function achievementCard(ctx, item, index) {
  const { images } = ctx;
  const meta = images[item.photo];
  const sources = meta ? [...meta.sources].sort((a, b) => a.width - b.width) : [];
  const avifSet = sources.map((s) => `${s.avif} ${s.width}w`).join(", ");
  const webpSet = sources.map((s) => `${s.webp} ${s.width}w`).join(", ");
  const fallback = sources.find((s) => s.width >= 800) || sources[sources.length - 1];
  const year = item.year || "Undated";
  return `
<article class="result-card" data-category="${attr(item.category)}" data-result-index="${index}">
  <button class="result-media" type="button" data-lightbox-open
    data-avif="${attr(avifSet)}" data-webp="${attr(webpSet)}"
    data-src="${attr(fallback ? fallback.webp : "")}"
    data-width="${attr(fallback ? fallback.width : 1200)}" data-height="${attr(fallback ? fallback.height : 800)}"
    data-caption="${attr(item.caption)}" data-alt="${attr(item.photoAlt)}">
    ${picture(images, item.photo, {
      alt: item.photoAlt,
      sizes: "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
    })}
    <span class="result-year">${esc(year)}</span>
    <span class="result-zoom" aria-hidden="true">View</span>
  </button>
  <div class="result-body">
    <p class="result-meta">${esc(item.categoryLabel)}${item.year ? ` · ${esc(item.year)}` : ""}</p>
    <h3>${esc(item.title)}</h3>
    <p class="result-student">${esc(item.studentLabel)}</p>
    <p>${esc(item.detail)}</p>
    <p class="result-source">Source: ${esc(item.source)}</p>
  </div>
</article>`;
}

function achievementsSection(ctx) {
  const { achievements } = ctx;
  return `
<section class="section results-wall" id="results">
  <div class="shell">
    ${sectionHead(
      "The record",
      "Results with a <span class=\"accent\">source attached.</span>",
      "Names appear only where the academy supplied them. Every other record says “TEMS student” or “TEMS delegation” rather than guessing."
    )}
    <div class="filter-row" data-result-filters role="group" aria-label="Filter results">
      ${achievements.filters
        .map(
          (filter, index) => `
      <button class="filter-chip${index === 0 ? " is-active" : ""}" type="button" data-result-filter="${attr(filter.id)}"
        aria-pressed="${index === 0}">${esc(filter.label)}</button>`
        )
        .join("")}
    </div>
    <p class="filter-count" aria-live="polite" data-result-count></p>
    <div class="result-grid">
      ${achievements.items.map((item, index) => achievementCard(ctx, item, index)).join("")}
    </div>
  </div>
</section>
${lightbox()}`;
}

function finderSection(ctx) {
  const { site, batches } = ctx;
  const running = [...batches.mathBatches, ...batches.scienceBatches].filter(
    (batch) => batch.status === "running"
  );
  return `
<section class="section finder-section" id="find-your-batch">
  <div class="shell finder-shell">
    <div class="finder-copy">
      <p class="index">Find your batch</p>
      <h2 class="display">Answer two questions. <span class="accent">Get a starting point.</span></h2>
      <p class="section-lead">Class tells us the division. Contest experience helps estimate the tier. The diagnostic makes the final decision.</p>
      <div class="finder-form" data-finder>
        <label class="field">
          <span>Class</span>
          <select data-finder-class>
            ${["3", "4", "5", "6", "7", "8", "9", "10"]
              .map((n) => `<option value="${n}">Class ${n}</option>`)
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Past contest experience</span>
          <select data-finder-experience>
            <option value="none">None yet</option>
            <option value="school">School or local contest</option>
            <option value="regional">Regional olympiad round</option>
            <option value="national">National round or award</option>
          </select>
        </label>
        <label class="field">
          <span>Subject</span>
          <select data-finder-subject>
            <option value="mathematics">Mathematics</option>
            <option value="science">Science</option>
          </select>
        </label>
      </div>
      <noscript><p class="form-note">The batch finder needs JavaScript. The <a href="/class-structure">class structure page</a> lists every running batch and session.</p></noscript>
    </div>
    <div class="finder-result" data-finder-result aria-live="polite" aria-atomic="true">
      <p class="index">Your starting point</p>
      <p class="finder-placeholder">Choose a class and subject to see a division, tier, session and fee.</p>
    </div>
  </div>
  <script type="application/json" data-batch-data>${JSON.stringify({
    math: batches.mathBatches,
    science: batches.scienceBatches,
    tiers: batches.tiers,
    divisions: batches.divisions,
    fees: site.fees
  }).replace(/</g, "\\u003c")}</script>
</section>`;
}

function parentSection(ctx) {
  const { site, faq, admissions, gallery, images } = ctx;
  const homeFaq = faq.items.filter((item) => item.home);
  const timeline = admissions.firstMonth.steps;
  const mapImage = gallery.items.find((item) => item.id === "classroom");
  return `
<section class="section parents-section" id="parents">
  <div class="shell">
    ${sectionHead(
      "For parents",
      "What the first month <span class=\"accent\">actually looks like.</span>",
      "A clear fee, a written placement, weekly feedback and a benchmark at the end of the month. No surprises buried in a brochure."
    )}
    <div class="parent-grid">
      <article class="fee-card">
        <p class="index">Monthly fee</p>
        <div class="fee-row">
          <span>Mathematics</span>
          <strong>${esc(site.fees.currency)} ${esc(site.fees.mathLabel)}</strong>
        </div>
        <p class="fee-note">${esc(site.fees.mathNote)}</p>
        <div class="fee-row">
          <span>Science</span>
          <strong>${esc(site.fees.currency)} ${esc(site.fees.scienceLabel)}</strong>
        </div>
        <p class="fee-note">${esc(site.fees.scienceNote)}</p>
        <p class="fee-promise">${esc(site.fees.promotionNote)}</p>
        <p class="form-note">${esc(site.fees.scholarshipNote)}</p>
        <a class="text-link" href="/admissions">Fees and admissions <span aria-hidden="true">→</span></a>
      </article>

      <article class="first-month">
        <p class="index">The first month</p>
        <h3 class="display">Four weeks, in order.</h3>
        <ol class="mini-timeline">
          ${timeline
            .map(
              (step) => `
          <li>
            <span class="mini-timeline-label">${esc(step.label)}</span>
            <strong>${esc(step.title)}</strong>
            <p>${esc(step.description)}</p>
          </li>`
            )
            .join("")}
        </ol>
      </article>

      <div class="parent-faq">
        <p class="index">Questions parents ask</p>
        <h3 class="display">Straight answers.</h3>
        ${homeFaq
          .map(
            (item, index) => `
        <details class="disclosure"${index === 0 ? " open" : ""}>
          <summary>${esc(item.q)}</summary>
          <div class="disclosure-body"><p>${esc(item.a)}</p></div>
        </details>`
          )
          .join("")}
      </div>

      <article class="map-card">
        <div class="map-frame">
          <iframe
            src="${attr(site.org.mapEmbedUrl)}"
            title="Map showing TEMS Academy at House 06, Road 1/1, Shekertek Adabor, Mohammadpur, Dhaka"
            loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
        <div class="map-copy">
          <p class="index">The campus</p>
          <address>${esc(site.org.address.line1)}<br>${esc(site.org.address.line2)}<br>${esc(site.org.address.city)}, ${esc(site.org.address.country)}</address>
          <p class="form-note">${esc(site.org.officeHoursNote)}</p>
          <a class="text-link" href="${attr(site.org.mapUrl)}" target="_blank" rel="noopener noreferrer">Open in Maps <span aria-hidden="true">→</span></a>
        </div>
        ${mapImage
          ? `<figure class="map-photo">${picture(images, mapImage.image, {
              alt: mapImage.alt,
              sizes: "(max-width: 700px) 100vw, 25vw"
            })}<figcaption>${esc(mapImage.caption)}</figcaption></figure>`
          : ""}
      </article>
    </div>
  </div>
</section>`;
}

function galleryStrip(ctx) {
  const { gallery, images } = ctx;
  const featured = gallery.items.filter((item) => item.featured).slice(0, 5);
  return `
<section class="section gallery-strip-section">
  <div class="shell">
    ${sectionHead(
      "Inside the academy",
      "Real rooms, real work.",
      "Photographs supplied by TEMS Academy and used with permission."
    )}
  </div>
  <div class="gallery-strip">
    ${featured
      .map(
        (item, index) => `
    <figure class="gallery-tile gallery-tile--${index % 3}">
      ${picture(images, item.image, {
        alt: item.alt,
        sizes: "(max-width: 700px) 50vw, 20vw"
      })}
      <figcaption><span>${esc(item.categoryLabel)}</span>${esc(item.caption)}</figcaption>
    </figure>`
      )
      .join("")}
  </div>
</section>`;
}

export default function buildHome(ctx) {
  const { pages, site, achievements, faq } = ctx;
  const page = pages.home;
  const homeFaq = faq.items.filter((item) => item.home);

  const graph = [
    organizationSchema(ctx),
    ...coursesSchema(ctx),
    faqSchema(homeFaq),
    {
      "@type": "WebPage",
      "@id": canonical("/"),
      url: canonical("/"),
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${canonical("/")}#organization` },
      about: { "@id": `${canonical("/")}#organization` },
      primaryImageOfPage: `${canonical("/")}assets/img/og-image.jpg`
    }
  ];

  const main = `
<section class="home-hero shell">
  <div class="hero-copy">
    <p class="kicker"><span class="kicker-dot" aria-hidden="true"></span>${esc(page.kicker)}</p>
    <h1 class="display hero-title">${esc(page.heading)}<br><span class="accent">${esc(page.headingAccent)}</span></h1>
    <p class="lead">${esc(page.lead)}</p>
    <div class="hero-actions">
      <button class="btn btn-primary" type="button" data-apply-open>Apply for a diagnostic</button>
      <a class="btn btn-quiet" href="/class-structure">See every batch</a>
    </div>
    <ul class="hero-facts">
      <li><strong>Math</strong> Tk ${esc(site.fees.mathLabel)}</li>
      <li><strong>Science</strong> Tk ${esc(site.fees.scienceLabel)}</li>
      <li><strong>Placement</strong> by ability</li>
    </ul>
  </div>

  <div class="hero-media">
    <figure class="hero-figure">
      ${picture(ctx.images, "nabeh-bdmso", {
        alt: "Nabeh, BDMSO national champion, photographed with the TEMS Chairman.",
        sizes: "(max-width: 760px) 86vw, 34vw",
        loading: "eager",
        fetchpriority: "high",
        fallbackWidth: 480
      })}
      <figcaption>
        <span class="caption-tag">BDMSO</span>
        <span>Nabeh, national champion, with the Chairman.</span>
      </figcaption>
    </figure>
    <figure class="hero-inset">
      ${picture(ctx.images, "ijso-silver", {
        alt: "IJSO 2025 medal photograph supplied by TEMS Academy.",
        sizes: "160px",
        loading: "eager",
        fetchpriority: "high",
        fallbackWidth: 480
      })}
      <figcaption><strong>IJSO 2025</strong><span>International medal · Russia</span></figcaption>
    </figure>
    <p class="hero-est">Est. ${esc(site.org.established)}<span>Adabor, Dhaka</span></p>
  </div>
</section>

${proofStrip(achievements)}

<section class="section statement-section">
  <div class="shell statement-grid">
    <div>
      <p class="index">What we are</p>
      <h2 class="display">An offline school for the problems <span class="accent">textbooks leave out.</span></h2>
    </div>
    <div class="statement-body">
      <p>TEMS is a mathematics and science academy in Dhaka. Students come for the problems they have not seen before, and stay for a habit of reasoning that survives the next exam.</p>
      <p>Class in school does not decide the tier. A short diagnostic places each student by current ability, and a monthly benchmark keeps that placement honest.</p>
      <div class="statement-points">
        <div><span>01</span><strong>Placed by ability</strong><p>Primary 3–5, Junior 6–8, Secondary 9–10. Gamma, Alpha or Sigma by evidence.</p></div>
        <div><span>02</span><strong>Weekly problem sets</strong><p>Marked, returned and discussed. The work is the feedback loop.</p></div>
        <div><span>03</span><strong>A competition route</strong><p>From regional BdMO to IJSO, IMSO and the international science olympiads.</p></div>
      </div>
    </div>
  </div>
</section>

${finderSection(ctx)}
${achievementsSection(ctx)}
${methodSection()}
${parentSection(ctx)}
${galleryStrip(ctx)}
${nextStepBand(
  ctx,
  "Bring us a student who asks better questions.",
  "Send an application or message on WhatsApp. The diagnostic is a placement conversation, not an entrance exam."
)}
`;
  return layout(ctx, {
    pageId: "home",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/",
      graph
    }),
    main
  });
}
