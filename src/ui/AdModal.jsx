import { useEffect, useState } from 'react';
import { onAdEvent, cancelActiveStub, isStubMode } from '../game/ads.js';

// Renders a fake fullscreen "watching ad" overlay while a stub ad is playing.
// When real AdMob is wired in, the native ad will appear on top and this
// component will simply never receive a 'started' event.
export function AdModal() {
  const [active, setActive] = useState(null); // { reason, durationMs, startedAt }
  const [now, setNow] = useState(0);

  useEffect(() => {
    return onAdEvent((evt) => {
      if (evt.type === 'started') {
        setActive({ reason: evt.reason, durationMs: evt.durationMs, startedAt: Date.now() });
      } else if (evt.type === 'closed') {
        setActive(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  const elapsed = Math.min(active.durationMs, now - active.startedAt);
  const pct = Math.min(1, elapsed / active.durationMs);
  const remaining = Math.max(0, Math.ceil((active.durationMs - elapsed) / 1000));

  return (
    <div className="ad-modal">
      <div className="ad-card">
        <div className="ad-badge">SPONSORED</div>
        <div className="ad-title">Reward: {labelFor(active.reason)}</div>
        <div className="ad-fake">
          <div className="ad-fake-inner">
            <div className="ad-fake-shimmer" />
            <div className="ad-fake-label">Your ad here</div>
          </div>
        </div>
        <div className="ad-progress">
          <div className="ad-progress-fill" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="ad-foot">
          <span>{remaining}s</span>
          {isStubMode() && (
            <button className="ad-skip" onClick={cancelActiveStub}>Skip (dev)</button>
          )}
        </div>
      </div>
    </div>
  );
}

function labelFor(reason) {
  switch (reason) {
    case 'revive':       return 'Revive squad';
    case 'double_coins': return '2× coins (30s)';
    case 'free_upgrade': return 'Free upgrade';
    default:             return 'Bonus';
  }
}
