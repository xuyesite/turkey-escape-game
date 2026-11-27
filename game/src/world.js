// Gobble Dash — the world: obstacles, pickups, knives and collisions.
// One job: everything the turkey runs through. It spawns the run's hazards
// per stage, scrolls them, and reports what the turkey touches.
import { ESCAPE_DISTANCE_M, GROUND_Y, PX_PER_METER, STAGES, stageAt, stageIndexAt } from './config.js';

function boxOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createWorld(rng, seed) {
  return {
    rng,
    seed,
    distanceM: 0,
    worldX: 0,
    speed: STAGES[0].speed,
    nextSpawnAt: 420,
    obstacles: [],
    pickups: [],
    knives: [],
    particles: [],
    clouds: [],
    corn: 0,
    stageIndex: 0,
    banner: '',
    bannerT: 0,
    shake: 0,
    escaped: false,
    initClouds() {
      for (let i = 0; i < 7; i++) {
        this.clouds.push({ x: rng.range(0, 1280), y: rng.range(40, 220), s: rng.range(0.6, 1.4), v: rng.range(6, 18) });
      }
    },
  };
}

function spawnGroup(w, x) {
  const stage = stageAt(w.distanceM);
  const idx = stageIndexAt(w.distanceM);
  const r = w.rng;
  const roll = r.next();
  if (idx === 0) {
    if (roll < 0.45) w.obstacles.push({ kind: 'fence', x, w: 44, h: 74, y: GROUND_Y - 74 });
    else if (roll < 0.8) w.obstacles.push({ kind: 'hay', x, w: 76, h: 84, y: GROUND_Y - 84 });
    else w.obstacles.push({ kind: 'mud', x, w: 130, h: 18, y: GROUND_Y - 18 });
  } else if (idx === 1) {
    if (roll < 0.3) w.obstacles.push({ kind: 'fence', x, w: 44, h: 74, y: GROUND_Y - 74 });
    else if (roll < 0.55) w.obstacles.push({ kind: 'crate', x, w: 64, h: 64, y: GROUND_Y - 64 });
    else if (roll < 0.8) w.obstacles.push({ kind: 'pumpkin', x, w: 56, h: 52, y: GROUND_Y - 52, vx: 40 });
    else w.obstacles.push({ kind: 'hay', x, w: 76, h: 84, y: GROUND_Y - 84 });
  } else {
    if (roll < 0.35) w.obstacles.push({ kind: 'oven', x, w: 96, h: 112, y: GROUND_Y - 112 });
    else if (roll < 0.6) w.obstacles.push({ kind: 'pot', x, w: 70, h: 56, y: GROUND_Y - 56 });
    else if (roll < 0.85) w.obstacles.push({ kind: 'crate', x, w: 64, h: 64, y: GROUND_Y - 64 });
    else w.obstacles.push({ kind: 'oven', x, w: 96, h: 112, y: GROUND_Y - 112 });
  }
  // Sometimes a falling knife is telegraphed just past the obstacle.
  if (idx >= 1 && r.chance(idx === 1 ? 0.25 : 0.45)) {
    w.knives.push({ x: x + r.range(120, 260), y: -30, vy: 0, state: 'fall', warn: 0.6, landed: 0 });
  }
  // Corn trails and the rare treats.
  if (r.chance(0.55)) {
    const n = r.int(3, 5);
    for (let i = 0; i < n; i++) {
      w.pickups.push({ kind: 'corn', x: x + 90 + i * 46, y: GROUND_Y - r.pick([70, 130, 190]), taken: false });
    }
  }
  if (r.chance(0.1)) w.pickups.push({ kind: 'feather', x: x + 60, y: GROUND_Y - 150, taken: false });
  if (r.chance(0.07)) w.pickups.push({ kind: 'pie', x: x + 60, y: GROUND_Y - 110, taken: false });
}

export function updateWorld(w, dt, turkey, events) {
  const stage = stageAt(w.distanceM);
  const idx = stageIndexAt(w.distanceM);
  if (idx !== w.stageIndex) {
    w.stageIndex = idx;
    w.banner = stage.banner;
    w.bannerT = 2.4;
    events.stageClear = true;
  }
  if (w.bannerT > 0) w.bannerT -= dt;

  const hiding = turkey.hidden;
  // Mud under the turkey's feet slows the whole run this very frame.
  let mudSlow = 1;
  if (!hiding && turkey.onGround) {
    const feet = { x: turkey.x - 26, y: turkey.y - 10, w: 52, h: 10 };
    for (const o of w.obstacles) {
      if (o.kind === 'mud' && boxOverlap(feet, { x: o.x, y: o.y, w: o.w, h: o.h })) {
        mudSlow = 0.55;
        events.slow = true;
        break;
      }
    }
  }
  const speed = hiding ? 0 : stage.speed * (turkey.sprinting ? 1.45 : 1) * mudSlow;
  w.speed = speed;
  const step = speed * dt;
  w.worldX += step;
  w.distanceM = w.worldX / PX_PER_METER;
  if (w.distanceM >= ESCAPE_DISTANCE_M) {
    w.escaped = true;
    return;
  }

  // Clouds drift.
  for (const c of w.clouds) {
    c.x -= (c.v + speed * 0.04) * dt;
    if (c.x < -160) {
      c.x = 1320;
      c.y = w.rng.range(40, 220);
    }
  }

  // Spawn ahead of the screen.
  if (w.worldX + 1400 > w.nextSpawnAt) {
    // The obstacle's world position is nextSpawnAt; on screen it appears
    // just past the right edge (turkey sits at screen x 220).
    spawnGroup(w, w.nextSpawnAt - w.worldX + 220);
    const gap = w.rng.range(stage.gapMin, stage.gapMax);
    w.nextSpawnAt = w.worldX + 1400 + gap;
  }

  // Move obstacles left; pumpkins roll toward the turkey.
  for (const o of w.obstacles) {
    o.x -= step;
    if (o.kind === 'pumpkin') o.x -= (o.vx || 0) * dt;
  }
  w.obstacles = w.obstacles.filter((o) => o.x + o.w > -80);

  // Pickups drift with the world.
  for (const p of w.pickups) p.x -= step;
  w.pickups = w.pickups.filter((p) => p.x > -60 && !p.taken);

  // Falling knives: warn, fall straight down at one screen spot (so the
  // player can dodge by stepping aside), land, stick, fade.
  for (const k of w.knives) {
    if (k.state === 'fall') {
      k.warn -= dt;
      if (k.warn <= 0) {
        k.state = 'drop';
        k.vy = 60;
      }
    } else if (k.state === 'drop') {
      k.vy += 4200 * dt;
      k.y += k.vy * dt;
      if (k.y >= GROUND_Y - 8) {
        k.y = GROUND_Y - 8;
        k.state = 'stuck';
        k.landed = 0.9;
        events.knifeLanded = true;
      }
    } else {
      k.landed -= dt;
      k.x -= step;
    }
  }
  w.knives = w.knives.filter((k) => k.landed > 0 || k.state !== 'stuck');

  // Particles.
  for (const p of w.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
    p.life -= dt;
  }
  w.particles = w.particles.filter((p) => p.life > 0);
  if (w.shake > 0) w.shake -= dt;

  // Collisions, skipped while hidden in the hay.
  const body = turkey.hidden
    ? null
    : turkey.sliding > 0
      ? { x: turkey.x - 42, y: turkey.y - 34, w: 84, h: 34 }
      : { x: turkey.x - 30, y: turkey.y - 72, w: 60, h: 72 };
  if (body) {
    for (const o of w.obstacles) {
      if (o.kind === 'mud') continue;
      const hitBox = { x: o.x + 4, y: o.y + 6, w: o.w - 8, h: o.h - 6 };
      if (boxOverlap(body, hitBox)) {
        events.hit = o.kind;
        break;
      }
    }
    for (const p of w.pickups) {
      if (!p.taken && boxOverlap(body, { x: p.x - 20, y: p.y - 20, w: 40, h: 40 })) {
        p.taken = true;
        events.pickup = p.kind;
        if (p.kind === 'corn') w.corn++;
      }
    }
    for (const k of w.knives) {
      if (k.state === 'stuck' && k.landed > 0.5) {
        if (boxOverlap(body, { x: k.x - 8, y: GROUND_Y - 60, w: 16, h: 60 })) {
          events.hit = 'knife';
          break;
        }
      }
    }
  }
}

export function burst(w, x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = w.rng.range(0, Math.PI * 2);
    const sp = w.rng.range(60, 260);
    w.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 120,
      life: w.rng.range(0.4, 0.9),
      color,
    });
  }
}
