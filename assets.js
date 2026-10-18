/* =====================================================================
   CYBERPIX // 2D ASSET LIBRARY
   Every sprite, prop, tile, icon and FX frame is drawn in code here,
   then exported to PNG by build.py. Nothing is borrowed from other games.
   ===================================================================== */
(function () {
'use strict';
const A = window.ASSETS = { cats: {}, sets: {}, bg: {} };
const C = A.C = { red: '#ff4d4d', cyan: '#5ef2ff', yellow: '#f3e600', pink: '#ff2e93', orange: '#ff9a3d', dark: '#0a0608' };

/* ---------- helpers ---------- */
const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; fn(x, w, h); return c; };
const reg = (cat, name, c) => { (A.cats[cat] = A.cats[cat] || {})[name] = c; return c; };
const R = (x, X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
const limb = (x, x1, y1, x2, y2, w, c) => { const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1); x.fillStyle = c; for (let i = 0; i <= n; i++) { const t = i / n; x.fillRect(Math.round(x1 + (x2 - x1) * t - w / 2), Math.round(y1 + (y2 - y1) * t - w / 2), w, w); } };
const circ = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fill(); };
const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
A.get = (cat, name) => A.cats[cat] && A.cats[cat][name];
A.rng = rng;

const urlCache = new Map();
A.url = c => { if (!urlCache.has(c)) urlCache.set(c, c.toDataURL()); return urlCache.get(c); };
const silCache = new WeakMap();
A.sil = (c, color = '#fff') => { let m = silCache.get(c); if (!m) { m = {}; silCache.set(c, m); } if (!m[color]) m[color] = mk(c.width, c.height, x => { x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); }); return m[color]; };

/* =====================================================================
   TOP-DOWN ART: characters, props, tiles (camera looks straight down)
   ===================================================================== */
const rr = (x, X, Y, w, h, r, c) => { x.fillStyle = c; x.beginPath(); x.roundRect(X, Y, w, h, r); x.fill(); };
const ell = (x, cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); x.fill(); };
function shade(hex, d) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + d)); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join(''); }
A.shade = shade;

const PALS = {
  player:     { skin: '#d9a98a', hair: '#15161d', head: 'hair',    jacket: '#20242f', dark: '#12151c', trim: '#5ef2ff', boots: '#0b0c10', glow: '#5ef2ff', arm: 1 },
  thug_melee: { skin: '#c99a78', hair: '#ff3b6b', head: 'mohawk',  jacket: '#7a1f24', dark: '#4a1216', trim: '#f3e600', boots: '#111111', glow: '#f3e600', arm: 1 },
  thug_gun:   { skin: '#b98262', hair: '#2a1d12', head: 'cap',     jacket: '#a1521a', dark: '#6b3510', trim: '#ff4d4d', boots: '#111111', glow: '#ff4d4d', arm: 1 },
  corp:       { skin: '#e3c2a8', hair: '#111111', head: 'visor',   jacket: '#37506b', dark: '#223347', trim: '#cfe9f5', boots: '#0c0f14', glow: '#ff4d4d', plate: '#7e98b3', arm: 1 },
  heavy:      { skin: '#999999', hair: '#111111', head: 'helmet',  jacket: '#2c2f36', dark: '#1a1c21', trim: '#ff4d4d', boots: '#090a0c', glow: '#ff4d4d', plate: '#4a4f5a', arm: 1 },
  boss:       { skin: '#9fb4c7', hair: '#111111', head: 'helmet',  jacket: '#6c7a8a', dark: '#3d4652', trim: '#f3e600', boots: '#222222', glow: '#ff4d4d', plate: '#b8c7d6', arm: 1 },
  fixer:      { skin: '#c58c6a', hair: '#222222', head: 'hat',     jacket: '#4a2c5e', dark: '#2c1a3a', trim: '#f3e600', boots: '#0c0c10', glow: '#5ef2ff', coat: 1 },
  vendor:     { skin: '#d3a27c', hair: '#3a2a1a', head: 'hood',    jacket: '#4d5a2f', dark: '#323c1d', trim: '#ff9a3d', boots: '#111111', glow: '#ff9a3d' },
  ripper:     { skin: '#e9cdb8', hair: '#d8d8e0', head: 'goggles', jacket: '#e8eef2', dark: '#b4c0c8', trim: '#ff4d4d', boots: '#111111', glow: '#5ef2ff', coat: 1 },
  civ1:       { skin: '#a8734f', hair: '#1a1a1a', head: 'hair',    jacket: '#2e6b6b', dark: '#1e4545', trim: '#ff2e93', boots: '#111111', glow: '#ff2e93' },
  civ2:       { skin: '#f0cdb0', hair: '#ff2e93', head: 'mohawk',  jacket: '#5b3a8a', dark: '#3a2358', trim: '#5ef2ff', boots: '#111111', glow: '#5ef2ff' },
};
A.PALS = PALS;

function headTop(x, P, cx, cy) {
  const k = P.head;
  circ(x, cx, cy, 6, P.skin);
  if (k === 'hair') { circ(x, cx - 1, cy, 6.2, P.hair); R(x, cx + 4, cy - 3, 2, 6, P.skin); }
  else if (k === 'mohawk') { circ(x, cx, cy, 6, shade(P.skin, -30)); R(x, cx - 6, cy - 1.5, 12, 3, P.hair); }
  else if (k === 'cap') { circ(x, cx, cy, 6.4, P.jacket); R(x, cx + 4, cy - 4, 4, 8, P.dark); R(x, cx - 6, cy - 1, 5, 2, P.hair); }
  else if (k === 'visor') { circ(x, cx, cy, 6.8, P.plate); R(x, cx + 2, cy - 4, 4, 8, P.glow); R(x, cx - 6, cy - 1, 5, 2, P.dark); }
  else if (k === 'helmet') { circ(x, cx, cy, 7.4, P.plate); R(x, cx + 2, cy - 4, 5, 8, P.glow); R(x, cx - 6, cy - 5, 3, 10, P.dark); }
  else if (k === 'hat') { circ(x, cx, cy, 9.5, P.dark); circ(x, cx, cy, 5.5, P.jacket); R(x, cx - 5, cy - 1, 10, 2, P.trim); }
  else if (k === 'hood') { circ(x, cx, cy, 7.2, P.dark); circ(x, cx - 1, cy, 4, shade(P.dark, -14)); }
  else if (k === 'goggles') { circ(x, cx - 1, cy, 6.2, P.hair); R(x, cx + 3, cy - 5, 3, 10, P.glow); R(x, cx + 3, cy - 5, 1, 10, '#fff'); }
}

function tdChar(P, o) {
  o = Object.assign({ step: 0, dead: 0 }, o);
  return mk(48, 48, x => {
    const cx = 24, cy = 24;
    if (o.dead) {
      ell(x, cx, cy + 1, 15, 11, 'rgba(110,0,18,.55)'); ell(x, cx - 2, cy, 12, 8, 'rgba(150,0,26,.4)');
      rr(x, cx - 10, cy - 7, 20, 14, 5, shade(P.jacket, -20)); circ(x, cx + 11, cy - 1, 5.5, P.skin); circ(x, cx + 10, cy - 1, 5.8, P.hair);
      R(x, cx - 14, cy - 7, 6, 4, P.boots); R(x, cx - 15, cy + 3, 6, 4, P.boots); return;
    }
    ell(x, cx + 1, cy + 2, 12, 10, 'rgba(0,0,0,.35)');
    const st = o.step;
    R(x, cx + st - 3, cy - 8, 8, 4, P.boots); R(x, cx - st - 3, cy + 4, 8, 4, P.boots);
    if (P.coat) { rr(x, cx - 16, cy - 7, 14, 14, 3, P.jacket); R(x, cx - 16, cy - 1, 14, 2, P.trim); }
    rr(x, cx - 6, cy - 11, 12, 22, 5, P.jacket);
    R(x, cx + 1, cy - 9, 2, 18, P.trim);
    if (P.plate) { rr(x, cx - 9, cy - 10, 5, 20, 2, P.plate); R(x, cx + 3, cy - 3, 2, 6, P.glow); }
    if (P.arm) { limb(x, cx + 1, cy - 9, cx + 12, cy - 1, 4, P.jacket); limb(x, cx + 1, cy + 9, cx + 10, cy + 2, 4, P.dark); circ(x, cx + 13, cy - 1, 2.6, P.skin); circ(x, cx + 11, cy + 2, 2.4, P.skin); }
    else { limb(x, cx, cy - 10, cx + 4 - st, cy - 14, 4, P.dark); limb(x, cx, cy + 10, cx + 4 + st, cy + 14, 4, P.dark); circ(x, cx + 5 - st, cy - 14, 2.4, P.skin); circ(x, cx + 5 + st, cy + 14, 2.4, P.skin); }
    headTop(x, P, cx + 1, cy);
  });
}
function charSet(name, P) {
  const S = { walk: [] };
  S.idle = reg('characters', name + '_idle', tdChar(P, {}));
  [-3, 0, 3, 0].forEach((st, i) => S.walk.push(reg('characters', name + '_walk_' + i, tdChar(P, { step: st }))));
  S.dead = reg('characters', name + '_dead', tdChar(P, { dead: 1 }));
  A.sets[name] = S;
}
Object.keys(PALS).forEach(k => charSet(k, PALS[k]));
A.CHAR = 48;

/* ---- non-humanoid enemies ---- */
for (let i = 0; i < 2; i++) reg('enemies', 'drone_' + i, mk(44, 44, x => {
  ell(x, 23, 25, 16, 14, 'rgba(0,0,0,.3)');
  [[8, 8], [36, 8], [8, 36], [36, 36]].forEach(p => { limb(x, 22, 22, p[0], p[1], 3, '#161a22'); circ(x, p[0], p[1], 6, i ? '#9fb4c744' : '#9fb4c799'); circ(x, p[0], p[1], 2, '#2a3140'); });
  rr(x, 12, 12, 20, 20, 6, '#2a3140'); rr(x, 14, 14, 16, 16, 4, '#4a566b'); R(x, 26, 19, 6, 6, C.red); R(x, 28, 21, 2, 2, '#ffd0d0'); R(x, 15, 20, 5, 4, C.cyan);
}));
reg('enemies', 'turret_base', mk(40, 40, x => { ell(x, 21, 23, 18, 17, 'rgba(0,0,0,.35)'); circ(x, 20, 20, 17, '#1d232d'); circ(x, 20, 20, 14, '#4a566b'); circ(x, 20, 20, 10, '#2a3140'); for (let a = 0; a < 6; a++) R(x, 20 + Math.cos(a) * 14 - 1.5, 20 + Math.sin(a) * 14 - 1.5, 3, 3, C.red); }));
{ const c = reg('enemies', 'turret_gun', mk(28, 10, x => { R(x, 0, 2, 22, 6, '#3a4254'); R(x, 0, 2, 22, 1, '#7b869c'); R(x, 20, 3, 8, 4, '#111'); R(x, 3, 4, 6, 2, C.red); circ(x, 5, 5, 5, '#59636f'); })); c.muzzle = [28, 5]; c.grip = [5, 5]; }

/* ---- props (viewed from above; shadow offset baked in by game) ---- */
const prop = (name, w, h, fn) => reg('props', name, mk(w, h, fn));
const bevel = (x, w, h, base) => { R(x, 0, 0, w, h, base); R(x, 0, 0, w, 2, shade(base, 30)); R(x, 0, 0, 2, h, shade(base, 18)); R(x, 0, h - 3, w, 3, shade(base, -35)); R(x, w - 3, 0, 3, h, shade(base, -25)); };
prop('crate', 32, 32, x => { bevel(x, 32, 32, '#7a5636'); R(x, 4, 4, 24, 24, '#6b4a2f'); for (let i = 0; i < 24; i++) { R(x, 4 + i, 4 + i, 1, 1, '#4a321f'); R(x, 27 - i, 4 + i, 1, 1, '#4a321f'); } R(x, 12, 12, 8, 8, '#8a6240'); R(x, 13, 14, 6, 1, C.yellow); });
prop('crate_metal', 40, 40, x => { bevel(x, 40, 40, '#46515e'); R(x, 5, 5, 30, 30, '#39424d'); for (let i = 0; i < 40; i += 8) R(x, i, 0, 4, 4, i % 16 ? '#111' : C.yellow); R(x, 10, 17, 20, 3, C.cyan); R(x, 10, 23, 12, 2, C.cyan); });
prop('medcrate', 32, 32, x => { bevel(x, 32, 32, '#d9dee3'); R(x, 12, 6, 8, 20, C.red); R(x, 6, 12, 20, 8, C.red); });
prop('barrel', 22, 22, x => { circ(x, 11, 11, 11, '#2c353c'); circ(x, 11, 11, 9.5, '#46525c'); circ(x, 11, 11, 7, '#3a444d'); R(x, 3, 10, 16, 2, '#7b8794'); circ(x, 11, 11, 2, '#222'); });
prop('barrel_boom', 22, 22, x => { circ(x, 11, 11, 11, '#5a1a14'); circ(x, 11, 11, 9.5, '#a8321f'); circ(x, 11, 11, 6.5, '#7a2418'); for (let i = 0; i < 4; i++) R(x, 4 + i * 4, 9, 2, 4, C.yellow); circ(x, 11, 11, 2, '#111'); });
prop('barrel_fire', 22, 22, x => { circ(x, 11, 11, 11, '#2a1f1a'); circ(x, 11, 11, 9, '#4a3a30'); circ(x, 11, 11, 6, '#1a0f0a'); circ(x, 11, 11, 4, C.orange); circ(x, 11, 11, 2, C.yellow); });
prop('dumpster', 64, 32, x => { bevel(x, 64, 32, '#2f5d50'); R(x, 4, 4, 56, 24, '#244a40'); for (let i = 0; i < 4; i++) R(x, 6 + i * 14, 4, 2, 24, '#1d3d34'); R(x, 22, 12, 20, 6, 'rgba(255,46,147,.65)'); });
prop('vending', 36, 24, x => { bevel(x, 36, 24, '#222c3c'); R(x, 3, 3, 30, 8, '#16202c'); R(x, 0, 18, 36, 6, '#0a2230'); for (let i = 0; i < 6; i++) R(x, 3 + i * 5, 19, 4, 4, [C.pink, C.cyan, C.yellow][i % 3]); });
prop('terminal_off', 44, 44, x => { circ(x, 22, 22, 20, '#1a2230'); circ(x, 22, 22, 16, '#0c141c'); x.strokeStyle = '#2a5a63'; x.lineWidth = 2; x.beginPath(); x.arc(22, 22, 12, 0, 6.2832); x.stroke(); R(x, 18, 18, 8, 8, '#2a5a63'); });
prop('terminal_on', 44, 44, x => { circ(x, 22, 22, 20, '#1a2230'); circ(x, 22, 22, 16, '#07242e'); x.strokeStyle = C.cyan; x.lineWidth = 2; x.beginPath(); x.arc(22, 22, 12, 0, 6.2832); x.stroke(); R(x, 18, 18, 8, 8, C.cyan); });
prop('relay_off', 28, 28, x => { bevel(x, 28, 28, '#2c343d'); R(x, 5, 5, 18, 12, '#0c141c'); R(x, 7, 7, 8, 2, '#2a5a63'); R(x, 6, 20, 4, 4, '#555'); R(x, 12, 20, 4, 4, '#555'); });
prop('relay_on', 28, 28, x => { bevel(x, 28, 28, '#2c343d'); R(x, 5, 5, 18, 12, '#07242e'); R(x, 7, 7, 14, 2, C.cyan); R(x, 7, 11, 8, 2, C.yellow); R(x, 6, 20, 4, 4, C.cyan); R(x, 12, 20, 4, 4, C.cyan); });
prop('mainframe', 64, 36, x => { bevel(x, 64, 36, '#222c3c'); for (let i = 0; i < 4; i++) { R(x, 4 + i * 15, 4, 12, 22, '#0c141c'); for (let k = 0; k < 5; k++) R(x, 6 + i * 15, 6 + k * 4, 8, 2, k % 2 ? C.cyan : C.pink); } R(x, 4, 29, 56, 3, C.cyan); });
function car(name, body, glow) {
  prop(name, 88, 44, x => {
    ell(x, 44, 24, 42, 20, 'rgba(0,0,0,.3)');
    R(x, 8, 2, 14, 6, '#0a0a0c'); R(x, 62, 2, 14, 6, '#0a0a0c'); R(x, 8, 36, 14, 6, '#0a0a0c'); R(x, 62, 36, 14, 6, '#0a0a0c');
    rr(x, 3, 5, 82, 34, 10, shade(body, -40)); rr(x, 4, 6, 80, 31, 10, body);
    rr(x, 52, 9, 20, 25, 4, '#0c2430'); rr(x, 21, 9, 8, 25, 2, '#0c2430'); rr(x, 31, 8, 20, 27, 4, shade(body, 25)); R(x, 33, 10, 16, 2, 'rgba(255,255,255,.25)');
    R(x, 80, 8, 5, 6, '#ffe9a0'); R(x, 80, 30, 5, 6, '#ffe9a0'); R(x, 3, 8, 3, 6, C.red); R(x, 3, 30, 3, 6, C.red);
    x.globalAlpha = .55; x.fillStyle = glow; x.fillRect(6, 40, 76, 3); x.fillRect(6, 2, 76, 3); x.globalAlpha = 1;
  });
}
car('car_red', '#9a2332', C.pink); car('car_blue', '#2d5b80', C.cyan); car('car_yellow', '#b0901a', C.yellow); car('car_white', '#cfd6dc', C.orange);
function container(name, col) { prop(name, 96, 40, x => { bevel(x, 96, 40, col); for (let i = 0; i < 96; i += 8) R(x, i, 3, 2, 34, shade(col, -28)); R(x, 0, 18, 96, 4, shade(col, -40)); R(x, 90, 3, 4, 34, shade(col, -50)); R(x, 4, 8, 14, 5, 'rgba(255,255,255,.4)'); }); }
container('container_red', '#9a3326'); container('container_blue', '#2b5f8f'); container('container_green', '#3f7a50'); container('container_rust', '#8a5a2a');
prop('stall', 64, 44, x => { rr(x, 0, 0, 64, 44, 4, '#2a2420'); for (let i = 0; i < 64; i += 16) R(x, i, 0, 8, 44, i % 32 ? '#d8d8e0' : C.pink); R(x, 0, 0, 64, 3, 'rgba(0,0,0,.3)'); R(x, 0, 41, 64, 3, 'rgba(0,0,0,.35)'); });
prop('planter', 28, 28, x => { bevel(x, 28, 28, '#444a50'); circ(x, 14, 14, 9, '#1f4d3a'); circ(x, 12, 12, 5, '#2f7a52'); circ(x, 17, 16, 3, C.pink); });
prop('lamp', 18, 18, x => { circ(x, 9, 9, 8, '#1a1f27'); circ(x, 9, 9, 5, '#ffe9a0'); circ(x, 9, 9, 2.4, '#fff'); });
prop('gate_post', 20, 20, x => { bevel(x, 20, 20, '#59636f'); R(x, 6, 6, 8, 8, C.red); R(x, 8, 8, 4, 4, '#ffd0d0'); });
prop('elevator', 72, 56, x => { bevel(x, 72, 56, '#2c343d'); R(x, 6, 6, 60, 44, '#14202a'); R(x, 8, 8, 27, 40, '#444f5c'); R(x, 37, 8, 27, 40, '#444f5c'); R(x, 35, 8, 2, 40, '#111'); for (let i = 0; i < 3; i++) { R(x, 30 + i * 4, 0, 3, 5, C.cyan); } });
prop('locker', 30, 22, x => { bevel(x, 30, 22, '#3b4a56'); R(x, 14, 0, 2, 22, '#1f2830'); R(x, 4, 8, 7, 3, C.yellow); R(x, 19, 8, 7, 3, C.yellow); });
prop('locker_open', 30, 22, x => { bevel(x, 30, 22, '#1f2830'); R(x, 3, 3, 24, 16, '#0c1218'); });
prop('pipes', 64, 18, x => { R(x, 0, 2, 64, 6, '#46525c'); R(x, 0, 2, 64, 1, '#7b8794'); R(x, 0, 11, 64, 5, '#3a444d'); for (let i = 8; i < 64; i += 20) { R(x, i, 0, 4, 18, '#222'); } });
prop('ac_unit', 40, 32, x => { bevel(x, 40, 32, '#59636f'); circ(x, 12, 16, 9, '#1a1f27'); circ(x, 12, 16, 6, '#2c343d'); circ(x, 30, 16, 9, '#1a1f27'); circ(x, 30, 16, 6, '#2c343d'); for (let i = 0; i < 4; i++) { R(x, 8, 12 + i * 2, 8, 1, '#7b8794'); R(x, 26, 12 + i * 2, 8, 1, '#7b8794'); } });
prop('vent', 28, 28, x => { bevel(x, 28, 28, '#4a5560'); for (let i = 0; i < 5; i++) R(x, 4, 5 + i * 4, 20, 2, '#1a1f27'); });
prop('dish', 30, 30, x => { circ(x, 15, 15, 14, '#59636f'); circ(x, 15, 15, 11, '#9aa7b6'); circ(x, 15, 15, 6, '#6b7684'); R(x, 14, 14, 3, 3, C.red); limb(x, 15, 15, 24, 8, 2, '#222'); });
prop('skylight', 36, 28, x => { bevel(x, 36, 28, '#2c343d'); R(x, 4, 4, 28, 20, '#0b3a4a'); R(x, 6, 6, 10, 2, 'rgba(255,255,255,.35)'); R(x, 4, 14, 28, 1, '#14202a'); });
prop('helipad', 96, 96, x => { circ(x, 48, 48, 46, '#2a323c'); x.strokeStyle = C.yellow; x.lineWidth = 3; x.beginPath(); x.arc(48, 48, 40, 0, 6.2832); x.stroke(); R(x, 32, 30, 6, 36, C.yellow); R(x, 58, 30, 6, 36, C.yellow); R(x, 32, 44, 32, 6, C.yellow); });
['oil', 'scorch', 'blood', 'manhole', 'graffiti', 'litter'].forEach((n, k) => prop('decal_' + n, 40, 40, x => {
  const r = rng(50 + k);
  if (n === 'oil') { ell(x, 20, 20, 15, 11, 'rgba(8,8,12,.65)'); ell(x, 16, 17, 6, 4, 'rgba(94,242,255,.2)'); ell(x, 24, 22, 5, 3, 'rgba(255,46,147,.2)'); }
  else if (n === 'scorch') { for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(0,0,0,${.05 + r() * .12})`; x.beginPath(); x.arc(20 + (r() - .5) * 26, 20 + (r() - .5) * 26, 3 + r() * 6, 0, 6.28); x.fill(); } }
  else if (n === 'blood') { for (let i = 0; i < 12; i++) { x.fillStyle = `rgba(120,0,16,${.25 + r() * .3})`; x.beginPath(); x.arc(20 + (r() - .5) * 22, 20 + (r() - .5) * 22, 1 + r() * 5, 0, 6.28); x.fill(); } }
  else if (n === 'manhole') { circ(x, 20, 20, 13, '#1a1c20'); circ(x, 20, 20, 11, '#2c3036'); x.strokeStyle = '#111'; x.lineWidth = 1; for (let i = -8; i <= 8; i += 4) { x.beginPath(); x.moveTo(20 + i, 10); x.lineTo(20 + i, 30); x.stroke(); } }
  else if (n === 'graffiti') { x.strokeStyle = C.pink; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(6, 28); x.bezierCurveTo(10, 4, 18, 36, 24, 14); x.bezierCurveTo(28, 4, 32, 30, 36, 10); x.stroke(); x.strokeStyle = C.cyan; x.lineWidth = 1.5; x.stroke(); }
  else { for (let i = 0; i < 16; i++) R(x, 4 + r() * 30, 4 + r() * 30, 2 + r() * 4, 2 + r() * 3, ['#9a9a9a', '#c9c9c9', '#6b5a3a', '#3a5a6b'][i % 4]); }
}));
function sign(name, text, color, w, h) { prop(name, w, h, x => { R(x, 0, 0, w, h, '#0d1117'); x.strokeStyle = color; x.lineWidth = 2; x.strokeRect(2, 2, w - 4, h - 4); x.fillStyle = color; x.font = `700 ${Math.floor(h * .52)}px Rajdhani, "Arial Narrow", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 1); }); }
sign('sign_noodle', 'NOODLE-X', C.pink, 90, 24); sign('sign_clinic', 'RIPPER CLINIC', C.cyan, 110, 24); sign('sign_arms', 'AMMO & ARMS', C.orange, 104, 24); sign('sign_bar', 'BAR 24', C.yellow, 62, 24); sign('sign_exit', 'EXIT', C.red, 52, 22); sign('sign_corp', 'ARCLIGHT CORP', C.cyan, 110, 24); sign('sign_cola', 'VOLTA-COLA', C.pink, 100, 24);

/* ---- tiles (32x32, top-down) ---- */
const tile = (name, fn) => reg('tiles', name, mk(32, 32, fn));
const speck = (x, seed, n, cols, maxw = 3) => { const r = rng(seed); for (let i = 0; i < n; i++) R(x, r() * 31, r() * 31, 1 + r() * maxw, 1, cols[i % cols.length]); };
for (let i = 0; i < 3; i++) tile('asph_' + i, x => { R(x, 0, 0, 32, 32, '#2b2a2f'); speck(x, 100 + i, 18, ['#222126', '#34333a', '#1c1b20']); if (i === 2) { R(x, 6, 4, 1, 12, '#1c1b20'); R(x, 7, 15, 8, 1, '#1c1b20'); } });
tile('asph_h', x => { R(x, 0, 0, 32, 32, '#2b2a2f'); speck(x, 110, 12, ['#222126', '#34333a']); R(x, 2, 15, 12, 2, '#cdb92e'); R(x, 18, 15, 12, 2, '#cdb92e'); });
tile('asph_v', x => { R(x, 0, 0, 32, 32, '#2b2a2f'); speck(x, 111, 12, ['#222126', '#34333a']); R(x, 15, 2, 2, 12, '#cdb92e'); R(x, 15, 18, 2, 12, '#cdb92e'); });
tile('cross_h', x => { R(x, 0, 0, 32, 32, '#2b2a2f'); for (let i = 0; i < 32; i += 8) R(x, 0, i + 1, 32, 4, '#c9cdd2'); });
tile('cross_v', x => { R(x, 0, 0, 32, 32, '#2b2a2f'); for (let i = 0; i < 32; i += 8) R(x, i + 1, 0, 4, 32, '#c9cdd2'); });
for (let i = 0; i < 2; i++) tile('side_' + i, x => { R(x, 0, 0, 32, 32, '#5a5650'); R(x, 0, 0, 32, 1, '#6c6760'); R(x, 0, 0, 1, 32, '#6c6760'); R(x, 0, 31, 32, 1, '#3d3a36'); R(x, 31, 0, 1, 32, '#3d3a36'); speck(x, 120 + i, 8, ['#4d4944', '#67625b']); });
for (let i = 0; i < 2; i++) tile('plaza_' + i, x => { R(x, 0, 0, 32, 32, '#44434c'); R(x, 0, 0, 16, 16, '#4a4953'); R(x, 16, 16, 16, 16, '#4a4953'); R(x, 0, 15, 32, 1, '#2d2c34'); R(x, 15, 0, 1, 32, '#2d2c34'); speck(x, 130 + i, 8, ['#3a3943', '#55545e']); if (i) R(x, 14, 14, 4, 4, 'rgba(255,46,147,.35)'); });
for (let i = 0; i < 3; i++) tile('roof_' + i, x => { R(x, 0, 0, 32, 32, '#3b4552'); R(x, 0, 0, 32, 1, '#4a5666'); R(x, 0, 31, 32, 1, '#2a323d'); R(x, 31, 0, 1, 32, '#2a323d'); speck(x, 140 + i, 10, ['#343d49', '#46515f'], 4); if (i === 1) { R(x, 15, 0, 2, 32, '#2f3843'); } if (i === 2) { R(x, 0, 15, 32, 2, '#2f3843'); R(x, 4, 4, 2, 2, '#1d232b'); R(x, 26, 26, 2, 2, '#1d232b'); } });
for (let i = 0; i < 3; i++) tile('face_' + i, x => {
  R(x, 0, 0, 32, 32, '#242b35'); R(x, 0, 0, 32, 3, '#566274'); R(x, 0, 3, 32, 2, '#12161c'); R(x, 0, 28, 32, 4, '#12161c'); const r = rng(150 + i);
  for (let w = 0; w < 3; w++) { const lit = r() > .45, col = r() > .5 ? '#ffc878' : '#78e6ff'; R(x, 3 + w * 10, 9, 7, 12, lit ? col : '#10151c'); if (lit) R(x, 3 + w * 10, 9, 7, 2, 'rgba(255,255,255,.4)'); }
  R(x, 0, 22, 32, 1, '#323b47');
});
tile('face_dark', x => { R(x, 0, 0, 32, 32, '#1a2028'); R(x, 0, 0, 32, 3, '#3d4756'); R(x, 0, 28, 32, 4, '#0c0f14'); for (let w = 0; w < 3; w++) R(x, 3 + w * 10, 10, 7, 11, '#0f141a'); });
for (let i = 0; i < 2; i++) tile('metal_' + i, x => { R(x, 0, 0, 32, 32, '#243242'); R(x, 0, 0, 32, 1, '#33465c'); R(x, 0, 0, 1, 32, '#33465c'); R(x, 0, 31, 32, 1, '#161f2a'); R(x, 31, 0, 1, 32, '#161f2a'); R(x, 3, 3, 2, 2, '#16202b'); R(x, 27, 27, 2, 2, '#16202b'); if (i) { R(x, 4, 14, 24, 3, '#14202c'); R(x, 6, 15, 20, 1, 'rgba(94,242,255,.55)'); } });
for (let i = 0; i < 3; i++) tile('scrap_' + i, x => { R(x, 0, 0, 32, 32, '#3a2e25'); speck(x, 160 + i, 22, ['#2f251d', '#4a3b2f', '#563f2a', '#241b15'], 4); if (i === 1) { ell(x, 16, 16, 9, 6, 'rgba(10,8,8,.5)'); } if (i === 2) { R(x, 8, 8, 10, 2, '#6b6f73'); R(x, 20, 20, 6, 2, '#8a5a2a'); } });
tile('haz_0', x => { R(x, 0, 0, 32, 32, '#0b1a22'); speck(x, 170, 10, ['#0f2833', '#08141a'], 5); R(x, 0, 0, 32, 2, '#c9a000'); R(x, 0, 30, 32, 2, '#c9a000'); });
for (let i = 0; i < 2; i++) tile('pit_' + i, x => { R(x, 0, 0, 32, 32, '#241418'); R(x, 0, 0, 32, 1, '#3a1f26'); R(x, 0, 0, 1, 32, '#3a1f26'); speck(x, 180 + i, 10, ['#1a0d10', '#35191f'], 4); if (i) { R(x, 0, 14, 32, 4, '#4a1218'); R(x, 0, 15, 32, 1, 'rgba(255,77,77,.5)'); } });
reg('tiles', 'void', mk(32, 32, x => R(x, 0, 0, 32, 32, '#07080b')));

/* light glow (additive) */
const glowCache = {};
A.glow = (color, size = 128) => { const k = color + size; if (glowCache[k]) return glowCache[k]; return glowCache[k] = mk(size, size, x => { const g = x.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2); g.addColorStop(0, color + 'cc'); g.addColorStop(.35, color + '55'); g.addColorStop(1, color + '00'); x.fillStyle = g; x.fillRect(0, 0, size, size); }); };
reg('fx', 'glow_cyan', A.glow('#5ef2ff')); reg('fx', 'glow_pink', A.glow('#ff2e93')); reg('fx', 'glow_yellow', A.glow('#f3e600')); reg('fx', 'glow_red', A.glow('#ff4d4d')); reg('fx', 'glow_orange', A.glow('#ff9a3d'));

/* =====================================================================
   2. WEAPONS (face right; .grip = hand pivot, .muzzle = barrel tip)
   ===================================================================== */
function weapon(name, w, h, grip, muz, fn) { const c = mk(w, h, fn); c.grip = grip; c.muzzle = muz; return reg('weapons', name, c); }
const GUN = '#262b38', GUNH = '#7b869c', GUND = '#0e1118';
weapon('pistol', 18, 10, [3, 4], [18, 3], x => { R(x, 3, 1, 13, 4, GUN); R(x, 3, 0, 13, 1, GUNH); R(x, 3, 5, 4, 5, GUND); R(x, 15, 2, 3, 2, GUND); R(x, 6, 2, 4, 1, C.cyan); });
weapon('smg', 26, 12, [4, 4], [26, 3], x => { R(x, 3, 1, 20, 5, GUN); R(x, 3, 0, 20, 1, GUNH); R(x, 8, 6, 4, 6, GUND); R(x, 3, 6, 4, 5, GUND); R(x, 22, 2, 4, 2, GUND); R(x, 0, 2, 3, 4, '#444b5c'); R(x, 11, 2, 6, 1, C.yellow); });
weapon('shotgun', 34, 10, [5, 4], [34, 3], x => { R(x, 8, 1, 26, 2, GUNH); R(x, 8, 3, 24, 2, GUN); R(x, 2, 1, 8, 6, GUN); R(x, 16, 5, 9, 3, '#6b4a2f'); R(x, 0, 2, 3, 5, '#6b4a2f'); R(x, 4, 7, 3, 3, GUND); R(x, 28, 1, 2, 1, C.red); });
weapon('rifle', 44, 12, [6, 5], [44, 4], x => { R(x, 6, 2, 30, 4, GUN); R(x, 6, 2, 30, 1, GUNH); R(x, 36, 3, 8, 2, GUND); R(x, 14, 0, 13, 2, '#444b5c'); R(x, 25, 0, 2, 2, C.cyan); R(x, 15, 6, 4, 6, GUND); R(x, 0, 2, 7, 6, '#444b5c'); R(x, 6, 6, 3, 5, GUND); });
weapon('blade', 26, 8, [3, 4], [26, 4], x => { R(x, 0, 3, 7, 3, '#20242f'); R(x, 6, 1, 2, 7, C.red); R(x, 8, 3, 16, 3, '#cfe9f5'); R(x, 8, 3, 16, 1, '#ffffff'); R(x, 22, 4, 4, 1, '#cfe9f5'); });
weapon('grenade', 9, 11, [4, 5], [4, 5], x => { circ(x, 4.5, 6.5, 4, '#3a4a3a'); R(x, 3, 0, 3, 3, '#999'); R(x, 1, 5, 7, 1, C.red); });

/* ---------- FX ---------- */
for (let i = 0; i < 3; i++) reg('fx', 'muzzle_' + i, mk(28, 18, x => {
  x.fillStyle = i === 1 ? '#fff6c8' : '#ffd25e'; x.beginPath(); x.moveTo(0, 9); x.lineTo(8, 3 + i); x.lineTo(14, 0); x.lineTo(15, 6); x.lineTo(28, 9); x.lineTo(15, 12); x.lineTo(14, 18); x.lineTo(8, 15 - i); x.closePath(); x.fill();
  circ(x, 6, 9, 3, '#ffffff');
}));
for (let i = 0; i < 6; i++) reg('fx', 'explosion_' + i, mk(64, 64, x => {
  const t = i / 5, r = 9 + t * 22, g = x.createRadialGradient(32, 32, 2, 32, 32, r);
  g.addColorStop(0, `rgba(255,${240 - t * 110 | 0},${190 - t * 150 | 0},${1 - t * .55})`);
  g.addColorStop(.5, `rgba(255,${130 - t * 80 | 0},40,${.9 - t * .65})`);
  g.addColorStop(1, 'rgba(70,24,24,0)');
  x.fillStyle = g; x.beginPath(); x.arc(32, 32, r, 0, 6.2832); x.fill();
  const rr = rng(9 + i); x.fillStyle = `rgba(255,220,120,${1 - t})`; for (let k = 0; k < 10; k++) { const a = rr() * 6.28, d = r * (.6 + rr() * .6); x.fillRect(32 + Math.cos(a) * d, 32 + Math.sin(a) * d, 2, 2); }
}));
for (let i = 0; i < 4; i++) reg('fx', 'smoke_' + i, mk(24, 24, x => { const g = x.createRadialGradient(12, 12, 1, 12, 12, 11); g.addColorStop(0, 'rgba(120,120,130,.55)'); g.addColorStop(1, 'rgba(60,60,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 24, 24); const rr = rng(40 + i); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(160,160,170,.18)'; x.fillRect(4 + rr() * 14, 4 + rr() * 14, 3, 3); } }));
for (let i = 0; i < 4; i++) reg('fx', 'impact_' + i, mk(16, 16, x => { x.fillStyle = '#ffe9a0'; const a = [[8, 8], [4, 5], [11, 4], [5, 11], [12, 11], [8, 2], [2, 8], [14, 8]]; a.slice(0, 3 + i * 2).forEach(p => x.fillRect(p[0], p[1], 2, 2)); R(x, 7, 7, 2, 2, '#fff'); }));
reg('fx', 'casing', mk(4, 2, x => { R(x, 0, 0, 4, 2, '#d9a441'); R(x, 0, 0, 1, 2, '#fff1b8'); }));
reg('fx', 'spark', mk(4, 4, x => { R(x, 1, 0, 2, 4, '#ffe9a0'); R(x, 0, 1, 4, 2, '#ffe9a0'); }));
reg('fx', 'bolt', mk(12, 3, x => { R(x, 0, 1, 12, 1, C.cyan); R(x, 2, 0, 3, 3, C.cyan); R(x, 5, 1, 6, 1, '#fff'); }));
reg('fx', 'bullet', mk(10, 3, x => { R(x, 0, 1, 10, 1, '#ffd25e'); R(x, 6, 0, 4, 3, '#fff6c8'); }));
reg('fx', 'bullet_enemy', mk(10, 4, x => { R(x, 0, 1, 10, 2, C.red); R(x, 5, 0, 5, 4, '#ffb0b0'); }));

/* =====================================================================
   6. ICONS (svg path data on a 32x32 grid, rendered as outlined glyphs)
   ===================================================================== */
const ICON = {
  pistol: 'M3 11h20l2 2v4h-9l-1 6h-6l1-6H3z', smg: 'M2 12h22v4h-8v9h-5v-9H8l-2 4H2z M24 13h6', shotgun: 'M1 14h26v3H11l-2 3H4z M27 15h3',
  rifle: 'M1 15h28v2H12l-2 4H5l1-4H1z M16 12h8v3h-8z', blade: 'M4 28l5-5 M7 21l4 4 M9 23L27 5l1 1L10 24z',
  grenade: 'M8 19a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M13 9h6v3h-6z M19 10l5-4', medkit: 'M5 10h22v16H5z M13 10V7h6v3 M16 14v8 M12 18h8',
  ammo: 'M9 26V12l3-4 3 4v14z M17 26V12l3-4 3 4v14z', eddies: 'M4 16a12 12 0 1 0 24 0a12 12 0 1 0 -24 0 M12 11h8 M12 16h6 M12 21h8 M12 11v10',
  shard: 'M9 5h14v22H9z M13 9h6 M13 13h6 M13 17h3', armor: 'M16 3l11 4v9c0 6-5 11-11 13C10 27 5 22 5 16V7z', scrap: 'M4 24l6-12 6 8 4-6 8 10z',
  comp: 'M11 16a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M16 3v5 M16 24v5 M3 16h5 M24 16h5 M7 7l4 4 M21 21l4 4 M25 7l-4 4 M11 21l-4 4',
  core: 'M16 3l11 7v12l-11 7-11-7V10z M16 11l5 3v5l-5 3-5-3v-5z',
  chip: 'M9 9h14v14H9z M13 13h6v6h-6z M12 5v4 M16 5v4 M20 5v4 M12 23v4 M16 23v4 M20 23v4 M5 12h4 M5 16h4 M5 20h4 M23 12h4 M23 16h4 M23 20h4',
  optics: 'M2 16c5-8 23-8 28 0-5 8-23 8-28 0z M12 16a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', shortc: 'M18 2L7 18h7l-2 12 12-17h-8z',
  overheat: 'M16 3c2 6 8 8 8 15a8 8 0 0 1-16 0c0-4 2-5 3-8 1 3 3 3 3 1 0-3-1-5 2-8z',
  body: 'M3 12h4v8H3z M25 12h4v8h-4z M7 14h18v4H7z M1 14v4 M31 14v4', reflex: 'M4 8l8 8-8 8 M14 8l8 8-8 8 M24 8l4 8-4 8',
  tech: 'M13 4h6l1 4 3 1 3-2 4 4-2 3 1 3 4 1v6l-4 1-1 3 2 3-4 4-3-2-3 1-1 4h-6l-1-4-3-1-3 2-4-4 2-3-1-3-4-1v-6l4-1 1-3-2-3 4-4 3 2z',
  cool: 'M16 3v26 M5 9l22 14 M27 9L5 23', intel: 'M16 4a10 10 0 0 0-10 10c0 5 3 7 4 9v5h12v-5c1-2 4-4 4-9A10 10 0 0 0 16 4z M12 14h8 M16 14v8',
  quest: 'M16 3l12 13-12 13L4 16z', npc: 'M4 6h24v16H15l-6 5v-5H4z', shop: 'M6 10h20l-2 17H8z M11 10a5 5 0 0 1 10 0',
  ripper: 'M13 3h6v10h10v6H19v10h-6V19H3v-6h10z', checkpoint: 'M8 3v26 M8 5h16l-4 6 4 6H8', enemy: 'M16 3l14 25H2z M16 12v8 M16 23v2',
  skull: 'M16 3a11 11 0 0 0-11 11c0 4 2 6 4 8v5h4v-3h6v3h4v-5c2-2 4-4 4-8A11 11 0 0 0 16 3z M9 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M19 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
  heart: 'M16 28C4 19 3 11 8 7c3-2 7-1 8 3 1-4 5-5 8-3 5 4 4 12-8 21z', bolt: 'M18 2L7 18h7l-2 12 12-17h-8z', ram: 'M6 10h20v12H6z M10 10V6 M14 10V6 M18 10V6 M22 10V6 M10 22v4 M14 22v4 M18 22v4 M22 22v4',
  lock: 'M8 14h16v13H8z M11 14V9a5 5 0 0 1 10 0v5', star: 'M16 3l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z',
  elevator: 'M6 3h20v26H6z M16 3v26 M10 13l2-3 2 3z M20 17l2 3 2-3z', stamina: 'M6 22l6-12 5 8 4-5 5 9z M4 26h24', shield: 'M16 3l11 4v9c0 6-5 11-11 13C10 27 5 22 5 16V7z M16 9v14',
  arrow: 'M6 16h20 M18 8l8 8-8 8', check: 'M5 17l7 7 15-16', cross: 'M7 7l18 18 M25 7L7 25', gear: 'M16 4l3 3 4-1 1 4 4 2-2 4 2 4-4 2-1 4-4-1-3 3-3-3-4 1-1-4-4-2 2-4-2-4 4-2 1-4 4 1z M12 16a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
  map: 'M3 7l9-3 8 3 9-3v21l-9 3-8-3-9 3z M12 4v21 M20 7v21', book: 'M5 5h9a3 3 0 0 1 2 1 3 3 0 0 1 2-1h9v20h-9a3 3 0 0 0-2 1 3 3 0 0 0-2-1H5z M16 6v20',
  bag: 'M6 10h20v18H6z M11 10V7a5 5 0 0 1 10 0v3', wrench: 'M22 3a6 6 0 0 0-5 8L4 24l4 4 13-13a6 6 0 0 0 8-5l-4 3-3-1-1-3z', msg: 'M3 7h26v16H14l-7 5v-5H3z M8 13h16 M8 17h10',
};
A.ICON = ICON; const iconCache = {}; const P2D = {};
A.icon = (name, color = C.cyan, size = 64) => {
  const key = name + color + size; if (iconCache[key]) return iconCache[key];
  const d = ICON[name] || ICON.quest; const p = P2D[name] || (P2D[name] = new Path2D(d));
  return iconCache[key] = mk(size, size, x => { x.scale(size / 32, size / 32); x.lineWidth = 2; x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = color; x.fillStyle = color; x.globalAlpha = .18; x.fill(p); x.globalAlpha = 1; x.stroke(p); });
};
Object.keys(ICON).forEach(k => reg('icons', k, A.icon(k, C.cyan, 64)));

/* =====================================================================
   7. UI SPRITES (crosshairs, hit markers, rarity frames, cursors)
   ===================================================================== */
reg('ui', 'crosshair_dot', mk(32, 32, x => { R(x, 15, 15, 2, 2, C.cyan); [[15, 5, 2, 6], [15, 21, 2, 6], [5, 15, 6, 2], [21, 15, 6, 2]].forEach(a => R(x, a[0], a[1], a[2], a[3], C.cyan)); }));
reg('ui', 'crosshair_ring', mk(32, 32, x => { x.strokeStyle = C.cyan; x.lineWidth = 2; x.beginPath(); x.arc(16, 16, 9, 0, 6.2832); x.stroke(); R(x, 15, 15, 2, 2, C.cyan); [[15, 2, 2, 5], [15, 25, 2, 5], [2, 15, 5, 2], [25, 15, 5, 2]].forEach(a => R(x, a[0], a[1], a[2], a[3], C.cyan)); }));
reg('ui', 'crosshair_brackets', mk(32, 32, x => { x.strokeStyle = C.cyan; x.lineWidth = 2; [[4, 4, 1, 1], [28, 4, -1, 1], [4, 28, 1, -1], [28, 28, -1, -1]].forEach(a => { x.beginPath(); x.moveTo(a[0], a[1] + 7 * a[3]); x.lineTo(a[0], a[1]); x.lineTo(a[0] + 7 * a[2], a[1]); x.stroke(); }); R(x, 15, 15, 2, 2, C.cyan); }));
reg('ui', 'hitmarker', mk(24, 24, x => { x.strokeStyle = '#fff'; x.lineWidth = 2; [[3, 3, 8, 8], [21, 3, 16, 8], [3, 21, 8, 16], [21, 21, 16, 16]].forEach(a => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[2], a[3]); x.stroke(); }); }));
reg('ui', 'hitmarker_crit', mk(24, 24, x => { x.strokeStyle = C.red; x.lineWidth = 2.5; [[2, 2, 9, 9], [22, 2, 15, 9], [2, 22, 9, 15], [22, 22, 15, 15]].forEach(a => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[2], a[3]); x.stroke(); }); }));
reg('ui', 'cursor_arrow', mk(24, 24, x => { x.fillStyle = C.cyan; x.beginPath(); x.moveTo(3, 2); x.lineTo(3, 20); x.lineTo(8, 15); x.lineTo(12, 22); x.lineTo(15, 20); x.lineTo(11, 14); x.lineTo(18, 14); x.closePath(); x.fill(); x.strokeStyle = '#003a42'; x.stroke(); }));
A.RARITY = [{ n: 'COMMON', c: '#b4bcc8' }, { n: 'UNCOMMON', c: '#5bd96b' }, { n: 'RARE', c: '#4aa8ff' }, { n: 'EPIC', c: '#c07bff' }, { n: 'LEGENDARY', c: '#f3e600' }];
A.RARITY.forEach((r, i) => reg('ui', 'frame_' + r.n.toLowerCase(), mk(56, 56, x => { x.strokeStyle = r.c; x.lineWidth = 2; x.fillStyle = r.c + '22'; x.beginPath(); x.moveTo(2, 2); x.lineTo(46, 2); x.lineTo(54, 10); x.lineTo(54, 54); x.lineTo(2, 54); x.closePath(); x.fill(); x.stroke(); }) ));
reg('ui', 'bar_health', mk(160, 14, x => { x.fillStyle = C.red; x.beginPath(); x.moveTo(0, 0); x.lineTo(160, 0); x.lineTo(150, 14); x.lineTo(0, 14); x.closePath(); x.fill(); R(x, 0, 0, 160, 3, '#ff9a9a'); }));
reg('ui', 'bar_armor', mk(160, 8, x => { x.fillStyle = C.yellow; x.beginPath(); x.moveTo(0, 0); x.lineTo(160, 0); x.lineTo(154, 8); x.lineTo(0, 8); x.closePath(); x.fill(); }));
reg('ui', 'bar_stamina', mk(160, 6, x => { R(x, 0, 0, 160, 6, C.cyan); }));
reg('ui', 'frame_corner', mk(24, 24, x => { x.strokeStyle = C.red; x.lineWidth = 2; x.beginPath(); x.moveTo(2, 22); x.lineTo(2, 2); x.lineTo(22, 2); x.stroke(); }));

/* =====================================================================
   9. EXPORT HELPERS (shelf-packed sprite sheet + atlas json)
   ===================================================================== */
A.sheet = (cat, maxW = 1024, pad = 4) => {
  const names = Object.keys(A.cats[cat]); let x = pad, y = pad, rowH = 0, W = 0; const pos = {};
  names.forEach(n => { const c = A.cats[cat][n]; if (x + c.width + pad > maxW) { x = pad; y += rowH + pad; rowH = 0; } pos[n] = { x, y, w: c.width, h: c.height }; x += c.width + pad; rowH = Math.max(rowH, c.height); W = Math.max(W, x); });
  const H = y + rowH + pad; const sheet = mk(W, H, ctx => { names.forEach(n => ctx.drawImage(A.cats[cat][n], pos[n].x, pos[n].y)); });
  return { canvas: sheet, atlas: pos };
};
A.categories = () => Object.keys(A.cats);
})();
