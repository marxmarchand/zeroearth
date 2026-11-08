#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ILOSTAT: Arbeitszeit über die SDMX-Schnittstelle (sdmx.ilo.org), ohne Anmeldung.

Zwei Datenflüsse, getrennt geführt (Regel 13: verschiedene Herkunft):
- HOW_TEMP: mittlere tatsächlich gearbeitete Wochenstunden je Erwerbstätigem,
  aus Arbeitskräfteerhebungen; insgesamt und für Landwirtschaft, Industrie,
  Dienstleistungen. Eine Kennzahl je Person, kein Fluss.
- HOW_2TOT: gearbeitete Stunden insgesamt je Woche (Einheit 1000 h, laut
  UNIT_MULT = 3). Quelle „ILO - Modelled Estimates“, also Modell.

Herkunft je Wert aus der Spalte SOURCE: „Modelled Estimates“ → modell, sonst
Erhebung → beobachtung (+ kuratiert). OBS_STATUS je Wert mit Bedeutung.
Es wird nichts hochgerechnet (keine Wochen je Jahr angenommen; Regel 12).

Lizenz: ILO-Datenbanken und Datensätze ab 3. Mai 2023 unter CC BY 4.0;
früher erzeugte Bestände laut ILO nicht automatisch (ilo.org, Rights and
permissions).

  python3 ilostat.py [--ziel ../../data] [--roh ~/ZeroEarth/rohdaten/ilostat]
"""
import argparse, csv, datetime, io, json, os, re, urllib.request

SDMX = 'https://sdmx.ilo.org/rest/'
UA = {'User-Agent': 'zeroearth-adapter (matrix-scharnier/adapter/ilostat.py)'}
FLUESSE = {
    'how_temp': dict(df='DF_HOW_TEMP_SEX_ECO_NB', schluessel='.A..SEX_T.ECO_SECTOR_TOTAL+ECO_SECTOR_AGR+ECO_SECTOR_IND+ECO_SECTOR_SER',
                     name='Mittlere tatsächlich gearbeitete Wochenstunden je Erwerbstätigem', art='Kennzahl je Person (h je Woche), kein Fluss'),
    'how_2tot': dict(df='DF_HOW_2TOT_SEX_NB', schluessel='.A..SEX_T',
                     name='Gearbeitete Stunden insgesamt je Woche', art='Fluss (h je Woche)'),
}


def holen(pfad, accept, roh, datei):
    r = urllib.request.urlopen(urllib.request.Request(SDMX + pfad, headers=dict(UA, Accept=accept)), timeout=900)
    text = r.read()
    os.makedirs(roh, exist_ok=True)
    with open(os.path.join(roh, datei), 'wb') as f:
        f.write(text)
    return text.decode('utf-8')


def status_codes(roh):
    t = holen('codelist/ILO/CL_OBS_STATUS', 'application/xml', roh, 'CL_OBS_STATUS.xml')
    return {m.group(1): re.search(r'<common:Name xml:lang="en">([^<]+)</common:Name>', m.group(2)).group(1)
            for m in re.finditer(r'<structure:Code id="([^"]+)">(.*?)</structure:Code>', t, re.S)}


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--ziel', default='../../data')
    a.add_argument('--roh', default=os.path.expanduser('~/ZeroEarth/rohdaten/ilostat'))
    a = a.parse_args()
    os.makedirs(os.path.join(a.ziel, 'stofffluss'), exist_ok=True)
    global ABRUF
    ABRUF = datetime.date.today()
    status = status_codes(a.roh)
    teile, quellen, laender = {}, {}, set()
    for k, cfg in FLUESSE.items():
        text = holen(f'data/ILO,{cfg["df"]}/{cfg["schluessel"]}', 'application/vnd.sdmx.data+csv', a.roh, f'{cfg["df"]}.csv')
        reihen, einheiten = {}, set()
        for r in csv.DictReader(io.StringIO(text)):
            if not r['OBS_VALUE'] or r['REF_AREA'].startswith('X'):      # X..: ILO-Regionen, keine Länder
                continue
            mult = int(r['UNIT_MULT'] or 0)
            einheiten.add((r['UNIT_MEASURE'], mult))
            modell = 'Modelled Estimates' in r['SOURCE']
            quellen[r['SOURCE']] = 'modell' if modell else 'erhebung'
            laender.add(r['REF_AREA'])
            sektor = r.get('ECO') or 'GESAMT'
            reihen.setdefault((r['REF_AREA'], sektor), {})[r['TIME_PERIOD']] = [float(r['OBS_VALUE']), r['OBS_STATUS'] or None, r['SOURCE']]
        teile[k] = dict(datenfluss=cfg['df'], name=cfg['name'], art=cfg['art'],
                        einheit=[dict(einheit=e, faktor=10 ** m) for e, m in sorted(einheiten)],
                        reihen=[dict(land=l, sektor=s, werte=w) for (l, s), w in sorted(reihen.items())])
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'), abruf=ABRUF.isoformat(),
        hinweis='erzeugt von matrix-scharnier/adapter/ilostat.py',
        quelle=dict(name='ILOSTAT (International Labour Organization), SDMX', url=SDMX,
                    lizenz='CC BY 4.0 für ILO-Datensätze ab 3. Mai 2023; früher erzeugte Bestände nicht automatisch (ilo.org, Rights and permissions)',
                    zitat='International Labour Organization. ILOSTAT database. Abgerufen 2026-11-08'),
        status=status, quellen_der_werte=quellen,
        auswahl='Geschlecht insgesamt; Wirtschaftszweige insgesamt, Landwirtschaft, Industrie, Dienstleistungen (HOW_TEMP); nur Jahreswerte; ILO-Regionen (Codes X..) ausgelassen',
        erwartung_ab=ABRUF.year,
        erwartung_grund='Modellschätzungen der ILO reichen über das Abrufjahr hinaus; Werte ab dem Abrufjahr sind Erwartung, Träger ILO (Regel 4)',
        nicht_gerechnet='Keine Hochrechnung auf Stunden je Jahr: dafür bräuchte es Wochen je Jahr, die die Quelle nicht nennt (Regel 12)',
        laender=sorted(laender), teile=teile)
    with open(os.path.join(a.ziel, 'stofffluss', 'ilostat_arbeitszeit.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, separators=(',', ':'))
    for k, t in teile.items():
        jahre = sorted({j for r in t['reihen'] for j in r['werte']})
        print(k, len(t['reihen']), 'Reihen,', len({r['land'] for r in t['reihen']}), 'Länder,', jahre[0], '–', jahre[-1], '| Einheit', t['einheit'])
    print('Quellen:', {v: sum(1 for x in quellen.values() if x == v) for v in set(quellen.values())}, '|', os.path.getsize(os.path.join(a.ziel, 'stofffluss', 'ilostat_arbeitszeit.json')) // 1000, 'KB')


if __name__ == '__main__':
    main()
