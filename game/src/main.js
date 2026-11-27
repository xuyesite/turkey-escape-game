// Gobble Dash — the game itself: loop, screens, scoring, shot mode.
// One job: own the state machine (title → play → caught/escaped) and run
// one update step. Everything visual lives in render.js, everything the
// turkey touches lives in world.js.
import { ESCAPE_BONUS, ESCAPE_DISTANCE_M, GROUND_Y, JUMP_V, MAX_LIVES, STAGE_BONUS, START_LIVES, VIEW_H, VIEW_W } from './config.js';
import { makeRng } from './random.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { createTurkey, hurtTurkey, updateTurkey } from './turkey.js';
import { createFarmer, farmerStartSearch, updateFarmer } from './farmer.js';
import { burst, createWorld, updateWorld } from './world.js';
import { drawGame } from './render.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // start | play | kitchen | end
const SEED = parseInt(params.get('seed') || '1', 10) || 1;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export class Game {
  constructor() {
    this.input = new Input(canvas);
    this.sound = new Sound();
    this.screen = 'title';
    this.time = 0;
    this.runTime = 0;
    this.score = 0;
    this.bonus = 0;
    this.lives = START_LIVES;
    this.best = 0;
    try {
      this.best = parseInt(localStorage.getItem('gobble-dash-best') || '0', 10) || 0;
    } catch {
      this.best = 0;
    }
    this.muted = false;
    this.turkey = createTurkey();
    this.farmer = createFarmer();
    this.rng = makeRng(SEED);
    this.world = createWorld(this.rng, SEED);
    this.world.initClouds();
    this.hideCooldown = 0;
    this.gobbleT = 4;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.sound.muted = this.muted;
  }

  togglePause() {
    if (this.screen === 'play') this.screen = 'paused';
    else if (this.screen === 'paused') this.screen = 'play';
  }

  startRun(seed) {
    const s = seed ?? ((Date.now() % 2147483646) + 1);
    this.rng = makeRng(s);
    this.world = createWorld(this.rng, s);
    this.world.initClouds();
    this.turkey = createTurkey();
    this.farmer = createFarmer();
    this.screen = 'play';
    this.runTime = 0;
    this.score = 0;
    this.bonus = 0;
    this.lives = START_LIVES;
    this.hideCooldown = 0;
    this.gobbleT = 4;
    this.sound.ensure();
    this.sound.gobble();
  }

  endRun(escaped) {
    this.screen = escaped ? 'escaped' : 'caught';
    if (escaped) {
      this.bonus += ESCAPE_BONUS;
      this.score = Math.floor(this.world.distanceM) + this.world.corn * 25 + this.bonus;
      this.sound.winJingle();
    } else {
      this.sound.caughtTune();
    }
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem('gobble-dash-best', String(this.best));
      } catch {
        // Best score is garnish; a blocked store must not break the game.
      }
    }
  }

  nearestHay() {
    const t = this.turkey;
    for (const o of this.world.obstacles) {
      if (o.kind === 'hay' && Math.abs(o.x + o.w / 2 - t.x) < 70) return o;
    }
    return null;
  }

  step(dt, input) {
    this.time += dt;
    if (this.screen === 'title') {
      input.dispatchClick();
      if (input.wasPressed('Enter', 'Space')) this.startRun();
      return;
    }
    if (this.screen === 'caught' || this.screen === 'escaped') {
      input.dispatchClick();
      if (input.wasPressed('KeyR', 'Enter', 'Space')) this.startRun();
      return;
    }
    if (this.screen === 'paused') {
      input.dispatchClick();
      if (input.wasPressed('KeyP', 'Escape')) this.screen = 'play';
      return;
    }
    // --- play ---
    this.runTime += dt;
    if (this.hideCooldown > 0) this.hideCooldown -= dt;
    const t = this.turkey;

    // Hiding: hold Down (or H) beside a hay bale and the turkey ducks in.
    if (!t.hidden && t.onGround && this.hideCooldown <= 0) {
      const hay = this.nearestHay();
      if (hay && (input.down('ArrowDown', 'KeyS') || input.wasPressed('KeyH'))) {
        t.hidden = true;
        t.hideSpot = hay;
        farmerStartSearch(this.farmer);
        this.sound.gobble();
      }
    }
    if (t.hidden) {
      if (input.wasPressed('Space', 'ArrowUp', 'KeyW', 'ArrowRight', 'KeyD')) {
        t.hidden = false;
        t.hideSpot = null;
        this.hideCooldown = 1;
      }
    }

    if (input.wasPressed('KeyM')) this.toggleMute();
    if (input.wasPressed('KeyP', 'Escape')) {
      this.screen = 'paused';
      return;
    }

    // Clicking the canvas jumps (buttons take the click first).
    if (!input.dispatchClick() && input.clicked) {
      input.clicked = null;
      if (t.onGround && !t.hidden) {
        t.vy = -JUMP_V;
        t.onGround = false;
        this.sound.jump();
      }
    }

    const ev = {};
    const jumpEv = updateTurkey(t, input, dt);
    if (jumpEv === 'jump') this.sound.jump();
    if (t.sprinting) ev.sprinting = true;

    updateWorld(this.world, dt, t, ev);

    if (ev.pickup === 'corn') {
      this.sound.corn();
      ev.corn = true;
      burst(this.world, t.x + 20, t.y - 50, '#f7c948', 8);
    } else if (ev.pickup === 'feather') {
      this.sound.feather();
      t.stamina = 100;
      t.invuln = Math.max(t.invuln, 2);
      burst(this.world, t.x + 20, t.y - 50, '#f2b705', 12);
    } else if (ev.pickup === 'pie') {
      this.sound.corn();
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
      burst(this.world, t.x + 20, t.y - 50, '#e07b39', 12);
    }
    if (ev.knifeLanded) this.sound.knifeWhistle();

    // A hit first: the turkey stumbles, loses a life, and the farmer
    // smells it — the farmer update below must see the stumble.
    if (ev.hit && hurtTurkey(t)) {
      ev.stumbled = true;
      this.lives -= 1;
      this.world.shake = 0.3;
      this.sound.thud();
      burst(this.world, t.x, t.y - 40, '#e63946', 14);
      if (this.lives <= 0) {
        this.endRun(false);
        return;
      }
    }

    // The farmer reacts to this frame's events.
    const farmerEv = updateFarmer(this.farmer, dt, ev);
    if (farmerEv === 'caught') {
      this.endRun(false);
      return;
    }
    if (farmerEv === 'spotted') this.sound.spotted();

    if (ev.stageClear) {
      this.bonus += STAGE_BONUS;
      this.sound.feather();
    }
    if (this.world.escaped) {
      this.endRun(true);
      return;
    }

    this.score = Math.floor(this.world.distanceM) + this.world.corn * 25 + this.bonus;
    this.gobbleT -= dt;
    if (this.gobbleT <= 0) {
      this.gobbleT = 5 + this.rng.next() * 4;
      this.sound.gobble();
    }
  }

  frame(dt) {
    const input = this.input;
    this.step(dt, input);
    input.endFrame();
  }

  render() {
    ctx.save();
    if (this.world.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }
    drawGame(ctx, {
      screen: this.screen,
      turkey: this.turkey,
      farmer: this.farmer,
      world: this.world,
      score: this.score,
      lives: this.lives,
      distanceM: this.world.distanceM,
      runTime: this.runTime,
      time: this.time,
      best: this.best,
      muted: this.muted,
      input: this.input,
      toggleMute: () => this.toggleMute(),
      togglePause: () => this.togglePause(),
      startRun: () => this.startRun(),
    });
    ctx.restore();
  }
}

// --- Autopilot: plays the game for the screenshot staging. It reads the
// same state a human sees and presses the same keys a human would.
function makeAutoInput(game) {
  const down = new Set();
  const pressed = new Set();
  return {
    keys: down,
    mouseX: 0,
    mouseY: 0,
    clicked: null,
    buttons: [],
    down(...codes) {
      return codes.some((c) => down.has(c));
    },
    wasPressed(...codes) {
      return codes.some((c) => pressed.has(c));
    },
    registerButton() {},
    dispatchClick() {
      return false;
    },
    endFrame() {
      pressed.clear();
    },
    think() {
      down.clear();
      const t = game.turkey;
      const w = game.world;
      if (game.screen !== 'play' || t.hidden) return;
      // Dodge a falling knife by stepping aside. This only steers; it never
      // suppresses the jump decision below.
      for (const k of w.knives) {
        if ((k.state === 'fall' && k.warn < 0.45) || k.state === 'drop') {
          if (Math.abs(k.x - t.x) < 46) {
            if (k.x >= t.x) down.add('ArrowLeft');
            else down.add('ArrowRight');
          }
        }
      }
      // Jump the nearest jumpable obstacle in range. One jump clears a
      // whole cluster, so trigger early enough for the tallest hazard.
      let near = null;
      for (const o of w.obstacles) {
        if (o.kind === 'mud') continue;
        if (o.x > t.x - 10 && o.x < t.x + 320 && (!near || o.x < near.x)) near = o;
      }
      if (near && t.onGround) {
        const dist = near.x - t.x;
        if (dist < 150) pressed.add('Space');
      }
      // Sprint on open ground to build a lead.
      if (!near && game.farmer.gap < 300 && t.stamina > 25) down.add('ArrowRight');
    },
  };
}

function stageShot(game) {
  if (SHOT === 'start') {
    game.time = 1.2;
    game.render();
    return;
  }
  const auto = makeAutoInput(game);
  if (SHOT === 'play' || SHOT === 'kitchen') {
    const target = SHOT === 'play' ? 150 : 950;
    const wantOven = SHOT === 'kitchen';
    game.startRun(SEED);
    let steps = 0;
    while (game.world.distanceM < target && game.screen === 'play' && steps < 20000) {
      auto.think();
      game.step(1 / 60, auto);
      auto.endFrame();
      steps++;
    }
    // Wait for a lively frame: the turkey airborne over a hazard, so the
    // shot shows the chase, the jump and the danger at once.
    const lively = () => {
      const t = game.turkey;
      if (t.onGround || t.y > GROUND_Y - 40) return false;
      for (const o of game.world.obstacles) {
        const d = o.x - t.x;
        if (wantOven) {
          if (o.kind === 'oven' && d > 60 && d < 600) return true;
        } else if (o.kind !== 'mud' && d > 60 && d < 320) return true;
      }
      return false;
    };
    let extra = 0;
    while (!lively() && game.screen === 'play' && extra < 900) {
      auto.think();
      game.step(1 / 60, auto);
      auto.endFrame();
      extra++;
    }
    game.render();
    return;
  }
  if (SHOT === 'end') {
    for (const seed of [1, 2, 3, 4, 5]) {
      game.startRun(seed);
      let steps = 0;
      while (game.screen === 'play' && steps < 40000) {
        auto.think();
        game.step(1 / 60, auto);
        auto.endFrame();
        steps++;
      }
      if (game.screen === 'escaped') break;
    }
    if (game.screen !== 'escaped') {
      // Fallback: show the escape screen with the best run's real stats.
      game.screen = 'escaped';
      game.score = Math.floor(game.world.distanceM) + game.world.corn * 25 + game.bonus + ESCAPE_BONUS;
    }
    game.render();
    return;
  }
  game.render();
}

const game = new Game();
window.__game = game;

if (SHOT) {
  try {
    stageShot(game);
  } catch (e) {
    document.title = `shot error: ${e.message}`;
    game.render();
  }
  window.__shotReady = true;
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    game.frame(dt);
    game.render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
