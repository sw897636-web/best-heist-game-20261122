// The Gilded Hour — guards.
// A guard walks a fixed loop and pauses at every waypoint, so a patient thief
// can read the cones and move in the gaps. The state machine is
// patrol -> suspicious -> alert -> search -> patrol, and it can always recover:
// an alarm is a setback, never an instant loss.
// The cone colour and the ? / ! above the head always show the current state.
import { GUARD, DETECTION } from './config.js';
import { circleHitsAny } from './world.js';

export function makeGuard(route) {
  const start = route.waypoints[0];
  return {
    id: route.id,
    name: route.name,
    x: start.x,
    y: start.y,
    angle: 0,
    wpIndex: 1,
    pauseTimer: 0,
    scanPhase: 0,
    state: 'patrol',
    stateTimer: 0,
    evidence: 0,
    lastSeen: null,
    lastSeenTimer: 0,
    speed: route.speed,
    fov: route.fov,
    range: route.range,
    pauseSeconds: route.pauseSeconds,
    waypoints: route.waypoints,
    investigating: null, // a decoy ping point {x, y, timer}
    seesPlayer: false,
    bumpCooldown: 0,
  };
}

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function turnToward(g, target, dt, rate) {
  let da = target - g.angle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  const step = Math.max(-rate * dt, Math.min(rate * dt, da));
  g.angle += step;
}

// Axis-separated move with wall slide, so a chasing guard never clips a wall.
function moveGuard(g, dx, dy, world) {
  const solids = world.walls.concat(world.cases);
  const nx = g.x + dx;
  if (!circleHitsAny(nx, g.y, 13, solids)) g.x = nx;
  const ny = g.y + dy;
  if (!circleHitsAny(g.x, ny, 13, solids)) g.y = ny;
}

export function updateGuard(g, dt, state) {
  const world = state.world;
  const player = state.player;
  const speedBonus = state.lockdown ? GUARD.lockdownSpeedBonus : 0;
  g.bumpCooldown = Math.max(0, g.bumpCooldown - dt);
  g.lastSeenTimer += dt;

  // Evidence drives the state; the sim in detection.js writes g.evidence.
  if (g.state === 'patrol' && g.evidence >= DETECTION.alertAt) {
    g.state = 'alert';
    g.stateTimer = 0;
  } else if (g.state === 'patrol' && g.evidence >= DETECTION.suspiciousAt) {
    g.state = 'suspicious';
    g.stateTimer = GUARD.suspiciousSeconds;
  } else if (g.state === 'suspicious' && g.evidence >= DETECTION.alertAt) {
    g.state = 'alert';
    g.stateTimer = 0;
  } else if (g.state === 'suspicious') {
    g.stateTimer -= dt;
    if (g.stateTimer <= 0 && g.evidence < DETECTION.suspiciousAt) {
      g.state = 'patrol';
    }
  } else if (g.state === 'alert' && g.lastSeenTimer > 1.5) {
    g.state = 'search';
    g.stateTimer = GUARD.searchSeconds;
  } else if (g.state === 'search') {
    g.stateTimer -= dt;
    if (g.stateTimer <= 0) {
      g.state = 'patrol';
      g.evidence = Math.min(g.evidence, DETECTION.suspiciousAt * 0.5);
    }
  }

  // A decoy ping overrides the patrol: walk to the noise, look, walk back.
  if (g.investigating) {
    const target = g.investigating;
    target.timer -= dt;
    const dx = target.x - g.x;
    const dy = target.y - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8 || target.timer <= 0) {
      if (target.timer <= 0) g.investigating = null;
      else { g.pauseTimer = 1.2; g.investigating = null; }
    } else {
      turnToward(g, angleTo(g.x, g.y, target.x, target.y), dt, 6);
      moveGuard(g, (dx / dist) * g.speed * dt, (dy / dist) * g.speed * dt, world);
    }
    return;
  }

  if (g.state === 'patrol') {
    if (g.pauseTimer > 0) {
      // Paused at a waypoint: sweep the cone slowly, so the gap opens and shuts.
      g.pauseTimer -= dt;
      g.scanPhase += dt;
      const base = angleTo(g.x, g.y, g.waypoints[g.wpIndex].x, g.waypoints[g.wpIndex].y);
      g.angle = base + Math.sin(g.scanPhase * 1.4) * 0.7;
      if (g.pauseTimer <= 0) g.scanPhase = 0;
      return;
    }
    const wp = g.waypoints[g.wpIndex];
    const dx = wp.x - g.x;
    const dy = wp.y - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      g.pauseTimer = g.pauseSeconds;
      g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
      return;
    }
    turnToward(g, angleTo(g.x, g.y, wp.x, wp.y), dt, 8);
    moveGuard(g, (dx / dist) * g.speed * dt, (dy / dist) * g.speed * dt, world);
  } else if (g.state === 'suspicious') {
    // Stand, face where the thief was last seen, and listen.
    if (g.lastSeen) turnToward(g, angleTo(g.x, g.y, g.lastSeen.x, g.lastSeen.y), dt, 4);
  } else if (g.state === 'alert') {
    // Chase the thief's last seen position at full speed.
    const tx = player.x;
    const ty = player.y;
    const dx = tx - g.x;
    const dy = ty - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 4) {
      turnToward(g, angleTo(g.x, g.y, tx, ty), dt, 8);
      const sp = GUARD.chaseSpeed + speedBonus;
      moveGuard(g, (dx / dist) * sp * dt, (dy / dist) * sp * dt, world);
    }
  } else if (g.state === 'search') {
    // Walk to the last seen spot, then look around.
    if (g.lastSeen) {
      const dx = g.lastSeen.x - g.x;
      const dy = g.lastSeen.y - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        turnToward(g, angleTo(g.x, g.y, g.lastSeen.x, g.lastSeen.y), dt, 6);
        const sp = GUARD.searchSpeed + speedBonus;
        moveGuard(g, (dx / dist) * sp * dt, (dy / dist) * sp * dt, world);
      } else {
        g.angle += dt * 2.2; // sweep the room
      }
    }
  }
}
