# Val AI-kompassen 2026

En källspårbar, partiblind valkompass byggd på de åtta riksdagspartiernas senaste officiella långsiktiga parti-, idé- eller principprogram.

Appen visar ett konkret politiskt vägval i taget utan att avslöja vilket parti det kommer från. Användaren svarar **mycket dåligt**, **dåligt**, **bra**, **mycket bra** eller **vet ej / ingen åsikt**. Efter svaret kan originalkälla, PDF-sida och avsnitt öppnas.

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
- 24, 48 eller 80 frågor per omgång
- lika många frågor från varje parti
- ämnesdiversifiering inom varje partis urval
- dold partikällan medan användaren svarar
- källa och sida kan granskas efter svar
- `localStorage` för att fortsätta en avbruten omgång
- resultat med poäng, svarstäckning och enkel säkerhetsindikator
- automatiska tester och CI
- källspårbart rådataset med **371** kuraterade programrader
- separat, handgranskad kompassbank med **129** politiskt diskriminerande frågor

## Två datalager: råmaterial och kompassfrågor

`data/statements/*.jsonl` innehåller den breda, källspårade extraktionen. Alla dessa rader är **inte** automatiskt lämpliga som valkompassfrågor.

Appen får bara använda ID:n som finns i `data/question-bank.json`. Den andra granskningen frågar i praktiken: **finns det en rimlig seriös politisk motposition?** Om en formulering mest säger att vården ska vara bra, skolan hålla hög kvalitet, ekonomin vara stark eller samhället tryggt sorteras den bort om inget konkret politiskt instrument samtidigt anges.

Exempel på frågor som normalt klarar grinden är förbud och tillstånd, skatter och utgifter, ägar- och huvudmannaskap, lagstadgade rättigheter eller skyldigheter, kvalificeringskrav, konkreta nivåer och institutionella förändringar.

Ett uttryckligt regressionsexempel är råposten `M-2021-031`:

> Sjukvården ska präglas av hög kvalitet, god tillgänglighet och valfrihet.

Den är korrekt källspårad men **inte** godkänd för kompassen eftersom den i huvudsak kombinerar allmänt positiva mål. Den ligger därför kvar i råmaterialet men är spärrad från frågebanken och omfattas av regressionstest.

## Frågebank v0.2

Den godkända banken innehåller **129** frågor:

| Parti | Godkända frågor |
|---|---:|
| Socialdemokraterna (S) | 16 |
| Moderaterna (M) | 11 |
| Sverigedemokraterna (SD) | 16 |
| Centerpartiet (C) | 16 |
| Vänsterpartiet (V) | 18 |
| Kristdemokraterna (KD) | 16 |
| Miljöpartiet (MP) | 18 |
| Liberalerna (L) | 18 |
| **Totalt** | **129** |

Varje parti har minst tio godkända frågor, så 80-frågorsläget kan fortfarande ge exakt tio frågor per parti.

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
- Kompassens allowlist: `data/question-bank.json`
- Datasetindex: `data/statements/index.json`
- JSON Schema: `schema/statement.schema.json`
- Metod: `docs/METHODOLOGY.md`

## Resultatet: programaffinitet

Den nuvarande versionen använder ett medvetet försiktigt mått som vi kallar **programaffinitet**.

Svar kodas som:

- mycket dåligt = `-2`
- dåligt = `-1`
- bra = `+1`
- mycket bra = `+2`
- vet ej = räknas inte i poängen

För varje parti beräknas medelvärdet endast över påståenden som faktiskt kommer ur det partiets program. Medelvärdet skalas från `-2…+2` till `0…100`.

Det är **inte** ännu en klassisk partinärhetspoäng. Att ett förslag finns i parti A:s program säger inte automatiskt vad parti B tycker om samma fråga. Appen beskriver därför resultatet uttryckligen som hur positiv användaren varit till respektive partis egna programskrivningar.

## Varför frågorna balanseras

Programmen är olika långa och olika detaljerade. Appen slumpas därför inte ur alla 371 råposter. Den använder endast de 129 godkända frågorna och `selectBalancedQuestions()` ger varje parti samma kvot samtidigt som frågorna sprids över flera ämnen.

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

Testerna kontrollerar bland annat att frågebankens ID:n finns i råmaterialet, att varje parti har tillräckligt många frågor för djup-läget och att dokumenterade plattityder inte kan återintroduceras i kompassen. Samma kontroller körs i GitHub Actions.

## Status

- [x] Register över de åtta officiella grundprogrammen
- [x] Källspårbart rådataset
- [x] Kuraterad första extraktion från samtliga åtta program
- [x] Separat kvalitetsgrind mot plattityder och självklarheter
- [x] 129 handgranskade politiskt diskriminerande kompassfrågor
- [x] Balanserad frågesampling
- [x] Partiblint frågeflöde
- [x] Programaffinitet och resultatvy
- [x] Responsiv layout, tangentbordsfokus och reduced-motion-stöd
- [x] Lokal sessionsåterställning
- [x] Regressionstester och CI
- [ ] Andra systematiska genomläsningen för uttömmande täckningsaudit
- [ ] Normalisering till gemensamma sakfrågor (`canonical_issue_id`)
- [ ] Kodning av samtliga åtta partiers position på varje gemensam sakfråga
- [ ] Klassisk partinärhetsmodell ovanpå den normaliserade matrisen

De fyra sista punkterna är metodförbättringar för nästa dataversion. Den nuvarande appen är fullt körbar och redovisar sin mer begränsade poängmodell öppet i gränssnittet.
