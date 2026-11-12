# Bericht: Biosphäre (Ideal, Beobachtung, Geschichte)

Erste Fassung: 2026-11-12, Branch `struktur`. **Nur Prüfung:** kein Code, keine Daten, kein Download von Datensätzen. Geladen habe ich nur Dokumentation in den Scratchpad, nicht ins Repo: die ISLSCP-II-Beschreibung (PDF, 0,24 MB), die Bedingungen von CCI Biomass (PDF, 1 Seite) und den Volltext von Erb et al. 2018 über Europe PMC (XML).

**Grenzen dieses Berichts:**
- Alle Lizenzen am **2026-11-12** geprüft: auf den Seiten der Anbieter, in den Metadaten (Dataverse-API, Zenodo-API, DataCite, NASA CMR) oder in den Bedingungen selbst.
- Größen stehen so da, wie die Anbieter sie nennen. Was nicht genannt ist, steht als **unbekannt**.
- Rohdaten kämen nach `~/ZeroEarth/rohdaten/<quelle>/`, nie ins Repo.

**Auftrag:**
1. SAGE „Global Potential Vegetation“ als Idealschicht für 1.2 prüfen, mit Lizenz, Einordnung, Gegenstück für die Differenz und Nachfolgern (HYDE, EarthStat).
2. Nachtrag:
   - **Ideal:** Hengl 2018, Erb 2018.
   - **Beobachtung:** WorldCover, CCI Biomass.
   - **Geschichte:** HYDE 3.4, Anthromes 12K.
   - **Gliederung:** RESOLVE 2017.
   - **Je Quelle:** Stapel, Ideal oder Beobachtung, mögliche Differenz.
   - **Anthromes:** ein Vorschlag zur Verortung.

## 0. Ausgangslage im Repo

- **Ebene `unterbau`** („Biosphäre / Lebensnetz“, 1.2): Sie zeigt GBIF-Funde aus `data/unterbau.json`. Die Datei fehlt, der Konverter auch.
- **Ordner „Biomasse“** steht seit heute in der Biosphäre, mit dem Status `fehlt`.
- **HYDE:** `index.html` kennt `hyde_pop` („Bevölkerung (HYDE 3.2)“) nur als geplante Ebene, ohne Datei.
- **Rohdaten:** In `~/ZeroEarth/rohdaten/` liegt nichts zu Vegetation, Landbedeckung oder Landnutzung.
- **Strukturstand** (nur gelesen):
  - 1.2 sind „die Beziehungen zwischen Lebewesen: Abstammung, Fressen, Bestäuben, Symbiose“.
  - Biomasse als stofflicher Bestand gehört dort nach 1.1.
  - Ein Biom ist eine Lebensgemeinschaft. In 1.2 passt es als Ort der Beziehungen, nicht als Bestand (siehe Frage 1).

## 1. Überblick

| Quelle | Was | Stapel (Vorschlag) | Ideal / Beobachtung | Lizenz | Weitergabe in `data/` | Zugang | Größe |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SAGE Potential Vegetation (Ramankutty & Foley 1999) | 15 Biome, 5′ und 0,5° | 1.2 | Ideal | **keine genannt** | ungeklärt | frei, ohne Konto | 0,7 MB (NetCDF-Paket) |
| ISLSCP II Potential Natural Vegetation (NASA-Kopie desselben Datensatzes) | 15 Biome, 0,5° und 1° | 1.2 | Ideal | NASA Earth Science Data Policy (offen) | **ja** | Earthdata-Konto | 0,57 MB (0,5°) |
| Hengl et al. 2018 PNV | 20 Biome (BIOME 6000), 1 km; Wahrscheinlichkeit je Biom | 1.2 | Ideal | **widersprüchlich:** CC0 (Dataverse, 1 km) / CC BY-SA 4.0 (Zenodo, 250 m) | ja (bei CC BY-SA mit Weitergabe unter gleicher Lizenz) | frei, ohne Konto | Klassenkarte 23,9 MB; je Biom 22–111 MB |
| Erb et al. 2018 | potenzielle und tatsächliche Biomasse | 1.1 | Ideal und Beobachtung | — | — | **Karten nicht veröffentlicht** | — |
| ESA WorldCover 2020 / 2021 | 11 Klassen Landbedeckung, 10 m | 1.2 (Vegetation) | Beobachtung | CC BY 4.0 | ja | frei | 124,0 GB (2021) |
| MODIS MCD12C1 v061 (zusätzlich vorgeschlagen) | IGBP-Klassen und Anteil je Klasse, 0,05°, jährlich | 1.2 | Beobachtung | NASA, ohne Einschränkung | ja | Earthdata-Konto | 1 187 MB je Jahr |
| ESA CCI Land Cover / C3S (zusätzlich) | 22 Klassen, 300 m, 1992 bis heute | 1.2 | Beobachtung | ESA CCI licence: frei „for educational and/or scientific purposes“ | **ungeklärt** | CDS-Konto | unbekannt |
| ESA CCI Biomass v6 (v7 ist neuer) | oberirdische Waldbiomasse, 100 m; Aggregate 1–50 km | 1.1 | Beobachtung (aus Satellit mit Modell) | eigene Bedingungen: „any user for any purpose“ | ja | offen, ohne Konto | 651 GB (v6, alles) |
| HYDE 3.4 (Klein Goldewijk) | Acker, Weide, Bevölkerung; 10 000 BCE – 2024 CE, 5′ | Geschichte (siehe 5) | Rekonstruktion | CC BY 4.0 | ja | frei | unbekannt |
| EarthStat Cropland & Pasture 2000 | Acker- und Weideanteil, 5′ | Geschichte (Stand 2000) | Rekonstruktion | eigene: Weitergabe **nur mit Erlaubnis** | **nein** ohne Erlaubnis | frei | 18,8 MB |
| Anthromes 12K DGG (Ellis et al. 2021) | Anthrome je Gitterzelle, 10 000 BCE – 2015 CE | Vorschlag 1.3 (siehe 6) | Rekonstruktion (Klassifikation aus HYDE 3.2) | CC0 1.0 | ja | frei | 3,0 GB (alles); 332,6 MB je Unsicherheitsstufe |
| RESOLVE Ecoregions 2017 (Dinerstein et al.) | 846 Ökoregionen, 14 Biome, 8 Reiche | 1.2 (Gliederung) | weder noch: kuratierte Gliederung | CC BY 4.0 | ja | frei | 143–150 MB (ZIP, nach Dritten) |

## 2. Ideal

### 2.1 SAGE Global Potential Vegetation (Ramankutty & Foley 1999)

- **Zugang:** SAGE-Seite (sage.nelson.wisc.edu), ohne Konto.
  - `potveg_nc.tar.gz` (728 K): NetCDF in 5′ und 0,5°.
  - `glpotveg_5min.asc.gz` (520 K): ArcInfo-ASCII in 5′.
- **Lizenz: keine.** Die Seite sagt nichts zu Nutzung, Weitergabe oder Lizenz. Sie nennt nur die Zitierung und den Hinweis, der Datensatz sei „meant to be used only for continental to global scale applications“. Daneben steht der Seiten-Copyright-Vermerk der University of Wisconsin. Ein „freely download“ habe ich auf der heutigen Seite nicht gefunden. Ohne Lizenz ist die Weitergabe in `data/` nicht geklärt.
- **Ausweg ohne Anfrage: dieselben Daten bei der NASA.**
  - **Datensatz:** „ISLSCP II Potential Natural Vegetation Cover“ (Ramankutty & Foley 2010, ORNL DAAC, doi:10.3334/ORNLDAAC/961).
  - **Inhalt:** Laut Beschreibung derselbe Datensatz. Er ist nur an die Land-Wasser-Maske von ISLSCP II angepasst. Die geänderten Zellen stehen in eigenen Dateien (`potential_veg_diffs_*.asc`).
  - **Format:** 0,5° (720 × 360, 0,57 MB) und 1° (0,14 MB), ArcGIS-ASCII. **Kein 5′.**
  - **Lizenz:** Laut NASA-CMR gilt die „Data Use Policy“ der NASA Earth Science; NASA-Daten sind offen und ohne Einschränkung nutzbar. Die in den Metadaten verlinkte Seite der Richtlinie gibt heute einen 404-Fehler zurück. Die Aussage „openly shared, without restriction“ stammt von LP DAAC und den EOSDIS-Richtlinien, nicht aus dem Datensatz selbst.
  - **Zugang:** Die Datendateien liegen unter `protected/`, brauchen also ein Earthdata-Konto. Die Prüfsummen sind frei.
- **Klassen:** 15 Biome plus Wasser (0) und „keine Daten über Land“ (16).
  - **Wald (1–8):** Tropischer immergrüner, Tropischer laubwerfender, Gemäßigter immergrüner Laub-, Gemäßigter immergrüner Nadel-, Gemäßigter laubwerfender, Borealer immergrüner, Borealer laubwerfender Wald/Waldland; Mischwald.
  - **Offen (9–15):** Savanne, Grasland/Steppe, dichtes Buschland, offenes Buschland, Tundra, Wüste, Polarwüste/Fels/Eis.
- **Herkunft: nicht reines Modell.** Hier muss ich die Annahme im Auftrag korrigieren: Laut ISLSCP-Beschreibung ist der Datensatz kein Ergebnis von IBIS. Er ist aus zwei Teilen zusammengesetzt; ob IBIS ihn als Eingabe nutzt, habe ich nicht geprüft.
  - **Satellitenteil (`beobachtung`):** Wo der Mensch nicht dominiert, kommt die Klasse aus der Satelliten-Landbedeckung DISCover (Loveland et al. 2000, AVHRR 1 km, April 1992 – März 1993). Bedingung: In der 5′-Zelle hat mindestens 20 % „Restvegetation“ einen gemeinsamen Typ.
  - **Modellteil (`modell`):** Wo Landnutzung dominiert, kommt die Klasse aus dem Biommodell von Haxeltine & Prentice (1996, BIOME3).
  - **Regeln (Setzungen der Autoren):** Klimazonen nach Mindesttemperatur und Gradtagen (Daten von Bartlein bzw. Cramer & Leemans). Einige Zellen im Ozark-Plateau sind von Hand umgestellt.
  - **Ergebnis für die Herkunft nach Regel 6:** `beobachtung`, `modell`, `idealisiert`, `kuratiert` (Klassenzuordnung und Schwellen). Angezeigt wird das Unsicherste, also Modell mit dem Merkmal idealisiert. Welche Zelle aus welchem Teil stammt, **steht nicht in den Daten**. Das bleibt `fehlt` mit Grund.
- **Zeit: Es ist kein vorindustrieller Zustand.** Die Autoren definieren die potenzielle Vegetation als Vegetation, „that would most likely exist now in equilibrium with present-day climate and natural disturbance, in the absence of human activities“.
  - **Bezugszeit:** Gegenwart, genauer das Klima der Eingabedaten und die Satellitenzeit 1992/93.
  - **Ausdrücklich nicht:** „vor dem Menschen“. Die Autoren warnen selbst: Wiederbewaldung im Osten der USA und unterdrückte Brände sieht der Satellit als „natürlich“.
- **Vorschlag für die Legende** (Setzung, Regel 7): „Potenzielle natürliche Vegetation: heutiges Klima ohne Landnutzung (Ramankutty & Foley). Kein früherer Zustand. Wo der Mensch nicht dominiert, ist sie aus Satellitendaten 1992/93 abgeleitet, sonst aus einem Biommodell.“
- **Folge für die Differenz (Zirkel):** Wo der Mensch 1992/93 nicht dominierte, ist das Ideal selbst Beobachtung. Eine Differenz zu einer späteren Beobachtung zeigt dort nur Wandel seit 1993 oder den Unterschied zwischen den Klassensystemen, keine Landnutzung. Das gehört als Satz in die Legende.

### 2.2 Hengl et al. 2018, PNV-Biome

- **Quelle:** Hengl, Walsh, Sanderman, Wheeler, Harrison & Prentice (2018), PeerJ 6:e5457.
- **Daten:**
  - Harvard Dataverse, doi:10.7910/DVN/QQHCIK, Fassung 4.0 vom 2018-04-04: 1 km, 148 Dateien, 10,79 GB, darunter FAPAR-Karten. Für die Biome: Klassenkarte `pnv_biome.type_biome00k_c_1km…tif` (23,9 MB), Wahrscheinlichkeit je Biom (20 Dateien, 22–111 MB), Fehlerkarte `…_sse_…` (117,7 MB).
  - Eine Fassung in 250 m liegt bei OpenLandMap. Der Zenodo-Eintrag 10.5281/zenodo.10513520 enthält nur die Trainingspunkte (6,8 MB).
- **Lizenz: widersprüchlich.**
  - **Dataverse (1 km):** „This dataset is made available under a Creative Commons CC0 license with the following additional/modified terms and conditions:“. Danach folgt **kein** weiterer Text.
  - **Zenodo-Eintrag (250 m):** `cc-by-sa-4.0`.
  - Max nennt CC BY-SA 4.0. Für die Fassung in 1 km sagt der Dataverse-Eintrag aber CC0.
  - **Folge:** Bei CC BY-SA müsste, was wir daraus ableiten und in `data/` legen, unter CC BY-SA stehen. Vor einem Bau klären (Frage 3).
- **Herkunft:** `modell` (Random Forest u. a.), trainiert an 8 057 heutigen Pollenproben (BIOME 6000, `rekonstruktion`), mit Relief und Klima der letzten 20+ Jahre als Eingabe. Merkmal `idealisiert`. Der Dateiname nennt „2000..2017“.
- **Zeit:** Vegetation im Gleichgewicht mit dem heutigen Klima, ohne Menschen. Bezugszeit wie bei SAGE die Gegenwart. **Ohne Antarktis.**
- **Unsicherheit:** Es gibt Wahrscheinlichkeit je Biom und eine Fehlerkarte. Damit lässt sich die Unsicherheit zeigen (Regel 11), was SAGE nicht kann.
- **Regel 13:** SAGE (15 Klassen) und Hengl (20 Klassen) sind zwei Ideale derselben Sache mit verschiedenen Klassensystemen. Beide werden gezeigt, nebeneinander. Wo sie sich widersprechen, ist das selbst eine Aussage.

### 2.3 Erb et al. 2018, potenzielle und tatsächliche Biomasse

- **Quelle:** Erb et al. (2018), Nature 553, 73–76, doi:10.1038/nature25138. Ergebnis: tatsächlich ~450 PgC, potenziell ~916 PgC, „under current climate conditions“.
- **Daten: nicht veröffentlicht.**
  - **Aussage im Aufsatz** (Data availability, Europe PMC): Quelldaten gibt es nur für die Abbildungen. „Final results, data and maps will be made available at http://www.uni-klu.ac.at/socec“; alles Weitere „upon request“.
  - **Stand:** Das Institut für Soziale Ökologie ist inzwischen an der BOKU. Eine Seite mit den Karten habe ich nicht gefunden.
- **Herkunft, falls je verfügbar:**
  - **Potenziell:** `modell` + `idealisiert`.
  - **Tatsächlich:** aus mehreren Fernerkundungs- und Inventurdatensätzen zusammengeführt, also `beobachtung` + `modell` + `kuratiert`. Die Spannweite über die Datensätze gibt der Aufsatz an.
- **Stapel:** 1.1 Biomasse (Bestand), nicht 1.2.
- **Was ginge:** eine Anfrage an die Autoren (nicht entworfen, Frage 4).

## 3. Beobachtung (Gegenstück für die Differenz)

### 3.1 ESA WorldCover 2020 (v100) und 2021 (v200)

- **Lizenz:** CC BY 4.0, laut Zenodo, ESA und CEOS. ESA verlangt eine Quellenangabe auf Karten: „ESA WorldCover project / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium“ und ein Zitat des Datensatzes.
- **Zugang und Größe:**
  - **2021 (v200):** Zenodo 10.5281/zenodo.7254221, 18 Makrokacheln zu 60°, zusammen **124,0 GB**. Die größte ist N30W120 mit 19,6 GB.
  - **Andere Wege:** Kacheln zu 3° als COG über die ESA-Seite, AWS Open Data, Copernicus Data Space.
- **Klassen (11):** Bäume, Buschland, Grasland, Acker, bebaut, kahl/spärlich, Schnee/Eis, Wasser, krautige Feuchtgebiete, Mangroven, Moos/Flechten.
- **Herkunft:** `beobachtung` (Sentinel-1/2) + `modell` (Klassifikator). Bezugszeit 2020 bzw. 2021.
- **Eignung als Vergleichsseite: schwach.**
  1. **Klassen:** WorldCover unterscheidet nicht nach Klimazone. „Bäume“ ist nicht „Borealer Nadelwald“. Eine Differenz zu 15 Biomen bräuchte eine Zuordnung der Klassen. Die wäre eine Setzung (Regel 7) und müsste im Bild stehen.
  2. **Auflösung:** 10 m gegen 5′. Wir müssten auf Anteile je 5′-Zelle zusammenfassen (Regel 11). Dafür wären alle 124 GB zu laden.
  3. **Zwei Jahre:** 2020 und 2021 sind mit verschiedenen Algorithmen gerechnet. ESA warnt, dass Unterschiede zwischen beiden teils am Algorithmus liegen. Eine Änderungskarte geben sie nicht her.
- **Besser passend (zusätzlich geprüft): MODIS MCD12C1 v061.**
  - **Inhalt:** 0,05° (≈ 5,6 km, also nahe an 5′), jährlich ab 2001 bis heute, je Zelle die Hauptklasse **und der Anteil jeder Klasse**.
  - **Klassen:** IGBP mit 17 Klassen. SAGE ist aus DISCover gebaut, und DISCover verwendet ebenfalls IGBP-Klassen. Die Klassensysteme liegen also nah beieinander, eine Zuordnung bleibt trotzdem eine Setzung.
  - **Lizenz und Zugang:** NASA, „openly shared, without restriction“. Earthdata-Konto nötig. 1 187 MB je Jahr (HDF4).
- **Ebenfalls geprüft: ESA CCI Land Cover / C3S** (300 m, jährlich 1992 bis heute, CDS).
  - **Vorteil:** Die Reihe beginnt 1992, also zur Satellitenzeit von SAGE.
  - **Lizenz:** „ESA CCI licence (rev. 1)“: frei „for educational and/or scientific purposes“. Weitergabe nicht geregelt, Werbung nur nach Freigabe des Layouts.
  - **Weitergabe in `data/`:** ungeklärt.
  - **Zirkel:** HYDE 3.4 nutzt CCI Land Cover selbst zur Verteilung der Landnutzung (1992–2018). Ein Vergleich HYDE gegen CCI wäre deshalb zirkulär.

### 3.2 ESA CCI Biomass v6 (v7 ist neuer)

- **Datensatz:** CEDA, doi:10.5285/95913ffb6467447ca72c4e9d8cf30501.
  - **Inhalt:** oberirdische **Waldbiomasse** für 2007, 2010, 2015–2022, 100 m; Aggregate in 1, 10, 25 und 50 km.
  - **Umfang und Zugang:** 11 440 Dateien, 651 GB. Offen, ohne Konto.
  - **Status:** Der Eintrag ist als ersetzt markiert. v7 deckt 2005–2012 und 2015–2024 ab.
- **Bedingungen** (`esacci_biomass_terms_and_conditions_v2.pdf`; v7 verweist laut FedEO auf dieselbe Datei):
  - „may be used by any user for any purpose“, mit Nennung von ESA CCI, Biomass-CCI-Projekt und Datenlieferanten.
  - Rechte bleiben bei den Herstellern; keine Gewähr.
  - **Weitergabe** wird nicht eigens erwähnt. „Any purpose“ schließt sie nach meinem Lesen ein. Eine juristische Prüfung ist das nicht.
- **Herkunft:** `beobachtung` (SAR, Lidar) + `modell` (Rückrechnung auf Biomasse). Mit Fehlerkarte (Standardabweichung je Pixel).
- **Stapel:** 1.1 Biomasse. Für unsere Zwecke genügt das Aggregat in 10 oder 25 km; seine Größe ist auf der Seite nicht einzeln genannt.
- **Differenz:** gegen Erb „potenziell“ (1.1). Das geht erst, wenn Erbs Karten verfügbar sind. Und selbst dann gibt es einen **Rest**: CCI zählt nur oberirdische Waldbiomasse, Erb alle lebende Biomasse über und unter der Erde. Die Differenz wäre also nur für Wald und oberirdisch vergleichbar; der Rest muss sichtbar bleiben.

## 4. Gliederung: RESOLVE Ecoregions 2017

- **Quelle:** Dinerstein et al. (2017), BioScience.
- **Inhalt und Format:** 846 Ökoregionen in 14 Biomen und 8 biogeografischen Reichen, Shapefile.
- **Lizenz:** CC BY 4.0, laut Earth Engine, UNEP-WCMC und BIOPAMA. Die Seite von RESOLVE selbst habe ich nicht gesehen.
- **Größe:** 143 MB (ZIP) laut einem Download vom November 2024 (GitHub-Gist), sonst „~150 MB“. Nicht von RESOLVE selbst genannt.
- **Einordnung:** weder Ideal noch Beobachtung, eine **kuratierte Gliederung** (`kuratiert`).
  - **Bezugsrahmen:** Die Grenzen beschreiben, wo Lebensgemeinschaften ohne Landnutzung lägen. Sie sind also nah am Ideal, aber gezogen von Fachleuten, nicht gerechnet.
  - **Nutzen:** Rahmen für Summen und Vergleiche je Biom, etwa „Anteil Acker je Ökoregion“ aus HYDE.
  - **Stapel:** 1.2.
  - **Geometrie:** `flaeche`. Sie muss vereinfacht werden; die Flächenverzerrung wird gemessen (Regel 10).

## 5. Geschichte der Landnutzung

### 5.1 HYDE 3.4 (Klein Goldewijk, Universität Utrecht)

- **Datensatz:** „HYDE data for the Global Carbon Budget (2024)“, doi:10.24416/UU01-BV65K3, 2025. Laut Beschreibung „This HYDE version 3.4 replaces former HYDE 3.3 version“.
  - **Lizenz:** **CC BY 4.0** laut DataCite, mit SPDX-Kennung. Das gilt für die Daten selbst, nicht nur für den Artikel.
  - **Ältere Fassungen:**
    - HYDE 3.3 (vier DOIs, 2023–2024): ebenfalls CC BY 4.0.
    - HYDE 3.2 bei DANS: CC0.
- **Inhalt:**
  - **Acker:** bewässert und Regenfeldbau, Reis getrennt.
  - **Weide:** intensiv, umgewandeltes Weideland, natürliches Weideland.
  - **Bevölkerung:** gesamt, städtisch, ländlich, Dichte; bebaute Fläche.
  - **Raum und Zeit:** **10 000 BCE – 2024 CE**, 5′, ASCII-Grid und neu NetCDF.
- **Herkunft:** `rekonstruktion` + `modell` (Verteilung von Landesstatistik auf Zellen nach Regeln) + `kuratiert`. Für 1992–2018 verwendet HYDE die ESA-CCI-Landbedeckung zur Verteilung (siehe Zirkel in 3.1).
- **Unsicherheit:** HYDE 3.3 gab es in mehreren Fassungen (vier DOIs). Ob es Unter- und Oberschätzungen wie bei 3.2 gibt, ist für 3.4 nicht genannt.
- **Zugang:** Die Seite des Datenrepositoriums (public.yoda.uu.nl) zeigt eine Bot-Prüfung (Anubis). Ich habe sie nicht umgangen. **Die Größe ist deshalb unbekannt.** Die Angaben oben stammen aus den DataCite-Metadaten.
- **Nachfolge:** Die SAGE-Ackerreihe (Ramankutty & Foley 1999, 1700–1992) wird nicht fortgeführt. Als offene, laufend erneuerte Reihe zur Geschichte der Landnutzung ist HYDE der Nachfolger in der Sache. Ob HYDE die SAGE-Reihe als Eingabe nutzt, habe ich nicht geprüft.

### 5.2 EarthStat (Ramankutty et al. 2008, Monfreda et al. 2008)

- **Datensatz:** „Cropland and Pasture Area in 2000“, 5′, GeoTIFF 18,8 MB (laut EarthStat-Seite, über Dritte). Dazu Anbaufläche und Ertrag von 175 Kulturen um 2000.
- **Lizenz: eigene Bedingungen, keine offene Lizenz.** Nach den Metadaten frei für „research, study, or teaching“ mit Zitat. „Re-release“ oder Einbau in ein kommerzielles Produkt nur mit ausdrücklicher Erlaubnis (earthstat.data@gmail.com).
  - Data Basin nennt CC BY 3.0, die SEDAC-Kopien bei der NASA nennen „U.S. government works“ oder gar nichts. Diese Angaben widersprechen sich.
  - Die Seite earthstat.org selbst ließ sich nicht abrufen (Zertifikatsfehler). Den Wortlaut dort habe ich nicht gesehen.
- **Einordnung:** Ein einziger Zeitpunkt (2000), Teil der SAGE-Familie. Als Reihe ist HYDE besser. **Ich empfehle, EarthStat nicht zu nutzen**, solange HYDE dasselbe offen liefert.

## 6. Anthromes 12K DGG (Ellis et al. 2021)

- **Datensatz:** Harvard Dataverse, doi:10.7910/DVN/E3H3AK, Fassung 4.0 vom 2024-03-07.
  - **Lizenz:** **CC0 1.0**, gilt für die Daten selbst. Das R-Kompendium (doi:10.7910/DVN/6FWPZ9) ist ebenfalls CC0.
  - **Dateien:** `an12_dgg_baseline.csv`, `…_lower.csv`, `…_upper.csv` (je 332,6 MB), `an12_dgg_inputs.zip` (119,8 MB, Shapefile der Gitterzellen), `raw-data.zip` (848 MB, darin HYDE 3.2), `derived-data.zip` (1 033 MB). Zusammen 3,0 GB.
- **Inhalt:** Anthrome je Zelle eines flächentreuen diskreten Gitters, 10 000 BCE – 2015 CE.
  - **Herkunft:** Klassifiziert aus HYDE 3.2 (Bevölkerung, Landnutzung) mit Hilfsdaten.
  - **Klassen:** Siedlungen, Dörfer, Acker, Weideland, „kultiviert“, Wildnis. Die Klassennamen stehen im Kompendium, nicht in den Daten.
  - **Unsicherheit:** in drei Stufen (unten, Mitte, oben). Die Spannweite lässt sich zeigen (Regel 11).
  - **Nicht geprüft:** die Größe der Gitterzellen. Sie steht im Aufsatz.
- **Herkunft:** `rekonstruktion` (HYDE) + `kuratiert` (Klassen und Schwellen sind Setzungen von Ellis). Eine Beobachtung ist das nicht, ein Ideal auch nicht.

### 6.1 Vorschlag zur Verortung (keine Entscheidung)

Max fragt nach einer eigenen Kategorie zwischen 1.2 und dem gesellschaftlichen Stoffwechsel. Im Stapel liegt dazwischen schon eine Stelle: **1.3 Basis**. Der Strukturstand definiert sie als „die Bedingungen, unter denen sich Menschen als Lebewesen erhalten und fortpflanzen“, die vorgefundenen Reproduktionsverhältnisse.

Anthrome beschreiben genau das: wie dicht Menschen in einem Ökosystem leben und wie sie es nutzen. Die Kategorien heißen Dorf, Acker, Weideland, Wildnis.

**Vorschlag A (bevorzugt): Anthromes als Ebene in 1.3 Basis.**
- **Vorteil:** Keine neue Kategorie nötig. Die Stelle zwischen Biosphäre und gesellschaftlichem Stoffwechsel gibt es schon, und sie ist heute leer.
- **Querverweise:** in 1.2 Biosphäre auf das Ideal (welche Vegetation ohne Nutzung dort stünde) und im gesellschaftlichen Stoffwechsel auf HYDE (die Mengen Acker und Weide). Gebaut wie der Querverweis Hydrosphäre ↔ Kreisläufe.
- **Einwand:** „Vorgefunden“ beschreibt laut Strukturstand die Stellung zum Akteur. Anthrome sind zugleich Ergebnis früherer Nutzung, also im Stoffwechsel gemacht und später vorgefunden. Das ist kein Widerspruch zur Basis, gehört aber in die Legende.

**Vorschlag B: Anthromes als Relation, nicht als Ebene.**
- **Kern:** Ein Anthrom ist die Verbindung von Lebensgemeinschaft (1.2) und Nutzung (gesellschaftlicher Stoffwechsel) an einem Ort. Im Kern wäre es eine Relation von 1.2 nach gesellschaftlichem Stoffwechsel mit dem Anthrom als Modus, ähnlich wie Überlieferung bei Glottolog.
- **Vorteil:** Es entsteht keine neue Stelle in der Matrix.
- **Nachteil:** Auf der Karte muss die Relation trotzdem als Fläche erscheinen.

**Vorschlag C: neuer Ordner „Anthrome“ quer zu beiden.**
- **Bau:** wie der Ordner „Kreisläufe“, mit Einträgen in 1.2 und im gesellschaftlichen Stoffwechsel.
- **Nachteil:** Damit entstünde, was der Strukturstand vermeiden will: eine Kategorie neben der Matrix.

## 7. Wo eine Differenz Ideal – Beobachtung möglich ist (Regel 13)

| Ideal | Beobachtung | Stapel | Möglich? | Was als Rest sichtbar bleiben muss |
| --- | --- | --- | --- | --- |
| SAGE (15 Biome) und Hengl (20 Biome), nebeneinander | MCD12C1 (IGBP, Anteil je Klasse, 2001 bis heute) | 1.2 | **ja, mit Klassenzuordnung** (Setzung) | 1. Zuordnung der Klassen als Tabelle im Bild. 2. SAGE ist dort, wo der Mensch nicht dominiert, selbst Beobachtung 1992/93. 3. Unterschiede zwischen SAGE und Hengl. |
| SAGE und Hengl | WorldCover 2020/2021 | 1.2 | ja, aber teuer (124 GB) und grob (11 Klassen ohne Klimazone) | wie oben, dazu: kein Wandel zwischen 2020 und 2021 ablesbar (Algorithmus) |
| SAGE und Hengl | HYDE 3.4 (Acker- und Weideanteil) | 1.2 gegen Geschichte | **ja, als Anteil**: Wie viel des Bioms X ist heute Acker oder Weide? | Wiederbewaldung, Forstwirtschaft und Brandunterdrückung fehlen in HYDE. Diese Differenz zeigt nur Acker und Weide, nicht jede Veränderung. |
| Erb „potenziell“ | CCI Biomass, Erb „tatsächlich“ | 1.1 | **nein, solange Erbs Karten fehlen** | oberirdisch gegen gesamt, Wald gegen alle Vegetation |
| — | Anthromes | 1.3 (Vorschlag) | keine Differenz: weder Ideal noch Beobachtung, eine Klassifikation | Spannweite aus drei Stufen |
| — | RESOLVE | 1.2 | keine Differenz, nur Rahmen für Summen | — |

**Zur Klassenzuordnung (Regel 12):** Eine Tabelle, die SAGE-Biome den IGBP-Klassen zuordnet, ist eine Setzung, aber keine eigene Modellierung. Für SAGE haben die Autoren sie selbst veröffentlicht (Tabelle 1 der ISLSCP-Beschreibung, DISCover/OGE nach Biom). Die könnten wir übernehmen statt selbst zu setzen. Für Hengl gibt es keine solche Tabelle.

## 8. Anfrage an Navin Ramankutty

Entwurf: `kern/ANFRAGE-sage.md`. Er fragt nach Lizenz und Weitergabe der 5′-Fassung.

**Ob die Anfrage nötig ist**, hängt an Frage 2. Für 0,5° gibt es die NASA-Kopie, die offen weitergegeben werden darf. Dann braucht es keine Anfrage. Nur für 5′ bleibt SAGE die einzige Quelle.

## 9. Offen, zur Entscheidung

1. **1.2 und Biome:** Der Strukturstand definiert 1.2 über Beziehungen zwischen Lebewesen. Gehören Biomkarten (potenziell und beobachtet) als Ort dieser Beziehungen dorthin, oder als Landbedeckung eher nach 1.1? Ich ändere `docs/` nicht.
2. **Auflösung des Ideals:** 0,5° aus der NASA-Kopie (offen, Earthdata-Konto) oder 5′ von SAGE (Anfrage nötig)?
3. **Hengl:** Für 1 km gilt laut Dataverse CC0, für 250 m CC BY-SA 4.0. Nur die 1-km-Fassung verwenden, oder die Lizenzfrage bei den Autoren klären?
4. **Erb 2018:** eine Anfrage nach den Karten entwerfen (an das Institut für Soziale Ökologie, BOKU)? Ohne sie gibt es keine Differenz in 1.1.
5. **Vergleichsseite für 1.2:** MCD12C1 (Earthdata, 1,2 GB je Jahr, nahe Klassen), WorldCover (124 GB, CC BY 4.0) oder CCI Land Cover (CDS, Lizenz für Weitergabe ungeklärt, Zirkel mit HYDE)?
6. **CCI Biomass:** v6 oder v7? Welches Aggregat (10 oder 25 km)? Die Größe des Aggregats prüfe ich erst nach Freigabe am Dateiverzeichnis.
7. **HYDE 3.4:** Größe unbekannt, weil die Seite eine Bot-Prüfung zeigt. Willst du die Seite im eigenen Browser öffnen und mir die Dateiliste geben?
8. **EarthStat:** weglassen (Empfehlung) oder um Erlaubnis fragen?
9. **Anthromes:** Verortung A, B oder C (Abschnitt 6.1)?
10. **Legende SAGE:** Wortlaut aus 2.1 so übernehmen? Er sagt ausdrücklich „heutiges Klima ohne Landnutzung, kein früherer Zustand“.

## Quellen (geprüft 2026-11-12)

- SAGE: https://sage.nelson.wisc.edu/data-and-models/datasets/global-potential-vegetation-dataset
- ISLSCP II Potential Natural Vegetation Cover: doi:10.3334/ORNLDAAC/961; Beschreibung `1_potential_veg_doc.pdf` (ORNL DAAC); Metadaten NASA CMR C2784887174-ORNL_CLOUD
- Hengl et al. 2018: doi:10.7910/DVN/QQHCIK (Dataverse-API), doi:10.5281/zenodo.10513520, doi:10.7717/peerj.5457
- Erb et al. 2018: doi:10.1038/nature25138; Volltext Europe PMC PMC5756473
- ESA WorldCover 2021: doi:10.5281/zenodo.7254221 (Zenodo-API)
- MODIS MCD12C1 v061: doi:10.5067/MODIS/MCD12C1.061; NASA CMR C2484078896-LPCLOUD
- ESA CCI Land Cover: https://cds.climate.copernicus.eu/licences/satellite-land-cover
- ESA CCI Biomass v6: doi:10.5285/95913ffb6467447ca72c4e9d8cf30501; Bedingungen https://artefacts.ceda.ac.uk/licences/specific_licences/esacci_biomass_terms_and_conditions_v2.pdf
- HYDE 3.4: doi:10.24416/UU01-BV65K3; HYDE 3.3: doi:10.24416/UU01-67UHB4 u. a. (DataCite-API)
- EarthStat: Metadaten über ArcGIS Hub, UC Berkeley GeoData, Data Basin; earthstat.org nicht erreichbar (Zertifikat)
- Anthromes 12K DGG: doi:10.7910/DVN/E3H3AK, Kompendium doi:10.7910/DVN/6FWPZ9 (Dataverse-API)
- RESOLVE Ecoregions 2017: Earth Engine `RESOLVE/ECOREGIONS/2017`, UNEP-WCMC
