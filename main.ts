// Ember Court — the hand-in program: copies game/ and screenshots/ into the
// output directory and writes dossier.json with the kit's buildDossier.
//
// The grader runs this as uid 65534 with a read-only repository: it only ever
// creates directories and copies files inside the output directory, never
// deleting the output directory itself.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const entryDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(entryDir, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(entryDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
