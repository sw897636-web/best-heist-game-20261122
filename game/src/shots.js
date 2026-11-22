// The Gilded Hour — deterministic screenshot scenes.
// Each shot places the thief, the guards, the cameras and the loot at explicit
// positions and angles, then the real renderer draws the frame. No pixel is
// composed or borrowed: the frame is what the game looks like at that moment.
// ?shot=cover|tools|tension|getaway, with &seed=1 kept for the file name.

function poseGuard(g, x, y, angle, guardState, evidence) {
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.state = guardState;
  g.evidence = evidence;
  g.pauseTimer = 0;
  g.investigating = null;
  g.lastSeen = { x: 640, y: 225 };
  g.lastSeenTimer = 0;
}

function poseCamera(c, angle, disabledTimer) {
  c.angle = angle;
  c.disabledTimer = disabledTimer;
  c.evidence = 0;
  c.seesPlayer = false;
}

// The cover: one frame, all five elements — the thief crossing the room, a
// guard with a vision cone, a sweeping camera, the glowing loot target and
// the alarm meter (drawn by the HUD, here a third full and suspicious).
export function stageCover(state) {
  state.mode = 'play';
  state.time = 12;
  state.evidence = 35;
  state.alarm = 'suspicious';
  state.seenBy = 'Iris';
  state.player.x = 520;
  state.player.y = 470;
  state.player.dir = -1.2;
  state.player.sneaking = true;
  poseGuard(state.guards[0], 620, 380, -1.1, 'patrol', 10);
  poseGuard(state.guards[1], 900, 200, 2.2, 'suspicious', 35);
  poseCamera(state.cameras[0], 2.6, 0);
  poseCamera(state.cameras[1], 0.3, 0);
  state.tools.battery = 100;
  state.tools.decoys = 3;
  state.tools.disguises = 2;
  state.message = '';
  state.messageTimer = 0;
}

// Tools in use, with their costs on screen: the EMP arcs out of the thief,
// both cameras are dark and grey, the vent grate stands open gold, and a
// decoy coin pings while Marlow turns toward it.
export function stageTools(state) {
  state.mode = 'play';
  state.time = 24;
  state.evidence = 18;
  state.alarm = 'calm';
  state.seenBy = null;
  state.player.x = 740;
  state.player.y = 150;
  state.player.dir = -Math.PI / 2;
  state.player.sneaking = false;
  const marlow = state.guards[0];
  poseGuard(marlow, 830, 430, -1.2, 'patrol', 5);
  marlow.investigating = { x: 880, y: 300, timer: 5 };
  marlow.angle = -1.2;
  poseGuard(state.guards[1], 1000, 250, 0.5, 'patrol', 0);
  poseCamera(state.cameras[0], 2.9, 6);
  poseCamera(state.cameras[1], 0.1, 6);
  state.tools.battery = 60;
  state.tools.decoys = 2;
  state.tools.disguises = 2;
  state.tools.empTimer = 6;
  state.tools.empFlash = 0.9;
  state.tools.ventOpenTimer = 12;
  state.tools.decoy = { x: 880, y: 300, timer: 2.2 };
  state.message = 'EMP burst — cameras dark, vent grate open';
  state.messageTimer = 99;
}

// The tense moment: a red cone, a full-looking meter, the thief flat in the
// shadow with the camera sweeping across. The meter can still drain —
// the game never ends on a single spot.
export function stageTension(state) {
  state.mode = 'play';
  state.time = 36;
  state.evidence = 82;
  state.alarm = 'alert';
  state.seenBy = 'Marlow';
  state.player.x = 160;
  state.player.y = 540;
  state.player.dir = 0.4;
  state.player.sneaking = true;
  const marlow = state.guards[0];
  poseGuard(marlow, 280, 380, 2.21, 'alert', 82);
  marlow.lastSeen = { x: 160, y: 540 };
  marlow.lastSeenTimer = 0;
  poseGuard(state.guards[1], 500, 300, 2.8, 'suspicious', 45);
  poseCamera(state.cameras[0], 3.4, 0);
  poseCamera(state.cameras[1], 0.61, 0);
  state.tools.battery = 60;
  state.tools.decoys = 1;
  state.tools.disguises = 0;
  state.message = 'SPOTTED — break line of sight!';
  state.messageTimer = 99;
}

// The getaway: the mask and the sapphire are pocketed, the south door stands
// open in green light, and the score screen says what the run was worth.
export function stageGetaway(state) {
  state.mode = 'win';
  state.time = 48;
  state.evidence = 12;
  state.alarm = 'calm';
  state.seenBy = null;
  state.elapsed = 96;
  state.loot[0].taken = true; // the mask
  state.loot[1].taken = true; // the sapphire
  state.player.carryingMain = true;
  state.score = 7000;
  state.exitOpen = true;
  state.player.x = 1150;
  state.player.y = 620;
  state.player.dir = -Math.PI / 2;
  poseGuard(state.guards[0], 800, 470, -1.6, 'patrol', 0);
  poseGuard(state.guards[1], 500, 250, 0.4, 'patrol', 0);
  poseCamera(state.cameras[0], 3.0, 0);
  poseCamera(state.cameras[1], 0.2, 0);
  state.tools.battery = 78;
  state.tools.decoys = 1;
  state.tools.disguises = 1;
  state.message = '';
  state.messageTimer = 0;
}

// Stage the named scene on a fresh state. Unknown names fall back to the cover.
export function stageShot(name, state) {
  if (name === 'tools') stageTools(state);
  else if (name === 'tension') stageTension(state);
  else if (name === 'getaway') stageGetaway(state);
  else stageCover(state);
  return state;
}
