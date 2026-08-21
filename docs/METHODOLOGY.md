# Metod: källmaterial, frågekvalitet, sammanslagning och poäng

## 1. Källor

Kompassen använder två typer av politiska förstahandskällor.

### 1.1 Långsiktiga partiprogram

För varje av de åtta riksdagspartierna används det senaste officiella långsiktiga grundprogram som partiet självt publicerar: **partiprogram**, **idéprogram** eller **principprogram**. Källregistret finns i `data/sources.json`.

### 1.2 Direkta riksdagsomröstningar

Som andra källager används utvalda direkta sakvoteringar från **Sveriges riksdags öppna data**. Första versionen avgränsas till mandatperioden 2022–2026, alltså riksmötena 2022/23–2025/26.

Den kuraterade voteringsbanken finns i `data/riksdagen/votes.json`. Den fulla voteringsmetoden beskrivs i `docs/RIKSDAGEN_OPEN_DATA.md`.

## 2. Råmaterial är inte samma sak som frågebank

`data/statements/*.jsonl` är ett källspårbart råmaterial med 371 kuraterade programrader. En formulering kan vara korrekt återgiven ur ett program men ändå vara för allmän, retorisk eller självrättfärdigande för kompassen.

På samma sätt är Riksdagens fulla voteringsdata ett råmaterial. `scripts/sync_riksdagen_votes.py` kan skapa en kandidatlista, men inga genererade voteringar exponeras automatiskt i appen.

Båda källtyperna passerar alltså en separat mänsklig kvalitetsgrind.

## 3. Kvalitetsgrinden

En synlig fråga måste mäta ett **politiskt vägval**, inte om användaren gillar något allmänt positivt.

En fråga godkänns normalt när kärnan är ett konkret val om exempelvis:

- förbud eller tillstånd,
- skatt, avgift, bidrag eller offentlig utgift,
- offentligt eller privat ägande och huvudmannaskap,
- rättighet, skyldighet eller kvalificeringskrav,
- en specificerad nivå, andel eller tidsgräns,
- institutionell förändring eller ansvarsfördelning,
- ett identifierbart politiskt styrmedel,
- ett konkret internationellt åtagande eller medlemskapsval.

### 3.1 Motpositionstestet

Den viktigaste kontrollfrågan är:

> Kan en seriös politisk motståndare säga nej till påståendet utan att därmed behöva säga att den vill ha ett sämre samhälle?

Om svaret är nej är formuleringen normalt olämplig.

### 3.2 Självrättfärdigande villkor

Ord som **”lika bra eller bättre”**, **”nödvändigt”**, **”effektivt”** eller **”rimligt”** kan baka in argumentet för svaret. Ett dokumenterat regressionsexempel är:

> Det offentliga ska inte utföra uppgifter som andra kan göra lika bra eller bättre.

Raden finns kvar som programparafras men är uttryckligen spärrad från kompassen.

När källan är för vag föredrar vi att utesluta formuleringen framför att skriva om den till ett skarpare förslag som källan inte säkert stödjer.

## 4. Neutral redigering

En kompassfråga ska:

1. kunna förstås utan omgivande brödtext,
2. innehålla ett tydligt huvudsakligt vägval,
3. undvika partinamn och kampanjspråk,
4. behålla avgörande villkor, nivåer och avgränsningar,
5. inte göras mer specifik än källan medger.

Om en källa innehåller flera politiskt separerbara komponenter ska den normalt inte göras till en enda fråga där väljaren måste ta ställning till allt samtidigt.

## 5. Gemensamma sakfrågor

Programbank v0.3 skiljer mellan `singleton_ids` och `canonical_questions`. Banken innehåller 81 singleton-frågor och 18 canonical-frågor, totalt 99 programbaserade sakfrågor före sammanslagning med voteringslagret.

Flera källor får sammanföras när en neutral gemensam kärna kan skrivas utan att viktig politisk innebörd tappas. Skillnader behålls som separata frågor när nyansen i sig är ett betydelsefullt val, exempelvis olika exakta arbetstidsnivåer eller olika grader av ett förbud.

Efter att användaren svarat visas de källnära formuleringarna separat.

## 6. Hur en riksdagsvotering blir en fråga

En rå `Ja`-röst är inte automatiskt sakpolitiskt stöd. Riksdagen röstar om en bestämd **förslagspunkt**, ofta utskottets förslag mot en reservation.

Innan en votering får användas granskas därför:

1. vilken förslagspunkt som voteringen gäller,
2. vad ett Ja till huvudförslaget konkret innebär,
3. vad motförslaget eller reservationen innebär,
4. om hela konflikten kan återges som en neutral och besvarbar kompassfråga.

Följande exkluderas normalt:

- procedurfrågor,
- tvetydiga avslagsvoteringar,
- motioner där Nej inte kan översättas till en entydig sakposition,
- beslutspaket med flera separerbara konflikter,
- frågor utan en faktisk politisk skiljelinje.

Det är uttryckligen förbjudet att välja en intressant detalj ur ett större lagpaket och sedan behandla varje Ja-röst till paketet som bevis för stöd till just den detaljen.

## 7. Från ledamotsröster till partiposition

För varje parti räknas de faktiska ledamotsrösterna `Ja`, `Nej`, `Avstår` och `Frånvarande`.

En partiposition kodas endast om:

- minst **3** ledamöter från partiet har avgivit Ja eller Nej, och
- minst **80 %** av de avgivna Ja/Nej-rösterna går åt samma håll.

`Avstår` och `Frånvarande` är aldrig automatiskt stöd eller motstånd. Om partigruppen är splittrad eller i huvudsak avstår lämnas partiet okodat på frågan.

Trösklarna sparas på varje voteringspost och valideras automatiskt.

## 8. Samma sakfråga i program och votering

Om en voteringsfråga motsvarar en befintlig programfråga ställs den **en gång**. Frågan kan bära både programkälla och voteringskälla.

Flera källor multiplicerar inte poängen. Varje sakfråga räknas högst en gång per parti.

Om program och votering skulle placera samma parti på motsatta sidor av exakt samma sammanslagna fråga stoppar databyggaren frågan för manuell granskning. Ingen källa prioriteras tyst.

Nato är första konkreta exemplet på denna sammanslagning: programstödet och den direkta voteringen visas som två källor till samma sakfråga.

## 9. Källspårbarhet

Programkällor sparar dokument-id, PDF-sida och avsnitt.

Voteringskällor sparar bland annat:

- riksmöte,
- betänkande,
- förslagspunkt,
- voteringsdatum,
- rubrik,
- propositionens huvud-/motförslag,
- direkt länk till Riksdagens dokumentdata,
- exakta Ja/Nej/Avstår/Frånvarande-tal per parti.

Alla partikällor hålls dolda tills användaren har svarat.

## 10. Frågeurval

Urvalet använder inte hårda partikvoter. Algoritmen balanserar i stället källkodad partitäckning och ämnesvariation utan att sänka kvalitetsgränsen.

Det nya voteringslagret har dessutom en begränsad målandel i en omgång. När tillräckligt många voteringsfrågor finns reserveras ungefär 20 procent av frågorna för dem; resterande frågor tas från program/canonical-banken. Om voteringsbanken är mindre används alla tillgängliga voteringsfrågor men aldrig mer än vad banken faktiskt innehåller.

Med den första banken innebär det fem voteringsfrågor i ett 24-frågorsläge och samtliga åtta i 48- och 80-frågorslägena.

## 11. Svarsskala och poäng

| Svar | Värde |
|---|---:|
| Mycket dåligt | -2 |
| Dåligt | -1 |
| Bra | +1 |
| Mycket bra | +2 |
| Vet ej / ingen åsikt | exkluderas |

För varje fråga och parti med källkodad position gäller:

- `support`: svarsvärdet används direkt,
- `oppose`: svarsvärdet multipliceras med `-1`,
- okodad position: ingen poäng.

Medelvärdet per parti skalas från `-2…+2` till `0…100` med `(mean + 2) / 4 * 100`.

En fråga med både program- och voteringskälla räknas fortfarande bara en gång.

## 12. Begränsningar

Positionsmatrisen är fortfarande partiell. Alla åtta partier är inte källkodade på varje programfråga, och voteringsbanken är ännu bara en handgranskad första uppsättning av mandatperiodens många omröstningar.

Därför gäller:

- tystnad i programmet är aldrig opposition,
- frånvaro/avstående i en votering är aldrig en antagen position,
- splittrade partigrupper kan lämnas okodade,
- poängen ska läsas tillsammans med antalet bedömda källpositioner,
- fler voteringsfrågor ska tillkomma genom systematisk genomgång, inte genom automatisk publicering.

## 13. Reproducerbarhet och regressionstest

Programdataset:

```bash
python3 scripts/validate_dataset.py
```

Kuraterade riksdagsvoteringar:

```bash
python3 scripts/validate_riksdagen_votes.py
```

Generera en rå kandidatlista från Riksdagens dataset:

```bash
python3 scripts/sync_riksdagen_votes.py --rm 2025/26 --output /tmp/voteringar-202526.json
```

App/test:

```bash
npm test
node --check app.js
node --check src/core.js
```

Testerna verifierar bland annat source-ID:n, canonical-sammanslagning, plattitydregressioner, voteringskohesion, avstående/för låg beslutsmängd, stöd/motstånd-riktning, source-aware sampling och att partikällor hålls dolda tills användaren svarat.

GitHub Actions kör validatorer, tester och syntaxkontroll på pull requests och på `main`.
