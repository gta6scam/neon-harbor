// vehicles.js — every car in Puerto Bruma: the mesh factory (body, cabin, wheels,
// headlight and taillight glow), the arcade driving model the player uses, and the
// traffic fleet that cruises the road grid on right-hand lanes, braking for
// whatever is ahead. Police units are built here too and driven by police.js.

import { CITY, DRIVE } from './config.js';
import { collide, makeGlow } from './world.js';

export const CAR_MODELS = [
  { name: 'BRUMA COUGAR GT', color: 0xff2e88, w: 2.15, l: 4.7, top: 1.0 },
  { name: 'TAXI FARO', color: 0xffb52e, w: 1.95, l: 4.4, top: 0.82 },
  { name: 'SEDÁN COMÚN', color: 0x3a6ea8, w: 1.9, l: 4.3, top: 0.78 },
  { name: 'SEDÁN COMÚN', color: 0x707a88, w: 1.9, l: 4.3, top: 0.78 },
  { name: 'FURGONETA MUELLE', color: 0x2a8a7e, w: 2.05, l: 5.0, top: 0.66 },
  { name: 'COUPÉ VERTIGO', color: 0x22e6ff, w: 2.0, l: 4.4, top: 0.94 },
  { name: 'PICAP BRUMA', color: 0x8a4a2a, w: 2.05, l: 4.9, top: 0.72 },
];

export function makeCarMesh(THREE, glowTex, model, opts = {}) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: opts.color ?? model.color, emissive: opts.color ?? model.color, emissiveIntensity: 0.24 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(model.w, 0.62, model.l), bodyMat);
  body.position.y = 0.62;
  g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(model.w * 0.82, 0.55, model.l * 0.46),
    new THREE.MeshLambertMaterial({ color: 0x0c1626, emissive: 0x1a3a55, emissiveIntensity: 0.7 }),
  );
  cabin.position.set(0, 1.18, -model.l * 0.05);
  g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0c });
  const wheels = [];
  for (const [wx, wz] of [[-model.w / 2, model.l / 2 - 0.8], [model.w / 2, model.l / 2 - 0.8], [-model.w / 2, -model.l / 2 + 0.8], [model.w / 2, -model.l / 2 + 0.8]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.36, wz);
    g.add(w); wheels.push(w);
  }
  const hl = makeGlow(glowTex, 0xcfefff, 1.5); hl.position.set(-model.w / 2 + 0.3, 0.66, model.l / 2 + 0.25); g.add(hl);
  const hr = makeGlow(glowTex, 0xcfefff, 1.5); hr.position.set(model.w / 2 - 0.3, 0.66, model.l / 2 + 0.25); g.add(hr);
  const tl = makeGlow(glowTex, 0xff2244, 1.7); tl.position.set(0, 0.7, -model.l / 2 - 0.2); g.add(tl);
  // neon underglow: the harbour look, and it keeps every car readable at night
  const under = makeGlow(glowTex, opts.color ?? model.color, 6.4);
  under.position.set(0, 0.32, 0);
  under.material.opacity = 0.34;
  g.add(under);
  if (opts.lightbar) {
    const bar = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.5), new THREE.MeshLambertMaterial({ color: 0x101418 }));
    bar.add(base);
    const red = makeGlow(glowTex, 0xff2233, 2.6); red.position.set(-0.4, 0.15, 0); bar.add(red);
    const blue = makeGlow(glowTex, 0x2266ff, 2.6); blue.position.set(0.4, 0.15, 0); bar.add(blue);
    bar.position.set(0, 1.55, -model.l * 0.05);
    g.add(bar);
    g.userData.lightbar = { red, blue };
  }
  g.userData.wheels = wheels;
  return g;
}

function freshCar(scene, glowTex, model, opts) {
  const mesh = makeCarMesh(THREE, glowTex, model, opts);
  scene.add(mesh);
  return {
    mesh, model, x: 0, z: 0, heading: 0, speed: 0,
    condition: 100, driver: null, dead: false, steerVis: 0,
    place(x, z, heading) {
      this.x = x; this.z = z; this.heading = heading;
      this.sync();
    },
    sync() {
      this.mesh.position.set(this.x, 0, this.z);
      this.mesh.rotation.y = this.heading;
      const spin = this.speed * 0.045;
      for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
      if (this.mesh.userData.lightbar) {
        const t = performance.now() / 130;
        this.mesh.userData.lightbar.red.material.opacity = (Math.sin(t) > 0) ? 0.95 : 0.1;
        this.mesh.userData.lightbar.blue.material.opacity = (Math.sin(t) > 0) ? 0.1 : 0.95;
      }
    },
  };
}

const LANES = [-264, -220, -176, -132, -88, -44, 0, 44, 88, 132, 176, 220, 264];

export function createVehicles(scene, glowTex, rng, colliders) {
  const hero = freshCar(scene, glowTex, CAR_MODELS[0], {});
  const traffic = [];
  for (let i = 0; i < 15; i++) {
    const model = CAR_MODELS[1 + rng.int(0, CAR_MODELS.length - 2)];
    const car = freshCar(scene, glowTex, model, {});
    const horizontal = rng.chance(0.5);
    const lane = LANES[rng.int(0, LANES.length - 1)];
    const along = rng.range(-CITY.extent, CITY.extent - 20);
    car.dir = horizontal ? (rng.chance(0.5) ? 0 : 2) : (rng.chance(0.5) ? 1 : 3); // 0:+x 1:+z 2:-x 3:-z
    if (horizontal) car.place(along, lane + 3.2, car.dir === 0 ? Math.PI / 2 : -Math.PI / 2);
    else car.place(lane + 3.2, along, car.dir === 1 ? 0 : Math.PI);
    car.cruise = rng.range(8, 13.5) * model.top + 5;
    car.speed = car.cruise;
    traffic.push(car);
  }

  function trafficStep(car, dt, playerPos) {
    // heading from dir
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const [dx, dz] = dirs[car.dir];
    // obstacle ahead? (player car, other traffic, anything slow)
    let blocked = false;
    const aheadX = car.x + dx * 8, aheadZ = car.z + dz * 8;
    if (playerPos && Math.abs(playerPos.x - aheadX) < 3.4 && Math.abs(playerPos.z - aheadZ) < 3.4) blocked = true;
    for (const other of traffic) {
      if (other !== car && Math.abs(other.x - aheadX) < 3.2 && Math.abs(other.z - aheadZ) < 3.2) blocked = true;
    }
    car.speed += ((blocked ? 0 : car.cruise) - car.speed) * Math.min(1, dt * 2.2);
    car.x += dx * car.speed * dt;
    car.z += dz * car.speed * dt;
    // turn at the city edge or randomly at intersections
    const atCrossing = LANES.some((l) => Math.abs(car.x - l) < 1.4) && LANES.some((l) => Math.abs(car.z - l) < 1.4);
    if (Math.abs(car.x) > CITY.extent - 6 || Math.abs(car.z) > CITY.extent - 6 || car.z > CITY.waterZ - 14) {
      car.dir = (car.dir + 2) % 4;
    } else if (atCrossing && !car.turned && rng.chance(0.012)) {
      car.dir = (car.dir + (rng.chance(0.5) ? 1 : 3)) % 4;
      car.turned = true;
      const snap = LANES.reduce((a, b) => (Math.abs(b - (car.dir % 2 === 0 ? car.z : car.x)) < Math.abs(a - (car.dir % 2 === 0 ? car.z : car.x)) ? b : a), LANES[0]);
      if (car.dir % 2 === 0) car.z = snap + 3.2; else car.x = snap + 3.2;
    }
    if (!atCrossing) car.turned = false;
    const headings = [Math.PI / 2, 0, -Math.PI / 2, Math.PI];
    car.heading = headings[car.dir];
    const [cx, cz] = collide(colliders, car.x, car.z, 1.3);
    car.x = cx; car.z = cz;
    car.sync();
  }

  return {
    hero, traffic,
    spawnExtra(modelIdx, opts) { return freshCar(scene, glowTex, CAR_MODELS[modelIdx], opts); },
    update(dt, playerPos) { for (const car of traffic) if (!car.dead) trafficStep(car, dt, playerPos); },

    // The player's driving model: arcade, forgiving, with a nitro kick and honest collisions.
    drive(car, dt, input, upgrades) {
      const topSpeed = DRIVE.maxSpeed * car.model.top * (1 + 0.18 * upgrades.engine) * (input.nitro && upgrades.nitro > 0 ? 1.35 : 1);
      if (input.up) car.speed += DRIVE.accel * dt * (car.speed < 0 ? 2.2 : 1);
      else if (input.down) car.speed -= DRIVE.brake * dt * (car.speed > 0 ? 1.6 : 0.55);
      else car.speed -= car.speed * DRIVE.drag * dt * 0.4;
      car.speed -= car.speed * DRIVE.drag * dt * Math.abs(car.speed) / topSpeed;
      car.speed = Math.max(-DRIVE.maxReverse, Math.min(topSpeed, car.speed));
      if (Math.abs(car.speed) > 0.4) {
        const steerAuthority = Math.min(1, Math.abs(car.speed) / 9);
        car.heading += input.steer * DRIVE.steer * steerAuthority * dt * (car.speed > 0 ? 1 : -1) * (1 - Math.min(0.45, Math.abs(car.speed) / topSpeed * 0.45));
      }
      const nx = car.x + Math.sin(car.heading) * car.speed * dt;
      const nz = car.z + Math.cos(car.heading) * car.speed * dt;
      const [cx, cz] = collide(colliders, nx, nz, 1.45);
      if ((Math.abs(cx - nx) > 0.01 || Math.abs(cz - nz) > 0.01) && Math.abs(car.speed) > 7) {
        car.condition = Math.max(0, car.condition - Math.abs(car.speed) * 0.35);
        car.speed *= -0.25;
        car.crashed = true;
      }
      car.x = cx; car.z = cz;
      car.steerVis = input.steer;
      car.sync();
      return Math.abs(car.speed) * 3.6;
    },
  };
}
