// The Gilded Hour — the HUD and the screens.
// The top bar carries the alarm meter, the objective and the score; the bottom
// bar carries the tools with their visible costs and the controls. The title,
// getaway and caught screens are drawn over the room, never as separate pages,
// so the game is always one screen of canvas.
import { FIELD, COLORS, DETECTION } from './config.js';
import { ROUTES } from './routes.js';
import { lootTakenCount } from './loot.js';

function alarmColor(level) {
  if (level === 'lockdown') return '#e04034';
  if (level === 'alert') return '#e04034';
  if (level === 'suspicious') return '#e8c440';
  return '#56cd82';
}

function alarmLabel(level) {
  if (level === 'lockdown') return 'LOCKDOWN';
  if (level === 'alert') return 'ALERT';
  if (level === 'suspicious') return 'SUSPICIOUS';
  return 'CALM';
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#100d0a';
  ctx.fillRect(0, 0, FIELD.width, 56);
  ctx.strokeStyle = '#3a2f1e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 56); ctx.lineTo(FIELD.width, 56); ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('THE GILDED HOUR', 16, 36);

  // Alarm meter: the one number the whole room watches.
  const bx = 300;
  const bw = 340;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('ALARM', bx, 24);
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(bx + 78, 10, bw, 20);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(bx + 78, 10, Math.max(0, Math.min(1, state.evidence / 100)) * bw, 20);
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 78.5, 10.5, bw, 20);
  // Tick marks at the suspicious and alert lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.moveTo(bx + 78 + bw * 0.3, 10); ctx.lineTo(bx + 78 + bw * 0.3, 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 78 + bw * 0.7, 10); ctx.lineTo(bx + 78 + bw * 0.7, 30); ctx.stroke();
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(alarmLabel(state.alarm), bx + 78 + bw + 12, 26);
  if (state.seenBy) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px sans-serif';
    ctx.fillText('seen by ' + state.seenBy, bx + 78, 48);
  }

  // Objective + score, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 15px sans-serif';
  const taken = lootTakenCount(state.loot);
  ctx.fillText(state.exitOpen ? 'GET OUT — south door' : 'Take the Gilded Mask', FIELD.width - 16, 22);
  ctx.fillStyle = COLORS.gold;
  ctx.font = '15px sans-serif';
  ctx.fillText('Loot ' + taken + '/3   $' + state.score.toLocaleString('en-US'), FIELD.width - 16, 44);
}

function drawToolBar(ctx, state) {
  const tools = state.tools;
  const y = FIELD.height - 30;
  ctx.fillStyle = 'rgba(16,13,10,0.85)';
  ctx.fillRect(0, FIELD.height - 44, FIELD.width, 44);
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';

  // EMP battery bar.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('EMP [E]', 16, y);
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(86, y - 13, 120, 14);
  ctx.fillStyle = tools.battery >= 40 ? '#78c8ff' : '#e04034';
  ctx.fillRect(86, y - 13, Math.max(0, tools.battery) * 1.2, 14);
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 1;
  ctx.strokeRect(86.5, y - 12.5, 120, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px sans-serif';
  ctx.fillText(Math.round(tools.battery) + '%', 212, y);

  // Decoy coins.
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('DECOY [Click]', 260, y);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < tools.decoys ? COLORS.gold : '#3a332a';
    ctx.beginPath(); ctx.arc(392 + i * 20, y - 4, 6, 0, Math.PI * 2); ctx.fill();
  }

  // Disguise uses.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('DISGUISE [F]', 470, y);
  for (let i = 0; i < 2; i += 1) {
    ctx.fillStyle = i < tools.disguises ? '#7a8ba8' : '#3a332a';
    ctx.beginPath(); ctx.arc(596 + i * 20, y - 4, 6, 0, Math.PI * 2); ctx.fill();
  }
  if (tools.disguiseTimer > 0) {
    ctx.fillStyle = '#aebfe0';
    ctx.font = '12px sans-serif';
    ctx.fillText(Math.ceil(tools.disguiseTimer) + 's', 640, y);
  }

  // Controls, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '13px sans-serif';
  ctx.fillText('WASD move · Shift sneak · Space run · E EMP · F disguise · R restart · P pause', FIELD.width - 16, y);
}

function drawMessage(ctx, state) {
  if (state.messageTimer <= 0 || !state.message) return;
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  const a = Math.min(1, state.messageTimer);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  const w = ctx.measureText(state.message).width + 32;
  ctx.fillRect((FIELD.width - w) / 2, 66, w, 34);
  ctx.fillStyle = 'rgba(255,240,200,' + a.toFixed(2) + ')';
  ctx.fillText(state.message, FIELD.width / 2, 90);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(8,6,4,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawTitle(ctx, state) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('THE GILDED HOUR', FIELD.width / 2, 150);
  ctx.fillStyle = 'rgba(240,230,210,0.9)';
  ctx.font = '20px sans-serif';
  ctx.fillText('One thief. One gallery. One mask. Get in, take it, get out.', FIELD.width / 2, 190);
  // The three routes, as cards.
  for (let i = 0; i < ROUTES.length; i += 1) {
    const r = ROUTES[i];
    const x = 190 + i * 310;
    const y = 240;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, 290, 150);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 290, 150);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(r.name.toUpperCase(), x + 145, y + 34);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText(r.price, x + 145, y + 60);
    ctx.fillStyle = 'rgba(230,225,210,0.85)';
    ctx.font = '13px sans-serif';
    wrapText(ctx, r.note, x + 145, y + 84, 260, 18);
  }
  ctx.fillStyle = 'rgba(240,230,210,0.9)';
  ctx.font = '16px sans-serif';
  ctx.fillText('WASD / arrows move · Shift sneak · Space run · E EMP · Click throws a decoy · F disguise', FIELD.width / 2, 450);
  ctx.fillText('Dark is safe. Warm light is watched. A red cone means run.', FIELD.width / 2, 478);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Click or press Enter to begin', FIELD.width / 2, 540);
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, cx, yy);
}

function drawWin(ctx, state) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7ee2a0';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('CLEAN GETAWAY', FIELD.width / 2, 200);
  ctx.fillStyle = 'rgba(240,230,210,0.95)';
  ctx.font = '20px sans-serif';
  ctx.fillText('Wren slips into the night with the loot.', FIELD.width / 2, 244);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = COLORS.gold;
  const taken = lootTakenCount(state.loot);
  ctx.fillText('Loot ' + taken + '/3  ·  $' + state.score.toLocaleString('en-US') + '  ·  ' + Math.round(state.elapsed) + 's', FIELD.width / 2, 300);
  ctx.fillStyle = 'rgba(230,225,210,0.85)';
  ctx.font = '16px sans-serif';
  const names = state.loot.filter(function (l) { return l.taken; }).map(function (l) { return l.name; }).join('  ·  ');
  ctx.fillText(names, FIELD.width / 2, 336);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press R to run it again', FIELD.width / 2, 420);
}

function drawCaught(ctx, state) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e04034';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('CAUGHT', FIELD.width / 2, 200);
  ctx.fillStyle = 'rgba(240,230,210,0.95)';
  ctx.font = '20px sans-serif';
  ctx.fillText(state.caughtBy + ' had a clear line and a full meter. The alarm was the warning.', FIELD.width / 2, 244);
  ctx.fillStyle = 'rgba(230,225,210,0.85)';
  ctx.font = '16px sans-serif';
  ctx.fillText('Tip: break line of sight and let the meter drain — it always recovers.', FIELD.width / 2, 300);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press R to try again', FIELD.width / 2, 380);
}

function drawPaused(ctx) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(240,230,210,0.95)';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('PAUSED', FIELD.width / 2, 360);
}

export function drawHUD(ctx, state) {
  drawTopBar(ctx, state);
  drawToolBar(ctx, state);
  drawMessage(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  else if (state.mode === 'win') drawWin(ctx, state);
  else if (state.mode === 'caught') drawCaught(ctx, state);
  else if (state.mode === 'paused') drawPaused(ctx);
}
