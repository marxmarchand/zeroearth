// @ts-check
/* Eurostat: Materialflusskonten und Energiebilanzen, je Land und Gruppe bzw.
   Energieträger ein Eintrag mit den Jahresreihen der Quelle. Die Stapel folgen
   der Herkunft des Stoffs (Biomasse 1.2, Mineralisches und Fossiles 1.1,
   Sonnenstrahlung 0.3). Nichts wird über Länder oder Gruppen summiert. */
import { SCHEMA_VERSION } from '../../schema.mjs';
import { jahresreihe, idTeil } from '../stofffluss_reihe.mjs';
import { artenEurostat } from '../stofffluss_herkunft.mjs';

const P = 'eurostat';
const NAMEN_MFA = /** @type {Record<string, string>} */ ({ DE: 'entnahme', IMP: 'import', EXP: 'export', DMC: 'inlandsverbrauch' });

/** @param {any} mfa @param {any} manifest @param {any} zusatz */
export function transform(mfa, manifest, zusatz) {
  const E = zusatz.energie, kette = manifest.herkunft.archivkette;
  /** @param {any} q */
  const herkunft = q => (/** @type {number} */ _j, /** @type {string|null} */ kz) => {
    return {
      arten: artenEurostat(kz),
      quelle: `${q.quelle.name}; Stand ${String(q.quelle.aktualisiert).slice(0, 10)}`,
      ...(kz ? { hinweis: `Kennzeichen ${kz}: ${[...kz].map(c => q.kennzeichen[c] ?? 'Bedeutung nicht geliefert').join('; ')}` } : {}),
      ...(kz?.includes('p') ? { wissensstand: { seit: String(q.quelle.aktualisiert).slice(0, 10), status: 'vorlaeufig' } } : {}),
    };
  };
  /** @param {any} q */
  const luecke = q => (/** @type {string|null} */ kz) => kz ? `Quelle: ${q.kennzeichen[kz] ?? kz}` : 'kein Wert in der Quelle';
  const eintraege = [];
  for (const r of mfa.reihen) {
    const g = mfa.gruppen[r.gruppe], werte = /** @type {Record<string, any>} */ ({});
    for (const [k, w] of Object.entries(r.werte)) werte[NAMEN_MFA[k] ?? idTeil(k)] = jahresreihe(w, mfa.einheit, herkunft(mfa), kette, luecke(mfa));
    eintraege.push({ id: `${P}/mfa/${idTeil(r.geo)}/${idTeil(r.gruppe)}`, stapel: g.stapel, name: `${g.name} · ${mfa.laender[r.geo]}`, auswahl: [`${P}/auswahl/mfa`], werte });
  }
  for (const r of E.reihen) {
    const t = E.traeger[r.traeger], werte = /** @type {Record<string, any>} */ ({});
    for (const [k, w] of Object.entries(r.werte)) werte[idTeil(k)] = jahresreihe(w, E.einheit, herkunft(E), kette, luecke(E));
    eintraege.push({ id: `${P}/energie/${idTeil(r.geo)}/${idTeil(r.traeger)}`, stapel: t.stapel, name: `${t.name} · ${E.laender[r.geo]}`, auswahl: [`${P}/auswahl/energie`], werte });
  }
  return {
    schema: SCHEMA_VERSION, adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: mfa.erzeugt },
    formationen: [], subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/mfa`, was: mfa.auswahl, gesetzt_in: 'matrix-scharnier/adapter/eurostat.py', begruendung: 'Hauptgruppen einzeln, damit jede Gruppe ihrem Stapel zugeordnet bleibt' },
      { id: `${P}/auswahl/energie`, was: E.auswahl, gesetzt_in: 'matrix-scharnier/adapter/eurostat.py', begruendung: 'Energieträger einzeln; Sonnenstrahlung (0.3), Biomasse (1.2) und Übriges (1.1) getrennt' },
    ],
    ideale: [], bestaende: [], eintraege, prozesse: [], relationen: [],
  };
}
