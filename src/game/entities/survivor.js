import { COLORS } from '../config.js';

// Layout for the "squad cluster" — same idea as the original cart positions,
// but visually redrawn as sandbagged turret positions on a wall (no carts/wheels).
export function getSquadPositions(cx, cy, firePower) {
  let off;
  if (firePower <= 1)      off = [[0, 0]];
  else if (firePower === 2) off = [[-18, 0], [18, 0]];
  else if (firePower === 3) off = [[0, -22], [-18, 15], [18, 15]];
  else if (firePower === 4) off = [[-18, -25], [18, -25], [-18, 15], [18, 15]];
  else if (firePower === 5) off = [[-26, -25], [0, -28], [26, -25], [-18, 18], [18, 18]];
  else                      off = [[0, -40], [-22, -10], [22, -10], [-22, 22], [22, 22], [0, 22]];
  return off.map(p => [cx + p[0], cy + p[1]]);
}

export function drawSandbagPosition(ctx, x, y) {
  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 18, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Sandbag stack — three rows of overlapping sausages, no symmetry tricks
  const bags = [
    { dx: -14, dy: 10, w: 12, h: 7, c: '#9a8154' },
    { dx:   0, dy: 10, w: 12, h: 7, c: '#a78a59' },
    { dx:  14, dy: 10, w: 12, h: 7, c: '#9a8154' },
    { dx:  -7, dy:  2, w: 12, h: 7, c: '#b59766' },
    { dx:   7, dy:  2, w: 12, h: 7, c: '#a78a59' },
    { dx:   0, dy: -6, w: 12, h: 7, c: '#b59766' },
  ];
  for (const b of bags) {
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.ellipse(x + b.dx, y + b.dy, b.w, b.h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + b.dx - b.w, y + b.dy);
    ctx.lineTo(x + b.dx + b.w, y + b.dy);
    ctx.stroke();
  }

  // Survivor torso peeking over
  ctx.fillStyle = COLORS.survivorDark;
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  const gradTorso = ctx.createLinearGradient(x - 9, y - 18, x + 9, y - 4);
  gradTorso.addColorStop(0, COLORS.survivorLight);
  gradTorso.addColorStop(0.6, COLORS.survivor);
  gradTorso.addColorStop(1, COLORS.survivorDark);
  ctx.fillStyle = gradTorso;
  ctx.beginPath();
  ctx.ellipse(x, y - 12, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = COLORS.survivorHelmet;
  ctx.beginPath();
  ctx.arc(x, y - 22, 8, Math.PI, 0);
  ctx.lineTo(x + 9, y - 20);
  ctx.lineTo(x - 9, y - 20);
  ctx.closePath();
  ctx.fill();
  // Helmet highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - 25, 4, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rifle barrel (slim, dark)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 1.5, y - 32, 3, 14);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x - 1.5, y - 32, 1.2, 14);
}

// A survivor bullet — bright tracer with trailing glow and motion streak.
// `vy` is negative (moving up); trail extends in the opposite direction.
export function drawBullet(ctx, x, y, vy) {
  const dir = vy >= 0 ? -1 : 1; // 1 = moving up, draw trail downward
  const trailLen = 22;

  // Outer haze (long fading streak) — gives the motion-blur feel.
  const hazeGrad = ctx.createLinearGradient(x, y, x, y + trailLen * dir);
  hazeGrad.addColorStop(0, 'rgba(255, 240, 140, 0.55)');
  hazeGrad.addColorStop(0.4, 'rgba(255, 200, 60, 0.22)');
  hazeGrad.addColorStop(1, 'rgba(255, 160, 30, 0)');
  ctx.fillStyle = hazeGrad;
  ctx.beginPath();
  ctx.ellipse(x, y + (trailLen * dir) / 2, 4.2, trailLen / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner tighter trail
  const innerGrad = ctx.createLinearGradient(x, y, x, y + 10 * dir);
  innerGrad.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
  innerGrad.addColorStop(1, 'rgba(255, 200, 60, 0)');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.ellipse(x, y + (10 * dir) / 2, 2.0, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer radial glow at the bullet head
  const glow = ctx.createRadialGradient(x, y, 0.5, x, y, 8);
  glow.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 200, 60, 0.45)');
  glow.addColorStop(1, 'rgba(255, 160, 30, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Bullet core — pill-shaped, brightest in the center
  ctx.fillStyle = COLORS.bulletGlow;
  ctx.beginPath();
  ctx.ellipse(x, y, 2.6, 5.0, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hot white tip
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y - 1.5 * dir, 1.4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
}
