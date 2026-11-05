// @ts-check
/* Der Glottolog-Adapter: Sprachen in 2.2 mit Verweis auf 2.3, Träger in
   1.3 als Näherung, Gefährdung als Überlieferung mit den AES-Stufen,
   "Quelle fehlt" als eigene Kategorie, keine Statuskommentare. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';
import { transform, kategorie, zusammenfassung, QUELLE_FEHLT } from '../adapter/glottolog/transform.mjs';
import { istFehlend, MODI } from '../schema.mjs';

const { manifest, graph } = await ladeAdapter('glottolog');
const roh = JSON.parse(await readFile(`${REPO}/data/glottolog.json`, 'utf8'));
const E = new Map(graph.eintraege.map(e => [e.id, /** @type {any} */ (e)]));
const R = new Map(graph.relationen.map(r => [r.id, /** @type {any} */ (r)]));

test('Manifest und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Sprache in 2.2 ohne wo, hängt an der Sprachgemeinschaft (1.3), verweist auf 2.3', () => {
  const s = E.get('glottolog/stan1295');   // Standard German
  assert.equal(s.stapel, '2.2');
  assert.equal('wo' in s, false);
  assert.deepEqual(s.haengt_an, ['glottolog/stan1295/gemeinschaft']);
  assert.deepEqual(s.verweist_auf, ['glottolog/zeichensystem']);
  assert.equal(E.get('glottolog/zeichensystem').stapel, '2.3');
  assert.ok(istFehlend(s.formation) && s.formation.grund);
  assert.equal(E.get('glottolog/stan1295/gemeinschaft').stapel, '1.3');
});

test('Punkt als Näherung des Sprachgebiets, Flächenverzerrung fehlend', () => {
  const g = E.get('glottolog/stan1295/gemeinschaft');
  assert.equal(g.wo.geometrie, 'punkt');
  assert.equal(g.wo.naeherung.vertritt, 'flaeche');
  assert.ok(istFehlend(g.wo.verzerrung.flaeche));
  const ohne = roh.sprachen.filter((/** @type {any} */ s) => !s.p);
  assert.ok(ohne.length > 0);
  assert.ok(istFehlend(E.get(`glottolog/${ohne[0].g}/gemeinschaft`).wo));
});

test('Gefährdung: Überlieferung mit den sechs AES-Stufen als Modus, ohne Bezugszeit', () => {
  for (const s of roh.sprachen.filter((/** @type {any} */ x) => x.a !== null).slice(0, 500)) {
    const r = R.get(`glottolog/${s.g}/ueberlieferung`);
    assert.equal(r.art, 'ueberlieferung');
    assert.equal(r.modus, MODI.ueberlieferung[s.a - 1]);
    assert.ok(istFehlend(r.bezugszeit));
  }
});

test('Quelle fehlt: eigene Kategorie, beleg und drittes Archivglied fehlend, kein Wissensstand erfunden', () => {
  const ohne = roh.sprachen.filter((/** @type {any} */ s) => s.a !== null && !s.q);
  assert.ok(ohne.length > 500);
  const z = zusammenfassung(graph);
  assert.equal(z[QUELLE_FEHLT], ohne.length);
  for (const s of ohne.slice(0, 50)) {
    const r = R.get(`glottolog/${s.g}/ueberlieferung`);
    assert.equal(kategorie(r), QUELLE_FEHLT);
    assert.ok(istFehlend(r.beleg) && istFehlend(r.woher.archivkette[2]) && istFehlend(r.wissensstand));
  }
  // belegte Stufen zählen ohne die Fälle ohne Quelle
  const belegt = roh.sprachen.filter((/** @type {any} */ s) => s.a === 1 && s.q).length;
  assert.equal(z.nicht_gefaehrdet, belegt);
});

test('Ohne Status: nicht erhoben, keine Relation', () => {
  const ohne = roh.sprachen.filter((/** @type {any} */ s) => s.a === null);
  assert.equal(zusammenfassung(graph).nicht_erhoben, ohne.length);
  const s = E.get(`glottolog/${ohne[0].g}`);
  assert.match(s.werte.gefaehrdung.grund, /nicht erhoben/);
  assert.equal(R.has(`glottolog/${ohne[0].g}/ueberlieferung`), false);
});

test('ElCat-Sicherheit als Konfidenz der Quelle, Text in ElCats Stufen, keine Zahl', () => {
  const mit = graph.relationen.filter(r => /** @type {any} */ (r).woher.konfidenz);
  assert.ok(mit.length > 2000);
  for (const r of mit) {
    const k = /** @type {any} */ (r).woher.konfidenz;
    assert.match(k.stufe, /^(20|40|60|80|100) percent certain$/);
    assert.equal(typeof k.stufe, 'string');
    assert.equal('wahrscheinlichkeit' in r, false);
    assert.ok(!/** @type {any} */ (r).woher.arten.includes('erwartung'));
    assert.match(/** @type {any} */ (r).beleg[0], /ElCat/);
  }
});

test('keine Statuskommentare in den Daten', () => {
  const text = JSON.stringify(roh);
  assert.doesNotMatch(text, /percent certain, based on the evidence/);
  assert.doesNotMatch(text, /\) = \d+ \(/);
  for (const s of roh.sprachen.slice(0, 200)) assert.deepEqual(Object.keys(s).sort(), ['a', 'c', 'f', 'g', 'k', 'n', 'p', 'q']);
});

test('Auswahl: Ausschlüsse im Manifest und im Graphen ausgewiesen (Regel 7)', () => {
  for (const k of ['Artificial_Language', 'Bookkeeping', 'Unclassifiable', 'Unattested', 'Speech_Register'])
    assert.ok(manifest.ausgeschlossen.kategorien[k] > 0, k);
  const a = graph.auswahl.find(x => x.id === 'glottolog/auswahl/kategorien');
  assert.match(/** @type {any} */ (a).was, /ausgeschlossen: .*Artificial_Language/);
  assert.ok(roh.sprachen.every((/** @type {any} */ s) => ['Spoken_L1_Language', 'Sign_Language', 'Pidgin', 'Mixed_Language'].includes(s.k)));
});

test('Größe unter 5 MB', async () => {
  const { stat } = await import('node:fs/promises');
  assert.ok((await stat(`${REPO}/data/glottolog.json`)).size < 5e6);
});

test('Adapter läuft ohne Node-Importe auf oberster Ebene (für den Browser)', async () => {
  const quelle = await readFile(new URL('../adapter/glottolog/transform.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(quelle.split('\n').filter(z => z.startsWith('import ')).join('\n'), /node:/);
  assert.equal(typeof transform, 'function');
});
