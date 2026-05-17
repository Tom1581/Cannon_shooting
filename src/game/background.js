import { COLORS } from './config.js';

// Cache 3 pre-rendered backgrounds (day/dusk/night). Cross-fade between them
// based on wave progression. Way cheaper than rebuilding per frame.

const STAGES = [
  { sky: COLORS.skyDay,   road: COLORS.roadDay,   stripe: COLORS.laneStripe },
  { sky: COLORS.skyDusk,  road: COLORS.roadDusk,  stripe: COLORS.laneStripe },
  { sky: COLORS.skyNight, road: COLORS.roadNight, stripe: COLORS.laneStripeNight },
];

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function paintStage(w, h, { sky, road }) {
  const c = makeCanvas(w, h);
  const cx = c.getContext('2d');

  // Sky → horizon gradient
  const skyGrad = cx.createLinearGradient(0, 0, 0, h * 0.45);
  skyGrad.addColorStop(0, sky);
  skyGrad.addColorStop(1, '#000');
  cx.fillStyle = sky;
  cx.fillRect(0, 0, w, h);

  // Road (the central play area)
  const roadX = w * 0.08;
  const roadW = w * 0.84;
  cx.fillStyle = road;
  cx.fillRect(roadX, 0, roadW, h);

  // Shoulder dirt edges
  cx.fillStyle = 'rgba(60, 40, 22, 0.5)';
  cx.fillRect(roadX, 0, 6, h);
  cx.fillRect(roadX + roadW - 6, 0, 6, h);

  return c;
}

export class Background {
  constructor() {
    this.layers = [];
    this.w = 0;
    this.h = 0;
    this.stripeOffset = 0;
  }
  resize(w, h) {
    if (w === this.w && h === this.h && this.layers.length === STAGES.length) return;
    this.w = w; this.h = h;
    this.layers = STAGES.map(s => paintStage(w, h, s));
  }
  // wave: integer >= 1
  draw(ctx, wave, _t) {
    // Cycle: day for waves 1-3, dusk 4-6, night 7+, then loop with slow drift
    const idx = ((wave - 1) % 9) / 3; // 0..3 over 9 waves
    const i0 = Math.floor(idx) % 3;
    const i1 = (i0 + 1) % 3;
    const f = idx - Math.floor(idx);

    ctx.globalAlpha = 1;
    ctx.drawImage(this.layers[i0], 0, 0);
    if (f > 0.001) {
      ctx.globalAlpha = f;
      ctx.drawImage(this.layers[i1], 0, 0);
      ctx.globalAlpha = 1;
    }

    // Animated lane stripes — drawn live so they scroll
    const roadX = this.w * 0.08;
    const roadW = this.w * 0.84;
    const stripe = i0 === 2 || (i0 === 1 && f > 0.5) ? COLORS.laneStripeNight : COLORS.laneStripe;
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 4;
    ctx.setLineDash([22, 28]);
    this.stripeOffset = (this.stripeOffset + 2.4) % 50;
    ctx.lineDashOffset = -this.stripeOffset;
    ctx.beginPath();
    ctx.moveTo(roadX + roadW * 0.33, 0);
    ctx.lineTo(roadX + roadW * 0.33, this.h);
    ctx.moveTo(roadX + roadW * 0.67, 0);
    ctx.lineTo(roadX + roadW * 0.67, this.h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
