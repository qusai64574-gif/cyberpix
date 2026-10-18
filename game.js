/* =====================================================================
   CYBERPIX // ENGINE  (top-down 2D action RPG)
   ===================================================================== */
(function () {
'use strict';
const A = window.ASSETS, D = window.D, Cfg = window.Cfg, T = D.T, TS = D.TS, MW = D.MW, MH = D.MH;
const Game = window.Game = { keys: {}, mouse: { x: 480, y: 270, down: false, right: false }, W: 960, H: 540, Z: 1.2 };
let G = null, cv = null, ctx = null, W = 960, H = 540; let Z = Game.Z;
const ui = (f, ...a) => { try { return window.UI && window.UI[f] ? window.UI[f](...a) : undefined; } catch (e) { console.error(f, e); } };
const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)], hyp = Math.hypot, TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const DIFF = [{ hp: .8, dmg: .6 }, { hp: 1, dmg: 1 }, { hp: 1.3, dmg: 1.35 }, { hp: 1.7, dmg: 1.8 }];

/* ============================ AUDIO ============================ */
const Au = Game.Au = {
  ac: null, mg: null, nb: null, mt: null, step: 0,
  init() { if (this.ac) return; try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); this.mg = this.ac.createGain(); this.mg.connect(this.ac.destination); const n = this.ac.sampleRate; this.nb = this.ac.createBuffer(1, n, n); const d = this.nb.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } catch (e) {} },
  vol() { return (Cfg.master / 100) * (Cfg.sfx / 100); },
  tone(f, d, type = 'square', v = .3, slide = 0, raw) {
    if (!this.ac) return; const t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(.12 * v * (raw !== undefined ? raw : this.vol()), t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(this.mg); o.start(t); o.stop(t + d + .02);
  },
  noise(d, v = .3, f = 1800, type = 'lowpass') {
    if (!this.ac) return; const t = this.ac.currentTime, s = this.ac.createBufferSource(), fl = this.ac.createBiquadFilter(), g = this.ac.createGain(); s.buffer = this.nb; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(.2 * v * this.vol(), t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl).connect(g).connect(this.mg); s.start(t, Math.random() * .5); s.stop(t + d + .02);
  },
  shot(id) { if (id === 'shotgun') { this.noise(.22, 1, 900); this.tone(110, .2, 'sawtooth', .5, -70); } else if (id === 'rifle') { this.noise(.25, .9, 2600); this.tone(180, .25, 'sawtooth', .5, -140); } else if (id === 'smg') { this.noise(.07, .6, 2800); this.tone(260, .06, 'square', .25, -120); } else { this.noise(.1, .7, 2400); this.tone(340, .09, 'square', .3, -200); } },
  eshot() { this.noise(.07, .35, 2200); this.tone(220, .08, 'square', .15, -100); },
  hit() { this.tone(180, .05, 'square', .2, -60); }, crit() { this.tone(900, .08, 'triangle', .3, 400); },
  hurt() { this.tone(120, .18, 'sawtooth', .5, -60); this.noise(.12, .4, 600); }, boom() { this.noise(.7, 1.2, 500); this.tone(70, .5, 'sawtooth', .8, -40); },
  pick() { this.tone(660, .06, 'square', .25); setTimeout(() => this.tone(990, .08, 'square', .25), 55); }, ding() { this.tone(880, .12, 'triangle', .35); setTimeout(() => this.tone(1320, .2, 'triangle', .35), 90); },
  dash() { this.noise(.18, .5, 1400, 'highpass'); }, reload() { this.tone(300, .04, 'square', .25); setTimeout(() => this.tone(520, .05, 'square', .25), 200); }, empty() { this.tone(160, .05, 'square', .2); },
  hack() { this.tone(700, .06, 'sawtooth', .25, 500); setTimeout(() => this.tone(1200, .1, 'sawtooth', .25, -400), 70); }, swing() { this.noise(.12, .5, 1800, 'bandpass'); },
  startMusic() {
    if (!this.ac || this.mt) return; const bass = [55, 55, 82.4, 55, 73.4, 55, 65.4, 49], arp = [220, 261.6, 329.6, 392, 329.6, 261.6, 293.7, 349.2];
    this.mt = setInterval(() => {
      const mv = (Cfg.master / 100) * (Cfg.music / 100); if (mv < .01 || document.hidden && Cfg.mutebg) return; const i = this.step++ % 16;
      if (i % 2 === 0) this.tone(bass[(i >> 1) % 8], .3, 'sawtooth', .5, 0, mv); this.tone(arp[(i * 3) % 8] * (i > 7 ? 1.5 : 1), .14, 'triangle', .22, 0, mv);
      if (i % 4 === 0) this.tone(50, .12, 'sine', .9, -25, mv); if (i % 8 === 4) this.noise(.08, .3 * mv / Math.max(.01, this.vol()), 6000, 'highpass');
    }, 190);
  },
};

/* ============================ STATIC LEVEL ============================ */
let tiles, solidGrid, decor = [], lamps = [], decals = [], gateRect, flow = new Int16Array(MW * MH), flowQ = new Int32Array(MW * MH), miniCv, signs = [];
const SIGNS = ['sign_noodle', 'sign_clinic', 'sign_arms', 'sign_bar', 'sign_corp', 'sign_cola'];
const ROOFDET = ['ac_unit', 'vent', 'dish', 'skylight'];
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
function ensureLevel() {
  if (tiles) return;
  tiles = D.buildMap(); solidGrid = new Uint8Array(MW * MH); const L = D.LEVEL;
  L.decor.forEach(d => {
    const spr = A.get('props', d[0]); const rot = d[3] || 0; const w = rot ? spr.height : spr.width, h = rot ? spr.width : spr.height; const x = d[1] * TS, y = d[2] * TS;
    decor.push({ t: d[0], x, y, rot: rot * Math.PI / 180, spr, w, h });
    if (d[0] !== 'pipes' && d[0] !== 'elevator') { const x0 = Math.floor((x - w / 2 + 4) / TS), x1 = Math.floor((x + w / 2 - 4) / TS), y0 = Math.floor((y - h / 2 + 4) / TS), y1 = Math.floor((y + h / 2 - 4) / TS); for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) solidGrid[j * MW + i] = 1; }
  });
  lamps = L.lamps.map(l => ({ x: l[0] * TS, y: l[1] * TS })); decals = L.decals.map(d => ({ t: 'decal_' + d[0], x: d[1] * TS, y: d[2] * TS, rot: (d[1] * 7 % 4) * 1.57 }));
  for (let i = 50; i < 58; i++) solidGrid[42 * MW + i] = 1;
  // minimap raster
  miniCv = document.createElement('canvas'); miniCv.width = MW; miniCv.height = MH; const m = miniCv.getContext('2d'); const col = { [T.ASPH]: '#24232a', [T.SIDE]: '#46433f', [T.PLAZA]: '#3a3a44', [T.ROOF]: '#0d1016', [T.METAL]: '#1e3a52', [T.SCRAP]: '#4a3a2c', [T.HAZ]: '#0d3a4a', [T.PIT]: '#4a1a22', [T.LANEH]: '#24232a', [T.CROSSV]: '#5a5a62', [T.CROSSH]: '#5a5a62', [T.LANEV]: '#24232a' };
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { m.fillStyle = col[tiles[j * MW + i]] || '#000'; m.fillRect(i, j, 1, 1); }
  decor.forEach(d => { if (d.t.startsWith('container') || d.t.startsWith('car') || d.t === 'stall') { m.fillStyle = '#2a2f38'; m.fillRect((d.x - d.w / 2) / TS, (d.y - d.h / 2) / TS, d.w / TS, d.h / TS); } });
}
const tAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= MW || ty >= MH) ? T.VOID : tiles[ty * MW + tx];
const solidAt = (px, py) => { if (px < 0 || py < 0) return true; const tx = (px / TS) | 0, ty = (py / TS) | 0; if (tx >= MW || ty >= MH) return true; const t = tiles[ty * MW + tx]; return t === T.ROOF || t === T.VOID || solidGrid[ty * MW + tx] === 1; };
const walkable = (tx, ty) => { if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false; const i = ty * MW + tx; const t = tiles[i]; return t !== T.ROOF && t !== T.VOID && solidGrid[i] === 0; };
const blocked = (x, y, r) => solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r) || solidAt(x, y - r) || solidAt(x, y + r) || solidAt(x - r, y) || solidAt(x + r, y);
function moveC(e, dx, dy, r) {
  const n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 5) || 1, sx = dx / n, sy = dy / n; let hit = false;
  for (let i = 0; i < n; i++) { if (!blocked(e.x + sx, e.y, r)) e.x += sx; else hit = true; if (!blocked(e.x, e.y + sy, r)) e.y += sy; else hit = true; }
  return hit;
}
function los(x1, y1, x2, y2) { const d = hyp(x2 - x1, y2 - y1), n = Math.ceil(d / 12); for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false; } return true; }
function computeFlow() {
  flow.fill(-1); const p = G.p, sx = (p.x / TS) | 0, sy = (p.y / TS) | 0; if (!walkable(sx, sy)) return; let h = 0, t = 0; flow[sy * MW + sx] = 0; flowQ[t++] = sy * MW + sx;
  while (h < t) { const c = flowQ[h++], cx = c % MW, cy = (c / MW) | 0, d = flow[c]; if (d > 50) continue; for (let k = 0; k < 8; k++) { const ox = [1, -1, 0, 0, 1, 1, -1, -1][k], oy = [0, 0, 1, -1, 1, -1, 1, -1][k], nx = cx + ox, ny = cy + oy; if (!walkable(nx, ny)) continue; if (k > 3 && (!walkable(cx + ox, cy) || !walkable(cx, cy + oy))) continue; const ni = ny * MW + nx; if (flow[ni] !== -1) continue; flow[ni] = d + 1; flowQ[t++] = ni; } }
}
function flowDir(e) {
  const cx = (e.x / TS) | 0, cy = (e.y / TS) | 0; let best = flow[cy * MW + cx], bx = 0, by = 0; if (best < 0) return null;
  for (let k = 0; k < 8; k++) { const ox = [1, -1, 0, 0, 1, 1, -1, -1][k], oy = [0, 0, 1, -1, 1, -1, 1, -1][k], nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const v = flow[ny * MW + nx]; if (v >= 0 && v < best && (k < 4 || (walkable(cx + ox, cy) && walkable(cx, cy + oy)))) { best = v; bx = ox; by = oy; } }
  if (!bx && !by) return null; const tx = (cx + bx) * TS + TS / 2 - e.x, ty = (cy + by) * TS + TS / 2 - e.y, d = hyp(tx, ty) || 1; return [tx / d, ty / d];
}

/* ============================ STATE ============================ */
function newState() {
  return {
    t: 0, play: 0, ts: 1, slow: 0, shake: 0, hitstop: 0, dead: false, deadT: 0, victory: false, wheel: false, wheelSel: 0,
    p: { x: D.LEVEL.spawn[0] * TS + 16, y: D.LEVEL.spawn[1] * TS + 16, vx: 0, vy: 0, r: 10, aim: -1.57, face: -1.57, hp: 100, hpMax: 100, armor: 30, armorMax: 30, stam: 70, stamMax: 70, ram: 4, ramMax: 4, eddies: 150, xp: 0, lvl: 1, attrPts: 0, perkPts: 0, attrs: { body: 3, ref: 3, tech: 3, cool: 3, int: 3 }, perks: {}, invul: 0, dash: 0, dashX: 0, dashY: 0, stamT: 0, anim: 0, flash: 0, hurtT: 0, wcd: 0, reloadT: 0, reloadMax: 0, melee: 0, kick: 0, healT: 0, healCd: 0, hackT: 0, hackTarget: null, ramT: 0, swingA: 0, swingT: 0, combatT: 0, step: 0 },
    guns: [{ id: 'pistol', tier: 0, mag: 12 }], slots: [0, -1, -1, -1], cur: 0, ammo: { '9mm': 72, shell: 0, slug: 0 }, inv: { medkit: 2, grenade: 2, scrap: 0, comp: 0, armorpatch: 0, core: 0 }, cyber: {}, q: {}, tracked: 'm1', hackSel: 0,
    codex: { sector: 1, eddies: 1, cyberware: 1, quickhack: 1 }, msgs: ['msg_start'], hinted: {}, flags: {}, killed: {}, looted: {}, picked: {}, cp: 'cp0', cpSeen: { cp0: 1 }, zone: null, ip: 0, itarget: null, wave: [],
    stats: { kills: 0, shots: 0, deaths: 0, crits: 0, eddies: 0 },
    enemies: [], npcs: [], props: [], conts: [], pickups: [], proj: [], parts: [], floats: [], fxs: [], gren: [], relays: [], boss: null, cam: { x: 0, y: 0 }, flowT: 0, rainSeed: 0,
  };
}
function setupEntities() {
  const L = D.LEVEL; G.enemies = []; G.npcs = []; G.props = []; G.conts = []; G.pickups = []; G.relays = [];
  L.enemies.forEach((e, i) => { const id = 'e' + i; if (G.killed[id]) return; spawnEnemy(e[0], e[1] * TS + 16, e[2] * TS + 16, e[3], id); });
  L.npcs.forEach(n => G.npcs.push({ id: n.id, pal: n.pal, name: n.n, role: n.role, x: n.x * TS + 16, y: n.y * TS + 16, hx: n.x * TS + 16, hy: n.y * TS + 16, face: n.face || 0, wander: n.wander, wt: rnd(0, 3), tx: 0, ty: 0, anim: 0, moving: false, bark: 0 }));
  L.containers.forEach(c => G.conts.push({ id: c.id, t: c.t, x: c.x * TS + 16, y: c.y * TS + 16, loot: c.loot, open: !!G.looted[c.id], r: 16 }));
  L.breakables.forEach((b, i) => { const id = 'b' + i; if (G.killed[id]) return; const hp = b[0] === 'barrel_boom' ? 25 : b[0] === 'crate_metal' ? 60 : 35; G.props.push({ id, t: b[0], x: b[1] * TS, y: b[2] * TS, hp, hpMax: hp, flash: 0, spr: A.get('props', b[0]), r: b[0].startsWith('barrel') ? 11 : b[0] === 'crate_metal' ? 18 : 15 }); });
  L.relays.forEach(r => G.relays.push({ id: r.id, x: r.x * TS + 16, y: r.y * TS + 16, on: !!G.flags['relay_' + r.id] }));
  L.shards.forEach(s => { if (!G.picked[s.id]) G.pickups.push({ kind: 'shard', id: s.id, x: s.x * TS + 16, y: s.y * TS + 16, vx: 0, vy: 0, n: 1, life: 1e9 }); });
  G.boss = G.enemies.find(e => e.t === 'boss') || null;
  rebuildSolid();
}
function rebuildSolid() {
  solidGrid.fill(0); decor.forEach(d => { if (d.t !== 'pipes' && d.t !== 'elevator') { const x0 = Math.floor((d.x - d.w / 2 + 4) / TS), x1 = Math.floor((d.x + d.w / 2 - 4) / TS), y0 = Math.floor((d.y - d.h / 2 + 4) / TS), y1 = Math.floor((d.y + d.h / 2 - 4) / TS); for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) solidGrid[j * MW + i] = 1; } });
  if (!G || !G.flags.gate) for (let i = 50; i < 58; i++) solidGrid[42 * MW + i] = 1;
}
function spawnEnemy(key, x, y, lvl, id) {
  const d = D.ENEMY[key], df = DIFF[Cfg.difficulty], hp = d.hp * (1 + (lvl - 1) * .1) * df.hp;
  const e = { id, t: key, def: d, x, y, hx: x, hy: y, hp, hpMax: hp, lvl, face: rnd(0, TAU), aim: 0, state: 'idle', alert: 0, mem: 0, cd: rnd(0, 1), burst: 0, wind: 0, stun: 0, blind: 0, burn: 0, burnT: 0, flash: 0, anim: 0, moving: false, showT: 0, dead: false, deadT: 0, wt: rnd(0, 2), wx: 0, wy: 0, strafe: Math.random() < .5 ? 1 : -1, st: 0, sc: d.scale || 1, ph: 0, kx: 0, ky: 0, active: !d.boss };
  G.enemies.push(e); return e;
}

/* ============================ DERIVED STATS ============================ */
const has = id => !!G.p.perks[id], cy = id => Object.values(G.cyber).includes(id);
function derive() {
  const p = G.p, a = p.attrs; const hpMax = 76 + a.body * 8 + (has('meat') ? 25 : 0);
  p.hpMax = hpMax; p.armorMax = 12 + a.tech * 6 + (has('plated') ? 25 : 0) + (cy('plating') ? 40 : 0); p.stamMax = 52 + a.cool * 6; p.ramMax = 3 + Math.floor(a.int / 2) + (cy('coproc') ? 3 : 0) + (has('overclock') ? 2 : 0);
  p.hp = Math.min(p.hp, p.hpMax); p.armor = Math.min(p.armor, p.armorMax); p.stam = Math.min(p.stam, p.stamMax); p.ram = Math.min(p.ram, p.ramMax);
  G.st = { speed: 190 * (1 + (a.ref - 3) * .02 + (has('light') ? .1 : 0) + (cy('servo') ? .18 : 0)), crit: .05 + (a.cool - 3) * .015 + (has('deadeye') ? .1 : 0) + (cy('optics') ? .1 : 0), melee: (1 + (a.body - 3) * .06) * (has('brawler') ? 1.35 : 1) * (cy('bladearms') ? 2.2 : 1), reload: (has('quick') ? .75 : 1) * (cy('smartlink') ? .85 : 1), spread: cy('smartlink') ? .6 : 1, dashCost: 28 * (has('ghost') ? .6 : 1) * (cy('servo') ? .75 : 1), hack: (has('daemon') ? 1.4 : 1) * (1 + (a.int - 3) * .05), gren: (1 + (a.tech - 3) * .05) * (has('demo') ? 1.4 : 1), reach: cy('bladearms') ? 80 : 54 };
}
Game.derive = () => derive();
const curGun = () => { const i = G.slots[G.cur]; return i >= 0 ? G.guns[i] : null; };
Game.curGun = curGun;

/* ============================ NOTIFY / HINTS ============================ */
const note = (text, kind, icon) => ui('notify', text, kind || 'info', icon);
function hint(id, text) { if (!Cfg.hints || G.hinted[id]) return; G.hinted[id] = 1; ui('hint', text); }

/* ============================ QUESTS ============================ */
const Q = Game.Q = {
  get(id) { return G.q[id]; }, active(id) { return G.q[id] && G.q[id].state === 'active'; }, done(id) { return G.q[id] && G.q[id].state === 'done'; }, step(id) { return G.q[id] ? G.q[id].step : -1; },
  start(id) { if (G.q[id]) return; G.q[id] = { state: 'active', step: 0, n: 0 }; note(D.QUESTS[id].title, 'quest', 'quest'); ui('banner', 'NEW MISSION', D.QUESTS[id].title, 'quest'); if (!G.tracked || !this.active(G.tracked) || D.QUESTS[id].type === 'MAIN') G.tracked = id; Au.ding(); if (id === 'm2' && G.inv.core > 0) this.goto('m2', 1); },
  goto(id, s) { const q = G.q[id]; if (!q || q.state !== 'active') return; q.step = s; q.n = 0; const st = D.QUESTS[id].steps[s]; if (st) { note(st.replace('%n', '0'), 'obj', 'check'); ui('objective', st); } Au.ding(); },
  add(id, k = 1) { const q = G.q[id]; if (!q || q.state !== 'active') return 0; q.n += k; return q.n; },
  finish(id) {
    const q = G.q[id]; if (!q || q.state === 'done') return; q.state = 'done'; const def = D.QUESTS[id], r = def.reward || {};
    if (r.eddies) giveEddies(r.eddies); if (r.xp) giveXP(r.xp); if (r.item) { G.inv[r.item[0]] = (G.inv[r.item[0]] || 0) + r.item[1]; note('+' + r.item[1] + ' ' + D.ITEMS[r.item[0]].n, 'loot', D.ITEMS[r.item[0]].icon); }
    if (r.weapon) giveGun(r.weapon[0], r.weapon[1]); ui('banner', 'MISSION COMPLETE', def.title, 'done'); Au.ding(); if (G.tracked === id) { G.tracked = D.QORDER.find(k => this.active(k) && D.QUESTS[k].type === 'MAIN') || D.QORDER.find(k => this.active(k)) || null; }
  },
  target(id) { // world position of the current objective
    const L = D.LEVEL, q = G.q[id]; if (!q || q.state !== 'active') return null; const T = (x, y) => ({ x: x * TS + 16, y: y * TS + 16 }), n = nm => G.npcs.find(k => k.id === nm);
    switch (id) {
      case 'm1': return q.step === 0 ? T(9, 62) : q.step === 1 ? T(48, 74) : (n('kestrel') ? { x: n('kestrel').x, y: n('kestrel').y } : null);
      case 'm2': return q.step === 0 ? T(111, 86) : { x: n('kestrel').x, y: n('kestrel').y };
      case 'm3': { if (q.step === 1) return { x: n('kestrel').x, y: n('kestrel').y }; const r = G.relays.find(r => !r.on); return r ? { x: r.x, y: r.y } : null; }
      case 'm4': return [T(53, 40), T(77, 12), G.wave.length ? (() => { const e = G.enemies.find(e => !e.dead && G.wave.includes(e.id)); return e ? { x: e.x, y: e.y } : null; })() : null, T(95, 17)][q.step] || null;
      case 'm5': return q.step === 0 ? T(107, 17) : T(113.5, 17.5);
      case 's1': { if (q.step === 1) return { x: n('juno').x, y: n('juno').y }; const s = G.pickups.find(p => p.kind === 'shard'); return s ? { x: s.x, y: s.y } : null; }
      case 's2': { const e = G.enemies.find(e => !e.dead && e.def.gang); return e ? { x: e.x, y: e.y } : null; }
      case 's3': { if (q.step === 1) return { x: n('mira').x, y: n('mira').y }; const c = G.conts.find(c => c.loot === 'cargo' && !c.open); return c ? { x: c.x, y: c.y } : null; }
      case 's4': { if (q.step === 1) return { x: n('kestrel').x, y: n('kestrel').y }; const e = G.enemies.find(e => e.t === 'captain' && !e.dead); return e ? { x: e.x, y: e.y } : null; }
    } return null;
  },
};
function checkQuests() {
  const p = G.p, q = G.q, tx = p.x / TS, ty = p.y / TS;
  if (Q.active('m1') && Q.step('m1') === 1 && D.zoneAt(p.x, p.y).id === 'market') Q.goto('m1', 2);
  if (Q.active('m2') && Q.step('m2') === 0 && G.inv.core > 0) Q.goto('m2', 1);
  if (Q.active('m3') && Q.step('m3') === 0 && q.m3.n >= 3) Q.goto('m3', 1);
  if (Q.active('m4')) {
    if (Q.step('m4') === 0 && ty < 41) Q.goto('m4', 1);
    if (Q.step('m4') === 2 && G.wave.length && G.wave.every(id => G.killed[id])) { Q.goto('m4', 3); }
    if (Q.step('m4') === 3 && tx > 91 && ty < 22) { Q.finish('m4'); Q.start('m5'); }
  }
  if (Q.active('m5') && Q.step('m5') === 0 && G.boss && G.boss.dead) Q.goto('m5', 1);
  if (Q.active('s1') && Q.step('s1') === 0 && q.s1.n >= 3) Q.goto('s1', 1);
  if (Q.active('s2') && q.s2.n >= 10) Q.finish('s2');
  if (Q.active('s3') && Q.step('s3') === 0 && q.s3.n >= 2) Q.goto('s3', 1);
  if (Q.active('s4') && Q.step('s4') === 0 && G.enemies.find(e => e.t === 'captain' && e.dead)) Q.goto('s4', 1);
}

/* ============================ ECONOMY ============================ */
function giveEddies(n) { G.p.eddies += n; G.stats.eddies += n; note('+' + n + ' eddies', 'loot', 'eddies'); }
function giveXP(n) {
  const p = G.p; p.xp += n; ui('xpgain', n);
  while (p.xp >= D.xpNeeded(p.lvl)) { p.xp -= D.xpNeeded(p.lvl); p.lvl++; p.attrPts += 1; p.perkPts += (p.lvl % 2 === 0 ? 1 : 0); derive(); p.hp = p.hpMax; p.armor = p.armorMax; ui('banner', 'LEVEL UP', 'STREET CRED ' + p.lvl, 'level'); note('Street Cred ' + p.lvl + ': +1 attribute point' + (p.lvl % 2 === 0 ? ', +1 perk point' : ''), 'quest', 'star'); Au.ding(); }
}
function giveGun(id, tier) { G.guns.push({ id, tier, mag: D.WEAPONS[id].mag }); const gi = G.guns.length - 1; const free = G.slots.indexOf(-1); if (free >= 0) { G.slots[free] = gi; if (G.slots[G.cur] < 0) G.cur = free; } note(D.TIERS[tier].n + ' ' + D.WEAPONS[id].n, 'loot', D.WEAPONS[id].icon); Au.pick(); }
function giveAmmo(type, n) { const m = D.AMMO[type].max; const add = Math.min(n, m - G.ammo[type]); if (add > 0) { G.ammo[type] += add; note('+' + add + ' ' + D.AMMO[type].n, 'loot', 'ammo'); } return add; }
function giveItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; note('+' + n + ' ' + D.ITEMS[id].n, 'loot', D.ITEMS[id].icon); }
function ownedAmmoTypes() { const s = new Set(G.guns.map(g => D.WEAPONS[g.id].ammo)); return [...s]; }
function dropPickup(kind, x, y, extra) { const a = rnd(0, TAU), s = rnd(40, 110); G.pickups.push(Object.assign({ kind, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, n: 1, life: 90 }, extra)); }
function spawnLoot(x, y, key, lvl = 1) {
  const tab = D.LEVEL.loot[key] || []; tab.forEach(en => {
    if (Math.random() > en[3]) return; const k = en[0], n = ri(en[1], en[2]);
    if (k === 'eddies') dropPickup('eddies', x, y, { n: Math.round(n * (1 + lvl * .1)) });
    else if (k === 'ammo') { const t = pick(ownedAmmoTypes()); dropPickup('ammo', x, y, { ammo: t, n: Math.max(4, Math.round(D.AMMO[t].pack * rnd(.4, .8))) }); }
    else if (k === 'weapon') dropPickup('weapon', x, y, { id: pick(['pistol', 'smg', 'shotgun', 'rifle']), tier: pick([0, 0, 1, 1, 2, 2, 3]) });
    else dropPickup('item', x, y, { id: k, n });
  });
}
function enemyDrops(e) {
  const d = e.def, m = d.drop || 1, x = e.x, y = e.y;
  dropPickup('eddies', x, y, { n: Math.round(rnd(8, 22) * m * (1 + e.lvl * .15)) });
  if (Math.random() < .4) { const t = pick(ownedAmmoTypes()); dropPickup('ammo', x, y, { ammo: t, n: Math.max(4, Math.round(D.AMMO[t].pack * rnd(.3, .7))) }); }
  if (Math.random() < .14 * m) dropPickup('item', x, y, { id: 'medkit', n: 1 }); if (Math.random() < .35) dropPickup('item', x, y, { id: 'scrap', n: ri(1, 2) }); if (Math.random() < .18 * m) dropPickup('item', x, y, { id: 'comp', n: 1 });
  if (m >= 2 && Math.random() < .5) dropPickup('weapon', x, y, { id: pick(['pistol', 'smg', 'shotgun', 'rifle']), tier: pick([1, 2, 2, 3]) });
}

/* ============================ FX ============================ */
function part(x, y, o) { if (G.parts.length > 140 + Cfg.fx * 3) return; G.parts.push(Object.assign({ x, y, vx: 0, vy: 0, life: .4, max: .4, size: 2, color: '#ffd25e', drag: 3, type: 'rect' }, o)); }
function sparks(x, y, n, col = '#ffd25e', sp = 160) { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), s = rnd(40, sp); part(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.15, .4), max: .4, size: rnd(1.5, 3), color: col }); } }
function blood(x, y, n, ang) { for (let i = 0; i < n; i++) { const a = (ang !== undefined ? ang + rnd(-.7, .7) : rnd(0, TAU)), s = rnd(30, 150); part(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.3, .7), max: .7, size: rnd(1.5, 3.5), color: Math.random() < .3 ? '#5a0010' : '#9a0820', drag: 4 }); } }
function floatText(x, y, text, color, big) { if (!Cfg.damagenums && !big) return; G.floats.push({ x, y, text, color, t: 0, big, vx: rnd(-14, 14) }); }
function shakeCam(a) { G.shake = Math.min(14, G.shake + a * (Cfg.shake / 60)); }
function fxAnim(x, y, kind, scale = 1, ang) { G.fxs.push({ x, y, t: 0, kind, scale, ang }); }
function explode(x, y, r, dmg, byPlayer, opts = {}) {
  fxAnim(x, y, 'explosion', r / 56); Au.boom(); shakeCam(8); sparks(x, y, 22, '#ff9a3d', 260); for (let i = 0; i < 8; i++) part(x, y, { vx: rnd(-60, 60), vy: rnd(-60, 60), life: 1, max: 1, size: rnd(8, 16), color: 'rgba(60,60,66,.35)', type: 'smoke', drag: 1.2 });
  G.parts.push({ x, y, vx: 0, vy: 0, life: .35, max: .35, size: r, color: '#ff9a3d', type: 'ring', drag: 0 });
  G.decalsDyn = G.decalsDyn || []; G.decalsDyn.push({ t: 'decal_scorch', x, y, rot: rnd(0, TAU) }); if (G.decalsDyn.length > 40) G.decalsDyn.shift();
  G.enemies.forEach(e => { if (e.dead) return; const d = hyp(e.x - x, e.y - y); if (d < r + e.def.r) { const f = 1 - clamp(d / (r + e.def.r), 0, 1) * .6; damageEnemy(e, dmg * f, { src: byPlayer ? 'p' : 'e', knock: 260, kx: e.x - x, ky: e.y - y, boom: 1 }); } });
  const p = G.p, d = hyp(p.x - x, p.y - y); if (d < r + 8 && !opts.noPlayer) { hurtPlayer(dmg * (1 - clamp(d / (r + 8), 0, 1) * .6) * (byPlayer ? .5 : 1) / (byPlayer ? 1 : 1), x, y, 'blast'); if (!cy('shock')) { const a = Math.atan2(p.y - y, p.x - x); p.vx += Math.cos(a) * 280; p.vy += Math.sin(a) * 280; } }
  G.props.slice().forEach(pr => { if (hyp(pr.x - x, pr.y - y) < r) damageProp(pr, dmg, true); });
}
function damageProp(pr, dmg, boom) {
  if (pr.hp <= 0) return; pr.hp -= dmg; pr.flash = .08; sparks(pr.x, pr.y, 3, pr.t.startsWith('barrel') ? '#ffd25e' : '#c9b27a', 90);
  if (pr.hp <= 0) {
    G.killed[pr.id] = 1; G.props.splice(G.props.indexOf(pr), 1);
    if (pr.t === 'barrel_boom') setTimeout(() => G && !G.dead && explode(pr.x, pr.y, 96, 85, true), 60);
    else { for (let i = 0; i < 8; i++) part(pr.x, pr.y, { vx: rnd(-110, 110), vy: rnd(-110, 110), life: .7, max: .7, size: rnd(2, 5), color: pr.t === 'crate' ? '#7a5636' : '#59636f', drag: 3 }); if (Math.random() < .55) spawnLoot(pr.x, pr.y, 'common'); Au.hit(); }
  }
}

/* ============================ COMBAT ============================ */
function damageEnemy(e, dmg, o = {}) {
  if (e.dead) return; let crit = false;
  if (o.src === 'p' && !o.dot && !o.boom && o.canCrit !== false && Math.random() < G.st.crit) { crit = true; dmg *= 2; G.stats.crits++; }
  const ar = e.def.armor || 0; dmg *= (1 - ar); if (e.t === 'boss' && e.stunned > 0) dmg *= 1.5;
  e.hp -= dmg; e.flash = .09; e.showT = 4; if (o.src === 'p') { e.mem = 6; e.alert = 1; alertAllies(e); }
  if (o.knock && !e.def.static && !e.def.boss) { const d = hyp(o.kx, o.ky) || 1; e.kx += o.kx / d * o.knock; e.ky += o.ky / d * o.knock; }
  floatText(e.x + rnd(-8, 8), e.y - 18 * e.sc, String(Math.round(dmg)), crit ? '#f3e600' : o.dot ? '#ff9a3d' : '#ffffff', crit);
  blood(e.x, e.y, crit ? 6 : 3, o.ang); if (o.src === 'p') { ui('hitmarker', crit, e.hp <= 0); crit ? Au.crit() : Au.hit(); }
  if (e.hp <= 0) killEnemy(e, o);
}
function alertAllies(e) { G.enemies.forEach(a => { if (!a.dead && a !== e && !a.def.boss && hyp(a.x - e.x, a.y - e.y) < 260) { a.alert = Math.max(a.alert, .9); a.mem = Math.max(a.mem, 4); } }); }
function killEnemy(e, o) {
  e.dead = true; e.deadT = 0; e.hp = 0; G.killed[e.id] = 1; G.stats.kills++; e.showT = 0; Game.lastKill = G.t;
  blood(e.x, e.y, 14, o && o.ang); G.decalsDyn = G.decalsDyn || []; G.decalsDyn.push({ t: 'decal_blood', x: e.x, y: e.y, rot: rnd(0, TAU) }); if (G.decalsDyn.length > 40) G.decalsDyn.shift();
  if (e.def.fly || e.def.static) { explode(e.x, e.y, 54, 30, true, { noPlayer: hyp(G.p.x - e.x, G.p.y - e.y) > 70 }); }
  enemyDrops(e); giveXP(Math.round(e.def.xp * (1 + (e.lvl - 1) * .12)));
  if (e.def.gang) { if (Q.active('s2')) Q.add('s2'); if (Q.active('m1') && Q.step('m1') === 0 && D.zoneAt(e.x, e.y).id === 'alley') { const n = Q.add('m1'); if (n >= 3) Q.goto('m1', 1); } if (Q.active('s2')) { } }
  if (e.def.boss) { ui('bossbar', false); ui('banner', 'ENEMY DOWN', 'THE CHROME BRUTE', 'done'); shakeCam(12); G.slow = 1.2; }
  if (G.wave.length && G.wave.includes(e.id) && Q.active('m4')) { const left = G.wave.filter(id => !G.killed[id]).length; if (left > 0) note(left + ' hostiles remain', 'obj', 'enemy'); }
}
function hurtPlayer(dmg, sx, sy, kind) {
  const p = G.p; if (p.invul > 0 || G.dead || G.victory) return; dmg *= DIFF[Cfg.difficulty].dmg; p.combatT = 5;
  if (p.armor > 0) { const a = Math.min(p.armor, dmg * .7); p.armor -= a; dmg -= a * .6; p.armorT = 3; }
  p.hp -= dmg; p.invul = kind === 'blast' ? .4 : .22; p.flash = .12; p.hurtT = .4; shakeCam(Math.min(8, 2 + dmg * .15)); Au.hurt(); blood(p.x, p.y, 5, Math.atan2(p.y - sy, p.x - sx));
  ui('damaged', Math.atan2(sy - p.y, sx - p.x), dmg); floatText(p.x, p.y - 22, '-' + Math.round(dmg), '#ff4d4d');
  if (p.hp <= 0) die();
}
function die() { const p = G.p; p.hp = 0; G.dead = true; G.deadT = 0; G.stats.deaths++; G.slow = 0; shakeCam(10); blood(p.x, p.y, 30); ui('death'); }
Game.respawn = function () {
  const cp = D.LEVEL.checkpoints.find(c => c.id === G.cp) || D.LEVEL.checkpoints[0], p = G.p; derive();
  p.x = cp.x * TS + 16; p.y = cp.y * TS + 16 + 30; p.hp = p.hpMax; p.armor = p.armorMax; p.stam = p.stamMax; p.vx = p.vy = 0; p.invul = 2; G.dead = false; G.ts = 1; G.proj = []; G.gren = [];
  G.enemies.forEach(e => { if (!e.dead) { e.alert = 0; e.state = 'idle'; e.burst = 0; e.wind = 0; if (e.def.boss) { e.hp = e.hpMax; e.active = false; ui('bossbar', false); } } });
  ui('respawned');
};

/* ---- player weapons ---- */
function muzzlePos(len) { const p = G.p; return { x: p.x + Math.cos(p.aim) * (len), y: p.y + Math.sin(p.aim) * (len) }; }
function tryFire(edge) {
  const p = G.p, g = curGun(); if (!g || p.reloadT > 0 || G.dead || G.wheel) return; const W = D.WEAPONS[g.id];
  if (!W.auto && !edge) return; if (p.wcd > 0 || p.dash > 0) return;
  if (g.mag <= 0) { if (edge) { Au.empty(); startReload(); } return; }
  g.mag--; p.wcd = 1 / W.rof; p.kick = W.kick; G.stats.shots++; p.combatT = 5; Au.shot(g.id);
  const sprite = A.get('weapons', g.id), mz = muzzlePos(12 + (sprite ? sprite.muzzle[0] - sprite.grip[0] : 18));
  const dmg = W.dmg * D.TIERS[g.tier].m * (g.id === 'pistol' || g.id === 'smg' ? 1 + (p.attrs.ref - 3) * .02 : 1);
  const move = hyp(p.vx, p.vy) / G.st.speed; for (let i = 0; i < W.pellets; i++) {
    const a = p.aim + rnd(-1, 1) * W.spread * G.st.spread * (1 + move * .6 + (W.auto ? .15 : 0)), sp = W.speed * rnd(.94, 1.06);
    G.proj.push({ x: mz.x, y: mz.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, own: 'p', life: W.life || 1.1, pierce: W.pierce || 0, hit: [], ang: a, spr: g.id === 'rifle' ? 'bolt' : 'bullet' });
  }
  fxAnim(mz.x, mz.y, 'muzzle', 1, p.aim); part(p.x - Math.cos(p.aim) * 6, p.y - Math.sin(p.aim) * 6, { vx: Math.cos(p.aim + 1.9) * 90 + rnd(-20, 20), vy: Math.sin(p.aim + 1.9) * 90 + rnd(-20, 20), life: .5, max: .5, size: 2, color: '#d9a441', drag: 4 });
  shakeCam(W.kick * .25); alertNoise(p.x, p.y, 380); if (g.mag <= 0) hint('empty', 'Magazine empty. Press [R] to reload.');
}
function startReload() { const p = G.p, g = curGun(); if (!g || p.reloadT > 0) return; const W = D.WEAPONS[g.id]; if (g.mag >= W.mag || G.ammo[W.ammo] <= 0) { if (G.ammo[W.ammo] <= 0 && g.mag < W.mag) note('No ' + D.AMMO[W.ammo].n, 'warn', 'ammo'); return; } p.reloadT = p.reloadMax = W.rel * G.st.reload; Au.reload(); }
function finishReload() { const g = curGun(); if (!g) return; const W = D.WEAPONS[g.id], need = W.mag - g.mag, take = Math.min(need, G.ammo[W.ammo]); g.mag += take; G.ammo[W.ammo] -= take; }
function alertNoise(x, y, r) { G.enemies.forEach(e => { if (!e.dead && !e.def.boss && e.state === 'idle' && hyp(e.x - x, e.y - y) < r) { e.alert = Math.max(e.alert, .5 + Math.random() * .5); e.mem = 3; } }); }
function doMelee() {
  const p = G.p; if (p.melee > 0 || G.dead || p.dash > 0) return; p.melee = .42; p.swingT = .2; p.swingA = p.aim; Au.swing(); p.combatT = 5; p.vx += Math.cos(p.aim) * 150; p.vy += Math.sin(p.aim) * 150;
  const reach = G.st.reach, dmg = 38 * G.st.melee; let hit = false;
  G.enemies.forEach(e => { if (e.dead) return; const dx = e.x - p.x, dy = e.y - p.y, d = hyp(dx, dy); if (d < reach + e.def.r + 4 && Math.abs(angDiff(p.aim, Math.atan2(dy, dx))) < 1.05) { damageEnemy(e, dmg, { src: 'p', knock: 220, kx: dx, ky: dy, ang: p.aim }); hit = true; if (e.def.boss) e.stunned = Math.max(e.stunned || 0, 0); } });
  G.props.slice().forEach(pr => { if (hyp(pr.x - p.x, pr.y - p.y) < reach + 8 && Math.abs(angDiff(p.aim, Math.atan2(pr.y - p.y, pr.x - p.x))) < 1.1) damageProp(pr, dmg, false); });
  if (hit) { shakeCam(3); G.hitstop = .045; }
  for (let i = 0; i < 6; i++) { const a = p.aim - .9 + i * .36; part(p.x + Math.cos(a) * reach * .8, p.y + Math.sin(a) * reach * .8, { vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, life: .18, max: .18, size: 3, color: cy('bladearms') ? '#ff4d4d' : '#cfe9f5', drag: 6 }); }
}
function throwGrenade() {
  const p = G.p; if (G.inv.grenade <= 0 || G.dead) return; G.inv.grenade--; Au.swing(); const mw = mouseWorld(); let tx = mw.x, ty = mw.y; const d = hyp(tx - p.x, ty - p.y), mx = 340; if (d > mx) { tx = p.x + (tx - p.x) / d * mx; ty = p.y + (ty - p.y) / d * mx; }
  let lx = p.x, ly = p.y; const n = 24; for (let i = 1; i <= n; i++) { const x = p.x + (tx - p.x) * i / n, y = p.y + (ty - p.y) * i / n; if (solidAt(x, y)) break; lx = x; ly = y; }
  G.gren.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, tx: lx, ty: ly, t: 0, T: .75 }); p.combatT = 5;
}
function useMedkit() { const p = G.p; if (G.inv.medkit <= 0 || p.healCd > 0 || p.hp >= p.hpMax || G.dead) { if (G.inv.medkit <= 0) note('No MaxDoc injectors', 'warn', 'medkit'); return; } G.inv.medkit--; p.healT = 3; p.healCd = 6; Au.pick(); }
function switchSlot(i) { if (G.slots[i] >= 0 && i !== G.cur) { G.cur = i; G.p.reloadT = 0; Au.tone(500, .05, 'square', .2); ui('weaponchange'); } }
function mouseWorld() { return { x: G.cam.x + Game.mouse.x / Z, y: G.cam.y + Game.mouse.y / Z }; }
Game.mouseWorld = mouseWorld;
function doHack() {
  const p = G.p, h = D.HACKS[G.hackSel]; if (G.dead || p.hackT > 0) return; const mw = mouseWorld(); let best = null, bd = 90;
  G.enemies.forEach(e => { if (e.dead || e.def.boss && false) return; const d = hyp(e.x - mw.x, e.y - mw.y); if (d < bd && hyp(e.x - p.x, e.y - p.y) < 420) { bd = d; best = e; } });
  if (!best) { note('No hack target under cursor', 'warn', 'chip'); return; } if (p.ram < h.cost) { note('Not enough RAM', 'warn', 'ram'); return; }
  p.ram -= h.cost; p.hackT = .5; p.hackTarget = { e: best, h }; Au.hack(); p.combatT = 5;
}
function applyHack(e, h) {
  const m = G.st.hack; Au.hack(); sparks(e.x, e.y, 12, '#5ef2ff', 200); e.showT = 5; e.alert = 1; e.mem = 6; alertAllies(e);
  if (h.id === 'optics') { e.blind = 5 * m; floatText(e.x, e.y - 30, 'BLINDED', '#5ef2ff', true); }
  else if (h.id === 'shortc') { damageEnemy(e, 60 * m, { src: 'p', canCrit: false }); e.stun = Math.max(e.stun, e.def.boss ? .4 : 1); floatText(e.x, e.y - 30, 'SHORT CIRCUIT', '#5ef2ff', true); }
  else { e.burn = 6 * m; floatText(e.x, e.y - 30, 'OVERHEAT', '#ff9a3d', true); }
}

/* ============================ ENEMY AI ============================ */
function enemyShoot(e, g, ang) {
  const dmg = g.dmg * (1 + (e.lvl - 1) * .06) * (e.t === 'boss' ? 1.1 : 1), a = ang + rnd(-1, 1) * g.spread, sp = g.speed;
  G.proj.push({ x: e.x + Math.cos(ang) * 16 * e.sc, y: e.y + Math.sin(ang) * 16 * e.sc, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, own: 'e', life: 1.8, pierce: 0, hit: [], ang: a, spr: 'bullet_enemy' });
  if (g.id === 'shotgun') for (let i = 0; i < 2; i++) { const a2 = ang + rnd(-1, 1) * g.spread * 1.5; G.proj.push({ x: e.x + Math.cos(ang) * 16 * e.sc, y: e.y + Math.sin(ang) * 16 * e.sc, vx: Math.cos(a2) * sp, vy: Math.sin(a2) * sp, dmg, own: 'e', life: 1.2, pierce: 0, hit: [], ang: a2, spr: 'bullet_enemy' }); }
  fxAnim(e.x + Math.cos(ang) * 22 * e.sc, e.y + Math.sin(ang) * 22 * e.sc, 'muzzle', .8, ang); if (hyp(e.x - G.p.x, e.y - G.p.y) < 500) Au.eshot();
}
function updEnemy(e, dt) {
  const d = e.def, p = G.p; e.flash = Math.max(0, e.flash - dt); e.showT = Math.max(0, e.showT - dt);
  if (e.dead) { e.deadT += dt; return; }
  const dx = p.x - e.x, dy = p.y - e.y, dist = hyp(dx, dy) || 1, toP = Math.atan2(dy, dx);
  if (!e.active) { if (dist < 520 && D.zoneAt(p.x, p.y).id === 'pit') { e.active = true; ui('bossbar', true, d.n); ui('banner', 'THE CHROME BRUTE', 'ARCLIGHT ENFORCER', 'boss'); G.bossFight = true; } else return; }
  if (dist > 1100 && e.state === 'idle') return;
  if (e.kx || e.ky) { moveC(e, e.kx * dt * 6, e.ky * dt * 6, d.r); e.kx *= Math.max(0, 1 - dt * 6); e.ky *= Math.max(0, 1 - dt * 6); if (Math.abs(e.kx) + Math.abs(e.ky) < 4) { e.kx = e.ky = 0; } }
  if (e.burn > 0) { e.burn -= dt; e.burnT += dt; if (e.burnT > .5) { e.burnT = 0; damageEnemy(e, 9 * G.st.hack, { src: 'p', dot: 1, canCrit: false }); if (e.dead) return; } if (Math.random() < .3) part(e.x + rnd(-6, 6), e.y + rnd(-6, 6), { vy: -40, life: .4, max: .4, size: 3, color: '#ff9a3d', drag: 1 }); }
  if (e.stun > 0) { e.stun -= dt; return; } if (e.blind > 0) e.blind -= dt;
  const see = dist < d.sight && e.blind <= 0 && los(e.x, e.y, p.x, p.y) && !G.dead;
  if (see) e.alert = Math.min(1, e.alert + dt * (dist < 160 ? 4 : 1.7)); else e.alert = Math.max(0, e.alert - dt * .2);
  if (e.alert >= 1) { if (e.state !== 'combat') { e.state = 'combat'; alertAllies(e); } e.mem = see ? 6 : e.mem - dt; if (e.mem <= 0) { e.state = 'idle'; e.alert = .3; } } else if (e.state === 'combat' && e.mem > 0) e.mem -= dt; else e.state = 'idle';
  if (G.dead) e.state = 'idle';
  let mx = 0, my = 0, sp = d.spd * (e.burn > 0 ? 1 : 1);
  if (e.t === 'boss') { updBoss(e, dt, dist, toP, see); return; }
  if (e.state === 'idle') {
    e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1.5, 4); if (Math.random() < .55 && !d.static) { const a = rnd(0, TAU); e.wx = Math.cos(a); e.wy = Math.sin(a); } else { e.wx = e.wy = 0; } }
    if (d.static) { e.face += dt * .6; e.aim = e.face; return; }
    if (hyp(e.x - e.hx, e.y - e.hy) > 130) { const a = Math.atan2(e.hy - e.y, e.hx - e.x); e.wx = Math.cos(a); e.wy = Math.sin(a); }
    mx = e.wx * sp * .35; my = e.wy * sp * .35; if (mx || my) e.face = Math.atan2(my, mx);
  } else {
    e.face = toP; e.aim = toP; e.cd -= dt;
    if (d.static) { if (see && dist < d.range) shootLogic(e, dt, dist, toP); return; }
    if (d.melee) {
      if (dist > d.reach * .8 + p.r) { const fd = (see && dist < 220) ? [dx / dist, dy / dist] : flowDir(e) || [dx / dist, dy / dist]; mx = fd[0] * sp; my = fd[1] * sp; }
      if (e.wind > 0) { e.wind -= dt; mx *= .2; my *= .2; if (e.wind <= 0) { if (dist < d.reach + p.r + 10) { hurtPlayer(d.dmg * (1 + (e.lvl - 1) * .06), e.x, e.y); p.vx += Math.cos(toP) * 160; p.vy += Math.sin(toP) * 160; } e.cd = .9; e.swing = .15; } }
      else if (dist < d.reach + p.r && e.cd <= 0) { e.wind = .4; }
      if (e.swing > 0) e.swing -= dt;
    } else if (d.fly) {
      const want = 190 + Math.sin(G.t * .8 + e.ph) * 40, tang = toP + e.strafe * 1.57, rad = (dist - want) / 120;
      mx = (Math.cos(toP) * rad + Math.cos(tang) * .8) * sp; my = (Math.sin(toP) * rad + Math.sin(tang) * .8) * sp; if (Math.random() < dt * .3) e.strafe *= -1;
      if (see && dist < d.range) shootLogic(e, dt, dist, toP);
    } else {
      if (!see || dist > d.range) { const fd = flowDir(e) || [dx / dist, dy / dist]; mx = fd[0] * sp; my = fd[1] * sp; }
      else if (dist < d.keep) { mx = -dx / dist * sp * .8; my = -dy / dist * sp * .8; }
      else { const ta = toP + e.strafe * 1.57; mx = Math.cos(ta) * sp * .55; my = Math.sin(ta) * sp * .55; if (Math.random() < dt * .35) e.strafe *= -1; }
      if (see && dist < d.range) shootLogic(e, dt, dist, toP);
    }
  }
  if (e.wind > 0 && d.gun) { mx *= .3; my *= .3; }
  // separation
  for (const o of G.enemies) { if (o === e || o.dead || o.def.static) continue; const ox = e.x - o.x, oy = e.y - o.y, od = hyp(ox, oy); if (od < 24 && od > .1) { mx += ox / od * 60; my += oy / od * 60; } }
  e.moving = (mx * mx + my * my) > 16; if (e.moving) e.anim += dt * 9;
  if (d.fly) { e.x += mx * dt; e.y += my * dt; e.x = clamp(e.x, 40, MW * TS - 40); e.y = clamp(e.y, 40, MH * TS - 40); } else moveC(e, mx * dt, my * dt, d.r);
}
function shootLogic(e, dt, dist, toP) {
  const g = e.def.gun; if (e.burst <= 0 && e.cd <= 0) { e.burst = g.burst; e.wind = .35; e.cd = 0; }
  if (e.wind > 0) { e.wind -= dt; return; }
  if (e.burst > 0 && e.cd <= 0) { const lead = e.t === 'corp' || e.t === 'drone' ? .12 : 0; const tx = G.p.x + G.p.vx * lead, ty = G.p.y + G.p.vy * lead; enemyShoot(e, g, Math.atan2(ty - e.y, tx - e.x)); e.burst--; e.cd = 1 / g.rof; if (e.burst <= 0) e.cd = rnd(.9, 1.7); }
}
function updBoss(e, dt, dist, toP, see) {
  const d = e.def, p = G.p, pct = e.hp / e.hpMax, rage = pct < .3 ? 1.3 : 1; e.face = e.st === 'charge' ? e.face : toP; e.aim = e.face; e.cd -= dt; e.ph2 = e.ph2 || 0;
  if (e.stunned > 0) { e.stunned -= dt; e.moving = false; return; }
  if (pct < .6 && !e.p2) { e.p2 = true; summonDrones(2); ui('banner', 'PHASE 2', 'REINFORCEMENTS INBOUND', 'boss'); }
  if (pct < .3 && !e.p3) { e.p3 = true; summonDrones(2); ui('banner', 'ENRAGED', 'THE BRUTE IS FURIOUS', 'boss'); shakeCam(8); }
  ui('bossupdate', pct);
  let mx = 0, my = 0;
  if (e.st === 'charge') { e.stT -= dt; if (e.stT > 0) { mx = Math.cos(e.face) * 560; my = Math.sin(e.face) * 560; if (hyp(p.x - e.x, p.y - e.y) < d.r + p.r + 8) { hurtPlayer(34, e.x, e.y); p.vx += Math.cos(e.face) * 340; p.vy += Math.sin(e.face) * 340; e.stT = 0; } } else { e.st = ''; e.cd = 1.2 / rage; } }
  else if (e.st === 'windcharge') { e.stT -= dt; if (e.stT <= 0) { e.st = 'charge'; e.stT = .7; Au.dash(); } }
  else if (e.st === 'slam') { e.stT -= dt; if (e.stT <= 0) { e.st = ''; e.cd = 1.4 / rage; explode(e.x, e.y, 150, 26, false, {}); G.parts.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: .5, max: .5, size: 150, color: '#f3e600', type: 'ring', drag: 0 }); } }
  else if (e.st === 'burst') { e.stT -= dt; if (e.stT <= 0) { e.bc = (e.bc || 0); if (e.bc < 5) { enemyShoot(e, { id: 'rifle', dmg: 13, speed: 620, spread: .05 }, toP); e.bc++; e.stT = .13; } else { e.bc = 0; e.st = ''; e.cd = 1.5 / rage; } } }
  else {
    if (dist > d.reach * .85) { const fd = see && dist < 260 ? [Math.cos(toP), Math.sin(toP)] : flowDir(e) || [Math.cos(toP), Math.sin(toP)]; mx = fd[0] * d.spd * rage; my = fd[1] * d.spd * rage; }
    if (e.wind > 0) { e.wind -= dt; mx *= .1; my *= .1; if (e.wind <= 0) { if (dist < d.reach + p.r + 14) { hurtPlayer(d.dmg, e.x, e.y); p.vx += Math.cos(toP) * 240; p.vy += Math.sin(toP) * 240; } e.cd = .8 / rage; } }
    else if (dist < d.reach + p.r && e.cd <= 0) { e.wind = .45; }
    else if (e.cd <= 0) { const r = Math.random(); if (r < .35 && dist > 160) { e.st = 'windcharge'; e.stT = .65; e.face = toP; } else if (r < .6 && dist < 230) { e.st = 'slam'; e.stT = .8; } else if (r < .85 && e.p2 && dist > 150) { e.st = 'burst'; e.stT = .3; } else e.cd = .5; }
  }
  const hit = moveC(e, mx * dt, my * dt, d.r); if (hit && e.st === 'charge') { e.st = ''; e.stunned = 1.8; e.cd = 1; shakeCam(10); sparks(e.x, e.y, 20, '#f3e600', 280); floatText(e.x, e.y - 50, 'STUNNED', '#f3e600', true); }
  e.moving = (mx * mx + my * my) > 16; if (e.moving) e.anim += dt * 8;
}
function summonDrones(n) { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), x = clamp(G.p.x + Math.cos(a) * 240, 110 * TS, 114 * TS), y = clamp(G.p.y + Math.sin(a) * 240, 8 * TS, 28 * TS), id = 'dr' + G.t.toFixed(2) + i; const e = spawnEnemy('drone', x, y, 6, id); e.state = 'combat'; e.alert = 1; e.mem = 9; fxAnim(x, y, 'explosion', .4); } }

/* ============================ NPC / PICKUP / PROJECTILES ============================ */
function updNPC(n, dt) {
  n.bark = Math.max(0, n.bark - dt); n.moving = false; if (!n.wander) return; n.wt -= dt;
  if (n.wt <= 0) { n.wt = rnd(2, 5); if (Math.random() < .6) { n.tx = n.hx + rnd(-80, 80); n.ty = n.hy + rnd(-60, 60); n.go = true; } else n.go = false; }
  if (n.go) { const dx = n.tx - n.x, dy = n.ty - n.y, d = hyp(dx, dy); if (d < 6) n.go = false; else { n.face = Math.atan2(dy, dx); n.moving = true; n.anim += dt * 6; moveC(n, dx / d * 45 * dt, dy / d * 45 * dt, 9); } }
}
function collectPickup(pk) {
  const p = G.p; Au.pick();
  if (pk.kind === 'eddies') giveEddies(pk.n);
  else if (pk.kind === 'ammo') { if (giveAmmo(pk.ammo, pk.n) <= 0) return false; }
  else if (pk.kind === 'item') giveItem(pk.id, pk.n);
  else if (pk.kind === 'weapon') giveGun(pk.id, pk.tier);
  else if (pk.kind === 'shard') { G.picked[pk.id] = 1; G.codex[pk.id] = 1; note('Data shard: ' + D.CODEX[pk.id].n, 'quest', 'shard'); Au.ding(); if (Q.active('s1')) Q.add('s1'); ui('codexnew', D.CODEX[pk.id].n); giveXP(40); }
  return true;
}
function updPickups(dt) {
  const p = G.p;
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const k = G.pickups[i]; k.life -= dt; if (k.life <= 0) { G.pickups.splice(i, 1); continue; }
    if (k.vx || k.vy) { const nx = k.x + k.vx * dt, ny = k.y + k.vy * dt; if (!solidAt(nx, k.y)) k.x = nx; else k.vx = 0; if (!solidAt(k.x, ny)) k.y = ny; else k.vy = 0; k.vx *= Math.max(0, 1 - dt * 5); k.vy *= Math.max(0, 1 - dt * 5); }
    const d = hyp(p.x - k.x, p.y - k.y); if (G.dead) continue; const mag = k.kind === 'eddies' || k.kind === 'ammo' || (k.kind === 'item' && (k.id === 'scrap' || k.id === 'comp'));
    if (mag && d < 100 && d > 1) { k.x += (p.x - k.x) / d * 260 * dt; k.y += (p.y - k.y) / d * 260 * dt; }
    if (d < 24 && collectPickup(k) !== false) G.pickups.splice(i, 1);
  }
}
function updProj(dt) {
  const p = G.p;
  for (let i = G.proj.length - 1; i >= 0; i--) {
    const b = G.proj[i]; b.life -= dt; if (b.life <= 0) { G.proj.splice(i, 1); continue; }
    const dist = hyp(b.vx, b.vy) * dt, n = Math.ceil(dist / 7), sx = b.vx * dt / n, sy = b.vy * dt / n; let dead = false;
    for (let s = 0; s < n && !dead; s++) {
      b.x += sx; b.y += sy;
      if (solidAt(b.x, b.y)) { sparks(b.x, b.y, 4, '#ffe9a0', 120); dead = true; break; }
      if (b.own === 'p') {
        for (const e of G.enemies) { if (e.dead || b.hit.includes(e)) continue; if (hyp(e.x - b.x, e.y - b.y) < e.def.r * (e.sc > 1.5 ? 1 : 1) + 3) { b.hit.push(e); damageEnemy(e, b.dmg, { src: 'p', knock: 40, kx: b.vx, ky: b.vy, ang: b.ang }); if (b.pierce-- <= 0) { dead = true; break; } } }
        if (!dead) for (const pr of G.props) { if (hyp(pr.x - b.x, pr.y - b.y) < pr.r) { damageProp(pr, b.dmg, false); dead = true; break; } }
      } else if (hyp(p.x - b.x, p.y - b.y) < p.r + 2 && !G.dead) { hurtPlayer(b.dmg, b.x - b.vx, b.y - b.vy); dead = true; }
    }
    if (dead) G.proj.splice(i, 1);
  }
  for (let i = G.gren.length - 1; i >= 0; i--) { const g = G.gren[i]; g.t += dt; const k = Math.min(1, g.t / g.T); g.x = g.sx + (g.tx - g.sx) * k; g.y = g.sy + (g.ty - g.sy) * k; if (k >= 1) { explode(g.x, g.y, 100 * Math.sqrt(G.st.gren), 130 * G.st.gren, true); G.gren.splice(i, 1); } }
}

/* ============================ INTERACTION ============================ */
function findInteract() {
  const p = G.p; let best = null, bd = 1e9; const test = (o, r, label, need, act, key) => { const d = hyp(o.x - p.x, o.y - p.y); if (d < r && d < bd) { bd = d; best = { o, label, need: need || 0, act, key: key || o.id }; } };
  G.npcs.forEach(n => { if (n.role !== 'CIVILIAN') test(n, 62, 'Talk to ' + n.name, 0, () => ui('openDialog', n.id)); else test(n, 50, 'Talk', 0, () => { n.bark = 2.2; n.line = pick(['Not my business.', 'Mind the Rats up north.', 'Eddies don\'t grow on trees.', 'Keep walking, stranger.', 'Rain again...']); }); });
  G.conts.forEach(c => { if (!c.open) test(c, 52, c.loot === 'core' ? 'Search locker' : 'Open ' + (c.t === 'medcrate' ? 'medical crate' : 'locker'), 0.35, () => openContainer(c)); });
  D.LEVEL.checkpoints.forEach(c => test({ x: c.x * TS + 16, y: c.y * TS + 16, id: c.id }, 56, 'Use checkpoint terminal', 0, () => useCheckpoint(c)));
  G.relays.forEach(r => { if (!r.on) test(r, 54, 'Hack gang relay', 1.5, () => { r.on = true; G.flags['relay_' + r.id] = 1; if (Q.active('m3')) { const n = Q.add('m3'); note('Relay disabled (' + n + '/3)', 'obj', 'check'); } else note('Relay disabled', 'obj', 'check'); sparks(r.x, r.y, 20, '#5ef2ff', 240); Au.hack(); giveXP(30); }); });
  const mf = D.LEVEL.mainframe; if (!G.flags.mainframe && Q.active('m4') && Q.step('m4') === 1) test({ x: mf.x * TS, y: (mf.y + 1.6) * TS, id: 'mf' }, 70, 'Hack mainframe', 4, hackMainframe);
  const el = D.LEVEL.elevator; if (G.boss && G.boss.dead && !G.victory) test({ x: el.x * TS, y: el.y * TS, id: 'el' }, 80, 'Take the elevator out of Sector 07', 0, doVictory);
  return best;
}
function openContainer(c) {
  c.open = true; G.looted[c.id] = 1; Au.pick(); sparks(c.x, c.y, 6, '#c9b27a', 100);
  if (c.loot === 'core') { G.inv.core = 1; note('Courier Data Core acquired', 'quest', 'core'); Au.ding(); } else if (c.loot === 'cargo') { note('Medical supplies recovered', 'quest', 'medkit'); if (Q.active('s3')) { const n = Q.add('s3'); note('Medical crates (' + n + '/2)', 'obj', 'check'); } dropPickup('item', c.x, c.y, { id: 'medkit', n: 1 }); }
  else spawnLoot(c.x, c.y, c.loot, 2); giveXP(10);
}
function useCheckpoint(c) { G.cp = c.id; G.cpSeen[c.id] = 1; const p = G.p; derive(); p.hp = p.hpMax; p.armor = p.armorMax; p.ram = p.ramMax; Game.save(); note('Checkpoint saved', 'quest', 'checkpoint'); Au.ding(); sparks(c.x * TS + 16, c.y * TS + 16, 14, '#5ef2ff', 200); }
function hackMainframe() {
  G.flags.mainframe = 1; Au.hack(); sparks(D.LEVEL.mainframe.x * TS, D.LEVEL.mainframe.y * TS, 30, '#5ef2ff', 300); ui('banner', 'ALARM TRIGGERED', 'SECURITY RESPONSE INBOUND', 'boss'); note('Blueprints downloaded', 'quest', 'chip'); Q.goto('m4', 2); G.codex.shard3 = G.codex.shard3 || 1;
  G.wave = []; [[72, 20, 'corp'], [84, 20, 'corp'], [76, 24, 'corp'], [64, 21, 'corp'], [78, 22, 'heavy']].forEach((s, i) => { const id = 'wv' + i; const e = spawnEnemy(s[2], s[0] * TS, s[1] * TS, 5, id); e.state = 'combat'; e.alert = 1; e.mem = 12; G.wave.push(id); fxAnim(e.x, e.y, 'explosion', .35); });
  shakeCam(6);
}
function doVictory() { G.victory = true; Q.finish('m5'); G.codex.brute = 1; ui('victory', G.stats, G.play); Au.ding(); }
function openGate() { G.flags.gate = 1; for (let i = 50; i < 58; i++) solidGrid[42 * MW + i] = 0; Au.boom(); shakeCam(5); note('Corp gate unlocked', 'quest', 'lock'); }
Game.openGate = openGate;
Game.interact = function () { if (!G || G.dead || !G.itarget) return; if (G.itarget.need === 0) { G.itarget.act(); G.ip = 0; } };

/* ============================ DIALOGUE ============================ */
Game.dialogRoot = function (id) {
  const q = G.q, st = k => q[k] && q[k].state, step = k => q[k] ? q[k].step : -1, N = (who, text, opts) => ({ who, text, opts });
  const bye = (t = 'Later.') => ({ t, go: () => null });
  if (id === 'kestrel') {
    const W = 'KESTREL';
    if (st('m1') === 'active' && step('m1') === 2) return N(W, 'There you are. I heard the shooting from the alley. Rust Rats don\'t hire good shots, so you must be new. I\'m Kestrel. I fix things. Mostly problems.', [{ t: 'Got work for me?', go: () => { Q.finish('m1'); Q.start('m2'); giveAmmo('9mm', 30); return N(W, 'Courier named Dax went dark in the southern Scrapyard with a corp data core. Find the lockers at the far south-east end and bring it back. Take this ammo, you\'ll need it.', [bye('On it.')]); } }]);
    if (st('m2') === 'active' && step('m2') === 1) return N(W, 'That looks like it. Hand it over.', [{ t: 'Here you go.', go: () => { G.inv.core = 0; Q.finish('m2'); Q.start('m3'); codexUnlock('rats'); return N(W, 'Clean work. Next problem: the gang runs relays that sniff my client\'s signal. Two in the northern yard, one in the south. Hold E on each to burn it. And if you want extra eddies, I\'ve a bounty on the Rust Rat Captain.', [bye('Understood.')]); } }]);
    if (st('m3') === 'active' && step('m3') === 1) return N(W, 'The relays went dark an hour ago. I like you. Here\'s the real job.', [{ t: 'Go on.', go: () => { Q.finish('m3'); Q.start('m4'); openGate(); codexUnlock('arclight'); return N(W, 'Arclight\'s north compound holds my client\'s stolen blueprints. I\'ve unlocked the gate on Arclight Avenue. Hit the mainframe in the server hall, expect an alarm, then run east. The Pit corridor is the only way out.', [bye('Consider it done.')]); } }]);
    if (st('s4') === 'active' && step('s4') === 1) return N(W, 'The Captain\'s dead? Beautiful. Your bounty.', [{ t: 'Pay up.', go: () => { Q.finish('s4'); return N(W, 'Pleasure doing business.', [bye('Likewise.')]); } }]);
    const opts = [];
    if (st('m2') === 'done' && !q.s4) opts.push({ t: 'Any extra work?', go: () => { Q.start('s4'); return N(W, 'The Rust Rat Captain. Southern Scrapyard, heavily guarded. Seven hundred eddies and a nice sidearm for his head.', [bye('I\'ll hunt him.')]); } });
    opts.push({ t: 'What do you know about the Chrome Brute?', go: () => { codexUnlock('brute'); return N(W, 'Arclight\'s enforcer. Eighty percent machine. He charges before he thinks: stay behind cover when he lines up, and stay out of range when he slams.', [bye('Good to know.')]); } });
    opts.push(bye('See you.'));
    const msg = st('m4') === 'active' || st('m5') === 'active' ? 'Gate\'s open. Server hall, mainframe, then east. Don\'t get dead.' : st('m2') === 'active' ? 'Core\'s still out there: southern Scrapyard, far east lockers.' : st('m3') === 'active' ? 'Two relays in the north yard, one in the south. Hold E to burn them.' : 'Anything else?';
    return N(W, msg, opts);
  }
  if (id === 'juno') {
    const W = 'JUNO'; const o = [{ t: 'Show me what you\'ve got.', go: () => { ui('openShop'); return null; } }];
    if (!q.s1) o.push({ t: 'Anything I can do for you?', go: () => { Q.start('s1'); return N(W, 'Three data shards scattered across the backstreets. One in the alley yard, one in the northern Scrapyard, one in the south. Bring them to me and I\'ll make it worth your while.', [bye('I\'ll look.')]); } });
    if (st('s1') === 'active' && step('s1') === 1) o.push({ t: 'I\'ve got your shards.', go: () => { Q.finish('s1'); return N(W, 'Beautiful. Take this SMG. It fell off a truck.', [bye('Thanks.')]); } });
    o.push(bye('Bye.')); return N(W, st('s1') === 'active' && step('s1') === 0 ? 'Still need those shards. Three of them.' : 'Fresh stock, fair prices. Mostly fair.', o);
  }
  if (id === 'mira') {
    const W = 'DOC MIRA'; const o = [{ t: 'Browse cyberware.', go: () => { ui('openRipper'); return null; } }, { t: 'Patch me up. (40 eddies)', go: () => { if (G.p.eddies < 40) return N(W, 'No eddies, no stitches.', [bye('Right.')]); G.p.eddies -= 40; derive(); G.p.hp = G.p.hpMax; G.p.armor = G.p.armorMax; Au.pick(); return N(W, 'Good as new. Don\'t bleed on the chair.', [bye('Thanks.')]); } }];
    if (!q.s3) o.push({ t: 'Need any help?', go: () => { Q.start('s3'); return N(W, 'Arclight seized my medical shipment. Two crates inside their north compound. Bring them back.', [bye('I\'ll find them.')]); } });
    if (st('s3') === 'active' && step('s3') === 1) o.push({ t: 'I\'ve got your crates.', go: () => { Q.finish('s3'); return N(W, 'You\'re a lifesaver. Here, spare armor patches.', [bye('Anytime.')]); } });
    o.push(bye('Bye.')); return N(W, 'Don\'t bleed on the chair. What can I install?', o);
  }
  return null;
};
function codexUnlock(id) { if (!G.codex[id]) { G.codex[id] = 1; ui('codexnew', D.CODEX[id].n); } }

/* ============================ SAVE / LOAD ============================ */
const KEY = 'cyberpix_save_v2';
Game.hasSave = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
Game.save = function () { if (!G) return; try { const s = JSON.parse(JSON.stringify({ p: G.p, guns: G.guns, slots: G.slots, cur: G.cur, ammo: G.ammo, inv: G.inv, cyber: G.cyber, q: G.q, tracked: G.tracked, codex: G.codex, msgs: G.msgs, hinted: G.hinted, flags: G.flags, killed: G.killed, looted: G.looted, picked: G.picked, cp: G.cp, cpSeen: G.cpSeen, stats: G.stats, play: G.play, wave: G.wave, hackSel: G.hackSel })); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
Game.newGame = function () {
  ensureLevel(); G = newState(); Game.G = G; const cp = D.LEVEL.checkpoints[0]; G.p.y = cp.y * TS + 48; G.q.m1 = { state: 'active', step: 0, n: 0 }; G.q.s2 = { state: 'active', step: 0, n: 0 }; G.tracked = 'm1'; derive(); G.p.hp = G.p.hpMax; G.p.armor = G.p.armorMax; G.p.stam = G.p.stamMax; G.p.ram = G.p.ramMax;
  setupEntities(); G.cam.x = G.p.x - W / Z / 2; G.cam.y = G.p.y - H / Z / 2; computeFlow(); ui('newgame'); setTimeout(() => G && ui('banner', 'BACK ALLEY', 'WESTBROOK // SECTOR 07', 'zone'), 400);
};
Game.load = function () {
  ensureLevel(); let s = null; try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} if (!s) return false;
  G = newState(); Game.G = G; Object.assign(G, { guns: s.guns, slots: s.slots, cur: s.cur, ammo: s.ammo, inv: s.inv, cyber: s.cyber, q: s.q, tracked: s.tracked, codex: s.codex, msgs: s.msgs, hinted: s.hinted, flags: s.flags, killed: s.killed, looted: s.looted, picked: s.picked, cp: s.cp, cpSeen: s.cpSeen, stats: s.stats, play: s.play || 0, wave: s.wave || [], hackSel: s.hackSel || 0 }); Object.assign(G.p, s.p); G.p.vx = G.p.vy = 0;
  derive(); setupEntities(); const cp = D.LEVEL.checkpoints.find(c => c.id === G.cp) || D.LEVEL.checkpoints[0]; G.p.x = cp.x * TS + 16; G.p.y = cp.y * TS + 48; G.p.hp = Math.max(G.p.hp, G.p.hpMax * .6); G.p.invul = 1.5;
  if (G.flags.gate) openGate2(); G.cam.x = G.p.x - W / Z / 2; G.cam.y = G.p.y - H / Z / 2; computeFlow(); ui('newgame'); return true;
};
function openGate2() { for (let i = 50; i < 58; i++) solidGrid[42 * MW + i] = 0; }

/* ============================ ECONOMY API (for UI) ============================ */
Game.api = {
  equip(gi) { if (G.slots.includes(gi)) { G.cur = G.slots.indexOf(gi); return; } let s = G.slots.indexOf(-1); if (s < 0) s = G.cur; G.slots[s] = gi; G.cur = s; Au.pick(); },
  use(id) { if (id === 'medkit') useMedkit(); else if (id === 'armorpatch' && G.inv.armorpatch > 0 && G.p.armor < G.p.armorMax) { G.inv.armorpatch--; G.p.armor = Math.min(G.p.armorMax, G.p.armor + 60); Au.pick(); } },
  craft(r) { const c = r.cost; for (const k in c) if ((G.inv[k] || 0) < c[k]) return false; for (const k in c) G.inv[k] -= c[k]; if (r.ammo) { G.ammo[r.ammo] = Math.min(D.AMMO[r.ammo].max, G.ammo[r.ammo] + r.n); } else G.inv[r.out] = (G.inv[r.out] || 0) + r.n; Au.pick(); giveXP(8); return true; },
  buy(kind, id, price, tier) { if (G.p.eddies < price) { Au.empty(); return false; } G.p.eddies -= price; if (kind === 'item') G.inv[id] = (G.inv[id] || 0) + 1; else if (kind === 'ammo') G.ammo[id] = Math.min(D.AMMO[id].max, G.ammo[id] + D.AMMO[id].pack); else if (kind === 'weapon') giveGun(id, tier || 0); Au.pick(); return true; },
  sell(kind, id, price) { if (kind === 'item') { if (!(G.inv[id] > 0)) return false; G.inv[id]--; } else if (kind === 'gun') { const gi = id; if (G.slots.includes(gi) && G.slots.filter(s => s >= 0).length <= 1) return false; const s = G.slots.indexOf(gi); if (s >= 0) { G.slots[s] = -1; if (G.cur === s) G.cur = G.slots.findIndex(x => x >= 0); } G.guns[gi].sold = true; } G.p.eddies += price; Au.pick(); return true; },
  install(id) { const c = D.CYBER[id]; if (G.cyber[c.slot] === id) return false; if (G.p.eddies < c.price) { Au.empty(); return false; } G.p.eddies -= c.price; G.cyber[c.slot] = id; derive(); Au.ding(); return true; },
  attr(id) { const p = G.p; if (p.attrPts <= 0 || p.attrs[id] >= 12) return false; p.attrs[id]++; p.attrPts--; derive(); if (id === 'body') p.hp += 8; Au.tone(700, .06, 'square', .25); return true; },
  perk(id) { const p = G.p, pk = D.PERKS.find(x => x.id === id); if (p.perks[id] || p.perkPts <= 0 || p.attrs[pk.attr] < pk.req) return false; p.perks[id] = 1; p.perkPts--; derive(); Au.ding(); return true; },
  track(id) { if (G.q[id] && G.q[id].state === 'active') G.tracked = id; },
  hackSel(i) { G.hackSel = i; },
};

/* ============================ UPDATE ============================ */
Game.keydown = function (code) {
  if (!G || G.dead || G.victory && false) return; const K = Cfg.keys;
  if (code === K.interact) { if (G.itarget && G.itarget.need === 0) Game.interact(); }
  else if (code === K.reload) startReload(); else if (code === K.heal) useMedkit(); else if (code === K.grenade) throwGrenade(); else if (code === K.hack) doHack();
  else if (code === K.hackcycle) { G.hackSel = (G.hackSel + 1) % D.HACKS.length; Au.tone(600, .04, 'square', .2); ui('hackchange'); }
  else if (code === K.melee) doMelee(); else if (code === K.wheel) { G.wheel = true; }
  else if (code === K.dash) tryDash(); else if (/^Digit[1-4]$/.test(code)) switchSlot(+code.slice(5) - 1);
};
Game.keyup = function (code) { if (!G) return; if (code === Cfg.keys.wheel && G.wheel) { G.wheel = false; if (G.slots[G.wheelSel] >= 0) switchSlot(G.wheelSel); } };
Game.mousedown = function (b) { if (!G || G.dead) return; Au.init(); if (b === 0) { Game.mouse.down = true; tryFire(true); } else if (b === 2) { Game.mouse.right = true; doMelee(); } };
Game.mouseup = function (b) { if (b === 0) Game.mouse.down = false; if (b === 2) Game.mouse.right = false; };
Game.wheelScroll = function (d) { if (!G || G.dead) return; for (let k = 1; k <= 4; k++) { const i = (G.cur + d * k + 40) % 4; if (G.slots[i] >= 0) { switchSlot(i); break; } } };
function tryDash() {
  const p = G.p, K = Game.keys, c = Cfg.keys; if (p.dash > 0 || p.stam < G.st.dashCost || G.dead) return; let ix = (K[c.right] ? 1 : 0) - (K[c.left] ? 1 : 0), iy = (K[c.down] ? 1 : 0) - (K[c.up] ? 1 : 0);
  if (!ix && !iy) { ix = Math.cos(p.aim); iy = Math.sin(p.aim); } const l = hyp(ix, iy); p.dashX = ix / l; p.dashY = iy / l; p.dash = .17; p.invul = Math.max(p.invul, .26); p.stam -= G.st.dashCost; p.stamT = .7; Au.dash(); if (cy('reflex')) G.slow = 1.4; hint('dash', 'Dashing grants brief invulnerability.');
}
const actionHints = () => { hint('move', 'Move with [W][A][S][D]. Aim with the mouse.'); };
Game.update = function (dtReal) {
  if (!G) return; ensureLevel(); const K = Game.keys, c = Cfg.keys; let dt = Math.min(.05, dtReal);
  G.t += dt; if (!G.victory) G.play += dt; const p = G.p;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  // time scale
  const target = G.wheel ? .2 : G.slow > 0 ? .45 : 1; G.slow = Math.max(0, G.slow - dt); G.ts += (target - G.ts) * Math.min(1, dt * 10); const wdt = dt * G.ts, pdt = dt * Math.min(1, G.ts * 2.2);
  G.shake = Math.max(0, G.shake - dt * 30);
  if (G.dead) { G.deadT += dt; G.ts += (.3 - G.ts) * .1; updParts(dt); updEnemyList(wdt); return; }
  actionHints();
  // aim
  const mw = mouseWorld(); p.aim = Math.atan2(mw.y - p.y, mw.x - p.x);
  // movement
  let ix = (K[c.right] || K.ArrowRight ? 1 : 0) - (K[c.left] || K.ArrowLeft ? 1 : 0), iy = (K[c.down] || K.ArrowDown ? 1 : 0) - (K[c.up] || K.ArrowUp ? 1 : 0); const il = hyp(ix, iy); if (il > 0) { ix /= il; iy /= il; }
  let mvx = ix * G.st.speed * (p.reloadT > 0 ? .9 : 1), mvy = iy * G.st.speed * (p.reloadT > 0 ? .9 : 1);
  if (p.dash > 0) { p.dash -= pdt; mvx = p.dashX * 640; mvy = p.dashY * 640; p.vx = mvx; p.vy = mvy; if (Math.random() < .8) part(p.x, p.y, { life: .25, max: .25, size: 8, color: 'rgba(94,242,255,.45)', type: 'circ', drag: 0 }); }
  else { p.vx += (mvx - p.vx) * Math.min(1, pdt * 14); p.vy += (mvy - p.vy) * Math.min(1, pdt * 14); }
  moveC(p, p.vx * pdt, p.vy * pdt, p.r); p.moving = hyp(p.vx, p.vy) > 30; if (p.moving) p.anim += pdt * (hyp(p.vx, p.vy) / 190) * 9;
  // hazards
  const tt = tAt((p.x / TS) | 0, (p.y / TS) | 0); if (tt === T.HAZ && !cy('shock') && p.dash <= 0) { p.hazT = (p.hazT || 0) + pdt; if (p.hazT > .4) { p.hazT = 0; hurtPlayer(7, p.x, p.y + 1, 'haz'); sparks(p.x, p.y, 6, '#5ef2ff', 140); } }
  // timers
  p.invul = Math.max(0, p.invul - pdt); p.flash = Math.max(0, p.flash - pdt); p.wcd = Math.max(0, p.wcd - pdt); p.melee = Math.max(0, p.melee - pdt); p.swingT = Math.max(0, p.swingT - pdt); p.kick = Math.max(0, p.kick - pdt * 40); p.healCd = Math.max(0, p.healCd - pdt); p.combatT = Math.max(0, p.combatT - pdt); p.armorT = Math.max(0, (p.armorT || 0) - pdt);
  if (p.reloadT > 0) { p.reloadT -= pdt; if (p.reloadT <= 0) finishReload(); }
  if (p.healT > 0) { const h = 70 / 3 * pdt; p.hp = Math.min(p.hpMax, p.hp + h); p.healT -= pdt; }
  p.stamT = Math.max(0, p.stamT - pdt); if (p.stamT <= 0 && p.stam < p.stamMax) p.stam = Math.min(p.stamMax, p.stam + 34 * pdt);
  if (p.combatT <= 0) { if (p.armor < p.armorMax && p.armorT <= 0) p.armor = Math.min(p.armorMax, p.armor + 6 * pdt); if (cy('painedit') && p.hp < p.hpMax) p.hp = Math.min(p.hpMax, p.hp + 2.5 * pdt); }
  p.ram = Math.min(p.ramMax, p.ram + pdt * (cy('coproc') ? .45 : .28));
  if (p.hackT > 0) { p.hackT -= pdt; if (p.hackT <= 0 && p.hackTarget) { if (!p.hackTarget.e.dead) applyHack(p.hackTarget.e, p.hackTarget.h); p.hackTarget = null; } }
  if (K.hackDummy) { }
  if (Game.mouse.down) tryFire(false);
  // wheel select
  if (G.wheel) { const mx = Game.mouse.x - W / 2, my = Game.mouse.y - H / 2; if (hyp(mx, my) > 30) { const a = Math.atan2(my, mx); G.wheelSel = Math.abs(a + 1.57) < .79 ? 0 : Math.abs(a) < .79 ? 1 : Math.abs(angDiff(a, 1.57)) < .79 ? 2 : 3; } }
  // entities
  updEnemyList(wdt); G.npcs.forEach(n => updNPC(n, wdt)); G.props.forEach(pr => { pr.flash = Math.max(0, pr.flash - dt); });
  updProj(wdt); updPickups(dt); updParts(dt);
  // flow field
  G.flowT -= dt; if (G.flowT <= 0 && G.enemies.some(e => e.state === 'combat' && !e.dead)) { computeFlow(); G.flowT = .35; }
  // interaction
  const it = findInteract(); if (!it || !G.itarget || it.key !== G.itarget.key) G.ip = 0; G.itarget = it;
  if (it && it.need > 0 && K[c.interact]) { G.ip += dt / it.need; if (G.ip >= 1) { G.ip = 0; it.act(); } } else if (!K[c.interact]) G.ip = 0;
  // zone
  const z = D.zoneAt(p.x, p.y); if (!G.zone || G.zone.id !== z.id) { const first = !G.zone; G.zone = z; if (!first || true) ui('banner', z.n, z.sub, 'zone'); if (z.id === 'market') hint('market', 'Safe zone. Talk to Juno (shop), Mira (cyberware) and Kestrel (missions).'); }
  checkQuests();
  // camera
  const tx = p.x + (mw.x - p.x) * .22, ty = p.y + (mw.y - p.y) * .22, vw = W / Z, vh = H / Z; G.cam.x += (tx - vw / 2 - G.cam.x) * Math.min(1, dt * 7); G.cam.y += (ty - vh / 2 - G.cam.y) * Math.min(1, dt * 7);
  G.cam.x = clamp(G.cam.x, 0, MW * TS - vw); G.cam.y = clamp(G.cam.y, 0, MH * TS - vh);
  if (G.t < 8) hint('aim', 'Hold [LMB] to fire. [R] reload, [Shift] dash, [RMB] melee.');
  if (Q.active('m1') && Q.step('m1') === 0) hint('m1', 'Fight your way north out of the alley. Check the tracked mission.');
};
function updEnemyList(dt) { for (const e of G.enemies) updEnemy(e, dt); }
function updParts(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; if (q.life <= 0) { G.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; const dr = Math.max(0, 1 - q.drag * dt); q.vx *= dr; q.vy *= dr; }
  for (let i = G.floats.length - 1; i >= 0; i--) { const f = G.floats[i]; f.t += dt; f.y -= 28 * dt; f.x += f.vx * dt; if (f.t > (f.big ? 1.1 : .8)) G.floats.splice(i, 1); }
  for (let i = G.fxs.length - 1; i >= 0; i--) { G.fxs[i].t += dt; if (G.fxs[i].t > (G.fxs[i].kind === 'muzzle' ? .06 : .5)) G.fxs.splice(i, 1); }
}

/* ============================ RENDER ============================ */
function charSprite(set, e, moving) { const S = A.sets[set]; if (!S) return null; return moving ? S.walk[Math.floor(e.anim) % 4] : S.idle; }
function drawChar(c, e, set, ang, scale, weaponId, kick, flash) {
  const spr = e.dead ? A.sets[set].dead : charSprite(set, e, e.moving || (e === G.p && G.p.moving)); if (!spr) return;
  c.save(); c.translate(e.x, e.y); c.rotate(ang); if (scale !== 1) c.scale(scale, scale);
  c.drawImage(spr, -24, -24);
  if (!e.dead && weaponId) { const w = A.get('weapons', weaponId); if (w) { c.drawImage(w, 13 - w.grip[0] - (kick || 0), -w.grip[1]); } }
  if (flash > 0) { c.globalAlpha = Math.min(1, flash * 9); c.drawImage(A.sil(spr, '#ffffff'), -24, -24); }
  c.restore();
}
function tileSprite(t, tx, ty) {
  const h = hash(tx, ty), g = n => A.cats.tiles[n];
  switch (t) {
    case T.ASPH: return g('asph_' + h % 3); case T.LANEH: return g('asph_h'); case T.LANEV: return g('asph_v'); case T.CROSSH: return g('cross_h'); case T.CROSSV: return g('cross_v');
    case T.SIDE: return g('side_' + h % 2); case T.PLAZA: return g('plaza_' + (h % 7 === 0 ? 1 : 0)); case T.METAL: return g('metal_' + (h % 5 === 0 ? 1 : 0)); case T.SCRAP: return g('scrap_' + h % 3); case T.HAZ: return g('haz_0'); case T.PIT: return g('pit_' + (ty % 4 === 0 ? 1 : 0));
    case T.ROOF: { const south = tAt(tx, ty + 1); if (south !== T.ROOF && south !== T.VOID) return g(h % 13 === 0 ? 'face_dark' : 'face_' + h % 3); return g('roof_' + h % 3); }
    default: return g('void');
  }
}
function renderWorld(c, camx, camy, time, live) {
  const vw = W / Z, vh = H / Z, x0 = Math.max(0, (camx / TS) | 0), y0 = Math.max(0, (camy / TS) | 0), x1 = Math.min(MW - 1, ((camx + vw) / TS | 0) + 1), y1 = Math.min(MH - 1, ((camy + vh) / TS | 0) + 1);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = tiles[ty * MW + tx], spr = tileSprite(t, tx, ty); c.drawImage(spr, tx * TS, ty * TS);
    if (t === T.HAZ) { c.strokeStyle = `rgba(94,242,255,${.4 + Math.sin(time * 6 + tx) * .25})`; c.lineWidth = 1; c.beginPath(); c.moveTo(tx * TS + 3, ty * TS + 10 + Math.sin(time * 3 + tx + ty) * 3); c.lineTo(tx * TS + 28, ty * TS + 20 + Math.cos(time * 4 + tx) * 3); c.stroke(); }
    if (t === T.ROOF) { const h = hash(tx, ty), south = tAt(tx, ty + 1); if (south === T.ROOF && tAt(tx, ty - 1) === T.ROOF && h % 17 === 0) { const d = A.get('props', ROOFDET[h % 4]); c.drawImage(d, tx * TS + 16 - d.width / 2, ty * TS + 16 - d.height / 2); } else if (south !== T.ROOF && south !== T.VOID && h % 9 === 0 && tAt(tx - 1, ty) === T.ROOF && tAt(tx + 1, ty) === T.ROOF && tAt(tx - 1, ty + 1) !== T.ROOF && tAt(tx + 1, ty + 1) !== T.ROOF) { const s = A.get('props', SIGNS[h % SIGNS.length]); c.drawImage(s, tx * TS + 16 - s.width / 2, ty * TS + 2); } }
  }
  const inV = (x, y, m = 80) => x > camx - m && x < camx + vw + m && y > camy - m && y < camy + vh + m;
  decals.forEach(d => { if (inV(d.x, d.y)) { const s = A.get('props', d.t); c.save(); c.translate(d.x, d.y); c.rotate(d.rot); c.globalAlpha = .9; c.drawImage(s, -20, -20); c.restore(); } });
  if (live && G.decalsDyn) G.decalsDyn.forEach(d => { if (inV(d.x, d.y)) { const s = A.get('props', d.t); c.save(); c.translate(d.x, d.y); c.rotate(d.rot); c.globalAlpha = .8; c.drawImage(s, -20, -20); c.restore(); } });
  // static decor (with shadow)
  decor.forEach(d => { if (!inV(d.x, d.y, 100)) return; c.save(); c.translate(d.x, d.y); c.rotate(d.rot); if (d.t !== 'elevator' && d.t !== 'pipes') { c.globalAlpha = .38; c.drawImage(A.sil(d.spr, '#000'), -d.spr.width / 2 + 4, -d.spr.height / 2 + 5); c.globalAlpha = 1; } c.drawImage(d.spr, -d.spr.width / 2, -d.spr.height / 2); c.restore(); });
  lamps.forEach(l => { if (inV(l.x, l.y)) { const s = A.get('props', 'lamp'); c.drawImage(s, l.x - 9, l.y - 9); } });
  if (live) {
    // checkpoints
    D.LEVEL.checkpoints.forEach(cp => { const x = cp.x * TS + 16, y = cp.y * TS + 16; if (inV(x, y)) { const s = A.get('props', G.cp === cp.id ? 'terminal_on' : 'terminal_off'); c.drawImage(s, x - 22, y - 22); } });
    G.relays.forEach(r => { if (inV(r.x, r.y)) { const s = A.get('props', r.on ? 'relay_on' : 'relay_off'); c.drawImage(A.sil(s, 'rgba(0,0,0,.4)'), r.x - 10, r.y - 9); c.drawImage(s, r.x - 14, r.y - 14); } });
    G.conts.forEach(k => { if (inV(k.x, k.y)) { const s = A.get('props', k.t === 'locker' ? (k.open ? 'locker_open' : 'locker') : k.open ? 'crate' : k.t); c.globalAlpha = .35; c.drawImage(A.sil(s, '#000'), k.x - s.width / 2 + 3, k.y - s.height / 2 + 4); c.globalAlpha = 1; c.drawImage(s, k.x - s.width / 2, k.y - s.height / 2); } });
    G.props.forEach(pr => { if (!inV(pr.x, pr.y)) return; const s = pr.spr; c.globalAlpha = .4; c.drawImage(A.sil(s, '#000'), pr.x - s.width / 2 + 3, pr.y - s.height / 2 + 4); c.globalAlpha = 1; c.drawImage(s, pr.x - s.width / 2, pr.y - s.height / 2); if (pr.flash > 0) { c.globalAlpha = .7; c.drawImage(A.sil(s, '#fff'), pr.x - s.width / 2, pr.y - s.height / 2); c.globalAlpha = 1; } if (pr.t === 'barrel_boom') { c.globalAlpha = .5 + Math.sin(time * 6) * .25; c.drawImage(A.get('fx', 'glow_red'), pr.x - 24, pr.y - 24, 48, 48); c.globalAlpha = 1; } });
    // gate
    if (!G.flags.gate) { const gx0 = 50 * TS, gx1 = 58 * TS, gy = 42.5 * TS; for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(255,50,50,${.5 + Math.sin(time * 9 + k) * .25})`; c.fillRect(gx0, gy - 7 + k * 7, gx1 - gx0, 2); } c.globalAlpha = .25; c.drawImage(A.get('fx', 'glow_red'), gx0, gy - 40, gx1 - gx0, 80); c.globalAlpha = 1; }
    const gp = A.get('props', 'gate_post'); c.drawImage(gp, 50 * TS - 10, 42.5 * TS - 10); c.drawImage(gp, 58 * TS - 10, 42.5 * TS - 10);
    // corpses
    G.enemies.forEach(e => { if (e.dead && inV(e.x, e.y)) { if (e.def.fly) { c.globalAlpha = .6; c.drawImage(A.get('enemies', 'drone_0'), e.x - 22, e.y - 22); c.globalAlpha = 1; } else if (e.def.static) { drawTurret(c, e, time, true); } else drawChar(c, e, e.def.pal, e.face, e.sc, null, 0, 0); } });
    // pickups
    G.pickups.forEach(k => { if (!inV(k.x, k.y)) return; const bob = Math.sin(time * 4 + k.x) * 2, col = k.kind === 'eddies' ? '#f3e600' : k.kind === 'ammo' ? '#ff9a3d' : k.kind === 'weapon' ? D.TIERS[k.tier].c : k.kind === 'shard' ? '#5ef2ff' : '#5ef2ff', ic = k.kind === 'eddies' ? 'eddies' : k.kind === 'ammo' ? 'ammo' : k.kind === 'weapon' ? D.WEAPONS[k.id].icon : k.kind === 'shard' ? 'shard' : D.ITEMS[k.id].icon; c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; c.drawImage(A.glow(col, 64), k.x - 22, k.y - 22 + bob, 44, 44); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(A.icon(ic, col, 24), k.x - 10, k.y - 10 + bob, 20, 20); });
    // NPCs, enemies, player (y-sorted)
    const list = []; G.npcs.forEach(n => list.push([n.y, 'n', n])); G.enemies.forEach(e => { if (!e.dead && inV(e.x, e.y, 120)) list.push([e.y, 'e', e]); }); list.push([G.p.y, 'p', G.p]); list.sort((a, b) => a[0] - b[0]);
    list.forEach(o => { const e = o[2]; if (o[1] === 'n') drawNPC(c, e, time); else if (o[1] === 'e') drawEnemy(c, e, time); else drawPlayer(c, time); });
    // projectiles
    G.proj.forEach(b => { if (!inV(b.x, b.y)) return; const s = A.get('fx', b.spr); c.save(); c.translate(b.x, b.y); c.rotate(b.ang); c.drawImage(s, -s.width, -s.height / 2); c.restore(); });
    G.gren.forEach(g => { const k = g.t / g.T, h = Math.sin(k * Math.PI) * 38; c.globalAlpha = .4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(g.x, g.y, 5, 3, 0, 0, 7); c.fill(); c.globalAlpha = 1; c.save(); c.translate(g.x, g.y - h); c.rotate(g.t * 12); const s = A.get('weapons', 'grenade'); c.drawImage(s, -4.5, -5.5); c.restore(); });
  }
  // light glows
  c.globalCompositeOperation = 'lighter';
  lamps.forEach(l => { if (inV(l.x, l.y, 140)) { c.globalAlpha = .42 + Math.sin(time * 2 + l.x) * .03; c.drawImage(A.get('fx', 'glow_yellow'), l.x - 80, l.y - 80, 160, 160); } });
  decor.forEach(d => { if (!inV(d.x, d.y, 140)) return; const col = d.t.startsWith('car_') ? ({ car_red: 'glow_pink', car_blue: 'glow_cyan', car_yellow: 'glow_yellow', car_white: 'glow_orange' })[d.t] : d.t === 'mainframe' ? 'glow_cyan' : d.t === 'elevator' ? 'glow_cyan' : d.t === 'stall' ? 'glow_pink' : null; if (col) { c.globalAlpha = .28; c.drawImage(A.get('fx', col), d.x - 90, d.y - 70, 180, 140); } });
  if (live) { D.LEVEL.checkpoints.forEach(cp => { const x = cp.x * TS + 16, y = cp.y * TS + 16; if (inV(x, y, 100)) { c.globalAlpha = G.cp === cp.id ? .6 : .25; c.drawImage(A.get('fx', 'glow_cyan'), x - 50, y - 50, 100, 100); } }); G.relays.forEach(r => { c.globalAlpha = r.on ? .4 : .22; c.drawImage(A.get('fx', r.on ? 'glow_cyan' : 'glow_red'), r.x - 36, r.y - 36, 72, 72); }); G.conts.forEach(k => { if (!k.open && inV(k.x, k.y)) { c.globalAlpha = .3 + Math.sin(time * 3) * .1; c.drawImage(A.get('fx', k.loot === 'core' ? 'glow_red' : 'glow_yellow'), k.x - 30, k.y - 30, 60, 60); } }); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (live) {
    // particles
    G.parts.forEach(q => { if (!inV(q.x, q.y, 20)) return; const k = q.life / q.max; if (q.type === 'ring') { c.strokeStyle = q.color; c.globalAlpha = k; c.lineWidth = 3; c.beginPath(); c.arc(q.x, q.y, q.size * (1 - k), 0, 7); c.stroke(); c.globalAlpha = 1; } else if (q.type === 'smoke' || q.type === 'circ') { c.globalAlpha = k * .7; c.fillStyle = q.color; c.beginPath(); c.arc(q.x, q.y, q.size * (q.type === 'smoke' ? 1.5 - k : k), 0, 7); c.fill(); c.globalAlpha = 1; } else { c.globalAlpha = Math.min(1, k * 1.6); c.fillStyle = q.color; c.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); c.globalAlpha = 1; } });
    G.fxs.forEach(f => { if (f.kind === 'explosion') { const i = Math.min(5, Math.floor(f.t / .5 * 6)), s = A.get('fx', 'explosion_' + i), z = 2.2 * f.scale; c.globalCompositeOperation = 'lighter'; c.drawImage(s, f.x - 32 * z, f.y - 32 * z, 64 * z, 64 * z); c.globalCompositeOperation = 'source-over'; } else if (f.kind === 'muzzle') { const s = A.get('fx', 'muzzle_' + (Math.floor(f.t * 100) % 3)); c.save(); c.translate(f.x, f.y); c.rotate(f.ang !== undefined ? f.ang : 0); c.drawImage(s, 0, -s.height / 2 * f.scale, s.width * f.scale, s.height * f.scale); c.restore(); } });
    // hack target ring + boss telegraphs
    const mw = mouseWorld(); if (!G.dead) { let best = null, bd = 90; G.enemies.forEach(e => { if (e.dead) return; const d = hyp(e.x - mw.x, e.y - mw.y); if (d < bd && hyp(e.x - G.p.x, e.y - G.p.y) < 420) { bd = d; best = e; } }); if (best) { c.strokeStyle = '#5ef2ff'; c.lineWidth = 1.5; c.beginPath(); c.arc(best.x, best.y, best.def.r + 8 + Math.sin(time * 8) * 1.5, 0, 7); c.stroke(); } if (G.p.hackT > 0 && G.p.hackTarget) { const e = G.p.hackTarget.e; c.strokeStyle = '#5ef2ff'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(G.p.x, G.p.y); c.lineTo(e.x, e.y); c.stroke(); c.setLineDash([]); c.beginPath(); c.arc(e.x, e.y, 18, -1.57, -1.57 + 6.28 * (1 - G.p.hackT / .5)); c.stroke(); } }
    G.enemies.forEach(e => { if (e.dead) return; if (e.t !== 'boss') { if (e.wind > 0 && e.def.gun) { c.strokeStyle = 'rgba(255,60,60,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(e.aim) * 420, e.y + Math.sin(e.aim) * 420); c.stroke(); } return; }
      if (e.st === 'windcharge' || e.st === 'charge') { c.fillStyle = 'rgba(255,40,40,.22)'; c.save(); c.translate(e.x, e.y); c.rotate(e.face); c.fillRect(0, -26, 360, 52); c.restore(); } if (e.st === 'slam') { c.fillStyle = 'rgba(255,200,40,.16)'; c.strokeStyle = 'rgba(255,200,40,.7)'; c.beginPath(); c.arc(e.x, e.y, 150, 0, 7); c.fill(); c.stroke(); } if (e.wind > 0) { c.fillStyle = 'rgba(255,40,40,.2)'; c.beginPath(); c.arc(e.x, e.y, e.def.reach + 14, 0, 7); c.fill(); } });
    // melee slash arc
    if (G.p.swingT > 0) { const k = G.p.swingT / .2, r = G.st.reach; c.strokeStyle = cy('bladearms') ? `rgba(255,77,77,${k})` : `rgba(207,233,245,${k})`; c.lineWidth = 5 * k; c.beginPath(); c.arc(G.p.x, G.p.y, r * .85, G.p.swingA - 1 + (1 - k) * 2, G.p.swingA - 1 + (1 - k) * 2 + .9); c.stroke(); }
    // floats
    G.floats.forEach(f => { c.globalAlpha = 1 - f.t / (f.big ? 1.1 : .8); c.font = `700 ${f.big ? 17 : 13}px Rajdhani, sans-serif`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); c.globalAlpha = 1; });
  }
}
function drawTurret(c, e, time, dead) { c.save(); c.translate(e.x, e.y); const b = A.get('enemies', 'turret_base'); c.drawImage(b, -20, -20); if (dead) c.globalAlpha = .5; c.rotate(e.aim || 0); const g = A.get('enemies', 'turret_gun'); c.drawImage(g, -5, -5); if (e.flash > 0) { c.globalAlpha = .8; c.drawImage(A.sil(g, '#fff'), -5, -5); } c.restore(); if (!dead && e.flash > 0) { c.globalAlpha = e.flash * 8; c.drawImage(A.sil(b, '#fff'), e.x - 20, e.y - 20); c.globalAlpha = 1; } }
function drawEnemy(c, e, time) {
  const d = e.def;
  if (d.fly) { const i = Math.floor(time * 20) % 2, s = A.get('enemies', 'drone_' + i); c.globalAlpha = .28; c.drawImage(A.sil(s, '#000'), e.x - 20 + 10, e.y - 20 + 30); c.globalAlpha = 1; c.save(); c.translate(e.x, e.y - 6 + Math.sin(time * 4 + e.ph) * 2); c.rotate(e.face); c.drawImage(s, -22, -22); if (e.flash > 0) { c.globalAlpha = .8; c.drawImage(A.sil(s, '#fff'), -22, -22); } c.restore(); }
  else if (d.static) drawTurret(c, e, time, false);
  else drawChar(c, e, d.pal, e.face, e.sc, d.gun ? d.gun.id : d.blade ? 'blade' : null, 0, e.flash);
  if (e.blind > 0) { c.fillStyle = '#5ef2ff'; c.font = '700 11px sans-serif'; c.textAlign = 'center'; c.fillText('~', e.x, e.y - 24 * e.sc); }
  if (e.burn > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .5; c.drawImage(A.get('fx', 'glow_orange'), e.x - 24, e.y - 24, 48, 48); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  if (Cfg.enemybars && (e.showT > 0 || e.alert > 0 && e.alert < 1) && !e.def.boss) {
    const w = 34, x = e.x - w / 2, y = e.y - 24 * e.sc - 10; c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x - 1, y - 1, w + 2, 6); c.fillStyle = e.t === 'captain' ? '#f3e600' : '#ff4d4d'; c.fillRect(x, y, w * clamp(e.hp / e.hpMax, 0, 1), 4);
    c.font = '700 9px Rajdhani, sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(d.n.toUpperCase(), x, y - 3); c.fillStyle = '#5ef2ff'; c.textAlign = 'right'; c.fillText('LVL ' + e.lvl, x + w, y - 3);
  }
  if (e.alert > 0 && e.alert < 1 && e.state !== 'combat') { c.fillStyle = `rgba(255,${200 - e.alert * 160 | 0},60,.9)`; c.beginPath(); c.moveTo(e.x, e.y - 34 * e.sc); c.arc(e.x, e.y - 34 * e.sc, 5 + e.alert * 3, 0, 7); c.fill(); c.fillStyle = '#000'; c.font = '700 9px sans-serif'; c.textAlign = 'center'; c.fillText('?', e.x, e.y - 31 * e.sc); }
  else if (e.state === 'combat' && e.def.sight > 0 && e.alert >= 1 && e.showT <= 0) { c.fillStyle = '#ff4d4d'; c.font = '900 14px Rajdhani, sans-serif'; c.textAlign = 'center'; c.fillText('!', e.x, e.y - 30 * e.sc); }
}
function drawNPC(c, n, time) {
  drawChar(c, n, n.pal, n.face, 1, null, 0, 0); const d = hyp(n.x - G.p.x, n.y - G.p.y);
  const hasQ = n.id === 'kestrel' && (Q.active('m1') && Q.step('m1') === 2 || Q.active('m2') && Q.step('m2') === 1 || Q.active('m3') && Q.step('m3') === 1 || (Q.done('m2') && !G.q.s4) || Q.active('s4') && Q.step('s4') === 1) || n.id === 'juno' && (!G.q.s1 || Q.active('s1') && Q.step('s1') === 1) || n.id === 'mira' && (!G.q.s3 || Q.active('s3') && Q.step('s3') === 1);
  if (hasQ) { c.drawImage(A.icon('quest', '#f3e600', 20), n.x - 10, n.y - 42 + Math.sin(time * 4) * 3); }
  if (d < 140 && n.role !== 'CIVILIAN') { c.font = '700 12px Rajdhani, sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(n.name.toUpperCase(), n.x, n.y + 32); c.fillStyle = '#fff'; c.fillText(n.name.toUpperCase(), n.x, n.y + 32); c.font = '600 9px "Share Tech Mono", monospace'; c.fillStyle = '#5ef2ff'; c.fillText(n.role, n.x, n.y + 42); }
  if (n.bark > 0) { c.font = '600 11px Rajdhani, sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(n.line, n.x, n.y - 28); c.fillStyle = '#ffd0d0'; c.fillText(n.line, n.x, n.y - 28); }
}
function drawPlayer(c, time) {
  const p = G.p; if (G.dead) { drawChar(c, { x: p.x, y: p.y, dead: true }, 'player', p.aim, 1, null, 0, 0); return; }
  if (p.dash > 0) { c.globalAlpha = .35; c.drawImage(A.sil(A.sets.player.walk[1], '#5ef2ff'), p.x - 24 - p.dashX * 14, p.y - 24 - p.dashY * 14); c.globalAlpha = 1; }
  if (p.invul > 0 && p.flash <= 0 && Math.floor(time * 20) % 2 === 0 && p.dash <= 0 && G.t > 3) c.globalAlpha = .55;
  const g = curGun(); drawChar(c, p, 'player', p.aim, 1, g ? g.id : 'blade', p.kick, p.flash); c.globalAlpha = 1;
  if (p.reloadT > 0) { const k = 1 - p.reloadT / p.reloadMax; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, 22, 0, 7); c.stroke(); c.strokeStyle = '#5ef2ff'; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, 22, -1.57, -1.57 + 6.28 * k); c.stroke(); }
  if (G.itarget && G.ip > 0) { c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, 26, 0, 7); c.stroke(); c.strokeStyle = '#f3e600'; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, 26, -1.57, -1.57 + 6.28 * G.ip); c.stroke(); }
}
let vig = null;
function makeVig() { vig = document.createElement('canvas'); vig.width = W; vig.height = H; const x = vig.getContext('2d'), g = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, Math.max(W, H) * .72); g.addColorStop(0, 'rgba(6,3,14,0)'); g.addColorStop(1, 'rgba(6,3,14,.62)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
Game.render = function (menuTime) {
  if (!ctx) return; ensureLevel(); const live = !!G && menuTime === undefined, time = live ? G.t : menuTime || 0; let camx, camy;
  if (live) { camx = G.cam.x + (G.shake ? rnd(-1, 1) * G.shake : 0); camy = G.cam.y + (G.shake ? rnd(-1, 1) * G.shake : 0); }
  else { const k = (Math.sin(time * .04) * .5 + .5); camx = 18 * TS + k * 80 * TS; camy = 59 * TS + Math.sin(time * .1) * 3 * TS; camx = clamp(camx, 0, MW * TS - W / Z); camy = clamp(camy, 0, MH * TS - H / Z); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  ctx.save(); ctx.scale(Z, Z); ctx.translate(-Math.round(camx), -Math.round(camy)); renderWorld(ctx, Math.round(camx), Math.round(camy), time, live); ctx.restore();
  // zone tint + ambient
  const z = live ? (G.zone || D.ZONES[6]) : D.ZONES[4]; ctx.fillStyle = z.tint; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(14,6,34,.22)'; ctx.fillRect(0, 0, W, H);
  if (Cfg.rain) { const n = Math.floor(30 + Cfg.fx * .9); ctx.strokeStyle = 'rgba(190,220,255,.2)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < n; i++) { const sx = ((i * 97.3 + time * 130) % (W + 40)) - 20, sy = ((i * 61.7 + time * 560) % (H + 40)) - 20; ctx.moveTo(sx, sy); ctx.lineTo(sx - 3, sy + 12); } ctx.stroke(); }
  if (!vig || vig.width !== W || vig.height !== H) makeVig(); ctx.drawImage(vig, 0, 0);
  if (live && G.ts < .8) { ctx.fillStyle = `rgba(94,242,255,${(1 - G.ts) * .14})`; ctx.fillRect(0, 0, W, H); }
};
Game.resize = function (w, h) {
  W = Game.W = Math.max(320, Math.round(w));
  H = Game.H = Math.max(200, Math.round(h || W * 9 / 16));
  // Fair field of view on every device: the short axis shows ~15 tiles and the
  // long axis never exceeds ~30, so portrait phones are not zoomed out to nothing
  // and no aspect ratio gets an unfair look at the map.
  const short = Math.min(W, H), long = Math.max(W, H);
  const zShort = short / (32 * 15);
  const zLong = long / (32 * 30);
  Z = Game.Z = Math.max(0.8, Math.min(2.0, Math.max(zShort, zLong)));
  if (cv) {
    cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }
  vig = null;
};
// Single source of truth for canvas size: read the element's CSS box and derive
// a pixel size with the same aspect. min(w,h) is kept at 540 for crispness.
Game.fit = function () {
  const el = cv || document.getElementById('game');
  const vw = Math.max(200, (el && el.clientWidth) || window.innerWidth || 200);
  const vh = Math.max(200, (el && el.clientHeight) || window.innerHeight || 200);
  const aspect = vw / vh;
  let w, h;
  if (aspect >= 1) { h = 540; w = 540 * aspect; } else { w = 540; h = 540 / aspect; }
  Game.resize(Math.min(2400, Math.round(w)), Math.min(2400, Math.round(h)));
};
Game.init = function (canvas) { cv = canvas; ctx = cv.getContext('2d'); Game.fit(); ensureLevel(); };
Game.stateReady = () => !!G;
Game.minimap = function (c, w, h, range = 34) {
  if (!G || !miniCv) return; const p = G.p, tx = p.x / TS, ty = p.y / TS, sc = w / (range * 2), vh = h / sc, sx = tx - range, sy = ty - vh / 2;
  c.clearRect(0, 0, w, h); c.imageSmoothingEnabled = false; c.drawImage(miniCv, sx, sy, range * 2, vh, 0, 0, w, h);
  const P = (x, y) => [(x / TS - sx) * sc, (y / TS - sy) * sc], dot = (x, y, col, r) => { const q = P(x, y); if (q[0] < 0 || q[1] < 0 || q[0] > w || q[1] > h) return; c.fillStyle = col; c.beginPath(); c.arc(q[0], q[1], r, 0, 7); c.fill(); };
  D.LEVEL.checkpoints.forEach(cp => dot(cp.x * TS + 16, cp.y * TS + 16, '#5ef2ff', 2)); G.npcs.forEach(n => n.role !== 'CIVILIAN' && dot(n.x, n.y, '#f3e600', 2.5)); G.conts.forEach(k => !k.open && dot(k.x, k.y, '#8a7a4a', 1.5));
  const optics = cy('optics'); G.enemies.forEach(e => { if (e.dead) return; if (e.state === 'combat' || optics || e.showT > 0) dot(e.x, e.y, e.state === 'combat' ? '#ff4d4d' : '#a83a3a', 2); });
  const t = Q.target(G.tracked); if (t) { const q = P(t.x, t.y); let x = clamp(q[0], 6, w - 6), y = clamp(q[1], 6, h - 6); c.save(); c.translate(x, y); c.rotate(.785); c.fillStyle = '#f3e600'; c.fillRect(-3.5, -3.5, 7, 7); c.restore(); }
  const q = P(p.x, p.y); c.save(); c.translate(q[0], q[1]); c.rotate(p.aim); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-2, 0); c.lineTo(-4, 4); c.closePath(); c.fill(); c.restore();
};
Game.fullMap = function (c, w, h) {
  if (!G) return; c.imageSmoothingEnabled = false; const sc = Math.min(w / MW, h / MH); c.clearRect(0, 0, w, h); c.drawImage(miniCv, 0, 0, MW * sc, MH * sc);
  const P = (x, y) => [x / TS * sc, y / TS * sc], dot = (x, y, col, r) => { const q = P(x, y); c.fillStyle = col; c.beginPath(); c.arc(q[0], q[1], r, 0, 7); c.fill(); };
  D.ZONES.slice(0, 6).forEach(z => { c.strokeStyle = 'rgba(255,77,77,.35)'; c.lineWidth = 1; c.strokeRect(z.x0 * sc, z.y0 * sc, (z.x1 - z.x0) * sc, (z.y1 - z.y0) * sc); c.fillStyle = 'rgba(255,200,200,.7)'; c.font = '600 11px Rajdhani, sans-serif'; c.fillText(z.n, z.x0 * sc + 4, z.y0 * sc + 13); });
  D.LEVEL.checkpoints.forEach(cp => dot(cp.x * TS + 16, cp.y * TS + 16, G.cpSeen[cp.id] ? '#5ef2ff' : '#2a5a63', 4)); G.npcs.forEach(n => n.role !== 'CIVILIAN' && dot(n.x, n.y, '#f3e600', 4)); G.conts.forEach(k => !k.open && dot(k.x, k.y, '#8a7a4a', 2.5));
  const t = Q.target(G.tracked); if (t) { const q = P(t.x, t.y); c.save(); c.translate(q[0], q[1]); c.rotate(.785); c.fillStyle = '#f3e600'; c.fillRect(-6, -6, 12, 12); c.restore(); }
  const q = P(G.p.x, G.p.y); c.fillStyle = '#fff'; c.beginPath(); c.arc(q[0], q[1], 5, 0, 7); c.fill(); c.strokeStyle = '#5ef2ff'; c.lineWidth = 2; c.beginPath(); c.arc(q[0], q[1], 9, 0, 7); c.stroke();
};
Game.cy = cy; Game.giveXP = giveXP; Game.note = note; Game.codexUnlock = codexUnlock; Game.tryFireEdge = () => tryFire(true);
Game.drawStats = () => G && G.st;
})();
