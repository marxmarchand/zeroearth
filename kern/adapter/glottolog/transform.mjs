// @ts-check
/* ════════════════════════════════════════════════════════════════════
   Adapter Glottolog: data/glottolog.json → Graph nach kern/schema.mjs.

   Einordnung (Entscheidung Max, 2026-11-01):
   - Sprache = Eintrag der 2. Natur in 2.2 (Institutionalisierung von
     Kommunikation; schon die Abgrenzung Sprache/Dialekt ist eine Setzung
     von Glottolog). Verweist auf 2.3, das symbolische System.
   - Träger: Sprachgemeinschaft in 1.3, Punkt als Näherung des Gebiets.
   - Gefährdung = Überlieferung von der Sprache in ihre Gemeinschaft, mit
     den sechs AES-Stufen als Modus. Status ohne Quellenangabe ist die
     eigene Kategorie "Quelle fehlt" (beleg fehlend), nicht mit belegten
     Stufen gemischt.
   - ElCat-Sicherheit als Konfidenz der Quelle, als Text, keine Zahl.

   Läuft in Node und im Browser (keine Node-Importe auf oberster Ebene):
   Die Oberfläche zeichnet die Ebene aus diesem Graphen.

   node kern/adapter/glottolog/transform.mjs           Zusammenfassung
   node kern/adapter/glottolog/transform.mjs --graph   Graph als JSON
   ════════════════════════════════════════════════════════════════════ */
import { SCHEMA_VERSION, MODI, fehlt, nichtErhoben } from '../../schema.mjs';

const P = 'glottolog';
const KEIN_DATUM = 'Glottolog datiert weder Name, Familie noch Status; das Jahr der Quelle ist Wissensstand, nicht Bezugszeit';
export const QUELLE_FEHLT = 'quelle_fehlt';

/**
 * @param {any} roh Inhalt von data/glottolog.json
 * @param {any} manifest kern/adapter/glottolog/manifest.json
 * @returns {import('../../schema.mjs').Graph}
 */
export function transform(roh, manifest) {
  const KETTE = manifest.herkunft.archivkette.slice(0, 2);
  const WS_GLOTTOLOG = { seit: roh.woher.veroeffentlicht, status: /** @type {const} */ ('vorlaeufig') };
  const W_GLOTTOLOG = { arten: ['kuratiert'], quelle: roh.woher.quelle, archivkette: KETTE };
  const text = (/** @type {any} */ wert) => ({
    einheit: 'text',
    punkte: [{ bezugszeit: fehlt(KEIN_DATUM), fassungen: [{ wert, wissensstand: WS_GLOTTOLOG, woher: W_GLOTTOLOG }] }],
  });
  const quelleVon = (/** @type {string} */ q) => roh.quellen[q]
    ?? { name: `Glottolog-Bibliografie ${q.replace('bib:', '')}`, jahr: null, bib: q.replace('bib:', '') };

  const zeichensystem = {
    id: `${P}/zeichensystem`, stapel: '2.3', name: 'Sprache als symbolisches System (Signal – Symbol)',
    haengt_an: fehlt('Ein symbolisches System hängt an keinem einzelnen Träger; die Sprachen (2.2) verweisen darauf'),
    formation: fehlt('Gesellschaftsformation nicht bestimmt'),
    werte: {},
  };

  /** @type {any[]} */ const eintraege = [zeichensystem];
  /** @type {any[]} */ const relationen = [];
  for (const s of roh.sprachen) {
    const gem = {
      id: `${P}/${s.g}/gemeinschaft`, stapel: '1.3', name: `Sprachgemeinschaft · ${s.n}`,
      wo: s.p ? {
        geometrie: 'punkt', lat: s.p[0], lon: s.p[1],
        naeherung: { vertritt: 'flaeche', angabe: 'Punkt statt Sprachgebiet (Glottolog-Koordinate, auf 0,01° gerundet)' },
        verzerrung: { flaeche: fehlt('Ausdehnung des Sprachgebiets unbekannt'), ueberhoehung: 1 },
        woher: { ...W_GLOTTOLOG, archivkette: [...KETTE, fehlt('Woher die Koordinate je Sprache stammt, nennt Glottolog nicht')] },
      } : fehlt('Glottolog nennt keine Koordinate'),
      werte: {},
    };
    const sprache = {
      id: `${P}/${s.g}`, stapel: '2.2', name: s.n,
      haengt_an: [gem.id],
      formation: fehlt('Glottolog nennt keine Gesellschaftsformation'),
      verweist_auf: [zeichensystem.id],
      werte: {
        glottocode: text(s.g),
        kategorie: text(s.k),
        familie: text(s.f ? `${roh.familien[s.f] ?? s.f} (${s.f})` : 'keine Familie (Isolat oder oberste Einheit laut Glottolog)'),
        ...(s.a === null ? { gefaehrdung: nichtErhoben('Gefährdung') } : {}),
      },
    };
    eintraege.push(gem, sprache);
    if (s.a === null) continue;

    const q = s.q ? quelleVon(s.q) : null;
    relationen.push({
      id: `${P}/${s.g}/ueberlieferung`, art: 'ueberlieferung', von: sprache.id, nach: gem.id,
      modus: MODI.ueberlieferung[s.a - 1],
      bezugszeit: fehlt(KEIN_DATUM),
      wissensstand: q?.jahr ? { seit: String(q.jahr), status: 'vorlaeufig' }
        : fehlt(q ? 'Jahr der Quelle unbekannt' : 'Quelle fehlt'),
      beleg: q ? [`${q.name}${q.jahr ? ` ${q.jahr}` : ''} (Glottolog-Bib ${q.bib})`]
        : fehlt('Quelle fehlt: Glottolog nennt für diesen Status keine Quelle'),
      woher: {
        arten: ['kuratiert'],
        quelle: `${roh.woher.quelle}, AES-Stufe ${s.a} (${roh.aes_stufen[s.a]})`,
        archivkette: [...KETTE, q ? { archiv: `${q.name}${q.jahr ? ` ${q.jahr}` : ''}`, art: 'gesellschaftlich' }
          : fehlt('Quelle fehlt')],
        ...(s.c ? { konfidenz: { skala: 'ElCat: Sicherheit der Einstufung (eigene Stufen)', stufe: s.c } } : {}),
      },
    });
  }

  const A = roh.auswahl;
  return {
    schema: SCHEMA_VERSION,
    adapter: { id: manifest.id, eingabe: manifest.eingabe, erzeugt: roh.erzeugt },
    formationen: [],
    subjektachse: { status: 'leer', grund: 'vorgesehen (strukturstand, Modi und Erwartung), vorerst leer' },
    auswahl: [
      { id: `${P}/auswahl/einordnung`, was: 'Sprache als Eintrag in 2.2 mit Verweis auf 2.3; Träger Sprachgemeinschaft in 1.3',
        gesetzt_in: manifest.einordnung.gesetzt, begruendung: manifest.einordnung.sprache },
      { id: `${P}/auswahl/level`, was: 'nur Languoide des Levels language; Sprache und Dialekt grenzt Glottolog ab',
        gesetzt_in: 'Glottolog (Level) und matrix-scharnier/adapter/glottolog.py',
        begruendung: 'Die Abgrenzung Sprache/Dialekt ist eine Setzung von Glottolog und wird übernommen, nicht geprüft' },
      { id: `${P}/auswahl/kategorien`,
        was: `aufgenommen: ${A.kategorien.join(', ')}; ausgeschlossen: ${Object.entries(A.ausgeschlossen).map(([k, n]) => `${k} (${n})`).join(', ')}`,
        gesetzt_in: 'matrix-scharnier/adapter/glottolog.py (KATEGORIEN)', begruendung: manifest.ausgeschlossen.begruendung },
      { id: `${P}/auswahl/familie`, was: 'Familie als einfacher Wert (oberste Familie), nicht als Abstammungsbaum',
        gesetzt_in: 'Entscheidung Max, 2026-11-01', begruendung: 'Baum später, für die Netzansicht' },
    ],
    bestaende: [],
    eintraege,
    prozesse: [],
    relationen,
  };
}

/** Kategorie einer Überlieferung für die Ansicht: die Stufe, oder "Quelle fehlt". */
export const kategorie = (/** @type {any} */ r) =>
  r.beleg && typeof r.beleg === 'object' && !Array.isArray(r.beleg) && r.beleg.fehlt ? QUELLE_FEHLT : r.modus;

/** Zählung je Kategorie; Sprachen ohne Status als "nicht erhoben". */
export function zusammenfassung(/** @type {any} */ graph) {
  const n = /** @type {Record<string, number>} */ ({});
  for (const r of graph.relationen) n[kategorie(r)] = (n[kategorie(r)] ?? 0) + 1;
  n.nicht_erhoben = graph.eintraege.filter((/** @type {any} */ e) => e.stapel === '2.2' && e.werte.gefaehrdung).length;
  return n;
}

if (typeof process !== 'undefined' && process.argv?.[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''))) {
  const { readFile } = await import('node:fs/promises');
  const { dirname, join, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const hier = dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(await readFile(join(hier, 'manifest.json'), 'utf8'));
  const roh = JSON.parse(await readFile(resolve(hier, '../../..', manifest.eingabe), 'utf8'));
  const g = transform(roh, manifest);
  if (process.argv.includes('--graph')) process.stdout.write(JSON.stringify(g) + '\n');
  else console.log(`Glottolog: ${roh.sprachen.length} Sprachen; Überlieferung je Kategorie:`, zusammenfassung(g));
}
