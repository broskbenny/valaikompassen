# Val AI-kompassen

En källspårbar valkompass för riksdagsvalet 2026.

Projektet byggs stegvis. Första fasen är ett dataset av sakpolitiska förslag och ställningstaganden extraherade ur de åtta riksdagspartiernas senaste officiella långsiktiga parti-, idé- eller principprogram.

## Dataset v0.1

Den första kuraterade extraktionen innehåller **371** korta, självförklarande ställningstaganden. Varje post är en neutral parafras och går att spåra till dokument, PDF-sida och avsnitt.

| Parti | Poster |
|---|---:|
| Socialdemokraterna (S) | 53 |
| Moderaterna (M) | 34 |
| Sverigedemokraterna (SD) | 44 |
| Centerpartiet (C) | 41 |
| Vänsterpartiet (V) | 55 |
| Kristdemokraterna (KD) | 43 |
| Miljöpartiet (MP) | 50 |
| Liberalerna (L) | 51 |

Källor: `data/sources.json`  
Påståenden: `data/statements/*.jsonl`  
Datasetindex: `data/statements/index.json`  
Schema: `schema/statement.schema.json`  
Metod: `docs/METHODOLOGY.md`

## Status

- [x] Register över de åtta officiella grundprogrammen
- [x] Datamodell med källspårbarhet på påståendenivå
- [x] Första kuraterade extraktionen från samtliga åtta program
- [ ] Andra genomläsning för uttömmande täckningskontroll
- [ ] Normalisering till gemensamma sakfrågor (`canonical_issue_id`)
- [ ] Kodning av samtliga partiers position på varje gemensam sakfråga
- [ ] Matchnings-/poängmodell
- [ ] Appens frågeflöde och resultatvy

## Viktigt om partimatchning

Rådatat kan redan användas för att visa och besvara frågor, men ska ännu **inte** användas för att räkna fram vilket parti användaren ligger närmast. Att ett påstående har hämtats ur ett partis program säger inte vad alla andra partier tycker om samma sakfråga. För en rättvis matchning behövs därför ett separat normaliserat lager där alla partiers positioner kodas på samma frågor, inklusive `not_stated` när källmaterialet inte räcker.

Frågeordningen bör dessutom vara stratifierad över ämne och källparti snarare än helt uniform över rådatat, så att partier med mer detaljerade program inte dominerar användarens session.
