// @ts-check
/* Planetenansicht: Werte mit Herkunft je Wert, Huygens beobachtet, Gasplaneten ohne Boden, Texturen vorhanden. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';

const { manifest, graph } = await ladeAdapter('planeten');
const roh = JSON.parse(await readFile(`${REPO}/data/planeten.json`, 'utf8'));
const e = (/** @type {string} */ id) => /** @type {any} */ (graph.eintraege.find(x => x.id === `planeten/${id}`));
const fassung = (/** @type {any} */ g) => g.punkte[0].fassungen[0];

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Acht Planeten und Titan, alle in 0.3', () => {
  assert.deepEqual(graph.eintraege.map(x => x.id.split('/')[1]), ['merkur', 'venus', 'erde', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun', 'titan']);
  for (const x of graph.eintraege) assert.equal(x.stapel, '0.3');
});

test('Fact-Sheet-Werte: kuratiert, Messquelle nicht genannt; beobachtet nur mit Sonde je Wert', () => {
  const v = fassung(e('venus').werte.druck);
  assert.deepEqual(v.woher.arten, ['kuratiert']); assert.equal(v.woher.hinweis, 'Messquelle nicht genannt');
  const t = fassung(e('titan').werte.druck);
  assert.deepEqual(t.woher.arten, ['beobachtung']); assert.match(t.woher.quelle, /Huygens/);
  assert.equal(e('titan').werte.druck.punkte[0].bezugszeit.wert, 2005.036);
  assert.match(fassung(e('mars').werte.druck_landeplatz).woher.quelle, /Viking-1/);
  for (const x of graph.eintraege) for (const [k, g] of Object.entries(/** @type {any} */ (x).werte)) {
    if (/** @type {any} */ (g).fehlt) continue;
    const a = fassung(g).woher.arten;
    if (a.includes('beobachtung')) assert.ok(/Huygens|Viking|USGS|NASA|Fulchignoni/.test(fassung(g).woher.quelle), `${x.id}#${k}: beobachtung ohne Sonde`);
  }
  assert.ok(!JSON.stringify(graph).includes('fiktion'));
});

test('Gasplaneten: Bodendruck fehlt mit Grund; Titans N₂ fehlt statt Rest zu 100 %', () => {
  for (const id of ['jupiter', 'saturn', 'uranus', 'neptun']) {
    assert.ok(e(id).werte.druck.fehlt, id); assert.match(e(id).werte.druck.grund, /1-bar/);
  }
  assert.ok(e('titan').werte.anteil_n2.fehlt);
  assert.equal(fassung(e('titan').werte.anteil_ch4).wert, 5.65);
});

test('Titans Schwerkraft aus G·M/r² ≈ 1,35 m/s², Skalenhöhe ≈ 20 km (modell + berechnet)', () => {
  const g = fassung(e('titan').werte.schwerkraft);
  assert.ok(Math.abs(g.wert - 1.354) < 0.01); assert.deepEqual(g.woher.arten, ['kuratiert', 'modell', 'berechnet']);
  assert.ok(Math.abs(fassung(e('titan').werte.skalenhoehe).wert - 20.5) < 1);
});

test('Texturen liegen im Repo, unter 1 MB je Bild; ohne Karte einfarbig mit Setzung', async () => {
  for (const k of roh.koerper) {
    if (k.textur.fehlt) { if (k.id !== 'erde') assert.ok(k.textur.farbe && /Setzung/.test(k.textur.farbe_setzung), k.id); continue; }
    const s = (await stat(`${REPO}/data/${k.textur.datei}`)).size;
    assert.ok(s > 50e3 && s < 1e6, `${k.id}: ${s}`);
  }
  assert.ok(roh.koerper.find((/** @type {any} */ k) => k.id === 'venus').textur.luecke_anteil > 0);
});
