#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Eisdicke aus PaleoMIST 1.0 als Feld-Ebene, 80–0 ka, beide Ideale (Regel 13).

Je Ideal (Referenz, a1) und Zeitschritt ein 8-bit-PNG: Klasse 0 = kein Eis,
1..255 = Eisdicke 0 bis 5 000 m auf Wurzelskala. 0,25° auf 0,5° ausgewählt
(jeder zweite Gitterpunkt). Dazu je Schritt Eisvolumen und Eisfläche.
Nur aufliegendes Eis (ice_thickness); Meereis führt die Quelle nicht.

  python3 eis.py --referenz <reconstruction_0.25_degree.nc> --a1 <reconstruction_a1_0.25_degree.nc> \
          [--ziel ../../data]
"""
import argparse, datetime, json, os
import numpy as np
from PIL import Image
from netCDF4 import Dataset

DICKE_MAX = 5000.0
R_ERDE = 6371.0088
EIS_AB_M = 100.0          # wie im Relief (relief.py): ab hier gilt eine Zelle als Eis; Setzung
KLASSE_AB = 1 + int(round(254 * np.sqrt(EIS_AB_M / DICKE_MAX)))


def klassen(d):
    k = np.zeros(d.shape, np.uint8)
    m = d > 0
    k[m] = (1 + np.clip(np.round(254 * np.sqrt(np.minimum(d[m], DICKE_MAX) / DICKE_MAX)), 0, 254)).astype(np.uint8)
    # Grenze bei EIS_AB_M exakt: dünneres Eis höchstens KLASSE_AB − 1, dickeres mindestens KLASSE_AB
    # (verschiebt Werte direkt an der Grenze um höchstens eine Klasse)
    k[m & (d < EIS_AB_M)] = np.minimum(k[m & (d < EIS_AB_M)], KLASSE_AB - 1)
    k[d >= EIS_AB_M] = np.maximum(k[d >= EIS_AB_M], KLASSE_AB)
    return k


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--referenz', required=True)
    a.add_argument('--a1', required=True)
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    ideale = {}
    for name, pfad in (('referenz', a.referenz), ('a1', a.a1)):
        os.makedirs(os.path.join(a.ziel, 'eis', name), exist_ok=True)
        d = Dataset(pfad)
        zeit = np.asarray(d.variables['time'][:], float)
        lat = np.asarray(d.variables['lat'][:], float)[::-1][::2]
        dl = 0.5
        fl = (R_ERDE ** 2 * np.radians(dl) * (np.sin(np.radians(lat + dl / 2)) - np.sin(np.radians(lat - dl / 2))))
        fl = np.clip(fl, 0, None)[:, None]
        schritte = []
        for i, t in enumerate(zeit):
            voll = np.ma.filled(d.variables['ice_thickness'][i].astype(float), 0.0)
            negativ = int((voll < 0).sum())                   # Quelle: negative Dicken (Interpolationsrest), als kein Eis
            it = voll[::-1, :-1][::2, ::2]
            ka = abs(round(-t / 1000, 1))
            datei = f'eis/{name}/{int(round(ka * 10)):03d}.png'
            Image.fromarray(klassen(it)).save(os.path.join(a.ziel, datei), 'PNG', optimize=True)
            flaeche = fl * np.ones(it.shape[1])
            schritte.append({'ka': ka, 'datei': datei,
                             'eisflaeche_km2': round(float(flaeche[it > 0].sum())),
                             'eisflaeche_ab_schwelle_km2': round(float(flaeche[it >= EIS_AB_M].sum())),
                             'eisvolumen_km3': round(float((np.clip(it, 0, None) / 1000 * flaeche).sum())),
                             'zellen_eis': int((it > 0).sum()), 'zellen_ab_schwelle': int((it >= EIS_AB_M).sum()),
                             'negativ_zellen_quelle_025': negativ, 'negativ_min_m': round(float(voll.min()), 2) if negativ else 0})
        schritte.sort(key=lambda e: e['ka'])
        ideale[name] = {'datei_quelle': os.path.basename(pfad), 'schritte': schritte}
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/eis.py',
        quelle='PaleoMIST 1.0 (Gowan et al. 2021), ice_thickness; CC BY 4.0, doi:10.1594/PANGAEA.905800',
        arten=['rekonstruktion'], bezugssystem='ka_bp_1950',
        zeit_unschaerfe={'fehlt': True, 'grund': 'PaleoMIST nennt keine Unschärfe der Zeitachse; 2,5 ka sind die Auflösung'},
        aufloesung_grad=0.5, breite=720, hoehe=361, gitter='punkte',
        klassen={'kein_eis': 0, 'von': 1, 'bis': 255, 'dicke_max_m': DICKE_MAX, 'skala': 'Wurzel'},
        meereis={'fehlt': True, 'grund': 'PaleoMIST führt nur aufliegendes Eis, kein Meereis'},
        schwelle=dict(eis_ab_m=EIS_AB_M, klasse_ab=KLASSE_AB, setzung='Gezeichnet wird Eis ab 100 m Dicke, wie im Relief (relief.py, EIS_AB_M); dünneres Eis bleibt in den Klassen 1 bis klasse_ab − 1'),
        negativ={'hinweis': 'Die Quelle enthält negative Dicken (Interpolationsrest, bis etwa −3,4 m); sie gelten als kein Eis. Anzahl je Schritt auf dem 0,25°-Gitter in negativ_zellen_quelle_025',
                 'behandlung': 'Klasse 0; im Volumen nicht mitgezählt'},
        ideale=ideale)
    with open(os.path.join(a.ziel, 'eis.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
    for n, v in ideale.items():
        print(n, v['schritte'][0], v['schritte'][8])


if __name__ == '__main__':
    main()
