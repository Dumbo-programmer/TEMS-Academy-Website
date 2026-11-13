/* ==========================================================================
   TEMS Academy — site interactions
   No dependencies. Everything degrades to readable HTML without JavaScript,
   except the finder, filters and dialogs, which are enhancements.
   ========================================================================== */

(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                      */
  /* ------------------------------------------------------------------ */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseJsonBlock(element) {
    if (!element) return null;
    try {
      return JSON.parse(element.textContent || "{}");
    } catch (error) {
      console.warn("Could not read embedded data.", error);
      return null;
    }
  }

  function showDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    syncScrollLock();
  }

  function hideDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    syncScrollLock();
  }

  function syncScrollLock() {
    doc.body.classList.toggle("is-locked", Boolean(doc.querySelector("dialog[open]")));
  }

  function onDialogClose(dialog, callback) {
    if (!dialog) return;
    dialog.addEventListener("close", () => {
      syncScrollLock();
      if (callback) callback();
    });
  }

  function closePrimaryNav() {
    const nav = doc.querySelector("[data-nav]");
    const toggle = doc.querySelector("[data-nav-toggle]");
    if (!nav || !nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      const label = toggle.querySelector(".nav-toggle-label");
      if (label) label.textContent = "Menu";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                   */
  /* ------------------------------------------------------------------ */

  function initNav() {
    const header = doc.querySelector("[data-header]");
    const nav = doc.querySelector("[data-nav]");
    const toggle = doc.querySelector("[data-nav-toggle]");
    if (!header || !nav || !toggle) return;

    const label = toggle.querySelector(".nav-toggle-label");

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (label) label.textContent = open ? "Close" : "Menu";
    };

    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });

    doc.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (!header.contains(event.target)) setOpen(false);
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;
      setOpen(false);
      toggle.focus();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1050) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Apply dialog and form                                               */
  /* ------------------------------------------------------------------ */

  function initApply() {
    const dialog = doc.querySelector("[data-apply-dialog]");
    const form = doc.querySelector("[data-apply-form]");
    if (!dialog || !form) return;

    const success = dialog.querySelector("[data-apply-success]");
    const status = dialog.querySelector("[data-apply-status]");
    const fallback = dialog.querySelector("[data-apply-fallback]");
    const startedAt = form.querySelector("[data-started-at]");
    const submitButton = form.querySelector('button[type="submit"]');
    const submitLabel = submitButton ? submitButton.textContent : "Send application";
    const classField = form.elements.namedItem("studentClass");
    const trackField = form.elements.namedItem("track");

    let submitting = false;

    function setStatus(message, type) {
      if (!status) return;
      status.textContent = message || "";
      status.className = "form-status" + (type ? " is-" + type : "");
    }

    function clearInvalid() {
      form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
        field.removeAttribute("aria-invalid");
      });
    }

    function markInvalid(field) {
      if (!field) return;
      field.setAttribute("aria-invalid", "true");
    }

    function fillFrom(trigger) {
      if (!trigger) return;
      const nextClass = trigger.getAttribute("data-apply-class");
      const nextTrack = trigger.getAttribute("data-apply-track");
      if (nextClass && classField) classField.value = nextClass;
      if (nextTrack && trackField) trackField.value = nextTrack;
    }

    function resetToForm() {
      form.reset();
      form.hidden = false;
      if (success) success.hidden = true;
      setStatus("", "");
      clearInvalid();
      if (fallback) fallback.hidden = true;
      if (startedAt) startedAt.value = new Date().toISOString();
    }

    function open(trigger) {
      closePrimaryNav();
      if (success && !success.hidden) resetToForm();
      fillFrom(trigger);
      if (startedAt) startedAt.value = new Date().toISOString();
      setStatus("", "");
      if (fallback) fallback.hidden = true;
      showDialog(dialog);
      window.setTimeout(() => {
        const first = form.querySelector("input:not([type=hidden]):not([tabindex='-1'])");
        if (first) first.focus({ preventScroll: true });
      }, 30);
    }

    function showSuccess() {
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.focus({ preventScroll: false });
      }
      if (status) {
        status.textContent = "";
        status.className = "form-status";
      }
    }

    function collect() {
      const value = (name) => {
        const field = form.elements.namedItem(name);
        return field ? String(field.value || "").trim() : "";
      };
      const consentField = form.elements.namedItem("consent");
      return {
        studentName: value("studentName"),
        guardianEmail: value("guardianEmail"),
        whatsapp: value("whatsapp"),
        studentClass: value("studentClass"),
        track: value("track"),
        experience: value("experience"),
        message: value("message"),
        consent: Boolean(consentField && consentField.checked),
        website: value("website"),
        startedAt: startedAt ? startedAt.value : ""
      };
    }

    function validate(data) {
      clearInvalid();

      if (data.studentName.length < 2) {
        markInvalid(form.elements.namedItem("studentName"));
        setStatus("Please enter the student’s name.", "error");
        form.elements.namedItem("studentName").focus();
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.guardianEmail)) {
        markInvalid(form.elements.namedItem("guardianEmail"));
        setStatus("Please enter a guardian email address we can reply to.", "error");
        form.elements.namedItem("guardianEmail").focus();
        return false;
      }

      const digits = data.whatsapp.replace(/[^\d]/g, "");
      if (digits.length < 10 || digits.length > 15) {
        markInvalid(form.elements.namedItem("whatsapp"));
        setStatus("Please enter a WhatsApp number with the country code.", "error");
        form.elements.namedItem("whatsapp").focus();
        return false;
      }

      if (!/^(3|4|5|6|7|8|9|10|11|12)$/.test(data.studentClass)) {
        markInvalid(classField);
        setStatus("Please select the student’s class.", "error");
        if (classField) classField.focus();
        return false;
      }

      if (!/^(mathematics|science|both|unsure)$/.test(data.track)) {
        markInvalid(trackField);
        setStatus("Please select a track.", "error");
        if (trackField) trackField.focus();
        return false;
      }

      if (!data.consent) {
        markInvalid(form.elements.namedItem("consent"));
        setStatus("Please confirm that you are the parent or guardian and consent to the application.", "error");
        form.elements.namedItem("consent").focus();
        return false;
      }

      return true;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return;

      const data = collect();
      if (!validate(data)) return;

      /* Honeypot: quietly accept and send nothing. */
      if (data.website) {
        showSuccess();
        return;
      }

      submitting = true;
      form.setAttribute("aria-busy", "true");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
      }
      if (fallback) fallback.hidden = true;
      setStatus("Sending the application…", "");

      try {
        const response = await fetch(form.getAttribute("action") || "/api/apply", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify(data)
        });

        let payload = {};
        try {
          payload = await response.json();
        } catch (error) {
          payload = {};
        }

        if (!response.ok || payload.ok === false) {
          const message =
            response.status === 429
              ? "There have been several applications from this connection. Please wait a few minutes, or message the academy on WhatsApp."
              : payload.message ||
                "The application could not be sent. Please try again, or message the academy on WhatsApp with the same details.";
          throw new Error(message);
        }

        showSuccess();
      } catch (error) {
        setStatus(
          error && error.message
            ? error.message
            : "The application could not be sent. Please message the academy on WhatsApp with the same details.",
          "error"
        );
        if (fallback) fallback.hidden = false;
      } finally {
        submitting = false;
        form.removeAttribute("aria-busy");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitLabel;
        }
      }
    });

    form.addEventListener("input", (event) => {
      const field = event.target;
      if (field && field.matches && field.matches("input, select, textarea")) {
        field.removeAttribute("aria-invalid");
      }
    });

    form.addEventListener("change", (event) => {
      const field = event.target;
      if (field && field.matches && field.matches("input, select, textarea")) {
        field.removeAttribute("aria-invalid");
      }
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) hideDialog(dialog);
    });

    dialog.querySelectorAll("[data-apply-close]").forEach((button) => {
      button.addEventListener("click", () => hideDialog(dialog));
    });

    onDialogClose(dialog, () => {
      if (success && !success.hidden) {
        /* Keep the acknowledgement visible until the dialog is reopened. */
      }
    });

    doc.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-apply-open]");
      if (!trigger) return;
      event.preventDefault();
      open(trigger);
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#apply") {
        open(null);
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    });

    if (window.location.hash === "#apply") {
      open(null);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Batch finder                                                        */
  /* ------------------------------------------------------------------ */

  function initFinder() {
    const finder = doc.querySelector("[data-finder]");
    const result = doc.querySelector("[data-finder-result]");
    const data = parseJsonBlock(doc.querySelector("[data-batch-data]"));
    if (!finder || !result || !data) return;

    const classSelect = finder.querySelector("[data-finder-class]");
    const experienceSelect = finder.querySelector("[data-finder-experience]");
    const subjectSelect = finder.querySelector("[data-finder-subject]");

    const tierByExperience = {
      none: "gamma",
      school: "gamma",
      regional: "alpha",
      national: "sigma"
    };

    function divisionFor(classNumber) {
      if (classNumber <= 5) return data.divisions.find((item) => item.id === "primary");
      if (classNumber <= 8) return data.divisions.find((item) => item.id === "junior");
      return data.divisions.find((item) => item.id === "secondary");
    }

    function subjectIdFor(label) {
      return label === "science" ? "science" : "mathematics";
    }

    function batchFor(divisionId, tierId, subjectId) {
      const list = subjectId === "science" ? data.science : data.math;
      return list.find((batch) => batch.division === divisionId && batch.tier === tierId);
    }

    function feeLabel(batch) {
      return `Tk ${Number(batch.fee).toLocaleString("en-US")} / month`;
    }

    function metaRow(term, value) {
      return `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`;
    }

    function applyButton(batch, className, label) {
      const track = batch.subject === "Science" ? "science" : "mathematics";
      return `<button class="btn btn-primary" type="button" data-apply-open data-apply-class="${escapeHtml(
        className
      )}" data-apply-track="${escapeHtml(track)}">${escapeHtml(label)}</button>`;
    }

    function renderRunning(batch, division, tier, note) {
      result.classList.remove("is-hold");
      result.innerHTML = `
        <p class="finder-badge">Running this cycle</p>
        <h3>${escapeHtml(division.name)} ${escapeHtml(tier.name)}</h3>
        <p class="finder-copy">${escapeHtml(batch.summary)}</p>
        <dl class="finder-meta">
          ${metaRow("Division", `${division.name} · ${division.classes}`)}
          ${metaRow("Tier", `${tier.name} · ${tier.level}`)}
          ${metaRow("Session", batch.session)}
          ${metaRow("Time", batch.time)}
          ${metaRow("Subject", batch.subject)}
          ${metaRow("Monthly fee", feeLabel(batch))}
        </dl>
        <p class="finder-note">${escapeHtml(
          note || "This is a starting estimate. The diagnostic test makes the final placement."
        )}</p>
        <div class="finder-actions">
          ${applyButton(batch, division.id === "primary" ? "3" : division.id === "junior" ? "6" : "9", "Apply for this batch")}
          <a class="btn btn-quiet" href="/class-structure#batches">See every batch</a>
        </div>`;
    }

    function renderHold(batch, division, tier) {
      result.classList.add("is-hold");
      result.innerHTML = `
        <p class="finder-badge">On hold this cycle</p>
        <h3>${escapeHtml(division.name)} ${escapeHtml(tier.name)}</h3>
        <p class="finder-copy">${escapeHtml(batch.holdReason || "This batch is not running in the current cycle.")}</p>
        <dl class="finder-meta">
          ${metaRow("Division", `${division.name} · ${division.classes}`)}
          ${metaRow("Tier", `${tier.name} · ${tier.level}`)}
          ${metaRow("Status", "On hold")}
          ${metaRow("Monthly fee", feeLabel(batch))}
        </dl>
        <p class="finder-note">Ask about the next intake, or apply for the running Secondary Sigma group if the work fits now.</p>
        <div class="finder-actions">
          ${applyButton(batch, "9", "Apply for the next intake")}
          <a class="btn btn-quiet" href="/class-structure#batches">See the running alternative</a>
        </div>`;
    }

    function renderNoScience(division) {
      result.classList.add("is-hold");
      result.innerHTML = `
        <p class="finder-badge">No Secondary science batch this cycle</p>
        <h3>Science · next intake</h3>
        <p class="finder-copy">There is no Secondary science batch running this cycle. The three science batches are Primary Sigma, Junior Alpha and Junior Sigma.</p>
        <dl class="finder-meta">
          ${metaRow("Division", `${division.name} · ${division.classes}`)}
          ${metaRow("Subject", "Science · Physics, Chemistry, Biology and labs")}
          ${metaRow("Monthly fee", "Tk 2,700 when running")}
          ${metaRow("Status", "Next intake")}
        </dl>
        <p class="finder-note">Message the academy about the next Secondary science intake, or apply and the diagnostic will place the student in the right subject group.</p>
        <div class="finder-actions">
          <button class="btn btn-primary" type="button" data-apply-open data-apply-class="9" data-apply-track="science">Apply for the next intake</button>
          <a class="btn btn-quiet" href="/contact">Ask about science</a>
        </div>`;
    }

    function render() {
      const classNumber = Number(classSelect ? classSelect.value : 3);
      const experience = experienceSelect ? experienceSelect.value : "none";
      const subjectId = subjectIdFor(subjectSelect ? subjectSelect.value : "mathematics");
      const division = divisionFor(classNumber);
      if (!division) return;

      if (subjectId === "science") {
        if (division.id === "secondary") {
          renderNoScience(division);
          return;
        }

        if (division.id === "primary") {
          const batch = data.science.find((item) => item.id === "primary-science-sigma");
          if (batch) {
            const tier = data.tiers.find((item) => item.id === "sigma");
            renderRunning(
              batch,
              division,
              tier,
              "Primary science runs as one integrated Sigma batch this cycle. The diagnostic confirms the fit."
            );
            return;
          }
        }

        const desiredTier = tierByExperience[experience] || "gamma";
        const scienceTier = desiredTier === "sigma" ? "sigma" : "alpha";
        const batch = batchFor("junior", scienceTier, "science");
        if (batch) {
          const tier = data.tiers.find((item) => item.id === scienceTier);
          renderRunning(
            batch,
            division,
            tier,
            desiredTier === "gamma"
              ? "Junior science begins at Alpha this cycle. The diagnostic confirms the starting point."
              : "This is a starting estimate. The diagnostic test makes the final placement."
          );
          return;
        }

        renderNoScience(division);
        return;
      }

      const tierId = tierByExperience[experience] || "gamma";
      const batch = batchFor(division.id, tierId, "mathematics");
      const tier = data.tiers.find((item) => item.id === tierId);
      if (!batch || !tier) {
        renderNoScience(division);
        return;
      }

      if (batch.status === "on-hold") {
        renderHold(batch, division, tier);
        return;
      }

      renderRunning(batch, division, tier);
    }

    [classSelect, experienceSelect, subjectSelect].forEach((select) => {
      if (select) select.addEventListener("change", render);
    });

    render();
  }

  /* ------------------------------------------------------------------ */
  /* Result and gallery filters                                          */
  /* ------------------------------------------------------------------ */

  function initResultFilter() {
    const chips = Array.from(doc.querySelectorAll("[data-result-filter]"));
    const cards = Array.from(doc.querySelectorAll(".result-card[data-category]"));
    const count = doc.querySelector("[data-result-count]");
    if (!chips.length || !cards.length) return;

    function apply(filter) {
      let shown = 0;
      cards.forEach((card) => {
        const visible = filter === "all" || card.getAttribute("data-category") === filter;
        card.hidden = !visible;
        if (visible) shown += 1;
      });
      chips.forEach((chip) => {
        const active = chip.getAttribute("data-result-filter") === filter;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
      if (count) count.textContent = `${shown} result${shown === 1 ? "" : "s"} shown`;
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => apply(chip.getAttribute("data-result-filter")));
    });

    apply("all");
  }

  function initGalleryFilter() {
    const chips = Array.from(doc.querySelectorAll("[data-gallery-filter]"));
    const cards = Array.from(doc.querySelectorAll(".gallery-card[data-gallery-category]"));
    const count = doc.querySelector("[data-gallery-count]");
    if (!chips.length || !cards.length) return;

    function apply(filter) {
      let shown = 0;
      cards.forEach((card) => {
        const visible = filter === "all" || card.getAttribute("data-gallery-category") === filter;
        card.hidden = !visible;
        if (visible) shown += 1;
      });
      chips.forEach((chip) => {
        const active = chip.getAttribute("data-gallery-filter") === filter;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
      if (count) count.textContent = `${shown} photograph${shown === 1 ? "" : "s"} shown`;
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => apply(chip.getAttribute("data-gallery-filter")));
    });

    apply("all");
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox                                                            */
  /* ------------------------------------------------------------------ */

  function initLightbox() {
    const lightbox = doc.querySelector("[data-lightbox]");
    if (!lightbox) return;

    const image = lightbox.querySelector("[data-lightbox-img]");
    const avif = lightbox.querySelector("[data-lightbox-avif]");
    const webp = lightbox.querySelector("[data-lightbox-webp]");
    const caption = lightbox.querySelector("[data-lightbox-caption]");
    const counter = lightbox.querySelector("[data-lightbox-count]");
    const prev = lightbox.querySelector("[data-lightbox-prev]");
    const next = lightbox.querySelector("[data-lightbox-next]");
    const close = lightbox.querySelector("[data-lightbox-close]");

    let items = [];
    let index = 0;

    function visibleOpeners() {
      return Array.from(doc.querySelectorAll("[data-lightbox-open]")).filter((element) => {
        if (element.closest("[hidden]")) return false;
        return element.getClientRects().length > 0;
      });
    }

    function setSource(source, value) {
      if (!source) return;
      if (value) source.setAttribute("srcset", value);
      else source.removeAttribute("srcset");
    }

    function update() {
      const opener = items[index];
      if (!opener) return;
      const alt = opener.getAttribute("data-alt") || "";
      const text = opener.getAttribute("data-caption") || alt;

      setSource(avif, opener.getAttribute("data-avif"));
      setSource(webp, opener.getAttribute("data-webp"));
      if (image) {
        image.src = opener.getAttribute("data-src") || "";
        image.alt = alt;
        const width = opener.getAttribute("data-width");
        const height = opener.getAttribute("data-height");
        if (width) image.setAttribute("width", width);
        if (height) image.setAttribute("height", height);
      }
      if (caption) caption.textContent = text;
      if (counter) counter.textContent = `${index + 1} / ${items.length}`;
      if (prev) prev.hidden = items.length < 2;
      if (next) next.hidden = items.length < 2;

      const ahead = items[(index + 1) % items.length];
      if (ahead && ahead !== opener && items.length > 1) {
        const preload = new Image();
        preload.src = ahead.getAttribute("data-src") || "";
      }
    }

    function open(opener) {
      items = visibleOpeners();
      index = Math.max(0, items.indexOf(opener));
      if (!items.length) return;
      update();
      showDialog(lightbox);
    }

    function step(direction) {
      if (items.length < 2) return;
      index = (index + direction + items.length) % items.length;
      update();
    }

    doc.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-lightbox-open]");
      if (!opener) return;
      event.preventDefault();
      open(opener);
    });

    if (close) close.addEventListener("click", () => hideDialog(lightbox));
    if (prev) prev.addEventListener("click", () => step(-1));
    if (next) next.addEventListener("click", () => step(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) hideDialog(lightbox);
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        index = 0;
        update();
      } else if (event.key === "End") {
        event.preventDefault();
        index = items.length - 1;
        update();
      }
    });

    onDialogClose(lightbox, () => {
      if (image) image.removeAttribute("src");
      items = [];
      index = 0;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Method tabs                                                        */
  /* ------------------------------------------------------------------ */

  function initMethod() {
    const method = doc.querySelector("[data-method]");
    if (!method) return;

    const tabs = Array.from(method.querySelectorAll("[data-method-tab]"));
    const panels = Array.from(method.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || !panels.length) return;

    function select(nextIndex, moveFocus) {
      const clamped = Math.max(0, Math.min(tabs.length - 1, nextIndex));
      tabs.forEach((tab, i) => {
        const active = i === clamped;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
      });
      panels.forEach((panel, i) => {
        const active = i === clamped;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
      if (moveFocus) tabs[clamped].focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          select((i + 1) % tabs.length, true);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          select((i - 1 + tabs.length) % tabs.length, true);
        } else if (event.key === "Home") {
          event.preventDefault();
          select(0, true);
        } else if (event.key === "End") {
          event.preventDefault();
          select(tabs.length - 1, true);
        }
      });
    });

    select(0, false);

    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            method.classList.add("is-drawn");
            observer.disconnect();
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(method);
    } else {
      method.classList.add("is-drawn");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pathway tabs                                                       */
  /* ------------------------------------------------------------------ */

  function initPathway() {
    const tabs = Array.from(doc.querySelectorAll("[data-pathway-tab]"));
    const panels = Array.from(doc.querySelectorAll("[data-pathway-panel]"));
    if (!tabs.length || !panels.length) return;

    function select(nextIndex, moveFocus) {
      const clamped = Math.max(0, Math.min(tabs.length - 1, nextIndex));
      tabs.forEach((tab, i) => {
        const active = i === clamped;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
      });
      panels.forEach((panel, i) => {
        const active = i === clamped;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
      if (moveFocus) tabs[clamped].focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          select((i + 1) % tabs.length, true);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          select((i - 1 + tabs.length) % tabs.length, true);
        } else if (event.key === "Home") {
          event.preventDefault();
          select(0, true);
        } else if (event.key === "End") {
          event.preventDefault();
          select(tabs.length - 1, true);
        }
      });
    });

    select(0, false);
  }

  /* ------------------------------------------------------------------ */
  /* Batch drawer                                                       */
  /* ------------------------------------------------------------------ */

  function initBatchDrawer() {
    const drawer = doc.querySelector("[data-batch-drawer]");
    const data = parseJsonBlock(doc.querySelector("[data-batch-drawer-data]"));
    if (!drawer || !data) return;

    const kicker = drawer.querySelector("[data-drawer-kicker]");
    const title = drawer.querySelector("[data-drawer-title]");
    const content = drawer.querySelector("[data-drawer-content]");
    const close = drawer.querySelector("[data-drawer-close]");
    if (!content) return;

    const divisionById = new Map((data.divisions || []).map((item) => [item.id, item]));
    const tierById = new Map((data.tiers || []).map((item) => [item.id, item]));
    const batchById = new Map((data.batches || []).map((item) => [item.id, item]));

    function capitalise(value) {
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
    }

    function render(batch) {
      const division = divisionById.get(batch.division) || {
        name: capitalise(batch.division),
        classes: ""
      };
      const tier = tierById.get(batch.tier) || { name: capitalise(batch.tier), level: "", glyph: "" };
      const hold = batch.status === "on-hold";
      const startClass = division.name === "Primary" ? "3" : division.name === "Junior" ? "6" : "9";
      const track = batch.subject === "Science" ? "science" : "mathematics";

      if (kicker) kicker.textContent = `${batch.subject} · ${division.classes || division.name}`;
      if (title) title.textContent = `${division.name} ${tier.name}`;

      const alternative =
        hold && division.name === "Secondary" && batch.id !== "secondary-sigma" && batchById.has("secondary-sigma")
          ? `<button class="btn btn-quiet" type="button" data-batch-id="secondary-sigma">View Secondary Sigma</button>`
          : "";

      content.innerHTML = `
        <p class="drawer-status${hold ? " is-hold" : ""}">${hold ? "On hold this cycle" : "Running this cycle"}</p>
        ${hold && batch.holdReason ? `<p class="drawer-hold">${escapeHtml(batch.holdReason)}</p>` : ""}
        <dl class="drawer-meta">
          <div><dt>Division</dt><dd>${escapeHtml(division.name)}${division.classes ? " · " + escapeHtml(division.classes) : ""}</dd></div>
          <div><dt>Tier</dt><dd>${escapeHtml(tier.glyph)} ${escapeHtml(tier.name)} · ${escapeHtml(tier.level)}</dd></div>
          <div><dt>Session</dt><dd>${escapeHtml(batch.session)} · ${escapeHtml(batch.time)}</dd></div>
          <div><dt>Subject</dt><dd>${escapeHtml(batch.subject)}</dd></div>
          <div><dt>Monthly fee</dt><dd>Tk ${Number(batch.fee).toLocaleString("en-US")}</dd></div>
          <div><dt>Status</dt><dd>${hold ? "On hold" : "Running"}</dd></div>
        </dl>
        <div class="drawer-section">
          <p class="index">Syllabus</p>
          <ul>${(batch.syllabus || [])
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>
        </div>
        <div class="drawer-sample">
          <p class="index">Sample problem</p>
          <p class="drawer-sample-q">${escapeHtml(batch.sample ? batch.sample.q : "")}</p>
          <details>
            <summary>Hint</summary>
            <p>${escapeHtml(batch.sample ? batch.sample.hint : "")}</p>
          </details>
          <details>
            <summary>Answer</summary>
            <p>${escapeHtml(batch.sample ? batch.sample.answer : "")}</p>
          </details>
        </div>
        <div class="drawer-actions">
          <button class="btn btn-primary" type="button" data-apply-open data-apply-class="${escapeHtml(startClass)}" data-apply-track="${escapeHtml(track)}">
            ${hold ? "Apply for the next intake" : "Apply for this batch"}
          </button>
          ${alternative}
          <a class="btn btn-quiet" href="/class-structure#timetable">See the timetable</a>
        </div>`;
    }

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-batch-id]");
      if (!trigger) return;
      const batch = batchById.get(trigger.getAttribute("data-batch-id"));
      if (!batch) return;
      event.preventDefault();
      render(batch);
      showDialog(drawer);
      if (close) close.focus({ preventScroll: true });
    });

    if (close) close.addEventListener("click", () => hideDialog(drawer));

    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) hideDialog(drawer);
    });

    onDialogClose(drawer);
  }

  /* ------------------------------------------------------------------ */
  /* Resource and problem filters                                       */
  /* ------------------------------------------------------------------ */

  function initResourceFilter() {
    const chips = Array.from(doc.querySelectorAll("[data-resource-filter]"));
    const items = Array.from(doc.querySelectorAll("[data-resource-item]"));
    if (!chips.length || !items.length) return;

    function apply(filter) {
      items.forEach((item) => {
        const subject = item.getAttribute("data-subject") || "";
        item.hidden = !(filter === "all" || subject === "all" || subject === filter);
      });
      chips.forEach((chip) => {
        const active = chip.getAttribute("data-resource-filter") === filter;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => apply(chip.getAttribute("data-resource-filter")));
    });

    apply("all");
  }

  function initProblemFilter() {
    const chips = Array.from(doc.querySelectorAll("[data-problem-filters] [data-problem-subject], [data-problem-filters] [data-problem-tier]"));
    const cards = Array.from(doc.querySelectorAll("[data-problem-grid] .problem-card"));
    const count = doc.querySelector("[data-problem-count]");
    const empty = doc.querySelector("[data-problem-empty]");
    const reset = doc.querySelector("[data-problem-reset]");
    if (!chips.length || !cards.length) return;

    let subject = "all";
    let tier = "all";

    function apply(pressed) {
      let shown = 0;
      cards.forEach((card) => {
        const visible = (subject === "all" || card.getAttribute("data-subject") === subject) && (tier === "all" || card.getAttribute("data-tier") === tier);
        card.hidden = !visible;
        if (visible) shown += 1;
      });

      chips.forEach((chip) => {
        const isSubject = chip.hasAttribute("data-problem-subject");
        const value = isSubject ? chip.getAttribute("data-problem-subject") : chip.getAttribute("data-problem-tier");
        const active = isSubject ? value === subject : value === tier;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });

      if (count) count.textContent = `${shown} problem${shown === 1 ? "" : "s"} shown`;
      if (empty) empty.hidden = shown !== 0;
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        if (chip.hasAttribute("data-problem-subject")) {
          subject = chip.getAttribute("data-problem-subject");
        } else {
          tier = chip.getAttribute("data-problem-tier");
        }
        apply();
      });
    });

    if (reset) {
      reset.addEventListener("click", () => {
        subject = "all";
        tier = "all";
        apply();
      });
    }

    apply();
  }

  /* ------------------------------------------------------------------ */
  /* Start                                                              */
  /* ------------------------------------------------------------------ */

  function start() {
    initNav();
    initApply();
    initFinder();
    initResultFilter();
    initGalleryFilter();
    initLightbox();
    initMethod();
    initPathway();
    initBatchDrawer();
    initResourceFilter();
    initProblemFilter();
    syncScrollLock();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  /* Keep dialogs and the lock in sync if the browser closes one itself. */
  doc.addEventListener("close", syncScrollLock, true);
})();
