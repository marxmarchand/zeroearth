#!/usr/bin/env python3
"""
Adapter: SWOT River Tides (Scherer & Hart-Davis 2026, Zenodo 15223861, CC BY 4.0)
  → Sätze nach SCHNITTSTELLE.md, verortet in erste_natur/erdsystem.

Die Rohdaten bleiben bei Zenodo. Hier entsteht nur das Abgeleitete: ausgedünnte
Knoten mit Tidenamplitude, klein genug fürs Repository.

  python3 gezeiten.py                 # holen, wandeln, schreiben
  python3 gezeiten.py --datei X.zip   # lokale Datei wandeln (ohne Netz)
  python3 gezeiten.py --schema X.zip  # nur die Spalten der Quelle zeigen

Zugriff: stand (eingefrorene Version mit DOI), nicht live — siehe QUELLEN.md.
"""
import argparse, json, math, sys, urllib.request
from pathlib import Path

ZENODO_ID = "15223861"
DOI = "10.5281/zenodo.15223861"
DATEI = "amp.zip"                      # kleinste Datei mit Amplitude (M2+O1)
ADRESSE = "erste_natur/erdsystem"
STUFE_GRAD = 0.125                     # Ausdünnung: Stufe 6 der Leiter (ZEIT_RAUM §2.4)

# SWOT fliegt seit 2023; Version 0 der Auswertung vom 09.01.2026.
ZEIT = {"t0": 23, "t1": 26, "achse": "J2000"}

def zenodo_datei(ziel: Path) -> Path:
    """Holt DATEI über die Zenodo-API. Läuft im Actions-Lauf, nicht im Browser."""
    meta_url = f"https://zenodo.org/api/records/{ZENODO_ID}"
    with urllib.request.urlopen(meta_url, timeout=120) as r:
        meta = json.load(r)
    treffer = [f for f in meta["files"] if f["key"] == DATEI]
    if not treffer:
        sys.exit(f"{DATEI} nicht im Zenodo-Eintrag: {[f['key'] for f in meta['files']]}")
    url = treffer[0]["links"]["self"]
    ziel.parent.mkdir(parents=True, exist_ok=True)
    print(f"hole {DATEI} ({treffer[0]['size']/1e6:.1f} MB) …")
    urllib.request.urlretrieve(url, ziel)
    return ziel

def spalte(df, kandidaten):
    """Spaltenname aus Kandidaten — die Quelle ist Version 0, Namen können wechseln."""
    for k in kandidaten:
        for s in df.columns:
            if s.lower() == k:
                return s
    return None

def wandeln(zip_pfad: Path):
    import geopandas as gpd
    df = gpd.read_file(f"zip://{zip_pfad}")
    print(f"{len(df):,} Knoten · Spalten: {list(df.columns)}")

    s_amp   = spalte(df, ["amp", "amplitude", "amp_m2_o1", "tide_amp"])
    s_klasse= spalte(df, ["class", "klasse", "tide_class"])
    s_knoten= spalte(df, ["node_id", "node", "nodeid", "reach_id"])
    if s_amp is None:
        sys.exit(f"keine Amplitudenspalte gefunden — vorhanden: {list(df.columns)}")

    if df.crs is not None and df.crs.to_epsg() != 4326:
        df = df.to_crs(4326)

    # Ausdünnen: je 0,125°-Zelle der Knoten mit der größten Amplitude.
    # Deterministisch, folgt der Stufenleiter, erfindet nichts dazwischen.
    beste = {}
    roh = 0
    for _, z in df.iterrows():
        g = z.geometry
        if g is None or g.is_empty:
            continue
        p = g if g.geom_type == "Point" else g.centroid
        amp = z[s_amp]
        if amp is None or (isinstance(amp, float) and math.isnan(amp)):
            continue
        roh += 1
        zelle = (math.floor((p.y + 90) / STUFE_GRAD), math.floor((p.x + 180) / STUFE_GRAD))
        vorher = beste.get(zelle)
        if vorher is None or amp > vorher["was"]["wert"]:
            herkunft = {"art": "rekonstruktion", "quelle": f"zenodo:{ZENODO_ID}", "doi": DOI,
                        "verfahren": "SWOT RiverSP, geglättet und interpoliert (Scherer & Hart-Davis 2026)",
                        "lizenz": "CC-BY-4.0", "zugriff": "stand"}
            if s_knoten:
                herkunft["knoten"] = f"sword:v17:{z[s_knoten]}"
            beste[zelle] = {
                "raum": {"system": "WGS84", "lat": round(float(p.y), 5), "lon": round(float(p.x), 5)},
                "zeit": ZEIT,
                "wo": ADRESSE,
                "was": {"merkmal": "tidenamplitude", "wert": round(float(amp), 3), "einheit": "m",
                        **({"klasse": str(z[s_klasse])} if s_klasse else {})},
                "woher": herkunft,
            }
    saetze = sorted(beste.values(), key=lambda s: -s["was"]["wert"])
    print(f"{roh:,} Knoten mit Wert → {len(saetze):,} Sätze (je 0,125°-Zelle das Maximum)")
    return saetze

def schreiben(saetze, ziel: Path):
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(json.dumps({
        "hinweis": "abgeleitet aus SWOT River Tides (Zenodo 15223861, CC BY 4.0) — Rohdaten bleiben dort",
        "zitat": "Scherer, D., & Hart-Davis, M. (2026). SWOT River Tides (Version 0) [Dataset]. Zenodo.",
        "stufe_grad": STUFE_GRAD, "anzahl": len(saetze), "saetze": saetze,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"→ {ziel} ({ziel.stat().st_size/1e6:.2f} MB)")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--datei"); ap.add_argument("--schema")
    ap.add_argument("--ziel", default="../../data/gezeiten.json")
    a = ap.parse_args()
    if a.schema:
        import geopandas as gpd
        df = gpd.read_file(f"zip://{a.schema}", rows=5)
        print(df.dtypes); print(df.head()); sys.exit(0)
    pfad = Path(a.datei) if a.datei else zenodo_datei(Path("roh") / DATEI)
    schreiben(wandeln(pfad), Path(a.ziel))
