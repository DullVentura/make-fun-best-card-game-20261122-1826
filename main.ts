// Ember Sigil Duel — the hand-in program (Node 22, standard library only).
//
// It carries the game to the grader: copy game/ and screenshots/ from beside
// this file into /output, then write /output/dossier.json with the vendored
// make.fun library, exactly as the kit asks. Nothing here is random and
// nothing reads the clock, so two runs write the same bytes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) return 0;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return readdirSync(from).length;
}

mkdirSync(outDir, { recursive: true });
const gameEntries = copyTree('game');
const shotEntries = copyTree('screenshots');
if (gameEntries === 0) throw new Error('game/ is missing beside main.ts');
if (shotEntries === 0) throw new Error('screenshots/ is missing beside main.ts');

// The scorer's own caps, as the kit's starter names them: only text_max_bytes
// shapes the dossier bytes; the rest refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; game/ over 993 files or
// 48 MiB in all, or a path under game/ over 1000 bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
