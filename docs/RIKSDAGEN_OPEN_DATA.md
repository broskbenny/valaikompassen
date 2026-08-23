# Riksdagens öppna data: voteringsmetod

## Syfte

Partiprogram visar vad partier säger att de vill göra. Voteringar visar hur riksdagens ledamöter faktiskt röstar när ett konkret förslag ställs under proposition. Val AI-kompassen använder därför utvalda direkta sakvoteringar som ett andra källager.

Voteringslagret avgränsas till mandatperioden 2022–2026: riksmötena 2022/23, 2023/24, 2024/25 och 2025/26.

## En rå Ja-röst är inte automatiskt sakpolitiskt stöd

Riksdagen röstar om en bestämd **förslagspunkt**. Ofta står utskottets förslag mot en reservation. Tre saker måste därför granskas tillsammans:

1. vilken förslagspunkt voteringen gäller,
2. vad ett Ja till huvudförslaget faktiskt innebär,
3. vilket motförslag eller vilken reservation ett Nej representerar.

Det är metodfel att enbart läsa `rost = Ja` och översätta den till stöd för en självvald politisk formulering.

## Exklusionsregeln

Följande går normalt inte in i kompassen:

- procedurfrågor,
- tvetydiga avslagsvoteringar,
- reservationer som inte isolerar den konflikt vi vill mäta,
- beslutspaket med flera politiskt separerbara reformer,
- frågor vars Ja/Nej-riktning inte kan beskrivas neutralt och entydigt,
- voteringar utan en meningsfull politisk motposition.

`data/riksdagen/votes.json` innehåller också `excluded_examples` för att göra gränsdragningen testbar. I v0.2 dokumenteras bland annat varför 2025/26:JuU48 punkt 1 och 2025/26:JuU42 punkt 1 inte används: de innehåller för många separerbara straffrättsliga förändringar för att en knapptryckning säkert ska kunna tillskrivas en enda av dem.

## Från ledamotsröster till partiposition

Riksdagens data innehåller Ja, Nej, Avstår och Frånvarande på ledamotsnivå. Frånvaro och avstående blir aldrig en position.

För en partigrupp kodas `support` eller `oppose` endast när:

- minst **3** ledamöter har avgivit Ja eller Nej, och
- minst **80 %** av dessa avgivna Ja/Nej-röster går i samma riktning.

Annars lämnas partiet okodat på frågan.

## Samma fråga, flera källor

Om en votering motsvarar en redan existerande sakfråga skapas ingen dubblett. Frågan kan bära både programkälla och voteringskälla, men den räknas fortfarande högst en gång per parti.

Om källorna ger motsatt position för samma parti på exakt samma fråga stoppas sammanslagningen för manuell granskning.

## Relaterat är inte samma sak

Voteringar skapar lätt flera frågor inom samma konfliktområde. Därför finns `data/issue-clusters.json`.

Exempelvis grupperas följande i samma kärnkraftsfamilj men hålls strikt separata:

- om Sverige på sikt ska ha kärnkraft,
- om staten ska finansiera och riskdela investeringar i ny kärnkraft,
- om förbud mot kärntekniska anläggningar i vissa kustområden ska tas bort.

Klustret påverkar endast frågespridningen. Det ändrar inte formulering, partiposition eller poäng.

## Kuraterad bank kontra kandidatlista

`scripts/sync_riksdagen_votes.py` kan hämta riksdagens voteringsdataset och skapa en bred kandidatlista. Den fil som appen använder är däremot `data/riksdagen/votes.json`, där varje rad är manuellt granskad.

Automatisering hittar material; den publicerar inte politiska tolkningar.

## Voteringsbank v0.2

Den kuraterade banken innehåller **11** direkta omröstningar. Utöver den första uppsättningen har tre tydligt separerade beslutspunkter från riksmötet 2025/26 lagts till:

- `2025/26:NU24`, punkt 1: lagändringar som öppnar fler utpekade kustområden för kärntekniska anläggningar,
- `2025/26:JuU41`, punkt 2: sänkt straffbarhetsålder till 14 år för allvarliga brott under fem år,
- `2025/26:JuU40`, punkt 2: införandet av brottet missbruk av offentlig ställning.

De används just därför att Riksdagen har brutit ut den relevanta konflikten som en egen förslagspunkt.

## Reproducerbarhet

```bash
python3 scripts/validate_riksdagen_votes.py
python3 scripts/validate_issue_clusters.py
python3 scripts/sync_riksdagen_votes.py --rm 2025/26 --output /tmp/voteringar-202526.json
```

Den genererade kandidatfilen ska aldrig kopieras automatiskt till den publika frågebanken.
