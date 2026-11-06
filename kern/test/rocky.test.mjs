// @ts-check
/* Rocky-Gerüst: Herkunft getrennt (Stern beobachtet, Planet umstritten, Erfundenes nur Fiktion),
   Stationen mit Status fehlt und Grund „Inhalt von Max“, keine Buchzitate. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, pruefeEreignis, ladeAdapter, REPO } from '../pruefe.mjs';

const ev = JSON.parse(await readFile(`${REPO}/kern/ereignisse/rocky.json`, 'utf8'));
const sterne = await ladeAdapter('nachbarsterne'), fiktion = await ladeAdapter('rocky');
const KONTEXT = { adapter: new Set(['nachbarsterne', 'rocky', 'planeten']), graphen: new Map([['nachbarsterne', sterne.graph], ['rocky', fiktion.graph]]) };
const arten = (/** @type {any} */ g) => new Set(JSON.stringify(g).match(/"arten":\[[^\]]*\]/g)?.flatMap(s => JSON.parse(s.slice(8))) ?? []);

test('Ereignis, Manifeste und Graphen bestehen die Prüfung', () => {
  assert.deepEqual(pruefeEreignis(ev, KONTEXT).fehler, []);
  for (const { manifest, graph } of [sterne, fiktion]) {
    assert.deepEqual(pruefeManifest(manifest).fehler, []);
    assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, []);
    assert.deepEqual(pruefe(graph).fehler, []);
  }
});

test('Herkunft getrennt: Erfundenes nur fiktion, Echtes nie fiktion', () => {
  assert.deepEqual([...arten(fiktion.graph)], ['fiktion']);
  assert.ok(!arten(sterne.graph).has('fiktion'));
  const a = /** @type {any} */ (sterne.graph.eintraege.find(e => e.id === 'nachbarsterne/40_eridani_a'));
  assert.deepEqual(a.werte.parallaxe.punkte[0].fassungen[0].woher.arten, ['beobachtung']);
  assert.ok(Math.abs(a.werte.parallaxe.punkte[0].fassungen[0].wert - 199.6) < 0.1);
});

test('40 Eri b umstritten: beide Deutungen mit Quelle, keine entschieden (Regel 13)', () => {
  const b = /** @type {any} */ (sterne.graph.eintraege.find(e => e.id === 'nachbarsterne/40_eridani_b'));
  assert.match(b.name, /umstritten/);
  assert.match(b.werte.deutung_planet.punkte[0].fassungen[0].woher.quelle, /Ma et al\. 2018/);
  assert.match(b.werte.deutung_aktivitaet.punkte[0].fassungen[0].woher.quelle, /Burrows et al\. 2024/);
  const ohne = structuredClone(sterne.graph);
  delete /** @type {any} */ (ohne.eintraege.find(e => e.id === 'nachbarsterne/40_eridani_b')).werte.deutung_aktivitaet;
  assert.ok(pruefe(ohne).fehler.some(f => f.regel === 13));
});

test('Stationen der Fragen fehlen mit „Inhalt von Max“; die übrigen bewusst leer', () => {
  const n = (/** @type {string} */ x) => ev.stationen.find((/** @type {any} */ s) => s.natur === x);
  for (const x of ['0', 'planetarer_stoffwechsel', '1.2', 'gesellschaftlicher_stoffwechsel', '2.3']) {
    assert.equal(n(x).status, 'fehlt', x); assert.equal(n(x).begruendung, 'Inhalt von Max', x);
  }
  for (const x of ['1.1', '1.3', '2.1', '2.2']) assert.equal(n(x).status, 'bewusst_leer', x);
  assert.match(n('planetarer_stoffwechsel').frage, /Erde.*Venus.*Titan/);
});

test('Keine Buchzitate: Fiktion nur als kurze Rolle in eigenen Worten, ohne Anführungszeichen', () => {
  for (const e of /** @type {any[]} */ (fiktion.graph.eintraege)) {
    const r = e.werte.rolle.punkte[0].fassungen[0].wert;
    assert.ok(r.length < 80 && !/[„“"«»]/.test(r), e.id);
    assert.equal(e.werte.inhalt.grund, 'Inhalt von Max');
  }
});
