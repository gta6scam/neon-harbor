// combat.js — gunplay, kept honest and readable: hitscan shots from the player with
// a muzzle flash and a tracer, registered targets (officers and police cars) that
// take floating damage numbers, and return fire that arrives as tracers and health.
// Numbers are DOM chips projected from world space, so they read at contact-sheet
// size exactly like the top entries print them.

import { makeGlow } from './world.js';

export function createCombat(scene, glowTex, camera) {
  const targets = [];   // {x,z,r,hp,maxHp,kind,ref,onDown}
  const tracers = [];
  const numbers = [];
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden';
  document.body.appendChild(layer);

  const muzzle = makeGlow(glowTex, 0xffd75d, 2.2);
  muzzle.visible = false;
  scene.add(muzzle);
  let muzzleT = 0;

  const tracerMat = new THREE.LineBasicMaterial({ color: 0xffd75d, transparent: true, opacity: 0.9 });

  function addTracer(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(from.x, from.y, from.z), new THREE.Vector3(to.x, to.y, to.z)]);
    const line = new THREE.Line(geo, color ? new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }) : tracerMat);
    scene.add(line);
    tracers.push({ line, life: 0.09 });
  }

  function addNumber(x, y, z, text, color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `position:absolute;font-weight:800;font-size:17px;color:${color};text-shadow:0 0 6px #000,0 1px 2px #000;transform:translate(-50%,-50%)`;
    layer.appendChild(el);
    numbers.push({ el, x, y, z, life: 0.85 });
  }

  const v = new THREE.Vector3();
  return {
    targets,
    register(t) { targets.push(t); return t; },
    clearTargets() { targets.length = 0; },

    // Fire once from `from` toward heading; returns what was hit (or null).
    fire(from, heading, weapon, onEvent) {
      muzzle.position.set(from.x + Math.sin(heading) * 0.7, 1.35, from.z + Math.cos(heading) * 0.7);
      muzzle.visible = true;
      muzzleT = 0.05;
      let best = null, bestD = 60;
      for (const t of targets) {
        if (t.hp <= 0) continue;
        const dx = t.x - from.x, dz = t.z - from.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 60) continue;
        const ang = Math.abs(((Math.atan2(dx, dz) - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (ang < 0.14 + Math.atan2(t.r, dist) && dist < bestD) { best = t; bestD = dist; }
      }
      const endX = best ? best.x : from.x + Math.sin(heading) * 55;
      const endZ = best ? best.z : from.z + Math.cos(heading) * 55;
      addTracer({ x: from.x, y: 1.35, z: from.z }, { x: endX, y: 1.1, z: endZ });
      if (best) {
        best.hp -= weapon.damage;
        addNumber(best.x, 2.4, best.z, `-${weapon.damage}`, best.hp <= 0 ? '#ff5d5d' : '#ffd75d');
        if (best.hp <= 0 && best.onDown) best.onDown(best);
        if (onEvent) onEvent('hit', best);
      } else if (onEvent) onEvent('miss', null);
      return best;
    },

    enemyFire(from, to, hit) {
      addTracer({ x: from.x, y: 1.3, z: from.z }, { x: to.x, y: 1.1, z: to.z }, 0xff5d5d);
      if (hit) addNumber(to.x, 2.2, to.z, 'HIT', '#ff5d5d');
    },

    update(dt) {
      if (muzzleT > 0) { muzzleT -= dt; if (muzzleT <= 0) muzzle.visible = false; }
      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].line);
          tracers[i].line.geometry.dispose();
          tracers.splice(i, 1);
        }
      }
      for (let i = numbers.length - 1; i >= 0; i--) {
        const n = numbers[i];
        n.life -= dt; n.y += dt * 1.4;
        if (n.life <= 0) { n.el.remove(); numbers.splice(i, 1); continue; }
        v.set(n.x, n.y, n.z).project(camera);
        if (v.z > 1) { n.el.style.display = 'none'; continue; }
        n.el.style.display = 'block';
        n.el.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
        n.el.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
        n.el.style.opacity = String(Math.min(1, n.life * 2));
      }
    },
  };
}
