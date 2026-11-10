// @ts-check
/* Gesellschaftlicher Stoffwechsel je Land (Plan Prozess, kern/BERICHT-stofffluss.md). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';
import { iso3VonEurostat } from '../adapter/stofffluss_herkunft.mjs';

const { manifest, graph } = await ladeAdapter('stoffwechsel');
const codes = JSON.parse(await readFile(`${REPO}/data/stofffluss/laendercodes.json`, 'utf8'));
const prozess = (/** @type {string} */ iso3) => /** @type {any} */ (graph.prozesse.find(p => p.id === `stoffwechsel/prozess/${iso3}`));

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Ländercodes: Eurostat EL/UK, ISO-3 über die ILO-Liste; nichts über Namen geraten', () => {
  assert.equal(iso3VonEurostat('EL', codes), 'GRC');
  assert.equal(iso3VonEurostat('DE', codes), 'DEU');
  const a = /** @type {any} */ (graph.auswahl.find(x => x.id === 'stoffwechsel/auswahl/laendercodes'));
  assert.match(a.was, /nicht zuordenbar: .*eurostat:XK/);
});

test('Zuflüsse je Art und Herkunftsstapel; Arbeitszeit aus 1.3, Solar aus 0.3 mit Kette stark, Elektromagnetismus', () => {
  const p = prozess('deu');
  const arten = new Set(p.zufluesse.map((/** @type {any} */ z) => `${z.art}:${z.herkunftsstapel}`));
  for (const a of ['stoff:1.1', 'stoff:1.2', 'energie:1.1', 'energie:1.2', 'energie:0.3', 'zeit:1.3']) assert.ok(arten.has(a), a);
  for (const z of p.zufluesse.filter((/** @type {any} */ z) => z.herkunftsstapel === '0.3')) { assert.equal(z.richtung, 'extern'); assert.deepEqual(z.kette, ['stark', 'elektromagnetismus']); assert.match(z.kette_begruendung, /Setzung von Max/); }
  const zeit = p.zufluesse.filter((/** @type {any} */ z) => z.art === 'zeit');
  assert.ok(zeit.every((/** @type {any} */ z) => z.von.startsWith('ilostat/how_2tot/')), 'nur Gesamtstunden; Stunden je Person bleiben Kennzahl');
  assert.ok(p.zufluesse.filter((/** @type {any} */ z) => z.von.startsWith('faostat/')).every((/** @type {any} */ z) => /nicht addierbar/.test(z.hinweis)));
});

test('Bestände: Formen in einem Stapel, Menge fehlt mit Grund; Fehlendes sichtbar', () => {
  for (const b of /** @type {any[]} */ (graph.bestaende)) { assert.ok(b.menge.fehlt, b.id); assert.equal(b.formen.length, 2); }
  for (const k of ['materialbestand', 'bestandszuwachs', 'abgabe_natur', 'energievorraete', 'partnerlaender', 'jahresstunden'])
    assert.ok(/** @type {any} */ (graph.eintraege.find(e => e.id === `stoffwechsel/fehlt/${k}`)).werte.menge.fehlt, k);
  assert.ok(prozess('bra').bilanz.fehlt, 'ohne Eurostat keine Bilanz, mit Grund');
});

test('Bilanzen: innere Stimmigkeit, nie als unabhängig ausgewiesen; Handel ohne Gegenseite nicht prüfbar', () => {
  const bil = graph.relationen.filter(r => /\/relation\/(bilanz|energiebilanz)\//.test(r.id));
  // Material: jede Reihe hat ein vollständiges Jahr; Energie nur dort, wo kein Posten in jedem Jahr fehlt (Kennzeichen m)
  assert.equal(bil.filter(r => r.id.includes('/relation/bilanz/')).length, 140);
  assert.ok(bil.filter(r => r.id.includes('/relation/energiebilanz/')).length > 100);
  for (const r of /** @type {any[]} */ (bil)) assert.equal(r.bilanz.pruefart, 'innere_stimmigkeit');
  for (const r of /** @type {any[]} */ (graph.relationen.filter(r => /\/relation\/(import|export|energie_imp|energie_exp)\//.test(r.id)))) assert.ok(r.bilanz.zufluss.fehlt);
});

test('Nichts verrechnet: keine Relation summiert FAOSTAT und Eurostat; keine Geldwerte', () => {
  for (const r of /** @type {any[]} */ (graph.relationen)) if (r.bilanz?.aus) assert.ok(![r.bilanz.aus.zufluss, ...r.bilanz.aus.abfluss].some(x => x.startsWith('faostat/') || x.startsWith('ilostat/')));
  assert.ok(!JSON.stringify(graph.relationen).includes('gegenwert'));
});
