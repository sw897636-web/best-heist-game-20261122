// The Gilded Hour — the game itself.
// A thief, Wren, crosses the Meridian Gallery after dark, takes the Gilded
// Mask and slips out the south door. Two guards walk fixed loops with pauses,
// two cameras sweep the room, and one meter — the alarm — watches it all.
// Dark is safe, warm light is watched, and the meter always drains again.
//
// Controls: WASD / arrows move, Shift sneak, Space run, E EMP, click throws a
// decoy coin, F disguise, R restart, P pause, Enter starts.
// Screenshots: ?shot=cover|tools|tension|getaway stages a frozen frame.
import { FIELD } from './config.js';
import { buildWorld } from './world.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { updateDetection, checkContacts } from './detection.js';
import { updateAlarm } from './alarm.js';
import { makeTools, useEMP, throwDecoy, useDisguise, updateTools } from './tools.js';
import { makeLoot, tryPickup } from './loot.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeInput } from './input.js';
import { draw } from './render.js';
import { drawHUD } from './hud.js';
import { stageShot } from './shots.js';
import { TOOLS } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function createState() {
  const world = buildWorld();
  return {
    world: world,
    mode: 'title',
    time: 0,
    elapsed: 0,
    score: 0,
    player: makePlayer(world.spawn.x, world.spawn.y),
    guards: world.guardRoutes.map(makeGuard),
    cameras: world.cameraMounts.map(makeCamera),
    loot: makeLoot(),
    tools: makeTools(),
    evidence: 0,
    alarm: 'calm',
    lockdown: false,
    seenBy: null,
    exitOpen: false,
    caughtBy: null,
    message: '',
    messageTimer: 0,
    shot: null,
  };
}

let state = createState();
const input = makeInput(canvas);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  stageShot(shotName, state);
  state.shot = shotName;
}

function reset() {
  state = createState();
  state.mode = 'play';
}

function update(dt) {
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;

  if (state.mode === 'title') {
    // A living diorama behind the title: the guards walk, the cameras sweep.
    for (let i = 0; i < state.guards.length; i += 1) updateGuard(state.guards[i], dt, state);
    for (let i = 0; i < state.cameras.length; i += 1) updateCamera(state.cameras[i], dt, state.time);
    if (input.consumeKey('Enter') || input.consumeClick()) state.mode = 'play';
    return;
  }

  if (state.mode === 'paused') {
    if (input.consumeKey('KeyP') || input.consumeKey('Escape')) state.mode = 'play';
    return;
  }

  if (state.mode === 'win' || state.mode === 'caught') {
    if (input.consumeKey('KeyR')) reset();
    return;
  }

  // mode === 'play'
  state.elapsed += dt;

  if (input.consumeKey('KeyR')) { reset(); return; }
  if (input.consumeKey('KeyP') || input.consumeKey('Escape')) { state.mode = 'paused'; return; }
  if (input.consumeKey('KeyE')) useEMP(state.tools, state);
  if (input.consumeKey('KeyF')) useDisguise(state.tools, state);
  const click = input.consumeClick();
  if (click) {
    // The decoy flies at most TOOLS.decoyThrowRange from the thief.
    const dx = click.x - state.player.x;
    const dy = click.y - state.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const reach = Math.min(dist, TOOLS.decoyThrowRange);
    const tx = dist > 0.001 ? state.player.x + (dx / dist) * reach : state.player.x + reach;
    const ty = dist > 0.001 ? state.player.y + (dy / dist) * reach : state.player.y;
    throwDecoy(state.tools, state, tx, ty);
  }

  updatePlayer(state.player, input, dt, state.world, state.tools, state);
  for (let i = 0; i < state.guards.length; i += 1) updateGuard(state.guards[i], dt, state);
  for (let i = 0; i < state.cameras.length; i += 1) updateCamera(state.cameras[i], dt, state.time);
  updateTools(state.tools, dt);
  updateDetection(state, dt);
  updateAlarm(state);
  tryPickup(state.loot, state.player, state);
  checkContacts(state);

  // Getaway: the mask is taken and the thief reaches the open south door.
  if (state.exitOpen && state.mode === 'play') {
    const dx = state.player.x - state.world.exit.point.x;
    const dy = state.player.y - state.world.exit.point.y;
    if (dx * dx + dy * dy < 34 * 34) {
      state.mode = 'win';
      state.score += Math.max(0, 2000 - Math.round(state.elapsed) * 10);
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // A staged screenshot never advances: the frame is frozen and identical
  // on every run, so the same URL always gives the same picture.
  if (!state.shot) update(dt);
  draw(ctx, state);
  drawHUD(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
