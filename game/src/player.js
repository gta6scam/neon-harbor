// player.js — you, on foot and behind wheels: the walker controller (WASD relative
// to the camera, sprint, honest collisions), getting into cars, and stealing them
// — which is where the witness system bites: a pedestrian in earshot phones the
// PHCPD and the heat arrives before the engine does.

import { collide } from './world.js';
import { makePersonMesh } from './peds.js';

export function createPlayer(scene, colliders) {
  const mesh = makePersonMesh(0xff2e88);
  scene.add(mesh);
  const P = {
    mesh, x: -174, z: 189, heading: 3.14, health: 100, inCar: null, walkPhase: 0,
    pos() { return this.inCar ? { x: this.inCar.x, z: this.inCar.z } : { x: this.x, z: this.z }; },

    update(dt, input, camYaw) {
      if (this.inCar) {
        this.mesh.visible = false;
        this.x = this.inCar.x; this.z = this.inCar.z;
        return;
      }
      this.mesh.visible = true;
      const speed = input.sprint ? 8.4 : 4.6;
      const fwd = (input.up ? 1 : 0) - (input.down ? 1 : 0);
      const str = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (fwd || str) {
        const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
        const mx = (sin * fwd - cos * str), mz = (cos * fwd + sin * str);
        const len = Math.hypot(mx, mz) || 1;
        const nx = this.x + (mx / len) * speed * dt;
        const nz = this.z + (mz / len) * speed * dt;
        const [cx, cz] = collide(colliders, nx, nz, 0.55);
        this.x = cx; this.z = cz;
        this.heading = Math.atan2(mx, mz);
        this.walkPhase += dt * (input.sprint ? 13 : 9);
      }
      this.mesh.position.set(this.x, Math.abs(Math.sin(this.walkPhase)) * 0.05, this.z);
      this.mesh.rotation.y = this.heading;
      const swing = Math.sin(this.walkPhase) * 0.5;
      this.mesh.userData.legs[0].rotation.x = swing;
      this.mesh.userData.legs[1].rotation.x = -swing;
    },

    // Nearest stealable/drivable car within reach, hero car first.
    nearCar(cars) {
      let best = null, bestD = 3.6;
      for (const car of cars) {
        if (car.dead) continue;
        const d = Math.hypot(car.x - this.x, car.z - this.z);
        if (d < bestD) { bestD = d; best = car; }
      }
      return best;
    },

    enter(car) {
      this.inCar = car;
      this.mesh.visible = false;
    },
    exit() {
      if (!this.inCar) return null;
      const car = this.inCar;
      this.inCar = null;
      this.x = car.x + Math.cos(car.heading) * 2.2;
      this.z = car.z - Math.sin(car.heading) * 2.2;
      this.mesh.visible = true;
      return car;
    },
  };
  P.mesh.position.set(P.x, 0, P.z);
  return P;
}
