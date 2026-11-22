// The Gilded Hour — the alarm meter.
// calm -> suspicious -> alert -> lockdown, and back down again: the alarm can
// always recover, so a mistake costs time and nerve, not the run.
// Lockdown latches at full meter: patrols speed up and cameras pin their lanes.
// It releases only once the meter drains below the release line.
import { DETECTION } from './config.js';

export function alarmLevel(evidence, lockdown) {
  if (lockdown) return 'lockdown';
  if (evidence >= DETECTION.alertAt) return 'alert';
  if (evidence >= DETECTION.suspiciousAt) return 'suspicious';
  return 'calm';
}

export function updateAlarm(state) {
  if (!state.lockdown && state.evidence >= DETECTION.lockdownAt) {
    state.lockdown = true;
    state.message = 'LOCKDOWN — patrols doubled, cameras pinned to their lanes';
    state.messageTimer = 4;
  } else if (state.lockdown && state.evidence < DETECTION.lockdownReleaseAt) {
    state.lockdown = false;
    state.message = 'Lockdown lifted — the room breathes again';
    state.messageTimer = 3;
  }
  state.alarm = alarmLevel(state.evidence, state.lockdown);
}
