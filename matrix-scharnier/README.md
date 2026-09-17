# matrix-scharnier

Scharnier zwischen der Matrix gesellschaftlicher Naturverhältnisse (zeroearth.io) und TypeSafe.

- `matrix.mjs`: die Matrix als einzige Struktur. Adressen und TypeSafe-Kriterien werden daraus abgeleitet. Die IDs entsprechen den Plattform-IDs (v09_33), Beschriftungen bleiben in `LABELS` (Bindungsregel).
- `verorten.mjs`: schickt jeden Kandidaten mit neun Fragen in einem Aufruf an TypeSafe:
  - Choice: Schwerpunkt unter 13 Adressen, plus `unverortbar`
  - Noul: je eine Frage pro Marker-Ebene
  - Score: Ablösung vom Verhältnis
- `kandidaten.json`: Eingabe. Zeitfenster sind Daten und werden hier eingetragen, nicht von der KI geschätzt.
- `marker.kandidaten.json`: Ausgabe. Das sind Vorschläge im Format von `data/marker.json`, die vor der Übernahme kuratiert werden.

Schwellen (`SCHWELLEN`): Unter 0,5 bleibt ein Kandidat unverortet, zwischen 0,5 und 0,9 wird er zur Prüfung markiert, ab 0,9 ist er ein Übernahmevorschlag. Aspekte ohne Zeitfenster stehen immer auf „prüfen“.

```sh
npm run trocken                     # Anfrage ansehen, ohne Schlüssel und ohne Kosten
export TYPESAFE_API_KEY=...
npm run verorten                    # kandidaten.json → marker.kandidaten.json
```

Der Schlüssel gehört nie in die HTML-Datei (GitHub Pages ist öffentlich). Deshalb läuft das Scharnier als Offline-Pipeline wie die `*_to_zef.py`-Konverter.

Offen (Entscheidung Max):
- Die Unterebenen der NullNatur sind hier `kosmologisch/interstellar/solar` (IDs aus `LABELS.sets`). `NULL_INFO` verwendet dagegen `universell/solar/erdnahraum`, siehe ZEIT_RAUM §4.
- Die `was`/`nicht`-Texte in `matrix.mjs` sind vorläufig.
- `ware` ist eine Lesekategorie (Wertform) und keine Adresse.
