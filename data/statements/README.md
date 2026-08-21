# Statement dataset

`*.jsonl` innehåller en kuraterad första extraktion av sakpolitiska förslag och ställningstaganden från de åtta riksdagspartiernas senaste officiella långsiktiga grundprogram.

## Status

- Datasetversion: `0.1.0`
- Datum: `2026-08-21`
- Antal råposter: **371**
- Alla poster har dokument-id, PDF-sida och avsnitt.
- Alla poster är neutrala parafraser, inte citat.
- `canonical_issue_id` är ännu `null`: datasetet ska **inte** användas för klassisk partimatchning förrän samma sakfrågor har normaliserats och alla partiers positioner kodats.

## Viktigt: råpost är inte automatiskt kompassfråga

Det här katalogträdet är det breda källspårade råmaterialet. En korrekt programparafras kan fortfarande vara för allmän eller okontroversiell för att fungera som valkompassfråga.

Appen använder därför **inte** alla 371 poster. Godkända kompassfrågor väljs explicit i `../question-bank.json`, där varje fråga har klarat ett hårdare test: den ska uttrycka ett konkret politiskt vägval och ha en rimlig seriös motposition. Plattityder och allmänna mål kan ligga kvar här för käll- och analysändamål utan att exponeras i frågeflödet.

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

Se `index.json` för ämnes- och typfördelning och `../question-bank.json` för kompassens handgranskade allowlist.

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

Frågeflödet byggs endast av ID:n i `../question-bank.json`. Källpartiet hålls dolt tills användaren har svarat, och slumpningen stratifieras över parti och ämne så att ett mer detaljerat partiprogram inte dominerar.

För faktisk klassisk valmatchning behövs dessutom ett separat normaliseringslager. Se `../../docs/METHODOLOGY.md`.
