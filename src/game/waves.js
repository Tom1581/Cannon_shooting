// Every wave features a boss-tier monster. Bosses rotate through the roster,
// scaling in HP/summon rate (which is handled inside elites.js + brute.js).
//
// Roster cycle (6 bosses, repeats):
//   1. HULK     — tank + walker summons
//   2. SPAWNER  — bursts of walker swarms
//   3. SCREAMER — runner summons + scream visual
//   4. WARDEN   — armored, takes reduced damage until shield breaks (+ crawlers)
//   5. BLOATER  — explodes on death, scatters spitters
//   6. BRUTE    — top-tier; bigger, more HP, walker reinforcements

const BOSS_CYCLE = ['hulk', 'spawner', 'screamer', 'armored', 'bloater', 'brute'];
const BOSS_LABEL = {
  hulk:     'HULK',
  spawner:  'SPAWNER',
  screamer: 'SCREAMER',
  armored:  'WARDEN',
  bloater:  'BLOATER',
  brute:    'BRUTE',
};

function cap(n, ceiling) { return Math.min(ceiling, Math.max(0, n)); }

function bossForWave(n) {
  // 1-indexed; cycle through the roster
  return BOSS_CYCLE[(n - 1) % BOSS_CYCLE.length];
}

export function waveAt(n) {
  const boss = bossForWave(n);
  const isBrute = boss === 'brute';
  const cycleNum = Math.floor((n - 1) / BOSS_CYCLE.length); // 0, 1, 2... how many full cycles done
  const intensity = 1 + cycleNum * 0.3;  // bosses harder each lap

  // Multiple bosses on later Brute appearances (every 6 waves the Brute is the boss,
  // and after wave 12 they come in pairs, after wave 24 in trios).
  const bossCount = isBrute ? (n >= 24 ? 3 : n >= 12 ? 2 : 1) : 1;

  const groups = [];

  // ----- MINION PHASE (front-loaded so they come before the boss) -----
  const minionCountBase = Math.floor(6 + n * 1.4 * intensity);
  groups.push({
    delay: 0,
    kind: 'walker',
    count: cap(minionCountBase, 50),
    spread: 100,
  });

  if (n >= 2) {
    groups.push({
      delay: 2600,
      kind: 'runner',
      count: cap(2 + Math.floor(n * 0.8 * intensity), 14),
      spread: 70,
    });
  }

  if (n >= 4) {
    groups.push({
      delay: 4800,
      kind: 'walker',
      count: cap(8 + Math.floor(n * 1.8 * intensity), 56),
      spread: 110,
    });
  }

  if (n >= 6) {
    groups.push({
      delay: 6800,
      kind: 'spitter',
      count: cap(1 + Math.floor(n / 4 * intensity), 6),
      spread: 100,
    });
  }

  if (n >= 9) {
    groups.push({
      delay: 8000,
      kind: 'crawler',
      count: cap(3 + Math.floor(n / 3 * intensity), 14),
      spread: 90,
    });
  }

  // ----- BOSS PHASE (enters at the END of the wave as the final gate) -----
  // The wave cannot end until the boss dies, so this is the climax fight.
  groups.push({
    delay: 9500,
    kind: boss,
    count: bossCount,
    spread: bossCount > 1 ? 60 : 0,
  });

  // Banner
  let banner = `WAVE ${n} — ${BOSS_LABEL[boss]}`;
  if (bossCount > 1) banner = `WAVE ${n} — ${BOSS_LABEL[boss]} ×${bossCount}`;

  // Duration grows with wave but capped — the boss alone can drag a wave out,
  // so don't make it too long. Wave naturally ends when boss + minions clear.
  const duration = 18000 + Math.min(10000, n * 280);

  return {
    isBoss: isBrute || bossCount > 1, // music intensity flag — Brute waves always max
    duration,
    banner,
    groups,
  };
}
