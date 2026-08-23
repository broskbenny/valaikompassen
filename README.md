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

## Nuvarande omfattning

- **371** källspårade programrader
- programbank v0.3 med **99** unika programbaserade sakfrågor
- voteringsbank v0.2 med **11** manuellt granskade direkta riksdagsomröstningar
- Nato-voteringen sammanfogas med en redan existerande programfråga
- totalt **109 unika synliga sakfrågor** i den kombinerade banken
- **8 relaterade frågefamiljer** som hjälper urvalet att sprida närliggande men separata politiska beslut
- 24, 48 eller 80 frågor per omgång

## Fem lager

### 1. Programrådata

`data/statements/*.jsonl` innehåller den breda källspårade programutvinningen. En korrekt programparafras är inte automatiskt en bra valkompassfråga.

### 2. Kvalitetsgrinden

`data/question-bank.json` innehåller den hårdare programbaserade frågebanken. En fråga måste innebära ett verkligt politiskt val där en seriös motposition är möjlig. Plattityder, abstrakta maximer och självrättfärdigande villkor sorteras bort.

### 3. Canonical-frågor: bara verkligt samma sak

När flera källor uttrycker samma politiska kärna kan de sammanföras till en enda synlig fråga. Det gäller även när samma sak finns både i ett program och i en faktisk riksdagsvotering. Flera källor ger aldrig extra poängvikt.

Om två källor skulle koda samma parti på motsatta sidor av exakt samma fråga stoppas sammanslagningen för manuell granskning.

### 4. Relaterade frågefamiljer: lika område, olika beslut

`data/issue-clusters.json` löser ett annat problem. Två frågor kan vara tydligt relaterade utan att vara semantiskt identiska.

Exempel: kärnkraftens långsiktiga roll, statlig finansiering av nya reaktorer och vilka kustområden som får användas för kärntekniska anläggningar hör till samma konfliktfamilj men är tre olika politiska beslut. De får därför **inte** slås ihop.

Frågefamiljerna används som en diversitetsbroms i sampling:

- en redan använd frågefamilj får en mjuk urvalsnackdel,
- frågor från samma familj läggs inte direkt efter varandra när det går att undvika,
- partipositioner, formuleringar och poäng förblir helt separata.

Detta minskar risken att ett område väger tyngre bara för att Riksdagen råkat votera många gånger om närliggande frågor.

### 5. Direkta riksdagsomröstningar

`data/riksdagen/votes.json` innehåller den manuellt granskade voteringsbanken. Version 0.2 innehåller elva sakvoteringar, bland annat:

- Nato-medlemskap
- säkerhetszoner
- preventiva vistelseförbud
- anonyma vittnen
- reduktionsplikten
- åldersgränsen för avgiftsfri tandvård
- gårdsförsäljning
- statlig finansiering/riskdelning för ny kärnkraft
- fler tillåtna kustområden för kärnkraft
- sänkt straffbarhetsålder till 14 år för allvarliga brott
- brottet missbruk av offentlig ställning

De tre sistnämnda är nya direkta beslutspunkter från riksmötet 2025/26.

## Parlamentarisk tolkningsregel

En rå `Ja`-röst betyder **inte automatiskt** att partiet stödjer vilken sakpolitisk parafras som helst. För varje kandidat granskas den exakta förslagspunkten och motförslaget.

Procedurfrågor, tvetydiga avslagsvoteringar och beslutspaket som inte går att återge troget som en enda besvarbar fråga tas bort. `data/riksdagen/votes.json` dokumenterar även exempel på aktuella voteringar som uttryckligen har underkänts av detta skäl.

Partiets voteringsposition kodas bara när:

- minst 3 ledamöter från partiet har röstat Ja eller Nej, och
- minst 80 % av de avgivna Ja/Nej-rösterna går åt samma håll.

Avstående och frånvaro blir aldrig automatiskt en position. En splittrad eller huvudsakligen avstående partigrupp lämnas okodad.

## Sampling

Urvalet balanserar flera saker samtidigt:

1. källkodad partit­äckning,
2. ämnesvariation,
3. en avgränsad andel direkta voteringsfrågor, ungefär 20 % när materialet räcker,
4. variation mellan relaterade frågefamiljer.

Frågekvaliteten sänks aldrig för att fylla en partikvot eller en källkvot.

## Resultatet

Svar kodas som:

- mycket dåligt = `-2`
- dåligt = `-1`
- bra = `+1`
- mycket bra = `+2`
- vet ej = exkluderas

För en belagd stödposition används värdet direkt; för explicit motstånd vänds tecknet. Om ett parti saknar en källkodad position påverkas partiets poäng inte alls. Varje sakfråga räknas högst en gång per parti även om flera källor belägger samma position.

## Riksdagens rådata: ingest, inte automatisk publicering

`scripts/sync_riksdagen_votes.py` kan hämta riksdagens voteringsdataset och bygga kandidatlistor för 2022/23–2025/26. Kandidatlistan kopplas **aldrig automatiskt** till den publika frågebanken.

```bash
python3 scripts/sync_riksdagen_votes.py --rm 2025/26 --output /tmp/voteringar-202526.json
```

Varje kandidat måste därefter granskas mot förslagspunkten och motförslaget.

## Data och dokumentation

- Partiprogramkällor: `data/sources.json`
- Programrådata: `data/statements/*.jsonl`
- Program/canonical-bank: `data/question-bank.json`
- Kuraterade riksdagsvoteringar: `data/riksdagen/votes.json`
- Relaterade frågefamiljer: `data/issue-clusters.json`
- Voteringsmetod: `docs/RIKSDAGEN_OPEN_DATA.md`
- Övergripande metod: `docs/METHODOLOGY.md`

## Test och validering

```bash
python3 scripts/validate_dataset.py
python3 scripts/validate_riksdagen_votes.py
python3 scripts/validate_issue_clusters.py
npm test
node --check app.js
node --check src/core.js
```

CI kör samma kontroller vid pull requests och på `main`.

## Status

- [x] Källspårbart programdataset
- [x] Kvalitetsgrind mot plattityder och självrättfärdigande formuleringar
- [x] Canonical-frågor som sammanför verkligt likvärdiga positioner
- [x] Källstödd stöd-/motståndskodning
- [x] Kuraterat lager av direkta riksdagsvoteringar
- [x] 2025/26-voteringar med separata, tydligt tolkbara beslutspunkter
- [x] Partikohesionsregel för voteringsdata
- [x] Program/votering-sammanslagning utan dubbel vikt
- [x] Relaterade frågefamiljer utan semantisk sammanblandning
- [x] Klustermedveten sampling som minskar sakområdesövervikt
- [x] Ingestverktyg för Riksdagens öppna voteringsdataset
- [x] Validatorer, regressionstester och CI
- [ ] Fortsatt systematisk genomgång av relevanta sakvoteringar 2022–2026
- [ ] Fullare canonical-kodning av alla åtta partier på varje relevant sakfråga
- [ ] Kalibrering/viktning för en komplett traditionell valkompassmodell

Den publika banken är medvetet mindre än mängden tillgänglig rådata: frågekvalitet och korrekt parlamentarisk tolkning går före volym.
