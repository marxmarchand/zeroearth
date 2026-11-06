// @ts-check
/* Planeten und Titan (0.3, solarer Raum): Zustandswerte mit Herkunft je Wert und
   Texturen. Was die Quelle nicht hat, steht als fehlt mit Grund (Regel 8). */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'planeten';
const WISSENSSTAND = fehlt('Die Quelle nennt nicht, seit wann die Werte so bekannt sind');

/** @param {any} roh data/planeten.json @param {any} manifest */
export function transform(roh, manifest) {
  const archivkette = manifest.herkunft.archivkette;
  const heute = { bezugssystem: 'a_ce', wert: 2025, unschaerfe: roh.zeit.unschaerfe };
  const huygens = { bezugssystem: 'a_ce', wert: 2005.036, unschaerfe: { plusminus: 0.001, quelle: 'Landung von Huygens am 14.01.2005, rund eine halbe Stunde Messung am Boden' } };
  /** Ein Wert der Quelle als Größe mit einem Punkt. @param {any} w @param {any} zeit */
  const groesse = (w, zeit) => {
    if (!w || w.fehlt) return fehlt(w?.grund ?? 'Die Quelle nennt den Wert nicht');
    const woher = { arten: w.arten, quelle: w.quelle ?? roh.quelle.name, archivkette,
      ...(w.verfahren ? { verfahren: w.verfahren } : {}), ...(w.hinweis ? { hinweis: w.hinweis } : {}) };
    return { einheit: w.einheit, punkte: [{ bezugszeit: zeit, fassungen: [{ wert: w.wert, wissensstand: WISSENSSTAND, woher,
      ...(w.bezug ? { bezug: w.bezug } : {}), ...(w.unschaerfe ? { unschaerfe: w.unschaerfe } : {}) }] }] };
  };
  const eintraege = roh.koerper.map((/** @type {any} */ k) => {
    const zeit = (/** @type {any} */ w) => (w?.quelle ?? '').includes('Huygens') ? huygens : heute;
    /** @type {Record<string, any>} */
    const werte = {};
    for (const g of ['druck', 'temperatur', 'schwerkraft', 'tag']) werte[g] = groesse(k[g], zeit(k[g]));
    if (k.druck?.zusatz) werte.druck_landeplatz = groesse({ ...k.druck.zusatz, wert: k.druck.zusatz.wert[1] }, heute);
    werte.skalenhoehe = k.huelle ? groesse(k.huelle.skalenhoehe, heute) : fehlt('Keine Atmosphäre im engeren Sinn (Exosphäre)');
    const z = k.zusammensetzung;
    for (const s of z.liste) {
      const name = `anteil_${s.stoff.replace(/[₀-₉]/g, (/** @type {string} */ c) => String(c.charCodeAt(0) - 0x2080)).replace(/[^A-Za-z0-9]/g, '').toLowerCase()}`.slice(0, 40);
      werte[name] = s.fehlt || s.anteil === null
        ? fehlt(s.grund ?? `${s.stoff}: ${z.bezug}`)
        : groesse({ wert: s.anteil, einheit: s.einheit, arten: s.arten ?? z.arten, quelle: s.quelle ?? z.quelle, hinweis: z.hinweis, bezug: s.bezug ?? z.bezug, unschaerfe: s.unschaerfe }, zeit({ quelle: s.quelle ?? z.quelle }));
    }
    werte.textur = k.textur.fehlt ? fehlt(k.textur.grund)
      : groesse({ wert: { verweis: `data/${k.textur.datei}` }, einheit: 'bild', arten: k.textur.arten, quelle: k.textur.quelle, hinweis: k.textur.hinweis }, heute);
    return { id: `${P}/${k.id}`, stapel: '0.3', name: k.name, auswahl: [`${P}/auswahl/koerper`, `${P}/auswahl/texturen`], werte };
  });
  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/koerper`, was: 'Die acht Planeten und Titan', gesetzt_in: 'Auftrag Teil C (2026-11-06)', begruendung: 'Planeten der Sonnensystemansicht; Titan wegen des Methankreislaufs' },
      { id: `${P}/auswahl/texturen`, was: 'Gemeinfreie Mosaike von USGS und NASA; ohne globale Karte einfarbig', gesetzt_in: 'kern/BERICHT-planeten.md, Abschnitt 5',
        begruendung: 'Solar System Scope füllt Lücken mit erfundenem Gelände; das wäre Fiktion ohne Kennzeichnung (Regel 15)' },
    ],
    ideale: [],
    bestaende: [],
    eintraege,
    prozesse: [], relationen: [],
  };
}
