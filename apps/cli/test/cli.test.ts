import { execFileSync, execSync } from 'child_process';
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { readFileSync, rmSync } from 'fs';
import os from 'os';

const root = path.resolve(__dirname, '../../..');
const build = () => {
  execSync('npm run build -w @hgss-breeding-planner/core', { cwd: root });
  execSync('npm run build -w @hgss-breeding-planner/data', { cwd: root });
  execSync('npm run build -w @hgss-breeding-planner/save-ingest', { cwd: root });
};
const cli = (...args: string[]) =>
  execFileSync('npx', ['tsx', 'apps/cli/src/index.ts', ...args], {
    cwd: root,
    encoding: 'utf8'
  });

beforeAll(build);

describe('cli', () => {
  it('ranks pairs', () => {
    const out = cli(
      'rank',
      '--parents', 'apps/cli/test/fixtures/parents.csv',
      '--target', 'apps/cli/test/fixtures/target.json',
      '--seed', '1',
      '--eggs', '10'
    );
    expect(out).toContain('Eevee');
  });
  it('plans breeding chain', () => {
    const out = cli(
      'plan',
      '--parents', 'apps/cli/test/fixtures/parents.csv',
      '--target', 'apps/cli/test/fixtures/target.json',
      '--seed', '1',
      '--eggs', '10',
      '--beam', '2'
    );
    expect(out).toContain('Direct breeding');
  });
  it('ingests saves', () => {
    const tmp = path.join(os.tmpdir(), 'parents.csv');
    try {
      cli(
        'ingest',
        '--save', 'packages/save-ingest/test/fixtures/sample.sav',
        '--out', tmp
      );
      const csv = readFileSync(tmp, 'utf8');
      expect(csv).toContain('species');
      expect(csv).toContain('Eevee');
    } finally {
      try { rmSync(tmp); } catch {}
    }
  });
});
