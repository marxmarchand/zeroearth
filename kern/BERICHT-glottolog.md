# Bericht: Glottolog, Erkundung für 2.3 (symbolisches System)

Stand: 2026-11-01 · Branch `struktur` · Schema 0.5.0 · noch kein Adapter, Bau erst nach Okay

Geholt wurden nur die CLDF-Tabellen `languages.csv` (2,5 MB), `values.csv` (21 MB), `parameters.csv`,
`codes.csv` und das README. Alles liegt im Scratchpad der Sitzung, nichts im Repo. Nicht geholt:
`names.csv` (4,3 MB) und `sources.bib.zip` (41,5 MB).

## Kurzfassung

- **Glottolog 5.3** (März 2026), als CLDF auf GitHub, **CC BY 4.0**.
- 8 618 Sprachen, 8 304 davon mit Koordinate, je **ein Punkt**, kein Gebiet.
- **Gefährdung** (AES, sechs Stufen) gibt es für 8 242 Sprachen, **mit Quelle pro Status**:
  - Ethnologue 2025: 3 960
  - ElCat 2022: 3 106
  - UNESCO-Atlas 2010: 344
  - ohne Quellen-ID: 705
- **Es fehlen:** Sprecherzahlen, eine Bezugszeit des Status und ein Sprachgebiet. Die Formation ist überall
  unbekannt.
- **Größe nach Reduktion:** 0,7 MB, mit den Statuskommentaren der Quellen 1,6 MB. Beides liegt deutlich unter
  5 MB.

## 1. Quelle

| | |
| --- | --- |
| Version | Glottolog 5.3, Release `v5.3` von `glottolog/glottolog-cldf`, veröffentlicht 2026-03-02. glottolog.org zeigt ebenfalls 5.3 |
| Lizenz | CC BY 4.0 (Repository und `cldf-metadata.json`) |
| Zitierung | laut `cldf-metadata.json`: „Hammarström, Forkel, Haspelmath & Bank. 2025. Glottolog 5.2.1. Leipzig: MPI EVA“. **Die Angabe ist veraltet:** Das Release ist 5.3, die Metadaten nennen 5.2.1. Eine Zenodo-DOI für 5.3 habe ich nicht gefunden |
| Zugang | `https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.3/cldf/<datei>`, ohne Schlüssel. Ein festes Release-Tag macht den Abruf reproduzierbar |
| Format | CLDF StructureDataset: CSV mit JSON-Metadaten |

**Dateien:**

| Datei | Größe | Inhalt |
| --- | --- | --- |
| `languages.csv` | 2,5 MB | 27 177 Languoide (4 853 Familien, 8 618 Sprachen, 13 706 Dialekte): `ID` (Glottocode), `Name`, `Macroarea`, `Latitude`, `Longitude`, `ISO639P3code`, `Level`, `Countries`, `Family_ID`, `Language_ID`, `First_Year_Of_Documentation`, `Last_Year_Of_Documentation`, `Is_Isolate` |
| `values.csv` | 21 MB | Werte je Languoid und Parameter, mit `Comment` und `Source` |
| `parameters.csv`, `codes.csv` | 4 KB | Parameter: `level`, `category`, `classification`, `subclassification`, `med`, `medovertime`, `aes`, `bib`; Codes der Stufen |
| `names.csv` | 4,3 MB | Namen in anderen Sprachen und Katalogen (nicht nötig) |
| `sources.bib.zip` | 41,5 MB | Bibliografie (nicht nötig; die drei Statusquellen sind unten aufgelöst) |

## 2. Felder

### Sprache

- **Level:** `language`. Von den Kategorien zählen:

  | Kategorie | Anzahl |
  | --- | --- |
  | Spoken L1 Language | 7 674 |
  | Bookkeeping | 380 |
  | Sign Language | 227 |
  | Unclassifiable | 128 |
  | Pidgin | 87 |
  | Unattested | 68 |
  | Artificial Language | 31 |
  | Speech Register | 19 |
  | Mixed Language | 4 |

- **Koordinate:** 8 304 von 8 618 Sprachen haben eine. Für Familien sind es rekursive Schwerpunkte, Dialekte
  erben meist die Koordinate ihrer Sprache (README).
- **Sprachfamilie:** `Family_ID` (Glottocode der obersten Familie), 247 Familien. Am größten sind
  Atlantic-Congo (1 408), Austronesian (1 276), Indo-European (586) und Sino-Tibetan (519). Isolate haben
  keine Familie. Der volle Pfad steht in `classification`.
- **Länder:** `Countries` ist bei 8 520 Sprachen belegt.
- **Dokumentationsjahre:** `First_Year_Of_Documentation` nur bei 212, `Last_Year_Of_Documentation` bei 1 013
  Sprachen.

### Gefährdung (AES, „Agglomerated Endangerment Status“)

| Stufe | Bedeutung (codes.csv) | Sprachen |
| --- | --- | --- |
| 1 not endangered | EGIDS ≤ 6a; UNESCO safe; ElCat safe | 2 831 |
| 2 threatened | EGIDS 6b; vulnerable | 1 599 |
| 3 shifting | EGIDS 7; definitely endangered | 1 828 |
| 4 moribund | EGIDS 8a; severely endangered | 433 |
| 5 nearly extinct | EGIDS 8b; critically endangered | 312 |
| 6 extinct | EGIDS ≥ 9; extinct | 1 239 |
| ohne Status | | 376 |

**Quelle pro Status.** `Source` verweist auf die Bibliografie, `Comment` gibt die Einstufung der Quelle
wörtlich wieder.

| Bib-ID | Quelle | Sprachen | Form des Kommentars |
| --- | --- | --- | --- |
| 701778 | Ethnologue (Eberhard, Simons, Fennig; SIL International), **2025** | 3 960 | „Omurano (omu-omu) = 10 (Extinct).“ (EGIDS-Stufe) |
| 569683 | Catalogue of Endangered Languages, **ElCat 2022** (Campbell u. a.) | 3 106 | „Fasu (10734-faa) = Threatened (20 percent certain, based on the evidence available) [Hammarström 2017]“, mit Sicherheitsgrad und Primärquelle |
| 550905 | UNESCO, Atlas of the world's languages in danger (Moseley), **2010** | 344 | |
| 571261, 570887 | Ethnologue 2018 bzw. 2020 | 19 bzw. 14 | |
| – | ohne Quellen-ID | 705 | Kommentar meist im Ethnologue-Format |

- **ElCat** liefert einen Sicherheitsgrad („20 percent certain“) und eine Primärquelle. Das ist die
  genaueste Herkunft im Datensatz.
- **Ethnologue** ist ein kostenpflichtiges Werk von SIL. Glottolog veröffentlicht die EGIDS-Einstufung im
  Kommentar unter CC BY 4.0. Ob das die wörtliche Weitergabe der Ethnologue-Kommentare deckt, sollte vor dem
  Einbinden geklärt werden. Ohne Kommentar bleibt nur die AES-Stufe von Glottolog selbst, und die Frage
  stellt sich nicht.

### Was nicht enthalten ist

- **Sprecherzahlen:** nicht in Glottolog. Ethnologue führt sie (kostenpflichtig); ElCat nennt sie auf seiner
  Website, sie sind aber nicht in diesen Daten.
- **Bezugszeit des Status:** Es gibt kein Datumsfeld. Das Jahr der Quelle (2025, 2022, 2010) sagt, seit wann
  die Einstufung so bekannt ist, also den Wissensstand, nicht wann sie gilt. Die Kommentare enthalten
  Jahreszahlen (meist 2000er und 2010er), aber gemischt: Erhebungsjahre, Jahre der Primärquellen,
  vereinzelt Prognosen (2030–2090). Ohne Lesen jedes Kommentars sind sie nicht als Bezugszeit verwertbar.
- **Sprachgebiet:** nur ein Punkt je Sprache.
- **Gesellschaftsformation:** nirgends.

## 3. Abbildung nach docs/strukturstand.md (Vorschlag)

### Einträge

| Objekt | Stapel | Ort | Werte | Herkunft |
| --- | --- | --- | --- | --- |
| Sprache `glottolog/<glottocode>` | 2.3 | **kein `wo`**; `haengt_an: [glottolog/<glottocode>/gemeinschaft]` | Name, Familie (Glottocode und Name), Kategorie | kuratiert; zeroearth ← Glottolog 5.3 (gesellschaftlich) |
| Sprachgemeinschaft `glottolog/<glottocode>/gemeinschaft` | 1.3 | `punkt`, **ausgewiesen als Näherung** (siehe unten) | – | kuratiert; Koordinate laut Glottolog, deren Herkunft je Sprache nicht angegeben ist (dritte Stelle der Archivkette fehlend) |
| Formation | – | – | `formation: fehlt('Glottolog nennt keine Gesellschaftsformation')` bei allen Sprachen | – |

**Punkt als Näherung (Regel 10).** Eine Sprachgemeinschaft hat ein Gebiet, Glottolog gibt einen Punkt.
Vorschlag fürs Schema: `wo.naeherung` als Pflichtangabe, wenn ein Punkt eine Fläche vertritt, etwa:

```
wo: {
  geometrie: 'punkt',
  naeherung: 'Punkt statt Sprachgebiet (Glottolog-Koordinate)',
  verzerrung: { flaeche: fehlt('Ausdehnung des Sprachgebiets unbekannt'), ueberhoehung: 1 },
}
```

Die Prüfung verlangt Verzerrungszahlen bisher nur bei Fläche, Feld und Grenze. Mit `naeherung` würde die
fehlende Fläche sichtbar statt verschwiegen.

**Ausgestorbene Sprachen** (1 239): Die Sprachgemeinschaft besteht nicht mehr. Der Träger bleibt als
historischer Eintrag mit Punkt. Seine Bezugszeit fehlt, weil Glottolog sie nicht nennt.
`Last_Year_Of_Documentation` (bei 1 013 Sprachen belegt) gibt nur eine untere Grenze für „zuletzt belegt“.
Vorschlag: als eigener Wert führen, nicht als Bezugszeit.

### Gefährdung als Überlieferung mit Modus

Gefährdung ist die Weitergabe einer Form der 2. Natur an die nächste Generation, also Überlieferung. Ein
Abbruch der Neuverankerung wird als Verlust gezeigt.

- **Relation:** `art: 'ueberlieferung'`, `von` = Sprache, `nach` = Sprachgemeinschaft, je Sprache mit Status.
- **Modus:** die sechs AES-Stufen unverändert: `nicht_gefaehrdet`, `bedroht`, `im_wechsel`, `moribund`,
  `fast_erloschen`, `erloschen`.
  - **Schemaänderung nötig:** `VORGAENGE.ueberlieferung` hat bisher keine Modi.
  - Eine eigene, gröbere Skala wäre eine Setzung (Regel 7); die sechs Stufen der Quelle reichen.
  - `erloschen` ist der Abbruch der Kette, der als Verlust erscheint.
- **Herkunft pro Status:** `arten: ['kuratiert']`. Archivkette: zeroearth ← Glottolog 5.3 (gesellschaftlich) ←
  Statusquelle (Ethnologue 2025, ElCat 2022 oder UNESCO 2010; gesellschaftlich). Bei 705 Sprachen ohne
  Quellen-ID ist das dritte Glied fehlend.
- **Beleg:** `beleg: ['Ethnologue 2025 (Glottolog-Bib 701778)', …]`, pro Relation. Der Kommentar der Quelle
  kommt optional dazu (siehe Lizenzfrage).
- **ElCat-Sicherheitsgrad** („20 percent certain“) als eigener Wert an der Relation, nicht als
  Wahrscheinlichkeit. Regel 4: Eine Wahrscheinlichkeit gehört ihrem Erwartungsträger; hier ist der Träger
  ElCat. Vorschlag: `erwartungstraeger: 'ElCat'` und Herkunft `erwartung`, oder als Text belassen. Das ist
  zu entscheiden.
- **Bezugszeit:** `fehlt('Glottolog datiert den Status nicht; das Jahr der Quelle ist Wissensstand, nicht
  Bezugszeit')`.
- **Wissensstand:** `{seit: <Jahr der Quelle>, status: 'vorlaeufig'}`, zum Beispiel 2025 bei Ethnologue.
- **Ohne Status** (103 nach der Auswahl unten): Relation `fehlt`, über `nichtErhoben('Gefährdung')`, nie
  „nicht gefährdet“.

### Familie

Die Sprachfamilie ist eine Abstammung von Sprachen, also selbst Überlieferung über lange Zeit. Zwei
Möglichkeiten:

- **(a) Einfach, empfohlen für den ersten Adapter:** Familie als kuratierter Wert der Sprache (Glottocode und
  Name). Der Klassifikationspfad bleibt außen vor.
- **(b) Später, für die Netzansicht:** Familien als Einträge in 2.3 und Abstammung als
  `ueberlieferung`-Relationen. Bei 247 Familien und tiefen Bäumen wäre das ein eigener Schritt.

### Auswahl (Regel 7)

- **Nur Level `language`, ohne Dialekte.** Die Dialekte erben ohnehin die Koordinate ihrer Sprache.
- **Kategorien:** Spoken L1, Sign, Pidgin, Mixed. Das ergibt 7 992 Sprachen.
  - Ausgeschlossen: Bookkeeping, Unclassifiable, Unattested, Artificial, Speech Register.
  - Die Auswahl ist eine Setzung und wird als Auswahl ausgewiesen. Gebärdensprachen gehören hinein:
    2.3 ist eine Strecke von Signal zu Symbol und setzt keine Lautsprache voraus.
- **Ohne Koordinate** (42): Die Sprache bleibt, der Träger hat `wo` fehlend.

### Was nach den Regeln fehlt oder offen ist

| Regel | Befund |
| --- | --- |
| 2 | erfüllt: kein `wo` an der Sprache, Träger in 1.3, Formation fehlend mit Begründung |
| 4 | ElCat-Sicherheitsgrad: Wahrscheinlichkeit nur mit Träger (siehe oben) |
| 6 | Herkunft pro Status erfüllbar; bei 705 Sprachen fehlt die Statusquelle (sichtbar fehlend) |
| 7 | Auswahl der Kategorien, Familie als Wert statt Baum: ausgewiesen |
| 8 | fehlend und sichtbar: Sprecherzahlen, Bezugszeit des Status, Sprachgebiet, 42 Koordinaten, 103 Status |
| 10 | Punkt statt Gebiet: braucht `wo.naeherung` (Schemavorschlag) |
| 11 | Reduktion im Manifest (unten) |
| 12 | erfüllt: nur Übernahme und Auswahl, keine Modellierung |
| Schema | Modi für `ueberlieferung`; `wo.naeherung` |

## 4. Größe nach Reduktion und Manifest-Entwurf

Probelauf (Scratchpad, nicht im Repo), kompaktes JSON:

| Inhalt | Sprachen | Größe | gzip |
| --- | --- | --- | --- |
| Glottocode, Name, Familie, Punkt (2 Nachkommastellen), AES-Stufe, Quellenschlüssel; dazu Tabelle der 241 Familiennamen | 7 992 | **0,73 MB** | 0,16 MB |
| dasselbe plus Statuskommentar der Quelle | 7 992 | **1,60 MB** | 0,40 MB |

Der Graph mit Einträgen, Relationen und Herkunft entsteht erst im Adapter beim Laden. Er liegt nicht im
Repo.

```json
{
  "id": "glottolog",
  "eingabe": "data/glottolog.json",
  "quelle": {
    "name": "Glottolog 5.3 (CLDF)",
    "zugang": "https://github.com/glottolog/glottolog-cldf, Release v5.3",
    "dateien": ["cldf/languages.csv", "cldf/values.csv"],
    "abgeleitet_durch": "matrix-scharnier/adapter/glottolog.py (zu bauen)",
    "zitierung": "Hammarström, Forkel, Haspelmath & Bank: Glottolog 5.3. MPI EVA Leipzig (Metadaten nennen noch 5.2.1)"
  },
  "stapel": ["2.3", "1.3"],
  "vorgang": "ueberlieferung",
  "herkunft": {
    "arten": ["kuratiert"],
    "archivkette": [
      { "archiv": "zeroearth (data/glottolog.json)", "art": "zeroearth" },
      { "archiv": "Glottolog 5.3", "art": "gesellschaftlich" },
      { "archiv": "Statusquelle je Sprache: Ethnologue 2025, ElCat 2022, UNESCO-Atlas 2010", "art": "gesellschaftlich" }
    ]
  },
  "zeitsemantik": {
    "skala": "a CE",
    "aufloesung": { "fehlt": true, "grund": "Status ohne Datum" },
    "abdeckung": { "fehlt": true, "grund": "Glottolog nennt keine Bezugszeit des Status" },
    "verzoegerung": { "fehlt": true, "grund": "Abstand zwischen Erhebung und Quelle unbekannt; Quellenjahre 2010–2025" }
  },
  "geometrie": ["punkt"],
  "lizenz": { "angabe": "CC BY 4.0", "quelle": "glottolog-cldf, cldf-metadata.json", "geprueft": "2026-11-01",
              "offen": "Weitergabe der Ethnologue-Kommentare (SIL) wörtlich?" },
  "weitergabe": {
    "im_repo": "data/glottolog.json: je Sprache Glottocode, Name, Familie, Punkt (0,01°), AES-Stufe, Statusquelle",
    "nicht_im_repo": "names.csv, sources.bib, Dialekte, Klassifikationsbäume"
  },
  "auswahl": ["glottolog/auswahl/kategorien", "glottolog/auswahl/level"],
  "reduktion": [
    { "schritt": "auswaehlen", "angabe": "Level language (8 618 von 27 177 Languoiden), ohne Dialekte und Familien als Einträge" },
    { "schritt": "auswaehlen", "angabe": "Kategorien Spoken L1, Sign, Pidgin, Mixed: 7 992 Sprachen" },
    { "schritt": "auswaehlen", "angabe": "Parameter aes und Familie; ohne med, medovertime, bib, names" },
    { "schritt": "vergroebern", "angabe": "Koordinaten auf 0,01° gerundet (≈ 1 km); die Punkte sind ohnehin Näherungen" }
  ]
}
```

## Vor dem Bau zu entscheiden

1. **Statuskommentare übernehmen** (1,6 MB, enthalten Ethnologue-Wortlaut) **oder nur Stufe und Quelle**
   (0,7 MB)?
2. **Schema:** Modi für `ueberlieferung` (die sechs AES-Stufen) und `wo.naeherung`. Beides einführen?
3. **ElCat-Sicherheitsgrad:** als Wahrscheinlichkeit mit Erwartungsträger ElCat oder als Text?
4. **Familie:** zunächst als Wert (a) oder gleich als Baum (b)?
5. **Kategorien:** Ist die Auswahl (mit Gebärdensprachen, ohne Kunstsprachen) so richtig?
