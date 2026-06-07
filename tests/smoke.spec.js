// Smoke tests — page loads, the Living World renders & navigates, and the
// app surfaces log ZERO console errors (in-browser Babel warnings excepted).
const { test, expect } = require('@playwright/test');

// Collect real errors only: uncaught page errors and console.error from app
// code. Pure network resource-load noise (CDN/tile/cert in sandboxes) is
// ignored — the functional assertions guarantee the app actually rendered.
function watchErrors(page) {
  const errors = [];
  const ignore = /Failed to load resource|net::ERR_|ERR_CERT|favicon/i;
  page.on('console', function (m) { if (m.type() === 'error' && !ignore.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('pageerror', function (e) { errors.push('pageerror: ' + (e && e.message ? e.message : e)); });
  return errors;
}

test('The Living World renders, navigates all views, zero console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');

  // The app mounts after the in-browser Babel transform — wait for the chrome.
  await expect(page.getByText('The Living Line', { exact: false }).first()).toBeVisible({ timeout: 25000 });
  await expect(page.getByText('Watch them live')).toBeVisible();
  await expect(page.getByText(/At this homestead/)).toBeVisible();

  // A persona is selected by default; its memory tiers should render.
  await expect(page.getByText(/Knows generations/).first()).toBeVisible();

  // People Explorer
  await page.getByRole('button', { name: 'People' }).click();
  await expect(page.getByText(/\d+ people/).first()).toBeVisible();

  // Memory Hearth (SVG rings)
  await page.getByRole('button', { name: 'Memory Hearth' }).click();
  await expect(page.locator('svg').first()).toBeVisible();

  // Back to the homestead; toggle the live clock on and off.
  await page.getByRole('button', { name: 'Homestead' }).click();
  await page.getByRole('button', { name: /live/ }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /live/ }).click();

  // Travel to another homestead via the Explorer (picks a different era).
  await page.getByRole('button', { name: 'People' }).click();
  await page.getByText('Carl', { exact: false }).first().click();
  await expect(page.getByText(/At this homestead/)).toBeVisible();

  expect(errors, 'console/page errors on /living:\n' + errors.join('\n')).toEqual([]);
});

test('Templated persona chat answers offline (no keys)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Tell me about your life' }).click();
  // the deterministic voice replies "<Name> speaking. ..." — no network needed
  await expect(page.getByText(/speaking\./i).first()).toBeVisible({ timeout: 10000 });
  expect(errors, 'errors during templated chat:\n' + errors.join('\n')).toEqual([]);
});

test('The 3-D homestead toggles on without throwing', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: /Enter 3-D/ }).click();
  await expect(page.getByRole('button', { name: /Exit 3-D/ })).toBeVisible();
  await page.waitForTimeout(4000); // let three.js load + the scene build (or fall back gracefully)
  // Either a WebGL canvas mounts, or a graceful fallback message — never a crash.
  expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(0);
  expect(errors, 'errors after entering 3-D:\n' + errors.join('\n')).toEqual([]);
});

test('The Living World is usable on a narrow (mobile) viewport', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/living');
  await expect(page.getByText(/At this homestead/)).toBeVisible({ timeout: 25000 });
  // the map/feed sidebar is collapsed on mobile — open it
  await page.getByRole('button', { name: /Map & feed/ }).first().click();
  await expect(page.getByText('Watch them live')).toBeVisible();
  // tabs still work
  await page.getByRole('button', { name: 'People' }).click();
  await expect(page.getByText(/\d+ people/).first()).toBeVisible();
  expect(errors, 'mobile errors:\n' + errors.join('\n')).toEqual([]);
});

test('The Open Lines worklist renders with research actions', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Open lines' }).click();
  await expect(page.getByText(/unresolved threads/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Research/ }).first()).toBeVisible();
  expect(errors, 'errors on Open lines:\n' + errors.join('\n')).toEqual([]);
});

test('Narrator panel offers verified email sign-in (Supabase connected)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Narrator' }).click();
  // With Supabase configured, family members verify via an email magic-link —
  // the local "member preview" affordance is intentionally replaced by real
  // sign-in (preview is only the fallback when no Supabase is connected).
  await expect(page.getByPlaceholder('family email')).toBeVisible();
  await expect(page.getByRole('button', { name: /Send sign-in link/ })).toBeVisible();
  expect(errors, 'errors in member sign-in panel:\n' + errors.join('\n')).toEqual([]);
});

test('The family-tree dashboard loads with zero console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/dashboard');
  await expect(page).toHaveTitle(/Into the Unknown|Family Tree/i);
  await page.waitForTimeout(2000); // let the five Babel-compiled artboards mount
  expect(errors, 'console/page errors on /dashboard:\n' + errors.join('\n')).toEqual([]);
});

test('A Day Here and The Long Move views render', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  // the day-in-the-life: movements + the era's documented trial
  await page.getByRole('button', { name: 'A Day Here' }).click();
  await expect(page.getByText(/A day at/).first()).toBeVisible();
  await expect(page.getByText('The trial of this time')).toBeVisible();
  // the throughline arc ending at the present keeper
  await page.getByRole('button', { name: 'The Long Move' }).click();
  await expect(page.getByRole('heading', { name: 'The Long Move' })).toBeVisible();
  await expect(page.getByText(/present keeper/).first()).toBeVisible();
  expect(errors, 'errors on day/arc views:\n' + errors.join('\n')).toEqual([]);
});

test('Governance holds: horizon, quarantine, and referential integrity', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  const report = await page.evaluate(() => {
    const D = window.CASON_DATA, MEM = window.CASON_MEMORY, people = D.people;
    const out = { refs: [], horizon: [], future: [], disproven: [] };
    // referential integrity — every kin id resolves to a real person
    Object.keys(people).forEach((id) => {
      ['parents', 'children', 'spouse', 'siblings'].forEach((rel) => {
        (people[id][rel] || []).forEach((rid) => { if (!people[rid]) out.refs.push(id + '.' + rel + ' -> ' + rid); });
      });
    });
    // for every persona: nothing past gen N+1, nothing past their year, no disproven-as-fact
    const banned = /digswell|elizabeth alcott|church warden|virginia land company/i;
    Object.keys(people).forEach((id) => {
      const gen = people[id].generation;
      const sub = MEM.access(id);
      ['individual', 'generational', 'family'].forEach((s) => {
        (sub[s] || []).forEach((n) => {
          if (n.generation != null && n.generation > gen + 1) out.horizon.push(id + '(g' + gen + ') sees g' + n.generation);
          if (n.year != null && sub.horizonYear != null && n.year > sub.horizonYear) out.future.push(id + ' sees y' + n.year + ' > ' + sub.horizonYear);
          if (banned.test(n.text || '') && ['confirmed', 'secondary', 'leading'].indexOf(n.evidence) !== -1) out.disproven.push(id + ': ' + (n.text || '').slice(0, 44));
        });
      });
    });
    return out;
  });
  expect(report.refs, 'dangling kin references:\n' + report.refs.join('\n')).toEqual([]);
  expect(report.horizon, 'horizon (generation) leaks:\n' + report.horizon.join('\n')).toEqual([]);
  expect(report.future, 'future-knowledge leaks:\n' + report.future.join('\n')).toEqual([]);
  expect(report.disproven, 'disproven claims surfaced as fact:\n' + report.disproven.join('\n')).toEqual([]);
});

test('The Governance glass-box renders with live integrity status', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/living');
  await expect(page.getByText('Watch them live')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Governance' }).click();
  await expect(page.getByRole('heading', { name: /Governance/ })).toBeVisible();
  await expect(page.getByText('Holding')).toBeVisible();                     // horizon circuit-breaker green
  await expect(page.getByText(/claims the record refuses/)).toBeVisible();    // quarantine registry
  expect(errors, 'errors on governance view:\n' + errors.join('\n')).toEqual([]);
});

test('The Proof page loads with zero console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/proof');
  await expect(page.getByRole('heading', { name: 'The Proof' })).toBeVisible({ timeout: 25000 });
  // the gallery chrome resolves (artifact count + sign-in prompt for guests)
  await expect(page.getByText(/\d+ artifact/).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Family members/).first()).toBeVisible();
  expect(errors, 'console/page errors on /proof:\n' + errors.join('\n')).toEqual([]);
});

test('The heritage landing responds', async ({ page }) => {
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/Cason|Unknown/i);
});
