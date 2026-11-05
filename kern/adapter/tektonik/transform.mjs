// @ts-check
/* Tektonik: heutige Küstenumrisse in der Lage dreier Plattenmodelle
   (Ideale, Regel 13), Cao et al. 2024 jenseits von 1 Ga, dazu die 0-m-Linien
   der PALEOMAP-Paläo-DEMs als eigene Grenze. Umrisse und Paläoküsten werden
   nie gemischt: Die einen zeigen die Lage in heutiger Form, die anderen die
   Verteilung von Land und Meer der Zeit.

   Der Graph trägt keine Koordinaten, nur Verweise auf die Dateien: Die
   Geometrie steht einmal in data/tektonik_umrisse.json, je Schritt die
   Drehung je Platte. Keine Imports aus node:, die Tour lädt das Modul. */
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';

const P = 'tektonik';
const WISSENSSTAND = fehlt('Die Quellen nennen nicht, seit wann die Modelle so bekannt sind; "erzeugt" ist der Zeitpunkt der Ableitung');
const VERZERRUNG = { flaeche: 1, ueberhoehung: 1, bezug: 'Linien auf der Kugel, ohne Projektion' };

/**
 * @param {any} roh data/tektonik_umrisse.json
 * @param {any} manifest kern/adapter/tektonik/manifest.json
 * @param {{palaeokuesten?: any}} [zusatz] data/tektonik_palaeokuesten.json
 */
export function transform(roh, manifest, zusatz = {}) {
  const { bezugssystem, unschaerfe } = roh.zeit;
  const archivkette = manifest.herkunft.archivkette;
  const datei = manifest.eingabe;
  const MI = manifest.ideale;

  for (const [k, m] of Object.entries(roh.modelle)) {
    const mm = /** @type {any} */ (m);
    for (const a of mm.arten) if (!manifest.herkunft.arten.includes(a)) throw new Error(`${k}: Herkunftsart ${a} fehlt im Manifest`);
    if (mm.rotationen.length !== mm.schritte_ma.length) throw new Error(`${k}: ${mm.rotationen.length} Drehungen bei ${mm.schritte_ma.length} Schritten`);
    if (mm.rotationen.some((/** @type {any[]} */ z) => z.length !== mm.platten.length)) throw new Error(`${k}: Drehungen passen nicht zur Plattenliste`);
  }
  const cao = roh.modelle.cao2024;
  if (cao && Math.min(...cao.schritte_ma) <= 1000) throw new Error('Cao 2024 steht nur jenseits von 1 Ga');

  const ideale = Object.entries(MI.varianten).map(([k, v]) => ({
    id: `${P}/ideal/${k}`, schluessel: k, name: /** @type {any} */ (v).name, gruppe: MI.gruppe,
    variante: /** @type {any} */ (v).variante, gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung,
  }));
  for (const i of ideale) if (!roh.modelle[i.schluessel]) throw new Error(`Ideal ${i.schluessel} fehlt in ${datei}`);

  /** Zeitangabe eines Schritts: Auflösung ist der Abstand zum Nachbarn. */
  const zeit = (/** @type {number[]} */ s, /** @type {number} */ i) =>
    ({ bezugssystem, unschaerfe, aufloesung: (s[i + 1] ?? s[i]) - (s[i + 1] !== undefined ? s[i] : s[i - 1]), wert: s[i] });

  /** Lage je Modell: je Schritt ein Verweis auf die Drehungen. */
  const lage = (/** @type {string} */ k, /** @type {string|undefined} */ ideal) => {
    const m = roh.modelle[k], s = m.schritte_ma;
    return {
      einheit: 'drehung',
      zeitsemantik: { bezugssystem, unschaerfe, aufloesung: fehlt('je Zeitraum verschieden; je Punkt angegeben'),
        abdeckung: { von: s.at(-1), bis: s[0] }, schritte: s.length },
      punkte: s.map((/** @type {number} */ _, /** @type {number} */ i) => ({
        bezugszeit: zeit(s, i),
        fassungen: [{
          wert: { verweis: `${datei}#modelle.${k}.rotationen[${i}]`, geometrie: `${datei}#geometrien.${m.geometrie}` },
          wissensstand: WISSENSSTAND,
          woher: { arten: [...m.arten], quelle: `${m.zitat}; ${m.doi}`, archivkette,
            verfahren: roh.woher.verfahren, bezugsrahmen: m.bezugsrahmen, laengengrad: m.laengengrad,
            ...(ideal ? { ideal } : {}) },
        }],
      })),
    };
  };

  const wasser = {
    id: `${P}/wasser`, name: 'Wasser', erhaltung: 'erhalten',
    menge: fehlt('Die Plattenmodelle nennen keine Wassermenge'),
    formen: [{ id: 'ozean', name: 'Ozean', eintrag: `${P}/ozean` }],
  };
  const ozean = {
    id: `${P}/ozean`, stapel: '1.1', name: 'Ozean (jenseits der Küsten)',
    wo: fehlt('Die Modelle führen keine Ozeangeometrie; nur seine Grenze, die Küste'),
    werte: {},
  };
  const SPUR = { bestand: wasser.id, form: 'ozean' };
  const ref = (/** @type {string} */ id, /** @type {string[]} */ ks) => ks.map(k => `${id}#${k}`);

  const umrisse = {
    id: `${P}/umrisse`, stapel: '1.1', name: 'Küstenumrisse in heutiger Form, gedreht (drei Plattenmodelle)',
    auswahl: [`${P}/auswahl/schritte`, `${P}/auswahl/ideale`, `${P}/auswahl/kuesten_paleomap`],
    spur_von: SPUR,
    wo: {
      geometrie: 'grenze',
      koordinaten: { verweis: Object.fromEntries(Object.keys(roh.geometrien).filter(g => g !== 'cao').map(g => [g, `${datei}#geometrien.${g}`])) },
      hinweis: `${roh.woher.form}. ${roh.modelle.merdith2021.laengengrad}`,
      // alle beteiligten Arten (Regel 6): Müller 2022 bringt modell mit
      woher: { arten: [...new Set(ideale.flatMap(i => roh.modelle[i.schluessel].arten))], quelle: roh.woher.kette, archivkette,
        abgeleitet_aus: ref(`${P}/umrisse`, ideale.map(i => `lage_${i.schluessel}`)), verfahren: roh.woher.verfahren },
      verzerrung: VERZERRUNG,
    },
    werte: Object.fromEntries(ideale.map(i => [`lage_${i.schluessel}`, lage(i.schluessel, i.id)])),
  };
  const umrisseCao = cao ? [{
    id: `${P}/umrisse/cao2024`, stapel: '1.1', name: 'Küstenumrisse in heutiger Form, gedreht (Cao et al. 2024, jenseits von 1 Ga)',
    auswahl: [`${P}/auswahl/schritte`],
    spur_von: SPUR,
    wo: {
      geometrie: 'grenze', koordinaten: { verweis: `${datei}#geometrien.cao` },
      hinweis: `${roh.woher.form}. ${cao.laengengrad} Vor 1 Ga nur Kontinentaldrift mit wenigen Polen, ozeanische Platten synthetisch; kein zweites Ideal.`,
      woher: { arten: [...cao.arten], quelle: roh.woher.kette, archivkette, abgeleitet_aus: ref(`${P}/umrisse/cao2024`, ['lage']), verfahren: roh.woher.verfahren },
      verzerrung: VERZERRUNG,
    },
    werte: { lage: lage('cao2024', undefined) },
  }] : [];

  const pk = zusatz.palaeokuesten;
  const palaeokueste = {
    id: `${P}/palaeokueste`, stapel: '1.1', name: 'Paläoküste: 0-m-Linie der PALEOMAP-Paläo-DEMs',
    spur_von: SPUR,
    wo: {
      geometrie: 'grenze',
      koordinaten: pk ? { verweis: `${manifest.zusatz.palaeokuesten}#karten`, aufloesung_grad: pk.raum.aufloesung_grad, unschaerfe: pk.raum.unschaerfe }
        : fehlt('Ohne data/tektonik_palaeokuesten.json keine Paläoküsten'),
      hinweis: pk ? `${pk.woher.form}. ${pk.woher.bezugsrahmen}.` : 'Paläoküsten fehlen',
      woher: { arten: pk ? [...pk.woher.arten] : ['rekonstruktion'], quelle: pk?.woher.kette ?? 'PALEOMAP PaleoDEM', archivkette,
        abgeleitet_aus: [`${P}/palaeokueste#linie`], verfahren: pk?.woher.verfahren ?? fehlt('ohne Datei') },
      verzerrung: VERZERRUNG,
    },
    werte: pk ? {
      linie: {
        einheit: 'linie',
        zeitsemantik: { bezugssystem: pk.zeit.bezugssystem, unschaerfe: pk.zeit.unschaerfe, aufloesung: pk.zeit.aufloesung_ma,
          abdeckung: { von: pk.karten.at(-1).ma, bis: pk.karten[0].ma }, schritte: pk.karten.length },
        punkte: pk.karten.map((/** @type {any} */ k, /** @type {number} */ i) => ({
          bezugszeit: { bezugssystem: pk.zeit.bezugssystem, unschaerfe: pk.zeit.unschaerfe, aufloesung: pk.zeit.aufloesung_ma, wert: k.ma },
          fassungen: [{ wert: { verweis: `${manifest.zusatz.palaeokuesten}#karten[${i}]`, stufe: k.stufe }, wissensstand: WISSENSSTAND,
            woher: { arten: [...pk.woher.arten], quelle: `${pk.woher.kette} · ${k.datei}`, archivkette, verfahren: pk.woher.verfahren } }],
        })),
      },
    } : { linie: fehlt('Ohne data/tektonik_palaeokuesten.json keine Paläoküsten') },
  };

  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, zusatz: manifest.zusatz, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/schritte`, was: 'Zeitschritte: 1 Ma bis 66 Ma, 5 Ma bis 250 Ma, 10 Ma bis 1000 Ma, Cao 25 Ma bis 1800 Ma',
        gesetzt_in: 'kern/BERICHT-tektonik.md, Abschnitt 3', begruendung: 'Dichte nach Tiefe: Platten wandern rund 0,5° je Ma; im Känozoikum dicht, in der Tiefe grob, wo die Lage ohnehin unsicher ist' },
      { id: `${P}/auswahl/ideale`, was: `Ideale: ${ideale.map(i => i.name).join(', ')}; Cao 2024 nur jenseits von 1 Ga`,
        gesetzt_in: MI.gesetzt_in, begruendung: MI.begruendung },
      { id: `${P}/auswahl/kuesten_paleomap`, was: 'Für PALEOMAP die Merdith-Küsten, geteilt an den PALEOMAP-Plattenpolygonen',
        gesetzt_in: 'matrix-scharnier/adapter/tektonik.py', begruendung: 'Das PALEOMAP-Plattenmodell bringt keine Küsten mit; dieselben Linien machen die Lage vergleichbar' },
    ],
    ideale: ideale.map(({ schluessel, ...i }) => i),
    bestaende: [wasser],
    eintraege: [ozean, umrisse, ...umrisseCao, palaeokueste],
    prozesse: [],
    relationen: [],
  };
}
