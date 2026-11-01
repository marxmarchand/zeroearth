#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Glottolog-Adapter — Sprachen, Sprachfamilie, Gefährdung (AES) mit Quelle.

Glottolog 5.3 als CLDF (github.com/glottolog/glottolog-cldf, Release v5.3,
CC BY 4.0). Übernommen wird nur, was Glottolog selbst angibt: Stufe und
Quelle des Status, keine Kommentare der Quellen (Weitergabe des
Ethnologue-Wortlauts ungeklärt). Von ElCat wird nur die eigene
Sicherheitsstufe übernommen ("20 percent certain" …), als Text.

Auswahl (Setzungen, stehen im Manifest): Level language; Kategorien
gesprochene L1-Sprache, Gebärdensprache, Pidgin, Mischsprache.
Ausgeschlossen: Bookkeeping, Unclassifiable, Unattested, Artificial
Language, Speech Register. Koordinaten auf 0,01° gerundet.

  python3 -I glottolog.py --quelle <ordner> [--holen] [--ziel ../../data/glottolog.json]
"""
import argparse, collections, csv, datetime, json, os, re, urllib.request

VERSION = 'v5.3'
BASIS = f'https://raw.githubusercontent.com/glottolog/glottolog-cldf/{VERSION}/cldf'
DATEIEN = ['languages.csv', 'values.csv']
KATEGORIEN = {'Spoken_L1_Language', 'Sign_Language', 'Pidgin', 'Mixed_Language'}
# Statusquellen: Glottolog-Bibliografie-ID → Schlüssel (aufgelöst über glottolog.org/resource/reference/id/<id>.bib)
QUELLEN = {
    '701778': dict(schluessel='ethnologue2025', name='Ethnologue (Eberhard, Simons, Fennig; SIL International)', jahr=2025),
    '570887': dict(schluessel='ethnologue2020', name='Ethnologue (Eberhard, Simons, Fennig; SIL International)', jahr=2020),
    '571261': dict(schluessel='ethnologue2018', name='Ethnologue (Simons, Fennig; SIL International)', jahr=2018),
    '569683': dict(schluessel='elcat2022', name='Catalogue of Endangered Languages, ElCat (Campbell u. a.)', jahr=2022),
    '550905': dict(schluessel='unesco2010', name="UNESCO, Atlas of the world's languages in danger (Moseley)", jahr=2010),
}
ELCAT_STUFE = re.compile(r'\((\d+) percent certain')


def holen(ordner):
    os.makedirs(ordner, exist_ok=True)
    for f in DATEIEN:
        urllib.request.urlretrieve(f'{BASIS}/{f}', os.path.join(ordner, f))
        print('geholt:', f)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--quelle', required=True, help='Ordner mit languages.csv und values.csv (außerhalb des Repos)')
    p.add_argument('--holen', action='store_true', help=f'CLDF-Dateien von glottolog-cldf {VERSION} holen')
    p.add_argument('--ziel', default='../../data/glottolog.json')
    a = p.parse_args()
    if a.holen:
        holen(a.quelle)

    L = {r['ID']: r for r in csv.DictReader(open(os.path.join(a.quelle, 'languages.csv'), encoding='utf-8'))}
    V = collections.defaultdict(dict)
    for r in csv.DictReader(open(os.path.join(a.quelle, 'values.csv'), encoding='utf-8')):
        if r['Parameter_ID'] in ('aes', 'category'):
            V[r['Language_ID']][r['Parameter_ID']] = r

    sprachen_alle = [k for k, r in L.items() if r['Level'] == 'language']
    ausgeschlossen = collections.Counter(V[k]['category']['Value'] for k in sprachen_alle
                                         if V[k]['category']['Value'] not in KATEGORIEN)
    sprachen, unbekannte_quellen = [], collections.Counter()
    for k in sprachen_alle:
        kat = V[k]['category']['Value']
        if kat not in KATEGORIEN:
            continue
        r, aes = L[k], V[k].get('aes')
        satz = dict(g=k, n=r['Name'], k=kat, f=r['Family_ID'] or None,
                    p=[round(float(r['Latitude']), 2), round(float(r['Longitude']), 2)] if r['Latitude'] else None,
                    a=None, q=None, c=None)
        if aes:
            satz['a'] = int(aes['Value'])
            src = aes['Source']
            if src in QUELLEN:
                satz['q'] = QUELLEN[src]['schluessel']
            elif src:
                unbekannte_quellen[src] += 1
                satz['q'] = f'bib:{src}'
            # nur die Sicherheitsstufe von ElCat, nicht der Kommentar
            m = ELCAT_STUFE.search(aes['Comment'] or '') if src == '569683' else None
            if m:
                satz['c'] = f'{m.group(1)} percent certain'
        sprachen.append(satz)

    familien = sorted({s['f'] for s in sprachen if s['f']})
    datei = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/glottolog.py',
        woher=dict(
            art='kuratiert',
            quelle=f'Glottolog 5.3 (CLDF, glottolog-cldf {VERSION})',
            zugang=BASIS,
            lizenz='CC BY 4.0',
            veroeffentlicht='2026-03-02',
            zitierung='Hammarström, Forkel, Haspelmath & Bank: Glottolog 5.3. Leipzig: MPI EVA '
                      '(cldf-metadata.json nennt noch 5.2.1)'),
        quellen={v['schluessel']: dict(name=v['name'], jahr=v['jahr'], bib=k) for k, v in QUELLEN.items()},
        aes_stufen={1: 'not endangered', 2: 'threatened', 3: 'shifting', 4: 'moribund',
                    5: 'nearly extinct', 6: 'extinct'},
        auswahl=dict(kategorien=sorted(KATEGORIEN), ausgeschlossen=dict(ausgeschlossen),
                     level='language', sprachen_vor_auswahl=len(sprachen_alle)),
        familien={f: L[f]['Name'] for f in familien if f in L},
        sprachen=sprachen)
    with open(a.ziel, 'w', encoding='utf-8') as f:
        json.dump(datei, f, ensure_ascii=False, separators=(',', ':'))
    mit = sum(1 for s in sprachen if s['a'] is not None)
    print(f"{len(sprachen)} Sprachen ({mit} mit Status, davon {sum(1 for s in sprachen if s['a'] and not s['q'])} "
          f"ohne Quelle), {len(familien)} Familien; ausgeschlossen: {dict(ausgeschlossen)}")
    if unbekannte_quellen:
        print('Statusquellen ohne Schlüssel (als bib:<id> übernommen):', dict(unbekannte_quellen))
    print('geschrieben:', a.ziel, f'({os.path.getsize(a.ziel) / 1e6:.2f} MB)')


if __name__ == '__main__':
    main()
