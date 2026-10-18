/* =====================================================================
   CYBERPIX // GAME DATA  (settings, items, weapons, enemies, missions, map)
   ===================================================================== */
(function () {
'use strict';
const D = window.D = {};

/* ---------------- settings ---------------- */
const DEFAULT = {
  difficulty: 1, hints: true, shake: 60, autoaim: false, subtitles: true, damagenums: true,
  sens: 50, rumble: true,
  scanlines: true, glitch: true, fpscap: 1, fx: 80, rain: true, bloom: true,
  master: 80, music: 50, sfx: 80, voice: 80, mutebg: true,
  uiscale: 100, hudop: 100, showfps: false, minimap: true, enemybars: true,
  keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', dash: 'ShiftLeft', interact: 'KeyE', reload: 'KeyR', heal: 'KeyH', grenade: 'KeyG', hack: 'KeyQ', hackcycle: 'KeyX', wheel: 'KeyC', melee: 'KeyV', hub: 'Tab' }
};
D.DEFAULT = DEFAULT;
const Cfg = window.Cfg = JSON.parse(JSON.stringify(DEFAULT));
try { const s = JSON.parse(localStorage.getItem('cyberpix_settings') || 'null'); if (s) { Object.assign(Cfg, s); Cfg.keys = Object.assign({}, DEFAULT.keys, s.keys || {}); } } catch (e) {}
D.saveCfg = () => { try { localStorage.setItem('cyberpix_settings', JSON.stringify(Cfg)); } catch (e) {} };

/* ---------------- weapons ---------------- */
D.TIERS = [{ n: 'COMMON', m: 1, c: '#b4bcc8' }, { n: 'UNCOMMON', m: 1.15, c: '#5bd96b' }, { n: 'RARE', m: 1.3, c: '#4aa8ff' }, { n: 'EPIC', m: 1.5, c: '#c07bff' }, { n: 'LEGENDARY', m: 1.8, c: '#f3e600' }];
D.WEAPONS = {
  pistol:  { n: 'Sidearm M-10', icon: 'pistol',  dmg: 24, rof: 4.2, mag: 12, ammo: '9mm',  spread: .025, speed: 950,  pellets: 1, auto: false, rel: 1.0, kick: 3, price: 220, desc: 'Reliable semi-auto sidearm.' },
  smg:     { n: 'Rattler SMG',  icon: 'smg',     dmg: 11, rof: 11,  mag: 30, ammo: '9mm',  spread: .07,  speed: 900,  pellets: 1, auto: true,  rel: 1.4, kick: 2, price: 480, desc: 'High rate of fire, wild spread.' },
  shotgun: { n: 'Breacher',     icon: 'shotgun', dmg: 10, rof: 1.2, mag: 6,  ammo: 'shell', spread: .2,   speed: 800,  pellets: 7, auto: false, rel: 1.9, kick: 8, price: 520, desc: 'Devastating at close range.', life: .35 },
  rifle:   { n: 'Longshot',     icon: 'rifle',   dmg: 90, rof: 1.1, mag: 5,  ammo: 'slug', spread: .004, speed: 1900, pellets: 1, auto: false, rel: 1.8, kick: 6, price: 950, desc: 'Piercing precision rifle.', pierce: 2 },
};
D.AMMO = { '9mm': { n: '9mm Rounds', icon: 'ammo', max: 240, pack: 30 }, shell: { n: 'Shotgun Shells', icon: 'ammo', max: 60, pack: 12 }, slug: { n: 'Rifle Slugs', icon: 'ammo', max: 40, pack: 10 } };

/* ---------------- items ---------------- */
D.ITEMS = {
  medkit:     { n: 'MaxDoc Injector', icon: 'medkit', desc: 'Restores 70 HP over 3 seconds. Use with [H].', use: 1, price: 60, sell: 25, cat: 'CONSUMABLE' },
  grenade:    { n: 'Frag Grenade', icon: 'grenade', desc: 'Throw with [G]. 130 damage in a wide radius.', price: 45, sell: 15, cat: 'CONSUMABLE' },
  armorpatch: { n: 'Armor Patch', icon: 'armor', desc: 'Restores 60 armor instantly.', use: 1, price: 70, sell: 28, cat: 'CONSUMABLE' },
  scrap:      { n: 'Scrap', icon: 'scrap', desc: 'Salvaged metal. Used in crafting.', sell: 4, cat: 'JUNK' },
  comp:       { n: 'Components', icon: 'comp', desc: 'Electronic parts. Used in crafting.', sell: 10, cat: 'JUNK' },
  core:       { n: 'Courier Data Core', icon: 'core', desc: 'Stolen corp data. Kestrel wants it back.', quest: 1, cat: 'QUEST' },
};
D.RECIPES = [
  { id: 'medkit', out: 'medkit', n: 1, cost: { comp: 2, scrap: 1 } },
  { id: 'grenade', out: 'grenade', n: 1, cost: { scrap: 2, comp: 1 } },
  { id: 'armorpatch', out: 'armorpatch', n: 1, cost: { scrap: 3, comp: 1 } },
  { id: 'ammo9', ammo: '9mm', n: 30, cost: { scrap: 2 }, label: '9mm Rounds x30', icon: 'ammo' },
  { id: 'ammosh', ammo: 'shell', n: 12, cost: { scrap: 3 }, label: 'Shotgun Shells x12', icon: 'ammo' },
  { id: 'ammosl', ammo: 'slug', n: 10, cost: { scrap: 2, comp: 1 }, label: 'Rifle Slugs x10', icon: 'ammo' },
];

/* ---------------- cyberware ---------------- */
D.SLOTS = [{ id: 'os', n: 'OPERATING SYSTEM' }, { id: 'optics', n: 'OPTICS' }, { id: 'arms', n: 'ARMS' }, { id: 'legs', n: 'LEGS' }, { id: 'skin', n: 'INTEGUMENTARY' }];
D.CYBER = {
  reflex:   { n: 'Reflex Booster', slot: 'os', icon: 'reflex', price: 900, desc: 'Dashing slows time for 1.4 seconds.' },
  coproc:   { n: 'Neural Co-Processor', slot: 'os', icon: 'ram', price: 700, desc: '+3 RAM and faster RAM recovery.' },
  optics:   { n: 'Targeting Optics', slot: 'optics', icon: 'optics', price: 600, desc: '+10% crit chance. Enemies show on the minimap.' },
  bladearms:{ n: 'Blade Arms', slot: 'arms', icon: 'blade', price: 1100, desc: 'Melee damage x2.2 and a longer reach.' },
  smartlink:{ n: 'Smart Link', slot: 'arms', icon: 'pistol', price: 800, desc: 'Tighter weapon spread. Faster reloads.' },
  servo:    { n: 'Servo Legs', slot: 'legs', icon: 'stamina', price: 850, desc: '+18% move speed. Dash costs less stamina.' },
  shock:    { n: 'Shock Absorbers', slot: 'legs', icon: 'shield', price: 500, desc: 'Immune to hazard floors and blast knockback.' },
  plating:  { n: 'Sub-dermal Plating', slot: 'skin', icon: 'armor', price: 800, desc: '+40 max armor.' },
  painedit: { n: 'Pain Editor', slot: 'skin', icon: 'heart', price: 1000, desc: 'Slowly regenerates HP out of combat.' },
};

/* ---------------- character ---------------- */
D.ATTRS = [
  { id: 'body', n: 'BODY', icon: 'body', desc: '+8 max HP per point. Boosts melee damage.' },
  { id: 'ref', n: 'REFLEXES', icon: 'reflex', desc: '+2% move speed per point. Faster dash recovery.' },
  { id: 'tech', n: 'TECHNICAL', icon: 'tech', desc: '+6 max armor per point. Stronger grenades.' },
  { id: 'cool', n: 'COOL', icon: 'cool', desc: '+1.5% crit chance and +6 stamina per point.' },
  { id: 'int', n: 'INTELLECT', icon: 'intel', desc: '+1 RAM every 2 points. Stronger quickhacks.' },
];
D.PERKS = [
  { id: 'meat', n: 'Meat Shield', attr: 'body', req: 4, icon: 'heart', desc: '+25 max HP.' },
  { id: 'brawler', n: 'Brawler', attr: 'body', req: 5, icon: 'body', desc: '+35% melee damage.' },
  { id: 'quick', n: 'Quick Draw', attr: 'ref', req: 4, icon: 'pistol', desc: '-25% reload time.' },
  { id: 'light', n: 'Light Feet', attr: 'ref', req: 5, icon: 'stamina', desc: '+10% move speed.' },
  { id: 'plated', n: 'Plated', attr: 'tech', req: 4, icon: 'armor', desc: '+25 max armor.' },
  { id: 'demo', n: 'Demolitionist', attr: 'tech', req: 5, icon: 'grenade', desc: 'Grenades +40% damage and radius.' },
  { id: 'deadeye', n: 'Dead Eye', attr: 'cool', req: 4, icon: 'optics', desc: '+10% crit chance.' },
  { id: 'ghost', n: 'Ghost Step', attr: 'cool', req: 5, icon: 'reflex', desc: 'Dash costs 40% less stamina.' },
  { id: 'overclock', n: 'Overclock', attr: 'int', req: 4, icon: 'ram', desc: '+2 max RAM.' },
  { id: 'daemon', n: 'Daemon', attr: 'int', req: 5, icon: 'chip', desc: 'Quickhacks are 40% stronger.' },
];
D.HACKS = [
  { id: 'optics', n: 'Reboot Optics', icon: 'optics', cost: 2, desc: 'Blinds the target for 5s.' },
  { id: 'shortc', n: 'Short Circuit', icon: 'shortc', cost: 3, desc: '60 damage and a brief stun.' },
  { id: 'overheat', n: 'Overheat', icon: 'overheat', cost: 4, desc: 'Burns the target for 6s.' },
];

/* ---------------- enemies ---------------- */
D.ENEMY = {
  thug_melee: { n: 'Gutter Boy',   pal: 'thug_melee', hp: 70,  spd: 118, melee: 1, dmg: 14, reach: 34, xp: 25, sight: 340, r: 11, blade: 1, gang: 1, drop: 1 },
  thug_gun:   { n: 'Rust Rat',     pal: 'thug_gun',   hp: 55,  spd: 92,  gun: { id: 'pistol', dmg: 8, rof: 1.7, burst: 2, speed: 400, spread: .1 }, range: 320, keep: 170, xp: 30, sight: 380, r: 11, gang: 1, drop: 1 },
  corp:       { n: 'Arclight Trooper', pal: 'corp', hp: 105, spd: 98,  gun: { id: 'smg', dmg: 9, rof: 5, burst: 4, speed: 450, spread: .08 }, range: 360, keep: 210, xp: 50, sight: 430, r: 11, armor: .2, drop: 1 },
  heavy:      { n: 'Chrome Heavy', pal: 'heavy', hp: 320, spd: 66,  gun: { id: 'shotgun', dmg: 7, rof: 7, burst: 9, speed: 400, spread: .2 }, range: 300, keep: 150, xp: 140, sight: 400, r: 15, armor: .35, scale: 1.35, drop: 2 },
  drone:      { n: 'Sentry Drone', pal: null, hp: 48, spd: 135, fly: 1, gun: { id: 'pistol', dmg: 6, rof: 2.4, burst: 3, speed: 430, spread: .1 }, range: 380, keep: 170, xp: 35, sight: 440, r: 11 },
  turret:     { n: 'Auto Turret', pal: null, hp: 130, spd: 0, static: 1, gun: { id: 'pistol', dmg: 7, rof: 6, burst: 6, speed: 460, spread: .09 }, range: 400, xp: 50, sight: 420, r: 16, armor: .3 },
  captain:    { n: 'Rust Rat Captain', pal: 'thug_gun', hp: 320, spd: 100, gun: { id: 'smg', dmg: 10, rof: 6, burst: 5, speed: 470, spread: .07 }, range: 340, keep: 190, xp: 220, sight: 440, r: 13, scale: 1.2, gang: 1, elite: 1, drop: 2 },
  boss:       { n: 'Chrome Brute', pal: 'boss', hp: 1700, spd: 96, melee: 1, dmg: 32, reach: 62, xp: 700, sight: 700, r: 26, scale: 2.1, armor: .25, boss: 1, drop: 3 },
};

/* ---------------- missions ---------------- */
D.QUESTS = {
  m1: { title: 'Back on the Street', type: 'MAIN', desc: 'You wake up in a Westbrook back alley with a headache, a sidearm and nothing else. Time to find a fixer.', steps: ['Fight your way out of the alley (%n/3)', 'Reach the Rust Market', 'Talk to the fixer, Kestrel'], reward: { eddies: 150, xp: 120 } },
  m2: { title: 'Down the Rust Line', type: 'MAIN', desc: 'A courier went dark in the Scrapyard District with a corp data core. Kestrel wants it back.', steps: ['Find the courier\'s data core in the southern Scrapyard', 'Return the core to Kestrel'], reward: { eddies: 600, xp: 250 } },
  m3: { title: 'Dead Drop', type: 'MAIN', desc: 'The gang relays leak everything Kestrel\'s client does. Burn them down.', steps: ['Disable the gang relay terminals (%n/3)', 'Report back to Kestrel'], reward: { eddies: 500, xp: 300 } },
  m4: { title: 'Arclight Job', type: 'MAIN', desc: 'Arclight Corp\'s server hall holds the client\'s stolen blueprints. Get in, grab them, get out.', steps: ['Pass through the corp gate', 'Hack the mainframe in the server hall', 'Eliminate the security response team', 'Escape east toward the Chrome Pit'], reward: { eddies: 800, xp: 450 } },
  m5: { title: 'Chrome Brute', type: 'MAIN', desc: 'Arclight\'s enforcer guards the only way out of Sector 07. He does not negotiate.', steps: ['Defeat the Chrome Brute', 'Take the elevator out of Sector 07'], reward: { eddies: 1500, xp: 800 } },
  s1: { title: 'Static in the Wires', type: 'SIDE', desc: 'Juno wants three lost data shards from the Westbrook backstreets. She pays in more than eddies.', steps: ['Find the lost data shards (%n/3)', 'Bring the shards to Juno'], reward: { eddies: 400, xp: 200, weapon: ['smg', 2] } },
  s2: { title: 'Gang Cleanup', type: 'SIDE', desc: 'The Rust Rats are bleeding the district dry. Bounty board pays per head.', steps: ['Eliminate gang members (%n/10)'], reward: { eddies: 350, xp: 200 } },
  s3: { title: 'Lost Cargo', type: 'SIDE', desc: 'Doc Mira\'s medical shipment was seized by Arclight. Get two crates back.', steps: ['Recover the seized medical crates (%n/2)', 'Return the crates to Mira'], reward: { eddies: 450, xp: 250, item: ['armorpatch', 3] } },
  s4: { title: 'Bounty: Rust Rat Captain', type: 'SIDE', desc: 'The Captain runs the southern Scrapyard. Kestrel posted a bounty.', steps: ['Kill the Rust Rat Captain in the Scrapyard', 'Collect your bounty from Kestrel'], reward: { eddies: 700, xp: 350, weapon: ['pistol', 4] } },
};
D.QORDER = ['m1', 'm2', 'm3', 'm4', 'm5', 's1', 's2', 's3', 's4'];

/* ---------------- codex ---------------- */
D.CODEX = {
  sector: { n: 'Sector 07', cat: 'DISTRICT', text: 'Westbrook, Sector 07: six hundred blocks of stacked concrete, cheap neon and expired promises. Arclight Corp owns the north; gangs own everything they can hold.' },
  eddies: { n: 'Eddies', cat: 'ECONOMY', text: 'Eurodollars, "eddies": the only currency anyone trusts. Chips, bullets, rent and silence all cost eddies.' },
  cyberware: { n: 'Cyberware', cat: 'TECH', text: 'Neural and mechanical augments installed by ripperdocs. Five slots, one implant each. Too many and your head stops being yours.' },
  quickhack: { n: 'Quickhacks', cat: 'TECH', text: 'Short-range network exploits uploaded straight into an enemy\'s implants. RAM limits how many you can run at once.' },
  rats: { n: 'Rust Rats', cat: 'FACTIONS', text: 'Scrapyard gang that survives by stripping everything worth a cred. Loud, jumpy, armed with whatever fell off a truck.' },
  arclight: { n: 'Arclight Corp', cat: 'FACTIONS', text: 'A security and cyberware megacorp. The perimeter in the north is theirs, along with the Chrome Pit where they keep their enforcer.' },
  brute: { n: 'The Chrome Brute', cat: 'FACTIONS', text: 'Arclight\'s unregistered enforcer: eighty percent machine, zero percent mercy. Rumour says he charges before he thinks.' },
  shard1: { n: 'Shard: Alley Receipt', cat: 'SHARD', text: 'A scrap of a payment log: "three crates of Chrome Heavy plating, delivered Tuesday, no questions." Someone in the Scrapyard is armed to the teeth.' },
  shard2: { n: 'Shard: Relay Memo', cat: 'SHARD', text: '"Relays at the north yard and the south yard feed the gang\'s eyes. Burn all three and they\'re blind." Signed K.' },
  shard3: { n: 'Shard: Server Hall', cat: 'SHARD', text: '"Server hall door is manual. Alarm triggers on the first hack. Run east after, the Pit corridor is the only exit." Arclight internal note.' },
};
D.MESSAGES = [
  { id: 'msg_start', from: 'Kestrel', text: 'You alive? Good. Find me in the Rust Market. Bring your gun, leave your opinions.' },
  { id: 'msg_mira', from: 'Doc Mira', text: 'Cyberware ain\'t cheap and neither is my time. Visit when your wallet is heavy.' },
  { id: 'msg_juno', from: 'Juno', text: 'Ammo, medkits, hardware. And I\'m paying for data shards, if you find any.' },
];

/* ---------------- map ---------------- */
const T = D.T = { ASPH: 0, SIDE: 1, PLAZA: 2, ROOF: 3, METAL: 5, SCRAP: 6, HAZ: 7, PIT: 8, VOID: 9, CROSSH: 10, CROSSV: 11, LANEH: 12, LANEV: 13 };
const MW = D.MW = 120, MH = D.MH = 90, TS = D.TS = 32;
D.isSolidTile = t => t === T.ROOF || t === T.VOID;

D.ZONES = [
  { id: 'pit',    n: 'CHROME PIT',        sub: 'ARCLIGHT BLACK SITE', x0: 96, y0: 4,  x1: 118, y1: 32, tint: 'rgba(255,40,60,.10)' },
  { id: 'corp',   n: 'CORP PERIMETER',    sub: 'ARCLIGHT SECURITY ZONE', x0: 28, y0: 4, x1: 96, y1: 43, tint: 'rgba(80,160,255,.10)' },
  { id: 'avenue', n: 'ARCLIGHT AVENUE',   sub: 'WESTBROOK // SECTOR 07', x0: 48, y0: 43, x1: 60, y1: 60, tint: 'rgba(100,140,255,.05)' },
  { id: 'gang',   n: 'SCRAPYARD DISTRICT', sub: 'RUST RAT TERRITORY', x0: 66, y0: 46, x1: 116, y1: 89, tint: 'rgba(255,120,40,.08)' },
  { id: 'market', n: 'RUST MARKET',       sub: 'WESTBROOK // SECTOR 07', x0: 33, y0: 44, x1: 67, y1: 87, tint: 'rgba(255,80,160,.06)' },
  { id: 'alley',  n: 'BACK ALLEY',        sub: 'WESTBROOK // SECTOR 07', x0: 2, y0: 52, x1: 34, y1: 89, tint: 'rgba(40,20,80,.16)' },
  { id: 'blvd',   n: 'WESTBROOK BOULEVARD', sub: 'WESTBROOK // SECTOR 07', x0: 0, y0: 58, x1: 120, y1: 72, tint: 'rgba(0,0,0,0)' },
];
D.zoneAt = (px, py) => { const tx = px / TS, ty = py / TS; for (const z of D.ZONES) if (tx >= z.x0 && tx < z.x1 && ty >= z.y0 && ty < z.y1) return z; return D.ZONES[D.ZONES.length - 1]; };

D.buildMap = function () {
  const tiles = new Uint8Array(MW * MH).fill(T.ROOF);
  const fill = (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) tiles[j * MW + i] = t; };
  const rnd = (n) => (i, j) => ((i * 73856093) ^ (j * 19349663)) >>> 0;
  // --- Back Alley
  fill(6, 54, 7, 34, T.ASPH); fill(6, 76, 29, 7, T.ASPH); fill(16, 56, 12, 14, T.PLAZA); fill(13, 62, 3, 3, T.ASPH); fill(8, 54, 3, 4, T.SCRAP);
  // --- Boulevard (sidewalk, asphalt, centre line)
  fill(13, 61, 106, 1, T.SIDE); fill(13, 70, 106, 1, T.SIDE); fill(13, 62, 106, 8, T.ASPH); fill(13, 66, 106, 1, T.LANEH);
  fill(35, 62, 2, 8, T.CROSSV); fill(64, 62, 2, 8, T.CROSSV); fill(49, 61, 9, 1, T.CROSSH);
  // --- Market plaza (south + north)
  fill(34, 71, 33, 16, T.PLAZA); fill(34, 50, 14, 11, T.PLAZA); fill(59, 50, 8, 11, T.PLAZA);
  // --- North avenue to the corp gate
  fill(49, 43, 10, 18, T.SIDE); fill(50, 43, 8, 18, T.ASPH); fill(53, 43, 2, 18, T.LANEV);
  // --- Scrapyards (north + south of boulevard)
  fill(68, 48, 42, 13, T.SCRAP); fill(68, 71, 46, 17, T.SCRAP);
  // hazard puddles
  fill(77, 51, 3, 4, T.HAZ); fill(93, 76, 4, 4, T.HAZ); fill(100, 84, 3, 2, T.HAZ);
  // --- Corp compound (metal) + gate row + inner pillars + server hall
  fill(30, 6, 60, 37, T.METAL); fill(50, 42, 8, 1, T.METAL);
  fill(36, 13, 7, 6, T.ROOF); fill(36, 29, 7, 6, T.ROOF); fill(60, 13, 7, 6, T.ROOF); fill(60, 29, 7, 6, T.ROOF); fill(46, 21, 3, 8, T.ROOF); fill(70, 24, 5, 10, T.ROOF);
  fill(68, 7, 20, 13, T.ROOF); fill(70, 9, 16, 8, T.METAL); fill(76, 17, 4, 3, T.METAL);
  // --- Pit corridor + arena
  fill(90, 15, 8, 5, T.METAL); fill(98, 6, 18, 24, T.PIT); fill(103, 14, 8, 8, T.PIT);
  fill(102, 10, 2, 2, T.ROOF); fill(110, 10, 2, 2, T.ROOF); fill(102, 24, 2, 2, T.ROOF); fill(110, 24, 2, 2, T.ROOF);
  // world border stays ROOF.
  return tiles;
};

/* decor/entities (tile coords, centres) */
D.LEVEL = {
  spawn: [9, 85],
  checkpoints: [{ id: 'cp0', x: 9, y: 84 }, { id: 'cp1', x: 40, y: 73 }, { id: 'cp2', x: 84, y: 64 }, { id: 'cp3', x: 53, y: 45 }, { id: 'cp4', x: 53, y: 37 }, { id: 'cp5', x: 94, y: 17 }],
  npcs: [
    { id: 'kestrel', pal: 'fixer', n: 'Kestrel', role: 'FIXER', x: 42, y: 78, face: 0 },
    { id: 'juno', pal: 'vendor', n: 'Juno', role: 'VENDOR', x: 52, y: 75, face: 3.14 },
    { id: 'mira', pal: 'ripper', n: 'Doc Mira', role: 'RIPPERDOC', x: 61, y: 79, face: 3.14 },
    { id: 'civ_a', pal: 'civ1', n: 'Local', role: 'CIVILIAN', x: 46, y: 83, wander: 1 },
    { id: 'civ_b', pal: 'civ2', n: 'Local', role: 'CIVILIAN', x: 56, y: 53, wander: 1 },
    { id: 'civ_c', pal: 'civ1', n: 'Local', role: 'CIVILIAN', x: 38, y: 56, wander: 1 },
  ],
  enemies: [
    ['thug_melee', 9, 70, 1], ['thug_melee', 9, 62, 1], ['thug_gun', 22, 62, 1], ['thug_melee', 9, 57, 1],
    ['thug_gun', 22, 79, 1], ['thug_gun', 30, 79, 1],
    ['thug_gun', 80, 54, 2], ['thug_melee', 74, 56, 2], ['thug_gun', 90, 52, 2], ['thug_melee', 96, 57, 2], ['thug_gun', 104, 54, 3], ['thug_gun', 100, 50, 3], ['drone', 88, 55, 3],
    ['thug_melee', 72, 76, 2], ['thug_gun', 80, 82, 2], ['thug_melee', 90, 74, 3], ['thug_gun', 96, 86, 3], ['thug_gun', 108, 78, 3], ['captain', 105, 83, 4],
    ['corp', 53, 38, 4], ['corp', 45, 34, 4], ['corp', 62, 36, 4], ['corp', 40, 24, 5], ['corp', 55, 24, 5], ['turret', 44, 10, 5], ['turret', 62, 10, 5], ['turret', 56, 28, 5], ['drone', 50, 16, 5], ['drone', 80, 30, 5], ['heavy', 64, 22, 5], ['corp', 40, 9, 5], ['corp', 84, 28, 5],
    ['boss', 107, 17, 6],
  ],
  containers: [
    { id: 'c1', t: 'locker', x: 7, y: 55, loot: 'common' }, { id: 'c2', t: 'medcrate', x: 26, y: 57, loot: 'med' }, { id: 'c3', t: 'locker', x: 31, y: 80, loot: 'ammo' },
    { id: 'c4', t: 'locker', x: 70, y: 49, loot: 'common' }, { id: 'c5', t: 'medcrate', x: 106, y: 58, loot: 'med' }, { id: 'c6', t: 'locker', x: 70, y: 86, loot: 'ammo' },
    { id: 'c7', t: 'locker', x: 111, y: 78, loot: 'rare' }, { id: 'c8', t: 'locker', x: 32, y: 8, loot: 'rare' }, { id: 'c9', t: 'locker', x: 87, y: 38, loot: 'ammo' },
    { id: 'core', t: 'locker', x: 111, y: 86, loot: 'core' },
    { id: 'cargo1', t: 'medcrate', x: 33, y: 37, loot: 'cargo' }, { id: 'cargo2', t: 'medcrate', x: 87, y: 33, loot: 'cargo' },
    { id: 'c10', t: 'locker', x: 53, y: 8, loot: 'rare' },
  ],
  shards: [{ id: 'shard1', x: 27, y: 58 }, { id: 'shard2', x: 71, y: 50 }, { id: 'shard3', x: 96, y: 86 }],
  relays: [{ id: 'r1', x: 84, y: 49 }, { id: 'r2', x: 103, y: 58 }, { id: 'r3', x: 80, y: 86 }],
  mainframe: { x: 77.5, y: 10.5 }, elevator: { x: 113.5, y: 17.5 }, gate: { x: 54, y: 42.5 },
  /* breakable props: t, x, y */
  breakables: [
    ['crate', 8, 74], ['crate', 9.4, 74.2], ['crate', 12, 58], ['crate', 24, 66], ['crate', 20, 58], ['barrel', 10, 66], ['barrel_boom', 20, 66], ['crate', 33, 79], ['crate', 28, 82],
    ['barrel', 39, 52], ['crate', 44, 54], ['crate', 62, 53], ['barrel_boom', 64, 57], ['crate', 72, 63], ['crate', 90, 63],
    ['crate', 74, 52], ['crate', 79, 58], ['barrel_boom', 92, 50], ['crate', 98, 54], ['barrel', 108, 51], ['barrel_boom', 85, 60],
    ['crate', 70, 78], ['barrel_boom', 78, 74], ['crate', 86, 77], ['crate', 99, 76], ['barrel', 92, 84], ['barrel_boom', 104, 76], ['crate', 110, 82],
    ['crate_metal', 40, 20], ['crate_metal', 40, 40 - 0.5], ['crate_metal', 52, 36], ['crate_metal', 58, 36], ['barrel_boom', 55, 14], ['crate_metal', 66, 24], ['crate_metal', 82, 26], ['barrel_boom', 74, 36], ['crate_metal', 86, 22],
    ['crate_metal', 100, 8], ['crate_metal', 113, 8], ['barrel_boom', 100, 27], ['barrel', 113, 27],
  ],
  /* solid static decor: t, x, y, rotationDeg */
  decor: [
    ['car_red', 20, 62.9, 0], ['car_blue', 30.5, 69.1, 0], ['car_yellow', 44, 62.9, 0], ['car_white', 73, 62.9, 0], ['car_red', 86, 69.1, 0], ['car_blue', 99, 62.9, 0], ['car_yellow', 110, 69.1, 0],
    ['car_blue', 51.2, 50, 90], ['car_red', 56.6, 56, 90],
    ['dumpster', 8, 80, 0], ['dumpster', 10.5, 63, 90], ['dumpster', 28, 79.6, 0], ['dumpster', 18, 68, 0],
    ['stall', 40, 75, 0], ['stall', 46, 82, 0], ['stall', 56, 74, 0], ['stall', 62, 83, 0], ['stall', 38, 82, 0], ['stall', 49, 56, 0], ['stall', 63, 55, 0],
    ['planter', 44, 71.8, 0], ['planter', 58, 71.8, 0], ['planter', 36, 86, 0], ['planter', 65, 86, 0],
    ['container_red', 76, 53, 0], ['container_blue', 86, 57, 0], ['container_green', 95.5, 53, 90], ['container_rust', 104, 56, 0], ['container_blue', 79, 59, 0], ['container_green', 98, 49, 0],
    ['container_red', 74.5, 76, 0], ['container_blue', 85, 79, 90], ['container_green', 94, 73.5, 0], ['container_rust', 101, 80, 0], ['container_red', 78, 85, 0], ['container_rust', 108, 74, 90], ['container_blue', 90, 82, 0],
    ['mainframe', 77.5, 10.5, 0], ['crate_metal', 44, 36, 0], ['pipes', 54, 7.4, 0],
    ['elevator', 113.5, 17.5, 0],
  ],
  lamps: [[16, 61.5], [26, 61.5], [40, 61.5], [60, 61.5], [72, 61.5], [84, 61.5], [96, 61.5], [108, 61.5], [20, 70.5], [34, 70.5], [48, 70.5], [62, 70.5], [76, 70.5], [90, 70.5], [104, 70.5], [49.5, 48], [58.5, 48], [49.5, 56], [58.5, 56], [9, 60], [9, 72], [9, 84], [40, 77], [52, 72], [60, 77], [36, 72], [64, 72], [40, 10], [70, 22], [86, 36], [100, 12], [100, 26], [112, 12], [112, 26], [90, 17], [53, 40]],
  decals: [['oil', 10, 75], ['oil', 12, 79], ['graffiti', 12.4, 68], ['blood', 9, 61], ['litter', 11, 85], ['manhole', 24, 65], ['oil', 36, 66], ['manhole', 70, 65], ['scorch', 100, 66], ['blood', 82, 55], ['oil', 96, 80], ['litter', 80, 78], ['scorch', 62, 27], ['manhole', 52, 52], ['litter', 40, 79], ['graffiti', 66, 52]],
  loot: {
    common: [['eddies', 20, 50, 1], ['scrap', 1, 3, .8], ['comp', 1, 2, .5], ['ammo', 1, 1, .6]],
    med: [['medkit', 1, 2, 1], ['armorpatch', 1, 1, .5], ['eddies', 15, 40, .6]],
    ammo: [['ammo', 1, 2, 1], ['scrap', 1, 2, .6], ['eddies', 20, 60, .5], ['grenade', 1, 1, .4]],
    rare: [['eddies', 80, 160, 1], ['comp', 2, 4, 1], ['weapon', 0, 0, .35], ['medkit', 1, 1, .6]],
    cargo: [], core: [],
  },
};

D.xpNeeded = lvl => 120 + lvl * 90;
})();
