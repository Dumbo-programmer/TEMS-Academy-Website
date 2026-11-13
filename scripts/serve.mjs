/**
 * Local preview server for the generated static site.
 * Maps extensionless URLs (/class-structure) to class-structure.html, like
 * Cloudflare Pages does, and provides a local stand-in for POST /api/apply.
 *
 * Usage: npm run dev   (builds first) or node scripts/serve.mjs
 */

import fs from "fs";
import http from "http";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

const TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
  [".map", "application/json; charset=utf-8"]
]);

const COMPRESSIBLE = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".xml",
  ".txt",
  ".webmanifest",
  ".svg"
]);

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://maps.google.com https://www.google.com",
  "form-action 'self'"
].join("; ");

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "content-security-policy": CSP,
    ...headers
  });
  res.end(body);
}

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function resolveFile(pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const target = path.resolve(ROOT, relative);

  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  if (!isDirectory(target) && fileExists(target)) return target;
  const html = `${target}.html`;
  if (fileExists(html)) return html;
  if (isDirectory(target)) {
    const index = path.join(target, "index.html");
    return fileExists(index) ? index : null;
  }
  const index = path.join(target, "index.html");
  if (fileExists(index)) return index;
  return null;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error("too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function mockApply(request, res) {
  readJson(request)
    .then((data) => {
      if (data.website) {
        send(res, 200, JSON.stringify({ ok: true, message: "Application received." }), {
          "content-type": "application/json; charset=utf-8"
        });
        return;
      }
      if (!data.studentName || !data.guardianEmail) {
        send(res, 400, JSON.stringify({ ok: false, message: "Name and email are required." }), {
          "content-type": "application/json; charset=utf-8"
        });
        return;
      }
      if (!data.consent) {
        send(res, 400, JSON.stringify({ ok: false, message: "Guardian consent is required." }), {
          "content-type": "application/json; charset=utf-8"
        });
        return;
      }
      console.log(
        `[dev] Application from ${String(data.studentName).slice(0, 60)} · Class ${String(
          data.studentClass
        ).slice(0, 2)} · ${String(data.track).slice(0, 16)}`
      );
      send(
        res,
        200,
        JSON.stringify({
          ok: true,
          message: "Local preview only: the application was logged, not emailed."
        }),
        { "content-type": "application/json; charset=utf-8" }
      );
    })
    .catch(() => {
      send(res, 400, JSON.stringify({ ok: false, message: "Could not read the application." }), {
        "content-type": "application/json; charset=utf-8"
      });
    });
}

const server = http.createServer((request, response) => {
  const method = request.method || "GET";
  let pathname;

  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    send(response, 400, "Bad request");
    return;
  }

  if (pathname.includes("\0")) {
    send(response, 400, "Bad request");
    return;
  }

  if (pathname === "/api/apply") {
    if (method === "POST") {
      mockApply(request, response);
      return;
    }
    send(response, 405, "Method not allowed", { allow: "POST" });
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    send(response, 405, "Method not allowed", { allow: "GET, HEAD" });
    return;
  }

  const file = resolveFile(pathname);
  if (!file) {
    const notFound = path.join(ROOT, "404.html");
    const body = fileExists(notFound) ? fs.readFileSync(notFound) : "Not found";
    send(response, 404, method === "HEAD" ? undefined : body, {
      "content-type": "text/html; charset=utf-8"
    });
    return;
  }

  const type = TYPES.get(path.extname(file).toLowerCase()) || "application/octet-stream";
  const raw = fs.readFileSync(file);
  const acceptsGzip = /\bgzip\b/.test(String(request.headers["accept-encoding"] || ""));
  const canCompress = COMPRESSIBLE.has(path.extname(file).toLowerCase()) && raw.length > 1024;
  const body = acceptsGzip && canCompress ? zlib.gzipSync(raw, { level: 9 }) : raw;
  const headers = {
    "content-type": type,
    "content-length": body.length,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "content-security-policy": CSP
  };
  if (body !== raw) {
    headers["content-encoding"] = "gzip";
    headers["vary"] = "Accept-Encoding";
  }

  response.writeHead(200, headers);
  response.end(method === "HEAD" ? undefined : body);
});

server.listen(PORT, HOST, () => {
  console.log(`TEMS Academy preview: http://${HOST}:${PORT}`);
  console.log(`Serving ${ROOT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT to another value.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
