// All tuning numbers in one place. No behavior here.

// Squad is anchored this far above the bottom of the canvas. Must exceed
// the height of the upgrade panel so the survivors are never obscured.
export const SQUAD_BASE_Y_FROM_BOTTOM = 140;

// Road bounds (fraction of canvas width). Enemies and crates must stay inside this.
// Background paints road from 8% to 92%; we clamp gameplay to 10%-90% for visual margin.
export const ROAD_LEFT_PCT = 0.10;
export const ROAD_RIGHT_PCT = 0.90;

export const BULLET_RADIUS = 7;
export const ZOMBIE_RADIUS = 7;
export const BRUTE_RADIUS = 22;
export const CRATE_HALF_W = 45;
export const CRATE_HALF_H = 30;

export const BULLET_BASE_SPEED = 4.0;
export const BULLET_SPEED_PER_POWER = 0.15;

export const FIRE_RATE_BASE_MS = 200;
export const FIRE_RATE_FLOOR_MS = 60;
export const FIRE_RATE_PER_POWER_MS = 20;
export const FIRE_RATE_PER_LEVEL_MS = 10;

export const SQUAD_SIZE_TIERS = [200, 300, 400, 500];
export const FIRE_POWER_MAX = 6;
export const FIRE_RATE_TIER_MAX = 5;

export const UPGRADE_COST_BASE = {
  power: 50,
  rate: 40,
  size: 70,
};
export const UPGRADE_COST_GROWTH = 1.8;

export const WAVE_REST_MS = 2400;
export const WAVE_BANNER_MS = 2200;

// Combo / RAMPAGE
export const COMBO_WINDOW_MS = 5000;
export const COMBO_THRESHOLD = 25;
export const RAMPAGE_DURATION_MS = 5000;

// Particles
export const PARTICLE_POOL_SIZE = 500;

// Spatial bucket
export const BUCKET_HEIGHT = 64;

// Gate spawn
export const GATE_SPAWN_MS_BASE = 3800;
export const CRATE_SPAWN_MS_BASE = 17000;

// Palette
export const COLORS = {
  // Sky / road
  skyDay: '#9bb6c9',
  skyDusk: '#6b5b85',
  skyNight: '#1a1f3a',
  roadDay: '#5a5a4e',
  roadDusk: '#3d3a3a',
  roadNight: '#1f1f24',
  laneStripe: 'rgba(255, 220, 100, 0.55)',
  laneStripeNight: 'rgba(255, 220, 100, 0.35)',

  // Survivor (green camo)
  survivor: '#3d6b3a',
  survivorDark: '#264016',
  survivorLight: '#9bbf6b',
  survivorHelmet: '#2a3a1e',

  // Bullet glow
  bullet: '#fff39a',
  bulletGlow: '#ffd24a',

  // Zombie
  zombie: '#7c8f5a',
  zombieDark: '#3f4a2a',
  zombieLight: '#b0c189',
  zombieEye: '#1a1410',
  zombieClothes: '#5e4a36',

  // Runner zombie
  runner: '#9a7f4a',
  runnerDark: '#5a4628',

  // Spitter
  spitter: '#5a8a4a',
  spitterDark: '#2d4523',
  spit: '#a8d65a',

  // Brute
  brute: '#6b8a3a',
  bruteDark: '#3a4a1d',
  bruteLight: '#a8c97a',
  bruteScar: '#5a1818',

  // Crate
  crateWood: '#7a5a36',
  crateWoodDark: '#3e2c1a',
  crateMetal: '#4a4a4a',
  crateBolt: '#1a1a1a',
  crateBand: '#3d3322',

  // Gates
  gateAdd: '#3a8fbf',
  gateAddBorder: '#1c4e6a',
  gateMult: '#2bb88a',
  gateMultBorder: '#1a6650',
  gateSub: '#8a2a2a',
  gateSubBorder: '#4a1414',
  gatePost: '#2c1f12',

  // Particles
  goo: '#9bbf3a',
  gooDark: '#5a7a1a',
  spark: '#ffb84a',

  // UI vignette
  rampageVignette: 'rgba(180, 30, 30, 0.18)',
};
