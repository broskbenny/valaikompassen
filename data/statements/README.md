# Statement dataset

`*.jsonl` innehåller en kuraterad första extraktion av sakpolitiska förslag och ställningstaganden från de åtta riksdagspartiernas senaste officiella långsiktiga grundprogram.

## Status

- Datasetversion: `0.1.0`
- Datum: `2026-08-21`
- Antal råposter: **371**
- Alla poster har dokument-id, PDF-sida och avsnitt.
- Alla poster är neutrala parafraser, inte citat.
- Fältet `canonical_issue_id` i råposterna är ännu `null`; canonical-sammanslagningen hanteras tills vidare separat i `../question-bank.json`.

## Viktigt: råpost är inte automatiskt kompassfråga

Det här katalogträdet är det breda källspårade råmaterialet. En korrekt programparafras kan fortfarande vara för allmän, självrättfärdigande eller okontroversiell för att fungera som valkompassfråga.

Appen använder därför **inte** alla 371 poster. `../question-bank.json` innehåller det hårdare kompasslagret med singleton-frågor och gemensamma canonical-frågor.

En råpost kan alltså:

- godkännas som egen kompassfråga,
- användas som källstöd för en gemensam canonical-fråga,
- användas som explicit motposition till en canonical-fråga,
- eller ligga kvar enbart som källmaterial och aldrig visas i kompassen.

Plattityder och formuleringar där svaret byggs in genom ord som “bättre”, “nödvändigt” eller “effektivt” får ligga kvar här för transparens utan att exponeras i frågeflödet.

## Fördelning

| Parti | Antal råposter |
|---|---:|
| S | 53 |
| M | 34 |
| SD | 44 |
| C | 41 |
| V | 55 |
| KD | 43 |
| MP | 50 |
| L | 51 |

Se `index.json` för ämnes- och typfördelning och `../question-bank.json` för kompassens handgranskade frågebank.

## Format

En rad = ett JSON-objekt. Exempel:

```json
{
  "id": "S-2025-001",
  "source_party": "S",
  "type": "proposal",
  "topic": "demokrati",
  "subtopic": "statschef",
  "statement": "Monarkin ska avskaffas och statschefen utses demokratiskt.",
  "source": {
    "document_id": "S-2025",
    "pdf_page": 25,
    "section": "Demokrati",
    "locator_note": null
  },
  "review": {
    "status": "curated",
    "confidence": "high",
    "notes": null
  },
  "canonical_issue_id": null
}
```

## Appanvändning

Frågeflödet byggs av `../question-bank.json`. Partierna bakom en fråga hålls dolda tills användaren har svarat. När flera partier delar samma sakpolitiska kärna ställs frågan en gång och de olika källparafraserna visas efter svaret.

Urvalet balanserar källkodad partitäckning och ämnesvariation men tvingar inte fram lika stora partikvoter. Det gör att frågekvaliteten kan hållas konstant även när partiprogrammen skiljer sig i detaljnivå.

Se `../../docs/METHODOLOGY.md` för sammanslagnings- och poängregler.
