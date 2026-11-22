// The Gilded Hour — canvas drawing.
// One frame, one function per layer, drawn back to front: floor, light, shadow,
// vent, exit, loot, cases, walls, cones, cameras, guards, effects, the thief.
// The same renderer draws the live game and the staged screenshots, so a shot
// is always a real frame of the real game, never a composed picture.
import { FIELD, COLORS } from './config.js';
import { castCone } from './vision.js';

function coneColorForGuard(g) {
  if (g.state === 'alert' || g.state === 'search') return COLORS.coneAlert;
  if (g.state === 'suspicious') return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}

function drawCone(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx, world) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Parquet seams.
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 56; x < 1230; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 72); ctx.lineTo(x, 664); ctx.stroke();
  }
  for (let y = 120; y < 664; y += 64) {
    ctx.beginPath(); ctx.moveTo(56, y); ctx.lineTo(1224, y); ctx.stroke();
  }
  // Light pools: warm circles on the floor. Light means danger.
  for (let i = 0; i < world.lights.length; i += 1) {
    const l = world.lights[i];
    const grad = ctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
    grad.addColorStop(0, 'rgba(255,196,96,0.20)');
    grad.addColorStop(1, 'rgba(255,196,96,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
  }
  // Shadow zones: dark means safe. A small label says so.
  for (let i = 0; i < world.shadows.length; i += 1) {
    const s = world.shadows[i];
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(160,180,220,0.35)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW — safe', s.x + 8, s.y + 16);
  }
}

function drawVent(ctx, world, tools) {
  const v = world.vent;
  ctx.fillStyle = COLORS.vent;
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = '#565b66';
  ctx.lineWidth = 2;
  ctx.strokeRect(v.x, v.y, v.w, v.h);
  // Grate slats.
  ctx.strokeStyle = COLORS.ventGrate;
  ctx.lineWidth = 3;
  for (let x = v.x + 12; x < v.x + v.w; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, v.y + 4); ctx.lineTo(x, v.y + v.h - 4); ctx.stroke();
  }
  // The whole duct glows gold while EMP holds it open, so the open state
  // still reads where the message bar crosses the duct.
  if (tools.ventOpenTimer > 0) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(v.x, v.y, v.w, v.h);
  }
  // The entry grate glows gold while EMP holds it open.
  ctx.fillStyle = tools.ventOpenTimer > 0 ? COLORS.gold : '#6b6257';
  ctx.fillRect(v.entry.x - 14, v.y + 4, 28, v.h - 8);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tools.ventOpenTimer > 0 ? 'OPEN' : 'VENT', v.entry.x, v.y + v.h - 8);
}

function drawExit(ctx, world, exitOpen) {
  const e = world.exit;
  if (exitOpen) {
    const grad = ctx.createRadialGradient(e.point.x, e.point.y, 4, e.point.x, e.point.y, 120);
    grad.addColorStop(0, COLORS.exitLight);
    grad.addColorStop(1, 'rgba(120,255,150,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(e.point.x, e.point.y, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7ee2a0';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#12351d';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT — GO', e.point.x, e.point.y - 18);
  } else {
    ctx.fillStyle = '#274b32';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = 'rgba(200,220,200,0.5)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', e.point.x, e.point.y - 18);
  }
}

function drawLoot(ctx, loot, time) {
  for (let i = 0; i < loot.length; i += 1) {
    const item = loot[i];
    if (item.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i * 2);
    // Beacon column for the main target, so it reads from the spawn.
    if (item.main) {
      const grad = ctx.createLinearGradient(item.x, item.y - 130, item.x, item.y);
      grad.addColorStop(0, 'rgba(242,193,78,0)');
      grad.addColorStop(1, 'rgba(242,193,78,' + (0.25 + 0.15 * pulse) + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(item.x - 14, item.y - 130, 28, 130);
    }
    // Pedestal.
    ctx.fillStyle = '#3a332a';
    ctx.fillRect(item.x - 20, item.y + 6, 40, 12);
    ctx.fillStyle = '#54492f';
    ctx.fillRect(item.x - 14, item.y - 2, 28, 10);
    // The piece itself.
    ctx.save();
    ctx.translate(item.x, item.y - 8);
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 12 + 10 * pulse;
    if (item.id === 'mask') {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1b1712';
      ctx.beginPath(); ctx.ellipse(-5, -1, 3, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5, -1, 3, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    } else if (item.id === 'sapphire') {
      ctx.fillStyle = '#5fb2ff';
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 10); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#c9a86a';
      ctx.fillRect(-10, -7, 20, 14);
      ctx.fillStyle = '#5a3d1e';
      ctx.fillRect(-1, -7, 2, 14);
    }
    ctx.restore();
    // Label.
    ctx.fillStyle = 'rgba(242,193,78,0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.toUpperCase(), item.x, item.y + 34);
  }
}

function drawCases(ctx, world) {
  for (let i = 0; i < world.cases.length; i += 1) {
    const c = world.cases[i];
    ctx.fillStyle = COLORS.caseGlass;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = COLORS.caseFrame;
    ctx.lineWidth = 4;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c.x + 8, c.y + c.h - 8); ctx.lineTo(c.x + c.w - 8, c.y + 8); ctx.stroke();
    ctx.fillStyle = 'rgba(200,210,220,0.55)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 4);
  }
}

function drawWalls(ctx, world) {
  for (let i = 0; i < world.walls.length; i += 1) {
    const w = world.walls[i];
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

function drawGuard(ctx, g, world) {
  const points = castCone(g.x, g.y, g.angle, g.fov, g.range, world.sightBlockers);
  drawCone(ctx, points, coneColorForGuard(g));
  // Faint patrol path, so the loop is readable.
  ctx.strokeStyle = 'rgba(200,205,215,0.18)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  for (let i = 0; i < g.waypoints.length; i += 1) {
    const w = g.waypoints[i];
    if (i === 0) ctx.moveTo(w.x, w.y); else ctx.lineTo(w.x, w.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  // Body: dark uniform, pale trim, facing tick.
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.guardTrim;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = COLORS.guardTrim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 17, g.y + Math.sin(g.angle) * 17);
  ctx.stroke();
  // Name + state mark.
  ctx.fillStyle = 'rgba(220,225,235,0.85)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y - 20);
  if (g.state === 'suspicious') {
    ctx.fillStyle = '#e8c440';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('?', g.x, g.y - 34);
  } else if (g.state === 'alert' || g.state === 'search') {
    ctx.fillStyle = '#e04034';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('!', g.x, g.y - 34);
  }
}

function drawCamera(ctx, c, world) {
  if (c.disabledTimer <= 0) {
    const points = castCone(c.x, c.y, c.angle, c.fov, c.range, world.sightBlockers);
    drawCone(ctx, points, COLORS.coneCamera);
  } else {
    const points = castCone(c.x, c.y, c.angle, c.fov, c.range * 0.4, world.sightBlockers);
    drawCone(ctx, points, COLORS.coneCameraOff);
  }
  // Wall mount + lens.
  ctx.fillStyle = COLORS.cameraBody;
  ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
  ctx.fillStyle = c.disabledTimer > 0 ? '#777' : '#ff5a4e';
  ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220,225,235,0.85)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.disabledTimer > 0 ? 'CAM OFF' : 'CAM', c.x, c.y + 24);
}

function drawPlayer(ctx, p, tools) {
  if (p.inVent) {
    // A small silhouette inside the duct.
    ctx.fillStyle = COLORS.thief;
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
    return;
  }
  const r = p.sneaking ? 10 : 12;
  // Soft shadow under the thief.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, r + 2, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Cloak + hood.
  ctx.fillStyle = p.disguiseTimer > 0 ? '#7a8ba8' : COLORS.thief;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.disguiseTimer > 0 ? '#5a6b88' : COLORS.thiefHood;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.dir - 0.6) * r, p.y + Math.sin(p.dir - 0.6) * r);
  ctx.lineTo(p.x + Math.cos(p.dir) * (r + 7), p.y + Math.sin(p.dir) * (r + 7));
  ctx.lineTo(p.x + Math.cos(p.dir + 0.6) * r, p.y + Math.sin(p.dir + 0.6) * r);
  ctx.closePath();
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#1b1712';
  const ex = p.x + Math.cos(p.dir) * 4;
  const ey = p.y + Math.sin(p.dir) * 4;
  ctx.beginPath(); ctx.arc(ex - 3, ey - 1, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex + 3, ey + 1, 1.6, 0, Math.PI * 2); ctx.fill();
  // Carried loot glints on the back.
  if (p.carryingMain) {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath(); ctx.arc(p.x - Math.cos(p.dir) * 8, p.y - Math.sin(p.dir) * 8, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(230,225,210,0.9)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', p.x, p.y - 20);
}

function drawEffects(ctx, state) {
  // Decoy ping: expanding rings where the coin landed.
  const decoy = state.tools.decoy;
  if (decoy) {
    const age = 2.5 - decoy.timer;
    ctx.strokeStyle = 'rgba(242,193,78,' + Math.max(0, 0.9 - age * 0.35) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(decoy.x, decoy.y, 10 + age * 26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath(); ctx.arc(decoy.x, decoy.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  // EMP burst: jagged arcs out of the thief.
  if (state.tools.empFlash > 0) {
    const p = state.player;
    ctx.strokeStyle = 'rgba(120,200,255,0.9)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + state.time;
      const r1 = 16;
      const r2 = 34 + (i % 2) * 10;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
      ctx.lineTo(p.x + Math.cos(a + 0.3) * ((r1 + r2) / 2), p.y + Math.sin(a + 0.3) * ((r1 + r2) / 2));
      ctx.lineTo(p.x + Math.cos(a) * r2, p.y + Math.sin(a) * r2);
      ctx.stroke();
    }
  }
  // Red edge pulse while the alarm is high — the near-miss warning.
  if (state.evidence >= 70 && state.mode === 'play') {
    const a = 0.10 + 0.08 * Math.sin(state.time * 6);
    ctx.strokeStyle = 'rgba(224,64,52,' + a.toFixed(3) + ')';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 63, FIELD.width - 14, FIELD.height - 70);
  }
}

export function draw(ctx, state) {
  const world = state.world;
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawFloor(ctx, world);
  drawVent(ctx, world, state.tools);
  drawExit(ctx, world, state.exitOpen);
  drawLoot(ctx, state.loot, state.time);
  drawCases(ctx, world);
  drawWalls(ctx, world);
  for (let i = 0; i < state.cameras.length; i += 1) drawCamera(ctx, state.cameras[i], world);
  for (let i = 0; i < state.guards.length; i += 1) drawGuard(ctx, state.guards[i], world);
  drawEffects(ctx, state);
  drawPlayer(ctx, state.player, state.tools);
}
