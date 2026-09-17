#!/usr/bin/env node
// @ts-check
/* Verortet Kandidaten über TypeSafe in der Matrix und schreibt
   Marker-VORSCHLÄGE im Format von data/marker.json.
   Nichts wird direkt in data/marker.json geschrieben: Übernahme = Kuratierung.

   node verorten.mjs [eingabe] [ausgabe] [--trocken]
   --trocken  zeigt nur die Anfrage, ohne API-Schlüssel und ohne Kosten.   */
import { readFile, writeFile } from 'node:fs/promises';
import { ADRESS_KRITERIEN, EBENEN, ABLOESUNG, SCHWELLEN } from './matrix.mjs';

const args = process.argv.slice(2);
const TROCKEN = args.includes('--trocken');
const [eingabe = 'kandidaten.json', ausgabe = 'marker.kandidaten.json'] =
  args.filter(a => !a.startsWith('--'));

/** Die Fragen: eine Choice (Schwerpunkt), je Ebene eine Noul, ein Score. */
function fragen() {
  return {
    schwerpunkt: {
      type: 'choice',
      instructions: 'Wo in der Matrix gesellschaftlicher Naturverhältnisse liegt der Schwerpunkt dieses Objekts?',
      criteria: ADRESS_KRITERIEN,
    },
    ...Object.fromEntries(Object.entries(EBENEN).map(([k, e]) =>
      [`ebene_${k}`, { type: 'noul', instructions: e.frage }])),
    abloesung: {
      type: 'score',
      instructions: 'Wie weit ist der Wert dieses Objekts vom konkreten stofflich-räumlichen Verhältnis gelöst?',
      criteria: ABLOESUNG,
    },
  };
}

const S = SCHWELLEN;
/** @param {number} p */
const nounStatus = p => p >= S.noul.ja ? 'übernehmen' : p > S.noul.nein ? 'prüfen' : null;
/** @param {number} c */
const choiceStatus = c => c >= S.choice.uebernehmen ? 'übernehmen'
                        : c >= S.choice.pruefen ? 'prüfen' : 'unverortet';

const kandidaten = JSON.parse(await readFile(eingabe, 'utf8')).kandidaten;

if (TROCKEN) {
  const k = kandidaten[0];
  console.log(JSON.stringify({ state: zustand(k), questions: fragen() }, null, 2));
  console.log(`\n${kandidaten.length} Kandidat(en), ${Object.keys(fragen()).length} Fragen je Aufruf.`);
  process.exit(0);
}

const { TypeSafeClient } = await import('@typesafe-ai/sdk');
const client = new TypeSafeClient();   // liest TYPESAFE_API_KEY
const erstellt = new Date().toISOString();

/** @param {any} k */
function zustand(k) {
  return { objekt: k.label, quelle: k.quelle, text: k.text };
}

const objekte = [];
for (const k of kandidaten) {
  const { answers: a, model } = await client.systemOne({ state: zustand(k), questions: fragen() });
  const herkunft = { quelle: k.quelle, verortet_durch: `typesafe:${model}`, erstellt };

  const aspekte = [];
  for (const ebene of Object.keys(EBENEN)) {
    const p = a[`ebene_${ebene}`].noul;
    const status = nounStatus(p);
    if (!status) continue;                       // klares Nein: kein Aspekt
    const [jahr0, jahr1] = k.zeitfenster?.[ebene] ?? [undefined, undefined];
    const offen = jahr0 === undefined;           // Zeitfenster sind Daten, kein Urteil
    aspekte.push({
      ebene, jahr0: offen ? null : jahr0, jahr1: offen ? null : jahr1,
      status: offen ? 'prüfen' : status,
      ...(offen && { hinweis: 'Zeitfenster offen' }),
      p: +p.toFixed(3), provenienz: herkunft,
    });
  }

  const sp = a.schwerpunkt;
  objekte.push({
    id: k.id, label: k.label, lon: k.lon, lat: k.lat, aspekte,
    verortung: {
      schwerpunkt: sp.choice, confidence: +sp.confidence.toFixed(3),
      status: sp.choice === 'unverortbar' ? 'unverortet' : choiceStatus(sp.confidence),
      verteilung: Object.fromEntries(Object.entries(sp.probabilities)
        .filter(([, p]) => p >= 0.05).sort((x, y) => y[1] - x[1])),
      abloesung: +a.abloesung.score.toFixed(2),
    },
  });
  console.log(`${k.label}: ${aspekte.length} Aspekt(e), Schwerpunkt ${sp.choice} (${sp.confidence.toFixed(2)})`);
}

await writeFile(ausgabe, JSON.stringify({ hinweis: 'Vorschläge — vor Übernahme in data/marker.json kuratieren', objekte }, null, 2));
console.log(`→ ${ausgabe}`);
