import { PARTICLE_POOL_SIZE, COLORS } from '../config.js';

// Fixed-size particle pool stored in typed arrays. Zero allocations during gameplay.
// kind: 0 = goo, 1 = spark
const N = PARTICLE_POOL_SIZE;
export class ParticlePool {
  constructor() {
    this.x = new Float32Array(N);
    this.y = new Float32Array(N);
    this.vx = new Float32Array(N);
    this.vy = new Float32Array(N);
    this.life = new Float32Array(N);   // remaining ms
    this.max = new Float32Array(N);    // initial life ms
    this.kind = new Uint8Array(N);
    this.head = 0;
  }
  emit(kind, x, y, count, speed) {
    for (let i = 0; i < count; i++) {
      const idx = this.head;
      this.head = (this.head + 1) % N;
      const ang = Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.x[idx] = x;
      this.y[idx] = y;
      this.vx[idx] = Math.cos(ang) * sp;
      this.vy[idx] = Math.sin(ang) * sp - (kind === 0 ? 0.6 : 0.2);
      const life = kind === 0 ? (350 + Math.random() * 250) : (120 + Math.random() * 80);
      this.life[idx] = life;
      this.max[idx] = life;
      this.kind[idx] = kind;
    }
  }
  step(dt) {
    const decay = dt;
    const gravity = 0.0009;
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= decay;
      if (this.life[i] <= 0) continue;
      this.x[i] += this.vx[i] * dt * 0.06;
      this.y[i] += this.vy[i] * dt * 0.06;
      this.vy[i] += gravity * dt;
      // damp
      this.vx[i] *= 0.985;
    }
  }
  draw(ctx) {
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      const a = this.life[i] / this.max[i];
      if (this.kind[i] === 0) {
        // goo: olive green blobs that shrink/fade
        ctx.fillStyle = `rgba(155, 191, 58, ${0.9 * a})`;
        const r = 1.5 + 2.5 * a;
        ctx.beginPath();
        ctx.arc(this.x[i], this.y[i], r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(90, 122, 26, ${0.7 * a})`;
        ctx.beginPath();
        ctx.arc(this.x[i] - 0.5, this.y[i] + 0.4, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // muzzle spark — short yellow streak
        ctx.fillStyle = `rgba(255, 184, 74, ${a})`;
        const r = 1 + 2 * a;
        ctx.beginPath();
        ctx.arc(this.x[i], this.y[i], r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export const GOO = 0;
export const SPARK = 1;
export { COLORS };
