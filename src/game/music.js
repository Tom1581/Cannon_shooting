// Background music. Two modes:
//   1. FILE  — plays a looping MP3 from public/bg-music.mp3 if present.
//              Volume scales with intensity (menu/play/boss).
//   2. SYNTH — procedural drone fallback when no MP3 is found. Zero asset
//              files = zero copyright risk.
//
// IMPORTANT: any MP3 you drop at public/bg-music.mp3 MUST be licensed for
// commercial use. Google Play scans audio fingerprints and will reject /
// take down listings that ship unlicensed copyrighted music. Safe sources:
//   • Pixabay Music         — free for commercial use, no attribution
//   • YouTube Audio Library — free under listed terms
//   • Kevin MacLeod (incompetech.com) — CC BY (requires credit in README)
//   • freemusicarchive.org  — filter to commercial-OK licenses

const MUSIC_FILE = '/bg-music.mp3';
const MENU_VOL = 0.30;
const PLAY_VOL = 0.45;
const BOSS_VOL = 0.55;

export class Music {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.running = false;

    // FILE mode
    this.audio = null;
    this.fileAvailable = null; // null = unknown, true = file works, false = fall back to synth

    // SYNTH mode state
    this._droneNodes = null;
    this._scheduler = null;
    this._nextBeatT = 0;
    this._step = 0;
    this._bpm = 72;
    this._intensityT = MENU_VOL / BOSS_VOL;
    this._targetIntensity = MENU_VOL / BOSS_VOL;
    this._targetVol = MENU_VOL;
  }

  attach(audioCtx) {
    if (this.ctx) return;
    this.ctx = audioCtx;
    // Try to load the MP3 lazily; if it 404s we fall back to synth.
    this._probeFile();
  }

  _probeFile() {
    if (this.fileAvailable !== null) return;
    // HEAD-style probe via a HEAD request would be cleaner, but we can just
    // try to load the audio element and listen for error/canplay.
    const a = new Audio();
    a.preload = 'auto';
    a.loop = true;
    a.volume = 0;
    a.src = MUSIC_FILE;
    let resolved = false;
    a.addEventListener('canplaythrough', () => {
      if (resolved) return;
      resolved = true;
      this.fileAvailable = true;
      this.audio = a;
      if (this.running && !this.muted) this._startFile();
    });
    a.addEventListener('error', () => {
      if (resolved) return;
      resolved = true;
      this.fileAvailable = false;
      // If we were already running with synth, leave it. Otherwise nothing to do.
    });
  }

  setMuted(m) {
    this.muted = m;
    if (this.audio) this.audio.volume = m ? 0 : this._targetVol;
    if (this._droneNodes && this._droneNodes.droneGain) {
      this._droneNodes.droneGain.gain.setTargetAtTime(m ? 0 : 0.06, this.ctx.currentTime, 0.05);
    }
  }

  start() {
    if (this.running || !this.ctx) return;
    this.running = true;

    if (this.fileAvailable === true) {
      this._startFile();
    } else if (this.fileAvailable === false) {
      this._startSynth();
    } else {
      // Unknown — start synth as the immediate sound, then if the file resolves
      // later, _probeFile's canplaythrough handler will swap it in.
      this._startSynth();
    }
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.audio) {
      try { this.audio.pause(); this.audio.currentTime = 0; } catch (_) {}
    }
    this._stopSynth();
  }

  setIntensity(level) {
    let vol;
    if (level === 'play') vol = PLAY_VOL;
    else if (level === 'boss') vol = BOSS_VOL;
    else if (level === 'menu') vol = MENU_VOL;
    else if (typeof level === 'number') vol = MENU_VOL + (BOSS_VOL - MENU_VOL) * Math.max(0, Math.min(1, level));
    else vol = MENU_VOL;
    this._targetVol = vol;
    if (this.audio && !this.muted) this.audio.volume = vol;
    // Synth: use the existing intensity ramp
    this._targetIntensity = vol / BOSS_VOL;
  }

  // ---- FILE mode ----
  _startFile() {
    if (!this.audio) return;
    this.audio.volume = this.muted ? 0 : this._targetVol;
    // play() can reject if the browser hasn't unlocked yet. Catch + ignore;
    // the next user gesture will retry via audio.unlock() → music.start().
    const p = this.audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    // If synth was running as a fallback, stop it.
    this._stopSynth();
  }

  // ---- SYNTH mode (kept as fallback so the game is never silent) ----
  _startSynth() {
    if (!this.ctx) return;
    if (this._droneNodes) return;
    const now = this.ctx.currentTime;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 240;
    lp.Q.value = 0.4;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0;
    droneGain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.06, now + 1.0);
    const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = this.ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 55 * 1.005;
    const o3 = this.ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 27.5;
    o1.connect(lp); o2.connect(lp); o3.connect(lp);
    lp.connect(droneGain); droneGain.connect(this.ctx.destination);
    const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.12;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 80;
    lfo.connect(lfoGain).connect(lp.frequency);
    o1.start(now); o2.start(now); o3.start(now); lfo.start(now);
    this._droneNodes = { o1, o2, o3, lfo, droneGain, lp, lfoGain };
    this._nextBeatT = now + 0.1;
    this._step = 0;
    this._scheduler = setInterval(() => this._tickSynth(), 60);
  }

  _stopSynth() {
    if (this._scheduler) { clearInterval(this._scheduler); this._scheduler = null; }
    const d = this._droneNodes;
    if (!d || !this.ctx) return;
    const now = this.ctx.currentTime;
    d.droneGain.gain.cancelScheduledValues(now);
    d.droneGain.gain.setValueAtTime(d.droneGain.gain.value, now);
    d.droneGain.gain.linearRampToValueAtTime(0, now + 0.5);
    setTimeout(() => {
      try { d.o1.stop(); d.o2.stop(); d.o3.stop(); d.lfo.stop(); } catch (_) {}
    }, 600);
    this._droneNodes = null;
  }

  _tickSynth() {
    if (!this._droneNodes || !this.ctx) return;
    this._intensityT += (this._targetIntensity - this._intensityT) * 0.05;
    const intensity = this._intensityT;
    this._bpm = 60 + intensity * 32;
    const secPerStep = 60 / this._bpm / 2;
    const ahead = this.ctx.currentTime + 0.35;
    while (this._nextBeatT < ahead) {
      this._scheduleSynthStep(this._nextBeatT, this._step, intensity);
      this._nextBeatT += secPerStep;
      this._step = (this._step + 1) % 8;
    }
  }

  _scheduleSynthStep(when, step, intensity) {
    if (step === 0 || step === 4) this._kick(when, 0.18 * Math.max(0.25, intensity));
    if (step % 2 === 0) {
      const pattern = [0, 0, 3, 0, 0, -4, -2, 0];
      const semis = pattern[step % 8];
      this._bassNote(when, 55 * Math.pow(2, semis / 12), 0.04 + 0.05 * intensity);
    }
    if (step % 2 === 1 && intensity > 0.45) this._tickHat(when, 0.012 + 0.02 * intensity);
  }

  _kick(when, vol) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, when);
    o.frequency.exponentialRampToValueAtTime(36, when + 0.18);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    o.connect(g).connect(this.ctx.destination);
    o.start(when); o.stop(when + 0.24);
  }
  _bassNote(when, freq, vol) {
    const o = this.ctx.createOscillator(); const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain(); const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(420, when);
    lp.frequency.exponentialRampToValueAtTime(160, when + 0.5);
    o.type = 'sawtooth'; o.frequency.value = freq;
    o2.type = 'square'; o2.frequency.value = freq * 0.5;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.55);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(this.ctx.destination);
    o.start(when); o2.start(when);
    o.stop(when + 0.6); o2.stop(when + 0.6);
  }
  _tickHat(when, vol) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3000;
    o.type = 'square'; o.frequency.value = 5400;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    o.connect(hp).connect(g).connect(this.ctx.destination);
    o.start(when); o.stop(when + 0.05);
  }
}

export const music = new Music();
