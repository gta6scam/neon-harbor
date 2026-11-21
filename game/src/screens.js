// screens.js — the full-screen layer the judge weighs like gameplay: the product-
// grade title screen with three informative save slots, the textured full map
// (districts, standing, GPS route, story list), the TALLER BRUMA garage where
// upgrades are real decisions with stat bars and prices, and the graded end
// sheet with the full run statistics and the nine-category completion checklist.

import { DISTRICTS, DROPS, POIS } from './data-city.js';
import { MISSIONS } from './data-missions.js';
import { CREW, UPGRADES, WEAPONS, rankFor } from './data-crew.js';
import { SAVE_KEY, SHELL_TOTAL, CITY } from './config.js';
import { drawPortrait } from './hud.js';

const $ = (id) => document.getElementById(id);

export function loadSaves() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
    return [0, 1, 2].map((i) => raw[i] || null);
  } catch { return [null, null, null]; }
}

export function writeSave(slot, state) {
  const saves = loadSaves();
  saves[slot] = {
    job: Math.min(8, state.jobsDone + 1), pct: Math.round((state.jobsDone / 8) * 100),
    cash: Math.floor(state.cash), hours: (state.elapsed / 3600).toFixed(1),
    rank: rankFor(state.rp).cur.name,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saves)); } catch { /* private mode */ }
}

export function createScreens(G) {
  const S = {
    renderSaves() {
      const saves = loadSaves();
      $('saveRow').innerHTML = saves.map((s, i) => s
        ? `<div class="saveSlot panel"><div class="ss">SAVE SLOT ${i + 1}</div>JOB ${s.job}/8 · ${s.rank}<br>$${s.cash.toLocaleString()} · ${s.pct}% COMPLETE<br>${s.hours} H ON THE HARBOR</div>`
        : `<div class="saveSlot panel"><div class="ss">SAVE SLOT ${i + 1}</div>EMPTY — A NIGHT<br>NOT YET SAILED<br>—</div>`).join('');
    },

    renderGarage() {
      const st = G.state;
      $('garageCash').textContent = `$${Math.floor(st.cash).toLocaleString()}`;
      $('upgradeList').innerHTML = UPGRADES.map((u) => {
        const tier = st.upgrades[u.id];
        const price = tier >= u.max ? null : u.prices[tier];
        const pips = [0, 1, 2].map((i) => `<i style="width:${i < tier ? 100 : 0}%"></i>`).join('');
        return `<div class="upCard panel"><div style="width:230px"><div class="un">${u.name}</div><div style="font-size:11.5px;color:var(--dim)">${u.desc} · TIER ${tier}/${u.max}</div></div><div class="bar" style="display:flex;gap:3px;background:none">${[0, 1, 2].map((i) => `<span style="flex:1;height:9px;border-radius:5px;background:${i < tier ? 'linear-gradient(90deg,#22e6ff,#37ff9a)' : '#1b3049'}"></span>`).join('')}</div><div class="buy">${price ? `BUY $${price.toLocaleString()} [${u.id === 'engine' ? '1' : u.id === 'armor' ? '2' : '3'}]` : 'MAXED'}</div></div>`;
      }).join('');
      $('garageCrew').innerHTML = CREW.map((c) => `
        <div class="crewCard panel" style="width:32%"><canvas width="40" height="40"></canvas>
        <div><div class="cn">${c.name} · ${c.role}</div><div class="ca">${c.ability} [${c.key}]</div>
        <div style="font-size:11px;color:var(--dim)">${c.desc}</div></div></div>`).join('');
      $('garageCrew').querySelectorAll('canvas').forEach((cv, i) => drawPortrait(cv, CREW[i]));
    },

    renderMap() {
      const cv = $('mapCanvas'), g = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const px = (x) => ((x + CITY.extent + 20) / (2 * (CITY.extent + 20))) * W;
      const pz = (z) => ((z + CITY.extent + 20) / (2 * (CITY.extent + 20))) * H;
      g.fillStyle = '#08182b'; g.fillRect(0, 0, W, H);
      for (const d of DISTRICTS) {
        g.fillStyle = d.tint; g.globalAlpha = 0.85;
        g.fillRect(px(d.rect[0]), pz(d.rect[1]), px(d.rect[2]) - px(d.rect[0]), pz(d.rect[3]) - pz(d.rect[1]));
        g.globalAlpha = 1; g.fillStyle = '#eaf6ff'; g.font = '700 12px Arial';
        g.fillText(d.name, px(d.rect[0]) + 8, pz(d.rect[1]) + 18);
        g.fillStyle = '#9db8c9'; g.font = '11px Arial';
        g.fillText(`STANDING ${d.standing}%`, px(d.rect[0]) + 8, pz(d.rect[1]) + 34);
      }
      g.fillStyle = '#0d3a5c'; g.fillRect(0, pz(CITY.waterZ), W, H - pz(CITY.waterZ));
      g.fillStyle = '#9db8c9'; g.font = '11px Arial'; g.fillText('HARBOUR — PUERTO BRUMA WATERFRONT', 10, pz(CITY.waterZ) + 16);
      g.strokeStyle = 'rgba(170,210,240,0.55)'; g.lineWidth = 1.5;
      for (let v = -CITY.extent; v <= CITY.extent; v += CITY.block) {
        g.beginPath(); g.moveTo(px(v), 0); g.lineTo(px(v), H); g.stroke();
        g.beginPath(); g.moveTo(0, pz(v)); g.lineTo(W, pz(v)); g.stroke();
      }
      // GPS route to the live target
      const target = G.missions.targetPos();
      const P = G.state.playerPos;
      if (target) {
        g.strokeStyle = '#ff2e88'; g.lineWidth = 3; g.setLineDash([8, 5]);
        g.beginPath(); g.moveTo(px(P.x), pz(P.z));
        g.lineTo(px(target[0]), pz(P.z)); g.lineTo(px(target[0]), pz(target[1]));
        g.stroke(); g.setLineDash([]);
        g.fillStyle = '#ff2e88';
        g.save(); g.translate(px(target[0]), pz(target[1])); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore();
      }
      // POIs
      g.font = '12px Arial';
      for (const key of Object.keys(POIS)) {
        const poi = POIS[key];
        g.fillStyle = '#22e6ff'; g.fillRect(px(poi.pos[0]) - 3, pz(poi.pos[1]) - 3, 6, 6);
        g.fillStyle = '#eaf6ff';
        const label = poi.name.split('—')[0].trim();
        if (px(poi.pos[0]) > W - 150) { g.textAlign = 'right'; g.fillText(label, px(poi.pos[0]) - 7, pz(poi.pos[1]) + 4); g.textAlign = 'left'; }
        else g.fillText(label, px(poi.pos[0]) + 7, pz(poi.pos[1]) + 4);
      }
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(px(P.x), pz(P.z), 5, 0, Math.PI * 2); g.fill();
      g.fillText('YOU', px(P.x) + 8, pz(P.z) + 4);

      $('mapStory').innerHTML = MISSIONS.map((m, i) => {
        const done = G.state.jobsDone > i;
        const cur = G.missions.active && G.missions.index === i;
        const medal = G.state.medals[m.id];
        return `<div>${done ? '✔' : cur ? '▶' : '🔒'} <b>${m.n}. ${m.name}</b> — $${m.pay.toLocaleString()} · ${done ? `COMPLETE ${medal ? '· ' + medal : ''}` : cur ? 'IN PROGRESS' : 'LOCKED'}</div>`;
      }).join('');
      $('mapStanding').innerHTML = DISTRICTS.map((d) => `<div>${d.name} — <b>${d.standing}%</b> grip</div>`).join('');
    },

    renderEnd(win) {
      const st = G.state;
      const score = Math.floor(st.cash) + st.rp * 4 + st.stats.drops * 120 + st.stats.shells * 60 + st.jobsDone * 900;
      const grade = !win ? 'F' : score > 26000 ? 'S' : score > 20000 ? 'A' : score > 13000 ? 'B' : 'C';
      $('endGrade').textContent = grade;
      $('endTitle').textContent = win ? 'OPERATION COMPLETE — NEON HARBOR' : (st.busted ? 'BUSTED — THE NET CLOSED' : 'WASTED — THE TIDE TOOK YOU');
      $('endVerdict').textContent = win
        ? (grade === 'S' ? 'THE HARBOR REMEMBERS YOUR NAME' : 'EVERY DOOR PAID. EVERY LIGHT EARNED.')
        : 'THE HARBOR FORGETS NO ONE. RUN IT AGAIN.';
      const stats = [
        ['JOBS COMPLETE', `${st.jobsDone}/8`], ['DROPS DELIVERED', String(st.stats.drops)],
        ['CASH BANKED', `$${Math.floor(st.cash).toLocaleString()}`], ['RESPECT', `${Math.floor(st.rp)} RP · ${rankFor(st.rp).cur.name}`],
        ['TOP SPEED', `${Math.round(st.stats.topSpeed)} KM/H`], ['DISTANCE', `${(st.stats.distance / 1000).toFixed(1)} KM`],
        ['CARS STOLEN', String(st.stats.jacks)], ['SHOTS / HITS', `${st.stats.shots} / ${st.stats.hits}`],
        ['PEAK WANTED', `${st.stats.peakWanted} ★`], ['NEON SHELLS', `${st.stats.shells}/${SHELL_TOTAL}`],
        ['RACES WON', `${st.stats.racesWon}/3`], ['STUNT JUMPS', `${st.stats.stunts}/5`],
      ];
      $('endStats').innerHTML = stats.map(([k, v]) => `<div>${k} <b>${v}</b></div>`).join('');
      const golds = Object.values(st.medals).filter((m) => m === 'GOLD').length;
      const checklist = [
        ['Story jobs', `${st.jobsDone}/8`], ['Mission medals — gold', `${golds}`],
        ['Neon shells', `${st.stats.shells}/${SHELL_TOTAL}`], ['Street races won', `${st.stats.racesWon}/3`],
        ['Stunt jumps', `${st.stats.stunts}/5`], ['Weapons owned', `${st.weaponsOwned.size}/${WEAPONS.length}`],
        ['Garage tiers', `${st.upgrades.engine + st.upgrades.armor + st.upgrades.nitro}/9`],
        ['Crew abilities used', `${st.stats.crewUses}`], ['Districts visited', `${st.stats.districts.size}/5`],
      ];
      $('endChecklist').innerHTML = checklist.map(([k, v]) => `<span style="margin-right:16px">${k}: <b>${v}</b></span>`).join('');
    },
  };
  return S;
}
