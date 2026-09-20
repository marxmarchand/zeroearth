# ZEIT_RAUM.md
## Referenzspezifikation für Zeit- und Raumkoordinaten in zeroearth.io

**Status:** Festlegung v1.0 · Stand Juni 2026 · §2.4 ergänzt 20.09.2026 (Entwurf, Entscheidung Max)
**Geltung:** verbindlich für alle Plattform-Versionen ab v0.6
**Theoretische Grundlage:** Marchand 2026a (ZeroNature/FirstNature), Abschnitt 2.4 & 3.3; Glossar v3 (Einträge `zeit`, `dimtemp`, `masterzeit`, `matrixschnitt`, `beobpos`, `raster`, `rastereingang`)

---

## 0. Grundsatz

Die Begriffe und Naturdimensionen überlagern sich — dasselbe Objekt erscheint in
mehreren Dimensionen unterschiedlich (Boden als Substrat / als Ertragsmesszahl / als
Bodenrichtwert). Das ist kein Mangel, sondern der Befund des Frameworks. Damit diese
Überlagerung *beobachtbar* statt *verwirrend* ist, muss das Koordinatensystem darunter
eindeutig sein.

Begriffe sind Perspektiven. Koordinaten sind das Raster.

Dieser Grundsatz folgt direkt aus Marchand 2026a: Zeit ist „not an absolute container
within which events occur but relative to specific nature-configurations". Die Plattform
braucht deshalb *eine* kanonische Achse als Referenz — relativ zu der die
dimensionsspezifischen Temporalitäten ausgedrückt werden.

---

## 1. ZEIT

### 1.1 Kanonische interne Achse

Intern existiert genau **eine** Zeitvariable:

```
t  =  Jahre relativ zu J2000.0  (1. Januar 2000, 12:00 TT)
      Float. Negativ = Vergangenheit, positiv = Zukunft.
```

Beispiele:
| Ereignis | t |
|---|---|
| Erdentstehung | `-4.567e9` |
| K–Pg-Impakt | `-6.6e7` |
| Letztes glaziales Maximum | `-2.2e4` |
| Doggerland-Überflutung (Ende) | `-8.0e3` |
| Heute (2026) | `+26` |

Alle Berechnungen (Ephemeriden, Kepler, Layer-Auswahl) laufen über dieses `t`.
Alle Anzeigen sind reine **Konversionsfunktionen** darauf.

### 1.2 Anzeige-Konversionen (dimensionsspezifisch)

Die Masterzeit (Glossar: `masterzeit`) zeigt `t` in der Skala der aktiven Dimension:

| Dimension | Einheit | Konversion aus `t` |
|---|---|---|
| NullNatur | Ga | `t / 1e9` |
| Planetarer Stoffwechsel | Ma | `t / 1e6` |
| Erste Natur | a BP | `1950 - (2000 + t)`  → siehe 1.3 |
| Ges. Stoffwechsel | CE / v.Chr. | `2000 + t` (negativ → v.Chr.) |
| Zweite Natur | Jahr (CE) | `2000 + t` |

### 1.3 BP-Konvention — explizit

**BP = „before present", wobei „present" per Konvention 1950 CE ist** (Radiokarbon-Standard,
nicht das aktuelle Jahr). Daher:

```
a_BP  =  1950 - (2000 + t)  =  -50 - t
```

Kontrolle: `t = -10000` → `a_BP = 9950` ≈ 10.000 a BP. Korrekt.

**Reflexiver Hinweis (Marchand 2026a, 2.4):** BP, der Gregorianische Kalender, „Sekunde"
und „Jahr" sind selbst *Base-level productions* — Konventionen der Zweiten Natur, keine
neutralen Größen. Die Plattform behandelt die kanonische Achse daher nicht als neutral,
sondern als eine bewusst gewählte Konvention. Wo es theoretisch relevant ist (NullNatur,
Erste-Natur-Tiefenzeit), kann ein Hinweis die Konstruiertheit des Maßes sichtbar machen.

### 1.4 Zeitraum vs. Zeitpunkt (Glossar: `zeit`)

- **Zeitpunkt (Zeitpunkt / temporal location):** der Wert `t` selbst — Moment der Beobachtung.
- **Zeitraum (Zeitraum / temporal duration):** ein Intervall `[t₀, t₁]`, relevant für
  Prozessdauer und für Layer die über einen Bereich mitteln (z.B. glaziale Erosionsrate
  über 123 ka).

Der Masterzeit-Slider setzt primär den **Zeitpunkt**. Ein optionaler Bereichsmodus
(Doppelgriff) kann einen **Zeitraum** aufspannen.

### 1.5 Dimensionsspezifische Temporalität (Glossar: `dimtemp`)

Gleichzeitigkeit der Dimensionen ≠ Gleichzeitigkeit ihrer Zeitskalen. Ein Matrixschnitt
bei `t` zeigt jede Dimension in ihrer eigenen Auflösung:
NullNatur (Ga) · Plan. Stoffwechsel (Ma/ka) · Erste Natur (ka/a BP) ·
Ges. Stoffwechsel (a) · Zweite Natur (a/live).

---

## 2. RAUM

### 2.1 Zwei Referenzsysteme, explizit getrennt

Das Glossar (`raster`) legt das gemeinsame Raster als `(lat, lon)` fest. Das gilt für alle
erdgebundenen Dimensionen. Die NullNatur braucht ein zweites System. Beide werden
explizit benannt statt implizit vermischt:

| Raumsystem | Geltung | Koordinaten |
|---|---|---|
| **WGS84** (geographisch) | ab Planetarer Stoffwechsel | `(lat, lon)`, Höhe optional |
| **HEJ2000** (heliozentrisch-ekliptisch, J2000) | NullNatur | `(x, y, z)` in AU, Ekliptikebene |

### 2.2 Das gemeinsame Raster (Glossar: `raster`)

```
Auflösung:  0.25°  (PaleoMIST 1.0 als Referenz)
Geltung:    alle erdgebundenen Dimensionen
Prinzip:    Küstenlinien, Eisbedeckung, Siedlungsverteilung etc. werden nicht
            als Polygone approximiert, sondern als Funktionen auf dem Raster
            berechnet. Jeder Punkt (lat, lon, t) hat einen Zustand in jeder Dimension.
```

### 2.4 Zelle und Koordinate (v1.4, 20.09.2026)

Kanonisch ist die **Koordinate**, nicht die Zelle. Gespeichert wird `(lat, lon, t)`;
eine Zelle wird daraus **berechnet**. Das Raster ist damit eine Beschreibung, so wie
die Dimensionen Linsen sind und keine Orte (§8.2) — es gibt keinen Zustand „Zelle",
den man pflegen müsste, und keine zwei Raster, die auseinanderlaufen können.

Die Stufenleiter ist an die Beobachtungshöhen gebunden, jede Stufe halbiert die vorige:

```
Stufe  0   8°       Erde + Mond
       1   4°       Planet
       2   2°       Kontinent
       4   0.5°     Region
       5   0.25°    (Referenzauflösung §2.2 — PaleoMIST)
       7   0.0625°  Stadt
      11   0.0039°  Straße        (~430 m am Äquator)
```

Zell-ID: `g<Stufe>:<Zeile>/<Spalte>`, Zeile ab −90°, Spalte ab −180°. Die Schachtelung
ist exakt: jede Zelle hat genau eine Elternzelle und vier Kinder. Implementierung:
`matrix-scharnier/zellen.mjs` — **dieselbe** Funktion in Plattform und Auswertung,
damit Mensch und Maschine dieselben Zellen sehen. Die gezeichneten Rasterlinien sind
die Grenzen der aktiven Stufe: was sichtbar ist, ist das, was gerechnet wird.

**Verzerrung, ausgewiesen statt versteckt.** Das Gradnetz ist nicht flächengleich:
eine 0,25°-Zelle misst am Äquator 772,8 km², bei 51,5° N noch 482,4 km² — Faktor 0,62.
Für Zählungen ist das folgenlos, für jede Größe *pro Fläche* nicht. Deshalb trägt jede
Dichte ihre Bezugsfläche mit (`proFlaeche` → `{wert, einheit, bezugsflaeche_km2, zelle}`);
eine nackte Dichte ohne Bezugsfläche ist im Sinne von §0 kein zulässiger Wert.

**Verdichten beim Herauszoomen.** Sätze fallen in die gröbere Zelle zusammen, die
Aggregation ist gerechnet. Eine leere Zelle bleibt leer — es wird nicht über Lücken
hinweg interpoliert.

### 2.3 Die Brücke zwischen den Raumsystemen

Der Übergang HEJ2000 ↔ WGS84 ist die **Erdephemeride**: die Position der Erde im
Sonnensystem zu `t`. Das ist keine Verlegenheitslösung, sondern theoretisch präzise —
die Erde *ist* der Übergang zwischen den Raumsystemen, so wie der Planetare
Stoffwechsel der Übergang zwischen den Naturdimensionen ist (Marchand 2026a:
ZeroNature und First Nature sind nicht zeitlich getrennt, sondern analytisch).

Technische Konsequenz: NullNatur rendert in HEJ2000 (eigener 2D-Canvas, heliozentrisch,
Sonne = Ursprung). Ab Planetarem Stoffwechsel rendert WGS84 (CesiumJS, Globus). Der
„Ptolemäus-Bug" — CesiumJS ist fundamental geozentrisch, Erde minus Erde = (0,0,0),
nicht projizierbar — ist der technische Ausdruck genau dieser Systemgrenze.

---

## 3. BEOBACHTUNGSPOSITION

### 3.1 Glossar-Definition (`beobpos`)

```
Beobachtungsposition  =  (lat, lon, t, Dimension)
```

bestimmt, was in einem Matrixschnitt sichtbar ist. Macht die theoretische Situiertheit
jeder Beobachtung operational (Marchand 2026a, 3.3: „observational positionality").

### 3.2 Erweiterungsvorschlag (zu entscheiden)

Die Plattform hat in der Praxis zwei zusätzliche Achsen eingeführt:
- **Raumsystem** (WGS84 | HEJ2000) — nötig wegen NullNatur
- **SubLevel** — die Unterkategorien innerhalb einer Dimension

Vollständige operative Adresse wäre dann:

```
(Raumsystem, Koordinaten, t, Dimension, SubLevel)
```

**Offen:** Soll das Glossar/Paper 4 die `beobpos`-Definition entsprechend erweitern, oder
bleiben Raumsystem und SubLevel reine Implementierungsdetails unterhalb der
theoretischen Definition? — Entscheidung Max.

---

## 4. OFFENE KLÄRUNG: SUB-LEVEL-BEGRIFFE NULLNATUR

Im Glossar selbst gibt es bereits zwei Varianten:

| Quelle | Sub-Level NullNatur |
|---|---|
| Glossar-Eintrag `zeronatur` (Fließtext) | Solarsystem · Interplanetarer Raum · Interstellarer Raum · Universell/Fundamental |
| Glossar Matrix-Tabelle (Navigation) | Solar · Intergalakt. · Universal |
| Paper 1 (Marchand 2026a) | Solar System · Intergalactic/Interstellar Space · Universal/Fundamental |
| Plattform v0.5 (aktuell) | Universell/Vortex · Solar/Ekliptik · Erdnahraum/Mond |

Paper 1 und Glossar-Tabelle stimmen weitgehend überein (drei Ebenen). Die Plattform hat
mit „Erdnahraum" eine vierte, paper-fremde Ebene eingeführt und „Interplanetar"
weggelassen.

**Empfehlung:** Plattform an Paper 1 angleichen —
```
NullNatur / Universell      (vier Grundkräfte, kosmolog. Kontext)
NullNatur / Interstellar    (Relativität der Objekte im Raum, Vortex-Hint)
NullNatur / Solar           (Relativität Planeten↔Sonne, Ekliptik, Mond)
```
Der „Erdnahraum/Mond"-Inhalt wandert unter „Solar" (passt: Mond = Solar-System-Ebene).
„Erdnahraum" als Detailansicht innerhalb von Solar, nicht als eigene Sub-Ebene.

— Entscheidung Max.

---

## 5. KORREKTUR LAYER-BENENNUNG

Im Layer-Registry war „Paläo-Küstenlinien (Spratt & Lisiecki)" geführt. Spratt & Lisiecki
ist eine globale Meeresspiegel-**Kurve** (1D-Zeitreihe), keine Küstenkarte. Korrekt:

```
Meeresspiegel (Spratt & Lisiecki, 1D-Kurve)  ×  GEBCO (Bathymetrie)
        →  abgeleitete Küstenlinie bei t   (berechnet auf dem 0.25°-Raster)
```

ICEMAP (Patton et al.) liefert für den eurasischen Raum bereits fertige zeitabhängige
Eisschild- und Meeresbodendaten (37–8 ka, CC BY-NC-SA) und ist die bessere Quelle für
den Doggerland-Zeitraum als eine selbst abgeleitete Küstenlinie.

---

## 6. ZUSAMMENFASSUNG (Implementierungs-Checkliste)

- [ ] Eine interne Zeitvariable `t` (Jahre seit J2000), alle Anzeigen als Konversion
- [ ] BP-Konvention `a_BP = -50 - t` (Present = 1950), nicht „vor heute"
- [ ] Masterzeit-Slider interaktiv → setzt `t` → triggert Layer-Auswahl
- [ ] Zwei Raumsysteme benannt: WGS84 (Erde) / HEJ2000 (NullNatur)
- [ ] Gemeinsames Raster 0.25°, Layer als Funktionen darauf (nicht Polygone)
- [ ] Erdephemeride als Brücke zwischen den Raumsystemen
- [ ] Sub-Level-Begriffe NullNatur an Paper 1 angleichen (Entscheidung offen)
- [ ] beobpos-Erweiterung Raumsystem/SubLevel (Entscheidung offen)
- [ ] Layer-Registry: Spratt & Lisiecki korrekt als Kurve × GEBCO benennen
