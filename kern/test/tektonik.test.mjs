// @ts-check
/* Tektonik-Adapter: Prüfung, Ideale, fehlende Drehungen als null, und die
   Drehung der Seite gegen pyGPlates (Stichprobe aus tektonik.py). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';
import { transform } from '../adapter/tektonik/transform.mjs';
import { drehe, schrittBei, gilt } from '../adapter/tektonik/drehen.mjs';
import { BEZUGSSYSTEME, istFehlend } from '../schema.mjs';

const { manifest, graph } = await ladeAdapter('tektonik');
const roh = JSON.parse(await readFile(`${REPO}/data/tektonik_umrisse.json`, 'utf8'));
const pk = JSON.parse(await readFile(`${REPO}/data/tektonik_palaeokuesten.json`, 'utf8'));
const stich = JSON.parse(await readFile(new URL('./tektonik_stichprobe.json', import.meta.url), 'utf8'));
const eintrag = (/** @type {string} */ id) => /** @type {any} */ (graph.eintraege.find(e => e.id === id));

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Bezugssystem ma_bp, Unschärfe fehlt mit Grund', () => {
  assert.ok('ma_bp' in BEZUGSSYSTEME);
  assert.equal(roh.zeit.bezugssystem, 'ma_bp');
  assert.ok(istFehlend(roh.zeit.unschaerfe) && roh.zeit.unschaerfe.grund);
  assert.ok(istFehlend(pk.zeit.unschaerfe));
});

test('Regel 13: drei Ideale, Cao nur jenseits von 1 Ga und ohne Ideal', () => {
  assert.deepEqual(/** @type {any} */ (graph).ideale.map((/** @type {any} */ i) => i.id), ['tektonik/ideal/merdith2021', 'tektonik/ideal/mueller2022', 'tektonik/ideal/paleomap']);
  assert.deepEqual(Object.keys(eintrag('tektonik/umrisse').werte), ['lage_merdith2021', 'lage_mueller2022', 'lage_paleomap']);
  assert.ok(Math.min(...roh.modelle.cao2024.schritte_ma) > 1000);
  assert.ok(eintrag('tektonik/umrisse/cao2024').werte.lage.punkte.every((/** @type {any} */ p) => p.fassungen[0].woher.ideal === undefined));
  const ohne = structuredClone(graph);
  delete /** @type {any} */ (ohne.eintraege.find(e => e.id === 'tektonik/umrisse')).werte.lage_paleomap;
  assert.ok(pruefe(ohne).fehler.some(f => f.regel === 13));
  const frueh = structuredClone(roh); frueh.modelle.cao2024.schritte_ma[0] = 1000;
  assert.throws(() => transform(frueh, manifest, { palaeokuesten: pk }), /jenseits von 1 Ga/);
});

test('Herkunft je Modell: Müller ist Modell, die anderen Rekonstruktion; Längengrad-Hinweis', () => {
  assert.deepEqual(roh.modelle.mueller2022.arten, ['modell', 'berechnet']);
  for (const k of ['merdith2021', 'paleomap', 'cao2024']) assert.deepEqual(roh.modelle[k].arten, ['rekonstruktion', 'berechnet']);
  assert.match(eintrag('tektonik/umrisse').wo.hinweis, /^Umriss heutig, nur die Lage ist rekonstruiert\. .*nur die Breite fest; die Länge ist eine Konvention/);
  assert.deepEqual(pk.woher.arten, ['rekonstruktion', 'kuratiert', 'berechnet']);
});

test('Umrisse und Paläoküsten sind getrennte Einträge mit getrennten Dateien', () => {
  const u = eintrag('tektonik/umrisse'), k = eintrag('tektonik/palaeokueste');
  assert.notEqual(u.wo.koordinaten.verweis, k.wo.koordinaten.verweis);
  assert.match(k.wo.koordinaten.verweis, /^data\/tektonik_palaeokuesten\.json/);
  assert.equal(pk.karten.length, 109);
  assert.deepEqual([pk.karten[0].ma, pk.karten.at(-1).ma], [0, 540]);
});

test('Fehlende Drehung steht als null, nie als Identität', () => {
  // Merdith hat keine Drehungen jenseits von 1000 Ma; innerhalb fehlen einzelne Platten
  const m = roh.modelle.merdith2021;
  assert.equal(m.schritte_ma.at(-1), 1000);
  assert.ok(m.rotationen.flat().some((/** @type {any} */ r) => r === null));
  assert.ok(m.rotationen[0].every((/** @type {any} */ r) => r === null || r[2] === 0), 'bei 0 Ma nur Identität');
});

test('Drehung der Seite stimmt mit pyGPlates überein (Stichprobe)', () => {
  assert.ok(stich.punkte.length >= 30);
  for (const s of stich.punkte) {
    const m = roh.modelle[s.modell];
    const i = m.schritte_ma.indexOf(s.ma), j = m.platten.indexOf(s.platte);
    const r = m.rotationen[i][j];
    assert.ok(r, `${s.modell} ${s.ma} Ma Platte ${s.platte}: Drehung fehlt`);
    const [lo, la] = drehe(s.heute, r);
    const d = Math.hypot((((lo - s.damals[0]) + 540) % 360 - 180) * Math.cos(la * Math.PI / 180), la - s.damals[1]);
    assert.ok(d < 0.01, `${s.modell} ${s.ma} Ma: Abweichung ${d.toFixed(4)}°`);
  }
});

test('Schritte: nur Stützstellen der Quelle, nichts dazwischen', () => {
  const s = roh.modelle.merdith2021.schritte_ma;
  assert.equal(s[schrittBei(s, 3.2)], 3);
  assert.equal(s[schrittBei(s, 72)], 70);
  assert.equal(schrittBei(s, 1200), null);
  assert.equal(schrittBei(roh.modelle.cao2024.schritte_ma, 900), null);
  assert.ok(gilt({ von: 'offen', bis: 0 }, 500) && !gilt({ von: 200, bis: 0 }, 500));
});
