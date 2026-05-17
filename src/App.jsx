import { useEffect, useRef, useState } from 'react';
import './index.css';
import { World } from './game/world.js';
import { GameLoop } from './game/loop.js';
import { attachInput } from './game/input.js';
import { HUD } from './ui/HUD.jsx';
import { LevelBar } from './ui/LevelBar.jsx';
import { AdBonusBar } from './ui/AdBonusBar.jsx';
import { UpgradePanel } from './ui/UpgradePanel.jsx';
import { StartScreen, WaveBanner, GameOver, SettingsButton, LevelUpToast } from './ui/Overlays.jsx';
import { AdModal } from './ui/AdModal.jsx';
import { Leaderboard } from './ui/Leaderboard.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const worldRef = useRef(null);
  const loopRef = useRef(null);

  if (!worldRef.current) worldRef.current = new World();
  const world = worldRef.current;

  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [waveBanner, setWaveBanner] = useState(null);
  const [levelUpTo, setLevelUpTo] = useState(null);
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      world.resize(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const detachInput = attachInput(canvas, world);
    const loop = new GameLoop(world, ctx);
    loopRef.current = loop;
    loop.start();

    const unsubEvents = world.on('event', (name, payload) => {
      if (name === 'started') setStarted(true);
      else if (name === 'gameover') setGameOver(true);
      else if (name === 'restart') { setGameOver(false); setStarted(true); }
      else if (name === 'revived') setGameOver(false);
      else if (name === 'wave') {
        setWaveBanner(payload);
        setTimeout(() => setWaveBanner(null), 2200);
      } else if (name === 'levelup') {
        setLevelUpTo(payload.to);
      }
    });

    return () => {
      loop.stop();
      detachInput();
      window.removeEventListener('resize', resize);
      unsubEvents();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStart = () => world.start();
  const onRestart = () => world.restart();

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      {started && <HUD world={world} />}
      {started && !gameOver && <LevelBar world={world} />}
      {started && !gameOver && <AdBonusBar world={world} />}
      {started && <SettingsButton world={world} />}
      {started && !gameOver && <UpgradePanel world={world} />}
      {waveBanner && <WaveBanner wave={waveBanner.wave} banner={waveBanner.banner} isBoss={waveBanner.isBoss} />}
      {levelUpTo !== null && <LevelUpToast level={levelUpTo} onClose={() => setLevelUpTo(null)} />}
      {!started && <StartScreen world={world} onStart={onStart} onOpenLeaderboard={() => setShowBoard(true)} />}
      {gameOver && <GameOver world={world} onRestart={onRestart} onOpenLeaderboard={() => setShowBoard(true)} />}
      {showBoard && <Leaderboard onClose={() => setShowBoard(false)} />}
      <AdModal />
    </div>
  );
}
