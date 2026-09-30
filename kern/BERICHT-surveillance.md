# Bericht: Surveillance Watch, Erkundung der API

Stand: 2026-09-30 · Branch `struktur` · Schema 0.4.0 (nach den Entscheidungen unten)

Weiterhin gilt: nur lokal, kein Adapter, bis die Lizenz geklärt ist.

Erkundung, noch kein Adapter. Abgerufen wurde je einmal `/entities`, `/countries` und `/funders`,
mit 10 s Pause dazwischen. Die Rohdaten liegen nur lokal im Scratchpad der Sitzung, nicht im Repo.

## Kurzfassung

- **Keine Lizenz gefunden.** Gesucht wurde auf der Startseite, unter `/about`, in der API-Doku `/docs`,
  in `robots.txt` und der Sitemap, in den JS-Bundles der Seite und auf der Projektseite beim DAIR Institute.
  Nirgends stehen Lizenz oder Nutzungsbedingungen. Es gibt nur die Aussage „open for any organization to
  integrate“. **Daher: nur lokal, keine Daten ins Repo.**
- **Umfang:** 952 Firmen, 244 Länder und 1141 Geldgeber. Aus den Firmen ergeben sich rund 6 900
  Beziehungen:

  | Feld | Beziehungen |
  | --- | --- |
  | `providingTo` | 3 846 |
  | `funders` | 1 548 |
  | `affiliationsList` | 1 245 |
  | `surveilling` | 173 |
  | `marketInfo` | 47 |

- **Keine Beziehung hat ein Datum oder einen eigenen Beleg.** Die Quellen (4 926 URLs) hängen an der
  Firma. Zeitangaben gibt es nur als `createdAt` und `updatedAt` des ganzen Datensatzes.
- **Länder kommen nur als gerundeter Mittelpunkt.** 134 von 244 Koordinaten sind ganzzahlig. Umrisse
  liefert die API nicht, eine Fläche braucht also eine zweite Quelle.
- **Die vorgeschlagene Abbildung trägt, mit drei Stellen, an denen die Prüfung heute abbricht oder die
  Theorie nicht passt:**
  - Rückwirkung auf einen Staat: 2.2 → 2.2 ist nicht „oben nach unten“.
  - Rolle ohne Prozess: Überwachung liegt in keinem Übergang.
  - Staat als Formation.

  Einzelheiten unter 3 und 4.

## 1. Nutzungsbedingungen und Lizenz

| Ort | Befund |
| --- | --- |
| `surveillancewatch.io/` und `/about` | Next.js, Text wird im Browser nachgeladen. Im ausgelieferten HTML und in den 17 JS-Bundles kein Wort zu Lizenz, Terms oder Copyright (nur die Lizenz von core-js) |
| `/terms`, `/privacy`, `/api` | 404 |
| `/docs` (API-Doku) | Endpunkte und Antwortcodes (200, 429 „Rate limit exceeded.“, 500). Keine Lizenz, kein Schlüssel, keine Angabe zum Rate-Limit |
| `robots.txt` | `Allow: /` (erlaubt Crawlen, ist aber keine Lizenz) |
| [DAIR Institute, Projektseite](https://dair-institute.org/projects/surveillance-watch/) | Projekt von Esra'a Al Shafei. Beschrieben als „open-access“, „public repository“, API „open for any organization to integrate“. **Keine Lizenz**. Kontakt: hello@dair-institute.org |
| Antwort-Header der API | `cache-control: public, max-age=604800` (eine Woche), Netlify-Cache, keine Lizenz- oder Rate-Limit-Header |

**Folge:** Offen zugänglich heißt nicht lizenziert. Ohne ausdrückliche Lizenz gilt Urheber- und
Datenbankrecht (in der EU gibt es ein Schutzrecht für Datenbanken). Deshalb: nur lokal auswerten, nichts ins
Repo, auch keine abgeleiteten Zählungen je Firma.

Klären ließe sich das mit einer Anfrage an hello@dair-institute.org. Konkret: Unter welcher Lizenz stehen
die API-Daten, und ist eine reduzierte Weitergabe mit Quellenangabe erlaubt?

## 2. Abruf, Umfang, Beispielsätze

| Endpunkt | Status | Größe | Einträge |
| --- | --- | --- | --- |
| `/api/v1/entities` | 200 | 27,0 MB | 952 |
| `/api/v1/countries` | 200 | 0,07 MB | 244 |
| `/api/v1/funders` | 200 | 1,0 MB | 1 141 |

- Kein 429.
- Nicht abgerufen: `/entity-types`, `/cities`, `/financial-markets`.
- `/entities` ist so groß, weil `affiliationsList` ganze Firmenobjekte samt Geldgebern und Beschreibungen
  eingebettet enthält (23 MB, allein NSO Group 0,5 MB). Die eigentlichen Angaben machen wenige MB aus.

### Felder einer Firma (`/entities`)

- **Stammdaten:** `id`, `name`, `slug`, `description` (Lexical-Rich-Text)
- **`headquarters`:** ein Land, keine Adresse, kein Register. Fehlt bei 5 Firmen. `headquartersCity`
  gibt es nur bei 14 Firmen.
- **`types`:** 15 Kategorien, etwa AI-Powered (459), Facial Recognition (198), Spyware (155),
  Communications Interception (132), **Used by ICE (81)**.
- **`harmIndex`:** Werte 1–4. Verteilung: 4 → 342, 3 → 491, 2 → 118, 1 → 1.
- **`hasDirectTargets`:** 53 × wahr, genau die Firmen mit `surveilling`.
- **Beziehungen:**
  - `providingTo`: Länder
  - `surveilling`: Länder
  - `funders`: Geldgeber
  - `affiliationsList`: andere Firmen oder nur ein Name
  - `affiliations` und `subsidiaries`: Freitext
  - `marketInfo`: Börse, Ticker, ISIN
- **Belege:** `sources` mit URL und Titel, je Firma 0–27 (Median 5, eine Firma ohne Quelle).
  `otherData` ist nur bei einer Firma belegt.
- **Sonstiges:** `domains`, `createdAt` (2024-07-26 bis 2026-09-22), `updatedAt` (2026-07-07 bis 2026-09-22),
  `_status` (alle `published`)

### Felder eines Landes (`/countries`)

- `id`, `name`, `slug`, `alpha2`, `latitude`, `longitude`, `createdAt`, `updatedAt`
- `alpha2` ist nicht durchgehend ISO 3166: Kurdistan hat `KDT`.
- Palestine steht als Land.
- Alle Verweise auf Länder aus `providingTo`, `surveilling` und `headquarters` lassen sich auflösen.

### Felder eines Geldgebers (`/funders`)

- `id`, `name`, `description`, `headquarters` (Land, bei 1 138 von 1 141)
- Gemischt aus Wagniskapital, Family Offices, Banken und staatlichen Stellen, etwa U.S. Department of
  Defense, U.S. Department of Homeland Security, Israel Innovation Authority, Qatar Investment Authority.
- 5 Geldgeber tragen denselben Namen wie eine Firma.
- 6 Verweise aus `/entities` sind nur als ID vorhanden und lösen sich nicht auf.

### Fehlend oder leer

API-seitig werden zwei Dinge unterschieden, die nicht dasselbe bedeuten:

| Feld | Schlüssel fehlt | leere Liste |
| --- | --- | --- |
| `providingTo` | 175 | 14 |
| `funders` | 492 | 129 |

Ein fehlender Schlüssel ist eher „nicht erhoben“, eine leere Liste eher „keine bekannt“. Die Doku sagt dazu
nichts. `affiliationsList` enthält 322 Einträge nur mit Namen (`label`), ohne Verweis auf eine Firma.

### Beispielsätze (gekürzt)

```
Firma  Airobotics · Sitz Israel · types AI-Powered, Surveillance Drones · harmIndex 4
       providingTo [Israel] · surveilling [Palestine]
       funders [OurCrowd, M12, Charles River Ventures, Pavilion Capital, The Israel Innovation Authority]
       affiliations "Ondas Holdings" · 2 Quellen · createdAt 2024-07-26 · updatedAt 2026-07-16
Land   Germany · alpha2 DE · 51, 9
Geber  35V · Sitz United States · Family Office
Markt  (in marketInfo) Nasdaq · Ticker · ISIN; 15 Börsen, v. a. NYSE (15), Nasdaq (11)
```

## Entscheidungen (Max, 2026-09-30)

Sie ersetzen die ursprüngliche Vorgabe in Abschnitt 3, soweit sie abweicht. Die „Reibung“ unten ist damit
beantwortet und bleibt als Begründung stehen.

1. **`surveilling` als Datenbestand**, nicht als Rückwirkung und nicht als Anhaften allein.
   - Prozess „Erfassung“ im gesellschaftlichen Stoffwechsel.
   - Rollen: Bevölkerung ‹Land› (1.3, Fläche) als Rohstoff; das Produkt der Firma als Arbeitsmittel
     (fehlend, die API nennt es nicht).
   - Ausgang: Bestand „Daten“ (2. Natur) mit den Formen Rohdaten, Profil, Ware und Wissen;
     `haengt_an` = Datenträger (fehlend); `verweist_auf` = Bevölkerung ‹Land›.
   - Erhaltung „vervielfältigbar“, daher keine Bilanzprüfung.
2. **`providingTo` als zwei Relationen:**
   - (a) Tausch als Einschließen und Realisieren, Firma → Staat, `ware` = Produkt (fehlend).
   - (b) Rolle: Produkt als Arbeitsmittel im Prozess „Erfassung“. Der Ausgang Wissen wird zum
     immateriellen Produktionsmittel.
3. **Formation = Kapitalismus.** Der Staat ist Institution (2.2) und Glied in `haengt_an`.
   Konzernbeziehungen sind Anhaften (Eigentum), 2. Natur an 2. Natur. Es gibt keine neue Relationsart.
4. **Umgesetzt im Schema (0.4.0):**
   - `Relation.bezugszeit` ist Pflicht, fehlend nur mit Begründung.
   - `Relation.beleg` ist eine Liste von Quellen oder `{ebene: 'nur_auf_eintragsebene', eintrag, quellen}`
     oder fehlend.
   - Ein Ende einer Relation darf fehlend sein (mit Begründung), nicht beide.
   - Fehlender API-Schlüssel und leere Liste heißen beide „nicht erhoben“ (`nichtErhoben()`), nie
     „keine Beziehung“.
   - Das Schema setzt keine Eintragsart „Firma“ voraus.
   - „Used by ICE“ wird eine Rolle zur Institution ICE (2.2), die angelegt wird.
5. **Weiterhin nur lokal.** Kein Adapter, bis die Lizenz geklärt ist.

Dafür nötig waren außerdem, und ebenfalls umgesetzt:

| Änderung | Warum |
| --- | --- |
| `Bestand.erhaltung` = erhalten, nicht_erhalten oder vervielfaeltigbar | ersetzt `erhalten: boolean`; Daten werden kopiert, ohne dass das Original abnimmt |
| Formwechsel bei vervielfaeltigbar: Stoffwechsel oder Einschließen und Realisieren, nie mit Bilanz | Rohdaten → Profil geschieht im Prozess; Profil → Ware ist Einschließen |
| `Bestand.haengt_an` und `Bestand.verweist_auf` | Regel 2 gilt auch für Bestände der 2. Natur. Folge: Auch „Kapital“ braucht jetzt `haengt_an`, fehlend ist zulässig |
| `Relation.als` = rohstoff, arbeitsmittel oder produkt, Pflicht bei Rollen; `nach` einer Rolle ist ein Prozess | „als Rohstoff, Arbeitsmittel oder Produkt“ aus dem Strukturstand war bisher nicht prüfbar |
| `Relation.ware` nur bei Tausch, Verweis oder fehlend | Ware = Produkt (fehlend) |
| Ausgangsart `daten` | Ausgang der Erfassung |

### Abbildung nach den Entscheidungen

| Objekt | Stapel | haengt_an / wo | Formation |
| --- | --- | --- | --- |
| Akteur `sw/akteur/<slug>` (Firma, Behörde oder App, laut Quelle) | 2.2 | `[sw/registrierung/<slug>]` | Kapitalismus |
| Registrierung | 2.2 | `[sw/staat/<land>]`; Registernummer fehlend | Kapitalismus |
| Staat `sw/staat/<land>` | 2.2 (Institution) | `[sw/gebiet/<land>]` | Kapitalismus |
| Gebiet `sw/gebiet/<land>` | 1.1 | `flaeche`, Umriss aus zweiter Quelle | – |
| Bevölkerung `sw/bevoelkerung/<land>` | 1.3 | `flaeche` | – |
| Institution ICE `sw/institution/ice` | 2.2 | `[sw/staat/united-states]` | Kapitalismus |
| Prozess `sw/erfassung/<land>` | Übergang gesellschaftlich | – | – |
| Bestand `sw/daten/<land>` | Formen in 2.3 | `haengt_an` fehlend, `verweist_auf` Bevölkerung | – |

| API-Feld | Relationen |
| --- | --- |
| `surveilling` (173) | Rolle Bevölkerung → Erfassung (rohstoff); Rolle Produkt (fehlend) → Erfassung (arbeitsmittel); Ausgang der Erfassung: Rohdaten |
| `providingTo` (3 846) | (a) `einschliessen_realisieren` Akteur → Staat, `ware` fehlend; (b) Rolle Produkt (fehlend) → Erfassung (arbeitsmittel) |
| `types: Used by ICE` (81) | Rolle Produkt (fehlend) → Erfassung durch ICE (arbeitsmittel) und Tausch Akteur → ICE |
| `funders` (1 548) | `einschliessen_realisieren` Geldgeber → Akteur; 6 mit `von` fehlend |
| `marketInfo` (47) | `einschliessen_realisieren` Akteur → Börse |
| `affiliationsList` (1 245) | `anhaften` Akteur → Akteur (Eigentum); 323 mit `nach` fehlend (nur Name) |
| alle | `bezugszeit` fehlend; `beleg` `{ebene: 'nur_auf_eintragsebene', eintrag: <Akteur>, quellen}`; fehlender Schlüssel oder leere Liste → `nichtErhoben()` |

Offen, nur mit Daten entscheidbar:

- Bei `providingTo` ohne `surveilling` ist unklar, ob eine Erfassung durch den Staat stattfindet oder nur
  ein Verkauf. Relation (b) setzt voraus, dass das Produkt eingesetzt wird. Ihr Modus bleibt fehlend,
  nicht „vollzogen“.
- Die Formen Profil, Ware und Wissen nennt die API nicht. Sie bleiben angelegt, aber ohne Werte.

## 3. Abbildung nach der ursprünglichen Vorgabe

Das ist der Stand vor den Entscheidungen, hier nur noch zur Begründung. Wo die Vorgabe mit Schema oder
Theorie rieb, steht das unter „Reibung“.

### Einträge

| Objekt | Stapel | haengt_an / wo | Formation | Herkunft | Anzahl |
| --- | --- | --- | --- | --- | --- |
| Firma `sw/firma/<slug>` | 2.2 | `[sw/registrierung/<slug>]` | Staat des Sitzes, `{id, von: fehlt, bis: fehlt}` | kuratiert | 952 (5 ohne Sitz: Formation und Registrierung fehlend) |
| Registrierung `sw/registrierung/<slug>` | 2.2 | `[sw/gebiet/<land>]` | Staat des Sitzes | kuratiert; Registernummer und -ort **fehlend** (die API nennt nur ein Land) | 947 |
| Geldgeber `sw/geber/<slug>` | 2.2 | Registrierung wie bei der Firma | Staat des Sitzes | kuratiert | 1 141 |
| Börse `sw/boerse/<slug>` | 2.2 | fehlend („Sitz der Börse nennt die API nicht“) | fehlend | kuratiert | 15 |
| Staat `sw/staat/<land>` | 2.2 | `[sw/gebiet/<land>]` | – (wird selbst als Formation geführt, siehe Reibung) | kuratiert | 244 |
| Gebiet `sw/gebiet/<land>` | 1.1 | `wo: {geometrie: 'flaeche', …}`, Umriss aus einer zweiten Quelle | – | Umriss: Quelle des Umrisses; Mittelpunkt der API **nicht** als Punkt | 244 |

**Länder als Fläche.** Die API liefert nur einen gerundeten Mittelpunkt. Ein Mittelpunkt ist kein Träger
und erscheint nicht als Punkt. Für die Fläche braucht es Umrisse, etwa Natural Earth (gemeinfrei). Dabei gilt:

- Grenzen sind abgeleitet und Setzung (Regel 7). Palestine, Kurdistan und Western Sahara sind in jeder
  Umrissquelle strittig.
- Wo die Umrissquelle ein „Land“ der API nicht führt (Kurdistan), bleibt die Fläche fehlend mit Grund.

### Relationen (je Beziehung eine eigene)

| API-Feld | Relation | von → nach | Modus | Anzahl |
| --- | --- | --- | --- | --- |
| `providingTo` | `rolle` | Firma → Prozess „Überwachung durch Staat X“ (siehe Reibung) | fehlend: vollzogen, erwartet oder zugeschrieben sagt die Quelle nicht | 3 846 |
| `surveilling` | `rueckwirkung` | Firma → Gebiet X (1.1) | – | 173 |
| `funders` | `einschliessen_realisieren` | Geldgeber → Firma | fehlend (Beteiligung, Kredit, Zuschuss oder Auftrag ununterscheidbar) | 1 542 auflösbar, 6 nicht |
| `marketInfo` | `einschliessen_realisieren` | Firma → Börse | fehlend (eine Notierung ist weder „realisiert“ noch ein Tausch); Ticker und ISIN als Werte der Firma | 47 |
| `affiliationsList` | **offen**, keine der sechs Arten passt eindeutig | Firma → Firma | – | 922 auflösbar, 323 nur Name |

Für jede Relation gilt:

- **Bezugszeit:** fehlend („Die Quelle datiert Beziehungen nicht“).
- **Wissensstand:** `{seit: updatedAt der Firma, status: 'vorlaeufig'}` mit Hinweis „Zeitstempel des
  Datensatzes, nicht der Beziehung“. Alternative: fehlend.
- **Herkunft:**

  ```
  woher: {
    arten: ['kuratiert'],
    quelle: 'Surveillance Watch API v1 (/entities), Abruf 2026-09-30',
    archivkette: [
      { archiv: 'zeroearth', art: 'zeroearth' },
      { archiv: 'Surveillance Watch (DAIR)', art: 'gesellschaftlich' },
      { archiv: 'Quellenliste der Firma, n URLs', art: 'gesellschaftlich' },
    ],
    belege: [...URLs der Firma],             // neues Feld, siehe 4
    beleg_ebene: 'Firma, nicht pro Beziehung belegt',
  }
  ```

### Reibung mit Schema und Theorie

1. **`surveilling` als Rückwirkung.** `pruefe.mjs` verlangt „oben nach unten“. Zielt die Relation auf den
   Staat (2.2), ist das 2.2 → 2.2 und ein Verstoß. Deshalb zeigt sie oben auf das Gebiet (1.1). Überwacht
   werden aber Menschen, nicht eine Fläche. Ob das Ziel das Gebiet (1.1) oder die Bevölkerung (1.3 Basis?)
   ist, muss der Strukturstand sagen. Bei Palestine (27 von 173 Beziehungen) fallen „Staat“ und „Gebiet“
   ohnehin nicht zusammen.
2. **`providingTo` als Rolle.** Eine Rolle spannt „ein Ding für einen Zeitraum in einen Prozess“ ein. Dabei
   gibt es zwei Probleme:
   - Das Ding ist das Produkt, nicht die Firma. Die Daten trennen beides nicht, `types` nennt nur Kategorien.
   - Ein Prozess muss in einem Übergang liegen (planetar oder gesellschaftlich). Überwachung ist kein
     Stoffwechsel im engen Sinn. Das Schema hat keinen Ort für Prozesse, die ganz in der 2. Natur laufen.

   Behelf: ein Prozess „Überwachung durch Staat X“ im gesellschaftlichen Übergang, ausgewiesen als Setzung.
   Das ist eine Frage an den Strukturstand.
3. **Staat als Formation.** Laut Strukturstand verweist jeder Eintrag der 2. Natur auf die
   Gesellschaftsformation, etwa Kapitalismus, Doggerland oder Subsistenz. Ein Staat ist eher Institution und
   Geltungskreis. Die Vorgabe „Formation = Staat des Sitzes“ vermischt beides.

   Alternative: Formation „kapitalistische Warenproduktion“ (`warenproduktion: true`), der Staat als
   2.2-Eintrag in der Kette `haengt_an`. Dann gilt auch die Verwertungsqualität, und die Börsennotierung
   hat einen Ort. Bitte entscheiden.
4. **`types: Used by ICE`** ist keine Kategorie, sondern eine Beziehung (Rolle zu einer Behörde). Eine
   ICE-Entität gibt es in der API nicht. Deshalb eine Rolle nach „U.S. Immigration and Customs Enforcement“
   mit fehlender ID, oder als Kategorie belassen mit Hinweis.
5. **Nicht jede „Entity“ ist eine Firma.** Aarogya Setu ist eine App der indischen Regierung. Unter den
   Geldgebern sind Ministerien. Die Klasse „Firma“ ist eine Setzung der Quelle, die in der Abbildung als
   Auswahl erscheinen sollte.
6. **Geldgeber ist nicht gleich Kapitalfluss.** Ein Zuschuss der Israel Innovation Authority und eine
   VC-Beteiligung sind verschiedene Formwechsel. Die Quelle unterscheidet sie nicht. Der Modus bleibt fehlend.

## 4. Was nach den Regeln 1–11 fehlt oder verstößt

| Regel | Befund | Folge für den Adapter |
| --- | --- | --- |
| 1 Relationen gespeichert | Beziehungen stecken in Feldern der Firma. `affiliations` und `subsidiaries` sind Freitext, `affiliationsList` bettet ganze Firmen ein | jede Beziehung als eigene Relation; Freitext nicht zerlegen, sondern als Wert (Text) führen; eingebettete Objekte nur per ID |
| 1 | Art der Affiliation (Tochter, Mutter, Partner, Übernahme) nicht angegeben | Relationsart **fehlt im Schema**; bis zur Klärung nicht als Relation, sondern als Hinweis |
| 2 2. Natur ohne wo | Firmen haben `headquarters` mit Koordinaten (Mittelpunkt des Landes) | Koordinaten verwerfen; Ort nur über `haengt_an` → Registrierung → Gebiet |
| 2 | Registrierung nicht in den Daten, nur das Land | Registrierungseintrag mit Registernummer fehlend; bei 5 Firmen ganze Kette fehlend |
| 2 | Formation zeitgebunden `{id, von, bis}`: keine Zeiten | von und bis fehlend mit Grund. Formation selbst: Staat oder Kapitalismus ist **zu entscheiden** (3.3) |
| 2 | Börsen ohne Sitz, ohne Formation | `haengt_an` und Formation fehlend mit Begründung |
| 3 Gegenwert nur mit Tausch | keine Beträge in den Daten | kein Verstoß; Finanzierungsbeträge dürften später nur mit einem Tausch erscheinen |
| 4 Wahrscheinlichkeit mit Träger | `harmIndex` ist eine Bewertung, keine Wahrscheinlichkeit | kein Verstoß; als kuratierter Wert mit Hinweis „Bewertung der Quelle“. Das Schema hat keinen Ort für Bewertungen (weder Gebrauchs- noch Verwertungsqualität) |
| 5 Kapital nicht bilanzierbar | Geldgeber und Börse sind Kapitalrelationen | ohne `bilanz`; kein Verstoß |
| 6 Herkunft pro Wert, Kette durch Archive | Belege gibt es nur pro Firma, nicht pro Beziehung | **Verstoß gegen den Geist der Regel:** Die Herkunft lässt sich nicht pro Wert angeben. Behelf: Quellenliste der Firma an jede Relation, `beleg_ebene` „nicht pro Beziehung belegt“. **Das Schema hat dafür kein Feld** (`belege`, `beleg_ebene` neu; wie `herkunft.ebene` im Sintflut-Manifest) |
| 6 | Arten: Presseberichte und Firmenseiten sind nicht nur kuratiert | `arten: ['kuratiert']` allein ergibt Rang „keiner“. Ob einzelne Belege `beobachtung` tragen, lässt sich ohne Lesen der Quellen nicht sagen |
| 7 Auswahl ausgewiesen | Welche Akteure als „surveillance entity“ gelten, entscheidet die Quelle; `harmIndex` und `types` sind ihre Setzungen; Ländergrenzen sind Setzungen | Auswahl `sw/auswahl/korpus` (Setzung der Quelle), `sw/auswahl/umrisse` (Grenzquelle), `sw/auswahl/endpunkte` (3 von 6 abgefragt) |
| 8 Fehlendes bleibt fehlend | Bezugszeit fehlt bei jeder Beziehung. `providingTo` und `funders`: fehlender Schlüssel vs. leere Liste (175/14, 492/129). 5 ohne Sitz. 6 Geldgeber und 323 Affiliationen unauflösbar. 1 Firma ohne Quelle | fehlender Schlüssel → fehlend „nicht erhoben“; leere Liste → keine Relation, Hinweis „Quelle: keine bekannt“. Unauflösbares: Relation mit `nach` fehlend, **das erlaubt das Schema heute nicht** (`nach` muss auf einen Eintrag zeigen) |
| 8 | Relationen haben im Schema **kein Feld `bezugszeit`** | Schema erweitern: `Relation.bezugszeit` (Pflicht, darf fehlend sein). Gerade eine Rolle gilt „für einen Zeitraum“ |
| 9 zeroearth in der Kette | – | Archivkette beginnt bei zeroearth; kein Verstoß |
| 10 Verzerrung als Zahl | Gebiete als `flaeche` brauchen Flächenverzerrung und Überhöhung | Zahlen aus der Umrissquelle und Projektion; Mittelpunkte der API nicht verwenden |
| 11 Reduktion im Manifest | Auswahl von Endpunkten und Feldern (ohne `description`, `domains`, `otherData`, eingebettete Kopien) | `reduktion: [{schritt: 'auswaehlen', angabe: '3 von 6 Endpunkten; Felder …'}]`; nichts zusammengefasst, keine Spannweite nötig |
| Lizenz (Manifest) | keine Lizenz | `lizenz: fehlt('keine Lizenz angegeben; nur lokal')`, `weitergabe: nichts im Repo` |

### Schemaänderungen: Stand

1. `Relation.bezugszeit`: **umgesetzt**.
2. Beleg auf Eintragsebene: **umgesetzt** als `Relation.beleg`, nicht als Feld in `woher`.
3. Relation mit fehlendem Ende: **umgesetzt** (ein Ende, mit Begründung).
4. Prozesse in der 2. Natur: **entschieden**. Die Erfassung liegt im gesellschaftlichen Übergang.
5. Konzernbeziehungen: **entschieden**. Anhaften, keine neue Art.

## Nächste Schritte

1. Anfrage zur Lizenz an DAIR (hello@dair-institute.org). Bis zur Antwort nur lokal, kein Adapter.
2. Nach Klärung der Lizenz: Adapter nach der Abbildung oben.
