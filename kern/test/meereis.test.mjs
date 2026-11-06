// @ts-check
/* Meereis: GLOMAP und TraCE-21ka nebeneinander, Februar und August, Kryosphäre in 1.1. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';

const { manifest, graph } = await ladeAdapter('meereis');
const roh = JSON.parse(await readFile(`${REPO}/data/meereis.json`, 'utf8'));
const eintrag = (/** @type {string} */ id) => /** @type {any} */ (graph.eintraege.find(e => e.id === id));

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Kryosphäre in 1.1; MARGO fehlt mit Grund', () => {
  for (const id of ['meereis/flaeche', 'meereis/margo']) {
    assert.equal(eintrag(id).stapel, '1.1'); assert.equal(eintrag(id).sphaere, 'kryosphaere');
  }
  assert.ok(eintrag('meereis/margo').wo.fehlt);
  assert.match(roh.fehlt.margo.grund, /kein Meereis/);
});

test('Regel 13: GLOMAP und TraCE je Februar und August; fehlt eine Quelle, Verstoß', async () => {
  const w = eintrag('meereis/flaeche').werte;
  for (const m of ['februar', 'august']) {
    assert.ok(w[`ausdehnung_glomap_${m}`] && w[`bedeckung_trace_${m}`], m);
    assert.ok((await stat(`${REPO}/data/${roh.quellen.glomap.schritte[m].datei}`)).size > 100);
  }
  for (const js of ['djf', 'jja']) assert.ok((await stat(`${REPO}/data/${roh.quellen.trace.jahreszeiten[js].datei}`)).size > 1000);
  const ohne = structuredClone(graph);
  const wo = /** @type {any} */ (ohne.eintraege.find(e => e.id === 'meereis/flaeche')).werte;
  for (const k of Object.keys(wo)) if (k.includes('_trace_')) delete wo[k];
  assert.ok(pruefe(ohne).fehler.some(f => f.regel === 13));
});

test('Herkunft: GLOMAP rekonstruktion, TraCE modell + berechnet; Zeitachse ab 22 ka je Jahrzehnt, Rest fehlt mit Grund', () => {
  const w = eintrag('meereis/flaeche').werte;
  assert.deepEqual(w.ausdehnung_glomap_februar.punkte[0].fassungen[0].woher.arten, ['rekonstruktion']);
  assert.deepEqual(w.bedeckung_trace_februar.punkte[0].fassungen[0].woher.arten, ['modell', 'berechnet']);
  const s = roh.quellen.trace.jahreszeiten.djf.schritte;
  assert.equal(s.length, roh.quellen.trace.anzahl);
  assert.ok(Math.abs(s[0].ka - 22) < 0.006, `Beginn ${s[0].ka}`);
  const rest = roh.quellen.trace.rest;
  if (rest) {
    // Teildaten: was fehlt, steht mit Grund im Graphen (Regel 8)
    assert.ok(rest.fehlt && rest.grund && rest.von_ka < s.at(-1).ka);
    assert.ok(eintrag('meereis/flaeche').werte.trace_rest.fehlt);
  } else assert.ok(s.at(-1).ka < 0.05);
  assert.ok(!JSON.stringify(graph).includes('idealisiert'), 'TraCE ist kein Referenz- oder Gleichgewichtszustand');
});

test('Flächen plausibel: Februar mehr Nordeis als August, August mehr Südeis', () => {
  const g = roh.quellen.glomap.schritte, d = roh.quellen.trace.jahreszeiten;
  assert.ok(g.februar.flaeche_nord_km2 > g.august.flaeche_nord_km2);
  assert.ok(g.august.flaeche_sued_km2 > g.februar.flaeche_sued_km2);
  assert.ok(d.djf.schritte[0].flaeche_nord_km2 > d.jja.schritte[0].flaeche_nord_km2);
  // heute (Modell, 1980er), Südwinter: rund 15–20 Mio km² beobachtet; nur prüfbar, wenn die Zeitachse bis heute reicht
  if (!roh.quellen.trace.rest) {
    const heute = d.jja.schritte.at(-1).flaeche_sued_km2;
    assert.ok(heute > 8e6 && heute < 30e6, `Süd heute JJA ${heute}`);
  }
});
