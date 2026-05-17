import { COLORS } from '../config.js';

// type: 'add' | 'mult' | 'sub'
// Probability of subtract-gates grows with wave; helpful gate values shrink.
export function makeGate(id, width, wave) {
  // Sub probability: 12% baseline → up to 42% by wave 30.
  const subProb = Math.min(0.42, 0.12 + wave * 0.011);
  // Mult probability collapses at high waves so the player can't trivially
  // recover from a bad gate.
  const multProb = Math.max(0.06, 0.20 - wave * 0.004);
  // The remainder goes to 'add'.

  const r = Math.random();
  let type;
  if (r < subProb) type = 'sub';
  else if (r < subProb + multProb) type = 'mult';
  else type = 'add';

  let val;
  if (type === 'add') {
    // Hard cap at +7. Range 2-7 early, 2-4 in late game.
    const high = Math.max(3, 6 - Math.floor(wave / 8));
    val = 2 + Math.floor(Math.random() * high);
  } else if (type === 'mult') {
    // ×2 most of the time; ×3 stays rare and only at low/mid waves.
    val = wave < 20 ? (2 + (Math.random() > 0.78 ? 1 : 0)) : 2;
  } else {
    // Sub gates eat MORE units as waves climb.
    val = 8 + wave + Math.floor(Math.random() * 16);
  }

  return {
    id,
    type,
    val,
    x: width / 2,
    y: -100,
    speed: (Math.random() > 0.5 ? 1 : -1) * (1 + wave * 0.08),
    w: 110 + Math.random() * 60,
    h: 44,
  };
}

export function drawGate(ctx, g) {
  const gx = g.x - g.w / 2;
  const gy = g.y - g.h / 2;

  const isSub = g.type === 'sub';
  const isMult = g.type === 'mult';

  // Posts on the sides — barricade look, not laser doorway
  ctx.fillStyle = COLORS.gatePost;
  ctx.fillRect(gx - 6, gy - 14, 6, g.h + 28);
  ctx.fillRect(gx + g.w, gy - 14, 6, g.h + 28);
  // Post highlights
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(gx - 6, gy - 14, 2, g.h + 28);
  ctx.fillRect(gx + g.w, gy - 14, 2, g.h + 28);

  // Crossbeam top
  ctx.fillStyle = COLORS.gatePost;
  ctx.fillRect(gx - 6, gy - 14, g.w + 12, 8);

  // Panel
  const fill = isSub ? COLORS.gateSub : (isMult ? COLORS.gateMult : COLORS.gateAdd);
  const border = isSub ? COLORS.gateSubBorder : (isMult ? COLORS.gateMultBorder : COLORS.gateAddBorder);
  const grad = ctx.createLinearGradient(gx, gy, gx, gy + g.h);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, border);
  ctx.fillStyle = grad;
  ctx.fillRect(gx, gy, g.w, g.h);

  // Diagonal hazard stripes for sub gates (barbed-wire feel)
  if (isSub) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, gy, g.w, g.h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 220, 80, 0.55)';
    ctx.lineWidth = 6;
    for (let i = -g.h; i < g.w + g.h; i += 14) {
      ctx.beginPath();
      ctx.moveTo(gx + i, gy);
      ctx.lineTo(gx + i + g.h, gy + g.h);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Top sheen
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(gx + 2, gy + 2, g.w - 4, 5);

  // Border
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(gx, gy, g.w, g.h);

  // Label
  const sign = g.type === 'add' ? '+' : (isMult ? '×' : '−');
  const txt = `${sign}${g.val}`;
  ctx.font = '900 26px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000';
  ctx.strokeText(txt, g.x, g.y + 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(txt, g.x, g.y);
}
