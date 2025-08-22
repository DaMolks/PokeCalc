# HGSS Breeding Planner

Monorepo scaffold for a Pokémon HeartGold/SoulSilver breeding planner.

## Packages

- `@hgss-breeding-planner/core` – core HG/SS breeding logic.
- `@hgss-breeding-planner/data` – static egg group dataset.
- `@hgss-breeding-planner/save-ingest` – parse `.sav`/`.pk4` dumps (JSON fixtures in this repo) to parents.
- `@hgss-breeding-planner/cli` – command-line interface.
- `@hgss-breeding-planner/web` – Next.js web frontend.

## Development

```bash
npm install
npm test
```

### CLI usage

Build once then run commands via `npx tsx` for deterministic output:

```bash
# rank pairs
npx tsx apps/cli/src/index.ts rank --parents parents.csv --target target.json --seed 1 --eggs 1000

# plan breeding chain
npx tsx apps/cli/src/index.ts plan --parents parents.csv --target target.json --seed 1 --eggs 200 --beam 3 --format md

# ingest save fixture (.sav or .pk4)
npx tsx apps/cli/src/index.ts ingest --save sample.sav --out parents.csv
```

### Web

```
npm run dev -w @hgss-breeding-planner/web
```

Visit `/import-save` to test save ingestion.
