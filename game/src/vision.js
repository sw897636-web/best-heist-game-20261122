// The Gilded Hour — vision cones.
// A cone is cast as rays; each ray stops at the first wall or case it meets, so
// cover visibly cuts the cone. Nothing here is random.
import { SIGHT_BLOCKERS } from './world.js';

// Distance along the ray (ox,oy) + t*(dx,dy) where it first enters rect r, or null.
function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return null;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return null;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

// Distance from (ox,oy) along unit direction (dx,dy) to the nearest blocker,
// capped at maxDist. The origin itself is never inside a blocker.
export function rayHit(ox, oy, dx, dy, maxDist, blockers) {
  const list = blockers || SIGHT_BLOCKERS;
  let best = maxDist;
  for (let i = 0; i < list.length; i += 1) {
    const t = rayRect(ox, oy, dx, dy, list[i]);
    if (t !== null && t < best && t > 0.001) best = t;
  }
  return best;
}

// The cone polygon: the origin plus one point per ray across the field of view.
// fovDeg is the full angle in degrees, angle is the centre direction in radians.
export function castCone(ox, oy, angle, fovDeg, range, blockers, rays) {
  const count = rays || 26;
  const half = (fovDeg * Math.PI) / 360;
  const points = [{ x: ox, y: oy }];
  for (let i = 0; i <= count; i += 1) {
    const a = angle - half + (2 * half * i) / count;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = rayHit(ox, oy, dx, dy, range, blockers);
    points.push({ x: ox + dx * d, y: oy + dy * d });
  }
  return points;
}

// True when the segment from (x1,y1) to (x2,y2) is cut by any blocker.
export function lineBlocked(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-6) return false;
  const hit = rayHit(x1, y1, dx / len, dy / len, len, blockers);
  return hit < len - 0.5;
}

// True when point (x,y) lies inside the cone and nothing blocks the view to it.
// Returns an object so the caller can scale evidence by closeness and centring:
// { seen, dist, centre } where centre is 1 at the cone axis, 0 at the rim.
export function coneSees(ox, oy, angle, fovDeg, range, x, y, blockers) {
  const dx = x - ox;
  const dy = y - oy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return { seen: false, dist: dist, centre: 0 };
  let da = Math.atan2(dy, dx) - angle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  const half = (fovDeg * Math.PI) / 360;
  if (Math.abs(da) > half) return { seen: false, dist: dist, centre: 0 };
  if (lineBlocked(ox, oy, x, y, blockers)) return { seen: false, dist: dist, centre: 0 };
  return { seen: true, dist: dist, centre: 1 - Math.abs(da) / half };
}
