// @ts-check
/* ════════════════════════════════════════════════════════════════════
   KERN — Schema. Die einzige Schicht, die die Theorie kennt
   (docs/strukturstand.md, Abschnitt Bauform). Hier stehen nur Konstanten
   und Typen; durchgesetzt wird in pruefe.mjs.
   Was hier fehlt, ist nicht entschieden. Offene Stellen: kern/BERICHT.md.
   ════════════════════════════════════════════════════════════════════ */

export const SCHEMA_VERSION = '0.6.0';

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
export const AUSGANGSARTEN = /** @type {const} */ (['stoff', 'energie', 'ware', 'abfall', 'waerme', 'mehrwert', 'daten']);
export const KAPITALFORMEN = /** @type {const} */ (['oekonomisch', 'sozial', 'kulturell', 'symbolisch', 'performativ_affektiv']);

/* ── Vorgänge ─────────────────────────────────────────────────────────
   Sechs Vorgänge plus Rückwirkung. Jede Relation ist ein eigener Eintrag. */
export const VORGAENGE = /** @type {const} */ ({
  stoffwechsel:              { name: 'Stoffwechsel',                bilanzierbar: true },
  rolle:                     { name: 'Rolle',                       bilanzierbar: false, modi: 'rolle' },
  anhaften:                  { name: 'Anhaften',                    bilanzierbar: false },
  einschliessen_realisieren: { name: 'Einschließen und Realisieren', bilanzierbar: false, modi: 'kapital' },
  konversion:                { name: 'Konversion',                  bilanzierbar: false },
  ueberlieferung:            { name: 'Überlieferung',               bilanzierbar: false, modi: 'ueberlieferung' },
});

/** Rolle: als was ein Ding in den Prozess eingespannt ist. */
export const ROLLEN = /** @type {const} */ (['rohstoff', 'arbeitsmittel', 'produkt']);

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
   Substanz mit Menge, die ihre Form wechselt. `erhaltung` sagt, was mit
   der Summe über alle Formen geschieht:
   - erhalten: bleibt gleich, bilanzierbar (Stoff, Energie)
   - nicht_erhalten: kann entstehen und verschwinden (Kapital)
   - vervielfaeltigbar: wird kopiert, ohne dass das Original abnimmt
     (Daten); keine Bilanzprüfung
   Je Erhaltung die zulässigen Relationsarten des Formwechsels. Er bleibt
   innerhalb eines Stapels oder Übergangs.
   Ein Bestand der 2. Natur führt `haengt_an` (Datenträger) wie jeder
   Eintrag der 2. Natur; `verweist_auf` nennt, wovon er handelt (etwa die
   erfasste Bevölkerung).                                                */
export const ERHALTUNG = /** @type {const} */ ({
  erhalten:          ['stoffwechsel'],
  nicht_erhalten:    ['einschliessen_realisieren'],
  vervielfaeltigbar: ['stoffwechsel', 'einschliessen_realisieren'],
});
export const formwechsel = (/** @type {string} */ erhaltung) =>
  /** @type {readonly string[]} */ (/** @type {any} */ (ERHALTUNG)[erhaltung] ?? []);

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
  // Überlieferung: wie sicher die Weitergabe an die nächste Generation ist.
  // Stufen der Quelle (Glottolog AES: EGIDS, UNESCO, ElCat zusammengeführt),
  // nicht vergröbert. erloschen = Abbruch der Kette, als Verlust gezeigt.
  ueberlieferung:      ['nicht_gefaehrdet', 'bedroht', 'im_wechsel', 'moribund', 'fast_erloschen', 'erloschen'],
});

/* ── Herkunft ─────────────────────────────────────────────────────────
   Gilt pro Wert und ist eine Menge. Rangfolge nur beobachtung >
   rekonstruktion > modell; kuratiert, erwartung und idealisiert sind
   Merkmale. Abgeleitete Werte tragen alle beteiligten Arten.
   idealisiert: Modellergebnis als Idealschicht (Bauform, Ideal,
   Beobachtung, Differenz). Gehört immer zu modell und umgekehrt.        */
export const HERKUNFTSARTEN = /** @type {const} */ (['beobachtung', 'rekonstruktion', 'modell', 'kuratiert', 'erwartung', 'idealisiert']);
export const HERKUNFT_RANG = /** @type {const} */ (['beobachtung', 'rekonstruktion', 'modell']);
export const HERKUNFT_MERKMALE = /** @type {const} */ (['kuratiert', 'erwartung', 'idealisiert']);

/** Was angezeigt wird: die schwächste Art aus der Rangfolge plus die Merkmale. */
export function anzeige(/** @type {string[]} */ arten) {
  const rang = arten.filter(a => /** @type {readonly string[]} */ (HERKUNFT_RANG).includes(a))
    .sort((a, b) => HERKUNFT_RANG.indexOf(/** @type {any} */ (b)) - HERKUNFT_RANG.indexOf(/** @type {any} */ (a)))[0] ?? null;
  const merkmale = HERKUNFT_MERKMALE.filter(m => arten.includes(m));
  return { rang, merkmale };
}

/* ── Ideale (Regel 13) ───────────────────────────────────────────────
   Welcher Zustand als Ideal gilt, ist eine Setzung (Regel 7). Ein Wert
   aus einem Modell oder einer Rekonstruktion verweist mit woher.ideal
   auf seine Ideal-Variante. Varianten derselben Gruppe sind konkurrierende
   Ideale: Kommt eine vor, kommen alle vor, auch wo sie zusammenfallen.
   @typedef {{id: string, name: string, gruppe: string, variante: string,
              gesetzt_in: string, begruendung: string|Fehlend}} Ideal          */
export const IDEAL_ARTEN = /** @type {const} */ (['modell', 'rekonstruktion']);

/* ── Bilanz: zwei Prüfarten (Regel 5) ─────────────────────────────────
   innere_stimmigkeit: beide Seiten aus derselben Quelle; zeigt, dass die
     Quelle mit sich selbst übereinstimmt, nicht, dass sie die Welt trifft.
   unabhaengige_beobachtung: eine Seite aus einer unabhängigen Quelle;
     das ist die Prüfung Modell gegen Welt.                              */
export const PRUEFARTEN = /** @type {const} */ ({
  innere_stimmigkeit: 'innere Stimmigkeit',
  unabhaengige_beobachtung: 'gegen unabhängige Beobachtung',
});

/* ── Konfidenz einer Quelle ────────────────────────────────────────────
   woher.konfidenz {skala, stufe}: wie sicher sich die Quelle selbst ist,
   in ihren eigenen Stufen und als Text. Keine Zahl: Eine Zahl wäre eine
   Wahrscheinlichkeit und bräuchte einen Erwartungsträger (Regel 4).     */

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
/** Näherung (Regel 10): Vertritt eine Geometrie eine andere, etwa ein Punkt
    ein Gebiet, steht das in wo.naeherung {vertritt, angabe}; die Verzerrung
    der vertretenen Geometrie ist dann Zahl oder fehlend, nie stillschweigend. */
export const NAEHERUNG_VERTRITT = /** @type {const} */ (['flaeche', 'linie']);
/** Geometrien, die ihre Verzerrung als Zahl mitführen müssen (Regel 10).
    Die Projektion entsteht erst in der Ansicht und wird dort ausgewiesen. */
export const MIT_VERZERRUNG = /** @type {const} */ (['flaeche', 'feld', 'grenze']);

/* ── Fehlendes ────────────────────────────────────────────────────────
   Fehlendes bleibt fehlend: nie null, nie weggelassen, immer mit Grund.  */
/** @param {string} grund */
export const fehlt = grund => ({ fehlt: /** @type {true} */ (true), grund });
/** @returns {x is {fehlt: true, grund: string}} */
export const istFehlend = (/** @type {any} */ x) => !!x && typeof x === 'object' && x.fehlt === true;

/** Was die Quelle nicht nennt, ist nicht erhoben. Ein fehlender Schlüssel
    und eine leere Liste der Quelle heißen beide so, nie "keine Beziehung":
    Das Fehlen einer Angabe ist keine Angabe über die Welt.
    @param {string} was */
export const nichtErhoben = was => fehlt(`${was}: nicht erhoben (fehlender Schlüssel oder leere Liste der Quelle; `
  + 'keine Aussage, dass keine Beziehung besteht)');

/* ── Einträge ─────────────────────────────────────────────────────────
   Das Schema kennt keine Eintragsart wie "Firma". Was die Quelle als
   Akteur führt, kann Firma, Behörde, Ministerium oder App sein; das
   bleibt Angabe der Quelle (kuratiert) und wird nicht vorausgesetzt.    */

/* ── Belege ───────────────────────────────────────────────────────────
   Jede Relation trägt `beleg`: eine Liste von Quellen für genau diese
   Relation, oder {ebene: BELEG_EINTRAGSEBENE, eintrag, quellen}, wenn die
   Quelle nur den Eintrag belegt und nicht die einzelne Beziehung, oder
   {fehlt, grund}.                                                      */
export const BELEG_EINTRAGSEBENE = 'nur_auf_eintragsebene';

/* ── Manifest ─────────────────────────────────────────────────────────
   Pflichtfelder eines Adapters. Jedes darf fehlend sein, aber nicht fehlen. */
export const MANIFEST_PFLICHT = /** @type {const} */ ([
  'id', 'quelle', 'stapel', 'vorgang', 'herkunft', 'zeitsemantik', 'geometrie', 'lizenz', 'weitergabe', 'auswahl',
  'reduktion',
]);
export const ZEITSEMANTIK_PFLICHT = /** @type {const} */ (['aufloesung', 'abdeckung', 'verzoegerung']);

/* ── Reduktion (Regel 11) ─────────────────────────────────────────────
   Was der Adapter verkleinert, steht als Liste von Schritten im Manifest,
   je {schritt, angabe}, etwa {schritt: 'vergroebern', angabe: '0.5° -> 2°'}.
   Die Liste ist nie fehlend: Die Reduktion macht der Adapter selbst.
   Leer nur, wenn nichts reduziert wurde.
   zusammenfassen nennt die Modelle; sind es mehrere, führt es min und max
   mit (Spannweite statt nur Mittelwert). Im Graphen trägt ein solcher
   Wert woher.modelle und spannweite {min, max}.                        */
export const REDUKTIONSSCHRITTE = /** @type {const} */ (['vergroebern', 'mitteln', 'auswaehlen', 'zusammenfassen']);
export const SPANNWEITE = /** @type {const} */ (['min', 'max']);

/* ── Typen ────────────────────────────────────────────────────────────
   @typedef {{fehlt: true, grund: string}} Fehlend
   @typedef {{seit: string, status: 'vorlaeufig'|'revidiert'}} Wissensstand
   @typedef {{skala: string, wert?: number, von?: number, bis?: number}} Bezugszeit
   @typedef {{archiv: string|Fehlend, art: keyof typeof ARCHIVARTEN|Fehlend}} Archivglied
   @typedef {{arten: string[], quelle: string, archivkette: (Archivglied|Fehlend)[],
              abgeleitet_aus?: string[], verfahren?: string, erwartungstraeger?: string, modelle?: string[],
              ideal?: string, konfidenz?: {skala: string, stufe: string}}} Woher
   @typedef {{wert: number|string|{verweis: string}|Fehlend, wissensstand: Wissensstand|Fehlend,
              woher: Woher, wahrscheinlichkeit?: number, gegenwert?: {betrag: number, einheit: string},
              tausch?: string, spannweite?: {min: number, max: number}}} Fassung
   @typedef {{schritt: typeof REDUKTIONSSCHRITTE[number], angabe: string,
              modelle?: string[], mitgefuehrt?: string[]}} Reduktionsschritt
   @typedef {{bezugszeit?: Bezugszeit|Fehlend, fassungen: Fassung[]}} Punkt
   @typedef {{skala: string, aufloesung: number|Fehlend, abdeckung: {von: number, bis: number}, schritte: number}} Zeitsemantik
   @typedef {{einheit: string, zeitsemantik?: Zeitsemantik, punkte: Punkt[]}} Groesse
   @typedef {{flaeche: number, ueberhoehung: number, [k: string]: any}} Verzerrung
   @typedef {{geometrie: string, gesetzt?: boolean, verzerrung?: Verzerrung, hinweis?: string,
              woher?: Woher, naeherung?: {vertritt: string, angabe: string}, [k: string]: any}} Wo
   @typedef {{id: string, stapel: string, unterebene?: Fehlend, name: string, wo?: Wo|Fehlend,
              haengt_an?: string[]|Fehlend, formation?: {id: string, von: number|string, bis: number|string}|Fehlend,
              auswahl?: string[], verwertungsqualitaet?: {modus: string},
              spur_von?: {bestand: string, form: string}|Fehlend, verweist_auf?: string[],
              werte: Record<string, Groesse|Fehlend>}} Eintrag
   @typedef {{id: string, name: string, eintrag?: string, prozess?: string}} Form
   @typedef {{id: string, name: string, erhaltung: keyof typeof ERHALTUNG, menge: Groesse|Fehlend, formen: Form[],
              haengt_an?: string[]|Fehlend, verweist_auf?: string[]|Fehlend}} Bestand
   @typedef {{von: string, herkunftsstapel: string, art: string, kapitalform?: string,
              kette?: string[]|Fehlend, richtung?: string, menge?: any}} Zufluss
   @typedef {{id: string, name: string, uebergang: string, richtung?: string,
              zufluesse: Zufluss[], ausgaenge: {nach: string, art: string, menge?: any}[]}} Prozess
   @typedef {string[] | {ebene: typeof BELEG_EINTRAGSEBENE, eintrag: string, quellen: string[]} | Fehlend} Beleg
   @typedef {{id: string, art: string, von: string|Fehlend, nach: string|Fehlend, prozess?: string, bestand?: string, modus?: string,
              als?: typeof ROLLEN[number], ware?: string|Fehlend, bezugszeit: Bezugszeit|Fehlend, beleg: Beleg,
              bilanz?: {einheit: string, zufluss: number|Fehlend, abfluss: (number|Fehlend)[], toleranz?: number,
                pruefart?: keyof typeof PRUEFARTEN, aus?: {zufluss: string, abfluss: string[]}},
              bilanzierbar?: boolean, erwartungstraeger?: string, wahrscheinlichkeit?: number,
              gegenwert?: {betrag: number, einheit: string}, tausch?: string,
              woher: Woher, wissensstand: Wissensstand|Fehlend}} Relation
   @typedef {{id: string, name: string, warenproduktion: boolean|Fehlend, gilt: {von: number|string, bis: number|string}}} Formation
   @typedef {{id: string, was: string, gesetzt_in: string, begruendung: string|Fehlend}} Auswahl
   @typedef {{schema: string, adapter?: any, formationen: Formation[], subjektachse: {status: string, grund?: string},
              auswahl: Auswahl[], ideale?: Ideal[], bestaende: Bestand[], eintraege: Eintrag[], prozesse: Prozess[],
              relationen: Relation[]}} Graph
*/
