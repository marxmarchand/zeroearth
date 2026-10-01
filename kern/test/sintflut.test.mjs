// @ts-check
/* Der Sintflut-Adapter: besteht die Prüfung, übernimmt die Werte
   unverändert und führt Fehlendes als fehlend. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pruefe, pruefeManifest, ladeAdapter, REPO } from '../pruefe.mjs';
import { transform, vergleicheIdeale } from '../adapter/sintflut/transform.mjs';
import { istFehlend } from '../schema.mjs';

const { manifest, graph } = await ladeAdapter('sintflut');
const roh = JSON.parse(await readFile(`${REPO}/data/sintflut.json`, 'utf8'));
const eisDaten = JSON.parse(await readFile(`${REPO}/data/paleomist_eis.json`, 'utf8'));
const eintrag = (/** @type {string} */ id) => /** @type {any} */ (graph.eintraege.find(e => e.id === id));

test('Manifest und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('ein Befehl: node kern/pruefe.mjs endet mit 0', () => {
  const lauf = spawnSync(process.execPath, [fileURLToPath(new URL('../pruefe.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stdout + lauf.stderr);
});

test('Werte werden unverändert übernommen, nichts interpoliert', () => {
  for (const [k, o] of Object.entries(roh.orte)) {
    const e = eintrag(`sintflut/${k}`);
    for (const [feld, quelle] of [['landflaeche', 'land_km2'], ['meeresspiegel', 'meeresspiegel_m'], ['land_anteil', 'land_anteil']]) {
      const punkte = e.werte[feld].punkte;
      assert.equal(punkte.length, 33);
      assert.deepEqual(punkte.map((/** @type {any} */ p) => p.fassungen[0].wert), o.reihe.map((/** @type {any} */ r) => r[quelle]));
      assert.deepEqual(punkte.map((/** @type {any} */ p) => p.bezugszeit.wert), o.reihe.map((/** @type {any} */ r) => r.ka_bp === 0 ? 0 : r.ka_bp));
    }
  }
});

test('Wissensstand ist fehlend, nicht erfunden', () => {
  assert.ok(istFehlend(eintrag('sintflut/doggerland').werte.landflaeche.punkte[0].fassungen[0].wissensstand));
});

test('Herkunft: Menge mit Archivkette ab zeroearth', () => {
  const w = eintrag('sintflut/doggerland').werte.meeresspiegel.punkte[0].fassungen[0].woher;
  assert.deepEqual(w.arten, ['rekonstruktion']);
  assert.equal(w.archivkette[0].art, 'zeroearth');
});

test('Bestand Wasser: Formen Eis und Ozean, Bilanz je Ideal geschlossen, als innere Stimmigkeit', () => {
  const [wasser] = graph.bestaende;
  assert.equal(wasser.erhaltung, 'erhalten');
  assert.deepEqual(wasser.formen.map(f => f.id), ['eis', 'ozean']);
  assert.deepEqual(graph.relationen.map(r => r.id), ['sintflut/relation/eis-ozean/referenz', 'sintflut/relation/eis-ozean/a1']);
  for (const r of graph.relationen) {
    const b = /** @type {any} */ (r.bilanz);
    assert.equal(r.art, 'stoffwechsel');
    assert.equal(r.bestand, wasser.id);
    assert.equal(b.pruefart, 'innere_stimmigkeit');
    assert.ok(b.zufluss > 4e19 && b.zufluss < 4.5e19, `Eisverlust ${b.zufluss} kg`);
    assert.ok(Math.abs(b.zufluss - b.abfluss[0]) <= b.toleranz);
    assert.equal(b.toleranz, manifest.bilanz.toleranz_anteil * b.zufluss);
    assert.deepEqual(r.bezugszeit, { skala: 'ka BP', von: 20, bis: 0 });
  }
  const { hinweise } = pruefe(graph);
  assert.equal(hinweise.filter(h => h.regel === 5 && /Bilanz geschlossen, innere Stimmigkeit/.test(h.text)).length, 2);
  assert.ok(manifest.bilanz.toleranz_begruendung && manifest.bilanz.warum_nur_innere_stimmigkeit);
});

test('Eis und Ozean: Volumen aus den 1°-Dateien unverändert, je Ideal mit woher.ideal', () => {
  for (const [e, feld] of [['sintflut/eis', 'eis_volumen_m3'], ['sintflut/ozean', 'ozean_volumen_m3']]) {
    for (const k of ['referenz', 'a1']) {
      const g = eintrag(e).werte[`volumen_${k}`];
      assert.deepEqual(g.punkte.map((/** @type {any} */ p) => p.fassungen[0].wert), eisDaten.ideale[k][feld]);
      assert.ok(g.punkte.every((/** @type {any} */ p) => p.fassungen[0].woher.ideal === `sintflut/ideal/${k}`));
    }
  }
});

test('ohne Eisdaten bleibt die Bilanz fehlend, nicht erfunden', () => {
  const g = transform(roh, manifest);
  const [r] = g.relationen;
  assert.ok(istFehlend(r.bilanz?.zufluss));
  assert.ok(pruefe(g).hinweise.some(h => h.regel === 5 && /nicht prüfbar/.test(h.text)));
  assert.deepEqual(pruefe(g).fehler, []);
});

test('Regel 13: Referenz und a1 als zwei Ideale; fehlt eines, bricht die Prüfung ab', () => {
  assert.deepEqual(/** @type {any} */ (graph).ideale.map((/** @type {any} */ i) => i.id), ['sintflut/ideal/referenz', 'sintflut/ideal/a1']);
  const ohne = structuredClone(graph);
  delete /** @type {any} */ (ohne.eintraege.find(e => e.id === 'sintflut/eis')).werte.volumen_a1;
  assert.ok(pruefe(ohne).fehler.some(f => f.regel === 13));
});

test('Vergleich der Ideale: verschieden nur im MIS 3, Fenster fallen in der Transgression zusammen', () => {
  const v = vergleicheIdeale(eisDaten, manifest, roh.orte);
  assert.deepEqual([v.unterschied?.von_ka, v.unterschied?.bis_ka], [55, 37.5]);
  const max = Math.abs(v.unterschied?.groesste.differenz_m_sle);
  assert.ok(max > 9 && max < 12, `größte Differenz ${max} m SLE`);
  assert.deepEqual([v.fenster_verschieden?.von_ka, v.fenster_verschieden?.bis_ka], [52.5, 37.5]);
  for (const f of Object.values(v.fenster))
    assert.ok(f.verschieden_ka.every((/** @type {number} */ ka) => ka > 35), 'nach 35 ka nur Zellkippen');
  // Das Zusammenfallen bleibt im Graphen stehen: Nullen werden nicht weggelassen
  const d = eintrag('sintflut/ideale/vergleich').werte.land_differenz_doggerland.punkte;
  assert.equal(d.length, 33);
  assert.equal(d.at(-1).fassungen[0].wert, 0);
  assert.ok(d.filter((/** @type {any} */ p) => p.fassungen[0].wert === 0).length > 20);
});

test('Bezugsjahr 1950 CE aus der Zeitachse der Quelle', () => {
  assert.equal(manifest.zeitsemantik.bezugsjahr.wert, '1950 CE');
  assert.match(eisDaten.woher.zeitachse, /since 1950/);
});

test('Küstenlinie: Spur der Form Ozean, abgeleitet, mit Pflichthinweis, ohne erfundene Koordinaten', () => {
  const k = eintrag('sintflut/doggerland/kueste');
  assert.equal(k.wo.geometrie, 'grenze');
  assert.deepEqual(k.spur_von, { bestand: 'sintflut/wasser', form: 'ozean' });
  assert.match(k.wo.hinweis, /^paleo_topography enthält isostatische Deformation \(laut Datei\)/);
  assert.deepEqual(k.wo.woher.abgeleitet_aus, ['sintflut/feld/paleo_topography#raster']);
  assert.deepEqual(k.wo.woher.arten, ['rekonstruktion']);
  assert.ok(istFehlend(k.wo.koordinaten));
});

test('Notizen: 2. Natur, am Fenster, gesellschaftliches Archiv, Formation fehlend mit Begründung', () => {
  for (const [k, o] of Object.entries(roh.orte)) {
    const n = eintrag(`sintflut/${k}/notiz`);
    assert.equal(n.stapel, '2');
    assert.equal('wo' in n, false);
    assert.deepEqual(n.haengt_an, [`sintflut/${k}`]);
    assert.ok(istFehlend(n.formation) && n.formation.grund);
    const f = n.werte.text.punkte[0].fassungen[0];
    assert.equal(f.wert, o.notiz);
    assert.equal(f.woher.archivkette[1].art, 'gesellschaftlich');
  }
  assert.equal(eintrag('sintflut/sahulschelf/notiz').werte.text.punkte[0].fassungen[0].woher.archivkette[1].archiv,
    'Nunn & Reid 2016 (in der Notiz genannt)');
});

test('abweichende Kennwerte der Quelle brechen den Adapter ab', () => {
  const kaputt = structuredClone(roh);
  kaputt.orte.doggerland.verlust_km2 += 1;
  assert.throws(() => transform(kaputt, manifest), /verlust_km2/);
});
