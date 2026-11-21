// world.js — builds Puerto Bruma in Three.js: a neon port city at night. Gradient
// sky with stars, harbour water, a textured road grid, instanced towers with lit
// windows, canvas-texture neon signs, the K-7 container yard, gantry cranes and
// the Faro del Sur lighthouse. Also exports the glow-sprite helpers every other
// system uses for headlights, sirens and spotlights, and the collider list.

import { CITY, PALETTE } from './config.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export function makeGlowTexture() {
  return canvasTexture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  });
}

export function makeGlow(glowTex, color, scale) {
  const m = new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 });
  const s = new THREE.Sprite(m);
  s.scale.set(scale, scale, 1);
  return s;
}

function skyTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#02040c');
    grad.addColorStop(0.45, '#0a1030');
    grad.addColorStop(0.72, '#2a1140');
    grad.addColorStop(0.88, '#7a1e52');
    grad.addColorStop(1, '#c73a6d');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

function groundTexture(rng) {
  return canvasTexture(2048, 2048, (g, w, h) => {
    const px = (v) => ((v + CITY.extent + 40) / (2 * (CITY.extent + 40))) * w;
    g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
    // block slabs, slightly varied
    for (let x = -CITY.extent; x < CITY.extent; x += CITY.block) {
      for (let z = -CITY.extent; z < CITY.extent; z += CITY.block) {
        const shade = 10 + rng.int(0, 10);
        g.fillStyle = `rgb(${shade},${shade + 6},${shade + 16})`;
        g.fillRect(px(x + CITY.roadHalf), px(z + CITY.roadHalf), px(x + CITY.block - CITY.roadHalf) - px(x + CITY.roadHalf), px(z + CITY.block - CITY.roadHalf) - px(z + CITY.roadHalf));
      }
    }
    // roads
    g.fillStyle = '#131926';
    for (let v = -CITY.extent; v <= CITY.extent; v += CITY.block) {
      g.fillRect(px(v - CITY.roadHalf), 0, px(v + CITY.roadHalf) - px(v - CITY.roadHalf), h);
      g.fillRect(0, px(v - CITY.roadHalf), w, px(v + CITY.roadHalf) - px(v - CITY.roadHalf));
    }
    // wet neon sheen + centre dashes
    for (let v = -CITY.extent; v <= CITY.extent; v += CITY.block) {
      g.fillStyle = 'rgba(34,230,255,0.16)';
      g.fillRect(px(v - 0.4), 0, px(v + 0.4) - px(v - 0.4), h);
      g.fillStyle = 'rgba(255,213,109,0.5)';
      for (let d = -CITY.extent; d < CITY.extent; d += 8) {
        g.fillRect(px(v - 0.25), px(d), px(v + 0.25) - px(v - 0.25), px(d + 3) - px(d));
        g.fillRect(px(d), px(v - 0.25), px(d + 3) - px(d), px(v + 0.25) - px(v - 0.25));
      }
    }
    // harbour quay edge
    g.fillStyle = '#1d2a3a'; g.fillRect(0, px(CITY.waterZ - 6), w, px(CITY.waterZ) - px(CITY.waterZ - 6));
    g.fillStyle = 'rgba(255,181,46,0.65)';
    for (let d = -CITY.extent; d < CITY.extent; d += 10) g.fillRect(px(d), px(CITY.waterZ - 5), 26, 4);
  });
}

function windowTexture(rng, hue) {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = '#0d1524'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 8; y += 14) {
      for (let x = 8; x < w - 8; x += 16) {
        if (rng.chance(0.42)) {
          g.fillStyle = rng.chance(0.75) ? 'rgba(255,205,120,0.95)' : `hsla(${hue},95%,65%,0.95)`;
          g.fillRect(x, y, 9, 7);
        } else {
          g.fillStyle = 'rgba(40,60,90,0.5)'; g.fillRect(x, y, 9, 7);
        }
      }
    }
  });
}

function signTexture(text, color) {
  return canvasTexture(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = '900 62px Arial';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = 26;
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
    g.shadowBlur = 8; g.fillText(text, w / 2, h / 2);
  });
}

const SIGNS = [
  ['CASINO AZAHAR', '#ff2e88', 88, 30, 44, 0], ['HOTEL LUCERO', '#22e6ff', 44, 26, -88, 1],
  ['ONDA NEÓN', '#ffb52e', 44, 34, -220, 0], ['MERCADO ALTO', '#37ff9a', 176, 24, -132, 1],
  ['TALLER BRUMA', '#22e6ff', -88, 20, 88, 0], ['NEON HARBOR', '#ff2e88', 0, 40, 132, 0],
  ['PIER 9', '#ffb52e', -176, 18, 176, 1], ['FARO DEL SUR', '#eaf6ff', 220, 16, 208, 0],
  ['CLUB VERTIGO', '#ff2e88', 132, 26, 44, 1], ['BAR LA MAREA', '#22e6ff', -44, 16, -44, 0],
  ['CASA BRUMA', '#37ff9a', -220, 18, -176, 1], ['PUERTO NUEVO', '#ffb52e', 220, 22, 176, 0],
];

export function createWorld(canvas, rng) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(PALETTE.fog, 0.0029);
  const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 900);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(820, 24, 16), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(sky);

  // stars
  {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, Math.PI * 2), e = rng.range(0.12, 1.4), r = 780;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbfe8ff, size: 1.6, sizeAttenuation: false, fog: false })));
  }

  scene.add(new THREE.HemisphereLight(0x35507a, 0x0a0614, 0.55));
  const moon = new THREE.DirectionalLight(0x8fb8ff, 0.4);
  moon.position.set(-120, 180, -80);
  scene.add(moon);
  const harbourGlow = new THREE.PointLight(0xff2e88, 1.1, 420, 1.6);
  harbourGlow.position.set(0, 26, 170);
  scene.add(harbourGlow);

  const glowTex = makeGlowTexture();

  // ground + water
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * (CITY.extent + 40), 2 * (CITY.extent + 40)),
    new THREE.MeshLambertMaterial({ map: groundTexture(rng), emissive: 0x93a7c9, emissiveMap: groundTexture(rng), emissiveIntensity: 0.34 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const waterMat = new THREE.MeshBasicMaterial({ color: 0x0a2e4a, transparent: true, opacity: 0.92 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 420), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.4, CITY.waterZ + 205);
  scene.add(water);
  const waterGlow = makeGlow(glowTex, 0xff2e88, 320);
  waterGlow.position.set(0, 2, CITY.waterZ + 60);
  waterGlow.material.opacity = 0.16;
  scene.add(waterGlow);

  const colliders = [];
  const box = (x, z, hw, hd) => colliders.push({ x, z, hw, hd });

  // ---- buildings: three instanced families with different window hues ----
  const families = [
    { hue: 45, color: PALETTE.buildingA }, { hue: 190, color: PALETTE.buildingB }, { hue: 320, color: PALETTE.buildingC },
  ];
  const placements = [[], [], []];
  for (let bx = -CITY.extent + CITY.block; bx < CITY.extent - 4; bx += CITY.block) {
    for (let bz = -CITY.extent + CITY.block; bz < CITY.extent - 4; bz += CITY.block) {
      if (bz > CITY.waterZ - CITY.block) continue;                    // harbour front stays open
      if (bx > 130 && bz > 150) continue;                              // container yard
      if (Math.abs(bx + 176) < 30 && Math.abs(bz - 176) < 30) continue; // pier 9 apron
      const fam = rng.int(0, 2);
      const cx = bx + CITY.roadHalf + 15, cz = bz + CITY.roadHalf + 15;
      const w = rng.range(15, 24), d = rng.range(15, 24);
      const nearMile = Math.abs(bx) < 130 && Math.abs(bz) < 130;
      const hgt = nearMile ? rng.range(26, 58) : rng.range(11, 34);
      placements[fam].push({ x: cx, z: cz, w, d, h: hgt });
      box(cx, cz, w / 2, d / 2);
    }
  }
  const dummy = new THREE.Object3D();
  families.forEach((fam, fi) => {
    const list = placements[fi];
    const mat = new THREE.MeshLambertMaterial({ color: fam.color, emissive: 0xffffff, emissiveMap: windowTexture(rng, fam.hue), emissiveIntensity: 1.2 });
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.h / 2, p.z);
      dummy.scale.set(p.w, p.h, p.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    scene.add(inst);
  });

  // ---- neon signs ----
  for (const [text, color, x, y, z, face] of SIGNS) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 6.5),
      new THREE.MeshBasicMaterial({ map: signTexture(text, color), transparent: true, side: THREE.DoubleSide, fog: false }),
    );
    sign.position.set(x, y, z + (face ? -13.4 : 13.4));
    if (face) sign.rotation.y = Math.PI;
    scene.add(sign);
    const glow = makeGlow(glowTex, new THREE.Color(color), 34);
    glow.position.set(x, y, z + (face ? -14.5 : 14.5));
    glow.material.opacity = 0.35;
    scene.add(glow);
  }

  // ---- container yard K-7 + dock stacks ----
  {
    const colors = [0x0e6e7e, 0x8a3324, 0x7e2a5e, 0x27567e, 0x6e7e0e];
    const geo = new THREE.BoxGeometry(12, 2.6, 2.4);
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 90);
    let i = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 152 + col * 14, z = 168 + row * 11;
        const stack = rng.int(1, 3);
        for (let s = 0; s < stack && i < 90; s++) {
          dummy.position.set(x, 1.3 + s * 2.6, z);
          dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
          inst.setColorAt(i, new THREE.Color(colors[rng.int(0, colors.length - 1)]));
          i++;
        }
        if (row === 2 && col % 2 === 0) box(x, z, 6, 1.4);
      }
    }
    inst.count = i;
    scene.add(inst);
  }

  // ---- gantry cranes over Pier 9 ----
  const craneMat = new THREE.MeshLambertMaterial({ color: 0x1b2a3d, emissive: 0x0a2e3d });
  for (const cx of [-196, -160, 168]) {
    const crane = new THREE.Group();
    const legGeo = new THREE.BoxGeometry(1.6, 30, 1.6);
    for (const [lx, lz] of [[-11, -7], [11, -7], [-11, 7], [11, 7]]) {
      const leg = new THREE.Mesh(legGeo, craneMat);
      leg.position.set(lx, 15, lz);
      crane.add(leg);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(30, 2.2, 2.2), craneMat);
    beam.position.set(0, 30, 0);
    crane.add(beam);
    const cable = new THREE.Mesh(new THREE.BoxGeometry(0.3, 12, 0.3), craneMat);
    cable.position.set(3, 23, 0);
    crane.add(cable);
    const hookBox = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 2.4), new THREE.MeshLambertMaterial({ color: 0x8a3324 }));
    hookBox.position.set(3, 16, 0);
    crane.add(hookBox);
    const lamp = makeGlow(glowTex, PALETTE.cyan, 9);
    lamp.position.set(0, 31, 0);
    crane.add(lamp);
    crane.position.set(cx, 0, 186);
    scene.add(crane);
    box(cx - 11, 186 - 7, 1.2, 1.2); box(cx + 11, 186 + 7, 1.2, 1.2);
  }

  // ---- lighthouse with a rotating sweep ----
  const lighthouse = new THREE.Group();
  {
    const towerMat = new THREE.MeshLambertMaterial({ map: canvasTexture(64, 128, (g, w, h) => {
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#c73a4d' : '#e8ecf2'; g.fillRect(0, i * 32, w, 32); }
    }) });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.4, 26, 12), towerMat);
    tower.position.y = 13;
    lighthouse.add(tower);
    const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    lampMesh.position.y = 27.5;
    lighthouse.add(lampMesh);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(9, 55, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    cone.rotation.z = Math.PI / 2;
    cone.position.set(27, 27.5, 0);
    const pivot = new THREE.Group();
    pivot.add(cone);
    pivot.position.y = 0;
    lighthouse.add(pivot);
    lighthouse.userData.pivot = pivot;
    const glow = makeGlow(glowTex, 0xffe9a0, 16);
    glow.position.y = 27.5;
    lighthouse.add(glow);
    lighthouse.position.set(232, 0, 226);
    scene.add(lighthouse);
    box(232, 226, 4.6, 4.6);
  }

  // ---- streetlight glows along the avenues ----
  {
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 5.6, 0.3), new THREE.MeshLambertMaterial({ color: 0x223349 }), 120);
    let i = 0;
    for (let v = -CITY.extent + CITY.block; v < CITY.extent && i < 118; v += CITY.block * 2) {
      for (const off of [-CITY.roadHalf - 1, CITY.roadHalf + 1]) {
        if (i >= 118) break;
        dummy.position.set(v + off, 2.8, v * 0.37 % 160);
        dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        const glow = makeGlow(glowTex, 0xffc37a, 5.5);
        glow.position.set(v + off, 5.8, v * 0.37 % 160);
        glow.material.opacity = 0.5;
        scene.add(glow);
        i++;
      }
    }
    inst.count = i;
    scene.add(inst);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer, scene, camera, colliders, glowTex,
    update(dt, t) {
      waterMat.color.setHSL(0.58, 0.72, 0.10 + Math.sin(t * 0.7) * 0.02);
      lighthouse.userData.pivot.rotation.y = t * 0.45;
      harbourGlow.intensity = 1.05 + Math.sin(t * 2.3) * 0.15;
    },
  };
}

// Circle-vs-AABB push-out shared by cars and the walker: returns corrected [x, z].
export function collide(colliders, x, z, r) {
  for (const c of colliders) {
    const dx = x - c.x, dz = z - c.z;
    const px = c.hw + r - Math.abs(dx), pz = c.hd + r - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) x = c.x + (dx > 0 ? c.hw + r : -c.hw - r);
      else z = c.z + (dz > 0 ? c.hd + r : -c.hd - r);
    }
  }
  const lim = CITY.extent + 30;
  return [Math.max(-lim, Math.min(lim, x)), Math.max(-lim, Math.min(CITY.waterZ + 40, z))];
}
