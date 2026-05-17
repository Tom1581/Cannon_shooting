// Synthesized SFX via Web Audio API. Zero asset files.
// Unlock on first user gesture; cap polyphony at 8.

import { music } from './music.js';

const MAX_VOICES = 8;

class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.voices = 0;
    this.unlocked = false;
  }
  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
  }
  // Call inside a user-gesture handler.
  unlock() {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.unlocked) return;
    // Tiny silent buffer to fully unlock iOS/Android WebView.
    const buf = this.ctx.createBuffer(1, 1, 22050);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    src.start(0);
    this.unlocked = true;
    // Music shares the same AudioContext and unlock window
    music.attach(this.ctx);
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
    // Music is muted with SFX by default; the world can re-enable just music
    // by calling music.setMuted(false) after this if desired.
    music.setMuted(m);
  }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume()  { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  // Direct access for callers that need to start/stop music.
  startMusic() { music.start(); }
  stopMusic()  { music.stop(); }
  setMusicIntensity(level) { music.setIntensity(level); }

  _voice(make) {
    if (!this.ctx || this.muted) return;
    if (this.voices >= MAX_VOICES) return;
    this.voices++;
    make(this.ctx, this.master, () => { this.voices--; });
  }

  shoot() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 0.09);
      osc.onended = done;
    });
  }
  hit() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 0.11);
      osc.onended = done;
    });
  }
  coin() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      o1.type = 'triangle'; o2.type = 'sine';
      o1.frequency.setValueAtTime(1320, now);
      o2.frequency.setValueAtTime(1760, now + 0.05);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      o1.connect(g); o2.connect(g); g.connect(out);
      o1.start(now); o2.start(now + 0.05);
      o1.stop(now + 0.2); o2.stop(now + 0.2);
      o2.onended = done;
    });
  }
  groan() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.4);
      lp.type = 'lowpass'; lp.frequency.value = 700;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc.connect(lp).connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 0.45);
      osc.onended = done;
    });
  }
  waveHorn() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.4);
      osc.frequency.linearRampToValueAtTime(180, now + 0.9);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      osc.connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 1.0);
      osc.onended = done;
    });
  }
  rampage() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      osc.type = 'square';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
      lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(lp).connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 0.6);
      osc.onended = done;
    });
  }
  gameOver() {
    this._voice((ctx, out, done) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.9);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.32, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      osc.connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 1.05);
      osc.onended = done;
    });
  }
}

export const audio = new AudioBus();

// Visibility-driven suspend/resume to be safe on Android WebView.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.suspend();
    else audio.resume();
  });
}
