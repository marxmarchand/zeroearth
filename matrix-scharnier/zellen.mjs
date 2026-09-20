// @ts-check
/* ════════════════════════════════════════════════════════════════════
   ZELLEN — das Raster als Beschreibung, nicht als Speicher.
   Kanonisch ist die Koordinate (lat/lon, t). Eine Zelle wird daraus
   berechnet, sie wird nicht gespeichert: dieselbe Funktion läuft in der
   Plattform und in der Auswertung, deshalb sehen Mensch und Maschine
   dieselben Zellen. Die gezeichneten Rasterlinien sind die Grenzen der
   Stufe, die zur Beobachtungshöhe gehört — was du siehst, ist das, was
   gerechnet wird.
   Gradnetz: die Zellen sind NICHT flächengleich. Deshalb trägt jede
   Zelle ihre Fläche, und jede Dichte nennt sie (siehe `proFlaeche`).
   ════════════════════════════════════════════════════════════════════ */

const R = 6371.0088;                       // mittlerer Erdradius in km
const rad = g => g * Math.PI / 180;

/** Stufenleiter: jede Stufe halbiert die vorige, gebunden an die
    Beobachtungshöhen der Plattform (SCALE_ORDER). */
export const STUFEN = /** @type {const} */ ([
  { stufe: 0, grad: 8,        skala: 'erdmond'   },
  { stufe: 1, grad: 4,        skala: 'planet'    },
  { stufe: 2, grad: 2,        skala: 'kontinent' },
  { stufe: 3, grad: 1,        skala: null        },
  { stufe: 4, grad: 0.5,      skala: 'region'    },
  { stufe: 5, grad: 0.25,     skala: null        },   // ZEIT_RAUM §2.2
  { stufe: 6, grad: 0.125,    skala: null        },
  { stufe: 7, grad: 0.0625,   skala: 'stadt'     },
  { stufe: 8, grad: 0.03125,  skala: null        },
  { stufe: 9, grad: 0.015625, skala: null        },
  { stufe: 10, grad: 0.0078125, skala: null      },
  { stufe: 11, grad: 0.00390625, skala: 'strasse' },
]);

export const grad = stufe => STUFEN[stufe].grad;

/** Beobachtungshöhe → Stufe. Ohne Zuordnung (NullNatur-Skalen): null. */
export function stufeZuSkala(skala) {
  return STUFEN.find(s => s.skala === skala)?.stufe ?? null;
}

/** Koordinate → Zell-ID. Zeile zählt von -90° (Süd), Spalte von -180°. */
export function zelle(lat, lon, stufe) {
  const g = grad(stufe);
  const z = Math.floor((Math.min(89.999999, Math.max(-90, lat)) + 90) / g);
  const s = Math.floor(((((lon + 180) % 360) + 360) % 360) / g);
  return `g${stufe}:${z}/${s}`;
}

/** Zell-ID → Grenzen und Mitte. */
export function grenzen(id) {
  const [kopf, rest] = id.split(':');
  const stufe = Number(kopf.slice(1));
  const [z, s] = rest.split('/').map(Number);
  const g = grad(stufe);
  const lat0 = -90 + z * g, lon0 = -180 + s * g;
  return { stufe, lat0, lat1: lat0 + g, lon0, lon1: lon0 + g,
           lat: lat0 + g / 2, lon: lon0 + g / 2 };
}

/** Fläche einer Zelle in km² — exakt auf der Kugel. */
export function flaeche(id) {
  const b = grenzen(id);
  return R * R * rad(b.lon1 - b.lon0) * (Math.sin(rad(b.lat1)) - Math.sin(rad(b.lat0)));
}

/** Elternzelle: die Schachtelung ist exakt, jede Zelle hat genau eine. */
export function eltern(id) {
  const b = grenzen(id);
  return b.stufe === 0 ? null : zelle(b.lat, b.lon, b.stufe - 1);
}

/** Kinderzellen (vier je Stufe). */
export function kinder(id) {
  const b = grenzen(id);
  if (b.stufe >= STUFEN.length - 1) return [];
  const g = grad(b.stufe + 1), v = g / 2;
  return [[b.lat0 + v, b.lon0 + v], [b.lat0 + v, b.lon0 + g + v],
          [b.lat0 + g + v, b.lon0 + v], [b.lat0 + g + v, b.lon0 + g + v]]
    .map(([la, lo]) => zelle(la, lo, b.stufe + 1));
}

/** Dichte mit ausgewiesener Bezugsfläche — nie eine nackte Zahl. */
export function proFlaeche(menge, id) {
  const a = flaeche(id);
  return { wert: menge / a, einheit: 'je km²', bezugsflaeche_km2: a, zelle: id };
}

/** Sätze auf eine Stufe verdichten. Leere Zellen bleiben leer. */
export function verdichten(saetze, stufe) {
  const aus = new Map();
  for (const satz of saetze) {
    const id = zelle(satz.raum.lat, satz.raum.lon, stufe);
    const e = aus.get(id) ?? { zelle: id, anzahl: 0, saetze: [] };
    e.anzahl++; e.saetze.push(satz);
    aus.set(id, e);
  }
  return [...aus.values()];
}
