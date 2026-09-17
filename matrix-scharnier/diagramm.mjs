#!/usr/bin/env node
// @ts-check
/* Erzeugt die Diagramme AUS dem Modell (matrix.mjs), je Sprache:
     diagramme/matrix.<lang>.svg        — die Matrix als Schichtung
     diagramme/relationen.<lang>.mmd    — der relationale Zusammenhang (Mermaid,
                                          wird von GitHub direkt gerendert)
   node diagramm.mjs                                                        */
import { mkdir, writeFile } from 'node:fs/promises';
import { MATRIX, ZEIT, VORAUSSETZUNG, FORMEN, RELATIONEN, REL_TYPEN, beschriftung } from './matrix.mjs';

const OBEN = [...VORAUSSETZUNG].reverse();           // 2.Natur oben
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ── SVG: die Matrix als Schichtung ─────────────────────────────────── */
function svg(sprache) {
  const B = 780, RAND = 16, SPUR = 40, ZH = 30, LUFT = 10;
  let y = RAND, teile = [];
  for (const dim of OBEN) {
    const m = MATRIX[dim], strata = Object.entries(m.strata);
    const h = strata.length * ZH + 2 * LUFT;
    const dunkel = dim === 'nullnatur';
    teile.push(`<rect x="${RAND}" y="${y}" width="${B - 2 * RAND}" height="${h}" fill="${m.farbe}" stroke="#111" stroke-width="2.5"/>`);
    // Beschriftung der Dimension: umbrechen, damit sie in die Spur passt
    const platz = Math.floor(h / 6.4), worte = m[sprache].split(' ');
    const zeilen = [];
    for (const w of worte) {
      const i = zeilen.length - 1;
      if (i >= 0 && (zeilen[i] + ' ' + w).length <= platz) zeilen[i] += ' ' + w;
      else zeilen.push(w);
    }
    const fs = zeilen.length > 1 ? 10 : 11;
    const spuren = zeilen.map((z, i) =>
      `<text transform="translate(${RAND + 14 + i * (fs + 2)},${y + h / 2}) rotate(-90)" text-anchor="middle" dominant-baseline="hanging" font-size="${fs}" font-weight="600" fill="${dunkel ? '#fff' : '#111'}">${esc(z)}</text>`);
    teile.push(spuren.join('\n'));
    strata.forEach(([id, s], i) => {
      const by = y + LUFT + i * ZH;
      teile.push(`<rect x="${RAND + SPUR}" y="${by}" width="${B - 2 * RAND - SPUR - LUFT}" height="${ZH - 6}" fill="#fff" stroke="#111" stroke-width="1.5"/>`);
      teile.push(`<text x="${RAND + SPUR + 10}" y="${by + 16}" font-size="12" fill="#111">${esc(s[sprache])}</text>`);
      teile.push(`<text x="${B - RAND - LUFT - 10}" y="${by + 16}" font-size="9" fill="#777" text-anchor="end">${esc(dim + '/' + id)}</text>`);
    });
    y += h + 8;
  }
  teile.push(`<rect x="${RAND}" y="${y}" width="${B - 2 * RAND}" height="${ZH}" fill="#111"/>`);
  teile.push(`<text x="${RAND + 14}" y="${y + 20}" font-size="12" fill="#fff">${esc(ZEIT[sprache])} · ${esc(ZEIT.wert[sprache])}</text>`);
  y += ZH + RAND;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${y}" viewBox="0 0 ${B} ${y}" font-family="Helvetica, Arial, sans-serif">
<rect width="${B}" height="${y}" fill="#fff"/>
<!-- erzeugt aus matrix.mjs — nicht von Hand ändern -->
${teile.join('\n')}
</svg>`;
}

/* ── Mermaid: der relationale Zusammenhang ──────────────────────────── */
function mermaid(sprache) {
  const knoten = id => id.replace(/[^\w]/g, '_');
  const proDim = {};
  for (const [id, f] of Object.entries(FORMEN)) (proDim[f.bei.split('/')[0]] ??= []).push([id, f]);

  const z = ['flowchart TB'];
  for (const dim of OBEN) {
    z.push(`  subgraph ${knoten(dim)}["${MATRIX[dim][sprache]}"]`);
    for (const [id, f] of proDim[dim] ?? []) z.push(`    ${knoten(id)}["${f[sprache]}"]`);
    if (!(proDim[dim] ?? []).length) z.push(`    ${knoten(dim)}_leer[" "]`);
    z.push('  end');
  }
  for (const r of RELATIONEN) {
    if (r.typ === 'setzt_voraus') continue;                       // Schichtung zeigt das SVG
    const ziel = r.nach in FORMEN ? r.nach : `${VORAUSSETZUNG.find(d => MATRIX[d].strata[r.nach])}/${r.nach}`;
    const t = REL_TYPEN[r.typ][sprache];
    const pfeil = r.typ === 'fasst' || r.typ === 'entwertet' ? '-.->' : '-->';
    z.push(`  ${knoten(r.von)} ${pfeil}|"${t}"| ${knoten(ziel)}["${beschriftung(ziel, sprache)}"]`);
  }
  z.push('  %% erzeugt aus matrix.mjs — nicht von Hand ändern');
  return z.join('\n');
}

await mkdir('diagramme', { recursive: true });
for (const s of ['de', 'en']) {
  await writeFile(`diagramme/matrix.${s}.svg`, svg(s));
  await writeFile(`diagramme/relationen.${s}.mmd`, mermaid(s));
  console.log(`diagramme/matrix.${s}.svg · diagramme/relationen.${s}.mmd`);
}
