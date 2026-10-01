#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PaleoMIST-Eis — Eis- und Ozeanvolumen aus den 1°-Dateien, zwei Ideale.

PaleoMIST 1.0 (Gowan 2019; Gowan et al. 2021, PANGAEA doi:10.1594/PANGAEA.905800,
CC BY 4.0) liefert zwei Eisgeschichten: die Referenz und a1. Beide werden
gleich behandelt (Regel 13: passen mehrere Ideale, werden alle gezeigt).

Abgeleitet wird nur, was ohne zusätzliche Annahmen aus den Daten folgt
(Regel 12): Summen über das Gitter.
  eis_volumen_m3    Summe ice_thickness × Zellfläche (aufliegendes Eis)
  ozean_volumen_m3  Summe max(0, −paleo_topography) × Zellfläche
  land_km2 je Fenster  Zellen mit paleo_topography > 0 (wie paleomist.py)
Dichten und damit Massen sind Annahmen und stehen im Manifest des
Sintflut-Adapters, nicht hier.

Die 1°-Dateien (je 34,5 MB) liegen im PANGAEA-ZIP (3,7 GB). --holen lädt
nur diese beiden Mitglieder per HTTP-Range in ein Verzeichnis außerhalb
des Repos.

  python3 paleomist_eis.py --dateien <ordner> [--holen] [--ziel ../../data/paleomist_eis.json]
"""
import argparse, datetime, json, math, os, struct, urllib.request, zlib
import numpy as np
from netCDF4 import Dataset
from paleomist import ORTE

R_ERDE_M = 6371008.8
ZIP_URL = 'https://hs.pangaea.de/Maps/Global_Ice_Sheets/Gowan_ice_reconstruction.zip'
IDEALE = {
    'referenz': 'reconstruction_1_degree.nc',
    'a1': 'reconstruction_a1_1_degree.nc',
}


def zellflaechen_m2(lat, lon):
    """Kugelfläche je Gitterzelle in m² (Gitterpunkt-Registrierung: Zellen um
    die Knoten, an den Polen halbe Zellen; die doppelte Spalte ±180° zählt einmal)."""
    dlat = float(abs(lat[1] - lat[0])); dlon = float(abs(lon[1] - lon[0]))
    oben = np.sin(np.radians(np.minimum(lat + dlat / 2, 90)))
    unten = np.sin(np.radians(np.maximum(lat - dlat / 2, -90)))
    zeile = R_ERDE_M ** 2 * math.radians(dlon) * (oben - unten)
    spalten = np.ones(len(lon))
    if abs(lon[-1] - lon[0] - 360) < 1e-6:
        spalten[-1] = 0
    return zeile[:, None] * spalten[None, :]


def holen(ordner):
    """Nur die 1°-Mitglieder aus dem PANGAEA-ZIP holen (HTTP-Range)."""
    def rng(a, b):
        req = urllib.request.Request(ZIP_URL, headers={'Range': f'bytes={a}-{b}'})
        return urllib.request.urlopen(req).read()
    groesse = int(urllib.request.urlopen(urllib.request.Request(ZIP_URL, method='HEAD')).headers['Content-Length'])
    ende = rng(groesse - 65557, groesse - 1)
    i = ende.rfind(b'PK\x05\x06')
    cd_size, cd_off = struct.unpack('<II', ende[i + 12:i + 20])
    if cd_off == 0xffffffff:
        j = ende.rfind(b'PK\x06\x07'); z64 = struct.unpack('<Q', ende[j + 8:j + 16])[0]
        cd_size, cd_off = struct.unpack('<QQ', rng(z64, z64 + 55)[40:56])
    cd = rng(cd_off, cd_off + cd_size - 1); p = 0; gesucht = set(IDEALE.values())
    while cd[p:p + 4] == b'PK\x01\x02':
        meth = struct.unpack('<H', cd[p + 10:p + 12])[0]
        csz, usz = struct.unpack('<II', cd[p + 20:p + 28])
        n, e, c = struct.unpack('<HHH', cd[p + 28:p + 34]); off = struct.unpack('<I', cd[p + 42:p + 46])[0]
        name = cd[p + 46:p + 46 + n].decode(errors='replace')
        if name.split('/')[-1] in gesucht and '/global_grid/' in name:
            kopf = rng(off, off + 29)
            ln, le = struct.unpack('<HH', kopf[26:30])
            roh = rng(off + 30 + ln + le, off + 30 + ln + le + csz - 1)
            daten = zlib.decompress(roh, -15) if meth == 8 else roh
            assert len(daten) == usz, name
            with open(os.path.join(ordner, name.split('/')[-1]), 'wb') as f:
                f.write(daten)
            print(f'geholt: {name} ({usz / 1e6:.1f} MB)')
        p += 46 + n + e + c


def reihe(pfad):
    d = Dataset(pfad)
    zeit = d.variables['time'][:].astype(float)
    einheit = d.variables['time'].units
    lat, lon = d.variables['lat'][:], d.variables['lon'][:]
    A = zellflaechen_m2(lat, lon)
    eis, ozean = [], []
    fenster = {k: [] for k in ORTE}
    for i in range(len(zeit)):
        h = np.ma.filled(d.variables['ice_thickness'][i], np.nan)
        h = np.where(np.isnan(h) | (h < 0), 0.0, h)   # winzige negative Werte (ab −0,05 m) als 0
        tp = np.ma.filled(d.variables['paleo_topography'][i], np.nan)
        eis.append(float((A * h).sum()))
        ozean.append(float((A * np.where(np.isnan(tp), 0.0, np.maximum(0.0, -tp))).sum()))
        for k, ort in ORTE.items():
            w, e, s, n = ort['bbox']
            jy = (lat >= s) & (lat <= n); jx = (lon >= w) & (lon <= e)
            fenster[k].append(round(float((A[np.ix_(jy, jx)] * (tp[np.ix_(jy, jx)] > 0)).sum()) / 1e6))
    return dict(
        datei=os.path.basename(pfad), zeiteinheit=einheit,
        ka_bp=[round(-t / 1000, 1) + 0.0 for t in zeit],
        eis_volumen_m3=[round(v) for v in eis],
        ozean_volumen_m3=[round(v) for v in ozean],
        fenster_land_km2=fenster)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--dateien', required=True, help='Ordner mit den beiden 1°-Dateien (außerhalb des Repos)')
    p.add_argument('--holen', action='store_true', help='1°-Dateien vorher per HTTP-Range von PANGAEA holen')
    p.add_argument('--ziel', default='../../data/paleomist_eis.json')
    a = p.parse_args()
    if a.holen:
        os.makedirs(a.dateien, exist_ok=True); holen(a.dateien)

    ideale = {k: reihe(os.path.join(a.dateien, f)) for k, f in IDEALE.items()}
    datei = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/paleomist_eis.py',
        woher=dict(
            art='rekonstruktion',
            quelle='PaleoMIST 1.0, globales Gitter 1 Grad (ice_thickness, paleo_topography)',
            doi='10.1594/PANGAEA.905800',
            artikel='Gowan et al. 2021, Nature Communications, doi:10.1038/s41467-021-21469-w',
            lizenz='CC BY 4.0',
            zeitachse=ideale['referenz']['zeiteinheit'],
            verfahren=['eis_volumen_m3: Summe ice_thickness × Zellfläche (grounded ice; Werte < 0 als 0)',
                       'ozean_volumen_m3: Summe max(0, −paleo_topography) × Zellfläche '
                       '(enthält Becken unter Meeresniveau im Landesinneren)',
                       'fenster_land_km2: Zellen mit paleo_topography > 0 in den Kästen aus paleomist.py, auf 1°'],
            grenzen=['1° statt 0,25°: Eisrand und Küste fallen auf ganze Zellen',
                     'nur aufliegendes Eis (grounded); Schelfeis ist nicht enthalten']),
        ideale=ideale)
    with open(a.ziel, 'w', encoding='utf-8') as f:
        json.dump(datei, f, ensure_ascii=False, indent=1)
    for k, r in ideale.items():
        print(f"{k:9s} {r['datei']}: Eis max {max(r['eis_volumen_m3']):.3e} m³, heute {r['eis_volumen_m3'][-1]:.3e} m³")
    print('geschrieben:', a.ziel)


if __name__ == '__main__':
    main()
