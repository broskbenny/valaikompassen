# Metod: källmaterial, frågor och poäng

## 1. Källurval

För varje av de åtta partier som sitter i riksdagen används det senaste officiella långsiktiga grundprogram som partiet självt publicerar: **partiprogram**, **idéprogram** eller **principprogram**. Valplattformar, valmanifest, budgetmotioner och enskilda sakpolitiska webbsidor ingår inte i denna dataversion.

Källregistret finns i `data/sources.json` och innehåller dokumentets officiella URL, dokumenttyp och besluts-/versionsår. När ett äldre antaget program har senare officiella uppdateringar används den senast publicerade programversionen; Liberalernas program är exempelvis antaget 2013 men datasetet använder versionen med landsmötesuppdateringar till och med 2023.

## 2. Vad räknas som ett påstående?

Två typer tas med:

- `proposal`: ett konkret förslag om vad stat, kommun, EU, arbetsmarknad eller annan samhällsaktör ska göra eller hur ett system ska utformas.
- `position`: ett tydligt normativt politiskt ställningstagande som går att hålla med eller inte hålla med om, även om programmet inte anger ett exakt genomförande.

Historik, problembeskrivningar, retorik, allmänna värdeord och rena faktapåståenden ska inte bli valkompassfrågor.

## 3. Redigering

Påståendet i `statement` är en **neutral, kort parafras**, inte ett citat. Det ska:

1. kunna förstås utan omgivande brödtext,
2. innehålla endast ett huvudsakligt ställningstagande,
3. undvika partinamn och kampanjspråk,
4. behålla den politiskt avgörande riktningen och eventuella viktiga begränsningar,
5. gå att besvara på skalan mycket dåligt / dåligt / bra / mycket bra / vet ej.

Vid tvekan delas en källa upp i flera påståenden i stället för att bygga en lång sammansatt fråga.

## 4. Källspårbarhet

Varje kuraterat påstående måste ha:

- `document_id`,
- 1-baserad PDF-sida (`pdf_page`),
- närmaste rubrik/avsnitt (`section`).

Källans URL lagras centralt i `data/sources.json`. I appen hålls partikällan dold tills användaren har svarat på frågan. Därefter går originaldokumentet att öppna direkt.

## 5. Granskning

`review.status = curated` betyder att påståendet har lästs mot den angivna källpassagen och omskrivits för valkompassformat. Maskinellt framtagna kandidater får inte exponeras för användare innan de är kuraterade.

Dataset v0.1 är en stor första kuraterad passering, inte ett påstående om att varje möjlig sakpolitisk formulering i programmen redan har extraherats. En separat täckningsaudit finns som uppföljningsarbete.

## 6. Frågeurval

Appen använder inte uniform slumpning över samtliga rader. `selectBalancedQuestions()` gör följande:

1. grupperar posterna efter `source_party`,
2. ger varje parti samma kvot när vald frågelängd är jämnt delbar med åtta,
3. försöker varva ämnesområden inom respektive partis kvot,
4. blandar därefter hela frågeordningen.

Standardomgången är 48 frågor, alltså sex påståenden per parti. Alternativen 24 och 80 ger tre respektive tio per parti.

Detta hindrar att ett parti får större vikt enbart för att dess program eller extraktion innehåller fler detaljerade poster.

## 7. Svarsskala

Svarsvärdena är:

| Svar | Värde |
|---|---:|
| Mycket dåligt | -2 |
| Dåligt | -1 |
| Bra | +1 |
| Mycket bra | +2 |
| Vet ej / ingen åsikt | exkluderas |

Det finns avsiktligt inget neutralt mittalternativ. `Vet ej` betyder att användaren inte vill att frågan ska påverka poängen.

## 8. MVP-poängen: programaffinitet

Rådatasetet säger säkert att **källpartiet** uttrycker ett ställningstagande. Det säger inte säkert vad de sju andra partierna tycker om exakt samma neutrala formulering.

Därför beräknar MVP:n inte en klassisk åtta-partiers positionsmatchning. I stället beräknas en transparent **programaffinitet** separat för varje parti:

1. ta endast frågor i omgången vars `source_party` är det aktuella partiet,
2. uteslut `vet ej`,
3. beräkna medelvärdet på skalan `-2…+2`,
4. skala linjärt till `0…100` med formeln `(mean + 2) / 4 * 100`,
5. redovisa samtidigt hur många sakliga svar som ligger bakom poängen.

Appen visar även en enkel täckningsindikator:

- `låg`: färre än 5 sakliga svar,
- `medel`: 5–8,
- `hög`: minst 9.

Indikatorn är inte ett statistiskt konfidensintervall; den är bara en tydlig signal om hur tunt eller brett underlag användaren har lämnat.

## 9. Viktig begränsning för klassisk partimatchning

Att ett påstående kommer från parti X betyder bara att parti X uttrycker den ståndpunkten i sitt program. Det räcker **inte** för att anta positionen hos alla åtta partier.

Nästa datalager ska därför gruppera semantiskt likvärdiga frågor i `canonical_issue_id` och koda **samtliga partiers position** på samma fråga, exempelvis `support`, `oppose`, `mixed` och `not_stated`, med separat källstöd för varje kodning.

Först när den matrisen är tillräckligt komplett bör appen lägga till en traditionell partinärhetspoäng. Programaffiniteten kan då behållas som en separat transparent vy.

## 10. Reproducerbarhet och test

`python3 scripts/validate_dataset.py` verifierar datalagrets strukturella integritet. Node-testsviten verifierar bland annat:

- JSONL-parsning,
- lika många frågor per parti i standardomgången,
- ämnesdiversifiering,
- poängskalning,
- att `vet ej` inte påverkar poängen,
- att de centrala appvyerna och svarsalternativen finns.

GitHub Actions kör datasetvalidator, tester och syntaxkontroll på pull requests och på `main`.
