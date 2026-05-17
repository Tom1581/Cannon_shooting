import { useState, useSyncExternalStore } from 'react';
import { showRewarded } from '../game/ads.js';

// Slim top-center bonus pill. Sits below the level bar, doesn't reach the
// gameplay area so it never overlaps the squad.
export function AdBonusBar({ world }) {
  const snap = () => `${world.doubleCoinsUntil > world.t ? 1 : 0}|${Math.max(0, world.doubleCoinsUntil - world.t)}`;
  useSyncExternalStore((cb) => world.on('hud', cb), snap, snap);
  const [busy, setBusy] = useState(false);

  const active = world.doubleCoinsUntil > world.t;
  const remaining = active ? Math.ceil((world.doubleCoinsUntil - world.t) / 1000) : 0;

  const onClick = async () => {
    if (busy || active) return;
    setBusy(true);
    const watched = await showRewarded('double_coins');
    setBusy(false);
    if (watched) world.grantDoubleCoinsBuff(30000);
  };

  return (
    <button
      className={`ad-bonus-pill ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={busy || active}
    >
      {active ? (
        <>
          <span className="dot">●</span>
          <span>2× COINS</span>
          <span className="ad-bonus-time">{remaining}s</span>
        </>
      ) : busy ? (
        <span>WATCHING AD…</span>
      ) : (
        <>
          <span className="play-tri">▶</span>
          <span>AD · 2× COINS · 30s</span>
        </>
      )}
    </button>
  );
}
