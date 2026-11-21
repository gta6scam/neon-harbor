// NEON HARBOR — the hand-in program for gta6-01. The game itself is this directory's
// game/ folder (plain static files, Three.js vendored under game/vendor/, no network),
// and this program hands it in: it copies game/ and screenshots/ to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the kit requires.
// Local check: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Before copying, the program clears the output's game/ and screenshots/ subfolders
// (never the output directory itself): a hand-in must be exactly the current tree,
// and a stale file left by an earlier build — an old screenshot, a renamed source —
// would otherwise ride along silently and change the dossier the scorer compares.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps, mirrored from the kit's gate so a local run refuses what the
// scorer would refuse: at most 4 screenshots of 256 KiB, at most 993 game files and
// 48 MiB of game in all, and no game path longer than 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('NEON HARBOR handed in to', out);
