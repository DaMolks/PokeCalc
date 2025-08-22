import { describe, it, expect } from 'vitest';
import { Parent, RNG, sampleChildIVs, sampleChildNature, sampleChildAbility, Stat } from '../src';

const baseA: Parent = {
  species: 'pikachu',
  ivs: { hp: 1, atk: 2, def: 3, spa: 4, spd: 5, spe: 6 },
  nature: 'Timid',
  ability: 'Static',
  language: 'en'
};

const baseB: Parent = {
  species: 'pikachu',
  ivs: { hp: 6, atk: 5, def: 4, spa: 3, spd: 2, spe: 1 },
  nature: 'Jolly',
  ability: 'Static',
  language: 'en'
};

const STATS: Stat[] = ['hp','atk','def','spa','spd','spe'];

describe('sampleChildIVs', () => {
  it('inherits exactly three IVs', () => {
    const rng = new RNG(1n);
    const child = sampleChildIVs(baseA, baseB, rng);
    let count = 0;
    for (const s of STATS) {
      if (child[s] === baseA.ivs[s] || child[s] === baseB.ivs[s]) count++;
    }
    expect(count).toBe(3);
  });

  it('double Power items split their influence roughly 50/50', () => {
    const pa = { ...baseA, item: { kind: 'Power', stat: 'hp' as Stat } };
    const pb = { ...baseB, item: { kind: 'Power', stat: 'atk' as Stat } };
    const rng = new RNG(2n);
    let hpCount = 0;
    let atkCount = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const child = sampleChildIVs(pa, pb, rng);
      if (child.hp === pa.ivs.hp) hpCount++;
      if (child.atk === pb.ivs.atk) atkCount++;
    }
    expect(hpCount).toBeGreaterThan(0);
    expect(atkCount).toBeGreaterThan(0);
    expect(Math.abs(hpCount - atkCount)).toBeLessThan(n * 0.2);
  });
});

describe('Everstone', () => {
  it('passes nature about 50% of the time', () => {
    const pa = { ...baseA, item: { kind: 'Everstone' as const } };
    const pb = { ...baseB };
    const rng = new RNG(3n);
    let count = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (sampleChildNature(pa, pb, rng) === pa.nature) count++;
    }
    expect(count).toBeGreaterThan(400);
    expect(count).toBeLessThan(600);
  });

  it('fails if parents are international', () => {
    const pa = { ...baseA, item: { kind: 'Everstone' as const }, language: 'en' };
    const pb = { ...baseB, language: 'fr' };
    const rng = new RNG(4n);
    let count = 0;
    const n = 500;
    for (let i = 0; i < n; i++) {
      if (sampleChildNature(pa, pb, rng) === pa.nature) count++;
    }
    expect(count).toBeLessThan(50); // ~10%
  });
});

describe('Ability', () => {
  it('is 50/50 between species abilities', () => {
    const rng = new RNG(5n);
    const abilities: [string, string] = ['Static', 'Lightning Rod'];
    let count = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (sampleChildAbility(abilities, rng) === 'Static') count++;
    }
    expect(count).toBeGreaterThan(400);
    expect(count).toBeLessThan(600);
  });
});
