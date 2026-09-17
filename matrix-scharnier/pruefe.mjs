#!/usr/bin/env node
// @ts-check
/* Prüft, ob die Plattform dieselben Adressen benutzt wie das Modell.
   Findet Abweichungen, bevor Daten an tote Adressen gehängt werden.
   node pruefe.mjs [pfad/zur/index.html]     Rückgabewert 1 bei Abweichung */
import { readFile } from 'node:fs/promises';
import { MATRIX, EBENEN } from './matrix.mjs';

const html = await readFile(process.argv[2] ?? '../index.html', 'utf8');
const block = (muster, schluessel) => {
  const m = html.match(muster);
  return m ? [...m[1].matchAll(schluessel)].map(x => x[1]) : [];
};
const gefunden = {
  DIMS:     block(/const DIMS = \{([\s\S]*?)\n\};/, /^  ([a-z_]+)\s*:\s*\{/gm),
  subHeads: block(/subHeads: \{([\s\S]*?)\n\s*\},/, /([a-z_]+)\s*:\s*'/g),
  Marker:   [...(html.match(/static STYLE = \{([\s\S]*?)\n\s*\};/)?.[1] ?? '')
    .matchAll(/^\s+([a-z_]+)\s*:/gm)].map(x => x[1]),
};
const modellDims = Object.keys(MATRIX).filter(d => d !== 'nullnatur');   // NullNatur: eigener Renderer
const modellStrata = Object.values(MATRIX).flatMap(m => Object.keys(m.strata));
const modellEbenen = Object.keys(EBENEN);

let abweichungen = 0;
const vergleich = (was, plattform, modell) => {
  const fehlt = plattform.filter(x => !modell.includes(x));
  const extra = modell.filter(x => !plattform.includes(x));
  if (fehlt.length || extra.length) {
    abweichungen++;
    console.log(`\n${was}`);
    if (fehlt.length) console.log(`  nur in der Plattform: ${fehlt.join(', ')}`);
    if (extra.length) console.log(`  nur im Modell:        ${extra.join(', ')}`);
  } else console.log(`${was}: deckungsgleich (${plattform.length})`);
};
vergleich('Dimensionen (DIMS)', gefunden.DIMS, modellDims);
vergleich('Schichten (LABELS.subHeads)', gefunden.subHeads, modellStrata);
vergleich('Marker-Ebenen (MarkerLayer.STYLE)', gefunden.Marker, modellEbenen);
process.exit(abweichungen ? 1 : 0);
