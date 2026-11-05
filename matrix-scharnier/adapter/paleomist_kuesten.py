#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Küstenlinien der sechs Fenster: die 0-m-Linie von paleo_topography.

Nur abgeleitete Linien kommen ins Repo, das Raster bleibt draußen. Zwischen
den Zeitschritten wird nichts interpoliert. Innerhalb eines Schritts liegt die
Linie linear zwischen den Gitterpunkten (das macht jedes Konturverfahren); die
Auflösung bleibt 0,25°. Was unter 0 m liegt, gilt als nicht Land, auch ein
Becken im Landesinneren: dieselbe Grenze wie die Landflächen in sintflut.json.

  python3 paleomist_kuesten.py --quelle <reconstruction_0.25_degree.nc> \
          [--ziel ../../data/sintflut_kuesten.json]

Braucht netCDF4 und contourpy (nicht Teil des Repos, nur zum Erzeugen).
"""
import argparse, datetime, json
import numpy as np
import contourpy
from netCDF4 import Dataset

from paleomist import ORTE

# Das Zeitfenster des Ereignisses Sintflut, Schritte der Quelle
VON_KA, BIS_KA = 20, 0
STELLEN = 2  # Nachkommastellen in Grad; weit unter der Auflösung von 0,25°


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--quelle', required=True)
    p.add_argument('--ziel', default='../../data/sintflut_kuesten.json')
    a = p.parse_args()

    d = Dataset(a.quelle)
    zeit = np.asarray(d.variables['time'][:], dtype=float)
    lat, lon = np.asarray(d.variables['lat'][:]), np.asarray(d.variables['lon'][:])
    schritte = [i for i, t in enumerate(zeit) if BIS_KA <= -t / 1000 <= VON_KA]
    ka_bp = [abs(round(-float(zeit[i]) / 1000, 1)) for i in schritte]

    orte = {}
    for schluessel, ort in ORTE.items():
        w, e, s, n = ort['bbox']
        jy = np.where((lat >= s) & (lat <= n))[0]
        jx = np.where((lon >= w) & (lon <= e))[0]
        linien = []
        for i in schritte:
            topo = np.ma.filled(d.variables['paleo_topography'][i, jy, jx].astype(float), np.nan)
            gen = contourpy.contour_generator(lon[jx], lat[jy], topo, line_type='Separate')
            linien.append([[[round(float(x), STELLEN), round(float(y), STELLEN)] for x, y in zug]
                           for zug in gen.lines(0.0)])
        orte[schluessel] = dict(name=ort['name'], bbox=dict(west=w, ost=e, sued=s, nord=n), linien=linien)

    datei = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/paleomist_kuesten.py',
        woher=dict(
            arten=['rekonstruktion', 'berechnet'],
            kette='PaleoMIST 1.0 (paleo_topography) -> 0-m-Linie',
            datei=a.quelle.split('/')[-1],
            lizenz='CC BY 4.0, Gowan 2019, doi:10.1594/PANGAEA.905800; von zeroearth bearbeitet: aus dem Raster abgeleitete Linien, Raster nicht enthalten',
            verfahren='Kontur bei 0 m (contourpy), linear zwischen den Gitterpunkten; zwischen den Zeitschritten nichts interpoliert',
            grenzen=['paleo_topography enthält isostatische Deformation (laut Datei); Sedimentation nicht berücksichtigt',
                     'Becken unter 0 m im Landesinneren gelten als nicht Land, dieselbe Grenze wie die Landflächen']),
        zeit=dict(bezugssystem='ka_bp_1950', aufloesung_ka=2.5,
                  unschaerfe=dict(fehlt=True, grund='PaleoMIST nennt keine Unschärfe der Zeitachse; die 2,5 ka sind die Auflösung, nur eine Untergrenze')),
        raum=dict(aufloesung_grad=0.25,
                  unschaerfe=dict(fehlt=True, grund='PaleoMIST nennt keine Unschärfe der Topographie; 0,25° sind die Auflösung, nur eine Untergrenze')),
        ka_bp=ka_bp,
        orte=orte)
    with open(a.ziel, 'w', encoding='utf-8') as f:
        json.dump(datei, f, ensure_ascii=False, separators=(',', ':'))
    for k, o in orte.items():
        print(k, [sum(len(z) for z in l) for l in o['linien']])


if __name__ == '__main__':
    main()
