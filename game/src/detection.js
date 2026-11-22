// The Gilded Hour — cumulative evidence.
// Being seen is not a boolean: evidence grows while a guard or camera holds you
// in its cone, faster up close and dead-centre, slower at the rim, in shadow,
// while sneaking or disguised; it drains the moment you break line of sight.
// The alarm meter shows the highest evidence any observer holds.
import { DETECTION, GUARD } from './config.js';
import { coneSees } from './vision.js';
import { pointInShadow, pointInLight } from './world.js';

function rangeFactor(dist) {
  if (dist < DETECTION.closeRange) return 1.5;
  if (dist < DETECTION.midRange) return 1.0;
  return 0.55;
}

// Every modifier that makes a spot safer or riskier, multiplied together.
function detectionFactor(state) {
  const p = state.player;
  const world = state.world;
  let f = 1;
  if (pointInShadow(p.x, p.y, world.shadows)) f *= DETECTION.shadowFactor;
  if (pointInLight(p.x, p.y, world.lights)) f *= DETECTION.lightFactor;
  if (p.sneaking) f *= DETECTION.sneakFactor;
  if (p.running) f *= DETECTION.runFactor;
  if (p.disguiseTimer > 0) {
    f *= p.carryingMain ? DETECTION.disguiseWithLootFactor : DETECTION.disguiseFactor;
  }
  return f;
}

export function updateDetection(state, dt) {
  const p = state.player;
  const world = state.world;
  let maxEvidence = 0;
  let seenBy = null;

  if (!p.inVent && state.mode === 'play') {
    const factor = detectionFactor(state);
    for (let i = 0; i < state.guards.length; i += 1) {
      const g = state.guards[i];
      const res = coneSees(g.x, g.y, g.angle, g.fov, g.range, p.x, p.y, world.sightBlockers);
      g.seesPlayer = res.seen;
      if (res.seen) {
        const centre = DETECTION.edgeFactor + (1 - DETECTION.edgeFactor) * res.centre;
        const rate = DETECTION.guardBase * rangeFactor(res.dist) * centre * factor;
        g.evidence = Math.min(100, g.evidence + rate * dt);
        g.lastSeen = { x: p.x, y: p.y };
        g.lastSeenTimer = 0;
      } else {
        g.evidence = Math.max(0, g.evidence - DETECTION.decayPerSecond * dt);
      }
      if (g.evidence > maxEvidence) { maxEvidence = g.evidence; seenBy = g.name; }
    }
    for (let i = 0; i < state.cameras.length; i += 1) {
      const c = state.cameras[i];
      if (c.disabledTimer > 0) {
        c.seesPlayer = false;
        c.evidence = Math.max(0, c.evidence - DETECTION.decayPerSecond * dt);
      } else {
        const res = coneSees(c.x, c.y, c.angle, c.fov, c.range, p.x, p.y, world.sightBlockers);
        c.seesPlayer = res.seen;
        if (res.seen) {
          const rate = DETECTION.cameraBase * rangeFactor(res.dist) * factor;
          c.evidence = Math.min(100, c.evidence + rate * dt);
        } else {
          c.evidence = Math.max(0, c.evidence - DETECTION.decayPerSecond * dt);
        }
      }
      if (c.evidence > maxEvidence) { maxEvidence = c.evidence; seenBy = c.name; }
    }
  } else {
    // In the vent, or not playing: every observer's evidence drains.
    for (let i = 0; i < state.guards.length; i += 1) {
      state.guards[i].evidence = Math.max(0, state.guards[i].evidence - DETECTION.decayPerSecond * dt);
    }
    for (let i = 0; i < state.cameras.length; i += 1) {
      state.cameras[i].evidence = Math.max(0, state.cameras[i].evidence - DETECTION.decayPerSecond * dt);
    }
  }
  state.evidence = maxEvidence;
  state.seenBy = seenBy;
}

// A guard walking into the thief is fair only with warning: at full alert it is
// a catch; below that it is a shove, a spike of evidence and a shouted warning.
export function checkContacts(state) {
  if (state.mode !== 'play') return;
  const p = state.player;
  for (let i = 0; i < state.guards.length; i += 1) {
    const g = state.guards[i];
    if (g.bumpCooldown > 0) continue;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < GUARD.catchRadius) {
      if (g.evidence >= DETECTION.alertAt) {
        state.mode = 'caught';
        state.caughtBy = g.name;
        return;
      }
      g.bumpCooldown = 2;
      g.evidence = Math.min(100, g.evidence + DETECTION.contactSpike);
      g.lastSeen = { x: p.x, y: p.y };
      g.lastSeenTimer = 0;
      state.message = g.name + ' bumps into you — "Hey! Who\'s there?"';
      state.messageTimer = 2.5;
      // Shove the thief clear so the bump cannot repeat every frame.
      const push = 34;
      p.x += (dx / Math.max(dist, 1)) * push;
      p.y += (dy / Math.max(dist, 1)) * push;
    }
  }
}
