// shots.js — the four staged proofs behind ?shot=cover|title|map|end&seed=1.
// Each scene is the real game state arranged at its most complete moment: the
// cover is a live 4-star harbor shootout — the player on foot beside the hero
// car, trading tracers with the roadblock officers while AIR ONE watches — the
// title carries the rules and the save slots, the district map shows the GPS
// route and the story list, and the end sheet is a graded full-run summary.
// Same seed, same frame, always.

import { MISSIONS } from './data-missions.js';
import { WEAPONS } from './data-crew.js';
import { makePersonMesh } from './peds.js';
import { makeGlow } from './world.js';
import { writeSave } from './screens.js';

function hideScreens() {
  for (const id of ['titleScreen', 'garageScreen', 'mapScreen', 'endScreen']) {
    document.getElementById(id).classList.add('hidden');
  }
  document.getElementById('hud').classList.add('hidden');
}

function demoProgress(G) {
  const S = G.state;
  S.cash = 128450; S.rp = 1640; S.jobsDone = 6;
  S.weaponsOwned = new Set(['fists', 'pistol', 'smg', 'shotgun']);
  S.weaponIdx = 2;
  S.upgrades = { engine: 2, armor: 1, nitro: 2 };
  S.stats.drops = 14; S.stats.shells = 11; S.stats.jacks = 9;
  S.stats.topSpeed = 152; S.stats.distance = 28600; S.stats.shots = 64; S.stats.hits = 41;
  S.stats.peakWanted = 5; S.stats.racesWon = 1; S.stats.stunts = 3; S.stats.crewUses = 14;
  S.stats.districts = new Set(['muelle', 'neon', 'mercado', 'colina', 'puerto']);
  S.medals = { tide: 'GOLD', cold: 'GOLD', ghost: 'SILVER', mile: 'GOLD', inspector: 'SILVER', lights: 'GOLD' };
  return S;
}

function stageCover(G) {
  const S = demoProgress(G);
  const { vehicles, police, player, missions, hud, combat } = G;
  S.wanted = 4; S.heat = 4.4; S.chain = 4.5; S.speedKmh = 0;
  S.playerPos = { x: 38, z: 183.5 };

  // the hero car, abandoned mid-chase on the harbor road, rear three-quarter
  // to camera: the runner got out and the night went loud
  const hero = vehicles.hero;
  hero.place(36, 179.2, Math.PI / 2);
  hero.speed = 0; hero.condition = 78;

  // the player ON FOOT across the hero's flank, SMG up, trading fire past it
  player.x = 38; player.z = 183.5; player.inCar = null;
  player.mesh.visible = true;
  player.mesh.position.set(player.x, 0, player.z);
  player.mesh.userData.legs[0].rotation.x = 0.45;
  player.mesh.userData.legs[1].rotation.x = -0.3;

  // the roadblock ahead: two units parked across the road, officers out
  const block1 = vehicles.spawnExtra(2, { color: 0xdfe6ee, lightbar: true });
  block1.place(56, 183.5, 0.4);
  police.units.push({ car: block1, callsign: 'HARBOR-12', role: 'ROADBLOCK', dead: false, hp: 120 });
  const block2 = vehicles.spawnExtra(2, { color: 0xdfe6ee, lightbar: true });
  block2.place(57, 176, -0.5);
  police.units.push({ car: block2, callsign: 'MUELLE-7', role: 'PURSUIT', dead: false, hp: 120 });

  const officerAt = (x, z) => {
    const mesh = makePersonMesh(0x2a4a7e);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = Math.atan2(player.x - x, player.z - z);
    G.world.scene.add(mesh);
    const officer = { mesh, x, z, hp: 40, down: false };
    combat.register({ x, z, r: 0.8, hp: 40, kind: 'officer', ref: officer, onDown: (t) => { t.ref.down = true; } });
    return officer;
  };
  const o1 = officerAt(52.5, 186.5);
  const o2 = officerAt(53, 179.5);

  // the net closing: one unit racing along the far lane, one more rolling in
  // past the roadblock
  const flank = vehicles.spawnExtra(2, { color: 0xdfe6ee, lightbar: true });
  flank.place(52, 169.8, Math.PI / 2); flank.speed = 18;
  police.units.push({ car: flank, callsign: 'CORAL-48', role: 'RAMMING', dead: false, hp: 120 });
  const far = vehicles.spawnExtra(2, { color: 0xdfe6ee, lightbar: true });
  far.place(72, 179.2, 0.3); far.speed = 16;
  police.units.push({ car: far, callsign: 'FARO-3', role: 'PURSUIT', dead: false, hp: 120 });

  // AIR ONE overhead (its panel row rides on a hidden anchor car under the map)
  const anchor = vehicles.spawnExtra(2, { color: 0xdfe6ee, lightbar: false });
  anchor.place(52, 173, 0); anchor.mesh.visible = false;
  police.units.push({ car: anchor, callsign: 'AIR ONE', role: 'SPOTLIGHT', dead: false, hp: 999 });
  const heli = new THREE.Group();
  const hbody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.7, 5.6), new THREE.MeshLambertMaterial({ color: 0x18222f, emissive: 0x0d2438 }));
  heli.add(hbody);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.08, 0.7), new THREE.MeshLambertMaterial({ color: 0x39434f }));
  rotor.position.y = 1.15; heli.add(rotor);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.6, 30, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.y = -15.5; heli.add(cone);
  const hglow = makeGlow(G.world.glowTex, 0xff2233, 3.4); hglow.position.set(0, 0.4, -3.4); heli.add(hglow);
  heli.position.set(54, 21, 182);
  G.world.scene.add(heli);
  police.sight = 'IN SIGHT';

  // traffic fore and aft, and a crowd on both sidewalks
  const t1 = G.vehicles.traffic[0]; t1.place(88, 179.2, Math.PI / 2); t1.speed = 11;
  const t2 = G.vehicles.traffic[1]; t2.place(95, 172.8, -Math.PI / 2); t2.speed = 10;
  G.peds.list.forEach((ped, i) => {
    if (i < 6) { ped.bx = 0; ped.bz = 176; ped.t = (i % 6) / 6; }
    else if (i < 11) { ped.bx = 44; ped.bz = 132; ped.t = (i % 5) / 5; }
    else if (i < 15) { ped.bx = 0; ped.bz = 132; ped.t = (i % 4) / 4; }
  });
  for (let i = 0; i < 40; i++) G.peds.update(1 / 30, null);

  // mission state: JOB 7, the ferry drop, cargo aboard, clock low
  missions.index = 6; missions.mission = MISSIONS[6]; missions.stage = 3;
  missions.active = true; missions.cargo = true; missions.timer = 47; missions.stagePar = 115;
  missions.beacon.position.set(220, 0, 176);
  missions.beacon.visible = true;

  // THE EXCHANGE — the game's own combat, frozen at its loudest instant:
  // two SMG bursts from the player (muzzle lit, tracers out, damage chips on
  // both officers), red return tracers from the roadblock
  const aimAt = (t) => Math.atan2(t.x - player.x, t.z - player.z);
  player.heading = aimAt(o1);
  player.mesh.rotation.y = player.heading;
  combat.fire({ x: player.x, z: player.z }, aimAt(o1), WEAPONS[2], null);
  combat.fire({ x: player.x, z: player.z }, aimAt(o2), WEAPONS[2], null);
  combat.enemyFire({ x: o1.x, z: o1.z }, { x: player.x, z: player.z }, false);
  combat.enemyFire({ x: o2.x, z: o2.z }, { x: player.x + 1.4, z: player.z + 0.8 }, false);

  hud.feed('CORAL-48: suspect on foot on the harbor road — shots fired.');
  hud.feed('FARO-3: roadblock set at the terminal ramp. Officers returning fire.');
  hud.dialogue('MAMA VEGA', 'Out of the car and loud, mijo — give the harbor a show.', 999);
  S.crewCd = [0, 12, 0];

  document.getElementById('hud').classList.remove('hidden');
  // thumbnail pop for the cover only: the night reads at contact-sheet size
  G.world.renderer.toneMappingExposure = 1.45;
  const cam = G.world.camera;
  cam.fov = 70;
  cam.updateProjectionMatrix();
  cam.position.set(32.2, 2.0, 186.95);
  cam.lookAt(45, 1.0, 177.5);
  cam.updateMatrixWorld();
  // one combat tick projects the damage chips onto the officers; the tracers
  // (0.09s life) and the muzzle flash (0.05s) both survive a 0.012s tick
  combat.update(0.012);
}

function stageTitle(G) {
  demoProgress(G);
  if (!localStorage.getItem('neon-harbor-saves-v1')) {
    writeSave(0, { jobsDone: 5, cash: 64210, elapsed: 5400, rp: 1210 });
    writeSave(1, { jobsDone: 2, cash: 18930, elapsed: 2100, rp: 420 });
  }
  G.screens.renderSaves();
  document.getElementById('titleScreen').classList.remove('hidden');
  const cam = G.world.camera;
  cam.position.set(96, 30, 268);
  cam.lookAt(-30, 4, 60);
}

function stageMap(G) {
  const S = demoProgress(G);
  const { missions } = G;
  // the same night as the cover: JOB 7 in progress, the runner on the harbor
  // road, the GPS route running east to the LAST FERRY drop
  S.playerPos = { x: 33, z: 177 };
  missions.index = 6; missions.mission = MISSIONS[6]; missions.stage = 3;
  missions.active = true; missions.cargo = true; missions.timer = 47; missions.stagePar = 115;
  G.screens.renderMap();
  document.getElementById('mapScreen').classList.remove('hidden');
  const hero = G.vehicles.hero;
  hero.place(36, 179.2, Math.PI / 2);
  const cam = G.world.camera;
  cam.position.set(20, 12, 152);
  cam.lookAt(64, 2, 192);
}

function stageEnd(G) {
  const S = demoProgress(G);
  S.jobsDone = 8; S.cash = 96400; S.rp = 2860;
  S.stats.drops = 21; S.stats.shells = 17; S.stats.jacks = 14;
  S.stats.topSpeed = 168; S.stats.distance = 42300; S.stats.shots = 96; S.stats.hits = 61;
  S.stats.racesWon = 2; S.stats.stunts = 4; S.stats.crewUses = 23;
  S.medals = { tide: 'GOLD', cold: 'GOLD', ghost: 'GOLD', mile: 'GOLD', inspector: 'SILVER', lights: 'GOLD', net: 'GOLD', harbor: 'GOLD' };
  S.weaponsOwned = new Set(['fists', 'pistol', 'smg', 'shotgun', 'rifle']);
  S.upgrades = { engine: 3, armor: 2, nitro: 2 };
  G.screens.renderEnd(true);
  document.getElementById('endScreen').classList.remove('hidden');
  const cam = G.world.camera;
  cam.position.set(60, 24, 250);
  cam.lookAt(0, 6, 120);
}

export function stageShot(name, G) {
  hideScreens();
  if (name === 'title') stageTitle(G);
  else if (name === 'map') stageMap(G);
  else if (name === 'end') stageEnd(G);
  else stageCover(G);
}
