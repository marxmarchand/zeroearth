// @ts-check
/* Drehung eines Punkts um einen Eulerpol. Die Seite wendet damit die
   Drehungen an, die pyGPlates je Platte und Zeitschritt berechnet hat
   (data/tektonik_umrisse.json). Keine Interpolation, kein eigenes Modell:
   nur die fertige Drehung auf den heutigen Punkt (Rodrigues). */

const RAD = Math.PI / 180;

/** @param {number} lon @param {number} lat */
const vektor = (lon, lat) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];

/**
 * @param {[number, number]} punkt [Länge, Breite] in Grad, heute
 * @param {[number, number, number]} drehung [Pol-Breite, Pol-Länge, Winkel] in Grad
 * @returns {[number, number]} [Länge, Breite] in Grad, gedreht
 */
export function drehe([lon, lat], [pla, plo, winkel]) {
  if (!winkel) return [lon, lat];
  const p = vektor(lon, lat), k = vektor(plo, pla);
  const w = winkel * RAD, c = Math.cos(w), s = Math.sin(w);
  const kp = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
  const kxp = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]];
  const r = [0, 1, 2].map(i => p[i] * c + kxp[i] * s + k[i] * kp * (1 - c));
  return [Math.atan2(r[1], r[0]) / RAD, Math.asin(Math.max(-1, Math.min(1, r[2]))) / RAD];
}

/**
 * Index des Schritts, der zu ma passt, oder null. Nur Stützstellen der Quelle:
 * ein Schritt gilt bis zur Hälfte des Abstands zum Nachbarn.
 * @param {number[]} schritte aufsteigend, in Ma
 * @param {number} ma
 */
export function schrittBei(schritte, ma) {
  let beste = null, abstand = Infinity;
  schritte.forEach((s, i) => {
    const d = Math.abs(s - ma);
    const halb = Math.max(schritte[i + 1] !== undefined ? (schritte[i + 1] - s) / 2 : 0, i ? (s - schritte[i - 1]) / 2 : 0);
    if (d <= halb && d < abstand) { beste = i; abstand = d; }
  });
  return beste;
}

/** Gilt ein Merkmal {von, bis} (Ma, 'offen') zur Zeit ma? */
export function gilt(/** @type {{von: number|string, bis: number|string}} */ m, /** @type {number} */ ma) {
  return (m.von === 'offen' || ma <= Number(m.von)) && (m.bis === 'offen' || ma >= Number(m.bis));
}
