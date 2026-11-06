#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Planeten und Titan: Werte mit Herkunft und Texturen für die Planetenansicht.

Werte abgeschrieben aus dem NASA Planetary Fact Sheet (NSSDCA, D. R. Williams;
Übersicht Stand 2025-03-18, Saturnmonde 2025-07-22, Ringe 2022-04-19; abgerufen
2026-11-06; Arbeit der US-Regierung, gemeinfrei). Herkunft je Wert (Entscheidung
von Max, 2026-11-06): `kuratiert`, solange das Fact Sheet die Messung nicht
nennt („Messquelle nicht genannt“); `beobachtung` nur, wo eine Sonde je Wert
belegt ist (Viking-1-Landeplatz laut Fact Sheet; Huygens laut Artikel);
`berechnet` für Abgeleitetes (Schwerkraft Titans, Skalenhöhe Titans, Faktoren).

Texturen aus ~/ZeroEarth/rohdaten/planeten/ (USGS WMS 2048 × 1024, NASA
Photojournal), auf 2048 × 1024 gebracht, nach data/planeten/. Bei Venus werden
reinweiße Datenlücken des Magellan-Mosaiks als „keine Daten“ eingefärbt.

  python3 planeten.py [--roh ~/ZeroEarth/rohdaten/planeten] [--ziel ../../data]
"""
import argparse, datetime, json, os
import numpy as np
from PIL import Image

FS = 'NASA Planetary Fact Sheet (NSSDCA, D. R. Williams)'
FS_URL = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
OHNE = 'Messquelle nicht genannt'
G = 6.674e-11
LUECKE_FARBE = (92, 52, 52)


def kur(wert, einheit, seite, **x):
    """Wert aus dem Fact Sheet, Messung dort nicht genannt."""
    return dict(wert=wert, einheit=einheit, arten=['kuratiert'], quelle=f'{FS}, {seite}', hinweis=OHNE, **x)


def beob(wert, einheit, quelle, **x):
    return dict(wert=wert, einheit=einheit, arten=['beobachtung'], quelle=quelle, **x)


def ber(wert, einheit, verfahren, grundlage, **x):
    """Physikalisch abgeleitet (Formel = Modell, Schema: modell + berechnet), auf Werten der Art `grundlage`."""
    return dict(wert=wert, einheit=einheit, arten=[grundlage, 'modell', 'berechnet'], verfahren=verfahren, **x)


def fehlt(grund):
    return dict(fehlt=True, grund=grund)


def zus(liste, seite, bezug, **x):
    return dict(liste=[dict(stoff=s, anteil=a, einheit=e) for s, a, e in liste], arten=['kuratiert'],
                quelle=f'{FS}, {seite}', hinweis=OHNE, bezug=bezug, **x)


KOERPER = [
    dict(id='merkur', name='Merkur', radius_km=4879 / 2, stapel_ort='0.3',
         druck=kur(5e-15, 'bar', 'mercuryfact', vergleich='kleiner als', bezug='Exosphäre, praktisch Vakuum', anzeige='< 5·10⁻¹⁵ bar'),
         temperatur=kur(440, 'K', 'mercuryfact', bezug='Mittel über Tag- und Nachtseite; sonnenseitig 590–725 K'),
         schwerkraft=kur(3.7, 'm/s²', 'Übersicht'),
         tag=kur(4222.6, 'h', 'Übersicht'),
         zusammensetzung=dict(liste=[dict(stoff='Na, Mg, O, H, K, Ca (Säulendichten)', anteil=None, einheit='Exosphäre')],
                              arten=['kuratiert'], quelle=f'{FS}, mercuryfact', hinweis=OHNE,
                              bezug='Exosphäre, als Säulendichten angegeben, nicht als Volumenanteil'),
         textur=dict(datei='planeten/merkur.jpg', roh='merkur_messenger_2048.jpg', quelle='USGS Astrogeology WMS, Ebene MESSENGER (MESSENGER Global Mosaic May 2016)',
                     lizenz='USGS, gemeinfrei', arten=['beobachtung'], hinweis='Graustufen, keine wahren Farben'),
         huelle=None),
    dict(id='venus', name='Venus', radius_km=12104 / 2,
         druck=kur(92, 'bar', 'Übersicht; venusfact'),
         temperatur=kur(737, 'K', 'venusfact', bezug='Mittel am Boden'),
         schwerkraft=kur(8.9, 'm/s²', 'Übersicht'),
         tag=kur(2802.0, 'h', 'Übersicht', bezug='Sonnentag; die Drehung ist rückläufig (−5 832,5 h)'),
         zusammensetzung=zus([('CO₂', 96.5, '%'), ('N₂', 3.5, '%'), ('SO₂', 150, 'ppm'), ('Ar', 70, 'ppm'), ('H₂O', 20, 'ppm')],
                             'venusfact', 'nahe am Boden, Volumenanteile'),
         textur=dict(datei='planeten/venus.jpg', roh='venus_magellan_2048.jpg', quelle='USGS Astrogeology WMS, Ebene MAGELLAN (Magellan-Radarmosaik)',
                     lizenz='USGS, gemeinfrei', arten=['beobachtung'],
                     hinweis='Radar: Helligkeit = Rauheit des Bodens, keine Farbe; rötlich-dunkel = keine Radardaten'),
         huelle=dict(skalenhoehe_km=15.9, skalenhoehe=kur(15.9, 'km', 'venusfact'), farbe='#e8d9a8', deckend=True,
                     deckend_grund='Geschlossene Wolkendecke aus Schwefelsäure; der Boden ist nur im Radar sichtbar')),
    dict(id='erde', name='Erde', radius_km=12756 / 2,
         druck=kur(1.014, 'bar', 'earthfact'),
         temperatur=kur(288, 'K', 'earthfact'),
         schwerkraft=kur(9.8, 'm/s²', 'Übersicht'),
         tag=kur(24.0, 'h', 'Übersicht'),
         zusammensetzung=zus([('N₂', 78.08, '%'), ('O₂', 20.95, '%'), ('Ar', 9340, 'ppm'), ('CO₂', 420, 'ppm')],
                             'earthfact', 'trockene Luft, Volumenanteile; Wasser stark veränderlich, um 1 %'),
         textur=dict(fehlt=True, grund='Die Erde hat ihre eigene Ansicht (Globus); ein Klick führt dorthin'),
         huelle=dict(skalenhoehe_km=8.5, skalenhoehe=kur(8.5, 'km', 'earthfact'), farbe='#7fb2ff', deckend=False)),
    dict(id='mars', name='Mars', radius_km=6792 / 2,
         druck=kur(0.00636, 'bar', 'marsfact', bezug='mittlerer Radius; im Jahresgang 4,0–8,7 mb',
                   zusatz=beob([0.0069, 0.009], 'bar', f'{FS}, marsfact: Viking-1-Landeplatz', bezug='6,9–9 mb am Landeplatz von Viking 1')),
         temperatur=kur(214, 'K', 'marsfact', bezug='Mittel; Tagesgang am Viking-1-Landeplatz 184–242 K'),
         schwerkraft=kur(3.73, 'm/s²', 'marsfact'),
         tag=kur(24.6597, 'h', 'marsfact'),
         zusammensetzung=zus([('CO₂', 95.1, '%'), ('N₂', 2.59, '%'), ('Ar', 1.94, '%'), ('O₂', 0.16, '%'), ('CO', 0.06, '%')],
                             'marsfact', 'Volumenanteile'),
         textur=dict(datei='planeten/mars.jpg', roh='mars_viking_mdim21_color_2048.jpg', quelle='USGS Astrogeology WMS, Ebene MDIM21_color (Viking MDIM 2.1, eingefärbt)',
                     lizenz='USGS, gemeinfrei', arten=['beobachtung', 'kuratiert'], hinweis='Farbe nachträglich aus Viking-Farbbildern übertragen'),
         huelle=dict(skalenhoehe_km=11.0, skalenhoehe=kur(11.0, 'km', 'marsfact'), farbe='#e3a08a', deckend=False)),
    dict(id='jupiter', name='Jupiter', radius_km=142984 / 2,
         druck=fehlt('Kein fester Boden; das Fact Sheet nennt „>>1000 bar“ tief in der Atmosphäre, Lage unbekannt. Bezug der übrigen Werte: 1-bar-Niveau'),
         temperatur=kur(165, 'K', 'jupiterfact', bezug='beim 1-bar-Niveau'),
         schwerkraft=kur(23.1, 'm/s²', 'Übersicht', bezug='beim 1-bar-Niveau, Äquator'),
         tag=kur(9.9, 'h', 'Übersicht'),
         zusammensetzung=zus([('H₂', 89.8, '%'), ('He', 10.2, '%'), ('CH₄', 3000, 'ppm'), ('NH₃', 260, 'ppm')],
                             'jupiterfact', 'Volumenanteile; Unschärfe H₂ und He je ±2,0 %'),
         textur=dict(datei='planeten/jupiter.jpg', roh='PIA07782.jpg', quelle='NASA Photojournal PIA07782 (Cassini, Vorbeiflug Dezember 2000)',
                     lizenz='NASA, gemeinfrei; Credit NASA/JPL/Space Science Institute', arten=['beobachtung'],
                     hinweis='Die Wolken sind ein Moment (Dezember 2000), kein Dauerzustand'),
         huelle=dict(skalenhoehe_km=27, skalenhoehe=kur(27, 'km', 'jupiterfact'), farbe='#e8d4b8', deckend=False)),
    dict(id='saturn', name='Saturn', radius_km=120536 / 2,
         druck=fehlt('Kein fester Boden; Lage und Druck der „Oberfläche“ unbekannt (Fact Sheet). Bezug: 1-bar-Niveau'),
         temperatur=kur(134, 'K', 'saturnfact', bezug='beim 1-bar-Niveau'),
         schwerkraft=kur(9.0, 'm/s²', 'Übersicht', bezug='beim 1-bar-Niveau, Äquator'),
         tag=kur(10.7, 'h', 'Übersicht'),
         zusammensetzung=zus([('H₂', 96.3, '%'), ('He', 3.25, '%'), ('CH₄', 4500, 'ppm'), ('NH₃', 125, 'ppm')],
                             'saturnfact', 'Volumenanteile; Unschärfe H₂ und He je ±2,4 %'),
         textur=dict(fehlt=True, grund='Keine globale Karte geprüft', farbe='#d8c79a', farbe_setzung='mittlere Farbe nach Cassini-Bildern, Setzung, nicht gemessen'),
         ringe=dict(quelle=f'{FS}, satringfact (Stand 2022-04-19)', arten=['kuratiert'], hinweis=OHNE,
                    teile=[dict(name='C', innen_km=74658, aussen_km=91975, optische_tiefe='0,05–0,35'),
                           dict(name='B', innen_km=91975, aussen_km=117507, optische_tiefe='0,4–2,5'),
                           dict(name='A', innen_km=122340, aussen_km=136780, optische_tiefe='0,4–1,0')]),
         huelle=dict(skalenhoehe_km=59.5, skalenhoehe=kur(59.5, 'km', 'saturnfact'), farbe='#eadcb0', deckend=False)),
    dict(id='uranus', name='Uranus', radius_km=51118 / 2,
         druck=fehlt('Kein fester Boden; Lage und Druck unbekannt (Fact Sheet). Bezug: 1-bar-Niveau'),
         temperatur=kur(76, 'K', 'uranusfact', bezug='beim 1-bar-Niveau'),
         schwerkraft=kur(8.7, 'm/s²', 'Übersicht', bezug='beim 1-bar-Niveau, Äquator'),
         tag=kur(17.2, 'h', 'Übersicht', bezug='Drehung rückläufig'),
         zusammensetzung=zus([('H₂', 82.5, '%'), ('He', 15.2, '%'), ('CH₄', 2.3, '%')], 'uranusfact', 'Volumenanteile; Unschärfe H₂ und He je ±3,3 %'),
         textur=dict(fehlt=True, grund='Keine globale Karte (nur Voyager-2-Vorbeiflug 1986)', farbe='#a8d8df', farbe_setzung='mittlere Farbe nach Voyager-2-Bildern, Setzung, nicht gemessen'),
         huelle=dict(skalenhoehe_km=27.7, skalenhoehe=kur(27.7, 'km', 'uranusfact'), farbe='#c4eef2', deckend=False)),
    dict(id='neptun', name='Neptun', radius_km=49528 / 2,
         druck=fehlt('Kein fester Boden; Lage und Druck unbekannt (Fact Sheet). Bezug: 1-bar-Niveau'),
         temperatur=kur(72, 'K', 'neptunefact', bezug='beim 1-bar-Niveau'),
         schwerkraft=kur(11.0, 'm/s²', 'Übersicht', bezug='beim 1-bar-Niveau, Äquator'),
         tag=kur(16.1, 'h', 'Übersicht'),
         zusammensetzung=zus([('H₂', 80.0, '%'), ('He', 19.0, '%'), ('CH₄', 1.5, '%')], 'neptunefact', 'Volumenanteile; Unschärfe H₂ und He je ±3,2 %, CH₄ ±0,5 %'),
         textur=dict(fehlt=True, grund='Keine globale Karte (nur Voyager-2-Vorbeiflug 1989)', farbe='#5b80d4', farbe_setzung='mittlere Farbe nach Voyager-2-Bildern, Setzung, nicht gemessen'),
         huelle=dict(skalenhoehe_km=19.7, skalenhoehe=kur(19.7, 'km', 'neptunefact', bezug='Fact Sheet: 19,1–20,3 km; Mitte gezeichnet'), farbe='#8fb0ff', deckend=False)),
]

TITAN_M, TITAN_R = 1345.5e20, 2575e3
TITAN_G = G * TITAN_M / TITAN_R ** 2
TITAN_H = 1.380649e-23 * 93.65 / (28.0 * 1.66054e-27 * TITAN_G) / 1000
KOERPER.append(dict(
    id='titan', name='Titan', radius_km=2575, mond_von='saturn', bahn=dict(a_km=1221870, umlauf_d=15.945421, quelle=f'{FS}, saturniansatfact (Stand 2025-07-22)'),
    druck=beob(1.467, 'bar', 'Huygens HASI, Fulchignoni et al. 2005, Nature 438, 785–791', unschaerfe='±1 hPa', bezug='am Landeplatz, 14.01.2005'),
    temperatur=beob(93.65, 'K', 'Huygens HASI, Fulchignoni et al. 2005, Nature 438, 785–791', unschaerfe='±0,25 K', bezug='am Landeplatz, 14.01.2005'),
    schwerkraft=ber(round(TITAN_G, 3), 'm/s²', f'G·M/r² mit M = 1 345,5·10²⁰ kg und r = 2 575 km ({FS}, saturniansatfact)', 'kuratiert',
                    quelle=f'{FS}, saturniansatfact; Newton', hinweis='M und r: Messquelle nicht genannt'),
    tag=kur(round(15.945421 * 24, 1), 'h', 'saturniansatfact', bezug='gebunden: Drehung = Umlauf um Saturn (15,945 d); der Sonnentag weicht davon um rund 0,05 % ab, nicht berücksichtigt'),
    zusammensetzung=dict(liste=[dict(stoff='CH₄', anteil=5.65, einheit='%', arten=['beobachtung'], unschaerfe='±0,18 %',
                                     quelle='Huygens GCMS, Niemann et al. 2010, JGR 115, E12006 (ersetzt die Werte von 2005)', bezug='nahe am Boden (6,7 km bis Boden)'),
                                dict(stoff='N₂', anteil=None, einheit='%', fehlt=True,
                                     grund='Hauptbestandteil; Niemann et al. 2010 nennt einen Wert, der Volltext ist nicht geprüft. Kein Rest zu 100 % gerechnet')],
                         arten=['beobachtung'], quelle='Huygens GCMS (Niemann et al. 2010)', bezug='nahe am Boden'),
    textur=dict(datei='planeten/titan.jpg', roh='titan_cassini_iss_2048.jpg', quelle='USGS Astrogeology WMS, Ebene CASSINI (Cassini ISS, 938 nm, PIA19658, bis Vorbeiflug T100)',
                lizenz='USGS, gemeinfrei', arten=['beobachtung'],
                hinweis='Nahes Infrarot (938 nm), grau; im sichtbaren Licht verdeckt der Dunst den Boden. Lücke von 3–5 % in nördlichen mittleren Breiten'),
    huelle=dict(skalenhoehe_km=round(TITAN_H, 1), skalenhoehe=ber(round(TITAN_H, 1), 'km', 'k·T/(m·g) mit T = 93,65 K (Huygens), m = 28 u (N₂, Setzung), g berechnet; am Boden', 'beobachtung',
                                                                quelle='Fulchignoni et al. 2005 (T); Gasgesetz'),
                farbe='#d9a35a', deckend=True, deckend_grund='Orangefarbener Dunst aus organischen Teilchen (Tholine) verdeckt den Boden im sichtbaren Licht'),
    stoffwechsel=None))

# Titan: Methankreislauf als planetarer Stoffwechsel ohne Leben. Nur Belege, die
# geprüft sind (Abstracts bzw. Titel, 2026-11-06); Zahlen nur, wo belegt.
TITAN_STOFFWECHSEL = dict(
    titel='Methankreislauf: planetarer Stoffwechsel ohne Leben',
    kern=dict(fehlt=True, grund='Im Kern noch nicht als Prozess geführt: Das Schema setzt den planetaren Stoffwechsel zwischen 0. und 1. Natur; auf Titan gibt es keine 1. Natur. Entscheidung offen'),
    bausteine=[
        dict(art='bestand', name='Methan in der Atmosphäre', wert='5,65 % nahe am Boden', arten=['beobachtung'], quelle='Huygens GCMS, Niemann et al. 2010, JGR 115'),
        dict(art='bestand', name='Seen und Meere aus flüssigen Kohlenwasserstoffen (Nordpolregion)', wert=None, arten=['beobachtung'],
             quelle='Cassini-Radar, Stofan et al. 2007, Nature 445, 61–64', hinweis='teils gefüllte, teils trockene Senken: aktiver Flüssigkeitskreislauf'),
        dict(art='fluss', name='Verdunstung, Wolken, Regen', wert=None, arten=['beobachtung'],
             quelle='Turtle et al. 2011, Science 331, 1414–1417 („evidence of April showers“: Oberflächenänderung nach Niederschlag)', hinweis='nur Titel und Zitat geprüft'),
        dict(art='abbau', name='Photolyse in der oberen Atmosphäre: Methan zu Ethan und schwereren Stoffen, nicht umkehrbar', wert='Bestand wäre in einigen zehn Ma aufgebraucht',
             arten=['modell', 'berechnet'], quelle='Photochemie nach Yung, Allen & Pinto 1984, ApJS; Zeitraum wie zitiert in Tobie et al. 2006, Nature 440, 61–64', hinweis='Zahl aus Abstract und Zitaten, Originalwert nicht geprüft'),
        dict(art='nachschub', name='Woher das Methan nachkommt', wert=None, fehlt=True,
             grund='offen; Hypothese: episodische Ausgasung aus Klathraten im Eispanzer (Tobie et al. 2006, Modell), nicht beobachtet'),
    ])

ERDE = dict(druck_bar=1.014, temperatur_K=288, schwerkraft=9.8, tag_h=24.0)


def textur(roh, ziel, k):
    t = k['textur']
    if t.get('fehlt'):
        return
    im = Image.open(os.path.join(roh, t['roh'])).convert('RGB')
    if im.size != (2048, 1024):
        im = im.resize((2048, 1024), Image.LANCZOS)
    if k['id'] == 'venus':                                    # Datenlücken (reinweiß) als „keine Daten“
        a = np.asarray(im).copy()
        luecke = (a.min(axis=2) >= 250)
        a[luecke] = LUECKE_FARBE
        t['luecke_anteil'] = round(float(luecke.mean()), 4)
        im = Image.fromarray(a)
    im.save(os.path.join(ziel, t['datei']), 'JPEG', quality=85, optimize=True)
    t['groesse_byte'] = os.path.getsize(os.path.join(ziel, t['datei']))
    t['pixel'] = [2048, 1024]
    t['abbildung'] = 'Länge −180 … 180 (links … rechts), Breite 90 … −90; Längenkonvention der Quelle'


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--roh', default=os.path.expanduser('~/ZeroEarth/rohdaten/planeten'))
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    os.makedirs(os.path.join(a.ziel, 'planeten'), exist_ok=True)
    for k in KOERPER:
        textur(a.roh, a.ziel, k)
        if k['id'] == 'titan':
            k['stoffwechsel'] = TITAN_STOFFWECHSEL
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/planeten.py',
        quelle=dict(name=FS, url=FS_URL, stand='Übersicht 2025-03-18; Saturnmonde 2025-07-22; Ringe 2022-04-19', abgerufen='2026-11-06',
                    lizenz='Arbeit der US-Regierung, gemeinfrei'),
        herkunft_regel='kuratiert mit „Messquelle nicht genannt“, wo das Fact Sheet die Messung nicht nennt; beobachtung nur mit belegter Sonde je Wert (Entscheidung von Max, 2026-11-06)',
        zeit=dict(bezugssystem='a_ce', wert='heute (Messzeitraum der Sonden)', unschaerfe=fehlt('Die Quellen nennen keinen gemeinsamen Zeitpunkt; Werte gelten als heutiger Zustand')),
        erde=ERDE,
        darstellung=dict(huelle_skalenhoehen=5, huelle_ueberhoehung=5,
                         setzung='Hülle = 5 Skalenhöhen, 5-fach überhöht; Farben der Hüllen und der einfarbigen Kugeln sind Setzungen; Größen und Abstände nicht maßstäblich'),
        koerper=KOERPER)
    with open(os.path.join(a.ziel, 'planeten.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
    for k in KOERPER:
        t = k['textur']
        print(k['id'], 'Textur' if not t.get('fehlt') else 'einfarbig', t.get('groesse_byte', ''), t.get('luecke_anteil', ''))
    print('Titan g =', round(TITAN_G, 3), 'm/s², H =', round(TITAN_H, 1), 'km')


if __name__ == '__main__':
    main()
