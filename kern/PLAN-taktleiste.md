# Plan: Takt-Leiste

Stand: 2026-11-05. Nur Plan, nichts gebaut. Grundlage: Strukturstand, Abschnitt Zeit („keine einzelne Achse“, „verschachtelte Takte“), Regel 16 und die Skizze in `kern/BERICHT-tektonik.md`, Abschnitt 5.

## Was sie ersetzt

Die heutige Masterzeit (`#tl`) zeigt eine einzige Achse über `t` (Jahre seit J2000), mit Zoomstufen von ±18 Tagen bis ±4,6 Ga. Das widerspricht Entscheidung 3 (`t` nie als einzelne Achse). Sichtbar wird es zum Beispiel im Mini-Fenster oben, das bei 1,5 Ga „-1499998000 CE“ anzeigt. `t` bleibt als interne Rechengröße, für die Ebenen, die ihren Schritt daraus wählen.

## Aufbau

Mehrere Zeilen übereinander. Jede Zeile ist ein Takt mit eigenem Maß:

| Zeile | Takt | Maß | Woher |
| --- | --- | --- | --- |
| 1 | galaktischer Umlauf, rund 230 Ma | Ma | Strukturstand; Setzung mit Spannweite, als Annahme beschriftet |
| 2 | Ma-Zählung (Richtung) | Ma | kein Takt der 0. Natur in diesem Bereich; nur gezählt |
| 3 | Milanković, 100 ka (41, 21 ka als Unterteilung) | ka | Strukturstand |
| 4 | Jahr | a | Erdumlauf |
| 5 | Tag, Monat | d | Erdrotation, Mond |

- **Öffnen:** Ein Klick auf einen Umlauf öffnet die nächste Zeile für genau diesen Umlauf, wie ein Brotkrumenpfad: „4,5 Ga › Umlauf 1 › 100-ka-Zyklus 1 …“.
- **Zeilen sind Daten, nicht Code:** eine Datei `kern/takte.json` mit Name, Periode, Spannweite, Quelle und Status je Takt. Was dort fehlt, steht grau mit Grund (Regel 8). Das gilt etwa für den 405-ka-Zyklus, solange er nicht belegt ist.

## Quellen auf der Leiste

- Jede Ebene, die eine Zeitreihe zeigt, meldet ihre Stützstellen. Sie kommen aus den Dateien: `schritte_ma`, `ka_bp`, `karten[].ma`.
- Die Stützstellen erscheinen als Punkte auf der Zeile, deren Maß zu ihnen passt: Sintflut (2,5 ka) auf Zeile 3, Tektonik (1 bis 25 Ma) und Paläoküsten (5 Ma) auf Zeile 2.
- Abdeckung wird als Band gezeichnet, Lücken grau mit dem Grund aus dem Manifest. Beispiele: vor 1,8 Ga keine Plattenmodelle, zwischen 80 ka und 5 Ma keine Küsten (siehe `kern/BERICHT-tektonik.md`, Zeitgrenzen).
- Gewählt wird immer eine Stützstelle einer Quelle, nie ein Punkt dazwischen.
- Sind mehrere Quellen an, trägt jede ihren eigenen Zeitpunkt in ihrem eigenen Bezugssystem. Gemeinsam ist nur die gewählte Zeile, kein gemeinsamer Regler.
- **Gleichzeitig (Regel 16):** Zwei Quellen gelten als gleichzeitig nur, wenn sich ihre Zeiträume mit Unschärfe überlappen. Fehlt die Unschärfe, zeigt die Leiste „Gleichzeitigkeit nicht prüfbar“ statt eines Häkchens.

## Anzeige

- Jede Zeile beschriftet ihr Maß mit Bezugssystem (ka BP 1950, Ma BP, a CE) und Unschärfe.
- Die gewählten Zeitpunkte stehen in der Legende „aktuell übereinander“, je Quelle, wie heute bei Sintflut und Tektonik.
- Echtzeit, Raffer und Pause bleiben, aber nur auf den Zeilen Jahr und Tag; in der Tiefe gibt es keine laufende Uhr.

## Schritte zum Bau

1. `kern/takte.json` mit Schema und Prüfung: Periode mit Spannweite oder `{fehlt, grund}`, Quelle Pflicht.
2. Schnittstelle der Ebenen: `stuetzstellen()` gibt `{bezugssystem, werte, abdeckung, luecken}` zurück; Sintflut, Tektonik und Paläoküsten zuerst.
3. Leiste als eigenes Bauteil anstelle von `#tl`. `Tideline` bleibt als interne Uhr dahinter, wird aber nicht mehr direkt angezeigt.
4. Touren setzen statt `Tideline.zoom` die Zeile und die Stützstelle.
5. Tests: Kern prüft `takte.json`; im Browser prüfen, dass jede Stützstelle wählbar ist und kein Wert dazwischen.

## Offen

- **Nicht belegte Zahlen:** Spannweite des galaktischen Umlaufs und der 405-ka-Zyklus brauchen eine Quelle, bevor sie Zeilen werden.
- **Schwache Takte 1 a bis 21 ka:** Wie die Lücke zwischen 1 a und 21 ka gezeigt wird (Strukturstand: dort setzt die 2. Natur eigene Takte). Vorschlag: eine eigene Zeile „Kalender“, als 2. Natur gekennzeichnet.
- **Kleine Bildschirme:** Sie zeigen höchstens zwei Zeilen zugleich.
