import { describe, it, expect } from 'vitest';
import { Parent, Target, planBreedingChain } from '../src';

const parentA: Parent = {
  species: 'pikachu',
  ivs: { hp: 31, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  nature: 'Timid',
  ability: 'Static'
};
const parentB: Parent = {
  species: 'pikachu',
  ivs: { hp: 0, atk: 31, def: 0, spa: 0, spd: 0, spe: 0 },
  nature: 'Jolly',
  ability: 'Static'
};
const target: Target = { ivs: { hp: 25, atk: 25 } };

describe('planBreedingChain', () => {
  it('returns plans including direct breeding', () => {
    const plans = planBreedingChain([parentA, parentB], target, { seed: 1n, trials: 100 });
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].steps.length).toBe(1);
    expect(plans[0].probability).toBeGreaterThan(0);
  });
});
