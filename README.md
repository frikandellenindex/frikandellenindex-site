# De Frikandellenindex

Wat je ongemerkt eet, in frikandellen. Website: https://frikandellenindex.nl

## Zelf iets aanpassen

Alle inhoud staat in de map **content**. Pas daar een bestand aan op GitHub (potloodje rechtsboven), klik op *Commit changes*, en Netlify zet de site binnen een minuut opnieuw online.

| Bestand | Wat staat erin |
|---|---|
| `content/nieuws.json` | De nieuwskoppen. Bovenste 3 staan op de homepage. Per bericht: `kop`, `feit`, `boodschap`. |
| `content/index.json` | De Frikandellenindex (top 10). Bovenste 5 staan op de homepage. |
| `content/top10-per-moment.json` | De top 10 per moment op de indexpagina. |
| `content/momenten.json` | De calculator: momenten, taglines, grappen en producten (kcal per portie). |
| `content/quiz.json` | De quiz Meer of minder?: per vraag de snack, de portie, de grens (meer of minder dan …), de kcal en de knipoog. |
| `content/dit-is-ook-een-frikandel.json` | De kaarten "Dit is ook een frikandel". |
| `content/site.json` | Naam, e-mail, socials en de GoatCounter-code. |
| `content/nevo.json` | De NEVO-tabel voor de zoekfunctie. Niet aanpassen (voorwaarden NEVO). |

Teksten van pagina's (Over, Zo rekenen we, de blogs, Privacy) staan in de map **pages**. Bovenaan elk bestand staan de titel en omschrijving voor Google.

Let op bij JSON: tekst tussen "dubbele aanhalingstekens", komma tussen items, geen komma na het laatste item. Gaat er iets mis, dan bouwt Netlify niet en blijft de vorige versie gewoon online.

## Getallen

1 frikandel = 180 kcal (NEVO-online 2025/9.0, RIVM: frikandel bereid, 72 g). Bronnen per product: zie de bronnenlijst in het project.

## Technisch

- `node build.mjs` bouwt alles naar `dist/` (geen extra pakketten nodig).
- Lettertypes: Bowlby One, Bricolage Grotesque, JetBrains Mono (SIL Open Font License), zelf gehost in `assets/fonts`.
- Statistieken: GoatCounter, zonder cookies. Zet de code in `content/site.json` bij `goatcounter`.
