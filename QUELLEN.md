# QUELLEN

Was erreichbar ist, wo es in der Matrix liegt, unter welcher Lizenz, und ob es
Beobachtung oder Modell ist. Diese Unterscheidung ist nicht kosmetisch: Ein Messwert
und eine Projektion dürfen nie gleich aussehen (ZEIT_RAUM §0).

**Art:** `beobachtung` — gemessen oder erhoben · `rekonstruktion` — aus Proxydaten
abgeleitet · `modell` — gerechnet · `kuratiert` — von Hand zusammengetragen.

## In der Plattform

| Quelle | Was | Adresse | Auflösung | Art | Lizenz / Zugang |
|---|---|---|---|---|---|
| GEBCO 2025 | Bathymetrie, Topographie | `erste_natur/erdsystem` | 15″ | beobachtung | frei, Namensnennung |
| GFS (NOAA) | Wind, Wetter | `erste_natur/erdsystem` | 0,25° (Stufe 5) | beobachtung/Vorhersage | gemeinfrei |
| PaleoMIST 1.0 | Eisdicke, Paläotopographie | `erste_natur/erdsystem` | 1°, 33 Zeitschnitte 0–80 ka | rekonstruktion | frei |
| Spratt & Lisiecki | Meeresspiegelkurve | `erste_natur/erdsystem` | 1D-Zeitreihe | rekonstruktion | PANGAEA, CC BY |
| Scotese PALEOMAP | Paläogeographie-Texturen | `erste_natur/erdsystem` | Textur | rekonstruktion | MIT |
| Laskar et al. 2004 | Milanković-Parameter | `nullnatur/solar` | Zeitreihe | modell (Himmelsmechanik) | frei |
| NOAA SWPC | Sonnenwind | `planetarer_stoffwechsel/extern` | live | beobachtung | gemeinfrei |
| CelesTrak TLE | Satellitenbahnen | `zweite_natur/konstruierte_wirklichkeit` | live | beobachtung | frei |
| USGS | Seismik | `erste_natur/erdsystem` | live | beobachtung | gemeinfrei |
| NASA GIBS (VIIRS True Color) | Satellitenbild des Tages | `erste_natur/erdsystem` | 250 m, täglich | beobachtung | frei, Namensnennung |
| NASA GIBS (VIIRS DNB) | Nachtlichter | `zweite_natur/konstruierte_wirklichkeit` | 500 m, täglich | beobachtung | frei, Namensnennung |
| Natural Earth 110 m | Landumrisse (Equal-Earth-Karte) | Darstellung | 110 m | beobachtung | gemeinfrei, `data/land-110m.json` |
| OSM | Straßen, Bebauung | `zweite_natur/konstruierte_wirklichkeit` | Objekt | beobachtung | ODbL |
| GLEIF | Unternehmensverflechtung | `erste_natur/basis` | Objekt | beobachtung | CC0 |

## Vorgesehen

| Quelle | Was | Adresse | Auflösung | Art | Lizenz / Zugang |
|---|---|---|---|---|---|
| Wikidata | Objekte, Eigentum, Zeitfenster | mehrere | Objekt | kuratiert | CC0, SPARQL |
| GBIF | Artvorkommen | `erste_natur/unterbau` | Objekt | beobachtung | CC BY / CC0 |
| Wikidata (Institutionen) | Parlamente, Regierungssitze, Gerichte, Zentralbanken | `zweite_natur/ueberbau` | Objekt | kuratiert | CC0, SPARQL |
| SWOT River Tides | Tidenamplitude und -klasse in Küstenflüssen | `erste_natur/erdsystem` | SWORD-Knoten (200 m) | rekonstruktion | CC BY 4.0, Zenodo 15223861 · 9 Shapefiles, 303,8 MB · abgeleitet über `adapter/gezeiten.py` |

## Bezugsnetze

Netze, auf die sich andere Daten beziehen. Ihr Wert liegt nicht im Inhalt, sondern
darin, dass mehrere Quellen dieselben Knoten benutzen — sie sind Schlüssel, nicht Daten.

| Quelle | Was | Adresse | Auflösung | Art | Lizenz / Zugang |
|---|---|---|---|---|---|
| SWORD (SWOT River Database) | globales Flussnetz: Reaches (~10 km), Knoten (200 m), alle Flüsse ab 30 m Breite | `erste_natur/erdsystem` | 200 m | kuratiert | CC BY 4.0, Zenodo · NetCDF, GeoPackage, Shapefile, je 1,6–1,9 GB, nach Kontinenten |

SWORD ist selbst eine Setzung: Was schmaler als 30 m ist, kommt darin nicht vor und
existiert damit für jeden Datensatz nicht, der darauf aufbaut — die SWOT-Flusstiden
eingeschlossen. Das Netz entscheidet mit, was überhaupt sichtbar werden kann. Genau
deshalb gehört es in den Katalog und nicht in den Hintergrund.

## Modelle (PIK)

Die drei bilden zusammen fast die Matrixleiter ab — jedes behandelt das Nachbargebiet
als Randbedingung. Genau dort liegt das Naturverhältnis, das keines von ihnen führt.

| Modell | Was | Adresse | Auflösung | Lizenz | Zugang |
|---|---|---|---|---|---|
| [LPJmL](https://github.com/PIK-LPJmL/LPJmL) | Vegetation, Wasser, Kohlenstoff, Erträge | `erste_natur/erdsystem`, `erste_natur/unterbau` | Gitter (üblich 0,5°) | AGPL-3.0 | Code offen; öffentlicher Eingangsdatensatz ab v6.0.5 über Zenodo. „No support outside agreed collaborations." |
| [MAgPIE](https://github.com/magpiemodel/magpie) | Landnutzung, Erträge, Kosten | `gesellschaftlicher_stoffwechsel/mat_pm` | 0,5° = Stufe 4 | AGPL-3.0 + Namenszusatz | GAMS mit CONOPT nötig (kommerziell); realistisch: veröffentlichte Szenarien |
| [Acclimate](https://github.com/acclimate/acclimate) | Verlustausbreitung im Liefernetz | `zweite_natur/konstruierte_wirklichkeit` (Wertform) | Sektor × Region | AGPL-3.0 | C++; Eingang sind MRIO-Tabellen mit eigenen Lizenzen |
| [Aeolus 2.0](https://doi.org/10.5281/zenodo.13987667) | Atmosphärendynamik, zweischichtiges moist-convective RSW | `planetarer_stoffwechsel/extern`, `erste_natur/erdsystem` | idealisiertes Gitter | CC BY 4.0 | Python (Dedalus) + Fortran, 67 MB, läuft eigenständig |

**Aeolus ist die einzige der vier, die man ohne Weiteres selbst rechnen kann** — klein,
CC BY, lauffähig auf einem Rechner. Dafür ist sie idealisiert: Sie zeigt einen
Mechanismus, nicht den Zustand der Atmosphäre über einem Ort. Als Beleg für eine
Adresse taugt sie deshalb nicht, als Darstellung des planetaren Stoffwechsels als
Prozess schon — vorausgesetzt, sie ist als Modell gekennzeichnet.

## Was hier nicht hineingehört

Rasterbestände (GEBCO-Kacheln, Eisrekonstruktionen) bleiben außerhalb des
Repositories. Der Katalog nennt sie, das Repository speichert sie nicht.
