/* ============================================================
   Cloudflare Worker for flcason.com — replaces the Vercel project.
   ------------------------------------------------------------
   One Worker does what Vercel did implicitly:
     - serves the static site from dist/ (scripts/build-site.js)
     - applies the friendly rewrites and headers from vercel.json
     - runs the api/ functions, UNCHANGED, through a small adapter
       that gives them the (req, res) shape Vercel handed them
     - upgrades http to https (308) with HSTS, and folds www into
       the apex

   The api/ modules read keys from process.env. With nodejs_compat
   (and a compatibility date after 2025-04-01) the Worker's vars and
   secrets appear there, so the functions need no edits.
   ============================================================ */

import consensus from '../api/consensus.js';
import persona from '../api/persona.js';
import records from '../api/records.js';
import propose from '../api/propose.js';
import metricAuth from '../api/metric-auth.js';
import metricPiece from '../api/metric-piece.js';
import metricNote from '../api/metric-note.js';
import metricAudio from '../api/metric-audio.js';

const APEX = 'flcason.com';

/** Same value Vercel sends on custom domains. */
const HSTS = 'max-age=63072000';

/** Vercel routed api/<name>.js to /api/<name>; files starting "_" were never routed. */
const API = {
  '/api/consensus': consensus,
  '/api/persona': persona,
  '/api/records': records,
  '/api/propose': propose,
  '/api/metric-auth': metricAuth,
  '/api/metric-piece': metricPiece,
  '/api/metric-note': metricNote,
  '/api/metric-audio': metricAudio,
};

/** vercel.json "rewrites": the URL stays, the content comes from the destination. */
const REWRITES = {
  '/heritage': '/',
  '/tree': '/cason-tree',
  '/dashboard': '/ui_kits/family-tree-app',
  '/living/world': '/ui_kits/living-line/world',
  '/living': '/ui_kits/living-line',
  '/proof': '/ui_kits/proof',
  '/archive': '/ui_kits/archive',
  '/demo': '/ui_kits/onboarding',
  '/try': '/ui_kits/onboarding',
  '/deck': '/slides',
  '/system': '/README.md',
  '/prompt': '/research/edge-expansion-prompt.md',
};

const REVALIDATE = 'public, max-age=0, must-revalidate';

/* ---------- Vercel (req, res) adapter ---------- */

class VercelResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = new Headers();
    this.body = null;
    this.finished = false;
  }
  status(code) { this.statusCode = code; return this; }
  setHeader(name, value) {
    this.headers.set(name, Array.isArray(value) ? value.join(', ') : String(value));
    return this;
  }
  getHeader(name) { return this.headers.get(name); }
  json(value) {
    if (!this.headers.has('content-type')) this.headers.set('content-type', 'application/json; charset=utf-8');
    return this.end(JSON.stringify(value));
  }
  send(value) {
    if (value !== null && typeof value === 'object' && !(value instanceof Uint8Array)) return this.json(value);
    return this.end(value);
  }
  end(value) {
    this.body = value == null ? null : value;
    this.finished = true;
    return this;
  }
}

async function toVercelRequest(request) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers); // keys arrive lower-cased, as on Vercel
  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const raw = await request.text();
    body = raw;
    // Vercel parsed JSON bodies; every handler here also accepts the raw string.
    if (raw && (headers['content-type'] || '').includes('application/json')) {
      try { body = JSON.parse(raw); } catch { /* handlers fall back to the string */ }
    }
  }
  return {
    method: request.method,
    url: url.pathname + url.search,
    headers,
    query: Object.fromEntries(url.searchParams),
    body,
  };
}

async function runApi(handler, request) {
  const res = new VercelResponse();
  try {
    await handler(await toVercelRequest(request), res);
  } catch (err) {
    console.error('api handler threw:', err);
    if (!res.finished) res.status(500).json({ error: 'Server error.' });
  }
  if (!res.finished) res.status(500).json({ error: 'The function returned no response.' });
  return new Response(res.body, { status: res.statusCode, headers: res.headers });
}

/* ---------- headers (vercel.json "headers") ---------- */

function withSiteHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  const set = (k, v) => headers.set(k, v);
  // Site-wide first, so the narrower rules below win.
  set('Strict-Transport-Security', HSTS);
  set('X-Content-Type-Options', 'nosniff');
  if (!headers.has('Referrer-Policy')) set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const type = headers.get('content-type') || '';
  if (type.startsWith('text/html') || pathname === '/books.json') set('Cache-Control', REVALIDATE);
  if (response.status === 200 && pathname.startsWith('/assets/')) {
    set('Cache-Control', pathname.endsWith('.css') ? 'public, max-age=86400' : 'public, max-age=31536000, immutable');
  } else if (pathname.endsWith('.css')) {
    set('Cache-Control', 'public, max-age=86400');
  }
  if (pathname.startsWith('/projects/books/')) {
    set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    set('Cache-Control', 'no-store');
  }
  if (pathname.startsWith('/api/metric-')) {
    set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    set('Cache-Control', 'no-store');
    set('Referrer-Policy', 'no-referrer');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/* ---------- entry point ---------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === `www.${APEX}`) {
      return Response.redirect(`https://${APEX}${url.pathname}${url.search}`, 308);
    }
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 308);
    }

    const { pathname } = url;

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const handler = API[pathname.replace(/\/+$/, '')];
      const response = handler
        ? await runApi(handler, request)
        : Response.json({ error: 'Not found.' }, { status: 404 });
      return withSiteHeaders(response, pathname);
    }

    // vercel.json "trailingSlash": false — one canonical URL per page.
    if (pathname.length > 1 && pathname.endsWith('/')) {
      url.pathname = pathname.replace(/\/+$/, '') || '/';
      return Response.redirect(url.toString(), 308);
    }

    let assetRequest = request;
    const target = REWRITES[pathname];
    if (target !== undefined && pathname !== target) {
      const rewritten = new URL(url);
      rewritten.pathname = target;
      assetRequest = new Request(rewritten, request);
    }
    return withSiteHeaders(await env.ASSETS.fetch(assetRequest), pathname);
  },
};
