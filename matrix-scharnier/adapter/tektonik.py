#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tektonik: heutige Küstenumrisse, gedreht nach drei Plattenmodellen (Ideale)
und, jenseits von 1 Ga, nach Cao et al. 2024; dazu die 0-m-Linien der
PALEOMAP-Paläo-DEMs.

Variante B aus kern/BERICHT-tektonik.md: Die Geometrie steht einmal in der
Datei, je Zeitschritt nur die Drehung (Eulerpol, Winkel) je Platte. pyGPlates
rechnet jede Drehung an jeder Stützstelle; die Seite wendet sie nur an.
Zwischen den Schritten wird nichts interpoliert. Fehlt einer Platte die
Drehung, steht null, nie die Identität: pyGPlates ließe die Platte sonst
stillschweigend an ihrer heutigen Lage.

  python3 tektonik.py --roh <Ordner mit den entpackten Zenodo-Archiven> \
          [--ziel ../../data]

Braucht pygplates, shapely, netCDF4, contourpy (nicht Teil des Repos).
"""
import argparse, datetime, glob, json, os, re
import numpy as np
import pygplates, contourpy
from netCDF4 import Dataset
from shapely.geometry import LineString
from shapely import simplify

TOLERANZ = 0.1    # Grad, Douglas-Peucker für die Polygone der Plattenmodelle
TOLERANZ_DEM = 0.25   # Grad, für die 0-m-Linien der 1°-Paläo-DEMs
STELLEN = 1       # Nachkommastellen in Grad für Linien
SCHRITTE = [0] + list(range(1, 67)) + list(range(70, 251, 5)) + list(range(260, 1001, 10))
SCHRITTE_CAO = list(range(1025, 1801, 25))   # Cao nur jenseits von 1 Ga


def linie(punkte, ring=False, toleranz=TOLERANZ):
    if len(punkte) < (4 if ring else 2):
        return None
    s = simplify(LineString(punkte), toleranz, preserve_topology=True)
    c = [[round(x, STELLEN), round(y, STELLEN)] for x, y in s.coords]
    c = [p for i, p in enumerate(c) if i == 0 or p != c[i - 1]]
    return c if len(c) > (3 if ring else 1) else None


def zeitgrenze(x):
    return 'offen' if not np.isfinite(x) else round(float(x), 3)


def ring(g):
    pts = [(p.to_lat_lon()[1], p.to_lat_lon()[0]) for p in g.get_points()]
    return pts + pts[:1] if isinstance(g, pygplates.PolygonOnSphere) else pts


def geometrie(features):
    """Heutige Polygone je Merkmal als geschlossene Ringe: Plattennummer,
    Gültigkeit, Ringe. Ganze Ringe, nicht an der Küste zerschnitten: Der
    frühere Filter auf die heutige Küste zerlegte die Linien in Stücke von
    meist zwei Punkten (kern/BERICHT-tektonik.md, Zerfall der Linien)."""
    aus = []
    for f in features:
        b, e = f.get_valid_time()
        ringe = []
        for g in f.get_geometries():
            if not isinstance(g, pygplates.PolygonOnSphere):
                continue
            z = linie(ring(g), ring=True)
            if z:
                ringe.append(z)
        if ringe:
            aus.append({'p': f.get_reconstruction_plate_id(), 'von': zeitgrenze(b), 'bis': zeitgrenze(e), 'l': ringe})
    return aus


def drehungen(rot, platten, schritte):
    """Je Schritt je Platte [Pol-Breite, Pol-Länge, Winkel] oder null."""
    alle = []
    for t in schritte:
        zeile = []
        for p in platten:
            r = rot.get_rotation(float(t), p, use_identity_for_missing_plate_ids=False)
            if r is None:
                zeile.append(None)
            elif r.represents_identity_rotation():
                zeile.append([90.0, 0.0, 0.0])
            else:
                la, lo, w = r.get_lat_lon_euler_pole_and_angle_degrees()
                zeile.append([round(la, 3), round(lo, 3), round(w, 4)])
        alle.append(zeile)
    return alle


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--roh', required=True)
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    R = a.roh.rstrip('/') + '/'
    merdith = R + 'Merdith_etal_2021_ESR_v1.2.4/'
    mueller = R + 'Muller_etal_2022_SE_v1.2.4/'
    cao = R + '1.8Ga_model_GSF/1.8Ga_model_GSF/'
    pm = R + 'paleomap_global_plate_model_v19o_r1c/'

    kueste_m = pygplates.FeatureCollection(merdith + 'Coastlines/shapes_coastlines_Merdith_et_al_v2.gpmlz')
    rot_m = pygplates.RotationModel(merdith + 'Rotations/1000_0_rotfile_Merdith_etal.rot')
    rot_mu = pygplates.RotationModel(mueller + 'optimisation/1000_0_rotfile_MantleOpt.rot')
    rot_pm = pygplates.RotationModel(pm + 'm06c9h_3id_forPgeog_19o_r1c.rot')
    rot_c = pygplates.RotationModel([cao + '1000_0_rotfile.rot', cao + '1800_1000_rotfile.rot'])

    # PALEOMAP bringt keine Küsten mit: Jedes Merdith-Polygon erhält ganz die
    # Plattennummer der PALEOMAP-Platte, mit der es sich am meisten überlappt.
    # Früher: Teilung an den Plattengrenzen (split_into_plates). Sie zerlegt
    # die Polygone in Linienstücke; da nur Polygone übernommen wurden, fielen
    # zwei Drittel weg (266 statt 848 Kontinentmerkmale).
    geteilt = pygplates.partition_into_plates(
        pm + 'PALEOMAP_PlatePolygons__forPgeog_v19o.gpml', rot_pm, kueste_m,
        partition_method=pygplates.PartitionMethod.most_overlapping_plate)

    kueste_c = pygplates.FeatureCollection(cao + 'shapes_coasts.gpmlz')
    kont_m = pygplates.FeatureCollection(merdith + 'Continents/shapes_continents.gpml')
    kont_c = pygplates.FeatureCollection(cao + 'shapes_continents.gpmlz')
    kont_pm = pygplates.partition_into_plates(
        pm + 'PALEOMAP_PlatePolygons__forPgeog_v19o.gpml', rot_pm, kont_m,
        partition_method=pygplates.PartitionMethod.most_overlapping_plate)
    geo = {
        'merdith': {'name': 'Merdith et al. 2021: Küstenpolygone (shapes_coastlines_v2) und Kontinentpolygone (shapes_continents)',
                    'kueste': geometrie(kueste_m), 'kontinente': geometrie(kont_m)},
        'paleomap': {'name': 'Merdith-Polygone, je ganz der PALEOMAP-Platte (v19o_r1c) mit der größten Überlappung zugeordnet (Setzung: PALEOMAP bringt keine eigenen mit)',
                     'kueste': geometrie(geteilt), 'kontinente': geometrie(kont_pm)},
        'cao': {'name': 'Cao et al. 2024: Küstenpolygone (shapes_coasts) und Kontinentpolygone (shapes_continents)',
                'kueste': geometrie(kueste_c), 'kontinente': geometrie(kont_c)},
    }
    platten = {k: sorted({f['p'] for f in g['kueste'] + g['kontinente']}) for k, g in geo.items()}

    def modell(name, zitat, doi, rahmen, laenge, arten, g, rot, schritte, ideal):
        return {'name': name, 'zitat': zitat, 'doi': doi, 'bezugsrahmen': rahmen, 'laengengrad': laenge,
                'arten': arten, 'ideal': ideal, 'geometrie': g, 'schritte_ma': schritte, 'platten': platten[g],
                'rotationen': drehungen(rot, platten[g], schritte)}

    PMAG = 'Im paläomagnetischen Bezug legt die Paläomagnetik nur die Breite fest; die Länge ist eine Konvention des Modells, keine Messung.'
    modelle = {
        'merdith2021': modell('Merdith et al. 2021', 'Merdith, A. S. et al. (2021): Extending full-plate tectonic models into deep time. Earth-Science Reviews 214, 103477',
                              'doi:10.5281/zenodo.13635864', 'paläomagnetisch', PMAG, ['rekonstruktion', 'berechnet'], 'merdith', rot_m, SCHRITTE, True),
        'mueller2022': modell('Müller et al. 2022 (Mantelbezug)', 'Müller, R. D. et al. (2022): A tectonic-rules-based mantle reference frame since 1 billion years ago. Solid Earth 13, 1127-1159',
                              'doi:10.5281/zenodo.13636799', 'Mantel, optimiert nach tektonischen Regeln',
                              'Die Länge folgt aus einer Optimierung nach tektonischen Regeln (Modell), nicht aus einer Messung.',
                              ['modell', 'berechnet'], 'merdith', rot_mu, SCHRITTE, True),
        'paleomap': modell('PALEOMAP-Rotation v19o_r1c (Scotese)', 'Kocsis, Á. T., Scotese, C. R. (2021), Earth-Science Reviews, doi:10.1016/j.earscirev.2020.103463; Rotationsdatei m06c9h_3id_forPgeog_19o_r1c',
                           'doi:10.5281/zenodo.7994000', 'PALEOMAP (Paläomagnetik, Hotspots)', PMAG, ['rekonstruktion', 'berechnet'], 'paleomap', rot_pm, SCHRITTE, True),
        'cao2024': modell('Cao et al. 2024', 'Cao, X. et al. (2024): Earth\'s tectonic and plate boundary evolution over 1.8 billion years. Geoscience Frontiers 15(6), 101922',
                          'doi:10.5281/zenodo.13628813', 'paläomagnetisch', PMAG, ['rekonstruktion', 'berechnet'], 'cao', rot_c, SCHRITTE_CAO, False),
    }

    umrisse = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/tektonik.py',
        woher=dict(kette='Plattenmodell (Rotationen) -> heutige Küsten- und Kontinentpolygone gedreht (pyGPlates 1.0)',
                   lizenz='CC BY 4.0 (alle vier Quellen, Zenodo, geprüft 2026-11-05); von zeroearth bearbeitet: Linien vereinfacht, Drehungen je Schritt berechnet',
                   form='Umriss heutig, nur die Lage ist rekonstruiert',
                   verfahren=f'Polygone als ganze Ringe, Douglas-Peucker {TOLERANZ}° (Topologie erhalten), auf {STELLEN} Nachkommastelle gerundet; Drehung je Platte und Schritt aus pyGPlates get_rotation, ohne Identität für fehlende Platten'),
        zeit=dict(bezugssystem='ma_bp', unschaerfe=dict(fehlt=True, grund='Die Plattenmodelle nennen keine Unschärfe der Zeit; der Abstand der Schritte ist die Auflösung, nur eine Untergrenze')),
        geometrien=geo, modelle=modelle)

    # Paläoküsten: 0-m-Linie der PALEOMAP-Paläo-DEMs (1°)
    karten = []
    for p in sorted(glob.glob(R + 'Scotese_Wright_2018_Maps_1-88_1degX1deg_PaleoDEMS_nc/*/*.nc')):
        name = os.path.basename(p)
        m = re.search(r'_(\d+(?:\.\d+)?)Ma\.nc$', name)
        d = Dataset(p)
        z = np.ma.filled(d.variables['z'][:].astype(float), np.nan)
        lat = np.asarray(d.variables[[k for k in d.variables if k.lower().startswith('lat')][0]][:])
        lon = np.asarray(d.variables[[k for k in d.variables if k.lower().startswith('lon')][0]][:])
        zuege = [linie(l.tolist(), toleranz=TOLERANZ_DEM) for l in contourpy.contour_generator(lon, lat, z, line_type='Separate').lines(0.0)]
        stufe = re.sub(r'^Map\d+_PALEOMAP_1deg_|_\d+(?:\.\d+)?Ma\.nc$', '', name).replace('_', ' ')
        karten.append({'ma': float(m.group(1)), 'stufe': stufe, 'datei': name, 'linien': [x for x in zuege if x]})
    karten.sort(key=lambda k: k['ma'])
    kuesten = dict(
        erzeugt=umrisse['erzeugt'], hinweis=umrisse['hinweis'],
        woher=dict(arten=['rekonstruktion', 'kuratiert', 'berechnet'],
                   kette='PALEOMAP-DEM (Scotese & Wright 2018) -> 0-m-Linie; unabhängig von der PALEOMAP-Rotation',
                   lizenz='CC BY 4.0, Scotese & Wright 2018, doi:10.5281/zenodo.5460860 (License.txt im Archiv); von zeroearth bearbeitet: 0-m-Linien abgeleitet',
                   form='Höhenkarte aus geologischen Belegen erstellt, nicht gemessen',
                   bezugsrahmen='Koordinaten der Paläo-DEMs (PALEOMAP), nicht die der Plattenmodelle',
                   verfahren=f'Kontur bei 0 m auf 1°, linear zwischen Gitterpunkten; Douglas-Peucker {TOLERANZ_DEM}°, {STELLEN} Nachkommastelle'),
        zeit=dict(bezugssystem='ma_bp', aufloesung_ma=5,
                  unschaerfe=dict(fehlt=True, grund='Die Paläo-DEMs nennen keine Unschärfe der Zeit; die Alter sind Kartenalter je Stufe')),
        raum=dict(aufloesung_grad=1, unschaerfe=dict(fehlt=True, grund='Die Paläo-DEMs nennen keine Unschärfe der Höhen; 1° ist die Auflösung')),
        karten=karten)

    # Stichprobe für den Test: pyGPlates dreht einzelne Punkte der gespeicherten
    # Linien; die Seite muss mit den gespeicherten Drehungen dasselbe erhalten.
    rot_je = {'merdith2021': rot_m, 'mueller2022': rot_mu, 'paleomap': rot_pm, 'cao2024': rot_c}
    stichprobe = []
    for k, m in modelle.items():
        for t in ([100, 500, 1000] if k != 'cao2024' else [1100, 1500, 1800]):
            gefunden = 0
            for f in geo[m['geometrie']]['kueste']:
                von = float('inf') if f['von'] == 'offen' else f['von']
                bis = float('-inf') if f['bis'] == 'offen' else f['bis']
                if not (bis <= t <= von):
                    continue
                r = rot_je[k].get_rotation(float(t), f['p'], use_identity_for_missing_plate_ids=False)
                if r is None:
                    continue
                lo, la = f['l'][0][0]
                q = pygplates.Feature()
                q.set_geometry(pygplates.PointOnSphere(la, lo)); q.set_reconstruction_plate_id(f['p'])
                rec = []; pygplates.reconstruct(q, rot_je[k], rec, float(t))
                la2, lo2 = rec[0].get_reconstructed_geometry().to_lat_lon()
                stichprobe.append({'modell': k, 'ma': t, 'platte': f['p'], 'heute': [lo, la], 'damals': [round(lo2, 4), round(la2, 4)]})
                gefunden += 1
                if gefunden == 3:
                    break
    with open(os.path.join(os.path.dirname(__file__), '../../kern/test/tektonik_stichprobe.json'), 'w', encoding='utf-8') as f:
        json.dump({'hinweis': 'erzeugt von matrix-scharnier/adapter/tektonik.py; pyGPlates 1.0', 'punkte': stichprobe}, f, ensure_ascii=False, indent=1)

    for name, inhalt in (('tektonik_umrisse.json', umrisse), ('tektonik_palaeokuesten.json', kuesten)):
        with open(os.path.join(a.ziel, name), 'w', encoding='utf-8') as f:
            json.dump(inhalt, f, ensure_ascii=False, separators=(',', ':'))
    for k, m in modelle.items():
        leer = sum(r is None for z in m['rotationen'] for r in z)
        print(f"{k:12s} {len(m['schritte_ma'])} Schritte, {len(m['platten'])} Platten, ohne Drehung {leer}")
    print('Paläo-DEM-Karten', len(karten), [k['ma'] for k in karten][:6], '…')


if __name__ == '__main__':
    main()
