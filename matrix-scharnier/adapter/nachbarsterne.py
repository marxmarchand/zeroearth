#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Nachbarsterne (0.2): Sterne aus Gaia DR3, gemeldete Planeten mit Status.

Bisher ein Stern: 40 Eridani A (HD 26965), erster Eintrag für das Rocky-Gerüst.
Gaia DR3 per TAP (gea.esac.esa.int), eine Zeile je Stern; Lizenz CC BY-NC 3.0 IGO
(nur nicht-kommerziell; Entscheidung von Max, 2026-11-06: wird genutzt).
Der Abstand in Lichtjahren wird erst in der Anzeige aus der Parallaxe gerechnet.

Gemeldete Planeten werden nicht entschieden: Jede Deutung steht mit Quelle
nebeneinander (Regel 13), hier für 40 Eri b „Planet“ gegen „Sternaktivität“.

  python3 nachbarsterne.py [--ziel ../../data]
"""
import argparse, csv, datetime, io, json, os, urllib.parse, urllib.request

TAP = 'https://gea.esac.esa.int/tap-server/tap/sync'
STERNE = [
    dict(id='40_eridani_a', name='40 Eridani A', andere_namen=['HD 26965', 'Keid', 'omicron² Eridani'],
         gaia_source_id=3195919528989223040, spektraltyp=dict(fehlt=True, grund='Nicht geprüft: Gaia DR3 führt keinen Spektraltyp, SIMBAD war am 2026-11-06 nicht erreichbar'),
         begleiter='40 Eridani B (Weißer Zwerg) und C (Roter Zwerg) im selben System, Gaia DR3 3195919254111315712 und 3195919254111314816'),
]
PLANETEN = [
    dict(id='40_eridani_b', name='40 Eri b (HD 26965 b)', stern='40_eridani_a', status='umstritten',
         deutungen=[
             dict(ideal='planet', name='Planet (Radialgeschwindigkeit)', arten=['beobachtung', 'rekonstruktion'],
                  quelle='Ma et al. 2018, MNRAS 480, 2411–2422 (Dharma Planet Survey); unabhängig dasselbe Signal bei Díaz et al. 2018',
                  wert=dict(periode_d=42.38, masse_min_erdmassen=8.47),
                  hinweis='Die Autoren schlossen Sternaktivität mit Photometrie und Linienbisektoren aus'),
             dict(ideal='aktivitaet', name='Sternaktivität statt Planet', arten=['beobachtung', 'rekonstruktion'],
                  quelle='Burrows et al. 2024, AJ 167, 243 („The Death of Vulcan“, NEID)',
                  wert=dict(deutung='Signal aus Sternflecken und unterdrückter Konvektionsblauverschiebung'),
                  hinweis='Zeitverzug zwischen Aktivitätsindikatoren und Radialgeschwindigkeit; die Methoden einzeln schließen einen Planeten nicht aus, zusammen sprechen sie für Aktivität'),
         ]),
]


def gaia(source_id):
    q = ('SELECT source_id, ra, dec, parallax, parallax_error, phot_g_mean_mag, pmra, pmdec, radial_velocity, radial_velocity_error '
         f'FROM gaiadr3.gaia_source WHERE source_id = {source_id}')
    daten = urllib.parse.urlencode(dict(REQUEST='doQuery', LANG='ADQL', FORMAT='csv', QUERY=q)).encode()
    anfrage = urllib.request.Request(TAP, daten, headers={'User-Agent': 'zeroearth-adapter'})
    with urllib.request.urlopen(anfrage, timeout=120) as r:
        zeilen = list(csv.DictReader(io.StringIO(r.read().decode())))
    if len(zeilen) != 1:
        raise SystemExit(f'Gaia: {len(zeilen)} Zeilen für {source_id}')
    z = zeilen[0]
    f = lambda k: float(z[k]) if z.get(k) not in (None, '') else None
    return dict(ra_grad=f('ra'), dec_grad=f('dec'), parallaxe_mas=f('parallax'), parallaxe_unschaerfe_mas=f('parallax_error'),
                g_mag=f('phot_g_mean_mag'), pmra_mas_a=f('pmra'), pmdec_mas_a=f('pmdec'),
                rv_km_s=f('radial_velocity'), rv_unschaerfe_km_s=f('radial_velocity_error'))


# Ergebnis der TAP-Abfrage vom 2026-11-06 (Kegel um 40 Eri, Parallaxe > 150 mas), unverändert
# übernommen; gilt, wenn das Archiv nicht antwortet. Radialgeschwindigkeit ohne Unschärfe abgefragt.
GAIA_STAND = {3195919528989223040: dict(ra_grad=63.80795300602079, dec_grad=-7.6680778150199815, parallaxe_mas=199.6080124181338,
                                        parallaxe_unschaerfe_mas=0.12083028, g_mag=4.179894, pmra_mas_a=-2240.0849838923477,
                                        pmdec_mas_a=-3421.8086201704023, rv_km_s=-42.46972, rv_unschaerfe_km_s=None)}


def gaia_oder_stand(source_id):
    try:
        return gaia(source_id), 'TAP-Abfrage beim Erzeugen'
    except Exception as e:                                       # Archiv nicht erreichbar: Stand vom 2026-11-06
        print('Gaia nicht erreichbar:', e, '-> Stand vom 2026-11-06')
        return GAIA_STAND[source_id], 'TAP-Abfrage vom 2026-11-06 (Archiv beim Erzeugen nicht erreichbar)'


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--ziel', default='../../data')
    a = a.parse_args()
    sterne = []
    for s in STERNE:
        werte, abruf = gaia_oder_stand(s['gaia_source_id'])
        sterne.append(dict(s, gaia=werte, abruf=abruf, arten=['beobachtung'],
                           quelle='Gaia DR3 (ESA/Gaia/DPAC), gaiadr3.gaia_source', epoche='J2016.0'))
    aus = dict(
        erzeugt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        hinweis='erzeugt von matrix-scharnier/adapter/nachbarsterne.py; Zoom zu den Nachbarsternen (0.2), siehe kern/BERICHT-planeten.md',
        quellen=[dict(name='Gaia DR3 (ESA/Gaia/DPAC)', lizenz='CC BY-NC 3.0 IGO (nur nicht-kommerziell; geprüft 2026-11-06)',
                      entscheidung='wird genutzt; zeroearth bleibt nicht-kommerziell (Max, 2026-11-06)',
                      luecke='sehr helle Sterne fehlen oder sind unsicher (etwa Sirius, Alpha Centauri A/B); Ergänzung Hipparcos (van Leeuwen 2007), Lizenz offen'),
                 dict(name='NASA Exoplanet Archive (Caltech/IPAC)', lizenz='keine förmliche Lizenz genannt; Danksagung und Zitat Christiansen et al. 2025 (PSJ) verlangt',
                      stand='noch nicht abgefragt')],
        zeit=dict(bezugssystem='a_ce', epoche='J2016.0 (Gaia DR3)', unschaerfe=dict(fehlt=True, grund='Gaia nennt die Epoche, keine Unschärfe der Zeit')),
        sterne=sterne, planeten=PLANETEN,
        weitere=dict(fehlt=True, grund='Bisher nur 40 Eridani A (Rocky-Gerüst); weitere Nachbarsterne noch nicht abgeleitet'))
    with open(os.path.join(a.ziel, 'nachbarsterne.json'), 'w', encoding='utf-8') as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
    for s in sterne:
        g = s['gaia']
        print(s['name'], g['parallaxe_mas'], '±', g['parallaxe_unschaerfe_mas'], 'mas →', round(1000 / g['parallaxe_mas'] * 3.26156, 3), 'Lj (nur Anzeige)')


if __name__ == '__main__':
    main()
