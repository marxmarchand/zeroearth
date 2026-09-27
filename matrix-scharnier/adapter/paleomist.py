#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PaleoMIST-Adapter — sechs Fenster eines Ereigniskomplexes.

Dieselbe Ursache (eustatischer Anstieg nach der Eiszeit), sechs Orte,
verschiedene Ergebnisse. Ein Datensatz für alle sechs, damit der Vergleich
nicht aus sechs Lieblingsrekonstruktionen besteht.

Grenzen, die mitgeschrieben werden: 2500-Jahre-Schritte sind zu grob für
Schmelzwasserpulse — was hier steht, ist die Hüllkurve, nicht das Ereignis.
Und Sedimentation fehlt: Küstenlinien aus Topographie und Meeresspiegel
sind Näherung, keine Kartierung.

  python3 paleomist.py --quelle <datei.nc> [--ziel ../../data/sintflut.json]
"""
import argparse, json, math, datetime
import numpy as np
from netCDF4 import Dataset

R_ERDE = 6371.0088  # km, mittlerer Radius

# Fenster des Komplexes. Die Kästen sind Setzungen: sie entscheiden, was
# als "der Ort" gilt. Absichtlich grob auf das jeweilige Schelf gelegt.
ORTE = {
    'persischer_golf': dict(
        name='Persischer Golf · Mesopotamien', bbox=(47, 57, 23, 31),
        notiz='Flaches Becken, meist unter 50 m. Bei 20 ka weitgehend trocken.'),
    'doggerland': dict(
        name='Doggerland · südliche Nordsee', bbox=(-2, 9, 51, 57),
        notiz='Bewohntes Land, mesolithische Funde aus Schleppnetzen. Keine Überlieferung.'),
    'schwarzes_meer': dict(
        name='Schwarzes Meer · Nordwestschelf', bbox=(27, 42, 40, 47),
        notiz='Katastrophische Version (Ryan/Pitman 1997) umstritten.'),
    'sundaschelf': dict(
        name='Sundaschelf · Indonesien', bbox=(100, 118, -8, 10),
        notiz='Sehr flaches Schelf, ein Meter Wasser verschiebt die Küste um Kilometer.'),
    'sahulschelf': dict(
        name='Sahul- und Arafuraschelf · Nordaustralien', bbox=(125, 145, -20, -8),
        notiz='Überlieferung in Erzählungen von 21 Küstenorten (Nunn & Reid 2016).'),
    'yucatan': dict(
        name='Yucatán · Mittelamerika', bbox=(-95, -80, 15, 25),
        notiz='Schmale Schelfe. Flutüberlieferung vorhanden, physisches Gegenstück schwach.'),
}

def zellflaechen(lat, dlat, dlon):
    """Exakte Kugelflaeche je Gitterzeile in km^2."""
    d = math.radians(dlat) / 2
    oben = np.sin(np.radians(lat) + d)
    unten = np.sin(np.radians(lat) - d)
    return R_ERDE**2 * math.radians(dlon) * (oben - unten)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--quelle', required=True)
    p.add_argument('--ziel', default='../../data/sintflut.json')
    a = p.parse_args()

    d = Dataset(a.quelle)
    zeit = d.variables['time'][:].astype(float)
    lat, lon = d.variables['lat'][:], d.variables['lon'][:]
    dlat = float(abs(lat[1] - lat[0])); dlon = float(abs(lon[1] - lon[0]))

    ergebnis = {}
    for schluessel, ort in ORTE.items():
        w, e, s, n = ort['bbox']
        jy = np.where((lat >= s) & (lat <= n))[0]
        jx = np.where((lon >= w) & (lon <= e))[0]
        flaeche = zellflaechen(lat[jy], dlat, dlon)[:, None] * np.ones(len(jx))
        gesamt = float(flaeche.sum())

        reihe = []
        for i, t in enumerate(zeit):
            topo = d.variables['paleo_topography'][i, jy, jx]
            rsl  = d.variables['sea_level'][i, jy, jx]
            land = np.asarray(topo) > 0
            lf = float((flaeche * land).sum())
            reihe.append(dict(
                ka_bp=round(-t / 1000, 1),
                land_km2=round(lf),
                land_anteil=round(lf / gesamt, 4),
                meeresspiegel_m=round(float(np.asarray(rsl).mean()), 1)))

        # Trockenster Stand, heutiger Stand, und der schnellste Schritt
        trocken = max(reihe, key=lambda r: r['land_km2'])
        heute = reihe[-1]
        schritte = [dict(von=reihe[i]['ka_bp'], bis=reihe[i+1]['ka_bp'],
                         verlust_km2=reihe[i]['land_km2'] - reihe[i+1]['land_km2'])
                    for i in range(len(reihe) - 1)]
        schnellster = max(schritte, key=lambda x: x['verlust_km2'])

        ergebnis[schluessel] = dict(
            name=ort['name'], notiz=ort['notiz'],
            bbox=dict(west=w, ost=e, sued=s, nord=n),
            fenster_km2=round(gesamt),
            trockenster_stand=trocken, heute=heute,
            verlust_km2=trocken['land_km2'] - heute['land_km2'],
            verlust_anteil=round(1 - heute['land_km2'] / trocken['land_km2'], 4)
                           if trocken['land_km2'] else None,
            schnellster_schritt=schnellster,
            reihe=reihe)

    datei = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/paleomist.py',
        ereigniskomplex='Nacheiszeitliche Transgression — sechs Fenster, eine Ursache',
        woher=dict(
            art='rekonstruktion',
            quelle='PaleoMIST 1.0, globales Gitter 0.25 Grad (paleo_topography, sea_level)',
            datei=a.quelle.split('/')[-1],
            zeitschritt='2500 a',
            zeitraum=f'{round(-zeit[0]/1000)} ka BP bis heute, {len(zeit)} Schritte',
            grenzen=['2500-Jahre-Schritte: Huellkurve, nicht das Ereignis — '
                     'Schmelzwasserpulse 1A/1B fallen zwischen zwei Stuetzstellen',
                     'keine Sedimentation: Kuestenlinie aus Topographie und '
                     'Meeresspiegel gerechnet, nicht kartiert',
                     '0.25 Grad sind am Aequator rund 28 km — Flusslaeufe und '
                     'Marschen liegen darunter',
                     'die Fenster sind Setzungen: der Kasten entscheidet, was als Ort gilt'],
            pruefbar_gegen='reconstruction_a1_0.25_degree.nc (alternative Eisgeschichte)'),
        orte=ergebnis)

    with io_open(a.ziel) as f:
        json.dump(datei, f, ensure_ascii=False, indent=2)

    # Lesbare Übersicht
    print(f"{'Ort':34s} {'trocken':>16s} {'heute':>10s} {'Verlust':>12s} {'schnellster Schritt':>26s}")
    print('-' * 104)
    for k, o in ergebnis.items():
        t, h = o['trockenster_stand'], o['heute']
        s = o['schnellster_schritt']
        print(f"{o['name'][:33]:34s} "
              f"{t['land_km2']:>9,d} km² @{t['ka_bp']:>4.0f}ka "
              f"{h['land_km2']:>9,d} "
              f"{o['verlust_km2']:>8,d} km² "
              f"{s['verlust_km2']:>9,d} km² in {s['von']:.0f}–{s['bis']:.0f} ka")
    print(f"\n{a.ziel} geschrieben")

def io_open(pfad):
    import os
    os.makedirs(os.path.dirname(pfad) or '.', exist_ok=True)
    return open(pfad, 'w', encoding='utf-8')

if __name__ == '__main__':
    main()
