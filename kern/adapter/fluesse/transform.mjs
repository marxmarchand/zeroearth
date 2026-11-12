// @ts-check
/* Flussnetz aus SWORD v17c, je Kontinent und Zoomstufe (data/fluesse.json).
   Hydrosphäre in 1.1. Die Linien selbst haben noch keine Geometrie im Schema
   (`bahn` ist geplant, kern/BERICHT-hydrosphaere.md B5); bis dahin steht `wo`
   als fehlt mit Grund, und der Graph führt die Zählungen je Stufe: gezeigt,
   Dämme, Geister (nicht gezeichnet), unter der Schwelle, Abbrüche, Längenverzerrung.
   Kontinente ohne Rohdaten stehen als fehlt (Regel 8). */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'fluesse';
const WISSENSSTAND = fehlt('SWORD nennt nicht, seit wann die Werte so bekannt sind; Fassung v17c vom 2026-11-01');

/** @param {any} roh data/fluesse.json @param {any} manifest */
export function transform(roh, manifest) {
  const Z = manifest.zeitsemantik, archivkette = manifest.herkunft.archivkette;
  const bezugszeit = { bezugssystem: Z.bezugssystem, unschaerfe: Z.unschaerfe, aufloesung: Z.aufloesung, wert: 2026 };
  const zeitsemantik = { bezugssystem: Z.bezugssystem, unschaerfe: Z.unschaerfe, aufloesung: Z.aufloesung,
    abdeckung: { von: 2026, bis: 2026 }, schritte: 1 };
  const quelle = (/** @type {any} */ k) => `${roh.quelle.name} · ${k.datei_quelle} (SHA-256 ${k.sha256.slice(0, 12)}…)`;
  /** @param {any} k @param {number} wert @param {string} einheit @param {string[]} arten @param {string} verfahren */
  const groesse = (k, wert, einheit, arten, verfahren) => ({ einheit, zeitsemantik,
    punkte: [{ bezugszeit, fassungen: [{ wert, wissensstand: WISSENSSTAND, woher: { arten, quelle: quelle(k), archivkette, verfahren } }] }] });

  for (const [kk, k] of Object.entries(roh.kontinente)) {
    const g = /** @type {any} */ (k).gesamt;
    for (const s of roh.stufen) {
      const st = /** @type {any} */ (k).stufen[s.stufe];
      if (!st) throw new Error(`${kk}: Stufe ${s.stufe} fehlt`);
      const summe = st.gezeigt.anzahl + st.geist.anzahl + st.unter_schwelle.anzahl;
      if (summe !== g.abschnitte.anzahl) throw new Error(`${kk} ${s.stufe}: ${summe} Abschnitte gezählt, ${g.abschnitte.anzahl} in der Quelle`);
    }
  }

  const AUSWAHL = ['schwellen', 'kontinente', 'zeit'].map(a => `${P}/auswahl/${a}`);
  const eintraege = Object.entries(roh.kontinente).map(([kk, k]) => {
    const K = /** @type {any} */ (k), werte = /** @type {Record<string, any>} */ ({});
    const ZAEHL = ['kuratiert', 'modell', 'berechnet'];   // Auswahl folgt facc_total (Modell)
    for (const s of roh.stufen) {
      const st = K.stufen[s.stufe], n = s.stufe;
      const schwelle = `facc_total ≥ ${s.facc_total_min_km2} km²`;
      werte[`abschnitte_gezeigt_${n}`] = groesse(K, st.gezeigt.anzahl, 'anzahl', ZAEHL, `${schwelle}, ohne Geister`);
      werte[`laenge_gezeigt_${n}`] = groesse(K, st.gezeigt.laenge_km, 'km', ZAEHL, `Summe reach_length, ${schwelle}, ohne Geister`);
      werte[`daemme_${n}`] = groesse(K, st.damm.anzahl, 'anzahl', ZAEHL, `type 4 (Damm), ${schwelle}; gezeigt mit eigenem Zeichen`);
      werte[`geister_${n}`] = groesse(K, st.geist.anzahl, 'anzahl', ZAEHL, `type 6 (Geist), ${schwelle}; in den Daten, nicht gezeichnet`);
      werte[`geister_laenge_${n}`] = groesse(K, st.geist.laenge_km, 'km', ZAEHL, `type 6 (Geist), ${schwelle}`);
      werte[`unter_schwelle_${n}`] = groesse(K, st.unter_schwelle.anzahl, 'anzahl', ZAEHL, `facc_total < ${s.facc_total_min_km2} km², nicht in der Datei`);
      werte[`abbrueche_${n}`] = groesse(K, st.abbrueche_stromab.anzahl, 'anzahl', ZAEHL, 'Nachbar stromab vorhanden, aber nicht ausgewählt');
      werte[`laengenverzerrung_${n}`] = groesse(K, st.verzerrung_laenge, 'verhaeltnis', ['kuratiert', 'modell', 'berechnet'],
        `Großkreislänge nach / vor Vereinfachung mit ${s.toleranz_m} m (Regel 10), ohne Geister; Lage teils aus MERIT Hydro (Modell)`);
    }
    werte.breite_fehlt = groesse(K, K.gesamt.breite_fehlt.anzahl, 'anzahl', ['kuratiert'], 'Abschnitte mit width ≤ 0 in SWORD (nicht gemessen), gezählt');
    return { id: `${P}/${kk}`, stapel: '1.1', sphaere: 'hydrosphaere', name: `Flussnetz ${K.name} (SWORD v17c)`, auswahl: AUSWAHL,
      wo: fehlt(`Linien eines Stroms brauchen die Geometrie bahn; geplant, nicht im Schema (kern/BERICHT-hydrosphaere.md, B5). Linien: ${roh.stufen.map((/** @type {any} */ s) => `data/${K.stufen[s.stufe].datei}`).join(', ')}`),
      werte };
  });
  for (const [kk, grund] of Object.entries(roh.fehlt ?? {}))
    eintraege.push({ id: `${P}/${kk}`, stapel: '1.1', sphaere: 'hydrosphaere', name: `Flussnetz ${kk.toUpperCase()} (SWORD v17c)`,
      auswahl: AUSWAHL, wo: fehlt(String(grund)), werte: { netz: fehlt(String(grund)) } });

  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/schwellen`, was: roh.stufen.map((/** @type {any} */ s) => `${s.name}: facc_total ≥ ${s.facc_total_min_km2} km², Toleranz ${s.toleranz_m} m`).join('; '),
        gesetzt_in: 'Entscheidung Max, 2026-11-11 (kern/BERICHT-hydrosphaere.md, B12)', begruendung: roh.auswahl.begruendung },
      { id: `${P}/auswahl/kontinente`, was: `geladen: ${Object.keys(roh.kontinente).join(', ')}; übrige fehlen mit Grund`,
        gesetzt_in: 'Entscheidung Max, 2026-11-12', begruendung: 'Erst den Konverter an Europa bauen und testen; übrige Kontinente nach Freigabe' },
      { id: `${P}/auswahl/zeit`, was: 'Netz gezeigt von 1900 CE bis heute, davor fehlt es', gesetzt_in: 'Entscheidung Max, 2026-11-11 (B7)',
        begruendung: 'Das Netz gilt für die Gegenwart; eine Rekonstruktion früherer Läufe gibt es als Quelle nicht (Regel 12)' },
    ],
    ideale: [], bestaende: [], eintraege, prozesse: [], relationen: [],
  };
}
