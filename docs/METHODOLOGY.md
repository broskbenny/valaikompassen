# Metod: källmaterial och påståendeextraktion

## 1. Källurval

För varje av de åtta partier som sitter i riksdagen används det senaste officiella långsiktiga grundprogram som partiet självt publicerar: **partiprogram**, **idéprogram** eller **principprogram**. Valplattformar, valmanifest, budgetmotioner och enskilda sakpolitiska webbsidor ingår inte i denna första dataversion.

Källregistret finns i `data/sources.json` och ska alltid innehålla dokumentets officiella URL, dokumenttyp och besluts-/versionsår.

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

Källans URL lagras centralt i `data/sources.json` för att slippa duplicera den i varje rad.

## 5. Granskning

`review.status = curated` betyder att påståendet har lästs mot den angivna källpassagen och omskrivits för valkompassformat. Maskinellt framtagna kandidater får inte exponeras för användare innan de är kuraterade.

## 6. Viktig begränsning för senare matchning

Att ett påstående kommer från parti X betyder bara att parti X uttrycker den ståndpunkten i sitt program. Det räcker **inte** för att beräkna användarens närhet till alla åtta partier.

Nästa datalager behöver därför gruppera semantiskt likvärdiga frågor i `canonical_issue_id` och koda **samtliga partiers position** på samma fråga, inklusive `unknown/not_stated` när programmet inte ger stöd för en säker kodning. Annars skulle partier med mer detaljerade program eller fler extraherade frågor få en systematisk fördel/nackdel.

## 7. Slumpning i appen

Ren slumpning över alla rader rekommenderas inte. Appen bör använda stratifierad slumpning så att användaren får rimlig balans mellan ämnesområden och källpartier. Ordningen inom den balanserade poolen kan därefter randomiseras.

Partikällan bör vara dold medan användaren svarar och visas först efter svaret eller i en separat källvy, för att minska varumärkes-/partibias.
