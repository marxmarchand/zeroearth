// @ts-check
/* Eisdicke (PaleoMIST) als Feld, beide Ideale (Regel 13). Je Schritt ein Verweis
   auf das Klassen-PNG, dazu Eisvolumen und Eisfläche. Meereis fehlt in PaleoMIST
   mit Grund; es steht im Adapter meereis. Kryosphäre in 1.1. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'eis';
const WISSENSSTAND = fehlt('Die Quelle nennt nicht, seit wann die Werte so bekannt sind');

/** @param {any} roh data/eis.json @param {any} manifest */
export function transform(roh, manifest) {
  const MI = manifest.ideale, archivkette = manifest.herkunft.archivkette;
  const zs = { bezugssystem: roh.bezugssystem, unschaerfe: roh.zeit_unschaerfe, aufloesung: 2.5, abdeckung: { von: 80, bis: 0 }, schritte: 33 };
  const ideale = Object.entries(MI.varianten).map(([k, v]) => ({
    id: `${P}/ideal/${k}`, schluessel: k, name: /** @type {any} */ (v).name, gruppe: MI.gruppe,
    variante: /** @type {any} */ (v).variante, gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung }));
  for (const i of ideale) {
    const s = roh.ideale[i.schluessel]?.schritte;
    if (!s || s.length !== 33) throw new Error(`Ideal ${i.schluessel}: ${s?.length} Schritte statt 33`);
  }
  const reihe = (/** @type {any} */ i, /** @type {(e: any) => any} */ wert, /** @type {string} */ einheit, /** @type {string[]} */ arten, /** @type {string} */ verfahren) => ({
    einheit, zeitsemantik: zs,
    punkte: roh.ideale[i.schluessel].schritte.map((/** @type {any} */ e) => ({
      bezugszeit: { bezugssystem: roh.bezugssystem, unschaerfe: roh.zeit_unschaerfe, aufloesung: 2.5, wert: e.ka },
      fassungen: [{ wert: wert(e), wissensstand: WISSENSSTAND,
        woher: { arten, quelle: `${roh.quelle} · ${roh.ideale[i.schluessel].datei_quelle}`, archivkette, verfahren, ideal: i.id } }],
    })),
  });
  const werte = /** @type {Record<string, any>} */ ({});
  for (const i of ideale) {
    werte[`dicke_${i.schluessel}`] = reihe(i, e => ({ verweis: `data/${e.datei}` }), 'klasse', ['rekonstruktion'], 'ice_thickness in 256 Klassen (Wurzelskala bis 5 000 m), 0,5°');
    werte[`volumen_${i.schluessel}`] = reihe(i, e => e.eisvolumen_km3, 'km3', ['rekonstruktion', 'berechnet'], 'Summe Eisdicke × Zellfläche auf 0,5°');
    werte[`flaeche_${i.schluessel}`] = reihe(i, e => e.eisflaeche_km2, 'km2', ['rekonstruktion', 'berechnet'], 'Summe der Zellflächen mit Eisdicke > 0 auf 0,5°');
  }
  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/ideale`, was: `Ideale: ${ideale.map(i => i.name).join(', ')}`, gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung },
      { id: `${P}/auswahl/aufloesung`, was: '0,5° (jeder zweite Gitterpunkt von 0,25°)', gesetzt_in: 'matrix-scharnier/adapter/eis.py', begruendung: 'Größe: 66 Bilder zusammen 1,6 MB' },
    ],
    ideale: ideale.map(({ schluessel, ...i }) => i),
    bestaende: [],
    eintraege: [
      { id: `${P}/dicke`, stapel: '1.1', sphaere: 'kryosphaere', name: 'Eisdicke (aufliegendes Eis, PaleoMIST)', auswahl: [`${P}/auswahl/ideale`, `${P}/auswahl/aufloesung`],
        wo: { geometrie: 'feld', raster: '0.5°', ausdehnung: 'global', verzerrung: { flaeche: 1, ueberhoehung: 1, gitter: { min: 0, max: 1, bezug: 'gleichabständiges Gitter' } } },
        werte },
      { id: `${P}/meereis`, stapel: '1.1', sphaere: 'kryosphaere', name: 'Meereis in PaleoMIST', wo: fehlt(`${roh.meereis.grund}; Meereis steht in der Ebene meereis (GLOMAP, TraCE-21ka)`), werte: { dicke: fehlt(roh.meereis.grund) } },
    ],
    prozesse: [], relationen: [],
  };
}
