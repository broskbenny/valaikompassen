# Val AI-kompassen 2026

En källspårbar, partiblind valkompass byggd på de åtta riksdagspartiernas senaste officiella långsiktiga parti-, idé- eller principprogram.

Appen visar ett sakpolitiskt påstående i taget utan att avslöja vilket parti det kommer från. Användaren svarar **mycket dåligt**, **dåligt**, **bra**, **mycket bra** eller **vet ej / ingen åsikt**. Efter svaret kan originalkälla, PDF-sida och avsnitt öppnas.

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
- källspårbart rådataset med **371** kuraterade ställningstaganden

## Dataset v0.1

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
| **Totalt** | **371** |

Varje post är en kort neutral parafras och går att spåra till dokument, PDF-sida och avsnitt.

- Källregister: `data/sources.json`
- Påståenden: `data/statements/*.jsonl`
- Datasetindex: `data/statements/index.json`
- JSON Schema: `schema/statement.schema.json`
- Metod: `docs/METHODOLOGY.md`

## Resultatet: programaffinitet

MVP:n använder ett medvetet försiktigt mått som vi kallar **programaffinitet**.

Svar kodas som:

- mycket dåligt = `-2`
- dåligt = `-1`
- bra = `+1`
- mycket bra = `+2`
- vet ej = räknas inte i poängen

För varje parti beräknas medelvärdet endast över påståenden som faktiskt kommer ur det partiets program. Medelvärdet skalas från `-2…+2` till `0…100`.

Det är **inte** ännu en klassisk partinärhetspoäng. Att ett förslag finns i parti A:s program säger inte automatiskt vad parti B tycker om samma fråga. Appen beskriver därför resultatet uttryckligen som hur positiv användaren varit till respektive partis egna programskrivningar.

## Varför frågorna balanseras

Programmen är olika långa och olika detaljerade. En helt uniform slumpning ur alla 371 rader skulle därför ge mer utrymme åt partier med fler extraherade poster. `selectBalancedQuestions()` ger varje parti samma kvot och försöker samtidigt sprida frågorna över flera ämnen.

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

Samma kontroller körs i GitHub Actions.

## Status

- [x] Register över de åtta officiella grundprogrammen
- [x] Källspårbart rådataset
- [x] Kuraterad första extraktion från samtliga åtta program
- [x] Balanserad frågesampling
- [x] Partiblint frågeflöde
- [x] Programaffinitet och resultatvy
- [x] Responsiv layout, tangentbordsfokus och reduced-motion-stöd
- [x] Lokal sessionsåterställning
- [x] Tester och CI
- [ ] Andra systematiska genomläsningen för uttömmande täckningsaudit
- [ ] Normalisering till gemensamma sakfrågor (`canonical_issue_id`)
- [ ] Kodning av samtliga åtta partiers position på varje gemensam sakfråga
- [ ] Klassisk partinärhetsmodell ovanpå den normaliserade matrisen

De fyra sista punkterna är metodförbättringar för nästa dataversion. Den nuvarande appen är fullt körbar och redovisar sin mer begränsade poängmodell öppet i gränssnittet.
