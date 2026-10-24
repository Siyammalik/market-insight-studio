#!/usr/bin/env node
/**
 * Lightweight site checks with no dependencies.
 * Run from the project root: node scripts/check-site.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const pageCache = new Map();

function walk(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    if (["node_modules", ".git", ".github"].includes(entry)) {
      continue;
    }

    const full = join(directory, entry);
    const stats = statSync(full);

    if (stats.isDirectory()) {
      files.push(...walk(full));
    } else if (extname(entry).toLowerCase() === ".html") {
      files.push(full);
    }
  }

  return files;
}

function readPage(file) {
  if (!pageCache.has(file)) {
    pageCache.set(file, readFileSync(file, "utf8"));
  }
  return pageCache.get(file);
}

function idsIn(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
}

function rel(file) {
  return relative(root, file).replaceAll("\\", "/");
}

const pages = walk(root).sort();
const idsByPage = new Map();

for (const page of pages) {
  idsByPage.set(rel(page), idsIn(readPage(page)));
}

for (const page of pages) {
  const pageName = rel(page);
  const html = readPage(page);
  const pageIds = idsByPage.get(pageName);

  const required = [
    [/<html[^>]*\blang="en"/i, "missing lang=\"en\" on <html>"],
    [/<main\b/i, "missing <main> landmark"],
    [/<title>[^<]+<\/title>/i, "missing a non-empty <title>"],
    [/<meta[^>]*name="viewport"/i, "missing viewport meta tag"],
    [/<meta[^>]*name="description"[^>]*content="[^"]+"/i, "missing meta description"],
    [/<meta[^>]*property="og:title"[^>]*content="[^"]+"/i, "missing og:title"],
    [/<meta[^>]*property="og:description"[^>]*content="[^"]+"/i, "missing og:description"],
    [/<meta[^>]*property="og:image"[^>]*content="[^"]+"/i, "missing og:image"],
    [/<meta[^>]*name="twitter:card"[^>]*content="[^"]+"/i, "missing twitter:card"]
  ];

  for (const [pattern, message] of required) {
    if (!pattern.test(html)) {
      errors.push(`${pageName}: ${message}`);
    }
  }

  // Duplicate IDs break anchor links and ARIA references.
  const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const seen = new Set();
  for (const id of allIds) {
    if (seen.has(id)) {
      errors.push(`${pageName}: duplicate id="${id}"`);
    }
    seen.add(id);
  }

  // ARIA references must point to an ID on the same page.
  for (const attribute of ["aria-controls", "aria-labelledby", "aria-describedby"]) {
    const regex = new RegExp(`\\b${attribute}="([^"]+)"`, "g");
    for (const match of html.matchAll(regex)) {
      for (const id of match[1].split(/\s+/).filter(Boolean)) {
        if (!pageIds.has(id)) {
          errors.push(`${pageName}: ${attribute}="${id}" does not match an element on this page`);
        }
      }
    }
  }

  // Label targets must exist.
  for (const match of html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)) {
    if (!pageIds.has(match[1])) {
      errors.push(`${pageName}: <label for="${match[1]}"> has no matching input id`);
    }
  }

  // Buttons outside a form default to submit; be explicit.
  for (const match of html.matchAll(/<button\b([^>]*)>/gi)) {
    if (!/\btype="/.test(match[1])) {
      errors.push(`${pageName}: <button> is missing an explicit type attribute`);
    }
  }

  // Images need alternative text.
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt="/.test(match[1])) {
      errors.push(`${pageName}: <img> is missing an alt attribute`);
    }
  }

  // New-tab links need noopener.
  for (const match of html.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/gi)) {
    if (!/\brel="[^"]*noopener/.test(match[1])) {
      warnings.push(`${pageName}: target="_blank" link should include rel="noopener"`);
    }
  }

  // Internal links and assets.
  for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/gi)) {
    const raw = match[1].trim();
    const kind = match[0].slice(0, match[0].indexOf("=")).toLowerCase();

    if (!raw) {
      errors.push(`${pageName}: empty ${kind} attribute`);
      continue;
    }

    if (raw === "#") {
      errors.push(`${pageName}: placeholder link href="#"`);
      continue;
    }

    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(raw) || raw.startsWith("//")) {
      if (kind === "src" && /^https?:/i.test(raw)) {
        warnings.push(`${pageName}: external asset ${raw} — prefer local assets`);
      }
      continue;
    }

    if (raw.startsWith("#")) {
      if (!pageIds.has(raw.slice(1))) {
        errors.push(`${pageName}: anchor ${raw} has no matching id`);
      }
      continue;
    }

    const [beforeQuery] = raw.split("?");
    const [pathPart, hash] = beforeQuery.split("#");
    let target;

    if (!pathPart) {
      target = page;
    } else if (pathPart.startsWith("/")) {
      warnings.push(`${pageName}: root-relative link ${raw} will break on a GitHub Pages project subpath`);
      target = resolve(root, `.${pathPart}`);
    } else {
      target = resolve(dirname(page), decodeURIComponent(pathPart));
    }

    if (!existsSync(target)) {
      errors.push(`${pageName}: ${kind}="${raw}" points to a missing file`);
      continue;
    }

    if (hash) {
      const targetRel = rel(target);
      const targetIds = idsByPage.get(targetRel);
      if (targetIds && !targetIds.has(hash)) {
        errors.push(`${pageName}: ${raw} points to a missing anchor in ${targetRel}`);
      }
    }
  }

  if (/hello@example\.com/i.test(html)) {
    warnings.push(`${pageName}: still contains the placeholder email hello@example.com — update the no-JavaScript fallback`);
  }

  // Social images must resolve locally.
  for (const property of ["og:image", "twitter:image"]) {
    const match = html.match(new RegExp(`<meta[^>]*${property.replace(":", "\\:")}[^>]*content="([^"]+)"`, "i"));
    if (!match) {
      continue;
    }
    const image = match[1];
    if (/^https?:/i.test(image)) {
      warnings.push(`${pageName}: ${property} uses an absolute external URL; confirm it is intentional`);
    } else if (!existsSync(resolve(root, image))) {
      errors.push(`${pageName}: ${property}="${image}" points to a missing file`);
    }
  }
}

// Configuration and privacy checks.
const configPath = join(root, "assets", "js", "config.js");
let config = "";

if (!existsSync(configPath)) {
  errors.push("assets/js/config.js is missing");
} else {
  config = readFileSync(configPath, "utf8");
  if (/hello@example\.com/i.test(config)) {
    warnings.push("config.js still uses the placeholder email hello@example.com — replace it before launch");
  }
  if (/\bTODO\b/.test(config)) {
    warnings.push("config.js contains a TODO marker");
  }
}

const textFiles = walk(root).map((file) => [file, readFileSync(file, "utf8")]);

for (const asset of ["assets/js/config.js", "assets/js/main.js", "assets/css/styles.css"]) {
  const assetPath = join(root, asset);
  if (!existsSync(assetPath)) {
    errors.push(`${asset} is missing`);
  } else {
    textFiles.push([assetPath, readFileSync(assetPath, "utf8")]);
  }
}

const secretPatterns = [/sk_live_[A-Za-z0-9]+/, /sk_test_[A-Za-z0-9]+/, /AIza[0-9A-Za-z_-]{20,}/, /ghp_[A-Za-z0-9]{20,}/, /xox[baprs]-[A-Za-z0-9-]+/];

for (const [file, text] of textFiles) {
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) {
      errors.push(`${rel(file)}: possible secret or API key detected`);
    }
  }

  if (/fonts\.(googleapis|gstatic)\.com/i.test(text)) {
    warnings.push(`${rel(file)}: external Google Fonts request found — the site is designed to work without it`);
  }

  if (/(googletagmanager|google-analytics|plausible\.io|gtag\()/i.test(text)) {
    warnings.push(`${rel(file)}: analytics or tracking reference found — the site claims no tracking`);
  }
}

const uniqueErrors = [...new Set(errors)];
const uniqueWarnings = [...new Set(warnings)];

console.log("Market Insight Studio — site checks");
console.log(`HTML pages checked: ${pages.length} (${pages.map(rel).join(", ")})`);
console.log("");

if (uniqueErrors.length) {
  console.log(`Errors (${uniqueErrors.length}):`);
  for (const error of uniqueErrors) {
    console.log(`  ✗ ${error}`);
  }
} else {
  console.log("Errors: none");
}

if (uniqueWarnings.length) {
  console.log("");
  console.log(`Warnings (${uniqueWarnings.length}):`);
  for (const warning of uniqueWarnings) {
    console.log(`  ! ${warning}`);
  }
} else {
  console.log("Warnings: none");
}

console.log("");
console.log(uniqueErrors.length ? "Result: FAIL" : "Result: PASS");

process.exit(uniqueErrors.length ? 1 : 0);
