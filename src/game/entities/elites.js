// Boss-tier monsters. Each has its own HP bar and a "summon" ability that
// periodically spawns small zombies. Every wave features one of these.
//
// Each elite carries:
//   kind, x, y, r, hp, maxHp, vx, vy
//   dmgMul        — damage multiplier (1.0 normal; 0.5 for armored boss)
//   armored       — bool, armored boss only; flips false when HP drops to 50%
//   summonCd      — ms until next summon
//   summonInterval, summonCount, summonKind
//   onDeathExplode — bloater only: spawn AOE on death
//   visualSeed    — small per-instance jitter

const DEFS = {
  // -------- Hulk: massive, slow, walker minions --------
  hulk: {
    r: 18,
    speedBase: 0.55, speedPerWave: 0.045, speedCap: 1.4,
    hpBase: 38, hpPerWave: 10,
    summonKind: 'walker', summonCount: 2,
    summonBase: 4500, summonMin: 2200,
    label: 'HULK',
  },
  // -------- Spawner: birthing host, slow, lots of walkers --------
  spawner: {
    r: 17,
    speedBase: 0.4, speedPerWave: 0.035, speedCap: 1.0,
    hpBase: 30, hpPerWave: 7,
    summonKind: 'walker', summonCount: 3,
    summonBase: 3000, summonMin: 1600,
    label: 'SPAWNER',
  },
  // -------- Screamer: tall, summons runners, periodic shockwave --------
  screamer: {
    r: 14,
    speedBase: 0.7, speedPerWave: 0.055, speedCap: 1.8,
    hpBase: 44, hpPerWave: 11,
    summonKind: 'runner', summonCount: 2,
    summonBase: 5000, summonMin: 2400,
    label: 'SCREAMER',
  },
  // -------- Armored: damage reduction until shield cracks --------
  armored: {
    r: 16,
    speedBase: 0.55, speedPerWave: 0.04, speedCap: 1.3,
    hpBase: 52, hpPerWave: 13,
    summonKind: 'crawler', summonCount: 2,
    summonBase: 5500, summonMin: 2800,
    label: 'WARDEN',
  },
  // -------- Bloater: explodes on death, spits spitters --------
  bloater: {
    r: 19,
    speedBase: 0.45, speedPerWave: 0.035, speedCap: 1.1,
    hpBase: 62, hpPerWave: 15,
    summonKind: 'spitter', summonCount: 1,
    summonBase: 6000, summonMin: 3000,
    label: 'BLOATER',
  },
};

export const ELITE_ROSTER = ['hulk', 'spawner', 'screamer', 'armored', 'bloater'];
export const ELITE_LABEL = (k) => DEFS[k]?.label || k.toUpperCase();

export function makeElite(kind, x, y, wave) {
  const def = DEFS[kind] || DEFS.hulk;
  const hp = def.hpBase + wave * def.hpPerWave;
  const summonInterval = Math.max(def.summonMin, def.summonBase - wave * 80);
  return {
    kind,
    x, y,
    r: def.r,
    hp,
    maxHp: hp,
    vx: (Math.random() - 0.5) * 0.5,
    vy: Math.min(def.speedCap, def.speedBase + wave * def.speedPerWave),
    dmgMul: kind === 'armored' ? 0.5 : 1.0,
    armored: kind === 'armored',
    summonInterval,
    summonCd: 1500 + Math.random() * 1500, // first summon comes a bit after spawn
    summonKind: def.summonKind,
    summonCount: def.summonCount,
    onDeathExplode: kind === 'bloater',
    legPhase: Math.random() * Math.PI * 2,
    visualSeed: Math.random(),
    screamT: 0,  // screamer accumulator for shockwave timing
  };
}

// Bar width grows with sqrt(maxHp) so big bosses have visibly bigger bars.
function drawHpBar(ctx, x, topY, hp, maxHp, accent) {
  const w = Math.min(160, 48 + Math.sqrt(maxHp) * 4);
  const h = 9;
  const left = x - w / 2;
  const pct = Math.max(0, hp / maxHp);
  // backdrop
  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(left - 1, topY - 1, w + 2, h + 2);
  ctx.fillStyle = '#262626';
  ctx.fillRect(left, topY, w, h);
  // fill
  ctx.fillStyle = pct > 0.5 ? '#7ab53a' : (pct > 0.25 ? '#e0a230' : '#c63a3a');
  ctx.fillRect(left, topY, w * pct, h);
  // accent stripe (boss-color)
  if (accent) {
    ctx.fillStyle = accent;
    ctx.fillRect(left, topY, w * pct, 2);
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(left, topY, w, h);
  // HP number above bar
  ctx.font = 'bold 13px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#000';
  ctx.fillText(Math.ceil(hp), x + 1, topY - 2);
  ctx.fillStyle = '#fff';
  ctx.fillText(Math.ceil(hp), x, topY - 3);
}

export function drawElite(ctx, e, t) {
  if (e.kind === 'hulk')     drawHulk(ctx, e, t);
  else if (e.kind === 'spawner')  drawSpawner(ctx, e, t);
  else if (e.kind === 'screamer') drawScreamer(ctx, e, t);
  else if (e.kind === 'armored')  drawArmored(ctx, e, t);
  else if (e.kind === 'bloater')  drawBloater(ctx, e, t);
}

// ---------------- Hulk ----------------
function drawHulk(ctx, e, t) {
  const size = e.r;
  const x = e.x, y = e.y;
  const sway = Math.sin(t * 0.004 + e.legPhase) * 0.8;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, y + size * 0.9, size * 1.8, size * 0.55, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — short stumpy
  ctx.fillStyle = '#1a1410';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.5, y + size * 0.55, size * 0.45, size * 0.7, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.5, y + size * 0.55, size * 0.45, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Massive torso — trapezoidal
  const grad = ctx.createLinearGradient(x - size, y - size * 2, x + size, y);
  grad.addColorStop(0, '#9bb079');
  grad.addColorStop(0.5, '#5e7340');
  grad.addColorStop(1, '#2d3818');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.7, y - size * 1.5 + sway);
  ctx.lineTo(x + size * 1.7, y - size * 1.5 + sway);
  ctx.lineTo(x + size * 1.0, y);
  ctx.lineTo(x - size * 1.0, y);
  ctx.closePath();
  ctx.fill();

  // Bulging pec lines
  ctx.strokeStyle = '#2d3818';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y - size * 1.3); ctx.lineTo(x, y - size * 0.2); ctx.stroke();

  // Massive arms hanging at sides — bigger than torso wide
  ctx.fillStyle = '#3f4a2a';
  ctx.beginPath(); ctx.ellipse(x - size * 1.95, y - size * 0.6, size * 0.55, size * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.95, y - size * 0.6, size * 0.55, size * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5e7340';
  ctx.beginPath(); ctx.ellipse(x - size * 1.95, y - size * 0.8, size * 0.4, size * 1.0, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.95, y - size * 0.8, size * 0.4, size * 1.0, 0, 0, Math.PI * 2); ctx.fill();
  // Fists (oversized)
  ctx.fillStyle = '#1a2010';
  ctx.beginPath(); ctx.arc(x - size * 1.95, y + size * 0.55, size * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 1.95, y + size * 0.55, size * 0.5, 0, Math.PI * 2); ctx.fill();

  // Tiny head sunk between shoulders
  const hy = y - size * 1.8 + sway;
  ctx.fillStyle = '#5e7340';
  ctx.beginPath(); ctx.arc(x, hy, size * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#080604';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.18, hy - size * 0.05, size * 0.10, size * 0.13, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.18, hy - size * 0.05, size * 0.10, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5a3a';
  ctx.beginPath(); ctx.arc(x - size * 0.18, hy - size * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 0.18, hy - size * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();

  // HP bar
  drawHpBar(ctx, x, hy - size * 1.5, e.hp, e.maxHp, '#7ab53a');
}

// ---------------- Spawner ----------------
function drawSpawner(ctx, e, t) {
  const size = e.r;
  const x = e.x, y = e.y;
  const pulse = (Math.sin(t * 0.005 + e.legPhase) + 1) * 0.5; // 0..1

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(x, y + size * 0.8, size * 2.0, size * 0.6, 0, 0, Math.PI * 2); ctx.fill();

  // Crouched bulbous body
  const grad = ctx.createRadialGradient(x - size * 0.4, y - size * 0.8, size * 0.3, x, y - size * 0.4, size * 2.0);
  grad.addColorStop(0, '#c47fb3');
  grad.addColorStop(0.5, '#8a3f72');
  grad.addColorStop(1, '#3a1a30');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.4, size * 1.6, size * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing pulsing belly (the womb)
  const bellyR = size * 0.85 * (0.85 + pulse * 0.25);
  const bellyGrad = ctx.createRadialGradient(x, y - size * 0.2, bellyR * 0.1, x, y - size * 0.2, bellyR);
  bellyGrad.addColorStop(0, `rgba(255, 180, 240, ${0.85})`);
  bellyGrad.addColorStop(0.5, `rgba(220, 80, 180, ${0.6 + pulse * 0.3})`);
  bellyGrad.addColorStop(1, 'rgba(120, 30, 90, 0)');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.2, bellyR, 0, Math.PI * 2);
  ctx.fill();

  // Veiny lines across body
  ctx.strokeStyle = '#3a1a30';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const a0 = -Math.PI / 2 + i * 0.4 - 0.6;
    const a1 = a0 + 0.5 + i * 0.1;
    ctx.moveTo(x + Math.cos(a0) * size * 1.4, y - size * 0.4 + Math.sin(a0) * size * 1.2);
    ctx.quadraticCurveTo(
      x + Math.cos(a0 + 0.2) * size * 0.8, y - size * 0.4 + Math.sin(a0 + 0.2) * size * 0.6,
      x + Math.cos(a1) * size * 0.4, y - size * 0.4 + Math.sin(a1) * size * 0.3,
    );
    ctx.stroke();
  }

  // Two stunted arms gripping ground
  ctx.fillStyle = '#3a1a30';
  ctx.beginPath(); ctx.ellipse(x - size * 1.4, y + size * 0.4, size * 0.3, size * 0.55, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.4, y + size * 0.4, size * 0.3, size * 0.55, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a2a52';
  ctx.beginPath(); ctx.arc(x - size * 1.5, y + size * 0.7, size * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 1.5, y + size * 0.7, size * 0.18, 0, Math.PI * 2); ctx.fill();

  // Tiny head on top
  ctx.fillStyle = '#5a2042';
  ctx.beginPath(); ctx.arc(x, y - size * 1.8, size * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#080604';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.16, y - size * 1.85, size * 0.10, size * 0.13, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.16, y - size * 1.85, size * 0.10, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff80c0';
  ctx.beginPath(); ctx.arc(x - size * 0.16, y - size * 1.85, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 0.16, y - size * 1.85, 1.6, 0, Math.PI * 2); ctx.fill();

  drawHpBar(ctx, x, y - size * 2.7, e.hp, e.maxHp, '#c84090');
}

// ---------------- Screamer ----------------
function drawScreamer(ctx, e, t) {
  const size = e.r;
  const x = e.x, y = e.y;
  const sway = Math.sin(t * 0.003 + e.legPhase) * 0.5;
  // Screamer pulses every ~2s — visual ring
  const screamPhase = ((t + e.visualSeed * 1000) % 2200) / 2200;
  const screamActive = screamPhase < 0.35;

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(x, y + size * 1.0, size * 1.3, size * 0.4, 0, 0, Math.PI * 2); ctx.fill();

  // Shockwave ring (scream visual)
  if (screamActive) {
    const r = 30 + screamPhase * 220;
    const a = 1 - screamPhase / 0.35;
    ctx.strokeStyle = `rgba(220, 200, 255, ${a * 0.7})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - size * 2, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(180, 100, 255, ${a * 0.45})`;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y - size * 2, r * 0.7, 0, Math.PI * 2); ctx.stroke();
  }

  // Long thin legs
  ctx.strokeStyle = '#1a1820';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - size * 0.4, y - size * 0.5); ctx.lineTo(x - size * 0.45, y + size * 1.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + size * 0.4, y - size * 0.5); ctx.lineTo(x + size * 0.45, y + size * 1.0); ctx.stroke();
  ctx.strokeStyle = '#3a3640';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x - size * 0.4, y - size * 0.5); ctx.lineTo(x - size * 0.45, y + size * 1.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + size * 0.4, y - size * 0.5); ctx.lineTo(x + size * 0.45, y + size * 1.0); ctx.stroke();

  // Robe — tattered cloth hanging
  ctx.fillStyle = '#2a2238';
  ctx.beginPath();
  ctx.moveTo(x - size * 1.1, y - size * 1.8 + sway);
  ctx.lineTo(x + size * 1.1, y - size * 1.8 + sway);
  ctx.lineTo(x + size * 0.8, y + size * 0.3);
  ctx.lineTo(x + size * 0.6, y - size * 0.1);
  ctx.lineTo(x + size * 0.4, y + size * 0.4);
  ctx.lineTo(x + size * 0.1, y - size * 0.05);
  ctx.lineTo(x - size * 0.2, y + size * 0.5);
  ctx.lineTo(x - size * 0.5, y);
  ctx.lineTo(x - size * 0.8, y + size * 0.3);
  ctx.closePath();
  ctx.fill();

  // Long thin arms hanging
  ctx.strokeStyle = '#6a6478';
  ctx.lineWidth = 4;
  const armSway = sway * 0.5;
  ctx.beginPath(); ctx.moveTo(x - size * 1.0, y - size * 1.7); ctx.lineTo(x - size * 1.4, y + size * 0.3 + armSway); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + size * 1.0, y - size * 1.7); ctx.lineTo(x + size * 1.4, y + size * 0.3 - armSway); ctx.stroke();
  // Bony hands
  ctx.fillStyle = '#1a1820';
  ctx.beginPath(); ctx.arc(x - size * 1.4, y + size * 0.3 + armSway, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 1.4, y + size * 0.3 - armSway, 4, 0, Math.PI * 2); ctx.fill();

  // Head — tilted back, jaw wide open mid-scream
  const headCY = y - size * 2.1 + sway;
  ctx.save();
  ctx.translate(x, headCY);
  ctx.rotate(-0.25); // head tilted back
  // Skull
  const skullGrad = ctx.createRadialGradient(-size * 0.2, -size * 0.3, size * 0.1, 0, 0, size * 0.95);
  skullGrad.addColorStop(0, '#d6d0bc');
  skullGrad.addColorStop(0.6, '#8a8270');
  skullGrad.addColorStop(1, '#3a352c');
  ctx.fillStyle = skullGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.85, size * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye sockets — empty black voids
  ctx.fillStyle = '#020202';
  ctx.beginPath();
  ctx.ellipse(-size * 0.35, -size * 0.15, size * 0.18, size * 0.24, 0, 0, Math.PI * 2);
  ctx.ellipse( size * 0.35, -size * 0.15, size * 0.18, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  // Faint blue inner glow
  ctx.fillStyle = screamActive ? 'rgba(180, 200, 255, 0.9)' : 'rgba(120, 140, 200, 0.5)';
  ctx.beginPath();
  ctx.arc(-size * 0.35, -size * 0.15, size * 0.05, 0, Math.PI * 2);
  ctx.arc( size * 0.35, -size * 0.15, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Gaping mouth — huge open jaw
  ctx.fillStyle = '#080604';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.45, size * 0.5, size * 0.5 * (screamActive ? 1.0 : 0.7), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d6d0bc';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size * 0.15, size * 0.18);
    ctx.lineTo(i * size * 0.15, size * 0.35);
    ctx.stroke();
  }
  ctx.restore();

  drawHpBar(ctx, x, headCY - size * 1.4, e.hp, e.maxHp, '#b478ff');
}

// ---------------- Armored ----------------
function drawArmored(ctx, e, t) {
  const size = e.r;
  const x = e.x, y = e.y;
  const sway = Math.sin(t * 0.004 + e.legPhase) * 0.6;
  const cracked = !e.armored; // visual state when shield broken
  const cracksFactor = cracked ? 1 : Math.max(0, 1 - (e.hp / e.maxHp - 0.5) * 2);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, y + size * 0.9, size * 1.6, size * 0.5, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — heavy boots
  ctx.fillStyle = '#1a1410';
  ctx.beginPath();
  ctx.rect(x - size * 0.6, y + size * 0.1, size * 0.5, size * 0.85);
  ctx.rect(x + size * 0.1, y + size * 0.1, size * 0.5, size * 0.85);
  ctx.fill();

  // Body (under armor)
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.5, size * 0.9, size * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chest plate — metal shield
  const plateGrad = ctx.createLinearGradient(x - size, y - size * 1.4, x + size, y);
  plateGrad.addColorStop(0, '#8a8a8a');
  plateGrad.addColorStop(0.4, '#5a5a5a');
  plateGrad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.1, y - size * 1.5 + sway);
  ctx.lineTo(x + size * 1.1, y - size * 1.5 + sway);
  ctx.lineTo(x + size * 1.3, y - size * 0.3);
  ctx.lineTo(x + size * 0.6, y + size * 0.1);
  ctx.lineTo(x - size * 0.6, y + size * 0.1);
  ctx.lineTo(x - size * 1.3, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
  // Highlight on plate
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.9, y - size * 1.3);
  ctx.lineTo(x - size * 0.2, y - size * 1.3);
  ctx.lineTo(x - size * 0.5, y - size * 0.3);
  ctx.lineTo(x - size * 1.0, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
  // Bolts on plate
  ctx.fillStyle = '#1a1a1a';
  for (const [dx, dy] of [[-size, -size * 1.3], [size, -size * 1.3], [-size * 1.15, -size * 0.5], [size * 1.15, -size * 0.5]]) {
    ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  // Cracks/dents as HP drops
  if (cracksFactor > 0) {
    ctx.strokeStyle = `rgba(20, 0, 0, ${Math.min(0.95, cracksFactor)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 1.3); ctx.lineTo(x - size * 0.05, y - size * 0.7); ctx.lineTo(x + size * 0.2, y - size * 0.95);
    ctx.moveTo(x + size * 0.4, y - size * 0.4); ctx.lineTo(x + size * 0.6, y - size * 1.0);
    ctx.stroke();
  }
  // When armor is fully broken, show a missing chunk
  if (cracked) {
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.0, y - size * 1.1);
    ctx.lineTo(x + size * 0.5, y - size * 0.9);
    ctx.lineTo(x + size * 0.3, y - size * 0.5);
    ctx.lineTo(x - size * 0.2, y - size * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // Heavy arms beside plate
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.ellipse(x - size * 1.4, y - size * 0.4, size * 0.35, size * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.4, y - size * 0.4, size * 0.35, size * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  // Armored fists
  ctx.fillStyle = '#5a5a5a';
  ctx.beginPath(); ctx.arc(x - size * 1.4, y + size * 0.45, size * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 1.4, y + size * 0.45, size * 0.35, 0, Math.PI * 2); ctx.fill();

  // Helmet
  const hy = y - size * 1.8 + sway;
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(x, hy, size * 0.6, Math.PI, 0);
  ctx.lineTo(x + size * 0.65, hy + size * 0.25);
  ctx.lineTo(x - size * 0.65, hy + size * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.arc(x - size * 0.2, hy - size * 0.1, size * 0.3, Math.PI + 0.2, Math.PI * 2 - 0.6);
  ctx.fill();
  // Eye slit — glowing menacing red
  ctx.fillStyle = '#080604';
  ctx.fillRect(x - size * 0.5, hy - size * 0.05, size * 1.0, size * 0.18);
  ctx.fillStyle = '#ff3030';
  ctx.fillRect(x - size * 0.45, hy + size * 0.0, size * 0.9, size * 0.08);

  drawHpBar(ctx, x, hy - size * 1.0, e.hp, e.maxHp, '#cccccc');
}

// ---------------- Bloater ----------------
function drawBloater(ctx, e, t) {
  const size = e.r;
  const x = e.x, y = e.y;
  const pulse = (Math.sin(t * 0.006 + e.legPhase) + 1) * 0.5;
  const dangerPulse = e.hp / e.maxHp < 0.3 ? (Math.sin(t * 0.025) + 1) * 0.5 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(x, y + size * 0.9, size * 2.1, size * 0.6, 0, 0, Math.PI * 2); ctx.fill();

  // Tiny stumpy legs barely visible under belly
  ctx.fillStyle = '#1a2010';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.6, y + size * 0.6, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // MASSIVE bulbous body
  const bodyGrad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.6, size * 0.2, x, y - size * 0.2, size * 1.8);
  bodyGrad.addColorStop(0, '#b8d278');
  bodyGrad.addColorStop(0.5, '#5a7028');
  bodyGrad.addColorStop(1, '#1d2810');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.3, size * 1.6, size * 1.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing toxic pustules ALL over body — danger pulses faster at low HP
  const pulseSpeed = 1 + dangerPulse * 1.5;
  for (const [dx, dy, r, off] of [
    [-size * 0.6, -size * 0.5, 5, 0],
    [ size * 0.7, -size * 0.6, 4.5, 1.2],
    [-size * 0.9,  size * 0.1, 5.5, 2.0],
    [ size * 0.8,  size * 0.2, 4, 0.6],
    [-size * 0.2, -size * 0.8, 4.5, 1.6],
    [ size * 0.1,  size * 0.4, 5, 2.4],
    [-size * 0.5,  size * 0.5, 4, 3.0],
  ]) {
    const localPulse = (Math.sin(t * 0.008 * pulseSpeed + off) + 1) * 0.5;
    const innerR = r * (0.7 + localPulse * 0.5);
    const haloR = innerR * 2.2;
    const halo = ctx.createRadialGradient(x + dx, y - size * 0.3 + dy, 0, x + dx, y - size * 0.3 + dy, haloR);
    halo.addColorStop(0, `rgba(180, 240, 80, ${0.5 + localPulse * 0.3})`);
    halo.addColorStop(1, 'rgba(180, 240, 80, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x + dx, y - size * 0.3 + dy, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(${180 + localPulse * 50 | 0}, ${240}, ${80})`;
    ctx.beginPath();
    ctx.arc(x + dx, y - size * 0.3 + dy, innerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x + dx - innerR * 0.3, y - size * 0.3 + dy - innerR * 0.3, innerR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny stub arms
  ctx.fillStyle = '#3a4a18';
  ctx.beginPath(); ctx.ellipse(x - size * 1.55, y - size * 0.1, size * 0.3, size * 0.55, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.55, y - size * 0.1, size * 0.3, size * 0.55, 0.2, 0, Math.PI * 2); ctx.fill();

  // Tiny head poking out at top
  const hy = y - size * 1.55 + pulse * 1.2;
  ctx.fillStyle = '#5a7028';
  ctx.beginPath(); ctx.arc(x, hy, size * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#080604';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.16, hy - size * 0.05, size * 0.10, size * 0.13, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.16, hy - size * 0.05, size * 0.10, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4ff4a';
  ctx.beginPath(); ctx.arc(x - size * 0.16, hy - size * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 0.16, hy - size * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();
  // Open drooling mouth
  ctx.fillStyle = '#0a0a05';
  ctx.beginPath();
  ctx.ellipse(x, hy + size * 0.15, size * 0.25, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8d65a';
  ctx.beginPath();
  ctx.ellipse(x, hy + size * 0.27, 1.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  drawHpBar(ctx, x, hy - size * 1.2, e.hp, e.maxHp, '#a8d65a');
}
