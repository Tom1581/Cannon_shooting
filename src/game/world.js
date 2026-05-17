import {
  SQUAD_BASE_Y_FROM_BOTTOM,
  BULLET_RADIUS,
  CRATE_HALF_W,
  CRATE_HALF_H,
  BULLET_BASE_SPEED,
  BULLET_SPEED_PER_POWER,
  FIRE_RATE_BASE_MS,
  FIRE_RATE_FLOOR_MS,
  FIRE_RATE_PER_POWER_MS,
  FIRE_RATE_PER_LEVEL_MS,
  SQUAD_SIZE_TIERS,
  FIRE_POWER_MAX,
  FIRE_RATE_TIER_MAX,
  UPGRADE_COST_BASE,
  UPGRADE_COST_GROWTH,
  WAVE_REST_MS,
  WAVE_BANNER_MS,
  COMBO_WINDOW_MS,
  COMBO_THRESHOLD,
  RAMPAGE_DURATION_MS,
  GATE_SPAWN_MS_BASE,
  CRATE_SPAWN_MS_BASE,
  ROAD_LEFT_PCT,
  ROAD_RIGHT_PCT,
} from './config.js';
import { YBucket } from './spatial.js';
import { ParticlePool, GOO, SPARK } from './entities/particle.js';
import { Background } from './background.js';
import { getSquadPositions, drawSandbagPosition, drawBullet } from './entities/survivor.js';
import { makeZombie, drawZombie } from './entities/zombie.js';
import { makeBrute, drawBrute } from './entities/brute.js';
import { makeElite, drawElite } from './entities/elites.js';
import { makeCrate, drawCrate } from './entities/crate.js';
import { makeGate, drawGate } from './entities/gate.js';
import { makeSpit, drawSpit } from './entities/spit.js';
import { waveAt } from './waves.js';
import { audio } from './audio.js';
import {
  loadPlayer,
  savePlayer,
  levelForXp,
  rewardsAtLevel,
  XP_PER_ZOMBIE,
  XP_PER_BRUTE,
  XP_PER_WAVE,
  XP_PER_FIRST_CLEAR,
} from './levels.js';
import { submitScore } from './leaderboard.js';

const PHASE_REST = 0;
const PHASE_ACTIVE = 1;

export class World {
  constructor() {
    this.w = 0;
    this.h = 0;
    this.t = 0;          // monotonic ms since world created
    this.paused = false;
    this.started = false;
    this.gameOver = false;

    // Squad position
    this.squadX = 200;
    this.squadY = 0;

    // Upgrades
    this.firePower = 1;        // 1..6
    this.fireRateTier = 0;     // 0..5
    this.sizeTier = 0;         // index into SQUAD_SIZE_TIERS
    this.coins = 0;
    this.highScore = 0;

    // Wave system
    this.wave = 1;
    this.phase = PHASE_REST;
    this.phaseElapsed = 0;
    this.bannerUntil = 0;
    this.waveData = null;
    this.waveElapsed = 0;
    this.groupCursors = [];    // for each group: how many spawned
    this.kills = 0;
    this.waveKills = 0;

    // Combo / RAMPAGE
    this.recentKills = [];     // timestamps
    this.rampageUntil = 0;

    // Entities
    this.bullets = [];
    this.zombies = [];
    this.brutes = [];
    this.elites = [];      // boss-tier with HP bar + summon: hulk/spawner/screamer/armored/bloater
    this.crates = [];
    this.gates = [];
    this.spits = [];

    // Timers
    this.lastFireT = 0;
    this.lastGateT = 0;
    this.lastCrateT = 0;
    this._gateId = 1;
    this._waveTransitionScheduled = false;

    // Settings
    this.muted = false;
    this.haptic = true;
    this.musicOn = true;

    // Persistent player progression
    const p = loadPlayer();
    this.playerXp = p.xp;
    this.playerLevel = p.level;
    this.highestWave = p.highestWave;
    this.totalKills = p.totalKills;
    this._pendingLevelUp = null;
    this._wavesClearedThisRun = new Set();

    // One-shot revive per run (player can watch ad once to come back)
    this.reviveUsed = false;
    this._submittedThisRun = false;

    // Buff timers
    this.doubleCoinsUntil = 0;

    // Perf
    this.bucket = new YBucket();
    this.particles = new ParticlePool();
    this.bg = new Background();

    // HUD pub/sub
    this._listeners = { hud: new Set(), event: new Set() };
    this._hudThrottleT = 0;

    // Start the first wave (rest period with banner)
    this._beginRest();
    this._loadHighScore();
  }

  // ---------- Pub/sub ----------
  on(channel, fn) {
    this._listeners[channel].add(fn);
    return () => this._listeners[channel].delete(fn);
  }
  _emitHud() {
    for (const fn of this._listeners.hud) fn();
  }
  _emitEvent(name, payload) {
    for (const fn of this._listeners.event) fn(name, payload);
  }

  // ---------- Lifecycle ----------
  resize(w, h) {
    this.w = w;
    this.h = h;
    this.squadY = h - SQUAD_BASE_Y_FROM_BOTTOM;
    if (this.squadX === 200) this.squadX = w / 2;
    this.bg.resize(w, h);
  }
  start() {
    if (this.started) return;
    this._applyRunStartRewards();
    this.started = true;
    this.gameOver = false;
    if (this.musicOn) {
      audio.startMusic();
      audio.setMusicIntensity('play');
    }
    this._emitEvent('started');
  }
  restart() {
    this._loadHighScore();
    const score = this.kills;
    if (score > this.highScore) {
      this.highScore = score;
      this._saveHighScore();
    }
    this.firePower = 1;
    this.fireRateTier = 0;
    this.sizeTier = 0;
    this.coins = 0;
    this.wave = 1;
    this.kills = 0;
    this.waveKills = 0;
    this.bullets.length = 0;
    this.zombies.length = 0;
    this.brutes.length = 0;
    this.elites.length = 0;
    this.crates.length = 0;
    this.gates.length = 0;
    this.spits.length = 0;
    this.recentKills.length = 0;
    this.rampageUntil = 0;
    this.gameOver = false;
    this.lastFireT = 0;
    this.lastGateT = 0;
    this.lastCrateT = 0;
    this._waveTransitionScheduled = false;
    this._wavesClearedThisRun.clear();
    this.reviveUsed = false;
    this._submittedThisRun = false;
    this._applyRunStartRewards();
    this._beginRest();
    this.started = true;
    this._emitHud();
    this._emitEvent('restart');
  }
  _applyRunStartRewards() {
    const r = rewardsAtLevel(this.playerLevel);
    this.coins = r.startCoins;
    this.firePower = 1 + r.startPower;
    this.fireRateTier = r.startRate;
    this.sizeTier = r.startSize;
  }
  setMuted(m) {
    this.muted = m;
    audio.setMuted(m);
    // Re-enable music if the player still wants music
    if (!m && this.musicOn) { audio.startMusic?.(); }
    localStorage.setItem('zt_muted', m ? '1' : '0');
  }
  setHaptic(h) { this.haptic = h; localStorage.setItem('zt_haptic', h ? '1' : '0'); }
  setMusicOn(on) {
    this.musicOn = on;
    if (on) {
      audio.startMusic();
      audio.setMusicIntensity(this.started ? (this.waveData?.isBoss ? 'boss' : 'play') : 'menu');
    } else {
      audio.stopMusic();
    }
    localStorage.setItem('zt_music', on ? '1' : '0');
  }
  _loadHighScore() {
    try { this.highScore = parseInt(localStorage.getItem('zt_high') || '0', 10) || 0; } catch (_) {}
    try { this.muted = localStorage.getItem('zt_muted') === '1'; audio.setMuted(this.muted); } catch (_) {}
    try { const h = localStorage.getItem('zt_haptic'); this.haptic = h === null ? true : h === '1'; } catch (_) {}
    try { const m = localStorage.getItem('zt_music'); this.musicOn = m === null ? true : m === '1'; } catch (_) {}
  }
  _saveHighScore() {
    try { localStorage.setItem('zt_high', String(this.highScore)); } catch (_) {}
  }

  // ---------- Input ----------
  setSquadX(px) {
    this.squadX = Math.max(80, Math.min(this.w - 80, px));
  }

  // ---------- Upgrades ----------
  upgradeCost(kind) {
    if (kind === 'power') return Math.floor(UPGRADE_COST_BASE.power * Math.pow(UPGRADE_COST_GROWTH, this.firePower - 1));
    if (kind === 'rate')  return Math.floor(UPGRADE_COST_BASE.rate  * Math.pow(UPGRADE_COST_GROWTH, this.fireRateTier));
    if (kind === 'size')  return Math.floor(UPGRADE_COST_BASE.size  * Math.pow(UPGRADE_COST_GROWTH, this.sizeTier));
    return Infinity;
  }
  canUpgrade(kind) {
    if (kind === 'power') return this.firePower < FIRE_POWER_MAX && this.coins >= this.upgradeCost('power');
    if (kind === 'rate')  return this.fireRateTier < FIRE_RATE_TIER_MAX && this.coins >= this.upgradeCost('rate');
    if (kind === 'size')  return this.sizeTier < SQUAD_SIZE_TIERS.length - 1 && this.coins >= this.upgradeCost('size');
    return false;
  }
  upgrade(kind) {
    if (!this.canUpgrade(kind)) return;
    this.coins -= this.upgradeCost(kind);
    if (kind === 'power') this.firePower++;
    else if (kind === 'rate')  this.fireRateTier++;
    else if (kind === 'size')  this.sizeTier++;
    audio.coin();
    this._haptic(15);
    this._emitHud();
  }
  squadCap() { return SQUAD_SIZE_TIERS[Math.min(this.sizeTier, SQUAD_SIZE_TIERS.length - 1)]; }

  // ---------- Wave system ----------
  _beginRest() {
    this.phase = PHASE_REST;
    this.phaseElapsed = 0;
    this.waveData = waveAt(this.wave);
    this.bannerUntil = WAVE_BANNER_MS;
    audio.waveHorn();
    // Boss waves and rampage = max music intensity; everything else = play.
    if (this.started) {
      audio.setMusicIntensity(this.waveData.isBoss ? 'boss' : 'play');
    }
    this._haptic(40);
    this._emitEvent('wave', { wave: this.wave, banner: this.waveData.banner, isBoss: !!this.waveData.isBoss });
  }
  _beginActive() {
    this.phase = PHASE_ACTIVE;
    this.phaseElapsed = 0;
    this.waveElapsed = 0;
    this.groupCursors = this.waveData.groups.map(() => 0);
    this.waveKills = 0;
  }
  _waveCleared() {
    return this.phase === PHASE_ACTIVE
      && this.waveElapsed > this.waveData.duration
      && this.zombies.length === 0
      && this.brutes.length === 0
      && this.elites.length === 0;
  }
  _advanceWave() {
    // Reward XP for clearing this wave (with a bonus the first time the player ever clears it).
    const cleared = this.wave;
    const isFirstEver = cleared > this.highestWave;
    if (isFirstEver) this.highestWave = cleared;
    this._grantXp(XP_PER_WAVE + (isFirstEver ? XP_PER_FIRST_CLEAR : 0));
    savePlayer({
      xp: this.playerXp,
      highestWave: this.highestWave,
      totalKills: this.totalKills,
    });

    this.wave++;
    this._beginRest();
    this._waveTransitionScheduled = false;
  }

  // ---------- Combat helpers ----------
  _grantXp(amount) {
    if (!amount) return;
    const before = this.playerLevel;
    this.playerXp += amount;
    const after = levelForXp(this.playerXp);
    if (after > before) {
      this.playerLevel = after;
      this._pendingLevelUp = { from: before, to: after };
      this._emitEvent('levelup', { from: before, to: after });
      audio.coin();
      this._haptic(60);
    } else {
      this.playerLevel = after;
    }
  }
  _registerKill(xp) {
    this.kills++;
    this.totalKills++;
    this.waveKills++;
    this.recentKills.push(this.t);
    if (xp) this._grantXp(xp);
    // trim window
    const cutoff = this.t - COMBO_WINDOW_MS;
    while (this.recentKills.length && this.recentKills[0] < cutoff) this.recentKills.shift();
    if (this.recentKills.length >= COMBO_THRESHOLD && this.t > this.rampageUntil) {
      this.rampageUntil = this.t + RAMPAGE_DURATION_MS;
      audio.rampage();
      audio.setMusicIntensity('boss');
      // After rampage ends, snap back to play intensity
      setTimeout(() => {
        if (!this.gameOver && this.started && this.t > this.rampageUntil - 50) {
          audio.setMusicIntensity(this.waveData?.isBoss ? 'boss' : 'play');
        }
      }, RAMPAGE_DURATION_MS + 100);
      this._haptic(80);
      this._emitEvent('rampage');
    }
  }
  _haptic(ms) {
    if (!this.haptic) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  }

  // ---------- Main step ----------
  step(dt) {
    if (this.paused || this.gameOver || !this.started) return;
    if (this.w === 0) return;
    this.t += dt;

    // Wave phase progression
    if (this.phase === PHASE_REST) {
      this.phaseElapsed += dt;
      this.bannerUntil -= dt;
      if (this.phaseElapsed >= WAVE_REST_MS && this.bannerUntil <= 0) {
        this._beginActive();
      }
    } else {
      this.waveElapsed += dt;
      // Spawn from groups
      const groups = this.waveData.groups;
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        if (this.waveElapsed < g.delay) continue;
        const elapsed = this.waveElapsed - g.delay;
        // Spawn cadence tightens as waves climb: ~280ms early, ~140ms at wave 30.
        const gapMs = Math.max(140, 280 - this.wave * 5);
        const target = Math.min(g.count, Math.floor(elapsed / gapMs) + 1);
        while (this.groupCursors[gi] < target) {
          this._spawnFromGroup(g);
          this.groupCursors[gi]++;
        }
      }
      // Wave clear → schedule rest
      if (this._waveCleared() && !this._waveTransitionScheduled) {
        this._waveTransitionScheduled = true;
        audio.coin();
        setTimeout(() => this._advanceWave(), 800);
      }
    }

    this._stepFiring(dt);
    this._stepBullets(dt);
    this._stepEnemies(dt);
    this._stepCrates(dt);
    this._stepGates(dt);
    this._stepSpits(dt);
    this._stepCollisions();
    this._capSwarm();

    this.particles.step(dt);

    // HUD updates throttled to 10Hz — humans can't read counters faster
    this._hudThrottleT += dt;
    if (this._hudThrottleT > 100) {
      this._hudThrottleT = 0;
      this._emitHud();
    }
  }

  _roadLeft()  { return this.w * ROAD_LEFT_PCT; }
  _roadRight() { return this.w * ROAD_RIGHT_PCT; }

  _spawnFromGroup(group) {
    const L = this._roadLeft();
    const R = this._roadRight();
    const margin = Math.min(80, group.spread / 2 + 30);
    const cx = L + margin + Math.random() * Math.max(1, (R - L) - margin * 2);
    const rawX = cx + (Math.random() - 0.5) * group.spread;
    const x = Math.max(L + 12, Math.min(R - 12, rawX));
    const y = -40 - Math.random() * 80;

    if (group.kind === 'brute') {
      this.brutes.push(makeBrute(cx, y, this.wave));
      audio.groan();
    } else if (group.kind === 'hulk' || group.kind === 'spawner' || group.kind === 'screamer'
            || group.kind === 'armored' || group.kind === 'bloater') {
      this.elites.push(makeElite(group.kind, cx, y, this.wave));
      audio.groan();
    } else {
      // walker / runner / spitter / crawler
      this.zombies.push(makeZombie(group.kind, x, y, this.wave));
      if (Math.random() < 0.1) audio.groan();
    }
  }

  _stepFiring(_dt) {
    let cd = FIRE_RATE_BASE_MS
      - this.firePower * FIRE_RATE_PER_POWER_MS
      - this.fireRateTier * FIRE_RATE_PER_LEVEL_MS;
    if (this.t < this.rampageUntil) cd *= 0.5;
    cd = Math.max(FIRE_RATE_FLOOR_MS, cd);
    if (this.t - this.lastFireT < cd) return;
    this.lastFireT = this.t;

    if (this.bullets.length >= this.squadCap()) return;

    const speed = BULLET_BASE_SPEED + this.firePower * BULLET_SPEED_PER_POWER;
    const positions = getSquadPositions(this.squadX, this.squadY, this.firePower);
    for (const [px, py] of positions) {
      this.bullets.push({
        x: px + (Math.random() * 6 - 3),
        y: py - 30,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -speed,
        lastGateId: 0,
      });
      this.particles.emit(SPARK, px, py - 30, 2, 0.18);
    }
    audio.shoot();
  }

  _stepBullets(_dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 10 || b.x > this.w - 10) {
        b.vx *= -1;
        b.x = Math.max(10, Math.min(this.w - 10, b.x));
      }
      if (b.y < -40) this.bullets.splice(i, 1);
    }
  }

  _stepEnemies(dt) {
    const L = this._roadLeft();
    const R = this._roadRight();
    // Zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.x += z.vx;
      z.y += z.vy;
      // Keep them on the road
      if (z.x < L + z.r) { z.x = L + z.r; z.vx = Math.abs(z.vx); }
      else if (z.x > R - z.r) { z.x = R - z.r; z.vx = -Math.abs(z.vx); }

      // Spitter: occasional spit
      if (z.kind === 'spitter') {
        z.spitCd -= dt;
        if (z.spitCd <= 0) {
          z.spitCd = 2000 + Math.random() * 1500;
          this.spits.push(makeSpit(z.x, z.y));
        }
      }

      if (z.y > this.h - SQUAD_BASE_Y_FROM_BOTTOM + 30) {
        this._triggerGameOver();
      }
    }
    // Brutes — now also summon walker reinforcements periodically.
    for (let i = this.brutes.length - 1; i >= 0; i--) {
      const b = this.brutes[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < L + b.r) { b.x = L + b.r; b.vx = Math.abs(b.vx); }
      else if (b.x > R - b.r) { b.x = R - b.r; b.vx = -Math.abs(b.vx); }
      this._tickSummon(b, dt);
      if (b.y > this.h - SQUAD_BASE_Y_FROM_BOTTOM + 30) {
        this._triggerGameOver();
      }
    }
    // Elites — bosses with HP bars + summon abilities.
    for (let i = this.elites.length - 1; i >= 0; i--) {
      const e = this.elites[i];
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < L + e.r) { e.x = L + e.r; e.vx = Math.abs(e.vx); }
      else if (e.x > R - e.r) { e.x = R - e.r; e.vx = -Math.abs(e.vx); }
      this._tickSummon(e, dt);
      if (e.y > this.h - SQUAD_BASE_Y_FROM_BOTTOM + 30) {
        this._triggerGameOver();
      }
    }
  }

  // Shared summon timer used by both elites and the Brute boss.
  _tickSummon(boss, dt) {
    if (!boss.summonInterval) return;
    boss.summonCd -= dt;
    if (boss.summonCd > 0) return;
    boss.summonCd = boss.summonInterval;
    const count = boss.summonCount || 1;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const ox = boss.x + Math.cos(angle) * (boss.r + 6);
      const oy = boss.y + 8 + Math.abs(Math.sin(angle)) * 12;
      this.zombies.push(makeZombie(boss.summonKind || 'walker', ox, oy, this.wave));
    }
    // Visual puff at emergence
    this.particles.emit(GOO, boss.x, boss.y + boss.r * 0.4, 10 + count * 2, 0.22);
    audio.groan();
  }

  _stepCrates(_dt) {
    // Crates are PLAYER rewards, so the harder direction is RARER at high
    // waves: stay flat for the first 8 waves, then drift longer.
    const interval = Math.min(28000, CRATE_SPAWN_MS_BASE + Math.max(0, this.wave - 8) * 350);
    if (this.t - this.lastCrateT > interval) {
      this.crates.push(makeCrate(this.w, -100, this.wave));
      this.lastCrateT = this.t;
    }
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      c.y += c.vy;
      if (c.y > this.h + 80) this.crates.splice(i, 1);
    }
  }

  _stepGates(_dt) {
    const interval = Math.max(2200, GATE_SPAWN_MS_BASE - this.wave * 120);
    if (this.t - this.lastGateT > interval) {
      this.gates.push(makeGate(this._gateId++, this.w, this.wave));
      this.lastGateT = this.t;
    }
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.y += 0.8 + this.wave * 0.06;
      g.x += g.speed;
      if (g.x < g.w / 2 || g.x > this.w - g.w / 2) g.speed *= -1;
      if (g.y > this.h + 60) this.gates.splice(i, 1);
    }
  }

  _stepSpits(_dt) {
    for (let i = this.spits.length - 1; i >= 0; i--) {
      const s = this.spits[i];
      s.y += s.vy;
      if (s.y > this.h - SQUAD_BASE_Y_FROM_BOTTOM - 10) {
        // Spit hitting the line just removes some bullets near squadX (no shield system —
        // keeps it simple: spit erases up to 3 bullets near squad).
        this.spits.splice(i, 1);
        let erased = 0;
        for (let j = this.bullets.length - 1; j >= 0 && erased < 3; j--) {
          if (Math.abs(this.bullets[j].x - this.squadX) < 60) {
            this.bullets.splice(j, 1);
            erased++;
          }
        }
        this.particles.emit(GOO, s.x, s.y, 6, 0.18);
        continue;
      }
      if (s.x < 10 || s.x > this.w - 10) this.spits.splice(i, 1);
    }
  }

  _stepCollisions() {
    // Build y-bucket for all hittable enemies for bullet narrowing.
    this.bucket.clear();
    for (let i = 0; i < this.zombies.length; i++) this.bucket.insert(this.zombies[i]);
    for (let i = 0; i < this.elites.length; i++)  this.bucket.insert(this.elites[i]);
    for (let i = 0; i < this.brutes.length; i++)  this.bucket.insert(this.brutes[i]);

    // Bullet → enemy
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      let hit = null;
      this.bucket.forNear(b.y, 44 + BULLET_RADIUS, (e) => {
        if (hit) return;
        const r = e.r + BULLET_RADIUS;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (dx * dx + dy * dy < r * r) hit = e;
      });
      if (!hit) continue;

      this.bullets.splice(bi, 1);
      // Apply damage with elite damage-reduction (armored bosses).
      const dmg = 1 * (hit.dmgMul || 1);
      hit.hp -= dmg;

      // Armor break: armored elite drops dmgMul to 1.0 when HP crosses 50%.
      if (hit.armored && hit.hp <= hit.maxHp * 0.5) {
        hit.armored = false;
        hit.dmgMul = 1.0;
        this.particles.emit(SPARK, hit.x, hit.y - hit.r, 20, 0.32);
        audio.hit();
      }

      if (hit.hp <= 0) {
        const isBrute = hit.kind === 'brute';
        const isElite = !isBrute && (hit.kind === 'hulk' || hit.kind === 'spawner'
          || hit.kind === 'screamer' || hit.kind === 'armored' || hit.kind === 'bloater');
        const arr = isBrute ? this.brutes : (isElite ? this.elites : this.zombies);
        const idx = arr.indexOf(hit);
        if (idx >= 0) arr.splice(idx, 1);
        const mul = (this.doubleCoinsUntil && this.t < this.doubleCoinsUntil) ? 2 : 1;
        const coinReward = isBrute ? 25 : (isElite ? 18 : 1);
        const xpReward = isBrute ? XP_PER_BRUTE : (isElite ? 8 : XP_PER_ZOMBIE);
        this.coins += coinReward * mul;
        this._registerKill(xpReward);

        if (isBrute) {
          this.particles.emit(GOO, hit.x, hit.y - 30, 36, 0.36);
          audio.hit();
          this._haptic(45);
        } else if (isElite) {
          this.particles.emit(GOO, hit.x, hit.y - hit.r * 0.5, 28, 0.32);
          audio.hit();
          this._haptic(30);

          // Bloater detonates on death — destroys bullets nearby + spawns spitters.
          if (hit.onDeathExplode) {
            const blastR = 64;
            for (let k = this.bullets.length - 1; k >= 0; k--) {
              const bb = this.bullets[k];
              const dx = bb.x - hit.x;
              const dy = bb.y - hit.y;
              if (dx * dx + dy * dy < blastR * blastR) this.bullets.splice(k, 1);
            }
            for (let k = 0; k < 4; k++) {
              const a = (k / 4) * Math.PI * 2 + Math.random() * 0.4;
              this.zombies.push(makeZombie(
                'spitter',
                hit.x + Math.cos(a) * 28,
                hit.y + Math.sin(a) * 18,
                this.wave,
              ));
            }
            this.particles.emit(GOO, hit.x, hit.y, 60, 0.5);
            audio.rampage();
            this._haptic(70);
          }
        } else {
          this.particles.emit(GOO, hit.x, hit.y - 10, 6, 0.22);
        }
      } else {
        audio.hit();
        this.particles.emit(GOO, b.x, b.y, 3, 0.18);
      }
    }

    // Bullet → crate
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ci = this.crates.length - 1; ci >= 0; ci--) {
        const c = this.crates[ci];
        if (b.x > c.x - CRATE_HALF_W && b.x < c.x + CRATE_HALF_W &&
            b.y > c.y - CRATE_HALF_H && b.y < c.y + CRATE_HALF_H) {
          this.bullets.splice(bi, 1);
          c.hp -= 1;
          if (c.hp <= 0) {
            this.crates.splice(ci, 1);
            // Reward: random of three upgrade boosts
            const r = Math.random();
            if (r < 0.45 && this.firePower < FIRE_POWER_MAX) this.firePower++;
            else if (r < 0.75 && this.fireRateTier < FIRE_RATE_TIER_MAX) this.fireRateTier++;
            else this.coins += 80;
            this.coins += 30;
            audio.coin();
            this.particles.emit(SPARK, c.x, c.y, 22, 0.32);
            this._haptic(20);
          }
          break;
        }
      }
    }

    // Bullet → gate
    const newBullets = [];
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let gi = this.gates.length - 1; gi >= 0; gi--) {
        const g = this.gates[gi];
        if (b.lastGateId === g.id) continue;
        const gx = g.x - g.w / 2;
        const gy = g.y - g.h / 2;
        if (b.x > gx && b.x < gx + g.w && b.y > gy && b.y < gy + g.h) {
          b.lastGateId = g.id;
          if (g.type === 'add' || g.type === 'mult') {
            const make = g.type === 'add' ? g.val : (g.val - 1);
            for (let n = 0; n < make; n++) {
              if (this.bullets.length + newBullets.length >= this.squadCap()) break;
              newBullets.push({
                x: b.x + (Math.random() * 36 - 18),
                y: gy - 10 - Math.random() * 18,
                vx: (Math.random() - 0.5) * 1.8,
                vy: b.vy,
                lastGateId: g.id,
              });
            }
          } else if (g.type === 'sub' && g.val > 0) {
            g.val--;
            this.bullets.splice(bi, 1);
          }
          break;
        }
      }
    }
    if (newBullets.length) this.bullets.push(...newBullets);

    // Spit → squad line (handled in _stepSpits via squadX proximity)
  }

  _capSwarm() {
    const cap = this.squadCap();
    if (this.bullets.length > cap) this.bullets.splice(0, this.bullets.length - cap);
  }

  _triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    audio.gameOver();
    audio.setMusicIntensity('menu');
    this._haptic([60, 80, 120]);
    if (this.kills > this.highScore) {
      this.highScore = this.kills;
      this._saveHighScore();
    }
    // Persist run progress (XP, totals)
    savePlayer({
      xp: this.playerXp,
      highestWave: this.highestWave,
      totalKills: this.totalKills,
    });
    // Submit to leaderboard once per run (fire and forget — backend is async).
    if (!this._submittedThisRun) {
      this._submittedThisRun = true;
      const nm = (typeof localStorage !== 'undefined' && localStorage.getItem('zt_player_name')) || 'You';
      submitScore({ name: nm, score: this.kills, wave: this.wave }).catch(() => {});
    }
    this._emitEvent('gameover', { canRevive: !this.reviveUsed });
  }

  // Called by the UI after a successful rewarded-ad watch. Clears nearby
  // enemies, restores fire timing, resumes the run.
  revive() {
    if (!this.gameOver) return false;
    if (this.reviveUsed) return false;
    this.reviveUsed = true;
    // Wipe whatever was at the gate to give breathing room.
    this.zombies.length = 0;
    this.brutes.length = 0;
    this.elites.length = 0;
    this.spits.length = 0;
    // Reward a small coin boost and a half-rampage burst.
    this.coins += 50;
    this.rampageUntil = this.t + 3500;
    this.gameOver = false;
    audio.rampage();
    audio.setMusicIntensity('boss');
    this._haptic(60);
    this._emitEvent('revived');
    this._emitHud();
    return true;
  }

  // Called by the UI when player watches an ad for 2x coins.
  grantDoubleCoinsBuff(durationMs = 30000) {
    this.doubleCoinsUntil = this.t + durationMs;
    this._emitEvent('buff', { kind: 'double_coins', ms: durationMs });
    this._emitHud();
  }

  // ---------- Render ----------
  draw(ctx) {
    if (this.w === 0) return;
    this.bg.draw(ctx, this.wave, this.t);

    // Gates
    for (const g of this.gates) drawGate(ctx, g);

    // Spits
    for (const s of this.spits) drawSpit(ctx, s);

    // Crates
    for (const c of this.crates) drawCrate(ctx, c);

    // Bullets
    for (const b of this.bullets) drawBullet(ctx, b.x, b.y, b.vy);

    // Enemies — small zombies first (lowest layer), then elites, then brutes on top.
    for (const z of this.zombies) drawZombie(ctx, z, this.t);
    for (const e of this.elites)  drawElite(ctx, e, this.t);
    for (const b of this.brutes)  drawBrute(ctx, b, this.t);

    // Particles
    this.particles.draw(ctx);

    // Squad
    const positions = getSquadPositions(this.squadX, this.squadY, this.firePower);
    for (const [px, py] of positions) drawSandbagPosition(ctx, px, py);

    // RAMPAGE vignette
    if (this.t < this.rampageUntil) {
      const left = this.rampageUntil - this.t;
      const alpha = Math.min(1, left / 700);
      ctx.fillStyle = `rgba(180, 30, 30, ${0.18 * alpha + 0.06})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }
}
