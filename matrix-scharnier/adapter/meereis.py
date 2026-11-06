#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Meereis: GLOMAP (Rekonstruktion, LGM) und TraCE-21ka (Modell, 22 ka bis heute),
nebeneinander (Regel 13), je für Februar und August.

GLOMAP (Paul et al. 2021): fice_lgm, 12 Monate auf 1°; genommen werden nur
Februar und August, die Monate, für die die Quelle Grenzen digitalisiert hat
(JFM als Februar, JAS als August). Die Datei kodiert 1 = offen, 2 = Eis (statt
0–1 laut long_name); geprüft gegen die Beschreibung (Nordmeer im Sommer eisfrei).

TraCE-21ka (Liu et al. 2009): ICEFRAC (Bedeckungsgrad 0–1) im Atmosphärengitter
T31 (96 × 48, Gauß-Breiten), Jahreszeitenmittel DJF und JJA je Jahrzehnt. DJF
steht für Februar, JJA für August; die Abweichung nennt die Legende. Nichts wird
interpoliert: je Jahrzehnt ein Bild, Zellen wie in der Datei.

Ausgabe nach data/meereis.json und data/meereis/:
  glomap/februar.png, glomap/august.png   360 × 180, 0 offen, 255 Eis, 128 Land
  trace/djf.png, trace/jja.png            Atlas: je Jahrzehnt eine Kachel 96 × 48,
                                          Klasse = round(ICEFRAC · 200), 255 fehlt

  python3 meereis.py --glomap <glomap_v08_nsst_fice.nc> --trace-djf <…djf.nc> --trace-jja <…jja.nc> [--ziel ../../data]
"""
import argparse, datetime, json, os
import numpy as np
from PIL import Image
from netCDF4 import Dataset

R = 6371.0088
KACHELN_JE_ZEILE = 48


def band_flaeche(kanten_lat, n_lon):
    """Fläche je Zelle eines Gitters mit Breitenkanten (Nord nach Süd), in km²."""
    s = np.sin(np.radians(kanten_lat))
    return (R ** 2 * np.radians(360 / n_lon) * np.abs(s[:-1] - s[1:]))[:, None] * np.ones(n_lon)


def glomap(pfad, ziel):
    d = Dataset(pfad)
    lat = np.asarray(d.variables['latitude'][:], float)
    f = np.ma.filled(d.variables['fice_lgm'][:].astype(float), np.nan)
    if lat[0] < lat[-1]:
        f, lat = f[:, ::-1], lat[::-1]                       # Nord oben
    f = np.roll(f, 180, axis=2)                               # Länge −179,5 … 179,5
    kanten = np.concatenate([[90], (lat[:-1] + lat[1:]) / 2, [-90]])
    fl = band_flaeche(kanten, 360)
    os.makedirs(os.path.join(ziel, 'meereis', 'glomap'), exist_ok=True)
    aus = {}
    for name, m in (('februar', 1), ('august', 7)):
        a = f[m]
        werte = set(np.unique(a[~np.isnan(a)]).tolist())
        if not werte <= {1.0, 2.0}:
            raise SystemExit(f'GLOMAP {name}: unerwartete Werte {sorted(werte)[:5]}')
        k = np.where(np.isnan(a), 128, np.where(a == 2, 255, 0)).astype(np.uint8)
        datei = f'meereis/glomap/{name}.png'
        Image.fromarray(k).save(os.path.join(ziel, datei), 'PNG', optimize=True)
        eis = a == 2
        aus[name] = {'datei': datei, 'monat_quelle': m + 1,
                     'flaeche_nord_km2': round(float(fl[eis & (lat[:, None] > 0)].sum())),
                     'flaeche_sued_km2': round(float(fl[eis & (lat[:, None] < 0)].sum()))}
    return dict(
        name='GLOMAP (Paul et al. 2021)', arten=['rekonstruktion'], art_der_werte='ausdehnung',
        lizenz='CC BY 4.0, doi:10.1594/PANGAEA.923262; Artikel doi:10.5194/cp-17-805-2021',
        datei_quelle=os.path.basename(pfad), variable='fice_lgm',
        kodierung_quelle='1 = offen, 2 = Eis (long_name sagt 0–1; gelesen nach Lage geprüft)',
        zeitfenster_ka={'von': 23, 'bis': 19}, bezugssystem='ka_bp_1950',
        zeit_unschaerfe={'fehlt': True, 'grund': 'Eine Zeitscheibe (LGM, 23–19 ka), ohne Unschärfe der Grenze'},
        raum_unschaerfe={'fehlt': True, 'grund': 'Für die Lage der Eisgrenze nennt die Quelle keine Unschärfe; Eiszellen tragen −1,8 ± 2 °C'},
        aufloesung_grad=1.0, breite=360, hoehe=180, gitter='zellen',
        landmaske='GLAC-1D bei 21 ka (laut Artikel)',
        monate={'februar': 'JFM als Februar (Quelle)', 'august': 'JAS als August (Quelle)'},
        kette=['de Vernal et al. 2005, Kucera et al. 2005 (Dinozysten, Nordatlantik)', 'Xiao et al. 2015 (Barentssee)',
               'Méheust et al. 2018 (Nordpazifik, IP25; Frühjahr als Wintergrenze)',
               'Gersonde et al. 2005 (Diatomeen, Südozean)', 'Roche et al. 2012 (Südozean, Sommer)',
               'Grenzen aus veröffentlichten Karten digitalisiert und auf 1° gelegt (Paul et al. 2021)'],
        schritte=aus)


def trace(pfade, ziel):
    os.makedirs(os.path.join(ziel, 'meereis', 'trace'), exist_ok=True)
    jahreszeiten, gemein, rest = {}, None, None
    for js, pfad in pfade.items():
        d = Dataset(pfad)
        lat = np.asarray(d.variables['lat'][:], float)
        lon = np.asarray(d.variables['lon'][:], float)
        zeit = np.asarray(d.variables['time'][:], float)
        if 'fehlt_grund' in d.ncattrs():
            rest = {'fehlt': True, 'grund': d.fehlt_grund, 'von_ka': round(float(d.fehlt_von_ka), 2), 'bis_ka': -0.03}
        f = np.ma.filled(d.variables['ICEFRAC'][:].astype(float), np.nan)
        if f.ndim == 4: f = f[:, 0]
        if lat[0] < lat[-1]:
            f, lat = f[:, ::-1], lat[::-1]
        verschub = int(np.argmin(np.abs(lon - 180)))          # Spalte mit Länge 180 (= −180) nach vorn
        f = np.roll(f, -verschub, axis=2)
        dlon = 360 / len(lon)
        kanten = np.concatenate([[90], (lat[:-1] + lat[1:]) / 2, [-90]])
        fl = band_flaeche(kanten, len(lon))
        T, H, W = f.shape
        zeilen = -(-T // KACHELN_JE_ZEILE)
        atlas = np.full((zeilen * H, KACHELN_JE_ZEILE * W), 255, np.uint8)
        schritte = []
        for i in range(T):
            a = f[i]
            k = np.where(np.isnan(a), 255, np.clip(np.round(a * 200), 0, 200)).astype(np.uint8)
            r, c = divmod(i, KACHELN_JE_ZEILE)
            atlas[r * H:(r + 1) * H, c * W:(c + 1) * W] = k
            a0 = np.nan_to_num(a)
            schritte.append({'ka': round(-zeit[i], 3),
                             'flaeche_nord_km2': round(float((a0 * fl)[lat > 0].sum())),
                             'flaeche_sued_km2': round(float((a0 * fl)[lat < 0].sum()))})
        datei = f'meereis/trace/{js}.png'
        Image.fromarray(atlas).save(os.path.join(ziel, datei), 'PNG', optimize=True)
        jahreszeiten[js] = {'datei': datei, 'groesse_byte': os.path.getsize(os.path.join(ziel, datei)), 'schritte': schritte}
        g = dict(breiten_kanten=[round(x, 4) for x in kanten.tolist()], laenge_start=round(float(lon[verschub] - 360 - dlon / 2), 4),
                 dlon=dlon, breite=W, hoehe=H, anzahl=T, kacheln_je_zeile=KACHELN_JE_ZEILE)
        if gemein and gemein != g:
            raise SystemExit('DJF und JJA haben verschiedene Gitter')
        gemein = g
    ka_djf = [e['ka'] for e in jahreszeiten['djf']['schritte']]
    if ka_djf != [e['ka'] for e in jahreszeiten['jja']['schritte']]:
        raise SystemExit('DJF und JJA haben verschiedene Zeitachsen')
    return dict(
        name='TraCE-21ka (Liu et al. 2009), CCSM3', arten=['modell', 'berechnet'], art_der_werte='bedeckungsgrad',
        lizenz='CC BY 4.0, NCAR GDEX d651050, doi:10.5065/CXB5-TV56; Artikel Liu et al. 2009, Science 325, 310–314',
        dateien_quelle={js: 'b30.00_4kaDVTd.cam2.ncrcat.' + js + '.nc (nur ICEFRAC, über NCSS)' for js in pfade},
        variable='ICEFRAC (Fraction of sfc area covered by sea-ice), Atmosphärengitter',
        bezugssystem='ka_bp_1950', schritt_ka=0.01,
        zeit_unschaerfe={'fehlt': True, 'grund': 'Ein Modelllauf; das Jahrzehnt ist die Auflösung, keine Unschärfe'},
        raum_unschaerfe={'fehlt': True, 'grund': 'Modellwerte ohne Unschärfe; das Gitter T31 (rund 3,75°) ist die Auflösung'},
        aufloesung_grad=3.75, gitter='gauss_t31', klassen={'von': 0, 'bis': 200, 'je_klasse': 0.005, 'fehlt': 255},
        landmaske='ICE-5G, mit dem Meeresspiegel veränderlich (laut NCAR GDEX)',
        monate={'februar': 'DJF (Dezember bis Februar) steht für Februar', 'august': 'JJA (Juni bis August) steht für August'},
        **gemein, ka_bp_von=max(ka_djf), ka_bp_bis=min(ka_djf), anzahl_quelle=2204,
        rest=rest or None,
        jahreszeiten=jahreszeiten)


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--glomap', required=True)
    a.add_argument('--trace-djf', required=True)
    a.add_argument('--trace-jja', required=True)
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    g = glomap(a.glomap, a.ziel)
    t = trace({'djf': a.trace_djf, 'jja': a.trace_jja}, a.ziel)
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/meereis.py',
        jahreszeit={'wahl': ['februar', 'august'],
                    'begruendung': 'Ein Bild ist ein Moment im Kalender: Februar = Nordwinter und Südsommer, August umgekehrt'},
        schwelle_rand={'wert': 0.15, 'setzung': 'übliche Schwelle für „Meereis vorhanden“; nur für den Rand des Modells'},
        fehlt={'margo': {'fehlt': True, 'grund': 'MARGO 2009 enthält kein Meereis, nur Oberflächentemperaturen; das Meereis seines Umfelds (Gersonde 2005, de Vernal 2005) steckt in GLOMAP'},
               'vor_22ka': {'fehlt': True, 'grund': 'Vor 22 ka keine geprüfte Meereis-Quelle: TraCE beginnt bei 22 ka, PaleoMIST führt kein Meereis'},
               'jahresmittel_glomap': {'fehlt': True, 'grund': 'GLOMAP digitalisiert nur Winter- und Sommergrenze'}},
        quellen={'glomap': g, 'trace': t})
    with open(os.path.join(a.ziel, 'meereis.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
    print('GLOMAP', {k: (v['flaeche_nord_km2'], v['flaeche_sued_km2']) for k, v in g['schritte'].items()})
    for js, v in t['jahreszeiten'].items():
        s = v['schritte']
        print('TraCE', js, len(s), s[0]['ka'], s[-1]['ka'], v['groesse_byte'], 'Fläche N/S bei Beginn und Ende:',
              (s[0]['flaeche_nord_km2'], s[0]['flaeche_sued_km2']), (s[-1]['flaeche_nord_km2'], s[-1]['flaeche_sued_km2']))
    print('Gitter', {k: t[k] for k in ('laenge_start', 'dlon', 'breite', 'hoehe', 'anzahl')})


if __name__ == '__main__':
    main()
