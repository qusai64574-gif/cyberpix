/* =====================================================================
   CYBERPIX // MOBILE & CONTROLLER INPUT
   Auto-fullscreen, touch controls (floating stick + aim + buttons),
   gamepad support. Auto-detects what the player is using.
   ===================================================================== */
(function () {
'use strict';

/* ---------------- device detection ---------------- */
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const touchDevice = isTouch || isCoarse;
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(navigator.userAgent);
if (touchDevice) document.body.classList.add('touch');
if (IS_IOS) document.body.classList.add('ios');
if (IS_ANDROID) document.body.classList.add('android');

/* ---------------- fullscreen ---------------- */
function goFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (!req) return;
  try {
    const r = req.call(el);
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
}
// Browsers require a user gesture, so arm this on the first interaction of any kind.
function armFullscreen() {
  const once = () => {
    goFullscreen();
    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(ev =>
      document.removeEventListener(ev, once, true));
  };
  ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(ev =>
    document.addEventListener(ev, once, true));
}
armFullscreen();
// Mobile browsers drop fullscreen when the tab is backgrounded or rotated.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && touchDevice) setTimeout(goFullscreen, 120);
});
window.addEventListener('orientationchange', () => { if (touchDevice) setTimeout(goFullscreen, 250); });

/* ---------------- mobile viewport height (URL bar) ---------------- */
function setVh() { document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px'); }
setVh();
window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', () => setTimeout(setVh, 250));

/* ---------------- gamepad ---------------- */
let gamepadIndex = -1;
let prevButtons = [];
let gamepadKeys = [];

function clearGamepadKeys() {
  gamepadKeys.forEach(k => { if (window.Game) Game.keys[k] = false; });
  gamepadKeys = [];
  if (window.Game) Game.mouse.down = false;
}

window.addEventListener('gamepadconnected', e => {
  const idx = (e && e.gamepad && typeof e.gamepad.index === 'number') ? e.gamepad.index : 0;
  gamepadIndex = idx;
  document.body.classList.add('gamepad');
});
window.addEventListener('gamepaddisconnected', e => {
  const idx = (e && e.gamepad && typeof e.gamepad.index === 'number') ? e.gamepad.index : gamepadIndex;
  if (idx !== gamepadIndex) return;
  gamepadIndex = -1;
  document.body.classList.remove('gamepad');
  clearGamepadKeys();
  prevButtons = [];
});

function pollGamepad() {
  if (!window.Game) return;
  if (gamepadIndex < 0) {
    // Some browsers only expose a pad after the first button press: scan for one.
    const list = navigator.getGamepads ? navigator.getGamepads() : null;
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].connected) { gamepadIndex = i; document.body.classList.add('gamepad'); break; }
    }
    if (gamepadIndex < 0) return;
  }
  const list = navigator.getGamepads ? navigator.getGamepads() : null;
  const gp = list && list[gamepadIndex];
  if (!gp || !gp.connected) { gamepadIndex = -1; clearGamepadKeys(); document.body.classList.remove('gamepad'); return; }

  const G = Game.G;
  const playing = window.UI && UI.screen() === 'play';
  const dz = 0.22;
  const btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const edge = i => btn(i) && !prevButtons[i];

  if (!G || G.dead || !playing) {
    if (edge(9) && window.UI) { const s = UI.screen(); if (s === 'play') UI.show('pause'); else if (s === 'pause') UI.show('play'); }
    if (edge(0) && window.UI && UI.screen() === 'pause') UI.show('play');
    prevButtons = gp.buttons.map(b => b.pressed);
    return;
  }

  const lx = Math.abs(gp.axes[0] || 0) > dz ? gp.axes[0] : 0;
  const ly = Math.abs(gp.axes[1] || 0) > dz ? gp.axes[1] : 0;
  const map = { KeyW: ly < -dz, KeyS: ly > dz, KeyA: lx < -dz, KeyD: lx > dz };
  Object.keys(map).forEach(k => {
    Game.keys[k] = map[k];
    if (map[k] && gamepadKeys.indexOf(k) < 0) gamepadKeys.push(k);
  });
  gamepadKeys = gamepadKeys.filter(k => { if (!map[k]) { Game.keys[k] = false; return false; } return true; });

  // Right stick aims through the same vector the mouse writes to.
  const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
  if (Math.abs(rx) > dz || Math.abs(ry) > dz) {
    const p = G.p, ang = Math.atan2(ry, rx), dist = 220;
    Game.mouse.x = (p.x + Math.cos(ang) * dist - G.cam.x) * Game.Z;
    Game.mouse.y = (p.y + Math.sin(ang) * dist - G.cam.y) * Game.Z;
  }

  Game.mouse.down = btn(7) || btn(5);
  if (edge(0) && G.itarget && G.itarget.need === 0) Game.interact();
  if (edge(1)) Game.keydown('KeyV');
  if (edge(2)) Game.keydown('KeyG');
  if (edge(3)) Game.keydown('KeyR');
  if (edge(4)) Game.wheelScroll(-1);
  if (edge(6)) Game.keydown('ShiftLeft');
  if (edge(9)) UI.show('pause');
  if (edge(12)) Game.keydown('KeyH');
  if (edge(13)) Game.keydown('KeyQ');

  prevButtons = gp.buttons.map(b => b.pressed);
}
setInterval(pollGamepad, 16);

/* ---------------- touch controls ---------------- */
if (touchDevice) {
  const joy = document.getElementById('joystick');
  const knob = document.getElementById('joy-knob');
  const JOY_R = 52;
  const DEAD = 0.22;

  let joyId = null, joyCX = 0, joyCY = 0;
  let aimId = null;
  const held = new Map();

  const moveZone = (x) => x < innerWidth * 0.45;

  function placeStick(x, y) {
    const size = joy.offsetWidth || 104;
    const half = size / 2;
    // Find the left edge of any button sharing the stick's vertical band, so the
    // base is clamped by real geometry instead of a guess that breaks on narrow screens.
    let limit = innerWidth - half - 6;
    const top = y - half, bot = y + half;
    document.querySelectorAll('.tbtn').forEach(b => {
      if (getComputedStyle(b).display === 'none') return;
      const r = b.getBoundingClientRect();
      if (r.bottom > top && r.top < bot) limit = Math.min(limit, r.left - half - 4);
    });
    const minX = half + 6;
    joyCX = Math.min(Math.max(x, minX), Math.max(minX, limit));
    joyCY = Math.min(Math.max(y, half + 6), innerHeight - half - 6);
    // left/top position the element's edge, so subtract the half-size to centre it.
    joy.style.left = (joyCX - half) + 'px';
    joy.style.top = (joyCY - half) + 'px';
    joy.style.bottom = 'auto';
    joy.classList.add('active');
  }

  function dragStick(x, y) {
    let dx = x - joyCX, dy = y - joyCY;
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) { dx = dx / d * JOY_R; dy = dy / d * JOY_R; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / JOY_R, ny = dy / JOY_R;
    Game.keys['KeyA'] = nx < -DEAD;
    Game.keys['KeyD'] = nx > DEAD;
    Game.keys['KeyW'] = ny < -DEAD;
    Game.keys['KeyS'] = ny > DEAD;
  }

  function releaseStick() {
    joyId = null;
    knob.style.transform = 'translate(-50%, -50%)';
    joy.classList.remove('active');
    Game.keys['KeyA'] = Game.keys['KeyD'] = Game.keys['KeyW'] = Game.keys['KeyS'] = false;
  }

  function aimAt(x, y) {
    if (!window.Game || !Game.G) return;
    Game.mouse.x = x / innerWidth * Game.W;
    Game.mouse.y = y / innerHeight * Game.H;
    Game.mouse.down = true;
  }

  function releaseAim() { aimId = null; Game.mouse.down = false; }

  function pressButton(el) {
    if (held.has(el)) return;
    held.set(el, true);
    el.classList.add('active');
    const a = el.dataset.action;
    if (!a) return;
    if (a === 'FIRE') { if (window.Game) { Game.Au.init(); Game.mousedown(0); } }
    else if (a === 'MELEE') Game.mousedown(2);
    else if (a === 'PAUSE') UI.show('pause');
    else if (a === 'HUB') UI.openTabs('hub', 'play');
    else if (a === 'WHEEL') { if (Game.G) Game.G.wheel = true; }
    else Game.keydown(a);
  }

  function releaseButton(el) {
    if (!held.has(el)) return;
    held.delete(el);
    el.classList.remove('active');
    const a = el.dataset.action;
    if (a === 'FIRE') Game.mouseup(0);
    else if (a === 'MELEE') Game.mouseup(2);
    else if (a === 'WHEEL') { if (Game.G) Game.G.wheel = false; }
    else if (a && a !== 'PAUSE' && a !== 'HUB') Game.keyup(a);
  }

  function releaseAll() {
    Array.from(held.keys()).forEach(el => releaseButton(el));
    releaseStick();
    releaseAim();
  }

  document.addEventListener('touchstart', e => {
    if (UI.screen() !== 'play') return;
    e.preventDefault();
    const ts = e.changedTouches;
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i];
      const el = e.target && e.target.closest ? e.target.closest('.tbtn') : null;
      if (el) { pressButton(el); continue; }
      if (moveZone(t.clientX)) {
        if (joyId === null) { joyId = t.identifier; placeStick(t.clientX, t.clientY); dragStick(t.clientX, t.clientY); }
      } else if (aimId === null) {
        aimId = t.identifier; aimAt(t.clientX, t.clientY);
      }
    }
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (UI.screen() !== 'play') return;
    e.preventDefault();
    const ts = e.changedTouches;
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i];
      if (t.identifier === joyId) dragStick(t.clientX, t.clientY);
      else if (t.identifier === aimId) aimAt(t.clientX, t.clientY);
    }
  }, { passive: false });

  function onEnd(e) {
    const ts = e.changedTouches;
    if (!ts || !ts.length) { releaseAll(); return; }
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i];
      if (t.identifier === joyId) releaseStick();
      else if (t.identifier === aimId) releaseAim();
    }
    // Release any button whose finger is no longer on it.
    const down = new Set();
    const all = e.touches || [];
    for (let i = 0; i < all.length; i++) {
      const el = document.elementFromPoint(all[i].clientX, all[i].clientY);
      const b = el && el.closest ? el.closest('.tbtn') : null;
      if (b) down.add(b);
    }
    Array.from(held.keys()).forEach(el => { if (!down.has(el)) releaseButton(el); });
  }
  document.addEventListener('touchend', onEnd);
  document.addEventListener('touchcancel', releaseAll);

  // Nothing may stay held once we leave gameplay or the page loses focus.
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  const watch = setInterval(() => {
    if (UI.screen() !== 'play') releaseAll();
  }, 400);
  window.addEventListener('pagehide', () => clearInterval(watch));
}

})();
