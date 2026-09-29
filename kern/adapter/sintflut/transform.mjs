#!/usr/bin/env node
// @ts-check
/* ════════════════════════════════════════════════════════════════════
   Adapter Sintflut: data/sintflut.json → Graph nach kern/schema.mjs.

   Die Werte sind Spur eines Stoffwechsels (planetarer Stoffwechsel,
   intern: Wasserumverteilung Eis → Ozean; Setzung Max, 2026-09-29):
   - Bestand "Wasser" mit den Formen Eis und Ozean, erhalten
   - Formwechsel Eis → Ozean als Stoffwechsel; Bilanz nicht prüfbar,
     bis die Eisdicke geklärt ist
   - Träger in 1.1 je Fenster: Landfläche und Meeresspiegel als Zeitreihe
   - Küstenlinie je Fenster als "grenze": Spur der Form Ozean, abgeleitet
   - Notizen je Fenster als 2. Natur, gesellschaftliches Archiv,
     Formation fehlend mit Begründung

   Übernommen wird nur, was in der Datei steht. Nichts wird interpoliert,
   nichts aufgefüllt. Die abgeleiteten Kennwerte der Datei werden gegen
   die Reihe nachgerechnet; weichen sie ab, bricht der Adapter ab.

   node kern/adapter/sintflut/transform.mjs   Graph als JSON auf stdout
   ════════════════════════════════════════════════════════════════════ */
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'sintflut';
const WISSENSSTAND = fehlt('Die Quelle nennt nicht, seit wann die Werte so bekannt sind. '
  + '"erzeugt" ist der Zeitpunkt der Ableitung, nicht der Wissensstand der Rekonstruktion.');
const SETZUNG = { seit: '2026-09-29', status: /** @type {const} */ ('vorlaeufig') };
const KETTE_SETZUNG = [{ archiv: 'zeroearth (Setzung Max, 2026-09-29)', art: 'zeroearth' }];
const HINWEIS_GRENZE = 'heutige Bathymetrie, ohne Isostasie und Sedimentation';
const EISDICKE = 'nicht prüfbar, bis die Eisdicke geklärt ist '
  + '(QUELLEN.md führt für PaleoMIST Eisdicke; paleomist.py liest sie nicht)';

/** Gradnetz: Zellfläche relativ zur Äquatorzelle, an den Kastengrenzen. */
function gitterfaktor(/** @type {{sued: number, nord: number}} */ bb) {
  const c = (/** @type {number} */ g) => Math.cos(g * Math.PI / 180);
  const quert = bb.sued <= 0 && bb.nord >= 0;
  const r = (/** @type {number} */ x) => Math.round(x * 1e4) / 1e4;
  return {
    min: r(Math.min(c(bb.sued), c(bb.nord))),
    max: r(quert ? 1 : Math.max(c(bb.sued), c(bb.nord))),
    bezug: 'Zellfläche relativ zur Äquatorzelle, an den Kastengrenzen',
  };
}

/**
 * @param {any} roh Inhalt von data/sintflut.json
 * @param {any} manifest kern/adapter/sintflut/manifest.json
 * @returns {import('../../schema.mjs').Graph}
 */
export function transform(roh, manifest) {
  const arten = manifest.herkunft.arten;
  if (arten.length !== 1 || roh.woher?.art !== arten[0])
    throw new Error(`Herkunft der Datei (${roh.woher?.art}) weicht vom Manifest ab (${arten})`);
  const archivkette = manifest.herkunft.archivkette;
  const quelle = `${roh.woher.quelle} · ${roh.woher.datei} · übernommen von der Dateiebene`;
  const skala = manifest.zeitsemantik.skala;
  const { von, bis, schritte } = manifest.zeitsemantik.abdeckung;
  const zeitsemantik = { skala, aufloesung: manifest.zeitsemantik.aufloesung.wert, abdeckung: { von, bis }, schritte };

  const woher = (/** @type {string[]} */ aus, /** @type {string} */ verfahren) =>
    ({ arten: [...arten], quelle, archivkette, abgeleitet_aus: aus, verfahren });
  const punkt = (/** @type {any} */ bezugszeit, /** @type {any} */ wert, /** @type {any} */ w) =>
    ({ bezugszeit, fassungen: [{ wert, wissensstand: WISSENSSTAND, woher: w }] });
  const zeit = (/** @type {number} */ ka) => ({ skala, wert: ka === 0 ? 0 : ka });

  /* ── Felder: die Raster der Quelle, nur als Verweis ──────────────── */
  const feld = (/** @type {string} */ v, /** @type {string} */ name, /** @type {string} */ einheit) => ({
    id: `${P}/feld/${v}`, stapel: '1.1', name,
    wo: {
      geometrie: 'feld', raster: '0.25°', ausdehnung: 'global',
      verzerrung: { flaeche: 1, ueberhoehung: 1, gitter: gitterfaktor({ sued: -90, nord: 90 }) },
    },
    werte: {
      raster: {
        einheit, punkte: [{
          bezugszeit: { skala, von, bis },
          fassungen: [{ wert: { verweis: `${roh.woher.datei}#${v}` }, wissensstand: WISSENSSTAND,
            woher: { arten: [...arten], quelle, archivkette } }],
        }],
      },
    },
  });
  const TOPO = `${P}/feld/paleo_topography#raster`;
  const RSL = `${P}/feld/sea_level#raster`;

  /* ── Bestand Wasser: Formen Eis und Ozean ────────────────────────── */
  const eis = {
    id: `${P}/eis`, stapel: '1.1', name: 'Eis',
    wo: fehlt('Die Daten enthalten keine Eisgeometrie'),
    werte: { masse: fehlt(`Eismasse ${EISDICKE}`) },
  };
  const ozean = {
    id: `${P}/ozean`, stapel: '1.1', name: 'Ozean',
    wo: fehlt('Die Daten enthalten keine Ozeangeometrie'),
    werte: {
      masse: fehlt('Die Daten enthalten keine Ozeanmasse; der Meeresspiegel je Kasten ist ein regionales Mittel, keine Masse'),
    },
  };
  const wasser = {
    id: `${P}/wasser`, name: 'Wasser', erhalten: true,
    menge: fehlt('Die Daten enthalten keine Wassermenge'),
    formen: [{ id: 'eis', name: 'Eis', eintrag: eis.id }, { id: 'ozean', name: 'Ozean', eintrag: ozean.id }],
  };
  const MENGE = fehlt(EISDICKE);
  const prozess = {
    id: `${P}/prozess/wasserumverteilung`, name: 'Wasserumverteilung Eis → Ozean',
    uebergang: 'planetar', richtung: 'intern',
    zufluesse: [{ von: eis.id, herkunftsstapel: '1.1', art: 'stoff', menge: MENGE }],
    ausgaenge: [{ nach: ozean.id, art: 'stoff', menge: MENGE }],
  };
  const relation = {
    id: `${P}/relation/eis-ozean`, art: 'stoffwechsel', bestand: wasser.id,
    von: eis.id, nach: ozean.id, prozess: prozess.id,
    bilanz: { einheit: 'kg', zufluss: MENGE, abfluss: [MENGE] },
    woher: { arten: ['kuratiert'], quelle: 'Setzung Max, Korrekturen zu Schritt 0 und strukturstand.md (2026-09-29)',
      archivkette: KETTE_SETZUNG },
    wissensstand: SETZUNG,
  };

  /* ── Fenster ─────────────────────────────────────────────────────── */
  const fenster = Object.entries(roh.orte).flatMap(([k, o]) => {
    const id = `${P}/${k}`;
    if (o.reihe.length !== schritte) throw new Error(`${k}: ${o.reihe.length} Schritte statt ${schritte}`);
    pruefeKennwerte(k, o);

    const bb = o.bbox;
    const verzerrung = { flaeche: 1, ueberhoehung: 1, gitter: gitterfaktor(bb) };
    const auswahl = [`${P}/auswahl/fenster`, `${P}/auswahl/kasten`];
    const reihe = (/** @type {string} */ feldname, /** @type {string} */ einheit, /** @type {any} */ w) => ({
      einheit, zeitsemantik, punkte: o.reihe.map((/** @type {any} */ r) => punkt(zeit(r.ka_bp), r[feldname], w)),
    });
    const LAND = `${id}#landflaeche`;
    const t = o.trockenster_stand, h = o.heute, s = o.schnellster_schritt;

    const traeger = {
      id, stapel: '1.1', name: o.name, auswahl,
      wo: {
        geometrie: 'flaeche', gesetzt: true,
        bbox: { west: bb.west, ost: bb.ost, sued: bb.sued, nord: bb.nord },
        flaeche_km2: o.fenster_km2, verzerrung,
      },
      werte: {
        landflaeche: reihe('land_km2', 'km2', woher([TOPO],
          'Zellen mit paleo_topography > 0, Zellflächen exakt auf der Kugel summiert')),
        land_anteil: reihe('land_anteil', '1', woher([LAND], 'Landfläche / Fläche des Kastens')),
        meeresspiegel: reihe('meeresspiegel_m', 'm', woher([RSL],
          'relativer Meeresspiegel, gemittelt über alle Zellen des Kastens (Land und Meer)')),
        verlust: {
          einheit: 'km2',
          punkte: [punkt({ skala, von: t.ka_bp, bis: zeit(h.ka_bp).wert }, o.verlust_km2,
            woher([LAND], 'Landfläche am trockensten Stand minus heute'))],
        },
        verlust_anteil: {
          einheit: '1',
          punkte: [punkt({ skala, von: t.ka_bp, bis: zeit(h.ka_bp).wert }, o.verlust_anteil,
            woher([LAND], '1 − heute / trockenster Stand'))],
        },
        schnellster_schritt: {
          einheit: 'km2',
          punkte: [punkt({ skala, von: s.von, bis: s.bis }, s.verlust_km2,
            woher([LAND], 'größter Landverlust zwischen zwei Stützstellen'))],
        },
      },
    };

    const kueste = {
      id: `${id}/kueste`, stapel: '1.1', name: `Küstenlinie · ${o.name}`, auswahl,
      spur_von: { bestand: wasser.id, form: 'ozean' },
      wo: {
        geometrie: 'grenze',
        koordinaten: fehlt('data/sintflut.json enthält keine Küstengeometrie, nur Flächensummen je Kasten'),
        hinweis: HINWEIS_GRENZE,
        woher: woher([`${id}#meeresspiegel`, TOPO], 'Küste als Grenze zwischen Land und Meer; abgeleitet, nie gemessen'),
        verzerrung,
      },
      werte: {},
    };

    // Die Notiz ist ein Text: 2. Natur, am Fenster, im gesellschaftlichen Archiv.
    const zitat = /\(([^()]*\d{4})\)/.exec(o.notiz)?.[1];
    const notiz = {
      id: `${id}/notiz`, stapel: '2',
      unterebene: fehlt('Unterebene der Notiz nicht festgelegt (2.1, 2.2 oder 2.3)'),
      name: `Notiz · ${o.name}`,
      haengt_an: [id],
      formation: fehlt('Die Notiz nennt keine Gesellschaftsformation, deren 2. Natur sie ist'),
      werte: {
        text: {
          einheit: 'text',
          punkte: [{
            bezugszeit: fehlt('Die Notiz nennt keine Bezugszeit'),
            fassungen: [{
              wert: o.notiz,
              wissensstand: fehlt('Seit wann die Notiz so bekannt ist, ist nicht angegeben'),
              woher: {
                arten: ['kuratiert'],
                quelle: 'matrix-scharnier/adapter/paleomist.py (ORTE, notiz)',
                archivkette: [
                  { archiv: 'zeroearth (matrix-scharnier/adapter/paleomist.py)', art: 'zeroearth' },
                  { archiv: zitat ? `${zitat} (in der Notiz genannt)` : fehlt('Die Notiz nennt keine Quelle'),
                    art: 'gesellschaftlich' },
                ],
              },
            }],
          }],
        },
      },
    };
    return [traeger, kueste, notiz];
  });

  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt, ereigniskomplex: roh.ereigniskomplex },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      {
        id: `${P}/auswahl/fenster`, was: 'sechs Schelfe als Fenster des Ereigniskomplexes',
        gesetzt_in: 'matrix-scharnier/adapter/paleomist.py (ORTE)',
        begruendung: fehlt('Warum diese sechs und keine anderen, ist nicht begründet'),
      },
      {
        id: `${P}/auswahl/kasten`, was: 'Kasten (bbox) je Fenster: entscheidet, was als Ort gilt',
        gesetzt_in: 'matrix-scharnier/adapter/paleomist.py (ORTE)',
        begruendung: 'absichtlich grob auf das jeweilige Schelf gelegt (Kommentar in paleomist.py)',
      },
    ],
    bestaende: [wasser],
    eintraege: [
      feld('paleo_topography', 'Paläotopographie (PaleoMIST)', 'm'),
      feld('sea_level', 'relativer Meeresspiegel (PaleoMIST)', 'm'),
      eis, ozean, ...fenster,
    ],
    prozesse: [prozess],
    relationen: [relation],
  };
}

/** Rechnet die Kennwerte der Datei gegen die Reihe nach. Abweichung → Abbruch. */
function pruefeKennwerte(/** @type {string} */ k, /** @type {any} */ o) {
  const r = o.reihe;
  const trocken = r.reduce((/** @type {any} */ a, /** @type {any} */ x) => (x.land_km2 > a.land_km2 ? x : a));
  const heute = r[r.length - 1];
  const schritte = r.slice(0, -1).map((/** @type {any} */ x, /** @type {number} */ i) =>
    ({ von: x.ka_bp, bis: r[i + 1].ka_bp, verlust_km2: x.land_km2 - r[i + 1].land_km2 }));
  const schnell = schritte.reduce((a, x) => (x.verlust_km2 > a.verlust_km2 ? x : a));
  const soll = [
    ['trockenster_stand', o.trockenster_stand.ka_bp, trocken.ka_bp],
    ['heute', o.heute.land_km2, heute.land_km2],
    ['verlust_km2', o.verlust_km2, trocken.land_km2 - heute.land_km2],
    ['verlust_anteil', o.verlust_anteil, Math.round((1 - heute.land_km2 / trocken.land_km2) * 1e4) / 1e4],
    ['schnellster_schritt', `${o.schnellster_schritt.von}-${o.schnellster_schritt.bis}:${o.schnellster_schritt.verlust_km2}`,
      `${schnell.von}-${schnell.bis}:${schnell.verlust_km2}`],
  ];
  for (const [name, ist, erwartet] of soll)
    if (ist !== erwartet) throw new Error(`${k}.${name}: Datei ${ist}, nachgerechnet ${erwartet}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const hier = dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(await readFile(join(hier, 'manifest.json'), 'utf8'));
  const roh = JSON.parse(await readFile(resolve(hier, '../../..', manifest.eingabe), 'utf8'));
  process.stdout.write(JSON.stringify(transform(roh, manifest), null, 2) + '\n');
}
