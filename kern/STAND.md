# Stand: Strukturstand gegen Code

Stand: 2026-10-01 · Branch `struktur` · Strukturstand in Commit `7ec7d38` (Regeln 1–13) · Schema 0.4.0

Bestandsaufnahme, nichts gebaut. Verglichen wurden docs/strukturstand.md, kern/schema.mjs, kern/pruefe.mjs,
index.html und data/matrix.json.

**Der wichtigste Befund vorab:** Schema und Prüfung (`kern/`) und die Oberfläche (`index.html`) sind zwei
getrennte Welten. Die Oberfläche liest ihre Daten direkt aus `data/*.json` und von Live-Diensten. Den geprüften
Graphen aus `kern/` nutzt sie nicht. Was im Kern „umgesetzt“ heißt, wirkt deshalb noch nicht auf die Ansicht.
Die Spalte „Status“ unterscheidet beides, wo es darauf ankommt.

## 1. Strukturstand gegen Code

### Stapel, 1. Natur, 2.3, Vergleichsspezies

| Punkt in strukturstand | Status | Wo im Code |
| --- | --- | --- |
| Drei Stapel, je drei Unterebenen; Übergänge keine Stapel | umgesetzt | `schema.mjs` `STAPEL`, `UEBERGAENGE`; `pruefe.mjs` lehnt Übergang als Stapel ab |
| **1.2 heißt „Biosphäre / Lebensnetz“** | **fehlt** | `schema.mjs:19` heißt noch „Unterbau (Basement)“. `data/matrix.json:68` „Unterbau“, Beschreibung „Mehr-als-menschliche Gesellschaften“. `index.html`: Reiter „Mehr-als-menschliche Gesellschaften“ (Z. 529), Klasse `UnterbauLayer`, Info-Tafel „Unterbau (Erste Natur)“ (Z. 4063, 4070), Unterebenen-Text „Erdsystem · Unterbau · Basis“ (Z. 1893) |
| **1.1 hat die Sphäre „Biomasse“** (Bestand Kohlenstoff in Lebewesen, neben Atmo-, Hydro-, Lithosphäre) | **fehlt** | Das Schema kennt keine Sphären innerhalb von 1.1. `data/matrix.json:82` beschreibt 1.1 als „Atmosphere, biosphere, hydrosphere, lithosphere“: Die Biosphäre steht dort in 1.1, laut Strukturstand gehören ihre Beziehungen aber nach 1.2. Das ist ein Widerspruch, nicht nur eine Lücke |
| Hauptzweige als zusammengeklappter Baum, Biomasse pro Zweig, Artenzahl beschrieben/geschätzt | fehlt | nirgends |
| Gegenbestand anthropogene Masse in 2.1 (Elhacham 2020) | fehlt | nirgends |
| **2.3 als Strecke Signal – Symbol mit vier Kriterien** | **fehlt** | `schema.mjs` führt 2.3 als Unterebene „symbolisches System“, ohne Kriterien. Unklar ist, ob „Übergang“ hier im Sinn von `UEBERGAENGE` gemeint ist oder als Strecke innerhalb von 2.3. Das ist eine Frage an den Strukturstand |
| Zuordnungen pro Spezies kuratiert, Quellen pro Kriterium | fehlt | – |
| **Vergleichsspezies** (Ameisen durch dieselben Matrixzeilen) | **fehlt** | Das Schema kennt keine Spezies-Dimension. Alle Einträge sind stillschweigend menschlich |
| Vokabular als Setzung, Analogien gekennzeichnet | teilweise | `index.html` hat umschaltbare Begriffssätze (`cycleVocab`). Eine Kennzeichnung „analog:“ gibt es nicht |

### Bestände, Herkunft, Geometrie, Relationen

| Punkt in strukturstand | Status | Wo im Code |
| --- | --- | --- |
| **Bestand mit Formen; Erhaltung erhalten / nicht_erhalten / vervielfaeltigbar** | **umgesetzt** (Kern) | `schema.mjs` `ERHALTUNG`, `formwechsel()`; `pruefe.mjs` Bestände (Regel B), vervielfältigbar ohne Bilanz (Regel 5). Commit `c06947e`. Oberfläche: keine Bestände |
| Formwechsel nur innerhalb Stapel oder Übergang | umgesetzt (Kern) | `pruefe.mjs` Bestände, „Formen in … und …“ |
| Spur einer Form (Küstenlinie) | umgesetzt (Kern) | `spur_von` am Eintrag, Pflicht bei `grenze` |
| Daten als Bestand der 2. Natur, `haengt_an` Datenträger, `verweist_auf` Menschen | umgesetzt (Kern) | `Bestand.haengt_an`, `verweist_auf`; Regel 2 für Bestände; Ausgangsart `daten`. Kein Adapter (Surveillance: Lizenz) |
| **Herkunft als Menge mit Archivkette** | **umgesetzt** (Kern), **teilweise** (Oberfläche) | `pruefeWoher`, `pruefeArchivkette`. Die Oberfläche führt Herkunft nur als Text: `obj.quelle` je Marker, `LEGENDE` je Ebene. Keine Menge, keine Kette |
| **Archivart natürlich / gesellschaftlich / zeroearth** | umgesetzt (Kern) | `ARCHIVARTEN`; zeroearth steht am Anfang der Kette (Regel 9) |
| **Geometrie `grenze`**: abgeleitet, Pflichthinweis, Herkunft der Quelle | umgesetzt (Kern) | `pruefe.mjs` Geometrie. Oberfläche: Die Küste kommt aus `CoastLayer` (Raster), nicht über den Kern |
| **Relation mit `bezugszeit` und `beleg`** | **umgesetzt** (Kern) | Pflichtfelder, `BELEG_EINTRAGSEBENE`, fehlende Enden mit Grund. Commit `c06947e` |
| Sechs Vorgänge, Rolle mit `als` und Modus | umgesetzt (Kern) | `VORGAENGE`, `ROLLEN`, `MODI` |
| **Formationsverweis, fehlend nur mit Begründung** | umgesetzt (Kern) | `pruefe.mjs`, Regel 2 („Formation fehlend ohne Begründung“) |
| **Staat als Institution, nicht Formation** | **teilweise** | Festgehalten im Bericht `BERICHT-surveillance.md`. Prüfbar ist es nicht: Eine Formation hat keine Art, nichts verhindert `formation: {id: 'staat-x'}` |
| Verwertungsqualität nur bei warenproduzierender Formation | umgesetzt (Kern) | Regel 2, `warenproduktion` |
| Erwartung mit Träger, Plattform kein Träger | umgesetzt (Kern) | Regel 4, `KEIN_ERWARTUNGSTRAEGER` |
| Subjektachse vorgesehen, leer | umgesetzt (Kern) | Regel 8, `subjektachse.status = 'leer'` |
| Bitemporal: Bezugszeit und Wissensstand, Revision fügt Fassung hinzu | umgesetzt (Kern), fehlt (Oberfläche) | `pruefeFassungen`. Die Oberfläche zeigt weder Wissensstand noch Status noch Abstand |

### Regeln 1–13

| Regel | Status | Wo im Code |
| --- | --- | --- |
| 1 Relationen gespeichert | umgesetzt (Kern) | Regel 1 in `pruefe.mjs` |
| 2 2. Natur ohne `wo` | umgesetzt (Kern), **verletzt** (Oberfläche) | Die Marker-Ebenen der 2. Natur (Überbau, Wertformen …) erscheinen auf Globus und Karte als eigene Punkte, nicht am Träger |
| 3 Gegenwert nur mit Tausch | umgesetzt (Kern) | – |
| 4 Wahrscheinlichkeit mit Träger | umgesetzt (Kern) | – |
| 5 Stoffbilanz, Kapital offen | umgesetzt (Kern) | Sintflut-Bilanz „nicht prüfbar“ (Eisdicke) |
| 6 Herkunft pro Wert | umgesetzt (Kern), teilweise (Oberfläche) | siehe oben |
| 7 Auswahl als Auswahl | umgesetzt (Kern), teilweise (Oberfläche) | Sintflut-Fenster als Auswahl. In der Oberfläche sind die Sintflut-Kästen ausgewiesen, die Marker-Auswahl (`marker.json`, „kuratiert, unvollständig“) nur im Kommentar |
| 8 Fehlendes bleibt fehlend | umgesetzt (Kern), teilweise (Oberfläche) | Viele Ebenen melden „fehlt“ statt Ersatz (Eis, Gewässer). **Ausnahme: `PopulationLayer` erfindet Werte** |
| 9 Plattform weist sich aus | umgesetzt (Kern) | Archivkette beginnt bei zeroearth. Die Oberfläche sagt nirgends, dass sie selbst ein Objekt der 2. Natur ist |
| 10 Verzerrung als Zahl | umgesetzt (Kern), teilweise (Oberfläche) | Die Karte sagt „flächentreu“, nennt aber keine Zahl. Der Globus nennt keine Überhöhung (World Terrain wird geladen, Überhöhung 1 steht nirgends) |
| **11 Reduktion, Spannweite** | **umgesetzt** (Kern) | `reduktion` Pflicht im Manifest; `zusammenfassen` mehrerer Modelle nur mit min/max; `spannweite` im Graphen. Commit `2b08af5`. In der Oberfläche gibt es noch keine Modell-Ebene |
| **12 ableiten statt modellieren** | **fehlt** (Prüfung), **verletzt** (Oberfläche) | `pruefe.mjs` prüft nicht, ob `modell` mit Autor zeroearth Code, Parameter, Startwert, Annahmen und mehrere Läufe mitführt. `PopulationLayer` ist eigene Modellierung ohne Ausweis (siehe 2d). Grenzfälle: Mondposition (gekürzte Näherungsreihe) und Sonnensystem werden im Browser berechnet. Das ist Ableiten aus Ephemeriden-Formeln, sollte aber als „berechnet, Näherung“ ausgewiesen sein, wie es die Mond-Tafel schon tut |
| **13 mehrere Ideale zeigen** | **fehlt** | Kein Feld verknüpft einen `idealisiert`-Wert mit der Setzung des Ideals (offen in `BERICHT-grundwasser.md`, Schemafrage 2). Ohne diesen Verweis lässt sich „mehrere Ideale passen gleich gut“ weder darstellen noch prüfen |

### Ansichten und Bauform

| Punkt in strukturstand | Status | Wo im Code |
| --- | --- | --- |
| **Zusammenstellung durch den Nutzer, Legende „aktuell übereinander“** | **umgesetzt** | `index.html` `zeichneLegende()`, `LEGENDE`; jede Ebene einzeln schaltbar; die Karte zeichnet nur eingeschaltete Ebenen. Commit `e4744bf` |
| „Nichts fest in ein Bild eingebacken“ | teilweise | `OSMLayer` lädt gerenderte OSM-Kacheln (Straßen, Beschriftung, Stil in einem Bild) |
| Ansichten über die Auswahl gekoppelt | teilweise | Globus und Karte: `waehle()`. Das Analysefeld markiert mit. Flussansicht, Netzansicht und Parametertafel gibt es nicht |
| Heliozentrisch nur für 0.3 | umgesetzt | `SolarSystem2D`, `zeigeAnsicht('sonnensystem')` |
| Netzansicht geschichtet, keine Kraftlayouts | teilweise | Das Analysefeld (`#an-svg`) zeigt Relationen aus dem Modell. Stapelbänder, Übergangszonen und sechs Linienarten fehlen |
| Flussansicht, Parametertafel | fehlt | – |
| Ein Punkt ist immer ein Träger | **verletzt** | siehe Regel 2: Marker der 2. Natur sind eigene Punkte |
| Fünf Schichten (Schema, Speicher, Adapter, Zeit, Ansichten) | teilweise | Schema und Adapter in `kern/`. Ein Speicher (bitemporaler Graph) fehlt. Die Ansicht liest am Kern vorbei |
| Betrieb: GitHub Actions schreibt Momentaufnahmen | teilweise | `.github/workflows/gezeiten.yml`, `kandidaten.yml`, `modell.yml` gibt es, nur manuell auslösbar (`gezeiten.yml`: `workflow_dispatch`). Keiner läuft über `kern/` |
| Reihenfolge: 1 Schema ✓, 2 Sintflut ✓ (mit offenen Korrekturen), 3 Echtzeitquelle | 3 offen | – |

## 2. Status früherer Aufträge

| Auftrag | Status | Commit, Befund |
| --- | --- | --- |
| **a) Sintflut-Korrekturen** | **erledigt** (2026-10-01, Commit „Sintflut: Eis aus 1°, Bilanz, zwei Ideale“) | |
| · Grenze nur aus Paläotopografie | erledigt | `abgeleitet_aus` nennt nur noch `paleo_topography` (gerechnet wurde schon so, `paleomist.py:75`) |
| · „Isostasie: ungeprüft“ | erledigt, beantwortet | Hinweis jetzt: „paleo_topography enthält isostatische Deformation (laut Datei); Sedimentation nicht berücksichtigt“ |
| · „relativer Meeresspiegel, Mittel über Fenster“ | erledigt | `transform.mjs:152` „relativer Meeresspiegel, gemittelt über alle Zellen des Kastens“, Commit `79e5185` |
| · Notizen als 2. Natur, Formation fehlend mit Begründung | erledigt | `transform.mjs:191`, Commit `79e5185` |
| · Eisdicke in der PaleoMIST-Rohdatei geprüft | erledigt (1°) | Quelle bekannt, 0,25°-Rohdatei nicht lokal; `ice_thickness` aus den 1°-Dateien (Referenz, a1) über `paleomist_eis.py`, Bilanz Eis → Ozean geprüft als innere Stimmigkeit. Siehe `kern/BERICHT.md` |
| **a′) PaleoMIST-Rohdatei** (2026-10-01) | **erkundet** | Quelle: PANGAEA, doi:10.1594/PANGAEA.905800 (Gowan 2019; Gowan et al. 2021, Nature Communications, doi:10.1038/s41467-021-21469-w). Lizenz **CC BY 4.0**, Zugang frei. Die 0,25°-Rohdatei liegt nicht lokal. Einzelheiten unten |
| **b) Satellitenbild „jüngste verfügbare Aufnahme je Stelle“** | **offen** | Stand `12f2a8f`: eine GIBS-Ebene (VIIRS SNPP True Color) mit einem festen Tag (jetzt − 30 h). Kein Kombinieren mehrerer Tage und Satelliten je Stelle, keine Transparenz für Lücken, kein Klick mit Satellit und Aufnahmezeit. Der Statustext sagt noch „beobachteter Zustand dieses Tages“ |
| **c) Topografie als Schalter** (Höhenfarben, Überhöhung mit Faktor, Bathymetrie) | **offen** | Es gibt keinen Schalter. Cesium World Terrain wird beim Start geladen (`index.html:3905`, braucht Ion-Token), ohne Höhenfarben, ohne sichtbaren Überhöhungsfaktor, ohne Bathymetrie |
| **d) „Bebauung (OSM) · Bevölkerung“** | **berichtet, Entscheidung offen** | Bericht in der Antwort zu `e4744bf`, hier wiederholt: `PopulationLayer` ist ganz prozedural, sechs gesetzte Siedlungskerne mit erfundenen Startjahren als wachsende Glockenkurven. Kein Datensatz, keine Herkunft (Regeln 6, 8, 12). `OSMLayer` zeigt echte Kacheln, aber ohne Zeitbezug, und die OSM-Quellenangabe ist per CSS ausgeblendet (Lizenzbedingung). Vorschlag: Bevölkerung entfernen und durch HYDE 3.2 ersetzen (im Code als `hyde_pop` geplant); Bebauung durch GHSL Built-up (Epochen 1975–2030) ersetzen oder OSM nur als Gegenwartsebene mit sichtbarer Quelle. Die Legende markiert beides bereits |
| **e) Surveillance-Entscheidungen** | **im Kern erledigt, Adapter bewusst offen** | Schema 0.4.0 (`c06947e`): Erfassung als Prozess, Daten als Bestand (vervielfältigbar), Rolle mit `als`, Tausch mit `ware`, Konzern = Anhaften (2. an 2. Natur zulässig), Beleg auf Eintragsebene, fehlende Enden. Bericht `6ed5380`. Kein Adapter, bis die Lizenz geklärt ist |
| **f) Offene Fehler** | | |
| · `data/manifest.json` fehlt | offen | Nie committet, und im Repo gibt es keinen Erzeuger. Ohne sie bleiben alle DataStore-Ebenen leer (Eis, Küste, GFS, Paläotemperatur, Köppen, Wind) |
| · `data/gezeiten.json` fehlt | offen | Der Erzeuger ist `.github/workflows/gezeiten.yml`, nur manuell auslösbar und offenbar nie gelaufen (kein Commit von `zeroearth-bot`). Auf `origin/struktur` steht noch `79e5185` |
| · NullNatur-Reiter überdeckt Fußzeile | offen, Ursache gefunden | Die Kopfzeile `#hdr` steht am unteren Rand, weil `#mini-null` die oberste Rasterzeile (Spalte 2) belegt und `#hdr` (alle Spalten) deshalb in eine neue Zeile rutscht. Die linke Leiste läuft zudem über die Masterzeit hinaus. Beides war schon vor `e4744bf` so (Vergleichs-Screenshot) |
| · Terminator zeigt Nachtseite | offen, Ursache wahrscheinlich | Die Cesium-Uhr wird nie gesetzt (`index.html` hat kein `clock.currentTime`). Die Sonne steht also auf dem Zeitpunkt des Seitenaufrufs fest, nicht auf der Masterzeit, obwohl der Kommentar zu `_applyLicht` „Sonnenstand aus der Masterzeit-Uhr“ sagt |

### PaleoMIST-Rohdatei (zu 2a)

**Angebot.** PANGAEA bietet eine einzige Datei an: `Gowan_ice_reconstruction.zip`, 3 706 MB, mit 2 359
Einträgen und 4 391 MB entpackt. Einen OPeNDAP- oder Teilzugang nennt die Seite nicht. Der Server erlaubt aber
HTTP-Range. Damit ließ sich das Inhaltsverzeichnis lesen und ein einzelnes Mitglied holen, ohne das ganze ZIP
herunterzuladen.

| Datei im ZIP | entpackt | gepackt |
| --- | --- | --- |
| `global_grid/reconstruction_0.25_degree.nc` (bisherige Sintflut-Quelle) | 554 MB | 342 MB |
| `global_grid/reconstruction_a1_0.25_degree.nc` (alternative Eisgeschichte) | 554 MB | 343 MB |
| `global_grid/reconstruction_1_degree.nc` | 34,5 MB | 23,1 MB |
| `global_grid/reconstruction_a1_1_degree.nc` | 34,5 MB | 23,1 MB |
| dazu: regionale Eisdicken je Eisschild (`ice_reconstruction_files/…/thickness/*.nc`), Deformation, Stokes-Koeffizienten, Plots | | |

**Geholt (unter 50 MB):** nur die beiden 1°-Dateien, je 23 MB Transfer, abgelegt im Scratchpad der Sitzung,
nicht im Repo. Die 0,25°-Dateien sind nicht geholt.

**Variablen** (beide 1°-Dateien gleich; NetCDF-4, CF-1.7, 33 Zeitschritte von −80 000 bis 0, 361 × 181):

| Variable | Bedeutung laut Datei | Einheit |
| --- | --- | --- |
| `paleo_topography` | topography accounting for ice thickness, sea level change and deformation | m |
| `sea_level` | calculated sea level excluding topography | m |
| `base_topography` | deformed base topography excluding ice sheets | m |
| **`ice_thickness`** | **grounded ice thickness** | m |

**Befunde:**

1. **Die Eisdicke ist da.** `paleomist.py` liest sie nur nicht. Damit wird die Bilanz Eis → Ozean (Regel 5),
   bisher „nicht prüfbar, bis die Eisdicke geklärt ist“, prüfbar.
   - Grobe Probe auf der 1°-Datei: Das aufliegende Eis entspricht heute etwa 72 m Meeresspiegel und beim
     Maximum (20 ka) etwa 189 m, die Differenz also rund 117 m. Das ist plausibel; gerechnet ohne
     Auftriebskorrektur.
2. **Das Bezugsjahr ist geklärt.** Die Zeitachse heißt „years since 1950“. Im Sintflut-Manifest ist
   `bezugsjahr` jetzt eingetragen: 1950 CE.
3. **Die Isostasie ist enthalten** (siehe 2a). Der Hinweis „ohne Isostasie“ ist falsch.

**Zwei Ideale nach Regel 13: Referenz und a1.** Beide Läufe teilen Gitter und Variablen. Verglichen auf 1°:

| ka BP | Eis Referenz (m SLE) | Eis a1 (m SLE) | Differenz |
| --- | --- | --- | --- |
| 80 – 60 | 82 – 151 | gleich | ≤ 0,1 |
| 55 | 129,3 | 130,4 | +1,1 |
| 50 | 109,6 | 112,7 | +3,1 |
| 45 | 111,0 | 119,9 | +8,9 |
| 40 | 101,7 | 111,8 | +10,1 |
| 35 – 0 | | | ≤ 0,4 |

- Die beiden Eisgeschichten unterscheiden sich **nur im MIS 3** (etwa 55–40 ka), um bis zu etwa 10 m
  Meeresspiegeläquivalent. Ab 35 ka sind sie praktisch gleich.
- In allen sechs Sintflut-Fenstern ist die Landfläche bei 22,5 und 10 ka in beiden Läufen identisch (auf 1°). *Nachtrag 2026-10-01:* über die ganze Reihe nicht: echt verschieden 52,5–37,5 ka (MIS 3), sonst bis auf Zellkippen gleich (`kern/BERICHT.md`).
- Für die Sintflut zeigt Regel 13 also zwei Ideale, die hier zusammenfallen. Das ist selbst eine Aussage: Die
  Fenster unterscheiden die beiden Geschichten nicht.
- Sichtbar würde die Uneinigkeit erst vor 35 ka. Zeigt die Ansicht beide, muss die Differenz dort als
  Spannweite erscheinen (Regel 11). Dafür braucht das Schema den Verweis `woher.ideal` (Regel 13, siehe 1).

**Vorschlag zum Holen der 0,25°-Eisdicke:**

- **Für die Bilanz reicht 1°.** Die Bilanz Eis gegen Meeresspiegel ist eine globale Summe, und die 1°-Dateien
  (je 23 MB, CC BY 4.0) liefern sie für beide Ideale. Empfehlung: Ein erweitertes `paleomist.py` liest
  `ice_thickness` aus den 1°-Dateien. Das läuft lokal, unter der Grenze.
- **Nur die Variable Eisdicke aus der 0,25°-Datei zu holen geht nicht.** Das Mitglied ist im ZIP als Ganzes
  komprimiert (deflate), und darin steckt eine HDF5-Datei. Ein Ausschnitt lässt sich erst lesen, wenn die
  ganzen 342 MB übertragen und entpackt sind. Einen OPeNDAP-Dienst für dieses Archiv bietet PANGAEA nicht an.
- **Falls 0,25° nötig ist** (Eisdicke je Sintflut-Fenster in voller Auflösung): als GitHub-Actions-Lauf wie
  `gezeiten.yml`. Er holt per HTTP-Range nur die beiden Mitglieder (je etwa 342 MB), rechnet die Summen je
  Fenster und committet nur das abgeleitete JSON. Die Rohdatei bleibt außerhalb des Repos (`.gitignore`
  `*.nc`). Lokal nur nach Freigabe, wegen der Größe.

## 3. Quellen-Kandidaten

Nichts heruntergeladen. „Geprüft“ heißt: in dieser Sitzung über die Quelle selbst nachgesehen.
„Zu prüfen“ heißt: aus dem Gedächtnis oder aus dem Strukturstand, nicht nachgesehen.

| Quelle | Wofür | Status | Lizenz | Nächster Schritt |
| --- | --- | --- | --- | --- |
| PaleoMIST 1.0 (PANGAEA 905800), Referenz und a1 | Eis, Meeresspiegel, Paläotopografie; zwei Ideale (Regel 13) | erkundet, 1°-Dateien lokal geprüft (Scratchpad) | geprüft: CC BY 4.0 | `ice_thickness` in `paleomist.py` aufnehmen, für Referenz und a1 |
| ISIMIP Wassersektor (`groundwstor`, `qr`, `ptotwwgw`) | Idealschicht Grundwasser | erkundet, `BERICHT-grundwasser.md` | geprüft: pro Modell CC0, CC BY 4.0 oder CC BY-NC 4.0 | Download etwa 1,2 GB (ISIMIP3a) braucht Freigabe. `wtd` des Grundwassersektors ist noch nicht veröffentlicht |
| GROW (Zenodo 15149480) | Beobachtung Grundwasser (Brunnen) | erkundet, Spalten gelesen | geprüft: CC BY-NC-SA 4.0, dazu Lizenz pro Brunnen | Attributtabelle (etwa 15 MB) per HTTP-Range. Entscheidung zur Repo-Lizenz nötig (SA) |
| Surveillance Watch API | Erfassung, Daten als Bestand | erkundet, lokal ausgewertet | **ungeklärt** (keine Angabe gefunden) | Anfrage bei DAIR; bis dahin nur lokal, kein Adapter |
| Gislason 2020, Fischfänge (Dryad/Zenodo) | Stoffwechsel Meer, Entnahme | nicht gesichtet | zu prüfen (Dryad ist meist CC0) | DOI und Datensatz bestimmen |
| Madingley (Ergebnisse auf Zenodo) | Fressen, Stofffluss (Idealschicht, Lebensnetz) | nicht gesichtet | zu prüfen | Vorhandene Läufe auf Zenodo suchen. **Selbst rechnen (MadingleyR per GitHub Actions) wäre nach Regel 12 eigene Modellierung:** nur als Ausnahme mit Autor zeroearth, Code, Parametern und Startwert im Repo, Annahmen im Manifest und mehreren Läufen mit Spannweite. R 4.6.1 ist lokal installiert |
| Open Tree of Life | Abstammung, Hauptzweige (Netzansicht) | nicht gesichtet | laut Strukturstand CC0, zu prüfen | Synthesebaum über die API zusammengeklappt auf Hauptzweige; Stützung und Widerspruch je Knoten |
| GBIF | Funde (Beobachtung, Punkte) | im Code angebunden (`UnterbauLayer`), Datei `data/unterbau.json` fehlt lokal | pro Datensatz CC0, CC BY oder CC BY-NC, zu prüfen | Lizenz pro Datensatz ins Manifest; Beobachtungsverzerrung ausweisen |
| Bar-On et al. 2018 (PNAS) | Biomasse pro Zweig mit Spannweite (1.1) | nicht gesichtet | zu prüfen (Daten und Code vermutlich auf GitHub) | Tabelle pro Zweig: Mittel und Unsicherheitsfaktor als Spannweite (Regel 11) |
| Elhacham et al. 2020 (Nature) | anthropogene Masse, Gegenbestand in 2.1 | nicht gesichtet | zu prüfen | Zeitreihe 1900–2020 mit Unsicherheit |
| antmaps.org / AntWeb | Vergleichsspezies Ameise (Verbreitung, Funde) | nicht gesichtet | zu prüfen; Nutzungsbedingungen beider Seiten unklar | Lizenz vor jedem Abruf klären |

## 4. Vorschlag: die nächsten drei Schritte

1. **Den Kern auf den Strukturstand nachziehen und den Sintflut-Prüfstein abschließen.** Das Schema ist laut
   Bauform die einzige Schicht, die die Theorie kennt. Solange dort 1.2 „Unterbau“ heißt und Regel 12 und 13
   nicht geprüft werden, misst jede weitere Arbeit an einem veralteten Maßstab. Konkret:
   - 1.2 „Biosphäre / Lebensnetz“ und die Sphäre Biomasse in 1.1.
   - Regel 12: `modell` mit Autor zeroearth nur mit Code, Parametern, Startwert, Annahmen und mehreren Läufen.
   - Regel 13: `woher.ideal` als Verweis auf eine Auswahl; konkurrierende Ideale sichtbar.
   - Die zwei offenen Sintflut-Korrekturen: Grenze nur aus Paläotopografie, „Isostasie: ungeprüft“.

   Das ist klein, rein im Kern, und mit Tests absicherbar.
2. **Die erste Echtzeitquelle über den Kern, und damit die erste Brücke vom Kern zur Oberfläche.** Das ist
   Schritt 3 der Reihenfolge im Strukturstand. Kandidat ist USGS Seismik: Sie läuft schon in der Oberfläche,
   ist frei, klein, und USGS revidiert Beben nachträglich (Magnitude, Ort, Status „reviewed“). Damit wird
   der bitemporale Wissensstand an echten Revisionen geprüft. Die Oberfläche zeigt diese Ebene dann aus dem
   geprüften Graphen, mit Herkunft und Wissensstand. Das schließt die größte Lücke der Bestandsaufnahme: Bisher
   wirkt keine Regel auf die Ansicht.
3. **Lebensnetz und Biomasse mit kleinen, freien Tabellen.** Open Tree of Life (zusammengeklappter Baum) und
   Bar-On 2018 (Biomasse pro Zweig mit Spannweite) sind wenige Kilobyte und prüfen Regel 11 an einer
   Rekonstruktion. Sie geben der Netzansicht ihren ersten echten Inhalt und bereiten Vergleichsspezies
   (Ameise) und Elhacham 2020 vor. Vorher sollte aber Schritt 1 die Begriffe 1.1 und 1.2 klären.

Nicht in diesen drei Schritten, aber dringend, weil sie Regeln verletzen: `PopulationLayer` entfernen
(Regeln 8 und 12) und die OSM-Quellenangabe sichtbar machen. Beides braucht deine Entscheidung aus 2d.
Ebenso offen sind die Oberflächen-Fehler aus 2f (Terminator, Kopfzeile) und die fehlende `data/manifest.json`.
