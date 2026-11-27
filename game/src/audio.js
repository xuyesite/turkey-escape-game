// Gobble Dash — synthesized sound effects.
// One job: every sound the game makes, built from WebAudio oscillators so
// the game ships zero audio files and makes zero network requests.
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  jump() {
    this.tone(320, 0.16, 'square', 0.05, 0, 620);
  }

  corn() {
    this.tone(880, 0.09, 'sine', 0.1);
    this.tone(1318, 0.12, 'sine', 0.08, 0.07);
  }

  feather() {
    this.tone(523, 0.1, 'triangle', 0.1);
    this.tone(784, 0.1, 'triangle', 0.1, 0.08);
    this.tone(1046, 0.16, 'triangle', 0.1, 0.16);
  }

  gobble() {
    // The turkey's own voice: two quick low clucks.
    this.tone(180, 0.09, 'sawtooth', 0.07, 0, 120);
    this.tone(150, 0.12, 'sawtooth', 0.07, 0.11, 90);
  }

  thud() {
    this.tone(140, 0.2, 'sine', 0.16, 0, 55);
  }

  knifeWhistle() {
    this.tone(1400, 0.28, 'sine', 0.04, 0, 500);
  }

  spotted() {
    this.tone(220, 0.12, 'square', 0.08);
    this.tone(220, 0.12, 'square', 0.08, 0.14);
  }

  winJingle() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.11, i * 0.13));
  }

  caughtTune() {
    [392, 370, 349, 311].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.06, i * 0.2));
  }
}
