/* ============================================================
   Parse gate for the no-build browser sources.
   ------------------------------------------------------------
   The site ships JSX raw and compiles it with in-browser Babel,
   so a syntax error doesn't fail a build — it ships straight to
   production as a blank page (that's how /living went dark for
   ~6 days from smart quotes in LivingWorld.jsx).

   This script fails fast instead:
     1. esbuild parse (loader: jsx) over ui_kits/**\/*.jsx
     2. node --check over ui_kits/living-line/*.js + ui_kits/archive/*.js
     3. esbuild parse of the inline <script type="text/babel"> blocks
        in *.html (proof/world/archive/family-tree pages) — invisible
        to steps 1-2, but they ship JSX to a blank page just the same.
     4. no regex lookbehind anywhere in those files/blocks — lookbehind
        is a parse-time SyntaxError on iOS Safari < 16.4, which
        kills the entire file on older iPhones/iPads.

   Wired as `npm run check:syntax` and as the pretest hook, so
   `npm test` (Playwright) refuses to run against broken sources.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const failures = [];

function walk(dir, ext, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (ent) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, ext, out);
    else if (ent.name.endsWith(ext)) out.push(full);
  });
  return out;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

/* ---- 1. JSX parse check (esbuild) ---- */
const jsxFiles = walk(path.join(root, 'ui_kits'), '.jsx', []);
jsxFiles.forEach(function (file) {
  try {
    esbuild.transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx' });
  } catch (e) {
    const first = (e.errors && e.errors[0]) || null;
    const where = first && first.location ? ':' + first.location.line + ':' + first.location.column : '';
    failures.push(rel(file) + where + ' — ' + (first ? first.text : String(e.message).split('\n')[0]));
  }
});

/* ---- 2. plain-JS parse check (node --check) ---- */
const jsDirs = [path.join(root, 'ui_kits', 'living-line'), path.join(root, 'ui_kits', 'archive')];
const jsFiles = jsDirs.reduce(function (acc, dir) {
  if (!fs.existsSync(dir)) return acc;
  fs.readdirSync(dir).forEach(function (f) { if (f.endsWith('.js')) acc.push(path.join(dir, f)); });
  return acc;
}, []);
jsFiles.forEach(function (file) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) {
    const lines = String(r.stderr || '').trim().split('\n');
    const errLine = lines.filter(function (l) { return /Error/.test(l); })[0] || lines[0] || 'node --check failed';
    failures.push(rel(file) + ' — ' + errLine.trim());
  }
});

/* ---- 3. inline JSX in .html (esbuild) ----
   The pages also ship JSX inline via <script type="text/babel">…</script>,
   compiled by in-browser Babel. A typo there is invisible to steps 1-2 (they
   only scan standalone .jsx/.js) and ships straight to a blank page. Extract
   each inline block and parse it exactly like a .jsx file. Also collect the
   blocks so the lookbehind scan (step 4) covers them too. */
const SKIP_DIRS = { node_modules: 1, '.git': 1, 'playwright-report': 1, 'test-results': 1 };
function walkHtml(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (ent) {
    if (ent.isDirectory()) { if (!SKIP_DIRS[ent.name]) walkHtml(path.join(dir, ent.name), out); }
    else if (ent.name.endsWith('.html')) out.push(path.join(dir, ent.name));
  });
  return out;
}
// match a babel <script> and capture its opening-tag attrs + inline body
const BABEL_RE = /<script\b([^>]*\btype=["']text\/babel["'][^>]*)>([\s\S]*?)<\/script>/gi;
const htmlFiles = walkHtml(root, []);
const inlineBlocks = []; // { file, startLine, code } — for the lookbehind pass
let inlineBlockCount = 0;
htmlFiles.forEach(function (file) {
  const src = fs.readFileSync(file, 'utf8');
  let m;
  BABEL_RE.lastIndex = 0;
  while ((m = BABEL_RE.exec(src)) !== null) {
    const attrs = m[1] || '';
    if (/\bsrc=/.test(attrs)) continue;          // external babel src -> it's a .jsx already checked in step 1
    const code = m[2] || '';
    if (!code.trim()) continue;                  // empty block, nothing to parse
    inlineBlockCount++;
    const startLine = src.slice(0, m.index).split('\n').length; // 1-based line of the <script> tag
    inlineBlocks.push({ file: file, startLine: startLine, code: code });
    try {
      esbuild.transformSync(code, { loader: 'jsx' });
    } catch (e) {
      const first = (e.errors && e.errors[0]) || null;
      // esbuild line is relative to the block; offset to the file's real line
      const fileLine = first && first.location ? (startLine + first.location.line) : startLine;
      failures.push(rel(file) + ':~' + fileLine + ' (inline babel) — ' + (first ? first.text : String(e.message).split('\n')[0]));
    }
  }
});

/* ---- 4. no regex lookbehind in browser-shipped code ---- */
const lookbehind = /\(\?<[=!]/;
jsxFiles.concat(jsFiles).forEach(function (file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach(function (line, i) {
    if (lookbehind.test(line)) {
      failures.push(rel(file) + ':' + (i + 1) +
        ' — regex lookbehind: SyntaxError on iOS Safari < 16.4 (kills the whole file on older devices)');
    }
  });
});
inlineBlocks.forEach(function (b) {
  b.code.split('\n').forEach(function (line, i) {
    if (lookbehind.test(line)) {
      failures.push(rel(b.file) + ':' + (b.startLine + i) +
        ' (inline babel) — regex lookbehind: SyntaxError on iOS Safari < 16.4 (kills the whole file on older devices)');
    }
  });
});

const checked = jsxFiles.length + jsFiles.length + inlineBlockCount;
if (failures.length) {
  console.error('syntax-check FAILED (' + failures.length + ' problem' + (failures.length === 1 ? '' : 's') + '):');
  failures.forEach(function (f) { console.error('  ' + f); });
  process.exit(1);
}
console.log('syntax-check OK — ' + jsxFiles.length + ' .jsx + ' + inlineBlockCount + ' inline-babel block' +
  (inlineBlockCount === 1 ? '' : 's') + ' (esbuild) + ' + jsFiles.length +
  ' .js (node --check) parsed clean, no lookbehind (' + checked + ' checks).');
