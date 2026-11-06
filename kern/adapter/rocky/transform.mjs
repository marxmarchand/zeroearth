// @ts-check
/* Rocky-Gerüst: nur Fiktion (Regel 15). Je erfundenes Ding ein Eintrag mit Name
   und Rolle in eigenen Worten; der Inhalt fehlt mit Grund „Inhalt von Max“. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'rocky';

/** @param {any} roh kern/adapter/rocky/fiktion.json @param {any} manifest */
export function transform(roh, manifest) {
  const woher = { arten: ['fiktion'], quelle: roh.werk, archivkette: manifest.herkunft.archivkette };
  const bz = { bezugssystem: 'a_ce', wert: 2021, unschaerfe: fehlt('Erscheinungsjahr des Romans; die Erzählung selbst wird nicht datiert') };
  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [{ id: `${P}/auswahl/fiktion`, was: 'Erid, Rocky, Astrophage', gesetzt_in: 'Auftrag Teil D (2026-11-06)', begruendung: 'Gedankenexperiment: gleiche 0. Natur, erfundene 1. und 2. Natur' }],
    ideale: [], bestaende: [],
    eintraege: roh.fiktion.map((/** @type {any} */ f) => ({
      id: `${P}/${f.id}`, stapel: f.stapel, name: `${f.name} (Fiktion)`, auswahl: [`${P}/auswahl/fiktion`],
      werte: {
        rolle: { einheit: 'text', punkte: [{ bezugszeit: bz, fassungen: [{ wert: f.rolle, wissensstand: fehlt('Fiktion'), woher }] }] },
        inhalt: fehlt(f.inhalt.grund),
      },
    })),
    prozesse: [], relationen: [],
  };
}
