# Bericht: Zeit, Vergleich mit dem Strukturstand

Stand: 2026-11-02 · Branch `struktur` · Schema 0.7.0 · nichts gebaut

Verglichen wurde der Abschnitt „Zeit“ und Regel 16 in `docs/strukturstand.md` (Stand auf der Platte, noch nicht
committet) mit `ZEIT_RAUM.md`, `index.html`, `kern/schema.mjs`, `kern/pruefe.mjs` und `kern/ereignisse/`.

## Kurzfassung

1. **Der Kern widerspricht Regel 16 durchgehend.** Eine Bezugszeit besteht aus `skala` als freiem Text und einer
   Zahl. Nullpunkt, Kalender, C14 und Unschärfe gibt es als Feld nicht. Keine der 1 375 datierten Angaben im
   Graphen erfüllt Regel 16.
2. **Regel 16 kollidiert in ihrem Wortlaut mit Regel 8.** „Fehlt eines davon, wird der Datensatz abgelehnt“ würde
   beide bestehenden Adapter abweisen, Sintflut und Glottolog; bei Glottolog war die fehlende Bezugszeit eine bewusste
   Entscheidung. Das musst du entscheiden (Frage 1 am Ende).
3. **`ZEIT_RAUM.md`:** Der Zeit-Teil ist überholt, der Raum-Teil zum Teil noch gültig. Vorschlag: teilweise behalten.
   Die Paragrafen 7 bis 9, auf die der Code verweist, gab es in Git nie.
4. **Station 0 als Milanković-Takt geht.** Empfohlene Quelle: Berger & Loutre 1991 bei NOAA, 375 KB, mit fertiger
   Einstrahlung bei 65° N und Nullpunkt 1950 CE. Eine Lizenz ist dort nicht genannt.
5. **Die Sintflut ist vor allem Takt, nicht Bruch.** Die Transgression ist die reguläre Phase eines Eiszeitzyklus.
   Die eigentlichen Brüche, die Schmelzwasserpulse, fallen zwischen die 2,5-ka-Stützstellen und sind in den Daten
   nicht sichtbar.

## a) ZEIT_RAUM.md

| Stelle | Befund | Vorschlag |
| --- | --- | --- |
| §0 „braucht *eine* kanonische Achse als Referenz“ | **widerspricht** „keine einzelne Achse“ und „jede Bezugszeit in ihrem eigenen Maß“ | Satz streichen. Der Grundsatz „Begriffe sind Perspektiven, Koordinaten sind das Raster“ kann für den Raum bleiben |
| §1.1 genau **eine** Zeitvariable `t`, Jahre seit J2000 | **widerspricht** als Speicherformat. Eine reine Rechengröße für Ephemeriden und Anzeige ist **vereinbar** („umgerechnet wird nur für die Anzeige“) | `t` zur Anzeige-Hilfsgröße herabstufen; gespeichert wird im Maß der Quelle. J2000 ist dann ein Bezugssystem unter mehreren |
| §1.1 „Alle Berechnungen … laufen über `t`“; Beispiele ohne Unschärfe (LGM `-2.2e4`) | **widerspricht** Regel 16 | Beispiele mit Bezugssystem und Unschärfe neu fassen |
| §1.2 Anzeige je Dimension (Ga, Ma, a BP, CE) | **passt zum Teil**: mehrere Maße sind richtig. Dass die Dimension das Maß bestimmt, **widerspricht** dem Takt als Master für das Maß | Das Maß folgt dem Takt und der Quelle, nicht der Linse |
| §1.3 BP = 1950, Formel `a_BP = -50 - t` | **passt** als Inhalt. **Fehlt:** kalibriert oder unkalibriert. Die Formel setzt stillschweigend Kalenderjahre voraus, unkalibrierte C14-Jahre werden so falsch | In ein Verzeichnis der Bezugssysteme überführen (`BP1950`, `b2k`, `CE`, `J2000`, `UTC`) mit Feld `c14` |
| §1.3 „reflexiver Hinweis“: BP, Jahr, Sekunde sind Produkte der 2. Natur | **passt** genau zu „Zeit 0“ und dem Lichtjahr-Absatz | behalten, in den Strukturstand ist es schon aufgegangen |
| §1.4 Zeitpunkt und Zeitraum, Slider setzt den Zeitpunkt | **passt** zur Unterscheidung, **fehlt:** Unschärfe und Überlappung. Der Bereichsmodus (Doppelgriff) ist nie gebaut worden | Durch OWL-Time-Intervalle ersetzen; „gleichzeitig“ nur per Überlappung |
| §1.5 Gleichzeitigkeit der Dimensionen ≠ Gleichzeitigkeit der Zeitskalen | **passt** zur Stapelzeit, sagt aber „bei `t`“ | Gedanken behalten, ohne `t` formulieren |
| (nirgends) Takt, Richtung, Bruch | **fehlt** ganz | steht im Strukturstand; hier nicht doppeln |
| (nirgends) Standards OWL-Time, PeriodO, Allen | **fehlt** | steht im Strukturstand |
| §2.1 WGS84 und HEJ2000, §2.3 Erdephemeride als Brücke | **passt**, kein Widerspruch | behalten |
| §2.2 Raster 0,25°, „jeder Punkt hat einen Zustand in jeder Dimension“ | **widerspricht** „Fehlendes bleibt fehlend“ und dem Grundsatz „Skalen kommen aus den Inhalten“ | Satz streichen; 0,25° ist nur noch die Auflösung einer Quelle |
| §2.4 Koordinate kanonisch, Zellen berechnet, `proFlaeche` | **passt** | behalten |
| §2.4 Stufenleiter „an die Beobachtungshöhen gebunden“ | **widerspricht** dem Entfernen der Höhenleiter (`3a37c41`). `matrix-scharnier/zellen.mjs` nennt noch `SCALE_ORDER` und die Stufennamen, obwohl es sie im Code nicht mehr gibt | Stufen als reine Halbierung ohne Namen; `skala`-Feld und Kommentar in `zellen.mjs` nachziehen |
| §3 `beobpos = (lat, lon, t, Dimension)` | **widerspricht** zum Teil: Die Dimension ist nach der Entscheidung zu den Linsen keine Position, `t` keine einzige Achse | neu fassen oder streichen |
| §4 Sub-Level-Begriffe, §5 Spratt & Lisiecki als Kurve | erledigt oder überholt: Die NullNatur-Ansichten sind solar, interstellar, kosmologisch. §5 stimmt weiter | §4 streichen, §5 nach `QUELLEN.md` |
| §6 Checkliste | **widerspricht** ab Punkt 1 („Eine interne Zeitvariable“) | streichen |
| §§7–9 | **fehlen**: `index.html` nennt „§§ 0–9“ und zitiert §8, §8.2, §8.4, §9, auch `README.md` und `matrix.mjs`. In beiden Git-Fassungen gibt es keinen dieser Paragrafen | Verweise beim Umbau ersetzen; Inhalt (Linsen, Adressen) steht heute im Strukturstand |

## b) Zeitleiste in index.html

### Vergleich

| Stelle | Befund | Vorschlag |
| --- | --- | --- |
| `Tideline.t`, ein Regler, eine Uhr für alles | **widerspricht** „ein einzelner Zeitregler über alle Skalen ist ausgeschlossen“ und der Bauform „kein globaler Zeitregler“ | siehe Skizze |
| `TSCALES`: ±4,6 Ga, ±50 Ma, ±100 ka, ±2 000 a, ±60 a, ±18 Tage | **widerspricht**: Das sind Ausschnitte aus einer Achse, genau das, was der Takt-Absatz ausschließt | durch verschachtelte Takte ersetzen |
| Register RaumZeit, geologisch, sozial | **passt** in der Absicht, **fehlt:** Es sagt nicht das Bezugssystem. `2026 CE`, `a BP`, `Ma` stehen ohne Kalender, ohne cal/uncal und ohne Unschärfe | Anzeige um das Bezugssystem der gezeigten Ebene ergänzen |
| `display()`: Anzeige `a BP` | **widerspricht** Regel 16: Es sagt nicht, ob kalibriert | Einheit `a cal BP` oder Herkunft ausweisen, je nach Quelle |
| Ebenen wählen nach `jahr >= a.jahr0 && jahr <= a.jahr1` | **widerspricht**: Harte Grenzen sind keine Überlappung mit Unschärfe | Überlappung als gemeinsame Funktion, Allen-Relationen |
| `PERIODS` (11 Epochen): gemeinsame `t0`, `t1` als Zahlen, ohne Quelle, ohne Unschärfe; „Überlappung ist Befund“ | **passt** im Gedanken, **fehlt:** Quelle und unscharfe Grenzen. Der Kandidat dafür ist PeriodO. Beispiel: Holozän `t0: -11750` rechnet 11 700 als BP-1950. Nach Walker et al. 2009 sind es 11 700 Jahre **b2k**, also `t = -11700` (aus dem Gedächtnis, vor Änderung prüfen). 50 Jahre daneben, genau weil das Bezugssystem nicht mitläuft | Epochen aus PeriodO, jede Grenze mit `earliestYear` und `latestYear` |
| Mini-Fenster: „Jahreslauf“, „Milanković“, „Tiefenzeit“, nach `aBP` umgeschaltet | **Keim der Takte**, aber fester Text: „Obliquität 41ka · Präz. 26ka“ und „Exzentrizität 100ka“ bei Tiefenzeit. Der Strukturstand nennt 21 ka (klimatische Präzession), der Text 26 ka (astronomische) | zur Takt-Anzeige ausbauen, mit Daten statt Text |
| Mondtafel: synodisch, anomalistisch, tropisch mit Sprungknöpfen | **passt**: Das ist schon ein Takt mit Phase | Vorbild für die übrigen Takte |
| Cesium-Uhr nie gesetzt (Sonne steht auf dem Seitenaufruf) | **fehlt:** Der Tag-Takt ist nicht verbunden; dieselbe Ursache wie der offene Terminator-Fehler | beim Umbau mit erledigen |
| Kepler-Bahnen: nur 1800–2050 belastbar, Zeitleiste reicht weiter | **passt** als Ausweis im About-Text, **fehlt** als Unschärfe am Wert | Unschärfe wächst mit dem Abstand zur Epoche; sichtbar machen |

### Skizze: verschachtelte Takte in Worten

**Grundidee.** Statt eines Balkens mit Fenster gibt es einen Stapel von Takt-Zeilen, von fein nach grob. Jede Zeile
ist **ein Umlauf** ihres Takts, mit Marke für die aktuelle Phase, also ein Zifferblatt, das aufgerollt ist.

```
Galaktisch   ~230 Ma  |------●-----------------------|  (geschätzt, breite Spanne)
Exzentrizität ~100 ka |--●---------------------------|
Obliquität     ~41 ka |-------------●----------------|
Präzession     ~21 ka |-------------------●----------|
    · · · (Lücke: siehe unten)
Jahr             1 a  |-----------●------------------|  Oktober
Mond         29,53 d  |------------------●-----------|  Phase
Tag             24 h  |--------●---------------------|  (Terminator)
```

1. **Zoomen heißt in eine Zeile wechseln,** nicht einen Prozentausschnitt wählen. Ein Klick auf eine Zeile macht sie
   zur führenden Zeile; die feineren klappen auf, die gröberen bleiben als schmale Marken. Ein Umlauf der gröberen
   Zeile ist die Spanne, in der die feinere läuft.
2. **Richtung ist eine eigene Spur unter den Zeilen,** kein Regler: eine Zählung in Takten („… Erdumläufe seit dem
   Nullpunkt“) und, wo eine Quelle da ist, die gerichteten Größen (Eisvolumen, CO₂, fossiler Bestand). So bleibt
   sichtbar, dass der Takt misst, aber nicht erzeugt.
3. **Bruch ist eine Markierung auf der Zeile,** an der er vom Erwarteten abweicht, mit eigener Unschärfe als Breite.
   Der Normalzustand steht daneben als Setzung (Regel 7).
4. **Register werden zur Angabe des Bezugssystems.** Jede Ebene sagt ihr Maß: „ka BP (Nullpunkt 1950), ±1,25 ka
   Stützstellen“, „2026-10-02 UTC“. Die Wörter „geologisch“ und „sozial“ können als Überschrift bleiben.
5. **Jede Ebene zeigt ihr eigenes Zeitfenster.** Die Legende hat dafür schon die Zeile „Zeit“. Eine Ebene erscheint,
   wenn ihr Zeitraum mit der Unschärfe die gewählte Phase überlappt, nicht wenn `t` im Intervall liegt.

**Vier Stellen, an denen die Skizze nicht aufgeht:**

- **Lücke zwischen 1 a und 21 ka.** Fünf Größenordnungen ohne Takt aus der 0. Natur, und gerade dort liegt fast alle
  menschliche Geschichte (die heutigen Fenster ±60 a und ±2 000 a). Möglichkeiten: dort nur die Zählung (Richtung),
  oder weitere Takte wie den Sonnenzyklus (rund 11 a) und den Mondknoten (18,6 a), die in deiner Liste nicht stehen.
  Takte der 2. Natur (Generation, Kalender, Arbeitswoche) wären etwas anderes, denn sie kommen nicht aus der 0. Natur.
- **Takte driften.** Der Tag wird durch Gezeitenreibung länger, im Devon hatte das Jahr rund 400 Tage (aus dem
  Gedächtnis). Die Takte sind also nicht fest ineinander gezählt; die Richtung wirkt auf den Takt zurück. `t` rechnet
  mit festen 365,25 Tagen.
- **Milanković-Zyklen sind quasiperiodisch.** Es sind Spektren mit mehreren Linien, keine festen Umläufe. Die Phase
  muss aus Daten kommen, nicht aus einer Division.
- **Das galaktische Jahr ist eine Schätzung** mit breiter Spanne. Eine Marke „aktuelle Phase“ täuscht dort Genauigkeit
  vor; sie braucht ihre Unschärfe als Breite.

## c) kern/schema.mjs und kern/pruefe.mjs

| Stelle | Befund | Vorschlag |
| --- | --- | --- |
| `Bezugszeit {skala, wert | von, bis}`; `skala` ist freier Text (`pruefe.mjs:51`) | **widerspricht** Regel 16 | Feld `bezugssystem` mit Verweis auf ein Verzeichnis im Schema: Nullpunkt, Kalender, Einheit, `c14` (`kalibriert`, `unkalibriert`, `nicht_radiokarbon`) |
| keine Unschärfe | **fehlt** | Feld `unschaerfe` je Grenze nach PeriodO und OWL-Time: früheste und späteste Angabe, oder `±`-Wert. Herkunft der Unschärfe angeben: von der Quelle oder Stützstellenabstand |
| `Zeitsemantik.bezugsjahr` nur im Sintflut-Manifest, nicht Pflicht | **fehlt** als Pflicht | `ZEITSEMANTIK_PFLICHT` um `bezugssystem` und `unschaerfe` ergänzen |
| `Relation.bezugszeit`, `Ereignis.zeitfenster` | dieselbe Lücke | nutzen denselben Typ, gemeinsame Prüfung |
| `Formation.gilt {von, bis}`, Formationsverweis `{von, bis}`: Zahlen oder „offen“, ohne Skala | **widerspricht** Regel 16 stärker als alles andere | gleicher Typ wie Bezugszeit; „offen“ als ausdrücklicher Wert |
| `Wissensstand.seit`: freier Text (Datum oder Jahr); Vergleich als Text (`String(c.seit) > String(a.seit)`) | **fehlt** Format; Jahr und Datum vergleichen sich zufällig richtig | ISO-Datum oder ISO-Jahr prüfen |
| Gleichzeitigkeit | **fehlt** ganz: keine Überlappung, keine Allen-Relationen | Funktion `ueberlappt(a, b)` im Kern, die Oberfläche nutzt dieselbe |
| Takt, Richtung, Bruch | **fehlt** | siehe d) |
| `Bezugszeit` „bleibt in der Skala der Quelle; keine gemeinsame Achse“ (Kommentar `schema.mjs`) | **passt** genau zum Strukturstand | behalten |
| bitemporal: Bezugszeit und Wissensstand, Fassungen | **passt** | behalten |

**Auswirkung, gezählt am heutigen Graphen:**

| | Werte mit Bezugszeit | Werte „fehlend“ | Relationen mit Bezugszeit | Relationen „fehlend“ |
| --- | --- | --- | --- | --- |
| `sintflut` | 1 373 (alle `ka BP`) | 6 | 2 | 0 |
| `glottolog` | 0 | 23 976 | 0 | 7 889 |

Keine dieser 1 375 datierten Angaben trägt eine Unschärfe, und keine ein Bezugssystem am Wert selbst.

### Welche Quellen ihr Bezugssystem nennen

| Quelle | Nullpunkt und Kalender | C14 | Unschärfe der Zeit | Status |
| --- | --- | --- | --- | --- |
| PaleoMIST 1° (`time`) | **genannt:** `years since 1950-01-1`, `calendar=365_day` (in der Datei gelesen) | ungeklärt; Rechenachse des Modells | nicht genannt; 2,5-ka-Stützstellen | genannt |
| `data/sintflut.json` | nur „ka BP“; 1950 steht im Manifest, aus der 1°-Datei übertragen | – | nicht genannt | teilweise |
| `data/paleomist_eis.json` | **genannt** (`zeitachse`) | – | nicht genannt | genannt |
| Spratt & Lisiecki 2016 | „Age [ka BP]“; Nullpunkt und Altersmodell nicht in der Tabelle, Meeresspiegel „above modern“ | zu prüfen | Unsicherheit nur am Meeresspiegel, nicht am Alter | teilweise |
| Berger & Loutre 1991 | **genannt:** „origin (0) is 1950 A.D.“ | entfällt, berechnet | nicht genannt | genannt |
| Laskar 2004 | Null ist heute, die Datei selbst nennt es nicht (J2000 aus dem Gedächtnis) | entfällt | nicht in der Datei | ungeprüft |
| Glottolog | keine Zeit | – | – | fehlt |
| SWOT, Gezeiten | „J2000“, `t0 = 23`, `t1 = 26`: von unserem Adapter gesetzt (`gezeiten.py`), nicht von der Quelle | – | nicht genannt | selbst gesetzt |
| USGS Seismik | Epochen-Millisekunden, UTC | – | nicht ausgewertet | genannt |
| NASA GIBS | Kachel-Tag, UTC | – | Tag | genannt |
| CelesTrak | TLE-Epoche, wird nicht ausgewertet | – | wächst mit dem Abstand zur Epoche | teilweise |
| GFS, Köppen, Paläotemperatur | `data/manifest.json` fehlt | – | – | offen |
| `marker.json` (`jahr0`, `jahr1`), GBIF, Ströme | Datei lokal nicht vorhanden; im Code als CE-Jahre gelesen | – | – | offen |
| `PERIODS` im Code | `t` (J2000), aus BP umgerechnet, teils falsch (siehe b) | – | keine | selbst gesetzt |
| Surveillance Watch | `createdAt`, `updatedAt` ISO-Zeit, nur für Datensätze | – | – | nur lokal |
| ISIMIP, GROW | nicht geprüft | – | – | offen |

## d) Ereignis-Schema und Sintflut

| Stelle | Befund | Vorschlag |
| --- | --- | --- |
| `zeitfenster {skala, von, bis}` | **widerspricht** Regel 16 | gemeinsamer Typ aus c) |
| Sintflut `von: 20`: die Stützstelle des Eismaximums | **fehlt** Unschärfe: mindestens ±2,5 ka durch die Stützstellen | ausweisen |
| kein Feld für Bruch | **fehlt** | `bruch` als Abschnitt des Ereignisses: `takt` (welcher Takt erwartet war), `normalzustand` (Setzung, Regel 7), `abweichung` (nur Verweis auf einen Adapter), `leitet_neuen_takt_ein` (ja, nein, offen). Ohne eigene Daten, wie die Stationen |
| kein Feld für Takt und Richtung | **fehlt** | an der Station optional `zeitart`: `takt`, `richtung`, `bruch` |
| Stationen ohne Zeit | **passt**: Die Zeit steht im Adapter | so lassen |
| Gleichzeitigkeit der Stationen | **fehlt**: Das Format suggeriert „alles zugleich“, Stationen können in verschiedenen Zeiträumen liegen | Prüfung: Der Zeitraum jeder Quelle überlappt das `zeitfenster` (Regel 16); sonst Hinweis |
| Satz: „Die Umlaufbahn der Erde lässt Eis schmelzen“ | **Spannung** zu Regel 13: Eine gute Passung beweist keinen Mechanismus, und ohne CO₂ und Rückkopplungen erklärt die Einstrahlung das Abschmelzen allein nicht. Der Satz stammt von dir und bleibt; die Station 0 sollte die Frage offen halten | Frage der Station lautet schon „Welche Änderung … ließ das Eis schmelzen?“; Vorschlag: „Wie änderte sich die Einstrahlung, als das Eis schmolz?“ |

**Bruch oder Takt?** Nach deiner Definition ist die Transgression zum großen Teil der erwartete Takt: Das Abschmelzen
ist die reguläre Phase eines Eiszeitzyklus. Der Bruch wären die Schmelzwasserpulse (etwa 1A um 14,6 ka). Die fallen
laut Quelle zwischen die 2,5-ka-Stützstellen; auch die 1-ka-Kurve von Spratt & Lisiecki löst sie kaum auf. Für die
Sintflut hieße das: `bruch.abweichung` wäre heute „fehlt“. Für die Menschen auf dem Schelf war es dagegen ein Bruch,
denn der Normalzustand hängt am Beobachter. Das ist genau die Setzung, die der Strukturstand verlangt.

### Station 0 als Milanković-Takt

Ja, das geht: Die Einstrahlung ist der Takt, die Station verweist auf einen neuen Adapter `milankovitch`. Status
danach `in_arbeit` oder `vorhanden`. Empfehlung: Berger & Loutre 1991 zuerst, Laskar 2004 später als zweites Ideal.

| | Berger & Loutre 1991 (empfohlen) | Laskar et al. 2004 |
| --- | --- | --- |
| Ort | NOAA NCEI, [orbital_variations/insolation](https://www.ncei.noaa.gov/pub/data/paleo/climate_forcing/orbital_variations/insolation/) | IMCCE, [La2004](http://vo.imcce.fr/insola/earth/online/earth/earth.html); Kopie [CaltechDATA](https://data.caltech.edu/records/v9dp1-jb227) |
| Datei, Größe | `orbit91` **375 KB**; `insol91.jun`, `insol91.dec` je 63 KB | `INSOLN.LA2004.BTL.ASC` 4,6 MB, `.250.ASC` 9,5 MB; Caltech-Paket 2,2 MB |
| Inhalt | je 1 ka, 0–5 Ma: Exzentrizität, Perihel, Obliquität, Präzession und **fertige Einstrahlung**: 65° N Juli, 65° S Januar, 15° N Juli, 15° S Januar, W/m². `insol91.*`: 0–1 Ma, sieben Breiten, Juni und Dezember | je 1 ka: Exzentrizität, Obliquität, Perihel. **Keine Einstrahlung**: Sie müsste berechnet werden (Regel 12: eine weitere Annahme, die Solarkonstante) |
| Nullpunkt | **genannt:** 1950 A.D. | nicht in der Datei |
| Lizenz | **keine genannt.** Das Readme bittet um Zitierung. NOAA ist eine US-Behörde, die Daten stammen aber von Berger; zu klären | an der Quelle keine gefunden (IMCCE antwortete mir mit 403 auf die Übersicht). CaltechDATA führt die Kopie unter CC0, ob das die Rechte von IMCCE deckt, ist offen |
| Solarkonstante | 1360 W/m² | – |
| Größe nach Reduktion | 0–80 ka, 65° N: unter 10 KB | ebenso, aber erst nach eigener Rechnung |

Zu beachten:

- **Herkunft:** Das ist eine Berechnung, also `modell`. Das Schema verlangt dazu `idealisiert` und damit die
  schematische Bildsprache. Ob Himmelsmechanik „Ideal“ ist, ist eine Frage an dich (Frage 4).
- **Unschärfe:** Berger nennt keine. Nach Regel 16 wäre der Datensatz abgelehnt (Frage 1).
- **Zeitachsen:** 1 ka gegen 2,5 ka bei PaleoMIST. Ohne Interpolation liegen gemeinsame Punkte alle 5 ka.
- **Readme-Hinweis:** Für den Nullpunkt gilt die Lösung von 1978 als bevorzugt, 1978 und 1991 seien bis 800 ka
  gleichwertig.
- **Quellenliste:** `QUELLEN.md` führt Laskar 2004 als „frei“, das ließ sich so nicht bestätigen.

## e) Vorschlag zu ZEIT_RAUM.md

**Teilweise behalten, Zeit-Teil als überholt markieren.** Ersetzen wäre zu viel, denn der Raum-Teil gilt und neun
Dateien verweisen auf die Datei. Nur markieren wäre zu wenig, weil dann zwei widersprüchliche „verbindliche“ Texte
nebeneinander stehen.

1. **Kopf der Datei:** „Zeit-Teil (§§0, 1, 3, 6) überholt durch docs/strukturstand.md, Abschnitt Zeit und Regel 16“,
   Status von „verbindlich“ auf „nur Raum“. Der Text bleibt zur Nachvollziehbarkeit stehen.
2. **Behalten:** §2.1, §2.3, §2.4 ohne die Bindung an Höhen, §1.3 als Inhalt des künftigen Verzeichnisses der
   Bezugssysteme.
3. **Später:** Raum-Teil in eine eigene Datei `RAUM.md`, tote Verweise auf §§7–9 in `index.html`, `README.md`,
   `matrix.mjs` ersetzen, `SCHNITTSTELLE.md` („kanonische Achse: Jahre seit J2000“) nachziehen. Die Satzformat-Regel
   dort steht schon unter den verworfenen Annahmen.

Reihenfolge, falls du zustimmst: erst Schema und Prüfung (c), dann die Quellen nachtragen, dann die Zeitleiste (b).
Die Zeitleiste zuletzt, weil sie die teuerste ist und vom Schema abhängt.

## Vor dem Bau zu entscheiden

1. **Regel 16 gegen Regel 8.** Wird ein Datensatz ohne Unschärfe oder Bezugszeit wirklich abgelehnt? Betroffen:
   Sintflut (keine Unschärfe), Glottolog (7 889 Relationen ohne Bezugszeit, von dir so entschieden), Berger. Mögliche
   Lesart: Regel 16 gilt für jede **gegebene** Zeitangabe. Fehlt die Zeit ganz, gilt Regel 8 („fehlend“ mit Grund);
   fehlt die Unschärfe, ist sie „von der Quelle nicht genannt“, und wir weisen stattdessen den Stützstellenabstand
   aus. Das wäre milder als der Wortlaut.
2. **Ist der Stützstellenabstand als Unschärfe zulässig?** Er ist eine Untergrenze, keine Angabe der Quelle.
3. **`t` als reine Anzeige-Hilfsgröße?** Bleibt die Zeitleiste intern bei `t`, wenn sie nach außen Takte zeigt?
4. **Einstrahlung als `modell`/`idealisiert`?** Oder braucht berechnete Himmelsmechanik eine eigene Einordnung?
5. **Lücke zwischen 1 a und 21 ka:** nur Zählung, oder weitere Takte (Sonnenzyklus, Mondknoten)?

## Quellen

- [W3C OWL-Time](https://www.w3.org/TR/owl-time/): Intervalle, Bezugssysteme (`hasTRS`), Allen-Relationen (`intervalOverlaps`). Stand: Candidate Recommendation Draft, 15. November 2022
- [PeriodO](https://data.perio.do/): Epochen mit Quelle, CC0, unscharfe Grenzen über `earliestYear` und `latestYear` im Kontext der Daten; Stand 2026-10-22
- Berger & Loutre 1991, Quaternary Science Reviews 10(4), 297–317; Berger 1992, PAGES/WDCA 92-007 (Readme bei NOAA)
- [Laskar et al. 2004, A&A 428, 261–285](https://hal.science/hal-03729629/file/aa1335.pdf)
- Spratt & Lisiecki 2016, siehe `kern/BERICHT.md`
- Aus dem Gedächtnis, nicht geprüft: Walker et al. 2009 (Holozänbasis 11 700 b2k), Tageslänge im Devon, J2000 als Nullpunkt von La2004
