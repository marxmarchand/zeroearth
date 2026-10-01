# Bericht: Sintflut als erster Prüfstein

Stand: 2026-10-01 · Branch `struktur` · Schema 0.5.0 (erster Stand 2026-09-29, Schema 0.2.0)

Nachtrag 2026-10-01: Eis aus den 1°-Dateien, Bilanz Eis → Ozean, zwei Ideale (Regel 13), Bezugsjahr,
Isostasie, Erkundung Spratt & Lisiecki. Siehe die Abschnitte am Ende. Überholte Aussagen sind unten
markiert, nicht gelöscht.

Der Kern besteht aus `schema.mjs` (Konstanten, Typen) und `pruefe.mjs`. Geprüft werden die Regeln 1–10,
dazu Bestände und Formen (B), Struktur (S) und Manifest (M). Die Sintflut-Daten laufen über
`adapter/sintflut/` und bestehen die Prüfung: keine Verstöße, 1 Bestand, 22 Einträge, 1 Prozess,
1 Relation. Was fehlt, steht als Hinweis in der Ausgabe von `node kern/pruefe.mjs`.

Begriff: Der Container, den ein Adapter erzeugt, heißt **Graph** (Bauform: „Graph aus Einträgen, Relationen und
Prozessen“). „Bestand“ ist der Begriff aus der Theorie: eine Substanz mit Formen.

## Wie die Daten angelegt sind

| Objekt | Stapel | Geometrie | Inhalt |
| --- | --- | --- | --- |
| Bestand `sintflut/wasser` | – | – | erhalten: ja; Formen Eis und Ozean; Menge fehlend |
| `sintflut/eis`, `sintflut/ozean` | 1.1 | fehlend (nur globale Summen) | Volumen je Ideal (Referenz, a1), 33 Punkte, aus den 1°-Dateien |
| Relation `eis-ozean/referenz`, `eis-ozean/a1` | – | – | Formwechsel als Stoffwechsel, Bilanz vom Eismaximum (20 ka) bis heute; Prüfart innere Stimmigkeit |
| Prozess `wasserumverteilung` | – (Übergang planetar, intern) | – | Zu- und Abfluss „je Ideal verschieden“, siehe Relationen |
| `sintflut/ideale/vergleich` | 1.1 | fehlend | Differenz a1 − Referenz: Eisvolumen und Landfläche je Fenster, 33 Punkte, Nullen eingeschlossen |
| `sintflut/<fenster>` (6) | 1.1 | `flaeche`, gesetzt | Landfläche, Landanteil, Meeresspiegel (je 33 Punkte); Verlust, Verlustanteil, schnellster Schritt |
| `sintflut/<fenster>/kueste` (6) | 1.1 | `grenze` | Spur der Form Ozean; abgeleitet; Koordinaten fehlend |
| `sintflut/<fenster>/notiz` (6) | 2, Unterebene fehlend | – | Text der Notiz; hängt am Fenster; Formation fehlend mit Begründung |
| `sintflut/feld/paleo_topography`, `…/sea_level` | 1.1 | `feld` | nur Verweis auf das Raster |

**Herkunft.** Jeder Wert trägt `arten` (Menge) und eine `archivkette`, die bei zeroearth beginnt:

- Daten: zeroearth ← PaleoMIST 1.0 (Archivart fehlend) ← (natürliche Archive fehlend)
- Notizen: zeroearth ← gesellschaftliches Archiv (Nunn & Reid 2016 bzw. Ryan/Pitman 1997, wo die Notiz sie nennt; sonst fehlend), Art `kuratiert`
- Setzungen (Relation Eis → Ozean): zeroearth, Art `kuratiert`

## Was die Daten nach Schema nicht hergeben

1. **Wissensstand.** Keiner der 614 Datenwerte und keine der 6 Notizen hat einen. `erzeugt`
   (2026-09-27) ist der Zeitpunkt der Ableitung, nicht der Wissensstand der Rekonstruktion. Deshalb fehlt
   auch die Verzögerung im Manifest.
2. **Herkunft pro Wert.** Die Quelle nennt `rekonstruktion` einmal für die ganze Datei. Der Adapter
   schreibt sie an jeden Wert und vermerkt in `quelle`, dass sie von der Dateiebene stammt.
3. **Archivkette hinter PaleoMIST.** Die Daten nennen weder die Archivart von PaleoMIST noch die
   natürlichen Archive (Proxys), auf denen die Rekonstruktion beruht. Beides ist als fehlend geführt.
4. **Mengen des Bestands Wasser.** *Überholt 2026-10-01:* Eis- und Ozeanvolumen stehen jetzt aus den
   1°-Dateien im Graphen, die Bilanz ist geprüft (siehe unten). Weiter fehlend: die Gesamtmenge Wasser.
5. **Küstengeometrie.** `sintflut.json` enthält nur Flächensummen je Kasten, keine Linien.
6. **Zeitschritt: 2500 Jahre, nicht 2400.** 80 ka auf 33 Stützstellen sind 32 Schritte zu je 2,5 ka. Die
   Reihe ist eine Hüllkurve; Schmelzwasserpulse fallen zwischen die Stützstellen.
7. **Bezugsjahr von „ka BP“.** *Geklärt 2026-10-01:* 1950 CE. Die Zeitachse der Rohdatei heißt
   `years since 1950-01-1`. Steht im Manifest (`zeitsemantik.bezugsjahr`).
8. **Auswahl der sechs Schelfe.** Sie ist eine Setzung in `paleomist.py` (ORTE) und als Auswahl
   ausgewiesen. Warum es diese sechs sind, ist nicht begründet und deshalb als fehlend geführt. Die
   Kästen sind eine zweite Auswahl.
9. **Notizen.** Keine Notiz nennt eine Formation, eine Bezugszeit oder eine Unterebene der 2. Natur.
   Vier Notizen nennen keine Quelle.
10. **Subjektachse.** Als leer geführt.
11. **Rundung.** Die Quelle rundet: Flächen auf 1 km², Anteile auf 4 Stellen, Meeresspiegel auf 0,1 m.
    Übernommen ist, was dasteht.

## Verzerrung (Regel 10)

- **Fläche: 1.** Die Flächen sind in `paleomist.py` exakt auf der Kugel summiert. Die Werte in km² sind
  unverzerrt.
- **Überhöhung: 1.** Die Daten sind nicht vertikal skaliert.
- **Gitterfaktor** (unter `verzerrung.gitter`): die Zellfläche des 0,25°-Netzes relativ zur
  Äquatorzelle, an den Kastengrenzen.

  | Fenster | min | max |
  | --- | --- | --- |
  | Doggerland | 0,545 | 0,629 |
  | Schwarzes Meer | 0,682 | 0,766 |
  | Persischer Golf | 0,857 | 0,921 |
  | Yucatán | 0,906 | 0,966 |
  | Sahul | 0,940 | 0,990 |
  | Sunda | 0,985 | 1 |

- **Projektion.** Sie entsteht erst in der Ansicht. Der Kern hält keine projizierten Daten und prüft sie
  deshalb nicht. Die Ansichten müssen sie als Zahl ausweisen.

## Befunde, die den Setzungen widersprechen könnten

- **Die Küste stammt im Code nur aus der Topographie.** `paleomist.py` zählt Land als
  `paleo_topography > 0`. *Behoben 2026-10-01:* Die `grenze` führt jetzt nur noch
  `paleo_topography` als Quelle.
- **„ohne Isostasie“ war falsch.** *Geklärt 2026-10-01:* Die Rohdatei beschreibt `paleo_topography` als
  „topography accounting for ice thickness, sea level change and deformation“. Der Pflichthinweis lautet
  jetzt: „paleo_topography enthält isostatische Deformation (laut Datei); Sedimentation nicht
  berücksichtigt“.
- **Der Meeresspiegel ist regional.** `meeresspiegel_m` ist der Mittelwert des relativen Meeresspiegels
  über alle Zellen eines Kastens (80 ka: −19,0 m Doggerland, +0,7 m Yucatán). Für die spätere Prüfung
  „Meeresspiegelanstieg muss zum Eisverlust passen“ taugt er nicht direkt: Er ist kein eustatischer Wert
  und hängt vom Kasten ab.

## Offen gelassene Stellen

1. **Unterebene der Notizen.** Die Notizen stehen in der 2. Natur, die Unterebene (2.1, 2.2 oder 2.3)
   ist als fehlend geführt. Dafür lässt das Schema einen Eintrag im Stapel mit fehlender Unterebene zu.
2. **Archivart von PaleoMIST.** Ein veröffentlichter Rekonstruktionsdatensatz passt weder sauber zu
   „natürlich“ (Eiskern, Sediment) noch zu „gesellschaftlich“ (Schrift, Statistik; liefert beobachtung,
   kuratiert). Ohne Festlegung als fehlend geführt.
3. **Herkunftsart der Notizen.** Als `kuratiert` geführt (von Hand zusammengetragen). Die Notizen
   hängen am jeweiligen Fenster; ob ihr Träger das Fenster ist oder etwas anderes, ist nicht festgelegt.
4. **Spur ist Pflicht an jeder Grenze.** Gelesen aus „Eine Grenze wie die Küstenlinie ist die Spur einer
   Form“. `spur_von` darf fehlend sein, muss aber geführt werden.
5. **Formwechsel und `erhalten`.** Gelesen aus strukturstand: erhalten → Stoffwechsel, nicht erhalten
   → Einschließen und Realisieren. Einen Bestand, der weder Stoff noch Kapital ist, lässt das nicht zu.
6. **Formen in Übergängen.** Eine Form kann auf einen Prozess verweisen (Ort: sein Übergang). Wie eine
   Form „in einem Übergang“ aussieht, sagt strukturstand nicht genauer.
7. **Regel 9** ist so umgesetzt: Jede Archivkette beginnt bei zeroearth, und zeroearth steht nur dort.
   Ein weitergehender Selbstausweis in den Ansichten ist Sache der Ansichten.
8. **extern/intern am Prozess.** strukturstand bindet extern/intern an Zuflüsse aus der 0. Natur, die
   Korrektur nennt den Stoffwechsel „intern“. Das steht jetzt am Prozess. Einen Zufluss aus der 0. Natur
   (Einstrahlung als Antrieb) gibt es nicht, weil die Daten nichts dazu sagen.
9. **Ausgangsarten.** Zusätzlich zu Ware, Abfall, Wärme und Mehrwert sind `stoff` und `energie`
   zugelassen, für planetare Prozesse.
10. **Gegenwert und Tausch.** Einen Tausch gibt es nur als Relation der Art `konversion` oder
    `einschliessen_realisieren`.
11. **Widersprüche in ZEIT_RAUM.md, SCHNITTSTELLE.md und QUELLEN.md** (Bericht zu Schritt 0) sind nicht
    aufgelöst.

## Eis und zwei Ideale (2026-10-01)

**Quelle.** PaleoMIST 1.0, PANGAEA doi:10.1594/PANGAEA.905800 (Gowan 2019; Gowan et al. 2021,
doi:10.1038/s41467-021-21469-w), CC BY 4.0. Gelesen werden die 1°-Dateien der Referenz und von a1 (je
34,5 MB). Die 0,25°-Rohdatei (554 MB) wird nicht geholt: Für globale Summen reicht 1°.

**Ableitung.** `matrix-scharnier/adapter/paleomist_eis.py` schreibt `data/paleomist_eis.json` (11 KB). Es
sind nur Summen, ohne zusätzliche Annahmen (Regel 12):

- Eisvolumen = Σ `ice_thickness` × Zellfläche
- Ozeanvolumen = Σ max(0, −`paleo_topography`) × Zellfläche
- Landfläche je Fenster auf 1°

`--holen` lädt die beiden 1°-Dateien per HTTP-Range aus dem PANGAEA-ZIP in einen Ordner außerhalb des
Repos.

**Bilanz Eis → Ozean** (Regel 5), je Ideal, vom Eismaximum (20 ka) bis heute:

| Ideal | Eisverlust | Ozeanzuwachs | Rest | Toleranz |
| --- | --- | --- | --- | --- |
| Referenz | 4,21 · 10¹⁹ kg | 4,50 · 10¹⁹ kg | −6,8 % | 10 % |
| a1 | 4,23 · 10¹⁹ kg | 4,51 · 10¹⁹ kg | −6,8 % | 10 % |

- **Dichten** sind Annahmen von zeroearth und stehen im Manifest: Eis 917, Wasser 1000 kg/m³. Mit
  Meerwasser (1028) wäre der Rest etwa −9,8 %.
- **Toleranz:** Sie ist festgelegt nach der ersten Rechnung. Begründet ist sie im Manifest: 1°-Gitter,
  Dichteannahme, Becken unter Meeresniveau im Ozeanvolumen, nur aufliegendes Eis.
- **Was die Prüfung kann:** Sie fängt Fehler der Größenordnung ab, keine Feinheiten. Die einzelnen
  2,5-ka-Schritte streuen weit stärker (meist ±10 %, um 5 ka bis ±90 %, weil dort wenig Eis schmilzt) und
  werden nicht geprüft.
- **Prüfart: innere Stimmigkeit.** Beide Seiten stammen aus PaleoMIST. Die Bilanz zeigt, dass die
  Rekonstruktion mit sich selbst übereinstimmt, nicht, dass sie die Welt trifft. `pruefe.mjs` verlangt
  die Prüfart an jeder Bilanz mit Zahlen. Es lehnt „unabhängig“ ab, wenn beide Seiten dieselbe Quelle
  haben. Die Ausgabe nennt die Prüfart: „Bilanz geschlossen, innere Stimmigkeit“.

**Zwei Ideale (Regel 13).** Referenz und a1 sind gleichrangige Läufe der Quelle. Jeder Wert aus den
1°-Dateien trägt `woher.ideal`. `pruefe.mjs` verlangt, dass jedes Ideal einer Gruppe vorkommt, wo eines
vorkommt. Ausgabe von `node kern/adapter/sintflut/transform.mjs --ideale`:

- **Eis:** verschieden 55–37,5 ka BP (ab 1 m Meeresspiegeläquivalent). Die größte Differenz liegt bei
  11,0 m (42,5 ka BP).
- **Sintflut-Fenster:** echt verschieden nur 52,5–37,5 ka BP (MIS 3), im Sundaschelf um bis zu
  468 000 km². Sonst fallen sie zusammen, bis auf Zellkippen: ein bis zwei 1°-Zellen, die bei kleinsten
  Meeresspiegel-Differenzen zwischen Land und Meer wechseln. Seit dem Eismaximum gibt es nur zwei solcher
  Kippen (Sunda 20 ka, Persischer Golf 7,5 ka).
- **Befund:** In der Transgression nach dem Eismaximum unterscheiden die Fenster die beiden
  Eisgeschichten nicht. Das Zusammenfallen ist eine Aussage. Im Graphen stehen deshalb alle
  Differenzen, auch die Nullen.

Korrektur zu `kern/STAND.md` (Abschnitt PaleoMIST-Rohdatei): Dort steht, die Landfläche sei „bei 22,5 und
10 ka“ identisch. Das stimmt, aber nur für diese zwei Zeitpunkte. Über die ganze Reihe gilt die
Aufteilung oben.

## Gegen unabhängige Beobachtung: Spratt & Lisiecki 2016 (erkundet, nicht eingebunden)

| | |
| --- | --- |
| Quelle | Spratt, R. M.; Lisiecki, L. E.: A Late Pleistocene sea level stack, Climate of the Past 12, 1079–1092 (2016), doi:10.5194/cp-12-1079-2016 |
| Daten | PANGAEA doi:10.1594/PANGAEA.979830, „version 2“ (2025-03-20). Ersetzt doi:10.1594/PANGAEA.854045 (Daten des Diskussionspapiers). Außerdem bei NOAA NCEI Paleoclimatology, Studie 19982 (dort nicht geprüft) |
| Lizenz | CC BY 3.0 (PANGAEA, geprüft) |
| Größe, Format | eine Tabelle, Tab-getrennt, 46,5 KB, 6 392 Datenpunkte. Abruf über `https://doi.pangaea.de/10.1594/PANGAEA.979830?format=textfile` |
| Spalten | Alter (ka BP, 1-ka-Schritte, 0–798 ka); je zwei Stacks: „short“ (erste Hauptkomponente aus 7 Reihen, 0–430 ka) und „long“ (5 Reihen, 0–798 ka), jeweils Meeresspiegel in m relativ zu heute, Standardabweichung (Bootstrap), 95-%-Intervall unten und oben |
| Herkunft | rekonstruktion; natürliches Archiv (Sedimentkerne, Proxys aus δ¹⁸O u. a.) |

Was beim Einbinden zu beachten ist:

1. **Unabhängigkeit ist nur teilweise gegeben.** Der Stack ist laut Abstract auf Holozän- und
   LGM-Schätzungen skaliert. Am LGM und heute stimmt er also zum Teil durch Konstruktion. Unabhängig ist
   vor allem die Form dazwischen, gerade im MIS 3. Ob PaleoMIST seinerseits den Stack zur Kalibrierung
   nutzt, habe ich nicht geprüft; vor dem Einbinden in Gowan et al. 2021 nachsehen.
2. **Vergleichbar ist nur ein globaler Wert.** Der Stack ist ein globaler Meeresspiegel (m relativ zu
   heute). Aus PaleoMIST entspricht dem die Eisvolumenänderung in Meeresspiegeläquivalent. Dafür braucht
   es die Ozeanfläche und die Dichten, also Annahmen (Regel 12, im Manifest). Der regionale
   `meeresspiegel_m` je Kasten ist dafür nicht geeignet.
3. **Die Zeitachsen passen nur zum Teil.** Der Stack hat 1-ka-Schritte, PaleoMIST 2,5 ka. Ohne
   Interpolation (Regel 8) lassen sich nur die gemeinsamen Zeitpunkte vergleichen: alle 5 ka, also 17
   von 33. Die Zwischenpunkte (77,5 ka, …) bleiben fehlend.
4. **Die Unsicherheit ist groß.** Das 95-%-Intervall des Stacks reicht über rund ±10 m. Der Unterschied
   zwischen Referenz und a1 im MIS 3 (bis 11 m) liegt in derselben Größenordnung. Möglicherweise passen
   beide Ideale gleich gut. Dann zeigt die Ansicht beide (Regel 13), und die Passung beweist keinen
   Mechanismus.
5. **Im Schema ist das eine Bilanz mit `pruefart: 'unabhaengige_beobachtung'`** und `aus` auf eine Größe
   aus Spratt & Lisiecki. Die Prüfung lehnt diese Prüfart ab, solange beide Seiten dieselbe Quelle haben.

## Ausführen

```sh
node kern/pruefe.mjs                              # Prüfung aller Adapter, Rückgabewert 1 bei Verstoß
npm --prefix kern test                            # Prüfung plus Tests
node kern/adapter/sintflut/transform.mjs --ideale # wo sich die Ideale unterscheiden und wo nicht

# Eis neu ableiten (braucht Python mit netCDF4; Dateien außerhalb des Repos):
cd matrix-scharnier/adapter && python3 paleomist_eis.py --dateien <ordner> --holen
```
