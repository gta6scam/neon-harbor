// config.js — every shared constant of NEON HARBOR: the city grid, the neon palette,
// the tuning of cars, heat and time. One place to change the feel of the whole game.

export const CITY = {
  block: 44,            // metres between road centrelines
  roadHalf: 7,          // half the road width
  extent: 264,          // city spans -extent..+extent on x and z
  waterZ: 218,          // harbour water starts south of this z
  sidewalk: 3.4,
};

export const PALETTE = {
  sky: 0x050914,
  fog: 0x0a1024,
  cyan: 0x22e6ff,
  magenta: 0xff2e88,
  amber: 0xffb52e,
  green: 0x37ff9a,
  road: 0x11151d,
  buildingA: 0x1a2436,
  buildingB: 0x232038,
  buildingC: 0x14202e,
};

export const DRIVE = {
  accel: 26,
  brake: 44,
  drag: 0.55,
  maxSpeed: 46,         // m/s, before upgrades
  maxReverse: 12,
  steer: 0.62,
  grip: 9.5,
};

export const HEAT = {
  perDrop: 0.85,        // stars gained per delivered drop
  perJackWitnessed: 1.0,
  perShotFired: 0.12,
  perCopHit: 0.55,
  decayPerSecond: 0.012,
  searchSeconds: 11,    // hidden this long, one star cools
  maxStars: 5,
};

export const KEYS = {
  wheel: 'KeyQ',
  map: 'KeyM',
  garage: 'KeyG',
  radio: 'KeyR',
  mute: 'Digit0',
  interact: 'KeyF',
  crew: ['KeyZ', 'KeyX', 'KeyC'],
};

export const STEP = 1 / 60;
export const SAVE_KEY = 'neon-harbor-saves-v1';
export const SHELL_TOTAL = 24;
