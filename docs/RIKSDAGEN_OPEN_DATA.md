# Riksdagens öppna data: voteringsmetod

## Syfte

Partiprogram visar vad partier säger att de vill göra. Voteringar visar hur riksdagens ledamöter faktiskt röstar när ett konkret förslag ställs under proposition. Val AI-kompassen använder därför utvalda direkta sakvoteringar som ett andra källager.

Den första voteringsversionen avgränsas till mandatperioden 2022–2026 (riksmötena 2022/23, 2023/24, 2024/25 och 2025/26).

Källa: Sveriges riksdag, öppna data: `https://www.riksdagen.se/sv/dokument-och-lagar/riksdagens-oppna-data/`.

## En rå Ja-röst är inte automatiskt sakpolitiskt stöd

Riksdagen röstar om en bestämd **förslagspunkt**. Ofta står utskottets förslag mot en reservation. Därför måste tre saker granskas tillsammans innan en votering kan bli kompassfråga:

1. vilken förslagspunkt voteringen gäller,
2. vad ett Ja till huvudförslaget faktiskt innebär,
3. vilket motförslag eller vilken reservation ett Nej i just den voteringen representerar.

Det är alltså metodfel att enbart läsa kolumnen `rost = Ja` och översätta den till stöd för en självvald sakpolitisk formulering.

## Voteringar som exkluderas

Följande går normalt inte in i kompassen:

- procedurfrågor,
- voteringar där förslagspunkten främst gäller avslag på en motion och motpositionen därför är oklar,
- följdmotioner som inte isolerar den sakpolitiska konflikt vi vill mäta,
- beslutspaket där flera politiskt separerbara reformer röstats igenom samtidigt och en enda användarfråga skulle kräva att väljaren håller med om allt,
- frågor vars Ja/Nej-riktning inte kan beskrivas neutralt och entydigt,
- voteringar där nästan alla partier står på samma sida och frågan därför saknar diskriminerande värde.

Hellre exkluderas en intressant votering än att en partiomröstning övertolkas.

## Från ledamotsröster till partiposition

Riksdagens data innehåller ledamotsnivå: Ja, Nej, Avstår och Frånvarande. Kompassen gör inte frånvaro eller avstående till en politisk position.

För en viss partigrupp kodas `support` eller `oppose` endast när:

- minst **3** ledamöter från partiet har avgivit Ja eller Nej, och
- minst **80 %** av dessa avgivna Ja/Nej-röster går i samma riktning.

Om kraven inte är uppfyllda lämnas partiet **okodat** på frågan. Det gäller exempelvis när partiet huvudsakligen avstår.

Trösklarna finns per voteringspost i `data/riksdagen/votes.json`, så de är transparenta och testbara.

## Samma fråga, flera källor

Om en riksdagsomröstning motsvarar en sakfråga som redan finns i programbanken ska den inte skapa en dubblett. Frågan ställs en gång och kan bära både programkälla och voteringskälla.

Flera källor ger **inte** större poängvikt. De stärker bara källstödet.

Om programkälla och voteringskälla skulle placera samma parti på motsatta sidor av exakt samma canonical-fråga stoppar appens databyggare sammanslagningen. Konflikten måste då granskas manuellt; den får inte lösas genom att en källa prioriteras tyst.

## Kuraterad bank kontra genererad kandidatlista

`scripts/sync_riksdagen_votes.py` kan ladda ned riksdagens voteringsdataset och sammanställa ledamotsröster per omröstning. Resultatet är endast en **kandidatlista**.

Den fil som appen använder är i stället `data/riksdagen/votes.json`. Varje post där är manuellt granskad mot förslagspunkten och har en neutral, konkret kompassformulering.

Detta är samma arkitektur som för partiprogrammen: automatisering hjälper oss hitta material, men den slutliga frågebanken har en mänsklig kvalitetsgrind.

## Första kuraterade voteringsuppsättningen

Den första versionen innehåller bland annat frågor om:

- Sveriges Nato-medlemskap,
- säkerhetszoner,
- preventiva vistelseförbud,
- anonyma vittnen,
- reduktionsplikten,
- åldersgränsen för avgiftsfri tandvård,
- gårdsförsäljning av alkohol,
- statlig finansiering och riskdelning för ny kärnkraft.

Nato-frågan sammanfogas med befintligt programstöd i stället för att visas två gånger.

## Reproducerbarhet

Validera den kuraterade voteringsbanken med:

```bash
python3 scripts/validate_riksdagen_votes.py
```

Skapa en ny rå kandidatlista från Riksdagens dataset med exempelvis:

```bash
python3 scripts/sync_riksdagen_votes.py --rm 2025/26 --output /tmp/voteringar-202526.json
```

Den genererade filen ska aldrig kopieras automatiskt till den publika frågebanken.
