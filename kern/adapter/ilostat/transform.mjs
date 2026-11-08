// @ts-check
/* ILOSTAT: Arbeitszeit. HOW_TEMP (Erhebung, Kennzahl je Person) und HOW_2TOT
   (Modellschätzung der ILO, Stunden insgesamt je Woche) als getrennte Größen.
   Werte ab dem Abrufjahr aus der Modellschätzung sind Erwartung mit Träger ILO.
   Arbeitszeit ist kein Stapel; die Einträge stehen bei 1.3 (Basis), weil die
   Erwerbstätigen ihre Träger sind (Vorschlag). */
import { SCHEMA_VERSION } from '../../schema.mjs';
import { jahresreihe, idTeil } from '../stofffluss_reihe.mjs';
import { artenIlo, ERWARTUNGSTRAEGER_ILO } from '../stofffluss_herkunft.mjs';

const P = 'ilostat';

/** @param {any} roh @param {any} manifest */
export function transform(roh, manifest) {
  const kette = manifest.herkunft.archivkette;
  const herkunft = (/** @type {number} */ j, /** @type {string|null} */ kz, /** @type {any[]} */ rest) => {
    const quelle = rest[0] ?? 'Quelle nicht genannt', arten = artenIlo(j, quelle, roh.erwartung_ab);
    return { arten, quelle: `ILOSTAT: ${quelle}`, ...(kz ? { hinweis: `Status ${kz}: ${roh.status[kz] ?? 'Bedeutung nicht geliefert'}` } : {}),
      ...(arten.includes('erwartung') ? { erwartungstraeger: ERWARTUNGSTRAEGER_ILO } : {}) };
  };
  const luecke = () => 'kein Wert in der Quelle';
  const eintraege = [];
  for (const [teil, t] of Object.entries(roh.teile)) {
    const T = /** @type {any} */ (t), e = T.einheit[0], einheit = e.faktor === 1 ? 'h' : `${e.faktor} h`;
    for (const r of T.reihen) eintraege.push({
      id: `${P}/${teil}/${idTeil(r.land)}/${idTeil(r.sektor)}`, stapel: '1.3', name: `${T.name} · ${r.land} · ${r.sektor}`, auswahl: [`${P}/auswahl/arbeitszeit`],
      werte: { [teil === 'how_temp' ? 'wochenstunden_je_person' : 'stunden_je_woche']: jahresreihe(r.werte, einheit, herkunft, kette, luecke) } });
  }
  return {
    schema: SCHEMA_VERSION, adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [], subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [{ id: `${P}/auswahl/arbeitszeit`, was: roh.auswahl, gesetzt_in: 'matrix-scharnier/adapter/ilostat.py', begruendung: 'Arbeitszeit als Zufluss „zeit“; keine Hochrechnung (Regel 12)' }],
    ideale: [], bestaende: [], eintraege, prozesse: [], relationen: [],
  };
}
