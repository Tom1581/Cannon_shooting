import React, { useEffect, useRef, useState } from 'react';
import './index.css';

const GIANT_RADIUS = 25;
const BLUE_SPEED = 5;
const HERO_RADIUS = 8;

function App() {
  const canvasRef = useRef(null);
  const [coins, setCoins] = useState(0);
  const [firePower, setFirePower] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [mobSizeUI, setMobSizeUI] = useState(1); // Drives the blue top-left counter

  const gameState = useRef({
    heroes: [],
    blueUnits: [],
    redUnits: [],
    giants: [],
    gates: [],
    isFiring: false,
    pointerX: 200,
    lastFireTime: 0,
    lastEnemySpawn: 0,
    lastGateSpawn: 0,
    startTime: 0,
    width: 0,
    height: 0,
    rAF: null
  });

  const upgradeCost = Math.floor(50 * Math.pow(1.8, firePower - 1));

  const handleUpgrade = () => {
    if (coins >= upgradeCost) {
      setCoins(coins - upgradeCost);
      setFirePower(firePower + 1);
    }
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setCoins(0);
    setFirePower(1);
    setLevel(1);
    
    // Seed the first hero
    const w = gameState.current.width || window.innerWidth;
    const h = gameState.current.height || window.innerHeight;
    gameState.current = {
      ...gameState.current,
      heroes: [{ x: w / 2, y: h - 120 }],
      blueUnits: [],
      redUnits: [],
      giants: [],
      gates: [],
      lastEnemySpawn: 0,
      lastGateSpawn: 0,
      pointerX: w / 2,
      startTime: Date.now()
    };
    setMobSizeUI(1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    gameState.current.startTime = Date.now();
    
    // Init first hero if empty
    if (gameState.current.heroes.length === 0) {
      gameState.current.heroes.push({ x: 200, y: 500 });
    }

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      gameState.current.width = canvas.width;
      gameState.current.height = canvas.height;
      
      // Keep pointer within bounds
      if (gameState.current.pointerX === 200) {
        gameState.current.pointerX = canvas.width / 2;
        if(gameState.current.heroes[0]) {
           gameState.current.heroes[0].x = canvas.width / 2;
           gameState.current.heroes[0].y = canvas.height - 150;
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (timestamp) => {
      updatePhysics(timestamp, firePower, isGameOver, level);
      render(ctx, firePower, timestamp);
      
      if (!isGameOver) {
        gameState.current.rAF = requestAnimationFrame(loop);
      }
    };
    
    if (!isGameOver) {
      gameState.current.rAF = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(gameState.current.rAF);
      window.removeEventListener('resize', resize);
    };
  }, [firePower, isGameOver, level]);

  const getBulletProps = (power) => {
    if (power === 1) return { size: 4, color: '#2cb6fe', type: 'circle' };
    if (power === 2) return { size: 6, color: '#00f2fe', type: 'circle' };
    if (power === 3) return { size: 8, color: '#4facfe', type: 'diamond' };
    if (power >= 4) return { size: 10, color: '#00ff87', type: 'laser' };
    return { size: 4, color: '#2cb6fe', type: 'circle' };
  };

  const updatePhysics = (timestamp, currentFirePower, gameOver, currentLevel) => {
    if (gameOver) return;

    const state = gameState.current;
    const { width, height } = state;
    if (width === 0) return;

    const elapsed = Date.now() - state.startTime;
    const computedLevel = Math.floor(elapsed / 12000) + 1; 
    if (computedLevel > currentLevel) {
      setLevel(computedLevel);
    }

    const ENEMY_SPEED = 2.5 + (currentLevel * 0.4); 
    const playerBaseY = height - 150; 
    const bulletProps = getBulletProps(currentFirePower);

    // 1. Swarm Movement (Vogel's Spiral for perfect circle clustering around pointer)
    const C = 14; // spacing modifier
    for (let i = 0; i < state.heroes.length; i++) {
       const hero = state.heroes[i];
       // Golden angle in radians
       const theta = i * 2.39996;
       const r = C * Math.sqrt(i);
       
       const targetX = state.pointerX + Math.cos(theta) * r;
       const targetY = playerBaseY + Math.sin(theta) * r;
       
       // Smoot lerp towards position (adds elastic crowd feel)
       hero.x += (targetX - hero.x) * 0.2;
       hero.y += (targetY - hero.y) * 0.2;
    }

    // 2. Swarm Firing Mechanics
    const currentFireRate = Math.max(80, 150 - (currentFirePower * 15));
    if (state.isFiring && timestamp - state.lastFireTime > currentFireRate) {
      // Loop through all heroes. To prevent 1000s of bullets from lagging, randomly throttle large swarms
      const firingChance = state.heroes.length > 30 ? (30 / state.heroes.length) : 1; 

      state.heroes.forEach(h => {
        if (Math.random() <= firingChance) {
          state.blueUnits.push({
            x: h.x,
            y: h.y - HERO_RADIUS,
            color: bulletProps.color,
            size: bulletProps.size,
            type: bulletProps.type,
            vx: (Math.random() - 0.5),
            vy: -BLUE_SPEED - (currentFirePower * 0.3)
          });
        }
      });
      state.lastFireTime = timestamp;
    }


    // 3. Dynamic Gates Spawning
    if (timestamp - state.lastGateSpawn > Math.max(1000, 2500 - (currentLevel * 200))) {
       const isBadGate = Math.random() > 0.6; 
       let gType = 'add';
       let gVal = 3 + Math.floor(Math.random() * 5); // Add 3 to 7
       let gLabel = '+' + gVal;
       let gColor = 'rgba(0, 150, 255, 0.5)'; 

       if (isBadGate) {
         gType = 'sub';
         gVal = 2 + Math.floor(Math.random() * 3); // -2 to -4
         gLabel = '-' + gVal;
         gColor = 'rgba(255, 0, 50, 0.6)'; 
       } else if (Math.random() > 0.8) {
         gType = 'mult';
         gVal = 2; // x2
         gLabel = 'x2';
         gColor = 'rgba(255, 200, 0, 0.5)'; 
       } else if (gVal <= 4 && Math.random() > 0.6) {
         // Occasionally give big boosts
         gType = 'add';
         gVal = 10;
         gLabel = '+10';
       }

       state.gates.push({
         id: 'g' + Date.now() + Math.random(),
         x: width * 0.1 + Math.random() * (width * 0.6),
         y: -100,
         width: 100,
         height: 60,
         type: gType,
         value: gVal,
         label: gLabel,
         color: gColor,
         vy: isBadGate ? (1.8 + currentLevel * 0.2) : (1.0 + currentLevel * 0.1) // Bad gates fall 1.8x faster!
       });
       state.lastGateSpawn = timestamp;
    }

    // 4. Enemy Spawning
    if (timestamp - state.lastEnemySpawn > Math.max(400, 1500 - (currentLevel * 200))) {
      if (Math.random() > 0.8) {
        state.giants.push({
          x: width * 0.1 + Math.random() * width * 0.8,
          y: -50,
          hp: 15 + (currentLevel * 20),
          maxHp: 15 + (currentLevel * 20),
          vx: 0,
          vy: ENEMY_SPEED * 0.6
        });
      } else {
        const spawnX = width * 0.1 + Math.random() * width * 0.8;
        const count = 4 + Math.floor(Math.random() * 3 * currentLevel);
        for (let i = 0; i < count; i++) {
          state.redUnits.push({
            x: spawnX + (Math.random() * 60 - 30),
            y: -20 - (Math.random() * 40),
            color: '#ff3b30',
            size: 8,
            vx: (Math.random() - 0.5) * 1.2,
            vy: ENEMY_SPEED
          });
        }
      }
      state.lastEnemySpawn = timestamp;
    }

    // 5. Update Gates & Hit Detection against Player Mob
    for (let i = state.gates.length - 1; i >= 0; i--) {
      let g = state.gates[i];
      g.y += g.vy;
      
      let gotHit = false;
      // If ANY hero in the swarm touches the gate, trigger effect on entire swarm and destroy gate.
      for (let h = 0; h < state.heroes.length; h++) {
        let hero = state.heroes[h];
        if (hero.x > g.x && hero.x < g.x + g.width &&
            hero.y > g.y && hero.y < g.y + g.height) {
            
            // Trigger Gate!
            gotHit = true;
            if (g.type === 'sub') {
                // Delete heroes
                state.heroes.splice(-g.value);
            } else if (g.type === 'add') {
                // Add heroes
                for(let c = 0; c < g.value; c++) {
                    state.heroes.push({ x: hero.x, y: hero.y }); // spawn near the trigger point
                }
            } else if (g.type === 'mult') {
                // Multiply heroes
                const amountToAdd = state.heroes.length * (g.value - 1);
                for(let c = 0; c < amountToAdd; c++) {
                    state.heroes.push({ x: hero.x, y: hero.y }); 
                }
            }
            break; // Stop checking other heroes for this consumed gate
        }
      }

      if (gotHit) {
         state.gates.splice(i, 1);
      } else if (g.y > height) {
         state.gates.splice(i, 1);
      }
    }

    // Update Mob Size UI instantly
    if (mobSizeUI !== state.heroes.length) {
       setMobSizeUI(state.heroes.length);
    }
    
    // Check Game Over
    if (state.heroes.length === 0) {
       setIsGameOver(true);
       return;
    }

    // 6. Movement for Bullets
    for (let i = state.blueUnits.length - 1; i >= 0; i--) {
      let b = state.blueUnits[i];
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < 10 || b.x > width - 10) b.vx *= -1;
      if (b.y < -50) {
        state.blueUnits.splice(i, 1);
      }
    }

    // 7. Enemy Descent & Hit Detection against Heroes
    ["redUnits", "giants"].forEach(enemyType => {
      for (let i = state[enemyType].length - 1; i >= 0; i--) {
        let e = state[enemyType][i];
        e.x += e.vx;
        e.y += e.vy;

        let eRadius = enemyType === 'giants' ? GIANT_RADIUS : e.size || 8;
        
        let enemyDied = false;
        // Check if Enemy crushes a Hero
        for (let h = state.heroes.length - 1; h >= 0; h--) {
            let hero = state.heroes[h];
            let dx = e.x - hero.x;
            let dy = e.y - hero.y;
            
            if (dx * dx + dy * dy < (eRadius + HERO_RADIUS) * (eRadius + HERO_RADIUS)) {
                // Enemy squashed a hero!
                state.heroes.splice(h, 1); // Kill hero
                
                if (enemyType === 'redUnits') {
                   enemyDied = true; // Red dies instantly taking a hero with it
                   break;
                } else if (enemyType === 'giants') {
                   // Giant takes damage linearly as it chews through heroes
                   e.hp -= 2;
                   if (e.hp <= 0) {
                       enemyDied = true;
                       setCoins(prev => prev + 10);
                       break;
                   }
                }
            }
        }
        
        if (enemyDied) {
           state[enemyType].splice(i, 1);
        } else if (e.y > height + 50) {
           state[enemyType].splice(i, 1);
        }
      }
    });

    if (state.heroes.length === 0) {
       setIsGameOver(true);
       return; 
    }

    // 8. Bullet vs Enemy Combat Collisions
    for (let b = state.blueUnits.length - 1; b >= 0; b--) {
      let blue = state.blueUnits[b];
      let collided = false;
      const bRad = blue.size || 4;

      for (let r = state.redUnits.length - 1; r >= 0; r--) {
        let red = state.redUnits[r];
        let rRad = red.size || 8;
        let dx = blue.x - red.x;
        let dy = blue.y - red.y;
        
        if (dx * dx + dy * dy < (bRad + rRad) * (bRad + rRad)) {
          state.redUnits.splice(r, 1);
          collided = true;
          setCoins(prev => prev + 1);
          break;
        }
      }

      if (collided) {
        state.blueUnits.splice(b, 1);
        continue;
      }

      for (let g = state.giants.length - 1; g >= 0; g--) {
        let giant = state.giants[g];
        let dx = blue.x - giant.x;
        let dy = blue.y - giant.y;
        if (dx * dx + dy * dy < (GIANT_RADIUS + bRad) * (GIANT_RADIUS + bRad)) {
          const damage = currentFirePower >= 3 ? 2 : 1;
          giant.hp -= damage;
          collided = true;
          if (giant.hp <= 0) {
            state.giants.splice(g, 1);
            setCoins(prev => prev + 10); 
          }
          break;
        }
      }

      if (collided) {
        state.blueUnits.splice(b, 1);
      }
    }
  };

  const render = (ctx, currentFirePower, timestamp) => {
    const state = gameState.current;
    const { width, height } = state;
    ctx.clearRect(0, 0, width, height);

    // Draw Gates
    state.gates.forEach(g => {
      ctx.fillStyle = g.color;
      ctx.fillRect(g.x, g.y, g.width, g.height);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(g.x, g.y, g.width, g.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g.label, g.x + g.width/2, g.y + g.height/2);
    });

    // Draw Bullets
    ctx.beginPath();
    state.blueUnits.forEach(p => {
       ctx.fillStyle = p.color;
       if (p.type === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size); ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x, p.y + p.size); ctx.lineTo(p.x - p.size, p.y);
          ctx.fill();
       } else if (p.type === 'laser') {
          ctx.fillRect(p.x - p.size/4, p.y - p.size, p.size/2, p.size*2);
       } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
       }
    });

    // Draw Enemies
    const drawBasicCircle = (x, y, r, color) => {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    state.redUnits.forEach(u => drawBasicCircle(u.x, u.y, u.size, u.color));
    
    state.giants.forEach(g => {
      drawBasicCircle(g.x, g.y, GIANT_RADIUS, '#ffcc00'); 
      ctx.fillStyle = 'black';
      ctx.font = 'bold 16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(g.hp, g.x, g.y - GIANT_RADIUS - 10);
    });

    // Draw The Hero Crowd
    const legSwing = Math.sin(timestamp * 0.01) * 4;
    const isMoving = Math.abs(state.pointerX - state.heroes[0]?.x) > 5;
    
    state.heroes.forEach(h => {
        ctx.save();
        ctx.translate(h.x, h.y);
        
        // Dynamic tiny human!
        // Legs
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        let actSwing = isMoving ? legSwing : 0;
        ctx.moveTo(-3, 0); ctx.lineTo(-3 + actSwing, 8); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, 0); ctx.lineTo(3 - actSwing, 8); ctx.stroke();

        // Torso
        ctx.fillStyle = '#2980b9'; 
        ctx.beginPath(); ctx.roundRect(-6, -12, 12, 12, 3); ctx.fill();

        // Head
        ctx.fillStyle = '#f1c40f'; 
        ctx.beginPath(); ctx.arc(0, -16, 5, 0, Math.PI * 2); ctx.fill();
        
        // Visor
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath(); ctx.arc(0, -17, 5, Math.PI, 0); ctx.fill();

        // Little Weapon
        ctx.fillStyle = currentFirePower >= 4 ? '#00ff87' : '#34495e';
        ctx.fillRect(0, -10, 4, 8);

        ctx.restore();
    });

  };

  const handlePointerDown = (e) => {
    if (isGameOver) return;
    gameState.current.isFiring = true;
    updateFirePos(e);
  };

  const handlePointerMove = (e) => {
    if (gameState.current.isFiring) {
      updateFirePos(e);
    }
  };

  const handlePointerUp = () => {
    gameState.current.isFiring = false;
  };

  const updateFirePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;
    gameState.current.pointerX = clientX - rect.left;
  };

  return (
    <div className="game-container"
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerCancel={handlePointerUp}
         style={{ cursor: 'none' }}>
      
      <div className="back-btn">←</div>
      
      <div style={{ position:'absolute', top:'10px', left:'50%', transform:'translateX(-50%)', 
                    color:'#fff', fontWeight:'900', fontSize:'24px', textShadow:'0 2px 0 #000', zIndex:50 }}>
        LEVEL {level}
      </div>

      <div className="hud">
        {/* MOB SIZE UI */}
        <div className="hud-pill blue">
          <div className="hud-icon">🧑‍🤝‍🧑</div>
          {mobSizeUI}
        </div>
        <div className="hud-pill yellow">
          <div className="hud-icon">🪙</div>
          {coins}
        </div>
      </div>

      <div className="game-world">
        <div className="platform"></div>
        <canvas id="game-canvas" ref={canvasRef}></canvas>
      </div>

      <div style={{ position: 'absolute', bottom: '110px', right: '15px', zIndex: 100 }}>
        <button 
          onClick={handleUpgrade}
          style={{
            backgroundColor: coins >= upgradeCost ? '#ff4757' : '#bdc3c7',
            border: '3px solid #000',
            borderRadius: '15px',
            padding: '10px 15px',
            color: coins >= upgradeCost ? '#fff' : '#000',
            fontWeight: 'bolder',
            fontFamily: 'Inter',
            boxShadow: '0 4px 0 #000',
            cursor: coins >= upgradeCost ? 'pointer' : 'not-allowed',
            transform: 'scale(1)',
            transition: 'background-color 0.2s'
          }}
        >
          UPGRADE FIRE (Lvl {firePower})<br/>
          💰 {upgradeCost}
        </button>
      </div>

      {isGameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
        }}>
          <h1 style={{ color: '#ff4757', textShadow: '2px 2px 0 #000', fontSize: '64px', margin: 0 }}>GAME OVER</h1>
          <p style={{ color: '#fff', fontSize: '24px', margin: '20px 0' }}>Your Army Was Annihilated!</p>
          <button 
            onClick={handleRestart}
            style={{
              backgroundColor: '#ffcc00', border: '4px solid #000', padding: '15px 40px',
              fontSize: '28px', fontWeight: '900', borderRadius: '40px', boxShadow: '0 6px 0 #000', cursor: 'pointer'
            }}
          >
            RETRY
          </button>
        </div>
      )}

      <div className="bottom-banner">
        <span className="bottom-banner-text">CHOOSE WISELY!</span>
      </div>
    </div>
  );
}

export default App;
