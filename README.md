# HGSS Breeding Planner

Monorepo scaffold for a Pokémon HeartGold/SoulSilver breeding planner.

## Packages

- `@hgss-breeding-planner/core` – core HG/SS breeding logic.
- `@hgss-breeding-planner/data` – static egg group dataset.
- `@hgss-breeding-planner/cli` – command-line interface.
- `@hgss-breeding-planner/web` – Next.js web frontend.

## Development

```bash
npm install
npm test
```

### CLI usage

```
npm run build -w @hgss-breeding-planner/cli
node apps/cli/dist/index.js rank --parents parents.csv --target target.json
node apps/cli/dist/index.js plan --parents parents.csv --target target.json
```
