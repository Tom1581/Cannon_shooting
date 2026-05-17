// Persistent player progression — separate from in-run wave numbers.
// XP accrues across all runs and never resets. Level rewards stack permanently.

const STORAGE_KEY = 'zt_player_v1';

export const XP_PER_ZOMBIE = 1;
export const XP_PER_BRUTE = 12;
export const XP_PER_WAVE = 60;
export const XP_PER_FIRST_CLEAR = 120;

// XP needed to reach (level + 1). Hand-tuned to spike noticeably at L5/L10.
export function xpForNext(level) {
  return Math.floor(80 * level * Math.pow(1.35, level - 1));
}

// Total XP needed to be AT a given level (sum of xpForNext below it).
export function xpAtLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForNext(i);
  return total;
}

// Returns the level corresponding to a given total XP.
export function levelForXp(xp) {
  let lvl = 1;
  let cum = 0;
  while (true) {
    const need = xpForNext(lvl);
    if (cum + need > xp) return lvl;
    cum += need;
    lvl++;
    if (lvl > 200) return lvl; // sanity
  }
}

// Reward table — applied at run start once the player has reached the level.
// Returned as { startCoins, startPower, startRate, startSize } increments.
// Lookups are cumulative: everything at or below playerLevel applies.
const REWARDS = [
  { atLevel: 2,  startCoins: 50 },
  { atLevel: 3,  startCoins: 50 },                // total +100
  { atLevel: 4,  startPower: 1 },                 // start at Power Lv 2
  { atLevel: 5,  startCoins: 100 },               // total +200
  { atLevel: 6,  startRate: 1 },                  // start at Rate Lv 2
  { atLevel: 7,  startSize: 1 },                  // start with bigger swarm cap
  { atLevel: 8,  startCoins: 100 },               // total +300
  { atLevel: 10, startPower: 1 },                 // start at Power Lv 3
  { atLevel: 12, startCoins: 200 },
  { atLevel: 15, startRate: 1 },                  // start at Rate Lv 3
  { atLevel: 20, startSize: 1 },
];

export function rewardsAtLevel(playerLevel) {
  const r = { startCoins: 0, startPower: 0, startRate: 0, startSize: 0 };
  for (const row of REWARDS) {
    if (playerLevel >= row.atLevel) {
      if (row.startCoins) r.startCoins += row.startCoins;
      if (row.startPower) r.startPower += row.startPower;
      if (row.startRate)  r.startRate  += row.startRate;
      if (row.startSize)  r.startSize  += row.startSize;
    }
  }
  return r;
}

// Returns the NEXT reward the player will unlock (for the UI hint).
export function nextRewardAfter(playerLevel) {
  for (const row of REWARDS) {
    if (row.atLevel > playerLevel) {
      const label =
        row.startCoins ? `+$${row.startCoins} starting coins`
        : row.startPower ? '+1 starting Power'
        : row.startRate  ? '+1 starting Rate'
        : row.startSize  ? '+1 starting Squad tier'
        : 'reward';
      return { atLevel: row.atLevel, label };
    }
  }
  return null;
}

// ----- Persistence -----
export function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { xp: 0, level: 1, highestWave: 0, totalKills: 0 };
    const obj = JSON.parse(raw);
    return {
      xp: obj.xp | 0,
      level: levelForXp(obj.xp | 0),
      highestWave: obj.highestWave | 0,
      totalKills: obj.totalKills | 0,
    };
  } catch (_) {
    return { xp: 0, level: 1, highestWave: 0, totalKills: 0 };
  }
}

export function savePlayer(p) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      xp: p.xp,
      highestWave: p.highestWave,
      totalKills: p.totalKills,
    }));
  } catch (_) {}
}
