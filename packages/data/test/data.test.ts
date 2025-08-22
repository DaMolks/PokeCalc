import { describe, it, expect } from 'vitest';
import { speciesEggGroups } from '../src';

describe('species egg groups', () => {
  it('contains eevee', () => {
    expect(speciesEggGroups['eevee']).toContain('Field');
  });
  it('contains charizard', () => {
    expect(speciesEggGroups['charizard']).toContain('Monster');
  });
  it('contains arcanine', () => {
    expect(speciesEggGroups['arcanine']).toContain('Field');
  });
});
