// @ts-check
/* Takte der Zeitleiste: als Daten, mit Quelle; die Seite liest dieselbe Datei. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruefeTakte, REPO } from '../pruefe.mjs';

const T = JSON.parse(await readFile(`${REPO}/kern/takte.json`, 'utf8'));

test('Takte bestehen die Prüfung', () => { assert.deepEqual(pruefeTakte(T).fehler, []); });

test('data/takte.json ist eine Kopie von kern/takte.json (die Seite liest data/)', async () => {
  assert.deepEqual(JSON.parse(await readFile(`${REPO}/data/takte.json`, 'utf8')), T);
});

test('Zeilen von außen nach innen: Umlauf, Ma, Milanković, ka, Jahr', () => {
  assert.deepEqual(T.takte.map((/** @type {any} */ t) => t.id), ['galaktisch', 'ma', 'milankovic', 'schiefe', 'praezession', 'ka', 'jahr']);
  for (const id of ['schiefe', 'praezession']) {
    const t = T.takte.find((/** @type {any} */ x) => x.id === id);
    assert.equal(t.neben, 'milankovic'); assert.match(t.quelle, /Hays/); assert.ok(t.phase.fehlt);
  }
  assert.equal(T.takte[0].periode.wert, 230);
  assert.equal(T.takte[0].setzung, true);
});

test('Was nicht belegt ist, steht als fehlend mit Grund', () => {
  assert.ok(T.fehlend.some((/** @type {any} */ f) => f.id === 'exzentrizitaet_405' && f.periode.fehlt));
});

/** @type {[string, (t: any) => void][]} */
const VERSTOESSE = [
  ['Takt ohne Quelle', t => { delete t.takte[0].quelle; }],
  ['Periode ohne Einheit', t => { delete t.takte[0].periode.einheit; }],
  ['ohne Spannweite', t => { delete t.takte[0].spannweite; }],
  ['Zählung mit Periode', t => { t.takte[1].periode = { wert: 1, einheit: 'Ma' }; }],
  ['art unbekannt', t => { t.takte[0].art = 'puls'; }],
  ['fehlender Takt ohne Grund', t => { delete t.fehlend[0].periode.grund; }],
];
for (const [name, verletze] of VERSTOESSE) test(`Takte: ${name}`, () => {
  const t = structuredClone(T); verletze(t);
  assert.ok(pruefeTakte(t).fehler.length > 0, name);
});
