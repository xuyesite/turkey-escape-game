// Gobble Dash — tuning constants, stages and palette.
// One job: every number the game balances on lives here, so tuning never
// means hunting through the drawing or physics code.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const GRAVITY = 2300;
export const JUMP_V = 1200;
export const BASE_SPEED = 300;
export const MAX_SPEED = 540;
export const PX_PER_METER = 50;
export const ESCAPE_DISTANCE_M = 1400;
export const START_LIVES = 3;
export const MAX_LIVES = 3;
export const SLIDE_TIME = 0.55;
export const STUMBLE_TIME = 0.5;
export const INVULN_TIME = 1.6;
export const HIDE_SEARCH_TIME = 2.6;
export const SPRINT_DRAIN = 34;
export const SPRINT_REGEN = 16;
export const CORN_SCORE = 25;
export const STAGE_BONUS = 200;
export const ESCAPE_BONUS = 1000;

// Stages: the escape runs from the farmyard, through the barnyard, into the
// kitchen. Each stage is harder: faster scroll, tighter obstacle gaps.
export const STAGES = [
  {
    name: 'Farmyard',
    from: 0,
    to: 400,
    speed: 300,
    gapMin: 420,
    gapMax: 640,
    skyTop: '#f7c873',
    skyBottom: '#fdeec9',
    ground: '#8a6b3f',
    grass: '#7fae4c',
    banner: 'The Farmyard — run, turkey, run!',
  },
  {
    name: 'Barnyard',
    from: 400,
    to: 900,
    speed: 360,
    gapMin: 420,
    gapMax: 580,
    skyTop: '#ef9a52',
    skyBottom: '#fbd9a8',
    ground: '#7a5a35',
    grass: '#a8843c',
    banner: 'The Barnyard — the farmer is closing in!',
  },
  {
    name: 'Kitchen',
    from: 900,
    to: 1400,
    speed: 400,
    gapMin: 460,
    gapMax: 560,
    skyTop: '#d8b48f',
    skyBottom: '#f3e2c8',
    ground: '#9c6b4f',
    grass: '#b98a5e',
    banner: 'The Kitchen — dodge the oven and the knives!',
  },
];

export function stageAt(distanceM) {
  for (const s of STAGES) {
    if (distanceM < s.to) return s;
  }
  return STAGES[STAGES.length - 1];
}

export function stageIndexAt(distanceM) {
  for (let i = 0; i < STAGES.length; i++) {
    if (distanceM < STAGES[i].to) return i;
  }
  return STAGES.length - 1;
}
