// The Gilded Hour — configuration.
// Every number the game balances on lives here, so the design reads in one place.
// No state, no randomness, no imports.
export const FIELD = { width: 1280, height: 720 };
export const HUD_HEIGHT = 56;
export const PLAY = { left: 48, top: 64, right: 1232, bottom: 676 };

export const PLAYER = {
  radius: 12,
  walkSpeed: 175,
  sneakSpeed: 95,
  runSpeed: 245,
  ventSpeed: 210,
};

export const DETECTION = {
  guardBase: 46, // evidence per second, dead-centre, close, standing in light
  cameraBase: 32,
  closeRange: 110, // inside this, evidence grows 1.5x
  midRange: 210, // inside this, 1.0x; beyond it (cone edge), 0.55x
  edgeFactor: 0.55, // target near the cone rim is seen slowly
  centreFactor: 1.0,
  shadowFactor: 0.5, // standing in shadow halves the growth
  lightFactor: 1.3, // standing in a warm light pool grows it faster
  sneakFactor: 0.7,
  runFactor: 2.0,
  disguiseFactor: 0.4,
  disguiseWithLootFactor: 0.7,
  decayPerSecond: 26, // evidence drains this fast once unseen
  suspiciousAt: 30,
  alertAt: 70,
  lockdownAt: 100,
  lockdownReleaseAt: 40,
  contactSpike: 25, // a guard bumping you while calm adds this much evidence
};

export const GUARD = {
  patrolSpeed: 55,
  chaseSpeed: 130,
  searchSpeed: 82,
  lockdownSpeedBonus: 22,
  catchRadius: 27,
  searchSeconds: 3.5,
  suspiciousSeconds: 2.2,
};

export const CAMERA = {
  disabledSeconds: 8, // EMP kills every camera for this long
};

export const TOOLS = {
  batteryMax: 100,
  empCost: 40,
  empSeconds: 8,
  batteryRegen: 4, // per second
  decoys: 3,
  decoyRadius: 330, // guards inside this hear the ping and investigate
  decoyThrowRange: 240,
  decoyInvestigateSeconds: 6,
  disguises: 2,
  disguiseSeconds: 12,
  ventOpenSeconds: 14, // EMP opens the vent grate for this long
};

export const LOOT = {
  maskValue: 5000,
  sapphireValue: 2000,
  ledgerValue: 1500,
};

export const COLORS = {
  floor: '#1b1712',
  floorLine: '#262019',
  wall: '#2f2a23',
  wallTrim: '#8a6d3b',
  caseGlass: 'rgba(127,179,200,0.16)',
  caseFrame: '#4a4238',
  shadow: 'rgba(6,9,26,0.58)',
  lightPool: 'rgba(255,190,90,0.13)',
  gold: '#f2c14e',
  goldDim: '#a8823a',
  guardBody: '#33415e',
  guardTrim: '#c8ccd4',
  cameraBody: '#3a3f47',
  thief: '#d8d3c3',
  thiefHood: '#8f887a',
  coneCalm: 'rgba(86,205,130,0.20)',
  coneSuspicious: 'rgba(232,196,64,0.26)',
  coneAlert: 'rgba(224,64,52,0.30)',
  coneCamera: 'rgba(120,170,255,0.20)',
  coneCameraOff: 'rgba(120,120,120,0.10)',
  vent: '#3d4148',
  ventGrate: '#23262c',
  exitDoor: '#1f4d2e',
  exitLight: 'rgba(120,255,150,0.20)',
};
