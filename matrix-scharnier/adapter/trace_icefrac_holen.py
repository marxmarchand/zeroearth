#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TraCE-21ka ICEFRAC (DJF, JJA) über OPeNDAP von NCAR GDEX holen, nur diese Variable.

Die ganzen Dateien haben je 38 GB; der Teilabruf (NCSS) bricht bei ihnen ab. Darum
in vier Stücken als OPeNDAP-ASCII (je rund 550 Jahrzehnte; fehlt eines, in Vierteln mit Pausen), danach zu einer
netCDF-Datei je Jahreszeit zusammengesetzt. Vorhandene Stücke werden nicht neu
geladen. Ziel ist der Rohdaten-Ordner, nicht das Repo.

  python3 trace_icefrac_holen.py [--ordner ~/ZeroEarth/rohdaten/meereis/trace] [--ohne-abruf]

--ohne-abruf: nichts laden, nur die vorhandenen Stücke ab dem Anfang der
Zeitachse zusammensetzen. Der Rest steht dann als fehlend in der Datei
(Attribut fehlt_grund, fehlt_ab_index).
"""
import argparse, os, re, time, urllib.error, urllib.request
import numpy as np
from netCDF4 import Dataset

URL = 'https://tds.gdex.ucar.edu/thredds/dodsC/files/d651050/TraCE/atm/b30.00_4kaDVTd.cam2.ncrcat.{js}.nc.ascii?{q}'
N, STUECKE = 2204, (0, 551, 1102, 1653)


def holen(url, pfad, versuche=4):
    if os.path.exists(pfad) and os.path.getsize(pfad) > 1000:
        return
    for v in range(versuche):
        try:
            with urllib.request.urlopen(url, timeout=3000) as r, open(pfad + '.teil', 'wb') as f:
                f.write(r.read())
            os.replace(pfad + '.teil', pfad)
            return
        except urllib.error.HTTPError as e:            # 503/504: Server überlastet, warten
            print('  ', os.path.basename(pfad), e.code, 'Versuch', v + 1, flush=True)
            time.sleep(60 * (v + 1))
    raise SystemExit(f'nicht geladen: {pfad}')


def stueck(o, js, a, b):
    """Ein Stück a..b; liegt es nicht als Ganzes vor, in Vierteln holen (kleinere Antworten)."""
    ganz = os.path.join(o, f'icefrac_{js}_{a:04d}.ascii')
    if os.path.exists(ganz) and os.path.getsize(ganz) > 1000:
        return feld(open(ganz, encoding='utf-8').read(), b - a + 1)
    teile, x = [], a
    while x <= b:
        y = min(x + 137, b)
        pfad = os.path.join(o, f'icefrac_{js}_{x:04d}_{y:04d}.ascii')
        holen(URL.format(js=js, q=f'ICEFRAC%5B{x}:1:{y}%5D%5B0:1:47%5D%5B0:1:95%5D'), pfad)
        teile.append(feld(open(pfad, encoding='utf-8').read(), y - x + 1))
        x = y + 1
    return np.concatenate(teile)


def zahlen(text):
    return np.array([float(x) for x in re.findall(r'-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?|NaN', text)])


def achsen(text):
    aus = {}
    for name in ('lat', 'lon', 'time'):
        m = re.search(rf'^{name}\[(\d+)\]\n(.*?)(?:\n\n|\Z)', text, re.S | re.M)
        aus[name] = np.array([float(x) for x in m.group(2).replace('\n', ' ').split(',')])
        assert len(aus[name]) == int(m.group(1)), name
    return aus


def feld(text, n):
    """ICEFRAC.ICEFRAC[n][48][96]: Zeilen „[t][y], v, v, …“."""
    teil = text.split('ICEFRAC.ICEFRAC[', 1)[1].split('\nICEFRAC.time', 1)[0]
    a = np.full((n, 48, 96), np.nan, np.float32)
    for m in re.finditer(r'^\[(\d+)\]\[(\d+)\], (.*)$', teil, re.M):
        a[int(m.group(1)), int(m.group(2))] = [float(x) for x in m.group(3).split(', ')]
    if np.isnan(a).any():
        raise SystemExit('Lücken beim Lesen der ASCII-Antwort')
    return a


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--ordner', default=os.path.expanduser('~/ZeroEarth/rohdaten/meereis/trace'))
    p.add_argument('--ohne-abruf', action='store_true')
    p.add_argument('--fehlt-grund', default='Server nicht erreichbar, Abruf ausstehend')
    args = p.parse_args()
    o = args.ordner
    os.makedirs(o, exist_ok=True)
    for js in ('djf', 'jja'):
        holen(URL.format(js=js, q='time,lat,lon'), os.path.join(o, f'achsen_{js}.ascii'))
        ax = achsen(open(os.path.join(o, f'achsen_{js}.ascii'), encoding='utf-8').read())
        assert len(ax['time']) == N
        teile = []
        for a in STUECKE:
            ganz = os.path.join(o, f'icefrac_{js}_{a:04d}.ascii')
            if args.ohne_abruf and not (os.path.exists(ganz) and os.path.getsize(ganz) > 1000):
                break                                   # nur zusammenhängend ab dem Anfang
            teile.append(stueck(o, js, a, min(a + 550, N - 1)))
        f = np.concatenate(teile)
        n = f.shape[0]
        assert f.shape[1:] == (48, 96) and (n == N or args.ohne_abruf)
        ax['time'] = ax['time'][:n]
        ziel = os.path.join(o, f'trace_icefrac_{js}.nc')
        d = Dataset(ziel, 'w', format='NETCDF4')
        d.title = f'TraCE-21ka b30.00_4kaDVTd.cam2.ncrcat.{js}.nc, nur ICEFRAC'
        d.source = 'NCAR GDEX d651050, doi:10.5065/CXB5-TV56, OPeNDAP ASCII; zusammengesetzt von zeroearth (trace_icefrac_holen.py)'
        d.license = 'CC BY 4.0'
        if n < N:
            d.fehlt_ab_index = n
            d.fehlt_grund = args.fehlt_grund
            d.fehlt_von_ka = float(-ax['time'][-1]) - 0.01
        for name, k in (('time', n), ('lat', 48), ('lon', 96)):
            d.createDimension(name, k)
            v = d.createVariable(name, 'f8', (name,)); v[:] = ax[name]
        d['time'].units = 'ka BP'
        d['lat'].units = 'degrees_north'; d['lon'].units = 'degrees_east'
        v = d.createVariable('ICEFRAC', 'f4', ('time', 'lat', 'lon'), zlib=True)
        v.units = 'fraction'; v.long_name = 'Fraction of sfc area covered by sea-ice'; v.cell_method = 'time: mean'
        v[:] = f
        d.close()
        print(js, f.shape, 'unvollständig' if n < N else 'vollständig', float(f.min()), float(f.max()), ax['time'][[0, -1]], os.path.getsize(ziel))


if __name__ == '__main__':
    main()
