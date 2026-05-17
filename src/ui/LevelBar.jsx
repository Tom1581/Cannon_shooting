import { useSyncExternalStore } from 'react';
import { xpForNext, xpAtLevel, nextRewardAfter } from '../game/levels.js';

export function LevelBar({ world }) {
  const snap = () => `${world.playerLevel}|${world.playerXp}`;
  useSyncExternalStore(
    (cb) => world.on('hud', cb),
    snap,
    snap,
  );
  const lvl = world.playerLevel;
  const base = xpAtLevel(lvl);
  const need = xpForNext(lvl);
  const into = Math.max(0, world.playerXp - base);
  const pct = Math.min(1, into / need);
  const next = nextRewardAfter(lvl);
  return (
    <div className="level-bar">
      <div className="level-row">
        <span className="level-chip">LV {lvl}</span>
        <span className="level-xp">{into} / {need} XP</span>
      </div>
      <div className="level-track">
        <div className="level-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      {next && (
        <div className="level-next">Next: <b>LV {next.atLevel}</b> · {next.label}</div>
      )}
    </div>
  );
}
