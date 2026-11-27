// Gobble Dash — the turkey: physics and body states.
// One job: how the player moves (run, jump, slide, hide, stumble) and the
// boxes the world collides against. It knows nothing about obstacles.
import { GRAVITY, GROUND_Y, INVULN_TIME, JUMP_V, SLIDE_TIME, STUMBLE_TIME } from './config.js';

export function createTurkey() {
  return {
    x: 220,
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    sliding: 0,
    slidingHeld: false,
    hidden: false,
    hideSpot: null,
    stumble: 0,
    invuln: 0,
    stamina: 100,
    sprinting: false,
    legPhase: 0,
    facing: 1,
  };
}

export function turkeyBodyBox(t) {
  if (t.hidden) return null;
  if (t.sliding > 0) return { x: t.x - 42, y: t.y - 34, w: 84, h: 34 };
  return { x: t.x - 30, y: t.y - 72, w: 60, h: 72 };
}

export function updateTurkey(t, input, dt) {
  const jumpPressed = input.wasPressed('Space', 'ArrowUp', 'KeyW');
  const slideHeld = input.down('ArrowDown', 'KeyS');
  const backHeld = input.down('ArrowLeft', 'KeyA');
  const fwdHeld = input.down('ArrowRight', 'KeyD');

  if (t.stumble > 0) t.stumble -= dt;
  if (t.invuln > 0) t.invuln -= dt;

  // Sprint: hold Right to run faster, at the cost of stamina.
  t.sprinting = false;
  if (fwdHeld && t.stamina > 1 && t.onGround && !t.hidden) {
    t.sprinting = true;
    t.stamina = Math.max(0, t.stamina - 34 * dt);
  } else {
    t.stamina = Math.min(100, t.stamina + 16 * dt);
  }

  // Step back: slow on purpose, usually to dodge a falling knife.
  let moveX = 0;
  if (backHeld && !t.hidden) moveX -= 150;
  if (fwdHeld && !t.hidden) moveX += 60;
  t.x = Math.min(480, Math.max(120, t.x + moveX * dt));

  // Jump.
  if (jumpPressed && t.onGround && !t.hidden && t.stumble <= 0) {
    t.vy = -JUMP_V;
    t.onGround = false;
    t.sliding = 0;
    return 'jump';
  }

  // Slide: a quick low duck. Holding Down near a hay bale hides instead
  // (the world decides that; here sliding is just the pose).
  if (slideHeld && t.onGround && !t.hidden) {
    if (t.sliding <= 0) t.sliding = SLIDE_TIME;
  }
  if (t.sliding > 0) t.sliding -= dt;

  // Gravity and landing.
  if (!t.onGround) {
    t.vy += GRAVITY * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.vy = 0;
      t.onGround = true;
    }
  }

  t.legPhase += dt * (t.sprinting ? 16 : 11);
  return null;
}

export function hurtTurkey(t) {
  if (t.invuln > 0 || t.hidden) return false;
  t.stumble = STUMBLE_TIME;
  t.invuln = INVULN_TIME;
  t.sliding = 0;
  return true;
}
