/* Selftest for media-store.js — validation, indexing, and the store CRUD
   (in-memory backend under Node). Run: node ui_kits/archive/media-store.selftest.js */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
var M = require('./media-store.js');

var data = global.CASON_DATA;
var fails = 0;
function ok(cond, msg) { if (!cond) { console.error('  FAIL: ' + msg); fails++; } }

// backend falls back to memory under node
ok(M.backendKind() === 'memory', 'uses in-memory backend under node, got ' + M.backendKind());

// validation
ok(!M.validateMeta({}).ok, 'empty meta is invalid');
ok(M.validateMeta({ title: 'X', kind: 'photo' }).ok, 'title + valid kind is valid');
ok(!M.validateMeta({ title: 'X', kind: 'nope' }).ok, 'unknown category is invalid');
ok(!M.validateMeta({ title: 'X', kind: 'photo', personId: 'nobody' }, data.people).ok, 'unknown personId is invalid');
ok(M.validateMeta({ title: 'X', kind: 'deed', personId: 'thadeous' }, data.people).ok, 'real personId is valid');
ok(!M.validateMeta({ title: 'X', kind: 'photo', size: M.MAX_BYTES + 1 }).ok, 'oversize file is invalid');
ok(!M.validateMeta({ title: 'X', kind: 'photo', date: 'March' }).ok, 'bad date rejected');
ok(M.validateMeta({ title: 'X', kind: 'photo', date: '1945-12-17' }).ok, 'YYYY-MM-DD date accepted');

function run() {
  return M.clear()
    .then(function () { return M.add({ title: 'Thad probate p.1', kind: 'will', personId: 'thadeous', date: '1945', size: 1000 }, 'data:img/png;base64,AAAA', data.people); })
    .then(function (it) {
      ok(it.id && it.kind === 'will' && it.personId === 'thadeous', 'add returns a normalized item');
      ok(it.dataUrl === 'data:img/png;base64,AAAA', 'item carries its data URL');
      return M.add({ title: 'Carl portrait', kind: 'portrait', personId: 'carl-columbus', size: 2000 }, 'data:img/png;base64,BBBB', data.people);
    })
    .then(function () { return M.add({ title: 'Newnansville map', kind: 'document', size: 500 }, 'data:img/png;base64,CCCC', data.people); })
    .then(function () { return M.all(); })
    .then(function (items) {
      ok(items.length === 3, 'stored three items, got ' + items.length);
      var idx = M.index(items, data);
      ok(idx.count === 3, 'index counts 3');
      ok(idx.byKind.will === 1 && idx.byKind.portrait === 1 && idx.byKind.document === 1, 'byKind tallies categories');
      ok(idx.peopleWithMedia === 2, 'two people have media attached, got ' + idx.peopleWithMedia);
      ok(idx.byGeneration[9] === 1 && idx.byGeneration[10] === 1, 'byGeneration joins the record (Thad g9, Carl g10)');
      ok(idx.totalBytes === 3500, 'totalBytes sums sizes, got ' + idx.totalBytes);
      // export / import round-trip
      return M.exportAll();
    })
    .then(function (dump) {
      ok(dump.app === 'cason-archive' && dump.items.length === 3, 'export has all items');
      return M.clear().then(function () { return M.all(); }).then(function (empty) {
        ok(empty.length === 0, 'cleared');
        return M.importAll(dump);
      });
    })
    .then(function (n) {
      ok(n === 3, 'import restored 3');
      return M.all();
    })
    .then(function (items) {
      ok(items.length === 3, 'round-trip preserved items');
      console.log('categories:', M.CAT_KEYS.length, '| items after round-trip:', items.length, '| backend:', M.backendKind());
      if (fails) { console.error('media-store selftest FAILED (' + fails + ')'); process.exit(1); }
      console.log('media-store selftest OK');
    })
    .catch(function (e) { console.error('  FAIL (threw):', e && e.message); process.exit(1); });
}
run();
