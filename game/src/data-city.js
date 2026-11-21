// data-city.js — Puerto Bruma on paper: five named districts with standing values,
// the points of interest the night revolves around, street races and the 24 neon
// shells. Positions are world metres on the road grid (roads every 44 m).

export const DISTRICTS = [
  { id: 'muelle',  name: 'MUELLE VIEJO',  short: 'Old Dock',      rect: [-264, 60, -60, 264],   tint: '#123a4d', standing: 62 },
  { id: 'neon',    name: 'NEON MILE',     short: 'Neon Mile',     rect: [-60, -60, 150, 264],   tint: '#3d1440', standing: 41 },
  { id: 'mercado', name: 'MERCADO ALTO',  short: 'Night Market',  rect: [60, -190, 264, -60],   tint: '#3d2c10', standing: 35 },
  { id: 'colina',  name: 'COLINA SERENA', short: 'Serene Hill',   rect: [-264, -264, -60, -60], tint: '#14332a', standing: 18 },
  { id: 'puerto',  name: 'PUERTO NUEVO',  short: 'New Port',      rect: [150, 130, 264, 264],   tint: '#10283d', standing: 27 },
];

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    const [x0, z0, x1, z1] = d.rect;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return d;
  }
  return DISTRICTS[1];
}

export const POIS = {
  pier9:      { name: 'PIER 9 — VEGA DOCKS',      pos: [-176, 176], kind: 'pickup' },
  garage:     { name: 'TALLER BRUMA GARAGE',     pos: [-88, 88],   kind: 'garage' },
  market:     { name: 'MERCADO ALTO NIGHT MARKET', pos: [176, -132], kind: 'market' },
  lighthouse: { name: 'FARO DEL SUR LIGHTHOUSE', pos: [220, 208],  kind: 'landmark' },
  radioTower: { name: 'ONDA NEÓN TOWER',         pos: [44, -220],  kind: 'radio' },
  safehouse:  { name: 'CASA BRUMA SAFEHOUSE',    pos: [-220, -176], kind: 'safehouse' },
};

// Drop points the missions visit, named like the city talks about them.
export const DROPS = {
  crane:    { name: 'the glowing dock crane, Pier 9',      pos: [-176, 176] },
  casino:   { name: 'CASINO AZAHAR back door',             pos: [88, 44] },
  market:   { name: 'MERCADO ALTO fish stalls',            pos: [176, -132] },
  hotel:    { name: 'HOTEL LUCERO service bay',            pos: [44, -88] },
  hill:     { name: 'COLINA SERENA overlook',              pos: [-176, -176] },
  ferry:    { name: 'LAST FERRY terminal gate',            pos: [220, 176] },
  tower:    { name: 'ONDA NEÓN tower yard',                pos: [44, -220] },
  yard:     { name: 'CONTAINER YARD K-7',                  pos: [176, 220] },
  bridge:   { name: 'PUENTE BRUMA south ramp',             pos: [0, 132] },
  chapel:   { name: 'CAPILLA DEL MAR steps',               pos: [-132, -44] },
};

export const RACES = [
  { name: 'HARBOUR SPRINT', gates: [[-220, 220], [-44, 220], [132, 220], [220, 132], [220, 44]] },
  { name: 'NEON MILE TT',   gates: [[-44, 88], [44, 88], [132, 44], [132, -44], [44, -132]] },
  { name: 'COLINA CLIMB',   gates: [[-220, -44], [-220, -132], [-132, -220], [-44, -220], [44, -176]] },
];

// 24 neon shells: collectible conchas glowing cyan around the city.
export const SHELLS = [
  [-168, 168], [-96, 204], [-240, 96], [-60, 156], [204, 204], [156, 156],
  [96, 96], [24, 60], [-24, 24], [-120, 60], [60, -24], [120, -60],
  [204, -96], [168, -168], [96, -144], [24, -204], [-48, -168], [-120, -120],
  [-204, -204], [-228, -96], [-168, -24], [228, -24], [72, 204], [-204, 228],
].map(([x, z], i) => ({ id: i, pos: [x, z] }));
