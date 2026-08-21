# Statement dataset

`*.jsonl` innehåller en kuraterad första extraktion av sakpolitiska förslag och tydliga ställningstaganden från de åtta riksdagspartiernas senaste officiella långsiktiga grundprogram.

## Status

- Datasetversion: `0.1.0`
- Datum: `2026-08-21`
- Antal ställningstaganden: **371**
- Alla poster har dokument-id, PDF-sida och avsnitt.
- Alla poster är neutrala parafraser, inte citat.
- `canonical_issue_id` är ännu `null`: datasetet ska **inte** användas för partimatchning förrän samma sakfrågor har normaliserats och alla partiers positioner kodats.

## Fördelning

| Parti | Antal |
|---|---:|
| S | 53 |
| M | 34 |
| SD | 44 |
| C | 41 |
| V | 55 |
| KD | 43 |
| MP | 50 |
| L | 51 |

Se `index.json` för ämnes- och typfördelning.

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

## Appanvändning i nästa steg

Frågetexten kan användas direkt i ett frågekort, men källpartiet bör döljas tills användaren svarat. Slumpningen bör vara stratifierad över parti och ämne så att ett mer detaljerat partiprogram inte dominerar frågeflödet.

För faktisk valmatchning behövs ett separat normaliseringslager. Se `docs/METHODOLOGY.md`.
