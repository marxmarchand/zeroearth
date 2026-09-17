// @ts-check
/* ════════════════════════════════════════════════════════════════════
   MATRIX — das Modell. Einzige Stelle, an der die Matrix steht.
   Daraus abgeleitet: Adressen · Beschriftungen (de/en) · TypeSafe-
   Kriterien · Diagramme (diagramm.mjs).
   IDs sind Adressen, keine Begriffe (ZEIT_RAUM §8). Beschriftungen
   sind Sprachvarianten derselben Adresse.
   Englische Begriffe: Diagramm „a4Matrixbasis mode of production“
   (15.09.2026). Achtung: Paper 1/2 führen für `unterbau`
   „Substructure/Basement“ — hier steht „Ecological Basis“.
   ════════════════════════════════════════════════════════════════════ */

export const MATRIX = /** @type {const} */ ({
  zweite_natur: {
    de: 'Zweite Natur', en: 'Second Nature', farbe: '#e8807f',
    strata: {
      riss: { de: 'R.I.S.System', en: 'Rel.-Ideo-Symbolic System',
        was: 'symbolische Vermittlung der Wirklichkeit einer Spezies',
        nicht: 'Wissen als Produktionsmittel' },
      ueberbau: { de: 'Institutionalisierter Überbau', en: 'Institutionalized Superstructure',
        was: 'integraler Staat, Recht, Verwaltung, Staatsapparate',
        nicht: 'bloße Bauten' },
      konstruierte_wirklichkeit: { de: 'Konstruierte Wirklichkeit', en: 'Constructed Reality',
        was: 'gesellschaftlich produzierter, verdinglichter und gebauter Raum',
        nicht: 'Institutionen als Regelwerk' },
    },
  },
  gesellschaftlicher_stoffwechsel: {
    de: 'Gesellschaftlicher Stoffwechsel', en: 'Social Metabolism', farbe: '#f2e35a',
    strata: {
      immat_pm: { de: 'Immaterielle Produktionsmittel', en: 'Immaterial Means of Production',
        was: 'Wissen, Verfahren', nicht: 'symbolische Weltdeutung' },
      mat_pm: { de: 'Materielle Produktionsmittel', en: 'Material Means of Production',
        was: 'Werkzeuge, Anlagen, angeeignete Stoffe und Energie',
        nicht: 'Stoffe vor ihrer Aneignung' },
    },
  },
  erste_natur: {
    de: 'Erste Natur', en: 'First Nature', farbe: '#a8cf74',
    strata: {
      basis: { de: 'Gesellschaftliche Basis', en: 'Socially Base',
        was: 'Produktionsverhältnisse, Gesellschaftsformation',
        nicht: 'deren institutionelle Form' },
      unterbau: { de: 'Unterbau', en: 'Ecological Basis',
        was: 'mehr-als-menschliche Gesellschaften als Produktivkräfte; ReProduktionsverhältnisse',
        nicht: 'Umweltdaten ohne Akteurscharakter' },
      erdsystem: { de: 'Erdsystem', en: 'Earth (Sub)System',
        was: 'Atmo-, Bio-, Hydro-, Lithosphäre als Umweltzustand',
        nicht: 'Arten als Akteure' },
    },
  },
  planetarer_stoffwechsel: {
    de: 'Planetarer Stoffwechsel', en: 'Planetary Metabolism', farbe: '#f2e35a',
    strata: {
      intern: { de: 'Interne Prozesse', en: 'Internal Processes',
        was: 'Geothermik, Tektonik, radioaktiver Zerfall; entstandene Materialbestände',
        nicht: 'Bestände als Produktionsmittel' },
      extern: { de: 'Externe Prozesse', en: 'External Processes',
        was: 'Solarenergie, Gezeitenkräfte, Sternenstaub',
        nicht: 'gesellschaftlich angeeignete Energie' },
    },
  },
  nullnatur: {
    de: 'NullNatur', en: 'ZeroNature', farbe: '#2e2a6b',
    strata: {
      solar: { de: 'Solarer Raum · Ekliptik', en: 'Solar System',
        was: 'Relativität der Planeten zur Sonne; Ekliptik, Mond, Milanković',
        nicht: 'deren Klimawirkung' },
      interstellar: { de: 'Interstellarer Raum', en: 'Intergalactic / Interstellar Space',
        was: 'Relativität von Objekten im Raum', nicht: 'Vorgänge im Erdsystem' },
      kosmologisch: { de: 'Universell / Fundamental', en: 'Universal / Fundamental',
        was: 'Raum, Zeit, vier Grundkräfte', nicht: 'Flüsse auf der Erde' },
    },
  },
});

/** Klammernde Dimension. */
export const ZEIT = { de: 'Zeit / (Raum)', en: 'Time / (Space)', wert: { de: 'relativ', en: 'relative' } };

/** Voraussetzungsverhältnis, von unten nach oben. */
export const VORAUSSETZUNG = /** @type {const} */ ([
  'nullnatur', 'planetarer_stoffwechsel', 'erste_natur',
  'gesellschaftlicher_stoffwechsel', 'zweite_natur',
]);

/* ── Formen ───────────────────────────────────────────────────────────
   Keine Dimensionen, sondern Gestalten INNERHALB der Matrix (Kapital-
   genese-Diagramm). Jede sitzt an einer Adresse — das ist die
   Verortungsarbeit, die die Matrix leistet.                            */
export const FORMEN = /** @type {const} */ ({
  stoffstroeme:   { de: 'Stoff- und Energieströme + nichtmenschliche Arbeit',
                    en: 'Material and Energy Flows + Nonhuman Labour', bei: 'planetarer_stoffwechsel/intern' },
  materialbestand:{ de: 'Materialbestände', en: 'Material Stocks', bei: 'erste_natur/erdsystem' },
  lohnarbeit:     { de: 'Lohnarbeit', en: 'Wage Labour', bei: 'erste_natur/basis' },
  klassenstruktur:{ de: 'Gesellschaftliche Klassenstruktur', en: 'Social Class Structure', bei: 'erste_natur/basis' },
  produktionsmittel:{ de: 'Produktionsmittel', en: 'Means of Production', bei: 'gesellschaftlicher_stoffwechsel/mat_pm' },
  gebrauchswert:  { de: 'Gebrauchswert', en: 'Use Value', bei: 'gesellschaftlicher_stoffwechsel/mat_pm' },
  ware:           { de: 'Ware / Mehrwert', en: 'Commodity / Added Value', bei: 'zweite_natur/konstruierte_wirklichkeit' },
  kapital:        { de: 'Kapital', en: 'Capital', bei: 'zweite_natur/ueberbau' },
  mehrwert:       { de: 'Mehrwert', en: 'Surplus Value', bei: 'zweite_natur/ueberbau' },
  integraler_staat:{ de: 'Integraler Staat', en: 'Integral State', bei: 'zweite_natur/ueberbau' },
  produktionsweise:{ de: 'Produktions- und Distributionsweise', en: 'Mode of Production / Distribution', bei: 'zweite_natur/ueberbau' },
  abfall:         { de: 'Abfall', en: 'Waste', bei: 'erste_natur/erdsystem' },
});

/* ── Relationen ───────────────────────────────────────────────────────
   Der relationale Zusammenhang. Die Diagramme sind eine Ansicht
   hiervon, nicht umgekehrt.                                            */
export const REL_TYPEN = /** @type {const} */ ({
  setzt_voraus: { de: 'setzt voraus', en: 'presupposes', stil: 'ontologisch' },
  fliesst:      { de: 'fließt in', en: 'flows into', stil: 'stofflich' },
  wird_in_wert_gesetzt: { de: 'wird in Wert gesetzt als', en: 'is valorized as', stil: 'wertform' },
  eignet_an:    { de: 'eignet an', en: 'appropriates', stil: 'aneignung' },
  entwertet:    { de: 'entwertet', en: 'devalues', stil: 'aneignung' },
  fasst:        { de: 'fasst institutionell', en: 'institutionally frames', stil: 'ueberbau' },
});

/** @type {ReadonlyArray<{von:string, nach:string, typ:keyof typeof REL_TYPEN, hinweis?:string}>} */
export const RELATIONEN = [
  ...VORAUSSETZUNG.slice(1).map((d, i) => /** @type {const} */ (
    { von: d, nach: VORAUSSETZUNG[i], typ: 'setzt_voraus' })),
  { von: 'stoffstroeme',    nach: 'materialbestand',   typ: 'fliesst' },
  { von: 'stoffstroeme',    nach: 'produktionsmittel', typ: 'fliesst' },
  { von: 'materialbestand', nach: 'produktionsmittel', typ: 'fliesst' },
  { von: 'lohnarbeit',      nach: 'produktionsmittel', typ: 'fliesst' },
  { von: 'produktionsmittel', nach: 'gebrauchswert',   typ: 'fliesst' },
  { von: 'gebrauchswert',   nach: 'ware',              typ: 'wird_in_wert_gesetzt' },
  { von: 'ware',            nach: 'kapital',           typ: 'wird_in_wert_gesetzt' },
  { von: 'klassenstruktur', nach: 'mehrwert',          typ: 'eignet_an' },
  { von: 'mehrwert',        nach: 'kapital',           typ: 'fliesst' },
  { von: 'ware',            nach: 'unterbau',          typ: 'entwertet',
    hinweis: 'devaluation of use value for reproduction' },
  { von: 'produktionsmittel', nach: 'abfall',          typ: 'fliesst' },
  { von: 'integraler_staat', nach: 'klassenstruktur',  typ: 'fasst' },
  { von: 'integraler_staat', nach: 'kapital',          typ: 'fasst' },
  { von: 'produktionsweise', nach: 'produktionsmittel', typ: 'fasst' },
];

/* ── Abgeleitetes ─────────────────────────────────────────────────── */
/** @typedef {'de'|'en'} Sprache */

/** Alle gültigen Adressen. */
export const ADRESSEN = Object.entries(MATRIX)
  .flatMap(([d, m]) => Object.keys(m.strata).map(s => `${d}/${s}`));

/** Beschriftung einer Adresse, Dimension oder Form in einer Sprache. */
export function beschriftung(id, sprache = 'de') {
  if (id in FORMEN) return FORMEN[id][sprache];
  const [d, s] = id.split('/');
  if (!MATRIX[d]) return id;
  return s ? MATRIX[d].strata[s]?.[sprache] ?? id : MATRIX[d][sprache];
}

/** TypeSafe-Choice-Kriterien, aus dem Modell abgeleitet. */
export const ADRESS_KRITERIEN = {
  ...Object.fromEntries(Object.entries(MATRIX).flatMap(([d, m]) =>
    Object.entries(m.strata).map(([k, b]) =>
      [`${d}/${k}`, { was: b.was, nicht_fuer: b.nicht, label: `${b.de} / ${b.en}` }]))),
  unverortbar: { was: 'Der Text gibt keine belastbare Verortung her' },
};

/** Marker-Ebenen der Plattform (MarkerLayer.STYLE) auf Adressen. */
export const EBENEN = {
  pm:          { adresse: 'planetarer_stoffwechsel/intern',
                 frage: 'Ist das Objekt Produkt des planetaren Stoffwechsels (über geologische Zeit entstandener Stoff)?' },
  erste_natur: { adresse: 'erste_natur/erdsystem',
                 frage: 'Liegt das Objekt als Materialbestand im Erdsystem vor?' },
  basis:       { adresse: 'erste_natur/basis',
                 frage: 'Ist das Objekt in Produktionsverhältnisse eingebunden (Eigentum, Arbeit, Klassenstruktur)?' },
  bestaende:   { adresse: 'gesellschaftlicher_stoffwechsel/mat_pm',
                 frage: 'Wird das Objekt als Produktionsmittel oder angeeigneter Bestand genutzt?' },
  ware:        { adresse: null,
                 frage: 'Wird das Objekt in Wert gesetzt, also als Ware getauscht?' },
  ueberbau:    { adresse: 'zweite_natur/ueberbau',
                 frage: 'Ist das Objekt institutionell gefasst (Recht, Staat, Verwaltung)?' },
  riss:        { adresse: 'zweite_natur/riss',
                 frage: 'Trägt das Objekt symbolische oder ideologische Bedeutung?' },
};

export const ABLOESUNG = [
  'an das stofflich-räumliche Verhältnis gebunden',
  'teilweise abstrahiert',
  'gesetzt und vom Verhältnis gelöst',
];

export const SCHWELLEN = {
  choice: { uebernehmen: 0.9, pruefen: 0.5 },
  noul:   { ja: 0.9, nein: 0.1 },
};
