import {
  attr,
  breadcrumbSchema,
  canonical,
  esc,
  head,
  layout,
  nextStepBand,
  organizationSchema,
  pageHero
} from "../lib/core.mjs";

export default function buildContact(ctx) {
  const { pages, site } = ctx;
  const page = pages.contact;
  const org = site.org;

  const graph = [
    organizationSchema(ctx),
    breadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Contact", href: "/contact" }
    ]),
    {
      "@type": "ContactPage",
      "@id": canonical("/contact"),
      url: canonical("/contact"),
      name: page.title,
      description: page.description,
      about: { "@id": `${canonical("/")}#organization` }
    }
  ];

  const aside = `
<div class="hero-note-card">
  <p class="index">Before you visit</p>
  <p>${esc(org.officeHoursNote)}</p>
  <a class="text-link" href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">Message on WhatsApp <span aria-hidden="true">→</span></a>
</div>`;

  const main = `
${pageHero(ctx, "contact", {
    actions: `<button class="btn btn-primary" type="button" data-apply-open>Apply for a diagnostic</button>
      <a class="btn btn-quiet" href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp ${esc(org.whatsappDisplay)}</a>`,
    aside
  })}

<section class="section contact-section">
  <div class="shell contact-grid">
    <div class="contact-details">
      <div class="contact-block">
        <p class="index">Campus</p>
        <address>
          ${esc(org.address.line1)}<br>
          ${esc(org.address.line2)}<br>
          ${esc(org.address.city)}, ${esc(org.address.country)}
        </address>
        <a class="text-link" href="${attr(org.mapUrl)}" target="_blank" rel="noopener noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a>
      </div>

      <div class="contact-block">
        <p class="index">WhatsApp</p>
        <a class="contact-big" href="https://wa.me/${attr(org.whatsapp)}" target="_blank" rel="noopener noreferrer">${esc(org.whatsappDisplay)}</a>
        <p>Message with the student’s class, subject and any contest experience. A guardian should send the first message.</p>
      </div>

      <div class="contact-block">
        <p class="index">Email</p>
        <a class="contact-big" href="mailto:${attr(org.email)}">${esc(org.email)}</a>
        <p>Use email if you need to attach a document or keep a written record.</p>
      </div>

      <div class="contact-block">
        <p class="index">Office hours</p>
        <p class="contact-hours">${esc(org.officeHoursLabel)}</p>
        <p>${esc(org.officeHoursNote)}</p>
      </div>

      <div class="contact-block">
        <p class="index">Telephone</p>
        <a class="contact-big" href="tel:+${attr(org.call)}">${esc(org.whatsappDisplay)}</a>
        <p>Calls and WhatsApp use the same number. If there is no answer, send a message and the academy will reply.</p>
      </div>

      <div class="contact-block">
        <p class="index">Social</p>
        <a class="text-link" href="${attr(org.facebook)}" target="_blank" rel="noopener noreferrer">TEMS Math Academy on Facebook <span aria-hidden="true">↗</span></a>
      </div>
    </div>

    <div class="contact-map">
      <div class="map-frame map-frame--large">
        <iframe
          src="${attr(org.mapEmbedUrl)}"
          title="Map showing TEMS Academy at House 06, Road 1/1, Shekertek Adabor, Mohammadpur, Dhaka"
          loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      </div>
      <div class="map-caption">
        <p class="index">House 06, Road 1/1</p>
        <p>Shekertek Adabor, Mohammadpur-1207, Dhaka. The campus is offline; there are no online classes.</p>
        <a class="btn btn-primary" href="${attr(org.mapUrl)}" target="_blank" rel="noopener noreferrer">Get directions</a>
      </div>
    </div>
  </div>
</section>

<section class="section contact-prompts-section">
  <div class="shell">
    <p class="index">Good questions to send</p>
    <div class="contact-prompts">
      <article><span>01</span><h3>“Which batch fits Class 7?”</h3><p>Include the student’s school class, subject and any past olympiad round. The academy will suggest a diagnostic slot.</p></article>
      <article><span>02</span><h3>“Can we visit first?”</h3><p>Yes. Message before visiting; the academy has not published fixed office hours.</p></article>
      <article><span>03</span><h3>“What does the fee include?”</h3><p>Math is Tk ${esc(site.fees.mathLabel)} per month. Science is Tk ${esc(site.fees.scienceLabel)} and includes Physics, Chemistry, Biology and labs.</p></article>
    </div>
  </div>
</section>

${nextStepBand(
  ctx,
  "Come to Adabor. Bring a question.",
  "Send an application first, or message the academy to arrange a conversation before the diagnostic."
)}
`;

  return layout(ctx, {
    pageId: "contact",
    headHtml: head(ctx, {
      title: page.title,
      description: page.description,
      route: "/contact",
      graph
    }),
    main
  });
}
