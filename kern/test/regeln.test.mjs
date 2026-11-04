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
import { fehlt, anzeige, nichtErhoben, BELEG_EINTRAGSEBENE } from '../schema.mjs';

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
/** Je Aufruf ein frisches Objekt: Tests verändern es. */
const VERZERRUNG = () => ({ flaeche: 1, ueberhoehung: 1 });
/** Pflichtfelder jeder Relation: Bezugszeit und Beleg. */
const REL = () => ({ bezugszeit: fehlt('Test: nicht datiert'), beleg: ['Testbeleg'] });

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
    ideale: [
      { id: 't/ideal-a', name: 'Variante A', gruppe: 't/g', variante: 'a.nc', gesetzt_in: 'test', begruendung: 'Test' },
      { id: 't/ideal-b', name: 'Variante B', gruppe: 't/g', variante: 'b.nc', gesetzt_in: 'test', begruendung: fehlt('Test') },
    ],
    bestaende: [
      { id: 't/wasser', name: 'Wasser', erhaltung: 'erhalten', menge: fehlt('nicht im Test'),
        formen: [{ id: 'eis', name: 'Eis', eintrag: 't/eis' }, { id: 'ozean', name: 'Ozean', eintrag: 't/ozean' }] },
      { id: 't/kapital', name: 'Kapital', erhaltung: 'nicht_erhalten', menge: fehlt('nicht im Test'),
        haengt_an: fehlt('nicht im Test'),
        formen: [{ id: 'geld', name: 'Geld', eintrag: 't/geld' }, { id: 'ware', name: 'Ware', eintrag: 't/eigentum' }] },
      { id: 't/daten', name: 'Daten', erhaltung: 'vervielfaeltigbar', menge: fehlt('nicht im Test'),
        haengt_an: fehlt('Datenträger nennt die Quelle nicht'), verweist_auf: ['t/bevoelkerung'],
        formen: [{ id: 'rohdaten', name: 'Rohdaten', eintrag: 't/rohdaten' }, { id: 'profil', name: 'Profil', eintrag: 't/profil' }] },
    ],
    eintraege: [
      { id: 't/grundkraft', stapel: '0.1', name: 'Grundkraft', werte: {} },
      { id: 't/sonne', stapel: '0.3', name: 'Sonne', wo: { geometrie: 'punkt' }, werte: {} },
      {
        id: 't/kohle', stapel: '1.1', name: 'Kohle', auswahl: ['t/a'],
        wo: { geometrie: 'flaeche', gesetzt: true, verzerrung: VERZERRUNG() },
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
      { id: 't/modell', stapel: '1.1', name: 'Rekonstruktion', wo: { geometrie: 'feld', verzerrung: VERZERRUNG() },
        werte: { x: einzel('m', fassung(1, W(['rekonstruktion']))) } },
      { id: 't/ideal', stapel: '1.1', name: 'Idealschicht', wo: { geometrie: 'feld', verzerrung: VERZERRUNG() },
        werte: { y: einzel('m', fassung(2, W(['modell', 'idealisiert'], { modelle: ['A', 'B', 'C'] }),
          { spannweite: { min: 1, max: 4 } })) } },
      { id: 't/co2', stapel: '1.1', name: 'CO2', wo: { geometrie: 'punkt' }, werte: {} },
      { id: 't/varianten', stapel: '1.1', name: 'Zwei Ideale', wo: fehlt('nicht im Test'), werte: {
        va: einzel('m', fassung(1, W(['rekonstruktion'], { ideal: 't/ideal-a' }))),
        vb: einzel('m', fassung(1, W(['rekonstruktion'], { ideal: 't/ideal-b' }))),
      } },
      { id: 't/bevoelkerung', stapel: '1.3', name: 'Bevölkerung Testland', wo: { geometrie: 'flaeche', verzerrung: VERZERRUNG() }, werte: {} },
      { id: 't/rohdaten', stapel: '2.3', name: 'Rohdaten', haengt_an: fehlt('Datenträger unbekannt'),
        formation: { id: 't/f-ware', von: 2020, bis: 'offen' }, werte: {} },
      { id: 't/profil', stapel: '2.3', name: 'Profil', haengt_an: fehlt('Datenträger unbekannt'),
        formation: { id: 't/f-ware', von: 2020, bis: 'offen' }, werte: {} },
      { id: 't/gemeinschaft', stapel: '1.3', name: 'Sprachgemeinschaft', werte: {},
        wo: { geometrie: 'punkt', naeherung: { vertritt: 'flaeche', angabe: 'Punkt statt Sprachgebiet' },
          verzerrung: { flaeche: fehlt('Ausdehnung unbekannt'), ueberhoehung: 1 } } },
      { id: 't/sprache', stapel: '2.2', name: 'Sprache', haengt_an: ['t/gemeinschaft'], verweist_auf: ['t/prognose'],
        formation: fehlt('nicht im Test'), werte: {} },
      { id: 't/behoerde', stapel: '2.2', name: 'Behörde', haengt_an: fehlt('nicht im Test'),
        formation: { id: 't/f-ware', von: 2020, bis: 'offen' }, werte: {} },
      { id: 't/eis', stapel: '1.1', name: 'Eis', wo: fehlt('nicht im Test'), werte: {} },
      { id: 't/ozean', stapel: '1.1', name: 'Ozean', wo: fehlt('nicht im Test'), werte: {} },
      { id: 't/kennwert', stapel: '1.1', name: 'Kennwert', werte: {
        k: einzel('1', fassung(0.5, W(['beobachtung', 'rekonstruktion'], { abgeleitet_aus: ['t/kohle#masse', 't/modell#x'] }))),
      } },
      { id: 't/kueste', stapel: '1.1', name: 'Grenze', werte: {}, spur_von: { bestand: 't/wasser', form: 'ozean' },
        wo: { geometrie: 'grenze', koordinaten: fehlt('nicht im Test'), hinweis: 'abgeleitet',
          verzerrung: VERZERRUNG(), woher: W(['rekonstruktion'], { abgeleitet_aus: ['t/modell#x'] }) } },
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
      id: 't/p', name: 'Verbrennung', uebergang: 'gesellschaftlicher_stoffwechsel',
      zufluesse: [
        { von: 't/kohle', herkunftsstapel: '1.1', art: 'stoff' },
        { von: 't/sonne', herkunftsstapel: '0.3', art: 'energie', kette: ['stark', 'elektromagnetismus'], richtung: 'extern' },
        { von: 't/eigentum', herkunftsstapel: '2.2', art: 'kapital', kapitalform: 'oekonomisch', modus: 'fliessend' },
      ],
      ausgaenge: [{ nach: 't/co2', art: 'abfall' }],
    }, {
      id: 't/erfassung', name: 'Erfassung', uebergang: 'gesellschaftlicher_stoffwechsel',
      zufluesse: [], ausgaenge: [{ nach: 't/rohdaten', art: 'daten' }],
    }],
    relationen: [
      { id: 't/r-stoff', art: 'stoffwechsel', von: 't/kohle', nach: 't/co2', prozess: 't/p',
        bilanz: { einheit: 'kg', zufluss: 10, abfluss: [7, 3], pruefart: 'innere_stimmigkeit',
          aus: { zufluss: 't/kohle#masse', abfluss: ['t/modell#x'] } }, woher: W(['beobachtung']), wissensstand: WS, ...REL() },
      { id: 't/r-schmelze', art: 'stoffwechsel', bestand: 't/wasser', von: 't/eis', nach: 't/ozean',
        bilanz: { einheit: 'kg', zufluss: fehlt('offen'), abfluss: [fehlt('offen')] }, woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-kauf', art: 'einschliessen_realisieren', bestand: 't/kapital', von: 't/geld', nach: 't/eigentum',
        modus: 'eingeschlossen', woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-tausch', art: 'konversion', von: 't/eigentum', nach: 't/kohle', woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-haftet', art: 'anhaften', von: 't/eigentum', nach: 't/kohle', woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-rueck', art: 'rueckwirkung', von: 't/eigentum', nach: 't/kohle', woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-rolle', art: 'rolle', als: 'arbeitsmittel', modus: 'erwartet', erwartungstraeger: 'Testfirma', von: 't/kohle', nach: 't/p',
        woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-rohstoff', art: 'rolle', als: 'rohstoff', von: 't/bevoelkerung', nach: 't/erfassung',
        woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-arbeitsmittel', art: 'rolle', als: 'arbeitsmittel', von: fehlt('Produkt nennt die Quelle nicht'), nach: 't/erfassung',
        woher: W(['kuratiert']), wissensstand: WS, ...REL(),
        beleg: { ebene: BELEG_EINTRAGSEBENE, eintrag: 't/eigentum', quellen: ['Testquelle A', 'Testquelle B'] } },
      { id: 't/r-verkauf', art: 'einschliessen_realisieren', von: 't/eigentum', nach: 't/behoerde',
        ware: fehlt('Produkt nennt die Quelle nicht'), woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-profil', art: 'stoffwechsel', bestand: 't/daten', von: 't/rohdaten', nach: 't/profil', prozess: 't/erfassung',
        woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-ueberlieferung', art: 'ueberlieferung', modus: 'bedroht', von: 't/sprache', nach: 't/gemeinschaft',
        woher: W(['kuratiert'], { konfidenz: { skala: 'Testquelle, eigene Stufen', stufe: '20 percent certain' } }),
        wissensstand: WS, ...REL() },
      { id: 't/r-konzern', art: 'anhaften', von: 't/geld', nach: 't/eigentum', woher: W(['kuratiert']), wissensstand: WS, ...REL() },
      { id: 't/r-geber', art: 'einschliessen_realisieren', von: fehlt('Geldgeber nicht auflösbar'), nach: 't/eigentum',
        woher: W(['kuratiert']), wissensstand: WS, ...REL(), bezugszeit: { skala: 'a CE', von: 2020, bis: 2024 } },
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
  // Relationen: Bezugszeit, Beleg, fehlende Enden, Rolle, Ware
  [8, 'Relation ohne Bezugszeit', b => { delete r(b, 't/r-haftet').bezugszeit; }],
  ['S', 'Relation-Bezugszeit ohne Skala', b => { r(b, 't/r-geber').bezugszeit = { von: 2020, bis: 2024 }; }],
  [8, 'Relation-Bezugszeit fehlend ohne Grund', b => { r(b, 't/r-haftet').bezugszeit = { fehlt: true }; }],
  [6, 'Relation ohne Beleg', b => { delete r(b, 't/r-haftet').beleg; }],
  [6, 'Beleg als leere Liste', b => { r(b, 't/r-haftet').beleg = []; }],
  [6, 'Beleg als Text statt Liste', b => { r(b, 't/r-haftet').beleg = 'irgendwo'; }],
  [6, 'Beleg auf Eintragsebene zu unbekanntem Eintrag', b => { r(b, 't/r-arbeitsmittel').beleg.eintrag = 't/nirgends'; }],
  [6, 'Beleg auf Eintragsebene ohne Quellen', b => { r(b, 't/r-arbeitsmittel').beleg.quellen = []; }],
  [1, 'beide Enden fehlend', b => { r(b, 't/r-geber').nach = fehlt('auch unbekannt'); }],
  [8, 'fehlendes Ende ohne Grund', b => { r(b, 't/r-geber').von = { fehlt: true }; }],
  ['S', 'Rolle ohne als', b => { delete r(b, 't/r-rohstoff').als; }],
  ['S', 'Rolle mit unbekanntem als', b => { r(b, 't/r-rohstoff').als = 'kulisse'; }],
  ['S', 'Rolle nicht in einen Prozess', b => { r(b, 't/r-rohstoff').nach = 't/co2'; }],
  ['S', 'als an einer Nicht-Rolle', b => { r(b, 't/r-haftet').als = 'rohstoff'; }],
  ['S', 'Ware an einem Nicht-Tausch', b => { r(b, 't/r-haftet').ware = fehlt('x'); }],
  ['S', 'Ware verweist auf Unbekanntes', b => { r(b, 't/r-verkauf').ware = 't/nirgends'; }],
  // Bestand Daten, Erhaltung
  ['B', 'erhalten statt erhaltung', b => { best(b, 't/wasser').erhalten = true; }],
  ['B', 'erhaltung unbekannt', b => { best(b, 't/wasser').erhaltung = 'ewig'; }],
  [2, 'Bestand der 2. Natur ohne haengt_an', b => { delete best(b, 't/daten').haengt_an; }],
  [2, 'haengt_an an einem Bestand der 1. Natur', b => { best(b, 't/wasser').haengt_an = ['t/kohle']; }],
  ['B', 'verweist_auf Unbekanntes', b => { best(b, 't/daten').verweist_auf = ['t/nirgends']; }],
  [5, 'vervielfältigbarer Bestand bilanziert', b => { r(b, 't/r-profil').bilanz = { einheit: 'B', zufluss: 1, abfluss: [1] }; }],
  ['B', 'Formwechsel von Daten als Konversion', b => { r(b, 't/r-profil').art = 'konversion'; }],
  // Glottolog: Näherung, Konfidenz, Überlieferung, Verweis
  [10, 'Näherung ohne Angabe', b => { delete e(b, 't/gemeinschaft').wo.naeherung.angabe; }],
  [10, 'Näherung mit unbekannter Vertretung', b => { e(b, 't/gemeinschaft').wo.naeherung.vertritt = 'volumen'; }],
  [10, 'Näherung einer Fläche ohne Flächenverzerrung', b => { delete e(b, 't/gemeinschaft').wo.verzerrung; }],
  [4, 'Konfidenz als Zahl', b => { r(b, 't/r-ueberlieferung').woher.konfidenz.stufe = 0.2; }],
  [4, 'Konfidenz als Wahrscheinlichkeit', b => { r(b, 't/r-ueberlieferung').woher.konfidenz.wahrscheinlichkeit = 0.2; }],
  [6, 'Konfidenz ohne Skala', b => { delete r(b, 't/r-ueberlieferung').woher.konfidenz.skala; }],
  ['S', 'Modus der Überlieferung unbekannt', b => { r(b, 't/r-ueberlieferung').modus = 'vergessen'; }],
  ['S', 'Überlieferung mit Kapitalmodus', b => { r(b, 't/r-ueberlieferung').modus = 'fliessend'; }],
  ['S', 'verweist_auf Unbekanntes', b => { e(b, 't/sprache').verweist_auf = ['t/nirgends']; }],
  [2, 'Sprache mit eigenem wo', b => { e(b, 't/sprache').wo = { geometrie: 'punkt' }; }],
  // Regel 15: Fiktion
  [15, 'fiktion neben echter Herkunft, nicht abgeleitet', b => { woherK(b).arten = ['fiktion', 'beobachtung']; delete woherK(b).abgeleitet_aus; }],
  // Regel 13: mehrere Ideale
  [13, 'ein Ideal der Gruppe fehlt', b => { delete e(b, 't/varianten').werte.vb; }],
  [13, 'Ideal unbekannt', b => { e(b, 't/varianten').werte.vb.punkte[0].fassungen[0].woher.ideal = 't/ideal-x'; }],
  [13, 'Beobachtung als Ideal', b => { e(b, 't/varianten').werte.va.punkte[0].fassungen[0].woher.arten = ['beobachtung']; }],
  [13, 'eine Größe mit zwei Idealen', b => {
    e(b, 't/varianten').werte.va.punkte.push({ bezugszeit: { skala: 'a CE', wert: 2001 },
      fassungen: [fassung(2, W(['rekonstruktion'], { ideal: 't/ideal-b' }))] });
  }],
  [13, 'Ideal ohne Gruppe', b => { delete b.ideale[0].gruppe; }],
  [7, 'Ideal ohne Begründung', b => { delete b.ideale[1].begruendung; }],
  [13, 'Relation nur für ein Ideal', b => { r(b, 't/r-haftet').woher = W(['kuratiert', 'rekonstruktion'], { ideal: 't/ideal-a' }); }],
  // Regel 5: Prüfart der Bilanz
  [5, 'Bilanz ohne Prüfart', b => { delete r(b, 't/r-stoff').bilanz.pruefart; }],
  [5, 'Prüfart unbekannt', b => { r(b, 't/r-stoff').bilanz.pruefart = 'gefühlt'; }],
  [5, 'unabhängig, aber beide Seiten aus derselben Quelle', b => { r(b, 't/r-stoff').bilanz.pruefart = 'unabhaengige_beobachtung'; }],
  [5, 'unabhängig ohne Angabe der Seiten', b => {
    r(b, 't/r-stoff').bilanz.pruefart = 'unabhaengige_beobachtung'; delete r(b, 't/r-stoff').bilanz.aus;
  }],
  [5, 'Bilanzseite unbekannt', b => { r(b, 't/r-stoff').bilanz.aus.zufluss = 't/kohle#nichts'; }],
  // Regel 11
  [11, 'mehrere Modelle ohne Spannweite', b => { delete e(b, 't/ideal').werte.y.punkte[0].fassungen[0].spannweite; }],
  [11, 'Spannweite ohne max', b => { delete e(b, 't/ideal').werte.y.punkte[0].fassungen[0].spannweite.max; }],
  [11, 'Wert außerhalb der Spannweite', b => { e(b, 't/ideal').werte.y.punkte[0].fassungen[0].wert = 5; }],
  [11, 'Spannweite ohne Modelle', b => { delete e(b, 't/ideal').werte.y.punkte[0].fassungen[0].woher.modelle; }],
  // Bestände und Formen
  ['B', 'Bestände nicht geführt', b => { delete b.bestaende; }],
  ['B', 'erhaltung nicht angegeben', b => { delete best(b, 't/wasser').erhaltung; }],
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
  ['S', 'Sphäre unbekannt', b => { e(b, 't/kennwert').sphaere = 'biosphaere'; }],
  ['S', 'Sphäre außerhalb von 1.1', b => { e(b, 't/gemeinschaft').sphaere = 'biomasse'; }],
  ['S', 'Übergang als Stapel', b => { e(b, 't/co2').stapel = 'planetarer_stoffwechsel'; }],
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

test('Regel 15: reine Fiktion und abgeleitete Mischung sind gültig', () => {
  const rein = gueltig();
  woherK(rein).arten = ['fiktion'];
  delete woherK(rein).abgeleitet_aus;
  assert.deepEqual(pruefe(rein).fehler, []);
  const gemischt = gueltig();
  woherK(gemischt).arten = ['fiktion', 'beobachtung', 'rekonstruktion'];
  assert.deepEqual(pruefe(gemischt).fehler, []);
});

test('Regel 15: Was aus fiktion abgeleitet wird, bleibt fiktion', () => {
  const b = gueltig();
  b.eintraege.push({ id: 't/erfunden', stapel: '1.1', name: 'Erfunden', werte: { x: einzel('1', fassung(1, W(['fiktion']))) } });
  woherK(b).abgeleitet_aus.push('t/erfunden#x');
  assert.ok(pruefe(b).fehler.some(f => f.regel === 6 && f.text.includes('fiktion')), JSON.stringify(pruefe(b).fehler));
  woherK(b).arten.push('fiktion');
  assert.deepEqual(pruefe(b).fehler, []);
});

test('Sphären: alle fünf in 1.1 gültig, Biomasse eingeschlossen', () => {
  for (const s of ['atmosphaere', 'hydrosphaere', 'lithosphaere', 'kryosphaere', 'biomasse']) {
    const b = gueltig();
    e(b, 't/kennwert').sphaere = s;
    assert.deepEqual(pruefe(b).fehler, [], s);
  }
});

test('Regel 15: Fiktion wird immer angezeigt und hat keinen Rang', () => {
  assert.deepEqual(anzeige(['fiktion']), { rang: null, merkmale: ['fiktion'] });
  assert.deepEqual(anzeige(['fiktion', 'beobachtung']), { rang: 'beobachtung', merkmale: ['fiktion'] });
});

test('Regel 15: Manifest mischt Fiktion nicht mit echter Herkunft', () => {
  const herkunft = (/** @type {string[]} */ arten) => ({ ...MANIFEST, herkunft: { ...MANIFEST.herkunft, arten } });
  assert.deepEqual(pruefeManifest(herkunft(['fiktion'])).fehler, []);
  assert.ok(pruefeManifest(herkunft(['fiktion', 'beobachtung'])).fehler.some(f => String(f.regel) === '15'));
  assert.ok(pruefeManifest(herkunft(['fiktion', 'kuratiert'])).fehler.some(f => String(f.regel) === '15'));
  // Echte Eingaben stehen in der Herkunftskette
  const kette = [{ archiv: 'zeroearth', art: 'zeroearth' }, { archiv: 'Echte Quelle', art: 'gesellschaftlich' }];
  assert.deepEqual(pruefeManifest({ ...MANIFEST, herkunft: { arten: ['fiktion'], archivkette: kette } }).fehler, []);
});

test('Manifest: Übergang als Stapel', () => {
  assert.ok(pruefeManifest({ ...MANIFEST, stapel: ['planetarer_stoffwechsel'] }).fehler.length > 0);
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

test('nicht erhoben: fehlender Schlüssel und leere Liste heißen gleich, nie "keine Beziehung"', () => {
  const x = nichtErhoben('providingTo');
  assert.equal(x.fehlt, true);
  assert.match(x.grund, /nicht erhoben/);
  assert.match(x.grund, /keine Aussage, dass keine Beziehung besteht/);
});

test('Regel 5: unabhängig nur mit verschiedenen Quellen; Ausgabe nennt die Prüfart', () => {
  const b = gueltig();
  const x = e(b, 't/modell').werte.x.punkte[0].fassungen[0];
  x.woher = { ...x.woher, quelle: 'unabhängige Messreihe' };
  r(b, 't/r-stoff').bilanz.pruefart = 'unabhaengige_beobachtung';
  const { fehler, hinweise } = pruefe(b);
  assert.deepEqual(fehler, []);
  assert.ok(hinweise.some(h => h.regel === 5 && /gegen unabhängige Beobachtung/.test(h.text)));
  const innen = pruefe(gueltig()).hinweise;
  assert.ok(innen.some(h => h.regel === 5 && /innere Stimmigkeit/.test(h.text)));
});

test('Regel 13: beide Ideale gezeigt, Hinweis nennt die Gruppe', () => {
  const { fehler, hinweise } = pruefe(gueltig());
  assert.deepEqual(fehler, []);
  assert.ok(hinweise.some(h => h.regel === 13 && /2 Ideal/.test(h.text)));
});
