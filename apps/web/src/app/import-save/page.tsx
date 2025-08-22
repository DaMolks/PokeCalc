'use client';
import { useState } from 'react';
import { ingestSave } from '@hgss-breeding-planner/save-ingest';
import { Buffer } from 'buffer';

export default function ImportSave() {
  const [count, setCount] = useState(0);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const array = await file.arrayBuffer();
    const parents = ingestSave(Buffer.from(array));
    setCount(parents.length);
  }
  return (
    <main className="p-4">
      <h1 className="text-xl mb-2">Import Save</h1>
      <input type="file" onChange={handleFile} />
      <p className="mt-2">Imported parents: {count}</p>
    </main>
  );
}
