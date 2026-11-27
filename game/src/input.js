// Gobble Dash — keyboard and mouse input.
// One job: turn raw DOM events into the game's questions: is a key down,
// was it just pressed, where is the mouse, what was clicked.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = null;
    this.buttons = [];
    this.anyGesture = false;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      this.anyGesture = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
      this.clicked = { x: this.mouseX, y: this.mouseY };
      this.anyGesture = true;
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  wasPressed(...codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  // Buttons are re-registered every frame by the renderer; a click is
  // consumed by the first button whose rect holds it.
  registerButton(id, x, y, w, h, action) {
    this.buttons.push({ id, x, y, w, h, action });
  }

  dispatchClick() {
    if (!this.clicked) return false;
    const c = this.clicked;
    this.clicked = null;
    for (const b of this.buttons) {
      if (c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h) {
        b.action();
        return true;
      }
    }
    return false;
  }

  endFrame() {
    this.pressed.clear();
    this.buttons = [];
  }
}
