// @ts-check
/* Kennzeichen der Quelle → Herkunftsarten (Regel 6), für Kern und Seite gemeinsam,
   damit die Ansicht für Menschen der Ausgabe für Maschinen nie widerspricht
   (Regel 14). Ohne Abhängigkeiten, im Browser ladbar. */

/** Eurostat: e (geschätzt), i (imputiert) → Modell; sonst amtliche Statistik. @param {string|null} kz */
export const artenEurostat = kz => (kz !== null && /[ei]/.test(kz) ? ['kuratiert', 'modell', 'berechnet'] : ['beobachtung', 'kuratiert']);

/** FAOSTAT: A amtlich; E geschätzt, I imputiert → Modell; X externe Organisation; ohne Kennzeichen kuratiert. @param {string|null} kz */
export const artenFao = kz => (kz === 'A' ? ['beobachtung', 'kuratiert'] : kz === 'E' || kz === 'I' ? ['kuratiert', 'modell', 'berechnet'] : ['kuratiert']);

/** ILOSTAT: „Modelled Estimates“ → Modell, ab dem Abrufjahr Erwartung (Träger ILO); sonst Erhebung.
    @param {number} jahr @param {string} quelle @param {number} erwartungAb */
export const artenIlo = (jahr, quelle, erwartungAb) => /Modelled Estimates/.test(quelle)
  ? (jahr >= erwartungAb ? ['kuratiert', 'modell', 'berechnet', 'erwartung'] : ['kuratiert', 'modell', 'berechnet'])
  : ['beobachtung', 'kuratiert'];

export const ERWARTUNGSTRAEGER_ILO = 'ILO (Modelled Estimates)';

/** Eurostat-Ländercode → ISO-3 über die ILO-Codeliste (ISO-2), mit den Abweichungen EL und UK.
    @param {string} geo @param {any} codes data/stofffluss/laendercodes.json */
export function iso3VonEurostat(geo, codes) {
  const iso2 = codes.eurostat_abweichungen[geo] ?? geo;
  return Object.entries(codes.laender).find(([, c]) => !(/** @type {any} */ (c).gruppe) && /** @type {any} */ (c).iso2 === iso2)?.[0] ?? null;
}

/** FAO-M49 → ISO-3 über die ILO-Codeliste. @param {string} m49 @param {any} codes */
export function iso3VonM49(m49, codes) {
  return Object.entries(codes.laender).find(([, c]) => !(/** @type {any} */ (c).gruppe) && /** @type {any} */ (c).m49 === m49)?.[0] ?? null;
}

/** Kette der Grundkräfte des Solarzuflusses (aus 0.3), Setzung von Max (2026-11-10):
    Kernfusion in der Sonne (starke Wechselwirkung), Weg zur Erde als Strahlung (Elektromagnetismus). */
export const SONNE_KETTE = Object.freeze({ kette: ['stark', 'elektromagnetismus'], richtung: 'extern',
  begruendung: 'Setzung von Max (2026-11-10): Kernfusion in der Sonne (stark), Strahlung zur Erde (Elektromagnetismus)' });

/** Was dem Prozess fehlt (Plan Prozess), je [Stapel, Name, Grund]; Kern und Flussansicht nennen dieselben Gründe. */
export const FEHLT = /** @type {const} */ ({
  materialbestand: ['1.1', 'Materialbestand im Land (Gebäude, Infrastruktur, Güter in Nutzung)', 'Die Materialflusskonten führen nur Flüsse je Jahr, keinen Bestand; GHSL hat Volumen, nicht Masse, und eine Dichte wäre eine eigene Annahme'],
  bestandszuwachs: ['1.1', 'Zuwachs des Materialbestands (Net Addition to Stock)', 'Nicht in env_ac_mfa; ob Eurostat ihn je Land frei abrufbar führt, ist nicht geprüft'],
  abgabe_natur: ['1.1', 'Abgabe an die Natur (Emissionen, Abfälle; Domestic Processed Output)', 'Nicht in env_ac_mfa; Luftemissionen und Abfälle wären eigene Datensätze mit eigener Herkunft'],
  energievorraete: ['1.1', 'Energievorräte (Lagerbestand)', 'Die Energiebilanz nennt nur die Bestandsveränderung, nicht den Stand'],
  partnerlaender: ['1.1', 'Partnerländer von Import und Export', 'env_ac_mfa nennt keine Handelspartner; Außenhandel in Masse (Comext) nicht geprüft'],
  jahresstunden: ['1.3', 'Arbeitsstunden je Jahr', 'ILOSTAT nennt Stunden je Woche, keine Wochen je Jahr; keine Hochrechnung (Regel 12)'],
});
