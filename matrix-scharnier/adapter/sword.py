#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Flussnetz aus SWORD v17c (SWOT River Database, CC BY 4.0), je Kontinent und Zoomstufe.

Auswahl nach Einzugsfläche facc_total (Entscheidung Max, 2026-11-11): Die Fläche wächst
stromab nie, also ergibt eine Schwelle zusammenhängende Netze bis zur Mündung (gemessen:
2 Abbrüche in Europa gegen 900–2 000 bei Auswahl nach Breite). Die Breite (GRWL, Landsat)
bleibt als Strichstärke und Tooltip. Schwellen und Toleranzen sind Setzungen (Regel 7, 11).

Abschnittstypen (type): 1 Fluss, 3 See am Fluss, 4 Damm, 5 unzuverlässig, 6 Geist.
  Damm: wird gezeigt, mit eigenem Zeichen (Entscheidung Max, 2026-11-12).
  Geist: bleibt in den Daten (typ "geist"), wird nicht als Fluss gezeichnet; Anzahl und
  Länge stehen in data/fluesse.json, Manifest und Legende.

Vereinfachung: Douglas-Peucker in Grad (shapely), Koordinaten auf 3 Nachkommastellen.
Die Länge wird vor und nach der Vereinfachung gemessen (Großkreis), ihr Verhältnis ist die
Längenverzerrung der Stufe (Regel 10).

Ausgabe:
  data/fluesse.json                      Index, Zählungen, Schwellen, Größen
  data/fluesse/<kontinent>_<stufe>.json  GeoJSON; properties: id, typ, b (Breite m, null = fehlt),
                                         a (Einzugsfläche km²), q (facc_quality)

  python3 sword.py --roh ~/ZeroEarth/rohdaten/sword/v17c --kontinente eu [--ziel ../../data]
Benötigt: pyarrow, shapely (nicht im System-Python; z. B. eigenes venv).
"""
import argparse, datetime, hashlib, json, math, os
import numpy as np
import pyarrow.parquet as pq
from shapely import wkb, simplify

STUFEN = [  # Setzungen (Regel 7, 11)
    {'stufe': 'globus', 'name': 'Globus', 'facc_total_min_km2': 100_000, 'toleranz_grad': 0.045, 'toleranz_m': 5000},
    {'stufe': 'kontinent', 'name': 'Kontinent', 'facc_total_min_km2': 10_000, 'toleranz_grad': 0.009, 'toleranz_m': 1000},
    {'stufe': 'region', 'name': 'Region', 'facc_total_min_km2': 1_000, 'toleranz_grad': 0.00225, 'toleranz_m': 250},
]
TYP = {1: 'fluss', 3: 'see', 4: 'damm', 5: 'unzuverlaessig', 6: 'geist'}
KONTINENTE = {'af': 'Afrika', 'as': 'Asien', 'eu': 'Europa und Naher Osten (SWORD-Region EU)',
              'na': 'Nordamerika', 'oc': 'Ozeanien', 'sa': 'Südamerika'}
R_KM = 6371.0088
SPALTEN = ['reach_id', 'reach_length', 'width', 'facc_total', 'facc_quality', 'type',
           'rch_id_dn_1', 'n_rch_down', 'river_name', 'geometry']


def laenge_km(xy):
    """Großkreislänge einer Linie [(lon, lat), …] in km."""
    a = np.radians(np.asarray(xy, float))
    if len(a) < 2: return 0.0
    dlon, dlat = np.diff(a[:, 0]), np.diff(a[:, 1])
    h = np.sin(dlat / 2) ** 2 + np.cos(a[:-1, 1]) * np.cos(a[1:, 1]) * np.sin(dlon / 2) ** 2
    return float(2 * R_KM * np.arcsin(np.sqrt(h)).sum())


def sha256(pfad):
    h = hashlib.sha256()
    with open(pfad, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()


def kontinent(roh, k, ziel):
    datei = f'sword_{k.upper()}_v17c_reaches.parquet'
    pfad = os.path.join(roh, datei)
    t = pq.read_table(pfad, columns=SPALTEN)
    d = {c: t.column(c).to_numpy(zero_copy_only=False) for c in SPALTEN if c != 'geometry'}
    geo = [wkb.loads(g) for g in t.column('geometry').to_pylist()]
    n = len(geo)
    typ = np.array([TYP.get(int(x), f'unbekannt_{int(x)}') for x in d['type']])
    ids = d['reach_id']; pos = {int(r): i for i, r in enumerate(ids)}
    laenge_quelle = d['reach_length'] / 1000.0

    def summe(maske):
        return {'anzahl': int(maske.sum()), 'laenge_km': round(float(laenge_quelle[maske].sum()), 1)}

    gesamt = {'abschnitte': summe(np.ones(n, bool)),
              'je_typ': {name: summe(typ == name) for name in sorted(set(typ))},
              'breite_fehlt': summe(d['width'] <= 0),
              'facc_quality': {str(q): int(c) for q, c in zip(*np.unique(d['facc_quality'].astype(str), return_counts=True))}}
    stufen = {}
    for S in STUFEN:
        sel = d['facc_total'] >= S['facc_total_min_km2']
        idx = np.where(sel)[0]; s = set(int(ids[i]) for i in idx)
        abbr = [int(ids[i]) for i in idx if int(d['rch_id_dn_1'][i]) > 0 and int(d['rch_id_dn_1'][i]) in pos
                and int(d['rch_id_dn_1'][i]) not in s]
        feats, p_vor, p_nach, l_vor, l_nach = [], 0, 0, 0.0, 0.0
        for i in idx:
            g = geo[i]; xy = list(g.coords)
            h = simplify(g, S['toleranz_grad'], preserve_topology=False)
            c = [[round(x, 3), round(y, 3)] for x, y in h.coords]
            if typ[i] != 'geist':   # Längenverzerrung nur über das, was gezeichnet wird
                p_vor += len(xy); p_nach += len(c); l_vor += laenge_km(xy); l_nach += laenge_km(c)
            b = float(d['width'][i])
            feats.append({'type': 'Feature', 'properties': {
                'id': int(ids[i]), 'typ': str(typ[i]), 'b': round(b) if b > 0 else None,
                'a': round(float(d['facc_total'][i])), 'q': str(d['facc_quality'][i])},
                'geometry': {'type': 'LineString', 'coordinates': c}})
        name = f'fluesse/{k}_{S["stufe"]}.json'
        os.makedirs(os.path.join(ziel, 'fluesse'), exist_ok=True)
        text = json.dumps({'type': 'FeatureCollection', 'features': feats}, separators=(',', ':'), ensure_ascii=False)
        with open(os.path.join(ziel, name), 'w', encoding='utf-8') as f: f.write(text)
        stufen[S['stufe']] = {
            'datei': name, 'bytes': len(text.encode('utf-8')),
            'gezeigt': summe(sel & (typ != 'geist')),
            'damm': summe(sel & (typ == 'damm')),
            'geist': summe(sel & (typ == 'geist')),
            'unter_schwelle': summe(~sel),
            'abbrueche_stromab': {'anzahl': len(abbr), 'reach_ids': abbr},
            'punkte': {'quelle': p_vor, 'gezeigt': p_nach},
            'laenge_vereinfacht_km': round(l_nach, 1), 'laenge_quelle_geometrie_km': round(l_vor, 1),
            'verzerrung_laenge': round(l_nach / l_vor, 4) if l_vor else None,
        }
        print(f'{k} {S["stufe"]:9s} {len(feats):6d} Abschnitte  {stufen[S["stufe"]]["bytes"]/1e6:6.2f} MB  '
              f'Länge vereinfacht/Quelle {stufen[S["stufe"]]["verzerrung_laenge"]}  Abbrüche {len(abbr)}')
    return {'name': KONTINENTE[k], 'datei_quelle': datei, 'sha256': sha256(pfad), 'gesamt': gesamt, 'stufen': stufen}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--roh', required=True)
    ap.add_argument('--kontinente', default='eu')
    ap.add_argument('--ziel', default=os.path.join(os.path.dirname(__file__), '..', '..', 'data'))
    a = ap.parse_args()
    roh = os.path.expanduser(a.roh)
    aus = {
        'erzeugt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        'hinweis': 'erzeugt von matrix-scharnier/adapter/sword.py',
        'quelle': {'name': 'SWORD v17c (SWOT River Database)', 'zenodo': '10.5281/zenodo.23870877',
                   'archiv': 'SWORD_v17c_parquet.zip, Dateien sword_<XX>_v17c_reaches.parquet', 'lizenz': 'CC BY 4.0',
                   'veroeffentlicht': '2026-11-01'},
        'auswahl': {'kriterium': 'facc_total', 'einheit': 'km2',
                    'begruendung': 'Einzugsfläche wächst stromab nie: zusammenhängende Netze bis zur Mündung (Entscheidung Max, 2026-11-11)'},
        'stufen': STUFEN,
        'typen': TYP,
        'kontinente': {k: kontinent(roh, k, a.ziel) for k in a.kontinente.split(',')},
        'fehlt': {k: f'{v}: Rohdaten nicht geladen (Freigabe ausstehend)' for k, v in KONTINENTE.items()
                  if k not in a.kontinente.split(',')},
    }
    with open(os.path.join(a.ziel, 'fluesse.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
