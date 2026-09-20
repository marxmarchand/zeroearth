import { zelle, grenzen, flaeche, eltern, kinder, verdichten, stufeZuSkala, proFlaeche } from './zellen.mjs';
let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) fehler++;
  console.log(`${ok ? '  ok' : 'FEHL'}  ${name}${ok ? '' : `\n        ist ${JSON.stringify(ist)}\n        soll ${JSON.stringify(soll)}`}`);
};
const bochum = [51.48, 7.22];

pruefe('Zelle bei Bochum, Stufe 5 (0,25°)', zelle(...bochum, 5), 'g5:565/748');
const b = grenzen(zelle(...bochum, 5));
pruefe('Grenzen enthalten den Punkt', [b.lat0 <= 51.48, 51.48 < b.lat1, b.lon0 <= 7.22, 7.22 < b.lon1], [true, true, true, true]);
pruefe('Schachtelung: Eltern der Zelle', eltern(zelle(...bochum, 5)), zelle(...bochum, 4));
pruefe('Kinder enthalten die eigene Zelle', kinder(zelle(...bochum, 4)).includes(zelle(...bochum, 5)), true);
pruefe('vier Kinder', kinder(zelle(...bochum, 4)).length, 4);
pruefe('Datumsgrenze', zelle(0, 180, 0), zelle(0, -180, 0));
pruefe('Stufe der Skala „Region"', stufeZuSkala('region'), 4);
pruefe('NullNatur-Skala hat keine Stufe', stufeZuSkala('solar'), null);

const aequator = flaeche(zelle(0.1, 0.1, 5)), bei51 = flaeche(zelle(...bochum, 5));
console.log(`  Fläche 0,25°-Zelle: Äquator ${aequator.toFixed(1)} km² · 51,5° N ${bei51.toFixed(1)} km² · Faktor ${(bei51/aequator).toFixed(3)}`);
pruefe('Verzerrung ist real (Faktor < 0,7)', bei51 / aequator < 0.7, true);
const d = proFlaeche(12, zelle(...bochum, 5));
console.log(`  Dichte: ${d.wert.toFixed(4)} ${d.einheit} auf ${d.bezugsflaeche_km2.toFixed(1)} km²`);

const saetze = [{raum:{lat:51.48,lon:7.22}}, {raum:{lat:51.49,lon:7.24}}, {raum:{lat:40,lon:-74}}];
pruefe('Verdichten auf Stufe 4', verdichten(saetze, 4).map(z => z.anzahl).sort(), [1, 2]);
pruefe('Verdichten auf Stufe 11 trennt beide Punkte', verdichten(saetze, 11).length, 3);

console.log(fehler ? `\n${fehler} Fehler` : '\nalle Prüfungen bestanden');
process.exit(fehler ? 1 : 0);
