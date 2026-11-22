// The Gilded Hour — wall cameras.
// A camera sweeps its cone back and forth on a fixed period, so its sweep is
// readable and its blind moment is predictable. EMP freezes it grey for 8s.
// A camera never chases; it only watches, and its evidence feeds the same meter.
import { CAMERA } from './config.js';

export function makeCamera(mount) {
  return {
    id: mount.id,
    name: mount.name,
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep, // half-angle of the sweep, radians
    period: mount.period, // seconds per full sweep cycle
    fov: mount.fov,
    range: mount.range,
    angle: mount.baseAngle,
    disabledTimer: 0,
    evidence: 0,
    seesPlayer: false,
  };
}

export function updateCamera(cam, dt, time) {
  if (cam.disabledTimer > 0) {
    cam.disabledTimer -= dt;
    return; // frozen where it was, cone grey
  }
  // Smooth sine sweep: the cone slows at each end, so the turn is fair.
  cam.angle = cam.baseAngle + cam.sweep * Math.sin((2 * Math.PI * time) / cam.period);
}

export function disableAllCameras(cameras) {
  for (let i = 0; i < cameras.length; i += 1) {
    cameras[i].disabledTimer = CAMERA.disabledSeconds;
  }
}
