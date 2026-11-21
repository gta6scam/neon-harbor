// peds.js — the people of Puerto Bruma: low-poly walkers who pace the sidewalks,
// scatter when a car mounts the kerb or shots ring out, and — awkwardly for you —
// phone the PHCPD when they watch a car being stolen. Witnesses drive the wanted
// system as much as the police do.

import { CITY } from './config.js';

const COATS = [0xff2e88, 0x22e6ff, 0xffb52e, 0x37ff9a, 0xe8ecf2, 0x8a5adf, 0xd86a2a];

export function makePersonMesh(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.27, 0.95, 7),
    new THREE.MeshLambertMaterial({ color }),
  );
  body.position.y = 0.85;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xd9a066 }),
  );
  head.position.y = 1.58;
  g.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), new THREE.MeshLambertMaterial({ color: 0x141a26 }));
  legL.position.set(-0.1, 0.25, 0);
  g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.1; g.add(legR);
  g.userData.legs = [legL, legR];
  return g;
}

export function createPeds(scene, rng, count = 42) {
  const peds = [];
  for (let i = 0; i < count; i++) {
    const mesh = makePersonMesh(COATS[rng.int(0, COATS.length - 1)]);
    scene.add(mesh);
    // walk a block perimeter: pick a block, walk its sidewalk loop
    const bx = rng.int(-5, 4) * CITY.block, bz = rng.int(-5, 4) * CITY.block;
    const ped = {
      mesh, bx, bz, side: rng.int(0, 3), t: rng.next(),
      speed: rng.range(0.028, 0.05), flee: 0, phase: rng.range(0, 6),
      x: 0, z: 0, heading: 0,
    };
    peds.push(ped);
  }

  function loopPoint(ped) {
    const half = CITY.block / 2 - CITY.roadHalf - 1.6;
    const per = ped.t * 4;
    const side = Math.floor(per) % 4, f = per - Math.floor(per);
    const [cx, cz] = [ped.bx + CITY.block / 2, ped.bz + CITY.block / 2];
    if (side === 0) return [cx - half + f * 2 * half, cz - half];
    if (side === 1) return [cx + half, cz - half + f * 2 * half];
    if (side === 2) return [cx + half - f * 2 * half, cz + half];
    return [cx - half, cz + half - f * 2 * half];
  }

  return {
    list: peds,
    witnessesNear(x, z, r) {
      return peds.some((p) => Math.abs(p.x - x) < r && Math.abs(p.z - z) < r);
    },
    update(dt, danger) {
      for (const ped of peds) {
        let speed = ped.speed;
        if (danger) {
          const d = Math.hypot(ped.x - danger.x, ped.z - danger.z);
          if (d < 13) ped.flee = 1.6;
        }
        if (ped.flee > 0) {
          ped.flee -= dt;
          speed = ped.speed * 3.1;
          ped.t += speed * dt * 2.2;
        } else {
          ped.t += speed * dt;
        }
        if (ped.t > 1) ped.t -= 1;
        const [nx, nz] = loopPoint(ped);
        ped.heading = Math.atan2(nx - ped.x, nz - ped.z);
        ped.x = nx; ped.z = nz;
        ped.mesh.position.set(nx, 0, nz);
        ped.mesh.rotation.y = ped.heading;
        const swing = Math.sin(performance.now() / 130 + ped.phase) * (ped.flee > 0 ? 0.7 : 0.38);
        ped.mesh.userData.legs[0].rotation.x = swing;
        ped.mesh.userData.legs[1].rotation.x = -swing;
        ped.mesh.position.y = Math.abs(Math.sin(performance.now() / 130 + ped.phase)) * 0.045;
      }
    },
  };
}
