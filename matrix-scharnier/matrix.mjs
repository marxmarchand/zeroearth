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
        nicht: 'deren institutionelle Form',
        info: { de: 'Gesellschaftsformation und sozialökonomische Verhältnisse. Die Basis umfasst Produktivkräfte und Produktionsverhältnisse — nicht nur menschliche Arbeit, sondern tierische, mikrobielle, fossile und digitale Produktivkraft.', en: `Social formation and social-economic relations. The Base encompasses productive forces and relations of production — not merely human labor but animal, microbial, fossil, and digital Produktivkraft.` }, zeitskala: '10¹–10³ a' },
      unterbau: { de: 'Unterbau', en: 'Ecological Basis',
        was: 'mehr-als-menschliche Gesellschaften als Produktivkräfte; ReProduktionsverhältnisse',
        nicht: 'Umweltdaten ohne Akteurscharakter',
        info: { de: `„Mehr-als-menschliche Gesellschaften" — Ökosysteme als Existenzbedingungen und ReProduktionsverhältnisse. Der Unterbau ist nicht bloß Natur, auf der Gesellschaft errichtet wird; er ist selbst eine Form von Vergesellschaftung, die menschlichen Gesellschaftsformationen vorausgeht, sie ermöglicht und sie durchdringt.`, en: `“More-than-human societies” — ecosystems as conditions of existence and relations of reproduction. The Basement is not merely nature upon which society is built; it is itself a form of sociality — a more-than-human sociality that precedes, enables, and interpenetrates human social formations.` }, zeitskala: '10³–10⁷ a' },
      erdsystem: { de: 'Erdsystem', en: 'Earth (Sub)System',
        was: 'Atmo-, Bio-, Hydro-, Lithosphäre als Umweltzustand',
        nicht: 'Arten als Akteure',
        info: { de: 'Atmo-, Bio-, Hydro- und Lithosphäre und ihre Wechselwirkungen. Ein Körper von Erdgröße (±10 %), Achsneigung 20–30°, ein großer Mond zur Stabilisierung, rund 2 km Wasser über die ganze Kugel gerechnet. Die kontinentale Kruste — im Sonnensystem einzig auf der Erde — reichert lebenswichtige Elemente durch Verwitterung an.', en: `Atmosphere, biosphere, hydrosphere, lithosphere and their interactions. Earth-sized body (±10%), axial tilt 20–30°, large moon for stabilization, approximately 2 km global water coverage. Continental crust — unique to Earth in our solar system — concentrates life-essential elements through weathering.` }, zeitskala: '10⁶–10¹⁰ a' },
    },
  },
  planetarer_stoffwechsel: {
    de: 'Planetarer Stoffwechsel', en: 'Planetary Metabolism', farbe: '#f2e35a',
    strata: {
      intern: { de: 'Interne Prozesse', en: 'Internal Processes',
        was: 'Geothermik, Tektonik, radioaktiver Zerfall; entstandene Materialbestände',
        nicht: 'Bestände als Produktionsmittel',
        info: { de: `Die innere Wärmeproduktion der Erde treibt Mantelkonvektion, Plattentektonik und Kerndynamik. Die Plastizität der Asthenosphäre trägt die Plattentektonik noch etwa 500 Millionen Jahre. Es gibt keinen Meeresboden, der älter als 170 Millionen Jahre wäre — eine fortwährende Erneuerung, die geologisch „lebende" von „toten" Planeten unterscheidet.`, en: `Earth's internal heat production drives mantle convection, plate tectonics, and core dynamics. The asthenosphere's plasticity enables plate tectonics for approximately another 500 million years. No seafloor older than 170 million years exists — continuous renewal distinguishing geologically “living” planets from “dead” ones.` }, zeitskala: '10⁷–10⁹ a' },
      extern: { de: 'Externe Prozesse', en: 'External Processes',
        was: 'Solarenergie, Gezeitenkräfte, Sternenstaub',
        nicht: 'gesellschaftlich angeeignete Energie',
        info: { de: 'Die Sonneneinstrahlung stellt 99,97 % des Energiehaushalts der Erdoberfläche. Dieser Eintrag treibt atmosphärische Zirkulation, Meeresströmungen und den Wasserkreislauf. Die Photosynthese bindet Sonnenenergie in biologische Systeme — doch Leben ist älter als die Photosynthese und beginnt im chemosynthetischen Stoffwechsel an hydrothermalen Quellen.', en: `Solar radiation provides 99.97% of Earth's surface energy budget. The energy input drives atmospheric circulation, oceanic currents, and the hydrological cycle. Photosynthesis captures solar energy into biological systems — but life predates photosynthesis, originating in chemosynthetic metabolism at hydrothermal vents.` }, zeitskala: '10⁰–10⁸ a' },
    },
  },
  nullnatur: {
    de: 'NullNatur', en: 'ZeroNature', farbe: '#2e2a6b',
    strata: {
      solar: { de: 'Solarer Raum · Ekliptik', en: 'Solar System',
        was: 'Relativität der Planeten zur Sonne; Ekliptik, Mond, Milanković',
        nicht: 'deren Klimawirkung',
        info: { de: 'Sterneigenschaften: Sonnenähnliche Sterne strahlen über Milliarden Jahre stabil. Gasriesen nach Art des Jupiter können die inneren Planeten vor zu starkem Bombardement abschirmen. Auf dieser Ebene hängt Bewohnbarkeit von der Bahnlage in der zirkumstellaren habitablen Zone ab.', en: `Stellar characteristics: Sun-like stars provide stable radiation over billions of years. The presence of Jupiter-analog gas giants may shield inner planets from excessive bombardment. At this level, habitability depends on orbital position within the circumstellar habitable zone.` }, zeitskala: '10⁷–10¹⁰ a' },
      interstellar: { de: 'Interstellarer Raum', en: 'Intergalactic / Interstellar Space',
        was: 'Relativität von Objekten im Raum', nicht: 'Vorgänge im Erdsystem' },
      kosmologisch: { de: 'Universell / Fundamental', en: 'Universal / Fundamental',
        was: 'Raum, Zeit, vier Grundkräfte', nicht: 'Flüsse auf der Erde',
        info: { de: 'Die vier Grundkräfte und die physikalischen Konstanten, die komplexe Chemie überhaupt erlauben — die anthropische Schranke. Auf dieser Ebene bezeichnet der Rahmen das kosmisch-physikalische Substrat, innerhalb dessen planetare Prozesse möglich werden. Die Null verweist auf vorempirische Grundlagen.', en: `The four fundamental forces and physical constants that permit complex chemistry — the anthropic constraint. At this level, the framework designates the cosmic-physical substrate within which all planetary processes become possible. The NULL designation signals pre-empirical foundations.` }, zeitskala: '10⁻⁴³–10¹⁷ s' },
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
/* ── Formen ───────────────────────────────────────────────────────────
   Keine Dimensionen, sondern Gestalten INNERHALB der Matrix (Kapital-
   genese-Diagramm). `bei` ist die Adresse, `ebene` die Marker-Ebene der
   Plattform, sofern es für diese Form überhaupt einen Datenweg gibt.
   Ohne `ebene` kann die Form nie belegt sein — das Analysefeld sagt das
   dann auch so, statt sie als „unbelegt" zu führen.                     */
export const FORMEN = /** @type {const} */ ({
  stoffstroeme:   { de: 'Stoff- und Energieströme + nichtmenschliche Arbeit',
                    en: 'Material and Energy Flows + Nonhuman Labour',
                    bei: 'planetarer_stoffwechsel/intern', ebene: 'pm' },
  materialbestand:{ de: 'Materialbestände', en: 'Material Stocks',
                    bei: 'erste_natur/erdsystem', ebene: 'erste_natur' },
  lohnarbeit:     { de: 'Lohnarbeit', en: 'Wage Labour',
                    bei: 'erste_natur/basis', ebene: null },
  klassenstruktur:{ de: 'Gesellschaftliche Klassenstruktur', en: 'Social Class Structure',
                    bei: 'erste_natur/basis', ebene: 'basis' },
  produktionsmittel:{ de: 'Produktionsmittel', en: 'Means of Production',
                    bei: 'gesellschaftlicher_stoffwechsel/mat_pm', ebene: 'bestaende' },
  gebrauchswert:  { de: 'Gebrauchswert', en: 'Use Value',
                    bei: 'gesellschaftlicher_stoffwechsel/mat_pm', ebene: null },
  ware:           { de: 'Ware / Mehrwert', en: 'Commodity / Added Value',
                    bei: 'zweite_natur/konstruierte_wirklichkeit', ebene: 'ware' },
  kapital:        { de: 'Kapital', en: 'Capital',
                    bei: 'zweite_natur/ueberbau', ebene: null },
  mehrwert:       { de: 'Mehrwert', en: 'Surplus Value',
                    bei: 'zweite_natur/ueberbau', ebene: null },
  integraler_staat:{ de: 'Integraler Staat', en: 'Integral State',
                    bei: 'zweite_natur/ueberbau', ebene: 'ueberbau' },
  produktionsweise:{ de: 'Produktions- und Distributionsweise', en: 'Mode of Production / Distribution',
                    bei: 'zweite_natur/ueberbau', ebene: null },
  symbolordnung:  { de: 'Symbolische Ordnung', en: 'Symbolic Order',
                    bei: 'zweite_natur/riss', ebene: 'riss' },
  abfall:         { de: 'Abfall', en: 'Waste',
                    bei: 'erste_natur/erdsystem', ebene: null },
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
  { von: 'symbolordnung',   nach: 'klassenstruktur',  typ: 'fasst' },
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
