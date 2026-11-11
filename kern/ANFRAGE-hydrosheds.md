# Anfrage an das HydroSHEDS-Team (Entwurf)

Stand: 2026-11-11. Entwurf; Max schickt die Anfrage selbst ab. Grundlage: `kern/BERICHT-hydrosphaere.md`, Abschnitt 2.3 (Lizenz HydroSHEDS, geprüft 2026-11-10).

**Vor dem Absenden ausfüllen:**
- **Empfänger:** Die Kontaktadresse steht auf hydrosheds.org unter „Contact“. Ich habe sie nicht eingesetzt; sie muss auf der Seite nachgesehen werden.
- **[Name], [URL]:** Name des Absenders und Adresse der Seite (zeroearth.io).
- **Größen:** Was in Klammern steht, sind Schätzungen aus dem Bericht. Gemessen wird erst nach dem Download.

---

**Subject:** Permission question: simplified HydroRIVERS / HydroBASINS derivatives on a non-commercial open website

Dear HydroSHEDS team,

I run zeroearth ([URL]), a non-commercial website that shows Earth-system data on a 3D globe. The site has no advertising, no paywall and no user accounts. Every layer states its source, licence, time reference and how the data were derived.

I would like to show rivers and drainage basins, and HydroRIVERS and HydroBASINS would be our first choice. Before downloading or publishing anything, I would like to check that our planned use is compatible with the HydroSHEDS Version 1 License Agreement. In particular, I have Annex A, sections 1.2 and 2.1.2, in mind: distribution only within Derivative Works, to End Users under a written licence agreement, and never as a stand-alone product.

**What we would publish**

1. **Rivers:**
   - A simplified subset of HydroRIVERS, selected by discharge class (`ORD_FLOW` ≤ 3, ≤ 4 and ≤ 5 for three zoom levels).
   - Geometry generalised (tolerance roughly 5 km, 1 km and 250 m) and coordinates rounded to about 100 m.
   - Kept attributes: `HYRIV_ID`, `ORD_FLOW`, `DIS_AV_CMS` and `UPLAND_SKM`.
   - Estimated size: a few MB for the global view, up to about 100 MB in total for all regional tiles.
2. **Basins:** Possibly, at a later stage, HydroBASINS level 3–4 outlines, also generalised. They would serve to aggregate water balances for large basins.

**How it would be published**

- The derived files would be static GeoJSON files in the website's public repository, which the browser loads to draw the map.
- Technically, anyone could therefore download these derived files. We do not offer them as a separate data product.
- They would not be listed as a download, and there would be no written end-user agreement.
- Every page and metadata file would carry the full copyright notice from Exhibit B: „© World Wildlife Fund, Inc. (2006-2022)“ with all listed rights holders. It would also cite Lehner & Grill (2013) and Lehner, Verdin & Jarvis (2008).

**Our questions**

1. Is this use permitted under the current licence?
2. If not, would you grant permission for it, possibly with conditions (for example a coarser generalisation, fewer attributes, or no repository copy)?
3. If neither is possible, is there a HydroSHEDS product or a later version (for example HydroSHEDS v2) under an open licence such as CC BY 4.0 that we could use instead?

Until we hear from you, we will not use HydroRIVERS or HydroBASINS on the site.

Thank you for your time and for making these data available.

Kind regards,
[Name]
zeroearth, [URL]

---

## Notiz für Max

- **Antwort ablegen:** Die Antwort gehört als Beleg zu den Quellen, mit Datum und Wortlaut. Ihr Inhalt bestimmt den Eintrag `weitergabe` im künftigen Manifest `kern/adapter/fluesse/manifest.json`.
- **Frage 3** zielt auf HydroSHEDS v2. Ob es dazu eine offene Lizenz gibt, habe ich nicht geprüft.
