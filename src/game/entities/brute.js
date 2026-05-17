import { COLORS, BRUTE_RADIUS } from '../config.js';

// Top-tier boss. Sized up visibly at high waves so the threat is unmistakable.

export function bruteHpFor(wave) {
  // Middle ground — harder than the halved values, easier than the original spike.
  return 54 + wave * 18 + Math.max(0, wave - 10) * 14;
}
export function bruteSpeedFor(wave) {
  return Math.min(1.55, 0.55 + wave * 0.055);
}
// Visual size scales with wave (up to +60% at wave 30+).
export function bruteSizeFor(wave) {
  return BRUTE_RADIUS * (1 + Math.min(0.6, wave * 0.02));
}

export function makeBrute(x, y, wave) {
  const hp = bruteHpFor(wave);
  const size = bruteSizeFor(wave);
  return {
    kind: 'brute',
    x, y,
    r: size,
    hp,
    maxHp: hp,
    vx: (Math.random() - 0.5) * 0.6,
    vy: bruteSpeedFor(wave),
    // Brute also summons reinforcements
    summonKind: 'walker',
    summonCount: 2 + Math.floor(wave / 12), // +1 per 12 waves
    summonInterval: Math.max(2500, 4500 - wave * 70),
    summonCd: 3000,
  };
}

export function drawBrute(ctx, b, t) {
  const size = b.r;
  const x = b.x;
  const y = b.y;
  const hpPct = Math.max(0, b.hp / b.maxHp);
  const stomp = Math.sin(t * 0.004) * 1.4;

  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath(); ctx.ellipse(x, y + 4, size * 1.7, size * 0.62, 0, 0, Math.PI * 2); ctx.fill();

  // Legs
  ctx.fillStyle = COLORS.bruteDark;
  ctx.beginPath();
  ctx.ellipse(x - size * 0.45, y + stomp * 0.5, size * 0.36, size * 0.52, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.45, y - stomp * 0.5, size * 0.36, size * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Massive arms
  const gradArm = ctx.createRadialGradient(x - size * 1.3, y - size * 1.4, size * 0.3, x - size * 1.3, y - size * 1.4, size);
  gradArm.addColorStop(0, COLORS.bruteLight);
  gradArm.addColorStop(1, COLORS.bruteDark);
  ctx.fillStyle = gradArm;
  ctx.beginPath(); ctx.ellipse(x - size * 1.35, y - size * 1.1, size * 0.85, size * 1.6, -Math.PI / 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 1.35, y - size * 1.1, size * 0.85, size * 1.6, Math.PI / 9, 0, Math.PI * 2); ctx.fill();
  // Fists
  ctx.fillStyle = COLORS.bruteDark;
  ctx.beginPath(); ctx.arc(x - size * 1.35, y + size * 0.1, size * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size * 1.35, y + size * 0.1, size * 0.42, 0, Math.PI * 2); ctx.fill();

  // Chest scar
  ctx.fillStyle = COLORS.bruteScar;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.4, y - size * 1.4);
  ctx.lineTo(x + size * 0.5, y - size * 0.7);
  ctx.lineTo(x + size * 0.3, y - size * 0.6);
  ctx.lineTo(x - size * 0.5, y - size * 1.3);
  ctx.closePath();
  ctx.fill();

  // Torso
  const gradBody = ctx.createLinearGradient(x - size, y - size * 2, x + size, y);
  gradBody.addColorStop(0, COLORS.bruteLight);
  gradBody.addColorStop(0.5, COLORS.brute);
  gradBody.addColorStop(1, COLORS.bruteDark);
  ctx.fillStyle = gradBody;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 3.1);
  ctx.bezierCurveTo(x + size * 2.0, y - size * 1.9, x + size * 1.6, y, x, y);
  ctx.bezierCurveTo(x - size * 1.6, y, x - size * 2.0, y - size * 1.9, x, y - size * 3.1);
  ctx.fill();

  // Head — bigger horns at higher waves (size already scales with wave)
  const gradHead = ctx.createRadialGradient(x - size * 0.3, y - size * 3.3, size * 0.2, x, y - size * 3.1, size * 1.2);
  gradHead.addColorStop(0, '#cce088');
  gradHead.addColorStop(0.3, COLORS.bruteLight);
  gradHead.addColorStop(1, COLORS.bruteDark);
  ctx.fillStyle = gradHead;
  ctx.beginPath();
  ctx.arc(x, y - size * 3.3, size * 1.05, 0, Math.PI * 2);
  ctx.fill();
  // Horns
  ctx.fillStyle = '#1a1410';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.85, y - size * 4.0);
  ctx.lineTo(x - size * 0.4,  y - size * 4.1);
  ctx.lineTo(x - size * 0.55, y - size * 3.6);
  ctx.closePath();
  ctx.moveTo(x + size * 0.85, y - size * 4.0);
  ctx.lineTo(x + size * 0.4,  y - size * 4.1);
  ctx.lineTo(x + size * 0.55, y - size * 3.6);
  ctx.closePath();
  ctx.fill();

  // Eyes — angry red
  ctx.fillStyle = '#1a0f0a';
  ctx.beginPath();
  ctx.ellipse(x - size * 0.45, y - size * 3.3, size * 0.20, size * 0.22, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.35, y - size * 3.3, size * 0.20, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff3030';
  ctx.beginPath();
  ctx.arc(x - size * 0.45, y - size * 3.3, size * 0.08, 0, Math.PI * 2);
  ctx.arc(x + size * 0.35, y - size * 3.3, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // HP bar — scales with maxHp so monster bars feel proportional
  const barW = Math.min(180, 56 + Math.sqrt(b.maxHp) * 4);
  const hY = y - size * 4.7;
  const left = x - barW / 2;
  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(left - 1, hY - 1, barW + 2, 11);
  ctx.fillStyle = '#262626';
  ctx.fillRect(left, hY, barW, 9);
  ctx.fillStyle = hpPct > 0.5 ? '#7ab53a' : (hpPct > 0.25 ? '#e0a230' : '#c63a3a');
  ctx.fillRect(left, hY, barW * hpPct, 9);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(left, hY, barW, 9);
  // HP number
  ctx.font = 'bold 14px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#000';
  ctx.fillText(Math.ceil(b.hp), x + 1, hY - 2);
  ctx.fillStyle = '#fff';
  ctx.fillText(Math.ceil(b.hp), x, hY - 3);
}
