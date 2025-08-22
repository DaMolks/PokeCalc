#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import {
  Parent,
  Target,
  rankPairsFromRoster,
  planBreedingChain
} from '@hgss-breeding-planner/core';
import { speciesEggGroups } from '@hgss-breeding-planner/data';
import { ingestSave } from '@hgss-breeding-planner/save-ingest';

const program = new Command();
program.name('hgss-breed').description('HGSS breeding planner');

function readParents(file: string): Parent[] {
  const csv = fs.readFileSync(file, 'utf8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  return records.map((r: any) => ({
    species: r.species,
    ivs: { hp: +r.hp, atk: +r.atk, def: +r.def, spa: +r.spa, spd: +r.spd, spe: +r.spe },
    nature: r.nature,
    ability: r.ability,
    language: r.language || 'en'
  }));
}

function readTarget(file: string): Target {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeParents(file: string, parents: Parent[], append = false) {
  const header = 'species,hp,atk,def,spa,spd,spe,nature,ability,language';
  const rows = parents.map(p =>
    [
      p.species,
      p.ivs.hp,
      p.ivs.atk,
      p.ivs.def,
      p.ivs.spa,
      p.ivs.spd,
      p.ivs.spe,
      p.nature,
      p.ability,
      p.language || 'en'
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  fs.writeFileSync(file, csv, { flag: append ? 'a' : 'w' });
}

program
  .command('rank')
  .requiredOption('--parents <file>')
  .requiredOption('--target <file>')
  .option('--seed <seed>', 'RNG seed', '1')
  .option('--eggs <n>', 'number of simulations', '1000')
  .option('--out <file>')
  .action(opts => {
    const roster = readParents(opts.parents);
    const target = readTarget(opts.target);
    const abilities: Record<string, [string, string]> = {};
    const res = rankPairsFromRoster(
      roster,
      abilities,
      target,
      speciesEggGroups as any,
      BigInt(opts.seed),
      +opts.eggs
    );
    const csv = res
      .map(r => `${r.a.species},${r.b.species},${r.probability.toFixed(4)}`)
      .join('\n');
    if (opts.out) fs.writeFileSync(opts.out, csv);
    else console.log(csv);
  });

program
  .command('plan')
  .requiredOption('--parents <file>')
  .requiredOption('--target <file>')
  .option('--seed <seed>', 'RNG seed', '1')
  .option('--eggs <n>', 'simulations per step', '200')
  .option('--beam <n>', 'beam width', '3')
  .option('--format <fmt>', 'md|json|csv', 'md')
  .option('--out <file>')
  .action(opts => {
    const roster = readParents(opts.parents);
    const target = readTarget(opts.target);
    const plans = planBreedingChain(roster, target, {
      seed: BigInt(opts.seed),
      trials: +opts.eggs,
      beamWidth: +opts.beam
    });
    let out = '';
    if (opts.format === 'json') {
      out = JSON.stringify(plans, null, 2);
    } else if (opts.format === 'csv') {
      const rows = plans.flatMap(p =>
        p.steps.map((s, idx) =>
          [
            p.description,
            idx + 1,
            s.parents[0].species,
            s.parents[1].species,
            s.probability.toFixed(4)
          ].join(',')
        )
      );
      out = ['plan,step,parentA,parentB,probability', ...rows].join('\n');
    } else {
      out = plans
        .map(p => {
          const header = `## ${p.description} (p=${p.probability.toFixed(4)}, eggs=${p.eggs.toFixed(1)})`;
          const steps = p.steps
            .map((s, idx) => {
              const parents = `${s.parents[0].species}/${s.parents[1].species}`;
              return `${idx + 1}. ${parents} p=${s.probability.toFixed(4)}`;
            })
            .join('\n');
          return `${header}\n${steps}`;
        })
        .join('\n\n');
    }
    if (opts.out) fs.writeFileSync(opts.out, out);
    else console.log(out);
  });

program
  .command('ingest')
  .requiredOption('--save <file>')
  .option('--species <names>', 'comma-separated species filter')
  .option('--out <file>', 'CSV file to append to', 'parents.csv')
  .action(opts => {
    const buf = fs.readFileSync(opts.save);
    const filter = opts.species ? opts.species.split(',') : undefined;
    const parsed = ingestSave(buf, filter);
    writeParents(opts.out, parsed, fs.existsSync(opts.out));
    console.log(`Added ${parsed.length} parents to ${opts.out}`);
  });

program.parse();
