// @ts-check
/* Eisdicke als Feld-Ebene: beide Ideale, Klassen-PNG je Schritt, Größen plausibel. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';

const { manifest, graph } = await ladeAdapter('eis');
const roh = JSON.parse(await readFile(`${REPO}/data/eis.json`, 'utf8'));

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  assert.deepEqual(pruefeManifest(manifest).fehler, []);
  assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
  assert.deepEqual(pruefe(graph).fehler, []);
});

test('Regel 13: Referenz und a1, je 33 Schritte 0–80 ka; fehlt eines, Verstoß', async () => {
  for (const k of ['referenz', 'a1']) {
    const s = roh.ideale[k].schritte;
    assert.equal(s.length, 33); assert.deepEqual([s[0].ka, s.at(-1).ka], [0, 80]);
    for (const e of s) assert.ok((await stat(`${REPO}/data/${e.datei}`)).size > 100);
  }
  const ohne = structuredClone(graph);
  const w = /** @type {any} */ (ohne.eintraege.find(e => e.id === 'eis/dicke')).werte;
  for (const k of Object.keys(w)) if (k.endsWith('_a1')) delete w[k];
  assert.ok(pruefe(ohne).fehler.some(f => f.regel === 13));
});

test('Eisvolumen plausibel: heute rund 28 Mio km³, bei 20 ka mehr als doppelt so viel', () => {
  const v = (/** @type {number} */ ka) => roh.ideale.referenz.schritte.find((/** @type {any} */ e) => e.ka === ka).eisvolumen_km3;
  assert.ok(v(0) > 25e6 && v(0) < 32e6, `heute ${v(0)}`);
  assert.ok(v(20) > 2 * v(0));
  assert.ok(roh.meereis.fehlt);
});
