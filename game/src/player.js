// The Gilded Hour — the thief, Wren.
// Walk is the default. Hold Shift to sneak (slow, quiet). Hold Space to run
// (fast, loud, and it blows a disguise). The vent is a crawl: EMP its grate
// open, press E beneath it to climb in, crawl left or right, drop out the ends.
import { PLAYER } from './config.js';
import { circleHitsAny } from './world.js';

export function makePlayer(x, y) {
  return {
    x: x,
    y: y,
    dir: -Math.PI / 2, // facing up at spawn
    sneaking: false,
    running: false,
    moving: false,
    inVent: false,
    disguiseTimer: 0, // mirrored from tools for the render + detection
    carryingMain: false,
  };
}

function tryMove(p, dx, dy, world) {
  const solids = world.walls.concat(world.cases);
  const nx = p.x + dx;
  if (!circleHitsAny(nx, p.y, PLAYER.radius, solids)) p.x = nx;
  const ny = p.y + dy;
  if (!circleHitsAny(p.x, ny, PLAYER.radius, solids)) p.y = ny;
  p.x = Math.max(world.play.left + PLAYER.radius, Math.min(world.play.right - PLAYER.radius, p.x));
  p.y = Math.max(world.play.top + PLAYER.radius, Math.min(world.play.bottom - PLAYER.radius, p.y));
}

export function updatePlayer(p, input, dt, world, tools, state) {
  p.disguiseTimer = tools.disguiseTimer;

  if (p.inVent) {
    // Crawl the duct: left and right only, fast, unseen.
    let mx = 0;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) mx -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) mx += 1;
    p.x += mx * PLAYER.ventSpeed * dt;
    p.y = world.vent.entry.y;
    if (p.x <= world.vent.entry.x + 4) {
      p.inVent = false;
      p.x = world.vent.entry.x;
      p.y = world.vent.entry.y + 52;
    } else if (p.x >= world.vent.exit.x - 4) {
      p.inVent = false;
      p.x = world.vent.drop.x;
      p.y = world.vent.drop.y;
    }
    return;
  }

  let mx = 0;
  let my = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) mx -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) mx += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) my -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) my += 1;
  p.moving = mx !== 0 || my !== 0;
  p.sneaking = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  p.running = (input.keys.has('Space')) && p.moving && !p.sneaking;

  if (p.running && p.disguiseTimer > 0) {
    tools.disguiseTimer = 0;
    p.disguiseTimer = 0;
    state.message = 'Running blows the disguise';
    state.messageTimer = 2;
  }

  if (p.moving) {
    const len = Math.sqrt(mx * mx + my * my);
    const speed = p.sneaking ? PLAYER.sneakSpeed : p.running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const vx = (mx / len) * speed * dt;
    const vy = (my / len) * speed * dt;
    p.dir = Math.atan2(my, mx);
    tryMove(p, vx, vy, world);
  }

  // Climb into the vent: stand under the open grate and hold W (up).
  // E stays the EMP key, so the two never fight over one press.
  if (tools.ventOpenTimer > 0 && (input.keys.has('KeyW') || input.keys.has('ArrowUp'))) {
    const dx = p.x - world.vent.entry.x;
    const dy = p.y - world.vent.entry.y;
    if (dx * dx + dy * dy < 60 * 60) {
      p.inVent = true;
      p.x = world.vent.entry.x;
      p.y = world.vent.entry.y;
      state.message = 'In the duct — crawl right to the sapphire, left to climb out';
      state.messageTimer = 3;
    }
  }
}
