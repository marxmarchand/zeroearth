// @ts-check
/* Gesellschaftlicher Stoffwechsel je Land (Plan Prozess, kern/BERICHT-stofffluss.md).
   Übernimmt die Einträge der Adapter eurostat, faostat und ilostat unverändert und
   setzt Prozesse, Bestände und Relationen darauf. Nichts wird verrechnet: Jede
   Quelle bleibt ein eigener Zu- oder Ausgang. Was fehlt, steht als fehlt mit Grund. */
import { readFileSync } from 'node:fs';
import { SCHEMA_VERSION, fehlt } from '../../schema.mjs';
import { idTeil } from '../stofffluss_reihe.mjs';
import { iso3VonEurostat, iso3VonM49, FEHLT } from '../stofffluss_herkunft.mjs';
import { transform as eurostat } from '../eurostat/transform.mjs';
import { transform as faostat } from '../faostat/transform.mjs';
import { transform as ilostat } from '../ilostat/transform.mjs';

const P = 'stoffwechsel';
const lies = (/** @type {string} */ n) => JSON.parse(readFileSync(new URL(`../${n}/manifest.json`, import.meta.url), 'utf8'));


/** @param {any} codes @param {any} manifest @param {any} z */
export function transform(codes, manifest, z) {
  const E = eurostat(z.mfa, lies('eurostat'), { energie: z.energie });
  const F = faostat(z.produktion, lies('faostat'), { land: z.land });
  const I = ilostat(z.arbeit, lies('ilostat'));
  const ids = new Set([...E.eintraege, ...F.eintraege, ...I.eintraege].map(e => e.id));
  const kette = manifest.herkunft.archivkette;
  const WS = fehlt('Setzung nach dem Plan Prozess; kein eigener Wissensstand');
  const setzung = (/** @type {string} */ was) => ({ arten: ['kuratiert'], quelle: `Setzung (Plan Prozess, kern/BERICHT-stofffluss.md): ${was}`, archivkette: kette });
  const ohneZeit = fehlt('Jahreswerte; die Quellen nennen keine Unschärfe der Zeit');
  const zeitraum = (/** @type {number} */ von, /** @type {number} */ bis) => ({ bezugssystem: 'a_ce', von, bis, unschaerfe: ohneZeit });

  /** @type {Map<string, any>} */ const prozesse = new Map();
  const eintraege = [], bestaende = [], relationen = [];
  const ROW = { id: `${P}/prozess/rest_der_welt`, name: 'Rest der Welt (Handelspartner nicht genannt)', uebergang: 'gesellschaftlicher_stoffwechsel', zufluesse: [], ausgaenge: [] };
  const prozess = (/** @type {string} */ iso3) => {
    if (!prozesse.has(iso3)) prozesse.set(iso3, { id: `${P}/prozess/${idTeil(iso3)}`, name: `Gesellschaftlicher Stoffwechsel · ${codes.laender[iso3]?.name ?? iso3}`,
      uebergang: 'gesellschaftlicher_stoffwechsel', zufluesse: [], ausgaenge: [] });
    return prozesse.get(iso3);
  };
  /** Jüngstes Jahr, in dem alle Posten einen Wert haben. @param {any} w @param {string[]} posten */
  const juengstes = (w, posten) => Object.keys(w[posten[0]] ?? {}).map(Number).sort((a, b) => b - a)
    .find(j => posten.every(k => w[k]?.[String(j)]?.[0] !== null && w[k]?.[String(j)]?.[0] !== undefined));
  const ungeordnet = new Set();

  // Eurostat: Material
  for (const r of z.mfa.reihen) {
    const iso3 = iso3VonEurostat(r.geo, codes); if (!iso3) { ungeordnet.add(`eurostat:${r.geo}`); continue; }
    const p = prozess(iso3), quelleId = `eurostat/mfa/${idTeil(r.geo)}/${idTeil(r.gruppe)}`, g = z.mfa.gruppen[r.gruppe];
    const imLand = { id: `${P}/${idTeil(iso3)}/material/${idTeil(r.gruppe)}/im_land`, stapel: g.stapel, name: `${g.name} im Land, verbraucht oder eingebaut · ${codes.laender[iso3].name}`,
      wo: fehlt('Länder als Bezugseinheit; Umrisse nicht eingebunden'), werte: { bestand: fehlt(FEHLT.materialbestand[2]) } };
    eintraege.push(imLand);
    p.zufluesse.push({ von: quelleId, herkunftsstapel: g.stapel, art: 'stoff', menge: `${quelleId}#entnahme` });
    p.ausgaenge.push({ nach: imLand.id, art: 'stoff', menge: `${quelleId}#inlandsverbrauch` });
    const bestand = { id: `${P}/bestand/material/${idTeil(iso3)}/${idTeil(r.gruppe)}`, name: `${g.name} · ${codes.laender[iso3].name}`, erhaltung: 'erhalten',
      menge: fehlt(FEHLT.materialbestand[2]),
      // Formen nur innerhalb des Stapels (Regel B); Prozess und Handel hängen als Relationen an
      formen: [{ id: 'natur', name: 'in der Natur (Entnahme)', eintrag: quelleId }, { id: 'im_land', name: 'verbraucht oder eingebaut', eintrag: imLand.id }] };
    bestaende.push(bestand);
    const jahre = Object.keys(r.werte.DE ?? {}).map(Number).sort((a, b) => a - b);
    for (const [k, von, nach] of /** @type {const} */ ([['import', ROW.id, p.id], ['export', p.id, ROW.id]]))
      relationen.push({ id: `${P}/relation/${k}/${idTeil(iso3)}/${idTeil(r.gruppe)}`, art: 'stoffwechsel', von, nach, prozess: p.id, beleg: [z.mfa.quelle.url],
        menge: `${quelleId}#${k}`, bilanz: { einheit: z.mfa.einheit, zufluss: fehlt(`Die Gegenseite (${k === 'import' ? 'Export' : 'Import'} der Partnerländer) nennt env_ac_mfa nicht`), abfluss: [fehlt('wie Zufluss')] },
        woher: setzung(`${k === 'import' ? 'Import' : 'Export'} als Relation zum Prozess „Rest der Welt“; Mengen in ${quelleId}#${k}`), wissensstand: WS, bezugszeit: zeitraum(jahre[0], jahre.at(-1)) });
    const j = juengstes(r.werte, ['DE', 'IMP', 'EXP', 'DMC']);
    if (j !== undefined) {
      const v = (/** @type {string} */ k) => r.werte[k][String(j)][0], kz = ['DE', 'IMP', 'EXP', 'DMC'].map(k => r.werte[k][String(j)][1]).filter(Boolean);
      relationen.push({ id: `${P}/relation/bilanz/${idTeil(iso3)}/${idTeil(r.gruppe)}`, art: 'stoffwechsel', bestand: bestand.id, von: quelleId, nach: imLand.id, prozess: p.id, beleg: [z.mfa.quelle.url],
        bilanz: { einheit: z.mfa.einheit, zufluss: v('DE') + v('IMP'), abfluss: [v('EXP'), v('DMC')], toleranz: Math.max(1, 1e-3 * Math.abs(v('DMC'))), pruefart: 'innere_stimmigkeit',
          aus: { zufluss: `${quelleId}#entnahme`, abfluss: [`${quelleId}#export`, `${quelleId}#inlandsverbrauch`] } },
        woher: { arten: kz.some(x => /[ei]/.test(x)) ? ['kuratiert', 'modell', 'berechnet'] : ['beobachtung', 'kuratiert'], archivkette: kette,
          quelle: `${z.mfa.quelle.name}; Bilanz = Definition der Konten (DMC = DE + IMP − EXP), prüft nur die innere Stimmigkeit`, ...(kz.length ? { hinweis: `Kennzeichen: ${kz.join(', ')}` } : {}) },
        wissensstand: WS, bezugszeit: { bezugssystem: 'a_ce', wert: j, unschaerfe: ohneZeit } });
    }
  }

  // Eurostat: Energie
  const POSTEN = ['PPRD', 'RCV_RCY', 'IMP', 'EXP', 'STK_CHG', 'GAE', 'INTMARB', 'GIC'];
  for (const r of z.energie.reihen) {
    const iso3 = iso3VonEurostat(r.geo, codes); if (!iso3) { ungeordnet.add(`eurostat:${r.geo}`); continue; }
    const p = prozess(iso3), quelleId = `eurostat/energie/${idTeil(r.geo)}/${idTeil(r.traeger)}`, t = z.energie.traeger[r.traeger];
    const imLand = { id: `${P}/${idTeil(iso3)}/energie/${idTeil(r.traeger)}/im_land`, stapel: t.stapel, name: `${t.name}, im Land verbraucht · ${codes.laender[iso3].name}`,
      wo: fehlt('Länder als Bezugseinheit; Umrisse nicht eingebunden'), werte: { weiter_als_waerme: fehlt('Endenergie und Verluste sind nicht ausgewählt; der Weg zur Wärme fehlt') } };
    eintraege.push(imLand);
    const zu = { von: quelleId, herkunftsstapel: t.stapel, art: 'energie', menge: `${quelleId}#pprd` };
    if (t.stapel === '0.3') Object.assign(zu, { richtung: 'extern', kette: fehlt(FEHLT.sonnenkette[2]) });
    p.zufluesse.push(zu);
    p.ausgaenge.push({ nach: imLand.id, art: 'energie', menge: `${quelleId}#gic` });
    const bestand = { id: `${P}/bestand/energie/${idTeil(iso3)}/${idTeil(r.traeger)}`, name: `${t.name} · ${codes.laender[iso3].name}`, erhaltung: 'erhalten',
      menge: fehlt(FEHLT.energievorraete[2]),
      formen: [{ id: 'natur', name: 'Primärenergie', eintrag: quelleId }, { id: 'im_land', name: 'im Land verbraucht', eintrag: imLand.id }] };
    bestaende.push(bestand);
    const jahre = Object.keys(r.werte.PPRD ?? r.werte.GIC ?? {}).map(Number).sort((a, b) => a - b);
    if (jahre.length) for (const [k, von, nach] of /** @type {const} */ ([['imp', ROW.id, p.id], ['exp', p.id, ROW.id]]))
      relationen.push({ id: `${P}/relation/energie_${k}/${idTeil(iso3)}/${idTeil(r.traeger)}`, art: 'stoffwechsel', von, nach, prozess: p.id, beleg: [z.energie.quelle.url],
        menge: `${quelleId}#${k}`, bilanz: { einheit: z.energie.einheit, zufluss: fehlt('Die Gegenseite (Partnerländer) nennt die Energiebilanz nicht'), abfluss: [fehlt('wie Zufluss')] },
        woher: setzung(`Energie-${k === 'imp' ? 'Einfuhr' : 'Ausfuhr'} als Relation zum Prozess „Rest der Welt“`), wissensstand: WS, bezugszeit: zeitraum(jahre[0], jahre.at(-1)) });
    const j = juengstes(r.werte, POSTEN);
    if (j !== undefined) {
      const v = (/** @type {string} */ k) => r.werte[k][String(j)][0];
      relationen.push({ id: `${P}/relation/energiebilanz/${idTeil(iso3)}/${idTeil(r.traeger)}`, art: 'stoffwechsel', bestand: bestand.id, von: quelleId, nach: imLand.id, prozess: p.id, beleg: [z.energie.quelle.url],
        bilanz: { einheit: z.energie.einheit, zufluss: v('PPRD') + v('RCV_RCY') + v('IMP') + v('STK_CHG'), abfluss: [v('EXP'), v('INTMARB'), v('GIC')],
          toleranz: Math.max(1, 1e-3 * Math.abs(v('GAE'))), pruefart: 'innere_stimmigkeit', aus: { zufluss: `${quelleId}#pprd`, abfluss: [`${quelleId}#exp`, `${quelleId}#gic`] } },
        woher: { arten: ['beobachtung', 'kuratiert'], archivkette: kette, quelle: `${z.energie.quelle.name}; Bilanz = Definition der Energiebilanz (GAE, GIC), prüft nur die innere Stimmigkeit` },
        wissensstand: WS, bezugszeit: { bezugssystem: 'a_ce', wert: j, unschaerfe: ohneZeit } });
    }
  }

  // FAOSTAT: Erzeugung als eigener Zufluss (nie mit MF1 verrechnet); Agrarfläche als Rolle
  for (const r of z.produktion.reihen) {
    const iso3 = iso3VonM49(z.produktion.laender[r.land].m49, codes); if (!iso3) { ungeordnet.add(`faostat:${r.land}`); continue; }
    const id = `faostat/produktion/${r.land}/${r.gruppe}`;
    prozess(iso3).zufluesse.push({ von: id, herkunftsstapel: '1.2', art: 'stoff', menge: `${id}#produktion`,
      hinweis: 'eigene Quelle (FAOSTAT); überschneidet sich mit Eurostat MF1 (Biomasse), nicht addierbar' });
  }
  for (const r of z.land.reihen) {
    if (r.posten !== '6610') continue;                                   // Agrarfläche als Arbeitsmittel
    const iso3 = iso3VonM49(z.land.laender[r.land].m49, codes); if (!iso3) { ungeordnet.add(`faostat:${r.land}`); continue; }
    const jahre = Object.keys(r.werte).map(Number).sort((a, b) => a - b);
    relationen.push({ id: `${P}/relation/rolle_agrarflaeche/${idTeil(iso3)}`, art: 'rolle', als: 'arbeitsmittel', modus: 'vollzogen', beleg: fehlt('Setzung nach dem Plan Prozess; die Quelle nennt keine Rolle'),
      von: `faostat/land/${r.land}/6610`, nach: prozess(iso3).id, woher: setzung('Agrarfläche als Arbeitsmittel des Prozesses, ohne Menge'), wissensstand: WS,
      bezugszeit: zeitraum(jahre[0], jahre.at(-1)) });
  }

  // ILOSTAT: Arbeitsstunden insgesamt als Zufluss „zeit“ aus 1.3 (Stunden je Person bleiben Kennzahl am Träger)
  for (const r of z.arbeit.teile.how_2tot.reihen) {
    if (!codes.laender[r.land] || codes.laender[r.land].gruppe) { ungeordnet.add(`ilostat:${r.land}`); continue; }
    const id = `ilostat/how_2tot/${idTeil(r.land)}/${idTeil(r.sektor)}`;
    prozess(r.land).zufluesse.push({ von: id, herkunftsstapel: '1.3', art: 'zeit', menge: `${id}#stunden_je_woche`, hinweis: 'Stunden je Woche (Modell der ILO); nicht auf das Jahr hochgerechnet' });
  }

  for (const p of prozesse.values()) if (!p.ausgaenge.length)
    p.bilanz = fehlt('Keine Materialflusskonten und Energiebilanzen (Eurostat) für dieses Land; die Zuflüsse aus FAOSTAT und ILOSTAT stehen ohne Bilanz');
  const fehlend = Object.entries(FEHLT).map(([k, [stapel, name, grund]]) => ({ id: `${P}/fehlt/${k}`, stapel, name, wo: fehlt(grund), werte: { menge: fehlt(grund) } }));
  for (const zu of ROW.zufluesse) ids.add(zu.von);
  return {
    schema: SCHEMA_VERSION, adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: z.mfa.erzeugt },
    formationen: [], subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [...E.auswahl, ...F.auswahl, ...I.auswahl,
      { id: `${P}/auswahl/prozesse`, was: 'Je Land ein Prozess „gesellschaftlicher Stoffwechsel“ und ein Prozess „Rest der Welt“', gesetzt_in: 'kern/BERICHT-stofffluss.md, Plan Prozess', begruendung: 'Entscheidung von Max (2026-11-08): Beides bauen' },
      { id: `${P}/auswahl/bilanzjahr`, was: 'Bilanz-Relation im Graphen für das jüngste vollständige Jahr je Gruppe bzw. Energieträger; alle Jahre prüft kern/test/stoffwechsel.test.mjs', gesetzt_in: 'kern/adapter/stoffwechsel/transform.mjs', begruendung: 'Lesbare Prüfausgabe (je Relation ein Hinweis)' },
      { id: `${P}/auswahl/laendercodes`, was: `Ländercodes über ILOSTAT CL_AREA (ISO-2, ISO-3, M49), Eurostat-Abweichungen EL und UK; nicht zuordenbar: ${[...ungeordnet].sort().join(', ') || 'keine'}`, gesetzt_in: 'data/stofffluss/laendercodes.json', begruendung: 'Keine Zuordnung über Namen (Raten ausgeschlossen)' }],
    ideale: [], bestaende,
    eintraege: [...E.eintraege, ...F.eintraege, ...I.eintraege, ...eintraege, ...fehlend],
    prozesse: [ROW, ...prozesse.values()], relationen,
  };
}
