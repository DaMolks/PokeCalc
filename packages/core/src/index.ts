/**
 * HG/SS breeding planner core logic (Gen IV).
 * References: Bulbapedia and Serebii for mechanics.
 */

export type Stat = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export interface IVs {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

export type Nature = string;
export type Ability = string;

export type Item =
  | { kind: 'None' }
  | { kind: 'Power'; stat: Stat }
  | { kind: 'Everstone' };

export interface Parent {
  species: string;
  ivs: IVs;
  nature: Nature;
  ability: Ability;
  item?: Item;
  language?: string; // ISO code
}

export interface Target {
  ivs: Partial<IVs>;
  nature?: Nature;
  ability?: Ability;
}

export interface BreedingOutcome {
  success: boolean;
  child: { ivs: IVs; nature: Nature; ability: Ability };
}

/** Seedable xorshift64 RNG. */
export class RNG {
  private state: bigint;
  constructor(seed: bigint) {
    this.state = seed;
  }
  next(): number {
    let x = this.state;
    x ^= x << 13n;
    x ^= x >> 7n;
    x ^= x << 17n;
    this.state = x;
    return Number(x & ((1n << 53n) - 1n)) / 2 ** 53;
  }
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

const STATS: Stat[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

export function sampleChildIVs(a: Parent, b: Parent, rng: RNG): IVs {
  const child: IVs = {
    hp: rng.nextInt(32),
    atk: rng.nextInt(32),
    def: rng.nextInt(32),
    spa: rng.nextInt(32),
    spd: rng.nextInt(32),
    spe: rng.nextInt(32)
  };

  const inherited = new Set<Stat>();
  const applyPower = (p: Parent) => {
    if (p.item && p.item.kind === 'Power') {
      if (!inherited.has(p.item.stat)) {
        child[p.item.stat] = p.ivs[p.item.stat];
        inherited.add(p.item.stat);
      }
    }
  };

  const aPower = a.item && a.item.kind === 'Power';
  const bPower = b.item && b.item.kind === 'Power';
  if (aPower && bPower) {
    if (rng.nextInt(2) === 0) applyPower(a); else applyPower(b);
  } else {
    applyPower(a);
    applyPower(b);
  }

  while (inherited.size < 3) {
    const stat = STATS.filter(s => !inherited.has(s))[rng.nextInt(6 - inherited.size)];
    const from = rng.nextInt(2) === 0 ? a : b;
    child[stat] = from.ivs[stat];
    inherited.add(stat);
  }
  return child;
}

/** Everstone rule: 50% chance unless international parents. */
export function sampleChildNature(a: Parent, b: Parent, rng: RNG): Nature {
  const aEver = a.item && a.item.kind === 'Everstone';
  const bEver = b.item && b.item.kind === 'Everstone';
  const international = a.language && b.language && a.language !== b.language;
  if (!international && (aEver || bEver)) {
    const holder = aEver && bEver ? (rng.nextInt(2) === 0 ? a : b) : aEver ? a : b;
    if (rng.nextInt(2) === 0) {
      return holder.nature;
    }
  }
  const natures = [
    'Hardy','Lonely','Brave','Adamant','Naughty',
    'Bold','Docile','Relaxed','Impish','Lax',
    'Timid','Hasty','Serious','Jolly','Naive',
    'Modest','Mild','Quiet','Bashful','Rash',
    'Calm','Gentle','Sassy','Careful','Quirky'
  ];
  return natures[rng.nextInt(natures.length)];
}

/** Ability selection: no inheritance bias in Gen IV (50/50). */
export function sampleChildAbility(abilities: [Ability, Ability], rng: RNG): Ability {
  return abilities[rng.nextInt(2)];
}

export function simulateOnce(a: Parent, b: Parent, abilities: [Ability, Ability], target: Target, rng: RNG): BreedingOutcome {
  const ivs = sampleChildIVs(a, b, rng);
  const nature = sampleChildNature(a, b, rng);
  const ability = sampleChildAbility(abilities, rng);
  const meetsIVs = Object.entries(target.ivs).every(([s, min]) => (ivs as any)[s] >= (min as number));
  const meetsNature = !target.nature || nature === target.nature;
  const meetsAbility = !target.ability || ability === target.ability;
  return { success: meetsIVs && meetsNature && meetsAbility, child: { ivs, nature, ability } };
}

export function simulateMany(a: Parent, b: Parent, abilities: [Ability, Ability], target: Target, seed: bigint, n: number) {
  const rng = new RNG(seed);
  let success = 0;
  for (let i = 0; i < n; i++) {
    if (simulateOnce(a, b, abilities, target, rng).success) success++;
  }
  return { probability: success / n };
}

export function bestItemsForPair(a: Parent, b: Parent, abilities: [Ability, Ability], target: Target, seed: bigint, trials = 1000) {
  const items: Item[] = [
    { kind: 'None' },
    { kind: 'Everstone' },
    { kind: 'Power', stat: 'hp' },
    { kind: 'Power', stat: 'atk' },
    { kind: 'Power', stat: 'def' },
    { kind: 'Power', stat: 'spa' },
    { kind: 'Power', stat: 'spd' },
    { kind: 'Power', stat: 'spe' }
  ];
  let best = { probability: 0, items: [{kind:'None'} as Item, {kind:'None'} as Item] };
  for (const ia of items) {
    for (const ib of items) {
      const pa = { ...a, item: ia };
      const pb = { ...b, item: ib };
      const res = simulateMany(pa, pb, abilities, target, seed, trials);
      if (res.probability > best.probability) {
        best = { probability: res.probability, items: [ia, ib] };
      }
    }
  }
  return best;
}

export function isCompatible(s1: string, s2: string, speciesEggGroups: Record<string, string[]>): boolean {
  const g1 = speciesEggGroups[s1.toLowerCase()] || [];
  const g2 = speciesEggGroups[s2.toLowerCase()] || [];
  if (g1.includes('Undiscovered') || g2.includes('Undiscovered')) return false;
  if (g1.includes('Ditto') || g2.includes('Ditto')) return true;
  return g1.some(g => g2.includes(g));
}

export function rankPairsFromRoster(roster: Parent[], abilities: Record<string, [Ability, Ability]>, target: Target, speciesEggGroups: Record<string, string[]>, seed: bigint, trials = 1000) {
  const result: { a: Parent; b: Parent; probability: number }[] = [];
  for (let i = 0; i < roster.length; i++) {
    for (let j = i + 1; j < roster.length; j++) {
      const p1 = roster[i];
      const p2 = roster[j];
      if (!isCompatible(p1.species, p2.species, speciesEggGroups)) continue;
      const abil = abilities[p1.species.toLowerCase()] || ['Ability1','Ability2'];
      const best = bestItemsForPair(p1, p2, abil as [Ability, Ability], target, seed, Math.floor(trials/10));
      result.push({ a: p1, b: p2, probability: best.probability });
    }
  }
  return result.sort((x,y) => y.probability - x.probability);
}

export function planBreedingChain(roster: Parent[], target: Target) {
  // Placeholder for heuristic planner (beam search, etc.).
  return [{ description: 'Direct breeding', parents: roster.slice(0,2) }];
}
