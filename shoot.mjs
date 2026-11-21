// shoot.mjs — maker's tool for NEON HARBOR: smoke-tests the game in headless Chrome
// and takes the four entry screenshots listed in shots.json.
// Run: node shoot.mjs [--shots-only|--test-only]

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/home/hatch/workspace/shots-tool/package.json');
const puppeteer = require('puppeteer');

const here = fileURLToPath(new URL('.', import.meta.url));
const PORT = 8911;
const BASE = `http://127.0.0.1:${PORT}`;
const args = process.argv.slice(2);
const shotsOnly = args.includes('--shots-only');
const testOnly = args.includes('--test-only');

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(900);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const errors = [];

async function newPage(url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  return page;
}

if (!shotsOnly) {
  const page = await newPage(`${BASE}/?seed=1`);
  await sleep(2500);
  const titleVisible = await page.evaluate(() => !document.getElementById('titleScreen').classList.contains('hidden'));
  console.log('TEST title visible:', titleVisible);
  await page.keyboard.press('Enter');
  await sleep(1200);
  const hudVisible = await page.evaluate(() => !document.getElementById('hud').classList.contains('hidden'));
  const job = await page.evaluate(() => document.getElementById('mName').textContent);
  console.log('TEST hud visible:', hudVisible, '| mission:', job);
  // steal the hero car and drive
  await page.keyboard.press('KeyF');
  await sleep(300);
  await page.keyboard.down('KeyW');
  await sleep(2600);
  await page.keyboard.up('KeyW');
  const speed = await page.evaluate(() => document.getElementById('speed').textContent.trim());
  console.log('TEST speed after driving:', speed);
  await page.screenshot({ path: '/tmp/neon-test-drive.jpg', type: 'jpeg', quality: 80 });
  await page.keyboard.press('KeyM');
  await sleep(500);
  const mapVisible = await page.evaluate(() => !document.getElementById('mapScreen').classList.contains('hidden'));
  console.log('TEST map visible:', mapVisible);
  await page.screenshot({ path: '/tmp/neon-test-map.jpg', type: 'jpeg', quality: 80 });
  await page.close();
}

if (!testOnly) {
  const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
  for (const s of shots) {
    const page = await newPage(`${BASE}/${s.query}`);
    try {
      await page.waitForFunction('window.__shotReady === true', { timeout: 15000 });
    } catch {
      errors.push(`shot ${s.name}: __shotReady timeout`);
    }
    await sleep(s.wait || 1200);
    const out = join(here, 'screenshots', s.name);
    await page.screenshot({ path: out, type: 'jpeg', quality: 84 });
    console.log('SHOT', s.name, statSync(out).size, 'bytes');
    await page.close();
  }
}

await browser.close();
server.kill();
if (errors.length) {
  console.log('ERRORS:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('NO PAGE ERRORS');
}
