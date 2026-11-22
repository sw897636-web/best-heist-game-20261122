// The Gilded Hour — the Meridian Gallery, one room, one screen.
// buildWorld() returns plain data: walls, display cases, shadow zones, light pools,
// the vent duct, the exit door, loot spots, guard routes and camera mounts.
// Nothing here moves; the sim in guards.js / cameras.js / player.js moves on top of it.
import { PLAY } from './config.js';

// Walls and display cases block movement and cut vision cones.
export const WALLS = [
  // Outer shell (16 thick).
  { x: 40, y: 56, w: 1200, h: 16 }, // top
  { x: 40, y: 664, w: 1200, h: 16 }, // bottom
  { x: 40, y: 56, w: 16, h: 624 }, // left
  { x: 1224, y: 56, w: 16, h: 624 }, // right
  // Interior walls — the cover that makes the three routes.
  { x: 380, y: 56, w: 16, h: 250 }, // A: upper-left divider, ends at y 306
  { x: 700, y: 520, w: 16, h: 144 }, // B: lower-middle divider, gap above it
  { x: 850, y: 300, w: 250, h: 16 }, // C: upper-right shelf wall
];

export const CASES = [
  { x: 480, y: 180, w: 120, h: 80, label: 'Porcelain' },
  { x: 820, y: 480, w: 120, h: 80, label: 'Jade' },
  { x: 180, y: 420, w: 120, h: 80, label: 'Silver' },
  { x: 940, y: 170, w: 120, h: 70, label: 'Coins' },
];

// Everything that blocks sight: walls plus the tall cases.
export const SIGHT_BLOCKERS = WALLS.concat(CASES);

// Shadow zones: standing here halves how fast evidence grows. Dark means safe.
export const SHADOWS = [
  { x: 56, y: 380, w: 304, h: 284, name: 'Long Shadow' },
  { x: 760, y: 340, w: 90, h: 80, name: 'Alcove' },
  { x: 1060, y: 420, w: 164, h: 244, name: 'East Shadow' },
];

// Warm light pools: standing here grows evidence faster. Light means danger.
export const LIGHTS = [
  { x: 640, y: 220, r: 130, name: 'Mask light' },
  { x: 1020, y: 250, r: 90, name: 'Sapphire light' },
];

// The vent duct: a crawl space along the top wall. Its grate only opens on EMP,
// so it is the tool-gated route. Inside it, no guard or camera can see you.
export const VENT = {
  x: 720, y: 76, w: 360, h: 32,
  entry: { x: 740, y: 92 }, // grate the thief stands under to EMP it open
  exit: { x: 1060, y: 92 }, // drop point, lands at (1060, 132)
  drop: { x: 1060, y: 132 },
};

// The getaway door in the south wall. It opens only once the mask is taken.
export const EXIT = { x: 1120, y: 664, w: 80, h: 16, point: { x: 1160, y: 640 } };

export const SPAWN = { x: 140, y: 620 };

export const LOOT_SPOTS = [
  { id: 'mask', name: 'The Gilded Mask', x: 640, y: 225, value: 5000, main: true },
  { id: 'sapphire', name: 'Star Sapphire', x: 1020, y: 268, value: 2000, main: false },
  { id: 'ledger', name: 'The Ledger of Names', x: 240, y: 530, value: 1500, main: false },
];

export const GUARD_ROUTES = [
  {
    id: 'marlow', name: 'Marlow',
    waypoints: [
      { x: 440, y: 330 }, { x: 800, y: 330 },
      { x: 800, y: 470 }, { x: 440, y: 470 },
    ],
    pauseSeconds: 2.0, fov: 75, range: 260, speed: 55,
  },
  {
    id: 'iris', name: 'Iris',
    // Walked in reverse order on purpose: the two loops cross, so their cones
    // only open a gap together when one of them turns away.
    waypoints: [
      { x: 1150, y: 140 }, { x: 500, y: 140 },
      { x: 500, y: 250 }, { x: 1150, y: 250 },
    ],
    pauseSeconds: 2.5, fov: 70, range: 240, speed: 50,
  },
];

export const CAMERA_MOUNTS = [
  {
    id: 'cam-a', name: 'North-East',
    x: 1224, y: 150, baseAngle: Math.PI, // faces left
    sweep: 0.9, period: 6, fov: 50, range: 300,
  },
  {
    id: 'cam-b', name: 'South-West',
    x: 56, y: 340, baseAngle: 0, // faces right
    sweep: 0.8, period: 7, fov: 55, range: 280,
  },
];

export function buildWorld() {
  return {
    walls: WALLS,
    cases: CASES,
    sightBlockers: SIGHT_BLOCKERS,
    shadows: SHADOWS,
    lights: LIGHTS,
    vent: VENT,
    exit: EXIT,
    spawn: SPAWN,
    lootSpots: LOOT_SPOTS,
    guardRoutes: GUARD_ROUTES,
    cameraMounts: CAMERA_MOUNTS,
    play: PLAY,
  };
}

// --- geometry helpers (shared by movement, vision and detection) ---

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

export function circleHitsAny(cx, cy, radius, rects) {
  for (let i = 0; i < rects.length; i += 1) {
    if (circleHitsRect(cx, cy, radius, rects[i])) return true;
  }
  return false;
}

export function pointInShadow(x, y, shadows) {
  for (let i = 0; i < shadows.length; i += 1) {
    if (pointInRect(x, y, shadows[i])) return true;
  }
  return false;
}

export function pointInLight(x, y, lights) {
  for (let i = 0; i < lights.length; i += 1) {
    const dx = x - lights[i].x;
    const dy = y - lights[i].y;
    if (dx * dx + dy * dy <= lights[i].r * lights[i].r) return true;
  }
  return false;
}
