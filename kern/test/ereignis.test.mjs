// @ts-check
/* Ereignisse: ein Schnitt durch alle Naturverhältnisse. Stationen tragen
   nur Verweise auf Adapter; jede Natur kommt vor, auch leer. Jede Regel
   wird gezielt verletzt, an einer Kopie der Sintflut. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pruefeEreignis, ladeEreignisse, ladeAdapter } from '../pruefe.mjs';
import { EREIGNIS_NATUREN, UEBERGAENGE, UNTEREBENEN } from '../schema.mjs';

test('Stationen und Übergänge führen dieselben Schlüssel', () => {
  for (const u of Object.keys(UEBERGAENGE)) assert.ok(/** @type {readonly string[]} */ (EREIGNIS_NATUREN).includes(u), u);
  for (const n of EREIGNIS_NATUREN) assert.ok(n === '0' || n in UEBERGAENGE || n in UNTEREBENEN, n);
});

const ereignisse = await ladeEreignisse();
const sintflut = ereignisse.find(e => e.datei === 'sintflut.json')?.inhalt;
const { graph } = await ladeAdapter('sintflut');
const KONTEXT = { adapter: new Set(['sintflut', 'glottolog']), graphen: new Map([['sintflut', graph]]) };
const station = (/** @type {any} */ ev, /** @type {string} */ natur) => ev.stationen.find((/** @type {any} */ s) => s.natur === natur);

test('Sintflut besteht die Prüfung', () => {
  assert.ok(sintflut);
  assert.deepEqual(pruefeEreignis(sintflut, KONTEXT).fehler, []);
});

test('ein Befehl: node kern/pruefe.mjs prüft auch die Ereignisse und endet mit 0', () => {
  const lauf = spawnSync(process.execPath, [fileURLToPath(new URL('../pruefe.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stdout + lauf.stderr);
  assert.match(lauf.stdout, /Ereignis sintflut\.json/);
});

test('Sintflut: Satz, alle neun Naturen, ehrlicher Status', () => {
  assert.match(sintflut.satz, /^Die Sintflut zeigt an einem einzigen Ereignis alle Naturverhältnisse zugleich/);
  assert.deepEqual([...new Set(sintflut.stationen.map((/** @type {any} */ s) => s.natur))].sort(), [...EREIGNIS_NATUREN].sort());
  assert.equal(station(sintflut, '1.1').status, 'vorhanden');
  assert.equal(station(sintflut, 'planetarer_stoffwechsel').status, 'in_arbeit');
  for (const n of ['0', '2.1', '2.3']) assert.equal(station(sintflut, n).status, 'fehlt', n);
  assert.equal(station(sintflut, '1.2').status, 'bewusst_leer');
  assert.ok(station(sintflut, '1.2').begruendung.length > 40);
  assert.equal(sintflut.orte.length, 6);
});

test('Stationen tragen keine Zahlen', () => {
  for (const s of sintflut.stationen) for (const v of Object.values(s))
    assert.ok(typeof v === 'string' || v === null || (Array.isArray(v) && v.every(x => typeof x === 'string')), JSON.stringify(s));
});

/** @type {[string|number, string, (e: any) => void][]} */
const VERSTOESSE = [
  [8, 'eine Natur fehlt als Station', e => { e.stationen = e.stationen.filter((/** @type {any} */ s) => s.natur !== '1.2'); }],
  [8, 'ohne Quelle, aber "vorhanden"', e => { station(e, '2.3').status = 'vorhanden'; }],
  [8, 'ohne Quelle, ohne Begründung', e => { delete station(e, '0').begruendung; }],
  [8, 'bewusst leer ohne Begründung', e => { station(e, '1.2').begruendung = ''; }],
  ['E', 'Station mit Daten', e => { station(e, '1.1').werte = { landflaeche_km2: 610103 }; }],
  ['E', 'Daten statt Quelle', e => { station(e, '1.1').quelle = { land_km2: 610103 }; }],
  ['E', 'Frage als Zahl', e => { station(e, '1.1').frage = 42; }],
  ['E', 'Quelle auf unbekannten Adapter', e => { station(e, '1.1').quelle = 'paleomist_ohne_adapter'; }],
  ['E', 'Verweis unbekannt im Adapter', e => { station(e, '1.1').verweise = ['sintflut/atlantis#landflaeche']; }],
  ['E', 'Quelle, aber Status fehlt', e => { station(e, '1.1').status = 'fehlt'; }],
  ['E', 'Natur unbekannt', e => { station(e, '0').natur = '3.1'; }],
  ['E', 'Status unbekannt', e => { station(e, '0').status = 'vielleicht'; }],
  ['E', 'Station ohne Frage', e => { delete station(e, '0').frage; }],
  ['E', 'quelle nicht angegeben (statt null)', e => { delete station(e, '0').quelle; }],
  ['E', 'Ort verweist auf Unbekanntes', e => { e.orte[0].verweis = 'sintflut:sintflut/atlantis'; }],
  ['E', 'Zeitfenster ohne Skala', e => { e.zeitfenster = { von: 20, bis: 0 }; }],
  ['E', 'Satz fehlt', e => { delete e.satz; }],
  [7, 'Auswahl ohne Begründung', e => { delete e.auswahl_begruendung; }],
  [7, 'Auswahlbegründung leer', e => { e.auswahl_begruendung = ' '; }],
];

for (const [regel, name, verletze] of VERSTOESSE) {
  test(`Ereignis, Regel ${regel}: ${name}`, () => {
    const e = structuredClone(sintflut);
    verletze(e);
    const { fehler } = pruefeEreignis(e, KONTEXT);
    assert.ok(fehler.some(f => String(f.regel) === String(regel)), `erwartet Regel ${regel}, gemeldet: ${JSON.stringify(fehler)}`);
  });
}

test('in Arbeit ohne Begründung: Hinweis, kein Abbruch', () => {
  const e = structuredClone(sintflut);
  delete station(e, 'planetarer_stoffwechsel').begruendung;
  const { fehler, hinweise } = pruefeEreignis(e, KONTEXT);
  assert.deepEqual(fehler, []);
  assert.ok(hinweise.some(h => /in Arbeit ohne Begründung/.test(h.text)));
});
