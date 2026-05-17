import { useEffect, useState } from 'react';
import { getPlayerName, setPlayerName } from '../game/leaderboard.js';
import { showRewarded } from '../game/ads.js';

export function StartScreen({ world, onStart, onOpenLeaderboard }) {
  const [high, setHigh] = useState(world.highScore);
  const [name, setName] = useState(getPlayerName());
  useEffect(() => setHigh(world.highScore), [world.highScore]);
  return (
    <div className="overlay start-overlay">
      <h1 className="title">ZOMBIE<br/>TIDE</h1>
      <p className="tagline">Hold the line. Grow the squad. Survive the night.</p>

      <div className="name-row">
        <label className="name-label">Name</label>
        <input
          className="name-input"
          value={name}
          maxLength={16}
          placeholder="Survivor"
          onChange={(e) => { const v = e.target.value; setName(v); setPlayerName(v); }}
        />
      </div>

      <div className="start-stats">
        <div><span>Level</span><b>{world.playerLevel}</b></div>
        <div><span>Best Wave</span><b>{world.highestWave || '—'}</b></div>
        {high > 0 && <div><span>Best Kills</span><b>{high}</b></div>}
      </div>

      <button className="big-btn" onClick={onStart}>TAP TO PLAY</button>
      <button className="ghost-btn" onClick={onOpenLeaderboard}>Weekly Top 10</button>
      <p className="hint">Drag left/right to move</p>
    </div>
  );
}

export function WaveBanner({ wave, banner, isBoss }) {
  return (
    <div className={`wave-banner ${isBoss ? 'boss' : ''}`}>
      <div className="wave-num">{banner || `WAVE ${wave}`}</div>
      {isBoss && <div className="wave-sub">⚠ HEAVY INCOMING</div>}
    </div>
  );
}

export function LevelUpToast({ level, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="levelup-toast">
      <div className="lu-rank">LEVEL {level}</div>
      <div className="lu-sub">Permanent boost unlocked</div>
    </div>
  );
}

export function GameOver({ world, onRestart, onOpenLeaderboard }) {
  const [busy, setBusy] = useState(false);
  const canRevive = !world.reviveUsed;
  const handleRevive = async () => {
    if (busy) return;
    setBusy(true);
    const watched = await showRewarded('revive');
    setBusy(false);
    if (watched) world.revive();
  };
  return (
    <div className="overlay gameover-overlay">
      <h1 className="defeat">OUTPOST FALLEN</h1>
      <div className="stat-row">Kills: <b>{world.kills}</b></div>
      <div className="stat-row">Wave: <b>{world.wave}</b></div>
      <div className="stat-row">Best: <b>{world.highScore}</b></div>
      <div className="stat-row level-stat">Level <b>{world.playerLevel}</b> · {world.playerXp} XP</div>

      {canRevive && (
        <button className="big-btn revive-btn" onClick={handleRevive} disabled={busy}>
          {busy ? 'WATCHING AD…' : '▶ WATCH AD TO REVIVE'}
        </button>
      )}
      <button className="big-btn try-again" onClick={onRestart}>TRY AGAIN</button>
      <button className="ghost-btn" onClick={onOpenLeaderboard}>Weekly Top 10</button>
    </div>
  );
}

export function SettingsButton({ world }) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(world.muted);
  const [haptic, setHaptic] = useState(world.haptic);
  const [musicOn, setMusicOn] = useState(world.musicOn);
  return (
    <>
      <button className="gear-btn" onClick={() => setOpen(o => !o)} aria-label="Settings">⚙</button>
      {open && (
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <label className="settings-row">
            <span>Sound FX</span>
            <input type="checkbox" checked={!muted} onChange={(e) => { const v = !e.target.checked; setMuted(v); world.setMuted(v); }} />
          </label>
          <label className="settings-row">
            <span>Music</span>
            <input type="checkbox" checked={musicOn} onChange={(e) => { const v = e.target.checked; setMusicOn(v); world.setMusicOn(v); }} />
          </label>
          <label className="settings-row">
            <span>Vibrate</span>
            <input type="checkbox" checked={haptic} onChange={(e) => { setHaptic(e.target.checked); world.setHaptic(e.target.checked); }} />
          </label>
          <button className="settings-close" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}
