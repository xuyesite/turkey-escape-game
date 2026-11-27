// Gobble Dash — every pixel the player sees.
// One job: draw the game. It never changes game state; it reads the world
// and paints it: backgrounds, the turkey, the farmer, hazards, HUD, menus.
import { GROUND_Y, STAGES, VIEW_H, VIEW_W, stageAt } from './config.js';
import { farmerX } from './farmer.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(ctx, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 16, s / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -4, -4, -11, 0, -5);
  ctx.bezierCurveTo(4, -11, 9, -4, 0, 5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function button(ctx, input, id, x, y, w, h, label, action, font = 'bold 26px Georgia, serif') {
  const hover = input.mouseX >= x && input.mouseX <= x + w && input.mouseY >= y && input.mouseY <= y + h;
  ctx.save();
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = hover ? '#e07b39' : '#c1440e';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7a2a08';
  ctx.stroke();
  ctx.fillStyle = '#fff8ea';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
  input.registerButton(id, x, y, w, h, action);
}

function bubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = 'bold 17px Georgia, serif';
  const w = ctx.measureText(text).width + 24;
  ctx.fillStyle = 'rgba(255, 250, 235, 0.96)';
  rr(ctx, x - w / 2, y - 18, w, 34, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a6b3f';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 15);
  ctx.lineTo(x + 8, y + 15);
  ctx.lineTo(x, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawSky(ctx, world, time) {
  const stage = stageAt(world.distanceM);
  if (stage.name === 'Kitchen') {
    // Interior: warm wall, tile lines, a window onto the yard, hanging pans.
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, '#e8c9a0');
    g.addColorStop(1, '#f3e2c8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let x = 0; x < VIEW_W; x += 90) ctx.fillRect(x, 0, 2, GROUND_Y);
    for (let y = 0; y < GROUND_Y; y += 90) ctx.fillRect(0, y, VIEW_W, 2);
    // Window onto the farmyard.
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(80, 90, 180, 190);
    ctx.fillStyle = '#bfe3f0';
    ctx.fillRect(92, 102, 156, 166);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(150, 150, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fae4c';
    ctx.fillRect(92, 240, 156, 38);
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(164, 102, 12, 166);
    ctx.fillRect(92, 176, 156, 12);
    // Hanging pans and a shelf with jars.
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = 4;
    for (const px of [520, 640, 760]) {
      ctx.beginPath();
      ctx.moveTo(px, 60);
      ctx.lineTo(px, 110);
      ctx.stroke();
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.arc(px, 132, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2e2e2e';
      ctx.beginPath();
      ctx.arc(px, 132, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8a6b3f';
    ctx.fillRect(900, 300, 300, 14);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['#c1440e', '#e8c33c', '#7fae4c', '#b5651d'][i];
      ctx.beginPath();
      ctx.arc(940 + i * 62, 282, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    // Checkered kitchen floor.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    for (let x = 0; x < VIEW_W; x += 80) {
      ctx.fillStyle = (x / 80) % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, GROUND_Y + 16, 80, VIEW_H - GROUND_Y - 16);
    }
    ctx.fillStyle = stage.grass;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 16);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  // Sun.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(1080, 90, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 243, 196, 0.45)';
  ctx.beginPath();
  ctx.arc(1080, 90, 62, 0, Math.PI * 2);
  ctx.fill();
  // Clouds.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of world.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 52 * c.s, 20 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 34 * c.s, c.y + 6, 38 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Distant barn and trees, parallax.
  const off = (world.worldX * 0.15) % 320;
  ctx.fillStyle = 'rgba(122, 74, 42, 0.55)';
  for (let i = -1; i < 5; i++) {
    const bx = i * 320 - off + 60;
    ctx.fillRect(bx, 430, 120, 90);
    ctx.beginPath();
    ctx.moveTo(bx - 10, 430);
    ctx.lineTo(bx + 60, 380);
    ctx.lineTo(bx + 130, 430);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(74, 110, 52, 0.6)';
  for (let i = 0; i < 6; i++) {
    const tx = ((i * 260 - world.worldX * 0.3) % 1560 + 1560) % 1560 - 80;
    ctx.beginPath();
    ctx.moveTo(tx, 520);
    ctx.lineTo(tx + 34, 420);
    ctx.lineTo(tx + 68, 520);
    ctx.closePath();
    ctx.fill();
  }
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 16);
}

function drawTurkey(ctx, t, time) {
  ctx.save();
  if (t.invuln > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.45;
  if (t.hidden && t.hideSpot) {
    // Only tail feathers poke out of the hay, plus a nervous thought.
    const hx = t.hideSpot.x + t.hideSpot.w / 2;
    ctx.fillStyle = '#c1440e';
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(hx + i * 12, GROUND_Y - 84);
      ctx.rotate(i * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, -16, 7, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    bubble(ctx, hx, GROUND_Y - 150, 'shh... he will never look here');
    ctx.restore();
    return;
  }
  const legSwing = Math.sin(t.legPhase) * (t.onGround ? 14 : 4);
  const slide = t.sliding > 0;
  ctx.translate(t.x, t.y);
  if (!t.onGround) ctx.rotate(-0.12);
  if (slide) ctx.scale(1.25, 0.55);
  // Tail fan.
  const featherColors = ['#c1440e', '#e07b39', '#8a5a2b', '#e07b39', '#c1440e'];
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    ctx.save();
    ctx.translate(-22, -34);
    ctx.rotate(a);
    ctx.fillStyle = featherColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 150, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, -40, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(0, -36, 34, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a06a35';
  ctx.beginPath();
  ctx.ellipse(-4, -30, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#6d4423';
  ctx.beginPath();
  ctx.ellipse(-6, -34, 18, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Head, beak, wattle, eye.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(24, -62, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2a007';
  ctx.beginPath();
  ctx.moveTo(36, -64);
  ctx.lineTo(50, -58);
  ctx.lineTo(36, -54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d21f3c';
  ctx.beginPath();
  ctx.ellipse(34, -50, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(28, -66, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(29, -67, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFarmer(ctx, f, turkeyX, time) {
  const x = farmerX(f, turkeyX);
  if (x < -160) return;
  ctx.save();
  ctx.translate(x, GROUND_Y);
  const swing = Math.sin(f.legPhase) * 12;
  if (f.state === 'search') {
    // Standing, hand shading his eyes, puzzled.
    ctx.strokeStyle = '#2b4a7a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    ctx.lineTo(-8 + swing * 0.3, 0);
    ctx.moveTo(10, -52);
    ctx.lineTo(10 - swing * 0.3, 0);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#2b4a7a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    ctx.lineTo(-8 + swing, 0);
    ctx.moveTo(10, -52);
    ctx.lineTo(10 - swing, 0);
    ctx.stroke();
  }
  // Overalls and shirt.
  ctx.fillStyle = '#2b4a7a';
  ctx.fillRect(-16, -104, 36, 56);
  ctx.fillStyle = '#b3322a';
  ctx.fillRect(-18, -132, 40, 32);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -122);
  ctx.lineTo(22, -122);
  ctx.moveTo(-18, -112);
  ctx.lineTo(22, -112);
  ctx.stroke();
  // Head and straw hat.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(2, -148, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(2, -158, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-10, -174, 24, 16);
  // Angry brows, moustache.
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -154);
  ctx.lineTo(2, -150);
  ctx.moveTo(12, -154);
  ctx.lineTo(6, -150);
  ctx.stroke();
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-4, -140, 14, 4);
  // Arm with a butterfly net, reaching forward.
  ctx.strokeStyle = '#b3322a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(14, -126);
  ctx.lineTo(38, -110);
  ctx.stroke();
  ctx.strokeStyle = '#7a5a35';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(38, -110);
  ctx.lineTo(58, -128);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,220,230,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(66, -138, 14, 18, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  if (f.state === 'search') {
    ctx.fillStyle = '#3a3a3a';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 2, -196);
  }
  ctx.restore();
  if (f.shoutT > 0 && f.shout) bubble(ctx, x + 10, GROUND_Y - 210, f.shout);
}

function drawObstacles(ctx, world, time) {
  for (const o of world.obstacles) {
    ctx.save();
    if (o.kind === 'fence') {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(o.x, o.y, 8, o.h);
      ctx.fillRect(o.x + o.w - 8, o.y, 8, o.h);
      ctx.fillRect(o.x - 6, o.y + 12, o.w + 12, 9);
      ctx.fillRect(o.x - 6, o.y + 40, o.w + 12, 9);
    } else if (o.kind === 'hay') {
      ctx.fillStyle = '#e8c33c';
      rr(ctx, o.x, o.y, o.w, o.h, 12);
      ctx.fill();
      ctx.strokeStyle = '#b8922a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 22, 0.4, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 12, 0.4, Math.PI * 1.4);
      ctx.stroke();
    } else if (o.kind === 'mud') {
      ctx.fillStyle = '#5a3d24';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + 9, o.w / 2, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2 - 20, o.y + 6, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === 'crate') {
      ctx.fillStyle = '#a9763f';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#7a5230';
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.moveTo(o.x + o.w, o.y);
      ctx.lineTo(o.x, o.y + o.h);
      ctx.stroke();
    } else if (o.kind === 'pumpkin') {
      ctx.fillStyle = '#e07b1f';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b85c10';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2 + i * 12, o.y + o.h / 2, 10, o.h / 2 - 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a7a2e';
      ctx.fillRect(o.x + o.w / 2 - 3, o.y - 8, 6, 12);
    } else if (o.kind === 'oven') {
      ctx.fillStyle = '#3a3a3a';
      rr(ctx, o.x, o.y, o.w, o.h, 8);
      ctx.fill();
      ctx.fillStyle = '#ff7b1c';
      rr(ctx, o.x + 12, o.y + 26, o.w - 24, 44, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
      rr(ctx, o.x + 20, o.y + 34, o.w - 40, 28, 4);
      ctx.fill();
      ctx.fillStyle = '#fff8ea';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', o.x + o.w / 2, o.y + 14);
      // Steam.
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        const sx = o.x + 22 + i * 26;
        const wob = Math.sin(time * 3 + i * 2) * 6;
        ctx.beginPath();
        ctx.moveTo(sx, o.y);
        ctx.quadraticCurveTo(sx + wob, o.y - 22, sx - wob, o.y - 40);
        ctx.stroke();
      }
    } else if (o.kind === 'pot') {
      ctx.fillStyle = '#5a5a5a';
      rr(ctx, o.x, o.y + 10, o.w, o.h - 10, 8);
      ctx.fill();
      ctx.fillStyle = '#8a8a8a';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + 10, o.w / 2 + 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(o.x + 16, o.y);
      ctx.quadraticCurveTo(o.x + 30, o.y - 24, o.x + 18, o.y - 38);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Pickups.
  for (const p of world.pickups) {
    if (p.taken) continue;
    ctx.save();
    const bob = Math.sin(time * 4 + p.x * 0.05) * 4;
    if (p.kind === 'corn') {
      ctx.translate(p.x, p.y + bob);
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8932a';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 5 - 4, -12);
        ctx.lineTo(i * 5 + 4, 12);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a7a2e';
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.lineTo(-16, 22);
      ctx.lineTo(-2, 16);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'feather') {
      ctx.translate(p.x, p.y + bob);
      ctx.rotate(0.5);
      ctx.fillStyle = '#f2b705';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8932a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 26);
      ctx.stroke();
    } else if (p.kind === 'pie') {
      ctx.translate(p.x, p.y + bob);
      ctx.fillStyle = '#b5651d';
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(16, 10);
      ctx.lineTo(0, -14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8a33d';
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.lineTo(12, 10);
      ctx.lineTo(0, -8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Falling knives.
  for (const k of world.knives) {
    ctx.save();
    if (k.state === 'fall') {
      const pulse = 0.5 + Math.sin(time * 10) * 0.3;
      ctx.strokeStyle = `rgba(210, 31, 60, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(k.x, GROUND_Y - 4, 26, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(210, 31, 60, ${pulse})`;
      ctx.font = 'bold 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', k.x, GROUND_Y - 22);
      // Glint high above.
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(k.x, 60, 5 + pulse * 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.translate(k.x, k.y);
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(-4, -26, 8, 26);
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(0, 44);
      ctx.lineTo(8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9aa5ab';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 40);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Particles.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.6);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, g) {
  const { score, lives, distanceM, turkey, farmer, world } = g;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(60, 30, 10, 0.55)';
  rr(ctx, 16, 14, 420, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE ${score}`, 32, 42);
  for (let i = 0; i < 3; i++) {
    heart(ctx, 300 + i * 34, 42, 26, i < lives ? '#e63946' : 'rgba(255,255,255,0.25)');
  }
  ctx.fillStyle = 'rgba(60, 30, 10, 0.55)';
  rr(ctx, 460, 14, 360, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(distanceM)} m  ·  ${world.stageIndex === 0 ? 'Farmyard' : world.stageIndex === 1 ? 'Barnyard' : 'Kitchen'}`, 640, 42);
  // Farmer gap bar.
  const gapFrac = Math.min(1, Math.max(0, farmer.gap / 420));
  ctx.fillStyle = 'rgba(60, 30, 10, 0.55)';
  rr(ctx, 844, 14, 300, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', 858, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, 858, 44, 180, 10, 5);
  ctx.fill();
  ctx.fillStyle = gapFrac > 0.45 ? '#7fae4c' : gapFrac > 0.2 ? '#f2a007' : '#e63946';
  rr(ctx, 858, 44, 180 * gapFrac, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`${Math.round(farmer.gap / 10)}m`, 1046, 50);
  // Stamina bar under the turkey's score box.
  ctx.fillStyle = 'rgba(60, 30, 10, 0.55)';
  rr(ctx, 16, 78, 200, 18, 9);
  ctx.fill();
  ctx.fillStyle = '#f2b705';
  rr(ctx, 18, 80, 196 * (turkey.stamina / 100), 14, 7);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('SPRINT (hold →)', 224, 87);
  // Stage banner.
  if (world.bannerT > 0 && world.banner) {
    ctx.globalAlpha = Math.min(1, world.bannerT);
    ctx.fillStyle = 'rgba(60, 30, 10, 0.7)';
    ctx.font = 'bold 30px Georgia, serif';
    const w = ctx.measureText(world.banner).width + 48;
    rr(ctx, (VIEW_W - w) / 2, 130, w, 52, 14);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.textAlign = 'center';
    ctx.fillText(world.banner, VIEW_W / 2, 157);
    ctx.globalAlpha = 1;
  }
  // Pause + mute buttons.
  ctx.fillStyle = 'rgba(60, 30, 10, 0.55)';
  rr(ctx, 1168, 14, 96, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.muted ? '×' : '♪', 1192, 42);
  ctx.fillText('II', 1244, 42);
  g.input.registerButton('mute', 1168, 14, 48, 56, () => g.toggleMute());
  g.input.registerButton('pause', 1216, 14, 48, 56, () => g.togglePause());
  ctx.restore();
}

function drawTitle(ctx, g) {
  const { input, best } = g;
  drawSky(ctx, g.world, g.time);
  // The turkey waits at the fence, the farmer peeks from behind the barn.
  drawTurkey(ctx, { ...g.turkey, x: 330, y: GROUND_Y, legPhase: 0, invuln: 0, sliding: 0, hidden: false }, g.time);
  drawFarmer(ctx, { ...g.farmer, gap: 320, state: 'chase', legPhase: 0, shout: '', shoutT: 0 }, 330, g.time);
  // Falling leaves.
  ctx.fillStyle = 'rgba(224, 123, 57, 0.8)';
  for (let i = 0; i < 14; i++) {
    const lx = (i * 97 + g.time * 22) % 1280;
    const ly = (i * 61 + g.time * 40) % 420;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(g.time + i);
    ctx.fillRect(-6, -3, 12, 6);
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = 'rgba(60, 30, 10, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 150);
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'italic bold 34px Georgia, serif';
  ctx.fillText('A Turkey Escape', VIEW_W / 2, 200);
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', VIEW_W / 2, 248);
  ctx.fillText('Outrun him from the farmyard to the kitchen — and out the forest gate.', VIEW_W / 2, 280);
  // Controls card.
  ctx.fillStyle = 'rgba(255, 248, 234, 0.94)';
  rr(ctx, 340, 320, 600, 150, 16);
  ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('SPACE / ↑ / click  —  jump', 380, 356);
  ctx.fillText('↓  —  slide under the knives · hold near hay to hide', 380, 390);
  ctx.fillText('← / →  —  step back / sprint   ·   H  —  hide   ·   P  —  pause', 380, 424);
  ctx.fillText('Corn feeds your lead. Feathers make you fast. Pie heals.', 380, 452);
  button(ctx, input, 'start', 490, 500, 300, 64, '▶  START THE RUN', () => g.startRun());
  ctx.fillStyle = '#fff8ea';
  ctx.font = '18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('or press Enter', VIEW_W / 2, 592);
  if (best > 0) ctx.fillText(`Best escape so far: ${best} points`, VIEW_W / 2, 624);
  ctx.restore();
}

function drawEnd(ctx, g, escaped) {
  const { input } = g;
  ctx.save();
  ctx.fillStyle = escaped ? 'rgba(38, 84, 44, 0.72)' : 'rgba(90, 20, 10, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 170);
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText(
    escaped ? 'The forest smells like freedom. Happy Thanksgiving — somewhere else.' : 'Thanksgiving dinner it is... the farmer is already sharpening the knife.',
    VIEW_W / 2,
    222,
  );
  // Stats card.
  ctx.fillStyle = 'rgba(255, 248, 234, 0.95)';
  rr(ctx, 390, 270, 500, 190, 16);
  ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score:      ${g.score}`, 430, 316);
  ctx.fillText(`Distance:   ${Math.floor(g.distanceM)} m of ${1400} m`, 430, 352);
  ctx.fillText(`Corn eaten: ${g.world.corn}`, 430, 388);
  ctx.fillText(`Time:       ${g.runTime.toFixed(1)} s`, 430, 424);
  button(ctx, input, 'restart', 490, 500, 300, 64, '↻  RUN AGAIN', () => g.startRun());
  ctx.fillStyle = '#fff8ea';
  ctx.font = '18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('or press R', VIEW_W / 2, 592);
  ctx.restore();
}

function drawForest(ctx, time) {
  // The escape destination: a quiet forest clearing, far from any oven.
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, '#2e5d33');
  g.addColorStop(1, '#7fae4c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(1080, 90, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 5; i++) {
    const cx = 120 + i * 260;
    ctx.beginPath();
    ctx.ellipse(cx, 120 + (i % 2) * 60, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 9; i++) {
    const tx = i * 160 - 40;
    ctx.fillStyle = i % 2 === 0 ? '#24512b' : '#2e6b35';
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y);
    ctx.lineTo(tx + 55, 300 + (i % 3) * 40);
    ctx.lineTo(tx + 110, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3d24';
    ctx.fillRect(tx + 46, GROUND_Y - 60, 18, 60);
  }
  ctx.fillStyle = '#4a7a2e';
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = '#6a9a3e';
  ctx.fillRect(0, GROUND_Y, VIEW_W, 14);
  ctx.fillStyle = '#e8a33d';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(90 + i * 150, GROUND_Y + 60 + (i % 2) * 30, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGame(ctx, g) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (g.screen === 'title') {
    drawTitle(ctx, g);
    return;
  }
  if (g.screen === 'caught' || g.screen === 'escaped') {
    if (g.screen === 'escaped') {
      drawForest(ctx, g.time);
    } else {
      drawSky(ctx, g.world, g.time);
      drawObstacles(ctx, g.world, g.time);
      drawFarmer(ctx, { ...g.farmer, gap: 70, state: 'chase', legPhase: 0, shout: '', shoutT: 0 }, g.turkey.x, g.time);
      drawTurkey(ctx, { ...g.turkey, legPhase: 0, invuln: 0, sliding: 0 }, g.time);
    }
    drawEnd(ctx, g, g.screen === 'escaped');
    return;
  }
  drawSky(ctx, g.world, g.time);
  drawObstacles(ctx, g.world, g.time);
  // The farmer is drawn with his gap compressed, so he is always in frame
  // chasing the turkey; the HUD bar shows the true distance in metres.
  drawFarmer(ctx, { ...g.farmer, gap: 40 + g.farmer.gap * 0.4 }, g.turkey.x, g.time);
  drawTurkey(ctx, g.turkey, g.time);
  drawHud(ctx, g);
  if (g.screen === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 20, 10, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff8ea';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_W / 2, 330);
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Press P or click II to keep running', VIEW_W / 2, 380);
    ctx.restore();
  }
}
