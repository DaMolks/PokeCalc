import { Parent } from '@hgss-breeding-planner/core';
import { createHash } from 'crypto';

export function ingestSave(buffer: Buffer, speciesFilter: string[] = []): Parent[] {
  const parents: Parent[] = [];
  const seen = new Set<string>();
  try {
    const raw = JSON.parse(buffer.toString('utf8'));
    const mons = Array.isArray(raw) ? raw : [raw];
    const filter = speciesFilter.map(s => s.toLowerCase());
    for (const m of mons) {
      if (filter.length && !filter.includes(m.species.toLowerCase())) continue;
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
    // unsupported format
  }
  return parents;
}
