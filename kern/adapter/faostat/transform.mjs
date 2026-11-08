// @ts-check
/* FAOSTAT: Produktion (Fluss, t je Jahr, Biomasse 1.2) und Landnutzung (Bestand,
   1000 ha, Erdsystem 1.1), je Land und FAO-Gruppe ein Eintrag mit der Jahresreihe.
   Herkunft je Wert aus dem Kennzeichen der FAO. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';
import { jahresreihe, idTeil } from '../stofffluss_reihe.mjs';
import { artenFao } from '../stofffluss_herkunft.mjs';

const P = 'faostat';

/** @param {any} prod @param {any} manifest @param {any} zusatz */
export function transform(prod, manifest, zusatz) {
  const L = zusatz.land, kette = manifest.herkunft.archivkette;
  /** @param {any} q */
  const herkunft = q => (/** @type {number} */ _j, /** @type {string|null} */ kz) => {
    return { arten: artenFao(kz), quelle: `${q.quelle.name}; Stand ${q.quelle.aktualisiert}`, ...(kz ? { hinweis: `Kennzeichen ${kz}: ${q.kennzeichen[kz] ?? 'Bedeutung nicht geliefert'}` } : { hinweis: 'ohne Kennzeichen' }) };
  };
  /** @param {any} q */
  const luecke = q => (/** @type {string|null} */ kz) => kz ? `Quelle: ${q.kennzeichen[kz] ?? kz}` : 'kein Wert in der Quelle';
  const eintraege = [
    ...prod.reihen.map((/** @type {any} */ r) => ({
      id: `${P}/produktion/${r.land}/${r.gruppe}`, stapel: '1.2', name: `${prod.gruppen[r.gruppe]} · ${prod.laender[r.land].name}`, auswahl: [`${P}/auswahl/produktion`],
      werte: { produktion: jahresreihe(r.werte, prod.einheit[0], herkunft(prod), kette, luecke(prod)) } })),
    ...L.reihen.map((/** @type {any} */ r) => ({
      id: `${P}/land/${r.land}/${r.posten}`, stapel: '1.1', name: `${L.posten[r.posten]} · ${L.laender[r.land].name}`, auswahl: [`${P}/auswahl/land`],
      werte: { flaeche: jahresreihe(r.werte, L.einheit[0], herkunft(L), kette, luecke(L)) } })),
    ...Object.entries(prod.fehlend).map(([c, f]) => ({ id: `${P}/produktion/gruppe_${idTeil(c)}`, stapel: '1.2', name: `FAO-Gruppe ${c}`,
      wo: fehlt(/** @type {any} */ (f).grund), werte: { produktion: fehlt(/** @type {any} */ (f).grund) } })),
  ];
  return {
    schema: SCHEMA_VERSION, adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: prod.erzeugt },
    formationen: [], subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/produktion`, was: prod.auswahl, gesetzt_in: 'matrix-scharnier/adapter/faostat.py', begruendung: 'Gruppen, die die FAO selbst bildet; zeroearth summiert nichts' },
      { id: `${P}/auswahl/land`, was: L.auswahl, gesetzt_in: 'matrix-scharnier/adapter/faostat.py', begruendung: 'Hauptkategorien der Landnutzung' },
    ],
    ideale: [], bestaende: [], eintraege, prozesse: [], relationen: [],
  };
}
