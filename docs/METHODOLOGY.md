# Metod: källmaterial, frågekvalitet, sammanslagning och poäng

## 1. Källor

Kompassen använder två typer av politiska förstahandskällor.

### 1.1 Långsiktiga partiprogram

För varje av de åtta riksdagspartierna används det senaste officiella långsiktiga grundprogram som partiet självt publicerar: **partiprogram**, **idéprogram** eller **principprogram**. Källregistret finns i `data/sources.json`.

### 1.2 Direkta riksdagsomröstningar

Som andra källager används utvalda direkta sakvoteringar från **Sveriges riksdags öppna data**. Voteringslagret avgränsas till mandatperioden 2022–2026, riksmötena 2022/23–2025/26.

Den kuraterade banken finns i `data/riksdagen/votes.json`. Den fulla voteringsmetoden beskrivs i `docs/RIKSDAGEN_OPEN_DATA.md`.

## 2. Råmaterial är inte frågebank

`data/statements/*.jsonl` innehåller 371 källspårade programrader. Riksdagens fulla voteringsdata är på motsvarande sätt ett mycket större råmaterial.

`scripts/sync_riksdagen_votes.py` får automatisera **upptäckt och sammanställning**, men ingen genererad votering exponeras automatiskt i appen. Båda källtyperna passerar en mänsklig kvalitetsgrind.

## 3. Kvalitetsgrinden

En synlig fråga måste mäta ett **politiskt vägval**, inte om användaren gillar något allmänt positivt.

Bra frågekärnor är exempelvis:

- förbud eller tillstånd,
- skatt, avgift, bidrag eller offentlig utgift,
- offentligt eller privat ägande och huvudmannaskap,
- rättighet, skyldighet eller kvalificeringskrav,
- en specificerad nivå, andel eller tidsgräns,
- institutionell förändring eller ansvarsfördelning,
- ett identifierbart politiskt styrmedel,
- ett konkret internationellt åtagande eller medlemskapsval.

### 3.1 Motpositionstestet

> Kan en seriös politisk motståndare säga nej till påståendet utan att därmed behöva säga att den vill ha ett sämre samhälle?

Om svaret är nej är formuleringen normalt olämplig.

### 3.2 Självrättfärdigande villkor

Ord som **”lika bra eller bättre”**, **”nödvändigt”**, **”effektivt”** eller **”rimligt”** kan baka in argumentet för svaret. Ett dokumenterat regressionsexempel är:

> Det offentliga ska inte utföra uppgifter som andra kan göra lika bra eller bättre.

Raden får finnas som korrekt programparafras men är spärrad från kompassen.

## 4. Neutral redigering

En kompassfråga ska:

1. kunna förstås utan omgivande brödtext,
2. innehålla ett tydligt huvudsakligt vägval,
3. undvika partinamn och kampanjspråk,
4. behålla avgörande villkor, nivåer och avgränsningar,
5. inte göras mer specifik än källan medger.

Om en källa innehåller flera politiskt separerbara komponenter ska den normalt inte göras till en enda fråga där väljaren måste ta ställning till allt samtidigt.

## 5. Canonical-frågor: exakt samma politiska kärna

Programbank v0.3 har 81 singleton-frågor och 18 canonical-frågor, totalt 99 programbaserade sakfrågor före voteringslagret.

Flera källor får sammanföras bara när en neutral gemensam kärna kan skrivas utan att avgörande innebörd försvinner. Efter svaret visas de källnära formuleringarna separat.

När samma fråga finns i både program och votering ställs den fortfarande bara en gång. Flera källor multiplicerar aldrig poängen.

Om program och votering placerar samma parti på motsatta sidor av exakt samma canonical-fråga stoppas sammanslagningen för manuell granskning.

## 6. Relaterade frågefamiljer: liknande är inte identiskt

`data/issue-clusters.json` innehåller ett separat lager för frågor som är **politiskt relaterade men semantiskt skilda**.

Detta lager får aldrig:

- slå ihop två svar,
- kopiera en partiposition från en fråga till en annan,
- anta att två närliggande reformer har samma stöd,
- ge en fråga annan poängriktning eller vikt.

Det används endast för organisering, transparens och sampling.

Exempel: följande tillhör samma kärnkraftsfamilj men är tre olika beslut:

1. om Sverige långsiktigt ska ha ett energisystem utan kärnkraft,
2. om staten ska kunna finansiera och riskdela investeringar i nya reaktorer,
3. om lagförbud för kärntekniska anläggningar i vissa kustområden ska tas bort.

Samma princip gäller exempelvis skolans huvudmannaskap/skolval/friskolor och Nato-medlemskap/utländska baser/kärnvapen på svenskt territorium.

En fråga får ligga i högst en definierad frågefamilj. Klusterfilen valideras mot den faktiskt synliga kombinerade banken.

## 7. Hur en riksdagsvotering blir en fråga

En rå `Ja`-röst är inte automatiskt sakpolitiskt stöd. Riksdagen röstar om en bestämd **förslagspunkt**, ofta utskottets förslag mot en reservation.

Innan en votering får användas granskas:

1. vilken förslagspunkt som voteringen gäller,
2. vad ett Ja konkret innebär,
3. vad motförslaget eller reservationen innebär,
4. om konflikten kan återges som en neutral och besvarbar fråga.

Procedurfrågor, tvetydiga avslagsvoteringar och beslutspaket med flera separerbara konflikter exkluderas.

Det är uttryckligen förbjudet att plocka en intressant detalj ur ett större lagpaket och sedan behandla varje Ja-röst till paketet som stöd för just den detaljen.

Voteringsbank v0.2 innehåller **11** handgranskade omröstningar. Tre nya 2025/26-frågor har valts därför att den relevanta konflikten ligger i en separat förslagspunkt: NU24 punkt 1, JuU41 punkt 2 och JuU40 punkt 2.

## 8. Från ledamotsröster till partiposition

En partiposition kodas endast om:

- minst **3** ledamöter från partiet har avgivit Ja eller Nej, och
- minst **80 %** av de avgivna Ja/Nej-rösterna går åt samma håll.

`Avstår` och `Frånvarande` är aldrig automatiskt stöd eller motstånd. En splittrad eller huvudsakligen avstående partigrupp lämnas okodad.

## 9. Källspårbarhet

Programkällor sparar dokument-id, PDF-sida och avsnitt.

Voteringskällor sparar:

- riksmöte,
- betänkande,
- förslagspunkt,
- voteringsdatum,
- rubrik och beslutstext,
- officiell Riksdagen-länk,
- exakta Ja/Nej/Avstår/Frånvarande-tal per parti.

Partikällor hålls dolda tills användaren har svarat.

## 10. Kombinerad bank

Programbanken har 99 frågor. Voteringsbank v0.2 har 11 frågor. Nato-voteringen ersätter inte frågan utan läggs som ytterligare källstöd på samma sakfråga som en programrad.

Den kombinerade synliga banken innehåller därför **109 unika sakfrågor**.

## 11. Frågeurval

Urvalet använder inte hårda partikvoter. Algoritmen balanserar:

1. källkodad partitäckning,
2. ämnesvariation,
3. en avgränsad voteringsandel på ungefär 20 procent när materialet räcker,
4. variation mellan relaterade frågefamiljer.

När en fråga ur ett kluster redan har valts får ytterligare frågor ur samma kluster en **mjuk urvalsnackdel**. Det betyder inte att de förbjuds; en lång omgång kan fortfarande innehålla flera separata vägval ur samma område.

Efter urvalet ordnas frågorna så att två frågor från samma kluster inte ligger direkt efter varandra när det går att undvika.

Detta är en diversitetsmekanism, inte en poängvikt.

## 12. Svarsskala och poäng

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

En fråga räknas högst en gång per parti oavsett antal källor.

## 13. Begränsningar

Positionsmatrisen är fortfarande partiell och voteringsbanken är fortfarande kuraterad snarare än uttömmande.

Därför gäller:

- tystnad i program är aldrig opposition,
- frånvaro/avstående i votering är aldrig antagen position,
- splittrade partigrupper kan lämnas okodade,
- relaterade frågor är inte samma fråga,
- en hög täthet av voteringar inom ett område ska inte automatiskt ge området högre representation,
- fler voteringsfrågor ska tillkomma genom systematisk granskning, inte automatisk publicering.

## 14. Reproducerbarhet och regressionstest

```bash
python3 scripts/validate_dataset.py
python3 scripts/validate_riksdagen_votes.py
python3 scripts/validate_issue_clusters.py
python3 scripts/sync_riksdagen_votes.py --rm 2025/26 --output /tmp/voteringar-202526.json
npm test
node --check app.js
node --check src/core.js
```

Testerna verifierar bland annat programkällor, canonical-sammanslagning, dokumenterade kvalitetsregressioner, voteringskohesion, officiella voteringslänkar, underkända paketexempel, frågeklustermedlemskap, klusterdiversitet i sampling och att partikällor hålls dolda tills användaren svarat.

GitHub Actions kör validatorer, tester och syntaxkontroll på pull requests och på `main`.
