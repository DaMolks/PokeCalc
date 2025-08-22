import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';
import { ingestSave } from '../src/index';

const fixture = readFileSync(__dirname + '/fixtures/sample.pk4');

describe('ingestSave', () => {
  it('parses parents and dedupes', () => {
    const res = ingestSave(fixture);
    expect(res.length).toBe(2);
    expect(res[0].species).toBe('Eevee');
  });
  it('filters by species', () => {
    const res = ingestSave(fixture, ['Arcanine']);
    expect(res.length).toBe(1);
    expect(res[0].species).toBe('Arcanine');
  });
});
