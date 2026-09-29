// @ts-check
/* Der Sintflut-Adapter: besteht die Prüfung, übernimmt die Werte
   unverändert und führt Fehlendes als fehlend. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pruefe, pruefeManifest, ladeAdapter, REPO } from '../pruefe.mjs';
import { transform } from '../adapter/sintflut/transform.mjs';
import { istFehlend } from '../schema.mjs';

const { manifest, graph } = await ladeAdapter('sintflut');
const roh = JSON.parse(await readFile(`${REPO}/data/sintflut.json`, 'utf8'));
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

test('Bestand Wasser: Formen Eis und Ozean, erhalten, Bilanz nicht prüfbar', () => {
  const [wasser] = graph.bestaende;
  assert.equal(wasser.erhalten, true);
  assert.deepEqual(wasser.formen.map(f => f.id), ['eis', 'ozean']);
  const [r] = graph.relationen;
  assert.equal(r.art, 'stoffwechsel');
  assert.equal(r.bestand, wasser.id);
  assert.ok(istFehlend(r.bilanz?.zufluss));
  assert.match(/** @type {any} */ (r.bilanz?.zufluss).grund, /Eisdicke/);
  const { hinweise } = pruefe(graph);
  assert.ok(hinweise.some(h => h.regel === 5 && /nicht prüfbar/.test(h.text)));
});

test('Küstenlinie: Spur der Form Ozean, abgeleitet, mit Pflichthinweis, ohne erfundene Koordinaten', () => {
  const k = eintrag('sintflut/doggerland/kueste');
  assert.equal(k.wo.geometrie, 'grenze');
  assert.deepEqual(k.spur_von, { bestand: 'sintflut/wasser', form: 'ozean' });
  assert.equal(k.wo.hinweis, 'heutige Bathymetrie, ohne Isostasie und Sedimentation');
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
