# Val AI-kompassen 2026

En källspårbar, partiblind valkompass som kombinerar två typer av politiska förstahandskällor:

1. de åtta riksdagspartiernas senaste officiella långsiktiga parti-, idé- eller principprogram,
2. handgranskade direkta omröstningar från **Sveriges riksdags öppna data** under mandatperioden 2022–2026.

Appen visar ett konkret politiskt vägval i taget utan att avslöja partierna bakom positionerna. Efter svaret visas källorna och, för riksdagsvoteringar, de faktiska Ja/Nej/Avstår/Frånvarande-talen per parti.

## Kör appen

Projektet är byggt utan externa frontendberoenden.

```bash
python3 -m http.server 8000
```

Öppna `http://localhost:8000`. Alternativt: `npm run serve`.

## Vad som ingår

- 24, 48 eller 80 unika sakfrågor per omgång
- partiblint frågeflöde
- kvalitetsgrind mot plattityder, abstrakta maximer och självrättfärdigande formuleringar
- sammanslagning av semantiskt likvärdiga frågor mellan partier och källtyper
- explicit `support`/`oppose` när positionen kan beläggas
- **371** källspårade programrader
- programbank v0.3 med **99** unika frågor före sammanfogning med voteringslagret
- första voteringsbank med **8** handgranskade direkta riksdagsomröstningar
- Nato-frågan sammanfogas med befintlig programkälla, så den kombinerade banken innehåller **106 unika sakfrågor**
- källstödd sakfrågematchning där samma fråga aldrig får extra vikt bara för att den har flera källor
- source-aware sampling: direkta voteringsfrågor kompletterar programmaterialet utan att dominera en omgång
- lokal sessionsåterställning
- automatiska validatorer, regressionstester och CI

## Fyra lager

### 1. Programmens råmaterial

`data/statements/*.jsonl` innehåller 371 källspårade programparafraser. En korrekt programparafras är inte automatiskt en bra valkompassfråga.

### 2. Programmens kvalitetsgrind

`data/question-bank.json` innehåller den hårdare programbaserade frågebanken. En fråga måste innebära ett verkligt politiskt val där en seriös motposition är möjlig. Formuleringar som “hög kvalitet”, “lika bra eller bättre”, “nödvändigt” eller “effektivt” får inte bära själva argumentet för svaret.

Exempel på råposter som medvetet är spärrade:

> Det offentliga ska inte utföra uppgifter som andra kan göra lika bra eller bättre.

> Sjukvården ska präglas av hög kvalitet, god tillgänglighet och valfrihet.

### 3. Gemensamma canonical-frågor

När flera partier uttrycker samma sak ställs frågan en gång. Viktiga nyanser visas i källorna efter svaret. Uttryckligt motstånd kan kodas på samma fråga i stället för att skapa en spegelvänd dubblett.

### 4. Direkta riksdagsomröstningar

`data/riksdagen/votes.json` innehåller den manuellt granskade voteringsbanken. Den första versionen använder åtta konkreta sakvoteringar från mandatperioden 2022–2026, bland annat Nato, säkerhetszoner, preventiva vistelseförbud, anonyma vittnen, reduktionsplikt, tandvård, gårdsförsäljning och finansiering av ny kärnkraft.

En rå `Ja`-röst betyder **inte automatiskt** att partiet stödjer valkompassens formulering. För varje kandidat granskas den exakta förslagspunkten och motförslaget. Procedurfrågor, tvetydiga avslagsvoteringar och beslutspaket som inte går att återge troget i en enda fråga tas bort.

Detaljer: `docs/RIKSDAGEN_OPEN_DATA.md`.

## Hur partipositioner räknas från en votering

Partiets ledamöter kan rösta `Ja`, `Nej`, `Avstår` eller vara `Frånvarande`.

En voteringsposition kodas bara när:

- minst 3 ledamöter från partiet har röstat Ja eller Nej, och
- minst 80 % av de avgivna Ja/Nej-rösterna går åt samma håll.

Avstående och frånvaro blir aldrig automatiskt en position. En splittrad eller huvudsakligen avstående partigrupp lämnas okodad. I gårdsförsäljningsvoteringen lämnas exempelvis Centerpartiet okodat i stället för att en enda Ja-röst bland många avståenden görs till partiposition.

## Samma fråga från program och votering

Källor multiplicerar inte frågor eller poäng. Nato är ett exempel: Moderaternas programkälla och den direkta riksdagsvoteringen samlas på samma sakfråga.

Om program och votering skulle koda samma parti på motsatta sidor av exakt samma fråga kastar databyggaren ett fel. Konflikten måste granskas manuellt; appen väljer aldrig tyst en källa framför en annan.

## Sampling

Programbankens olika källtäckning används fortfarande utan hårda partikvoter. Den nya voteringskällan har dessutom en avgränsad målandel i urvalet: ungefär 20 % när tillräckligt många voteringsfrågor finns. Med den första banken innebär det 5 direkta voteringsfrågor i en 24-frågorsomgång och samtliga 8 i 48- och 80-frågorslägena.

När voteringsbanken växer kommer samma regel förhindra att hundratals riksdagsvoteringar tränger undan de långsiktiga programfrågorna.

## Resultatet

Svar kodas som:

- mycket dåligt = `-2`
- dåligt = `-1`
- bra = `+1`
- mycket bra = `+2`
- vet ej = exkluderas

För en belagd stödposition används värdet direkt; för explicit motstånd vänds tecknet. Om ett parti saknar en källkodad position påverkas partiets poäng inte alls. Varje sakfråga räknas högst en gång per parti även om både program och votering stödjer samma kodning.

Medelvärdet per parti skalas till `0–100`. Resultatvyn visar samtidigt hur många källkodade positioner som faktiskt ligger bakom poängen.

## Riksdagens rådata: ingest, inte automatisk publicering

`scripts/sync_riksdagen_votes.py` kan ladda ned riksdagens voteringsdataset och bygga en kandidatlista för 2022/23–2025/26. Kandidatlistan är **inte** en frågebank och kopplas aldrig automatiskt till appen.

Exempel:

```bash
python3 scripts/sync_riksdagen_votes.py --rm 2025/26 --output /tmp/voteringar-202526.json
```

Varje kandidat måste därefter granskas mot förslagspunkten och motförslaget innan den kan läggas i `data/riksdagen/votes.json`.

## Data och dokumentation

- Partiprogramkällor: `data/sources.json`
- Programrådata: `data/statements/*.jsonl`
- Program/canonical-bank: `data/question-bank.json`
- Kuraterade riksdagsvoteringar: `data/riksdagen/votes.json`
- Voteringsmetod: `docs/RIKSDAGEN_OPEN_DATA.md`
- Övergripande metod: `docs/METHODOLOGY.md`
- Datasetindex: `data/statements/index.json`
- JSON Schema: `schema/statement.schema.json`

## Test och validering

```bash
python3 scripts/validate_dataset.py
python3 scripts/validate_riksdagen_votes.py
npm test
node --check app.js
node --check src/core.js
```

CI kör samma kontroller vid pull requests och på `main`.

## Status

- [x] Källspårbart programdataset
- [x] Kvalitetsgrind mot plattityder och självrättfärdigande formuleringar
- [x] Canonical-frågor som sammanför överlappande programpositioner
- [x] Källstödd stöd-/motståndskodning
- [x] Första kuraterade lagret av direkta riksdagsvoteringar
- [x] Partikohesionsregel för voteringsdata
- [x] Program/votering-sammanslagning utan dubbel vikt
- [x] Ingestverktyg för Riksdagens öppna voteringsdataset
- [x] Validatorer, tester och CI
- [ ] Systematisk genomgång av alla relevanta sakvoteringar 2022–2026
- [ ] Fullare canonical-kodning av alla åtta partier på varje relevant sakfråga
- [ ] Kalibrering/viktning för en komplett traditionell valkompassmodell

Den publika banken är medvetet mindre än mängden tillgänglig rådata: frågekvalitet och korrekt parlamentarisk tolkning går före volym.
