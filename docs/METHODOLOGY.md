# Metod: källmaterial, frågekvalitet och poäng

## 1. Källurval

För varje av de åtta partier som sitter i riksdagen används det senaste officiella långsiktiga grundprogram som partiet självt publicerar: **partiprogram**, **idéprogram** eller **principprogram**. Valplattformar, valmanifest, budgetmotioner och enskilda sakpolitiska webbsidor ingår inte i denna dataversion.

Källregistret finns i `data/sources.json` och innehåller dokumentets officiella URL, dokumenttyp och besluts-/versionsår. När ett äldre antaget program har senare officiella uppdateringar används den senast publicerade programversionen; Liberalernas program är exempelvis antaget 2013 men datasetet använder versionen med landsmötesuppdateringar till och med 2023.

## 2. Råextraktionen är inte samma sak som frågebanken

`data/statements/*.jsonl` är ett **källspårbart råmaterial** med 371 kuraterade programrader. Det är medvetet bredare än de frågor som visas i appen. En formulering kan vara korrekt återgiven ur ett partiprogram och ändå vara för allmän för att fungera som valkompassfråga.

Två typer finns i råmaterialet:

- `proposal`: ett förslag om vad stat, kommun, EU, arbetsmarknad eller annan samhällsaktör ska göra eller hur ett system ska utformas.
- `position`: ett normativt politiskt ställningstagande som går att hålla med eller inte hålla med om.

Att en rad är `review.status = curated` betyder därför att den är källgranskad som programparafras. Det betyder **inte automatiskt** att den är godkänd för användning i kompassen.

## 3. Den separata kvalitetsgrinden för kompassfrågor

Appen använder en explicit allowlist i `data/question-bank.json`. För att en rå rad ska få tas med där måste den klara ett hårdare test: frågan ska mäta ett **politiskt vägval**, inte om användaren gillar något allmänt positivt.

En fråga godkänns normalt när kärnan är ett konkret val om exempelvis:

- förbud eller tillstånd,
- skatt, avgift, bidrag eller offentlig utgift,
- offentligt eller privat ägande och huvudmannaskap,
- rättighet, skyldighet eller kvalificeringskrav,
- en specificerad nivå, andel, tid eller annan mätbar målsättning,
- institutionell förändring eller ansvarsfördelning,
- marknad, valfrihet eller regleringsmodell,
- ett konkret internationellt åtagande eller medlemskapsval,
- ett identifierbart politiskt styrmedel.

### Motpositionstestet

Den viktigaste kontrollfrågan är:

> Kan en seriös politisk motståndare säga nej till påståendet utan att därmed behöva säga att den vill ha ett sämre samhälle?

Om svaret är nej är formuleringen normalt för platt för kompassen.

Därför sorteras formuleringar som i huvudsak säger att vården ska ha hög kvalitet, skolan ska vara bra, ekonomin stark, samhället tryggt, politiken rättvis eller verksamheter effektiva bort om de inte samtidigt innehåller ett konkret omstritt instrument.

Ett dokumenterat regressionsexempel är `M-2021-031`: **”Sjukvården ska präglas av hög kvalitet, god tillgänglighet och valfrihet.”** Raden finns kvar i källmaterialet men är uttryckligen förbjuden i kompassens allowlist eftersom kvalitet och tillgänglighet inte skapar en tillräckligt tydlig politisk skiljelinje.

När en rå formulering är för vag föredrar vi att **utesluta den** framför att skriva om den till ett skarpare förslag som källan inte säkert stödjer.

## 4. Redigering av råpåståenden

Påståendet i `statement` är en **neutral, kort parafras**, inte ett citat. Det ska:

1. kunna förstås utan omgivande brödtext,
2. innehålla endast ett huvudsakligt ställningstagande,
3. undvika partinamn och kampanjspråk,
4. behålla den politiskt avgörande riktningen och viktiga begränsningar,
5. inte göras mer specifikt eller konfliktfyllt än källpassagen medger.

Vid tvekan delas en källa upp i flera påståenden i stället för att bygga en lång sammansatt formulering.

## 5. Källspårbarhet

Varje kuraterad råpost måste ha:

- `document_id`,
- 1-baserad PDF-sida (`pdf_page`),
- närmaste rubrik/avsnitt (`section`).

Källans URL lagras centralt i `data/sources.json`. I appen hålls partikällan dold tills användaren har svarat. Därefter går originaldokumentet att öppna direkt.

## 6. Frågebank v0.2

Den handgranskade frågebanken innehåller **129** frågor. Antalet godkända kandidater per parti är:

| Parti | Godkända kompassfrågor |
|---|---:|
| S | 16 |
| M | 11 |
| SD | 16 |
| C | 16 |
| V | 18 |
| KD | 16 |
| MP | 18 |
| L | 18 |
| **Totalt** | **129** |

Skillnaden mellan partierna är tillåten på banknivå eftersom urvalet i en faktisk omgång alltid balanseras. Varje parti måste ha minst tio godkända frågor, vilket gör att även 80-frågorsläget kan ge exakt tio frågor per parti.

## 7. Frågeurval i en omgång

Appen använder inte uniform slumpning över samtliga 371 råposter. Den laddar först endast ID:n från `data/question-bank.json`. Därefter gör `selectBalancedQuestions()` följande:

1. grupperar de godkända frågorna efter `source_party`,
2. ger varje parti samma kvot när vald frågelängd är jämnt delbar med åtta,
3. försöker varva ämnesområden inom respektive partis kvot,
4. blandar därefter hela frågeordningen.

Standardomgången är 48 frågor, alltså sex per parti. Alternativen 24 och 80 ger tre respektive tio per parti.

Detta hindrar att ett parti får större vikt enbart för att dess program eller råextraktion innehåller fler detaljerade poster.

## 8. Svarsskala

Svarsvärdena är:

| Svar | Värde |
|---|---:|
| Mycket dåligt | -2 |
| Dåligt | -1 |
| Bra | +1 |
| Mycket bra | +2 |
| Vet ej / ingen åsikt | exkluderas |

Det finns avsiktligt inget neutralt mittalternativ. `Vet ej` betyder att användaren inte vill att frågan ska påverka poängen.

## 9. Nuvarande poäng: programaffinitet

Rådatasetet säger säkert att **källpartiet** uttrycker ett ställningstagande. Det säger inte säkert vad de sju andra partierna tycker om exakt samma neutrala formulering.

Därför beräknar appen ännu inte en klassisk åtta-partiers positionsmatchning. I stället beräknas en transparent **programaffinitet** separat för varje parti:

1. ta endast frågor i omgången vars `source_party` är det aktuella partiet,
2. uteslut `vet ej`,
3. beräkna medelvärdet på skalan `-2…+2`,
4. skala linjärt till `0…100` med formeln `(mean + 2) / 4 * 100`,
5. redovisa samtidigt hur många sakliga svar som ligger bakom poängen.

Appen visar även en enkel täckningsindikator:

- `låg`: färre än 5 sakliga svar,
- `medel`: 5–8,
- `hög`: minst 9.

Indikatorn är inte ett statistiskt konfidensintervall; den visar bara hur tunt eller brett svarsunderlaget är.

## 10. Begränsning för klassisk partimatchning

Att ett påstående kommer från parti X betyder bara att parti X uttrycker den ståndpunkten i sitt program. Det räcker **inte** för att anta positionen hos alla åtta partier.

Nästa datalager ska därför gruppera semantiskt likvärdiga frågor i `canonical_issue_id` och koda **samtliga partiers position** på samma fråga, exempelvis `support`, `oppose`, `mixed` och `not_stated`, med separat källstöd för varje kodning.

Först när den matrisen är tillräckligt komplett bör appen lägga till en traditionell partinärhetspoäng. Programaffiniteten kan då behållas som en separat transparent vy.

## 11. Reproducerbarhet och regressionstest

`python3 scripts/validate_dataset.py` verifierar rådatasetets strukturella integritet. Node-testsviten verifierar dessutom bland annat:

- JSONL-parsning,
- att frågebankens alla ID:n finns i råmaterialet och hör till rätt parti,
- att varje parti har minst tio godkända frågor,
- att dokumenterade plattityd-regressioner inte kan komma tillbaka i allowlisten,
- lika många frågor per parti i en omgång,
- ämnesdiversifiering,
- poängskalning,
- att `vet ej` inte påverkar poängen,
- att appen faktiskt laddar frågebanken innan urval sker,
- att partikällan hålls dold tills frågan är besvarad.

GitHub Actions kör datasetvalidator, tester och syntaxkontroll på pull requests och på `main`.
