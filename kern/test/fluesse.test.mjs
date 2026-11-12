// @ts-check
/* Flussnetz aus SWORD v17c (kern/BERICHT-hydrosphaere.md, B12): Auswahl nach Einzugsfläche,
   Dämme gezeigt, Geister in den Daten aber nicht gezeichnet, Größen je Stufe, fehlende
   Kontinente mit Grund (Regel 8). Prüft die Dateien unter data/fluesse gegen den Index. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';
import { transform } from '../adapter/fluesse/transform.mjs';

const { manifest, graph } = await ladeAdapter('fluesse');
const roh = JSON.parse(await readFile(`${REPO}/data/fluesse.json`, 'utf8'));
const eintrag = (/** @type {string} */ id) => /** @type {any} */ (graph.eintraege.find(e => e.id === id));
const wert = (/** @type {any} */ g) => g.punkte[0].fassungen[0].wert;
const dateien = new Map();
for (const [k, K] of Object.entries(roh.kontinente)) for (const s of roh.stufen)
  dateien.set(`${k}_${s.stufe}`, JSON.parse(await readFile(`${REPO}/data/${/** @type {any} */ (K).stufen[s.stufe].datei}`, 'utf8')));

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Auswahl nach Einzugsfläche: jede Linie über der Schwelle, Schwellen fallen je Stufe', () => {
  const min = roh.stufen.map((/** @type {any} */ s) => s.facc_total_min_km2);
  assert.deepEqual(min, [100000, 10000, 1000]);
  assert.equal(roh.auswahl.kriterium, 'facc_total');
  for (const [k, K] of Object.entries(roh.kontinente)) for (const s of roh.stufen) {
    const fc = dateien.get(`${k}_${s.stufe}`), st = /** @type {any} */ (K).stufen[s.stufe];
    assert.ok(fc.features.every((/** @type {any} */ f) => f.properties.a >= s.facc_total_min_km2 - 0.5), `${k} ${s.stufe}`);
    assert.equal(fc.features.length, st.gezeigt.anzahl + st.geist.anzahl, `${k} ${s.stufe}: Datei gegen Index`);
    assert.ok(st.abbrueche_stromab.anzahl <= 5, `${k} ${s.stufe}: ${st.abbrueche_stromab.anzahl} Abbrüche`);
  }
});

test('Nichts verloren: gezeigt + Geister + unter der Schwelle = alle Abschnitte der Quelle', () => {
  for (const K of Object.values(roh.kontinente)) for (const s of roh.stufen) {
    const st = /** @type {any} */ (K).stufen[s.stufe];
    assert.equal(st.gezeigt.anzahl + st.geist.anzahl + st.unter_schwelle.anzahl, /** @type {any} */ (K).gesamt.abschnitte.anzahl);
  }
  const kaputt = structuredClone(roh); kaputt.kontinente.eu.stufen.globus.unter_schwelle.anzahl -= 1;
  assert.throws(() => transform(kaputt, manifest), /Abschnitte gezählt/);
});

test('Dämme gezeigt, Geister in den Daten mit Typ, gezählt in Graph und Index', () => {
  for (const [k, K] of Object.entries(roh.kontinente)) for (const s of roh.stufen) {
    const fc = dateien.get(`${k}_${s.stufe}`), st = /** @type {any} */ (K).stufen[s.stufe];
    const typ = (/** @type {string} */ t) => fc.features.filter((/** @type {any} */ f) => f.properties.typ === t).length;
    assert.equal(typ('geist'), st.geist.anzahl);
    assert.equal(typ('damm'), st.damm.anzahl);
    const e = eintrag(`fluesse/${k}`).werte;
    assert.equal(wert(e[`geister_${s.stufe}`]), st.geist.anzahl);
    assert.equal(wert(e[`geister_laenge_${s.stufe}`]), st.geist.laenge_km);
    assert.equal(wert(e[`daemme_${s.stufe}`]), st.damm.anzahl);
  }
});

test('Größen: jede Datei unter 100 MB, Globus unter 2 MB; Längenverzerrung als Zahl (Regel 10)', async () => {
  for (const K of Object.values(roh.kontinente)) for (const s of roh.stufen) {
    const st = /** @type {any} */ (K).stufen[s.stufe];
    const b = (await stat(`${REPO}/data/${st.datei}`)).size;
    assert.equal(b, st.bytes);
    assert.ok(b < 100e6);
    if (s.stufe === 'globus') assert.ok(b < 2e6, `Globus ${b} B`);
    assert.ok(st.verzerrung_laenge > 0.5 && st.verzerrung_laenge <= 1, `${s.stufe}: ${st.verzerrung_laenge}`);
  }
});

test('Regel 8: Kontinente ohne Rohdaten fehlen mit Grund; Linien ohne Geometrie bahn stehen als fehlt', () => {
  for (const k of ['af', 'as', 'na', 'oc', 'sa']) {
    const e = eintrag(`fluesse/${k}`);
    assert.ok(e.wo.fehlt && e.werte.netz.fehlt, k);
    assert.match(e.werte.netz.grund, /Freigabe/);
  }
  assert.ok(eintrag('fluesse/eu').wo.fehlt);
  assert.match(eintrag('fluesse/eu').wo.grund, /bahn/);
});

test('Herkunft: Auswahl folgt einem Modellwert, Lizenz CC BY 4.0, Zeit gilt ab 1900 (Setzung)', () => {
  const f = eintrag('fluesse/eu').werte.abschnitte_gezeigt_globus.punkte[0].fassungen[0];
  assert.ok(f.woher.arten.includes('modell'));
  assert.equal(manifest.lizenz.angabe, 'CC BY 4.0');
  assert.equal(manifest.zeitsemantik.abdeckung.von, 1900);
  assert.ok(graph.auswahl.some((/** @type {any} */ a) => a.id === 'fluesse/auswahl/zeit'));
});
