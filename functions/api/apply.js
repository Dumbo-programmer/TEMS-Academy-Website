/**
 * POST /api/apply
 *
 * Cloudflare Pages Function. Validates an application server-side, applies a
 * best-effort rate limit and sends the application to the academy inbox with
 * Resend. The browser never sees a success state unless this handler accepts
 * the submission.
 *
 * Required environment:
 *   RESEND_API_KEY      secret, created with `wrangler pages secret put`
 *   APPLY_TO_EMAIL      destination inbox (defaults to the published address)
 *   APPLY_FROM_EMAIL    verified sender, e.g. "TEMS Academy <apply@tems...>"
 *
 * Optional:
 *   RATE_LIMIT          KV namespace binding for a durable IP rate limit
 */

const MAX_PER_WINDOW = 6;
const WINDOW_MS = 10 * 60 * 1000;
const MIN_FILL_MS = 900;
const MAX_BODY_BYTES = 20 * 1024;
const DEFAULT_TO = "temsonline3.14@gmail.com";

/* Best-effort in-memory limit for deployments without a KV binding. */
const memoryHits = new Map();

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

function fail(status, message, extraHeaders = {}) {
  return json({ ok: false, message }, status, extraHeaders);
}

function cleanText(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 120;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown"
  )
    .split(",")[0]
    .trim();
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function readBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return null;

  const type = request.headers.get("content-type") || "";

  if (type.includes("application/json") || type.includes("application/x-www-form-urlencoded")) {
    let raw;
    try {
      raw = await request.text();
    } catch {
      return null;
    }
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return null;

    try {
      if (type.includes("application/json")) return JSON.parse(raw);
      const data = {};
      for (const [key, value] of new URLSearchParams(raw)) data[key] = value;
      return data;
    } catch {
      return null;
    }
  }

  if (type.includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      const data = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") data[key] = value;
      }
      return data;
    } catch {
      return null;
    }
  }

  return null;
}

async function checkRateLimit(request, env) {
  const ip = clientIp(request);
  const now = Date.now();
  const kv = env.RATE_LIMIT;

  if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
    const key = `apply-rate:${ip}`;
    try {
      const record = await kv.get(key, { type: "json" });
      if (record && record.reset > now) {
        if (record.count >= MAX_PER_WINDOW) {
          return { limited: true, retryAfter: Math.ceil((record.reset - now) / 1000) };
        }
        await kv.put(key, JSON.stringify({ count: record.count + 1, reset: record.reset }), {
          expirationTtl: Math.max(60, Math.ceil((record.reset - now) / 1000) + 60)
        });
        return { limited: false };
      }
      const reset = now + WINDOW_MS;
      await kv.put(key, JSON.stringify({ count: 1, reset }), {
        expirationTtl: Math.ceil(WINDOW_MS / 1000) + 60
      });
      return { limited: false };
    } catch (error) {
      console.error("Rate-limit KV unavailable; using in-memory fallback.", error.message);
    }
  }

  const current = memoryHits.get(ip);
  if (current && current.reset > now) {
    if (current.count >= MAX_PER_WINDOW) {
      return { limited: true, retryAfter: Math.ceil((current.reset - now) / 1000) };
    }
    current.count += 1;
    return { limited: false };
  }
  memoryHits.set(ip, { count: 1, reset: now + WINDOW_MS });

  if (memoryHits.size > 500) {
    for (const [key, value] of memoryHits) {
      if (value.reset <= now) memoryHits.delete(key);
    }
  }

  return { limited: false };
}

function validate(data) {
  const studentName = cleanText(data.studentName, 80).replace(/\s+/g, " ");
  const guardianEmail = cleanText(data.guardianEmail, 120);
  const whatsappRaw = cleanText(data.whatsapp, 24);
  const whatsapp = digitsOnly(whatsappRaw);
  const studentClass = cleanText(data.studentClass, 2);
  const track = cleanText(data.track, 16);
  const experience = cleanText(data.experience, 600);
  const message = cleanText(data.message, 1500);
  const consent =
    data.consent === true ||
    data.consent === "true" ||
    data.consent === "yes" ||
    data.consent === "on";

  if (studentName.length < 2) {
    return { error: "Please enter the student’s name." };
  }
  if (!validEmail(guardianEmail)) {
    return { error: "Please enter a valid guardian email address." };
  }
  if (whatsapp.length < 10 || whatsapp.length > 15) {
    return { error: "Please enter a WhatsApp number with the country code." };
  }
  if (!/^(3|4|5|6|7|8|9|10|11|12)$/.test(studentClass)) {
    return { error: "Please choose a class between 3 and 12." };
  }
  if (!/^(mathematics|science|both|unsure)$/.test(track)) {
    return { error: "Please choose a track." };
  }
  if (!consent) {
    return { error: "Guardian consent is required before the application can be sent." };
  }

  return {
    value: {
      studentName,
      guardianEmail,
      whatsapp,
      whatsappRaw,
      studentClass,
      track,
      experience,
      message,
      consent: true
    }
  };
}

function buildEmail(application, submittedAt) {
  const labels = {
    mathematics: "Mathematics",
    science: "Science",
    both: "Mathematics and Science",
    unsure: "Not sure yet"
  };

  const rows = [
    ["Student", application.studentName],
    ["Class", `Class ${application.studentClass}`],
    ["Track", labels[application.track] || application.track],
    ["Guardian email", application.guardianEmail],
    ["WhatsApp", application.whatsappRaw],
    ["Past contest experience", application.experience || "Not supplied"],
    ["Message", application.message || "Not supplied"],
    ["Consent", "Guardian consent confirmed"],
    ["Submitted", submittedAt]
  ];

  const text = [
    "New application — TEMS Academy",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Reply to this email to reach the guardian directly."
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f7f2e8;color:#1c1a16;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #d8cdbb;padding:28px;">
    <p style="font-family:Consolas,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a43b2b;margin:0 0 8px;">TEMS Academy</p>
    <h1 style="font-size:26px;line-height:1.15;margin:0 0 20px;">New application</h1>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><th style="text-align:left;vertical-align:top;width:34%;padding:9px 12px 9px 0;border-bottom:1px solid #e4d9c5;font-family:Consolas,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6d6659;">${escapeHtml(
              label
            )}</th><td style="vertical-align:top;padding:9px 0;border-bottom:1px solid #e4d9c5;white-space:pre-wrap;">${escapeHtml(
              value
            )}</td></tr>`
        )
        .join("")}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6d6659;margin:20px 0 0;">Reply to this email to reach the guardian directly.</p>
  </div>
</body>
</html>`;

  return { text, html };
}

async function sendWithResend(env, application, submittedAt) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const to = env.APPLY_TO_EMAIL || DEFAULT_TO;
  const from = env.APPLY_FROM_EMAIL || "TEMS Academy <onboarding@resend.dev>";
  const email = buildEmail(application, submittedAt);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: application.guardianEmail,
      subject: `TEMS application — ${application.studentName}, Class ${application.studentClass}`,
      text: email.text,
      html: email.html
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      sent: false,
      reason: `Resend returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`
    };
  }

  return { sent: true };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!sameOrigin(request)) {
    return fail(403, "This form can only be submitted from the academy website.");
  }

  const body = await readBody(request);
  if (!body || typeof body !== "object") {
    return fail(400, "The application could not be read. Please reload the page and try again.");
  }

  /* Honeypot: accept silently so a bot cannot learn that it was caught. */
  if (cleanText(body.website, 200)) {
    return json({ ok: true, message: "Application received." });
  }

  const started = Date.parse(cleanText(body.startedAt, 40));
  if (!Number.isFinite(started) || Date.now() - started < MIN_FILL_MS) {
    return fail(400, "Please take a moment to check the form, then submit it again.");
  }

  const limited = await checkRateLimit(request, env);
  if (limited.limited) {
    return fail(
      429,
      "There have been several applications from this connection. Please wait a few minutes, or message the academy on WhatsApp.",
      { "retry-after": String(limited.retryAfter || 60) }
    );
  }

  const result = validate(body);
  if (result.error) return fail(400, result.error);

  const application = result.value;
  const submittedAt = new Date().toISOString();

  if (!env.RESEND_API_KEY) {
    console.error("Application endpoint is missing RESEND_API_KEY.");
    return fail(
      503,
      "The application form is not connected yet. Please message the academy on WhatsApp with the same details."
    );
  }

  try {
    const delivery = await sendWithResend(env, application, submittedAt);
    if (!delivery.sent) {
      console.error("Application delivery failed.", delivery.reason);
      return fail(
        502,
        "The application could not be delivered. Please message the academy on WhatsApp with the same details."
      );
    }
  } catch (error) {
    console.error("Application delivery threw.", error && error.message ? error.message : "unknown error");
    return fail(
      502,
      "The application could not be delivered. Please message the academy on WhatsApp with the same details."
    );
  }

  return json({ ok: true, message: "Application received." });
}
