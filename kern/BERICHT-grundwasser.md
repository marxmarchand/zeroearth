# Bericht: Grundwasser, Erkundung ISIMIP und GROW

Stand: 2026-09-30 · Branch `struktur` · Schema 0.3.0 (Regel 11, Merkmal `idealisiert`)

Erkundung, noch kein Adapter. Heruntergeladen wurde nur, was kleiner als 50 MB ist: die
Katalogdaten beider Quellen (API), das Readme von GROW (0,6 MB) und von GROW per HTTP-Range das
Zentralverzeichnis des ZIP sowie die ersten Kilobyte der beiden CSV-Dateien (für die Spalten).
Kein ISIMIP-Feld und keine GROW-Zeitreihe liegen lokal vor.

## Kurzfassung

- **ISIMIP hat noch keine Grundwassertiefe.** Die Variable `wtd` (m, 5′) ist im Protokoll des
  neuen Grundwassersektors definiert, im Repository aber nicht veröffentlicht (0 Treffer). Was es gibt,
  kommt aus dem Wassersektor (`water_global`): Grundwasserspeicher `groundwstor` (kg m⁻² = mm),
  Neubildung `qr` und Entnahme aus Grundwasser `ptotwwgw`/`ptotusegw`, alle auf 0,5° und monatlich.
- **GROW ist Beobachtung, liegt aber in einem 3,6-GB-ZIP.** Für einen ersten Stand reicht die Attributtabelle
  (17,8 MB Parquet, 14,6 MB gepackt, per HTTP-Range einzeln aus dem ZIP holbar). Sie enthält pro
  Brunnen Lage, Mittelwert, Trend und Zeitraum. Die Zeitreihen (1,4 GB Parquet) sind erst nötig, wenn
  eine Differenz über die Zeit gebildet werden soll.
- **Die Differenz ist heute nur eingeschränkt möglich.** Das Modell liefert einen Speicher in mm, die
  Brunnen liefern eine Tiefe in m. Umrechnen ließe sich das nur über die speichernutzbare Porosität
  (specific yield), und die liefert keine der beiden Quellen. Ohne Umrechnung sind nur Richtung
  und Vorzeichen des Trends vergleichbar. Eine Differenz in Metern gibt es erst, wenn ISIMIP `wtd`
  veröffentlicht.
- **Größe:** Auf 2° mit Spannweite (Mittel, min, max) über das Landgitter braucht ein Zeitschnitt rund
  75 kB. Unter 5 MB passen damit etwa 60 Zeitschnitte, bei 0,5° nur etwa 4.

## a) ISIMIP-Grundwasser (data.isimip.org)

Abgefragt über `https://data.isimip.org/api/v1/datasets/?variable=…` (Stand heute).

### Variablen

| Variable | Bedeutung (Protokoll) | Einheit | Sektor | Auflösung |
| --- | --- | --- | --- | --- |
| `groundwstor` | Grundwasserspeicher, Monatsmittel | kg m⁻² (= mm) | water_global | 0,5°, monatlich |
| `qr` | Grundwasserneubildung gesamt | kg m⁻² s⁻¹ | water_global | 0,5°, monatlich |
| `ptotwwgw` | *potenzielle* Entnahme aus Grundwasser, alle Sektoren | kg m⁻² s⁻¹ | water_global | 0,5°, monatlich |
| `ptotusegw` | potenzielle Nutzung aus Grundwasser | kg m⁻² s⁻¹ | water_global | 0,5°, monatlich |
| `tws` | gesamter terrestrischer Wasserspeicher (Vergleich mit GRACE) | kg m⁻² | water_global | 0,5°, monatlich |
| `wtd` | Grundwassertiefe unter Gelände | m | groundwater | 5′, monatlich; **nicht veröffentlicht** |
| `head`, `abs`, `depl`, `sgd`, … | Druckhöhe, Entnahme, Zehrung, submariner Abfluss | m bzw. m³ m⁻² Monat⁻¹ | groundwater | 5′; **nicht veröffentlicht** |

Zu `ptotwwgw`: Das Protokoll nennt die Entnahme „potential“. Gemeint ist der Bedarf im Modell,
keine gemessene Entnahme.

### Modelle, Szenarien, Zeiträume (ISIMIP3)

| Variable | ISIMIP3a (obsclim, counterclim) | ISIMIP3b (historical, ssp126/370/585, picontrol) |
| --- | --- | --- |
| `groundwstor` | CWatM, H08, HydroPy, WaterGAP2-2e | CWatM, H08, WaterGAP2-2e |
| `qr` | CWatM, H08, LPJmL5-7-10-fire, MIROC-INTEG-LAND, WaterGAP2-2e | CWatM, H08 (Liste unvollständig, siehe unten) |
| `ptotwwgw` | CWatM, WaterGAP2-2e | CWatM, WaterGAP2-2e |

- **ISIMIP3a:** Antrieb aus Beobachtung (GSWP3-W5E5, 20CRv3-ERA5, 20CRv3-W5E5), 1901–2021, dazu
  `counterclim` (Klima ohne Erwärmungstrend) als Gegenstück. Sozioökonomik `histsoc` oder `1901soc`.
- **ISIMIP3b:** fünf GCM-Antriebe (GFDL-ESM4, IPSL-CM6A-LR, MPI-ESM1-2-HR, MRI-ESM2-0, UKESM1-0-LL);
  `historical` 1850–2014, SSP 2015–2100, `picontrol` ab 1601; Sozioökonomik `histsoc`, `2015soc`,
  `1850soc`, dazu SSP-Varianten `…soc-adapt/-noadapt`.
- ISIMIP2a/2b führen dieselben Variablen mit älteren Modellen (u. a. PCR-GLOBWB, MATSIRO, WaterGAP2-2c).
- **Vorbehalt zur Zählung:** Für `qr` und `tws` liefert die API höchstens 1001 Treffer. Die Listen
  für diese beiden Variablen können deshalb unvollständig sein. `groundwstor` (433) und `ptotwwgw`
  (142) sind vollständig.

**Grundwassersektor.** Der neue Sektor (Reinecke et al., GMD 19, 523, 2026) umfasst acht Modelle:
G³M, CLM, CWatM, WBM, VIC-wur, V2KARST, GGR und ParFlow. Das Protokoll sieht 23 Variablen auf 5′ vor.
Veröffentlicht ist bisher nur ein Demo-Ensemble auf Zenodo
([10.5281/zenodo.14962512](https://zenodo.org/records/14962512), CC BY 4.0). Es enthält zwei GeoTIFFs
zu je 37 MB: die statische Grundwassertiefe und die Änderung der Neubildung. Laut Beschreibung ist es
„not yet a real ISIMIP ensemble“. **Das Demo führt nur den Ensemble-Mittelwert, keine Spannweite.
Nach Regel 11 ist es deshalb als zusammengefasster Wert nicht verwendbar.**

### Dateigröße und Ausschnitt

- Eine Datei ist ein globales Feld, monatlich über den ganzen Zeitraum:
  - `groundwstor`: 218–754 MB, Median 285 MB
  - `ptotwwgw`: 209–630 MB
  - Beispiel: `cwatm_20crv3-era5_obsclim_histsoc_default_groundwstor_global_monthly_1901_2021.nc` hat 287 MB.
- **Files API** (`https://files.isimip.org/api/v2`, antwortet mit `status: ok`). Sie schneidet auf
  dem Server zu, bevor etwas heruntergeladen wird. Operationen: `cutout_bbox`, `cutout_point`,
  `select_bbox`, `select_point`, `mask_bbox`, `mask_country`, `mask_landonly`, `mask_mask`, `create_mask`.
  - `cutout_*` liefert NetCDF-Ausschnitte.
  - `select_*` liefert Zeitreihen als CSV, bei `select_bbox` als Flächenmittel.
  - Umgitterung (etwa auf 2°) bietet die API nicht.
- **Client:** `pip install isimip-client` (MIT), etwa
  `ISIMIPClient().cutout_bbox(paths, west, east, south, north, poll=…)`, danach `client.download(...)`.
- **Folge:** Regionale Ausschnitte (Sintflut-Kästen, Brunnenregionen) und Punktreihen an Brunnenzellen
  kommen ohne ganze Dateien aus. Für eine globale 2°-Ebene muss die ganze Datei geladen und lokal
  vergröbert werden. Das sind je Datei 200–750 MB, deshalb vorher fragen. Beispiele:
  - ISIMIP3a, `groundwstor`, 4 Modelle × 1 Antrieb, `obsclim`/`histsoc`: etwa 1,2 GB
  - ISIMIP3b, 3 Modelle × 5 GCM × (historical + 3 SSP): etwa 60 Dateien, grob 15 GB

### Lizenz

Die Lizenz gilt **pro Modell**, nicht pro Repository:

| Lizenz | Modelle |
| --- | --- |
| CC0 1.0 | CWatM (überwiegend), H08 (bei `groundwstor`), HydroPy |
| CC BY 4.0 | WaterGAP2-2e, H08 (teilweise bei `qr`), LPJmL, PCR-GLOBWB, CLM4.5 |
| CC BY-NC 4.0 | WaterGAP2-2c, MATSIRO (nur ISIMIP2) |

- Dazu kommen die ISIMIP Terms of Use: DOI zitieren, Koautorschaft anbieten.
- Das Manifest muss die Lizenz deshalb pro Modell führen, nicht einmal für die Quelle.

## b) GROW (Zenodo 10.5281/zenodo.15149480)

GROW: A Global-Scale Time Series Dataset for Groundwater Studies within the Earth System,
Bäthge et al., Version 1.0, veröffentlicht 2026-01-18.

### Dateien

| Datei | Größe |
| --- | --- |
| `data.zip` | **3 587 MB** |
| `Readme.pdf` | 0,6 MB |
| `python_scripts.zip` | 0,1 MB |
| `logo.zip` | 0,2 MB |

Inhalt von `data.zip`, gelesen aus dem Zentralverzeichnis:

| Datei | entpackt | gepackt |
| --- | --- | --- |
| `grow_attributes.csv` | 114 MB | 15 MB |
| `grow_attributes.json` (GeoJSON mit Brunnenlagen) | 416 MB | 23 MB |
| `grow_attributes.parquet` | 18 MB | 15 MB |
| `grow_timeseries.csv` | 9 368 MB | 2 093 MB |
| `grow_timeseries.parquet` | 1 734 MB | 1 442 MB |

- Die Mitglieder sind komprimiert (deflate). Ein Mitglied lässt sich einzeln per HTTP-Range holen,
  aber nicht wahlfrei darin lesen.
- Die Attributtabelle kostet also etwa 15 MB Transfer.
- Die Zeitreihen kosten mindestens 1,4 GB. Nicht geladen, vorher fragen.

### Umfang

- Mehr als 200 000 Zeitreihen aus 55 Ländern, zu 91 % aus Nordamerika, Indien, Europa und Australien.
- Zeitliche Auflösung täglich, monatlich oder jährlich, alles in einer Tabelle.
- Mengen stehen einheitlich in mm/Jahr.

### Spalten der Attributtabelle (je Brunnen)

- **Kennung:** `GROW_ID`, `original_ID_groundwater`, `name`, `feature_type`, `purpose`, `status`, `description`
- **Lage und Brunnen:** `latitude`, `longitude`, `provider_ground_elevation_m_asl`, `top_of_well_elevation_m_asl`,
  `total_drilling_depth_m`, `country`, `address`, `aquifer_name`, `confinement`
- **Träger der Messung, also 2. Natur:** `organisation`, `manager`, **`license` pro Brunnen**
- **Zeitreihe:** `interval`, `aggregated_from_n_values_median`, `starting_date`, `ending_date`, `length_years`
- **Qualitätsflags:** `autocorrelation`, `gap_fraction`, `negative_signs_wtd`, `outliers_change_points`, `plateaus`
- **Kennwerte:** `trend_direction`, `trend_slope_m_year-1`, **`reference_point`** (Tiefe unter Gelände
  oder Wasserstand ü. NN), `groundwater_mean_m`, `groundwater_median_m`
- **Umgebung aus Fremdprodukten:** Köppen-Geiger, Hydrobelt, MERIT-Höhe, Hangneigung, Gestein, Aquifertyp,
  Permeabilität, Porosität, Boden, Leitfähigkeit, Gewässerabstand, Drainagedichte, Gletscher, Permafrost,
  Schnee, grundwasserabhängige Ökosysteme, Landnutzung, `groundwaterscapes_ID_class`

### Spalten der Zeitreihentabelle

- `GROW_ID`, `interval`, `date`, `year`, `month`, `aggregated_from_n_values`, `outliers_change_points`, `plateaus`
- **Gemessen:** `groundwater_depth_from_ground_elevation_m`, `…_from_well_top_elevation_m`,
  `groundwater_water_level_elevation_m_asl`
- **Aufgefüllt:** `groundwater_filled_*` (drei Spalten). Nach Regel 8 („nichts wird aufgefüllt“) dürfen
  sie nicht übernommen werden, nur die ungefüllten Spalten.
- **Kontext aus Fremdprodukten:** Niederschlag (MSWEP, GPCC), potenzielle Verdunstung (ERA5, GLEAM),
  tatsächliche Verdunstung, Interzeption, Lufttemperatur, Schnee, NDVI, LAI, **Entnahme industriell und
  häuslich (m³/Jahr)**, Anteile von Stadt, Weide, Acker (Regenfeldbau, bewässert) und Wald

### Lizenz

- Das Paket steht unter **CC BY-NC-SA 4.0**. Die Zenodo-Metadaten führen kein Lizenzfeld, die
  Angabe steht im Beschreibungstext.
- Zusätzlich hat jeder Brunnen eine eigene `license`-Spalte. In der Probe steht etwa CC BY 4.0 für
  Daten aus Jasechko et al. 2024.
- Folgen für eine abgeleitete Ebene im Repo:
  - SA: Die Ebene muss selbst unter CC BY-NC-SA stehen.
  - NC: Keine kommerzielle Nutzung.
  - Das Repo hat bisher keine Lizenzdatei. Das ist eine Entscheidung für Max, bevor GROW-Ableitungen
    ins Repo kommen.

## c) Vorschlag: Bestand „Wasser“, Form „Grundwasser“

### Anlage

| Objekt | Stapel | Geometrie | Herkunft | Inhalt |
| --- | --- | --- | --- | --- |
| Bestand `wasser` | – | – | – | erhalten: ja; bekommt die Form `grundwasser` neben Eis und Ozean |
| `grundwasser/ideal` | 1.1 | `feld` (2°) | `modell`, `idealisiert`; `woher.modelle` = Liste Modell/Antrieb; `spannweite` | `groundwstor` als Anomalie in mm, `qr` in mm/Jahr |
| `grundwasser/brunnen` | 1.1 | `feld` (2°, aus Punkten vergröbert) oder `punkt` (Verweis) | `beobachtung` | Median der Tiefe, Median des Trends, Anzahl Brunnen je Zelle; leere Zellen fehlend mit Grund |
| `grundwasser/differenz` | 1.1 | `feld` (2°) | `beobachtung`, `modell`, `idealisiert`, `abgeleitet_aus` beide | nur Zellen, in denen beides vorliegt |
| Prozess `entnahme` | – (Übergang gesellschaftlich) | – | – | Zufluss aus `grundwasser`; Stoffwechsel, Bilanz nicht prüfbar |
| `grundwasser/regime` | 2.2 | – (hängt an `grundwasser`) | `kuratiert` | Gemeingut oder Eigentum mit Entnahmerecht; Formation Pflicht |
| `grow/messnetz` | 2 (gesellschaftliches Archiv) | – | `kuratiert` | `organisation`, `manager`, `license` je Brunnen als Träger des Wissens |

### Idealschicht: Welcher Lauf gilt als Ideal?

Das ist eine Setzung nach Regel 7 und steht als Auswahl im Graphen. Drei Kandidaten, nach Nähe zu GROW:

1. **ISIMIP3a `obsclim` + `histsoc`.** Beobachtetes Klima und historische Wassernutzung, 1901–2021.
   Das Ideal ist hier „das Modell, so gut es die Welt kennt“. Der Zeitraum überdeckt GROW, deshalb ist
   dies der Kandidat für die Differenz. Empfohlen als erster Adapter.
2. **ISIMIP3a `obsclim` + `1901soc`.** Dasselbe Klima, aber Wassernutzung auf dem Stand von 1901.
   Der Unterschied zu 1 ist der **Regimeeffekt im Modell**: Was die Entnahme am Speicher ändert. Das ist
   eine Modell-Modell-Differenz, kein Vergleich mit Beobachtung. Sie gehört an die Relation Regime →
   Grundwasser als Rückwirkung, nicht in die Differenz.
3. **ISIMIP3b `picontrol` + `1850soc`.** Ein vorindustrieller Referenzzustand. Laut Strukturstand ist
   er ausdrücklich kein natürlicher Normalzustand und muss im Bild so stehen.

### Wo sich eine Differenz bilden lässt

| Größe | Ideal (ISIMIP) | Beobachtung (GROW) | Differenz |
| --- | --- | --- | --- |
| Trendrichtung des Speichers bzw. der Tiefe | `groundwstor`, Trend je Zelle | `trend_direction`, `trend_slope_m_year-1` | **ja, als Vorzeichen:** stimmt die Richtung überein? Nur in Zellen mit Brunnen, also überwiegend Nordamerika, Indien, Europa, Australien |
| Anomalie über die Zeit (normiert) | `groundwstor`, monatlich | Tiefe, monatlich oder jährlich | **ja, als Korrelation oder normierte Anomalie.** Die Normierung ist eine Setzung. Braucht die GROW-Zeitreihen (1,4 GB) |
| Betrag der Änderung | mm Speicher | m Tiefe | **nein:** Umrechnung braucht die speichernutzbare Porosität. GROW führt nur die Gesamtporosität, das ist nicht dasselbe. Kommensurabilität fehlend (Regel 8) |
| Grundwassertiefe absolut | `wtd`, nicht veröffentlicht; Demo nur Mittelwert | `groundwater_mean_m` mit `reference_point` = Tiefe | **noch nicht:** möglich, sobald ISIMIP `wtd` mit Ensemble veröffentlicht |
| Neubildung | `qr` | – | **nein:** keine Beobachtung, nur Idealschicht |
| Entnahme | `ptotwwgw` (potenzieller Bedarf, Modell) | Entnahmespalten in GROW stammen aus Fremdprodukten, nicht vom Brunnen | **nein:** beides ist Modell, keine Beobachtung |

Allgemeine Grenzen:

- **Maßstab.** Ein Brunnen ist ein Punkt, eine ISIMIP-Zelle misst etwa 55 km. Die Differenz Punkt gegen
  Zelle mischt Modellfehler und Repräsentativität. Deshalb wird GROW zuerst auf 2° vergröbert (Median,
  Anzahl), und die Brunnenzahl je Zelle steht neben jeder Differenz.
- **Bezugspunkt.** `reference_point` unterscheidet Tiefe unter Gelände und Wasserstand ü. NN. Für den
  Vergleich kommen nur Tiefen in Frage, oder Änderungen, bei denen der Bezug herausfällt.
- **Herkunft pro Spalte.** In GROW ist nur die Brunnenmessung `beobachtung`. Klima-, Landnutzungs- und
  Entnahmespalten stammen aus Reanalysen und Modellen (ERA5, MSWEP, GLEAM usw.) und tragen deren
  Herkunft. Regel 6 gilt pro Wert, nicht pro Datei.

### Was das Schema dafür noch nicht kann

1. **Eine Form, zwei Träger.** Eine Form verweist heute auf genau einen Eintrag. Grundwasser hat aber einen
   Idealträger (Feld) und einen Beobachtungsträger (Brunnen). Die Form sollte `eintraege: [...]` führen
   dürfen, oder Ideal und Beobachtung sind Werte am selben Eintrag mit verschiedener Herkunft. Das zweite
   passt schlecht, weil `wo` am Eintrag hängt und die Geometrien verschieden sind.
2. **Die Setzung des Ideals ist nicht verknüpft.** Ein `idealisiert`-Wert verweist nicht auf die Auswahl, die
   festlegt, was als Ideal gilt. Vorschlag: `woher.ideal` als Pflichtverweis auf eine Auswahl, geprüft
   unter Regel 7.
3. **Die Anzeige der Differenz.** Nach Regel 6 zeigt die Differenz die schwächste Art, also „modell,
   idealisiert“. Das ist formal richtig, verdeckt aber, dass eine Beobachtung beteiligt ist. Vielleicht
   braucht die Differenz ein eigenes Merkmal. Das ist eine Frage an den Strukturstand, nicht an den Code.
4. **Was ein Modell ist.** Ein ISIMIP-Ensemble ist Wirkungsmodell × Klimaantrieb. `woher.modelle` sollte
   die Paare führen (`h08/gfdl-esm4`), sonst ist die Spannweite über fünf Antriebe desselben
   Modells nicht von der Spannweite über Modelle zu unterscheiden.
5. **Lizenz pro Modell und pro Brunnen.** Das Manifest kennt bisher eine Lizenz je Quelle.

## d) Reduktion für eine Ebene unter ~5 MB

### Annahmen

- ISIMIP-Landmaske auf 0,5°: etwa 67 400 Zellen.
- Kompaktes JSON: etwa 6 Byte pro Zahl.
- Ozeanzellen werden über eine einmal gespeicherte Landmaske ausgelassen. Sie sind keine Träger,
  also auch nicht „fehlend“.
- Regel 11 verlangt Mittel, min und max, also 3 Zahlen je Zelle und Zeitschnitt.

### Idealschicht (ISIMIP)

| Gitter | Landzellen | je Zeitschnitt (3 Werte) | Zeitschnitte unter 5 MB |
| --- | --- | --- | --- |
| 0,5° (Quelle) | ~67 400 | ~1,2 MB | ~4 |
| 1° | ~16 900 | ~300 kB | ~16 |
| **2°** | **~4 200** | **~75 kB** | **~65** |
| 5′ (`wtd`, Grundwassersektor) | ~2,4 Mio. | ~43 MB | 0, vergröbern zwingend |

Vorgeschlagene Reduktion, im Manifest als `reduktion`:

```json
[
  { "schritt": "auswaehlen",     "angabe": "groundwstor; ISIMIP3a obsclim, histsoc; 1901–2021" },
  { "schritt": "vergroebern",    "angabe": "0.5° -> 2°, flächengewichtetes Mittel, nur Land" },
  { "schritt": "mitteln",        "angabe": "monatlich -> Jahresmittel, dann Dekadenmittel (12 Dekaden)" },
  { "schritt": "zusammenfassen", "angabe": "Ensemble über Modell/Antrieb",
    "modelle": ["cwatm/…", "h08/…", "hydropy/…", "watergap2-2e/…"], "mitgefuehrt": ["mittel", "min", "max"] }
]
```

- 12 Dekaden × 75 kB ergeben etwa 0,9 MB.
- Mit `qr` als zweiter Variable sind es etwa 1,8 MB.
- ISIMIP3b-Klimamittel (1985–2014, 2041–2070, 2071–2100 × 3 SSP, 7 Schnitte) kosten etwa 0,5 MB.
- Jährlich auf 2° über 120 Jahre wären es etwa 9 MB, das ist zu viel. Jährlich passt nur regional,
  etwa für einen Sintflut-Kasten über `cutout_bbox`.

### Beobachtung (GROW)

- Rohe Punkte: mehr als 200 000 Brunnen × etwa 50 Byte (ID, Lage, Mittel, Trend, Zeitraum) ergeben etwa
  10 MB. Das ist zu viel.
- Eine der folgenden Reduktionen:
  - **Vergröbern auf 2°** (empfohlen, weil es mit der Idealschicht übereinstimmt): je Zelle Median der
    Tiefe, Median des Trends, Anzahl Brunnen, 10. und 90. Perzentil. Belegt sind vermutlich nur einige
    Tausend Zellen, das ergibt weniger als 0,3 MB.
  - **Auswählen:** nur `reference_point` = Tiefe, `length_years` ≥ 10, `gap_fraction` unter einer
    Schwelle, ohne `plateaus`/`outliers_change_points`. Wie viele Brunnen übrig bleiben, zeigt erst die
    Attributtabelle. Jede Schwelle ist eine Setzung (Regel 7).
- Die Punkte selbst bleiben als Verweis auf GROW, wie das PaleoMIST-Raster bei der Sintflut.

**Differenz:** nur in belegten 2°-Zellen, etwa 0,1–0,2 MB.

## Nächste Schritte, jeweils mit Freigabe

1. `grow_attributes.parquet` per HTTP-Range aus dem ZIP holen (etwa 15 MB, unter der Grenze). Danach
   stehen fest: die Zahl der Brunnen nach Filter, die belegten 2°-Zellen und die Verteilung der
   Lizenzen je Brunnen.
2. **Herunterladen über 50 MB (Frage):** vier ISIMIP3a-Dateien `groundwstor` `obsclim`/`histsoc`,
   etwa 1,2 GB, lokal außerhalb des Repos, nur das Reduzierte ins Repo.
3. **Entscheidungen für Max:**
   - Lizenz des Repos, wegen CC BY-NC-SA von GROW.
   - Welcher Lauf gilt als Ideal (oben 1, 2 oder 3)?
   - Schemafragen 1–5 oben.

## Quellen

- ISIMIP Repository API: https://data.isimip.org/api/v1/ ; Files API: https://files.isimip.org/api/v2
- ISIMIP-Protokoll 3, Variablendefinitionen: https://github.com/ISI-MIP/isimip-protocol-3 (`definitions/variable/`)
- ISIMIP3a Global Water Sector, DOI 10.48364/ISIMIP.398165 (aktuell v1.11)
- Reinecke et al. (2026), The ISIMIP groundwater sector, GMD 19, 523: https://gmd.copernicus.org/articles/19/523/2026/
- Demo-Ensemble Grundwassersektor: https://zenodo.org/records/14962512
- isimip-client: https://github.com/ISI-MIP/isimip-client
- GROW: https://doi.org/10.5281/zenodo.15149480 ; Beispielskript https://github.com/EarthSystemModelling/GROW
