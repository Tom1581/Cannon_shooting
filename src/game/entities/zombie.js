// kind: 'walker' | 'runner' | 'spitter' | 'crawler'
const KINDS = new Set(['walker', 'runner', 'spitter', 'crawler']);
const SIZE = { walker: 12, runner: 10, spitter: 13, crawler: 9 };
const HP_BASE = { walker: 1,  runner: 1, spitter: 2, crawler: 1 };
// Bullets fire at ~4px/frame; cap zombie speed so they stay catchable.
const SPEED_CAP = { walker: 3.0, runner: 4.4, spitter: 2.6, crawler: 3.5 };
const VY_BASE = { walker: 0.85, runner: 1.50, spitter: 0.65, crawler: 1.30 };
const VY_PER_LEVEL = { walker: 0.18, runner: 0.24, spitter: 0.14, crawler: 0.22 };
// +1 HP per N waves so high-level walkers actually take 2-3 shots.
const HP_GROW = { walker: 12, runner: 15, spitter: 10, crawler: 14 };
// Walking cadence in radians/ms. Runners step ~2× faster.
const STEP_SPEED = { walker: 0.0055, runner: 0.0115, spitter: 0.0042, crawler: 0.013 };

export function zombieHpFor(kind, wave) {
  const k = KINDS.has(kind) ? kind : 'walker';
  return HP_BASE[k] + Math.floor(wave / HP_GROW[k]);
}

export function zombieSpeedFor(kind, wave) {
  const k = KINDS.has(kind) ? kind : 'walker';
  return Math.min(SPEED_CAP[k], VY_BASE[k] + wave * VY_PER_LEVEL[k]);
}

export function makeZombie(kind, x, y, wave) {
  const k = KINDS.has(kind) ? kind : 'walker';
  return {
    kind: k,
    x,
    y,
    hp: zombieHpFor(k, wave),
    r: SIZE[k],
    vx: (Math.random() - 0.5) * (k === 'runner' ? 0.55 : 0.30),
    vy: zombieSpeedFor(k, wave),
    // Visual jitter so each zombie looks unique
    legPhase: Math.random() * Math.PI * 2,
    headTwitchT: Math.random() * 2000,
    bloodSeed: Math.random(),
    eyeSkew: (Math.random() - 0.5) * 0.6,
    armDroop: Math.random() * 0.4,
    spitCd: k === 'spitter' ? (1800 + Math.random() * 1500) : 0,
  };
}

// ---- Variant palettes -------------------------------------------------------
const PALETTE = {
  walker: {
    skin:      '#6a7d4a',
    skinDark:  '#2d3818',
    skinLight: '#9bb079',
    shirt:     '#3a3024',
    shirtDark: '#1a1410',
    pants:     '#2d2a26',
    pantsDark: '#14120f',
    eyeGlow:   '#9bbf3a',
    bone:      '#dcd0a8',
    bruise:    '#3a2030',
  },
  runner: {
    skin:      '#967a4a',
    skinDark:  '#4a3818',
    skinLight: '#c8a868',
    shirt:     '#7a1c14',
    shirtDark: '#3e0c08',
    pants:     '#221a12',
    pantsDark: '#100a06',
    eyeGlow:   '#ff8a30',
    bone:      '#dcd0a8',
    bruise:    '#5a1410',
  },
  spitter: {
    skin:      '#5a8a4a',
    skinDark:  '#2a4220',
    skinLight: '#9bc878',
    shirt:     '#2c3a1e',
    shirtDark: '#141a0c',
    pants:     '#202612',
    pantsDark: '#0e1208',
    eyeGlow:   '#d4ff4a',
    bone:      '#dcd0a8',
    bruise:    '#1a3320',
  },
  crawler: {
    skin:      '#4a3a2a',     // charred, low-to-the-ground
    skinDark:  '#1c1410',
    skinLight: '#6e5640',
    shirt:     '#1a140e',
    shirtDark: '#0a0604',
    pants:     '#1a140e',
    pantsDark: '#0a0604',
    eyeGlow:   '#ff5a3a',
    bone:      '#c8b890',
    bruise:    '#4a1410',
  },
};

// Walking cycle helpers ------------------------------------------------------
// Returns 0..1 — how much the foot is "lifted" off ground (only the positive
// half of a sine wave produces lift; flat half = foot planted).
function legLift(phase) {
  return Math.max(0, Math.sin(phase));
}
// Returns ~-1..0 — body drop when a foot plants (negative = body sinks).
function plantBob(phaseL, phaseR) {
  // Body sinks when EITHER foot just planted (transition from sin>0 to sin<=0).
  // Use the most-recently-planted foot's downward motion as a quick dip.
  return Math.min(0, Math.min(Math.sin(phaseL), Math.sin(phaseR)) * 1.2);
}

// Draw a single leg with knee + foot lift based on lift amount (0..1).
function drawLeg(ctx, hipX, hipY, lift, side, length, pal, tatteredSkin) {
  // Foot position: when lifted, foot raises AND tilts slightly forward (down-screen)
  const liftPx = lift * length * 0.35;
  const fwdPx = lift * length * 0.22;
  // Foot end (toes)
  const fx = hipX + side * length * 0.05;
  const fy = hipY + length - liftPx + fwdPx * 0.0;
  // Knee position: bent more when lifted
  const kneeAng = Math.PI / 2 + lift * 0.65 * side * -1;
  const kx = hipX + Math.cos(kneeAng) * length * 0.48 * (side * -1);
  const ky = hipY + Math.sin(kneeAng) * length * 0.48;

  // Upper leg (pants, dark)
  ctx.strokeStyle = pal.pantsDark;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  // Pants highlight
  ctx.strokeStyle = pal.pants;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kx, ky);
  ctx.stroke();

  // Lower leg
  if (tatteredSkin) {
    // Exposed bony shin
    ctx.strokeStyle = pal.skinDark;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.strokeStyle = pal.skin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    // Bone highlight stripe
    ctx.strokeStyle = pal.bone;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(kx + side * 0.5, ky + 1);
    ctx.lineTo(fx + side * 0.5, fy - 3);
    ctx.stroke();
  } else {
    ctx.strokeStyle = pal.pantsDark;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
  }

  // Foot — dark elongated stub, slightly bigger when planted
  ctx.fillStyle = '#0a0805';
  const fw = lift > 0.3 ? 4.5 : 6;
  const fh = lift > 0.3 ? 2.5 : 3.5;
  ctx.beginPath();
  ctx.ellipse(fx, fy + 1, fw, fh, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw an outstretched zombie arm with a per-zombie droop.
function drawArm(ctx, shoulderX, shoulderY, length, swing, pal, side, droop) {
  // Elbow points forward-and-out; hand reaches further forward (down-screen).
  const elbowAng = Math.PI * 0.55 + side * 0.25 + swing * 0.18 + droop * 0.3;
  const ex = shoulderX + Math.cos(elbowAng) * length * 0.55 * (side * -1);
  const ey = shoulderY + Math.sin(elbowAng) * length * 0.55 + droop * length * 0.15;
  const handAng = elbowAng + side * 0.32 + swing * 0.28 + droop * 0.25;
  const hx = ex + Math.cos(handAng) * length * 0.55 * (side * -1);
  const hy = ey + Math.sin(handAng) * length * 0.55;

  // Upper arm (skin dark)
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = pal.skin;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Forearm
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.strokeStyle = pal.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(hx, hy);
  ctx.stroke();

  // Bone showing through forearm (tiny accent)
  ctx.strokeStyle = pal.bone;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(ex + side * 1, ey + 1);
  ctx.lineTo(ex + side * 2, ey + 4);
  ctx.stroke();

  // Hand — small palm + three jagged claw fingers
  ctx.fillStyle = pal.skinDark;
  ctx.beginPath();
  ctx.arc(hx, hy, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.skin;
  ctx.beginPath();
  ctx.arc(hx - 0.6 * side, hy - 0.6, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const cAng = handAng + i * 0.55;
    const cx = hx + Math.cos(cAng) * 6 * (side * -1);
    const cy = hy + Math.sin(cAng) * 6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    // Black fingernail tip
    ctx.fillStyle = '#0a0805';
    ctx.beginPath();
    ctx.arc(cx, cy, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pal.skinDark;
  }
}

// Sprinkle a couple of small dark blood specks for menace (PG: dark-red dots).
function drawWounds(ctx, x, y, size, pal, seed) {
  ctx.fillStyle = pal.bruise;
  const positions = [
    [-size * 0.35, -size * 0.05, 1.6 + seed * 1.2],
    [ size * 0.25,  size * 0.15, 1.2 + (1 - seed) * 1.0],
    [-size * 0.05,  size * 0.4,  1.0 + seed * 0.8],
  ];
  for (const [dx, dy, r] of positions) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawZombie(ctx, z, t) {
  if (z.kind === 'crawler') { drawCrawler(ctx, z, t); return; }
  const pal = PALETTE[z.kind];
  const size = z.r;
  const x = z.x;
  const y = z.y;

  // ---------- Walking cycle ----------
  const step = STEP_SPEED[z.kind];
  const phaseL = t * step + z.legPhase;
  const phaseR = phaseL + Math.PI;
  const liftL = legLift(phaseL);
  const liftR = legLift(phaseR);
  const bodyBob = plantBob(phaseL, phaseR); // small downward dip when foot plants
  const headTwitch = Math.sin((t + z.headTwitchT) * 0.013) * 0.04 + (Math.sin((t + z.headTwitchT) * 0.031) * 0.025);
  const headTilt = Math.sin((t + z.headTwitchT) * 0.0021) * 0.06;
  const armSwingL = Math.sin(phaseL + Math.PI / 4) * 0.4;
  const armSwingR = -armSwingL;

  // ---------- Ground shadow (squashes with body bob) ----------
  const shadowFade = 0.36 + Math.abs(bodyBob) * 0.05;
  ctx.fillStyle = `rgba(0,0,0,${shadowFade})`;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.95, size * (1.5 + Math.abs(bodyBob) * 0.05), size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Apply bob to whole body (sinks slightly on plants)
  const bobY = bodyBob * 0.9;

  // ---------- Legs (drawn first, behind torso) ----------
  const hipY = y + size * 0.2 + bobY;
  const legLen = size * 1.5;
  drawLeg(ctx, x - size * 0.45, hipY, liftL, -1, legLen, pal, z.kind === 'walker');
  drawLeg(ctx, x + size * 0.45, hipY, liftR, +1, legLen, pal, false);

  // ---------- Torso ----------
  const torsoTopY = y - size * 1.45 + bobY;
  // Gaunter than before — narrow shoulders, wider waist, slumped forward.
  const torsoGrad = ctx.createLinearGradient(x - size, torsoTopY, x + size, hipY);
  torsoGrad.addColorStop(0, pal.shirt);
  torsoGrad.addColorStop(0.45, pal.shirt);
  torsoGrad.addColorStop(1, pal.shirtDark);
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.80, torsoTopY);                    // left shoulder
  ctx.bezierCurveTo(x - size * 0.95, torsoTopY + size * 0.7, x - size * 1.05, hipY - size * 0.2, x - size * 0.95, hipY);
  ctx.lineTo(x + size * 0.95, hipY);
  ctx.bezierCurveTo(x + size * 1.05, hipY - size * 0.2, x + size * 0.95, torsoTopY + size * 0.7, x + size * 0.80, torsoTopY);
  ctx.closePath();
  ctx.fill();

  // Vertical tear lines on shirt
  ctx.strokeStyle = pal.shirtDark;
  ctx.lineWidth = 1.5;
  for (const dx of [-size * 0.45, size * 0.05, size * 0.55]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, torsoTopY + size * 0.4);
    ctx.lineTo(x + dx + (Math.random() < 0.5 ? 0.4 : -0.4), hipY - size * 0.05);
    ctx.stroke();
  }
  // Big ragged tear with exposed skin patch
  ctx.fillStyle = pal.skinDark;
  ctx.beginPath();
  ctx.ellipse(x - size * 0.3, hipY - size * 0.55, size * 0.42, size * 0.34, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.skin;
  ctx.beginPath();
  ctx.ellipse(x - size * 0.3, hipY - size * 0.55, size * 0.34, size * 0.26, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Bloody/bruise specks on chest tear
  drawWounds(ctx, x - size * 0.3, hipY - size * 0.55, size * 0.5, pal, z.bloodSeed);

  // ---------- Outstretched arms ----------
  const shoulderL = [x - size * 0.85, torsoTopY + size * 0.15];
  const shoulderR = [x + size * 0.85, torsoTopY + size * 0.15];
  // Use the per-zombie droop on ONE arm so they're asymmetric
  drawArm(ctx, shoulderL[0], shoulderL[1], size * 2.0, armSwingL, pal, -1, z.armDroop);
  drawArm(ctx, shoulderR[0], shoulderR[1], size * 2.0, armSwingR, pal, +1, 0);

  // ---------- Head ----------
  // Twitchy: small horizontal + tilt jitters
  const headCX = x + headTwitch * size * 2;
  const headCY = torsoTopY - size * 0.95 + bobY * 0.6;
  const headR = size * 1.15;
  ctx.save();
  ctx.translate(headCX, headCY);
  ctx.rotate(headTilt);
  // Skull silhouette — slightly tapered at chin
  const headGrad = ctx.createRadialGradient(-headR * 0.35, -headR * 0.4, headR * 0.15, 0, 0, headR * 1.1);
  headGrad.addColorStop(0, pal.skinLight);
  headGrad.addColorStop(0.45, pal.skin);
  headGrad.addColorStop(1, pal.skinDark);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  // Egg shape: wider at top, narrower at chin
  ctx.moveTo(0, -headR * 1.05);
  ctx.bezierCurveTo(headR * 1.05, -headR * 0.95, headR * 1.05, headR * 0.55, headR * 0.55, headR * 0.95);
  ctx.bezierCurveTo(headR * 0.15, headR * 1.15, -headR * 0.15, headR * 1.15, -headR * 0.55, headR * 0.95);
  ctx.bezierCurveTo(-headR * 1.05, headR * 0.55, -headR * 1.05, -headR * 0.95, 0, -headR * 1.05);
  ctx.fill();

  // Cheekbone shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, headR * 0.3, headR * 0.85, headR * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scraggly hair tufts (walker + spitter)
  if (z.kind !== 'runner') {
    ctx.fillStyle = '#0e0a06';
    for (const [dx, dy, w, h] of [
      [-headR * 0.55, -headR * 0.85, 4, 7],
      [-headR * 0.10, -headR * 1.00, 3.5, 8],
      [ headR * 0.35, -headR * 0.92, 3.8, 7.5],
      [ headR * 0.65, -headR * 0.65, 3, 6],
    ]) {
      ctx.beginPath();
      ctx.moveTo(dx - w * 0.5, dy);
      ctx.lineTo(dx, dy - h);
      ctx.lineTo(dx + w * 0.5, dy);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Runner: balding patch + jagged mohawk strip
    ctx.fillStyle = pal.skinDark;
    ctx.beginPath();
    ctx.ellipse(0, -headR * 0.55, headR * 0.85, headR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e0a06';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * headR * 0.18 - 1, -headR * 0.85);
      ctx.lineTo(i * headR * 0.18,     -headR * 1.05);
      ctx.lineTo(i * headR * 0.18 + 1, -headR * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Eye sockets — ASYMMETRIC. One slightly higher / smaller for that broken look.
  const skew = z.eyeSkew;
  const eyeOffX = headR * 0.42;
  const eyeY = -headR * 0.10;
  // Left socket
  ctx.fillStyle = '#080805';
  ctx.beginPath();
  ctx.ellipse(-eyeOffX, eyeY - skew * 0.05, headR * 0.30, headR * 0.36 * (1 + skew * 0.15), -0.18, 0, Math.PI * 2);
  ctx.fill();
  // Right socket
  ctx.beginPath();
  ctx.ellipse( eyeOffX, eyeY + skew * 0.05, headR * 0.28, headR * 0.34 * (1 - skew * 0.15),  0.18, 0, Math.PI * 2);
  ctx.fill();

  // Glowing pupils — one brighter than the other
  const lBright = 0.7 + skew * 0.3;
  const rBright = 0.7 - skew * 0.3;
  ctx.fillStyle = pal.eyeGlow;
  ctx.globalAlpha = lBright;
  ctx.beginPath();
  ctx.arc(-eyeOffX + 0.6, eyeY + 1, headR * 0.10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = rBright;
  ctx.beginPath();
  ctx.arc( eyeOffX - 0.6, eyeY + 1, headR * 0.10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Outer glow halo behind eyes
  const glowGrad = ctx.createRadialGradient(0, eyeY, 0, 0, eyeY, headR * 0.85);
  glowGrad.addColorStop(0, `${pal.eyeGlow}66`);
  glowGrad.addColorStop(1, `${pal.eyeGlow}00`);
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.ellipse(0, eyeY, headR * 0.85, headR * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dripping wound at temple — small dark trickle
  ctx.fillStyle = pal.bruise;
  ctx.beginPath();
  ctx.ellipse(-headR * 0.7, -headR * 0.2, headR * 0.13, headR * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-headR * 0.7, -headR * 0.05);
  ctx.lineTo(-headR * 0.68, headR * 0.15);
  ctx.lineTo(-headR * 0.72, headR * 0.05);
  ctx.closePath();
  ctx.fill();

  // Drooping cracked mouth — gaping jaw
  const mouthY = headR * 0.55;
  // Jaw cavity
  ctx.fillStyle = '#060604';
  ctx.beginPath();
  ctx.ellipse(headR * 0.05, mouthY, headR * 0.48, headR * 0.28, -0.06, 0, Math.PI * 2);
  ctx.fill();
  // Crooked teeth - upper row
  ctx.fillStyle = pal.bone;
  for (let i = -1; i <= 1; i++) {
    const tx = headR * 0.05 + i * headR * 0.22;
    ctx.beginPath();
    ctx.moveTo(tx - 1.4, mouthY - headR * 0.20);
    ctx.lineTo(tx + 1.4, mouthY - headR * 0.20);
    ctx.lineTo(tx,       mouthY - headR * 0.05);
    ctx.closePath();
    ctx.fill();
  }
  // Lower jutting fang (asymmetric)
  ctx.beginPath();
  ctx.moveTo(headR * 0.18, mouthY + headR * 0.25);
  ctx.lineTo(headR * 0.30, mouthY + headR * 0.25);
  ctx.lineTo(headR * 0.24, mouthY + headR * 0.05);
  ctx.closePath();
  ctx.fill();

  // Drool drip from mouth corner
  ctx.fillStyle = pal.bruise;
  ctx.beginPath();
  ctx.ellipse(-headR * 0.25, mouthY + headR * 0.25, 1.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // end head transform

  // ---------- Variant accents ----------
  if (z.kind === 'spitter') {
    // Bigger glowing chin halo (already inside head transform space — draw in world coords)
    const dripGrad = ctx.createRadialGradient(headCX, headCY + headR * 0.95, 0, headCX, headCY + headR * 0.95, headR * 0.7);
    dripGrad.addColorStop(0, `${pal.eyeGlow}cc`);
    dripGrad.addColorStop(1, `${pal.eyeGlow}00`);
    ctx.fillStyle = dripGrad;
    ctx.beginPath();
    ctx.arc(headCX, headCY + headR * 0.95, headR * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Distended belly
    ctx.fillStyle = pal.skinDark;
    ctx.beginPath();
    ctx.ellipse(x, (torsoTopY + hipY) / 2, size * 1.05, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.ellipse(x - size * 0.2, (torsoTopY + hipY) / 2 - size * 0.1, size * 0.82, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pustules on belly
    ctx.fillStyle = pal.eyeGlow;
    ctx.globalAlpha = 0.55;
    for (const [dx, dy] of [[-size * 0.4, -0.1], [size * 0.2, 0.2], [-size * 0.1, 0.3]]) {
      ctx.beginPath();
      ctx.arc(x + dx, (torsoTopY + hipY) / 2 + dy * size, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (z.kind === 'runner') {
    // Blood-rage chest streak (PG dark)
    ctx.fillStyle = pal.bruise;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.6, torsoTopY + size * 0.4);
    ctx.lineTo(x + size * 0.7, torsoTopY + size * 0.5);
    ctx.lineTo(x + size * 0.4, torsoTopY + size * 0.7);
    ctx.lineTo(x - size * 0.5, torsoTopY + size * 0.65);
    ctx.closePath();
    ctx.fill();
  }
}

// Crawler — low to the ground, four limbs scrabbling forward. Distinct silhouette.
function drawCrawler(ctx, z, t) {
  const pal = PALETTE.crawler;
  const size = z.r;
  const x = z.x;
  const y = z.y;
  const step = STEP_SPEED.crawler;
  const phaseA = t * step + z.legPhase;
  const phaseB = phaseA + Math.PI;
  const liftA = Math.max(0, Math.sin(phaseA));
  const liftB = Math.max(0, Math.sin(phaseB));
  const headTwitch = Math.sin((t + z.headTwitchT) * 0.018) * 0.05;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.4, size * 1.9, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back legs
  const blAng = Math.PI * 0.85 + liftB * 0.4;
  const blX = x - size * 1.1 + Math.cos(blAng) * size * 0.4;
  const blY = y + size * 0.3 - liftB * size * 0.35;
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y - size * 0.1);
  ctx.lineTo(blX, blY);
  ctx.stroke();
  const brAng = Math.PI * 0.15 - liftA * 0.4;
  const brX = x + size * 1.1 + Math.cos(brAng) * size * 0.4;
  const brY = y + size * 0.3 - liftA * size * 0.35;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y - size * 0.1);
  ctx.lineTo(brX, brY);
  ctx.stroke();

  // Body — horizontal tube
  const bodyGrad = ctx.createLinearGradient(x - size, y - size * 0.3, x + size, y + size * 0.3);
  bodyGrad.addColorStop(0, pal.skinLight);
  bodyGrad.addColorStop(0.5, pal.skin);
  bodyGrad.addColorStop(1, pal.skinDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 1.25, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spine ridges
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * size * 0.3, y - size * 0.45);
    ctx.lineTo(x + i * size * 0.3, y - size * 0.25);
    ctx.stroke();
  }
  ctx.fillStyle = pal.bone;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(x + i * size * 0.45, y - size * 0.45, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front limbs reaching forward
  const flAng = Math.PI * 0.45 + liftA * 0.4;
  const flKneeX = x - size * 0.6 + Math.cos(flAng) * size * 0.6;
  const flKneeY = y + size * 0.2 + Math.sin(flAng) * size * 0.55;
  const flHandX = flKneeX - size * 0.3;
  const flHandY = flKneeY + size * 0.5 - liftA * size * 0.3;
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.6, y + size * 0.05);
  ctx.lineTo(flKneeX, flKneeY);
  ctx.lineTo(flHandX, flHandY);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(flHandX, flHandY);
    ctx.lineTo(flHandX - 2 + i * 2, flHandY + 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#0a0604';
  ctx.beginPath(); ctx.arc(flHandX, flHandY, 2.5, 0, Math.PI * 2); ctx.fill();

  const frAng = Math.PI * 0.55 + liftB * 0.4;
  const frKneeX = x + size * 0.6 + Math.cos(frAng) * size * 0.6;
  const frKneeY = y + size * 0.2 + Math.sin(frAng) * size * 0.55;
  const frHandX = frKneeX + size * 0.3;
  const frHandY = frKneeY + size * 0.5 - liftB * size * 0.3;
  ctx.strokeStyle = pal.skinDark;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.6, y + size * 0.05);
  ctx.lineTo(frKneeX, frKneeY);
  ctx.lineTo(frHandX, frHandY);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(frHandX, frHandY);
    ctx.lineTo(frHandX + 2 + i * 2, frHandY + 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#0a0604';
  ctx.beginPath(); ctx.arc(frHandX, frHandY, 2.5, 0, Math.PI * 2); ctx.fill();

  // Head — low, red-eyed
  const headCX = x + headTwitch * size;
  const headCY = y + size * 0.35;
  const headR = size * 0.75;
  const headGrad = ctx.createRadialGradient(headCX - headR * 0.3, headCY - headR * 0.3, headR * 0.1, headCX, headCY, headR * 1.1);
  headGrad.addColorStop(0, pal.skinLight);
  headGrad.addColorStop(0.5, pal.skin);
  headGrad.addColorStop(1, pal.skinDark);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(headCX, headCY, headR * 1.1, headR * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#080604';
  ctx.beginPath();
  ctx.ellipse(headCX - headR * 0.4, headCY - headR * 0.05, headR * 0.22, headR * 0.18, 0, 0, Math.PI * 2);
  ctx.ellipse(headCX + headR * 0.4, headCY - headR * 0.05, headR * 0.22, headR * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.eyeGlow;
  ctx.beginPath();
  ctx.arc(headCX - headR * 0.4, headCY - headR * 0.05, headR * 0.10, 0, Math.PI * 2);
  ctx.arc(headCX + headR * 0.4, headCY - headR * 0.05, headR * 0.10, 0, Math.PI * 2);
  ctx.fill();
  const eyeGlow = ctx.createRadialGradient(headCX, headCY, 0, headCX, headCY, headR);
  eyeGlow.addColorStop(0, `${pal.eyeGlow}55`);
  eyeGlow.addColorStop(1, `${pal.eyeGlow}00`);
  ctx.fillStyle = eyeGlow;
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
  ctx.fill();
  // Open jaw
  ctx.fillStyle = '#050402';
  ctx.beginPath();
  ctx.ellipse(headCX + headR * 0.1, headCY + headR * 0.45, headR * 0.55, headR * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.bone;
  for (const dx of [-headR * 0.3, headR * 0.05, headR * 0.35]) {
    ctx.beginPath();
    ctx.moveTo(headCX + dx - 1, headCY + headR * 0.32);
    ctx.lineTo(headCX + dx + 1, headCY + headR * 0.32);
    ctx.lineTo(headCX + dx,     headCY + headR * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}
