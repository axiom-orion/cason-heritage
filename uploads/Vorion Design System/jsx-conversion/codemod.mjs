#!/usr/bin/env node
/**
 * codemod.mjs — html-in-string page.tsx → real JSX
 *
 * Reads a page.tsx that wraps a PAGE_HTML constant in dangerouslySetInnerHTML
 * and rewrites it as inline JSX with class→className conversion and other
 * standard JSX gotchas handled.
 *
 * Usage:
 *   node codemod.mjs path/to/page.tsx > path/to/page.new.tsx
 *
 * Conversions performed:
 *   • class="foo"           → className="foo"
 *   • for="x"               → htmlFor="x"
 *   • <input ...>           → <input ... />
 *   • style="color: red"    → style={{ color: 'red' }}
 *   • on{event}="..."       → on{Event}={() => ...}   (leaves @TODO marker)
 *   • inline JS in onclick  → @TODO marker
 *   • SVG attrs (stroke-width etc.) → strokeWidth
 */

import { readFileSync } from 'node:fs';

const SVG_ATTRS = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-opacity': 'strokeOpacity',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'text-anchor': 'textAnchor',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing',
};

function styleStringToObject(s) {
  const parts = s.split(';').map(p => p.trim()).filter(Boolean);
  const obj = {};
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    const camelK = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[camelK] = v;
  }
  return obj;
}

function convertStyleAttr(html) {
  return html.replace(/style="([^"]+)"/g, (_, body) => {
    const obj = styleStringToObject(body);
    const props = Object.entries(obj).map(([k, v]) => `${k}: '${v.replace(/'/g, "\\'")}'`).join(', ');
    return `style={{ ${props} }}`;
  });
}

function convertHTML(html) {
  html = html.replace(/\bclass="/g, 'className="');
  html = html.replace(/\bfor="/g, 'htmlFor="');
  for (const [from, to] of Object.entries(SVG_ATTRS)) {
    html = html.replace(new RegExp('\\b' + from + '="', 'g'), to + '="');
  }
  // self-close void elements
  html = html.replace(/<(input|img|br|hr|meta|link)([^>]*?)(?<!\/)>/g,
    (_, tag, rest) => `<${tag}${rest} />`);
  // mark inline event handlers for hand-fix
  html = html.replace(/\bon([a-z]+)="([^"]+)"/g,
    (_, ev, code) => `/* @TODO event handler: on${ev} = "${code}" */`);
  // styles last (so we don't disturb the others)
  html = convertStyleAttr(html);
  // comments: <!-- foo --> → {/* foo */}
  html = html.replace(/<!--([\s\S]*?)-->/g, (_, body) => `{/* ${body.trim()} */}`);
  return html;
}

const path = process.argv[2];
if (!path) { console.error('usage: codemod.mjs path/to/page.tsx'); process.exit(1); }

const src = readFileSync(path, 'utf8');
const match = src.match(/PAGE_HTML\s*=\s*`([\s\S]*?)`;/);
if (!match) { console.error('no PAGE_HTML constant found'); process.exit(1); }

const converted = convertHTML(match[1]);
const out = src.replace(/PAGE_HTML\s*=\s*`[\s\S]*?`;\s*/,
  '');

const before = src.slice(0, src.indexOf('export default'));
console.log(before);
console.log('export default function Page() {');
console.log('  return (');
console.log('    <>');
console.log('      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />');
console.log('      ' + converted.replace(/\n/g, '\n      '));
console.log('    </>');
console.log('  );');
console.log('}');
