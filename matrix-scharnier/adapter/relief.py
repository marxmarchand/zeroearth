#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Relief als gemeinsames Grundbild (kern/BERICHT-relief.md).

Je Quelle und Zeitschritt ein 8-bit-PNG mit Höhenklassen, dazu eine Datei mit
der Klassentafel, den Schritten und den daraus abgeleiteten Größen. Gefärbt und
geschummert wird erst im Browser; so gibt es den Grau-Modus ohne zweiten Satz.

  Klasse 0..100   Meer, 0 bis −11 000 m, Wurzelskala (fein nahe 0 m)
  Klasse 101..254 Land, 0 bis 9 000 m, Wurzelskala
  Klasse 255      Eis (nur PaleoMIST): Eisdicke ab EIS_AB_M, Setzung

Quellen: PALEOMAP-DEM (Scotese & Wright 2018), 1°, 540–0 Ma; PaleoMIST 1.0,
0,25° auf 0,5° ausgewählt (jeder zweite Gitterpunkt), 80–0 ka. GEBCO fehlt noch
(Download nicht freigegeben). Zeilen von Nord nach Süd; Spalten −180 bis 179
(die doppelte Spalte 180 entfällt); Gitterpunkte sind Zellmitten.

  python3 relief.py --paleomap <Ordner mit *_Ma.nc> --paleomist <reconstruction_0.25_degree.nc> \
          [--ziel ../../data]
"""
import argparse, datetime, glob, json, os, re
import numpy as np
from PIL import Image
from netCDF4 import Dataset

MEER_MAX, LAND_MAX = 11000.0, 9000.0
EIS_AB_M = 100.0          # Eisdicke ab der eine Zelle als Eis gilt (Gletscher, Eisschild); Setzung
SCHELF = (-200.0, -1400.0)
STUFEN = [-6000, -4000, -2000, -1400, -200, 0, 200, 1000, 2000, 4000]
R_ERDE = 6371.0088


def klassen(z, eis=None):
    z = np.nan_to_num(z, nan=0.0)
    k = np.zeros(z.shape, np.uint8)
    m = z <= 0
    k[m] = np.clip(np.round(100 * np.sqrt(np.minimum(-z[m], MEER_MAX) / MEER_MAX)), 0, 100).astype(np.uint8)
    k[~m] = (101 + np.clip(np.round(153 * np.sqrt(np.minimum(z[~m], LAND_MAX) / LAND_MAX)), 0, 153)).astype(np.uint8)
    if eis is not None:
        k[eis] = 255
    return k


def zellflaechen(lat, dlat, nlon):
    """km² je Zelle (Zellmitte lat), je Zeile gleich."""
    d = np.radians(dlat) / 2
    a = R_ERDE ** 2 * np.radians(360.0 / nlon) * (np.sin(np.radians(lat) + d) - np.sin(np.radians(lat) - d))
    return np.clip(a, 0, None)[:, None] * np.ones(nlon)


def groessen(z, flaeche, eis=None):
    z = np.nan_to_num(z, nan=0.0)
    land = z > 0
    g = {
        'landflaeche_km2': round(float(flaeche[land].sum())),
        'schelf_0_200_km2': round(float(flaeche[(z <= 0) & (z > SCHELF[0])].sum())),
        'rand_200_1400_km2': round(float(flaeche[(z <= SCHELF[0]) & (z > SCHELF[1])].sum())),
        'mittlere_landhoehe_m': round(float((z[land] * flaeche[land]).sum() / flaeche[land].sum())) if land.any() else None,
        'hypsometrie_anteil': [round(float(flaeche[(z > a) & (z <= b)].sum() / flaeche.sum()), 5)
                               for a, b in zip([-1e9] + STUFEN, STUFEN + [1e9])],
    }
    if eis is not None:
        g['eisflaeche_km2'] = round(float(flaeche[eis].sum()))
    return g


def png(k, pfad):
    Image.fromarray(k).save(pfad, 'PNG', optimize=True)
    return os.path.getsize(pfad)


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--paleomap', required=True)
    a.add_argument('--paleomist', required=True)
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    ordner = os.path.join(a.ziel, 'relief')
    os.makedirs(os.path.join(ordner, 'paleomap'), exist_ok=True)
    os.makedirs(os.path.join(ordner, 'paleomist'), exist_ok=True)

    quellen = {}
    # PALEOMAP-DEM, 1°
    karten = []
    for p in glob.glob(os.path.join(a.paleomap, '*.nc')):
        m = re.search(r'_(\d+(?:\.\d+)?)Ma\.nc$', p)
        karten.append((float(m.group(1)), p))
    karten.sort()
    schritte, eintraege, bytes_ = [], [], 0
    for ma, p in karten:
        d = Dataset(p)
        z = np.asarray(d.variables['z'][:], float)[::-1, :-1]           # Nord oben, Spalte 180 weg
        lat = np.asarray(d.variables['lat'][:], float)[::-1]
        fl = zellflaechen(lat, 1.0, z.shape[1])
        datei = f'relief/paleomap/{int(ma):03d}.png'
        bytes_ += png(klassen(z), os.path.join(a.ziel, datei))
        stufe = re.sub(r'^Map\d+_PALEOMAP_1deg_|_\d+(?:\.\d+)?Ma\.nc$', '', os.path.basename(p)).replace('_', ' ')
        schritte.append(ma)
        eintraege.append({'ma': ma, 'stufe': stufe, 'datei': datei, 'groessen': groessen(z, fl)})
    quellen['paleomap'] = {
        'name': 'PALEOMAP-DEM (Scotese & Wright 2018)', 'einheit': 'Ma', 'bezugssystem': 'ma_bp',
        'aufloesung_grad': 1.0, 'breite': 360, 'hoehe': 181, 'arten': ['rekonstruktion', 'kuratiert'],
        'lizenz': 'CC BY 4.0, doi:10.5281/zenodo.5460860', 'bezugsrahmen': 'PALEOMAP',
        'zeit_unschaerfe': {'fehlt': True, 'grund': 'Kartenalter je Stufe, ohne Unschärfe'},
        'schritte': eintraege, 'eis': {'fehlt': True, 'grund': 'Das PALEOMAP-DEM führt kein Eis'}}

    # PaleoMIST, 0,25° -> 0,5° (jeder zweite Gitterpunkt)
    d = Dataset(a.paleomist)
    zeit = np.asarray(d.variables['time'][:], float)
    eintraege = []
    for i, t in enumerate(zeit):
        z = np.ma.filled(d.variables['paleo_topography'][i].astype(float), np.nan)[::-1, :-1][::2, ::2]
        it = np.ma.filled(d.variables['ice_thickness'][i].astype(float), 0.0)[::-1, :-1][::2, ::2]
        la = np.asarray(d.variables['lat'][:], float)[::-1][::2]
        fl = zellflaechen(la, 0.5, z.shape[1])
        eis = it >= EIS_AB_M
        ka = abs(round(-t / 1000, 1))
        datei = f'relief/paleomist/{int(round(ka * 10)):03d}.png'   # Dateiname in 0,1 ka
        bytes_ += png(klassen(z, eis), os.path.join(a.ziel, datei))
        eintraege.append({'ka': ka, 'datei': datei, 'groessen': groessen(z, fl, eis)})
    eintraege.sort(key=lambda e: e['ka'])
    quellen['paleomist'] = {
        'name': 'PaleoMIST 1.0 (Gowan et al. 2021)', 'einheit': 'ka', 'bezugssystem': 'ka_bp_1950',
        'aufloesung_grad': 0.5, 'breite': 720, 'hoehe': 361, 'arten': ['rekonstruktion'],
        'lizenz': 'CC BY 4.0, doi:10.1594/PANGAEA.905800', 'bezugsrahmen': 'heutige Koordinaten',
        'zeit_unschaerfe': {'fehlt': True, 'grund': 'PaleoMIST nennt keine Unschärfe der Zeitachse; 2,5 ka sind die Auflösung'},
        'schritte': eintraege,
        'eis': {'ab_dicke_m': EIS_AB_M, 'aus': 'ice_thickness derselben Datei',
                'begruendung': 'Gletscher und Eisschilde ab 100 m Dicke (Setzung); dünneres Eis erscheint als Höhe'}}

    datei = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/relief.py',
        klassen=dict(meer={'von': 0, 'bis': 100, 'tiefe_max_m': MEER_MAX, 'skala': 'Wurzel'},
                     land={'von': 101, 'bis': 254, 'hoehe_max_m': LAND_MAX, 'skala': 'Wurzel'},
                     eis=255, null_m='zwischen Klasse 100 (≤ 0 m) und 101 (> 0 m)'),
        setzungen=dict(schelf_m=list(SCHELF), stufen_m=STUFEN, eis_ab_m=EIS_AB_M,
                       schelf_begruendung='−200 m: übliche Schelfkante; −1400 m: Kontinentalrand bei Kocsis & Scotese. Beide nebeneinander.'),
        fehlt=dict(
            gebco={'fehlt': True, 'grund': 'GEBCO für heute noch nicht geladen (rund 7 GB, Download nicht freigegeben); heute bleibt das Grundbild Natural Earth'},
            luecke={'fehlt': True, 'grund': 'Zwischen 80 ka und 2,5 Ma keine geprüfte Quelle: PaleoMIST endet bei 80 ka, das PALEOMAP-DEM hat nach 0 Ma die nächste Karte bei 5 Ma'},
            vor_540={'fehlt': True, 'grund': 'Vor 540 Ma keine geprüfte Paläo-Höhenkarte'},
            packeis={'fehlt': True, 'grund': 'Meereis (Packeis) führt keine der Quellen; PaleoMIST nennt nur aufliegendes Eis'}),
        quellen=quellen)
    with open(os.path.join(a.ziel, 'relief.json'), 'w', encoding='utf-8') as f:
        json.dump(datei, f, ensure_ascii=False, indent=1)
    print(f'{len(quellen["paleomap"]["schritte"])} PALEOMAP-Karten, {len(quellen["paleomist"]["schritte"])} PaleoMIST-Schritte, {bytes_ / 1e6:.1f} MB PNG')
    for q in ('paleomap', 'paleomist'):
        for e in quellen[q]['schritte'][:1] + quellen[q]['schritte'][-1:]:
            print(q, e.get('ma', e.get('ka')), e['groessen'])


if __name__ == '__main__':
    main()
