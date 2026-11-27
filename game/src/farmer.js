// Gobble Dash — the farmer: chase, search and lunge.
// One job: the threat behind the turkey. He runs after it, loses it when it
// hides in hay, and lunges when he gets close enough to grab.
export function createFarmer() {
  return {
    gap: 280,
    state: 'chase',
    searchT: 0,
    legPhase: 0,
    shout: '',
    shoutT: 0,
  };
}

export function farmerX(farmer, turkeyX) {
  return turkeyX - farmer.gap;
}

export function updateFarmer(f, dt, ev) {
  f.legPhase += dt * 12;
  if (f.shoutT > 0) f.shoutT -= dt;

  if (f.state === 'search') {
    f.searchT -= dt;
    if (f.searchT <= 0) {
      // He gives up searching and the trail goes cold: the gap resets.
      f.state = 'chase';
      f.gap = 320;
      f.shout = 'Where did that bird go?!';
      f.shoutT = 1.6;
    }
    return;
  }

  if (f.state === 'lunge') {
    f.gap -= 260 * dt;
    if (f.gap <= 46) return 'caught';
    if (f.gap > 130) f.state = 'chase';
    return null;
  }

  // Chase: the gap breathes with the player's luck.
  if (ev.stumbled) {
    f.gap -= 70;
    f.shout = 'Got you now, dinner!';
    f.shoutT = 1.4;
  }
  if (ev.sprinting) f.gap += 26 * dt;
  if (ev.slow) f.gap -= 30 * dt;
  if (ev.corn) f.gap += 22;
  if (ev.stageClear) f.gap += 90;
  f.gap = Math.min(420, Math.max(60, f.gap));

  if (f.gap < 130) {
    f.state = 'lunge';
    f.shout = 'COME BACK HERE!';
    f.shoutT = 1.2;
    return 'spotted';
  }
  return null;
}

export function farmerStartSearch(f) {
  f.state = 'search';
  f.searchT = 2.6;
  f.shout = 'Hmm... I heard a gobble...';
  f.shoutT = 2.2;
}
