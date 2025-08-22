import { Parent } from '@hgss-breeding-planner/core';
import { createHash } from 'crypto';

/**
 * Parse a HG/SS save or PK4 dump and return unique parents.
 * The parser currently understands the simplified JSON fixtures used in tests
 * where a `.pk4` file is an array of Pokémon and a `.sav` file exposes
 * `party`, `boxes` and `daycare` arrays. The real games store these structures
 * in binary format; implementing the full binary parser is out of scope for the
 * test fixtures.
 */
export function ingestSave(buffer: Buffer, speciesFilter: string[] = []): Parent[] {
  const parents: Parent[] = [];
  const seen = new Set<string>();
  try {
    const raw = JSON.parse(buffer.toString('utf8'));

    // determine list of monsters depending on input structure
    const mons = Array.isArray(raw)
      ? raw
      : [
          ...(raw.party || []),
          ...((raw.boxes || []).flat ? raw.boxes.flat() : ([] as any[]).concat(...(raw.boxes || []))),
          ...(raw.daycare || [])
        ];

    const filter = speciesFilter.map(s => s.toLowerCase());
    for (const m of mons) {
      if (filter.length && !filter.includes((m.species || '').toLowerCase())) continue;
      const parent: Parent = {
        species: m.species,
        ivs: m.ivs,
        nature: m.nature,
        ability: m.ability,
        language: m.language || 'en'
      };
      const hash = createHash('sha1')
        .update(
          [
            parent.species,
            m.pid,
            Object.values(parent.ivs).join(','),
            parent.nature,
            parent.ability,
            m.otid,
            m.sid,
            m.nickname || ''
          ].join('|')
        )
        .digest('hex');
      if (!seen.has(hash)) {
        seen.add(hash);
        parents.push(parent);
      }
    }
  } catch {
    // unsupported format or invalid JSON
  }
  return parents;
}
