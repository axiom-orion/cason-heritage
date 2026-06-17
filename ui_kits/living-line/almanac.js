/* ============================================================
   The Living Line — Almanac Agent  (window.CASON_ALMANAC)
   ------------------------------------------------------------
   The keeper of days: a full family calendar compiled from the record, so
   the line can be honored on the right day. It draws from TWO sources in
   data.js — the structured `born.year` / `died.year` (year precision), and
   the specific dates written into narratives / notes / sources
   (e.g. "7 July 1635", "12 Nov 1853", "August 21, 1661" — day precision) —
   and classifies each (born / died / married / land / military / estate /
   event). Every event carries its PRECISION (day vs year), so a year-only
   anniversary is never dressed up as an exact date.

   ABILITY: build(deps) -> events[]; then honor(events, now) (today's + this
   month's main-line birthdays & passings), mainLineDates(events) (the roster
   of dates to honor), onDay / inMonth, and stats.

   GOVERNANCE: public-only — living-private dates (tag `living`) are excluded
   from the honor roster and the calendar surface; it reads, never writes.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  const MONTHS = { january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12 };
  const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const NAME_ALT = Object.keys(MONTHS).sort(function (a, b) { return b.length - a.length; }).join('|');
  const RE_DMY = new RegExp('\\b(\\d{1,2})\\s+(' + NAME_ALT + ')\\.?\\s+(\\d{4})\\b', 'gi');     // 7 July 1635
  const RE_MDY = new RegExp('\\b(' + NAME_ALT + ')\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b', 'gi');   // August 21, 1661

  function isLiving(p) { return !!p && (p.tags || []).indexOf('living') !== -1; }
  function classify(s) {
    s = s.toLowerCase();
    if (/buried|burial|died|death|d\.\s|probat|will|administ|inventory|legatee|estate/.test(s)) return 'died';
    if (/born|baptiz|baptism|b\.\s/.test(s)) return 'born';
    if (/marri|wed\b|\bm\.\s|relict|dower/.test(s)) return 'married';
    if (/patent|headright|grant|deed|land|warrant|lottery|acre/.test(s)) return 'land';
    if (/muster|militia|infantry|war\b|service|pension|csa|seminole|regiment|company/.test(s)) return 'military';
    return 'event';
  }
  function extractDates(text) {
    const out = [];
    let m;
    RE_DMY.lastIndex = 0;
    while ((m = RE_DMY.exec(text))) out.push({ day: +m[1], month: MONTHS[m[2].toLowerCase()], year: +m[3], at: m.index });
    RE_MDY.lastIndex = 0;
    while ((m = RE_MDY.exec(text))) out.push({ day: +m[2], month: MONTHS[m[1].toLowerCase()], year: +m[3], at: m.index });
    return out;
  }
  function snippet(text, at) {
    const start = text.lastIndexOf('.', at); const end = text.indexOf('.', at);
    return text.slice(start < 0 ? 0 : start + 1, end < 0 ? text.length : end).replace(/\s+/g, ' ').trim().slice(0, 110);
  }

  function build(deps) {
    deps = deps || {};
    const data = deps.data || root.CASON_DATA || {};
    const people = data.people || {}, ids = Object.keys(people);
    const events = [];
    const seen = {};
    function add(e) {
      const k = e.person + '|' + e.kind + '|' + e.year + '|' + (e.month || 0) + '|' + (e.day || 0);
      if (seen[k]) return; seen[k] = 1; events.push(e);
    }
    ids.forEach(function (id) {
      const p = people[id], living = isLiving(p), direct = !!p.direct, name = p.name || id;
      // structured years (precision: year)
      if (p.born && p.born.year) add({ person: id, name: name, direct: direct, living: living, kind: 'born', year: p.born.year, month: null, day: null, precision: 'year', label: name + ' born ' + p.born.year });
      if (p.died && p.died.year) add({ person: id, name: name, direct: direct, living: living, kind: 'died', year: p.died.year, month: null, day: null, precision: 'year', label: name + ' died ' + p.died.year });
      // specific dates written into the prose (precision: day)
      const blob = [p.narrative, p.notes, p.role, (p.sources || []).join(' . ')].filter(Boolean).join(' . ');
      extractDates(blob).forEach(function (d) {
        if (!d.month || d.day < 1 || d.day > 31) return;
        const snip = snippet(blob, d.at);
        add({ person: id, name: name, direct: direct, living: living, kind: classify(snip), year: d.year, month: d.month, day: d.day, precision: 'day', label: name + ' — ' + snip });
      });
    });
    events.sort(function (a, b) { return (a.month || 13) - (b.month || 13) || (a.day || 32) - (b.day || 32) || a.year - b.year; });
    return events;
  }

  // --- public-facing honor roster (main line, public only) ---
  function mainLineDates(events) {
    return events.filter(function (e) { return e.direct && !e.living && (e.kind === 'born' || e.kind === 'died'); });
  }
  function honor(events, now) {
    now = now || new Date();
    const month = now.getMonth() + 1, day = now.getDate();
    const pub = events.filter(function (e) { return !e.living; });
    const today = pub.filter(function (e) { return e.precision === 'day' && e.month === month && e.day === day; });
    const thisMonth = pub.filter(function (e) { return e.precision === 'day' && e.month === month && e.day !== day && (e.kind === 'born' || e.kind === 'died') && e.direct; });
    return { month: MONTH_NAMES[month], today: today, thisMonth: thisMonth };
  }
  function onDay(events, month, day) { return events.filter(function (e) { return e.precision === 'day' && e.month === month && e.day === day && !e.living; }); }
  function inMonth(events, month) { return events.filter(function (e) { return e.precision === 'day' && e.month === month && !e.living; }); }
  function stats(events) {
    return {
      total: events.length,
      dayPrecise: events.filter(function (e) { return e.precision === 'day'; }).length,
      mainLine: mainLineDates(events).length,
      births: events.filter(function (e) { return e.kind === 'born'; }).length,
      passings: events.filter(function (e) { return e.kind === 'died'; }).length,
    };
  }

  const API = { build: build, extractDates: extractDates, honor: honor, mainLineDates: mainLineDates, onDay: onDay, inMonth: inMonth, stats: stats, MONTH_NAMES: MONTH_NAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_ALMANAC = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
