/* ============================================================
   Precompile the browser JSX so the site stops shipping a compiler.
   ------------------------------------------------------------
   Before this script, every page loaded @babel/standalone (3.14 MB)
   and React's *development* UMD builds (1.19 MB), then compiled the
   JSX on the main thread on every single page view. /living/world
   paid that on top of 184 KB of its own JSX.

   Two consequences, both real:
     - ~4.3 MB of vendor JS before a line of app code ran.
     - A syntax error could not fail a build, because there was no
       build. It shipped as a blank page — that is how /living went
       dark for ~6 days on smart quotes in LivingWorld.jsx.

   This script does that compile once, at author time, with the
   esbuild already in devDependencies:

     1. extract any inline <script type="text/babel"> block into a
        real sibling .boot.jsx (one-time; it becomes the source)
     2. compile ui_kits/**\/*.jsx -> sibling .js
     3. rewrite the HTML to load the compiled .js, drop Babel, and
        point React at the vendored production builds
     4. guard: two .jsx files loaded by the same page may not declare
        the same top-level const/let/class. In-browser Babel's
        preset-env rewrote those to `var` and silently tolerated a
        collision; real `const` throws and takes the page with it.

   Usage:
     node scripts/build-jsx.js           # build
     node scripts/build-jsx.js --check   # fail if output is stale
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const CHECK = process.argv.includes('--check');
const rel = f => path.relative(root, f).split(path.sep).join('/');

const REACT_VENDOR = {
  'react.development.js': '/assets/vendor/react-18.3.1.production.min.js',
  'react-dom.development.js': '/assets/vendor/react-dom-18.3.1.production.min.js',
};

const problems = [];
const changed = [];

/* ---------- helpers ---------- */
const SKIP = { node_modules: 1, '.git': 1, 'playwright-report': 1, 'test-results': 1, _recovered: 1 };
function walk(dir, ext, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) { if (!SKIP[ent.name]) walk(path.join(dir, ent.name), ext, out); }
    else if (ent.name.endsWith(ext)) out.push(path.join(dir, ent.name));
  }
  return out;
}

// Compare with line endings normalised. core.autocrlf=true hands us CRLF in the
// working tree while esbuild emits LF, so a byte-for-byte compare would report
// every generated file stale on a fresh Windows clone — a gate that cries wolf
// is a gate people bypass with --no-verify.
const norm = s => (s == null ? null : s.replace(/\r\n/g, '\n'));

function write(file, content) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (norm(existing) === norm(content)) return false;
  if (CHECK) { problems.push(rel(file) + ' — stale (regenerate with `npm run build:jsx`)'); return false; }
  fs.writeFileSync(file, content);
  changed.push(rel(file));
  return true;
}

function compile(src, label) {
  // minifyIdentifiers stays OFF on purpose: these are classic scripts and their
  // top-level names ARE the cross-file API (LivingWorld.jsx declares the symbol
  // the boot script renders). Mangling them would break the page.
  try {
    return esbuild.transformSync(src, {
      loader: 'jsx', target: 'es2019',
      minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false,
    }).code;
  } catch (e) {
    const first = (e.errors && e.errors[0]) || null;
    const where = first && first.location ? ':' + first.location.line + ':' + first.location.column : '';
    problems.push(label + where + ' — ' + (first ? first.text : String(e.message).split('\n')[0]));
    return null;
  }
}

/* ---------- 1. inline babel blocks -> real .jsx, and rewrite tags ---------- */
const BABEL_TAG = /<script\b([^>]*\btype=["']text\/babel["'][^>]*)>([\s\S]*?)<\/script>/gi;
const htmlFiles = walk(root, '.html', []);

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  if (!/type=["']text\/babel["']/i.test(html) && !/@babel\/standalone/.test(html) &&
      !/react(-dom)?\.development\.js/.test(html)) continue;

  const dir = path.dirname(file);
  const pageName = path.basename(file, '.html');
  let idx = 0;

  html = html.replace(BABEL_TAG, (whole, attrs, body) => {
    // external: <script type="text/babel" src="X.jsx"> -> <script src="X.js">
    if (/\bsrc=/.test(attrs)) {
      const src = attrs.match(/\bsrc=["']([^"']+)["']/)[1];
      return '<script src="' + src.replace(/\.jsx$/, '.js') + '"></script>';
    }
    // inline: promote to a real .boot.jsx so it has a source of truth,
    // gets covered by check:syntax, and makes this build idempotent.
    if (!body.trim()) return whole;
    const bootName = pageName + (idx++ ? '.boot' + idx : '.boot');
    const bootJsx = path.join(dir, bootName + '.jsx');
    if (!fs.existsSync(bootJsx)) {
      if (CHECK) problems.push(rel(bootJsx) + ' — missing (regenerate with `npm run build:jsx`)');
      else { fs.writeFileSync(bootJsx, body.replace(/^\n/, '').replace(/\s+$/, '') + '\n'); changed.push(rel(bootJsx)); }
    }
    // Absolute, not relative: these pages are reached through vercel.json
    // rewrites (/living -> /ui_kits/living-line), so the URL path is NOT the
    // file path. A relative src resolves against the URL and 404s.
    return '<script src="/' + rel(bootJsx).replace(/\.jsx$/, '.js') + '"></script>';
  });

  // drop the in-browser compiler entirely
  html = html.replace(/^[ \t]*<script[^>]*@babel\/standalone[^>]*><\/script>\n?/gim, '');
  // development React -> vendored production React
  for (const dev of Object.keys(REACT_VENDOR)) {
    const re = new RegExp('<script[^>]*src="https://unpkg\\.com/[^"]*' + dev.replace(/\./g, '\\.') + '"[^>]*></script>', 'gi');
    html = html.replace(re, '<script src="' + REACT_VENDOR[dev] + '"></script>');
  }
  if (html !== original) write(file, html);
}

/* ---------- 2. compile every .jsx -> sibling .js ---------- */
const jsxFiles = walk(path.join(root, 'ui_kits'), '.jsx', []);
for (const file of jsxFiles) {
  const code = compile(fs.readFileSync(file, 'utf8'), rel(file));
  if (code == null) continue;
  const banner = '/* GENERATED from ' + path.basename(file) + ' by scripts/build-jsx.js — do not edit. */\n';
  write(file.replace(/\.jsx$/, '.js'), banner + code);
}

/* ---------- 3. guard: no top-level name collisions per page ---------- */
const topLevel = f => (fs.readFileSync(f, 'utf8').match(/^(?:const|let|class)\s+[A-Za-z_$][\w$]*/gm) || [])
  .map(s => s.split(/\s+/)[1]);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const srcs = [...html.matchAll(/<script\s+src="([^"]+\.js)"><\/script>/g)].map(m => m[1]);
  const seen = new Map();
  for (const src of srcs) {
    const base = src.startsWith('/') ? root : path.dirname(file);
    const jsxPath = path.join(base, src.replace(/^\//, '').replace(/\.js$/, '.jsx'));
    if (!fs.existsSync(jsxPath)) continue;
    for (const name of topLevel(jsxPath)) {
      if (seen.has(name)) {
        problems.push(rel(file) + ' — top-level "' + name + '" declared in both ' +
          seen.get(name) + ' and ' + rel(jsxPath) + ' (const collision would blank the page)');
      } else seen.set(name, rel(jsxPath));
    }
  }
}

/* ---------- 4. guard: nothing still ships a compiler ---------- */
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (/@babel\/standalone/.test(html)) problems.push(rel(file) + ' — still loads @babel/standalone');
  if (/type=["']text\/babel["']/i.test(html)) problems.push(rel(file) + ' — still has a text/babel script');
  if (/react(-dom)?\.development\.js/.test(html)) problems.push(rel(file) + ' — still loads a React development build');
}

/* ---------- report ---------- */
if (problems.length) {
  console.error('build-jsx ' + (CHECK ? 'CHECK FAILED' : 'FAILED') + ' (' + problems.length + '):');
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}
const onProd = htmlFiles.filter(f => /\/assets\/vendor\/react/.test(fs.readFileSync(f, 'utf8'))).length;
console.log('build-jsx OK — ' + jsxFiles.length + ' .jsx compiled, ' + onProd + ' page(s) on production React' +
  (CHECK ? ', output in sync.' : (changed.length ? '. Wrote ' + changed.length + ' file(s).' : '. Nothing to do.')));
