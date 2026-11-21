// data-crew.js — the people and tools of the night: three crew members with portrait
// colours and cooldown abilities, the six-slot weapon wheel with prices and locks,
// the respect ladder with named unlocks, and the three SoundWeaver radio stations.

export const CREW = [
  {
    id: 'pato', name: 'PATO REYES', role: 'PLATE GHOST', key: 'Z',
    ability: 'SWAP PLATES', cooldown: 45,
    desc: 'Burns the plates the cameras caught. Drops one star and breaks line of sight.',
    skin: '#c98a5e', hair: '#14100e', accent: '#22e6ff', line: 'Plates are ash, boss. You were never on that bridge.',
  },
  {
    id: 'lula', name: 'LULA FERRER', role: 'WRENCH', key: 'X',
    ability: 'QUICK FIX', cooldown: 40,
    desc: 'Patches the car mid-run: +55% condition and the smoke stops lying about you.',
    skin: '#8a5a34', hair: '#3a1408', accent: '#ffb52e', line: 'Hold her steady — two bolts and she sings again.',
  },
  {
    id: 'ibo', name: 'IBO SANZ', role: 'LOOKOUT', key: 'C',
    ability: 'EYES OUT', cooldown: 50,
    desc: 'Marks every police unit on the minimap and slows the heat for 20 seconds.',
    skin: '#e0aa72', hair: '#05070c', accent: '#ff2e88', line: 'Two on the Mile, one bird warming up. Take the dock road.',
  },
];

export const WEAPONS = [
  { id: 'fists',   name: 'FISTS',        icon: '✊', ammo: '∞',   price: 0,    unlock: null,            damage: 8,  rate: 0.4 },
  { id: 'pistol',  name: 'P-9 PISTOL',   icon: '⌐',  ammo: '48',  price: 0,    unlock: null,            damage: 16, rate: 0.28 },
  { id: 'smg',     name: 'RÁFAGA SMG',   icon: '≫',  ammo: '120', price: 2400, unlock: 'JOB 2',           damage: 12, rate: 0.09 },
  { id: 'shotgun', name: 'ESCOPETA-12',  icon: '═',  ammo: '24',  price: 3900, unlock: 'JOB 4',           damage: 34, rate: 0.8 },
  { id: 'rifle',   name: 'KR-7 RIFLE',   icon: '╪',  ammo: '90',  price: 6200, unlock: 'WHEELMAN',        damage: 26, rate: 0.16 },
  { id: 'sniper',  name: 'FARO SNIPER',  icon: '┼',  ammo: '10',  price: 9800, unlock: 'GHOST',           damage: 90, rate: 1.4 },
];

export const RANKS = [
  { name: 'PIER HAND',   rp: 0,    unlock: 'P-9 PISTOL' },
  { name: 'HARBOR RAT',  rp: 300,  unlock: 'RÁFAGA SMG in the wheel' },
  { name: 'DOCK RUNNER', rp: 700,  unlock: 'TALLER BRUMA engine tier 2' },
  { name: 'WHEELMAN',    rp: 1200, unlock: 'KR-7 RIFLE in the wheel' },
  { name: 'GHOST',       rp: 1900, unlock: 'FARO SNIPER + plates burn twice as fast' },
  { name: 'HARBOR LEGEND', rp: 2800, unlock: 'The city stops reporting you: heat decays 2×' },
];

export function rankFor(rp) {
  let cur = RANKS[0], next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (rp >= RANKS[i].rp) { cur = RANKS[i]; next = RANKS[i + 1] || null; }
  }
  return { cur, next };
}

export const RADIO = [
  { station: 'ONDA NEÓN 101.5', track: '“Vidrio Roto” — Las Sirenas', scale: [0, 3, 5, 7, 10], tempo: 0.42, wave: 'sawtooth' },
  { station: 'RADIO FARO 88.9', track: '“Marea Baja” — Capitán Lento', scale: [0, 2, 4, 7, 9], tempo: 0.6, wave: 'triangle' },
  { station: 'BRUMA FM 94.2',   track: '“Contrabando” — DJ Muelle',    scale: [0, 3, 7, 10], tempo: 0.3, wave: 'square' },
];

export const UPGRADES = [
  { id: 'engine', name: 'ENGINE — V8 BRUMA SWAP', desc: '+18% top speed per tier', prices: [1800, 3400, 5900], max: 3 },
  { id: 'armor',  name: 'ARMOR — DOCK PLATE',     desc: '−25% damage taken per tier', prices: [1500, 2900, 4800], max: 3 },
  { id: 'nitro',  name: 'NITRO — TIDE SHOT',      desc: 'SHIFT boost, +1 charge per tier', prices: [2100, 3600, 6400], max: 3 },
];
