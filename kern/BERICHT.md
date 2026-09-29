# Bericht: Sintflut als erster Prüfstein

Stand: 2026-09-29 · Branch `struktur` · Schema 0.2.0, abgeglichen mit docs/strukturstand.md
(Bestände und Archive, Regeln 2, 6, 9, 10, Geometrie `grenze`)

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
| `sintflut/eis`, `sintflut/ozean` | 1.1 | fehlend | Masse fehlend |
| Relation `eis-ozean` | – | – | Formwechsel als Stoffwechsel, Bilanz „nicht prüfbar, bis die Eisdicke geklärt ist“ |
| Prozess `wasserumverteilung` | – (Übergang planetar, intern) | – | Zu- und Abfluss fehlend |
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
4. **Mengen des Bestands Wasser.** Gesamtmenge, Eismasse, Ozeanmasse und umverteilte Menge fehlen. Die
   Bilanz Eis gegen Ozean ist deshalb nicht prüfbar, bis die Eisdicke geklärt ist. QUELLEN.md führt für
   PaleoMIST „Eisdicke“, `paleomist.py` liest sie nicht.
5. **Küstengeometrie.** `sintflut.json` enthält nur Flächensummen je Kasten, keine Linien.
6. **Zeitschritt: 2500 Jahre, nicht 2400.** 80 ka auf 33 Stützstellen sind 32 Schritte zu je 2,5 ka. Die
   Reihe ist eine Hüllkurve; Schmelzwasserpulse fallen zwischen die Stützstellen.
7. **Bezugsjahr von „ka BP“.** Die Quelle sagt nicht, ob 0 ka BP 1950 CE meint. Die Bezugszeit bleibt in
   der Skala der Quelle.
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
  `paleo_topography > 0`. `sea_level` geht nur in den gemittelten Meeresspiegel ein, nicht in die
  Land-Meer-Grenze. Wie angewiesen führt die `grenze` trotzdem Meeresspiegel und Topographie als Quellen.
- **„ohne Isostasie“ muss geprüft werden.** Enthält `paleo_topography` die isostatische Verformung
  bereits, stimmt der Pflichthinweis für diese Daten nicht. Er steht unverändert, wie er gesetzt wurde.
  Ich habe das nicht an der PaleoMIST-Dokumentation geprüft.
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

## Ausführen

```sh
node kern/pruefe.mjs          # Prüfung aller Adapter, Rückgabewert 1 bei Verstoß
npm --prefix kern test        # Prüfung plus Tests
```
