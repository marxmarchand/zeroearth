#!/usr/bin/env node
// @ts-check
/* ════════════════════════════════════════════════════════════════════
   DCAT-ADAPTER — fragt offene Datenkataloge nach Kandidaten für die
   Adressen der Matrix und schreibt data/kandidaten.json.

   Was dieser Adapter NICHT tut: verorten. Er hält nur fest, für welche
   Adresse gesucht wurde (`gesucht_fuer`) — das ist der Suchanlass, keine
   Zuweisung. Die Zuweisung trifft verorten.mjs über TypeSafe und trägt
   ihre eigene Herkunft und Konfidenz (`verortung`). Zwei verschiedene
   Aussagen, zwei verschiedene Felder.

   Läuft nicht von hier: die Kataloge liegen hinter dem Proxy. Der Lauf
   gehört in .github/workflows/kandidaten.yml, wo das Ergebnis ein
   Commit ist — damit steht im Repo, woher jeder Kandidat stammt.

     node dcat.mjs --trocken              nur die geplanten Anfragen zeigen
     node dcat.mjs --ziel ../../data/kandidaten.json
     node dcat.mjs --adresse erste_natur/unterbau --je 30
   ════════════════════════════════════════════════════════════════════ */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SUCHBEGRIFFE, ADRESSEN } from '../matrix.mjs';

/* Kataloge. Nur der CKAN-Treiber ist gegen eine bekannte Antwortform
   geschrieben. Ein weiterer Katalog ist ein Eintrag mehr — aber erst,
   nachdem wir eine echte Antwort gesehen haben. */
const KATALOGE = {
  govdata: { art: 'ckan', basis: 'https://ckan.govdata.de',
             name: 'GovData — Datenportal für Deutschland' },
};

const arg = (flagge, vorgabe = null) => {
  const i = process.argv.indexOf(flagge);
  return i > -1 ? (process.argv[i + 1] ?? true) : vorgabe;
};
const ziel     = String(arg('--ziel', '../../data/kandidaten.json'));
const je       = Number(arg('--je', 20));
const nurAdr   = arg('--adresse');
const katName  = String(arg('--katalog', 'govdata'));
const trocken  = process.argv.includes('--trocken');

const katalog = KATALOGE[katName];
if (!katalog) { console.error(`Unbekannter Katalog: ${katName}`); process.exit(2); }

/* Adressen gegen das Modell prüfen — ein Tippfehler in SUCHBEGRIFFE soll
   auffallen, nicht stillschweigend eine Adresse überspringen. */
const unbekannt = Object.keys(SUCHBEGRIFFE).filter(a => !ADRESSEN.includes(a));
if (unbekannt.length) { console.error(`Adressen ohne Modell: ${unbekannt.join(', ')}`); process.exit(2); }
const fehlend = ADRESSEN.filter(a => !(a in SUCHBEGRIFFE));
if (fehlend.length) console.warn(`Hinweis — ohne Suchbegriffe: ${fehlend.join(', ')}`);

const plan = Object.entries(SUCHBEGRIFFE)
  .filter(([a]) => !nurAdr || a === nurAdr)
  .flatMap(([adresse, begriffe]) => begriffe.map(begriff => ({ adresse, begriff })));

if (trocken) {
  console.log(`Trockenlauf · ${katalog.name}\n`);
  let adr = '';
  for (const { adresse, begriff } of plan) {
    if (adresse !== adr) { adr = adresse; console.log(`  ${adresse}`); }
    console.log(`      ${begriff}  →  ${anfrageUrl(katalog, begriff, je)}`);
  }
  const leer = Object.entries(SUCHBEGRIFFE).filter(([, b]) => !b.length).map(([a]) => a);
  console.log(`\n${plan.length} Anfragen für ${new Set(plan.map(p => p.adresse)).size} Adressen`);
  if (leer.length) console.log(`ohne Suchbegriffe (Befund, kein Fehler): ${leer.join(', ')}`);
  process.exit(0);
}

function anfrageUrl(kat, begriff, anzahl) {
  const u = new URL('/api/3/action/package_search', kat.basis);
  u.searchParams.set('q', begriff);
  u.searchParams.set('rows', String(anzahl));
  return u.toString();
}

/* CKAN-Antwort → Kandidaten. Bricht laut ab, wenn die Form nicht stimmt:
   lieber eine sprechende Fehlermeldung im Lauf-Protokoll als eine Datei
   voller Nichts. */
function ausCkan(rohtext, url) {
  let d;
  try { d = JSON.parse(rohtext); }
  catch { throw new Error(`Keine JSON-Antwort von ${url}\n${rohtext.slice(0, 300)}`); }
  if (d?.success !== true || !Array.isArray(d?.result?.results))
    throw new Error(`Unerwartete CKAN-Form von ${url}\n${JSON.stringify(d).slice(0, 300)}`);
  return d.result.results;
}

const extra = (pkg, schluessel) =>
  (pkg.extras ?? []).find(e => e.key === schluessel)?.value ?? null;

function raumAus(pkg) {
  const roh = extra(pkg, 'spatial');
  if (!roh) return null;
  try {
    const g = JSON.parse(roh);
    const punkte = JSON.stringify(g).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    if (punkte.length < 4) return null;
    const x = punkte.filter((_, i) => i % 2 === 0), y = punkte.filter((_, i) => i % 2 === 1);
    return { bbox: [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)] };
  } catch { return { roh: String(roh).slice(0, 200) }; }
}

function normalisiere(pkg, adresse) {
  const von = extra(pkg, 'temporal_start'), bis = extra(pkg, 'temporal_end');
  return {
    id: `${katName}:${pkg.name}`,
    titel: pkg.title ?? pkg.name,
    beschreibung: (pkg.notes ?? '').replace(/\s+/g, ' ').trim().slice(0, 600),
    herausgeber: pkg.organization?.title ?? null,
    lizenz: pkg.license_title ?? pkg.license_id ?? null,
    raum: raumAus(pkg),
    zeit: (von || bis) ? { von, bis } : null,
    formate: [...new Set((pkg.resources ?? []).map(r => r.format).filter(Boolean))],
    url: `${katalog.basis}/dataset/${pkg.name}`,
    katalog: katName,
    gesucht_fuer: [adresse],
    abgerufen: new Date().toISOString(),
  };
}

const gefunden = new Map();
let anfragen = 0, treffer = 0;
for (const { adresse, begriff } of plan) {
  const url = anfrageUrl(katalog, begriff, je);
  let antwort;
  try {
    const r = await fetch(url, { headers: { 'accept': 'application/json',
      'user-agent': 'zeroearth-dcat-adapter (+https://zeroearth.io)' } });
    if (!r.ok) { console.warn(`  ${begriff}: HTTP ${r.status}`); continue; }
    antwort = ausCkan(await r.text(), url);
  } catch (e) {
    console.warn(`  ${begriff}: ${e.message.split('\n')[0]}`);
    continue;
  }
  anfragen++; treffer += antwort.length;
  for (const pkg of antwort) {
    const k = normalisiere(pkg, adresse);
    const da = gefunden.get(k.id);
    // Derselbe Datensatz kann auf mehrere Adressen antworten. Das ist ein
    // Befund über die Adressen, kein Doppeleintrag — also sammeln statt werfen.
    if (da) { if (!da.gesucht_fuer.includes(adresse)) da.gesucht_fuer.push(adresse); }
    else gefunden.set(k.id, k);
  }
  await new Promise(r => setTimeout(r, 400));   // dem Katalog Luft lassen
}

const kandidaten = [...gefunden.values()].sort((a, b) => a.id.localeCompare(b.id));
const datei = {
  erzeugt: new Date().toISOString(),
  hinweis: 'erzeugt von matrix-scharnier/adapter/dcat.mjs — gesucht_fuer ist der '
         + 'Suchanlass, nicht die Verortung. Die trifft verorten.mjs.',
  katalog: { ...katalog, id: katName },
  anfragen, treffer, kandidaten: kandidaten.length,
  mehrdeutig: kandidaten.filter(k => k.gesucht_fuer.length > 1).length,
  eintraege: kandidaten,
};
await mkdir(dirname(ziel), { recursive: true });
await writeFile(ziel, JSON.stringify(datei, null, 2));
console.log(`${ziel} · ${anfragen} Anfragen, ${treffer} Treffer, `
  + `${kandidaten.length} eindeutige Kandidaten, ${datei.mehrdeutig} auf mehreren Adressen`);
