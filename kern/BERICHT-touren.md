# Bericht: Touren

Stand: 2026-11-05. Zwei Touren laufen in `index.html`: Sintflut und „Was hängt an einem Haus?“. Geprüft im eingebauten Browser und mit Chromium (Playwright) gegen einen lokalen statischen Server (`python3 -m http.server`). Den Live Server aus VS Code konnte ich nicht bedienen; er liefert dieselben Dateien.

## Schwarzer Globus

Zwei Ursachen, beide behoben:

- Das Grundbild lud gar nicht. Seit Cesium 1.107 lädt `new TileMapServiceImageryProvider({url})` nichts mehr, und `Viewer` kennt die Option `imageryProvider` nicht mehr. Jetzt: `TileMapServiceImageryProvider.fromUrl`, `baseLayer: false` im Viewer.
- Der Code verlangte Stufe 5, die Quelle hat nur Stufen bis 2. Das erzeugte 404 ohne CORS-Kopf und Nähte im Bild. Die Stufen kommen jetzt aus `tilemapresource.xml`.

Im Terminator-Licht liegt die Nachtseite weiter dunkel, das ist gewollt. Die Tour schaltet das Licht deshalb während der Tour auf gleichmäßig und stellt es am Ende zurück.

## Kopfzeile und linke Spalte

`#hdr` hatte keine feste Zeile im Raster. Sobald `#mini-null` in der Erdansicht Zeile 1 belegte, rutschte die Kopfzeile in eine vierte Zeile ans untere Bildende und nahm der Mittelzeile Platz. Jetzt steht sie fest in Zeile 1. Die linke Spalte lief dabei unter die Masterzeit; sie scrollt jetzt in ihrer Zeile. Unter 1180 px Breite entfällt der Zusatz neben dem Wortzeichen, damit er nicht unter `#mini-null` liegt.

## Was gebaut ist

- **Motor:** liest `kern/ereignisse/*.json` über `data/ereignisse.json`, weil ein Browser keinen Ordner auflisten kann. Ein Test gleicht Liste und Ordner ab. Keine Tourdaten im HTML.
- **Graph im Browser:** `kern/adapter/sintflut/transform.mjs` läuft jetzt auch im Browser, die `node:`-Importe stehen nur noch im Kommandozeilenteil. Die Tour rechnet also mit demselben Code wie die Prüfung (Regel 14). Die Herkunftszeichen kommen aus `anzeige()` im Schema.
- **Seiten:** Satz mit Wann, Wo und Auswahl; eine Seite je Station; alle `bewusst_leer` gesammelt auf „Nicht berührt“; Schluss mit Stand und Brüchen.
- **Schema:** neue Stationsfelder `zeigt` und `kette`, geprüft in `pruefeEreignis`. Zeit und Orte dürfen `{bewusst_leer, grund}` sein, nur wenn keine Station eine Quelle hat.
- **Küsten:** `data/sintflut_kuesten.json` (222 KB) aus `matrix-scharnier/adapter/paleomist_kuesten.py`. 0-m-Linie von `paleo_topography`, sechs Fenster, neun Schritte 20 bis 0 ka, Herkunft `rekonstruktion` + `berechnet`, Auflösung 0,25°, Unschärfe fehlt. Das Raster bleibt draußen. `netCDF4` und `contourpy` liefen nur in einer virtuellen Umgebung im Scratchpad.
- **Lizenz:** CC BY 4.0, am 2026-11-05 bei DataCite für doi:10.1594/PANGAEA.905800 geprüft (Gowan 2019) und im Manifest, in der Datei und in `QUELLEN.md` genannt.
- **Netzansicht:** Bänder und Zonen nach Strukturstand, Formen und Linienarten, alle Knoten grau. Bedeutung der Horizontalen und Hinweis auf die Auswahl stehen im Bild.

## Abweichungen und Setzungen

1. **`berechnet` ohne `modell`:** Die Prüfung ließ `berechnet` nur zusammen mit `modell` zu. Deine Entscheidung `rekonstruktion` + `berechnet` verlangt mehr, darum gilt jetzt: `berechnet` braucht `modell` oder `rekonstruktion`. `docs/strukturstand.md` nennt das Merkmal bisher nur bei Modellen.
2. **Kanten der Haus-Kette:** Preis hängt per `konversion` an der Hypothek, wie in deiner Pfeilkette. Der Strukturstand nennt diese Kante nicht; denkbar wäre auch Preis an Eigentum.
3. **Formen und Umrisse der Knoten** sind meine Setzung: Bedeutung und Hypothek als Fünfeck, Parzelle und Eigentum als Dreieck, Preis und Wohnen als Kreis.
4. **Baumaterial (1.2) und Wohnen (1.3)** stehen unverbunden im Netz, weil ihre Relation nicht festgelegt ist.
5. **Brüche im Haus** tragen `{bewusst_leer, grund}` wie Zeit und Orte. Das war nicht ausdrücklich beauftragt.
6. **Küstenlinie:** linear zwischen den Gitterpunkten, wie jede Kontur. Zwischen den Zeitschritten wird nichts interpoliert.
7. **Landverlust:** Der Adapter rechnet vom trockensten Stand bis heute, also teils ab 22,5 ka statt ab 20 ka. Die Zeile nennt diesen Zeitraum.

## Grenzen

- Eisflächen sind nicht zu sehen, das Raster liegt nicht im Repo (`data/manifest.json` fehlt, 404). Die Station sagt das.
- Die Küste erscheint nur auf dem Globus, die Equal-Earth-Karte zeigt sie nicht.
- Die untere Zeitleiste bleibt sichtbar. Der Umbau zu Takten ist weiter offen.
- Am Ende einer Haus-Tour geht es zurück zum Globus; die Netzansicht ist nur in der Tour erreichbar.
- Tourtexte nur auf Deutsch. Handy-Breite ist per CSS vorgesehen, aber nicht geprüft.

## Bildschirmfotos

### Start

![Start](bericht-touren/00-start.jpg)

### Sintflut

![Eröffnung](bericht-touren/sintflut-01-satz.jpg)
![Station 0, fehlt](bericht-touren/sintflut-02-0.jpg)
![Eis zu Ozean, in Arbeit](bericht-touren/sintflut-03-planetarer_stoffwechsel.jpg)
![1.1, vorhanden](bericht-touren/sintflut-04-1_1.jpg)
![Doggerland bei 20 ka](bericht-touren/sintflut-04b-doggerland-20ka.jpg)
![Doggerland bei 0 ka](bericht-touren/sintflut-04c-doggerland-0ka.jpg)
![1.3, fehlt](bericht-touren/sintflut-05-1_3.jpg)
![Gesellschaftlicher Stoffwechsel, fehlt](bericht-touren/sintflut-06-gesellschaftlicher_stoffwechsel.jpg)
![2.1, fehlt](bericht-touren/sintflut-07-2_1.jpg)
![2.2, fehlt](bericht-touren/sintflut-08-2_2.jpg)
![2.3, fehlt](bericht-touren/sintflut-09-2_3.jpg)
![Nicht berührt](bericht-touren/sintflut-10-nicht_beruehrt.jpg)
![Schluss](bericht-touren/sintflut-11-schluss.jpg)
![Freier Modus, Ebene bleibt an](bericht-touren/sintflut-frei.jpg)

### Was hängt an einem Haus?

![Eröffnung](bericht-touren/haus-01-satz.jpg)
![Boden und Baumaterial](bericht-touren/haus-02-1_1-stoff.jpg)
![Bedeutung](bericht-touren/haus-03-2_1-bedeutung.jpg)
![Parzelle](bericht-touren/haus-04-2_2-parzelle.jpg)
![Eigentum](bericht-touren/haus-05-2_2-eigentum.jpg)
![Hypothek, Vorschlag](bericht-touren/haus-06-2_2-hypothek.jpg)
![Preis, Vorschlag](bericht-touren/haus-07-gesellschaftlicher_stoffwechsel-preis.jpg)
![Baumaterial, 1.2](bericht-touren/haus-08-1_2-baumaterial.jpg)
![Wohnen, 1.3](bericht-touren/haus-09-1_3-wohnen.jpg)
![Nicht berührt](bericht-touren/haus-10-nicht_beruehrt.jpg)
![Schluss](bericht-touren/haus-11-schluss.jpg)
![Freier Modus](bericht-touren/haus-frei.jpg)
