#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Eurostat: Materialflusskonten (env_ac_mfa) und Energiebilanzen (nrg_bal_c).

Abgerufen über die Eurostat-API (JSON-stat, ohne Anmeldung; CC BY 4.0 nach
Beschluss 2011/833/EU). Jede Quelle bleibt einzeln, nichts wird über Länder,
Materialien oder Energieträger zusammengefasst. Auswahl (Regel 7):

- Materialflüsse: Hauptgruppen MF1–MF4 (Biomasse, Erze, nichtmetallische
  Mineralien, fossile Energieträger), Indikatoren Entnahme, Import, Export,
  Inlandsverbrauch, in 1000 t. MF5/MF6 (Produkte, Abfälle) kommen nur im
  Handel vor und sind ausgelassen; die Summe „TOTAL“ der Quelle ebenfalls,
  weil sie Stapel mischt (Biomasse 1.2, übrige 1.1).
- Energie: Energieträger einzeln, Bilanzposten Primärproduktion bis
  Bruttoinlandsverbrauch, in TJ.

Kennzeichen (Flags) der Quelle werden je Wert mitgeführt; ihre Bedeutung steht
in der Datei, so wie Eurostat sie liefert.

  python3 eurostat.py [--ziel ../../data] [--roh ~/ZeroEarth/rohdaten/eurostat]
"""
import argparse, datetime, json, os, urllib.parse, urllib.request

API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
MFA = dict(datensatz='env_ac_mfa', einheit='THS_T', einheit_text='1000 t',
           indikatoren=['DE', 'IMP', 'EXP', 'DMC'],
           gruppen={'MF1': '1.2', 'MF2': '1.1', 'MF3': '1.1', 'MF4': '1.1'})
ENERGIE = dict(datensatz='nrg_bal_c', einheit='TJ', einheit_text='TJ',
               posten=['PPRD', 'RCV_RCY', 'IMP', 'EXP', 'STK_CHG', 'GAE', 'INTMARB', 'GIC'],
               traeger={'C0000X0350-0370': '1.1', 'P1000': '1.1', 'S2000': '1.1', 'G3000': '1.1', 'O4000XBIO': '1.1',
                        'N900H': '1.1', 'RA100': '1.1', 'RA300': '1.1', 'RA410': '0.3', 'RA420': '0.3',
                        'R5110-5150_W6000RI': '1.2'})
STAPEL_GRUND = {'0.3': 'Sonnenstrahlung: Zufluss aus der 0. Natur', '1.1': 'aus dem Erdsystem', '1.2': 'aus der Biomasse'}


def abrufen(datensatz, filter_, roh):
    q = [('format', 'JSON'), ('lang', 'DE')] + [(k, v) for k, vs in filter_.items() for v in vs]
    url = API + datensatz + '?' + urllib.parse.urlencode(q)
    anfrage = urllib.request.Request(url, headers={'User-Agent': 'zeroearth-adapter (matrix-scharnier/adapter/eurostat.py)'})
    with urllib.request.urlopen(anfrage, timeout=600) as r:
        text = r.read()
    os.makedirs(roh, exist_ok=True)
    with open(os.path.join(roh, f'{datensatz}.json'), 'wb') as f:
        f.write(text)
    return json.loads(text), url


def zeilen(d):
    """JSON-stat entpacken: je Wert ein dict der Dimensionscodes, Wert und Kennzeichen."""
    ids, groessen = d['id'], d['size']
    codes = [sorted(d['dimension'][k]['category']['index'], key=d['dimension'][k]['category']['index'].get) for k in ids]
    werte, flags = d.get('value', {}), d.get('status', {})
    for schluessel in set(werte) | set(flags):
        i, pos = int(schluessel), {}
        for k, n, c in zip(reversed(ids), reversed(groessen), reversed(codes)):
            pos[k] = c[i % n]; i //= n
        yield pos, werte.get(schluessel), flags.get(schluessel)


def kennzeichen(d):
    return d.get('extension', {}).get('status', {}).get('label', {})


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--ziel', default='../../data')
    a.add_argument('--roh', default=os.path.expanduser('~/ZeroEarth/rohdaten/eurostat'))
    a = a.parse_args()
    os.makedirs(os.path.join(a.ziel, 'stofffluss'), exist_ok=True)
    jetzt = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')

    d, url = abrufen(MFA['datensatz'], dict(freq=['A'], unit=[MFA['einheit']], indic_env=MFA['indikatoren'], material=list(MFA['gruppen'])), a.roh)
    laender = d['dimension']['geo']['category']['label']
    reihen = {}
    for pos, wert, flag in zeilen(d):
        k = (pos['geo'], pos['material'])
        reihen.setdefault(k, {}).setdefault(pos['indic_env'], {})[pos['time']] = [wert, flag]
    mfa = dict(
        erzeugt=jetzt, hinweis='erzeugt von matrix-scharnier/adapter/eurostat.py',
        quelle=dict(name='Eurostat, Material flow accounts (env_ac_mfa)', url=url, aktualisiert=d.get('updated'),
                    lizenz='CC BY 4.0 (Beschluss 2011/833/EU), Quelle Eurostat; Drittdaten ausgenommen'),
        einheit=MFA['einheit_text'], kennzeichen=kennzeichen(d),
        indikatoren={k: d['dimension']['indic_env']['category']['label'][k] for k in MFA['indikatoren']},
        gruppen={k: dict(name=d['dimension']['material']['category']['label'][k], stapel=s, stapel_grund=STAPEL_GRUND[s]) for k, s in MFA['gruppen'].items()},
        auswahl='MF1–MF4 einzeln; MF5/MF6 (nur Handel) und TOTAL (mischt Stapel) ausgelassen',
        identitaet='DMC = DE + IMP − EXP (Definition der Materialflusskonten)',
        laender={g: laender[g] for g in sorted({g for g, _ in reihen})},
        reihen=[dict(geo=g, gruppe=m, werte=w) for (g, m), w in sorted(reihen.items())])
    with open(os.path.join(a.ziel, 'stofffluss', 'eurostat_mfa.json'), 'w', encoding='utf-8') as f:
        json.dump(mfa, f, ensure_ascii=False, separators=(',', ':'))

    d, url = abrufen(ENERGIE['datensatz'], dict(freq=['A'], unit=[ENERGIE['einheit']], nrg_bal=ENERGIE['posten'], siec=list(ENERGIE['traeger'])), a.roh)
    laender = d['dimension']['geo']['category']['label']
    reihen = {}
    for pos, wert, flag in zeilen(d):
        k = (pos['geo'], pos['siec'])
        reihen.setdefault(k, {}).setdefault(pos['nrg_bal'], {})[pos['time']] = [wert, flag]
    energie = dict(
        erzeugt=jetzt, hinweis='erzeugt von matrix-scharnier/adapter/eurostat.py',
        quelle=dict(name='Eurostat, Complete energy balances (nrg_bal_c)', url=url, aktualisiert=d.get('updated'),
                    lizenz='CC BY 4.0 (Beschluss 2011/833/EU), Quelle Eurostat; Drittdaten ausgenommen'),
        einheit=ENERGIE['einheit_text'], kennzeichen=kennzeichen(d),
        posten={k: d['dimension']['nrg_bal']['category']['label'][k] for k in ENERGIE['posten']},
        traeger={k: dict(name=d['dimension']['siec']['category']['label'][k], stapel=s, stapel_grund=STAPEL_GRUND[s]) for k, s in ENERGIE['traeger'].items()},
        auswahl='Energieträger einzeln (kein TOTAL, mischt Stapel); Bilanzposten von der Primärproduktion bis zum Bruttoinlandsverbrauch',
        identitaet='GAE = PPRD + RCV_RCY + IMP − EXP + STK_CHG; GIC = GAE − INTMARB (Definition der Energiebilanz)',
        laender={g: laender[g] for g in sorted({g for g, _ in reihen})},
        reihen=[dict(geo=g, traeger=t, werte=w) for (g, t), w in sorted(reihen.items())])
    with open(os.path.join(a.ziel, 'stofffluss', 'eurostat_energie.json'), 'w', encoding='utf-8') as f:
        json.dump(energie, f, ensure_ascii=False, separators=(',', ':'))
    for n, x in (('MFA', mfa), ('Energie', energie)):
        jahre = sorted({j for r in x['reihen'] for w in r['werte'].values() for j in w})
        print(n, len(x['laender']), 'Länder,', len(x['reihen']), 'Reihen,', jahre[0], '–', jahre[-1], '| Kennzeichen', x['kennzeichen'])


if __name__ == '__main__':
    main()
