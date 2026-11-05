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
  const zahlfrei = (/** @type {any} */ v) => typeof v !== 'number' && (typeof v !== 'object' || v === null || Object.values(v).every(zahlfrei));
  for (const s of sintflut.stationen) assert.ok(zahlfrei(s), JSON.stringify(s));
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
  [16, 'Zeitfenster ohne Bezugssystem', e => { delete e.zeitfenster.bezugssystem; }],
  [16, 'Zeitfenster ohne Unschärfe', e => { delete e.zeitfenster.unschaerfe; }],
  ['E', 'Zeitfenster fehlend', e => { e.zeitfenster = { fehlt: true, grund: 'x' }; }],
  ['E', 'Brüche fehlen als Feld', e => { delete e.brueche; }],
  [8, 'Brüche fehlend ohne Grund', e => { e.brueche = { fehlt: true }; }],
  ['E', 'Brüche als leere Liste', e => { e.brueche = []; }],
  ['E', 'vorgemerkt ohne Lizenz', e => { delete e.stationen[0].vorgemerkt.lizenz; }],
  ['E', 'vorgemerkt mit unbekannter Art', e => { e.stationen[0].vorgemerkt.arten = ['gerechnet']; }],
  ['E', 'vorgemerkt neben einer Quelle', e => { e.stationen[0].quelle = 'sintflut'; e.stationen[0].status = 'in_arbeit'; }],
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

const haus = ereignisse.find(e => e.datei === 'haus.json')?.inhalt;

test('Haus besteht die Prüfung: Kette, Status ehrlich, Zeit und Ort bewusst leer', () => {
  assert.ok(haus);
  assert.deepEqual(pruefeEreignis(haus, KONTEXT).fehler, []);
  assert.ok(haus.stationen.every((/** @type {any} */ s) => s.quelle === null));
  for (const n of ['1.1', '1.2', '1.3', '2.1', 'gesellschaftlicher_stoffwechsel']) assert.equal(station(haus, n).status, 'fehlt', n);
  for (const n of ['0', 'planetarer_stoffwechsel', '2.3']) assert.equal(station(haus, n).status, 'bewusst_leer', n);
  assert.deepEqual(haus.stationen.slice(0, 6).map((/** @type {any} */ s) => s.kette.knoten),
    ['stoff', 'bedeutung', 'parzelle', 'eigentum', 'hypothek', 'preis']);
  const hypothek = haus.stationen[4].kette, preis = haus.stationen[5].kette;
  assert.equal(haus.stationen[4].natur, '2.2');
  assert.equal(hypothek.haengt_an[0].vorgang, 'einschliessen_realisieren');
  assert.deepEqual(hypothek.herkunft_spaeter, ['erwartung']);
  assert.equal(preis.haengt_an[0].vorgang, 'konversion');
  assert.ok(hypothek.vorschlag && preis.vorschlag);
  assert.equal(haus.zeitfenster.grund, 'Schema, kein Einzelfall');
  assert.equal(haus.orte.grund, 'Schema, kein Einzelfall');
});

test('Haus trägt keine Zahlen und keine Werte', () => {
  const zahlfrei = (/** @type {any} */ v) => typeof v !== 'number' && (typeof v !== 'object' || v === null || Object.values(v).every(zahlfrei));
  assert.ok(zahlfrei(haus));
});

test('Zeit und Ort bewusst leer: unzulässig, sobald eine Station eine Quelle hat', () => {
  const e = structuredClone(haus);
  e.stationen[0].quelle = 'sintflut'; e.stationen[0].status = 'in_arbeit';
  assert.ok(pruefeEreignis(e, KONTEXT).fehler.some(f => f.regel === 8 && /zeitfenster bewusst leer/.test(f.text)));
  assert.ok(pruefeEreignis(e, KONTEXT).fehler.some(f => f.regel === 8 && /orte bewusst leer/.test(f.text)));
  const s = structuredClone(sintflut);
  s.zeitfenster = { bewusst_leer: true, grund: 'x' };
  assert.ok(pruefeEreignis(s, KONTEXT).fehler.some(f => f.regel === 8));
  const g = structuredClone(haus);
  delete g.zeitfenster.grund;
  assert.ok(pruefeEreignis(g, KONTEXT).fehler.some(f => f.regel === 8));
});

/** @type {[string, (e: any) => void][]} */
const TOUR_VERSTOESSE = [
  ['Station ohne zeigt', e => { delete e.stationen[0].zeigt; }],
  ['Ansicht unbekannt', e => { e.stationen[0].zeigt.ansicht = 'tunnel'; }],
  ['Ebenen keine Liste', e => { e.stationen[0].zeigt.ebenen = 'x'; }],
  ['Kette an unbekanntem Knoten', e => { e.stationen[1].kette.haengt_an[0].knoten = 'nirgends'; }],
  ['Kette mit unbekanntem Vorgang', e => { e.stationen[1].kette.haengt_an[0].vorgang = 'gehoert'; }],
  ['Kette mit unbekannter Form', e => { e.stationen[1].kette.form = 'stern'; }],
  ['Kette ohne Name', e => { delete e.stationen[1].kette.name; }],
  ['herkunft_spaeter unbekannt', e => { e.stationen[4].kette.herkunft_spaeter = ['geraten']; }],
];
for (const [name, verletze] of TOUR_VERSTOESSE) {
  test(`Tourfelder: ${name}`, () => {
    const e = structuredClone(haus);
    verletze(e);
    assert.ok(pruefeEreignis(e, KONTEXT).fehler.some(f => f.regel === 'E'), name);
  });
}

test('Sintflut: Ort in zeigt, den das Ereignis nicht führt, ist ein Verstoß', () => {
  const e = structuredClone(sintflut);
  station(e, '2.1').zeigt.orte = ['sintflut:sintflut/atlantis'];
  assert.ok(pruefeEreignis(e, KONTEXT).fehler.some(f => /nicht führt/.test(f.text)));
});

test('data/ereignisse.json führt genau die Dateien in kern/ereignisse/', async () => {
  const { readFile } = await import('node:fs/promises');
  const liste = JSON.parse(await readFile(fileURLToPath(new URL('../../data/ereignisse.json', import.meta.url)), 'utf8'));
  assert.deepEqual([...liste.ereignisse].sort(), ereignisse.map(e => e.datei.replace(/\.json$/, '')).sort());
});

test('Der Transform läuft ohne node: im Modulkopf (die Tour lädt ihn im Browser)', async () => {
  const { readFile } = await import('node:fs/promises');
  const text = await readFile(fileURLToPath(new URL('../adapter/sintflut/transform.mjs', import.meta.url)), 'utf8');
  assert.equal(/^import .*node:/m.test(text), false);
});

test('in Arbeit ohne Begründung: Hinweis, kein Abbruch', () => {
  const e = structuredClone(sintflut);
  delete station(e, 'planetarer_stoffwechsel').begruendung;
  const { fehler, hinweise } = pruefeEreignis(e, KONTEXT);
  assert.deepEqual(fehler, []);
  assert.ok(hinweise.some(h => /in Arbeit ohne Begründung/.test(h.text)));
});
