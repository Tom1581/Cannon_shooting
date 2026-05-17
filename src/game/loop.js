// RAF loop with dt clamping and visibility-driven pause.
// Stays mounted with empty deps — no tear-down on state changes.

export class GameLoop {
  constructor(world, ctx) {
    this.world = world;
    this.ctx = ctx;
    this.rAF = 0;
    this.lastT = 0;
    this._running = false;
    this._onVis = this._onVis.bind(this);
    this._tick = this._tick.bind(this);
  }
  start() {
    if (this._running) return;
    this._running = true;
    this.lastT = 0;
    document.addEventListener('visibilitychange', this._onVis);
    this.rAF = requestAnimationFrame(this._tick);
  }
  stop() {
    this._running = false;
    cancelAnimationFrame(this.rAF);
    document.removeEventListener('visibilitychange', this._onVis);
  }
  _onVis() {
    this.world.paused = document.hidden;
    // Reset dt baseline so we don't get a huge spike when we return
    this.lastT = 0;
  }
  _tick(now) {
    if (!this._running) return;
    if (!this.lastT) this.lastT = now;
    let dt = now - this.lastT;
    this.lastT = now;
    // Clamp: if browser stalled (tab inactive), don't run a 5-second simulation step
    if (dt > 80) dt = 80;
    this.world.step(dt);
    this.world.draw(this.ctx);
    this.rAF = requestAnimationFrame(this._tick);
  }
}
