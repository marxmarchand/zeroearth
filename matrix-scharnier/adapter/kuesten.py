#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Küstenlinie global aus PaleoMIST 1.0, 0,25°, alle 33 Schritte 80–0 ka.

Die Küste ist die Grenze zwischen Zellen mit paleo_topography > 0 (Land, auch
Eis) und ≤ 0 (Meer): ganze Ringe entlang der Zellkanten, ohne Interpolation,
weder im Raum noch in der Zeit. Dieselbe Grenze wie die Landflächen und wie das
Relief (data/relief/paleomist/), deshalb fallen Küste und Reliefkante zusammen.

Koordinaten als ganze Zahlen der Zellecken: x in 0..1440 (Länge
−180,125 + x · 0,25, x = 1440 ist x = 0), y in 0..721 (Breite 90,125 − y · 0,25,
an den Polen auf ±90 begrenzt). Ein Ring ist [x0, y0, x1, y1, …], nur die Ecken,
an denen die Richtung wechselt.

  python3 kuesten.py --quelle <reconstruction_0.25_degree.nc> [--ziel ../../data]
"""
import argparse, datetime, json, os
from collections import defaultdict
import numpy as np
from netCDF4 import Dataset


def ringe(land):
    H, W = land.shape
    kanten = []                      # (von, nach), Land rechts im Uhrzeigersinn um jede Landzelle
    rechts = np.roll(land, -1, axis=1)
    for r, c in zip(*np.nonzero(land & ~rechts)):  kanten.append(((c + 1, r), (c + 1, r + 1)))     # Landzelle, rechts Meer: nach unten
    for r, c in zip(*np.nonzero(~land & rechts)):  kanten.append(((c + 1, r + 1), (c + 1, r)))     # rechts Land: nach oben
    unten = np.zeros_like(land); unten[:-1] = land[1:]
    for r, c in zip(*np.nonzero(land[:-1] & ~unten[:-1])): kanten.append(((c + 1, r + 1), (c, r + 1)))   # unten Meer: nach links
    for r, c in zip(*np.nonzero(~land[:-1] & unten[:-1])): kanten.append(((c, r + 1), (c + 1, r + 1)))   # unten Land: nach rechts
    kanten = [((int(a[0]), int(a[1])), (int(b[0]), int(b[1]))) for a, b in kanten]
    norm = lambda p: (p[0] % W, p[1])
    aus = defaultdict(list)
    for i, (a, b) in enumerate(kanten):
        aus[norm(a)].append(i)
    frei = [True] * len(kanten)
    ergebnis = []
    for start in range(len(kanten)):
        if not frei[start]:
            continue
        ring, k = [], start
        while frei[k]:
            frei[k] = False
            a, b = kanten[k]
            ring.append(norm(a))
            nachfolger = [j for j in aus[norm(b)] if frei[j]]
            if not nachfolger:
                break
            if len(nachfolger) > 1:      # Sattel: im Uhrzeigersinn rechts abbiegen, Landzellen bleiben getrennt
                dx, dy = b[0] - a[0], b[1] - a[1]
                def drehung(j):
                    c, d = kanten[j]
                    ex, ey = d[0] - c[0], d[1] - c[1]
                    return dx * ey - dy * ex         # > 0: rechts (y nach unten)
                nachfolger.sort(key=drehung, reverse=True)
            k = nachfolger[0]
        # nur Ecken mit Richtungswechsel
        n = len(ring)
        knick = [ring[i] for i in range(n)
                 if ((ring[i][0] - ring[i - 1][0]) % W, ring[i][1] - ring[i - 1][1]) != ((ring[(i + 1) % n][0] - ring[i][0]) % W, ring[(i + 1) % n][1] - ring[i][1])]
        if len(knick) >= 4:
            ergebnis.append([v for p in knick + knick[:1] for v in p])
    return ergebnis


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--quelle', required=True)
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    os.makedirs(os.path.join(a.ziel, 'kuesten', 'paleomist'), exist_ok=True)
    d = Dataset(a.quelle)
    zeit = np.asarray(d.variables['time'][:], float)
    schritte = []
    for i, t in enumerate(zeit):
        z = np.ma.filled(d.variables['paleo_topography'][i].astype(float), np.nan)[::-1, :-1]
        r = ringe(np.nan_to_num(z, nan=0.0) > 0)
        ka = abs(round(-t / 1000, 1))
        datei = f'kuesten/paleomist/{int(round(ka * 10)):03d}.json'
        with open(os.path.join(a.ziel, datei), 'w', encoding='utf-8') as f:
            json.dump({'ka': ka, 'ringe': r}, f, separators=(',', ':'))
        schritte.append({'ka': ka, 'datei': datei, 'ringe': len(r), 'ecken': sum(len(x) // 2 for x in r)})
    schritte.sort(key=lambda e: e['ka'])
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/kuesten.py',
        woher=dict(arten=['rekonstruktion', 'berechnet'], kette='PaleoMIST 1.0 (paleo_topography) -> Grenze Land/Meer (0 m) entlang der Zellkanten',
                   datei=os.path.basename(a.quelle), lizenz='CC BY 4.0, Gowan 2019, doi:10.1594/PANGAEA.905800; von zeroearth bearbeitet: Grenze der Zellen abgeleitet',
                   verfahren='Zellen mit Höhe > 0 sind Land (auch Eis); Kanten zwischen Land und Meer zu ganzen Ringen verbunden, Sattel rechts abbiegend; keine Interpolation',
                   grenzen=['paleo_topography enthält isostatische Deformation (laut Datei); Sedimentation nicht berücksichtigt',
                            'Becken unter 0 m im Landesinneren gelten als Meer, dieselbe Grenze wie die Landflächen']),
        zeit=dict(bezugssystem='ka_bp_1950', aufloesung_ka=2.5,
                  unschaerfe=dict(fehlt=True, grund='PaleoMIST nennt keine Unschärfe der Zeitachse; die 2,5 ka sind die Auflösung')),
        raum=dict(aufloesung_grad=0.25, ecke_laenge='−180,125 + x · 0,25', ecke_breite='90,125 − y · 0,25, begrenzt auf ±90',
                  unschaerfe=dict(fehlt=True, grund='PaleoMIST nennt keine Unschärfe der Topographie; 0,25° sind die Auflösung')),
        ka_bp=[e['ka'] for e in schritte], schritte=schritte)
    with open(os.path.join(a.ziel, 'kuesten.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
    print(len(schritte), 'Schritte; Ringe/Ecken bei 0, 20, 80 ka:',
          [(e['ka'], e['ringe'], e['ecken']) for e in schritte if e['ka'] in (0, 20, 80)])


if __name__ == '__main__':
    main()
