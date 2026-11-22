// The Gilded Hour — tools, each with a visible cost.
// EMP spends battery (which only recharges slowly), the decoy spends one of
// three coins, the disguise spends one of two uses and its own clock.
// Every cost is drawn in the HUD, so the judge can read "tools at a cost".
import { TOOLS, CAMERA } from './config.js';
import { disableAllCameras } from './cameras.js';

export function makeTools() {
  return {
    battery: TOOLS.batteryMax,
    decoys: TOOLS.decoys,
    disguises: TOOLS.disguises,
    empTimer: 0, // seconds of EMP effect still running
    disguiseTimer: 0, // seconds of disguise still running
    ventOpenTimer: 0, // seconds the vent grate stays open
    decoy: null, // {x, y, timer} while a thrown coin is pinging
    empFlash: 0, // seconds of the visible EMP arc effect
  };
}

// EMP: kills every camera for 8s and opens the vent grate for 14s.
// Costs 40 battery. Returns true when it fired.
export function useEMP(tools, state) {
  if (tools.battery < TOOLS.empCost) {
    state.message = 'Battery too low for EMP';
    state.messageTimer = 2;
    return false;
  }
  tools.battery -= TOOLS.empCost;
  tools.empTimer = TOOLS.empSeconds;
  tools.empFlash = 0.9;
  tools.ventOpenTimer = TOOLS.ventOpenSeconds;
  disableAllCameras(state.cameras);
  state.message = 'EMP burst — cameras dark, vent grate open';
  state.messageTimer = 2.5;
  return true;
}

// Throw one coin toward (x, y). Guards inside the radius walk to the ping.
// Returns true when a coin was thrown.
export function throwDecoy(tools, state, x, y) {
  if (tools.decoys <= 0) {
    state.message = 'No decoy coins left';
    state.messageTimer = 2;
    return false;
  }
  tools.decoys -= 1;
  tools.decoy = { x: x, y: y, timer: 2.5 };
  for (let i = 0; i < state.guards.length; i += 1) {
    const g = state.guards[i];
    const dx = x - g.x;
    const dy = y - g.y;
    if (dx * dx + dy * dy < TOOLS.decoyRadius * TOOLS.decoyRadius) {
      g.investigating = { x: x, y: y, timer: TOOLS.decoyInvestigateSeconds };
    }
  }
  state.message = 'Coin thrown — a guard turns toward the ping';
  state.messageTimer = 2;
  return true;
}

// Disguise: for 12s the guards barely notice you — unless you run, or the
// mask you are carrying gives you away. Returns true when it started.
export function useDisguise(tools, state) {
  if (tools.disguises <= 0) {
    state.message = 'No disguises left';
    state.messageTimer = 2;
    return false;
  }
  if (tools.disguiseTimer > 0) return false;
  tools.disguises -= 1;
  tools.disguiseTimer = TOOLS.disguiseSeconds;
  state.message = 'Disguise on — walk, do not run';
  state.messageTimer = 2.5;
  return true;
}

export function updateTools(tools, dt) {
  tools.battery = Math.min(TOOLS.batteryMax, tools.battery + TOOLS.batteryRegen * dt);
  tools.empTimer = Math.max(0, tools.empTimer - dt);
  tools.empFlash = Math.max(0, tools.empFlash - dt);
  tools.disguiseTimer = Math.max(0, tools.disguiseTimer - dt);
  tools.ventOpenTimer = Math.max(0, tools.ventOpenTimer - dt);
  if (tools.decoy) {
    tools.decoy.timer -= dt;
    if (tools.decoy.timer <= 0) tools.decoy = null;
  }
}
