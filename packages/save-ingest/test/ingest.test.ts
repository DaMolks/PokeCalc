import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';
import { ingestSave } from '../src/index';

const pk4 = readFileSync(__dirname + '/fixtures/sample.pk4');
const sav = readFileSync(__dirname + '/fixtures/sample.sav');

describe('ingestSave', () => {
  it('parses parents and dedupes', () => {
    const res = ingestSave(pk4);
    expect(res.length).toBe(2);
    expect(res[0].species).toBe('Eevee');
  });
  it('filters by species', () => {
    const res = ingestSave(pk4, ['Arcanine']);
    expect(res.length).toBe(1);
    expect(res[0].species).toBe('Arcanine');
  });
  it('reads .sav structures', () => {
    const res = ingestSave(sav);
    expect(res.length).toBe(2);
    expect(res[1].species).toBe('Arcanine');
  });
});
