// police.js — the PHCPD dispatch: named units with live roles and distances, the
// wanted/searching brain, roadblocks with officers who shoot back, and AIR ONE,
// the helicopter whose spotlight cone is a promise. The dispatch panel in the HUD
// is fed from here, so what the screenshot shows is what the system is doing.

import { CITY, HEAT } from './config.js';
import { makeGlow } from './world.js';
import { makePersonMesh } from './peds.js';

const CALLSIGNS = ['HARBOR-12', 'CORAL-48', 'MUELLE-7', 'FARO-3', 'SIERRA-21', 'VEGA-9', 'BRUMA-31', 'TIDE-16'];
const ROLE_CLASS = { RAMMING: 'r-ram', PURSUIT: 'r-pur', ROADBLOCK: 'r-road', FIRING: 'r-fire', SPOTLIGHT: 'r-spot', SEARCHING: 'r-search' };
export { ROLE_CLASS };

export function createPolice(scene, glowTex, vehicles, combat, rng) {
  const units = [];       // {car, callsign, role, officer?}
  const officers = [];    // on-foot officers at roadblocks {mesh, x, z, hp, fireT, target}
  let heli = null;
  let spawnT = 0;

  function makeHeli() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.7, 5.6), new THREE.MeshLambertMaterial({ color: 0x18222f, emissive: 0x0d2438 }));
    g.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.6), new THREE.MeshLambertMaterial({ color: 0x18222f }));
    tail.position.set(0, 0.3, -4.8);
    g.add(tail);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.08, 0.7), new THREE.MeshLambertMaterial({ color: 0x39434f }));
    rotor.position.y = 1.15;
    g.add(rotor);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(4.6, 30, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    cone.position.y = -15.5;
    g.add(cone);
    const spot = new THREE.SpotLight(0xbfefff, 2.2, 70, 0.32, 0.5);
    spot.position.set(0, 0, 0);
    g.add(spot);
    g.add(spot.target);
    spot.target.position.set(0, -30, 0);
    const glow = makeGlow(glowTex, 0xff2233, 3);
    glow.position.set(0, 0.4, -7);
    g.add(glow);
    g.userData.rotor = rotor;
    scene.add(g);
    return g;
  }

  function spawnUnit(playerPos, idx) {
    const car = vehicles.spawnExtra(2, { color: 0xdfe6ee, lightbar: true });
    const ang = rng.range(0, Math.PI * 2);
    const dist = rng.range(64, 92);
    const x = Math.max(-CITY.extent, Math.min(CITY.extent, playerPos.x + Math.cos(ang) * dist));
    const z = Math.max(-CITY.extent, Math.min(CITY.waterZ - 16, playerPos.z + Math.sin(ang) * dist));
    car.place(x, z, rng.range(0, 6.28));
    car.condition = 100;
    const unit = { car, callsign: CALLSIGNS[idx % CALLSIGNS.length], role: 'PURSUIT', hp: 120 };
    units.push(unit);
    combat.register({ x: car.x, z: car.z, r: 2.2, hp: 120, kind: 'copcar', ref: unit,
      onDown: (t) => { t.ref.dead = true; t.ref.car.dead = true; t.ref.car.speed = 0; } });
    return unit;
  }

  function spawnOfficer(x, z) {
    const mesh = makePersonMesh(0x2a4a7e);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    const officer = { mesh, x, z, hp: 40, fireT: rng.range(0.4, 1.4), down: false };
    officers.push(officer);
    combat.register({ x, z, r: 0.8, hp: 40, kind: 'officer', ref: officer,
      onDown: (t) => { t.ref.down = true; t.ref.mesh.rotation.x = Math.PI / 2; t.ref.mesh.position.y = 0.25; } });
    return officer;
  }

  const api = {
    units, officers,
    sight: 'CLEAR', searchT: 0,
    get heliActive() { return !!heli; },

    desiredUnits(wanted) { return wanted <= 0 ? 0 : Math.min(6, wanted + 1); },

    panelRows(playerPos) {
      const rows = units.filter((u) => !u.dead).map((u) => ({
        callsign: u.callsign, role: api.sight === 'SEARCHING' ? 'SEARCHING' : u.role,
        dist: Math.round(Math.hypot(u.car.x - playerPos.x, u.car.z - playerPos.z)),
      })).sort((a, b) => a.dist - b.dist).slice(0, 5);
      if (heli) rows.push({ callsign: 'AIR ONE', role: 'SPOTLIGHT', dist: Math.round(Math.hypot(heli.position.x - playerPos.x, heli.position.z - playerPos.z)) });
      return rows;
    },

    update(dt, ctx) {
      const { playerPos, wanted, feed } = ctx;
      // --- spawn / retire to match the wanted level ---
      const want = api.desiredUnits(wanted);
      const alive = units.filter((u) => !u.dead);
      spawnT -= dt;
      if (alive.length < want && spawnT <= 0) {
        spawnUnit(playerPos, units.length);
        spawnT = 2.4;
        if (feed && alive.length === 0 && want > 0) feed(`Dispatch: all units, suspect vehicle on the harbor band.`);
      }
      for (let i = units.length - 1; i >= 0; i--) {
        if (units[i].dead || (wanted === 0 && Math.hypot(units[i].car.x - playerPos.x, units[i].car.z - playerPos.z) > 130)) {
          scene.remove(units[i].car.mesh);
          units.splice(i, 1);
        }
      }
      // --- sight & searching ---
      let seen = false;
      for (const u of units) {
        if (!u.dead && Math.hypot(u.car.x - playerPos.x, u.car.z - playerPos.z) < 58) seen = true;
      }
      if (heli && Math.hypot(heli.position.x - playerPos.x, heli.position.z - playerPos.z) < 70) seen = true;
      if (wanted === 0) { api.sight = 'CLEAR'; api.searchT = 0; }
      else if (seen) { api.sight = 'IN SIGHT'; api.searchT = HEAT.searchSeconds; }
      else if (api.sight !== 'SEARCHING') { api.sight = 'SEARCHING'; api.searchT = HEAT.searchSeconds; }
      else api.searchT -= dt;

      // --- drive the units ---
      const sorted = [...units].filter((u) => !u.dead).sort((a, b) =>
        Math.hypot(a.car.x - playerPos.x, a.car.z - playerPos.z) - Math.hypot(b.car.x - playerPos.x, b.car.z - playerPos.z));
      sorted.forEach((u, rank) => {
        const car = u.car;
        const dist = Math.hypot(car.x - playerPos.x, car.z - playerPos.z);
        if (wanted >= 3 && rank >= 2 && dist > 42) u.role = 'ROADBLOCK';
        else if (rank === 1) u.role = 'RAMMING';
        else u.role = 'PURSUIT';
        let tx = playerPos.x, tz = playerPos.z;
        if (u.role === 'ROADBLOCK') {
          // park across the road ahead of the player's heading
          tx = playerPos.x + Math.sin(ctx.playerHeading || 0) * 46;
          tz = playerPos.z + Math.cos(ctx.playerHeading || 0) * 46;
          if (dist < 40) {
            car.speed += (0 - car.speed) * Math.min(1, dt * 3);
            car.sync();
            // officers out and firing once, when the block is set
            if (!u.blockSet && wanted >= 3) {
              u.blockSet = true;
              spawnOfficer(car.x + 2.6, car.z + 1);
              spawnOfficer(car.x - 2.6, car.z - 1);
              if (feed) feed(`${u.callsign}: roadblock set, officers out. Stop the runner.`);
            }
            return;
          }
        }
        const ang = Math.atan2(tx - car.x, tz - car.z);
        let diff = ((ang - car.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        car.heading += Math.max(-1.9 * dt, Math.min(1.9 * dt, diff));
        const top = u.role === 'RAMMING' ? 41 : 37;
        const wantSpeed = dist > 10 ? top : top * 0.35;
        car.speed += (wantSpeed - car.speed) * Math.min(1, dt * 1.4);
        car.x += Math.sin(car.heading) * car.speed * dt;
        car.z += Math.cos(car.heading) * car.speed * dt;
        // ramming contact
        if (dist < 3.4 && Math.abs(car.speed) > 8 && ctx.onRam) ctx.onRam(Math.abs(car.speed));
        car.sync();
        const t = combat.targets.find((tg) => tg.ref === u);
        if (t) { t.x = car.x; t.z = car.z; u.hp = t.hp; }
      });

      // --- officers shoot ---
      for (const o of officers) {
        if (o.down) continue;
        const dist = Math.hypot(o.x - playerPos.x, o.z - playerPos.z);
        o.mesh.rotation.y = Math.atan2(playerPos.x - o.x, playerPos.z - o.z);
        if (dist < 42 && wanted >= 2) {
          o.fireT -= dt;
          if (o.fireT <= 0) {
            o.fireT = rng.range(0.9, 1.7);
            const hit = rng.chance(Math.max(0.12, 0.55 - dist * 0.008));
            combat.enemyFire({ x: o.x, z: o.z }, { x: playerPos.x, z: playerPos.z }, hit);
            if (hit && ctx.onShot) ctx.onShot(rng.range(2.5, 5));
          }
        }
      }

      // --- AIR ONE ---
      if (wanted >= 4 && !heli) {
        heli = makeHeli();
        if (feed) feed('AIR ONE: airborne over the harbor. Spotlight on the runner.');
      }
      if (wanted < 3 && heli) {
        scene.remove(heli);
        heli = null;
      }
      if (heli) {
        heli.position.set(playerPos.x + Math.sin(performance.now() / 2400) * 9, 27, playerPos.z + Math.cos(performance.now() / 2400) * 9);
        heli.userData.rotor.rotation.y += dt * 28;
      }
      return api.sight;
    },

    clearAll() {
      for (const u of units) scene.remove(u.car.mesh);
      units.length = 0;
      for (const o of officers) scene.remove(o.mesh);
      officers.length = 0;
      if (heli) { scene.remove(heli); heli = null; }
      api.sight = 'CLEAR';
    },
  };
  return api;
}
