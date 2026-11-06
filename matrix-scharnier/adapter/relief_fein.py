#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PALEOMAP-DEM 0,1° (6′) als lokale Klassen-PNGs, nur auf diesem Rechner.

Die 0,1°-Karten (rund 132 MB) bleiben in ~/ZeroEarth/rohdaten/paleomap_dem und
kommen nicht ins Repository; Repository und Online-Fassung tragen nur 1°
(relief.py). Dieses Skript schreibt nach data/lokal/ (gitignored):
  data/lokal/relief_paleomap_01.json   Index, gleiche Form wie quellen.paleomap
  data/lokal/relief/paleomap_01/NNN.png 3600 × 1801, Klassen wie relief.py
Liegt der Index, bietet die Seite 0,1° an (Schalter im Relief-Status).

  python3 relief_fein.py --paleomap-fein ~/ZeroEarth/rohdaten/paleomap_dem/<Ordner 6min> [--ziel ../../data]
"""
import argparse, datetime, glob, json, os, re
import numpy as np
from netCDF4 import Dataset
from relief import klassen, zellflaechen, groessen, png


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--paleomap-fein', required=True)
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    ordner = os.path.join(a.ziel, 'lokal', 'relief', 'paleomap_01')
    os.makedirs(ordner, exist_ok=True)
    karten = []
    for p in glob.glob(os.path.join(os.path.expanduser(a.paleomap_fein), '*.nc')):
        m = re.search(r'_(\d+(?:\.\d+)?)Ma\.nc$', p)
        if m: karten.append((float(m.group(1)), p))
    karten.sort()
    eintraege, bytes_ = [], 0
    for ma, p in karten:
        d = Dataset(p)
        lat = np.asarray(d.variables['latitude'][:], float)
        z = np.ma.filled(d.variables['z'][:].astype(float), np.nan)[:, :-1]     # Spalte +180 = −180 weg
        if lat[0] < lat[-1]: z, lat = z[::-1], lat[::-1]                         # Nord oben
        z = np.nan_to_num(z, nan=0.0)
        fl = zellflaechen(lat, 0.1, z.shape[1])
        datei = f'lokal/relief/paleomap_01/{int(ma):03d}.png'
        bytes_ += png(klassen(z), os.path.join(a.ziel, datei))
        stufe = re.sub(r'^Map\d+_PALEOMAP_6min_|_\d+(?:\.\d+)?Ma\.nc$', '', os.path.basename(p)).replace('_', ' ')
        eintraege.append({'ma': ma, 'stufe': stufe, 'datei': datei, 'groessen': groessen(z, fl)})
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/relief_fein.py; nur lokal, nicht im Repository',
        name='PALEOMAP-DEM (Scotese & Wright 2018), 0,1°', einheit='Ma', bezugssystem='ma_bp',
        aufloesung_grad=0.1, breite=3600, hoehe=1801, arten=['rekonstruktion', 'kuratiert'],
        lizenz='CC BY 4.0, doi:10.5281/zenodo.5460860', bezugsrahmen='PALEOMAP',
        zeit_unschaerfe={'fehlt': True, 'grund': 'Kartenalter je Stufe, ohne Unschärfe'},
        eis={'fehlt': True, 'grund': 'Das PALEOMAP-DEM führt kein Eis'},
        schritte=eintraege)
    with open(os.path.join(a.ziel, 'lokal', 'relief_paleomap_01.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
    print(f'{len(eintraege)} Karten 0,1°, {bytes_ / 1e6:.1f} MB PNG')


if __name__ == '__main__':
    main()
