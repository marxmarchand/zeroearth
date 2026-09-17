# zeroearth.io

A Matrix Framework for Planetary System Analysis — Matrix gesellschaftlicher Naturverhältnisse.

Forschungsinfrastruktur, kein Argument: keine Ebene zeigt prozedurale Ersatzdaten, wenn echte Daten fehlen.

| | |
|---|---|
| `index.html` | die Plattform (v0.9.33) — CesiumJS für die Erde, eigener 2D-Canvas für die NullNatur |
| `data/matrix.json` | das Modell, wie der Globus es liest — erzeugt, nicht von Hand gepflegt |
| `matrix-scharnier/matrix.mjs` | **die Matrix.** Adressen, Beschriftungen (de/en), Formen, Relationen |
| `matrix-scharnier/export.mjs` | Modell → `data/matrix.json` |
| `matrix-scharnier/diagramm.mjs` | Modell → `diagramme/matrix.<de\|en>.svg` und `relationen.<de\|en>.mmd` |
| `matrix-scharnier/verorten.mjs` | verortet offene Daten in der Matrix (TypeSafe) → Marker-Vorschläge |
| `matrix-scharnier/pruefe.mjs` | meldet Abweichungen zwischen Plattform und Modell |
| `ZEIT_RAUM.md` | Referenzspezifikation für Zeit- und Raumkoordinaten (verbindlich ab v0.6) |
| `archiv/` | frühere Fassungen |

Begriffe sind Beobachtung, Adressen sind das Raster (ZEIT_RAUM §8.2): Eine Umbenennung
betrifft `matrix.mjs`, nie die Daten. Sprache (de/en) und Beschriftungssatz
(Paper 1, Paper 2, Gliederung) sind zwei Achsen über derselben Adresse.

Marchand 2026a/b · Zenodo · [zeroearth.io](https://zeroearth.io)
