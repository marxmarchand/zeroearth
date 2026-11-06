// @ts-check
/* Relief: Höhenklassen je Quelle und Zeitschritt als Feld (Verweis auf die PNG),
   dazu die abgeleiteten Flächengrößen. Was fehlt (heute/GEBCO, die Lücke
   80 ka bis 2,5 Ma, vor 540 Ma, Packeis), steht als fehlend mit Grund. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'relief';
const WISSENSSTAND = fehlt('Die Quellen nennen nicht, seit wann die Werte so bekannt sind');
const VERZERRUNG = { flaeche: 1, ueberhoehung: 1, gitter: { min: 0, max: 1, bezug: 'Zellfläche relativ zur Äquatorzelle; gleichabständiges Gitter' } };

/** @param {any} roh data/relief.json @param {any} manifest */
export function transform(roh, manifest) {
  const archivkette = manifest.herkunft.archivkette;
  const eintraege = Object.entries(roh.quellen).map(([k, q]) => {
    const qq = /** @type {any} */ (q);
    const s = qq.schritte, wert = (/** @type {any} */ e) => e.ma ?? e.ka;
    const aufl = (/** @type {number} */ i) => Math.abs(wert(s[Math.min(i + 1, s.length - 1)]) - wert(s[Math.max(i - 1, 0)])) / (i === 0 || i === s.length - 1 ? 1 : 2);
    const zeit = (/** @type {number} */ i) => ({ bezugssystem: qq.bezugssystem, unschaerfe: qq.zeit_unschaerfe, aufloesung: aufl(i), wert: wert(s[i]) });
    const zs = { bezugssystem: qq.bezugssystem, unschaerfe: qq.zeit_unschaerfe, aufloesung: fehlt('je Schritt angegeben'),
      abdeckung: { von: wert(s.at(-1)), bis: wert(s[0]) }, schritte: s.length };
    const woher = (/** @type {string[]} */ dazu, /** @type {string} */ verfahren) =>
      ({ arten: [...qq.arten, ...dazu], quelle: `${qq.name}; ${qq.lizenz}`, archivkette, verfahren });
    const reihe = (/** @type {string} */ g, /** @type {string} */ einheit, /** @type {string} */ verfahren) => ({
      einheit, zeitsemantik: zs,
      punkte: s.map((/** @type {any} */ e, /** @type {number} */ i) => ({ bezugszeit: zeit(i),
        fassungen: [{ wert: e.groessen[g] ?? fehlt('nicht berechenbar'), wissensstand: WISSENSSTAND, woher: woher(['berechnet'], verfahren) }] })),
    });
    const werte = /** @type {Record<string, any>} */ ({
      hoehe: { einheit: 'klasse', zeitsemantik: zs,
        punkte: s.map((/** @type {any} */ e, /** @type {number} */ i) => ({ bezugszeit: zeit(i),
          fassungen: [{ wert: { verweis: e.datei }, wissensstand: WISSENSSTAND, woher: woher([], 'Höhe in 256 Klassen (Klassentafel in data/relief.json)') }] })) },
      landflaeche: reihe('landflaeche_km2', 'km2', 'Summe der Zellflächen mit Höhe > 0'),
      schelf_0_200: reihe('schelf_0_200_km2', 'km2', 'Summe der Zellflächen mit 0 ≥ Höhe > −200 m (Setzung)'),
      rand_200_1400: reihe('rand_200_1400_km2', 'km2', 'Summe der Zellflächen mit −200 ≥ Höhe > −1400 m (Setzung, Kontinentalrand nach Kocsis & Scotese)'),
      mittlere_landhoehe: reihe('mittlere_landhoehe_m', 'm', 'flächengewichtetes Mittel der Höhe über Land'),
      eisflaeche: qq.eis?.fehlt ? fehlt(qq.eis.grund) : reihe('eisflaeche_km2', 'km2', `Summe der Zellflächen mit Eisdicke ab ${qq.eis.ab_dicke_m} m`),
    });
    return {
      id: `${P}/${k}`, stapel: '1.1', name: `Relief: ${qq.name}`, auswahl: [`${P}/auswahl/schelf`, ...(k === 'paleomist' ? [`${P}/auswahl/eis`, `${P}/auswahl/paleomist_05`] : [])],
      wo: { geometrie: 'feld', raster: `${qq.aufloesung_grad}°`, ausdehnung: 'global', bezugsrahmen: qq.bezugsrahmen, verzerrung: VERZERRUNG },
      werte,
    };
  });
  const fehlend = Object.entries(roh.fehlt).map(([k, f]) => ({
    id: `${P}/fehlt/${k}`, stapel: '1.1', name: `Relief fehlt: ${k}`,
    wo: fehlt(/** @type {any} */ (f).grund), werte: { hoehe: fehlt(/** @type {any} */ (f).grund) },
  }));
  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/schelf`, was: 'Schelf bis −200 m und Kontinentalrand bis −1400 m, beide', gesetzt_in: 'kern/BERICHT-relief.md', begruendung: roh.setzungen.schelf_begruendung },
      { id: `${P}/auswahl/eis`, was: `Eis als eigene Klasse ab ${roh.setzungen.eis_ab_m} m Dicke`, gesetzt_in: 'Entscheidung Max, 2026-11-06', begruendung: 'Gletscher und Eisschilde erkennbar machen; dünneres Eis erscheint als Höhe. Packeis führt keine Quelle.' },
      { id: `${P}/auswahl/paleomist_05`, was: 'PaleoMIST auf 0,5° (jeder zweite Gitterpunkt)', gesetzt_in: 'kern/BERICHT-relief.md', begruendung: 'Größe: 33 Schritte rund 4 MB statt rund 15 MB; die Sintflut-Küsten liegen weiter auf 0,25° vor' },
    ],
    bestaende: [], eintraege: [...eintraege, ...fehlend], prozesse: [], relationen: [],
  };
}
