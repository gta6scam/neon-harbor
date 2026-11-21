// missions.js — the story machine: it walks the eight jobs stage by stage, plants
// the glowing beacon on the live target, runs the clock, pays out with the CHAIN
// multiplier, raises the heat per drop and prints MISSION PASSED when a job closes.
// It owns no rendering of its own beyond the beacon — the HUD reads it every frame.

import { DROPS } from './data-city.js';
import { MISSIONS, medalFor } from './data-missions.js';
import { HEAT } from './config.js';
import { makeGlow } from './world.js';

export function createMissions(scene, glowTex, events) {
  const beacon = new THREE.Group();
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 26, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  pillar.position.y = 13;
  beacon.add(pillar);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.16, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xff2e88 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.25;
  beacon.add(ring);
  const glow = makeGlow(glowTex, 0xff2e88, 13);
  glow.position.y = 1.6;
  beacon.add(glow);
  scene.add(beacon);

  const M = {
    beacon,
    index: -1, stage: 0, timer: 0, stagePar: 0, active: false, cargo: false,
    mission: null, timeLeftTotal: 0,

    targetPos() {
      if (!this.active) return null;
      const st = this.mission.stages[this.stage];
      if (!st || st.kind === 'escape') return null;
      return DROPS[st.at].pos;
    },
    targetName() {
      if (!this.active) return '';
      const st = this.mission.stages[this.stage];
      return st.kind === 'escape' ? 'VANISH — LOSE THE TAIL' : DROPS[st.at].name;
    },

    start(index, state) {
      this.index = index;
      this.mission = MISSIONS[index];
      this.stage = 0;
      this.cargo = false;
      this.active = true;
      this.timeLeftTotal = 0;
      state.wanted = Math.max(state.wanted, this.mission.heat);
      state.heat = Math.max(state.heat, this.mission.heat);
      this.armStage(state);
      events.dialogue(this.mission.giver, this.mission.intro);
      events.feed(`New job posted: ${this.mission.name} — $${this.mission.pay.toLocaleString()} on the table.`);
    },

    armStage(state) {
      const st = this.mission.stages[this.stage];
      this.timer = st.time;
      this.stagePar = st.time;
      const [x, z] = st.kind === 'escape' ? [state.playerPos.x, state.playerPos.z] : DROPS[st.at].pos;
      beacon.position.set(x, 0, z);
      beacon.visible = st.kind !== 'escape';
      pillar.material.color.set(st.kind === 'pickup' ? 0x22e6ff : 0xff2e88);
      ring.material.color.set(st.kind === 'pickup' ? 0x22e6ff : 0xff2e88);
      glow.material.color.set(st.kind === 'pickup' ? 0x22e6ff : 0xff2e88);
      if (this.stage > 0 || this.mission.introDone) events.dialogue(this.mission.giver, st.line);
      this.mission.introDone = true;
    },

    update(dt, state, police) {
      if (!this.active) return;
      this.timer -= dt;
      this.timeLeftTotal += dt;
      ring.rotation.z += dt * 1.4;
      glow.material.opacity = 0.65 + Math.sin(performance.now() / 240) * 0.25;
      const st = this.mission.stages[this.stage];

      if (this.timer <= 0) {
        this.active = false;
        beacon.visible = false;
        events.fail(this.mission);
        return;
      }

      if (st.kind === 'escape') {
        if (state.wanted < this.mission.heat || state.wanted === 0) this.completeStage(state);
        return;
      }
      const [tx, tz] = DROPS[st.at].pos;
      const d = Math.hypot(state.playerPos.x - tx, state.playerPos.z - tz);
      if (d < 6.2) {
        if (st.kind === 'pickup') {
          this.cargo = true;
          events.banner('CARGO ABOARD', 'The box rides with you now — keep it whole');
          events.audio('pickup');
          this.completeStage(state);
        } else if (st.kind === 'drop' && this.cargo) {
          this.cargo = false;
          state.chain = Math.min(5, state.chain + 0.5);
          state.chainTimer = 26;
          const cut = Math.round(900 * state.chain);
          state.cash += cut;
          state.stats.drops += 1;
          state.heat = Math.min(HEAT.maxStars + 0.99, state.heat + HEAT.perDrop);
          events.banner('DROP DELIVERED', `+$${cut.toLocaleString()} · CHAIN ×${state.chain.toFixed(1)} · heat rising`);
          events.feed(`Drop confirmed at ${DROPS[st.at].name}. Dispatch is recalculating.`);
          events.audio('deliver');
          this.completeStage(state);
        } else if (st.kind === 'drop' && !this.cargo) {
          events.feed('No cargo aboard — the pickup comes first, runner.');
        }
      }
    },

    completeStage(state) {
      this.stage += 1;
      if (this.stage >= this.mission.stages.length) {
        this.active = false;
        beacon.visible = false;
        const medal = medalFor(this.timer, this.stagePar);
        state.cash += this.mission.pay;
        state.rp += this.mission.rp;
        state.stats.jobsDone += 1;
        state.medals[this.mission.id] = medal;
        events.missionPassed(this.mission, medal);
      } else {
        this.armStage(state);
      }
    },
  };
  return M;
}
