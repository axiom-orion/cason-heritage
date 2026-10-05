/* ============================================================
   Stage the public site into dist/ for the Cloudflare Worker.
   ------------------------------------------------------------
   Vercel deployed from git, so it only ever served TRACKED files.
   `wrangler deploy` uploads a folder from disk instead, and a working
   copy holds things that must never go public: untracked drafts in
   uploads/ and scrap/, design-handoff bundles, .claude/, a local
   .dev.vars full of API keys.

   So the asset folder is never the repo root. This script copies
   exactly what `git ls-files` lists, minus server code and tooling,
   into a fresh dist/. An untracked file cannot reach the site, and a
   tracked one only does if it is not on the deny list below.

   Usage:
     node scripts/build-site.js     # -> dist/
   ============================================================ */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

/* Tracked, but not part of the served site. Server code (api/, worker/)
   runs inside the Worker; the rest is repo tooling and config. */
const DENY_DIRS = ['api/', 'worker/', 'scripts/', 'tests/', '.github/'];
const DENY_FILES = new Set([
  'package.json',
  'package-lock.json',
  'playwright.config.js',
  'vercel.json',
  'serve.json',
  'wrangler.jsonc',
]);
const DENY_PATTERNS = [
  /^SESSION-WRAPUP-.*\.md$/, // was in .vercelignore
  /(^|\/)\.[^/]+$/,          // dotfiles anywhere (.gitignore, .mcp.json, .dev.vars, ...)
];

function isPublic(file) {
  if (DENY_FILES.has(file)) return false;
  if (DENY_DIRS.some((d) => file.startsWith(d))) return false;
  if (DENY_PATTERNS.some((re) => re.test(file))) return false;
  return true;
}

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\0').filter(Boolean);
}

function main() {
  const files = trackedFiles().filter(isPublic);
  fs.rmSync(OUT, { recursive: true, force: true });
  let bytes = 0;
  let copied = 0;
  for (const file of files) {
    const src = path.join(ROOT, file);
    // A tracked file deleted in the working copy is simply not deployed.
    if (!fs.existsSync(src)) continue;
    const dest = path.join(OUT, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    bytes += fs.statSync(dest).size;
    copied++;
  }
  console.log(`build-site: ${copied} files, ${(bytes / 1048576).toFixed(1)} MiB -> dist/`);
}

if (require.main === module) main();

module.exports = { isPublic };
