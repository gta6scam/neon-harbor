// main.js — boot and the one loop of NEON HARBOR. It owns the run state (cash,
// respect, heat, chain, stats), the input, the chase and foot cameras, the crew
// abilities, the side activities (neon shells, street races, stunt ramps), the
// busted/wasted endings, and the ?shot= staging the maker uses for screenshots.
//
// Screens: title → play ⇄ map / garage → end. A run is eight jobs long; the
// harbour is fully roamable between them.

import { STEP, HEAT, SHELL_TOTAL } from './config.js';
import { createRandom } from './rng.js';
import { createWorld } from './world.js';
import { createVehicles } from './vehicles.js';
import { createPeds } from './peds.js';
import { createPlayer } from './player.js';
import { createPolice } from './police.js';
import { createCombat } from './combat.js';
import { createMissions } from './missions.js';
import { createAudio } from './audio-sound.js';
import { createHUD } from './hud.js';
import { createScreens, writeSave } from './screens.js';
import { stageShot } from './shots.js';
import { SHELLS, RACES, districtAt, POIS } from './data-city.js';
import { CREW, WEAPONS, UPGRADES } from './data-crew.js';
import { MISSIONS } from './data-missions.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const rng = createRandom(Number.isInteger(seedParam) ? seedParam : 7);

const canvas = document.getElementById('gl');
const world = createWorld(canvas, rng);
const vehicles = createVehicles(world.scene, world.glowTex, rng, world.colliders);
const peds = createPeds(world.scene, rng);
const player = createPlayer(world.scene, world.colliders);
const audio = createAudio();

const state = {
  mode: 'title', elapsed: 0, cash: 400, rp: 0, heat: 0, wanted: 0,
  chain: 1, chainTimer: 0, speedKmh: 0, health: 100,
  weaponsOwned: new Set(['fists', 'pistol']), weaponIdx: 1,
  upgrades: { engine: 0, armor: 0, nitro: 0 },
  crewCd: [0, 0, 0], eyesOut: 0, jobsDone: 0, medals: {},
  shellsLeft: SHELLS.map((s) => ({ ...s, taken: false })),
  stats: { drops: 0, distance: 0, topSpeed: 0, jacks: 0, shots: 0, hits: 0, shells: 0, racesWon: 0, stunts: 0, crewUses: 0, peakWanted: 0, districts: new Set(['muelle']) },
  playerPos: { x: player.x, z: player.z },
  busted: false, race: null, shake: 0, lastHurt: -99,
};
player.mesh.position.set(player.x, 0, player.z);
vehicles.hero.place(-176, 186.5, Math.PI);

const combat = createCombat(world.scene, world.glowTex, world.camera);
const police = createPolice(world.scene, world.glowTex, vehicles, combat, rng);

const G = { state, world, vehicles, peds, player, police, combat, audio, missions: null, hud: null, screens: null };

const missions = createMissions(world.scene, world.glowTex, {
  dialogue: (giver, line) => G.hud.dialogue(giver, line),
  feed: (msg) => G.hud.feed(msg),
  banner: (big, sub) => G.hud.banner(big, sub),
  audio: (name) => audio.sfx(name),
  fail: (mission) => {
    audio.sfx('fail');
    G.hud.banner('JOB BLOWN', `${mission.name} — the tide does not wait. Back to the start of the job.`, 3.4);
    state.heat = mission.heat;
    setTimeout(() => { if (state.mode === 'play') missions.start(mission.n - 1, state); }, 3600);
  },
  missionPassed: (mission, medal) => {
    audio.sfx('passed');
    G.hud.banner('MISSION PASSED', `${mission.name} · ${medal} · +$${mission.pay.toLocaleString()} · +${mission.rp} RP`, 4);
    writeSave(0, state);
    if (mission.n >= 8) {
      setTimeout(() => endRun(true), 4200);
    } else {
      setTimeout(() => { if (state.mode === 'play') missions.start(mission.n, state); }, 4600);
    }
  },
});
G.missions = missions;
G.hud = createHUD(G);
G.screens = createScreens(G);

// ---- neon shells (collectibles) ----
const shellMeshes = [];
{
  const geo = new THREE.TorusGeometry(0.55, 0.2, 8, 14);
  const mat = new THREE.MeshBasicMaterial({ color: 0x22e6ff });
  for (const s of state.shellsLeft) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(s.pos[0], 1.1, s.pos[1]);
    world.scene.add(m);
    shellMeshes.push(m);
  }
}
// ---- stunt ramps ----
const RAMPS = [[44, 132], [-132, 44], [176, -44], [-44, -176], [88, 220]];
for (const [x, z] of RAMPS) {
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(5, 1.1, 7), new THREE.MeshLambertMaterial({ color: 0x8a6a1a, emissive: 0x3a2a05 }));
  ramp.position.set(x, 0.55, z);
  ramp.rotation.x = -0.18;
  world.scene.add(ramp);
}
let stuntCooldown = 0, hopT = -1;
// ---- race beacon ----
const raceBeacon = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.3, 8, 24), new THREE.MeshBasicMaterial({ color: 0x37ff9a }));
raceBeacon.rotation.x = Math.PI / 2;
raceBeacon.visible = false;
world.scene.add(raceBeacon);

// ---- input ----
const keys = new Set();
let firing = false, fireCd = 0, camYaw = 2.6, bustedT = 0;
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys.add(e.code);
  audio.ensure();
  if (state.mode === 'title' && e.code === 'Enter') startRun();
  else if (state.mode === 'end' && e.code === 'Enter') { document.getElementById('endScreen').classList.add('hidden'); resetRun(); startRun(); }
  else if (state.mode === 'play') {
    if (e.code === 'KeyM') { state.mode = 'map'; G.screens.renderMap(); document.getElementById('mapScreen').classList.remove('hidden'); }
    else if (e.code === 'KeyG') openGarage();
    else if (e.code === 'KeyQ') cycleWeapon();
    else if (e.code === 'KeyR') { const st = audio.nextStation(); G.hud.feed(`Radio: ${st.station} — ${st.track}`); }
    else if (e.code === 'Digit0') G.hud.feed(audio.toggleMute() ? 'SoundWeaver Audio muted.' : 'SoundWeaver Audio on.');
    else if (e.code === 'KeyF') tryInteract();
    else if (e.code === 'KeyE') tryRace();
    else if (e.code === 'KeyZ') useCrew(0);
    else if (e.code === 'KeyX') useCrew(1);
    else if (e.code === 'KeyC') useCrew(2);
  } else if (state.mode === 'map' && (e.code === 'KeyM' || e.code === 'Escape')) {
    state.mode = 'play'; document.getElementById('mapScreen').classList.add('hidden');
  } else if (state.mode === 'garage') {
    if (e.code === 'KeyG' || e.code === 'Escape') { state.mode = 'play'; document.getElementById('garageScreen').classList.add('hidden'); }
    if (e.code === 'Digit1') buyUpgrade('engine');
    if (e.code === 'Digit2') buyUpgrade('armor');
    if (e.code === 'Digit3') buyUpgrade('nitro');
    if (e.code === 'Digit4') buyWeapon(2);
    if (e.code === 'Digit5') buyWeapon(3);
    if (e.code === 'Digit6') buyWeapon(4);
    if (e.code === 'Digit7') buyWeapon(5);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && state.mode === 'play') { firing = true; audio.ensure(); } });
window.addEventListener('mouseup', () => { firing = false; });
const input = {
  get up() { return keys.has('KeyW') || keys.has('ArrowUp'); },
  get down() { return keys.has('KeyS') || keys.has('ArrowDown'); },
  get left() { return keys.has('KeyA') || keys.has('ArrowLeft'); },
  get right() { return keys.has('KeyD') || keys.has('ArrowRight'); },
  get sprint() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
  get steer() { return (this.left ? 1 : 0) - (this.right ? 1 : 0); },
  get nitro() { return this.sprint; },
};

function startRun() {
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  state.mode = 'play';
  audio.ensure();
  missions.start(state.jobsDone, state);
}

function resetRun() {
  state.cash = 400; state.rp = 0; state.heat = 0; state.wanted = 0; state.chain = 1;
  state.jobsDone = 0; state.medals = {}; state.health = 100; state.busted = false;
  state.weaponsOwned = new Set(['fists', 'pistol']); state.weaponIdx = 1;
  state.upgrades = { engine: 0, armor: 0, nitro: 0 };
  state.stats = { drops: 0, distance: 0, topSpeed: 0, jacks: 0, shots: 0, hits: 0, shells: 0, racesWon: 0, stunts: 0, crewUses: 0, peakWanted: 0, districts: new Set(['muelle']) };
  police.clearAll();
  player.exit();
  player.x = -174; player.z = 189; player.health = 100;
  vehicles.hero.place(-176, 186.5, Math.PI);
  vehicles.hero.condition = 100;
}

function endRun(win) {
  state.mode = 'end';
  document.getElementById('hud').classList.add('hidden');
  G.screens.renderEnd(win);
  document.getElementById('endScreen').classList.remove('hidden');
}

function openGarage() {
  state.mode = 'garage';
  G.screens.renderGarage();
  const list = document.getElementById('upgradeList');
  list.innerHTML += WEAPONS.slice(2).map((w, i) => {
    const owned = state.weaponsOwned.has(w.id);
    return `<div class="upCard panel"><div style="width:230px"><div class="un">${w.icon} ${w.name}</div><div style="font-size:11.5px;color:var(--dim)">Unlock: ${w.unlock}</div></div><div style="flex:1;font-size:12px;color:var(--dim)">DMG ${w.damage} · ${w.ammo} rnd</div><div class="buy">${owned ? 'IN THE WHEEL' : `BUY $${w.price.toLocaleString()} [${i + 4}]`}</div></div>`;
  }).join('');
  document.getElementById('garageScreen').classList.remove('hidden');
}

function buyUpgrade(id) {
  const def = UPGRADES.find((u) => u.id === id);
  const tier = state.upgrades[id];
  if (tier >= def.max) { G.hud.feed('TALLER BRUMA: that tier is maxed, runner.'); return; }
  const price = def.prices[tier];
  if (state.cash < price) { G.hud.feed(`TALLER BRUMA: $${price.toLocaleString()} needed — the harbor pays better than this.`); return; }
  state.cash -= price;
  state.upgrades[id] += 1;
  G.hud.feed(`TALLER BRUMA fitted: ${id.toUpperCase()} tier ${tier + 1}.`);
  G.screens.renderGarage();
  openGarageRefresh();
}

function openGarageRefresh() {
  // re-append the weapon rows after a re-render
  const list = document.getElementById('upgradeList');
  list.innerHTML += WEAPONS.slice(2).map((w, i) => {
    const owned = state.weaponsOwned.has(w.id);
    return `<div class="upCard panel"><div style="width:230px"><div class="un">${w.icon} ${w.name}</div><div style="font-size:11.5px;color:var(--dim)">Unlock: ${w.unlock}</div></div><div style="flex:1;font-size:12px;color:var(--dim)">DMG ${w.damage} · ${w.ammo} rnd</div><div class="buy">${owned ? 'IN THE WHEEL' : `BUY $${w.price.toLocaleString()} [${i + 4}]`}</div></div>`;
  }).join('');
}

function buyWeapon(idx) {
  const w = WEAPONS[idx];
  if (state.weaponsOwned.has(w.id)) return;
  if (state.cash < w.price) { G.hud.feed(`TALLER BRUMA: the ${w.name} is $${w.price.toLocaleString()}.`); return; }
  state.cash -= w.price;
  state.weaponsOwned.add(w.id);
  G.hud.feed(`Wheel updated: ${w.name} is yours.`);
  G.screens.renderGarage();
  openGarageRefresh();
}

function cycleWeapon() {
  const ownedIdx = WEAPONS.map((w, i) => (state.weaponsOwned.has(w.id) ? i : -1)).filter((i) => i >= 0);
  const cur = ownedIdx.indexOf(state.weaponIdx);
  state.weaponIdx = ownedIdx[(cur + 1) % ownedIdx.length];
  G.hud.feed(`Wheel: ${WEAPONS[state.weaponIdx].name} in hand.`);
}

function tryInteract() {
  if (player.inCar) {
    player.exit();
    G.hud.prompt('');
    return;
  }
  const cars = [vehicles.hero, ...vehicles.traffic, ...police.units.map((u) => u.car)];
  const car = player.nearCar(cars);
  if (!car) return;
  const witnessed = peds.witnessesNear(player.x, player.z, 16) || police.units.some((u) => Math.hypot(u.car.x - player.x, u.car.z - player.z) < 30);
  player.enter(car);
  state.stats.jacks += 1;
  if (car !== vehicles.hero || state.jacks > 1) {
    if (witnessed) {
      addHeat(HEAT.perJackWitnessed);
      G.hud.feed(`A witness called the PHCPD — ${car.model.name} reported stolen.`);
      G.hud.dialogue('IBO SANZ', 'Half the quay saw that, boss. Drive like you mean to vanish.');
    } else {
      G.hud.feed(`Quiet hands: the ${car.model.name} is yours and nobody sang.`);
    }
  }
}

function useCrew(i) {
  if (state.crewCd[i] > 0) return;
  const crew = CREW[i];
  state.crewCd[i] = crew.cooldown;
  state.stats.crewUses += 1;
  if (i === 0) {
    state.heat = Math.max(0, state.heat - 1.25);
    police.sight = 'SEARCHING';
    police.searchT = HEAT.searchSeconds;
  } else if (i === 1) {
    const car = player.inCar || vehicles.hero;
    car.condition = Math.min(100, car.condition + 55);
  } else {
    state.eyesOut = 20;
  }
  G.hud.dialogue(crew.name, crew.line);
  G.hud.feed(`Crew: ${crew.name} — ${crew.ability} away.`);
  audio.sfx('pickup');
}

function addHeat(amount) {
  const mult = state.eyesOut > 0 ? 0.5 : 1;
  state.heat = Math.min(HEAT.maxStars + 0.99, state.heat + amount * mult);
}

function tryRace() {
  if (state.race || missions.active || player.inCar === null) return;
  for (const race of RACES) {
    const [gx, gz] = race.gates[0];
    if (Math.hypot(player.inCar.x - gx, player.inCar.z - gz) < 9) {
      state.race = { def: race, gate: 1, timer: 150 };
      raceBeacon.visible = true;
      const [nx, nz] = race.gates[1];
      raceBeacon.position.set(nx, 0.4, nz);
      G.hud.banner('RACE — ' + race.name, 'Hit every green ring. The harbor is watching.');
      G.hud.feed(`Race started: ${race.name}. ${race.gates.length - 1} gates.`);
      return;
    }
  }
}

// ---- per-frame update ----
let camPos = new THREE.Vector3(-190, 26, 230);
function update(dt) {
  state.elapsed += dt;
  const S = state;
  S.playerPos = player.pos();
  S.stats.districts.add(districtAt(S.playerPos.x, S.playerPos.z).id);

  if (S.mode !== 'play') {
    // idle harbour life behind the menus
    peds.update(dt, null);
    vehicles.update(dt, null);
    world.update(dt, performance.now() / 1000);
    if (S.mode === 'title') {
      const t = performance.now() / 1000;
      world.camera.position.set(Math.sin(t * 0.05) * 150, 30, 268 - Math.cos(t * 0.05) * 30);
      world.camera.lookAt(0, 4, 90);
    }
    return;
  }

  // heat bookkeeping
  S.wanted = Math.min(5, Math.floor(S.heat));
  S.stats.peakWanted = Math.max(S.stats.peakWanted, S.wanted);
  if (police.sight === 'SEARCHING' && police.searchT <= 0 && S.wanted > 0) {
    S.heat = Math.max(0, S.wanted - 1);
    police.searchT = HEAT.searchSeconds;
    G.hud.feed('Dispatch: contact lost. The band cools by one star.');
  }
  if (S.chainTimer > 0) { S.chainTimer -= dt; if (S.chainTimer <= 0) S.chain = 1; }
  if (S.eyesOut > 0) S.eyesOut -= dt;
  S.crewCd = S.crewCd.map((c) => Math.max(0, c - dt));
  stuntCooldown = Math.max(0, stuntCooldown - dt);

  // player + driving
  const inCar = !!player.inCar;
  if (inCar) {
    G.hud.prompt('');
    const car = player.inCar;
    const before = car.condition;
    S.speedKmh = vehicles.drive(car, dt, { up: input.up, down: input.down, steer: input.steer, nitro: input.nitro }, S.upgrades);
    if (car.crashed) {
      car.crashed = false;
      audio.sfx('crash');
      S.shake = 0.5;
      if (before - car.condition > 4) { S.chain = 1; G.hud.feed('Chain broken — the box felt that one.'); }
    }
    S.stats.distance += Math.abs(car.speed) * dt;
    S.stats.topSpeed = Math.max(S.stats.topSpeed, S.speedKmh);
    // stunt ramps
    if (stuntCooldown <= 0 && Math.abs(car.speed) > 17) {
      for (const [rx, rz] of RAMPS) {
        if (Math.hypot(car.x - rx, car.z - rz) < 3.4) {
          stuntCooldown = 6; hopT = 0;
          S.stats.stunts += 1; S.cash += 200;
          G.hud.banner('STUNT JUMP', '+$200 · the harbor applauds');
          break;
        }
      }
    }
    if (hopT >= 0) {
      hopT += dt;
      car.mesh.position.y = Math.sin(Math.min(1, hopT / 0.8) * Math.PI) * 1.6;
      if (hopT > 0.8) { hopT = -1; car.mesh.position.y = 0; }
    }
  } else {
    S.speedKmh = 0;
    player.update(dt, { up: input.up, down: input.down, left: input.left, right: input.right, sprint: input.sprint }, camYaw);
    // walk into the hero car's story: prompt for nearby cars
    const cars = [vehicles.hero, ...vehicles.traffic];
    const near = player.nearCar(cars);
    G.hud.prompt(near ? `Press <b>F</b> to ${near === vehicles.hero ? 'drive' : 'steal'} the ${near.model.name}` : '');
  }

  // shooting (on foot)
  fireCd -= dt;
  if (firing && !inCar && fireCd <= 0) {
    const w = WEAPONS[S.weaponIdx];
    if (w.id !== 'fists') {
      fireCd = w.rate;
      player.heading = camYaw;
      S.stats.shots += 1;
      audio.sfx('shot');
      addHeat(HEAT.perShotFired);
      combat.fire({ x: player.x, z: player.z }, player.heading, w, (kind, target) => {
        if (kind === 'hit') {
          S.stats.hits += 1;
          if (target && (target.kind === 'copcar' || target.kind === 'officer')) addHeat(HEAT.perCopHit);
        }
      });
    }
  }

  // missions, police, world life
  missions.update(dt, S, police);
  const playerHeading = player.inCar ? player.inCar.heading : player.heading;
  police.update(dt, {
    playerPos: S.playerPos, playerHeading, wanted: S.wanted,
    feed: (m) => G.hud.feed(m),
    onRam: (speed) => {
      if (player.inCar) {
        player.inCar.condition = Math.max(0, player.inCar.condition - speed * 0.32 * (1 - 0.25 * S.upgrades.armor));
        S.shake = 0.6; S.chain = 1;
        audio.sfx('crash');
      }
    },
    onShot: (dmg) => {
      S.lastHurt = S.elapsed;
      if (player.inCar) player.inCar.condition = Math.max(0, player.inCar.condition - dmg * 0.5);
      else S.health -= dmg;
    },
  });
  vehicles.update(dt, inCar ? null : S.playerPos);
  const danger = (firing || S.speedKmh > 60) ? S.playerPos : null;
  peds.update(dt, danger);
  combat.update(dt);
  world.update(dt, performance.now() / 1000);

  // shells
  state.shellsLeft.forEach((s, i) => {
    const m = shellMeshes[i];
    if (s.taken) { m.visible = false; return; }
    m.rotation.y += dt * 2;
    m.position.y = 1.1 + Math.sin(performance.now() / 300 + i) * 0.15;
    if (Math.hypot(S.playerPos.x - s.pos[0], S.playerPos.z - s.pos[1]) < 2.8) {
      s.taken = true; S.stats.shells += 1; S.cash += 150;
      G.hud.feed(`Neon shell ${S.stats.shells}/${SHELL_TOTAL} — the harbor pays for beauty.`);
      audio.sfx('pickup');
    }
  });

  // race gates
  if (S.race) {
    const race = S.race;
    race.timer -= dt;
    const [gx, gz] = race.def.gates[race.gate];
    raceBeacon.rotation.z += dt;
    if (Math.hypot(S.playerPos.x - gx, S.playerPos.z - gz) < 7) {
      race.gate += 1;
      audio.sfx('deliver');
      if (race.gate >= race.def.gates.length) {
        S.race = null; raceBeacon.visible = false;
        S.stats.racesWon += 1; S.cash += 2200; S.rp += 90;
        G.hud.banner('RACE WON', `${race.def.name} · +$2,200 · +90 RP`);
      } else {
        const [nx, nz] = race.def.gates[race.gate];
        raceBeacon.position.set(nx, 0.4, nz);
      }
    } else if (race.timer <= 0) {
      S.race = null; raceBeacon.visible = false;
      G.hud.feed('Race clock died. The rings forget you.');
    }
  }

  // health, busted, wasted
  if (S.elapsed - S.lastHurt > 6 && S.health < 100) S.health = Math.min(100, S.health + 4 * dt);
  player.health = S.health;
  const nearestCop = police.units.filter((u) => !u.dead).reduce((a, u) => Math.min(a, Math.hypot(u.car.x - S.playerPos.x, u.car.z - S.playerPos.z)), 999);
  const trapped = (S.wanted >= 3 && S.speedKmh < 4 && nearestCop < 8) || (S.wanted >= 1 && !inCar && nearestCop < 2.6);
  bustedT = trapped ? bustedT + dt : 0;
  if (bustedT > 3) { S.busted = true; endRun(false); }
  if (S.health <= 0) { S.busted = false; endRun(false); }
  if (player.inCar && player.inCar.condition <= 0) {
    G.hud.feed('The car is dead. On foot, runner — the night is not over.');
    player.exit();
  }

  // audio beds
  audio.setEngine(Math.abs(S.speedKmh) / 160, inCar);
  audio.setSiren(nearestCop < 60 ? 1 - nearestCop / 60 : 0);

  // camera
  const cam = world.camera;
  let targetPos, lookAt;
  if (inCar) {
    const car = player.inCar;
    const dist = 6.4 + Math.abs(car.speed) * 0.055;
    targetPos = new THREE.Vector3(car.x - Math.sin(car.heading) * dist, 2.55, car.z - Math.cos(car.heading) * dist);
    lookAt = new THREE.Vector3(car.x + Math.sin(car.heading) * 9, 1.1, car.z + Math.cos(car.heading) * 9);
    const targetFov = 66 + Math.min(9, Math.abs(car.speed) * 0.16);
    if (Math.abs(cam.fov - targetFov) > 0.2) { cam.fov += (targetFov - cam.fov) * 0.08; cam.updateProjectionMatrix(); }
  } else {
    camYaw += ((player.heading - camYaw + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 3.2);
    targetPos = new THREE.Vector3(player.x - Math.sin(camYaw) * 5.4, 2.3, player.z - Math.cos(camYaw) * 5.4);
    lookAt = new THREE.Vector3(player.x + Math.sin(camYaw) * 3.4, 1.35, player.z + Math.cos(camYaw) * 3.4);
    if (Math.abs(cam.fov - 66) > 0.2) { cam.fov += (66 - cam.fov) * 0.1; cam.updateProjectionMatrix(); }
  }
  camPos.lerp(targetPos, Math.min(1, dt * 7));
  if (S.shake > 0) {
    S.shake -= dt;
    camPos.x += (Math.random() - 0.5) * S.shake * 0.7;
    camPos.y += (Math.random() - 0.5) * S.shake * 0.5;
  }
  cam.position.copy(camPos);
  cam.lookAt(lookAt);

  G.hud.update(dt);
  document.getElementById('status').textContent = `NEON HARBOR — job ${Math.min(8, S.jobsDone + 1)} of 8, wanted ${S.wanted} stars, cash $${Math.floor(S.cash)}.`;
}

// ---- boot ----
G.screens.renderSaves();
if (shot) {
  document.getElementById('titleScreen').classList.add('hidden');
  state.mode = 'shot';
  stageShot(shot, G);
  if (shot === 'cover') G.hud.update(0.016);
  world.renderer.render(world.scene, world.camera);
  requestAnimationFrame(() => {
    world.renderer.render(world.scene, world.camera);
    window.__shotReady = true;
  });
} else {
  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, 0.25);
    last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    world.renderer.render(world.scene, world.camera);
  }
  requestAnimationFrame(frame);
}
