// @ts-check
/* Jede Regel wird gezielt verletzt. Geprüft wird zweimal: dass pruefe()
   den Verstoß unter der richtigen Regel meldet, und dass die Prüfung auf
   der Kommandozeile mit Rückgabewert ungleich 0 abbricht.
   Die Testdaten sind Testdaten (Präfix t/), keine Aussagen über die Welt. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pruefe, pruefeManifest } from '../pruefe.mjs';
import { fehlt, anzeige } from '../schema.mjs';

const PRUEFE = fileURLToPath(new URL('../pruefe.mjs', import.meta.url));
const WS = { seit: '2026-09-29', status: 'vorlaeufig' };
const Q = 'Testquelle';
const KETTE = [{ archiv: 'zeroearth', art: 'zeroearth' }, { archiv: 'Testarchiv', art: 'gesellschaftlich' }];
/** Herkunft als Menge mit Archivkette. */
const W = (/** @type {string[]} */ arten, extra = {}) => ({ arten, quelle: Q, archivkette: KETTE, ...extra });
const fassung = (/** @type {any} */ wert, /** @type {any} */ woher = W(['beobachtung']), extra = {}) =>
  ({ wert, wissensstand: WS, woher, ...extra });
const einzel = (/** @type {string} */ einheit, /** @type {any} */ f, bezugszeit = { skala: 'a CE', wert: 2000 }) =>
  ({ einheit, punkte: [{ bezugszeit, fassungen: [f] }] });
const VERZERRUNG = { flaeche: 1, ueberhoehung: 1 };

/** Ein gültiger Graph, der jede Regel berührt. */
function gueltig() {
  return {
    schema: 'test',
    formationen: [
      { id: 't/f-ware', name: 'mit Warenproduktion', warenproduktion: true, gilt: { von: 1900, bis: 'offen' } },
      { id: 't/f-ohne', name: 'ohne Warenproduktion', warenproduktion: false, gilt: { von: -10000, bis: -8000 } },
    ],
    subjektachse: { status: 'leer' },
    auswahl: [{ id: 't/a', was: 'Testausschnitt', gesetzt_in: 'test', begruendung: 'Test' }],
    bestaende: [
      { id: 't/wasser', name: 'Wasser', erhalten: true, menge: fehlt('nicht im Test'),
        formen: [{ id: 'eis', name: 'Eis', eintrag: 't/eis' }, { id: 'ozean', name: 'Ozean', eintrag: 't/ozean' }] },
      { id: 't/kapital', name: 'Kapital', erhalten: false, menge: fehlt('nicht im Test'),
        formen: [{ id: 'geld', name: 'Geld', eintrag: 't/geld' }, { id: 'ware', name: 'Ware', eintrag: 't/eigentum' }] },
    ],
    eintraege: [
      { id: 't/grundkraft', stapel: '0.1', name: 'Grundkraft', werte: {} },
      { id: 't/sonne', stapel: '0.3', name: 'Sonne', wo: { geometrie: 'punkt' }, werte: {} },
      {
        id: 't/kohle', stapel: '1.1', name: 'Kohle', auswahl: ['t/a'],
        wo: { geometrie: 'flaeche', gesetzt: true, verzerrung: VERZERRUNG },
        werte: {
          masse: {
            einheit: 'kg',
            zeitsemantik: { skala: 'a CE', aufloesung: 1, abdeckung: { von: 2000, bis: 2001 }, schritte: 2 },
            punkte: [
              { bezugszeit: { skala: 'a CE', wert: 2000 }, fassungen: [
                fassung(10),
                { wert: 11, wissensstand: { seit: '2026-10-01', status: 'revidiert' }, woher: W(['beobachtung']) },
              ] },
              { bezugszeit: { skala: 'a CE', wert: 2001 }, fassungen: [fassung(fehlt('Messung ausgefallen'))] },
            ],
          },
        },
      },
      { id: 't/modell', stapel: '1.1', name: 'Rekonstruktion', wo: { geometrie: 'feld', verzerrung: VERZERRUNG },
        werte: { x: einzel('m', fassung(1, W(['rekonstruktion']))) } },
      { id: 't/ideal', stapel: '1.1', name: 'Idealschicht', wo: { geometrie: 'feld', verzerrung: VERZERRUNG },
        werte: { y: einzel('m', fassung(2, W(['modell', 'idealisiert'], { modelle: ['A', 'B', 'C'] }),
          { spannweite: { min: 1, max: 4 } })) } },
      { id: 't/co2', stapel: '1.1', name: 'CO2', wo: { geometrie: 'punkt' }, werte: {} },
      { id: 't/eis', stapel: '1.1', name: 'Eis', wo: fehlt('nicht im Test'), werte: {} },
      { id: 't/ozean', stapel: '1.1', name: 'Ozean', wo: fehlt('nicht im Test'), werte: {} },
      { id: 't/kennwert', stapel: '1.1', name: 'Kennwert', werte: {
        k: einzel('1', fassung(0.5, W(['beobachtung', 'rekonstruktion'], { abgeleitet_aus: ['t/kohle#masse', 't/modell#x'] }))),
      } },
      { id: 't/kueste', stapel: '1.1', name: 'Grenze', werte: {}, spur_von: { bestand: 't/wasser', form: 'ozean' },
        wo: { geometrie: 'grenze', koordinaten: fehlt('nicht im Test'), hinweis: 'abgeleitet',
          verzerrung: VERZERRUNG, woher: W(['rekonstruktion'], { abgeleitet_aus: ['t/modell#x'] }) } },
      {
        id: 't/eigentum', stapel: '2.2', name: 'Eigentum', haengt_an: ['t/kohle'],
        formation: { id: 't/f-ware', von: 1990, bis: 'offen' }, verwertungsqualitaet: { modus: 'potenz' },
        werte: { preis: einzel('EUR', fassung(100, undefined, { gegenwert: { betrag: 100, einheit: 'EUR' }, tausch: 't/r-tausch' })) },
      },
      { id: 't/geld', stapel: '2.2', name: 'Geld', haengt_an: fehlt('nicht im Test'),
        formation: { id: 't/f-ware', von: 1990, bis: 'offen' }, werte: {} },
      {
        id: 't/prognose', stapel: '2.3', name: 'Prognose', haengt_an: fehlt('kein Träger bekannt'),
        formation: { id: 't/f-ware', von: 2020, bis: 'offen' },
        werte: {
          p: einzel('1', fassung(0.3, W(['erwartung'], { erwartungstraeger: 'Testfirma' }), { wahrscheinlichkeit: 0.3 })),
          q: einzel('1', fassung(0.6, W(['erwartung', 'rekonstruktion'],
            { erwartungstraeger: 'Testfirma', abgeleitet_aus: ['t/prognose#p', 't/modell#x'] }))),
        },
      },
      { id: 't/notiz', stapel: '2', unterebene: fehlt('nicht festgelegt'), name: 'Notiz', haengt_an: ['t/kohle'],
        formation: fehlt('keine Formation genannt'), werte: {} },
    ],
    prozesse: [{
      id: 't/p', name: 'Verbrennung', uebergang: 'gesellschaftlich',
      zufluesse: [
        { von: 't/kohle', herkunftsstapel: '1.1', art: 'stoff' },
        { von: 't/sonne', herkunftsstapel: '0.3', art: 'energie', kette: ['stark', 'elektromagnetismus'], richtung: 'extern' },
        { von: 't/eigentum', herkunftsstapel: '2.2', art: 'kapital', kapitalform: 'oekonomisch', modus: 'fliessend' },
      ],
      ausgaenge: [{ nach: 't/co2', art: 'abfall' }],
    }],
    relationen: [
      { id: 't/r-stoff', art: 'stoffwechsel', von: 't/kohle', nach: 't/co2', prozess: 't/p',
        bilanz: { einheit: 'kg', zufluss: 10, abfluss: [7, 3] }, woher: W(['beobachtung']), wissensstand: WS },
      { id: 't/r-schmelze', art: 'stoffwechsel', bestand: 't/wasser', von: 't/eis', nach: 't/ozean',
        bilanz: { einheit: 'kg', zufluss: fehlt('offen'), abfluss: [fehlt('offen')] }, woher: W(['kuratiert']), wissensstand: WS },
      { id: 't/r-kauf', art: 'einschliessen_realisieren', bestand: 't/kapital', von: 't/geld', nach: 't/eigentum',
        modus: 'eingeschlossen', woher: W(['kuratiert']), wissensstand: WS },
      { id: 't/r-tausch', art: 'konversion', von: 't/eigentum', nach: 't/kohle', woher: W(['kuratiert']), wissensstand: WS },
      { id: 't/r-haftet', art: 'anhaften', von: 't/eigentum', nach: 't/kohle', woher: W(['kuratiert']), wissensstand: WS },
      { id: 't/r-rueck', art: 'rueckwirkung', von: 't/eigentum', nach: 't/kohle', woher: W(['kuratiert']), wissensstand: WS },
      { id: 't/r-rolle', art: 'rolle', modus: 'erwartet', erwartungstraeger: 'Testfirma', von: 't/kohle', nach: 't/p',
        woher: W(['kuratiert']), wissensstand: WS },
    ],
  };
}

/** @param {any} b @param {string} id */
const e = (b, id) => b.eintraege.find((/** @type {any} */ x) => x.id === id);
/** @param {any} b @param {string} id */
const r = (b, id) => b.relationen.find((/** @type {any} */ x) => x.id === id);
/** @param {any} b @param {string} id */
const best = (b, id) => b.bestaende.find((/** @type {any} */ x) => x.id === id);
/** @param {any} b */
const woherK = b => e(b, 't/kennwert').werte.k.punkte[0].fassungen[0].woher;

test('der gültige Graph besteht', () => {
  const { fehler } = pruefe(gueltig());
  assert.deepEqual(fehler, []);
});

test('der gültige Graph besteht auf der Kommandozeile', () => {
  const lauf = spawnSync(process.execPath, [PRUEFE, '-'], { input: JSON.stringify(gueltig()), encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stdout + lauf.stderr);
});

test('Anzeige: schwächste aus der Rangfolge plus Merkmale', () => {
  assert.deepEqual(anzeige(['beobachtung', 'rekonstruktion']), { rang: 'rekonstruktion', merkmale: [] });
  assert.deepEqual(anzeige(['modell', 'beobachtung', 'kuratiert']), { rang: 'modell', merkmale: ['kuratiert'] });
  assert.deepEqual(anzeige(['erwartung', 'rekonstruktion']), { rang: 'rekonstruktion', merkmale: ['erwartung'] });
  assert.deepEqual(anzeige(['kuratiert']), { rang: null, merkmale: ['kuratiert'] });
  assert.deepEqual(anzeige(['beobachtung', 'modell', 'idealisiert']), { rang: 'modell', merkmale: ['idealisiert'] });
});

/** @type {[string|number, string, (b: any) => void][]} */
const VERSTOESSE = [
  // Regel 1
  [1, 'Identitätsrelation über Stapel', b => b.relationen.push({ ...r(b, 't/r-haftet'), id: 't/r-id', art: 'identitaet' })],
  [1, 'Relation aus der Stapelreihenfolge', b => { r(b, 't/r-rueck').woher.quelle = 'Stapelreihenfolge'; }],
  [1, 'Relation im Eintrag statt als eigener Eintrag', b => { e(b, 't/kohle').setzt_voraus = ['t/sonne']; }],
  [1, 'identisch_mit am Eintrag', b => { e(b, 't/kohle').identisch_mit = 't/eigentum'; }],
  [1, 'Relation auf Unbekanntes', b => { r(b, 't/r-stoff').nach = 't/nirgends'; }],
  [1, 'Relation ohne eigene Herkunft', b => { delete r(b, 't/r-haftet').woher; }],
  // Regel 2
  [2, '2. Natur mit eigenem wo', b => { e(b, 't/eigentum').wo = { geometrie: 'punkt' }; }],
  [2, '2. Natur ohne haengt_an', b => { delete e(b, 't/eigentum').haengt_an; }],
  [2, '2. Natur ohne Formation', b => { delete e(b, 't/eigentum').formation; }],
  [2, 'Formation fehlend ohne Begründung', b => { e(b, 't/notiz').formation = { fehlt: true }; }],
  [2, 'Formationsverweis ohne Zeit', b => { delete e(b, 't/eigentum').formation.bis; }],
  [2, 'Verwertungsqualität ohne Warenproduktion', b => { e(b, 't/eigentum').formation.id = 't/f-ohne'; }],
  [2, 'Verwertungsqualität bei fehlender Formation', b => { e(b, 't/notiz').verwertungsqualitaet = { modus: 'potenz' }; }],
  [2, 'haengt_an in der 1. Natur', b => { e(b, 't/co2').haengt_an = ['t/kohle']; }],
  [2, 'Anhaften von der 1. Natur aus', b => { r(b, 't/r-haftet').von = 't/co2'; }],
  // Regel 3
  [3, 'Gegenwert ohne Tausch', b => { delete e(b, 't/eigentum').werte.preis.punkte[0].fassungen[0].tausch; }],
  [3, 'Gegenwert aus einem Stoffwechsel', b => { e(b, 't/eigentum').werte.preis.punkte[0].fassungen[0].tausch = 't/r-stoff'; }],
  [3, 'Gegenwert an der Stoffbilanz', b => { r(b, 't/r-stoff').gegenwert = { betrag: 5, einheit: 'EUR' }; }],
  // Regel 4
  [4, 'Wahrscheinlichkeit ohne Erwartungsträger', b => { delete e(b, 't/prognose').werte.p.punkte[0].fassungen[0].woher.erwartungstraeger; }],
  [4, 'die Plattform als Erwartungsträger', b => { e(b, 't/prognose').werte.p.punkte[0].fassungen[0].woher.erwartungstraeger = 'zeroearth'; }],
  [4, 'Wahrscheinlichkeit ohne Art erwartung', b => { e(b, 't/prognose').werte.p.punkte[0].fassungen[0].woher.arten = ['beobachtung']; }],
  [4, 'erwartete Rolle ohne Träger', b => { delete r(b, 't/r-rolle').erwartungstraeger; }],
  // Regel 5
  [5, 'Stoffbilanz nicht geschlossen', b => { r(b, 't/r-stoff').bilanz.abfluss = [7, 2]; }],
  [5, 'Stoffwechsel ohne Bilanz', b => { delete r(b, 't/r-stoff').bilanz; }],
  [5, 'Formwechsel Eis → Ozean ohne Bilanz', b => { delete r(b, 't/r-schmelze').bilanz; }],
  [5, 'Kapitalfluss bilanziert', b => { r(b, 't/r-tausch').bilanz = { einheit: 'EUR', zufluss: 1, abfluss: [1] }; }],
  [5, 'Kapital-Formwechsel bilanziert', b => { r(b, 't/r-kauf').bilanz = { einheit: 'EUR', zufluss: 1, abfluss: [1] }; }],
  [5, 'Kapitalfluss als bilanzierbar markiert', b => { r(b, 't/r-tausch').bilanzierbar = true; }],
  [5, 'Kapitalzufluss als bilanzierbar markiert', b => { b.prozesse[0].zufluesse[2].bilanzierbar = true; }],
  // Regel 6
  [6, 'Wert ohne Herkunft', b => { delete e(b, 't/modell').werte.x.punkte[0].fassungen[0].woher; }],
  [6, 'Herkunft am Eintrag statt am Wert', b => { e(b, 't/co2').woher = W(['beobachtung']); }],
  [6, 'Herkunft als einzelne Art statt Menge', b => { e(b, 't/modell').werte.x.punkte[0].fassungen[0].woher = { art: 'rekonstruktion', quelle: Q, archivkette: KETTE }; }],
  [6, 'Herkunft ohne arten', b => { e(b, 't/modell').werte.x.punkte[0].fassungen[0].woher.arten = []; }],
  [6, 'arten doppelt', b => { e(b, 't/modell').werte.x.punkte[0].fassungen[0].woher.arten = ['modell', 'modell']; }],
  [6, 'unbekannte Herkunftsart', b => { e(b, 't/modell').werte.x.punkte[0].fassungen[0].woher.arten = ['gefühlt']; }],
  [6, 'Abgeleitetes verliert eine beteiligte Art', b => { woherK(b).arten = ['beobachtung']; }],
  [6, 'Grenze verliert die Herkunft ihrer Quelle', b => { e(b, 't/modell').werte.x.punkte[0].fassungen[0].woher.arten = ['modell']; }],
  [6, 'Ableitung aus erwartung bleibt nicht erwartung', b => {
    e(b, 't/prognose').werte.q.punkte[0].fassungen[0].woher.arten = ['rekonstruktion'];
  }],
  [6, 'Herkunft ohne Archivkette', b => { delete woherK(b).archivkette; }],
  [6, 'unbekannte Archivart', b => { woherK(b).archivkette = [KETTE[0], { archiv: 'x', art: 'digital' }]; }],
  [6, 'modell ohne idealisiert', b => { e(b, 't/ideal').werte.y.punkte[0].fassungen[0].woher.arten = ['modell']; }],
  [6, 'idealisiert ohne modell', b => { e(b, 't/ideal').werte.y.punkte[0].fassungen[0].woher.arten = ['beobachtung', 'idealisiert']; }],
  [6, 'Differenz verliert idealisiert', b => {
    e(b, 't/kohle').werte.diff = einzel('m', fassung(1, W(['beobachtung', 'modell'], { abgeleitet_aus: ['t/kohle#masse', 't/ideal#y'] })));
  }],
  [6, 'Archivglied ohne Archiv', b => { woherK(b).archivkette = [KETTE[0], { art: 'natuerlich' }]; }],
  // Regel 7
  [7, 'Auswahl nicht ausgewiesen', b => { delete b.auswahl; }],
  [7, 'gesetzter Ausschnitt ohne Auswahl', b => { delete e(b, 't/kohle').auswahl; }],
  [7, 'Verweis auf unbekannte Auswahl', b => { e(b, 't/kohle').auswahl = ['t/keine']; }],
  [7, 'Auswahl ohne Begründung', b => { delete b.auswahl[0].begruendung; }],
  // Regel 8
  [8, 'null statt fehlend', b => { e(b, 't/modell').werte.x.punkte[0].fassungen[0].wert = null; }],
  [8, 'Lücke weggelassen', b => { e(b, 't/kohle').werte.masse.punkte.pop(); }],
  [8, 'fehlend ohne Grund', b => { e(b, 't/kohle').werte.masse.punkte[1].fassungen[0].wert = { fehlt: true }; }],
  [8, 'interpolierter Wert', b => { e(b, 't/kohle').werte.masse.punkte[1].fassungen[0] = { ...fassung(10.5), interpoliert: true }; }],
  [8, 'Subjektachse nicht geführt', b => { delete b.subjektachse; }],
  [8, 'Subjektachse gefüllt', b => { b.subjektachse = { status: 'belegt' }; }],
  // Regel 9
  [9, 'Archivkette beginnt nicht bei zeroearth', b => { woherK(b).archivkette = [KETTE[1]]; }],
  [9, 'zeroearth mitten in der Kette', b => { woherK(b).archivkette = [KETTE[0], KETTE[1], KETTE[0]]; }],
  [9, 'Relation ohne zeroearth in der Kette', b => { r(b, 't/r-haftet').woher.archivkette = [{ archiv: 'x', art: 'gesellschaftlich' }]; }],
  // Regel 10
  [10, 'Fläche ohne Flächenverzerrung', b => { delete e(b, 't/kohle').wo.verzerrung.flaeche; }],
  [10, 'Überhöhung nicht als Zahl', b => { e(b, 't/modell').wo.verzerrung = { flaeche: 1, ueberhoehung: 'keine' }; }],
  [10, 'Grenze ohne Verzerrung', b => { delete e(b, 't/kueste').wo.verzerrung; }],
  // Regel 11
  [11, 'mehrere Modelle ohne Spannweite', b => { delete e(b, 't/ideal').werte.y.punkte[0].fassungen[0].spannweite; }],
  [11, 'Spannweite ohne max', b => { delete e(b, 't/ideal').werte.y.punkte[0].fassungen[0].spannweite.max; }],
  [11, 'Wert außerhalb der Spannweite', b => { e(b, 't/ideal').werte.y.punkte[0].fassungen[0].wert = 5; }],
  [11, 'Spannweite ohne Modelle', b => { delete e(b, 't/ideal').werte.y.punkte[0].fassungen[0].woher.modelle; }],
  // Bestände und Formen
  ['B', 'Bestände nicht geführt', b => { delete b.bestaende; }],
  ['B', 'erhalten nicht angegeben', b => { delete best(b, 't/wasser').erhalten; }],
  ['B', 'Bestand ohne Menge', b => { delete best(b, 't/wasser').menge; }],
  ['B', 'Formen über die Stapelgrenze', b => { best(b, 't/wasser').formen[1].eintrag = 't/eigentum'; }],
  ['B', 'Form in Stapel und Übergang', b => { best(b, 't/wasser').formen[1] = { id: 'ozean', name: 'Ozean', prozess: 't/p' }; }],
  ['B', 'Formwechsel mit fremder Form', b => { r(b, 't/r-schmelze').nach = 't/co2'; }],
  ['B', 'Stoff-Formwechsel als Einschließen', b => { Object.assign(r(b, 't/r-schmelze'), { art: 'einschliessen_realisieren' }); delete r(b, 't/r-schmelze').bilanz; }],
  ['B', 'Kapital-Formwechsel als Stoffwechsel', b => { Object.assign(r(b, 't/r-kauf'), { art: 'stoffwechsel', bilanz: { einheit: 'EUR', zufluss: fehlt('x'), abfluss: [fehlt('x')] } }); delete r(b, 't/r-kauf').modus; }],
  ['B', 'Grenze ohne Spur', b => { delete e(b, 't/kueste').spur_von; }],
  ['B', 'Spur einer unbekannten Form', b => { e(b, 't/kueste').spur_von.form = 'dampf'; }],
  // Struktur
  ['S', 'Prozess in einem Stapel', b => { b.prozesse[0].stapel = '1.3'; }],
  ['S', 'Übergang als Stapel', b => { e(b, 't/co2').stapel = 'planetar'; }],
  ['S', 'Stapel ohne Unterebene und ohne Begründung', b => { delete e(b, 't/notiz').unterebene; }],
  ['S', 'Revision überschreibt', b => { e(b, 't/kohle').werte.masse.punkte[0].fassungen[1].wissensstand.seit = '2026-09-01'; }],
  ['S', 'Revision nicht als revidiert', b => { e(b, 't/kohle').werte.masse.punkte[0].fassungen[1].wissensstand.status = 'vorlaeufig'; }],
  ['S', 'Grenze ohne Pflichthinweis', b => { delete e(b, 't/kueste').wo.hinweis; }],
  ['S', 'Grenze als Messung, nicht abgeleitet', b => { delete e(b, 't/kueste').wo.woher.abgeleitet_aus; }],
  ['S', 'Grundkraft mit wo', b => { e(b, 't/grundkraft').wo = { geometrie: 'punkt' }; }],
  ['S', 'Zufluss aus der 0. Natur ohne Kette', b => { delete b.prozesse[0].zufluesse[1].kette; }],
  ['S', 'Zufluss aus der 0. Natur ohne extern/intern', b => { delete b.prozesse[0].zufluesse[1].richtung; }],
  ['S', 'falscher Herkunftsstapel', b => { b.prozesse[0].zufluesse[0].herkunftsstapel = '1.2'; }],
  ['S', 'Rückwirkung nach oben', b => { Object.assign(r(b, 't/r-rueck'), { von: 't/kohle', nach: 't/eigentum' }); }],
  ['S', 'Wert ohne Bezugszeit', b => { delete e(b, 't/modell').werte.x.punkte[0].bezugszeit; }],
  ['S', 'Wert ohne Wissensstand', b => { delete e(b, 't/modell').werte.x.punkte[0].fassungen[0].wissensstand; }],
];

for (const [regel, name, verletze] of VERSTOESSE) {
  test(`Regel ${regel}: ${name}`, () => {
    const b = gueltig();
    verletze(b);
    const { fehler } = pruefe(b);
    assert.ok(fehler.some(f => String(f.regel) === String(regel)),
      `erwartet Regel ${regel}, gemeldet: ${JSON.stringify(fehler)}`);
    const lauf = spawnSync(process.execPath, [PRUEFE, '-'], { input: JSON.stringify(b), encoding: 'utf8' });
    assert.notEqual(lauf.status, 0, 'Kommandozeile bricht nicht ab');
    assert.match(lauf.stdout, new RegExp(`✗ Regel ${regel} `));
  });
}

const MANIFEST = {
  id: 'x', quelle: 'q', stapel: ['1.1'], vorgang: 'stoffwechsel',
  herkunft: { arten: ['beobachtung'], archivkette: [{ archiv: 'zeroearth', art: 'zeroearth' }] },
  zeitsemantik: { aufloesung: 1, abdeckung: {}, verzoegerung: fehlt('unbekannt') }, geometrie: ['punkt'],
  lizenz: 'x', weitergabe: 'frei', auswahl: [],
  reduktion: [
    { schritt: 'vergroebern', angabe: '0.5° -> 2°' },
    { schritt: 'zusammenfassen', angabe: 'Mittel über Modelle', modelle: ['A', 'B'], mitgefuehrt: ['mittel', 'min', 'max'] },
  ],
};
/** @param {any} m */
const regel11 = m => pruefeManifest(m).fehler.some(f => f.regel === 11);

test('Manifest: gültig', () => {
  assert.deepEqual(pruefeManifest(MANIFEST).fehler, []);
});

test('Manifest: Pflichtfeld fehlt', () => {
  const { lizenz, ...m } = MANIFEST;
  assert.ok(pruefeManifest(m).fehler.some(f => f.text.includes('lizenz')));
  assert.deepEqual(pruefeManifest({ ...m, lizenz: fehlt('ungeklärt') }).fehler, []);
});

test('Manifest: Übergang als Stapel', () => {
  assert.ok(pruefeManifest({ ...MANIFEST, stapel: ['planetar'] }).fehler.length > 0);
});

test('Manifest: Herkunft als einzelne Art oder ohne zeroearth', () => {
  assert.ok(pruefeManifest({ ...MANIFEST, herkunft: { art: 'beobachtung', archivkette: MANIFEST.herkunft.archivkette } }).fehler.length > 0);
  assert.ok(pruefeManifest({ ...MANIFEST, herkunft: { arten: ['beobachtung'], archivkette: [] } }).fehler.length > 0);
});

test('Manifest: Reduktion ist Pflicht, leer nur ohne Reduktion', () => {
  const { reduktion, ...m } = MANIFEST;
  assert.ok(pruefeManifest(m).fehler.some(f => f.text.includes('reduktion')));
  assert.ok(regel11({ ...m, reduktion: fehlt('unbekannt') }));
  const leer = pruefeManifest({ ...m, reduktion: [] });
  assert.deepEqual(leer.fehler, []);
  assert.ok(leer.hinweise.some(h => h.regel === 11));
});

test('Manifest: Reduktionsschritt unbekannt oder ohne Angabe', () => {
  assert.ok(regel11({ ...MANIFEST, reduktion: [{ schritt: 'glaetten', angabe: 'x' }] }));
  assert.ok(regel11({ ...MANIFEST, reduktion: [{ schritt: 'mitteln' }] }));
});

test('Manifest: Regel 11, mehrere Modelle ohne min und max', () => {
  const z = { schritt: 'zusammenfassen', angabe: 'Ensemblemittel', modelle: ['A', 'B'] };
  assert.ok(regel11({ ...MANIFEST, reduktion: [z] }));
  assert.ok(regel11({ ...MANIFEST, reduktion: [{ ...z, mitgefuehrt: ['mittel', 'min'] }] }));
  assert.ok(regel11({ ...MANIFEST, reduktion: [{ ...z, modelle: undefined }] }));
  assert.ok(!regel11({ ...MANIFEST, reduktion: [{ ...z, modelle: ['A'] }] }));
});

test('Manifest: modell und idealisiert gehören zusammen', () => {
  const h = (/** @type {string[]} */ arten) => ({ ...MANIFEST, herkunft: { ...MANIFEST.herkunft, arten } });
  assert.ok(pruefeManifest(h(['modell'])).fehler.length > 0);
  assert.ok(pruefeManifest(h(['idealisiert'])).fehler.length > 0);
  assert.deepEqual(pruefeManifest(h(['modell', 'idealisiert'])).fehler, []);
});
