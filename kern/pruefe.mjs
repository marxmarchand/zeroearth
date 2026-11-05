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
  STAPEL, UNTEREBENEN, SPHAEREN, stapelVon, UEBERGAENGE, GRUNDKRAEFTE, RICHTUNGEN, ZUFLUSSARTEN, AUSGANGSARTEN,
  KAPITALFORMEN, VORGAENGE, RUECKWIRKUNG, RELATIONSARTEN, VERWORFEN, TAUSCHVORGAENGE, MODI, formwechsel,
  ERHALTUNG, ROLLEN, BELEG_EINTRAGSEBENE, IDEAL_ARTEN, PRUEFARTEN, NAEHERUNG_VERTRITT,
  EREIGNIS_NATUREN, STATION_STATUS, STATION_OHNE_QUELLE, EREIGNIS_PFLICHT, STATION_FELDER,
  ARCHIVARTEN, HERKUNFTSARTEN, HERKUNFT_RANG, MODELL_MERKMALE, BEZUGSSYSTEME, KEIN_ERWARTUNGSTRAEGER, WISSENSSTATUS, GEOMETRIEN, MIT_VERZERRUNG,
  istFehlend, MANIFEST_PFLICHT, ZEITSEMANTIK_PFLICHT, REDUKTIONSSCHRITTE, SPANNWEITE,
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
  11: 'Reduktion im Manifest, Spannweite bei zusammengefassten Modellen',
  13: 'Mehrere Ideale werden alle gezeigt',
  15: 'Fiktion erkennbar und getrennt von echten Daten',
  16: 'Zeitangabe mit Bezugssystem und Unschärfe',
  B: 'Bestände und Formen',
  S: 'Struktur',
  M: 'Manifest',
  E: 'Ereignis',
});

/** @typedef {{regel: keyof typeof REGELN, ort: string, text: string}} Meldung */

const ORDNUNG = Object.keys(UNTEREBENEN).sort();
const istZahl = (/** @type {any} */ x) => typeof x === 'number' && Number.isFinite(x);
const istText = (/** @type {any} */ x) => typeof x === 'string' && x.trim() !== '';
/**
 * Regel 16: eine gemachte Zeitangabe. Fehlt die Zeit ganz ({fehlt, grund}), gilt Regel 8.
 * @param {any} z @param {string} ort @param {(regel: any, ort: string, text: string) => void} F
 */
function pruefeZeitangabe(z, ort, F) {
  if (istFehlend(z)) return;
  if (!z || typeof z !== 'object') return F(16, ort, 'Zeitangabe ist ein Objekt oder {fehlt, grund}');
  if ('skala' in z) F(16, ort, 'skala ist ersetzt durch bezugssystem');
  if (!(z.bezugssystem in BEZUGSSYSTEME)) F(16, ort, `Bezugssystem fehlt oder ist unbekannt: ${z.bezugssystem} (${Object.keys(BEZUGSSYSTEME).join(', ')})`);
  if (!istZahl(z.wert) && !(istZahl(z.von) && (istZahl(z.bis) || z.bis === 'offen')))
    F(16, ort, 'Zeitangabe braucht wert oder von und bis');
  const u = z.unschaerfe;
  if (u === undefined) F(16, ort, 'ohne Unschärfe; nennt die Quelle keine, heißt das {fehlt, grund}');
  else if (istFehlend(u)) { if (!istText(u.grund)) F(16, ort, 'Unschärfe fehlend ohne Grund'); }
  else {
    if (!istZahl(u?.plusminus) || u.plusminus < 0 || !istText(u?.quelle)) F(16, ort, 'Unschärfe braucht {plusminus, quelle} oder {fehlt, grund}');
    if (istZahl(z.aufloesung) && u?.plusminus === z.aufloesung) F(16, ort, 'Unschärfe gleich der Auflösung; die Auflösung ist nur eine Untergrenze, nie die Unschärfe');
  }
  if (z.aufloesung !== undefined && !istFehlend(z.aufloesung) && !(istZahl(z.aufloesung) && z.aufloesung > 0))
    F(16, ort, 'Auflösung ist eine positive Zahl oder {fehlt, grund}');
}

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
    if ('bezugszeit' in x) pruefeZeitangabe(x.bezugszeit, `${pfad}.bezugszeit`, F);
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

  /* ── Regel 13: Ideale ──────────────────────────────────────────── */
  const ideale = new Map(), gruppen = new Map();
  if (gr.ideale !== undefined && !Array.isArray(gr.ideale)) F(13, 'ideale', 'ideale ist eine Liste');
  else for (const i of gr.ideale ?? []) {
    if (!istText(i?.id)) { F(13, 'ideale', 'Ideal ohne id'); continue; }
    if (ideale.has(i.id)) F(13, i.id, 'Ideal doppelt');
    ideale.set(i.id, i);
    for (const k of ['name', 'gruppe', 'variante', 'gesetzt_in']) if (!istText(i[k])) F(13, i.id, `Ideal ohne ${k}`);
    if (!istText(i.begruendung) && !istFehlend(i.begruendung)) F(7, i.id, 'Ideal ohne Begründung; welches Ideal gilt, ist eine Setzung');
    if (istText(i.gruppe)) (gruppen.get(i.gruppe) ?? gruppen.set(i.gruppe, []).get(i.gruppe)).push(i.id);
  }
  for (const [g, ids] of gruppen) H(13, g, `${ids.length} Ideal(e) in der Gruppe: ${ids.join(', ')}`);
  /** Fehlende Mitglieder einer Gruppe, gemessen an den benutzten Idealen. */
  const unvollstaendig = (/** @type {Set<string>} */ benutzt) => [...new Set([...benutzt]
    .map(id => ideale.get(id)?.gruppe).filter(Boolean))]
    .flatMap(g => (gruppen.get(g) ?? []).filter(id => !benutzt.has(id)));

  /* ── Formationen ───────────────────────────────────────────────── */
  for (const f of formationen.values()) {
    if (!istText(f.name)) F('S', f.id, 'Formation ohne Namen');
    if (typeof f.warenproduktion !== 'boolean' && !istFehlend(f.warenproduktion))
      F('S', f.id, 'warenproduktion muss true, false oder fehlend sein');
    if (!f.gilt) F('S', f.id, 'Formation ohne Geltungszeit');
    else pruefeZeitangabe(f.gilt, `${f.id}.gilt`, F);
  }

  /* ── Bestände und Formen ───────────────────────────────────────── */
  for (const b of bestaende.values()) {
    if (!istText(b.name)) F('B', b.id, 'Bestand ohne Namen');
    if ('erhalten' in b) F('B', b.id, 'erhalten ist ersetzt durch erhaltung (erhalten, nicht_erhalten, vervielfaeltigbar)');
    if (!(b.erhaltung in ERHALTUNG)) F('B', b.id, `erhaltung unbekannt: ${b.erhaltung} (${Object.keys(ERHALTUNG).join(', ')})`);
    for (const k of ['haengt_an', 'verweist_auf']) {
      if (!(k in b) || istFehlend(b[k])) continue;
      if (!Array.isArray(b[k]) || !b[k].length) F('B', b.id, `${k} muss eine nichtleere Liste oder fehlend sein`);
      else for (const t of b[k]) if (!eintraege.has(t)) F('B', b.id, `${k} verweist auf Unbekanntes: ${t}`);
    }
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
    // Regel 2 auch für Bestände: Daten und andere Bestände der 2. Natur hängen an einem Träger.
    if (orte.size === 1 && orte.has('Stapel 2') && !('haengt_an' in b))
      F(2, b.id, 'Bestand der 2. Natur ohne haengt_an; ein fehlender Träger wird als fehlend geführt');
    else if (!orte.has('Stapel 2') && 'haengt_an' in b) F(2, b.id, 'haengt_an nur für Bestände der 2. Natur');
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
    if ('sphaere' in e) {
      if (e.stapel !== '1.1') F('S', e.id, 'sphaere gibt es nur in 1.1');
      else if (!SPHAEREN.includes(e.sphaere)) F('S', e.id, `Sphäre unbekannt: ${e.sphaere}`);
    }

    // Regel 1: keine Relationen im Eintrag, keine Identität über Stapel
    if ('identisch_mit' in e) F(1, e.id, VERWORFEN.identitaet);
    if ('verweist_auf' in e) {
      if (!Array.isArray(e.verweist_auf) || !e.verweist_auf.length) F('S', e.id, 'verweist_auf muss eine nichtleere Liste sein');
      else for (const t of e.verweist_auf) if (!eintraege.has(t)) F('S', e.id, `verweist_auf verweist auf Unbekanntes: ${t}`);
    }
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
          F(2, e.id, 'Formationsverweis ist zeitgebunden: {id, bezugssystem, von, bis, unschaerfe}');
        else pruefeZeitangabe(e.formation, `${e.id}.formation`, F);
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
      if (wo?.naeherung !== undefined) {
        const n = wo.naeherung;
        if (!NAEHERUNG_VERTRITT.includes(n?.vertritt)) F(10, e.id, `Näherung: vertritt muss ${NAEHERUNG_VERTRITT.join(' oder ')} sein`);
        if (!istText(n?.angabe)) F(10, e.id, 'Näherung ohne Angabe, was vertreten wird');
        const fl = wo.verzerrung?.flaeche;
        if (n?.vertritt === 'flaeche' && !istZahl(fl) && !istFehlend(fl))
          F(10, e.id, 'Näherung einer Fläche: Flächenverzerrung als Zahl oder fehlend mit Grund');
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
    const benutzteIdeale = new Set();
    for (const [k, g] of Object.entries(e.werte)) {
      const ort = `${e.id}#${k}`;
      if (istFehlend(g)) continue;
      const idealeDerGroesse = new Set((g?.punkte ?? []).flatMap((/** @type {any} */ p) => (p?.fassungen ?? [])
        .map((/** @type {any} */ f) => f?.woher?.ideal)).filter((/** @type {any} */ x) => x !== undefined));
      if (idealeDerGroesse.size > 1) F(13, ort, `eine Größe, ein Ideal: hier ${[...idealeDerGroesse].join(', ')}; Varianten stehen in eigenen Größen`);
      idealeDerGroesse.forEach(i => benutzteIdeale.add(i));
      if (!istText(g?.einheit)) F('S', ort, 'ohne Einheit');
      if (!Array.isArray(g?.punkte)) { F('S', ort, 'ohne punkte'); continue; }
      if (g.zeitsemantik) {
        const z = g.zeitsemantik;
        if (!istZahl(z.schritte)) F('S', ort, 'zeitsemantik ohne Schrittzahl');
        else if (g.punkte.length !== z.schritte)
          F(8, ort, `${g.punkte.length} Punkte bei ${z.schritte} Schritten; Lücken werden als fehlend geführt, nicht weggelassen`);
        if (!(z.bezugssystem in BEZUGSSYSTEME)) F(16, ort, `zeitsemantik: Bezugssystem fehlt oder ist unbekannt: ${z.bezugssystem}`);
        if (!('unschaerfe' in z)) F(16, ort, 'zeitsemantik ohne Unschärfe; nennt die Quelle keine, heißt das {fehlt, grund}');
      }
      g.punkte.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
        const po = `${ort}[${i}]`;
        if (e.stapel === '0.1') { if (p?.bezugszeit) F('S', po, '0.1 ist ohne Zeit'); }
        else if (!p?.bezugszeit) F('S', po, 'ohne Bezugszeit');
        pruefeFassungen(p?.fassungen, po);
      });
    }
    for (const fehlt of unvollstaendig(benutzteIdeale))
      F(13, e.id, `Ideal ${fehlt} fehlt; konkurrierende Ideale werden alle gezeigt, auch wo sie zusammenfallen`);
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
      pruefeSpannweite(f, fo);
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
    if (arten.includes('idealisiert') && !arten.includes('modell')) F(6, ort, 'idealisiert ohne modell; das Merkmal gehört zur Idealschicht');
    if (arten.includes('berechnet') && !arten.includes('modell')) F(6, ort, 'berechnet ohne modell; das Merkmal gehört zu einem Modellergebnis');
    if (arten.includes('modell') && !MODELL_MERKMALE.some(m => arten.includes(m))) F(6, ort, 'modell ohne Merkmal idealisiert oder berechnet; Modellergebnisse bilden die Idealschicht');
    if (arten.includes('fiktion') && arten.some((/** @type {any} */ a) => HERKUNFT_RANG.includes(a)) && !w.abgeleitet_aus?.length)
      F(15, ort, 'fiktion neben echter Herkunft nur an abgeleiteten Werten (abgeleitet_aus); sonst verwischt die Grenze');
    if (w.konfidenz !== undefined) {
      const k = w.konfidenz;
      if (!istText(k?.skala) || !istText(k?.stufe)) F(6, ort, 'Konfidenz der Quelle braucht {skala, stufe} als Text');
      if (typeof k === 'number' || istZahl(k?.stufe) || istZahl(k?.wert) || 'wahrscheinlichkeit' in (k ?? {}))
        F(4, ort, 'Konfidenz als Zahl wäre eine Wahrscheinlichkeit; sie steht in den Stufen der Quelle, als Text');
    }
    if (w.ideal !== undefined) {
      if (!ideale.has(w.ideal)) F(13, ort, `Ideal unbekannt: ${w.ideal}`);
      if (!IDEAL_ARTEN.some(a => arten.includes(a))) F(13, ort, 'Ideal an einem Wert ohne modell oder rekonstruktion; eine Beobachtung ist kein Ideal');
    }
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

  /** Regel 11: Mehrere Modelle zusammengefasst heißt Spannweite mitführen.
      @param {any} f @param {string} ort */
  function pruefeSpannweite(f, ort) {
    const modelle = f.woher?.modelle;
    if (modelle === undefined) {
      if (f.spannweite !== undefined) F(11, ort, 'Spannweite ohne woher.modelle; unklar, worüber sie reicht');
      return;
    }
    if (!Array.isArray(modelle) || !modelle.length || !modelle.every(istText))
      return F(11, ort, 'woher.modelle muss eine nichtleere Liste von Namen sein');
    if (modelle.length < 2 || istFehlend(f.wert)) return;
    const sw = f.spannweite;
    if (!sw || !SPANNWEITE.every(k => istZahl(sw[k])))
      return F(11, ort, `${modelle.length} Modelle zusammengefasst ohne Spannweite {min, max}; die Uneinigkeit der Modelle ist selbst eine Aussage`);
    if (sw.min > sw.max) F(11, ort, 'Spannweite: min größer als max');
    else if (istZahl(f.wert) && (f.wert < sw.min || f.wert > sw.max)) F(11, ort, 'Wert liegt außerhalb seiner Spannweite');
  }

  /** Regel 6: Beleg pro Relation, oder ausgewiesen nur auf Eintragsebene.
      @param {any} b @param {string} ort */
  function pruefeBeleg(b, ort) {
    if (b === undefined) return F(6, ort, 'Relation ohne beleg; Quellen, nur auf Eintragsebene, oder {fehlt, grund}');
    if (istFehlend(b)) return;
    const quellen = (/** @type {any} */ q) => Array.isArray(q) && q.length > 0 && q.every(istText);
    if (Array.isArray(b)) { if (!quellen(b)) F(6, ort, 'beleg: nichtleere Liste von Quellen'); return; }
    if (b?.ebene !== BELEG_EINTRAGSEBENE)
      return F(6, ort, `beleg ist eine Liste von Quellen, {ebene: "${BELEG_EINTRAGSEBENE}", eintrag, quellen} oder fehlend`);
    if (!eintraege.has(b.eintrag)) F(6, ort, `beleg auf Eintragsebene verweist auf Unbekanntes: ${b.eintrag}`);
    if (!quellen(b.quellen)) F(6, ort, 'beleg auf Eintragsebene ohne Quellen; ohne Quellen heißt {fehlt, grund}');
    H(6, ort, 'Beleg nur auf Eintragsebene: nicht pro Beziehung belegt');
  }

  /** Regel 5: Welche Größen die Bilanzseiten tragen; „unabhängig“ nur bei verschiedenen Quellen.
      @param {any} bz @param {string} ort */
  function pruefeSeiten(bz, ort) {
    if (bz.aus === undefined) {
      if (bz.pruefart === 'unabhaengige_beobachtung') F(5, ort, 'Prüfart unabhängig ohne Angabe der Seiten (aus); die Unabhängigkeit ist so nicht prüfbar');
      return;
    }
    const quellen = (/** @type {any} */ ref) => {
      const g = groesse(ref);
      if (g === undefined || istFehlend(g)) { F(5, ort, `Bilanzseite unbekannt oder fehlend: ${ref}`); return new Set(); }
      return new Set(g.punkte.flatMap((/** @type {any} */ p) => p.fassungen.map((/** @type {any} */ f) => f.woher?.quelle)));
    };
    const zu = quellen(bz.aus.zufluss);
    const ab = new Set((Array.isArray(bz.aus.abfluss) ? bz.aus.abfluss : []).flatMap(r => [...quellen(r)]));
    const gemeinsam = [...zu].filter(q => ab.has(q));
    if (bz.pruefart === 'unabhaengige_beobachtung' && gemeinsam.length)
      F(5, ort, `als unabhängig ausgewiesen, beide Seiten aus derselben Quelle (${gemeinsam[0]}); das ist innere Stimmigkeit`);
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
  // Regel 13: Relationen mit Ideal kommen für alle Ideale ihrer Gruppe vor
  const relIdeale = new Map();
  for (const r of relationen.values()) if (r.woher?.ideal !== undefined) {
    const k = `${r.art}|${JSON.stringify(r.von)}|${JSON.stringify(r.nach)}`;
    (relIdeale.get(k) ?? relIdeale.set(k, new Set()).get(k)).add(r.woher.ideal);
  }
  for (const [k, benutzt] of relIdeale)
    for (const fehlt of unvollstaendig(benutzt)) F(13, k.split('|')[0] + ' ' + k.split('|').slice(1).join(' → '), `Ideal ${fehlt} fehlt bei dieser Relation`);

  /** Höhe eines Eintrags: erst Stapel, dann Unterebene. */
  const hoehe = (/** @type {any} */ e) => [Number(stapelVon(e.stapel)), ORDNUNG.indexOf(e.stapel)];
  for (const r of relationen.values()) {
    const o = r.id;
    if (!RELATIONSARTEN.includes(r.art)) {
      F(1, o, r.art in VERWORFEN ? /** @type {any} */ (VERWORFEN)[r.art] : `Relationsart unbekannt: ${r.art}`);
      continue;
    }
    // Ein Ende darf fehlend sein (mit Grund), nicht beide.
    const vonFehlt = istFehlend(r.von), nachFehlt = istFehlend(r.nach);
    if (vonFehlt && nachFehlt) F(1, o, 'beide Enden fehlend; eine Relation braucht mindestens ein bekanntes Ende');
    const von = vonFehlt ? undefined : eintraege.get(r.von) ?? prozesse.get(r.von);
    const nach = nachFehlt ? undefined : eintraege.get(r.nach) ?? prozesse.get(r.nach);
    if (!von && !vonFehlt) F(1, o, `von verweist auf Unbekanntes: ${r.von}`);
    if (!nach && !nachFehlt) F(1, o, `nach verweist auf Unbekanntes: ${r.nach}`);
    if (r.prozess !== undefined && !prozesse.has(r.prozess)) F(1, o, `Prozess unbekannt: ${r.prozess}`);
    if (!r.woher) F(1, o, 'Relation ohne eigene Herkunft');
    else {
      if (/stapel\s*(position|reihenfolge)|stapelposition|stapelreihenfolge/i.test(String(r.woher.quelle)))
        F(1, o, 'aus der Stapelposition abgeleitet; Relationen werden gespeichert, nicht abgeleitet');
      pruefeWoher(r.woher, o);
    }
    pruefeWissensstand(r.wissensstand, o);
    if (!('bezugszeit' in r)) F(8, o, 'Relation ohne Bezugszeit; unbekannt heißt {fehlt, grund}');
    pruefeBeleg(r.beleg, o);

    if (r.art === 'rolle') {
      if (!ROLLEN.includes(r.als)) F('S', o, `Rolle ohne "als" (${ROLLEN.join(', ')})`);
      if (!nachFehlt && nach && !prozesse.has(r.nach)) F('S', o, 'eine Rolle spannt in einen Prozess ein: nach ist ein Prozess');
    } else if ('als' in r) F('S', o, '"als" nur bei Rollen');
    if ('ware' in r) {
      if (!TAUSCHVORGAENGE.includes(r.art)) F('S', o, `Ware nur bei Tausch (${TAUSCHVORGAENGE.join(', ')})`);
      else if (!istFehlend(r.ware) && !eintraege.has(r.ware)) F('S', o, `Ware verweist auf Unbekanntes: ${r.ware}`);
    }

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
        const zulaessig = formwechsel(b.erhaltung);
        if (zulaessig.length && !zulaessig.includes(r.art))
          F('B', o, `Formwechsel eines Bestands mit erhaltung ${b.erhaltung} ist ${zulaessig.join(' oder ')}, nicht ${r.art}`);
      }
    }

    // Regel 5
    const kopierbar = bestaende.get(r.bestand)?.erhaltung === 'vervielfaeltigbar';
    if (kopierbar) {
      if (r.bilanz !== undefined || r.bilanzierbar === true)
        F(5, o, 'Formwechsel eines vervielfältigbaren Bestands ist nicht bilanzierbar; Kopieren mindert das Original nicht');
    } else if (r.art === 'stoffwechsel') {
      const bz = r.bilanz;
      if (!bz) F(5, o, 'Stoffwechsel ohne Bilanz; unbekannte Mengen werden als fehlend geführt');
      else {
        if (!istText(bz.einheit)) F(5, o, 'Bilanz ohne Einheit');
        const mengen = [bz.zufluss, ...(Array.isArray(bz.abfluss) ? bz.abfluss : [bz.abfluss])];
        if (mengen.some(istFehlend)) H(5, o, 'Bilanz nicht prüfbar: Mengen fehlen');
        else if (!mengen.every(istZahl)) F(5, o, 'Bilanz braucht Zahlen oder fehlend');
        else {
          const rest = bz.zufluss - bz.abfluss.reduce((/** @type {number} */ s, /** @type {number} */ x) => s + x, 0);
          const art = /** @type {any} */ (PRUEFARTEN)[bz.pruefart];
          if (!art) F(5, o, `Bilanz ohne Prüfart (${Object.keys(PRUEFARTEN).join(' oder ')}); innere Stimmigkeit ist nicht Modell gegen Welt`);
          pruefeSeiten(bz, o);
          const anteil = bz.zufluss ? ` (${(rest / bz.zufluss * 100).toFixed(1)} %)` : '';
          if (Math.abs(rest) > (bz.toleranz ?? 0)) F(5, o, `Bilanz nicht geschlossen: Rest ${rest} ${bz.einheit}${anteil}`);
          else if (art) H(5, o, `Bilanz geschlossen, ${art}: Rest ${rest.toPrecision(3)} ${bz.einheit}${anteil}, Toleranz ${(bz.toleranz ?? 0).toPrecision(3)}`);
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
  if (m.zeitsemantik && !istFehlend(m.zeitsemantik)) {
    for (const k of ZEITSEMANTIK_PFLICHT) if (!(k in m.zeitsemantik)) fehler.push({ regel: 16, ort, text: `zeitsemantik.${k} fehlt` });
    const b = m.zeitsemantik.bezugssystem;
    if (b !== undefined && !istFehlend(b) && !(b in BEZUGSSYSTEME)) fehler.push({ regel: 16, ort, text: `Bezugssystem unbekannt: ${b}` });
  }
  for (const g of [m.geometrie].flat()) if (g !== undefined && !istFehlend(g) && !GEOMETRIEN.includes(g)) F(ort, `Geometrie unbekannt: ${g}`);
  if (m.herkunft && !istFehlend(m.herkunft)) {
    const arten = m.herkunft.arten ?? [];
    if (MODELL_MERKMALE.some(k => arten.includes(k)) !== arten.includes('modell'))
      F(ort, 'herkunft: modell gehört mit idealisiert oder berechnet zusammen (Idealschicht)');
    if (arten.includes('fiktion') && arten.length > 1)
      fehler.push({ regel: 15, ort, text: 'ein Adapter mit fiktion führt im Manifest nur fiktion; echte Eingaben stehen in der Herkunftskette' });
  }

  // Regel 11: Reduktion
  const R = (/** @type {string} */ text) => fehler.push({ regel: 11, ort, text });
  if (istFehlend(m.reduktion)) R('reduktion ist nie fehlend: der Adapter reduziert selbst; nichts reduziert heißt []');
  else if (m.reduktion !== undefined && !Array.isArray(m.reduktion)) R('reduktion ist eine Liste von Schritten {schritt, angabe}');
  else if (Array.isArray(m.reduktion)) {
    if (!m.reduktion.length) hinweise.push({ regel: 11, ort, text: 'keine Reduktion: Quelle unverändert übernommen' });
    m.reduktion.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
      const o = `reduktion[${i}]`;
      if (!REDUKTIONSSCHRITTE.includes(r?.schritt)) R(`${o}: Schritt unbekannt: ${r?.schritt} (${REDUKTIONSSCHRITTE.join(', ')})`);
      if (!istText(r?.angabe)) R(`${o}: ohne Angabe, etwa "0.5° -> 2°"`);
      if (r?.schritt !== 'zusammenfassen') return;
      if (!Array.isArray(r.modelle) || !r.modelle.length || !r.modelle.every(istText))
        R(`${o}: zusammenfassen nennt die Modelle nicht (modelle: [...])`);
      else if (r.modelle.length > 1) {
        const mit = Array.isArray(r.mitgefuehrt) ? r.mitgefuehrt : [];
        const fehlen = SPANNWEITE.filter(k => !mit.includes(k));
        if (fehlen.length) R(`${o}: ${r.modelle.length} Modelle zusammengefasst, es fehlt ${fehlen.join(' und ')}; die Spannweite erscheint, nicht nur der Mittelwert`);
      }
    });
  }
  return { fehler, hinweise };
}

/**
 * Vergleicht die Herkunft jedes Werts im Graphen mit dem Manifest des Adapters:
 * Eine Art, die im Manifest fehlt, ist ein Verstoß. Je Art eine Meldung mit
 * Anzahl und erster Fundstelle, sonst stünde sie bei jedem Wert einzeln.
 * @param {any} gr Graph
 * @param {any} m Manifest
 * @returns {{fehler: Meldung[], hinweise: Meldung[]}}
 */
export function pruefeHerkunftGegenManifest(gr, m) {
  /** @type {Meldung[]} */ const fehler = [];
  /** @type {Meldung[]} */ const hinweise = [];
  const ort = `manifest ${m?.id ?? '?'}`;
  if (!m?.herkunft || istFehlend(m.herkunft)) {
    hinweise.push({ regel: 'M', ort, text: 'Herkunft im Manifest fehlend; die Herkunft der Werte ist nicht vergleichbar' });
    return { fehler, hinweise };
  }
  const erlaubt = new Set(Array.isArray(m.herkunft.arten) ? m.herkunft.arten : []);
  /** @type {Map<string, {anzahl: number, erste: string}>} */ const fremd = new Map();
  const durchlaufe = (/** @type {any} */ x, /** @type {string} */ pfad) => {
    if (!x || typeof x !== 'object') return;
    if (x.woher && Array.isArray(x.woher.arten)) for (const a of x.woher.arten) {
      if (erlaubt.has(a)) continue;
      const f = fremd.get(a) ?? fremd.set(a, { anzahl: 0, erste: pfad }).get(a);
      if (f) f.anzahl++;
    }
    for (const [k, v] of Object.entries(x)) durchlaufe(v, Array.isArray(x) ? `${pfad}[${k}]` : `${pfad}.${k}`);
  };
  durchlaufe(gr, 'graph');
  for (const [art, { anzahl, erste }] of fremd)
    fehler.push({ regel: 'M', ort, text: `Herkunftsart ${art} kommt an ${anzahl} Wert(en) vor, fehlt aber im Manifest (zuerst ${erste})` });
  return { fehler, hinweise };
}

/**
 * Prüft ein Ereignis: alle Naturen als Station, Stationen nur mit Verweisen,
 * ohne Quelle nur als fehlt/bewusst_leer mit Begründung, Auswahl begründet.
 * @param {any} ev Ereignis
 * @param {{adapter: Set<string>, graphen?: Map<string, any>}} kontext bekannte Adapter und ihre Graphen
 * @returns {{fehler: Meldung[], hinweise: Meldung[]}}
 */
export function pruefeEreignis(ev, { adapter, graphen = new Map() }) {
  /** @type {Meldung[]} */ const fehler = [];
  /** @type {Meldung[]} */ const hinweise = [];
  const F = (/** @type {any} */ regel, /** @type {string} */ ort, /** @type {string} */ text) => fehler.push({ regel, ort, text });
  const H = (/** @type {any} */ regel, /** @type {string} */ ort, /** @type {string} */ text) => hinweise.push({ regel, ort, text });
  const ort = `ereignis ${ev?.ereignis ?? '?'}`;
  if (!ev || typeof ev !== 'object') { F('E', ort, 'kein Objekt'); return { fehler, hinweise }; }
  for (const k of EREIGNIS_PFLICHT) if (!(k in ev)) F(k === 'auswahl_begruendung' ? 7 : 'E', ort, `Pflichtfeld "${k}" fehlt`);
  for (const k of ['ereignis', 'satz', 'autor', 'stand']) if (k in ev && !istText(ev[k])) F('E', ort, `${k} ist ein Text`);
  // Regel 7: Orte und Zeitfenster sind eine Setzung
  if ('auswahl_begruendung' in ev && !istText(ev.auswahl_begruendung))
    F(7, ort, 'auswahl_begruendung ist Pflicht: Orte und Zeitfenster sind eine Setzung und werden begründet');
  if ('zeitfenster' in ev) {
    if (istFehlend(ev.zeitfenster)) F('E', ort, 'zeitfenster ist Pflicht: Es ist die Setzung, die das Ereignis schneidet');
    else pruefeZeitangabe(ev.zeitfenster, `${ort} · zeitfenster`, F);
  }
  if ('brueche' in ev) {
    if (istFehlend(ev.brueche)) { if (!istText(ev.brueche.grund)) F(8, ort, 'brueche fehlend ohne Grund'); else H(8, ort, `Brüche fehlen: ${ev.brueche.grund}`); }
    else if (!Array.isArray(ev.brueche) || !ev.brueche.length) F('E', ort, 'brueche ist eine nichtleere Liste oder {fehlt, grund}');
  }

  /** Verweis "adapter-graph-id" oder "eintrag#groesse" im Graphen eines Adapters auflösen. */
  const findet = (/** @type {any} */ g, /** @type {string} */ ref) => {
    const [id, k] = ref.split('#');
    const e = g.eintraege.find((/** @type {any} */ x) => x.id === id);
    if (k !== undefined) return !!e?.werte?.[k];
    return !!e || ['relationen', 'prozesse', 'bestaende'].some(t => g[t].some((/** @type {any} */ x) => x.id === id));
  };
  if ('orte' in ev) {
    if (!Array.isArray(ev.orte) || !ev.orte.length) F('E', ort, 'orte ist eine nichtleere Liste');
    else for (const o of ev.orte) {
      if (!istText(o?.name)) F('E', ort, 'Ort ohne Namen');
      if (o?.verweis !== undefined) {
        const [a, id] = String(o.verweis).split(':');
        if (!adapter.has(a)) F('E', ort, `Ort verweist auf unbekannten Adapter: ${a}`);
        else if (id && graphen.has(a) && !findet(graphen.get(a), id)) F('E', ort, `Ort verweist auf Unbekanntes: ${o.verweis}`);
      }
    }
  }

  if (!Array.isArray(ev.stationen)) { F('E', ort, 'stationen ist eine Liste'); return { fehler, hinweise }; }
  const vorkommend = new Set();
  ev.stationen.forEach((/** @type {any} */ st, /** @type {number} */ i) => {
    const so = `${ort} · Station ${i + 1} (${st?.natur ?? '?'})`;
    if (!EREIGNIS_NATUREN.includes(st?.natur)) F('E', so, `Natur unbekannt: ${st?.natur} (${EREIGNIS_NATUREN.join(', ')})`);
    else vorkommend.add(st.natur);
    if (!istText(st?.frage)) F('E', so, 'Station ohne Frage');
    if (!STATION_STATUS.includes(st?.status)) F('E', so, `Status unbekannt: ${st?.status} (${STATION_STATUS.join(', ')})`);
    // Keine Daten: nur Verweise und Text
    for (const k of Object.keys(st ?? {}))
      if (!(/** @type {readonly string[]} */ (STATION_FELDER)).includes(k)) F('E', so, `Feld "${k}": Stationen enthalten keine Daten, nur Verweise auf Adapter`);
    for (const k of ['frage', 'begruendung'])
      if (st?.[k] !== undefined && typeof st[k] !== 'string') F('E', so, `${k} ist ein Text, keine Daten`);
    if (st?.quelle === undefined) F('E', so, 'quelle fehlt; ohne Quelle heißt null');
    else if (st.quelle === null) {
      if (!STATION_OHNE_QUELLE.includes(st.status))
        F(8, so, `ohne Quelle nur als ${STATION_OHNE_QUELLE.join(' oder ')}, nicht "${st.status}"`);
      if (!istText(st.begruendung)) F(8, so, 'ohne Quelle braucht eine Begründung');
      if (st.verweise !== undefined) F('E', so, 'Verweise ohne Quelle');
      if (st.vorgemerkt !== undefined) {
        const v = st.vorgemerkt;
        if (!istText(v?.quelle) || !istText(v?.ort)) F('E', so, 'vorgemerkt braucht quelle und ort');
        if (!('lizenz' in (v ?? {}))) F('E', so, 'vorgemerkt ohne lizenz; ungeklärt heißt {fehlt, grund}');
        if (!Array.isArray(v?.arten) || !v.arten.length || !v.arten.every((/** @type {any} */ a) => HERKUNFTSARTEN.includes(a)))
          F('E', so, 'vorgemerkt braucht arten aus den Herkunftsarten');
      }
    } else {
      if (st.vorgemerkt !== undefined) F('E', so, 'vorgemerkt nur an einer Station ohne Quelle');
      if (typeof st.quelle !== 'string') F('E', so, 'quelle ist der Name eines Adapters oder null, keine Daten');
      else if (!adapter.has(st.quelle)) F('E', so, `quelle verweist auf unbekannten Adapter: ${st.quelle}`);
      if (STATION_OHNE_QUELLE.includes(st.status)) F('E', so, `Status "${st.status}", aber mit Quelle ${st.quelle}`);
      if (st.status === 'in_arbeit' && !istText(st.begruendung)) H('E', so, 'in Arbeit ohne Begründung, was noch fehlt');
      if (st.verweise !== undefined) {
        if (!Array.isArray(st.verweise) || !st.verweise.every(istText)) F('E', so, 'verweise ist eine Liste von Ids im Graphen des Adapters');
        else if (graphen.has(st.quelle))
          for (const v of st.verweise) if (!findet(graphen.get(st.quelle), v)) F('E', so, `Verweis unbekannt im Adapter ${st.quelle}: ${v}`);
      }
    }
  });
  for (const n of EREIGNIS_NATUREN)
    if (!vorkommend.has(n)) F(8, ort, `Natur ${n} fehlt als Station; jede Natur kommt vor, auch leer (status fehlt oder bewusst_leer)`);
  const zahl = (/** @type {string} */ s) => ev.stationen.filter((/** @type {any} */ x) => x?.status === s).length;
  H('E', ort, `${ev.stationen.length} Stationen: ${STATION_STATUS.map(s => `${zahl(s)} ${s}`).join(', ')}`);
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
  // weitere Eingaben eines Adapters, etwa abgeleitete Zusatzdateien
  const zusatz = Object.fromEntries(await Promise.all(Object.entries(manifest.zusatz ?? {})
    .map(async ([k, pfad]) => [k, JSON.parse(await readFile(join(REPO, /** @type {string} */ (pfad)), 'utf8'))])));
  return { manifest, graph: transform(roh, manifest, zusatz) };
}

/** Alle Ereignisse unter kern/ereignisse/. */
export async function ladeEreignisse() {
  const ordner = join(HIER, 'ereignisse');
  let dateien = [];
  try { dateien = (await readdir(ordner)).filter(f => f.endsWith('.json')).sort(); } catch { return []; }
  return Promise.all(dateien.map(async datei => ({ datei, inhalt: JSON.parse(await readFile(join(ordner, datei), 'utf8')) })));
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
    const graphen = new Map();
    for (const { name } of adapter) {
      const { manifest, graph } = await ladeAdapter(name);
      graphen.set(name, graph);
      zaehle(pruefeManifest(manifest), `Manifest ${name}`);
      zaehle(pruefeHerkunftGegenManifest(graph, manifest), `Herkunft ${name} gegen Manifest`);
      zaehle(pruefe(graph), `Graph ${name}: ${graph.bestaende.length} Bestände, ${graph.eintraege.length} Einträge, `
        + `${graph.prozesse.length} Prozesse, ${graph.relationen.length} Relationen`);
    }
    for (const ev of await ladeEreignisse())
      zaehle(pruefeEreignis(ev.inhalt, { adapter: new Set(graphen.keys()), graphen }), `Ereignis ${ev.datei}`);
  }
  process.exit(verstoesse ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
