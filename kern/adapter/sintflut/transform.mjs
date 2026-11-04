#!/usr/bin/env node
// @ts-check
/* ════════════════════════════════════════════════════════════════════
   Adapter Sintflut: data/sintflut.json → Graph nach kern/schema.mjs.

   Die Werte sind Spur eines Stoffwechsels (planetarer Stoffwechsel,
   intern: Wasserumverteilung Eis → Ozean; Setzung Max, 2026-09-29):
   - Bestand "Wasser" mit den Formen Eis und Ozean, erhalten
   - Eis- und Ozeanvolumen aus den 1°-Dateien (data/paleomist_eis.json),
     je Ideal: Referenz und a1 (Regel 13, beide gezeigt)
   - Formwechsel Eis → Ozean als Stoffwechsel, je Ideal mit Bilanz.
     Prüfart: innere Stimmigkeit (beide Seiten aus PaleoMIST), nicht
     Modell gegen Welt
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
const HINWEIS_GRENZE = 'paleo_topography enthält isostatische Deformation (laut Datei); Sedimentation nicht berücksichtigt';

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
 * @param {{eis?: any}} [zusatz] data/paleomist_eis.json als zusatz.eis
 * @returns {import('../../schema.mjs').Graph}
 */
export function transform(roh, manifest, zusatz = {}) {
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

  /* ── Ideale: Referenz und a1 (Regel 13) ──────────────────────────── */
  const eisDaten = zusatz.eis;
  const MI = manifest.ideale;
  const ideale = Object.entries(MI.varianten).map(([k, v]) => /** @type {any} */ ({
    id: `${P}/ideal/${k}`, schluessel: k, name: v.name, gruppe: MI.gruppe, variante: v.variante,
    gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung,
  }));
  if (eisDaten) for (const i of ideale) {
    const r = eisDaten.ideale?.[i.schluessel];
    if (!r) throw new Error(`data/paleomist_eis.json: Ideal ${i.schluessel} fehlt`);
    if (r.ka_bp.length !== schritte || r.ka_bp.some((/** @type {number} */ ka, /** @type {number} */ j) => ka !== roh.orte[Object.keys(roh.orte)[0]].reihe[j].ka_bp))
      throw new Error(`data/paleomist_eis.json: Zeitachse von ${i.schluessel} passt nicht zu data/sintflut.json`);
  }
  const eisArchiv = (/** @type {string} */ datei) => [
    { archiv: `zeroearth (${manifest.zusatz?.eis ?? 'data/paleomist_eis.json'})`, art: 'zeroearth' },
    { archiv: `PaleoMIST 1.0, ${datei} (PANGAEA, doi:${eisDaten?.woher?.doi})`,
      art: fehlt('Archivart von PaleoMIST nicht festgelegt') },
    fehlt('Welche natürlichen Archive PaleoMIST zugrunde liegen, nennen die Daten nicht'),
  ];
  /** Herkunft eines Werts aus den 1°-Dateien, mit Verweis auf sein Ideal. */
  const eisWoher = (/** @type {any} */ i, /** @type {string} */ verfahren) => {
    const datei = eisDaten.ideale[i.schluessel].datei;
    return { arten: ['rekonstruktion'], quelle: `${eisDaten.woher.quelle} · ${datei}`,
      archivkette: eisArchiv(datei), verfahren, ideal: i.id };
  };
  const eisReihe = (/** @type {any} */ i, /** @type {number[]} */ werte, /** @type {string} */ einheit, /** @type {string} */ verfahren) => ({
    einheit, zeitsemantik,
    punkte: eisDaten.ideale[i.schluessel].ka_bp.map((/** @type {number} */ ka, /** @type {number} */ j) =>
      punkt(zeit(ka), werte[j], eisWoher(i, verfahren))),
  });
  const OHNE_EIS = 'data/paleomist_eis.json nicht übergeben';

  /* ── Bestand Wasser: Formen Eis und Ozean ────────────────────────── */
  const eis = {
    id: `${P}/eis`, stapel: '1.1', name: 'Eis (aufliegend, global)',
    wo: fehlt('Die Daten enthalten keine Eisgeometrie; nur die globale Summe'),
    werte: eisDaten ? Object.fromEntries(ideale.map(i => [`volumen_${i.schluessel}`,
      eisReihe(i, eisDaten.ideale[i.schluessel].eis_volumen_m3, 'm3',
        'Summe ice_thickness × Zellfläche auf 1° (grounded ice)')]))
      : { volumen: fehlt(OHNE_EIS) },
  };
  const ozean = {
    id: `${P}/ozean`, stapel: '1.1', name: 'Ozean (global)',
    wo: fehlt('Die Daten enthalten keine Ozeangeometrie; nur die globale Summe'),
    werte: eisDaten ? Object.fromEntries(ideale.map(i => [`volumen_${i.schluessel}`,
      eisReihe(i, eisDaten.ideale[i.schluessel].ozean_volumen_m3, 'm3',
        'Summe max(0, −paleo_topography) × Zellfläche auf 1°; enthält Becken unter Meeresniveau im Landesinneren')]))
      : { volumen: fehlt(OHNE_EIS) },
  };
  const wasser = {
    id: `${P}/wasser`, name: 'Wasser', erhaltung: 'erhalten',
    menge: fehlt('Die Gesamtmenge Wasser nennen die Daten nicht; Eis und Ozean sind je eigene Summen'),
    formen: [{ id: 'eis', name: 'Eis', eintrag: eis.id }, { id: 'ozean', name: 'Ozean', eintrag: ozean.id }],
  };
  const JE_IDEAL = fehlt(`je Ideal verschieden; siehe Relationen ${P}/relation/eis-ozean/<ideal>`);
  const prozess = {
    id: `${P}/prozess/wasserumverteilung`, name: 'Wasserumverteilung Eis → Ozean',
    uebergang: 'planetarer_stoffwechsel', richtung: 'intern',
    zufluesse: [{ von: eis.id, herkunftsstapel: '1.1', art: 'stoff', menge: JE_IDEAL }],
    ausgaenge: [{ nach: ozean.id, art: 'stoff', menge: JE_IDEAL }],
  };

  /* Bilanz Eis → Ozean je Ideal: vom Eismaximum bis heute. Prüfart
     innere Stimmigkeit, weil beide Seiten aus PaleoMIST stammen. */
  const B = manifest.bilanz;
  const relationen = eisDaten ? ideale.map(i => {
    const r = eisDaten.ideale[i.schluessel];
    const n = r.eis_volumen_m3.length - 1;
    const imax = r.eis_volumen_m3.indexOf(Math.max(...r.eis_volumen_m3));
    const zufluss = B.annahmen.dichte_eis_kg_m3 * (r.eis_volumen_m3[imax] - r.eis_volumen_m3[n]);
    const abfluss = B.annahmen.dichte_wasser_kg_m3 * (r.ozean_volumen_m3[n] - r.ozean_volumen_m3[imax]);
    return {
      id: `${P}/relation/eis-ozean/${i.schluessel}`, art: 'stoffwechsel', bestand: wasser.id,
      von: eis.id, nach: ozean.id, prozess: prozess.id,
      bilanz: {
        einheit: 'kg', zufluss, abfluss: [abfluss], toleranz: B.toleranz_anteil * zufluss,
        pruefart: B.pruefart,
        aus: { zufluss: `${eis.id}#volumen_${i.schluessel}`, abfluss: [`${ozean.id}#volumen_${i.schluessel}`] },
      },
      woher: {
        arten: ['kuratiert', 'rekonstruktion'],
        quelle: 'Relation: Setzung Max (strukturstand, 2026-09-29); Mengen aus data/paleomist_eis.json',
        archivkette: KETTE_SETZUNG,
        abgeleitet_aus: [`${eis.id}#volumen_${i.schluessel}`, `${ozean.id}#volumen_${i.schluessel}`],
        verfahren: `Masse = Volumen × Dichte (Eis ${B.annahmen.dichte_eis_kg_m3}, Wasser ${B.annahmen.dichte_wasser_kg_m3} kg/m³, `
          + `Annahme im Manifest); Zeitraum ${r.ka_bp[imax]} ka BP (Eismaximum) bis heute`,
        ideal: i.id,
      },
      wissensstand: SETZUNG,
      bezugszeit: { skala, von: r.ka_bp[imax], bis: r.ka_bp[n] },
      beleg: [`doi:${eisDaten.woher.doi}`],
    };
  }) : [{
    id: `${P}/relation/eis-ozean`, art: 'stoffwechsel', bestand: wasser.id,
    von: eis.id, nach: ozean.id, prozess: prozess.id,
    bilanz: { einheit: 'kg', zufluss: fehlt(OHNE_EIS), abfluss: [fehlt(OHNE_EIS)] },
    woher: { arten: ['kuratiert'], quelle: 'Setzung Max (strukturstand, 2026-09-29)', archivkette: KETTE_SETZUNG },
    wissensstand: SETZUNG, bezugszeit: { skala, von, bis },
    beleg: fehlt('Setzung; kein Beleg außer der Setzung selbst (woher.quelle)'),
  }];

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
        // Dieselbe Landfläche auf 1°, je Ideal: für den Vergleich der Ideale
        ...(eisDaten ? Object.fromEntries(ideale.map(i => [`landflaeche_1grad_${i.schluessel}`,
          eisReihe(i, eisDaten.ideale[i.schluessel].fenster_land_km2[k], 'km2',
            'Zellen mit paleo_topography > 0 im Kasten, auf 1° (nicht 0,25°)')])) : {}),
      },
    };

    const kueste = {
      id: `${id}/kueste`, stapel: '1.1', name: `Küstenlinie · ${o.name}`, auswahl,
      spur_von: { bestand: wasser.id, form: 'ozean' },
      wo: {
        geometrie: 'grenze',
        koordinaten: fehlt('data/sintflut.json enthält keine Küstengeometrie, nur Flächensummen je Kasten'),
        hinweis: HINWEIS_GRENZE,
        woher: woher([TOPO], 'Küste als Grenze paleo_topography = 0; abgeleitet, nie gemessen'),
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

  /* ── Vergleich der Ideale: a1 − Referenz. Auch Nullen bleiben stehen:
     Das Zusammenfallen ist ein Befund (Regel 13). ───────────────────── */
  const [iRef, iA1] = ideale;
  const differenz = (/** @type {string} */ refA, /** @type {string} */ refB, /** @type {number[]} */ a,
    /** @type {number[]} */ b, /** @type {string} */ einheit, /** @type {string} */ was) => ({
    einheit, zeitsemantik,
    punkte: eisDaten.ideale[iRef.schluessel].ka_bp.map((/** @type {number} */ ka, /** @type {number} */ j) =>
      punkt(zeit(ka), b[j] - a[j], {
        arten: ['rekonstruktion'], quelle: `${eisDaten.woher.quelle} · beide Ideale`,
        archivkette: [{ archiv: `zeroearth (${manifest.zusatz.eis})`, art: 'zeroearth' }, ...eisArchiv('reconstruction_1_degree.nc, reconstruction_a1_1_degree.nc').slice(1)],
        abgeleitet_aus: [refA, refB], verfahren: `${was}: ${iA1.schluessel} − ${iRef.schluessel}`,
      })),
  });
  const vergleichEintrag = eisDaten && iA1 ? [{
    id: `${P}/ideale/vergleich`, stapel: '1.1', name: `Vergleich der Ideale (${iA1.name} − ${iRef.name})`,
    wo: fehlt('Kein eigener Ort: globale Summe und Kästen der Fenster'),
    werte: {
      eis_differenz: differenz(`${eis.id}#volumen_${iRef.schluessel}`, `${eis.id}#volumen_${iA1.schluessel}`,
        eisDaten.ideale[iRef.schluessel].eis_volumen_m3, eisDaten.ideale[iA1.schluessel].eis_volumen_m3, 'm3', 'Eisvolumen'),
      ...Object.fromEntries(Object.keys(roh.orte).map(k => [`land_differenz_${k}`, differenz(
        `${P}/${k}#landflaeche_1grad_${iRef.schluessel}`, `${P}/${k}#landflaeche_1grad_${iA1.schluessel}`,
        eisDaten.ideale[iRef.schluessel].fenster_land_km2[k], eisDaten.ideale[iA1.schluessel].fenster_land_km2[k],
        'km2', `Landfläche im Kasten ${k}, 1°`)])),
    },
  }] : [];

  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, zusatz: manifest.zusatz, erzeugt: roh.erzeugt, ereigniskomplex: roh.ereigniskomplex },
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
      {
        id: `${P}/auswahl/ideale`, was: `Ideale: ${ideale.map(i => i.name).join(', ')}`,
        gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung,
      },
    ],
    ideale: ideale.map(({ schluessel, ...i }) => i),
    bestaende: [wasser],
    eintraege: [
      feld('paleo_topography', 'Paläotopographie (PaleoMIST)', 'm'),
      feld('sea_level', 'relativer Meeresspiegel (PaleoMIST)', 'm'),
      eis, ozean, ...fenster, ...vergleichEintrag,
    ],
    prozesse: [prozess],
    relationen,
  };
}

/**
 * Wo sich die Ideale unterscheiden und wo nicht. Für die Ausgabe; Meter
 * Meeresspiegeläquivalent nur zur Lesbarkeit, mit den Annahmen des Manifests.
 * Je Fenster wird getrennt: echte Unterschiede und Zellkippen (bis zu
 * n Gitterzellen à 1°, die bei kleinsten Meeresspiegel-Differenzen
 * zwischen Land und Meer wechseln). Beides bleibt in der Ausgabe.
 * @param {any} eisDaten data/paleomist_eis.json
 * @param {any} manifest
 * @param {any} orte data/sintflut.json orte (für die Zellgröße je Kasten)
 */
export function vergleicheIdeale(eisDaten, manifest, orte) {
  const [ref, a1] = Object.keys(manifest.ideale.varianten);
  const R = eisDaten.ideale[ref], A = eisDaten.ideale[a1];
  const { dichte_eis_kg_m3: rhoI, dichte_wasser_kg_m3: rhoW } = manifest.bilanz.annahmen;
  const flaeche = manifest.ideale.annahmen.ozeanflaeche_m2;
  const msle = (/** @type {number} */ v) => v * rhoI / rhoW / flaeche;
  const eis = R.ka_bp.map((/** @type {number} */ ka, /** @type {number} */ j) =>
    ({ ka_bp: ka, differenz_m3: A.eis_volumen_m3[j] - R.eis_volumen_m3[j], differenz_m_sle: msle(A.eis_volumen_m3[j] - R.eis_volumen_m3[j]) }));
  const schwelle = manifest.ideale.annahmen.unterschied_ab_m_sle;
  const verschieden = eis.filter((/** @type {any} */ x) => Math.abs(x.differenz_m_sle) >= schwelle);
  const groesste = eis.reduce((/** @type {any} */ a, /** @type {any} */ x) => (Math.abs(x.differenz_m_sle) > Math.abs(a.differenz_m_sle) ? x : a));
  const nZellen = manifest.ideale.annahmen.zellkippen_bis_zellen;
  const fenster = Object.fromEntries(Object.keys(R.fenster_land_km2).map(k => {
    // größte 1°-Zelle im Kasten: am äquatornächsten Breitengrad
    const bb = orte[k].bbox;
    const breite = bb.sued <= 0 && bb.nord >= 0 ? 0 : Math.min(Math.abs(bb.sued), Math.abs(bb.nord));
    const zelle = (6371.0088 * Math.PI / 180) ** 2 * Math.cos(breite * Math.PI / 180);
    const d = R.ka_bp.map((/** @type {number} */ ka, /** @type {number} */ j) =>
      ({ ka_bp: ka, differenz_km2: A.fenster_land_km2[k][j] - R.fenster_land_km2[k][j] }));
    const echt = d.filter((/** @type {any} */ x) => Math.abs(x.differenz_km2) > nZellen * zelle);
    const kippen = d.filter((/** @type {any} */ x) => x.differenz_km2 !== 0 && Math.abs(x.differenz_km2) <= nZellen * zelle);
    return [k, { verschieden_ka: echt.map((/** @type {any} */ x) => x.ka_bp), zellkippen_ka: kippen.map((/** @type {any} */ x) => x.ka_bp),
      max_abs_km2: Math.max(...d.map((/** @type {any} */ x) => Math.abs(x.differenz_km2))), zelle_km2: Math.round(zelle), differenz: d }];
  }));
  const alleEcht = Object.values(fenster).flatMap(f => f.verschieden_ka);
  return {
    ideale: [ref, a1],
    unterschied: verschieden.length
      ? { von_ka: Math.max(...verschieden.map((/** @type {any} */ x) => x.ka_bp)), bis_ka: Math.min(...verschieden.map((/** @type {any} */ x) => x.ka_bp)),
          groesste: groesste, schwelle_m_sle: schwelle }
      : null,
    eis,
    fenster,
    fenster_verschieden: alleEcht.length ? { von_ka: Math.max(...alleEcht), bis_ka: Math.min(...alleEcht) } : null,
    zellkippen_bis_zellen: nZellen,
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
  const eis = JSON.parse(await readFile(resolve(hier, '../../..', manifest.zusatz.eis), 'utf8'));
  if (process.argv.includes('--ideale')) {
    const v = vergleicheIdeale(eis, manifest, roh.orte);
    const f = (/** @type {number} */ x) => x.toFixed(1);
    console.log(`Ideale: ${v.ideale.join(' und ')} (PaleoMIST 1.0, 1°)`);
    console.log(v.unterschied
      ? `  verschieden: ${v.unterschied.von_ka}–${v.unterschied.bis_ka} ka BP (ab ${v.unterschied.schwelle_m_sle} m SLE), `
        + `größte Differenz ${f(v.unterschied.groesste.differenz_m_sle)} m SLE bei ${v.unterschied.groesste.ka_bp} ka BP`
      : '  verschieden: nirgends');
    const fv = v.fenster_verschieden;
    console.log(fv
      ? `  Sintflut-Fenster: verschieden nur ${fv.von_ka}–${fv.bis_ka} ka BP; sonst zusammenfallend `
        + `(bis auf Zellkippen ≤ ${v.zellkippen_bis_zellen} Zellen à 1°)`
      : `  Sintflut-Fenster: zusammenfallend über die ganze Reihe (bis auf Zellkippen ≤ ${v.zellkippen_bis_zellen} Zellen à 1°)`);
    for (const [k, x] of Object.entries(v.fenster))
      console.log(`    ${k.padEnd(16)} verschieden: ${x.verschieden_ka.join(', ') || '–'} · Zellkippen: ${x.zellkippen_ka.join(', ') || '–'} `
        + `· größte Abweichung ${x.max_abs_km2} km² (1 Zelle ≈ ${x.zelle_km2} km²)`);
    console.log('  Befund: In der Transgression nach dem Eismaximum unterscheiden die Fenster die beiden Eisgeschichten nicht.'
      + ' Das Zusammenfallen ist eine Aussage, keine Lücke.');
  } else process.stdout.write(JSON.stringify(transform(roh, manifest, { eis }), null, 2) + '\n');
}
