import { COLORS } from '../config.js';

export function makeSpit(x, y) {
  return { x, y, vy: 3.2, vx: 0 };
}

export function drawSpit(ctx, s) {
  ctx.fillStyle = 'rgba(150, 210, 70, 0.45)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.spit;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220, 240, 180, 0.7)';
  ctx.beginPath();
  ctx.ellipse(s.x - 1.5, s.y - 1, 1.7, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
}
