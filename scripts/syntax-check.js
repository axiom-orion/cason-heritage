/* ============================================================
   Parse gate for the no-build browser sources.
   ------------------------------------------------------------
   The site ships JSX raw and compiles it with in-browser Babel,
   so a syntax error doesn't fail a build — it ships straight to
   production as a blank page (that's how /living went dark for
   ~6 days from smart quotes in LivingWorld.jsx).

   This script fails fast instead:
     1. esbuild parse (loader: jsx) over ui_kits/**\/*.jsx
     2. node --check over ui_kits/living-line/*.js
     3. no regex lookbehind anywhere in those files — lookbehind
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
const jsFiles = fs.readdirSync(path.join(root, 'ui_kits', 'living-line'))
  .filter(function (f) { return f.endsWith('.js'); })
  .map(function (f) { return path.join(root, 'ui_kits', 'living-line', f); });
jsFiles.forEach(function (file) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) {
    const lines = String(r.stderr || '').trim().split('\n');
    const errLine = lines.filter(function (l) { return /Error/.test(l); })[0] || lines[0] || 'node --check failed';
    failures.push(rel(file) + ' — ' + errLine.trim());
  }
});

/* ---- 3. no regex lookbehind in browser-shipped code ---- */
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

const checked = jsxFiles.length + jsFiles.length;
if (failures.length) {
  console.error('syntax-check FAILED (' + failures.length + ' problem' + (failures.length === 1 ? '' : 's') + '):');
  failures.forEach(function (f) { console.error('  ' + f); });
  process.exit(1);
}
console.log('syntax-check OK — ' + jsxFiles.length + ' .jsx (esbuild) + ' + jsFiles.length +
  ' .js (node --check) parsed clean, no lookbehind (' + checked + ' files).');
