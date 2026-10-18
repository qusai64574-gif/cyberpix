/* =====================================================================
   CYBERPIX // UI  (menus, HUD, hub tabs, shops, dialogue, main loop)
   ===================================================================== */
(function () {
'use strict';
const A = window.ASSETS, D = window.D, Cfg = window.Cfg, $ = id => document.getElementById(id), TS = D.TS;
const UI = window.UI = {};
const Gm = () => Game.G;
let screen = 'main', returnTo = 'main';
const sel = { main: 0, pause: 0, death: 0, victory: 0 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const icUrl = (n, c = '#5ef2ff', s = 40) => A.url(A.icon(n, c, s));
const img = (n, c, cls = 'ri') => `<img class="${cls}" src="${icUrl(n, c, 48)}">`;
const keyName = c => (c || '').replace('Key', '').replace('Digit', '').replace('ShiftLeft', 'SHIFT').replace('Space', 'SPACE').replace('Arrow', '').toUpperCase();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const C = {}; // dom cache
const setT = (id, v) => { const k = id + 't'; if (C[k] !== v) { C[k] = v; $(id).textContent = v; } };
const setH = (id, v) => { const k = id + 'h'; if (C[k] !== v) { C[k] = v; $(id).innerHTML = v; } };
const setW = (id, f) => { const v = (clamp(f, 0, 1) * 100).toFixed(1) + '%', k = id + 'w'; if (C[k] !== v) { C[k] = v; $(id).style.width = v; } };

/* ------------- settings application ------------- */
function applyCfg() {
  document.documentElement.style.fontSize = (16 * Cfg.uiscale / 100) + 'px';
  document.body.classList.toggle('scan', !!Cfg.scanlines); document.body.classList.toggle('glitch', !!Cfg.glitch); document.body.classList.toggle('nomini', !Cfg.minimap);
  $('fps').style.display = Cfg.showfps ? 'block' : 'none'; $('hud').style.opacity = Cfg.hudop / 100;
}
function fitCanvas() { Game.fit(); }

/* ------------- screens ------------- */
const SCREEN_EL = { main: 'screen-main', pause: 'screen-pause', settings: 'screen-tabs', hub: 'screen-tabs', shop: 'screen-tabs', ripper: 'screen-tabs', dialog: 'screen-dialog', death: 'screen-death', victory: 'screen-victory', credits: 'screen-credits' };
function show(name) {
  screen = name; document.querySelectorAll('.screen').forEach(s => s.classList.remove('on')); if (SCREEN_EL[name]) $(SCREEN_EL[name]).classList.add('on');
  const frozen = name === 'pause' || name === 'hub' || name === 'shop' || name === 'ripper' || (name === 'settings' && returnTo === 'pause');
  $('game').classList.toggle('paused', frozen);
  document.body.classList.toggle('play', name === 'play'); document.body.classList.toggle('hudon', name === 'play' || name === 'dialog' || name === 'hub' && false);
  if (name === 'main') sel.main = mainItems().findIndex(i => !i.off);
  if (name === 'pause') { sel.pause = 0; $('pauseFoot').textContent = 'SECTOR 07 · ' + fmtTime(Gm() ? Gm().play : 0); }
  if (name === 'death' || name === 'victory') sel[name] = 0;
  refreshLists();
}
const fmtTime = s => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function startPlay() { Game.Au.init(); Game.Au.startMusic(); fitCanvas(); show('play'); }
function resume() { show('play'); }

/* ------------- list menus ------------- */
const mainItems = () => [
  { n: 'Continue', off: !Game.hasSave(), tag: 'SLOT 01', go: () => { if (Game.load()) startPlay(); } },
  { n: 'New Game', go: () => { Game.newGame(); startPlay(); } },
  { n: 'Load Game', off: !Game.hasSave(), go: () => { if (Game.load()) startPlay(); } },
  { n: 'Settings', go: () => openTabs('settings', 'main') },
  { n: 'Credits', go: () => show('credits') },
];
const pauseItems = () => [
  { n: 'Resume', go: resume },
  { n: 'Save Game', go: () => { Game.save(); toast('GAME SAVED'); } },
  { n: 'Load Game', off: !Game.hasSave(), go: () => { Game.load(); resume(); toast('GAME LOADED'); } },
  { n: 'Hub', go: () => openTabs('hub', 'pause') },
  { n: 'Settings', go: () => openTabs('settings', 'pause') },
  { n: 'Exit to Main Menu', go: () => show('main') },
];
const deathItems = () => [
  { n: 'Load Checkpoint', go: () => { Game.respawn(); show('play'); } },
  { n: 'Load Last Save', off: !Game.hasSave(), go: () => { Game.load(); show('play'); } },
  { n: 'Exit to Main Menu', go: () => show('main') },
];
const vicItems = () => [{ n: 'Keep Exploring', go: () => show('play') }, { n: 'New Game', go: () => { Game.newGame(); startPlay(); } }, { n: 'Main Menu', go: () => show('main') }];
const LISTS = { main: ['mainList', mainItems], pause: ['pauseList', pauseItems], death: ['deathList', deathItems], victory: ['vicList', vicItems] };
function renderList(key) {
  const [id, fn] = LISTS[key], el = $(id), items = fn(); el.innerHTML = '';
  items.forEach((it, i) => {
    const d = document.createElement('div'); d.className = 'item' + (i === sel[key] ? ' sel' : '') + (it.off ? ' off' : ''); d.innerHTML = `<span>${it.n}</span><span class="ico"></span><span class="tag">${it.tag || ''}</span>`;
    d.onmouseenter = () => { if (sel[key] !== i && !it.off) { sel[key] = i; tick(); renderList(key); } }; d.onclick = () => { if (!it.off) { ok(); it.go(); } }; el.appendChild(d);
  });
}
const refreshLists = () => { if (LISTS[screen]) renderList(screen); };
function moveSel(d) { const key = screen, items = LISTS[key][1](); let i = sel[key]; for (let n = 0; n < items.length; n++) { i = (i + d + items.length) % items.length; if (!items[i].off) break; } sel[key] = i; tick(); renderList(key); }
const tick = () => Game.Au.tone(880, .04, 'square', .4); const ok = () => { Game.Au.tone(660, .06, 'square', .4); setTimeout(() => Game.Au.tone(990, .08, 'square', .4), 60); }; const back = () => Game.Au.tone(300, .08, 'sawtooth', .5);
function toast(m) { const el = $('toast'); el.textContent = m; el.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.display = 'none', 1600); }

/* ------------- tab content ------------- */
const TB = { ctx: 'settings', tabs: [], idx: 0, row: 0, sels: [], rebind: null };
const statLine = (a, b) => `<div class="stat"><span>${a}</span><b>${b}</b></div>`;
const detail = (title, tag, icon, color, body) => `${icon ? `<img class="big" src="${icUrl(icon, color || '#5ef2ff', 96)}">` : ''}<h3>${title}</h3><div class="tg">${tag || ''}</div>${body || ''}`;

const SET = [
  { name: 'Gameplay', rows: () => [{ h: 'COMBAT' }, { k: 'difficulty', l: 'Difficulty', t: 'sel', o: ['Easy', 'Normal', 'Hard', 'Very Hard'], d: 'Enemy health and damage. Applies to newly spawned enemies.' }, { k: 'damagenums', l: 'Damage numbers', t: 'tog', d: 'Floating damage numbers.' }, { k: 'enemybars', l: 'Enemy health bars', t: 'tog', d: 'Show name, level and health over enemies.' }, { k: 'shake', l: 'Screen shake', t: 'sld', d: 'Camera shake intensity.' }, { h: 'ASSIST' }, { k: 'hints', l: 'Tutorial hints', t: 'tog', d: 'Show contextual tips during play.' }, { k: 'subtitles', l: 'Subtitles', t: 'tog', d: 'Dialogue subtitles.' }] },
  { name: 'Key Bindings', rows: () => [{ h: 'MOVEMENT' }, { kb: 'up', l: 'Move up' }, { kb: 'down', l: 'Move down' }, { kb: 'left', l: 'Move left' }, { kb: 'right', l: 'Move right' }, { kb: 'dash', l: 'Dash' }, { h: 'COMBAT' }, { kb: 'reload', l: 'Reload' }, { kb: 'melee', l: 'Melee (also RMB)' }, { kb: 'grenade', l: 'Throw grenade' }, { kb: 'heal', l: 'Use MaxDoc' }, { kb: 'hack', l: 'Quickhack target' }, { kb: 'hackcycle', l: 'Cycle quickhack' }, { kb: 'wheel', l: 'Weapon wheel (hold)' }, { h: 'WORLD' }, { kb: 'interact', l: 'Interact' }, { kb: 'hub', l: 'Open hub' }, { l: 'Reset to default', act: () => { Cfg.keys = JSON.parse(JSON.stringify(D.DEFAULT.keys)); D.saveCfg(); toast('BINDINGS RESET'); renderTabs(); }, d: 'Restore every binding.' }] },
  { name: 'Graphics', rows: () => [{ l: 'Toggle fullscreen', act: () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }, d: 'Window / fullscreen.' }, { k: 'scanlines', l: 'Scanlines', t: 'tog', d: 'CRT scanline overlay.' }, { k: 'glitch', l: 'Title glitch', t: 'tog', d: 'Animated title glitch.' }, { k: 'rain', l: 'Rain', t: 'tog', d: 'Rain overlay in the world.' }, { k: 'fx', l: 'Effects quality', t: 'sld', d: 'Particle and rain density. Lower this on weak hardware.' }, { k: 'fpscap', l: 'Frame rate limit', t: 'sel', o: ['30', '60', 'Unlimited'], d: 'Lower this on weak hardware.' }] },
  { name: 'Sound', rows: () => [{ k: 'master', l: 'Master volume', t: 'sld' }, { k: 'music', l: 'Music', t: 'sld' }, { k: 'sfx', l: 'Sound effects', t: 'sld' }, { k: 'mutebg', l: 'Mute when unfocused', t: 'tog', d: 'Silence music when the tab is hidden.' }] },
  { name: 'Interface', rows: () => [{ k: 'uiscale', l: 'UI scale', t: 'sld', min: 80, max: 130, step: 5, d: 'Scales every menu and HUD element.' }, { k: 'hudop', l: 'HUD opacity', t: 'sld', min: 20, max: 100, step: 5, d: 'In-game HUD transparency.' }, { k: 'minimap', l: 'Show minimap', t: 'tog', d: 'Top-left radar.' }, { k: 'showfps', l: 'Show FPS', t: 'tog', d: 'Frame counter.' }] },
].map(t => Object.assign(t, { settings: true }));

function weaponDetail(gun) {
  const W = D.WEAPONS[gun.id], T = D.TIERS[gun.tier], dmg = Math.round(W.dmg * T.m * (W.pellets > 1 ? W.pellets : 1));
  return detail(W.n, `<span style="color:${T.c}">${T.n}</span> &middot; ${W.ammo.toUpperCase()}`, W.icon, T.c, `<p>${W.desc}</p>${statLine('Damage', dmg + (W.pellets > 1 ? ' (x' + W.pellets + ')' : ''))}${statLine('Fire rate', W.rof + '/s')}${statLine('Magazine', W.mag)}${statLine('Reload', W.rel + 's')}${statLine('Accuracy', Math.round((1 - W.spread * 2) * 100) + '%')}${statLine('Auto', W.auto ? 'YES' : 'NO')}`);
}
function charSummary() { const g = Gm(), p = g.p, s = g.st; return `<div class="hdr">DERIVED STATS</div>${statLine('Max HP', p.hpMax)}${statLine('Max armor', p.armorMax)}${statLine('Stamina', p.stamMax)}${statLine('RAM', p.ramMax)}${statLine('Crit chance', Math.round(s.crit * 100) + '%')}${statLine('Move speed', Math.round(s.speed))}${statLine('Melee x', s.melee.toFixed(2))}${statLine('Hack power x', s.hack.toFixed(2))}`; }

const HUB = [
  { name: 'Inventory', split: 1, rows: () => {
    const g = Gm(), R = [{ h: 'WEAPONS' }];
    g.guns.forEach((gun, i) => { if (gun.sold) return; const W = D.WEAPONS[gun.id], T = D.TIERS[gun.tier], s = g.slots.indexOf(i); R.push({ l: W.n, icon: W.icon, color: T.c, ctl: s >= 0 ? `<span class="cy">SLOT ${s + 1}</span>` : '<span class="dim">SPARE</span>', d: weaponDetail(gun), act: () => { Game.api.equip(i); renderTabs(); } }); });
    R.push({ h: 'AMMUNITION' }); Object.keys(D.AMMO).forEach(k => R.push({ l: D.AMMO[k].n, icon: 'ammo', color: '#ff9a3d', ctl: g.ammo[k] + ' / ' + D.AMMO[k].max, d: detail(D.AMMO[k].n, 'AMMUNITION', 'ammo', '#ff9a3d', '<p>Picked up from enemies and crates, bought from Juno or crafted.</p>') }));
    R.push({ h: 'CONSUMABLES' }); ['medkit', 'grenade', 'armorpatch'].forEach(k => { const it = D.ITEMS[k]; R.push({ l: it.n, icon: it.icon, ctl: 'x' + g.inv[k], dis: g.inv[k] <= 0, d: detail(it.n, it.cat, it.icon, '#5ef2ff', `<p>${it.desc}</p>`), act: it.use ? () => { Game.api.use(k); renderTabs(); } : null }); });
    R.push({ h: 'JUNK & QUEST' }); ['scrap', 'comp', 'core'].forEach(k => { if (k === 'core' && !g.inv.core) return; const it = D.ITEMS[k]; R.push({ l: it.n, icon: it.icon, color: k === 'core' ? '#f3e600' : undefined, ctl: 'x' + g.inv[k], d: detail(it.n, it.cat, it.icon, '#5ef2ff', `<p>${it.desc}</p>`) }); });
    return R;
  } },
  { name: 'Cyberware', split: 1, rows: () => {
    const g = Gm(), R = []; D.SLOTS.forEach(s => { const id = g.cyber[s.id], c = id && D.CYBER[id]; R.push({ l: s.n, icon: c ? c.icon : 'lock', color: c ? '#5ef2ff' : '#7a4a4a', ctl: c ? `<span class="cy">${c.n.toUpperCase()}</span>` : '<span class="dim">EMPTY</span>', d: c ? detail(c.n, 'INSTALLED &middot; ' + s.n, c.icon, '#5ef2ff', `<p>${c.desc}</p>`) : detail(s.n, 'EMPTY SLOT', 'lock', '#7a4a4a', '<p>Visit Doc Mira in the Rust Market to install cyberware.</p>') }); });
    R.push({ h: 'SYSTEM' }); R.push({ l: 'RAM', icon: 'ram', ctl: Math.floor(g.p.ram) + ' / ' + g.p.ramMax, d: detail('RAM', 'QUICKHACK MEMORY', 'ram', '#5ef2ff', '<p>Quickhacks consume RAM, which regenerates over time. Boost it with Intellect, perks and the Neural Co-Processor.</p>' + charSummary()) });
    return R;
  } },
  { name: 'Character', split: 1, rows: () => {
    const g = Gm(), p = g.p, R = [{ h: `ATTRIBUTES &middot; ${p.attrPts} POINTS` }];
    D.ATTRS.forEach(a => R.push({ l: a.n, icon: a.icon, ctl: `<div class="seg">${Array.from({ length: 12 }, (_, j) => `<i class="${j < p.attrs[a.id] ? 'f' : ''}"></i>`).join('')}</div><span class="val">${p.attrs[a.id]}</span>`, d: detail(a.n, 'LEVEL ' + p.attrs[a.id], a.icon, '#5ef2ff', `<p>${a.desc}</p>` + charSummary()), act: () => { if (!Game.api.attr(a.id)) toast('NO ATTRIBUTE POINTS'); renderTabs(); }, adj: d => { if (d > 0 && Game.api.attr(a.id)) renderTabs(); } }));
    R.push({ h: `PERKS &middot; ${p.perkPts} POINTS` });
    D.PERKS.forEach(k => { const own = p.perks[k.id], can = p.attrs[k.attr] >= k.req; R.push({ l: k.n, icon: k.icon, color: own ? '#f3e600' : undefined, dis: !own && !can, ctl: own ? '<span class="yel">OWNED</span>' : `<span class="${can ? '' : 'bad'}">${k.attr.toUpperCase()} ${k.req}</span>`, d: detail(k.n, own ? 'OWNED' : 'REQUIRES ' + k.attr.toUpperCase() + ' ' + k.req, k.icon, '#f3e600', `<p>${k.desc}</p>`), act: () => { if (!Game.api.perk(k.id)) toast(own ? 'ALREADY OWNED' : !can ? 'ATTRIBUTE TOO LOW' : 'NO PERK POINTS'); renderTabs(); } }); });
    R.push({ h: 'PROFILE' }); R.push({ l: 'Street Cred', icon: 'star', ctl: `LVL ${p.lvl}`, d: detail('Street Cred ' + p.lvl, 'REPUTATION', 'star', '#f3e600', `${statLine('XP', p.xp + ' / ' + D.xpNeeded(p.lvl))}${statLine('Kills', g.stats.kills)}${statLine('Deaths', g.stats.deaths)}${statLine('Play time', fmtTime(g.play))}${statLine('Eddies earned', g.stats.eddies)}`) });
    return R;
  } },
  { name: 'Crafting', split: 1, rows: () => {
    const g = Gm(), R = [{ h: `SCRAP ${g.inv.scrap} &middot; COMPONENTS ${g.inv.comp}` }];
    D.RECIPES.forEach(r => { const it = r.out ? D.ITEMS[r.out] : null, can = Object.keys(r.cost).every(k => g.inv[k] >= r.cost[k]), cost = Object.keys(r.cost).map(k => `${r.cost[k]} ${k === 'comp' ? 'COMP' : 'SCRAP'}`).join(' + '); R.push({ l: it ? it.n : r.label, icon: it ? it.icon : r.icon, ctl: `<span class="${can ? 'ok' : 'bad'}">${cost}</span>`, dis: !can, d: detail(it ? it.n : r.label, 'CRAFTING', it ? it.icon : r.icon, '#5ef2ff', `<p>${it ? it.desc : 'Ammunition assembled from salvage.'}</p>${statLine('Cost', cost)}${statLine('You have', g.inv.scrap + ' scrap, ' + g.inv.comp + ' comp')}`), act: () => { if (!Game.api.craft(r)) toast('NOT ENOUGH MATERIALS'); renderTabs(); } }); });
    return R;
  } },
  { name: 'Journal', split: 1, rows: () => {
    const g = Gm(), R = [], groups = [['ACTIVE MAIN JOBS', k => g.q[k] && g.q[k].state === 'active' && D.QUESTS[k].type === 'MAIN'], ['ACTIVE SIDE JOBS', k => g.q[k] && g.q[k].state === 'active' && D.QUESTS[k].type === 'SIDE'], ['COMPLETED', k => g.q[k] && g.q[k].state === 'done']];
    groups.forEach(([h, f]) => { const ks = D.QORDER.filter(f); if (!ks.length) return; R.push({ h }); ks.forEach(k => { const def = D.QUESTS[k], q = g.q[k]; const steps = def.steps.map((s, i) => `<div class="step ${q.state === 'done' || i < q.step ? 'done' : i === q.step ? 'cur' : ''}">${esc(s.replace('%n', i === q.step ? q.n : (q.state === 'done' || i < q.step ? s.match(/%n\/(\d+)/) ? s.match(/%n\/(\d+)/)[1] : '' : 0)))}</div>`).join(''); const r = def.reward || {}; const rw = [r.eddies ? r.eddies + ' eddies' : '', r.xp ? r.xp + ' XP' : '', r.weapon ? D.TIERS[r.weapon[1]].n.toLowerCase() + ' ' + D.WEAPONS[r.weapon[0]].n : '', r.item ? r.item[1] + 'x ' + D.ITEMS[r.item[0]].n : ''].filter(Boolean).join(', ');
      R.push({ l: def.title, icon: 'quest', color: def.type === 'MAIN' ? '#f3e600' : '#5ef2ff', ctl: g.tracked === k ? '<span class="yel">TRACKED</span>' : q.state === 'done' ? '<span class="ok">DONE</span>' : def.type, d: detail(def.title, def.type + ' JOB', 'quest', def.type === 'MAIN' ? '#f3e600' : '#5ef2ff', `<p>${def.desc}</p><div class="hdr">OBJECTIVES</div>${steps}<div class="hdr">REWARD</div><p>${rw}</p>`), act: q.state === 'active' ? () => { Game.api.track(k); toast('MISSION TRACKED'); renderTabs(); } : null }); }); });
    if (!R.length) R.push({ l: 'No missions', d: '' }); return R;
  } },
  { name: 'Map', custom: (el) => { el.innerHTML = `<div class="hdr">SECTOR 07 &middot; WESTBROOK</div><canvas id="map" width="900" height="676"></canvas><p class="dim" style="margin-top:.4rem;font-size:.95rem"><span class="yel">&#9670;</span> tracked mission &nbsp; <span class="cy">&#9679;</span> checkpoint &nbsp; <span class="yel">&#9679;</span> NPC &nbsp; &#9679; you</p>`; const c = $('map'); Game.fullMap(c.getContext('2d'), 900, 676); } },
  { name: 'Codex', split: 1, rows: () => {
    const g = Gm(), R = [], cats = {}; Object.keys(D.CODEX).forEach(k => { if (g.codex[k]) { const e = D.CODEX[k]; (cats[e.cat] = cats[e.cat] || []).push(e); } });
    Object.keys(cats).forEach(c => { R.push({ h: c }); cats[c].forEach(e => R.push({ l: e.n, icon: c === 'SHARD' ? 'shard' : 'book', ctl: '', d: detail(e.n, e.cat, c === 'SHARD' ? 'shard' : 'book', '#5ef2ff', `<p>${esc(e.text)}</p>`) })); });
    R.push({ h: 'MESSAGES' }); const ms = g.msgs.map(id => D.MESSAGES.find(m => m.id === id)).filter(Boolean); D.MESSAGES.forEach(m => { if (!g.msgs.includes(m.id) && ((m.id === 'msg_mira' && g.cpSeen.cp1) || (m.id === 'msg_juno' && g.cpSeen.cp1))) g.msgs.push(m.id); });
    g.msgs.map(id => D.MESSAGES.find(m => m.id === id)).filter(Boolean).forEach(m => R.push({ l: m.from, icon: 'msg', ctl: '', d: detail(m.from, 'MESSAGE', 'msg', '#5ef2ff', `<p>${esc(m.text)}</p>`) }));
    return R;
  } },
].map(t => Object.assign({ hub: true }, t));

function shopRows(mode) {
  const g = Gm(), R = [{ h: 'EDDIES &middot; ' + g.p.eddies }], price = (p, mult = 1) => Math.round(p * mult);
  const price$ = p => `<span class="${g.p.eddies >= p ? 'yel' : 'bad'}">${p} &euro;$</span>`;
  if (mode === 'buy') {
    R.push({ h: 'SUPPLIES' });
    [['medkit', 60], ['grenade', 45], ['armorpatch', 70]].forEach(([k, p]) => { const it = D.ITEMS[k]; R.push({ l: it.n, icon: it.icon, ctl: price$(p), d: detail(it.n, it.cat, it.icon, '#5ef2ff', `<p>${it.desc}</p>${statLine('Owned', g.inv[k])}`), act: () => { if (!Game.api.buy('item', k, p)) toast('NOT ENOUGH EDDIES'); renderTabs(); } }); });
    R.push({ h: 'AMMUNITION' }); [['9mm', 25], ['shell', 30], ['slug', 40]].forEach(([k, p]) => R.push({ l: D.AMMO[k].n + ' x' + D.AMMO[k].pack, icon: 'ammo', color: '#ff9a3d', ctl: price$(p), d: detail(D.AMMO[k].n, 'AMMUNITION', 'ammo', '#ff9a3d', statLine('Owned', g.ammo[k] + ' / ' + D.AMMO[k].max)), act: () => { if (g.ammo[k] >= D.AMMO[k].max) toast('AMMO FULL'); else if (!Game.api.buy('ammo', k, p)) toast('NOT ENOUGH EDDIES'); renderTabs(); } }));
    R.push({ h: 'WEAPONS' }); [['pistol', 1, 300], ['smg', 0, 480], ['shotgun', 0, 520], ['rifle', 1, 1100]].forEach(([k, t, p]) => { const W = D.WEAPONS[k]; R.push({ l: W.n, icon: W.icon, color: D.TIERS[t].c, ctl: price$(p), d: weaponDetail({ id: k, tier: t }), act: () => { if (!Game.api.buy('weapon', k, p, t)) toast('NOT ENOUGH EDDIES'); renderTabs(); } }); });
  } else {
    R.push({ h: 'SELL' }); [['scrap', 4], ['comp', 10], ['medkit', 25], ['grenade', 15], ['armorpatch', 28]].forEach(([k, p]) => { const it = D.ITEMS[k]; R.push({ l: it.n, icon: it.icon, ctl: `x${g.inv[k]} &nbsp;<span class="yel">${p} &euro;$</span>`, dis: g.inv[k] <= 0, d: detail(it.n, 'SELL', it.icon, '#5ef2ff', `<p>${it.desc}</p>`), act: () => { if (!Game.api.sell('item', k, p)) toast('NOTHING TO SELL'); renderTabs(); } }); });
    g.guns.forEach((gun, i) => { if (gun.sold) return; const W = D.WEAPONS[gun.id], p = Math.round(W.price * D.TIERS[gun.tier].m * .4), s = g.slots.indexOf(i); R.push({ l: W.n, icon: W.icon, color: D.TIERS[gun.tier].c, ctl: `${s >= 0 ? '<span class="cy">EQUIPPED</span> ' : ''}<span class="yel">${p} &euro;$</span>`, d: weaponDetail(gun), act: () => { if (!Game.api.sell('gun', i, p)) toast('CAN\'T SELL YOUR ONLY WEAPON'); renderTabs(); } }); });
  }
  return R;
}
function ripperRows() {
  const g = Gm(), R = [{ h: 'EDDIES &middot; ' + g.p.eddies }];
  D.SLOTS.forEach(s => { R.push({ h: s.n }); Object.keys(D.CYBER).filter(k => D.CYBER[k].slot === s.id).forEach(k => { const c = D.CYBER[k], inst = g.cyber[s.id] === k; R.push({ l: c.n, icon: c.icon, color: inst ? '#f3e600' : undefined, ctl: inst ? '<span class="yel">INSTALLED</span>' : `<span class="${g.p.eddies >= c.price ? 'yel' : 'bad'}">${c.price} &euro;$</span>`, d: detail(c.n, s.n + (inst ? ' &middot; INSTALLED' : ''), c.icon, '#5ef2ff', `<p>${c.desc}</p>${statLine('Price', c.price + ' &euro;$')}`), act: () => { if (inst) toast('ALREADY INSTALLED'); else if (!Game.api.install(k)) toast('NOT ENOUGH EDDIES'); else toast(c.n.toUpperCase() + ' INSTALLED'); renderTabs(); } }); }); });
  return R;
}
const SHOP = [{ name: 'Buy', split: 1, rows: () => shopRows('buy') }, { name: 'Sell', split: 1, rows: () => shopRows('sell') }];
const RIP = [{ name: 'Cyberware', split: 1, rows: ripperRows }];

function openTabs(ctx, from) {
  TB.ctx = ctx; returnTo = from; TB.idx = 0; TB.row = 0; TB.rebind = null; TB.tabs = ctx === 'settings' ? SET : ctx === 'hub' ? HUB : ctx === 'shop' ? SHOP : RIP; show(ctx); renderTabs();
}
function renderTabs() {
  const tabs = TB.tabs, tab = tabs[TB.idx], g = Gm(); const multi = tabs.length > 1;
  $('tabBar').innerHTML = (multi ? '<span class="qe">Q</span>' : '') + tabs.map((t, i) => `<div class="tab${i === TB.idx ? ' sel' : ''}" data-i="${i}">${t.name}</div>`).join('') + (multi ? '<span class="qe">E</span>' : '') + `<span class="where">${TB.ctx === 'settings' ? 'SYSTEM' : TB.ctx === 'hub' ? (g ? `ATTR PTS ${g.p.attrPts} &middot; PERK PTS ${g.p.perkPts}` : '') : TB.ctx === 'shop' ? `JUNO &middot; ${g.p.eddies} &euro;$` : `DOC MIRA &middot; ${g.p.eddies} &euro;$`}</span>`;
  document.querySelectorAll('.tab').forEach(el => el.onclick = () => { TB.idx = +el.dataset.i; TB.row = 0; tick(); renderTabs(); });
  const body = $('tabBody'), prevScroll = body.querySelector('.lst') ? body.querySelector('.lst').scrollTop : 0;
  $('fbar').innerHTML = `${multi ? '<span><b>Q</b><b>E</b>Tab</span>' : ''}<span><b>&uarr;&darr;</b>Navigate</span>${tab.settings ? '<span><b>&larr;&rarr;</b>Adjust</span>' : ''}<span><b>ENTER</b>Select</span><span><b>ESC</b>Back</span><span class="desc" id="desc"></span>`;
  if (tab.custom) { body.innerHTML = '<div class="lst" id="cust"></div>'; tab.custom($('cust')); TB.sels = []; return; }
  const rows = tab.rows(); TB.sels = rows.filter(r => !r.h); TB.row = clamp(TB.row, 0, Math.max(0, TB.sels.length - 1));
  let si = 0, html = '';
  rows.forEach(r => {
    if (r.h) { html += `<div class="hdr">${r.h}</div>`; return; } const i = si++; let ctl = r.ctl || '';
    if (r.t === 'sld') { const mn = r.min ?? 0, mx = r.max ?? 100, v = Cfg[r.k], n = Math.round((v - mn) / (mx - mn) * 20); ctl = `<div class="seg">${Array.from({ length: 20 }, (_, j) => `<i class="${j < n ? 'f' : ''}"></i>`).join('')}</div><span class="val">${v}</span>`; }
    else if (r.t === 'tog') ctl = `<span>${Cfg[r.k] ? 'ON' : 'OFF'}</span><span class="chk${Cfg[r.k] ? ' on' : ''}"></span>`;
    else if (r.t === 'sel') ctl = `<span class="arr">&lsaquo;</span><span>${r.o[Cfg[r.k]]}</span><span class="arr">&rsaquo;</span>`;
    else if (r.kb) ctl = `<span>${TB.rebind === r.kb ? 'PRESS A KEY...' : keyName(Cfg.keys[r.kb])}</span>`;
    html += `<div class="row${i === TB.row ? ' sel' : ''}${r.dis ? ' dis' : ''}" data-i="${i}">${r.icon ? `<img class="ri" src="${icUrl(r.icon, r.color || '#5ef2ff', 48)}">` : ''}<span class="lab">${r.l}</span><span class="ctl">${ctl}</span></div>`;
  });
  body.innerHTML = `<div class="lst">${html}</div>${tab.split ? '<div class="det" id="det"></div>' : ''}`;
  const lst = body.querySelector('.lst'); lst.scrollTop = prevScroll;
  lst.querySelectorAll('.row').forEach(el => { const i = +el.dataset.i; el.onmouseenter = () => { if (TB.row !== i) { TB.row = i; tick(); markRow(); } }; el.onclick = () => { TB.row = i; markRow(); activate(TB.sels[i]); }; });
  markRow(true);
}
function markRow(noScroll) {
  const rowsEl = document.querySelectorAll('#tabBody .row'); rowsEl.forEach((el, i) => el.classList.toggle('sel', i === TB.row)); const r = TB.sels[TB.row]; if (!r) return;
  if (!noScroll && rowsEl[TB.row]) rowsEl[TB.row].scrollIntoView({ block: 'nearest' }); else if (rowsEl[TB.row]) rowsEl[TB.row].scrollIntoView({ block: 'nearest' });
  const det = $('det'); if (det) det.innerHTML = typeof r.d === 'function' ? r.d() : (r.d || ''); const ds = $('desc'); if (ds && !det) ds.textContent = r.d || '';
}
function activate(r) {
  if (!r) return; if (r.kb) { TB.rebind = r.kb; renderTabs(); return; } if (r.act) { ok(); r.act(); return; } if (r.t === 'tog') adjust(r, 1);
}
function adjust(r, dir) {
  if (r.adj) { r.adj(dir); return; } if (!r.k) return;
  if (r.t === 'sld') { const mn = r.min ?? 0, mx = r.max ?? 100, st = r.step ?? 5; Cfg[r.k] = clamp(Cfg[r.k] + dir * st, mn, mx); } else if (r.t === 'tog') Cfg[r.k] = !Cfg[r.k]; else if (r.t === 'sel') Cfg[r.k] = (Cfg[r.k] + dir + r.o.length) % r.o.length; else return;
  tick(); D.saveCfg(); applyCfg(); renderTabs();
}
function closeTabs() { back(); TB.rebind = null; D.saveCfg(); if (returnTo === 'pause') show('pause'); else if (returnTo === 'play') show('play'); else show('main'); }

/* ------------- dialogue ------------- */
let DL = { node: null, i: 0, chars: 0, full: '' };
UI.openDialog = function (id) { const n = Game.dialogRoot(id); if (!n) return; show('dialog'); setNode(n); };
function setNode(n) { DL.node = n; DL.i = 0; DL.full = n.text; DL.chars = 0; $('dWho').textContent = n.who; renderOpts(); typeStep(); }
function typeStep() { clearTimeout(DL.t); if (screen !== 'dialog') return; DL.chars = Math.min(DL.full.length, DL.chars + 2); $('dTxt').textContent = DL.full.slice(0, DL.chars); if (DL.chars < DL.full.length) DL.t = setTimeout(typeStep, 16); }
function renderOpts() { $('dOpts').innerHTML = DL.node.opts.map((o, i) => `<div class="opt${i === DL.i ? ' sel' : ''}" data-i="${i}"><b>${i + 1}</b><span>${o.t}</span></div>`).join(''); document.querySelectorAll('.opt').forEach(el => { el.onmouseenter = () => { DL.i = +el.dataset.i; document.querySelectorAll('.opt').forEach((x, j) => x.classList.toggle('sel', j === DL.i)); }; el.onclick = () => chooseOpt(+el.dataset.i); }); }
function chooseOpt(i) { const o = DL.node.opts[i]; if (!o) return; ok(); clearTimeout(DL.t); const nx = o.go(); if (screen !== 'dialog') return; if (nx) setNode(nx); else show('play'); }
UI.openShop = () => openTabs('shop', 'play');
UI.openRipper = () => openTabs('ripper', 'play');

/* ------------- HUD events ------------- */
const kindIcon = { loot: 'chip', quest: 'quest', obj: 'check', warn: 'enemy', info: 'star' };
UI.notify = (text, kind, icon) => { const f = $('feed'); while (f.children.length > 6) f.removeChild(f.firstChild); const d = document.createElement('div'); d.className = 'fe ' + (kind || ''); d.innerHTML = `<img src="${icUrl(icon || kindIcon[kind] || 'star', kind === 'quest' ? '#f3e600' : kind === 'warn' ? '#ff4d4d' : '#5ef2ff', 32)}"><span>${esc(text)}</span>`; f.appendChild(d); setTimeout(() => { d.style.opacity = 0; setTimeout(() => d.remove(), 520); }, 3400); };
UI.banner = (a, b, kind) => { const el = $('banner'); $('b1').textContent = a; $('b2').textContent = b || ''; el.className = (kind || '') ; void el.offsetWidth; el.className = (kind || '') + ' show'; };
UI.hint = t => { const el = $('hint'); el.textContent = t; el.className = ''; void el.offsetWidth; el.className = 'show'; };
UI.hitmarker = crit => { const h = $('hm'); h.style.backgroundImage = `url(${A.url(A.get('ui', crit ? 'hitmarker_crit' : 'hitmarker'))})`; h.className = ''; void h.offsetWidth; h.className = 'on'; };
UI.damaged = (ang) => { const f = $('hurtflash'); f.className = ''; void f.offsetWidth; f.className = 'on'; const i = document.createElement('i'); i.style.transform = `rotate(${ang * 57.3 + 90}deg)`; i.style.transformOrigin = '60px 160px'; i.style.opacity = 1; i.style.transition = 'opacity .8s'; $('dmg').appendChild(i); requestAnimationFrame(() => { i.style.opacity = 0; }); setTimeout(() => i.remove(), 900); };
UI.objective = () => { const t = $('trk'); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); };
UI.xpgain = n => { };
UI.codexnew = n => UI.notify('Codex: ' + n, 'quest', 'book');
UI.bossbar = (on, name) => { $('bossbar').classList.toggle('on', !!on); if (name) $('bossN').textContent = name.toUpperCase(); if (on) setW('bossF', 1); };
UI.bossupdate = p => setW('bossF', p);
UI.weaponchange = () => { };
UI.hackchange = () => { };
UI.newgame = () => { $('feed').innerHTML = ''; $('hint').className = ''; $('bossbar').classList.remove('on'); };
UI.respawned = () => { };
UI.death = () => { setTimeout(() => { if (Gm() && Gm().dead) show('death'); }, 1700); };
UI.victory = (st, play) => { $('vstats').innerHTML = `<div>KILLS<b>${st.kills}</b></div><div>DEATHS<b>${st.deaths}</b></div><div>EDDIES<b>${st.eddies}</b></div><div>TIME<b>${fmtTime(play)}</b></div>`; setTimeout(() => show('victory'), 900); };
UI.prompt = null;

/* ------------- HUD update ------------- */
let miniT = 0;
const slotSig = () => { const g = Gm(); return g.slots.join() + g.cur + g.guns.map(x => x.id + x.tier).join(); };
function updateHud(dt) {
  const g = Gm(); if (!g) return; const p = g.p, W = Game.W;
  setW('hpF', p.hp / p.hpMax); setW('hpG', p.hp / p.hpMax); setT('hpT', Math.ceil(p.hp) + ' / ' + p.hpMax); setW('arF', p.armor / p.armorMax); setT('arT', Math.ceil(p.armor)); setW('stF', p.stam / p.stamMax);
  const rf = Math.floor(p.ram), rs = 'r' + p.ramMax + '_' + rf; if (C.ramsig !== rs) { C.ramsig = rs; $('ram').innerHTML = Array.from({ length: p.ramMax }, (_, i) => `<i class="${i < rf ? 'f' : ''}"></i>`).join(''); }
  setT('eddies', String(p.eddies)); setT('lvl', 'LVL ' + p.lvl); if (!C.mi) { C.mi = 1; $('moneyIc').src = icUrl('eddies', '#f3e600', 32); }
  setW('xpF', p.xp / D.xpNeeded(p.lvl)); document.body.classList.toggle('low', p.hp / p.hpMax < .3 && !g.dead);
  // tracker
  const q = g.tracked && g.q[g.tracked]; if (q) { const def = D.QUESTS[g.tracked], tg = Game.Q.target(g.tracked); setT('trkT', def.type + ' JOB'); setT('trkN', def.title); setT('trkO', (def.steps[q.step] || '').replace('%n', q.n)); const d = tg ? Math.round(Math.hypot(tg.x - p.x, tg.y - p.y) / 16 / 5) * 5 : 0; setT('trkD', tg ? d + ' m' : ''); $('trk').style.display = 'block'; } else $('trk').style.display = 'none';
  // weapon
  const gun = Game.curGun(), sig = slotSig(); if (C.slsig !== sig) { C.slsig = sig; $('slots').innerHTML = g.slots.map((gi, i) => { const gn = gi >= 0 ? g.guns[gi] : null; return `<div class="sl${i === g.cur ? ' cur' : ''}${gn ? '' : ' empty'}"><em>${i + 1}</em>${gn ? `<img src="${icUrl(D.WEAPONS[gn.id].icon, D.TIERS[gn.tier].c, 48)}">` : ''}</div>`; }).join(''); }
  if (gun) { const Wp = D.WEAPONS[gun.id]; setT('wN', D.TIERS[gun.tier].n + ' ' + Wp.n); setH('wA', `${gun.mag} <small>/ ${g.ammo[Wp.ammo]}</small>`); $('wA').classList.toggle('empty', gun.mag <= 0); setW('wR', p.reloadT > 0 ? 1 - p.reloadT / p.reloadMax : 0); }
  setH('cGt', 'x' + g.inv.grenade); setH('cMt', 'x' + g.inv.medkit); if (!C.ci) { C.ci = 1; $('cGi').src = icUrl('grenade', '#5ef2ff', 32); $('cMi').src = icUrl('medkit', '#5ef2ff', 32); } $('cM').classList.toggle('cd', p.healCd > 0);
  // hacks
  const hs = g.hackSel + '_' + rf; if (C.hksig !== hs) { C.hksig = hs; $('hacks').innerHTML = `<div class="hl">HACK [${keyName(Cfg.keys.hack)}] &middot; CYCLE [${keyName(Cfg.keys.hackcycle)}]</div>` + D.HACKS.map((h, i) => `<div class="hk${i === g.hackSel ? ' cur' : ''}${rf < h.cost ? ' no' : ''}"><img src="${icUrl(h.icon, '#5ef2ff', 32)}">${h.n}<b>${h.cost}</b></div>`).join(''); }
  // prompt
  const it = g.itarget; if (it && !g.dead && screen === 'play') { const pr = $('prompt'); pr.style.display = 'flex'; setT('pK', keyName(Cfg.keys.interact)); setT('pT', it.label + (it.need > 0 ? ' (hold)' : '')); $('pB').style.width = (g.ip * 100) + '%'; } else $('prompt').style.display = 'none';
  // zone + minimap
  if (g.zone) setT('mZone', g.zone.n); setT('mTime', fmtTime(g.play));
  miniT -= dt; if (miniT <= 0 && Cfg.minimap) { miniT = .07; Game.minimap($('miniCv').getContext('2d'), 240, 134, 30); }
  // weapon wheel
  const wh = $('wheel'); if (g.wheel) { wh.classList.add('on'); const pos = [[0, -110], [110, 0], [0, 110], [-110, 0]]; wh.innerHTML = g.slots.map((gi, i) => { const gn = gi >= 0 ? g.guns[gi] : null; return `<div class="ws${i === g.wheelSel ? ' sel' : ''}${gn ? '' : ' empty'}" style="left:${pos[i][0]}px;top:${pos[i][1]}px">${gn ? `<img src="${icUrl(D.WEAPONS[gn.id].icon, D.TIERS[gn.tier].c, 64)}">${D.WEAPONS[gn.id].n}` : 'EMPTY'}</div>`; }).join(''); } else wh.classList.remove('on');
  // crosshair
  const xh = $('xh'); const m = Game.mouse, k = 1 + p.kick * .03 + Math.hypot(p.vx, p.vy) / 1200; xh.style.transform = `translate(${m.cx}px,${m.cy}px) scale(${k})`; if (!C.xhI) { C.xhI = 1; xh.style.backgroundImage = `url(${A.url(A.get('ui', 'crosshair_ring'))})`; }
  const hm = $('hm'); hm.style.left = m.cx + 'px'; hm.style.top = m.cy + 'px';
}

/* ------------- input ------------- */
addEventListener('keydown', e => {
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (TB.rebind) { if (e.code !== 'Escape') { Cfg.keys[TB.rebind] = e.code; D.saveCfg(); ok(); } TB.rebind = null; renderTabs(); return; }
  const up = ['ArrowUp', 'KeyW'].includes(e.code), dn = ['ArrowDown', 'KeyS'].includes(e.code), lf = e.code === 'ArrowLeft' || e.code === 'KeyA', rt = e.code === 'ArrowRight' || e.code === 'KeyD', ent = e.code === 'Enter' || e.code === 'NumpadEnter', esc = e.code === 'Escape';
  if (screen === 'play') { Game.keys[e.code] = true; if (esc) { show('pause'); return; } if (e.code === Cfg.keys.hub) { openTabs('hub', 'play'); return; } if (!e.repeat) Game.keydown(e.code); return; }
  Game.keys[e.code] = false;
  if (screen in LISTS) { if (up) moveSel(-1); else if (dn) moveSel(1); else if (ent) { const it = LISTS[screen][1]()[sel[screen]]; if (it && !it.off) { ok(); it.go(); } } else if (esc && screen === 'pause') { back(); resume(); } }
  else if (screen === 'credits') { if (esc || ent) { back(); show('main'); } }
  else if (screen === 'dialog') { if (up) { DL.i = (DL.i - 1 + DL.node.opts.length) % DL.node.opts.length; renderOpts(); } else if (dn) { DL.i = (DL.i + 1) % DL.node.opts.length; renderOpts(); } else if (ent) { if (DL.chars < DL.full.length) { DL.chars = DL.full.length; $('dTxt').textContent = DL.full; } else chooseOpt(DL.i); } else if (/^Digit[1-9]$/.test(e.code)) chooseOpt(+e.code.slice(5) - 1); else if (esc) { clearTimeout(DL.t); show('play'); } }
  else if (screen === 'settings' || screen === 'hub' || screen === 'shop' || screen === 'ripper') {
    const nt = TB.tabs.length;
    if (e.code === 'KeyQ' || e.code === 'PageUp') { if (nt > 1) { TB.idx = (TB.idx - 1 + nt) % nt; TB.row = 0; tick(); renderTabs(); } }
    else if (e.code === 'KeyE' || e.code === 'PageDown') { if (nt > 1) { TB.idx = (TB.idx + 1) % nt; TB.row = 0; tick(); renderTabs(); } }
    else if (esc || (screen === 'hub' && e.code === Cfg.keys.hub)) closeTabs();
    else { const n = TB.sels.length, r = TB.sels[TB.row]; if (up && n) { TB.row = (TB.row - 1 + n) % n; tick(); markRow(); } else if (dn && n) { TB.row = (TB.row + 1) % n; tick(); markRow(); } else if (lf && r) adjust(r, -1); else if (rt && r) adjust(r, 1); else if (ent) activate(r); }
  }
});
addEventListener('keyup', e => { Game.keys[e.code] = false; if (screen === 'play') Game.keyup(e.code); else if (e.code === Cfg.keys.wheel && Gm()) Gm().wheel = false; });
addEventListener('blur', () => { for (const k in Game.keys) Game.keys[k] = false; Game.mouse.down = false; if (Gm()) Gm().wheel = false; if (screen === 'play') show('pause'); });
function mpos(e) { Game.mouse.cx = e.clientX; Game.mouse.cy = e.clientY; Game.mouse.x = e.clientX / innerWidth * Game.W; Game.mouse.y = e.clientY / innerHeight * Game.H; }
addEventListener('mousemove', mpos);
addEventListener('mousedown', e => { mpos(e); if (screen === 'play') { e.preventDefault(); Game.mousedown(e.button); } });
addEventListener('mouseup', e => { Game.mouseup(e.button); });
addEventListener('contextmenu', e => { if (screen === 'play') e.preventDefault(); });
addEventListener('wheel', e => { if (screen === 'play') Game.wheelScroll(e.deltaY > 0 ? 1 : -1); }, { passive: true });
addEventListener('resize', fitCanvas);
// Mobile URL bars and orientation flips settle late, so refit after they do.
addEventListener('orientationchange', () => { setTimeout(fitCanvas, 150); setTimeout(fitCanvas, 500); });
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitCanvas);
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play') show('pause'); });

/* ------------- main loop ------------- */
let last = performance.now(), menuT = 0, fpsN = 0, fpsT = 0;
function frame(now) {
  requestAnimationFrame(frame); const cap = [30, 60, 0][Cfg.fpscap]; if (cap && now - last < 1000 / cap - 1) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now; fpsN++; fpsT += dt; if (fpsT >= 1) { $('fps').textContent = fpsN + ' FPS'; fpsN = 0; fpsT = 0; }
  const live = screen === 'play' || screen === 'dialog' || screen === 'death';
  if (screen === 'play' || screen === 'death') Game.update(dt);
  if (live && Gm()) { Game.render(); updateHud(dt); }
  else if (screen === 'main' || screen === 'credits' || (screen === 'settings' && returnTo === 'main')) { menuT += dt; Game.render(menuT); }
  else if (screen === 'victory' && Gm()) { Game.render(); }
}
UI.screen = () => screen; UI.show = show; UI.openTabs = openTabs;

/* ------------- boot ------------- */
applyCfg(); fitCanvas(); Game.init($('game')); fitCanvas(); Game.mouse.cx = innerWidth / 2; Game.mouse.cy = innerHeight / 2; show('main'); requestAnimationFrame(frame);
})();
