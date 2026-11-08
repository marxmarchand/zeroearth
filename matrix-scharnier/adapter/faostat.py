#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""FAOSTAT: Produktion (QCL) und Landnutzung (RL) aus dem Massendownload.

Das FAOSTAT-API verlangt eine Anmeldung, der Massendownload nicht
(bulks-faostat.fao.org). Lizenz CC BY 4.0 mit den FAO-Datenbankbedingungen
(keine Werbung für Unternehmen, keine Billigung durch die FAO behaupten).

Auswahl (Regel 7), nichts wird von zeroearth zusammengefasst:
- Produktion (Element 5510, t): die Erzeugnisgruppen, die FAO selbst bildet
  (Codes 17xx), je Land und Jahr.
- Landnutzung (Element 5110, 1000 ha): Landfläche, Agrarfläche, Ackerland,
  Dauergrünland, Wald.
- Länder: alle Einzelgebiete; FAO-Regionen (Code ≥ 5000) und „China“ (351,
  Summe aus 41, 96, 128, 214) sind ausgelassen, damit nichts doppelt steht.

Kennzeichen je Wert wie in der Quelle (A amtlich, E geschätzt, I imputiert,
X externe Organisation; M/L fehlend).

  python3 faostat.py [--roh ~/ZeroEarth/rohdaten/faostat] [--ziel ../../data]
"""
import argparse, csv, datetime, io, json, os, zipfile

QCL = dict(datei='Production_Crops_Livestock_E_All_Data_(Normalized).zip', element='5510',
           gruppen=['1717', '1720', '1726', '1730', '1723', '1735', '1738', '1753', '1729', '1765', '1780', '1783'])
RL = dict(datei='Inputs_LandUse_E_All_Data_(Normalized).zip', element='5110',
          posten=['6601', '6610', '6620', '6655', '6646'])
AUSGELASSEN = {'351': 'China (Summe aus Festland, Hongkong, Macau, Taiwan)'}


def lesen(pfad, element, items):
    z = zipfile.ZipFile(pfad)
    name = [n for n in z.namelist() if n.endswith('All_Data_(Normalized).csv')][0]
    flags = {r['Flag']: r[' Description'].strip() for r in csv.DictReader(io.TextIOWrapper(z.open([n for n in z.namelist() if n.endswith('_Flags.csv')][0]), encoding='utf-8'))}
    reihen, laender, namen, einheit = {}, {}, {}, set()
    with z.open(name) as f:
        for r in csv.DictReader(io.TextIOWrapper(f, encoding='latin-1')):
            if r['Element Code'] != element or r['Item Code'] not in items:
                continue
            a = r['Area Code']
            if int(a) >= 5000 or a in AUSGELASSEN:
                continue
            laender[a] = r['Area']; namen[r['Item Code']] = r['Item']; einheit.add(r['Unit'])
            wert = float(r['Value']) if r['Value'] not in ('', None) else None
            reihen.setdefault((a, r['Item Code']), {})[r['Year']] = [wert, r['Flag'] or None]
    return reihen, laender, namen, einheit, flags, name


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--roh', default=os.path.expanduser('~/ZeroEarth/rohdaten/faostat'))
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    os.makedirs(os.path.join(a.ziel, 'stofffluss'), exist_ok=True)
    stand = {d['DatasetCode']: d['DateUpdate'][:10] for d in json.load(open(os.path.join(a.roh, 'datasets_E.json'), encoding='utf-8'))['Datasets']['Dataset']}
    jetzt = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
    lizenz = 'CC BY 4.0 mit FAO-Datenbankbedingungen (fao.org/contact-us/terms/db-terms-of-use)'
    for teil, cfg, code, ziel, schluessel, bedeutung in (
            ('produktion', QCL, 'QCL', 'faostat_produktion.json', 'gruppe', 'Fluss je Jahr'),
            ('landnutzung', RL, 'RL', 'faostat_landnutzung.json', 'posten', 'Bestand (Fläche) je Jahr')):
        reihen, laender, namen, einheit, flags, csvname = lesen(os.path.join(a.roh, cfg['datei']), cfg['element'], set(cfg.get('gruppen', cfg.get('posten'))))
        aus = dict(
            erzeugt=jetzt, hinweis='erzeugt von matrix-scharnier/adapter/faostat.py',
            quelle=dict(name=f'FAOSTAT {code}', datei=csvname, aktualisiert=stand.get(code), lizenz=lizenz,
                        zitat=f'FAO. FAOSTAT {code}. Abgerufen 2026-11-08. Licence: CC-BY-4.0'),
            element=cfg['element'], einheit=sorted(einheit), bedeutung=bedeutung, kennzeichen=flags,
            auswahl=f'{len(namen)} {schluessel} (siehe Liste); Regionen (Code ≥ 5000) und ' + ', '.join(f'{k} {v}' for k, v in AUSGELASSEN.items()) + ' ausgelassen',
            **{schluessel + ('n' if schluessel == 'gruppe' else ''): namen},
            fehlend={c: dict(fehlt=True, grund=f'Code steht in der Codeliste von {code}, die Datei enthält dafür keine Werte (Element {cfg["element"]})')
                     for c in cfg.get('gruppen', cfg.get('posten')) if c not in namen},
            laender=dict(sorted(laender.items(), key=lambda x: int(x[0]))),
            reihen=[{'land': l, schluessel: i, 'werte': w} for (l, i), w in sorted(reihen.items(), key=lambda x: (int(x[0][0]), x[0][1]))])
        with open(os.path.join(a.ziel, 'stofffluss', ziel), 'w', encoding='utf-8') as f:
            json.dump(aus, f, ensure_ascii=False, separators=(',', ':'))
        jahre = sorted({j for w in reihen.values() for j in w})
        zaehl = {}
        for w in reihen.values():
            for v, fl in w.values():
                zaehl[fl] = zaehl.get(fl, 0) + 1
        print(teil, len(laender), 'Länder,', len(namen), schluessel, ',', len(reihen), 'Reihen,', jahre[0], '–', jahre[-1], '| Einheit', einheit, '| Kennzeichen', zaehl,
              '|', os.path.getsize(os.path.join(a.ziel, 'stofffluss', ziel)) // 1000, 'KB')


if __name__ == '__main__':
    main()
