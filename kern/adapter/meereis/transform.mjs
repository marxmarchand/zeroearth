// @ts-check
/* Meereis: GLOMAP (rekonstruktion, LGM) und TraCE-21ka (modell, 22 ka bis heute)
   nebeneinander (Regel 13), je Februar und August. Kryosphäre in 1.1. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'meereis';
const WISSENSSTAND = fehlt('Die Quelle nennt nicht, seit wann die Werte so bekannt sind');
const MONATE = /** @type {const} */ ({ februar: 'djf', august: 'jja' });

/** @param {any} roh data/meereis.json @param {any} manifest */
export function transform(roh, manifest) {
  const MI = manifest.ideale, archivkette = manifest.herkunft.archivkette;
  const G = roh.quellen.glomap, T = roh.quellen.trace;
  const ideale = Object.entries(MI.varianten).map(([k, v]) => ({
    id: `${P}/ideal/${k}`, name: /** @type {any} */ (v).name, gruppe: MI.gruppe,
    variante: /** @type {any} */ (v).variante, gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung }));
  const n = T.anzahl;
  for (const js of Object.values(MONATE))
    if (T.jahreszeiten[js]?.schritte?.length !== n) throw new Error(`TraCE ${js}: ${T.jahreszeiten[js]?.schritte?.length} Schritte statt ${n}`);

  // GLOMAP: eine Zeitscheibe, als Fenster 23–19 ka; Bezugszeit ist die Mitte, die Unschärfe fehlt
  const gZeit = { bezugssystem: G.bezugssystem, unschaerfe: G.zeit_unschaerfe, aufloesung: G.zeitfenster_ka.von - G.zeitfenster_ka.bis,
    wert: (G.zeitfenster_ka.von + G.zeitfenster_ka.bis) / 2 };
  const gZs = { bezugssystem: G.bezugssystem, unschaerfe: G.zeit_unschaerfe, aufloesung: gZeit.aufloesung,
    abdeckung: { von: G.zeitfenster_ka.von, bis: G.zeitfenster_ka.bis }, schritte: 1 };
  const gQuelle = `${G.name} · ${G.datei_quelle} (${G.variable})`;
  /** @param {any} wert @param {string} einheit @param {string[]} arten @param {string} verfahren */
  const gReihe = (wert, einheit, arten, verfahren) => ({ einheit, zeitsemantik: gZs,
    punkte: [{ bezugszeit: gZeit, fassungen: [{ wert, wissensstand: WISSENSSTAND,
      woher: { arten, quelle: gQuelle, archivkette, verfahren, ideal: `${P}/ideal/glomap` } }] }] });

  // TraCE: je Jahrzehnt eine Stützstelle
  const tZs = { bezugssystem: T.bezugssystem, unschaerfe: T.zeit_unschaerfe, aufloesung: T.schritt_ka,
    abdeckung: { von: T.ka_bp_von, bis: T.ka_bp_bis }, schritte: n };
  /** @param {string} js @param {(e: any, i: number) => any} wert @param {string} einheit @param {string[]} arten @param {string} verfahren */
  const tReihe = (js, wert, einheit, arten, verfahren) => ({ einheit, zeitsemantik: tZs,
    punkte: T.jahreszeiten[js].schritte.map((/** @type {any} */ e, /** @type {number} */ i) => ({
      bezugszeit: { bezugssystem: T.bezugssystem, unschaerfe: T.zeit_unschaerfe, aufloesung: T.schritt_ka, wert: e.ka },
      fassungen: [{ wert: wert(e, i), wissensstand: WISSENSSTAND,
        woher: { arten, quelle: `${T.name} · ${T.dateien_quelle[js]}`, archivkette, verfahren, ideal: `${P}/ideal/trace` } }] })) });

  const werte = /** @type {Record<string, any>} */ ({});
  for (const [monat, js] of Object.entries(MONATE)) {
    const g = G.schritte[monat];
    werte[`ausdehnung_glomap_${monat}`] = gReihe({ verweis: `data/${g.datei}` }, 'maske', ['rekonstruktion'], `${G.monate[monat]}; Maske 0 offen, 255 Eis, 128 Land; 1°`);
    werte[`flaeche_nord_glomap_${monat}`] = gReihe(g.flaeche_nord_km2, 'km2', ['rekonstruktion', 'berechnet'], 'Summe der 1°-Zellflächen mit Eis, Nordhalbkugel');
    werte[`flaeche_sued_glomap_${monat}`] = gReihe(g.flaeche_sued_km2, 'km2', ['rekonstruktion', 'berechnet'], 'Summe der 1°-Zellflächen mit Eis, Südhalbkugel');
    const datei = T.jahreszeiten[js].datei;
    werte[`bedeckung_trace_${monat}`] = tReihe(js, (_e, i) => ({ verweis: `data/${datei}`, kachel: i }), 'klasse', ['modell', 'berechnet'], `${T.monate[monat]}; ICEFRAC in 201 Klassen (0,5 %), Gitter T31`);
    werte[`flaeche_nord_trace_${monat}`] = tReihe(js, e => e.flaeche_nord_km2, 'km2', ['modell', 'berechnet'], 'Summe Zellfläche × Bedeckung, Nordhalbkugel');
    werte[`flaeche_sued_trace_${monat}`] = tReihe(js, e => e.flaeche_sued_km2, 'km2', ['modell', 'berechnet'], 'Summe Zellfläche × Bedeckung, Südhalbkugel');
  }

  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/quellen`, was: `Quellen: ${ideale.map(i => i.name).join(', ')}; MARGO 2009 fehlt mit Grund`, gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung },
      { id: `${P}/auswahl/monate`, was: 'Februar und August (GLOMAP: JFM und JAS; TraCE: DJF und JJA)', gesetzt_in: 'matrix-scharnier/adapter/meereis.py', begruendung: roh.jahreszeit.begruendung },
    ],
    ideale,
    bestaende: [],
    eintraege: [
      { id: `${P}/flaeche`, stapel: '1.1', sphaere: 'kryosphaere', name: 'Meereis (GLOMAP, TraCE-21ka)', auswahl: [`${P}/auswahl/quellen`, `${P}/auswahl/monate`],
        wo: { geometrie: 'feld', raster: 'GLOMAP 1°; TraCE T31 (rund 3,75°)', ausdehnung: 'global',
          verzerrung: { flaeche: 1, ueberhoehung: 1, gitter: { min: 0, max: 1, bezug: 'gleichabständig in der Länge; TraCE in der Breite Gauß-Breiten' } } },
        werte: { ...werte, vor_22ka: fehlt(roh.fehlt.vor_22ka.grund), jahresmittel_glomap: fehlt(roh.fehlt.jahresmittel_glomap.grund),
          ...(T.rest ? { trace_rest: fehlt(`TraCE ${String(T.rest.von_ka).replace('.', ',')} ka bis heute: ${T.rest.grund}`) } : {}) } },
      { id: `${P}/margo`, stapel: '1.1', sphaere: 'kryosphaere', name: 'Meereis nach MARGO 2009', wo: fehlt(roh.fehlt.margo.grund), werte: { ausdehnung: fehlt(roh.fehlt.margo.grund) } },
    ],
    prozesse: [], relationen: [],
  };
}
