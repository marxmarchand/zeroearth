#!/usr/bin/env node
// @ts-check
/* ════════════════════════════════════════════════════════════════════
   KERN — Prüfregeln. Setzt die epistemischen Regeln aus
   docs/strukturstand.md als Checks durch. Rückgabewert 1 bei Verstoß.

   node kern/pruefe.mjs              alle Adapter unter kern/adapter/
   node kern/pruefe.mjs datei.json   einen Graphen
   node kern/pruefe.mjs -            einen Graphen von stdin

   Fehler brechen ab. Hinweise brechen nicht ab: Sie zeigen, was als
   fehlend geführt wird oder nicht prüfbar ist.
   ════════════════════════════════════════════════════════════════════ */
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  STAPEL, UNTEREBENEN, stapelVon, UEBERGAENGE, GRUNDKRAEFTE, RICHTUNGEN, ZUFLUSSARTEN, AUSGANGSARTEN,
  KAPITALFORMEN, VORGAENGE, RUECKWIRKUNG, RELATIONSARTEN, VERWORFEN, TAUSCHVORGAENGE, MODI, formwechsel,
  ARCHIVARTEN, HERKUNFTSARTEN, KEIN_ERWARTUNGSTRAEGER, WISSENSSTATUS, GEOMETRIEN, MIT_VERZERRUNG,
  istFehlend, MANIFEST_PFLICHT, ZEITSEMANTIK_PFLICHT,
} from './schema.mjs';

export const REGELN = /** @type {const} */ ({
  1: 'Relationen explizit, nie aus der Stapelposition',
  2: '2. Natur ohne wo, mit haengt_an und Formation',
  3: 'Gegenwert nur, wo ein Tausch ihn hergestellt hat',
  4: 'Wahrscheinlichkeit nur mit Erwartungsträger',
  5: 'Stoff bilanziert, Kapital nicht bilanzierbar',
  6: 'Herkunft pro Wert: Menge mit Archivkette',
  7: 'Auswahl als Auswahl ausgewiesen',
  8: 'Fehlendes bleibt fehlend',
  9: 'Plattform weist sich als 2. Natur aus',
  10: 'Verzerrung als Zahl',
  B: 'Bestände und Formen',
  S: 'Struktur',
  M: 'Manifest',
});

/** @typedef {{regel: keyof typeof REGELN, ort: string, text: string}} Meldung */

const ORDNUNG = Object.keys(UNTEREBENEN).sort();
const istZahl = (/** @type {any} */ x) => typeof x === 'number' && Number.isFinite(x);
const istText = (/** @type {any} */ x) => typeof x === 'string' && x.trim() !== '';

/**
 * Prüft einen Graphen gegen die Regeln.
 * @param {any} gr Graph
 * @returns {{fehler: Meldung[], hinweise: Meldung[]}}
 */
export function pruefe(gr) {
  /** @type {Meldung[]} */ const fehler = [];
  /** @type {Meldung[]} */ const hinweise = [];
  const F = (/** @type {any} */ regel, /** @type {string} */ ort, /** @type {string} */ text) => fehler.push({ regel, ort, text });
  const H = (/** @type {any} */ regel, /** @type {string} */ ort, /** @type {string} */ text) => hinweise.push({ regel, ort, text });

  if (!gr || typeof gr !== 'object') { F('S', 'graph', 'kein Objekt'); return { fehler, hinweise }; }
  for (const k of ['eintraege', 'prozesse', 'relationen', 'formationen', 'bestaende']) {
    if (!Array.isArray(gr[k])) { F(k === 'bestaende' ? 'B' : 'S', k, 'fehlt oder ist keine Liste (leer ist [])'); gr = { ...gr, [k]: [] }; }
  }

  /* ── Index ─────────────────────────────────────────────────────── */
  const eintraege = new Map(), prozesse = new Map(), relationen = new Map(), formationen = new Map(), bestaende = new Map();
  const ids = new Set();
  const merke = (/** @type {Map<string, any>} */ m, /** @type {any} */ x, /** @type {string} */ wo) => {
    if (!istText(x?.id)) return F('S', wo, 'ohne id');
    if (ids.has(x.id)) F('S', x.id, 'id doppelt vergeben');
    ids.add(x.id); m.set(x.id, x);
  };
  for (const [k, m] of /** @type {const} */ ([['eintraege', eintraege], ['prozesse', prozesse], ['relationen', relationen],
    ['formationen', formationen], ['bestaende', bestaende]]))
    gr[k].forEach((/** @type {any} */ x, /** @type {number} */ i) => merke(m, x, `${k}[${i}]`));

  /** Löst 'eintrag#groesse' auf. */
  const groesse = (/** @type {string} */ ref) => {
    const [id, k] = String(ref).split('#');
    return eintraege.get(id)?.werte?.[k];
  };
  /** Alle Herkunftsarten einer Größe. */
  const artenVon = (/** @type {any} */ g) =>
    istFehlend(g) || !Array.isArray(g?.punkte) ? []
      : g.punkte.flatMap((/** @type {any} */ p) => (p?.fassungen ?? [])
        .flatMap((/** @type {any} */ f) => (Array.isArray(f?.woher?.arten) ? f.woher.arten : [])));

  /* ── Regel 8: Fehlendes bleibt fehlend (ganzer Graph) ──────────── */
  const durchlaufe = (/** @type {any} */ x, /** @type {string} */ pfad) => {
    if (x === null || x === undefined || (typeof x === 'number' && Number.isNaN(x))) {
      return F(8, pfad, `ist ${x}; Fehlendes wird als {fehlt: true, grund} geführt`);
    }
    if (typeof x !== 'object') return;
    if (istFehlend(x)) {
      if (!istText(x.grund)) F(8, pfad, 'fehlend ohne Grund');
      else H(8, pfad, `fehlend: ${x.grund}`);
      return;
    }
    if (x.interpoliert === true) F(8, pfad, 'interpolierter Wert; nichts wird aufgefüllt');
    for (const [k, v] of Object.entries(x)) durchlaufe(v, Array.isArray(x) ? `${pfad}[${k}]` : `${pfad}.${k}`);
  };
  durchlaufe(gr, 'graph');

  if (!gr.subjektachse) F(8, 'subjektachse', 'nicht geführt; sie ist vorgesehen und wird als leer geführt');
  else if (gr.subjektachse.status !== 'leer') F(8, 'subjektachse', `Status "${gr.subjektachse.status}"; die Subjektachse bleibt vorerst leer`);
  else H(8, 'subjektachse', 'Subjektachse: vorgesehen, leer');

  /* ── Regel 7: Auswahl ──────────────────────────────────────────── */
  const auswahl = new Map();
  if (!Array.isArray(gr.auswahl)) F(7, 'auswahl', 'nicht ausgewiesen (keine Auswahl ist [])');
  else for (const a of gr.auswahl) {
    if (!istText(a?.id)) { F(7, 'auswahl', 'Auswahl ohne id'); continue; }
    auswahl.set(a.id, a);
    if (!istText(a.was)) F(7, a.id, 'sagt nicht, was ausgewählt ist');
    if (!istText(a.gesetzt_in)) F(7, a.id, 'sagt nicht, wo die Setzung steht');
    if (!istText(a.begruendung) && !istFehlend(a.begruendung)) F(7, a.id, 'Begründung fehlt; unbegründet heißt {fehlt, grund}');
  }

  /* ── Formationen ───────────────────────────────────────────────── */
  for (const f of formationen.values()) {
    if (!istText(f.name)) F('S', f.id, 'Formation ohne Namen');
    if (typeof f.warenproduktion !== 'boolean' && !istFehlend(f.warenproduktion))
      F('S', f.id, 'warenproduktion muss true, false oder fehlend sein');
    if (!f.gilt || f.gilt.von === undefined || f.gilt.bis === undefined)
      F('S', f.id, 'Formation ohne Geltungszeit {von, bis}');
  }

  /* ── Bestände und Formen ───────────────────────────────────────── */
  for (const b of bestaende.values()) {
    if (!istText(b.name)) F('B', b.id, 'Bestand ohne Namen');
    if (typeof b.erhalten !== 'boolean') F('B', b.id, 'erhalten muss true oder false sein');
    if (!('menge' in b)) F('B', b.id, 'ohne Menge; unbekannt heißt {fehlt, grund}');
    if (!Array.isArray(b.formen) || !b.formen.length) { F('B', b.id, 'ohne Formen'); continue; }
    const orte = new Set(), formIds = new Set();
    for (const f of b.formen) {
      if (!istText(f?.id) || formIds.has(f.id)) F('B', b.id, `Form ohne eindeutige id: ${f?.id}`);
      formIds.add(f?.id);
      const e = f?.eintrag !== undefined ? eintraege.get(f.eintrag) : undefined;
      const p = f?.prozess !== undefined ? prozesse.get(f.prozess) : undefined;
      if ((f?.eintrag !== undefined) === (f?.prozess !== undefined)) F('B', `${b.id}/${f?.id}`, 'Form verweist auf genau einen Eintrag oder einen Prozess');
      else if (!e && !p) F('B', `${b.id}/${f?.id}`, `Form verweist auf Unbekanntes: ${f.eintrag ?? f.prozess}`);
      else orte.add(e ? `Stapel ${stapelVon(e.stapel)}` : `Übergang ${p.uebergang}`);
    }
    if (orte.size > 1)
      F('B', b.id, `Formen in ${[...orte].join(' und ')}; ein Formwechsel bleibt innerhalb eines Stapels oder Übergangs, über die Grenze ist es Anhaften oder Rolle`);
  }
  const formDes = (/** @type {any} */ b, /** @type {string} */ id) =>
    b.formen?.find((/** @type {any} */ f) => f?.eintrag === id || f?.prozess === id);

  /* ── Einträge ──────────────────────────────────────────────────── */
  for (const e of eintraege.values()) {
    const s = stapelVon(e.stapel);
    if (!s) {
      F('S', e.id, e.stapel in UEBERGAENGE
        ? `"${e.stapel}" ist ein Übergang, kein Stapel; dort laufen Prozesse`
        : `unbekannte Unterebene "${e.stapel}"`);
    } else if (e.stapel in STAPEL) {
      if (!istFehlend(e.unterebene)) F('S', e.id, 'im Stapel ohne Unterebene; eine offene Unterebene wird als fehlend geführt');
    } else if ('unterebene' in e) F('S', e.id, 'Unterebene doppelt: steht schon in stapel');
    if (!istText(e.name)) F('S', e.id, 'ohne Namen');

    // Regel 1: keine Relationen im Eintrag, keine Identität über Stapel
    if ('identisch_mit' in e) F(1, e.id, VERWORFEN.identitaet);
    for (const k of ['relationen', 'setzt_voraus'])
      if (k in e) F(1, e.id, `Feld "${k}": Relationen stehen als eigene Einträge in relationen[]`);

    // Regel 6: Herkunft pro Wert, nicht pro Satz
    if ('woher' in e) F(6, e.id, 'Herkunft am Eintrag; sie gilt pro Wert');

    // Regel 2: 2. Natur
    if (s === '2') {
      if ('wo' in e) F(2, e.id, 'eigenes wo; der Ort einer Form der 2. Natur ist vom Träger geliehen');
      if (!('haengt_an' in e)) F(2, e.id, 'ohne haengt_an; ein fehlender Träger wird als fehlend geführt');
      else if (istFehlend(e.haengt_an)) H(2, e.id, 'Träger fehlt (sichtbar)');
      else if (!Array.isArray(e.haengt_an) || !e.haengt_an.length) F(2, e.id, 'haengt_an muss eine nichtleere Liste oder fehlend sein');
      else for (const t of e.haengt_an) if (!eintraege.has(t)) F(2, e.id, `haengt_an verweist auf Unbekanntes: ${t}`);

      if (!('formation' in e)) F(2, e.id, 'ohne Verweis auf eine Gesellschaftsformation (Pflicht)');
      else if (istFehlend(e.formation)) {
        if (!istText(e.formation.grund)) F(2, e.id, 'Formation fehlend ohne Begründung');
        else H(2, e.id, 'Formationsverweis als fehlend geführt, mit Begründung');
      } else {
        if (!formationen.has(e.formation?.id)) F(2, e.id, `Formation unbekannt: ${e.formation?.id}`);
        if (e.formation?.von === undefined || e.formation?.bis === undefined)
          F(2, e.id, 'Formationsverweis ist zeitgebunden: {id, von, bis}');
      }
      if (e.verwertungsqualitaet) {
        const f = istFehlend(e.formation) ? null : formationen.get(e.formation?.id);
        if (f?.warenproduktion !== true)
          F(2, e.id, 'Verwertungsqualität ohne warenproduzierende Formation; die Formation schaltet sie ab');
        if (!MODI.verwertungsqualitaet.includes(e.verwertungsqualitaet.modus))
          F('S', e.id, `Modus der Verwertungsqualität unbekannt: ${e.verwertungsqualitaet.modus}`);
      }
    } else {
      if ('haengt_an' in e) F(2, e.id, 'haengt_an nur für Formen der 2. Natur');
      if (e.verwertungsqualitaet) F(2, e.id, 'Verwertungsqualität nur an Formen der 2. Natur');
    }

    // Spur einer Form
    if ('spur_von' in e && !istFehlend(e.spur_von)) {
      const b = bestaende.get(e.spur_von?.bestand);
      if (!b) F('B', e.id, `Spur eines unbekannten Bestands: ${e.spur_von?.bestand}`);
      else if (!b.formen?.some((/** @type {any} */ f) => f?.id === e.spur_von.form))
        F('B', e.id, `Spur einer unbekannten Form: ${e.spur_von.bestand}/${e.spur_von.form}`);
    }

    // Geometrie
    if (e.stapel === '0.1' && 'wo' in e) F('S', e.id, '0.1 (Grundkräfte) hat kein wo');
    if ('wo' in e && !istFehlend(e.wo) && s !== '2') {
      const wo = e.wo;
      if (!GEOMETRIEN.includes(wo?.geometrie)) F('S', e.id, `Geometrie unbekannt: ${wo?.geometrie}`);
      if (MIT_VERZERRUNG.includes(wo?.geometrie)) {
        if (!istZahl(wo.verzerrung?.flaeche)) F(10, e.id, 'Flächenverzerrung nicht als Zahl mitgeführt');
        if (!istZahl(wo.verzerrung?.ueberhoehung)) F(10, e.id, 'Überhöhung nicht als Zahl mitgeführt');
      }
      if (wo?.gesetzt === true && !(Array.isArray(e.auswahl) && e.auswahl.length))
        F(7, e.id, 'gesetzter Ausschnitt ohne Verweis auf eine Auswahl');
      if (wo?.geometrie === 'grenze') {
        if (!Array.isArray(wo.woher?.abgeleitet_aus) || !wo.woher.abgeleitet_aus.length)
          F('S', e.id, 'grenze ist abgeleitet, nie gemessen: abgeleitet_aus fehlt');
        if (!istText(wo.hinweis)) F('S', e.id, 'grenze ohne Pflichthinweis');
        if (!('spur_von' in e)) F('B', e.id, 'grenze ohne spur_von; eine Grenze ist Spur einer Form eines Bestands');
      }
      if (wo?.woher) pruefeWoher(wo.woher, `${e.id}.wo`);
    }
    if (Array.isArray(e.auswahl)) for (const a of e.auswahl) if (!auswahl.has(a)) F(7, e.id, `Auswahl unbekannt: ${a}`);

    // Werte
    if (!e.werte || typeof e.werte !== 'object') { F('S', e.id, 'ohne werte (keine Werte ist {})'); continue; }
    for (const [k, g] of Object.entries(e.werte)) {
      const ort = `${e.id}#${k}`;
      if (istFehlend(g)) continue;
      if (!istText(g?.einheit)) F('S', ort, 'ohne Einheit');
      if (!Array.isArray(g?.punkte)) { F('S', ort, 'ohne punkte'); continue; }
      if (g.zeitsemantik) {
        const z = g.zeitsemantik;
        if (!istZahl(z.schritte)) F('S', ort, 'zeitsemantik ohne Schrittzahl');
        else if (g.punkte.length !== z.schritte)
          F(8, ort, `${g.punkte.length} Punkte bei ${z.schritte} Schritten; Lücken werden als fehlend geführt, nicht weggelassen`);
      }
      g.punkte.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
        const po = `${ort}[${i}]`;
        if (e.stapel === '0.1') { if (p?.bezugszeit) F('S', po, '0.1 ist ohne Zeit'); }
        else if (!p?.bezugszeit) F('S', po, 'ohne Bezugszeit');
        else if (!istFehlend(p.bezugszeit) && (!istText(p.bezugszeit.skala)
          || !(istZahl(p.bezugszeit.wert) || (istZahl(p.bezugszeit.von) && istZahl(p.bezugszeit.bis)))))
          F('S', po, 'Bezugszeit braucht {skala, wert} oder {skala, von, bis}');
        pruefeFassungen(p?.fassungen, po);
      });
    }
  }

  /** @param {any} fs @param {string} ort */
  function pruefeFassungen(fs, ort) {
    if (!Array.isArray(fs) || !fs.length) return F('S', ort, 'ohne Fassung');
    fs.forEach((f, i) => {
      const fo = `${ort}.fassungen[${i}]`;
      if (!('wert' in f)) F(8, fo, 'ohne wert; fehlend heißt {fehlt, grund}');
      pruefeWissensstand(f.wissensstand, fo);
      if (!f.woher) F(6, fo, 'Wert ohne Herkunft');
      else pruefeWoher(f.woher, fo);
      pruefeErwartung(f, f.woher?.erwartungstraeger, fo);
      pruefeGegenwert(f, fo);
    });
    // Revisionen fügen hinzu, überschreiben nie.
    if (fs.length > 1) {
      for (let i = 1; i < fs.length; i++) {
        const a = fs[i - 1].wissensstand, c = fs[i].wissensstand;
        if (istFehlend(a) || istFehlend(c)) { F('S', ort, 'Revision ohne Wissensstand ist nicht einzuordnen'); continue; }
        if (!(String(c?.seit) > String(a?.seit))) F('S', ort, `Fassung ${i} ist nicht jünger als Fassung ${i - 1}; eine Revision überschreibt nicht`);
        if (c?.status !== 'revidiert') F('S', ort, `Fassung ${i} folgt auf eine ältere und muss "revidiert" sein`);
      }
    }
  }

  /** @param {any} w @param {string} ort */
  function pruefeWissensstand(w, ort) {
    if (w === undefined) return F('S', ort, 'ohne Wissensstand; unbekannt heißt {fehlt, grund}');
    if (istFehlend(w)) return;
    if (!istText(w.seit)) F('S', ort, 'Wissensstand ohne "seit"');
    if (!WISSENSSTATUS.includes(w.status)) F('S', ort, `Wissensstand-Status unbekannt: ${w.status}`);
  }

  /** Regel 6 und 9. @param {any} w @param {string} ort */
  function pruefeWoher(w, ort) {
    if ('art' in w) F(6, ort, 'woher ist eine Menge: "arten" statt "art"');
    const arten = Array.isArray(w.arten) ? w.arten : [];
    if (!arten.length) F(6, ort, 'Herkunft ohne arten (nichtleere Menge)');
    for (const a of arten) if (!HERKUNFTSARTEN.includes(a)) F(6, ort, `Herkunftsart unbekannt: ${a}`);
    if (new Set(arten).size !== arten.length) F(6, ort, 'arten ist eine Menge; doppelte Einträge');
    if (!istText(w.quelle)) F(6, ort, 'Herkunft ohne Quelle');
    pruefeArchivkette(w.archivkette, ort);
    if (w.abgeleitet_aus !== undefined) {
      if (!Array.isArray(w.abgeleitet_aus) || !w.abgeleitet_aus.length) return F(6, ort, 'abgeleitet_aus muss eine nichtleere Liste sein');
      const beteiligt = new Set();
      for (const ref of w.abgeleitet_aus) {
        const g = groesse(ref);
        if (g === undefined) F(6, ort, `abgeleitet aus Unbekanntem: ${ref}`);
        else if (istFehlend(g)) F(6, ort, `abgeleitet aus fehlendem Wert: ${ref}`);
        else for (const a of artenVon(g)) beteiligt.add(a);
      }
      const fehlen = [...beteiligt].filter(a => !arten.includes(a));
      if (fehlen.length) F(6, ort, `abgeleitet, trägt aber nicht alle beteiligten Arten; es fehlt: ${fehlen.join(', ')}`);
    }
    if (arten.includes('erwartung')) pruefeErwartung({ erwartung: true }, w.erwartungstraeger, ort);
  }

  /** @param {any} k @param {string} ort */
  function pruefeArchivkette(k, ort) {
    if (!Array.isArray(k) || !k.length) return F(6, ort, 'Herkunft ohne Archivkette');
    k.forEach((g, i) => {
      if (istFehlend(g)) return;
      if (!istText(g?.archiv) && !istFehlend(g?.archiv)) F(6, ort, `Archivkette[${i}] ohne Archiv`);
      if (!istFehlend(g?.art) && !(g?.art in ARCHIVARTEN)) F(6, ort, `Archivart unbekannt: ${g?.art}`);
      if (i > 0 && g?.art === 'zeroearth') F(9, ort, 'zeroearth steht am Anfang der Kette; es wird aus den anderen Archiven gespeist');
    });
    if (k[0]?.art !== 'zeroearth')
      F(9, ort, 'Archivkette beginnt nicht bei zeroearth; die Plattform weist sich als Archiv der 2. Natur aus');
  }

  /** Regel 4. @param {any} x @param {any} traeger @param {string} ort */
  function pruefeErwartung(x, traeger, ort) {
    const braucht = x.wahrscheinlichkeit !== undefined || x.erwartung || x.modus === 'erwartet';
    if (!braucht) return;
    if (!istText(traeger)) return F(4, ort, 'Erwartung oder Wahrscheinlichkeit ohne Erwartungsträger');
    if (KEIN_ERWARTUNGSTRAEGER.includes(traeger.toLowerCase()))
      F(4, ort, 'die Plattform ist kein Erwartungsträger; sie rechnet keine eigenen Wahrscheinlichkeiten');
    if (x.wahrscheinlichkeit !== undefined) {
      if (!istZahl(x.wahrscheinlichkeit) || x.wahrscheinlichkeit < 0 || x.wahrscheinlichkeit > 1)
        F('S', ort, 'Wahrscheinlichkeit muss zwischen 0 und 1 liegen');
      const arten = x.woher?.arten;
      if (Array.isArray(arten) && !arten.includes('erwartung')) F(4, ort, 'Wahrscheinlichkeit ohne Herkunftsart erwartung');
    }
  }

  /** Regel 3. @param {any} x @param {string} ort */
  function pruefeGegenwert(x, ort) {
    if (x.gegenwert === undefined) return;
    if (!istText(x.tausch)) return F(3, ort, 'Gegenwert ohne Tausch, der ihn hergestellt hat');
    const t = relationen.get(x.tausch);
    if (!t) F(3, ort, `Tausch unbekannt: ${x.tausch}`);
    else if (!TAUSCHVORGAENGE.includes(t.art)) F(3, ort, `"${x.tausch}" ist ${t.art}, kein Tausch`);
    if (!istZahl(x.gegenwert?.betrag) || !istText(x.gegenwert?.einheit)) F(3, ort, 'Gegenwert braucht {betrag, einheit}');
  }

  /* ── Prozesse ──────────────────────────────────────────────────── */
  for (const p of prozesse.values()) {
    if ('stapel' in p) F('S', p.id, 'der Prozess gehört keinem Stapel');
    if (!(p.uebergang in UEBERGAENGE)) F('S', p.id, `Übergang unbekannt: ${p.uebergang}`);
    if (p.richtung !== undefined && !RICHTUNGEN.includes(p.richtung)) F('S', p.id, `Richtung unbekannt: ${p.richtung}`);
    for (const [i, z] of (p.zufluesse ?? []).entries()) {
      const o = `${p.id}.zufluesse[${i}]`;
      const von = eintraege.get(z.von);
      if (!von) F('S', o, `Zufluss von Unbekanntem: ${z.von}`);
      if (!UNTEREBENEN[z.herkunftsstapel] && !(z.herkunftsstapel in STAPEL)) F('S', o, 'Zufluss ohne gültigen Herkunftsstapel');
      else if (von && von.stapel !== z.herkunftsstapel) F('S', o, `Herkunftsstapel ${z.herkunftsstapel}, der Eintrag liegt aber in ${von.stapel}`);
      if (!ZUFLUSSARTEN.includes(z.art)) F('S', o, `Zuflussart unbekannt: ${z.art}`);
      if (z.art === 'kapital') {
        if (!KAPITALFORMEN.includes(z.kapitalform)) F('S', o, `Kapitalform unbekannt: ${z.kapitalform}`);
        if (z.bilanzierbar === true) F(5, o, 'Kapitalfluss als bilanzierbar markiert');
        if (z.modus !== undefined && !MODI.kapital.includes(z.modus)) F('S', o, `Kapitalmodus unbekannt: ${z.modus}`);
      }
      if (stapelVon(z.herkunftsstapel) === '0') {
        if (istFehlend(z.kette)) H('S', o, 'Kette der Grundkräfte fehlt (sichtbar)');
        else if (!Array.isArray(z.kette) || !z.kette.length || !z.kette.every((/** @type {any} */ k) => GRUNDKRAEFTE.includes(k)))
          F('S', o, 'Zufluss aus der 0. Natur braucht eine Kette von Grundkräften');
        if (!RICHTUNGEN.includes(z.richtung)) F('S', o, 'Zufluss aus der 0. Natur braucht extern oder intern');
      }
    }
    for (const [i, a] of (p.ausgaenge ?? []).entries()) {
      const o = `${p.id}.ausgaenge[${i}]`;
      if (!eintraege.has(a.nach)) F('S', o, `Ausgang nach Unbekanntem: ${a.nach}`);
      if (!AUSGANGSARTEN.includes(a.art)) F('S', o, `Ausgangsart unbekannt: ${a.art}`);
    }
  }

  /* ── Relationen ────────────────────────────────────────────────── */
  /** Höhe eines Eintrags: erst Stapel, dann Unterebene. */
  const hoehe = (/** @type {any} */ e) => [Number(stapelVon(e.stapel)), ORDNUNG.indexOf(e.stapel)];
  for (const r of relationen.values()) {
    const o = r.id;
    if (!RELATIONSARTEN.includes(r.art)) {
      F(1, o, r.art in VERWORFEN ? /** @type {any} */ (VERWORFEN)[r.art] : `Relationsart unbekannt: ${r.art}`);
      continue;
    }
    const von = eintraege.get(r.von) ?? prozesse.get(r.von), nach = eintraege.get(r.nach) ?? prozesse.get(r.nach);
    if (!von) F(1, o, `von verweist auf Unbekanntes: ${r.von}`);
    if (!nach) F(1, o, `nach verweist auf Unbekanntes: ${r.nach}`);
    if (r.prozess !== undefined && !prozesse.has(r.prozess)) F(1, o, `Prozess unbekannt: ${r.prozess}`);
    if (!r.woher) F(1, o, 'Relation ohne eigene Herkunft');
    else {
      if (/stapel\s*(position|reihenfolge)|stapelposition|stapelreihenfolge/i.test(String(r.woher.quelle)))
        F(1, o, 'aus der Stapelposition abgeleitet; Relationen werden gespeichert, nicht abgeleitet');
      pruefeWoher(r.woher, o);
    }
    pruefeWissensstand(r.wissensstand, o);

    if (r.art === RUECKWIRKUNG && von?.stapel && nach?.stapel) {
      const [sv, uv] = hoehe(von), [sn, un] = hoehe(nach);
      if (!(sv > sn || (sv === sn && uv >= 0 && un >= 0 && uv > un))) F('S', o, 'Rückwirkung läuft von oben nach unten');
    }
    if (r.art === 'anhaften' && von && stapelVon(von.stapel) !== '2')
      F(2, o, 'Anhaften: nur eine Form der 2. Natur haftet an einem Träger');
    if (r.modus !== undefined) {
      const modi = /** @type {any} */ (VORGAENGE)[r.art]?.modi;
      if (!modi || !(/** @type {any} */ (MODI)[modi]).includes(r.modus)) F('S', o, `Modus "${r.modus}" passt nicht zu ${r.art}`);
    }
    pruefeErwartung(r, r.erwartungstraeger, o);
    pruefeGegenwert(r, o);

    // Formwechsel eines Bestands
    if (r.bestand !== undefined) {
      const b = bestaende.get(r.bestand);
      if (!b) F('B', o, `Bestand unbekannt: ${r.bestand}`);
      else {
        if (!formDes(b, r.von) || !formDes(b, r.nach)) F('B', o, 'Formwechsel zwischen Formen, die nicht zu diesem Bestand gehören');
        if (typeof b.erhalten === 'boolean' && r.art !== formwechsel(b.erhalten))
          F('B', o, `Formwechsel eines ${b.erhalten ? 'erhaltenen' : 'nicht erhaltenen'} Bestands ist ${formwechsel(b.erhalten)}, nicht ${r.art}`);
      }
    }

    // Regel 5
    if (r.art === 'stoffwechsel') {
      const bz = r.bilanz;
      if (!bz) F(5, o, 'Stoffwechsel ohne Bilanz; unbekannte Mengen werden als fehlend geführt');
      else {
        if (!istText(bz.einheit)) F(5, o, 'Bilanz ohne Einheit');
        const mengen = [bz.zufluss, ...(Array.isArray(bz.abfluss) ? bz.abfluss : [bz.abfluss])];
        if (mengen.some(istFehlend)) H(5, o, 'Bilanz nicht prüfbar: Mengen fehlen');
        else if (!mengen.every(istZahl)) F(5, o, 'Bilanz braucht Zahlen oder fehlend');
        else {
          const rest = bz.zufluss - bz.abfluss.reduce((/** @type {number} */ s, /** @type {number} */ x) => s + x, 0);
          if (Math.abs(rest) > (bz.toleranz ?? 0)) F(5, o, `Bilanz nicht geschlossen: Rest ${rest} ${bz.einheit}`);
        }
      }
    } else {
      const kapital = r.art === 'einschliessen_realisieren' || r.art === 'konversion';
      if (r.bilanz !== undefined) F(5, o, kapital ? 'Kapitalfluss bilanziert; Kapitalströme bleiben offen' : `${r.art} ist nicht bilanzierbar`);
      if (r.bilanzierbar === true) F(5, o, kapital ? 'Kapitalfluss als bilanzierbar markiert' : `${r.art} ist nicht bilanzierbar`);
    }
  }

  return { fehler, hinweise };
}

/**
 * Prüft ein Adapter-Manifest.
 * @param {any} m
 * @returns {{fehler: Meldung[], hinweise: Meldung[]}}
 */
export function pruefeManifest(m) {
  /** @type {Meldung[]} */ const fehler = [];
  /** @type {Meldung[]} */ const hinweise = [];
  const F = (/** @type {string} */ ort, /** @type {string} */ text) => fehler.push({ regel: 'M', ort, text });
  const ort = `manifest ${m?.id ?? '?'}`;
  for (const k of MANIFEST_PFLICHT)
    if (!(k in (m ?? {})) || m[k] === null) F(ort, `Pflichtfeld "${k}" fehlt; unbekannt heißt {fehlt, grund}`);
  if (!m) return { fehler, hinweise };
  const fehlende = (/** @type {any} */ x, /** @type {string} */ pfad) => {
    if (x === null) return F(ort, `${pfad} ist null; unbekannt heißt {fehlt, grund}`);
    if (!x || typeof x !== 'object') return;
    if (istFehlend(x)) return hinweise.push({ regel: 'M', ort, text: `${pfad} fehlend: ${x.grund}` });
    for (const [k, v] of Object.entries(x)) fehlende(v, pfad ? `${pfad}.${k}` : k);
  };
  fehlende(m, '');
  if (Array.isArray(m.stapel)) { for (const s of m.stapel) if (!stapelVon(s)) F(ort, `Stapel oder Unterebene unbekannt: ${s}`); }
  else if (m.stapel !== undefined) F(ort, 'stapel ist eine Liste von Unterebenen');
  for (const v of [m.vorgang].flat()) if (v !== undefined && !istFehlend(v) && !RELATIONSARTEN.includes(v)) F(ort, `Vorgang unbekannt: ${v}`);
  if (m.herkunft && !istFehlend(m.herkunft)) {
    if ('art' in m.herkunft) F(ort, 'herkunft ist eine Menge: "arten" statt "art"');
    for (const a of m.herkunft.arten ?? []) if (!HERKUNFTSARTEN.includes(a)) F(ort, `Herkunftsart unbekannt: ${a}`);
    if (!Array.isArray(m.herkunft.archivkette) || m.herkunft.archivkette[0]?.art !== 'zeroearth')
      F(ort, 'herkunft.archivkette fehlt oder beginnt nicht bei zeroearth');
  }
  if (m.zeitsemantik && !istFehlend(m.zeitsemantik))
    for (const k of ZEITSEMANTIK_PFLICHT) if (!(k in m.zeitsemantik)) F(ort, `zeitsemantik.${k} fehlt`);
  for (const g of [m.geometrie].flat()) if (g !== undefined && !istFehlend(g) && !GEOMETRIEN.includes(g)) F(ort, `Geometrie unbekannt: ${g}`);
  return { fehler, hinweise };
}

/* ── Ausgabe ───────────────────────────────────────────────────────── */
/** @param {{fehler: Meldung[], hinweise: Meldung[]}} erg @param {string} titel */
export function melde({ fehler, hinweise }, titel) {
  const zeilen = [`\n${titel}`];
  const gruppen = new Map();
  for (const h of hinweise) {
    const k = `Regel ${h.regel}: ${h.text}`;
    gruppen.set(k, (gruppen.get(k) ?? 0) + 1);
  }
  for (const [k, n] of gruppen) zeilen.push(`  · ${k}${n > 1 ? ` (×${n})` : ''}`);
  for (const f of fehler) zeilen.push(`  ✗ Regel ${f.regel} (${REGELN[f.regel]}): ${f.ort}: ${f.text}`);
  zeilen.push(fehler.length ? `  ${fehler.length} Verstoß/Verstöße` : '  keine Verstöße');
  return zeilen.join('\n');
}

/* ── Aufruf ────────────────────────────────────────────────────────── */
const HIER = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(HIER, '..');

/** Lädt Manifest und Transformation eines Adapters und erzeugt den Graphen. */
export async function ladeAdapter(/** @type {string} */ name) {
  const ordner = join(HIER, 'adapter', name);
  const manifest = JSON.parse(await readFile(join(ordner, 'manifest.json'), 'utf8'));
  const { transform } = await import(pathToFileURL(join(ordner, 'transform.mjs')).href);
  const roh = JSON.parse(await readFile(join(REPO, manifest.eingabe), 'utf8'));
  return { manifest, graph: transform(roh, manifest) };
}

async function main() {
  const arg = process.argv[2];
  let verstoesse = 0;
  const zaehle = (/** @type {any} */ erg, /** @type {string} */ titel) => {
    console.log(melde(erg, titel));
    verstoesse += erg.fehler.length;
  };
  if (arg) {
    const text = arg === '-' ? await new Promise(ok => {
      let s = ''; process.stdin.setEncoding('utf8');
      process.stdin.on('data', d => { s += d; }).on('end', () => ok(s));
    }) : await readFile(arg, 'utf8');
    zaehle(pruefe(JSON.parse(/** @type {string} */ (text))), arg === '-' ? 'Graph (stdin)' : arg);
  } else {
    const adapter = (await readdir(join(HIER, 'adapter'), { withFileTypes: true })).filter(d => d.isDirectory());
    for (const { name } of adapter) {
      const { manifest, graph } = await ladeAdapter(name);
      zaehle(pruefeManifest(manifest), `Manifest ${name}`);
      zaehle(pruefe(graph), `Graph ${name}: ${graph.bestaende.length} Bestände, ${graph.eintraege.length} Einträge, `
        + `${graph.prozesse.length} Prozesse, ${graph.relationen.length} Relationen`);
    }
  }
  process.exit(verstoesse ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
