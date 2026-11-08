// @ts-check
/* Gemeinsame Hilfe der Stofffluss-Adapter (eurostat, faostat, ilostat): eine
   Jahresreihe der Quelle als Größe des Kerns. Lücken bleiben als Jahre mit
   {fehlt, grund} stehen (Regel 8); die Herkunft ergibt sich je Wert aus dem
   Kennzeichen der Quelle (Regel 6). Keine Datei eines Adapters, darum außerhalb
   der Adapter-Ordner. */
import { fehlt } from '../schema.mjs';

const UNSCHAERFE = fehlt('Jahreswert; die Quelle nennt keine Unschärfe der Zeit');

/**
 * @param {Record<string, [number|null, string|null, ...any[]]>} werte Jahr → [Wert, Kennzeichen, ...]
 * @param {string} einheit
 * @param {(jahr: number, kennzeichen: string|null, rest: any[]) => {arten: string[], quelle: string, hinweis?: string, erwartungstraeger?: string, wissensstand?: any}} herkunft
 * @param {any[]} archivkette
 * @param {(kennzeichen: string|null) => string} lueckengrund
 */
export function jahresreihe(werte, einheit, herkunft, archivkette, lueckengrund) {
  const jahre = Object.keys(werte).map(Number).sort((a, b) => a - b);
  const von = jahre[0], bis = jahre.at(-1);
  const punkte = [];
  for (let j = von; j <= bis; j++) {
    const [wert, kz, ...rest] = werte[String(j)] ?? [null, null];
    const h = herkunft(j, kz ?? null, rest);
    const woher = { arten: h.arten, quelle: h.quelle, archivkette,
      ...(h.hinweis ? { hinweis: h.hinweis } : {}), ...(h.erwartungstraeger ? { erwartungstraeger: h.erwartungstraeger } : {}) };
    punkte.push({ bezugszeit: { bezugssystem: 'a_ce', wert: j, unschaerfe: UNSCHAERFE, aufloesung: 1 },
      fassungen: [{ wert: wert === null || wert === undefined ? fehlt(werte[String(j)] ? lueckengrund(kz ?? null) : 'Jahr fehlt in der Quelle') : wert,
        wissensstand: h.wissensstand ?? fehlt('Die Quelle nennt nicht, seit wann der Wert so bekannt ist'), woher }] });
  }
  return { einheit, zeitsemantik: { bezugssystem: 'a_ce', unschaerfe: UNSCHAERFE, aufloesung: 1, abdeckung: { von, bis }, schritte: punkte.length }, punkte };
}

/** Kurzform für Codes in Ids (Kleinbuchstaben, nur [a-z0-9_]). @param {string} s */
export const idTeil = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
