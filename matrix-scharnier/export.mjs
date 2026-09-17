#!/usr/bin/env node
// @ts-check
/* Schreibt das Modell als data/matrix.json — die Datei, die der Globus liest.
   node export.mjs [ziel]   (Vorgabe: ../data/matrix.json)                 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { MATRIX, ZEIT, VORAUSSETZUNG, FORMEN, RELATIONEN, REL_TYPEN, EBENEN } from './matrix.mjs';

const ziel = process.argv[2] ?? '../data/matrix.json';
const modell = {
  erzeugt: new Date().toISOString(),
  hinweis: 'erzeugt aus matrix-scharnier/matrix.mjs — nicht von Hand ändern',
  voraussetzung: VORAUSSETZUNG,
  zeit: ZEIT,
  dimensionen: Object.fromEntries(Object.entries(MATRIX).map(([d, m]) => [d, {
    de: m.de, en: m.en, farbe: m.farbe,
    strata: Object.fromEntries(Object.entries(m.strata).map(([s, b]) => [s, { de: b.de, en: b.en }])),
  }])),
  ebenen: Object.fromEntries(Object.entries(EBENEN).map(([k, e]) => [k, e.adresse])),
  formen: FORMEN,
  relationen: RELATIONEN,
  relationstypen: REL_TYPEN,
};
await mkdir(dirname(ziel), { recursive: true });
await writeFile(ziel, JSON.stringify(modell, null, 2));
console.log(`${ziel} · ${Object.keys(modell.dimensionen).length} Dimensionen, ${RELATIONEN.length} Relationen`);
