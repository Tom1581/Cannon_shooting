import { useSyncExternalStore } from 'react';
import { COMBO_THRESHOLD } from '../game/config.js';

function useWorld(world) {
  const subscribe = (cb) => world.on('hud', cb);
  const snap = () =>
    `${world.kills}|${world.coins}|${world.wave}|${world.firePower}|${world.fireRateTier}|${world.sizeTier}|${world.recentKills.length}|${world.rampageUntil > world.t ? 1 : 0}|${world.highScore}`;
  useSyncExternalStore(subscribe, snap, snap);
}

export function HUD({ world }) {
  useWorld(world);
  // useWorld already subscribes; we just read fields below.
  const inRampage = world.rampageUntil > world.t;
  const comboPct = Math.min(1, world.recentKills.length / COMBO_THRESHOLD);

  return (
    <div className="hud">
      <div className="hud-row">
        <div className="hud-pill pill-wave">
          <span className="hud-label">WAVE</span>
          <span className="hud-value">{world.wave}</span>
        </div>
        <div className="hud-pill pill-kills">
          <span className="hud-label">KILLS</span>
          <span className="hud-value">{world.kills}</span>
        </div>
        <div className="hud-pill pill-coins">
          <span className="hud-label">$</span>
          <span className="hud-value">{world.coins}</span>
        </div>
      </div>
      <div className="combo-track">
        <div
          className={`combo-fill ${inRampage ? 'rampage' : ''}`}
          style={{ width: `${comboPct * 100}%` }}
        />
        {inRampage && <span className="combo-label">RAMPAGE</span>}
      </div>
      <div className="best-row">Best: {world.highScore}</div>
    </div>
  );
}
