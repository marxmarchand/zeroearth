// @ts-check
/* Relief: Prüfung, Klassen, Eis, Größen und was fehlt. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';

const { manifest, graph } = await ladeAdapter('relief');
const roh = JSON.parse(await readFile(`${REPO}/data/relief.json`, 'utf8'));
const eintrag = (/** @type {string} */ id) => /** @type {any} */ (graph.eintraege.find(e => e.id === id));

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Quellen und Schritte: PALEOMAP 109 Karten 0–540 Ma, PaleoMIST 33 Schritte 0–80 ka', async () => {
  const pm = roh.quellen.paleomap.schritte, pmi = roh.quellen.paleomist.schritte;
  assert.equal(pm.length, 109); assert.deepEqual([pm[0].ma, pm.at(-1).ma], [0, 540]);
  assert.equal(pmi.length, 33); assert.deepEqual([pmi[0].ka, pmi.at(-1).ka], [0, 80]);
  for (const e of [...pm, ...pmi]) assert.ok((await stat(`${REPO}/data/${e.datei}`)).size > 1000, e.datei);
});

test('Eis als eigene Klasse ab 100 m, nur PaleoMIST; Packeis und GEBCO fehlen mit Grund', () => {
  assert.equal(roh.klassen.eis, 255);
  assert.equal(roh.quellen.paleomist.eis.ab_dicke_m, 100);
  assert.ok(roh.quellen.paleomap.eis.fehlt);
  for (const k of ['gebco', 'luecke', 'vor_540', 'packeis']) assert.ok(roh.fehlt[k].fehlt && roh.fehlt[k].grund, k);
  assert.ok(eintrag('relief/fehlt/packeis'));
  const e0 = roh.quellen.paleomist.schritte[0].groessen.eisflaeche_km2;
  assert.ok(e0 > 10e6 && e0 < 20e6, `Eisfläche heute ${e0} km²`);
});

test('Größen plausibel: Schelf bei 20 ka kleiner als heute, Höhenstufen summieren zu 1', () => {
  const g = (/** @type {number} */ ka) => roh.quellen.paleomist.schritte.find((/** @type {any} */ e) => e.ka === ka).groessen;
  assert.ok(g(20).schelf_0_200_km2 < g(0).schelf_0_200_km2 / 2);
  assert.ok(g(20).landflaeche_km2 > g(0).landflaeche_km2);
  for (const q of Object.values(roh.quellen)) for (const e of /** @type {any} */ (q).schritte)
    assert.ok(Math.abs(e.groessen.hypsometrie_anteil.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0) - 1) < 0.001);
});

test('Abgeleitete Größen tragen berechnet, die Höhe nicht', () => {
  const p = eintrag('relief/paleomap');
  assert.deepEqual(p.werte.landflaeche.punkte[0].fassungen[0].woher.arten, ['rekonstruktion', 'kuratiert', 'berechnet']);
  assert.deepEqual(p.werte.hoehe.punkte[0].fassungen[0].woher.arten, ['rekonstruktion', 'kuratiert']);
});
