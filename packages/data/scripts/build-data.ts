// Script to fetch and build egg group data from Pok\u00e9API.
// Uses local caching to avoid repeated network calls.
// References: https://pokeapi.co/

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const CACHE_DIR = path.join(__dirname, '..', 'cache');

async function fetchSpecies(name: string) {
  const file = path.join(CACHE_DIR, name + '.json');
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
  const data = await res.json();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  // Example usage: fetch a few species and print egg groups
  const names = ['pikachu', 'bulbasaur'];
  for (const n of names) {
    const data = await fetchSpecies(n);
    console.log(n, data.egg_groups.map((g: any) => g.name));
  }
}

main();
