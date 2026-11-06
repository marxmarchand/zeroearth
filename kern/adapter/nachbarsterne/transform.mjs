// @ts-check
/* Nachbarsterne (0.2): Sterne aus Gaia DR3 (beobachtung), gemeldete Planeten mit
   allen Deutungen nebeneinander (Regel 13). Der Abstand wird nicht gespeichert,
   nur in der Anzeige aus der Parallaxe gerechnet. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'nachbarsterne';
const WISSENSSTAND = fehlt('Die Quelle nennt nicht, seit wann die Werte so bekannt sind');

/** @param {any} roh data/nachbarsterne.json @param {any} manifest */
export function transform(roh, manifest) {
  const MI = manifest.ideale, archivkette = manifest.herkunft.archivkette;
  const zeit = (/** @type {number} */ jahr, /** @type {any} */ u) => ({ bezugssystem: 'a_ce', wert: jahr, unschaerfe: u });
  const gaiaZeit = zeit(2016, roh.zeit.unschaerfe);
  /** @param {any} wert @param {string} einheit @param {any} woher @param {any} bz @param {any} [u] */
  const g = (wert, einheit, woher, bz, u) => wert === null || wert === undefined
    ? fehlt('Gaia DR3 führt den Wert für diesen Stern nicht')
    : { einheit, punkte: [{ bezugszeit: bz, fassungen: [{ wert, wissensstand: WISSENSSTAND, woher: { archivkette, ...woher }, ...(u !== undefined ? { unschaerfe: u } : {}) }] }] };
  const ideale = Object.entries(MI.varianten).map(([k, v]) => ({ id: `${P}/ideal/${k}`, name: /** @type {any} */ (v).name, gruppe: MI.gruppe,
    variante: /** @type {any} */ (v).variante, gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung }));
  const sterne = roh.sterne.map((/** @type {any} */ s) => {
    const G = s.gaia, w = { arten: s.arten, quelle: `${s.quelle}, source_id ${s.gaia_source_id}; ${s.abruf}` };
    return { id: `${P}/${s.id}`, stapel: '0.2', name: s.name, auswahl: [`${P}/auswahl/sterne`],
      werte: {
        ra: g(G.ra_grad, 'grad', w, gaiaZeit), dec: g(G.dec_grad, 'grad', w, gaiaZeit),
        parallaxe: g(G.parallaxe_mas, 'mas', w, gaiaZeit, G.parallaxe_unschaerfe_mas),
        helligkeit_g: g(G.g_mag, 'mag', w, gaiaZeit),
        radialgeschwindigkeit: g(G.rv_km_s, 'km/s', w, gaiaZeit),
        spektraltyp: s.spektraltyp.fehlt ? fehlt(s.spektraltyp.grund) : g(s.spektraltyp.wert, 'klasse', { arten: s.spektraltyp.arten, quelle: s.spektraltyp.quelle, hinweis: s.spektraltyp.hinweis }, gaiaZeit),
      } };
  });
  const planeten = roh.planeten.map((/** @type {any} */ p) => {
    /** @type {Record<string, any>} */
    const werte = {};
    for (const d of p.deutungen) {
      const jahr = Number((d.quelle.match(/(\d{4})/) ?? [])[1]);
      werte[`deutung_${d.ideal}`] = g(d.wert, 'deutung', { arten: d.arten, quelle: d.quelle, hinweis: d.hinweis, ideal: `${P}/ideal/${d.ideal}` },
        zeit(jahr, fehlt('Erscheinungsjahr des Artikels; Beobachtungszeitraum nicht übernommen')));
    }
    return { id: `${P}/${p.id}`, stapel: '0.2', name: `${p.name} · ${p.status}`, auswahl: [`${P}/auswahl/sterne`], werte };
  });
  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [{ id: `${P}/auswahl/sterne`, was: 'Bisher nur 40 Eridani A und der gemeldete Planet 40 Eri b', gesetzt_in: 'Auftrag Teil D (2026-11-06)',
      begruendung: 'Erster Eintrag für das Rocky-Gerüst; weitere Nachbarsterne fehlen noch' }],
    ideale,
    bestaende: [],
    eintraege: [...sterne, ...planeten, { id: `${P}/weitere`, stapel: '0.2', name: 'Weitere Nachbarsterne', wo: fehlt(roh.weitere.grund), werte: {} }],
    prozesse: [], relationen: [],
  };
}
