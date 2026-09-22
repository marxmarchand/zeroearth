# SCHNITTSTELLE

Wie zeroearth.io von Menschen **und** von Maschinen gelesen wird — mit denselben
Dateien, nicht mit zwei getrennten Wegen. Wer einsteigen will, liest drei Dateien
und braucht die 4000 Zeilen `index.html` nicht anzufassen.

| Datei | Inhalt |
|---|---|
| `data/matrix.json` | welche Adressen es gibt: Dimensionen, Schichten, Beschriftungen (de/en), Formen, Relationen |
| `data/katalog.json` | was vorhanden ist: je Datensatz Adresse, Zeitraum, Ausdehnung, Quelle, Lizenz, Datei |
| `SCHNITTSTELLE.md` | diese Beschreibung |

## Der Satz

Jede Angabe hat dieselbe Form, gleich ob Eisdicke, Eigentumsverhältnis oder
Denkmalstatus. Vier Achsen, ein Koordinatensystem:

```json
{
  "raum":  { "system": "WGS84", "lat": 51.48, "lon": 7.22 },
  "zeit":  { "t0": -150, "t1": 18, "achse": "J2000" },
  "wo":    "gesellschaftlicher_stoffwechsel/mat_pm",
  "was":   { "merkmal": "produkt", "wert": "Steinkohle" },
  "woher": { "quelle": "wikidata:Q4115712", "merkmal_id": "P1056", "lizenz": "CC0" }
}
```

- **raum** — Koordinate, nicht Zelle. Zellen werden berechnet (`matrix-scharnier/zellen.mjs`,
  ZEIT_RAUM §2.4). `system` ist `WGS84` (Erde) oder `HEJ2000` (NullNatur).
- **zeit** — kanonische Achse: Jahre seit J2000, Intervall `[t0, t1]`, `t1: null` heißt offen.
  Anzeigeformen (a BP, Ma, CE) sind Konversionen, siehe ZEIT_RAUM §1.
- **wo** — Adresse im Modell, `dimension/schicht`. Gültige Werte stehen in `matrix.json`.
- **was** — der Sachverhalt.
- **woher** — Herkunft. Pflicht. Ohne Herkunft kein Satz. Dazu gehört `art`:
  `beobachtung`, `rekonstruktion`, `modell` oder `kuratiert`. Ein Modellwert nennt
  zusätzlich Modell, Version, Szenario und Lauf:

  ```json
  "woher": { "art": "modell", "modell": "MAgPIE", "version": "4.x",
             "szenario": "SSP2", "lauf": "…", "lizenz": "AGPL-3.0" }
  ```

  Ein Messwert und eine Projektion dürfen nie gleich aussehen — weder im Satz noch in
  der Darstellung. Welche Quellen es gibt und welcher Art sie sind, steht in
  [QUELLEN.md](QUELLEN.md).

Dieselbe Koordinate trägt mehrere Sätze an verschiedenen Adressen — das ist der
**Matrixschnitt** und der Normalfall, keine Ausnahme: der Bodenrichtwert liegt an
derselben Stelle wie die Ertragsmesszahl, aber in einer anderen Dimension.

## Was kein Satz ist

Rasterdaten (GEBCO, GFS, PaleoMIST) sind Funktionen auf einem Gitter, keine Sammlung
von Sätzen. Sie stehen im Katalog und behalten ihr Format. Aufgelöst werden beide über
dieselbe Koordinate.

## Bezeichner

Kurzformen in `woher.quelle` sind aufzulösen:

```
wikidata:Q4115712   → https://www.wikidata.org/entity/Q4115712
osm:way/12345       → https://www.openstreetmap.org/way/12345
gleif:LEI           → https://api.gleif.org/api/v1/lei-records/LEI
gbif:1234567        → https://www.gbif.org/occurrence/1234567
```

## Grundsatz

Keine Ebene zeigt prozedurale Ersatzdaten, wenn echte Daten fehlen (ZEIT_RAUM §0).
Für diese Schnittstelle heißt das: Eine fehlende Angabe fehlt sichtbar. Es gibt kein
Füllen, kein Schätzen und keine Dichte ohne ausgewiesene Bezugsfläche.
