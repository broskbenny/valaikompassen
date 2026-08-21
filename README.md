# Val AI-kompassen 2026

En källspårbar, partiblind valkompass byggd på de åtta riksdagspartiernas senaste officiella långsiktiga parti-, idé- eller principprogram.

Appen visar ett konkret politiskt vägval i taget utan att avslöja partierna bakom positionerna. Användaren svarar **mycket dåligt**, **dåligt**, **bra**, **mycket bra** eller **vet ej / ingen åsikt**. Efter svaret visas de källkodade partipositionerna, PDF-sida, avsnitt och originaldokument.

## Kör appen

Projektet är avsiktligt byggt utan externa frontendberoenden.

```bash
python3 -m http.server 8000
```

Öppna sedan `http://localhost:8000`.

Alternativt:

```bash
npm run serve
```

## Vad som ingår

- responsiv single-page-app i ren HTML/CSS/JavaScript
- 24, 48 eller 80 unika sakfrågor per omgång
- partiblint frågeflöde
- separat kvalitetsgrind mot plattityder och självrättfärdigande formuleringar
- sammanslagning av semantiskt likvärdiga frågor mellan partier
- explicit källkodning av både stöd och motstånd där programmen medger det
- källnära partinyanser visas först efter att användaren har svarat
- urval som balanserar källtäckning utan att tvinga fram lika stora partikvoter
- `localStorage` för att fortsätta en avbruten omgång
- källstödd sakfrågematchning med redovisat underlag per parti
- automatiska regressionstester och CI
- källspårbart rådataset med **371** kuraterade programrader
- handgranskad frågebank v0.3 med **99 unika frågor**

## Tre lager: råmaterial, kvalitetsgrind och gemensamma sakfrågor

`data/statements/*.jsonl` innehåller den breda, källspårade extraktionen. Alla dessa rader är **inte** automatiskt lämpliga som valkompassfrågor.

`data/question-bank.json` är det hårdare kompasslagret. En formulering måste innehålla ett verkligt politiskt val och en rimlig seriös motposition. Det räcker alltså inte att en mening låter politisk.

Två typer av formuleringar sorteras särskilt hårt bort:

1. **Plattityder och allmänt positiva mål**, exempelvis att vården ska ha hög kvalitet eller att skolan ska vara bra.
2. **Självrättfärdigande villkor**, där argumentet för svaret byggs in i frågan genom ord som “bättre”, “nödvändigt”, “effektivt” eller “rimligt”.

Ett uttryckligt regressionsexempel är `M-2021-009`:

> Det offentliga ska inte utföra uppgifter som andra kan göra lika bra eller bättre.

Raden är en korrekt programparafras men en dålig valkompassfråga: villkoret “lika bra eller bättre” gör ett nej onaturligt och “uppgifter” döljer vilken konkret verksamhet konflikten gäller. Den är därför spärrad från kompassen.

Samma sak gäller `M-2021-031`:

> Sjukvården ska präglas av hög kvalitet, god tillgänglighet och valfrihet.

Den ligger kvar i råmaterialet men är inte en kompassfråga.

## Frågebank v0.3: 99 unika sakfrågor

Banken består av:

- **81** starka frågor som fortfarande kan knytas till en enskild källrad,
- **18** gemensamma sakfrågor som sammanför semantiskt likvärdiga positioner från flera partiprogram.

När partiernas gemensamma kärna är densamma ställs frågan bara en gång. Efter svaret visas varje partis källnära parafras, så att viktiga skillnader i villkor eller ambitionsnivå inte försvinner.

Exempel på sammanslagna frågor är bland annat:

- statligt huvudansvar för skolan,
- skolval,
- författningsdomstol,
- kärnkraftens långsiktiga roll,
- permanenta uppehållstillstånd,
- kärnvapen på svenskt territorium,
- civilplikt,
- abortskydd i grundlagen,
- behovsstyrd arbetskraftsinvandring,
- euron,
- tandvårdens finansiering,
- privata vårdgivare och friskolor.

I vissa gemensamma frågor finns också en explicit motsatt programposition. Då kodas den som `oppose` i stället för att skapa en separat spegelvänd fråga.

## Varför vi inte längre kräver lika många frågor per parti

Den tidigare versionen krävde minst tio godkända frågor från varje parti för att kunna ge exakt lika stora partikvoter. Det skapade fel incitament: ett mer abstrakt idéprogram riskerade att få svagare formuleringar godkända bara för att fylla kvoten.

v0.3 gör tvärtom. Kvalitetsgränsen är fast. Om ett program ger färre konkreta, diskriminerande frågor får partiet färre källkodade positioner i banken. Urvalsalgoritmen försöker balansera täckningen mellan partierna så långt materialet räcker, men den fabricerar inte jämnhet genom att sänka frågekvaliteten.

## Resultatet: källstödd sakfrågematchning

Svar kodas som:

- mycket dåligt = `-2`
- dåligt = `-1`
- bra = `+1`
- mycket bra = `+2`
- vet ej = räknas inte i poängen

För varje fråga gäller:

- om ett partis program **stödjer** påståendet används svarsvärdet direkt,
- om ett partis program uttryckligen **motsätter sig** påståendet vänds tecknet,
- om partiet inte har en källkodad position på frågan påverkas partiets resultat inte alls.

Tystnad eller frånvaro i ett program tolkas alltså **aldrig** som motstånd.

Medelvärdet per parti skalas från `-2…+2` till `0…100`. Resultatvyn visar samtidigt hur många källkodade positioner som faktiskt ligger bakom partiets poäng.

Detta är mer informativt än den tidigare rena programaffiniteten, men ännu inte en full klassisk valkompass: samma sakfråga är inte färdigkodad för samtliga åtta partier i hela banken.

## Rådataset v0.1

| Parti | Råposter |
|---|---:|
| Socialdemokraterna (S) | 53 |
| Moderaterna (M) | 34 |
| Sverigedemokraterna (SD) | 44 |
| Centerpartiet (C) | 41 |
| Vänsterpartiet (V) | 55 |
| Kristdemokraterna (KD) | 43 |
| Miljöpartiet (MP) | 50 |
| Liberalerna (L) | 51 |
| **Totalt** | **371** |

Varje råpost är en kort neutral parafras och går att spåra till dokument, PDF-sida och avsnitt.

- Källregister: `data/sources.json`
- Råpåståenden: `data/statements/*.jsonl`
- Kompassbank: `data/question-bank.json`
- Datasetindex: `data/statements/index.json`
- JSON Schema: `schema/statement.schema.json`
- Metod: `docs/METHODOLOGY.md`

## Källprincip

För varje parti används det senaste officiella långsiktiga grundprogram som partiet självt publicerar. Partier använder olika dokumentnamn, därför accepteras **partiprogram**, **idéprogram** och **principprogram**. Valmanifest, valplattformar, budgetmotioner och löpande sakpolitiska webbsidor ingår inte i rådatasetet.

Liberalernas program är antaget 2013 men den publicerade versionen innehåller landsmötesuppdateringar till och med 2023; datasetets L-rader är rebaserade mot den versionen.

## Test och validering

```bash
python3 scripts/validate_dataset.py
npm test
node --check app.js
node --check src/core.js
```

Testerna verifierar bland annat att alla frågekällor finns i råmaterialet, att samma källrad inte skapar dubblettfrågor, att stöd och motstånd inte kodas samtidigt för samma parti, att dokumenterade plattityder och självrättfärdigande maximer inte kan återintroduceras och att urvalet balanserar täckning utan hårda partikvoter.

Samma kontroller körs i GitHub Actions.

## Status

- [x] Register över de åtta officiella grundprogrammen
- [x] Källspårbart rådataset med 371 programrader
- [x] Separat kvalitetsgrind mot plattityder och självklarheter
- [x] Skärpt filter mot självrättfärdigande och abstrakta maximfrågor
- [x] 99 unika politiskt diskriminerande sakfrågor
- [x] Första lagret av gemensamma canonical-frågor mellan partier
- [x] Explicit stöd-/motståndskodning där källorna är tydliga
- [x] Täckningsbalanserad sampling utan tvingade partikvoter
- [x] Partiblint frågeflöde och källvisning efter svar
- [x] Källstödd sakfrågematchning
- [x] Responsiv layout och lokal sessionsåterställning
- [x] Regressionstester och CI
- [ ] Andra systematiska genomläsningen för uttömmande täckningsaudit
- [ ] Full canonical-kodning av samtliga åtta partier på varje relevant sakfråga
- [ ] Kalibrering/viktning för en komplett traditionell valkompassmodell

Den nuvarande appen är fullt körbar men redovisar öppet att positionsmatrisen fortfarande är partiell.
