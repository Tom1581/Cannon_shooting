import { COLORS, CRATE_HALF_W, CRATE_HALF_H, ROAD_LEFT_PCT, ROAD_RIGHT_PCT } from '../config.js';

export function makeCrate(width, y, wave) {
  // HP grows briskly so a sustained burst is needed at high waves.
  const hp = 35 + Math.floor(Math.random() * 25) + wave * 4 + Math.max(0, wave - 15) * 4;
  const L = width * ROAD_LEFT_PCT + CRATE_HALF_W + 6;
  const R = width * ROAD_RIGHT_PCT - CRATE_HALF_W - 6;
  return {
    x: L + Math.random() * Math.max(1, R - L),
    y,
    hp,
    maxHp: hp,
    vy: 0.5,
  };
}

// Wooden ammo crate with metal bands. Drops the original "47" badge entirely
// in favor of a health bar — no number overlay, no Voodoo-adjacent number.
export function drawCrate(ctx, c) {
  const x = c.x;
  const y = c.y;
  const hpPct = Math.max(0, c.hp / c.maxHp);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(x, y + 22, 60, 14, 0, 0, Math.PI * 2); ctx.fill();

  const w = CRATE_HALF_W * 2;
  const h = CRATE_HALF_H * 2;
  const bx = x - CRATE_HALF_W;
  const by = y - CRATE_HALF_H;

  // Top face (pseudo-3D)
  const topDepth = 14;
  ctx.fillStyle = '#9a7548';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + topDepth, by - topDepth);
  ctx.lineTo(bx + w + topDepth, by - topDepth);
  ctx.lineTo(bx + w, by);
  ctx.closePath();
  ctx.fill();

  // Front face
  const gradFront = ctx.createLinearGradient(bx, by, bx, by + h);
  gradFront.addColorStop(0, COLORS.crateWood);
  gradFront.addColorStop(1, COLORS.crateWoodDark);
  ctx.fillStyle = gradFront;
  ctx.fillRect(bx, by, w, h);

  // Right side
  ctx.fillStyle = '#523818';
  ctx.beginPath();
  ctx.moveTo(bx + w, by);
  ctx.lineTo(bx + w + topDepth, by - topDepth);
  ctx.lineTo(bx + w + topDepth, by - topDepth + h);
  ctx.lineTo(bx + w, by + h);
  ctx.closePath();
  ctx.fill();

  // Plank lines
  ctx.strokeStyle = COLORS.crateWoodDark;
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    const py = by + (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(bx + 2, py);
    ctx.lineTo(bx + w - 2, py);
    ctx.stroke();
  }

  // Metal bands top & bottom
  ctx.fillStyle = COLORS.crateBand;
  ctx.fillRect(bx, by + 4, w, 5);
  ctx.fillRect(bx, by + h - 9, w, 5);
  // Highlight on bands
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(bx, by + 4, w, 1.5);
  ctx.fillRect(bx, by + h - 9, w, 1.5);

  // Corner bolts
  ctx.fillStyle = COLORS.crateBolt;
  for (const [dx, dy] of [[6, 8], [w - 6, 8], [6, h - 8], [w - 6, h - 8]]) {
    ctx.beginPath();
    ctx.arc(bx + dx, by + dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stencil "AMMO" instead of a number (and intentionally rough painted)
  ctx.fillStyle = 'rgba(20, 14, 10, 0.6)';
  ctx.font = 'bold 18px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AMMO', x, y + 1);
  ctx.fillStyle = 'rgba(245, 220, 160, 0.95)';
  ctx.fillText('AMMO', x, y);

  // HP bar floating above
  const hY = by - topDepth - 14;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 30, hY, 60, 7);
  ctx.fillStyle = hpPct > 0.5 ? '#7ab53a' : (hpPct > 0.25 ? '#e0a230' : '#c63a3a');
  ctx.fillRect(x - 30, hY, 60 * hpPct, 7);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 30, hY, 60, 7);
}
