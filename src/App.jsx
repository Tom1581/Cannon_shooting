import React, { useEffect, useRef, useState } from 'react';
import './index.css';

const MOB_RADIUS = 7;
const GIANT_RADIUS = 22;

function drawLittleMan(ctx, x, y, size, isEnemy) {
   ctx.fillStyle = 'rgba(0,0,0,0.2)';
   ctx.beginPath(); ctx.ellipse(x, y + 2, size * 1.5, size * 0.6, 0, 0, Math.PI * 2); ctx.fill();

   const mainColor = isEnemy ? '#ff3b30' : '#2cb6fe';
   const shadowColor = isEnemy ? '#b81c12' : '#1b8bde';
   const highlightColor = isEnemy ? '#ffadad' : '#b3e5fc';

   ctx.fillStyle = shadowColor;
   ctx.beginPath();
   ctx.ellipse(x - size*0.5, y, size*0.4, size*0.5, 0, 0, Math.PI*2);
   ctx.ellipse(x + size*0.5, y, size*0.4, size*0.5, 0, 0, Math.PI*2);
   ctx.fill();

   const gradBody = ctx.createLinearGradient(x - size, y - size*2, x + size, y);
   gradBody.addColorStop(0, highlightColor);
   gradBody.addColorStop(0.5, mainColor);
   gradBody.addColorStop(1, shadowColor);
   
   ctx.fillStyle = gradBody;
   ctx.beginPath();
   ctx.moveTo(x, y - size * 2.5); 
   ctx.bezierCurveTo(x + size*1.5, y - size*1.5, x + size*1.2, y, x, y);
   ctx.bezierCurveTo(x - size*1.2, y, x - size*1.5, y - size*1.5, x, y - size * 2.5);
   ctx.fill();

   const gradHead = ctx.createRadialGradient(x - size*0.3, y - size*2.8, size*0.1, x, y - size*2.5, size*1.2);
   gradHead.addColorStop(0, '#ffffff'); 
   gradHead.addColorStop(0.2, highlightColor);
   gradHead.addColorStop(0.8, mainColor);
   gradHead.addColorStop(1, shadowColor);

   ctx.fillStyle = gradHead;
   ctx.beginPath();
   ctx.arc(x, y - size * 2.5, size * 1.1, 0, Math.PI * 2);
   ctx.fill();

   ctx.fillStyle = mainColor;
   ctx.beginPath();
   ctx.ellipse(x - size*1.1, y - size*1.2, size*0.8, size*0.4, Math.PI/6, 0, Math.PI*2);
   ctx.ellipse(x + size*1.1, y - size*1.2, size*0.8, size*0.4, -Math.PI/6, 0, Math.PI*2);
   ctx.fill();
}

function drawYellowGiant(ctx, x, y, size, hp, maxHp) {
   const hpPercent = Math.max(0, hp / maxHp);
   ctx.fillStyle = 'rgba(0,0,0,0.2)';
   ctx.beginPath(); ctx.ellipse(x, y + 2, size * 1.5, size * 0.6, 0, 0, Math.PI * 2); ctx.fill();

   const cMain = '#ffcc00';
   const cDark = '#d4aa00';
   const cLight = '#ffe166';

   ctx.fillStyle = cDark;
   ctx.beginPath();
   ctx.ellipse(x - size*0.4, y, size*0.3, size*0.4, 0, 0, Math.PI*2);
   ctx.ellipse(x + size*0.4, y, size*0.3, size*0.4, 0, 0, Math.PI*2);
   ctx.fill();

   const gradArm = ctx.createRadialGradient(x - size*1.2, y - size*1.5, size*0.3, x - size*1.2, y - size*1.5, size);
   gradArm.addColorStop(0, cLight);
   gradArm.addColorStop(1, cDark);

   ctx.fillStyle = gradArm;
   ctx.beginPath(); ctx.ellipse(x - size*1.2, y - size*1.2, size*0.8, size*1.5, -Math.PI/10, 0, Math.PI*2); ctx.fill();
   ctx.beginPath(); ctx.ellipse(x + size*1.2, y - size*1.2, size*0.8, size*1.5, Math.PI/10, 0, Math.PI*2); ctx.fill();

   ctx.fillStyle = '#ff3b30';
   ctx.fillRect(x - size*2.0, y - size*0.6, size*1.2, size*0.5); 
   ctx.fillRect(x + size*0.8, y - size*0.6, size*1.2, size*0.5); 

   const gradBody = ctx.createLinearGradient(x - size, y - size*2, x + size, y);
   gradBody.addColorStop(0, cLight);
   gradBody.addColorStop(0.5, cMain);
   gradBody.addColorStop(1, cDark);

   ctx.fillStyle = gradBody;
   ctx.beginPath();
   ctx.moveTo(x, y - size * 3);
   ctx.bezierCurveTo(x + size*1.8, y - size*2, x + size*1.5, y, x, y);
   ctx.bezierCurveTo(x - size*1.5, y, x - size*1.8, y - size*2, x, y - size * 3);
   ctx.fill();

   const gradHead = ctx.createRadialGradient(x - size*0.2, y - size*3.2, size*0.2, x, y - size*3, size*1.2);
   gradHead.addColorStop(0, '#ffffff');
   gradHead.addColorStop(0.3, cLight);
   gradHead.addColorStop(1, cDark);

   ctx.fillStyle = gradHead;
   ctx.beginPath();
   ctx.arc(x, y - size * 3.2, size * 1.0, 0, Math.PI * 2);
   ctx.fill();

   ctx.fillStyle = '#ff3b30';
   ctx.beginPath();
   ctx.moveTo(x, y - size*4.5);
   ctx.lineTo(x + size*0.8, y - size*3.6);
   ctx.lineTo(x - size*0.8, y - size*3.6);
   ctx.fill();
   
   // Health bar
   const hY = y - size*4.8;
   ctx.fillStyle = '#333';
   ctx.fillRect(x - 25, hY, 50, 8);
   ctx.fillStyle = '#ff3b30';
   ctx.fillRect(x - 25, hY, 50 * hpPercent, 8);
   ctx.strokeStyle = '#fff';
   ctx.lineWidth = 1;
   ctx.strokeRect(x - 25, hY, 50, 8);
   
   ctx.fillStyle = '#000';
   ctx.font = 'bold 16px Inter';
   ctx.textAlign = 'center';
   ctx.textBaseline = 'bottom';
   ctx.fillText(Math.ceil(hp), x, hY - 3);
   ctx.fillStyle = '#fff';
   ctx.fillText(Math.ceil(hp), x, hY - 4);
}

function drawPlayerCannonCart(ctx, x, y) {
    ctx.fillStyle = '#2c3e50';
    const wx = 15, wy = 8, wr = 6;
    ctx.beginPath(); ctx.ellipse(x - wx, y - wy, wr, wr*1.5, Math.PI/2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + wx, y - wy, wr, wr*1.5, Math.PI/2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - wx, y + wy, wr, wr*1.5, Math.PI/2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + wx, y + wy, wr, wr*1.5, Math.PI/2, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#6e3c3c';
    if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(x - 12, y - 12, 24, 24, 4); ctx.fill();
    } else {
        ctx.fillRect(x - 12, y - 12, 24, 24);
    }
    
    // Base joint
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath(); ctx.ellipse(x, y, 10, 10, 0, 0, Math.PI*2); ctx.fill();

    const bGrad = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
    bGrad.addColorStop(0, '#1a5276');
    bGrad.addColorStop(0.5, '#5dade2');
    bGrad.addColorStop(1, '#2471a3');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(x, y + 5, 12, 0, Math.PI, false); 
    ctx.lineTo(x - 12, y - 30);
    ctx.arc(x, y - 30, 12, Math.PI, 0, false); 
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y - 4, 12, 3, 0, Math.PI, 0, true); ctx.stroke();
    
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(x, y - 30, 6, 3, 0, 0, Math.PI*2); ctx.fill();
}

function getCannonClusterPositions(cx, cy, firePower) {
    let carts = [];
    if (firePower === 1) carts = [[0, 0]];
    else if (firePower === 2) carts = [[-18, 0], [18, 0]];
    else if (firePower === 3) carts = [[0, -22], [-18, 15], [18, 15]];
    else if (firePower === 4) carts = [[-18, -25], [18, -25], [-18, 15], [18, 15]];
    else carts = [[0, -40], [-20, -10], [20, -10], [-20, 20], [20, 20], [0, 20]];
    return carts.map(p => [cx + p[0], cy + p[1]]);
}

function drawHeavyWeapon(ctx, cx, cy, num, scale = 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 20, 70*scale, 25*scale, 0, 0, Math.PI*2); ctx.fill();

    const boxW = 100*scale, boxH = 50*scale, depth = 40*scale;
    const bx = cx - boxW/2;
    const by = cy - boxH/2;

    ctx.fillStyle = '#fceabb'; 
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + depth, by - depth);
    ctx.lineTo(bx + boxW + depth, by - depth);
    ctx.lineTo(bx + boxW, by);
    ctx.fill();

    const gradFront = ctx.createLinearGradient(bx, by, bx, by + boxH);
    gradFront.addColorStop(0, '#f1c40f');
    gradFront.addColorStop(1, '#d4ac0d');
    ctx.fillStyle = gradFront;
    ctx.fillRect(bx, by, boxW, boxH);

    ctx.fillStyle = '#b7950b';
    ctx.beginPath();
    ctx.moveTo(bx + boxW, by);
    ctx.lineTo(bx + boxW + depth, by - depth);
    ctx.lineTo(bx + boxW + depth, by - depth + boxH);
    ctx.lineTo(bx + boxW, by + boxH);
    ctx.fill();

    const badgeW = 70*scale;
    const badgeH = 34*scale;
    const badgeX = cx - badgeW/2;
    const badgeY = by + (boxH - badgeH)/2;
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3*scale;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6*scale);
    else ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = `900 ${24*scale}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${num}`, cx, badgeY + badgeH/2 + 2*scale);

    const trackY = by - 12*scale;
    const trackW = 90*scale;
    
    ctx.fillStyle = '#555555'; 
    if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(cx - trackW/2, trackY, trackW, 16*scale, 4*scale); ctx.fill();
    } else {
        ctx.fillRect(cx - trackW/2, trackY, trackW, 16*scale);
    }
    
    ctx.fillStyle = '#111';
    for (let w = 0; w < 5; w++) {
        ctx.beginPath(); ctx.ellipse((cx - trackW/2 + 10*scale) + w * 17.5*scale, trackY + 8*scale, 4*scale, 4*scale, 0, 0, Math.PI*2); ctx.fill();
    }

    ctx.fillStyle = '#95a5a6';
    ctx.beginPath(); 
    ctx.moveTo(cx - trackW/2 + 2*scale, trackY); 
    ctx.lineTo(cx - trackW/2 + 18*scale, trackY - 14*scale); 
    ctx.lineTo(cx + trackW/2 + 18*scale, trackY - 14*scale); 
    ctx.lineTo(cx + trackW/2 - 2*scale, trackY); 
    ctx.fill();

    ctx.fillStyle = '#2471a3'; 
    ctx.beginPath(); ctx.ellipse(cx + 8*scale, trackY - 8*scale, 32*scale, 14*scale, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3498db'; 
    ctx.beginPath(); ctx.ellipse(cx + 8*scale, trackY - 12*scale, 32*scale, 14*scale, 0, 0, Math.PI*2); ctx.fill();

    let barrelSpread = 22*scale;
    let visualBarrels = 2; // Always 2 for heavy weapon drop
    let startX = cx + 8*scale - ((visualBarrels - 1) * barrelSpread) / 2;
    
    for (let i = 0; i < visualBarrels; i++) {
        let barX = startX + i * barrelSpread;
        
        const barGrad = ctx.createLinearGradient(barX - 9*scale, 0, barX + 9*scale, 0);
        barGrad.addColorStop(0, '#7f8c8d');
        barGrad.addColorStop(0.5, '#ecf0f1');
        barGrad.addColorStop(1, '#95a5a6');
        
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.arc(barX, trackY - 10*scale, 10*scale, 0, Math.PI, true); 
        ctx.lineTo(barX - 10*scale, trackY - 45*scale);
        ctx.arc(barX, trackY - 45*scale, 10*scale, Math.PI, 0); 
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.ellipse(barX, trackY - 45*scale, 6*scale, 3*scale, 0, 0, Math.PI*2); ctx.fill();
    }
}

function App() {
  const canvasRef = useRef(null);
  const [coins, setCoins] = useState(0);
  const [firePower, setFirePower] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [mobSizeUI, setMobSizeUI] = useState(0); 

  const gameState = useRef({
    cannonX: 200,
    blueMobs: [],
    redMobs: [],
    giants: [],
    gates: [],
    heavyWeapons: [],
    lastFireTime: 0,
    lastEnemySpawn: 0,
    lastGateSpawn: 0,
    lastHeavySpawn: 0,
    width: 0,
    height: 0,
    rAF: null,
    levelKills: 0
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
    
    gameState.current = {
      ...gameState.current,
      blueMobs: [],
      redMobs: [],
      giants: [],
      gates: [],
      heavyWeapons: [],
      lastEnemySpawn: 0,
      lastGateSpawn: 0,
      lastHeavySpawn: 0,
      cannonX: window.innerWidth / 2,
      levelKills: 0
    };
    setMobSizeUI(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      gameState.current.width = canvas.width;
      gameState.current.height = canvas.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (timestamp) => {
        updatePhysics(timestamp);
        render(ctx, timestamp);
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

  const updatePhysics = (timestamp) => {
    const state = gameState.current;
    const { width, height } = state;
    if (width === 0) return;

    let ENEMY_SPEED = 1.0 + (level * 0.2); 
    const MOB_SPEED = 4.0 + (firePower * 0.15); 

    if (state.levelKills >= 100) {
        state.levelKills = 0;
        setLevel(l => l + 1);
    }

    // Cannon Firing
    const currentFireRate = Math.max(60, 200 - (firePower * 20));
    if (timestamp - state.lastFireTime > currentFireRate) {
        let positions = getCannonClusterPositions(state.cannonX, height - 100, firePower);
        
        positions.forEach(pos => {
            state.blueMobs.push({
                x: pos[0] + (Math.random() * 6 - 3),
                y: pos[1] - 30,
                vx: (Math.random() - 0.5) * 1.5, 
                vy: -MOB_SPEED,
                processedBy: new Set() 
            });
        });
        state.lastFireTime = timestamp;
    }

    // Mob Movement
    for (let i = state.blueMobs.length - 1; i >= 0; i--) {
        let b = state.blueMobs[i];
        b.x += b.vx;
        b.y += b.vy;
        
        if (b.x < 10 || b.x > width - 10) {
            b.vx *= -1;
            b.x = Math.max(10, Math.min(width - 10, b.x));
        }
        
        if (b.y < -50) {
            state.blueMobs.splice(i, 1);
        }
    }

    // Heavy Weapon Spawn
    if (timestamp - state.lastHeavySpawn > 18000) { // Every 18s drop a heavy weapon
        state.heavyWeapons.push({
            id: Date.now(),
            x: width * 0.2 + Math.random() * width * 0.6,
            y: -100,
            hp: 47, // The canonical number from the screenshot
            maxHp: 47,
            vy: ENEMY_SPEED * 0.5
        });
        state.lastHeavySpawn = timestamp;
    }

    // Heavy Weapon Movement
    for (let i = state.heavyWeapons.length - 1; i >= 0; i--) {
        let hw = state.heavyWeapons[i];
        hw.y += hw.vy;
        if (hw.y > height) state.heavyWeapons.splice(i, 1);
    }

    // Enemy Movement
    ["redMobs", "giants"].forEach(type => {
        for (let i = state[type].length - 1; i >= 0; i--) {
            let e = state[type][i];
            e.x += e.vx || 0;
            e.y += e.vy || ENEMY_SPEED;
            
            let eRad = type === 'giants' ? GIANT_RADIUS : MOB_RADIUS;
            if (e.x < eRad || e.x > width - eRad) {
                if (e.vx) e.vx *= -1;
            }
            if (e.y > height - 100) {
                setIsGameOver(true);
            }
        }
    });

    // Enemy Spawning
    if (timestamp - state.lastEnemySpawn > Math.max(500, 2500 - (level * 300))) {
        if (Math.random() > 0.7) {
            let hp = 100 + level * 50; 
            state.giants.push({
                x: width * 0.2 + Math.random() * width * 0.6,
                y: -50,
                hp: hp,
                maxHp: hp,
                vy: ENEMY_SPEED * 0.5,
                vx: (Math.random() - 0.5) * 1.0
            });
        } else {
            const count = 10 + Math.floor(Math.random() * 8 * level);
            const cx = width * 0.1 + Math.random() * width * 0.8;
            for(let i=0; i<count; i++) {
                state.redMobs.push({
                    x: cx + (Math.random() * 80 - 40),
                    y: -50 - Math.random() * 50,
                    vy: ENEMY_SPEED,
                    vx: (Math.random() - 0.5) * 0.5
                });
            }
        }
        state.lastEnemySpawn = timestamp;
    }

    // Gate Spawning & Movement
    if (timestamp - state.lastGateSpawn > 3500) {
        state.gates.push({
            id: Date.now(),
            y: -100,
            x: width/2, 
            speed: (Math.random() > 0.5 ? 1 : -1) * (1 + level * 0.1),
            type: Math.random() > 0.3 ? 'add' : (Math.random() > 0.5 ? 'mult' : 'sub'),
            val: 0,
            w: 120 + Math.random() * 60,
            h: 45
        });
        
        let g = state.gates[state.gates.length - 1];
        if (g.type === 'add') g.val = 10 + Math.floor(Math.random() * 30);
        else if (g.type === 'mult') g.val = 2 + Math.floor(Math.random() * 2);
        else if (g.type === 'sub') g.val = 10 + Math.floor(Math.random() * 20);
        
        state.lastGateSpawn = timestamp;
    }

    for (let i = state.gates.length - 1; i >= 0; i--) {
        let g = state.gates[i];
        g.y += ENEMY_SPEED * 0.7; 
        g.x += g.speed;
        
        if (g.x < g.w/2 || g.x > width - g.w/2) g.speed *= -1;
        if (g.y > height) state.gates.splice(i, 1);
    }

    // Mob hitting Heavy Weapons (Power up drop)
    for(let bIdx = state.blueMobs.length - 1; bIdx >= 0; bIdx--) {
        let b = state.blueMobs[bIdx];
        let collided = false;
        for (let hIdx = state.heavyWeapons.length - 1; hIdx >= 0; hIdx--) {
            let hw = state.heavyWeapons[hIdx];
            if (b.x > hw.x - 45 && b.x < hw.x + 45 && b.y > hw.y - 30 && b.y < hw.y + 30) {
                hw.hp -= 1;
                collided = true;
                if (hw.hp <= 0) {
                     state.heavyWeapons.splice(hIdx, 1);
                     setFirePower(p => p + 1); // Cannon gets direct power upgrade!
                     setCoins(c => c + 100);
                }
                break;
            }
        }
        if (collided) state.blueMobs.splice(bIdx, 1);
    }

    // Mob hitting Gates
    let newMobsToSpawn = [];
    state.blueMobs.forEach(b => {
        state.gates.forEach(g => {
            if (!b.processedBy.has(g.id)) {
                let gx = g.x - g.w/2;
                let gy = g.y - g.h/2;
                if (b.x > gx && b.x < gx + g.w && b.y > gy && b.y < gy + g.h) {
                     b.processedBy.add(g.id);
                     if (g.type === 'add') {
                         for(let c=0; c<g.val; c++) {
                             if (state.blueMobs.length + newMobsToSpawn.length > 800) break;
                             newMobsToSpawn.push({
                                 x: b.x + (Math.random()*40-20),
                                 y: gy - 10 - Math.random()*20,
                                 vx: (Math.random() - 0.5) * 2,
                                 vy: -MOB_SPEED,
                                 processedBy: new Set([g.id]) 
                             });
                         }
                     } else if (g.type === 'mult') {
                         let toCreate = g.val - 1; 
                         for(let c=0; c<toCreate; c++) {
                             if (state.blueMobs.length + newMobsToSpawn.length > 800) break;
                             newMobsToSpawn.push({
                                 x: b.x + (Math.random()*40-20),
                                 y: gy - 10 - Math.random()*20,
                                 vx: (Math.random() - 0.5) * 2,
                                 vy: -MOB_SPEED,
                                 processedBy: new Set([g.id]) 
                             });
                         }
                     }
                }
            }
        });
    });
    
    for(let i = state.blueMobs.length - 1; i >= 0; i--) {
        let b = state.blueMobs[i];
        state.gates.forEach(g => {
             if (g.type === 'sub' && !b.processedBy.has(g.id)) {
                 let gx = g.x - g.w/2;
                 let gy = g.y - g.h/2;
                 if (b.x > gx && b.x < gx + g.w && b.y > gy && b.y < gy + g.h) {
                      b.processedBy.add(g.id);
                      if (g.val > 0) {
                          g.val--;
                          state.blueMobs.splice(i, 1);
                      }
                 }
             }
        });
    }

    if (newMobsToSpawn.length > 0) {
        state.blueMobs.push(...newMobsToSpawn);
    }

    // Combat
    for(let bIdx = state.blueMobs.length - 1; bIdx >= 0; bIdx--) {
        let b = state.blueMobs[bIdx];
        let collided = false;
        
        for(let rIdx = state.redMobs.length - 1; rIdx >= 0; rIdx--) {
            let r = state.redMobs[rIdx];
            let dx = b.x - r.x;
            let dy = b.y - r.y;
            if (dx*dx+dy*dy < (MOB_RADIUS*2)*(MOB_RADIUS*2)) {
                state.redMobs.splice(rIdx, 1);
                state.levelKills++;
                setCoins(prev => prev + 1);
                collided = true;
                break;
            }
        }
        
        if (collided) {
            state.blueMobs.splice(bIdx, 1);
            continue;
        }

        for(let gIdx = state.giants.length - 1; gIdx >= 0; gIdx--) {
            let giant = state.giants[gIdx];
            let dx = b.x - giant.x;
            let dy = b.y - giant.y;
            if (dx*dx+dy*dy < (MOB_RADIUS + GIANT_RADIUS)*(MOB_RADIUS + GIANT_RADIUS)) {
                giant.hp -= 1;
                collided = true;
                if (giant.hp <= 0) {
                    state.giants.splice(gIdx, 1);
                    state.levelKills += 10;
                    setCoins(prev => prev + 25);
                }
                break;
            }
        }
        if (collided) state.blueMobs.splice(bIdx, 1);
    }

    if (mobSizeUI !== state.blueMobs.length) setMobSizeUI(state.blueMobs.length);
  };

  const render = (ctx, timestamp) => {
    const state = gameState.current;
    const { width, height } = state;
    
    ctx.fillStyle = '#b7d4ef';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ebf5fc';
    ctx.beginPath();
    ctx.moveTo(width * 0.1, 0); 
    ctx.lineTo(width * 0.1, height);
    ctx.lineTo(width * 0.9, height);
    ctx.lineTo(width * 0.9, 0);
    ctx.fill();

    ctx.strokeStyle = '#d7e8f7';
    ctx.lineWidth = 2;
    for(let i=0; i<height; i+=50) {
        let offsetY = (i + (timestamp*0.1)) % height;
        ctx.beginPath();
        ctx.moveTo(width*0.1, offsetY);
        ctx.lineTo(width*0.9, offsetY);
        ctx.stroke();
    }

    // Draw Gates
    state.gates.forEach(g => {
        let gx = g.x - g.w/2;
        let gy = g.y - g.h/2;
        
        ctx.fillStyle = g.type === 'sub' ? 'rgba(50, 0, 0, 0.7)' : 'rgba(0, 30, 60, 0.7)';
        ctx.strokeStyle = g.type === 'sub' ? '#ff4757' : '#00d2ff';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx, gy, g.w, g.h, 6);
        else ctx.fillRect(gx, gy, g.w, g.h);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(gx + 2, gy + 2, g.w - 4, 6);

        let sign = g.type === 'add' ? '+' : (g.type === 'mult' ? 'x' : '-');
        ctx.fillStyle = '#000';
        ctx.font = '900 28px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.strokeText(`${sign}${g.val}`, g.x, g.y+2); 
        ctx.fillText(`${sign}${g.val}`, g.x, g.y+4); 
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`${sign}${g.val}`, g.x, g.y);
    });

    state.heavyWeapons.forEach(hw => drawHeavyWeapon(ctx, hw.x, hw.y, Math.ceil(hw.hp)));
    state.blueMobs.forEach(b => drawLittleMan(ctx, b.x, b.y, MOB_RADIUS, false));
    state.redMobs.forEach(r => drawLittleMan(ctx, r.x, r.y, MOB_RADIUS, true));
    state.giants.forEach(g => drawYellowGiant(ctx, g.x, g.y, GIANT_RADIUS, g.hp, g.maxHp));
    
    // Draw Player Cluster
    let positions = getCannonClusterPositions(state.cannonX, height - 100, firePower);
    positions.forEach(pos => drawPlayerCannonCart(ctx, pos[0], pos[1]));
  };

  const updateFirePos = (e) => {
    let clientX = e.clientX;
    if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;
    const rect = canvasRef.current.getBoundingClientRect();
    let pointerX = clientX - rect.left;
    gameState.current.cannonX = Math.max(80, Math.min(gameState.current.width - 80, pointerX));
  };

  return (
    <div className="game-container" onPointerDown={updateFirePos} onPointerMove={updateFirePos} style={{ overflow: 'hidden', touchAction: 'none' }}>
      
      <div className="hud">
        <div className="hud-pill blue">
          <div className="hud-icon">🧊</div>
          {mobSizeUI}
        </div>
        <div className="hud-pill yellow">
          <div className="hud-icon">🪙</div>
          {coins}
        </div>
      </div>

      <div className="game-world">
        <canvas id="game-canvas" ref={canvasRef}></canvas>
      </div>

      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform:'translateX(-50%)', zIndex: 100, width: '90%', maxWidth: '350px' }}>
        <button 
          onClick={handleUpgrade}
          style={{
            backgroundColor: coins >= upgradeCost ? '#2cb6fe' : '#bdc3c7',
            border: '4px solid #000',
            borderRadius: '16px',
            padding: '12px',
            color: coins >= upgradeCost ? '#fff' : '#000',
            fontWeight: '900', 
            fontSize: '18px',
            width: '100%',
            fontFamily: 'Inter',
            boxShadow: '0 6px 0 #000',
            cursor: coins >= upgradeCost ? 'pointer' : 'not-allowed',
          }}
        >
          UPGRADE CANNON (Lvl {firePower})<br/>
          💰 {upgradeCost}
        </button>
      </div>

      {isGameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
        }}>
          <h1 style={{ color: '#ff4757', textShadow: '4px 4px 0 #000', fontSize: '64px', margin: 0 }}>DEFEAT</h1>
          <p style={{ color: '#fff', fontSize: '24px', margin: '20px 0' }}>The Enemy Reached Your Base!</p>
          <button onClick={handleRestart} style={{ backgroundColor: '#ffcc00', border: '4px solid #000', padding: '15px 40px', fontSize: '28px', fontWeight: '900', borderRadius: '40px', boxShadow: '0 6px 0 #000', cursor: 'pointer' }}>
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
