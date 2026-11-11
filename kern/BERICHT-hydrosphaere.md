# Bericht: Hydrosphäre (Quellen und Plan)

Erste Fassung: 2026-11-10, Branch `struktur`, nach `601f413`. Nur Prüfung und Plan: kein Code, keine Daten, kein Download. Entscheidungen von Max und weitere Prüfung: Abschnitt „Stand (2026-11-11)“ am Ende. Alle Lizenzen am **2026-11-10** auf den Seiten der Anbieter geprüft. Rohdaten kämen nach `~/ZeroEarth/rohdaten/<quelle>/`, nie ins Repo.

**Grenzen dieses Berichts:**
- Größen stehen so da, wie die Anbieter sie nennen. Was ich geschätzt habe, steht ausdrücklich als **„geschätzt, nicht gemessen“** da.
- Herkunftsarten nach Regel 6: `beobachtung`, `modell`, `berechnet`, `kuratiert`, `erwartung`.
- Verwandt: `kern/BERICHT-grundwasser.md` (ISIMIP, GROW; 2026-09-30) und `kern/BERICHT-meereis.md` (Kryosphäre).

## 1. Ausgangslage im Repo

- **Ebene `gewaesser`** (`GewaesserLayer`, `index.html` ab Zeile 3277, „Gewässer · Flüsse & Pegel“):
  - **Grob:** Flussnetz als Linien aus `data/fluesse.geojson`, Linienbreite nach `ord_flow`.
  - **Fein:** „Pegel“-Punkte aus `data/pegel.json`, Abfluss live über die Open-Meteo Flood-API (`flood-api.open-meteo.com/v1/flood`, `daily=river_discharge`, `forecast_days=1`).
  - **Was fehlt:** Beide Dateien und der Konverter `gewaesser_to_zef.py` fehlen. Rohdaten und ein Kern-Adapter fehlen ebenfalls.
  - **`EBENEN_HERKUNFT`** (Zeile 6737) sagt „Flussnetz kuratiert“. Das stimmt nicht: Das Netz ist aus einem Höhenmodell gerechnet (siehe 2.1). Außerdem sind die „Pegel“ keine Messstellen, sondern Zellen eines Modells (GloFAS).
- **Ebene `gezeiten`:** Konverter `matrix-scharnier/adapter/gezeiten.py` und Workflow `gezeiten.yml` vorhanden, `data/gezeiten.json` nie erzeugt.
- **Kern:**
  - **Sphäre:** `hydrosphaere` steht in `SPHAEREN`, noch ohne Eintrag.
  - **Geometrien:** `punkt`, `flaeche`, `feld`, `grenze`. Eine Linie, die einen Stoffstrom trägt, gibt es nicht.
  - **Näherung:** `NAEHERUNG_VERTRITT` kennt `linie`. Ein Punkt darf also eine Linie vertreten, mit Angabe (Regel 10).
- **Rohdaten:** In `~/ZeroEarth/rohdaten/` liegt noch nichts zur Hydrosphäre.

## 2. Quellen

**Überblick:**

| Quelle | Was | Lizenz | Weitergabe in `data/` | Größe roh | Herkunft |
| --- | --- | --- | --- | --- | --- |
| HydroRIVERS v1.0 | Flussnetz, Linien | HydroSHEDS-Lizenz (WWF) | **ungeklärt, eher nein** | 544 MB global | `modell` + `berechnet` |
| HydroBASINS v1c | Einzugsgebiete, 12 Ebenen | HydroSHEDS-Lizenz (WWF) | **ungeklärt, eher nein** | Polygone nicht geprüft | `modell` + `berechnet` |
| SWORD v17c | Flussabschnitte ab 30 m Breite | CC BY 4.0 | ja, mit Nennung | 28,3 GB (13 Dateien) | `kuratiert` auf `beobachtung` |
| HydroLAKES v1.0 | Seen ab 10 ha | CC BY 4.0 | ja, mit Nennung | 820 MB | Umriss `kuratiert`; Tiefe, Volumen `modell` |
| GLWD v2.0 | Feuchtgebiete und Gewässer, 33 Klassen | CC BY 4.0 | ja, mit Nennung | 925 MB (tif) | `kuratiert` auf `beobachtung` und `modell` |
| GloFAS v4 (Open-Meteo) | Abfluss täglich, Reanalyse und Vorhersage | CC BY 4.0 (Open-Meteo); Copernicus-Lizenz | ja, mit Nennung | live | `modell`; Vorhersage `erwartung` |
| GRACE/GRACE-FO Mascon RL06.3 | Änderung des Wasserspeichers | NASA-Datenpolitik, offen | ja (mit Nennung) | einige 100 MB (nicht gemessen) | `beobachtung` + `modell` + `berechnet` |
| ERA5 | Niederschlag, Verdunstung, Wasserdampf | CC BY 4.0 | ja, mit Vermerk | je Auswahl | `modell` (Reanalyse) |
| GLEAM 4.3 | Verdunstung | eigene Bedingungen | **unklar** | je Auswahl | `modell` |
| GPM IMERG Final V07 | Niederschlag | NASA offen; AWS-Listing CC BY 4.0 | ja, mit Nennung | je Auswahl | `beobachtung` + `modell` |

### 2.1 HydroRIVERS v1.0 (HydroSHEDS)

- **Was:** globales Flussnetz als Linien.
  - **Umfang:** 8 477 883 Abschnitte, mittlere Länge 4,23 km, zusammen 35,85 Mio. km.
  - **Aufgenommen:** Abschnitte mit Einzugsgebiet ≥ 10 km² oder mittlerem Abfluss ≥ 0,1 m³/s.
- **Attribute u. a.:**
  - `ORD_STRA`: Strahler-Ordnung.
  - `ORD_CLAS`: Ordnungsklasse, 1 = Hauptstrom bis zur Mündung.
  - `ORD_FLOW`: Abflussklasse in Zehnerpotenzen; 1 = ≥ 100 000 m³/s, 2 = ≥ 10 000, 3 = ≥ 1 000, … bis 10.
  - `DIS_AV_CMS`: mittlerer Abfluss in m³/s.
  - `UPLAND_SKM`: Einzugsfläche.
  - `ENDORHEIC`: abflusslos.
  - Verweis auf das HydroBASINS-Teilgebiet.
- **Herkunft (Regel 6):**
  - **Linien:** aus dem HydroSHEDS-Höhenmodell abgeleitet (15″, SRTM-Radar, Aufnahme Februar 2000), mit Fließrichtungs-Algorithmen. Also `modell` + `berechnet` auf `beobachtung`. Kein Fluss ist im Gelände kartiert.
  - **Abfluss `DIS_AV_CMS`:**
    - langjähriges Mittel 1971–2000;
    - aus den 0,5°-Abflussfeldern von WaterGAP 2.2 räumlich heruntergeskaliert, also `modell` + `berechnet`;
    - stimmt laut Dokumentation auf 0,13 % mit WaterGAP überein. Das ist innere Stimmigkeit, keine Messung.
- **Zeit (Regel 16):**
  - Geometrie: Bezug 2000.
  - Abfluss: Mittel 1971–2000.
  - Unschärfe: nicht angegeben → `fehlt`.
- **Format, Größe:** Shapefile oder Geodatabase (ZIP).
  - Global: 544 MB (shp) bzw. 618 MB (gdb).
  - Europa und Nahost: 68 MB, Nord- und Mittelamerika: 66 MB, Afrika: 108 MB (shp).
- **Zugang:** Direktdownload ohne Anmeldung (data.hydrosheds.org).
- **Zitat:** Lehner, B., Grill, G. (2013): Global river hydrography and network routing. *Hydrological Processes* 27(15): 2171–2186.

### 2.2 HydroBASINS v1c (HydroSHEDS)

- **Was:** Einzugsgebiete als Polygone in 12 verschachtelten Ebenen (Pfafstetter-Codierung). Ebene 1 sind Kontinente, Ebene 12 die kleinsten Teilgebiete.
  - **Fassungen:** „Standard“ und „mit Seen“, dazu Mündungspunkte.
- **Herkunft:** aus demselben Höhenmodell, also `modell` + `berechnet` auf `beobachtung`. Wasserscheiden sind die Grenzen zwischen Einzugsgebieten und damit eine **`grenze`** im Sinne des Schemas: immer abgeleitet, nie gemessen.
- **Auflösung:** 15″.
- **Größe:**
  - Mündungspunkte: Ebenen 1–6 33 MB, alle Ebenen 440 MB.
  - Polygone: **nicht geprüft**.
- **Zitat:** Lehner & Grill 2013; Lehner, Verdin & Jarvis 2008 (HydroSHEDS).

### 2.3 Lizenz HydroSHEDS (HydroRIVERS und HydroBASINS)

**Grundlage:** HydroSHEDS Version 1 – License Agreement des WWF (Technical Documentation v1.4, Abschnitt 7.1 und Anhang A; HydroRIVERS-Dokumentation v1.0, Abschnitt 4.1). Das ist **keine** Creative-Commons-Lizenz.

**Wortlaut:**
- **Nutzung:** „free for non-commercial and commercial use“.
- **Anhang A, 2.1.2 (Weitergabe):** „to (i) market and distribute the Licensed Materials incorporated into any Derivative Works to End Users, subject to the terms and conditions of an end user license agreement with terms that are at least as protective of the Licensed Materials as are the terms of this License … In no event shall Licensee license or distribute the Licensed Materials as a stand-alone product.“
- **Anhang A, 1.2:** „End Users“ erhalten die Daten „pursuant to a written license agreement for such party's use and not for redistribution“.
- **Anhang B (Pflichtvermerk):** „© World Wildlife Fund, Inc. (2006-2022)“, dazu die Rechteinhaber (USGS, NASA, ESRI, CIAT, UNEP-WCMC, WWF, Commonwealth of Australia, British Crown). Der Vermerk muss in Dokumentation oder Metadaten jedes Produkts stehen.

**Folge:**
- Eine offene Seite mit frei ladbaren Dateien in `data/` gibt die Daten an alle weiter, ohne schriftlichen Endnutzervertrag.
- Eine reine Linien-Datei der Flüsse käme einem eigenständigen Produkt nahe.
- Regel 14 („Daten dahinter“) setzt gerade diese Weitergabe voraus.
- **Zulässigkeit: ungeklärt, eher nein.**

**Vorschlag:** beim HydroSHEDS-Team schriftlich anfragen. Bis zur Antwort nicht einbinden.

### 2.4 SWORD v17c (SWOT River Database)

- **Was:** Flussabschnitte (reaches, etwa 10 km) und Knoten (alle 200 m) für Flüsse ab etwa 30 m Breite. Die Datenbank ist Bezug für die SWOT-Satellitenmessungen.
- **Herkunft:**
  - Zusammengeführt aus Flussbreiten aus Landsat (GRWL), Höhenmodell (MERIT Hydro) und weiteren Quellen.
  - Also `kuratiert` auf `beobachtung`; Lage zum Teil `modell` + `berechnet`, wo MERIT Hydro die Linie liefert.
  - `QUELLEN.md` führt SWORD schon als `kuratiert`.
- **Zeit:** Fassung v17c vom 2026-11-01 (Zenodo 23870877). Bezugszeit der Breiten je Quelle verschieden; Unschärfe `fehlt`.
- **Format, Größe:** 13 Dateien, zusammen 28,3 GB (NetCDF, GeoPackage, Shapefile je Kontinent).
- **Lizenz:** CC BY 4.0. Wortlaut auf Zenodo: „Creative Commons Attribution 4.0 International“. Weitergabe und Bearbeitung erlaubt, mit Nennung.
- **Nicht verwechseln:** MERIT-SWORD (Verknüpfung mit MERIT Hydro) steht unter CC BY-NC-SA, also nicht für zeroearth.
- **Bedeutung:** **Offene Alternative zu HydroRIVERS** für große Flüsse. Sie hat weniger Abschnitte, ist aber frei weiterzugeben. Ein Abfluss-Mittel als Attribut fehlt. Abfluss käme dann aus GloFAS (Modell) oder aus SWOT-Messungen (`gezeiten`-Weg).

### 2.5 HydroLAKES v1.0

- **Was:** rund 1,43 Mio. Seen und Stauseen ab 10 ha als Polygone, mit Fläche, Uferlänge, Tiefe, Volumen und Verweilzeit.
- **Herkunft:**
  - **Umrisse:** `kuratiert` aus mehreren Kartierungen (u. a. SRTM Water Body Data, GLWD, CanVec), also auf `beobachtung`.
  - **Tiefe, Volumen, Verweilzeit:** geostatistisch geschätzt → `modell` + `berechnet`. Die Verweilzeit braucht den Abfluss aus WaterGAP.
- **Format, Größe:**
  - Polygone: 820 MB (shp) bzw. 763 MB (gdb).
  - Mündungspunkte: 79 MB bzw. 81 MB.
- **Lizenz:** CC BY 4.0 (anders als HydroRIVERS). Weitergabe mit Nennung erlaubt.
- **Zitat:** Messager, M. L., Lehner, B., Grill, G., Nedeva, I., Schmitt, O. (2016): Estimating the volume and age of water stored in global lakes using a geo-statistical approach. *Nature Communications* 7: 13603.

### 2.6 GLWD v2.0 (Global Lakes and Wetlands Database)

- **Was:** Raster 15″ mit 33 Klassen (Seen, Flüsse, Moore, Sümpfe, Mangroven, Reisfelder u. a.), je Zelle Flächenanteile.
- **Herkunft:** Harmonisierung boden- und satellitengestützter Karten → `kuratiert` auf `beobachtung` und `modell` (einzelne Eingangskarten sind Modelle).
- **Zeit:** Bezug „heute“ (etwa 2000–2020, je Eingang); Unschärfe `fehlt`.
- **Format, Größe:** `combined_classes` als GeoTIFF 925 MB bzw. GDB 918 MB; `area_by_class` 1,6 GB (Figshare 28519994, 2025-05-23).
- **Lizenz:** CC BY 4.0. Weitergabe mit Nennung.
- **Zitat:** Lehner, B. et al. (2025): Mapping the world's inland surface waters: an upgrade to the Global Lakes and Wetlands Database (GLWD v2). *Earth System Science Data* 17: 2277–2329.

### 2.7 GloFAS v4 (Abfluss)

- **Was:** täglicher Flussabfluss in m³/s auf 0,05°, aus dem hydrologischen Modell LISFLOOD mit ERA5-Antrieb.
- **Zwei Wege:**
  - **Open-Meteo Flood-API** (heute im Code):
    - Reanalyse 1984 bis Juli 2022, dazu Vorhersage 30 Tage und saisonal 7 Monate.
    - Ohne Schlüssel für nicht-kommerzielle Nutzung; CORS `*` (geprüft).
    - Lizenz der Antworten: CC BY 4.0, Nennung „Open-Meteo“ und der Quelle.
  - **Copernicus CEMS (EWDS):**
    - Lizenz CEMS-FLOODS, Weitergabe erlaubt.
    - Vermerk: „Generated using Copernicus Emergency Management Service information [Year]“, bei Änderungen „Contains modified Copernicus Emergency Management Service information [Year]“.
    - Anmeldung nötig.
- **Herkunft:**
  - Reanalyse: `modell`.
  - Vorhersage: `modell` + `erwartung`, mit Erwartungsträger „GloFAS (Copernicus)“.
  - Kein Wert ist gemessen. Die Ebene darf nicht „Pegel“ heißen.
- **Zeit:** Tageswerte; `forecast_days=1` liefert den heutigen Modelltag, keine Beobachtung.

### 2.8 GRACE/GRACE-FO (JPL Mascon RL06.3 v4)

- **Was:** monatliche Änderung des gesamten Wasserspeichers an Land (terrestrial water storage, TWS) als Anomalie in cm Wassersäule, April 2002 bis heute.
  - Lücke zwischen GRACE und GRACE-FO: Juli 2017 bis Mai 2018, dazu einzelne fehlende Monate.
- **Auflösung:** 3°-Mascons, ausgeliefert auf 0,5°-Gitter. Die echte Auflösung ist die der Mascons, etwa 300 km.
- **Fassung:** CRI-gefiltert, die empfohlene Fassung für Land (DOI 10.5067/TEMSC-3JC634).
- **Herkunft:** Abstandsmessung zweier Satelliten (`beobachtung`), daraus Schwerefeld und Massenverteilung durch Inversion mit Vorgaben (`modell` + `berechnet`).
- **Wichtig:** Es ist eine **Anomalie** gegen das Mittel 2004–2009, kein absoluter Bestand. Für die Bilanz (Abschnitt 3.3) reicht das, weil dort nur ΔS zählt.
- **Format, Größe:** eine NetCDF-Datei mit allen Monaten, einige 100 MB (**geschätzt, nicht gemessen**). Earthdata-Login nötig.
- **Lizenz:** Die Seite nennt keine eigene Lizenz. Es gilt die offene NASA-Datenpolitik (Earth Science Data: „openly shared, without restriction“). Nennung über DOI.

### 2.9 ERA5 (Niederschlag, Verdunstung, Wasserdampf)

- **Was:** stündliche Reanalyse ab 1940 auf 0,25°.
  - **Wasserkreislauf:** Niederschlag `tp`, Verdunstung `e`, Abfluss `ro`.
  - **Wasserdampf:** Säule `tcwv`; Feuchtefluss als vertikal integrierte Divergenz.
  - **Monatsmittel:** als eigenes Produkt.
- **Herkunft:** `modell` (Reanalyse: Wettermodell mit Beobachtungen angeglichen).
  - Die Bilanz in ERA5 geht nicht ganz auf, weil die Datenangleichung Wasser hinzufügt oder entfernt. Das ist bekannt und gehört in die Legende.
- **Lizenz:** seit 02.07.2025 CC BY 4.0.
  - Vermerk: „ECMWF Reanalysis data (ERA5), © ECMWF, … Licensed under CC-BY-4.0“.
  - Bei Änderungen: „Contains modified Copernicus Climate Change Service data [Year]“.
- **Zugang:** CDS-API mit Konto. Größe je Auswahl: Monatsmittel einer Variable global, 1940–heute, etwa 1 GB als NetCDF (**geschätzt, nicht gemessen**).
- **Wasserdampf:** Ein eigenes Produkt (etwa satellitengestützte Säulen) habe ich nicht geprüft. ERA5 `tcwv` genügt für einen ersten Stand.

### 2.10 GLEAM 4.3 (Verdunstung)

- **Was:** tägliche Verdunstung an Land und ihre Teile (Transpiration, Boden, Interzeption) auf 0,1°.
  - **4.3a:** 1980–2024.
  - **4.3b:** 2003–2024, satellitengetrieben.
- **Herkunft:** `modell` (Priestley-Taylor mit Satellitendaten als Antrieb).
- **Zugang:** Registrierung, dann SFTP (Port 2225).
- **Lizenz:**
  - Wortlaut auf gleam.eu: Die Daten sind „freely available“, eine kommerzielle Nutzung ist „only after internal approval“ möglich.
  - Keine CC-Lizenz. Zur **Weitergabe** abgeleiteter Dateien sagt die Seite nichts → **unklar**.
- **Bedeutung:** Nur nötig, wenn neben ERA5 eine zweite Verdunstung gezeigt werden soll (Regel 13). Für den Anfang reicht ERA5.

### 2.11 GPM IMERG Final V07 (Niederschlag)

- **Was:** Niederschlag auf 0,1°, halbstündlich bis monatlich, ab Juni 2000.
- **Herkunft:** Mikrowellen- und Infrarotmessungen mehrerer Satelliten (`beobachtung`), zusammengeführt und an Bodenstationen (GPCC) angeglichen (`modell` + `berechnet`).
- **Lizenz:** NASA-Datenpolitik „openly shared, without restriction“; das AWS-Open-Data-Verzeichnis nennt CC BY 4.0. Nennung über DOI 10.5067/GPM/IMERG/3B-HH/07 (bzw. das Monatsprodukt).
- **Zugang:** Earthdata-Login. Monatsprodukt global etwa 30 MB je Monat (**geschätzt, nicht gemessen**).
- **Bedeutung:** zweite, stärker beobachtete Seite des Niederschlags neben ERA5 (Regel 13: nebeneinander, keine bevorzugt).

### 2.12 OpenStreetMap (nur genannt)

- **Was es gäbe:** Gewässer als Linien und Flächen (`waterway=*`, `natural=water`), etwa über Geofabrik-Auszüge oder OSM-Wasserflächen-Exporte.
- **Lizenz:** ODbL. Abgeleitete Datenbanken müssen unter derselben Lizenz weitergegeben werden.
- **Herkunft:** `kuratiert` (Kartierung durch Freiwillige).
- **Nicht geprüft**, wie verlangt nur genannt. Ebenso nur genannt: Natural Earth (Flüsse und Seen, gemeinfrei, sehr grob).

## 3. Einordnung in die Matrix

### 3.1 Wasser als Bestand mit Formen

- **Bestand:** Wasser, Stapel 1.1, Einheit Masse oder Volumen (Gt bzw. km³).
- **Formen und Sphären:**

| Form | Sphäre | Quelle (Feld oder Wert) |
| --- | --- | --- |
| Ozean | Hydrosphäre | Relief/Küste (Fläche), Meeresspiegel aus PaleoMIST |
| Eis (Eisschild, Meereis, Gletscher) | Kryosphäre | `eis`, `meereis` (vorhanden) |
| Seen und Stauseen | Hydrosphäre | HydroLAKES (Volumen `modell`) |
| Flüsse | Hydrosphäre | Netz (HydroRIVERS oder SWORD); Inhalt klein, wichtig ist der Durchfluss |
| Boden und Grundwasser | Hydrosphäre | ISIMIP `groundwstor` (`modell`), GROW (`beobachtung`), siehe `BERICHT-grundwasser.md` |
| Wasserdampf | Atmosphäre | ERA5 `tcwv` |
| Gesamtspeicher an Land (ΔS) | Hydrosphäre | GRACE (nur Änderung) |

- **Regel B:** Alle Formen liegen im Stapel 1.1, also ist der Wechsel zwischen ihnen erlaubt (Bestandsformen innerhalb eines Stapels).

### 3.2 Flüsse zwischen den Formen

- **Formwechsel (Prozesse):**
  - Verdunstung: Ozean/Land → Wasserdampf.
  - Niederschlag: Wasserdampf → Land/Ozean.
  - Abfluss: Land → Ozean (über das Flussnetz).
  - Schmelze und Kalben: Eis → Ozean (schon im Sintflut-Kern).
- **Ort im Schema:** Prozesse im Übergang „Planetarer Stoffwechsel“, die Relation `formwechsel` mit Rate (Gt/Jahr bzw. mm/Monat).
- **Flussnetz und Wasserscheiden:** **abgeleitete Grenzen**.
  - **Wasserscheide:** eine `grenze`, Spur des Bestands „Wasser im Einzugsgebiet“ (`spur_von`).
  - **Fluss:** der Weg des Formwechsels „Abfluss“, kein eigener Bestand. Als Geometrie fehlt eine Linie. **Vorschlag:**
    - **(a)** Abschnitte als `punkt` mit `naeherung: {vertritt: 'linie', angabe: …}`, Linie nur für die Darstellung in `data/`. Geht ohne Schema-Änderung.
    - **(b)** neue Geometrie `bahn` (Linie eines Stroms), Schema-Version anheben.
    - Max entscheidet (Frage 6).

### 3.3 Globus (Feld) gegen Flussansicht (Kreislauf mit Bilanz)

- **Globus:**
  - Jede Größe als **Feld** für sich: Niederschlag, Verdunstung, Wasserdampf, ΔS.
  - Jede mit eigenem Herkunftszeichen. Kein Feld wird mit einem anderen verrechnet.
- **Flussansicht:**
  - Ein Einzugsgebiet (oder ein Kontinent) als **Kreislauf**. Knoten sind die Formen, Kanten die Formwechsel.
  - Dazu eine **Bilanz als Prüfart (Regel 5):** P − E − R = ΔS.
    - **Niederschlag P:** GPM IMERG oder ERA5.
    - **Verdunstung E:** ERA5 oder GLEAM.
    - **Abfluss R:** GloFAS am Auslass.
    - **ΔS:** GRACE, als **unabhängige Seite**, nicht aus P, E und R gerechnet.
  - **Darstellung:** Die Seite zeigt den **Rest** (linke minus rechte Seite) mit Vorzeichen. Sie gleicht ihn nicht aus. Der Rest ist eine Aussage über die Quellen, kein Fehler, der verschwinden muss.
  - **Gebietsgröße:** Wegen der GRACE-Auflösung nur für große Einzugsgebiete, etwa ab 200 000 km² (Setzung, Regel 7; in der Legende).
  - **Wasserscheiden:** Die Einzugsgebiete kämen aus HydroBASINS (Lizenzfrage wie 2.3). Ohne sie bleibt die Bilanz auf Kontinente beschränkt.
- **Rechnen:** Die Bilanz ist eine Summe von Quellenwerten. Sie ist ein Vergleich, keine Rekonstruktion; das ist zulässig, solange keine Größe hochgerechnet wird (Regel 12).

## 4. Reduktion des Flussnetzes je Zoomstufe

**Gilt für HydroRIVERS, falls die Lizenz es erlaubt, sinngemäß auch für SWORD.** Die Dokumentation nennt keine Zahlen je Klasse. **Alle Zahlen hier sind geschätzt, nicht gemessen.** Gemessen werden sie erst nach dem Download (544 MB, Freigabe nötig).

**Auswahl nach `ORD_FLOW`** (Abflussklasse). Sie richtet sich nach Wassermenge, nicht nach Verzweigung. Das passt zum Formwechsel „Abfluss“.

| Zoomstufe | Auswahl | Abfluss | Vereinfachung (Toleranz) | Abschnitte (geschätzt) | Datei (geschätzt) | Laden |
| --- | --- | --- | --- | --- | --- | --- |
| Globus | `ORD_FLOW` ≤ 3 | ≥ 1 000 m³/s | etwa 5 km | einige 10 000 | 1–3 MB | eine Datei |
| Kontinent | `ORD_FLOW` ≤ 4 | ≥ 100 m³/s | etwa 1 km | einige 100 000 | 10–20 MB | je Kontinent eine Datei, 2–5 MB |
| Region | `ORD_FLOW` ≤ 5 | ≥ 10 m³/s | etwa 250 m | etwa 1–2 Mio. | 50–100 MB | Kacheln je HydroBASINS-Ebene 3 oder 4, je wenige MB |

- **Grenzen:**
  - Jede Datei bleibt unter 100 MB.
  - Eine geladene Ebene hat wenige MB.
  - Kleinere Abflüsse (`ORD_FLOW` ≥ 6) werden nicht gezeichnet.
- **Format:** GeoJSON mit Koordinaten auf 3 Nachkommastellen (etwa 100 m). Eine binäre Fassung (quantisierte Ganzzahlen) wäre 3- bis 4-mal kleiner, ist aber für Maschinen schwerer lesbar (Regel 14). Vorschlag: GeoJSON.
- **Pflicht in Manifest und Legende** (Regel 7, 8, 11):
  - Schwelle und Toleranz.
  - Die Zahl der nicht gezeichneten Abschnitte und ihre Gesamtlänge.
- **Geprüft wird im Kern:** Summe der Abschnitte je Stufe gegen die Rohdaten. Keine Linie darf verloren gehen, die über der Schwelle liegt.

## 5. Tiefenzeit

**Regel 12:** Ein Flussnetz der Vergangenheit rechne ich nicht selbst, etwa aus dem PALEOMAP- oder PaleoMIST-Relief mit Fließrichtungs-Algorithmen. Das wäre eine eigene Rekonstruktion.

**Gefunden:**
- **Wickert 2016:** Wickert, A. D. (2016): Reconstruction of North American drainage basins and river discharge since the Last Glacial Maximum. *Earth Surface Dynamics* 4: 831–869. Daten: DOI 10.13020/D6D01H.
  - **Umfang:** nur Nordamerika, neun große Einzugsgebiete, LGM bis heute.
  - **Herkunft:** aus Eis-, GIA- und Klimamodellen → `modell` + `berechnet`.
  - **Lizenz:** **nicht geprüft**.
- **Global:** Ein fertiges, globales Paläo-Flussnetz mit offenen Daten habe ich nicht gefunden.
  - **Hinweis, nicht geprüft:** Landschaftsmodelle wie goSPL (Salles et al. 2023, *Science*) erzeugen globale Abflussnetze über Jahrmillionen. Ob die Ergebnisse als Daten mit Lizenz vorliegen, ist offen.

**Folge für die Seite:**
- Das Flussnetz gilt für „heute“ (Bezug 2000).
- Für ältere Zeitschritte steht es als `fehlt` mit Grund „keine globale Rekonstruktion als Quelle; selbst rechnen verboten (Regel 12)“.
- Wickert 2016 wäre eine regionale Ergänzung für 21–0 ka.
- **Wichtig:** Das Netz darf auf der Zeitleiste nicht stillschweigend in die Vergangenheit mitlaufen. Bei Zeitschritten vor etwa 1900 blendet die Seite es aus oder zeigt es deutlich als „heute“.

## 6. Was mit dem alten `GewaesserLayer` geschieht

**Vorschlag:** ersetzen, nicht flicken.

1. **Flussnetz:**
   - Kern-Adapter `fluesse` (HydroRIVERS oder SWORD, je nach Lizenz) mit Konverter im Kern-Muster. Der nie gebaute `gewaesser_to_zef.py` entfällt.
   - Die Seite liest dieselben Dateien wie der Kern (Regel 14).
   - Herkunft richtig: `modell` + `berechnet` statt „kuratiert“.
2. **„Pegel“:**
   - **Name:** Die Punkte heißen künftig „Abfluss (Modell)“. Es sind keine Messstellen.
   - **Ort:** Statt einer Liste `pegel.json` stehen sie an den Mündungen bzw. an festen Stellen großer Flüsse aus dem Netz. Die Auswahl ist eine Setzung im Manifest.
   - **Wert:** live aus GloFAS über Open-Meteo, Herkunft `modell`; Vorhersage `erwartung`.
   - **Nennung:** „Open-Meteo, GloFAS (Copernicus)“ in der Legende.
3. **Langjähriges Mittel neben dem Tageswert:**
   - Das Mittel 1971–2000 aus HydroRIVERS (WaterGAP) und der GloFAS-Tageswert erscheinen **nebeneinander**, zwei Modelle, keines bevorzugt (Regel 13).
   - Gilt nur, wenn HydroRIVERS erlaubt ist.
4. **Echte Messungen:** Ein Messnetz (etwa GRDC) habe ich nicht geprüft; es hat eigene, eher enge Lizenzbedingungen. SWOT (`gezeiten`) misst Wasserstände, keinen Abfluss.
5. **Code:**
   - `GewaesserLayer` bleibt, bis der Adapter steht. Dann wird er auf das neue Dateiformat umgestellt.
   - Die Kennung `gewaesser` bleibt, damit Links mit `l=gewaesser` weiter gehen.
   - Der Eintrag in `EBENEN_HERKUNFT` wird korrigiert.

## 7. Reihenfolge, falls freigegeben

1. **Lizenzfrage HydroSHEDS** klären (Anfrage von Max oder in Max' Namen).
2. **Netz:** SWORD oder HydroRIVERS laden (Download ansagen); Größen je `ORD_FLOW` messen und die Schätzungen aus Abschnitt 4 ersetzen.
3. **Kern-Adapter** `fluesse` und **Ebene** umstellen (Abschnitt 6).
4. **Seen:** HydroLAKES als Fläche (CC BY, nur große Seen nach Fläche).
5. **Felder:** P, E und Wasserdampf auf dem Globus (ERA5, dann IMERG).
6. **Bilanz in der Flussansicht** mit GRACE (Abschnitt 3.3).

## Stand (2026-11-11): Entscheidungen und weitere Prüfung

Max hat die zwölf Fragen der ersten Fassung beantwortet. Geprüft und vorbereitet, **nichts geladen** außer Verzeichnissen, Metadaten und einer Probeabfrage (Liste unten). Kein Code für die Hydrosphäre, kein neuer Adapter.

**Geladen, nur zur Prüfung** (im Scratchpad, nicht im Repo, nicht in `rohdaten/`):
- Zentralverzeichnisse der SWORD-ZIPs (per HTTP-Range, je einige kB);
- `v17c_variable_reference.md` und `v17c_release_notes.md` (zusammen etwa 0,1 MB);
- Schema der AQUASTAT-Abfrage (76 kB);
- Probeabfrage AQUASTAT (Deutschland, Indien; 7,6 kB);
- technischer Anhang der IRP-Datenbank (PDF, 0,9 MB).

### B1. Anfrage an HydroSHEDS

Der Entwurf liegt in `kern/ANFRAGE-hydrosheds.md`, auf Englisch. Max schickt ihn selbst ab. Die Kontaktadresse ist nicht eingesetzt; sie steht auf hydrosheds.org. Bis zur Antwort werden HydroRIVERS und HydroBASINS nicht eingebunden.

### B2. SWORD: Abschnitts-Dateien je Kontinent

- **Lizenz** (Zenodo-Metadaten, Abruf 2026-11-11): `cc-by-4.0`.
- **Fassung:** v17c, veröffentlicht 2026-11-01.
- **Einzeln ladbar:** ja. Zenodo beantwortet HTTP-Range-Anfragen. Jede Datei im ZIP ist einzeln gepackt und lässt sich mit einer Range-Anfrage auf ihren Bereich holen, ohne das ganze ZIP. Geprüft am Zentralverzeichnis, nicht durch Laden.
- **Empfohlen:** GeoParquet aus `SWORD_v17c_parquet.zip` (3,8 GB gesamt), nur die Dateien `sword_<XX>_v17c_reaches.parquet`:

| Kontinent | Datei | gepackt (Download) | entpackt |
| --- | --- | --- | --- |
| Afrika | `sword_AF_v17c_reaches.parquet` | 93,5 MB | 119,2 MB |
| Asien | `sword_AS_v17c_reaches.parquet` | 360,1 MB | 465,9 MB |
| Europa | `sword_EU_v17c_reaches.parquet` | 100,1 MB | 128,5 MB |
| Nordamerika | `sword_NA_v17c_reaches.parquet` | 142,7 MB | 185,1 MB |
| Ozeanien | `sword_OC_v17c_reaches.parquet` | 58,1 MB | 73,8 MB |
| Südamerika | `sword_SA_v17c_reaches.parquet` | 179,4 MB | 228,6 MB |
| **zusammen** | | **933,9 MB** | **1 201,1 MB** |

- **Zum Vergleich:**
  - Shapefiles der Abschnitte (je Kontinent und Pfafstetter-Gebiet in 106 Teilen) zusammen 916,9 MB gepackt bzw. 1 613 MB entpackt.
  - GeoPackage je Kontinent nur mit Knoten zusammen (Europa 441,6 MB gepackt).
  - Die Knoten-Dateien (200-m-Punkte) sind nicht nötig.
- **Vorschlag:**
  - Zuerst nur **Europa (100,1 MB)** laden, nach `~/ZeroEarth/rohdaten/sword/v17c/`.
  - Daran die Zahlen je Schwelle messen (B3), dann über die übrigen Kontinente entscheiden.
  - **Erst nach Freigabe.**
- **Wichtige Felder:**
  - `width`: statische Breite aus GRWL, also Landsat (`beobachtung`); laut Release Notes etwa 1 266 Abschnitte mit `width=0` (nicht gemessen).
  - `facc`, `facc_total`: Einzugsfläche in km². Sie ist aus MERIT-Basins zugeordnet (`modell` + `berechnet`). `facc_quality` sagt je Abschnitt, wie (Anker, interpoliert, Ersatz).
  - `stream_order`.
  - `width_obs_p50`, `wse_obs_p50`: SWOT-Messungen (`beobachtung`).
  - `dist_out`, `is_mainstem`, `main_path_id`, Nachbarn `rch_id_up_main`/`rch_id_dn_main`.

### B3. Auswahl je Zoomstufe für SWORD

SWORD hat keine Abflussklasse. Zwei Kriterien kommen infrage:

| | Breite `width` (m) | Einzugsfläche `facc_total` (km²) |
| --- | --- | --- |
| Herkunft | `beobachtung` (Landsat, GRWL) | `modell` + `berechnet` (MERIT-Basins) |
| Lücken | **ja**: Die Breite schwankt entlang eines Flusses (Engstellen, Schluchten, `width=0`). Eine Schwelle reißt Flüsse in Stücke | **nein**: Die Fläche wächst stromab nie. Eine Schwelle ergibt zusammenhängende Netze bis zur Mündung |
| Vorschlag Globus | ≥ 500 m | ≥ 100 000 km² |
| Vorschlag Kontinent | ≥ 200 m | ≥ 10 000 km² |
| Vorschlag Region | ≥ 100 m (alles ab 30 m ist in SWORD) | ≥ 1 000 km² |

- **Vorschlag:**
  - **Auswahl nach `facc_total`**, weil nur sie zusammenhängende Flüsse liefert.
  - **Breite** als Strichstärke und als gemessener Wert im Tooltip. Damit trägt die Auswahl ein Modell, die Darstellung eine Beobachtung, und beides steht in der Legende.
  - Wenn Max die Breite als Auswahl will, gilt die Auswahl „je ganzer Hauptlauf (`main_path_id`), wenn die Mündungsbreite ≥ Schwelle“. Das vermeidet die Lücken, ist aber eine zusätzliche Setzung.
- **Alle Schwellen** sind Setzungen (Regel 7). Wie viele Abschnitte sie je Stufe ergeben und wie groß die Dateien werden, ist **nicht gemessen**; das folgt nach dem Laden von Europa.
- **Grenzen:** Ziel bleibt unter 100 MB je Datei und wenige MB je geladener Ebene, Vereinfachung mit Toleranz im Manifest (Regel 11).
- **HydroRIVERS:** bleibt bei `ORD_FLOW` mit ≥ 1 000 / ≥ 100 / ≥ 10 m³/s, falls die Lizenz es erlaubt.

### B4. Bilanz vorerst für Kontinente

Die Bilanz P − E − R = ΔS (3.3) gilt zuerst nur für Kontinente. In der Legende steht als Setzung: „Mindestgröße 200 000 km² (GRACE-Auflösung etwa 300 km)“. Einzugsgebiete folgen erst, wenn eine Quelle für Wasserscheiden frei ist (HydroBASINS nach B1). Die Kontinentgrenzen selbst brauchen eine Quelle. Vorschlag: die Kontinentgebiete von SWORD (Pfafstetter-Ebene 1, Kennziffer im Dateinamen). Nicht geprüft, ob sie als Fläche vorliegen.

### B5. Geometrie `bahn`: Plan, nicht gebaut

**Was eine `bahn` ist:** eine Linie, die einen Strom trägt. Sie ist der Weg eines Formwechsels (etwa Abfluss Land → Ozean), kein eigener Bestand. Anders als `grenze` kann sie beobachtet sein (SWORD: Landsat-Mittellinien) oder abgeleitet (HydroRIVERS: aus dem Höhenmodell).

**`kern/schema.mjs`:**
- `SCHEMA_VERSION` von `'0.9.0'` auf `'0.10.0'`. Alle Adapter schreiben die Version aus der Konstante; es gibt keine fest eingetragene Zahl in Tests oder Manifesten.
- `GEOMETRIEN` um `'bahn'` erweitern.
- **Verzerrung:**
  - `MIT_VERZERRUNG`: `bahn` nicht aufnehmen, weil Flächenverzerrung für eine Linie nichts sagt.
  - Stattdessen neue Konstante `MIT_LAENGENVERZERRUNG = ['bahn']`: Pflicht ist `wo.verzerrung.laenge`, das Verhältnis der Länge nach Vereinfachung zur Länge in der Quelle (Regel 10).
- **Typ `Wo`, neue Felder für `bahn`:**
  - `traegt`: ID eines Prozesses, dessen Strom die Bahn führt.
  - `richtung: 'stromab'`: Reihenfolge der Koordinaten.
  - `vereinfachung`: `{toleranz_m, punkte_quelle, punkte_gezeigt}` oder `fehlt`, wenn nicht vereinfacht.
- **Kommentarblock** wie bei `grenze`: „`bahn` trägt einen Strom; sie ist Weg eines Formwechsels, nie ein Bestand.“
- `NAEHERUNG_VERTRITT` bleibt (`linie` = ein Punkt vertritt eine Linie). Es ist zu prüfen, ob `linie` dort in `bahn` umbenannt werden soll; das wäre eine zweite Änderung, nicht nötig.

**`kern/pruefe.mjs`**, neuer Block neben `wo?.geometrie === 'grenze'`:
- `traegt` fehlt oder verweist auf keinen Prozess im Graphen → Fehler (Regel B).
- Der getragene Prozess hat keinen Zufluss bzw. Ausgang der Art `stoff` → Fehler (eine Bahn trägt Stoff).
- `richtung` fehlt → Fehler.
- `verzerrung.laenge` ist weder Zahl noch `fehlt` → Fehler (Regel 10).
- `vereinfachung` fehlt ganz → Fehler (Regel 11: Vereinfachung immer angeben, auch „keine“).
- Stapel nicht `1.1` → Fehler. Flüsse, Meeresströme und Jetstreams liegen im Erdsystem; Warenwege (2. Natur) bekämen eigene Regeln.
- Ist die Bahn abgeleitet (`woher.arten` enthält `berechnet`), ist `woher.abgeleitet_aus` Pflicht, wie bei `grenze`.
- Die Manifestprüfung (Zeile 660, `GEOMETRIEN.includes`) kennt `bahn` dann von selbst.

**Tests** (`kern/test/regeln.test.mjs`):
- **Ein gültiges Beispiel** im Testgraphen: Bahn mit Prozess „Abfluss Land → Ozean“, Verzerrung, Vereinfachung.
- **Negativfälle** in der Tabelle der Verstöße: ohne `traegt`; `traegt` auf unbekannten Prozess; Prozess ohne Stoffstrom; ohne `richtung`; ohne `verzerrung.laenge`; ohne `vereinfachung`; in Stapel 1.3; abgeleitet ohne `abgeleitet_aus`.
- **Mit dem ersten Adapter** `fluesse`: eigener Test `fluesse.test.mjs` mit vier Prüfungen:
  - Jede Bahn trägt den Abfluss-Prozess.
  - Die Zahl gezeigter und nicht gezeigter Abschnitte steht im Manifest und stimmt mit den Rohdaten.
  - Über der Schwelle geht kein Abschnitt verloren.
  - Die Größen bleiben unter den Grenzen.

### B6. „Pegel“ heißt „Abfluss (Modell)“

- **Im künftigen Adapter `fluesse`:**
  - **Punkte:** an den Mündungen der gezeigten Netze (Abschnitte ohne Nachbarn stromab), ausgewählt nach derselben Schwelle wie das Netz; die Liste `data/pegel.json` entfällt.
  - **Wert je Punkt:** Abfluss aus GloFAS über Open-Meteo, Herkunft `modell`; Vorhersagetage `erwartung` mit Träger „GloFAS (Copernicus)“.
- **Leiste:** Der Eintrag heißt vorerst „Flüsse und Pegel“, bis der Adapter steht. Die Umbenennung kommt mit dem Bau, damit Name und Inhalt zusammenpassen.
- **Schon korrigiert:** die Herkunft in `EBENEN_HERKUNFT` (siehe Bericht Seitenleiste).

### B7. Zeit: Flussnetz nur in seiner Bezugszeit

- Das Netz gilt für die Gegenwart: SWORD-Breiten aus der Landsat-Zeit, SWOT-Werte ab 2023, HydroRIVERS mit Bezug 2000.
- **Vor 1900 CE:**
  - Die Ebene zeichnet nichts.
  - Die Statuszeile zeigt „fehlt: kein Flussnetz für diese Zeit; das Netz gilt für die Gegenwart, eine Rekonstruktion gibt es als Quelle nicht (Regel 12)“.
  - Die Takt-Leiste zeigt die Abdeckung ab 1900.
- **Die Grenze 1900** ist eine Setzung und steht so in Legende und Manifest. Sie ist kein Datum der Quelle.
- **Zwischen 1900 und heute** läuft das Netz unverändert mit. Die Legende sagt „Lage Stand Gegenwart; Laufänderungen seit 1900 (Begradigung, Stauseen) nicht enthalten“.

### B8. Wickert 2016: Lizenz und Format

- **Daten:** DOI 10.13020/D6D01H, Data Repository for the University of Minnesota (DRUM), Handle 11299/182076, veröffentlicht 2016.
- **Lizenz** laut DataCite-Metadaten (Abruf 2026-11-11): „Attribution-ShareAlike 3.0 United States“ (CC BY-SA 3.0 US).
  - **Folge:** Weitergabe erlaubt, aber abgeleitete Dateien in `data/` müssten unter derselben Lizenz stehen (Share-Alike). Das ginge für eine eigene Datei mit Vermerk, passt aber nicht zu CC-BY-Dateien, wenn beides in einer Datei gemischt wird.
- **Format** laut Beschreibung:
  - Abflüsse als NumPy-Binärdateien;
  - Einzugsgebiete als Shapefiles;
  - Bilder und Videos je Eismodell.
  - Fünf Rekonstruktionen von Eisschild und GIA, also fünf Ideale (Regel 13).
  - In den Bildern sind Flüsse ab 1 000 m³/s lokalem Abfluss gezeichnet.
- **Größe und Dateiliste:** **nicht geprüft**. Die Seite conservancy.umn.edu antwortet automatischen Abrufen mit 403. Ich habe das nicht umgangen. Max müsste die Seite im eigenen Browser öffnen, oder ich sehe im App-Browser nach, wenn Max das will.
- **Herkunft:** `modell` + `berechnet` (aus Eis-, GIA- und Höhenmodellen). Nur Nordamerika, LGM bis heute.

### B9. Niederschlag und Verdunstung

- **Niederschlag:** ERA5 (`modell`) und GPM IMERG Final V07 (`beobachtung` + `modell`) als zwei Felder nebeneinander, keines bevorzugt (Regel 13). In der Bilanz erscheinen beide als je eigene Zeile, also zwei Reste.
- **Verdunstung:** nur ERA5. GLEAM bleibt weg; in der Legende steht „zweite Quelle für Verdunstung fehlt: GLEAM nicht eingebunden, Weitergabe ungeklärt“.
- **Zugänge:** ERA5 über die CDS-API (Konto), IMERG über Earthdata (Login). Beide brauchen ein Konto von Max; ich lege keines an.

### B10. Grundwasser als Form „Boden und Grundwasser“

- **Heute:** Den Bestand Wasser gibt es nur im Adapter `sintflut` (`sintflut/wasser`, Formen Eis und Ozean).
- **Ziel:** ein gemeinsamer Bestand **Wasser** mit den Formen Ozean, Eis, Seen, Flüsse, **Boden und Grundwasser**, Wasserdampf.
- **Vorschlag:**
  - Ein kleiner Adapter `wasser` legt nur den Bestand und seine Formen an. Ein Form-Eintrag ohne Daten steht als `fehlt` mit Grund.
  - `sintflut` verweist mit seinen Formen Eis und Ozean darauf, statt einen eigenen Bestand zu führen.
  - Die Form „Boden und Grundwasser“ bekommt zwei Einträge nebeneinander (Regel 13):
    - ISIMIP `groundwstor` (`modell`, mm, 0,5°, monatlich);
    - GROW (`beobachtung`, Brunnen, Tiefe in m).
- **Was nicht geht:** Eine Differenz in Metern gibt es nicht; das steht in `kern/BERICHT-grundwasser.md`. Die Umrechnung über die speichernutzbare Porosität liefert keine der Quellen, also kein Ersatz (Regel 12).
- **Zu klären vor dem Bau:**
  - Darf ein Bestand aus einem Adapter in einem anderen Adapter Formen bekommen?
  - Oder prüft `pruefe.mjs` nur innerhalb eines Graphen?
  - Der Glottolog-Adapter und `stoffwechsel` verweisen schon über Adaptergrenzen. Dort sehe ich zuerst nach.

### B11. Wasserentnahme als Zufluss aus 1.1 in den gesellschaftlichen Stoffwechsel

**Anschluss:** Der Prozess je Land aus `kern/adapter/stoffwechsel` bekommt einen Zufluss:
- `von`: Bestand Wasser, Form Süßwasser an Land;
- `herkunftsstapel: '1.1'`, `art: 'stoff'`;
- Menge: Wasserentnahme in km³/Jahr (= 10⁹ m³/Jahr), nach Sektor (Landwirtschaft, Industrie, Gemeinden).

**Die UN-SDG-Datenbank** diente nur als Wegweiser: Verwahrer von SDG 6.4.1/6.4.2 ist die FAO (AQUASTAT), von 8.4/12.2 die UNEP (IRP). Geprüft wurde direkt bei diesen beiden.

#### FAO AQUASTAT

- **Zugang:**
  - Offene Abfrage-Schnittstelle ohne Schlüssel: `api.data.apps.fao.org/api/v2/bigquery` mit der veröffentlichten SQL-Abfrage des Katalogeintrags „AQUASTAT Dissemination System“.
  - Parameter: Land, Variable, Jahre, Typ (Land oder Aggregat). Antwort: CSV.
  - Eine Probeabfrage ging durch (HTTP 200).
- **Spalten:** Variable, Land, M49-Code, Jahr, Wert, Einheit, **Symbol** und **SymbolDescription**.
- **Abdeckung** laut Schema (Stand 2024-01-23):
  - 229 Variablen, 235 Gebiete, Jahre 1964–2024.
  - Ältere Werte meist in Fünfjahresschritten, die SDG-Werte jährlich.
- **Variablen** (Auswahl):

| Code | Variable |
| --- | --- |
| 4253 | Total water withdrawal |
| 4250 | Agricultural water withdrawal |
| 4251 | Municipal water withdrawal |
| 4252 | Industrial water withdrawal |
| 4263 | Total freshwater withdrawal |
| 4261, 4262 | Fresh surface / groundwater withdrawal |
| 4550 | SDG 6.4.2. Water Stress |
| 4551 | SDG 6.4.1. Water Use Efficiency |

- **Kennzeichen** in der Probe (Deutschland, Indien):
  - **A** „Official value“ → `beobachtung` + `kuratiert`;
  - **E** „Estimate either calculated as sum or identify (yield) from official values or from an AQUASTAT estimation“ → `modell` + `berechnet`;
  - **I** „Imputed (carry forward …)“ → `modell` (fortgeschrieben). Wie bei FAOSTAT: Herkunft je Wert aus dem Kennzeichen.
  - Weitere Kennzeichen sind möglich; die volle Liste ist nicht geprüft.
- **SDG 6.4.2 (Wasserstress)** ist ein Verhältnis (Entnahme / verfügbare erneuerbare Ressource) und kein physischer Fluss. Er gehört als abgeleitete Größe in die Flussansicht, nicht als Zufluss.
- **Lizenz: widersprüchlich.**
  - **FAO Statistical Database Terms of Use** (fao.org/contact-us/terms/db-terms-of-use, geprüft 2026-11-11): Unless specified otherwise, datasets „are licensed under the Creative Commons Attribution-4.0 International licence“. Weiter: „You may access, download, create copies, adapt and re-disseminate datasets subject to these Database terms.“
    - Zusatzbedingungen: keine Werbung für ein kommerzielles Unternehmen; Daten Dritter „may not be redistributed or reused without the consent of the original data provider“.
    - Zitierform: „FAO. [Jahr]. [Datenbank]. … Licence: CC-BY-4.0“.
  - **Die AQUASTAT-Metadaten** verweisen auf diese Bedingungen.
  - **Aber:** Der FAO-Datenkatalog (data.apps.fao.org/catalog, Eintrag `aquastat-ds`, Abruf 2026-11-11) führt das „AQUASTAT Dissemination System“ unter „Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International“.
  - **Folge:** Nach den Datenbankbedingungen gilt CC BY 4.0, „sofern nicht anders angegeben“. Der Katalog gibt etwas anderes an. Mit NC-SA müssten abgeleitete Dateien in `data/` unter CC BY-NC-SA stehen.
  - **Vorschlag:** bei aquastat@fao.org nachfragen (Adresse aus einem Datenverzeichnis; vor dem Absenden auf fao.org prüfen). Bis dahin nicht einbinden.

#### UNEP IRP Global Material Flows Database

- **Zugang:**
  - Datenportal `unep-irp-resourcepanel.resource-use.global`, in die Seite resourcepanel.org eingebettet.
  - Ohne Anmeldung; ein freiwilliges Formular fragt nach Name und Zweck.
  - **Export:** Der vollständige Datensatz der vier Hauptkategorien liegt unter `/mfa4/export` als `mfa4_export.csv`, **7,7 MB** (Header geprüft, nicht geladen), zuletzt geändert 2024-02-27.
  - Daneben gibt es Ansichten mit 13 Kategorien (`mfa13`) und Summen und Kennzahlen. Deren Exportgrößen sind nicht geprüft.
  - Feiner aufgeteilte Daten gibt es nur auf Anfrage beim Sekretariat, laut IRP-Seite eventuell gegen Gebühr.
- **Abdeckung:** Ausgabe 2024, 1970–2024, „more than 200 countries and regions“.
- **Größen** (technischer Anhang, Tabelle 1):
  - DE (Inlandsentnahme), IM, EX, DMI, PTB, **DMC** (Inlandsmaterialverbrauch);
  - RME der Importe und Exporte, **MF** (Material-Fußabdruck).
  - Das sind die Module 1 und 2 des UNEP-Rahmens. Abfälle, Emissionen und Lagerzuwachs (Module 3, 4) fehlen.
- **Herkunft** (technischer Anhang):
  - **DE:** zum großen Teil eigene Schätzungen aus Primärquellen. Bei Metallerzen z. B. 43 % der Datenpunkte „Own estimation based on WMD“, 20 % „based on BGS“.
  - **Späte Jahre:** Werte ab etwa 2020 sind **fortgeschrieben** („projection“, mit Bezug zum BIP-Wachstum). Der Anhang rät, für statistische Zwecke nur bis 2019 zu nutzen.
  - **MF und RME:** aus einem multiregionalen Input-Output-Modell, also `modell` + `berechnet`.
  - **Einordnung:** DE `kuratiert` + `modell`, fortgeschriebene Jahre `modell` (Hochrechnung der Quelle, nicht von zeroearth; Regel 12 bleibt gewahrt, solange wir sie nur zeigen und kennzeichnen).
  - Das Portal sagt nur pauschal „Some of the data points are estimated“. Ob der Export ein Kennzeichen je Wert hat, ist **nicht geprüft**.
- **Lizenz:** **nirgends genannt**, weder auf der Seite noch im Portal noch im technischen Anhang. Verlangt ist nur die Zitierform: „United Nations Environment Programme, International Resource Panel, Global Material Flows Database“. Ohne Lizenz ist die Weitergabe abgeleiteter Dateien ungeklärt.
  - **Vorschlag:** beim IRP-Sekretariat nachfragen. Bis dahin nicht einbinden.
- **Verhältnis zu Eurostat:** Für die EU haben wir schon die amtliche MFA (Eurostat, eingebunden). IRP käme für die übrigen Länder dazu, als zweite Quelle für die EU nebeneinander (Regel 13), nicht als Ersatz.
- **Anschluss:** DE wäre der Zufluss aus 1.1/1.2 in den Prozess je Land; MF und DMC sind Kennzahlen des Prozesses.

## Offen, zur Entscheidung

Die zwölf Fragen vom 2026-11-10 sind entschieden (siehe „Stand“). Neu:

1. **SWORD Europa laden** (`sword_EU_v17c_reaches.parquet`, 100,1 MB per Range aus Zenodo, CC BY 4.0) nach `~/ZeroEarth/rohdaten/sword/v17c/`, um die Auswahl zu messen?
2. **Auswahlkriterium SWORD:** Einzugsfläche `facc_total` (zusammenhängend, aber Modell) oder Breite `width` (gemessen, aber mit Lücken; dann je ganzer Hauptlauf)?
3. **Schwellen:** ≥ 100 000 / 10 000 / 1 000 km² bzw. ≥ 500 / 200 / 100 m, als Setzung?
4. **Geometrie `bahn`:** Plan wie in B5 so bauen (Schema 0.10.0, Längenverzerrung statt Flächenverzerrung, Stapel nur 1.1)?
5. **Gemeinsamer Bestand Wasser:** als eigener kleiner Adapter `wasser`, auf den `sintflut` verweist (B10)?
6. **AQUASTAT-Lizenz:** Soll ich eine Anfrage an die FAO entwerfen (CC BY 4.0 nach den Datenbankbedingungen gegen CC BY-NC-SA 4.0 im Katalog)?
7. **IRP-Lizenz:** Soll ich eine Anfrage an das IRP-Sekretariat entwerfen? Und darf ich `mfa4_export.csv` (7,7 MB) zur Prüfung der Kennzeichen nach `~/ZeroEarth/rohdaten/irp/` laden?
8. **Wickert 2016:** Dateiliste und Größe im App-Browser nachsehen (die Seite sperrt automatische Abrufe)? Mit der Lizenz CC BY-SA 3.0 US als eigene Datei mit eigenem Vermerk?
9. **Konten für ERA5 (CDS) und IMERG (Earthdata):** Legt Max sie an, oder warten diese Felder?
