# Metod: källmaterial, frågekvalitet, sammanslagning och poäng

## 1. Källurval

För varje av de åtta partier som sitter i riksdagen används det senaste officiella långsiktiga grundprogram som partiet självt publicerar: **partiprogram**, **idéprogram** eller **principprogram**. Valplattformar, valmanifest, budgetmotioner och enskilda sakpolitiska webbsidor ingår inte i denna dataversion.

Källregistret finns i `data/sources.json` och innehåller dokumentets officiella URL, dokumenttyp och besluts-/versionsår. När ett äldre antaget program har senare officiella uppdateringar används den senast publicerade programversionen.

## 2. Råextraktionen är inte samma sak som frågebanken

`data/statements/*.jsonl` är ett **källspårbart råmaterial** med 371 kuraterade programrader. Det är medvetet bredare än de frågor som visas i appen. En formulering kan vara korrekt återgiven ur ett partiprogram och ändå vara för allmän, för retorisk eller för självrättfärdigande för att fungera som valkompassfråga.

Två typer finns i råmaterialet:

- `proposal`: ett förslag om vad stat, kommun, EU, arbetsmarknad eller annan samhällsaktör ska göra eller hur ett system ska utformas.
- `position`: ett normativt politiskt ställningstagande som går att hålla med eller inte hålla med om.

`review.status = curated` betyder att raden är källgranskad som programparafras. Det betyder **inte** att den automatiskt är godkänd för kompassen.

## 3. Kvalitetsgrinden

Den synliga frågebanken finns i `data/question-bank.json`. En fråga måste mäta ett **politiskt vägval**, inte om användaren gillar något allmänt positivt.

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

### 3.1 Motpositionstestet

Den viktigaste kontrollfrågan är:

> Kan en seriös politisk motståndare säga nej till påståendet utan att därmed behöva säga att den vill ha ett sämre samhälle?

Om svaret är nej är formuleringen normalt för platt för kompassen.

Därför sorteras meningar som i huvudsak säger att vården ska ha hög kvalitet, skolan ska vara bra, ekonomin stark, samhället tryggt eller politiken rättvis bort om de inte samtidigt innehåller ett konkret omstritt instrument.

### 3.2 Självrättfärdigande villkor

Även en till synes ideologisk mening kan vara en dålig fråga om argumentet för svaret är inbyggt i villkoret. Ord och fraser som **”lika bra eller bättre”**, **”nödvändigt”**, **”effektivt”**, **”rimligt”** eller liknande måste därför granskas särskilt.

Råposten `M-2021-009` är ett dokumenterat regressionsexempel:

> Det offentliga ska inte utföra uppgifter som andra kan göra lika bra eller bättre.

Problemen är två:

1. ett nej låter som ett krav på att välja en sämre utförare, eftersom ”lika bra eller bättre” redan avgör kvalitetsfrågan,
2. ordet ”uppgifter” döljer den verkliga politiska konflikten — sjukvård, skola, järnväg, sophämtning och polis är helt olika vägval.

Raden finns kvar som korrekt källparafras men är uttryckligen förbjuden i kompassbanken.

Samma princip utesluter bland annat `M-2021-031`, där ”hög kvalitet” och ”god tillgänglighet” gör frågan för allmänt positiv.

När en rå formulering är för vag föredrar vi att **utesluta den** framför att skriva om den till ett skarpare förslag som källan inte säkert stödjer.

## 4. Neutral redigering

Påståendet i rådatasetets `statement` är en **neutral, kort parafras**, inte ett citat. Det ska:

1. kunna förstås utan omgivande brödtext,
2. innehålla endast ett huvudsakligt ställningstagande,
3. undvika partinamn och kampanjspråk,
4. behålla den politiskt avgörande riktningen och viktiga begränsningar,
5. inte göras mer specifikt eller konfliktfyllt än källpassagen medger.

I frågebanken kan en synlig formulering ibland göras smalare än råparafrasen när den smalare kärnan klart stöds av samma källa. Exempelvis kan en sammansatt råmening om både EU- och Nato-medlemskap ge en synlig fråga endast om Nato. Den borttagna delen används då inte för att dra några slutsatser.

## 5. Gemensamma sakfrågor

Frågebank v0.3 skiljer mellan:

- `singleton_ids`: starka frågor där en källrad fortfarande motsvarar en egen synlig sakfråga,
- `canonical_questions`: gemensamma sakfrågor där flera program uttrycker samma politiska kärna.

Banken innehåller **81 singleton-frågor och 18 canonical-frågor, totalt 99 unika frågor**.

### 5.1 När får frågor slås ihop?

Två eller flera källrader får sammanföras när en neutral gemensam kärnformulering kan skrivas utan att någon källas politiska innebörd förstärks eller försvagas på ett avgörande sätt.

Exempel är:

- statligt huvudansvar för skolan,
- författningsdomstol,
- permanenta uppehållstillstånd som huvudregel,
- kärnvapen på svenskt territorium,
- abortskydd i grundlagen,
- behovsstyrd arbetskraftsinvandring.

### 5.2 När får frågor inte slås ihop?

Skillnader behålls som separata frågor när nyansen i sig är ett viktigt politiskt val. Ett tydligt exempel är arbetstid: en allmän riktning mot kortare arbetstid är inte automatiskt samma position som en lagstadgad 35-timmarsvecka.

Samma försiktighet gäller nivåer, tidsgränser, obligatoriska krav och olika grader av förbud.

### 5.3 Hur bevaras nyansen efter sammanslagning?

Före svaret visas endast den neutrala gemensamma frågan och inga partier.

Efter svaret visar appen varje partis **källnära råparafras**, dokument, sida och avsnitt. Därmed kan användaren se att partierna delar kärnposition men exempelvis anger olika villkor eller ambitionsnivåer.

## 6. Stöd och explicit motstånd

Varje canonical-fråga kan ha två källkodade sidor:

- `support`: programrader som uttryckligen stödjer den synliga formuleringen,
- `oppose`: programrader som uttryckligen intar motsatt position.

Opposition kodas endast när den går att belägga direkt. Frånvaro eller tystnad är **inte** opposition.

Det gör det möjligt att ställa en konflikt en gång i stället för som två spegelvända frågor. Exempel:

- om Sverige på sikt ska ha ett energisystem utan kärnkraft,
- om permanenta uppehållstillstånd ska vara huvudregel,
- om dagens skolval ska bevaras.

## 7. Källspårbarhet

Varje råpost måste ha:

- `document_id`,
- 1-baserad PDF-sida (`pdf_page`),
- närmaste rubrik/avsnitt (`section`).

Canonical-frågor innehåller endast referenser till sådana råposter. Källans URL lagras centralt i `data/sources.json`.

Partikällor hålls dolda tills användaren har svarat. Därefter visas samtliga källkodade programpositioner för frågan.

## 8. Frågeurval utan tvingade partikvoter

Tidigare krävdes minst tio godkända frågor från varje parti för att ge exakt 3, 6 eller 10 frågor per parti. Den regeln har tagits bort.

Skälet är metodiskt: programmen har olika detaljnivå. Om exakt lika kvoter är ett hårt krav skapas ett incitament att godkänna svagare formuleringar från mer abstrakta program.

`selectBalancedQuestions()` använder i stället en täckningsbalanserad sampling:

1. varje fråga kan bidra med källtäckning för ett eller flera partier,
2. algoritmen prioriterar partier som hittills har lägst täckning bland de återstående frågorna,
3. delade frågor räknas som täckning för alla explicit kodade partier,
4. ämnesvariation används som sekundär bonus,
5. när ett partis starka källmaterial är uttömt fortsätter urvalet utan att tillverka svagare frågor.

Alternativen 24, 48 och 80 anger därför antal **unika sakfrågor**, inte en fast partikvot.

## 9. Svarsskala

| Svar | Värde |
|---|---:|
| Mycket dåligt | -2 |
| Dåligt | -1 |
| Bra | +1 |
| Mycket bra | +2 |
| Vet ej / ingen åsikt | exkluderas |

Det finns avsiktligt inget neutralt mittalternativ. `Vet ej` betyder att användaren inte vill att frågan ska påverka poängen.

## 10. Källstödd sakfrågematchning

För varje besvarad fråga och parti med explicit källkodad position gäller:

1. `support`: användarens svarsvärde används direkt,
2. `oppose`: svarsvärdet multipliceras med `-1`,
3. `not_stated`: ingen poäng och ingen implicit position.

För varje parti beräknas sedan medelvärdet över de frågor där partiet faktiskt har en kodad position. Medelvärdet på `-2…+2` skalas linjärt till `0…100` med formeln `(mean + 2) / 4 * 100`.

Resultatvyn visar samtidigt hur många källkodade positioner i den aktuella omgången som användaren faktiskt har bedömt.

Detta är ett steg närmare traditionell partimatchning än den tidigare programaffiniteten, eftersom samma användarsvar nu kan jämföras mot flera partiers uttryckliga positioner.

## 11. Viktig begränsning

Positionsmatrisen är fortfarande **partiell**. Alla åtta partier är inte källkodade på varje sakfråga.

Därför gäller:

- avsaknad av programskrivning får aldrig tolkas som stöd eller motstånd,
- ett parti med färre konkreta programpositioner kan få ett tunnare underlag,
- poängen ska läsas tillsammans med antalet bedömda positioner,
- full traditionell valkompassmatchning kräver fortsatt canonical-kodning mot samtliga partier.

## 12. Reproducerbarhet och regressionstest

`python3 scripts/validate_dataset.py` verifierar rådatasetets strukturella integritet. Node-testsviten verifierar dessutom bland annat:

- JSONL-parsning,
- att samtliga käll-ID:n i frågebanken finns i råmaterialet,
- att samma källrad inte skapar dubbla synliga frågor,
- att samma parti inte kodas som både stöd och motstånd på samma canonical-fråga,
- att dokumenterade plattityder och självrättfärdigande formuleringar förblir exkluderade,
- att banken har minst 80 unika frågor för djup-läget,
- att täckningsbalanseringen fungerar utan hårda partikvoter,
- att explicit opposition vänder poängriktningen,
- att tystnad inte skapar en antagen position,
- att `vet ej` inte påverkar poängen,
- att partikällorna hålls dolda tills frågan är besvarad.

GitHub Actions kör datasetvalidator, tester och syntaxkontroll på pull requests och på `main`.
