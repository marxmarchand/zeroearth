# Bericht: Offene Daten zu Stoff-, Energie- und Arbeitsflüssen

Stand: 2026-11-08. Nur Recherche, kein Code. Geprüft wurde an den Quellen selbst: Lizenzseiten, Datensatz-Metadaten (Zenodo-, Eurostat-, ADEME- und SDMX-Schnittstellen) und Abrufe der Endpunkte. Was ich nicht bestätigen konnte, steht als „nicht geprüft“.

## Vorbemerkungen

- **Muster:** Kern-Adapter mit Manifest (`kern/adapter/<name>/`, `matrix-scharnier/adapter/<name>.py`), Regeln aus `docs/strukturstand.md`.
  - Die im Auftrag genannten Abschnitte `ZEIT_RAUM.md` §7–§9 und die Konverter `*_to_zef.py` gibt es im Repo nicht.
  - „Ableiten statt modellieren“ ist Regel 12.
- **CORS** wurde so geprüft: Abruf mit `Origin: https://zeroearth.io`, dann die Antwortzeile `Access-Control-Allow-Origin` gelesen.
  - „ja (*)“: Der Browser darf direkt lesen.
  - „nein“: nur per Python-Konverter vorab.
  - Die Vorabanfrage (Preflight) für eigene Kopfzeilen ist nicht geprüft; einfache GET-Abrufe reichen für alle Fälle hier.
- **Herkunft nach Regel 6:**
  - **Amtliche Statistik:** Die Werte sind Erhebungen und Schätzungen, gemischt. Die Quelle markiert Schätzungen mit Kennzeichen (Flags: geschätzt, vorläufig, unterstellt). Die Flags werden je Wert mitgeführt; ein geschätzter Wert trägt dann `modell`, sonst gilt `beobachtung` mit `kuratiert` (zusammengestellt vom Statistikamt).
  - **MRIO-Tabellen (EXIOBASE):** Sie werden aus Statistiken mit Ausgleichsverfahren gebaut, die letzten Jahre fortgeschrieben (Nowcast). Das ist `modell` + `kuratiert`, nicht Beobachtung.
  - **Ökobilanzdaten:** Prozessmodelle (Hintergrunddatenbanken GaBi oder ecoinvent), dazu charakterisierte Wirkungen: `modell`.
- **Monetär (Regel 3):** Geldwerte sind keine gemeinsame Einheit und erscheinen nur, wo ein Tausch sie hergestellt hat. Monetäre Konten stehen darum getrennt, nie neben physischen in einer Bilanz.
- **Ort in der Matrix:**
  - Stoff und Energie kommen als Zuflüsse aus 1.1 (Erdsystem) oder 1.2 (Biomasse) in den Prozess, über den Übergang gesellschaftlicher Stoffwechsel, Vorgang Stoffwechsel.
  - Arbeitszeit ist ein Zufluss der Art „zeit“ (kein Stapel).
  - Emissionen sind Ausgänge (Abfall, Wärme).
  - Gebautes gehört zu 2.1, sein stofflicher Träger zu 1.1.
- **Keine Vorab-Aggregation:** Jede Quelle bleibt einzeln. Gewichtete Einzelwerte (etwa der „Score unique EF“ bei Agribalyse) werden nie übernommen.

## Tabelle

| Quelle | Lizenz | NC | Zugang | Format | CORS | Auflösung | Zeitraum | Fluss/Bestand | Einheit | Herkunft (Regel 6) | Ort in der Matrix | Update | Verdikt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **EXIOBASE 3.11.2** (Zenodo 23039074) | eigene Lizenz, abgeleitet von CC BY-NC-SA 4.0, mit Zusatzdefinitionen (LICENSE.txt) | **ja**; nur für Hochschulen, gemeinnützige Forschung, Umwelt-NGOs, Behörden | Download Zenodo, ohne Anmeldung | ZIP mit Tabellen (TXT); 63 Dateien, 15,1 GB | Zenodo-API ja (*); Dateien nicht geprüft, wegen der Größe ohnehin nur per Konverter | 44 Länder + 5 Restregionen; 163 Industrien / 200 Produkte | 1995–2024 (letzte Jahre fortgeschrieben) | Fluss je Jahr | **monetär** (Kern-Tabelle, Mio. €) **getrennt** von physischen Erweiterungen (t, TJ, Arbeitsstunden; Umfang laut Quelle, Spalten nicht einzeln geprüft) | modell + kuratiert (MRIO, Ausgleich, Nowcast) | Prozessknoten je Sektor; Zuflüsse Stoff, Energie, Zeit; gesellschaftlicher Stoffwechsel, Stoffwechsel; monetär: Einschließen/Realisieren | 2026-09-30 | **später**: Lizenzklasse prüfen (ist zeroearth eine berechtigte Einrichtung?), 15 GB |
| **EXIOBASE 3.8.2** (Zenodo 5589597) | CC BY-SA 4.0 | nein | wie oben | wie oben; 88 Dateien, 49,4 GB | wie oben | wie oben | 1995–2022 (ab etwa 2011 fortgeschrieben, laut Beschreibung von 3.11) | Fluss | wie oben | modell + kuratiert | wie oben | 2021-10-21 | **später**: offene Alternative, aber alt und sehr groß |
| **UNEP IRP Global Material Flows Database** | Seite nennt **keine Lizenz**; ältere Kopie bei energydata.info (Weltbank, CSV) unter CC BY 4.0 | nein (Kopie) / nicht geprüft (Original) | Web-Werkzeug (unep-irp-resourcepanel.resource-use.global); Download-Weg nicht geprüft; Detaildaten „auf Anfrage, ggf. gegen Gebühr“ | Original nicht geprüft; Kopie CSV | nicht geprüft | über 200 Länder und Regionen | 1970–2024 (laut Seite) | Fluss (Entnahme, Handel, Fußabdruck) | t | Entnahme: kuratiert + modell (Statistik, Lücken geschätzt); Fußabdrücke: modell (MRIO) | Zufluss Stoff aus 1.1/1.2; gesellschaftlicher Stoffwechsel, Stoffwechsel | Original ca. 2024 (Anhang „vers_4_june_2024“, nicht bestätigt); Kopie 2022-03-30 | **später**: Lizenz des Originals klären |
| **Eurostat env_ac_mfa** (Materialflusskonten) | CC BY 4.0 (Beschluss 2011/833/EU), auch kommerziell; Ausnahme: Drittdaten | nein | API ohne Anmeldung | JSON-stat, SDMX, CSV | **ja (*)** | Land (EU, EFTA, Kandidaten); 76 Materialkategorien | DE: 1990–2025 | Fluss je Jahr | t (auch t je Kopf, Index) | beobachtung + kuratiert; mit Kennzeichen der Quelle geschätzt: modell | Zufluss Stoff (Entnahme, Import), Ausgang (Export); Inlandsverbrauch = Entnahme + Import − Export, **bilanzierbar nach Regel 5** | 2026-07-02 | **einbinden** |
| **Eurostat nrg_bal_c** (Energiebilanzen) | wie oben | nein | API | JSON-stat, SDMX, CSV | **ja (*)** | Land; Energieträger (SIEC) × Bilanzposten | bis 2024 | Fluss je Jahr | ktoe, TJ, GWh (physisch) | beobachtung + kuratiert; Kennzeichen wie oben | Zufluss Energie aus 1.1; Ausgang Wärme/Verluste; bilanzierbar | 2026-08-27 | **einbinden** (zusammen mit MFA) |
| **FAOSTAT** (Produktion QCL, Landnutzung RL, Ernährungsbilanzen FBS, Agrar-Emissionen) | CC BY 4.0 **plus FAO-Datenbankbedingungen** (keine Werbung für Unternehmen, keine Billigung behaupten) | nein (aber Zusatzbedingungen) | API verlangt Anmeldung (401 „Missing Authorization Header“); **Massendownload ohne Anmeldung** | ZIP mit CSV (QCL 33 MB) | API nein; Download **nein** (keine CORS-Kopfzeile) | Land; Erzeugnis | nicht geprüft | Produktion: Fluss (t/a); Landnutzung: **Bestand** (ha) | t, ha, Stück | je Wert nach Kennzeichen: amtlich = beobachtung + kuratiert; FAO-Schätzung/unterstellt = modell | Zufluss Stoff aus 1.2 (Biomasse); Landnutzung: Bestand 1.1/1.2; gesellschaftlicher Stoffwechsel | QCL 2025-12-31; RL 2026-10-02; Emissionen 2026-11-06 | **einbinden** (per Konverter) |
| **ILOSTAT** (Arbeitszeit, Löhne) | CC BY 4.0 für Daten **ab 3. Mai 2023**; ältere Bestände „nicht automatisch“ unter CC (ILO-Rechteseite); Nutzungsseite von ILOSTAT selbst nicht lesbar (403) | nein (ab 05/2023) / unklar (älter) | SDMX-API ohne Anmeldung (sdmx.ilo.org); rplumber-API | SDMX-CSV, XML | **ja** (SDMX gibt die Origin zurück; rplumber *) | Land; Geschlecht; Wirtschaftszweig | je Reihe verschieden (Beispiel DE 2022) | Arbeitszeit: **Kennzahl** (mittlere Wochenstunden je Erwerbstätigem), kein Fluss; Fluss erst mit Erwerbstätigenzahl | h; Löhne **monetär, getrennt** | Erhebung (Arbeitskräfteerhebung): beobachtung + kuratiert; „ILO modelled estimates“: modell | Zufluss „zeit“ (Arbeitszeit, kein Stapel); Löhne: Gegenwert aus Tausch (Regel 3), getrennt | je Reihe; nicht einzeln geprüft | **einbinden** (Arbeitszeit); Löhne später |
| **Climate TRACE** | CC BY 4.0 (Zenodo 23789204) | nein | API v7 (Beta) ohne Anmeldung, Zenodo-Download, BigQuery | JSON (API); Pakete mit CSV/GeoPackage | **ja (*)** | **Anlage, Koordinate**; Länder | monatlich bis August 2026; Beginn nicht geprüft | Fluss (Emissionen je Monat/Jahr) | t CO₂e (physisch, aber charakterisiert) | **modell** (+ berechnet): Satellitenbilder und KI-Schätzung, keine Messung je Anlage | Ausgang (Abfall/Emission) eines Prozesses am Ort der Anlage; gesellschaftlicher Stoffwechsel | Version 5.12.0, 2026-10-29 | **später**: gut für Orte, aber reines Modell; als Ideal neben amtlicher Emissionsstatistik (Regel 13) |
| **Ökobaudat** (BMWSB/BBSR) | keine Standardlizenz: kostenfrei „zum Zwecke der Berechnung von Gebäudeökobilanzen“; **nur unmodifizierte Weitergabe** mit Quelle erlaubt (Handbuch 2021, Abschnitt 3.4.2) | nein, aber **Zweckbindung** | soda4LCA-Webservice (oekobaudat.de/OEKOBAU.DAT/resource); Download-Versionen | ILCD+EPD (XML), JSON über soda4LCA | **nein** (403 bei Abruf mit Origin) | je Bauprodukt (deklarierte Einheit), Deutschland | Gültigkeit je Datensatz | Prozess: Zu- und Abflüsse je Einheit | MJ, kg, m³; Wirkungen (kg CO₂e) | **modell** + kuratiert (Ökobilanz, Hintergrund GaBi); „Zusätzliche Daten“ auf **ecoinvent**-Basis → ausgeschlossen | **Prozessknoten** „Herstellung Baustoff“ (Module A1–A3); Zuflüsse Energie, Stoff; Ausgänge Abfall, Emissionen | Version nicht geprüft | **später**: Lizenz (abgeleitete Darstellung?) mit BBSR klären |
| **ProBas** (UBA) | **nicht geprüft**: Seite nennt keine Lizenz; „öffentlich, kostenfrei“ | nicht geprüft | soda4LCA-Schnittstelle (data.probas.umweltbundesamt.de), 23 172 Prozesse | JSON/XML (ILCD) | **nein** (403 mit Origin, 200 ohne) | Prozess, meist DE | Bezugsjahr je Datensatz (Beispiel 2000) | Prozess: Zu-/Abflüsse | physisch (laut ILCD-Format; Einheiten nicht geprüft) | modell + kuratiert (Ökobilanz) | Prozessknoten | nicht geprüft | **später**: Lizenz beim UBA erfragen; Daten teils alt |
| **Agribalyse 3.2** (ADEME, data.ademe.fr) | Licence Ouverte / Open Licence (Etalab) | nein | API (data-fair) ohne Anmeldung | JSON, CSV | **ja (*)** | 2 451 Lebensmittel, Frankreich | Bezugszeit nicht geprüft | Prozess: **nur Wirkungsindikatoren** (EF 3.1) je kg, keine physischen Zu-/Abflüsse | charakterisierte Wirkungen (kg CO₂e, m² Land usw.); `Score_unique_EF` ist **gewichtet → nie übernehmen** | modell (Ökobilanz; Hintergrund teils ecoinvent, laut ADEME-Methodik, nicht geprüft) | Prozessknoten Lebensmittel; Ausgänge nur als Wirkung | Synthese 2025-02-27, Etappen 2025-09-05; Agribalyse 4: 2026-05-07, **ohne Lizenzangabe** | **später**: keine Flüsse, nur Wirkungen |
| **worldsteel LCI** | Nutzungsvereinbarung auf Anfrage; Zusammenfassung frei | nicht geprüft | Formular, Zustimmung zur Vereinbarung | nicht geprüft | nicht geprüft | 16 Stahlprodukte, global | Datenbank 2026 (Daten 2024) | Prozess | physisch | modell + kuratiert | Prozessknoten | 2026-05-20 | **nein** (vorerst): Zugang nur über Vereinbarung |
| **ELCD** (JRC) | frei laut GHG Protocol; Lizenz nicht geprüft | nicht geprüft | nicht geprüft | ILCD | nicht geprüft | Prozess, EU | Daten 2006–2010 | Prozess | physisch | modell + kuratiert | Prozessknoten | Wartungsstand nicht geprüft | **nein**: veraltet |
| **EU Environmental Footprint 3.1** | EULA je Datenanbieter: nur für PEF/OEF-Studien, nicht übertragbar, nicht unterlizenzierbar (Sphera-EULA) | faktisch ja | Registrierung je EF-Knoten | ILCD | nicht geprüft | Prozess, EU | gültig bis **2025-12-31** (laut Sphera) | Prozess | physisch | modell | Prozessknoten | abgelaufen | **nein**: Lizenz und Ablauf |
| **OpenStreetMap / Overpass** | ODbL 1.0 (Datenbank); Namensnennung | nein (Share-alike) | Overpass-API ohne Anmeldung; Grenzen: regelmäßig < 100 Abfragen und < 10 MB je Tag, kommerziell eigene Server | JSON, XML | **ja (*)** | Gebäude als Umriss, Koordinate | laufend | **Bestand** (Gebäude, Infrastruktur) | Fläche, Anzahl; keine Masse | beobachtung + kuratiert (Kartierung durch Freiwillige; Vollständigkeit ungleich) | 2.1 Gebautes (Träger 1.1) | laufend | **später**: Bestand ohne Stoffmenge |
| **GHSL GHS-BUILT-S/-V R2023A** (JRC) | Weiterverwendung mit Quellenangabe (EU-Weiterverwendung); „CC BY 4.0“ nicht wörtlich bestätigt | nein | Direktdownload ohne Anmeldung | GeoTIFF (nicht im Einzelnen geprüft) | Download-Seite ja (*); Dateiserver nein | 100 m, 1 km | 1975–2030 in 5-Jahres-Schritten; Stützen 1975, 1990, 2000, 2014 (Landsat), 2018 (Sentinel-2) | **Bestand** (bebaute Fläche, Volumen) | m², m³ | beobachtung (Satellit) + modell (Klassifikation; Zwischenjahre inter-/extrapoliert, 2025/2030 Fortschreibung) | 2.1 Gebautes (Träger 1.1) | R2023A | **später**: Bestand, gut für Haus-Kontext; 2025/2030 sind Erwartung |
| *weitere:* **Ember**, jährliche Stromdaten | CC BY 4.0 (Seite) | nein | CSV-Download; API mit Schlüssel (403) | CSV | **nein** (CSV ohne Kopfzeile) | Land, Region; Energieträger | ab 2000 | Fluss (Erzeugung TWh/a), Bestand (Kapazität GW) | TWh, GW; Emissionen t | kuratiert (Zusammenstellung amtlicher Daten); Emissionen berechnet → modell | Energie, gesellschaftlicher Stoffwechsel | 2026-11-03 | **später**: Doppelung zu Eurostat/IEA-Quellen, aber global |
| *weitere:* **WRI Global Power Plant Database v1.3.0** | CC BY 4.0 | nein | GitHub, CSV | CSV | ja (*) (raw.githubusercontent) | Kraftwerk, Koordinate | bis 2019 | Bestand (Kapazität), geschätzte Erzeugung | MW, GWh | kuratiert; Erzeugung teils modell | Prozessknoten mit Ort | **nicht mehr gepflegt** (seit 2022) | **nein**: veraltet |
| *weitere:* **Our World in Data, Energiedaten** | Sammlung; Lizenz je Ursprungsquelle (u. a. Energy Institute) | je Quelle | GitHub | CSV | ja (*) | Land | lang | Fluss | TWh | kuratiert (zweite Hand) | – | laufend | **nein**: Sekundärquelle, lieber die Ursprungsquellen |
| *weitere:* **GLORIA MRIO** | nicht geprüft | – | auf Zenodo nicht gefunden | – | – | – | – | – | – | – | – | – | nicht geprüft |

## Ökobilanzdaten als Prozessknoten

- **Rolle:** Ökobaudat, Agribalyse und ProBas sind keine Kartenebenen. Sie beschreiben einen Prozess je deklarierter Einheit, mit Zuflüssen (Primärenergie, Wasser, Stoffe) und Ausgängen (Abfall, Emissionen, Wirkungen).
- **Geeignet für:** den Prozessknoten im Netz (Ansicht „netz“), nicht für ein Feld auf dem Globus.
- **Bilanzierbarkeit (Regel 5):** Ökobaudat führt Energie (MJ), Wasser (m³) und Abfall (kg) als Flüsse; teilweise prüfbar. Agribalyse führt nur Wirkungen, also nichts bilanzierbar. Wirkungen wie kg CO₂e sind charakterisiert: `modell`, kein Stoff.
- **Hintergrunddaten:** Ökobaudat beruht auf GaBi (Sphera), die „zusätzlichen Daten“ auf ecoinvent; Agribalyse nutzt laut ADEME-Methodik teils ecoinvent im Hintergrund (nicht geprüft). Die veröffentlichten Ergebnisse brauchen keine ecoinvent-Lizenz, die Herkunftskette nennt den Hintergrund aber.

**Kann Ökobaudat die Haus-Station „Boden und Baumaterial“ füllen?** Nur teilweise.
- Die Station (1.1, Knoten `stoff`, Form `bestand`) fragt, woraus das Haus besteht und worauf es steht, also nach einem **Bestand**. Ökobaudat liefert keine Mengen in einem Haus, sondern je Baustoff, was bei der **Herstellung** einer Einheit fließt (etwa je m³ Beton).
- Damit passt Ökobaudat zu einem **neuen Prozessknoten** „Herstellung Baustoff“ (Module A1–A3), der am Knoten `stoff` als Rolle oder Stoffwechsel hängt. Den Bestand selbst füllt es nicht.
- **Das Haus ist Schema, kein Einzelfall:** Werte je Einheit passen dazu besser als Werte eines Gebäudes.
- **Vor dem Bau zu klären:** Die Nutzungsbedingungen binden den Zweck („Berechnung von Gebäudeökobilanzen“) und erlauben nur unmodifizierte Weitergabe. Ob eine Darstellung einzelner Indikatoren als Prozessknoten zulässig ist, muss das BBSR beantworten.

## Was nicht geprüft werden konnte

- **UNEP IRP:** Lizenz und Download-Weg des aktuellen Originals.
- **ILOSTAT:** eigene Nutzungsseite (403); Lizenz nur über die allgemeine ILO-Rechteseite belegt.
- **Ökobaudat:** aktuelle Datenbankversion. Die Schnittstelle lehnte Abrufe mit `Origin` ab; eine andere Browserkennung habe ich bewusst nicht versucht.
- **ProBas:** Lizenz, Aktualität.
- **Agribalyse:** ob der ecoinvent-Hintergrund Folgen für die veröffentlichten Ergebnisse hat (laut Lizenz Licence Ouverte nicht).
- **Weiteres:** CORS der Zenodo-Dateien; die einzelnen Spalten der EXIOBASE-Erweiterungen; GLORIA.
- **Quellen nur aus Suchergebnissen**, nicht von der Primärseite gelesen:
  - die ILO-Rechteseite
  - die Eurostat-Lizenz (CC BY 4.0)
  - das Ablaufdatum von EF 3.1
  - die Datenjahre von ELCD
  - die GHSL-Epochen

## Vorschlag für den ersten Konverter (zur Freigabe)

1. **Eurostat Materialflusskonten (env_ac_mfa), danach Energiebilanzen (nrg_bal_c).**
   - **Bedingungen:** CC BY 4.0, CORS offen, physisch (t, TJ), amtlich, mit Kennzeichen je Wert für die Herkunft.
   - **Bilanzierbar:** Inlandsverbrauch = Entnahme + Import − Export lässt sich nach Regel 5 prüfen; der Kern könnte das wie bei Eis → Ozean als Bilanz rechnen.
   - **Einschränkung:** nur Europa.
2. **FAOSTAT Produktion (QCL) und Landnutzung (RL), per Massendownload.**
   - **Bedingungen:** global, physisch (t, ha), CC BY 4.0 mit FAO-Bedingungen.
   - **Herkunft:** Schätzungen sind gekennzeichnet und werden zu `modell`.
   - **Matrix:** Zufluss aus 1.2 (Biomasse) und Landnutzung als Bestand.
   - **Zugang:** kein CORS und ein API mit Anmeldung, also nur vorab per Konverter.
3. **ILOSTAT Arbeitszeit (SDMX).**
   - **Matrix:** füllt den Zufluss „zeit“, den bisher keine Quelle liefert.
   - **Bedingungen:** CC BY 4.0 für Daten ab Mai 2023, CORS offen.
   - **Herkunft:** Erhebung beobachtet, Modellschätzungen der ILO als `modell` getrennt.
   - **Einschränkung:** Arbeitszeit ist eine Kennzahl je Person. Ein Fluss (Stunden je Jahr) entsteht erst mit der Zahl der Erwerbstätigen aus derselben Quelle; das ist abgeleitet, nicht modelliert.

**Danach:** Climate TRACE als erstes Modell mit Ort (Anlagen), neben amtlichen Emissionen als Ideal (Regel 13). EXIOBASE erst, wenn die Lizenzklasse geklärt ist.

## Quellen der Prüfung

- **EXIOBASE:** Zenodo-Datensätze 23039074 (3.11.2, LICENSE.txt gelesen) und 5589597 (3.8.2).
- **UNEP IRP:** resourcepanel.org/global-material-flows-database; energydata.info (Datensatz world-unep-irp-global-material-flows-database).
- **Eurostat:**
  - API `env_ac_mfa`, `nrg_bal_c`, `env_ac_ainah_r2`, abgefragt am 2026-11-08
  - Copyright-Hinweis (ec.europa.eu/eurostat/help/copyright-notice, über die Suche)
- **FAOSTAT:** fao.org/contact-us/terms/db-terms-of-use; bulks-faostat.fao.org/production/datasets_E.json.
- **ILOSTAT:** sdmx.ilo.org (Abfrage DF_HOW_TEMP_SEX_ECO_NB); ilo.org „Rights and permissions“ (über die Suche).
- **Climate TRACE:** climatetrace.org/data; Zenodo 23789204; api.climatetrace.org/v7.
- **Ökobaudat:** oekobaudat.de/en/guidance/data-users.html; ÖKOBAUDAT-Handbuch 2021-06-28, Abschnitt 3.4.2.
- **ProBas:** probas.umweltbundesamt.de; data.probas.umweltbundesamt.de/resource/processes.
- **Agribalyse:** data.ademe.fr, Datensätze agribalyse-31-synthese und shxqzuee9i461wn9lmdsbnvr.
- **Ökobilanzen (übrige):**
  - worldsteel, Pressemitteilung vom 20.05.2026
  - Sphera-EULA zu EF 3.1
  - GHG-Protocol-Verzeichnis zu ELCD
- **Gebautes und weitere:**
  - openstreetmap.org/copyright; wiki.openstreetmap.org/wiki/Overpass_API
  - GHSL-Katalog (DOI 10.2905/9F06F36F-4B11-47EC-ABB0-4F8B7B1D72EA, über die Suche)
  - ember-energy.org/data/yearly-electricity-data
  - github.com/wri/global-power-plant-database
  - github.com/owid/energy-data

## Stand des Baus (2026-11-08): Eurostat, FAOSTAT, ILOSTAT

Gebaut nach Freigabe („Alle drei“). Jede Quelle bleibt einzeln; nichts wird über Länder, Gruppen oder Quellen summiert. Die Seite zeigt die Daten noch nicht; gebaut sind Konverter, Kern-Adapter und Tests.

| Quelle | Konverter | Datei(en) | Umfang | Kern-Adapter | Herkunft je Wert |
| --- | --- | --- | --- | --- | --- |
| **Eurostat** | `matrix-scharnier/adapter/eurostat.py` (API, JSON-stat; Rohantworten in `~/ZeroEarth/rohdaten/eurostat`) | `data/stofffluss/eurostat_mfa.json` (0,4 MB), `eurostat_energie.json` (2,4 MB) | Materialflüsse: 36 Länder, MF1–MF4, Entnahme/Import/Export/Inlandsverbrauch, 1990–2025, 1000 t. Energie: 41 Länder, 11 Energieträger, 8 Bilanzposten, 1990–2024, TJ | `kern/adapter/eurostat/`, 595 Einträge | ohne Kennzeichen beobachtung + kuratiert; e/i (geschätzt, imputiert) kuratiert + modell + berechnet; p vorläufig im Wissensstand |
| **FAOSTAT** | `matrix-scharnier/adapter/faostat.py` (Massendownload in `~/ZeroEarth/rohdaten/faostat`) | `faostat_produktion.json` (2,4 MB), `faostat_landnutzung.json` (1,3 MB) | Produktion: 208 Länder, 10 FAO-Gruppen, 1961–2024, t. Landnutzung: 247 Länder, 5 Posten, 1961–2025, 1000 ha | `kern/adapter/faostat/`, 3 075 Einträge | A beobachtung + kuratiert; E/I kuratiert + modell + berechnet; X kuratiert |
| **ILOSTAT** | `matrix-scharnier/adapter/ilostat.py` (SDMX; Rohantworten in `~/ZeroEarth/rohdaten/ilostat`) | `ilostat_arbeitszeit.json` (0,8 MB) | Wochenstunden je Erwerbstätigem (HOW_TEMP): 182 Länder, 1969–2025. Stunden insgesamt je Woche (HOW_2TOT): 189 Länder, 2005–2027, Einheit 1000 h | `kern/adapter/ilostat/`, 872 Einträge | Erhebung beobachtung + kuratiert; „ILO - Modelled Estimates“ kuratiert + modell + berechnet, ab Abrufjahr 2026 dazu erwartung mit Träger ILO |

**Matrix (Stapel der Einträge):**
- **Eurostat:**
  - Materialgruppen: Biomasse (MF1) in 1.2, Erze, Mineralien und Fossiles (MF2–MF4) in 1.1.
  - Energieträger: Solarwärme und Photovoltaik in 0.3 (Zufluss aus der 0. Natur), feste Biobrennstoffe in 1.2, alle übrigen in 1.1.
- **FAOSTAT:** Produktion in 1.2, Landnutzung in 1.1 (Bestand).
- **ILOSTAT:** Arbeitszeit ist kein Stapel. Die Einträge stehen vorläufig in 1.3 (die Erwerbstätigen als Träger); das ist ein Vorschlag (Regel 7).
- **Prozesse fehlen noch:** Prozesse des gesellschaftlichen Stoffwechsels mit diesen Zuflüssen sind nicht gebaut. Die Einträge sind die Zu- und Abflüsse, an die solche Prozesse später anschließen.

**Geprüft:**
- **Regel 5:** Die Bilanzen der Quelle gehen auf.
  - Inlandsverbrauch = Entnahme + Import − Export: 4 078 Fälle.
  - Brutto verfügbare Energie = Primärproduktion + Wiedergewinnung + Einfuhr − Ausfuhr + Bestandsveränderung, und Bruttoinlandsverbrauch = verfügbare Energie − Hochseebunker: 5 336 Fälle.
  - Größte Abweichung 0,004 %, also Rundung.
- **Regel 8:** Lücken bleiben als Jahre mit Grund stehen, mit dem Kennzeichen der Quelle oder „kein Wert in der Quelle“. Ölpflanzen (1730) und Faserpflanzen (1753) stehen in der FAO-Codeliste, haben aber keine Werte und sind als `fehlt` geführt.
- **Regel 3:** Nur physische Einheiten (t, 1000 t, 1000 ha, TJ, h, 1000 h). Keine Geldwerte; Löhne sind nicht eingebunden.
- **Regel 12:** keine Hochrechnung der Wochenstunden auf Jahre, weil die Quelle keine Wochen je Jahr nennt.
- **Ausgelassen,** damit nichts doppelt steht: Regionen (FAO ab Code 5000, ILO-Codes X..) und „China“ (FAO 351, Summe aus vier Gebieten).
- **Tests:** `kern/test/stofffluss.test.mjs`, 7 Tests; alle 292 Tests grün.

**Was auffällt:**
- **FAOSTAT Produktion:** 47 014 von 106 948 Werten sind von der FAO geschätzt (E), 58 110 amtlich (A).
- **FAOSTAT Landnutzung:** Dort ist die Mehrheit imputiert (I: 37 457 gegen A: 22 904).
- **Folge:** Auf der Seite würde das Unsicherste angezeigt, also oft `modell`.
- **ILOSTAT, Prognosejahre:** Die Modellschätzungen reichen bis 2027; 2026 und 2027 sind Erwartung.
- **ILOSTAT, Herkunft der Stundenzahlen:** Die Gesamtstunden kommen nur aus dem Modell, die Stunden je Person nur aus Erhebungen. Es sind zwei verschiedene Größen, nicht zwei Ideale derselben.

**Offen:**
- Darstellung auf der Seite: Prozessknoten im Netz oder Länderwerte.
- Prozesse des gesellschaftlichen Stoffwechsels, an die die Zuflüsse anschließen.
- Ort der Arbeitszeit in der Matrix (1.3 oder eigener Zufluss „zeit“ ohne Eintrag).
- Länderumrisse als `wo`.
