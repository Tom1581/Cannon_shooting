import { useEffect, useState } from 'react';
import { getTopWeekly, currentWeekKey } from '../game/leaderboard.js';

export function Leaderboard({ onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    getTopWeekly(10).then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  const week = currentWeekKey();
  const entries = data?.entries || [];
  const isGlobal = data?.isGlobal === true;

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-card">
        <div className="lb-header">
          <h2>Weekly Top 10</h2>
          <button className="lb-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="lb-sub">{week}{!isGlobal && ' · Local'}</div>
        {!isGlobal && (
          <div className="lb-note">
            Backend: <b>local</b>. This shows this device&apos;s top runs only.
            See <code>src/game/leaderboard.js</code> for cloud setup.
          </div>
        )}
        {!data && <div className="lb-loading">Loading…</div>}
        {data && entries.length === 0 && <div className="lb-empty">No runs this week yet — be the first.</div>}
        {data && entries.length > 0 && (
          <ol className="lb-list">
            {entries.map((e, i) => (
              <li key={i} className={`lb-row rank-${i + 1}`}>
                <span className="lb-rank">{i + 1}</span>
                <span className="lb-name">{e.name}</span>
                <span className="lb-score">{e.score}</span>
                <span className="lb-wave">W{e.wave}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
