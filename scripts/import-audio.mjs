import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';

const directory = new URL('../Things_to _add/', import.meta.url);
let names;
try {
  names = await readdir(directory);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // Git/Vercel builds use the committed, validated audio manifest and assets.
  // The original local drop folder is deliberately not required for deployment.
  console.log('Using packaged audio assets; local audio source folder is absent.');
  process.exit(0);
}
const requested = {
  menu: 'Main menu', gameplay: 'Background music during gameplay',
  collection: 'fragment collection sound', gameOver: 'Game over', rewind: 'Time rewind', victory: 'Victory',
};
const manifest = {};
await mkdir(new URL('../public/assets/audio/', import.meta.url), { recursive: true });
for (const [id, base] of Object.entries(requested)) {
  let entry = { url: null, source: base, status: 'Needs a playable audio export' };
  for (const name of names.filter(name => name.slice(0, -extname(name).length).toLowerCase() === base.toLowerCase())) {
    const bytes = await readFile(new URL(encodeURIComponent(name), directory));
    if (/^\s*(<!doctype|<html)/i.test(bytes.subarray(0, 300).toString('utf8'))) {
      entry.source = name; entry.status = 'Saved Suno HTML page, not an audio file'; continue;
    }
    const extension = extname(name).toLowerCase();
    const signature = bytes.subarray(0, 16);
    const supported = ['.mp3', '.wav', '.m4a', '.mp4', '.ogg'].includes(extension) && (
      signature.toString('ascii', 0, 3) === 'ID3' || signature[0] === 0xff ||
      signature.toString('ascii', 0, 4) === 'RIFF' || signature.toString('ascii', 0, 4) === 'OggS' ||
      signature.toString('ascii', 4, 8) === 'ftyp');
    if (!supported) continue;
    const target = `${id}${extension}`;
    await copyFile(new URL(encodeURIComponent(name), directory), new URL(`../public/assets/audio/${target}`, import.meta.url));
    entry = { url: `/assets/audio/${target}`, source: name, status: 'Imported', sha256: createHash('sha256').update(bytes).digest('hex') };
    break;
  }
  manifest[id] = entry;
  console.log(`Audio ${id}: ${entry.status}`);
}
await writeFile(new URL('../client/audio-manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
