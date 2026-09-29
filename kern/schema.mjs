// @ts-check
/* ════════════════════════════════════════════════════════════════════
   KERN — Schema. Die einzige Schicht, die die Theorie kennt
   (docs/strukturstand.md, Abschnitt Bauform). Hier stehen nur Konstanten
   und Typen; durchgesetzt wird in pruefe.mjs.
   Was hier fehlt, ist nicht entschieden. Offene Stellen: kern/BERICHT.md.
   ════════════════════════════════════════════════════════════════════ */

export const SCHEMA_VERSION = '0.2.0';

/* ── Stapel ───────────────────────────────────────────────────────────
   Drei Stapel, je drei Unterebenen. Die Reihenfolge codiert die Genese
   (unten nach oben) und sonst nichts: Relationen werden nie aus ihr
   abgeleitet (Regel 1).                                                */
export const STAPEL = /** @type {const} */ ({
  '0': { name: '0. Natur', unterebenen: {
    '0.1': 'universell/fundamental', '0.2': 'interstellarer Raum', '0.3': 'solarer Raum' } },
  '1': { name: '1. Natur', unterebenen: {
    '1.1': 'Erdsystem', '1.2': 'Unterbau (Basement)', '1.3': 'Basis' } },
  '2': { name: '2. Natur', unterebenen: {
    '2.1': 'kognitiver, gebauter Raum', '2.2': 'Überbau', '2.3': 'symbolisches System' } },
});

/** Genese: Stapelreihenfolge von unten nach oben. */
export const GENESE = /** @type {const} */ (['0', '1', '2']);

/** Alle Unterebenen, z. B. '1.1' → { stapel: '1', name: 'Erdsystem' }. */
export const UNTEREBENEN = Object.fromEntries(Object.entries(STAPEL).flatMap(([s, st]) =>
  Object.entries(st.unterebenen).map(([u, name]) => [u, { stapel: s, name }])));

/** Stapel einer Unterebene ('2.3' → '2') oder eines Stapels ('2' → '2').
    Ein Eintrag, dessen Unterebene nicht festgelegt ist, steht im Stapel
    und führt `unterebene` als fehlend. */
export const stapelVon = (/** @type {string} */ u) => UNTEREBENEN[u]?.stapel ?? (u in STAPEL ? u : undefined);

/* ── Übergänge ────────────────────────────────────────────────────────
   Keine Stapel. In ihnen laufen Prozesse.                              */
export const UEBERGAENGE = /** @type {const} */ ({
  planetar:        { name: 'planetarer Stoffwechsel',       zwischen: ['0', '1'] },
  gesellschaftlich:{ name: 'gesellschaftlicher Stoffwechsel', zwischen: ['1', '2'] },
});

/* ── 0. Natur: Zuflüsse ───────────────────────────────────────────────
   Jeder Zufluss aus der 0. Natur trägt eine Kette von Grundkräften und
   die Richtung extern/intern. Beides unabhängig voneinander.            */
export const GRUNDKRAEFTE = /** @type {const} */ (['gravitation', 'elektromagnetismus', 'stark', 'schwach']);
export const RICHTUNGEN = /** @type {const} */ (['extern', 'intern']);

/* ── Prozess als Knoten ───────────────────────────────────────────────
   Gehört keinem Stapel. Zuflüsse tragen ihren Herkunftsstapel.          */
export const ZUFLUSSARTEN = /** @type {const} */ (['stoff', 'energie', 'nichtmenschliche_arbeit', 'kapital', 'zeit']);
export const AUSGANGSARTEN = /** @type {const} */ (['stoff', 'energie', 'ware', 'abfall', 'waerme', 'mehrwert']);
export const KAPITALFORMEN = /** @type {const} */ (['oekonomisch', 'sozial', 'kulturell', 'symbolisch', 'performativ_affektiv']);

/* ── Vorgänge ─────────────────────────────────────────────────────────
   Sechs Vorgänge plus Rückwirkung. Jede Relation ist ein eigener Eintrag. */
export const VORGAENGE = /** @type {const} */ ({
  stoffwechsel:              { name: 'Stoffwechsel',                bilanzierbar: true },
  rolle:                     { name: 'Rolle',                       bilanzierbar: false, modi: 'rolle' },
  anhaften:                  { name: 'Anhaften',                    bilanzierbar: false },
  einschliessen_realisieren: { name: 'Einschließen und Realisieren', bilanzierbar: false, modi: 'kapital' },
  konversion:                { name: 'Konversion',                  bilanzierbar: false },
  ueberlieferung:            { name: 'Überlieferung',               bilanzierbar: false },
});

/** Rückwirkung: oben nach unten, darf Ebenen überspringen. Kein Vorgang. */
export const RUECKWIRKUNG = 'rueckwirkung';

export const RELATIONSARTEN = /** @type {const} */ ([...Object.keys(VORGAENGE), RUECKWIRKUNG]);

/** Verworfene Relationsarten und warum (strukturstand, Verworfene Annahmen). */
export const VERWORFEN = /** @type {const} */ ({
  identitaet: 'Identität ist pro Stapel eigenständig; eine Identitätsrelation über Stapel wird nicht gespeichert',
  einbettung: 'Einbettung als Grundbeziehung zwischen den Naturen ist verworfen',
});

/** Relationen, bei denen ein Gegenwert entstehen kann (Tausch). */
export const TAUSCHVORGAENGE = /** @type {const} */ (['konversion', 'einschliessen_realisieren']);

/* ── Bestände (Welt) ──────────────────────────────────────────────────
   Substanz mit Menge, die ihre Form wechselt. `erhalten` sagt, ob die
   Summe über alle Formen gleich bleibt (Stoff ja, Kapital nein). Der
   Formwechsel ist ein Stoffwechsel, bei Kapital Einschließen und
   Realisieren; er bleibt innerhalb eines Stapels oder Übergangs.       */
export const formwechsel = (/** @type {boolean} */ erhalten) =>
  erhalten ? 'stoffwechsel' : 'einschliessen_realisieren';

/* ── Archive (Wissen) ─────────────────────────────────────────────────
   Jedes woher trägt eine Kette durch Archive, beginnend bei zeroearth.  */
export const ARCHIVARTEN = /** @type {const} */ ({
  natuerlich:     { stapel: '1', speichert: 'Akkumulation', liefert: ['rekonstruktion'], verlust: 'Erosion, Überlagerung' },
  gesellschaftlich:{ stapel: '2', speichert: 'Überlieferung', liefert: ['beobachtung', 'kuratiert'], verlust: 'Abbruch der Neuverankerung' },
  zeroearth:      { stapel: '2', speichert: 'bitemporale Fassungen, Git', liefert: ['alles Obige, ausgewiesen'], verlust: null },
});

/* ── Modi ─────────────────────────────────────────────────────────── */
export const MODI = /** @type {const} */ ({
  rolle:               ['vollzogen', 'erwartet', 'zugeschrieben'],
  kapital:             ['fliessend', 'eingeschlossen', 'realisiert', 'entwertet', 'verloren', 'ueberlagert'],
  verwertungsqualitaet:['potenz', 'realisiert'],
});

/* ── Herkunft ─────────────────────────────────────────────────────────
   Gilt pro Wert und ist eine Menge. Rangfolge nur beobachtung >
   rekonstruktion > modell; kuratiert und erwartung sind Merkmale.
   Abgeleitete Werte tragen alle beteiligten Arten.                      */
export const HERKUNFTSARTEN = /** @type {const} */ (['beobachtung', 'rekonstruktion', 'modell', 'kuratiert', 'erwartung']);
export const HERKUNFT_RANG = /** @type {const} */ (['beobachtung', 'rekonstruktion', 'modell']);
export const HERKUNFT_MERKMALE = /** @type {const} */ (['kuratiert', 'erwartung']);

/** Was angezeigt wird: die schwächste Art aus der Rangfolge plus die Merkmale. */
export function anzeige(/** @type {string[]} */ arten) {
  const rang = arten.filter(a => /** @type {readonly string[]} */ (HERKUNFT_RANG).includes(a))
    .sort((a, b) => HERKUNFT_RANG.indexOf(/** @type {any} */ (b)) - HERKUNFT_RANG.indexOf(/** @type {any} */ (a)))[0] ?? null;
  const merkmale = HERKUNFT_MERKMALE.filter(m => arten.includes(m));
  return { rang, merkmale };
}

/** Die Plattform ist kein Erwartungsträger: sie rechnet keine eigenen Wahrscheinlichkeiten. */
export const KEIN_ERWARTUNGSTRAEGER = /** @type {const} */ (['zeroearth', 'plattform']);

/* ── Zeit ─────────────────────────────────────────────────────────────
   Bitemporal: Bezugszeit (wann der Wert gilt) und Wissensstand (seit wann
   er so bekannt ist). Revisionen fügen Fassungen hinzu.
   Die Bezugszeit bleibt in der Skala der Quelle; es gibt keine gemeinsame
   Achse, auf die umgerechnet würde.                                     */
export const WISSENSSTATUS = /** @type {const} */ (['vorlaeufig', 'revidiert']);

/* ── Geometrie ────────────────────────────────────────────────────────
   Nur für Träger der 1. Natur (und verortbare Teile der 0. Natur).
   `grenze` ist nie gemessen, immer abgeleitet, und Spur einer Form.     */
export const GEOMETRIEN = /** @type {const} */ (['punkt', 'flaeche', 'feld', 'grenze']);
/** Geometrien, die ihre Verzerrung als Zahl mitführen müssen (Regel 10).
    Die Projektion entsteht erst in der Ansicht und wird dort ausgewiesen. */
export const MIT_VERZERRUNG = /** @type {const} */ (['flaeche', 'feld', 'grenze']);

/* ── Fehlendes ────────────────────────────────────────────────────────
   Fehlendes bleibt fehlend: nie null, nie weggelassen, immer mit Grund.  */
/** @param {string} grund */
export const fehlt = grund => ({ fehlt: /** @type {true} */ (true), grund });
/** @returns {x is {fehlt: true, grund: string}} */
export const istFehlend = (/** @type {any} */ x) => !!x && typeof x === 'object' && x.fehlt === true;

/* ── Manifest ─────────────────────────────────────────────────────────
   Pflichtfelder eines Adapters. Jedes darf fehlend sein, aber nicht fehlen. */
export const MANIFEST_PFLICHT = /** @type {const} */ ([
  'id', 'quelle', 'stapel', 'vorgang', 'herkunft', 'zeitsemantik', 'geometrie', 'lizenz', 'weitergabe', 'auswahl',
]);
export const ZEITSEMANTIK_PFLICHT = /** @type {const} */ (['aufloesung', 'abdeckung', 'verzoegerung']);

/* ── Typen ────────────────────────────────────────────────────────────
   @typedef {{fehlt: true, grund: string}} Fehlend
   @typedef {{seit: string, status: 'vorlaeufig'|'revidiert'}} Wissensstand
   @typedef {{skala: string, wert?: number, von?: number, bis?: number}} Bezugszeit
   @typedef {{archiv: string|Fehlend, art: keyof typeof ARCHIVARTEN|Fehlend}} Archivglied
   @typedef {{arten: string[], quelle: string, archivkette: (Archivglied|Fehlend)[],
              abgeleitet_aus?: string[], verfahren?: string, erwartungstraeger?: string}} Woher
   @typedef {{wert: number|string|{verweis: string}|Fehlend, wissensstand: Wissensstand|Fehlend,
              woher: Woher, wahrscheinlichkeit?: number, gegenwert?: {betrag: number, einheit: string},
              tausch?: string}} Fassung
   @typedef {{bezugszeit?: Bezugszeit|Fehlend, fassungen: Fassung[]}} Punkt
   @typedef {{skala: string, aufloesung: number|Fehlend, abdeckung: {von: number, bis: number}, schritte: number}} Zeitsemantik
   @typedef {{einheit: string, zeitsemantik?: Zeitsemantik, punkte: Punkt[]}} Groesse
   @typedef {{flaeche: number, ueberhoehung: number, [k: string]: any}} Verzerrung
   @typedef {{geometrie: string, gesetzt?: boolean, verzerrung?: Verzerrung, hinweis?: string,
              woher?: Woher, [k: string]: any}} Wo
   @typedef {{id: string, stapel: string, unterebene?: Fehlend, name: string, wo?: Wo|Fehlend,
              haengt_an?: string[]|Fehlend, formation?: {id: string, von: number|string, bis: number|string}|Fehlend,
              auswahl?: string[], verwertungsqualitaet?: {modus: string},
              spur_von?: {bestand: string, form: string}|Fehlend,
              werte: Record<string, Groesse|Fehlend>}} Eintrag
   @typedef {{id: string, name: string, eintrag?: string, prozess?: string}} Form
   @typedef {{id: string, name: string, erhalten: boolean, menge: Groesse|Fehlend, formen: Form[]}} Bestand
   @typedef {{von: string, herkunftsstapel: string, art: string, kapitalform?: string,
              kette?: string[]|Fehlend, richtung?: string, menge?: any}} Zufluss
   @typedef {{id: string, name: string, uebergang: string, richtung?: string,
              zufluesse: Zufluss[], ausgaenge: {nach: string, art: string, menge?: any}[]}} Prozess
   @typedef {{id: string, art: string, von: string, nach: string, prozess?: string, bestand?: string, modus?: string,
              bilanz?: {einheit: string, zufluss: number|Fehlend, abfluss: (number|Fehlend)[], toleranz?: number},
              bilanzierbar?: boolean, erwartungstraeger?: string, wahrscheinlichkeit?: number,
              gegenwert?: {betrag: number, einheit: string}, tausch?: string,
              woher: Woher, wissensstand: Wissensstand|Fehlend}} Relation
   @typedef {{id: string, name: string, warenproduktion: boolean|Fehlend, gilt: {von: number|string, bis: number|string}}} Formation
   @typedef {{id: string, was: string, gesetzt_in: string, begruendung: string|Fehlend}} Auswahl
   @typedef {{schema: string, adapter?: any, formationen: Formation[], subjektachse: {status: string, grund?: string},
              auswahl: Auswahl[], bestaende: Bestand[], eintraege: Eintrag[], prozesse: Prozess[],
              relationen: Relation[]}} Graph
*/
