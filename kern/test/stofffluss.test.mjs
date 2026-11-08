// @ts-check
/* Stofffluss-Quellen (kern/BERICHT-stofffluss.md): Eurostat, FAOSTAT, ILOSTAT.
   Prüft Herkunft je Wert aus den Kennzeichen, Bilanzen der Quelle (Regel 5),
   Lücken als fehlend (Regel 8), keine Geldwerte (Regel 3), keine Hochrechnung (Regel 12). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruefe, pruefeManifest, pruefeHerkunftGegenManifest, ladeAdapter, REPO } from '../pruefe.mjs';

const lies = async (/** @type {string} */ p) => JSON.parse(await readFile(`${REPO}/data/stofffluss/${p}`, 'utf8'));
const A = { eurostat: await ladeAdapter('eurostat'), faostat: await ladeAdapter('faostat'), ilostat: await ladeAdapter('ilostat') };
const eintrag = (/** @type {any} */ g, /** @type {string} */ id) => /** @type {any} */ (g.eintraege.find((/** @type {any} */ e) => e.id === id));
const punkt = (/** @type {any} */ groesse, /** @type {number} */ jahr) => groesse.punkte.find((/** @type {any} */ p) => p.bezugszeit.wert === jahr).fassungen[0];

test('Manifest, Herkunft und Graph bestehen die Prüfung', () => {
  for (const [n, { manifest, graph }] of Object.entries(A)) {
    assert.deepEqual(pruefeManifest(manifest).fehler, [], n);
    assert.deepEqual(pruefeHerkunftGegenManifest(graph, manifest).fehler, [], n);
    assert.deepEqual(pruefe(graph).fehler, [], n);
  }
});

test('Regel 5: Eurostat-Bilanzen gehen auf (DMC = DE + IMP − EXP; GAE und GIC)', async () => {
  const m = await lies('eurostat_mfa.json');
  let n = 0;
  for (const r of m.reihen) for (const j of Object.keys(r.werte.DMC ?? {})) {
    const v = ['DE', 'IMP', 'EXP', 'DMC'].map(k => r.werte[k]?.[j]?.[0]);
    if (v.some(x => x === null || x === undefined)) continue;
    n++; assert.ok(Math.abs(v[0] + v[1] - v[2] - v[3]) <= Math.max(1, 1e-3 * Math.abs(v[3])), `${r.geo} ${r.gruppe} ${j}`);
  }
  assert.ok(n > 4000, `${n} geprüft`);
  const e = await lies('eurostat_energie.json');
  n = 0;
  for (const r of e.reihen) for (const j of Object.keys(r.werte.GAE ?? {})) {
    const w = (/** @type {string} */ k) => r.werte[k]?.[j]?.[0];
    const v = ['PPRD', 'RCV_RCY', 'IMP', 'EXP', 'STK_CHG', 'GAE', 'INTMARB', 'GIC'].map(w);
    if (v.some(x => x === null || x === undefined)) continue;
    const [p, rc, im, ex, st, gae, bunker, gic] = /** @type {number[]} */ (v), tol = Math.max(1, 1e-3 * Math.abs(gae));
    n++; assert.ok(Math.abs(p + rc + im - ex + st - gae) <= tol && Math.abs(gae - bunker - gic) <= tol, `${r.geo} ${r.traeger} ${j}`);
  }
  assert.ok(n > 5000, `${n} geprüft`);
});

test('Stapel nach Herkunft des Stoffs; Sonnenstrahlung 0.3, Biomasse 1.2', () => {
  const g = A.eurostat.graph;
  assert.equal(eintrag(g, 'eurostat/mfa/de/mf1').stapel, '1.2');
  assert.equal(eintrag(g, 'eurostat/mfa/de/mf4').stapel, '1.1');
  assert.equal(eintrag(g, 'eurostat/energie/de/ra420').stapel, '0.3');
  assert.equal(eintrag(g, 'eurostat/energie/de/r5110_5150_w6000ri').stapel, '1.2');
});

test('Regel 6: Herkunft je Wert aus dem Kennzeichen', () => {
  const alle = (/** @type {any} */ g) => g.eintraege.flatMap((/** @type {any} */ e) => Object.values(e.werte)).filter((/** @type {any} */ x) => x.punkte).flatMap((/** @type {any} */ x) => x.punkte.map((/** @type {any} */ p) => p.fassungen[0]));
  for (const f of alle(A.eurostat.graph)) {
    const kz = /Kennzeichen (\S+):/.exec(f.woher.hinweis ?? '')?.[1] ?? '';
    assert.equal(f.woher.arten.includes('modell'), /[ei]/.test(kz), f.woher.hinweis);
  }
  const fao = alle(A.faostat.graph);
  assert.ok(fao.some((/** @type {any} */ f) => /Kennzeichen A/.test(f.woher.hinweis) && f.woher.arten.includes('beobachtung')));
  for (const f of fao) if (/Kennzeichen [EI]/.test(f.woher.hinweis ?? '')) assert.ok(f.woher.arten.includes('modell'));
  const ilo = alle(A.ilostat.graph);
  for (const f of ilo) {
    const modell = /Modelled Estimates/.test(f.woher.quelle);
    assert.equal(f.woher.arten.includes('modell'), modell);
    if (f.woher.arten.includes('erwartung')) assert.equal(f.woher.erwartungstraeger, 'ILO (Modelled Estimates)');
  }
  assert.ok(ilo.some((/** @type {any} */ f) => f.woher.arten.includes('erwartung')), 'Prognosejahre der ILO als Erwartung');
});

test('Regel 8: Lücken bleiben Jahre mit Grund; fehlende FAO-Gruppen stehen als fehlt', async () => {
  for (const { graph } of Object.values(A)) for (const e of /** @type {any[]} */ (graph.eintraege)) for (const x of Object.values(e.werte)) {
    const g = /** @type {any} */ (x); if (!g.punkte) continue;
    assert.equal(g.punkte.length, g.zeitsemantik.abdeckung.bis - g.zeitsemantik.abdeckung.von + 1, e.id);
  }
  const p = await lies('faostat_produktion.json');
  for (const c of Object.keys(p.fehlend)) assert.ok(eintrag(A.faostat.graph, `faostat/produktion/gruppe_${c}`).werte.produktion.fehlt);
  assert.ok(!p.reihen.some((/** @type {any} */ r) => Number(r.land) >= 5000 || r.land === '351'), 'keine Regionen, kein China (351) doppelt');
  const i = await lies('ilostat_arbeitszeit.json');
  assert.ok(!i.laender.some((/** @type {string} */ l) => l.startsWith('X')), 'keine ILO-Regionen');
});

test('Regel 3 und 12: nur physische Einheiten, keine Hochrechnung auf Stunden je Jahr', () => {
  const einheiten = new Set();
  for (const { graph } of Object.values(A)) for (const e of /** @type {any[]} */ (graph.eintraege)) for (const x of Object.values(e.werte)) if (/** @type {any} */ (x).einheit) einheiten.add(/** @type {any} */ (x).einheit);
  assert.deepEqual([...einheiten].sort(), ['1000 h', '1000 ha', '1000 t', 'TJ', 'h', 't']);
  for (const e of /** @type {any[]} */ (A.ilostat.graph.eintraege)) assert.deepEqual(Object.keys(e.werte).filter(k => /jahr/.test(k)), []);
});

test('Stichprobe: Deutschland, Werte wie in der Quelle', () => {
  const de = eintrag(A.ilostat.graph, 'ilostat/how_temp/deu/eco_sector_total').werte.wochenstunden_je_person;
  assert.equal(punkt(de, 2022).wert, 33.94);
  assert.deepEqual(punkt(de, 2022).woher.arten, ['beobachtung', 'kuratiert']);
  const mfa = eintrag(A.eurostat.graph, 'eurostat/mfa/de/mf3').werte;
  assert.ok(punkt(mfa.entnahme, 2020).wert > 400e3, 'nichtmetallische Mineralien DE 2020 über 400 Mio. t');
});
