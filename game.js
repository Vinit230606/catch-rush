// Catch Rush – simple canvas game
//
// HOW TO CUSTOMISE: change CONFIG only. Swap images in /assets with the same
// file names, or change the paths in CONFIG.ASSETS. Every colour, font and
// gameplay number lives in CONFIG below, grouped into labelled sections.

const CONFIG = {
  // ----- SCREEN (fixed portrait world; rarely changed) -----
  CANVAS_WIDTH: 450,          // logical world width
  CANVAS_HEIGHT: 800,         // logical world height
  MAX_DELTA: 0.05,            // cap on frame delta (s) to avoid big jumps

  // ----- FEATURES (switch enhancements on/off; false = original behaviour) -----
  FEATURES: {
    fastLoad: true,      // parallel loading + image fallbacks + branded loader
    warmStart: true,     // easy opening: first star near basket, no early bomb
    coachMark: true,     // first-run "Drag to move" hint
    tapAnywhereStart: true, // tapping anywhere on the menu starts the game (Classic)
    neonTheme: true,     // moonlight (Moonline) look with restrained glow
    duel: true,          // enable Duel mode (local 2-player + phone split-screen)
    profiles: true,      // register players, keep history + leaderboard on device
    abilities: true,     // secret tactical abilities in duel (Z / X + phone buttons)
    chomper: true,       // draw an original chomper character instead of the basket
    countdown: true,     // 3-2-1 ready phase before a duel
    reducedMotion: false, // true = disable the animated live background
  },

  // ----- BRAND (theme the whole game from here) -----
  // Moonline palette: midnight navy base, moonlight blue, warm gold, coral.
  BRAND: {
    title: "Catch Rush",                              // shown on the logo badge
    subtitle: "Moonline Edition",                     // wordmark second line
    tagline: "Catch the stars. Dodge the bombs.",     // start-screen subtitle
    hook: "45 seconds. Two rivals. One winner.",      // one-line hook on the menu
    font: "sans-serif",                               // font family for ALL text
    main: "#ddeeff",                                  // ice-white main text
    accent: "#8bdfff",                                // moonlight-blue accent
  },

  // ----- THEME (Moonline palette; used when FEATURES.neonTheme is on) -----
  THEME: {
    bgTop: "#050a13",        // midnight navy (top of backdrop gradient)
    bgBottom: "#0a1626",     // slightly lifted navy (bottom of gradient)
    moonlight: "#8bdfff",    // moonlight blue (primary player, highlights)
    cyan: "#8bdfff",         // alias kept for existing references
    gold: "#f5cd6b",         // warm gold (stars, score feedback)
    coral: "#f07f8b",        // coral red (bombs, danger)
    glow: "#8bdfff",         // glow colour for text/sprites
    glowBlur: 14,            // shadowBlur used for the restrained glow
    p1: "#8bdfff",           // duel player 1 colour (moonlight blue)
    p2: "#d6a486",           // duel player 2 colour (muted copper)
    grid: "rgba(139,223,255,0.06)", // faint grid lines on the backdrop
  },

  // ----- DUEL (local 2-player) -----
  DUEL: {
    roundSeconds: 45,        // duel round length (s)
    lives: 3,                // lives each (matches PRD: 3 per player)
    winBy: "score",          // highest score at time-up wins; equal = draw
    dividerColor: "#8bdfff", // divider line between the two halves
    countdownSeconds: 3,     // 3-2-1 ready phase before the match
    // Curated chomper colour palette players can pick in setup
    colours: ["#8bdfff", "#d6a486", "#f5cd6b", "#9cf3a0", "#f07f8b", "#b79cff"],
    // Item/chomper sizes are scaled down in duel so the two halves don't clash
    itemScale: 0.78,         // multiply item widths by this in duel
    chomperScale: 0.82,      // multiply chomper width by this in duel
    spawnGapMul: 1.15,       // slightly slower spawns in duel (less clutter)
    // Layout: "auto" picks side-by-side on landscape (laptop) and top/bottom
    // on portrait (phone). Force with "sideBySide" or "topBottom".
    layout: "auto",
  },

  // ----- ABILITIES (secret tactical layer; 2 charges each, PRD section 3) -----
  ABILITIES: {
    charges: 2,              // charges per player per match
    lockoutSeconds: 6,       // min gap between a player's activations
    incomingSeconds: 0.5,    // universal "incoming" cue before the effect lands
    pool: [
      { id: "gravity", name: "Gravity Surge", duration: 2.5, speedMul: 1.2,
        desc: "Rival's items fall 20% faster." },
      { id: "flip",    name: "Control Flip",  duration: 1.25,
        desc: "Rival's left/right is reversed." },
      { id: "sidewind",name: "Sidewind",      duration: 3.0, driftFrac: 0.08,
        desc: "Rival's items drift sideways." },
      { id: "shrink",  name: "Chomper Shrink",duration: 3.0, widthMul: 0.85,
        desc: "Rival's catcher shrinks 15%." },
    ],
  },

  // ----- WARM-UP (zero-friction first seconds; F2) -----
  WARMUP: {
    noBombSeconds: 3,    // no bombs spawn in the first N seconds of a round
    firstStarSeconds: 0.4, // drop the first star this soon, near the basket
  },

  // ----- PLAYER (the basket) -----
  PLAYER: {
    img: "assets/basket.png",   // basket sprite
    width: 110,                 // drawn width (px); height keeps aspect ratio
    speed: 420,                 // keyboard move speed (px/s)
  },

  // ----- ITEMS (add a line to add a new catchable item) -----
  // type: "good" (points), "bad" (loses a life), "power" (effect)
  items: [
    { name: "star", img: "assets/star.png", width: 56, points: 10, type: "good", weight: 70 },
    { name: "bomb", img: "assets/bomb.png", width: 60, points: 0,  type: "bad",  weight: 30 },
    { name: "lightning", img: "assets/lightning.png", width: 58, type: "power", effect: "double", duration: 5, weight: 5 },
    { name: "snowflake", img: "assets/snowflake.png", width: 58, type: "power", effect: "slow",   duration: 4, weight: 5 },
  ],

  // ----- RULES (round pacing and difficulty) -----
  RULES: {
    lives: 3,                  // starting lives
    roundSeconds: 45,          // round length (s)
    spawnIntervalStart: 0.8,   // spawn gap at round start (s)
    spawnIntervalEnd: 0.4,     // spawn gap at round end (s)
    fallSpeedMin: 180,         // min fall speed (px/s)
    fallSpeedMax: 260,         // max fall speed (px/s)
    fallSpeedRampMax: 1.4,     // fall speed scales up to this by round end (+40%)
  },

  // ----- POWER-UPS (effect tuning; durations live on each item) -----
  POWERUPS: {
    slowFactor: 0.5,           // "slow" multiplies fall speed by this
    doubleFactor: 2,           // "double" multiplies points by this
    iconWidth: 28,             // active-effect icon size in HUD (px)
  },

  // ----- ASSETS (every image path in one place) -----
  ASSETS: {
    background:  "assets/background.png",
    heart:       "assets/heart.png",
    heartEmpty:  "assets/heart-empty.png",
    clock:       "assets/clock.png",
    sparkle:     "assets/sparkle-burst.png",
    explosion:   "assets/explosion.png",
    logo:        "assets/logo-badge.png",
    playButton:  "assets/play-button.png",
    restartButton: "assets/restart-button.png",
    trophy:      "assets/trophy.png",
  },
};

/*** Small deterministic PRNG (mulberry32). Seeded so a duel produces the
 * identical item schedule for both lanes — fairness per the PRD. ***/
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*** Live moonlit background. Layered, continuously animated, drawn behind
 * every screen. Respects CONFIG.FEATURES.reducedMotion (freezes motion but
 * still paints a rich static scene). Kept separate from gameplay/collision. ***/
class LiveBackground {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.t = 0;
    const rng = makeRng(1337);
    // Starfield: three depth layers, each drifting at a different speed
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      const layer = i < 50 ? 0 : i < 75 ? 1 : 2;
      this.stars.push({
        x: rng() * w, y: rng() * h,
        r: layer === 0 ? 0.7 + rng() * 0.8 : layer === 1 ? 1.0 + rng() * 1.0 : 1.4 + rng() * 1.4,
        layer,
        tw: rng() * Math.PI * 2,          // twinkle phase
        twSpeed: 0.6 + rng() * 1.4,
      });
    }
    // Nebula bands: soft horizontal haze blobs
    this.bands = [];
    for (let i = 0; i < 4; i++) {
      this.bands.push({
        y: h * (0.25 + 0.16 * i) + rng() * 30,
        x: rng() * w,
        w: 220 + rng() * 180,
        h: 90 + rng() * 70,
        speed: 6 + rng() * 10,
        hue: rng(),
      });
    }
    // Parallax mountain silhouette layers (back to front)
    this.mountains = [
      this._makeRidge(rng, h * 0.80, 70, 6),
      this._makeRidge(rng, h * 0.86, 100, 7),
      this._makeRidge(rng, h * 0.92, 140, 8),
    ];
    this.moon = { x: w * 0.72, y: h * 0.18, r: 54 };
  }

  _makeRidge(rng, baseY, amp, points) {
    const pts = [];
    for (let i = 0; i <= points; i++) pts.push(baseY - rng() * amp);
    return { baseY, amp, pts };
  }

  update(dt) {
    if (CONFIG.FEATURES.reducedMotion) return;
    this.t += dt;
    for (const s of this.stars) s.tw += s.twSpeed * dt;
    for (const b of this.bands) { b.x += b.speed * dt; if (b.x - b.w > this.w) b.x = -b.w; }
  }

  /*** Paint the full scene. intensity 0..1 lifts brightness (final seconds). ***/
  draw(ctx, w, h, theme, intensity = 0) {
    // Vertical sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, theme.bgTop);
    g.addColorStop(0.6, theme.bgBottom);
    g.addColorStop(1, '#0d1f38');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // Nebula bands (very low opacity blue/violet haze)
    for (const b of this.bands) {
      const bx = (b.x % (w + b.w));
      const grad = ctx.createRadialGradient(bx, b.y, 0, bx, b.y, b.w);
      const col = b.hue > 0.5 ? '139,223,255' : '150,130,255';
      grad.addColorStop(0, `rgba(${col},0.10)`);
      grad.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(bx, b.y, b.w, b.h, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Starfield with twinkle + slow drift
    for (const s of this.stars) {
      const drift = this.t * (4 + s.layer * 6);
      const sx = (s.x + drift) % w;
      const tw = 0.5 + 0.5 * Math.sin(s.tw);
      ctx.globalAlpha = (0.3 + 0.7 * tw) * (s.layer === 0 ? 0.6 : s.layer === 1 ? 0.85 : 1);
      ctx.fillStyle = '#ddeeff';
      ctx.beginPath(); ctx.arc(sx, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon with faint rim light + slow parallax drift
    const mx = this.moon.x + Math.sin(this.t * 0.05) * 8;
    const my = this.moon.y + Math.cos(this.t * 0.04) * 4;
    const mg = ctx.createRadialGradient(mx - 10, my - 10, 6, mx, my, this.moon.r);
    mg.addColorStop(0, '#f2f7ff');
    mg.addColorStop(0.7, '#a6c6ef');
    mg.addColorStop(1, 'rgba(120,150,200,0.1)');
    ctx.save();
    ctx.shadowColor = 'rgba(139,223,255,0.5)'; ctx.shadowBlur = 40;
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, this.moon.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // a couple of soft craters
    ctx.fillStyle = 'rgba(120,150,200,0.25)';
    ctx.beginPath(); ctx.arc(mx - 14, my + 6, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 16, my - 12, 6, 0, Math.PI * 2); ctx.fill();

    // Parallax mountain silhouettes (back lighter, front darker)
    const shades = ['#0a1830', '#081322', '#050c16'];
    this.mountains.forEach((m, li) => {
      const off = Math.sin(this.t * (0.03 + li * 0.015)) * (6 - li * 2);
      ctx.fillStyle = shades[li];
      ctx.beginPath();
      ctx.moveTo(0, h);
      const n = m.pts.length - 1;
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * w + off;
        ctx.lineTo(x, m.pts[i]);
      }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    });

    // Horizon glow (brightens with intensity in the final seconds)
    const hy = h * 0.9;
    const hg = ctx.createLinearGradient(0, hy - 120, 0, h);
    hg.addColorStop(0, 'rgba(139,223,255,0)');
    hg.addColorStop(1, `rgba(139,223,255,${0.08 + 0.12 * intensity})`);
    ctx.fillStyle = hg; ctx.fillRect(0, hy - 120, w, h - (hy - 120));
  }
}

/*** Device storage for profiles, score history and the leaderboard.
 * Everything is wrapped in try/catch so the game still works if storage is
 * blocked (e.g. some file:// contexts). Keys are namespaced; the legacy
 * `catchRushBest` key is left untouched so existing bests survive. ***/
const Storage = {
  KEY: 'catchRushData_v1',

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return { profiles: [], history: [], leaderboard: [] };
      const d = JSON.parse(raw);
      return {
        profiles: Array.isArray(d.profiles) ? d.profiles : [],
        history: Array.isArray(d.history) ? d.history : [],
        leaderboard: Array.isArray(d.leaderboard) ? d.leaderboard : [],
      };
    } catch (e) {
      return { profiles: [], history: [], leaderboard: [] };
    }
  },
  _write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {}
  },

  getProfiles() { return this._read().profiles; },

  /*** Register a player by name (deduped, case-insensitive). Returns the name. ***/
  addProfile(name) {
    name = (name || '').trim().slice(0, 14);
    if (!name) return null;
    const data = this._read();
    if (!data.profiles.some(p => p.toLowerCase() === name.toLowerCase())) {
      data.profiles.unshift(name);
      data.profiles = data.profiles.slice(0, 12); // keep it tidy
      this._write(data);
    }
    return name;
  },

  /*** Record one finished game for a player. mode: "classic" | "duel". ***/
  recordGame(name, score, mode, result) {
    if (!name) return;
    const data = this._read();
    data.history.unshift({
      name, score, mode,
      result: result || '',                 // e.g. "Win" / "Loss" in duel
      at: Date.now(),
    });
    data.history = data.history.slice(0, 100); // cap history length

    // Leaderboard: best score per player
    const existing = data.leaderboard.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existing) { if (score > existing.score) existing.score = score; }
    else data.leaderboard.push({ name, score });
    data.leaderboard.sort((a, b) => b.score - a.score);
    data.leaderboard = data.leaderboard.slice(0, 10); // top 10
    this._write(data);
  },

  getLeaderboard() { return this._read().leaderboard; },

  /*** Recent games for one player (most recent first). ***/
  getHistory(name, limit = 5) {
    const h = this._read().history;
    return (name ? h.filter(e => e.name.toLowerCase() === name.toLowerCase()) : h).slice(0, limit);
  },
};

/*** Helper: load an image, return a Promise that always resolves.
 * On failure it logs a clear error and returns a small canvas "fallback"
 * sprite (a soft rounded square) so one bad file never blocks the game. ***/
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`Failed to load image: ${src} — using a fallback shape.`);
      resolve(makeFallbackSprite());
    };
    img.src = src;
  });
}

/*** Build a generic placeholder sprite on a small canvas (no external art). ***/
function makeFallbackSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#c8c8c8';
  const r = 12;
  g.beginPath();
  g.moveTo(r, 0);
  g.arcTo(size, 0, size, size, r);
  g.arcTo(size, size, 0, size, r);
  g.arcTo(0, size, 0, 0, r);
  g.arcTo(0, 0, size, 0, r);
  g.closePath();
  g.fill();
  g.strokeStyle = '#888';
  g.lineWidth = 4;
  g.stroke();
  // canvas elements expose naturalWidth/Height via width/height; add shims
  if (c.naturalWidth === undefined) {
    Object.defineProperty(c, 'naturalWidth', { get() { return this.width; } });
    Object.defineProperty(c, 'naturalHeight', { get() { return this.height; } });
  }
  return c;
}

/*** Main game object ***/
class Game {
  constructor() {
    // Canvas elements
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Adjust physical pixel size for high‑DPI displays
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Game state
    this.assets = {};
    this.loading = true;
    this.loadProgress = 0;             // 0..1 for the branded loader bar
    this.hasPlayed = false;            // false until the first round starts (coach mark)
    this.coachMarkDone = false;        // hide the hint after the first catch
    this.basketX = CONFIG.CANVAS_WIDTH / 2; // logical center
    this.basketTargetX = this.basketX; // for pointer movement
    this.pointerActive = false;        // true only while pointer is held
    this.keysDown = {};

    // Gameplay state
    this.score = 0;
    this.fallers = [];        // active falling items
    this.spawnTimer = 0;      // counts up toward the (ramping) spawn interval
    this.redFlash = 0;        // seconds left of red flash on bad catch
    this.totalWeight = CONFIG.items.reduce((s, it) => s + it.weight, 0);

    // Round / screen state
    // states: "start" | "menu" | "register" | "playing" | "paused" | "over"
    //         | "duelPlaying" | "duelOver" | "leaderboard"
    this.state = 'start';
    this.lives = CONFIG.RULES.lives;
    this.timeLeft = CONFIG.RULES.roundSeconds;
    this.overReason = '';
    this.shakeTime = 0;               // seconds left of screen shake
    this.best = this.loadBest();
    this.newBest = false;             // did this round beat the best?
    this.elapsed = 0;                 // total seconds, for animations/pulsing

    // Mode + profiles
    this.mode = 'classic';            // "classic" | "duel"
    this.currentPlayer = '';          // active Classic player name (optional)
    this.nameBuffer = '';             // text being typed on the register screen
    this.players = [];                // duel players (two basket objects)
    this.duelWinner = null;           // index 0/1, or -1 for a tie
    this.returnTo = 'start';          // where screens like register/leaderboard return
    this.duelNames = ['', ''];        // names typed on the duel setup screen
    this.duelNameActive = 0;          // which name field is focused (0 or 1)
    this.duelColours = [CONFIG.THEME.p1, CONFIG.THEME.p2]; // chosen chomper colours

    // Effects
    this.effects = {};                // active power-ups: effect -> { timeLeft, duration, icon }
    this.bursts = [];                 // sparkle/explosion visual effects
    this.floaters = [];               // floating "+10" score texts
    this.basketSquash = 0;            // seconds left of squash animation
    this.audioCtx = null;             // created on first user gesture
    this.muted = false;

    // Button hitboxes (set during render, read by pointer handler)
    this.playRect = null;
    this.restartRect = null;
    this.menuRect = null;
    this.speakerRect = null;

    // Decorative fallers for the start screen
    this.decor = [];

    // Live animated background (drawn behind every screen)
    this.bg = new LiveBackground(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Bind input handlers
    this.bindKeyboard();
    this.bindPointer();

    // Losing tab/window focus pauses an active round
    const pauseOnBlur = () => { if (this.state === 'playing') this.state = 'paused'; };
    window.addEventListener('blur', pauseOnBlur);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pauseOnBlur(); });

    // Start loading assets then start loop
    this.loadAssets().then(() => {
      this.loading = false;
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.gameLoop.bind(this));
    });
  }

  /*** Resize canvas to keep 450:800 ratio while filling window ***/
  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentNode;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Compute size that fits while preserving aspect ratio
    let logicalW = CONFIG.CANVAS_WIDTH;
    let logicalH = CONFIG.CANVAS_HEIGHT;
    let scale = Math.min(vw / logicalW, vh / logicalH);
    const displayW = logicalW * scale;
    const displayH = logicalH * scale;
    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
    // Set actual pixel dimensions
    this.canvas.width = Math.round(displayW * dpr);
    this.canvas.height = Math.round(displayH * dpr);
    // Map logical 450x800 coordinates onto the physical pixel buffer.
    // setTransform resets first so repeated resizes don't compound the scale.
    const pixelScaleX = this.canvas.width / CONFIG.CANVAS_WIDTH;
    const pixelScaleY = this.canvas.height / CONFIG.CANVAS_HEIGHT;
    this.ctx.setTransform(pixelScaleX, 0, 0, pixelScaleY, 0, 0);
  }

  /*** Asset loading. With FEATURES.fastLoad all images load in parallel and
   * track progress; otherwise they load sequentially (original behaviour).
   * Either way loadImage never rejects, so a bad file can't block the game. ***/
  async loadAssets() {
    const A = CONFIG.ASSETS;
    this.assets.items = {};

    // Build one flat list of {assign(img)} jobs so we can run them together.
    const jobs = [];
    jobs.push({ src: A.background, set: img => this.assets.background = img });
    jobs.push({ src: CONFIG.PLAYER.img, set: img => this.assets.basket = img });
    for (const it of CONFIG.items) {
      jobs.push({ src: it.img, set: img => this.assets.items[it.name] = img });
    }
    jobs.push({ src: A.heart, set: img => this.assets.heart = img });
    jobs.push({ src: A.heartEmpty, set: img => this.assets.heartEmpty = img });
    jobs.push({ src: A.clock, set: img => this.assets.clock = img });
    jobs.push({ src: A.sparkle, set: img => this.assets.sparkle = img });
    jobs.push({ src: A.explosion, set: img => this.assets.explosion = img });
    jobs.push({ src: A.logo, set: img => this.assets.logo = img });
    jobs.push({ src: A.playButton, set: img => this.assets.playButton = img });
    jobs.push({ src: A.restartButton, set: img => this.assets.restartButton = img });
    jobs.push({ src: A.trophy, set: img => this.assets.trophy = img });

    let done = 0;
    const total = jobs.length;
    const run = async (job) => {
      const img = await loadImage(job.src);
      job.set(img);
      done += 1;
      this.loadProgress = done / total;
    };

    if (CONFIG.FEATURES.fastLoad) {
      await Promise.all(jobs.map(run));   // parallel
    } else {
      for (const job of jobs) await run(job); // sequential (original)
    }

    // Seed some decorative fallers for the start screen
    for (let i = 0; i < 6; i++) this.spawnDecor(true);
  }

  /*** Decorative faller for the start screen (stars/bombs, no scoring) ***/
  spawnDecor(randomY = false) {
    const pool = CONFIG.items.filter(it => it.type === 'good' || it.type === 'bad');
    const def = pool[Math.floor(Math.random() * pool.length)];
    const img = this.assets.items[def.name];
    const w = def.width;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    this.decor.push({
      img, w, h,
      x: Math.random() * (CONFIG.CANVAS_WIDTH - w) + w / 2,
      y: randomY ? Math.random() * CONFIG.CANVAS_HEIGHT : -h,
      speed: 60 + Math.random() * 60,
      spin: Math.random() * Math.PI * 2,
    });
  }

  /*** Audio: create context lazily on first gesture, synth all SFX ***/
  ensureAudio() {
    if (!this.audioCtx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AC();
      } catch (e) { this.audioCtx = null; }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  // Play a sequence of short tones. notes: [{freq, start, dur, type}]
  playTones(notes, gainPeak = 0.2) {
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type || 'sine';
      osc.frequency.value = n.freq;
      const t0 = now + n.start;
      const t1 = t0 + n.dur;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    }
  }
  sfxCatch()   { this.playTones([{ freq: 880, start: 0, dur: 0.12, type: 'triangle' }]); }
  sfxBomb()    { this.playTones([{ freq: 110, start: 0, dur: 0.22, type: 'sawtooth' }], 0.3); }
  sfxPower()   { this.playTones([{ freq: 660, start: 0, dur: 0.12 }, { freq: 990, start: 0.12, dur: 0.16 }]); }
  sfxGameOver(){ this.playTones([{ freq: 660, start: 0, dur: 0.18 }, { freq: 520, start: 0.18, dur: 0.18 }, { freq: 392, start: 0.36, dur: 0.26 }]); }

  /*** Best score persistence (storage may be blocked on file://) ***/
  loadBest() {
    try {
      return parseInt(localStorage.getItem('catchRushBest') || '0', 10) || 0;
    } catch (e) { return 0; }
  }
  saveBest() {
    try { localStorage.setItem('catchRushBest', String(this.best)); } catch (e) {}
  }

  /*** End the round ***/
  gameOver(reason) {
    this.state = 'over';
    this.overReason = reason;
    this.newBest = this.score > this.best;
    if (this.newBest) { this.best = this.score; this.saveBest(); }
    // Record classic history/leaderboard for the current player (if registered)
    if (CONFIG.FEATURES.profiles && this.currentPlayer) {
      Storage.recordGame(this.currentPlayer, this.score, 'classic', this.newBest ? 'Best' : '');
    }
    this.sfxGameOver();
  }

  /*** Reset all round state (used by both start and restart) ***/
  resetRound() {
    this.score = 0;
    this.lives = CONFIG.RULES.lives;
    this.timeLeft = CONFIG.RULES.roundSeconds;
    this.fallers = [];
    this.spawnTimer = 0;
    this.redFlash = 0;
    this.shakeTime = 0;
    this.overReason = '';
    this.newBest = false;
    this.basketX = CONFIG.CANVAS_WIDTH / 2;
    this.basketTargetX = this.basketX;
    this.effects = {};
    this.bursts = [];
    this.floaters = [];
    this.basketSquash = 0;
    this.roundElapsed = 0;            // seconds since this round began
    this.warmFirstStarDone = false;   // warm-start first star dropped yet?
  }

  /*** Start a fresh round from the menu or restart; no page reload ***/
  startGame() {
    this.resetRound();
    this.state = 'playing';
    this.hasPlayed = true;
    // Coach mark shows only on the very first round
    this.coachMarkDone = !CONFIG.FEATURES.coachMark;
  }
  restart() { this.startGame(); }

  /*** Back to the start screen ***/
  toMenu() {
    this.resetRound();
    this.state = CONFIG.FEATURES.duel ? 'menu' : 'start';
  }

  /*** Open the mode-select menu (or go straight to classic if duel is off) ***/
  goMenu() {
    if (!CONFIG.FEATURES.duel) { this.startGame(); return; }
    this.state = 'menu';
  }

  /*** Start a classic single-player round ***/
  startClassic() {
    this.mode = 'classic';
    // Use the most recently registered player (if any) for history/leaderboard
    const profs = Storage.getProfiles();
    this.currentPlayer = profs[0] || '';
    this.startGame();
  }

  /*** Resolve the active duel layout. "auto" => side-by-side on a wide
   * (landscape / laptop) window, top/bottom on a tall (portrait / phone)
   * window. In side-by-side both players sit upright facing the screen; in
   * top/bottom the top half is rotated 180° for the player sitting across. ***/
  duelLayout() {
    const cfg = CONFIG.DUEL.layout;
    if (cfg === 'sideBySide' || cfg === 'topBottom') return cfg;
    const landscape = (typeof window !== 'undefined') &&
      window.innerWidth >= window.innerHeight;
    return landscape ? 'sideBySide' : 'topBottom';
  }

  /*** Build a duel player (basket) occupying one half of the screen. ***/
  makeDuelPlayer(index, name) {
    const t = CONFIG.THEME;
    return {
      index,
      name: name || (index === 0 ? 'P1' : 'P2'),
      color: (this.duelColours && this.duelColours[index]) || (index === 0 ? t.p1 : t.p2),
      score: 0,
      lives: CONFIG.DUEL.lives,
      x: CONFIG.CANVAS_WIDTH / 2,
      pos: CONFIG.CANVAS_WIDTH / 2, // position along the movement axis
      squash: 0,
      redFlash: 0,
    };
  }

  /*** Open the duel setup screen where both players type their names.
   * Pre-fills from saved profiles when available. ***/
  openDuelSetup() {
    const profs = Storage.getProfiles();
    this.duelNames = [profs[0] || '', profs[1] || ''];
    this.duelNameActive = 0;
    this.state = 'duelSetup';
  }

  /*** Begin the duel using the typed names (falling back to defaults). ***/
  beginDuelFromSetup() {
    const n1 = (this.duelNames[0] || '').trim() || 'Player 1';
    const n2 = (this.duelNames[1] || '').trim() || 'Player 2';
    // Remember the names as profiles so they show up next time / on leaderboard
    if (CONFIG.FEATURES.profiles) {
      if (n1 !== 'Player 1') Storage.addProfile(n1);
      if (n2 !== 'Player 2') Storage.addProfile(n2);
    }
    this.startDuel(n1, n2);
  }

  /*** Start a local duel with the given names. Layout (side-by-side vs
   * top/bottom) is chosen by duelLayout() at render/update time. ***/
  startDuel(name1, name2) {
    this.mode = 'duel';
    this.players = [
      this.makeDuelPlayer(0, name1 || 'Player 1'),
      this.makeDuelPlayer(1, name2 || 'Player 2'),
    ];
    // Centre each basket within its zone for the active layout
    for (let i = 0; i < 2; i++) {
      const z = this.duelZone(i);
      this.players[i].pos = (z.min + z.max) / 2;
      this.players[i].x = this.players[i].pos;
    }
    this.fallers = [];
    this.bursts = [];
    this.floaters = [];
    this.spawnTimer = 0;
    this.timeLeft = CONFIG.DUEL.roundSeconds;
    this.roundElapsed = 0;
    this.shakeTime = 0;
    this.duelWinner = null;

    // Seeded, mirrored spawner: one RNG drives the shared schedule for both
    // lanes so neither player gets luckier drops.
    this.duelSeed = (Date.now() & 0xffffffff) >>> 0;
    this.duelRng = makeRng(this.duelSeed);

    // Assign one secret ability to each player (equal weight) + charges
    if (CONFIG.FEATURES.abilities) this.assignAbilities();

    // Begin with the 3-2-1 ready phase (or straight to play if disabled)
    if (CONFIG.FEATURES.countdown) {
      this.countdownLeft = CONFIG.DUEL.countdownSeconds;
      this.state = 'duelCountdown';
    } else {
      this.countdownLeft = 0;
      this.state = 'duelPlaying';
    }
  }

  /*** Assign a random ability to each player and reset charge/cooldown/effect
   * state. Each player's own ability is known to them; the opponent sees only
   * a generic mystery indicator (handled at render time). ***/
  assignAbilities() {
    const pool = CONFIG.ABILITIES.pool;
    for (const p of this.players) {
      p.ability = pool[Math.floor(Math.random() * pool.length)];
      p.charges = CONFIG.ABILITIES.charges;
      p.abilityLockout = 0;      // seconds until they can activate again
      p.incoming = 0;            // seconds left of the pre-attack cue (on target)
      p.effect = null;           // active hostile effect on THIS player
      p.effectLeft = 0;          // seconds left of that effect
      p.pendingFrom = null;      // attacker index while incoming cue plays
      p.pendingAbility = null;   // ability that will land when cue ends
    }
  }

  /*** End a duel: decide the winner, record both players' games.
   * A knockout (one player out of lives) wins outright; otherwise highest
   * score at time-up wins, with a tie when scores are equal. ***/
  duelOver() {
    const [a, b] = this.players;
    if (a.lives <= 0 && b.lives > 0) this.duelWinner = 1;
    else if (b.lives <= 0 && a.lives > 0) this.duelWinner = 0;
    else if (a.score > b.score) this.duelWinner = 0;
    else if (b.score > a.score) this.duelWinner = 1;
    else this.duelWinner = -1; // tie
    if (CONFIG.FEATURES.profiles) {
      Storage.recordGame(a.name, a.score, 'duel', this.duelWinner === 0 ? 'Win' : (this.duelWinner === 1 ? 'Loss' : 'Tie'));
      Storage.recordGame(b.name, b.score, 'duel', this.duelWinner === 1 ? 'Win' : (this.duelWinner === 0 ? 'Loss' : 'Tie'));
    }
    this.sfxGameOver();
    this.state = 'duelOver';
  }

  /*** Register screen: handle one typed key. ***/
  handleRegisterKey(e) {
    const k = e.key;
    if (k === 'Enter') {
      const saved = Storage.addProfile(this.nameBuffer);
      this.nameBuffer = '';
      this.state = this.returnTo;
      e.preventDefault();
      return;
    }
    if (k === 'Escape') { this.nameBuffer = ''; this.state = this.returnTo; e.preventDefault(); return; }
    if (k === 'Backspace') { this.nameBuffer = this.nameBuffer.slice(0, -1); e.preventDefault(); return; }
    // Accept printable single characters (letters, numbers, space)
    if (k.length === 1 && this.nameBuffer.length < 14 && /[\w ]/.test(k)) {
      this.nameBuffer += k;
      e.preventDefault();
    }
  }

  /*** Duel setup screen: type both player names. Tab/Enter switches fields;
   * Enter on the second field (or the Start button) begins the duel. ***/
  handleDuelSetupKey(e) {
    const k = e.key;
    const i = this.duelNameActive;
    if (k === 'Tab') { this.duelNameActive = i === 0 ? 1 : 0; e.preventDefault(); return; }
    if (k === 'Escape') { this.state = 'menu'; e.preventDefault(); return; }
    if (k === 'Enter') {
      if (i === 0) this.duelNameActive = 1;      // move to player 2
      else this.beginDuelFromSetup();            // both done -> start
      e.preventDefault();
      return;
    }
    if (k === 'Backspace') { this.duelNames[i] = this.duelNames[i].slice(0, -1); e.preventDefault(); return; }
    if (k.length === 1 && this.duelNames[i].length < 14 && /[\w ]/.test(k)) {
      this.duelNames[i] += k;
      e.preventDefault();
    }
  }

  /*** Activate attacker's ability against the rival. Enforces charges,
   * lockout, and the no-stacking rule. Starts a short "incoming" cue on the
   * target; the effect lands when the cue ends. Returns true if it fired. ***/
  activateAbility(attackerIndex) {
    if (!CONFIG.FEATURES.abilities) return false;
    if (this.state !== 'duelPlaying') return false;
    const attacker = this.players[attackerIndex];
    const target = this.players[attackerIndex === 0 ? 1 : 0];
    if (!attacker || !attacker.ability) return false;
    if (attacker.charges <= 0) return false;
    if (attacker.abilityLockout > 0) return false;
    // No stacking: if the target already has (or is about to get) an effect,
    // block without consuming a charge.
    if (target.effect || target.incoming > 0) return false;

    attacker.charges -= 1;
    attacker.abilityLockout = CONFIG.ABILITIES.lockoutSeconds;
    target.incoming = CONFIG.ABILITIES.incomingSeconds;
    target.pendingAbility = attacker.ability;
    target.pendingFrom = attackerIndex;
    this.sfxPower();
    return true;
  }

  /*** Replay the duel with the same two players. ***/
  rematchDuel() {
    const [a, b] = this.players;
    this.startDuel(a ? a.name : 'Player 1', b ? b.name : 'Player 2');
  }

  /*** Toggle pause (works for classic and duel) ***/
  togglePause() {
    if (this.state === 'playing' || this.state === 'duelPlaying') {
      this._prePauseState = this.state;
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = this._prePauseState || 'playing';
    }
  }

  /*** Pick a random item definition using spawn weights ***/
  pickItem() {
    let r = Math.random() * this.totalWeight;
    for (const it of CONFIG.items) {
      r -= it.weight;
      if (r <= 0) return it;
    }
    return CONFIG.items[CONFIG.items.length - 1];
  }

  /*** Warm-start aware item picker: during the opening no-bomb window,
   * re-roll bombs into non-bomb items so the first seconds are gentle. ***/
  pickItemForNow() {
    let def = this.pickItem();
    if (CONFIG.FEATURES.warmStart &&
        this.roundElapsed < CONFIG.WARMUP.noBombSeconds) {
      let guard = 0;
      while (def.type === 'bad' && guard++ < 8) def = this.pickItem();
    }
    return def;
  }

  /*** Spawn one faller just above the top edge.
   * Optional opts: { def, x } to force a specific item/position (warm start). ***/
  spawnItem(opts = {}) {
    const def = opts.def || this.pickItemForNow();
    const img = this.assets.items[def.name];
    const w = def.width;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    const x = (opts.x !== undefined)
      ? Math.max(w / 2, Math.min(CONFIG.CANVAS_WIDTH - w / 2, opts.x))
      : Math.random() * (CONFIG.CANVAS_WIDTH - w) + w / 2; // centre x, fully inside
    const speed = CONFIG.RULES.fallSpeedMin +
      Math.random() * (CONFIG.RULES.fallSpeedMax - CONFIG.RULES.fallSpeedMin);
    this.fallers.push({
      def, img, w, h,
      x,                    // centre x
      y: -h / 2,            // centre y, just above top
      speed,
      spin: 0,              // rotation for stars
      wobblePhase: Math.random() * Math.PI * 2, // phase for bomb wobble
    });
  }

  /*** Queue a growing/fading burst sprite at (x,y) ***/
  spawnBurst(img, x, y, fromW, toW, life) {
    this.bursts.push({ img, x, y, fromW, toW, life, t: 0 });
  }

  /*** Input handling ***/
  bindKeyboard() {
    // Use document to ensure key events are captured regardless of focus.
    const onKeyDown = e => {
      this.ensureAudio(); // first gesture unlocks audio
      const k = e.key;

      // Text-entry screens capture typing
      if (this.state === 'register') { this.handleRegisterKey(e); return; }
      if (this.state === 'duelSetup') { this.handleDuelSetupKey(e); return; }

      if (k === 'm' || k === 'M') { this.muted = !this.muted; e.preventDefault(); return; }

      const confirmKey = (k === ' ' || k === 'Enter');

      // Movement keys. In duel, A/D = player 1, arrows = player 2.
      // In classic, both A/D and arrows drive the single basket.
      if (k === 'a' || k === 'A') { this.keysDown['p1left'] = true; this.keysDown['left'] = true; e.preventDefault(); }
      if (k === 'd' || k === 'D') { this.keysDown['p1right'] = true; this.keysDown['right'] = true; e.preventDefault(); }
      if (k === 'ArrowLeft')  { this.keysDown['p2left'] = true;  this.keysDown['left'] = true;  e.preventDefault(); }
      if (k === 'ArrowRight') { this.keysDown['p2right'] = true; this.keysDown['right'] = true; e.preventDefault(); }

      // Secret ability triggers: Z = Player 1, X = Player 2. Fire once per
      // press (guard against auto-repeat while the key is held).
      if ((k === 'z' || k === 'Z') && !this._zHeld) { this._zHeld = true; this.activateAbility(0); e.preventDefault(); }
      if ((k === 'x' || k === 'X') && !this._xHeld) { this._xHeld = true; this.activateAbility(1); e.preventDefault(); }

      // Pause toggle (both modes)
      if (k === 'p' || k === 'P') {
        if (this.state === 'playing' || this.state === 'duelPlaying' || this.state === 'paused') {
          this.togglePause(); e.preventDefault();
        }
        return;
      }

      switch (this.state) {
        case 'start':
          if (confirmKey) { this.goMenu(); e.preventDefault(); }
          break;
        case 'paused':
          if (confirmKey) { this.togglePause(); e.preventDefault(); }
          break;
        case 'over':
          if (k === 'r' || k === 'R' || confirmKey) { this.restart(); e.preventDefault(); }
          break;
        case 'duelOver':
          if (k === 'r' || k === 'R' || confirmKey) { this.rematchDuel(); e.preventDefault(); }
          break;
        case 'leaderboard':
          if (confirmKey || k === 'Escape') { this.state = this.returnTo; e.preventDefault(); }
          break;
      }
    };
    const onKeyUp = e => {
      const k = e.key;
      if (k === 'a' || k === 'A') { this.keysDown['p1left'] = false; this.keysDown['left'] = false; }
      if (k === 'd' || k === 'D') { this.keysDown['p1right'] = false; this.keysDown['right'] = false; }
      if (k === 'ArrowLeft')  { this.keysDown['p2left'] = false;  this.keysDown['left'] = false; }
      if (k === 'ArrowRight') { this.keysDown['p2right'] = false; this.keysDown['right'] = false; }
      if (k === 'z' || k === 'Z') this._zHeld = false;
      if (k === 'x' || k === 'X') this._xHeld = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  bindPointer() {
    const canvas = this.canvas;
    const getPointerX = e => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
      // Convert to logical canvas coordinates (ignoring CSS scaling because we set ctx scale)
      const logicalX = ((clientX - rect.left) / rect.width) * CONFIG.CANVAS_WIDTH;
      return logicalX;
    };
    const getPointerY = e => {
      const rect = canvas.getBoundingClientRect();
      const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
      return ((clientY - rect.top) / rect.height) * CONFIG.CANVAS_HEIGHT;
    };
    const inRect = (r, px, py) => r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    this.duelPointers = {}; // pointerId -> half (0/1) during a duel
    const start = e => {
      e.preventDefault();
      this.ensureAudio(); // first gesture unlocks audio

      const px = getPointerX(e), py = getPointerY(e);

      // Speaker icon toggles mute from anywhere
      if (inRect(this.speakerRect, px, py)) { this.muted = !this.muted; return; }

      switch (this.state) {
        case 'start':
          this.goMenu();
          return;
        case 'menu': {
          const b = this.menuButtons || {};
          if (inRect(b.classic, px, py)) this.startClassic();
          else if (inRect(b.duel, px, py)) this.openDuelSetup();
          else if (inRect(b.leaderboard, px, py)) { this.returnTo = 'menu'; this.state = 'leaderboard'; }
          else if (inRect(b.register, px, py)) { this.returnTo = 'menu'; this.state = 'register'; }
          return;
        }
        case 'register':
          if (inRect(this.registerBackRect, px, py)) { this.nameBuffer = ''; this.state = this.returnTo; }
          return;
        case 'duelSetup': {
          const rects = this.duelNameRects || [];
          // colour swatches
          const cr = this.duelColourRects || [[], []];
          for (let pi = 0; pi < 2; pi++) {
            for (const s of cr[pi]) { if (inRect(s, px, py)) { this.duelColours[pi] = s.col; return; } }
          }
          if (inRect(rects[0], px, py)) this.duelNameActive = 0;
          else if (inRect(rects[1], px, py)) this.duelNameActive = 1;
          else if (inRect(this.duelStartRect, px, py)) this.beginDuelFromSetup();
          else if (inRect(this.duelSetupBackRect, px, py)) this.state = 'menu';
          return;
        }
        case 'leaderboard':
          if (inRect(this.leaderboardBackRect, px, py)) this.state = this.returnTo;
          return;
        case 'paused':
          this.togglePause();
          return;
        case 'over':
          if (inRect(this.restartRect, px, py)) this.restart();
          else if (inRect(this.menuRect, px, py)) this.toMenu();
          return;
        case 'duelOver':
          if (inRect(this.duelRematchRect, px, py)) this.startDuel();
          else if (inRect(this.duelMenuRect, px, py)) this.toMenu();
          return;
        case 'duelCountdown':
          return; // ignore taps during the ready phase
        case 'duelPlaying': {
          // Ability buttons take priority over movement
          const ab = this.abilityButtons || [null, null];
          if (inRect(ab[0], px, py)) { this.activateAbility(0); return; }
          if (inRect(ab[1], px, py)) { this.activateAbility(1); return; }
          // Otherwise this touch controls the basket in its half.
          const half = this.duelHalfAt(px, py);
          this.duelPointers[e.pointerId] = half;
          this._duelPointerMove(half, px, py);
          try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
          return;
        }
        case 'playing':
          this.pointerActive = true;
          this.basketTargetX = px;
          try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
          return;
      }
    };
    const move = e => {
      e.preventDefault();
      const px = getPointerX(e), py = getPointerY(e);
      if (this.state === 'playing' && this.pointerActive) {
        this.basketTargetX = px;
      } else if (this.state === 'duelPlaying') {
        const half = this.duelPointers[e.pointerId];
        if (half !== undefined) this._duelPointerMove(half, px, py);
      }
    };
    const end = e => {
      e.preventDefault();
      this.pointerActive = false;
      delete this.duelPointers[e.pointerId];
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  /*** Main loop ***/
  gameLoop(timestamp) {
    const deltaSec = Math.min((timestamp - this.lastTimestamp) / 1000, CONFIG.MAX_DELTA);
    this.lastTimestamp = timestamp;
    this.update(deltaSec);
    this.render();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  update(dt) {
    this.elapsed += dt; // drives pulsing/bounce animations
    if (this.bg) this.bg.update(dt); // live background advances in every state

    // Menu-like screens animate decorative fallers only (unless reduced motion)
    if (this.state === 'start' || this.state === 'menu' ||
        this.state === 'register' || this.state === 'leaderboard' ||
        this.state === 'duelSetup') {
      if (!CONFIG.FEATURES.reducedMotion) {
        for (const d of this.decor) { d.y += d.speed * dt; d.spin += dt; }
        this.decor = this.decor.filter(d => d.y - d.h / 2 <= CONFIG.CANVAS_HEIGHT);
        while (this.decor.length < 6) this.spawnDecor(false);
      }
      return;
    }

    // Duel countdown: tick down the 3-2-1 ready phase, then play
    if (this.state === 'duelCountdown') {
      this.countdownLeft -= dt;
      if (this.countdownLeft <= 0) this.state = 'duelPlaying';
      return;
    }
    // Duel has its own update path
    if (this.state === 'duelPlaying') { this.updateDuel(dt); return; }
    if (this.state === 'duelOver') return;

    // Basket only moves while actually playing (not paused / game over)
    if (this.state === 'playing') {
      let dir = 0;
      if (this.keysDown['left']) dir -= 1;
      if (this.keysDown['right']) dir += 1;
      if (dir !== 0) {
        // Keyboard takes over: move directly and keep pointer target in sync
        this.basketX += dir * CONFIG.PLAYER.speed * dt;
        this.basketTargetX = this.basketX;
      } else if (this.pointerActive) {
        // Pointer smooth movement (lerp towards target) only while held down
        const pointerDelta = this.basketTargetX - this.basketX;
        if (Math.abs(pointerDelta) > 0.5) {
          const lerpFactor = Math.min(1, 8 * dt); // speed multiplier
          this.basketX += pointerDelta * lerpFactor;
        }
      }
      // Clamp to canvas edges (account for half basket width)
      const halfW = CONFIG.PLAYER.width / 2;
      this.basketX = Math.max(halfW, Math.min(CONFIG.CANVAS_WIDTH - halfW, this.basketX));
    }

    // Countdown visual timers (always run so they finish after game over)
    if (this.redFlash > 0) this.redFlash = Math.max(0, this.redFlash - dt);
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);

    // Animate transient effects regardless of state (so they finish)
    this.basketSquash = Math.max(0, this.basketSquash - dt);
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.t += dt;
      if (b.t >= b.life) this.bursts.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      if (f.t >= f.life) this.floaters.splice(i, 1);
    }

    // Items only spawn and move while playing
    if (this.state !== 'playing') return;

    // Count down active power-ups
    for (const key of Object.keys(this.effects)) {
      this.effects[key].timeLeft -= dt;
      if (this.effects[key].timeLeft <= 0) delete this.effects[key];
    }

    // Round timer
    this.roundElapsed += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver("Time's up!");
      return;
    }

    // Warm start: drop the very first star right above the basket, early,
    // so a new player gets a guaranteed easy catch within ~2 s.
    if (CONFIG.FEATURES.warmStart && !this.warmFirstStarDone &&
        this.roundElapsed >= CONFIG.WARMUP.firstStarSeconds) {
      this.warmFirstStarDone = true;
      const starDef = CONFIG.items.find(it => it.name === 'star');
      if (starDef) { this.spawnItem({ def: starDef, x: this.basketX }); this.spawnTimer = 0; }
    }

    // Difficulty ramp: progress 0..1 across the round
    const progress = 1 - (this.timeLeft / CONFIG.RULES.roundSeconds);
    const curInterval = CONFIG.RULES.spawnIntervalStart +
      (CONFIG.RULES.spawnIntervalEnd - CONFIG.RULES.spawnIntervalStart) * progress;

    // Spawn on (ramping) interval
    this.spawnTimer += dt;
    while (this.spawnTimer >= curInterval) {
      this.spawnTimer -= curInterval;
      this.spawnItem();
    }

    // Basket hitbox (70% of drawn size)
    const basketImg = this.assets.basket;
    const basketH = (basketImg.naturalHeight / basketImg.naturalWidth) * CONFIG.PLAYER.width;
    const basketCY = CONFIG.CANVAS_HEIGHT - 30 - basketH / 2;
    const bHalfW = (CONFIG.PLAYER.width * 0.7) / 2;
    const bHalfH = (basketH * 0.7) / 2;
    const basketBox = {
      left: this.basketX - bHalfW, right: this.basketX + bHalfW,
      top: basketCY - bHalfH, bottom: basketCY + bHalfH,
    };

    // Fall-speed modifiers: difficulty ramp up to +40%, slow power-up halves it
    const rampMul = 1 + (CONFIG.RULES.fallSpeedRampMax - 1) * progress;
    const slowMul = this.effects['slow'] ? CONFIG.POWERUPS.slowFactor : 1;
    const speedMul = rampMul * slowMul;

    // Update fallers: move, animate, collide, cull
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i];
      f.y += f.speed * speedMul * dt;
      if (f.def.type === 'good') f.spin += dt * 2;          // stars spin
      else if (f.def.type === 'bad') f.wobblePhase += dt * 6; // bombs wobble
      else f.spin += dt * 3;                                 // power-ups spin a bit

      // Item hitbox (70% of drawn size)
      const iHalfW = (f.w * 0.7) / 2;
      const iHalfH = (f.h * 0.7) / 2;
      const overlap = f.x + iHalfW > basketBox.left && f.x - iHalfW < basketBox.right &&
                      f.y + iHalfH > basketBox.top && f.y - iHalfH < basketBox.bottom;
      if (overlap) {
        if (f.def.type === 'good') {
          const mult = this.effects['double'] ? CONFIG.POWERUPS.doubleFactor : 1;
          const gained = f.def.points * mult;
          this.score += gained;
          this.spawnBurst(this.assets.sparkle, f.x, f.y, 40, 90, 0.35);
          this.floaters.push({ x: f.x, y: f.y, text: `+${gained}`, t: 0, life: 0.7 });
          this.basketSquash = 0.1;
          this.coachMarkDone = true; // first catch dismisses the hint
          this.sfxCatch();
        } else if (f.def.type === 'power') {
          // Activate / refresh the effect (reusable by effect name)
          this.effects[f.def.effect] = {
            timeLeft: f.def.duration,
            duration: f.def.duration,
            icon: f.img,
          };
          this.spawnBurst(this.assets.sparkle, f.x, f.y, 40, 90, 0.35);
          this.basketSquash = 0.1;
          this.sfxPower();
        } else {
          // bad
          this.redFlash = 0.2;
          this.shakeTime = 0.25;
          this.basketSquash = 0.1;
          this.spawnBurst(this.assets.explosion, f.x, f.y, 60, 120, 0.4);
          this.sfxBomb();
          this.lives -= 1;
          if (this.lives <= 0) {
            this.lives = 0;
            this.fallers.splice(i, 1);
            this.gameOver('Out of lives!');
            return;
          }
        }
        this.fallers.splice(i, 1);
        continue;
      }

      // Remove once fully below the bottom
      if (f.y - f.h / 2 > CONFIG.CANVAS_HEIGHT) this.fallers.splice(i, 1);
    }
  }

  /*** Geometry for a duel player's zone, depending on the active layout.
   * Returns, in canvas coordinates:
   *   axis       : "x" (move horizontally) or "y" (move vertically)
   *   min,max    : movement bounds along that axis for the basket centre
   *   fixed      : the basket's position on the other axis
   *   spawnMin/spawnMax : range along the movement axis where items appear
   *   fallDir    : +1 or -1 direction items travel along the fixed axis
   *   rotated    : whether this half is drawn rotated 180° (phone top player)
   *
   * Layouts:
   *  - sideBySide (laptop): two columns. Both baskets at the bottom, items
   *    fall down. P1 = left column, P2 = right column. Both upright.
   *  - topBottom (phone): two rows. P1 bottom (upright, items fall down),
   *    P2 top (rotated 180°, items fall up toward the top basket). ***/
  duelZone(index) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    const bw = CONFIG.PLAYER.width, halfBW = bw / 2;
    const layout = this.duelLayout();
    if (layout === 'sideBySide') {
      const colMin = index === 0 ? halfBW : W / 2 + halfBW;
      const colMax = index === 0 ? W / 2 - halfBW : W - halfBW;
      const spawnMin = index === 0 ? 0 : W / 2;
      return {
        layout, axis: 'x', min: colMin, max: colMax,
        fixed: H - 30, spawnMin: spawnMin + 10, spawnMax: spawnMin + W / 2 - 10,
        fallDir: +1, rotated: false,
      };
    }
    // topBottom
    if (index === 0) {
      return { layout, axis: 'x', min: halfBW, max: W - halfBW,
        fixed: H - 30, spawnMin: 10, spawnMax: W - 10, fallDir: +1, rotated: false };
    }
    return { layout, axis: 'x', min: halfBW, max: W - halfBW,
      fixed: 30, spawnMin: 10, spawnMax: W - 10, fallDir: -1, rotated: true };
  }

  /*** DUEL update: layout-aware. Each player owns a zone (column on laptop,
   * row on phone). Items spawn in their zone and travel toward their basket. ***/
  updateDuel(dt) {
    const speed = CONFIG.PLAYER.speed;
    const [p1, p2] = this.players;

    // Ability timers: lockout, incoming cue (lands the effect), active effect
    if (CONFIG.FEATURES.abilities) {
      for (const p of this.players) {
        if (p.abilityLockout > 0) p.abilityLockout = Math.max(0, p.abilityLockout - dt);
        if (p.incoming > 0) {
          p.incoming = Math.max(0, p.incoming - dt);
          if (p.incoming === 0 && p.pendingAbility) {
            p.effect = p.pendingAbility;         // effect lands on this player
            p.effectLeft = p.pendingAbility.duration;
            p.pendingAbility = null; p.pendingFrom = null;
          }
        }
        if (p.effectLeft > 0) {
          p.effectLeft = Math.max(0, p.effectLeft - dt);
          if (p.effectLeft === 0) p.effect = null;
        }
      }
    }

    // Keyboard movement. p1 = A/D, p2 = arrows. In side-by-side both move
    // left/right normally. In top/bottom, p2 is rotated so we flip them.
    // "Control Flip" ability reverses the affected player's direction.
    const moveAlong = (player, zone, neg, pos) => {
      let d = 0;
      if (this.keysDown[neg]) d -= 1;
      if (this.keysDown[pos]) d += 1;
      if (zone.rotated) d = -d; // rotated view: invert control direction
      if (player.effect && player.effect.id === 'flip') d = -d;
      player.pos = Math.max(zone.min, Math.min(zone.max, (player.pos ?? player.x) + d * speed * dt));
      player.x = player.pos;
    };
    moveAlong(p1, this.duelZone(0), 'p1left', 'p1right');
    moveAlong(p2, this.duelZone(1), 'p2left', 'p2right');

    // Decay per-player + shared timers
    for (const p of this.players) {
      p.squash = Math.max(0, p.squash - dt);
      p.redFlash = Math.max(0, p.redFlash - dt);
    }
    this.basketSquash = Math.max(0, this.basketSquash - dt);
    for (let i = this.bursts.length - 1; i >= 0; i--) { const b = this.bursts[i]; b.t += dt; if (b.t >= b.life) this.bursts.splice(i, 1); }
    for (let i = this.floaters.length - 1; i >= 0; i--) { const f = this.floaters[i]; f.t += dt; if (f.t >= f.life) this.floaters.splice(i, 1); }

    // Timer
    this.roundElapsed += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.duelOver(); return; }
    if (p1.lives <= 0 || p2.lives <= 0) { this.duelOver(); return; }

    // Seeded, mirrored spawn: one draw feeds both lanes identically
    const progress = 1 - (this.timeLeft / CONFIG.DUEL.roundSeconds);
    const curInterval = (CONFIG.RULES.spawnIntervalStart +
      (CONFIG.RULES.spawnIntervalEnd - CONFIG.RULES.spawnIntervalStart) * progress)
      * CONFIG.DUEL.spawnGapMul;
    this.spawnTimer += dt;
    while (this.spawnTimer >= curInterval) {
      this.spawnTimer -= curInterval;
      this.spawnDuelPair();
    }

    // Move + collide fallers (always fall vertically toward the basket row)
    const rampMul = 1 + (CONFIG.RULES.fallSpeedRampMax - 1) * progress;
    const H = CONFIG.CANVAS_HEIGHT;
    const W = CONFIG.CANVAS_WIDTH;
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i];
      const zone = this.duelZone(f.half);
      const player = this.players[f.half];
      const eff = player.effect;
      // Gravity Surge: items in this lane fall faster
      const gravMul = (eff && eff.id === 'gravity') ? eff.speedMul : 1;
      f.y += f.speed * rampMul * gravMul * dt * zone.fallDir;
      // Sidewind: gentle horizontal drift, capped to the zone width fraction
      if (eff && eff.id === 'sidewind') {
        f.drift = (f.drift || 0) + dt;
        const amp = (W / 2) * eff.driftFrac;
        f.x += Math.sin(f.drift * 3) * amp * dt * 2;
        const lo = zone.spawnMin + f.w / 2, hi = zone.spawnMax - f.w / 2;
        f.x = Math.max(lo, Math.min(hi, f.x));
      }
      if (f.def.type === 'good') f.spin += dt * 2; else f.wobblePhase += dt * 6;

      // Chomper Shrink: reduce catch width (never below 70% per PRD)
      const shrinkMul = (eff && eff.id === 'shrink') ? eff.widthMul : 1;
      const catchW = CONFIG.PLAYER.width * CONFIG.DUEL.chomperScale * shrinkMul;
      const bHalfW = (catchW * 0.7) / 2;
      const iHalfW = (f.w * 0.7) / 2, iHalfH = (f.h * 0.7) / 2;
      const overlapX = Math.abs(f.x - player.x) < (bHalfW + iHalfW);
      const overlapY = Math.abs(f.y - zone.fixed) < (iHalfH + 26);
      if (overlapX && overlapY) {
        if (f.def.type === 'good') {
          player.score += f.def.points;
          this.spawnBurst(this.assets.sparkle, f.x, f.y, 36, 80, 0.3);
          this.floaters.push({ x: f.x, y: f.y, text: `+${f.def.points}`, t: 0, life: 0.6, half: f.half });
          player.squash = 0.1;
          this.sfxCatch();
        } else {
          player.lives -= 1;
          player.redFlash = 0.2;
          this.spawnBurst(this.assets.explosion, f.x, f.y, 50, 100, 0.35);
          this.sfxBomb();
        }
        this.fallers.splice(i, 1);
        continue;
      }
      // Cull when it leaves the canvas in its travel direction
      if (zone.fallDir > 0 && f.y - f.h / 2 > H) this.fallers.splice(i, 1);
      else if (zone.fallDir < 0 && f.y + f.h / 2 < 0) this.fallers.splice(i, 1);
    }
  }

  /*** Map a raw touch to a duel basket target, respecting the zone + rotation. ***/
  _duelPointerMove(half, px, py) {
    if (!this.players || this.players.length < 2) return;
    const zone = this.duelZone(half);
    let v = px; // movement axis is always x in both layouts
    if (zone.rotated) v = CONFIG.CANVAS_WIDTH - px; // mirror for rotated top player
    const player = this.players[half];
    player.pos = Math.max(zone.min, Math.min(zone.max, v));
    player.x = player.pos;
  }

  /*** Which half does a touch at (px,py) belong to, for the active layout? ***/
  duelHalfAt(px, py) {
    if (this.duelLayout() === 'sideBySide') return px < CONFIG.CANVAS_WIDTH / 2 ? 0 : 1;
    return py >= CONFIG.CANVAS_HEIGHT / 2 ? 0 : 1; // bottom = p1, top = p2
  }

  /*** Spawn one seeded item into BOTH lanes at once (mirrored). Uses the duel
   * RNG so the schedule is identical and fair for both players. The relative
   * position within each zone is the same fraction (mirrored horizontally for
   * player 2 so the two lanes look symmetric). ***/
  spawnDuelPair() {
    const rng = this.duelRng || Math.random;
    const pool = CONFIG.items.filter(it => it.type === 'good' || it.type === 'bad');
    const tw = pool.reduce((s, it) => s + it.weight, 0);
    let r = rng() * tw, def = pool[pool.length - 1];
    for (const it of pool) { r -= it.weight; if (r <= 0) { def = it; break; } }
    const frac = rng();   // 0..1 position across the zone
    const speed = CONFIG.RULES.fallSpeedMin + rng() * (CONFIG.RULES.fallSpeedMax - CONFIG.RULES.fallSpeedMin);
    const wob = rng() * Math.PI * 2;
    this._spawnDuelInto(0, def, frac, speed, wob);
    this._spawnDuelInto(1, def, 1 - frac, speed, wob); // mirror for symmetry
  }

  /*** Place one item in a lane given a shared def/fraction/speed. ***/
  _spawnDuelInto(half, def, frac, speed, wob) {
    const zone = this.duelZone(half);
    const img = this.assets.items[def.name];
    const w = def.width * CONFIG.DUEL.itemScale;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    const lo = zone.spawnMin + w / 2, hi = zone.spawnMax - w / 2;
    const x = Math.max(w / 2, Math.min(CONFIG.CANVAS_WIDTH - w / 2, lo + frac * Math.max(1, hi - lo)));
    const y = zone.fallDir > 0 ? -h / 2 : CONFIG.CANVAS_HEIGHT + h / 2;
    this.fallers.push({ def, img, w, h, x, y, speed, spin: 0, wobblePhase: wob, half, drift: 0 });
  }

  render() {
    const ctx = this.ctx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    // Clear
    ctx.clearRect(0, 0, w, h);
    if (this.loading) { this.renderLoader(ctx, w, h); return; }

    // Self-contained screens
    if (this.state === 'start') { this.renderStart(ctx, w, h); return; }
    if (this.state === 'menu') { this.renderMenu(ctx, w, h); return; }
    if (this.state === 'register') { this.renderRegister(ctx, w, h); return; }
    if (this.state === 'duelSetup') { this.renderDuelSetup(ctx, w, h); return; }
    if (this.state === 'leaderboard') { this.renderLeaderboard(ctx, w, h); return; }
    if (this.state === 'duelCountdown') { this.renderDuel(ctx, w, h); this.renderDuelCountdown(ctx, w, h); return; }
    if (this.state === 'duelPlaying' || this.state === 'duelOver') { this.renderDuel(ctx, w, h); return; }

    // Screen shake: offset the whole world while shakeTime is active
    ctx.save();
    if (this.shakeTime > 0) {
      const mag = 10 * (this.shakeTime / 0.25);
      ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
    }

    // Live background; horizon glow lifts in the final 10 seconds
    const intensity = (this.state === 'playing' && this.timeLeft <= 10)
      ? (1 - this.timeLeft / 10) : 0;
    this.drawBackground(ctx, w, h, intensity);
    // Basket sprite – keep real aspect ratio, with a quick squash on catch
    const img = this.assets.basket;
    const baseW = CONFIG.PLAYER.width;
    const baseH = (img.naturalHeight / img.naturalWidth) * baseW;
    const squash = this.basketSquash > 0 ? (this.basketSquash / 0.1) : 0; // 1..0
    const basketW = baseW * (1 + 0.18 * squash);   // wider
    const basketH = baseH * (1 - 0.22 * squash);   // shorter
    const x = this.basketX - basketW / 2;
    const y = h - 30 - basketH;
    ctx.drawImage(img, x, y, basketW, basketH);

    // Falling items
    for (const f of this.fallers) {
      ctx.save();
      if (f.def.type === 'good') {
        // Stars spin around their centre
        ctx.translate(f.x, f.y);
        ctx.rotate(f.spin);
        ctx.drawImage(f.img, -f.w / 2, -f.h / 2, f.w, f.h);
      } else {
        // Bombs wobble left/right (max ~8px)
        const wobble = Math.sin(f.wobblePhase) * 8;
        ctx.drawImage(f.img, f.x - f.w / 2 + wobble, f.y - f.h / 2, f.w, f.h);
      }
      ctx.restore();
    }

    // Burst sprites (sparkle / explosion): grow and fade out
    for (const b of this.bursts) {
      const p = b.t / b.life;              // 0..1
      const bw = b.fromW + (b.toW - b.fromW) * p;
      const bh = (b.img.naturalHeight / b.img.naturalWidth) * bw;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.drawImage(b.img, b.x - bw / 2, b.y - bh / 2, bw, bh);
      ctx.restore();
    }

    // Floating score texts: rise 40px and fade over their life
    for (const f of this.floaters) {
      const p = f.t / f.life;              // 0..1
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = CONFIG.BRAND.accent;
      const fy = f.y - 40 * p;
      ctx.strokeText(f.text, f.x, fy);
      ctx.fillText(f.text, f.x, fy);
      ctx.restore();
    }

    // Red flash on bad catch (part of shaken world layer)
    if (this.redFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${0.5 * (this.redFlash / 0.2)})`;
      ctx.fillRect(0, 0, w, h);
    }

    // End shaken world layer; HUD and overlay draw steady
    ctx.restore();

    this.renderHUD(ctx, w, h);
    if (this.state === 'playing' && CONFIG.FEATURES.coachMark) this.renderCoachMark(ctx, w, h);
    if (this.state === 'paused') this.renderPause(ctx, w, h);
    if (this.state === 'over') this.renderGameOver(ctx, w, h);
  }

  /*** Background for GAMEPLAY screens: the live moonlit scene, then a subtle
   * darkening wash under the play lane so falling items stay readable.
   * intensity lifts the horizon glow in the final seconds. ***/
  drawBackground(ctx, w, h, intensity = 0) {
    if (CONFIG.FEATURES.neonTheme && this.bg) {
      this.bg.draw(ctx, w, h, CONFIG.THEME, intensity);
      // readability wash so sprites pop against the scene
      ctx.fillStyle = 'rgba(5,10,19,0.28)';
      ctx.fillRect(0, 0, w, h);
    } else {
      const bg = this.assets.background;
      const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
      ctx.drawImage(bg, (w - bg.naturalWidth * scale) / 2, (h - bg.naturalHeight * scale) / 2,
        bg.naturalWidth * scale, bg.naturalHeight * scale);
    }
  }

  /*** Background for MENU-style screens: the same live scene, slightly dimmed
   * so panels and text read clearly over it. ***/
  drawNeonBackdrop(ctx, w, h) {
    if (CONFIG.FEATURES.neonTheme && this.bg) {
      this.bg.draw(ctx, w, h, CONFIG.THEME, 0);
      ctx.fillStyle = 'rgba(5,10,19,0.42)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, w, h);
    }
  }

  /*** Draw a translucent panel (rounded rect) to group UI and separate it from
   * the busy background. Returns nothing; purely visual. ***/
  drawPanel(ctx, x, y, pw, ph, r = 18, border = CONFIG.THEME.moonlight) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + pw, y, x + pw, y + ph, r);
    ctx.arcTo(x + pw, y + ph, x, y + ph, r);
    ctx.arcTo(x, y + ph, x, y, r);
    ctx.arcTo(x, y, x + pw, y, r);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5,10,19,0.55)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this._hexA(border, 0.35);
    ctx.stroke();
    ctx.restore();
  }

  /*** Simple vertical layout cursor: start at y, advance by each row's height.
   * Keeps text/buttons from overlapping without hand-tuned percentages. ***/
  makeStack(startY, gap = 16) {
    return {
      y: startY, gap,
      next(height) { const y = this.y + height / 2; this.y += height + this.gap; return y; },
      space(px) { this.y += px; },
    };
  }

  /*** Convert #rrggbb + alpha to an rgba() string. ***/
  _hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  /*** Outlined text using BRAND colours/font, with a neon glow when enabled. ***/
  drawText(ctx, text, x, y, size, fill = CONFIG.BRAND.main, align = 'center', glow = CONFIG.THEME.glow) {
    ctx.save();
    ctx.font = `bold ${size}px ${CONFIG.BRAND.font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    if (CONFIG.FEATURES.neonTheme) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = CONFIG.THEME.glowBlur;
    }
    ctx.lineWidth = Math.max(3, size / 8);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = fill;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /*** Draw a neon rounded-rect button; returns its hitbox. ***/
  drawButton(ctx, label, cx, cy, bw, bh, color = CONFIG.THEME.cyan) {
    const x = cx - bw / 2, y = cy - bh / 2, r = 14;
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = color; ctx.shadowBlur = CONFIG.THEME.glowBlur; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + bw, y, x + bw, y + bh, r);
    ctx.arcTo(x + bw, y + bh, x, y + bh, r);
    ctx.arcTo(x, y + bh, x, y, r);
    ctx.arcTo(x, y, x + bw, y, r);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10,20,40,0.85)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
    this.drawText(ctx, label, cx, cy + 1, 24, CONFIG.BRAND.main, 'center', color);
    return { x, y, w: bw, h: bh };
  }

  /*** Draw the original "chomper" character: a round glowing body with an
   * animated wedge mouth that opens/closes, plus a small eye. Faces the
   * direction items come from. Original silhouette (not Pac-Man art). ***/
  drawChomper(ctx, cx, cy, radius, color, opts = {}) {
    const facing = opts.facing || 'up'; // mouth opens toward incoming items
    const t = (opts.phase ?? this.elapsed);
    // Mouth opens 6°..34° on a gentle cycle; snaps wider briefly on catch
    const base = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(t * 6));
    const open = Math.min(0.9, base + (opts.snap || 0));
    const ang = Math.PI * open; // half-angle of the mouth wedge
    // Rotation so the mouth points the right way
    const rot = facing === 'up' ? -Math.PI / 2
      : facing === 'down' ? Math.PI / 2
      : facing === 'left' ? Math.PI : 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = color; ctx.shadowBlur = 16; }

    // Body with mouth wedge cut out
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, ang, Math.PI * 2 - ang, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(5,10,19,0.6)';
    ctx.stroke();

    // Eye (original treatment: small ice-white dot with dark pupil)
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(radius * 0.1, -radius * 0.42, radius * 0.17, 0, Math.PI * 2);
    ctx.fillStyle = '#ddeeff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.14, -radius * 0.42, radius * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#050a13';
    ctx.fill();

    ctx.restore();
  }

  /*** Branded loading screen: dark background, title, progress bar.
   * Falls back to plain "Loading..." when FEATURES.fastLoad is off. ***/
  renderLoader(ctx, w, h) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    if (!CONFIG.FEATURES.fastLoad) {
      this.drawText(ctx, 'Loading...', w / 2, h / 2, 24, CONFIG.BRAND.main);
      return;
    }

    // Logo if it has loaded yet, else the title text
    const logo = this.assets.logo;
    const cx = w / 2;
    if (logo) {
      const lw = 260;
      const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
      ctx.drawImage(logo, cx - lw / 2, h * 0.3, lw, lh);
    }
    this.drawText(ctx, CONFIG.BRAND.title, cx, h * 0.3 + 70, 40, CONFIG.BRAND.main);

    // Progress bar
    const barW = 240, barH = 14;
    const barX = cx - barW / 2, barY = h * 0.56;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = CONFIG.BRAND.accent;
    ctx.fillRect(barX, barY, barW * this.loadProgress, barH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    this.drawText(ctx, `${Math.round(this.loadProgress * 100)}%`, cx, barY + 40, 20, CONFIG.BRAND.main);
  }

  /*** START / LANDING screen over the live moonlit background. ***/
  renderStart(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2, t = CONFIG.THEME;

    // Logo badge with the brand wordmark fitted on it
    const logo = this.assets.logo;
    const logoW = 300;
    const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
    const logoY = h * 0.12;
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = t.moonlight; ctx.shadowBlur = 24; }
    ctx.drawImage(logo, cx - logoW / 2, logoY, logoW, logoH);
    ctx.restore();

    let titleSize = 46;
    ctx.font = `bold ${titleSize}px ${CONFIG.BRAND.font}`;
    while (ctx.measureText(CONFIG.BRAND.title).width > logoW * 0.78 && titleSize > 20) {
      titleSize -= 2; ctx.font = `bold ${titleSize}px ${CONFIG.BRAND.font}`;
    }
    this.drawText(ctx, CONFIG.BRAND.title, cx, logoY + logoH / 2 - 8, titleSize, t.moonlight);
    this.drawText(ctx, CONFIG.BRAND.subtitle, cx, logoY + logoH / 2 + 22, 18, t.gold);

    // Hook + best inside a panel so they never collide with the button
    const s = this.makeStack(logoY + logoH + 18, 10);
    this.drawText(ctx, CONFIG.BRAND.hook, cx, s.next(22), 20, CONFIG.BRAND.main);
    if (this.best > 0) this.drawText(ctx, `Best  ${this.best}`, cx, s.next(24), 22, t.gold);

    // Pulsing play button with a fixed hitbox
    const pulse = 1 + 0.04 + 0.04 * Math.sin(this.elapsed * 3);
    const pb = this.assets.playButton;
    const baseW = 128, baseH = (pb.naturalHeight / pb.naturalWidth) * baseW;
    const pbW = baseW * pulse, pbH = baseH * pulse;
    const pbCY = h * 0.6;
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = t.moonlight; ctx.shadowBlur = 22; }
    ctx.drawImage(pb, cx - pbW / 2, pbCY - pbH / 2, pbW, pbH);
    ctx.restore();
    this.playRect = { x: cx - baseW / 2, y: pbCY - baseH / 2, w: baseW, h: baseH };

    // How-to line near the bottom
    const howTo = CONFIG.FEATURES.duel
      ? 'Tap anywhere to choose a mode'
      : 'Tap anywhere to start · catch stars, dodge bombs';
    this.drawText(ctx, howTo, cx, h - 54, 18, t.moonlight);

    this.renderSpeaker(ctx, w, h);
  }

  /*** MODE-SELECT MENU: Solo / Duel / Global Arena / Leaderboard / Register ***/
  renderMenu(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2;
    const t = CONFIG.THEME;

    // Title block
    const s = this.makeStack(h * 0.10, 6);
    this.drawText(ctx, CONFIG.BRAND.title, cx, s.next(44), 44, t.moonlight);
    this.drawText(ctx, CONFIG.BRAND.subtitle, cx, s.next(22), 20, t.gold);

    // Button panel keeps everything grouped and evenly spaced
    const panelW = 300;
    const rows = 5; // solo, duel, arena, leaderboard, register
    const rowH = 54, rowGap = 14;
    const panelH = rows * rowH + (rows - 1) * rowGap + 48;
    const panelY = h * 0.26;
    this.drawPanel(ctx, cx - panelW / 2, panelY, panelW, panelH);

    const b = this.makeStack(panelY + 24 + rowH / 2 - rowH / 2, rowGap);
    b.y = panelY + 24; // top padding
    this.menuButtons = {};
    this.menuButtons.classic = this.drawButton(ctx, 'Solo Survival', cx, b.next(rowH), 240, rowH, t.moonlight);
    if (CONFIG.FEATURES.duel) {
      this.menuButtons.duel = this.drawButton(ctx, 'Local Duel', cx, b.next(rowH), 240, rowH, t.p2);
    } else { b.next(rowH); }
    // Global Arena — honest "Coming Soon" (no real backend yet)
    this.drawButton(ctx, 'Global Arena · Soon', cx, b.next(rowH), 240, rowH, 'rgba(221,238,255,0.22)');
    this.menuButtons.leaderboard = this.drawButton(ctx, 'Leaderboard', cx, b.next(rowH), 240, rowH, t.moonlight);
    if (CONFIG.FEATURES.profiles) {
      this.menuButtons.register = this.drawButton(ctx, 'Register Player', cx, b.next(rowH), 240, rowH, t.moonlight);
    }

    // Controls hint, anchored to the bottom with clear spacing
    const hint = this.makeStack(panelY + panelH + 22, 8);
    this.drawText(ctx, 'P1: A / D + Z        P2: ← / → + X', cx, hint.next(18), 16, CONFIG.BRAND.main);
    this.drawText(ctx, 'Laptop splits left/right · phone splits top/bottom', cx, hint.next(16), 13, t.moonlight);

    this.renderSpeaker(ctx, w, h);
  }

  /*** REGISTER screen: type a name, Enter to save. ***/
  renderRegister(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2, t = CONFIG.THEME;

    const panelW = 320, panelX = cx - panelW / 2, panelY = h * 0.22, panelH = h * 0.5;
    this.drawPanel(ctx, panelX, panelY, panelW, panelH);

    const s = this.makeStack(panelY + 28, 18);
    this.drawText(ctx, 'Register Player', cx, s.next(32), 32, t.moonlight);
    this.drawText(ctx, 'Type a name, then press Enter', cx, s.next(18), 16, CONFIG.BRAND.main);
    s.space(6);

    // Input box
    const bw = 260, bh = 56, bx = cx - bw / 2;
    const by = s.next(bh) - bh / 2;
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = t.moonlight; ctx.shadowBlur = t.glowBlur; }
    ctx.fillStyle = 'rgba(10,20,40,0.9)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = 2.5; ctx.strokeStyle = t.moonlight;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
    const caret = (Math.floor(this.elapsed * 2) % 2 === 0) ? '|' : '';
    this.drawText(ctx, (this.nameBuffer || 'Enter name') + caret, cx, by + bh / 2, 24,
      this.nameBuffer ? CONFIG.BRAND.main : 'rgba(221,238,255,0.4)');

    s.space(8);
    const profs = Storage.getProfiles();
    if (profs.length) {
      this.drawText(ctx, 'Saved players', cx, s.next(16), 14, t.gold);
      this.drawText(ctx, profs.slice(0, 5).join('  ·  '), cx, s.next(16), 14, t.moonlight);
    }

    this.registerBackRect = this.drawButton(ctx, 'Back', cx, panelY + panelH - 36, 180, 48, t.p2);
    this.renderSpeaker(ctx, w, h);
  }

  /*** DUEL SETUP: both players type their names and pick a chomper colour.
   * Each player gets a bordered card so the two setups never overlap. ***/
  renderDuelSetup(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2, t = CONFIG.THEME;
    const cols = CONFIG.DUEL.colours;
    this.duelNameRects = [];
    this.duelColourRects = [[], []];

    const top = this.makeStack(h * 0.07, 6);
    this.drawText(ctx, 'Duel Setup', cx, top.next(34), 34, t.moonlight);
    this.drawText(ctx, 'Name each rival and pick a colour', cx, top.next(16), 15, CONFIG.BRAND.main);

    // Two player cards, stacked with generous spacing
    const cardW = 320, cardX = cx - cardW / 2, cardH = 150;
    const cardGap = 18;
    const firstCardY = h * 0.18;

    const drawCard = (idx, label) => {
      const cardY = firstCardY + idx * (cardH + cardGap);
      this.drawPanel(ctx, cardX, cardY, cardW, cardH, 16,
        idx === 0 ? this.duelColours[0] : this.duelColours[1]);
      const s = this.makeStack(cardY + 18, 12);

      this.drawText(ctx, label, cx, s.next(18), 16, this.duelColours[idx]);

      // Name input
      const bw = 250, bh = 44, bx = cx - bw / 2;
      const by = s.next(bh) - bh / 2;
      const active = this.duelNameActive === idx;
      ctx.save();
      if (CONFIG.FEATURES.neonTheme && active) { ctx.shadowColor = this.duelColours[idx]; ctx.shadowBlur = t.glowBlur; }
      ctx.fillStyle = 'rgba(10,20,40,0.9)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.strokeStyle = this.duelColours[idx];
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
      const caret = (active && Math.floor(this.elapsed * 2) % 2 === 0) ? '|' : '';
      const val = this.duelNames[idx];
      this.drawText(ctx, (val || (idx === 0 ? 'Player 1' : 'Player 2')) + caret, cx, by + bh / 2, 20,
        val ? CONFIG.BRAND.main : 'rgba(221,238,255,0.4)');
      this.duelNameRects[idx] = { x: bx, y: by, w: bw, h: bh };

      // Colour swatches row
      const sw = 26, gap = 10, total = cols.length * sw + (cols.length - 1) * gap;
      let sx = cx - total / 2;
      const sy = s.next(sw);
      cols.forEach((col) => {
        const sel = this.duelColours[idx] === col;
        ctx.save();
        if (CONFIG.FEATURES.neonTheme && sel) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(sx + sw / 2, sy, sw / 2, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.lineWidth = sel ? 3 : 1;
        ctx.strokeStyle = sel ? CONFIG.BRAND.main : 'rgba(221,238,255,0.3)';
        ctx.stroke();
        ctx.restore();
        this.duelColourRects[idx].push({ x: sx, y: sy - sw / 2, w: sw, h: sw, col });
        sx += sw + gap;
      });
    };
    drawCard(0, 'Player 1 · A / D + Z');
    drawCard(1, 'Player 2 · ← / → + X');

    // Buttons below the cards
    const btnY = firstCardY + 2 * (cardH + cardGap) + 20;
    this.duelStartRect = this.drawButton(ctx, 'Start Duel', cx, btnY, 220, 54, t.moonlight);
    this.duelSetupBackRect = this.drawButton(ctx, 'Back', cx, btnY + 64, 150, 46, t.p2);
    this.renderSpeaker(ctx, w, h);
  }

  /*** LEADERBOARD screen: top scores + recent history, inside panels. ***/
  renderLeaderboard(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2, t = CONFIG.THEME;

    const title = this.makeStack(h * 0.07, 6);
    this.drawText(ctx, 'Leaderboard', cx, title.next(36), 36, t.moonlight);

    const board = Storage.getLeaderboard();
    const recent = Storage.getHistory(null, 5);

    // Top scores panel
    const pW = 340, pX = cx - pW / 2;
    const rows = Math.max(1, Math.min(board.length, 10));
    const topH = 44 + rows * 30;
    const topY = h * 0.15;
    this.drawPanel(ctx, pX, topY, pW, topH);
    const s = this.makeStack(topY + 18, 8);
    this.drawText(ctx, 'Top Scores', cx, s.next(18), 16, t.gold);
    if (!board.length) {
      this.drawText(ctx, 'No scores yet — go play!', cx, s.next(20), 16, CONFIG.BRAND.main);
    } else {
      board.forEach((e, i) => {
        const rowY = s.next(26);
        const col = i === 0 ? t.gold : CONFIG.BRAND.main;
        this.drawText(ctx, `${i + 1}.  ${e.name}`, pX + 22, rowY, 18, col, 'left');
        this.drawText(ctx, `${e.score}`, pX + pW - 22, rowY, 18, col, 'right');
      });
    }

    // Recent games panel
    if (recent.length) {
      const rH = 44 + recent.length * 24;
      const rY = topY + topH + 22;
      this.drawPanel(ctx, pX, rY, pW, rH);
      const r2 = this.makeStack(rY + 18, 6);
      this.drawText(ctx, 'Recent Games', cx, r2.next(18), 16, t.gold);
      recent.forEach(rg => {
        const label = `${rg.name} · ${rg.score} · ${rg.mode}${rg.result ? ' · ' + rg.result : ''}`;
        this.drawText(ctx, label, cx, r2.next(20), 14, CONFIG.BRAND.main);
      });
    }

    this.leaderboardBackRect = this.drawButton(ctx, 'Back', cx, h * 0.92, 180, 50, t.p2);
    this.renderSpeaker(ctx, w, h);
  }

  /*** DUEL render: two stacked halves; top half rotated 180° for the player
   * sitting across the table. Divider + per-player HUD + winner overlay. ***/
  renderDuel(ctx, w, h) {
    const intensity = (this.state === 'duelPlaying' && this.timeLeft <= 10)
      ? (1 - this.timeLeft / 10) : 0;
    this.drawBackground(ctx, w, h, intensity);
    const sideBySide = this.duelLayout() === 'sideBySide';

    this._drawDuelHalf(ctx, 0, w, h);
    this._drawDuelHalf(ctx, 1, w, h);

    // Divider with glow — vertical for side-by-side, horizontal for top/bottom
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = CONFIG.DUEL.dividerColor; ctx.shadowBlur = 20; }
    ctx.strokeStyle = CONFIG.DUEL.dividerColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (sideBySide) { ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); }
    else { ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); }
    ctx.stroke();
    ctx.restore();

    // Shared timer: centre for phone, top-centre for laptop (both upright)
    const secs = Math.ceil(this.timeLeft);
    const tCol = secs <= 10 ? CONFIG.THEME.coral : CONFIG.THEME.moonlight;
    if (sideBySide) this.drawText(ctx, String(secs), w / 2, 28, 30, tCol);
    else this.drawText(ctx, String(secs), w / 2, h / 2, 30, tCol);

    // On-screen ability buttons (touch). One per half; P2's is rotated.
    this.abilityButtons = [null, null];
    if (CONFIG.FEATURES.abilities && this.state === 'duelPlaying') {
      for (let i = 0; i < 2; i++) this._drawAbilityButton(ctx, i, w, h, sideBySide);
    }

    if (this.state === 'duelOver') this.renderDuelOver(ctx, w, h);
    else this.renderSpeaker(ctx, w, h);
  }

  /*** Draw a player's on-screen ability button and store its hitbox (in raw
   * canvas coords, accounting for the rotated half). ***/
  _drawAbilityButton(ctx, index, w, h, sideBySide) {
    const p = this.players[index];
    if (!p || !p.ability) return;
    const r = 30;
    // Place near the player's inner-bottom corner
    let cx, cy;
    if (sideBySide) { cx = index === 0 ? w * 0.5 - 48 : w * 0.5 + 48; cy = h - 60; }
    else { cx = w - 56; cy = index === 0 ? h - 60 : 60; }
    const ready = p.charges > 0 && p.abilityLockout === 0;
    const col = ready ? p.color : 'rgba(221,238,255,0.25)';
    ctx.save();
    // Rotate the glyph for the top player so it faces them
    const zone = this.duelZone(index);
    if (zone.rotated) { ctx.translate(cx, cy); ctx.rotate(Math.PI); ctx.translate(-cx, -cy); }
    if (CONFIG.FEATURES.neonTheme && ready) { ctx.shadowColor = p.color; ctx.shadowBlur = 14; }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,20,40,0.85)'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
    this.drawText(ctx, ready ? '★' : '·', cx, cy, 22, col);
    this.abilityButtons[index] = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
  }

  /*** Draw one duel player's zone: items, basket, HUD. Clipped to the zone.
   * The phone top player (rotated zone) is drawn rotated 180° so it faces the
   * opponent across the table; the laptop layout draws both upright. ***/
  _drawDuelHalf(ctx, index, w, h) {
    const zone = this.duelZone(index);
    const player = this.players[index];
    const sideBySide = zone.layout === 'sideBySide';
    ctx.save();

    // Clip to this player's region
    ctx.beginPath();
    if (sideBySide) {
      if (index === 0) ctx.rect(0, 0, w / 2, h); else ctx.rect(w / 2, 0, w / 2, h);
    } else {
      if (index === 0) ctx.rect(0, h / 2, w, h / 2); else ctx.rect(0, 0, w, h / 2);
    }
    ctx.clip();

    // Rotate the phone top player's view 180°
    if (zone.rotated) {
      const mid = h / 2;
      ctx.translate(w / 2, mid / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-w / 2, -mid / 2);
    }

    // Red flash over this player's region
    if (player.redFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${0.4 * (player.redFlash / 0.2)})`;
      if (sideBySide) ctx.fillRect(index === 0 ? 0 : w / 2, 0, w / 2, h);
      else ctx.fillRect(0, index === 0 ? h / 2 : 0, w, h / 2);
    }

    // Fallers
    for (const f of this.fallers) {
      if (f.half !== index) continue;
      ctx.save();
      if (f.def.type === 'good') { ctx.translate(f.x, f.y); ctx.rotate(f.spin); ctx.drawImage(f.img, -f.w / 2, -f.h / 2, f.w, f.h); }
      else { const wob = Math.sin(f.wobblePhase) * 8; ctx.drawImage(f.img, f.x - f.w / 2 + wob, f.y - f.h / 2, f.w, f.h); }
      ctx.restore();
    }

    // Bursts (filter by rough region) + floaters for this player
    for (const b of this.bursts) {
      const inRegion = sideBySide
        ? (index === 0 ? b.x < w / 2 : b.x >= w / 2)
        : (index === 0 ? b.y >= h / 2 : b.y < h / 2);
      if (!inRegion) continue;
      const p = b.t / b.life, bw = b.fromW + (b.toW - b.fromW) * p;
      const bh = (b.img.naturalHeight / b.img.naturalWidth) * bw;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.drawImage(b.img, b.x - bw / 2, b.y - bh / 2, bw, bh); ctx.restore();
    }
    for (const f of this.floaters) {
      if (f.half !== index) continue;
      const p = f.t / f.life;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p);
      this.drawText(ctx, f.text, f.x, f.y - 30 * p, 22, player.color);
      ctx.restore();
    }

    // Catcher at the zone's fixed row. Draw the original chomper character
    // (or fall back to the basket image if the chomper feature is off).
    const sq = player.squash / 0.1 || 0;
    const shrinkMul = (player.effect && player.effect.id === 'shrink') ? player.effect.widthMul : 1;
    const catchW = CONFIG.PLAYER.width * CONFIG.DUEL.chomperScale * shrinkMul;
    if (CONFIG.FEATURES.chomper) {
      const radius = (catchW / 2) * (1 + 0.12 * sq);
      // Mouth opens toward the incoming items (up for bottom player, down when rotated handled by view)
      this.drawChomper(ctx, player.x, zone.fixed, radius, player.color,
        { facing: 'up', snap: sq * 0.5 });
    } else {
      const img = this.assets.basket;
      const bwid = catchW * (1 + 0.18 * sq);
      const bhei = (img.naturalHeight / img.naturalWidth) * bwid * (1 - 0.22 * sq);
      ctx.save();
      if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = player.color; ctx.shadowBlur = 18; }
      ctx.drawImage(img, player.x - bwid / 2, zone.fixed - bhei / 2, bwid, bhei);
      ctx.restore();
    }

    // Incoming attack cue: a brief directional flash across this lane
    if (player.incoming > 0) {
      const a = 0.35 * (player.incoming / CONFIG.ABILITIES.incomingSeconds);
      ctx.fillStyle = `rgba(240,127,139,${a})`;
      if (sideBySide) ctx.fillRect(index === 0 ? 0 : w / 2, 0, w / 2, h);
      else ctx.fillRect(0, index === 0 ? h / 2 : 0, w, h / 2);
      this.drawText(ctx, 'INCOMING!', player.x, zone.fixed - 70, 20, CONFIG.THEME.coral);
    }
    // Active effect label so the target understands the change
    if (player.effect) {
      this.drawText(ctx, player.effect.name.toUpperCase(), player.x, zone.fixed - 70, 18, CONFIG.THEME.coral);
    }

    // Per-player HUD near the far (outer) edge of their zone
    let hudX, hudY;
    if (sideBySide) {
      hudX = index === 0 ? 14 : w / 2 + 14;
      this.drawText(ctx, player.name, hudX, h - 82, 18, player.color, 'left');
      this.drawText(ctx, `Score ${player.score}`, hudX, h - 56, 22, CONFIG.BRAND.main, 'left');
      this.drawText(ctx, '♥'.repeat(Math.max(0, player.lives)),
        index === 0 ? w / 2 - 14 : w - 14, h - 70, 20, CONFIG.THEME.coral, 'right');
      hudY = h - 30;
    } else {
      const baseY = index === 0 ? (h / 2 + 8) : (h / 2 - 8);
      this.drawText(ctx, player.name, 14, baseY + 14, 20, player.color, 'left');
      this.drawText(ctx, `Score ${player.score}`, 14, baseY + 42, 24, CONFIG.BRAND.main, 'left');
      this.drawText(ctx, '♥'.repeat(Math.max(0, player.lives)), w - 14, baseY + 20, 22, CONFIG.THEME.coral, 'right');
      hudY = baseY + 70;
    }

    // Ability HUD: the owner sees their ability name + charge pips.
    if (CONFIG.FEATURES.abilities && player.ability) {
      this.drawText(ctx, player.ability.name, hudX ?? 14, hudY, 15, player.color, 'left');
      // charge pips
      const pipX0 = (hudX ?? 14);
      for (let c = 0; c < CONFIG.ABILITIES.charges; c++) {
        const filled = c < player.charges;
        ctx.save();
        if (CONFIG.FEATURES.neonTheme && filled) { ctx.shadowColor = player.color; ctx.shadowBlur = 10; }
        ctx.beginPath();
        ctx.arc(pipX0 + 8 + c * 20, hudY + 20, 7, 0, Math.PI * 2);
        ctx.fillStyle = filled ? player.color : 'rgba(221,238,255,0.2)';
        ctx.fill();
        ctx.restore();
      }
      // Lockout hint
      if (player.abilityLockout > 0) {
        this.drawText(ctx, `${Math.ceil(player.abilityLockout)}s`, pipX0 + 8 + CONFIG.ABILITIES.charges * 20 + 6, hudY + 20, 13, 'rgba(221,238,255,0.6)', 'left');
      }
      // The rival's mystery indicator is shown in the opponent's own oriented
      // HUD only (we don't reveal the type), so nothing else to draw here.
    }

    ctx.restore();
  }

  /*** DUEL COUNTDOWN overlay: 3-2-1, plus each player's secret ability card
   * shown only in their own oriented half (casual social privacy). ***/
  renderDuelCountdown(ctx, w, h) {
    const sideBySide = this.duelLayout() === 'sideBySide';
    ctx.fillStyle = 'rgba(5,10,19,0.72)';
    ctx.fillRect(0, 0, w, h);

    // Per-player ability reveal in their own oriented region
    for (let i = 0; i < 2; i++) {
      const p = this.players[i];
      if (!CONFIG.FEATURES.abilities || !p.ability) continue;
      ctx.save();
      const zone = this.duelZone(i);
      if (zone.rotated) { ctx.translate(w / 2, h / 4); ctx.rotate(Math.PI); ctx.translate(-w / 2, -h / 4); }
      let cx, cy;
      if (sideBySide) { cx = i === 0 ? w * 0.25 : w * 0.75; cy = h * 0.4; }
      else { cx = w / 2; cy = i === 0 ? h * 0.72 : h * 0.28; }
      this.drawText(ctx, p.name, cx, cy - 54, 20, p.color);
      this.drawText(ctx, 'Your ability', cx, cy - 26, 15, CONFIG.BRAND.main);
      this.drawText(ctx, p.ability.name, cx, cy + 4, 24, p.color);
      this.drawText(ctx, p.ability.desc, cx, cy + 34, 13, CONFIG.BRAND.main);
      this.drawText(ctx, `${CONFIG.ABILITIES.charges} charges`, cx, cy + 58, 14, CONFIG.THEME.gold);
      ctx.restore();
    }

    // Big 3-2-1 in the middle
    const n = Math.ceil(this.countdownLeft);
    const pulse = 1 + 0.2 * (1 - (this.countdownLeft % 1));
    this.drawText(ctx, String(n), w / 2, h / 2, 72 * pulse, CONFIG.THEME.moonlight);
    const keys = sideBySide ? 'P1: A/D + Z    P2: ←/→ + X' : 'Drag your half · tap your ability button';
    this.drawText(ctx, keys, w / 2, h / 2 + 70, 15, CONFIG.BRAND.main);
  }

  /*** DUEL OVER overlay: teases the winner over the loser. ***/
  renderDuelOver(ctx, w, h) {
    ctx.fillStyle = 'rgba(3,6,15,0.82)';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const [p1, p2] = this.players;

    if (this.duelWinner === -1) {
      this.drawText(ctx, "IT'S A TIE!", cx, cy - 140, 46, CONFIG.THEME.moonlight);
    } else {
      const win = this.players[this.duelWinner];
      const lose = this.players[this.duelWinner === 0 ? 1 : 0];
      const bounce = Math.abs(Math.sin(this.elapsed * 5)) * 8;
      this.drawText(ctx, `${win.name} WINS!`, cx, cy - 150 - bounce, 48, win.color);
      // Teasing line
      const margin = win.score - lose.score;
      const taunts = [
        `${lose.name}, maybe next time!`,
        `${win.name} left ${lose.name} in the dust.`,
        `${margin} points of pure bragging rights.`,
      ];
      const taunt = taunts[Math.floor(this.elapsed) % taunts.length];
      this.drawText(ctx, taunt, cx, cy - 100, 18, CONFIG.BRAND.main);
    }

    // Score comparison
    this.drawText(ctx, `${p1.name}`, cx - 90, cy - 40, 20, p1.color);
    this.drawText(ctx, `${p1.score}`, cx - 90, cy, 40, CONFIG.BRAND.main);
    this.drawText(ctx, 'vs', cx, cy - 10, 22, CONFIG.THEME.moonlight);
    this.drawText(ctx, `${p2.name}`, cx + 90, cy - 40, 20, p2.color);
    this.drawText(ctx, `${p2.score}`, cx + 90, cy, 40, CONFIG.BRAND.main);

    // Lives + ability usage summary
    const max = CONFIG.ABILITIES.charges;
    const used = p => CONFIG.FEATURES.abilities ? (max - (p.charges ?? max)) : 0;
    this.drawText(ctx, `♥ ${Math.max(0, p1.lives)}   ability ${used(p1)}/${max}`, cx - 90, cy + 38, 14, CONFIG.BRAND.main);
    this.drawText(ctx, `♥ ${Math.max(0, p2.lives)}   ability ${used(p2)}/${max}`, cx + 90, cy + 38, 14, CONFIG.BRAND.main);

    this.duelRematchRect = this.drawButton(ctx, 'Rematch', cx, cy + 100, 200, 58, CONFIG.THEME.moonlight);
    this.duelMenuRect = this.drawButton(ctx, 'Menu', cx, cy + 168, 160, 50, CONFIG.THEME.p2);
  }

  /*** Coach mark: a "Drag to move" hint with an animated arrow, shown on the
   * first round until the first catch. Gated by FEATURES.coachMark. ***/
  renderCoachMark(ctx, w, h) {
    if (this.coachMarkDone) return;
    const cx = w / 2;
    const y = h * 0.62;
    const bob = Math.sin(this.elapsed * 4) * 10; // gentle left-right motion
    this.drawText(ctx, 'Drag to move', cx, y, 26, CONFIG.BRAND.accent);
    // Simple arrow drawn under the text, sliding side to side
    ctx.save();
    ctx.strokeStyle = CONFIG.BRAND.main;
    ctx.fillStyle = CONFIG.BRAND.main;
    ctx.lineWidth = 4;
    const ax = cx + bob, ay = y + 34;
    ctx.beginPath();
    ctx.moveTo(ax - 40, ay);
    ctx.lineTo(ax + 40, ay);
    ctx.stroke();
    // arrow heads both ends
    ctx.beginPath();
    ctx.moveTo(ax - 40, ay); ctx.lineTo(ax - 28, ay - 8); ctx.lineTo(ax - 28, ay + 8);
    ctx.moveTo(ax + 40, ay); ctx.lineTo(ax + 28, ay - 8); ctx.lineTo(ax + 28, ay + 8);
    ctx.fill();
    ctx.restore();
  }

  /*** PAUSE overlay ***/
  renderPause(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    this.drawText(ctx, 'Paused', w / 2, h / 2 - 20, 48, CONFIG.BRAND.main);
    this.drawText(ctx, 'Press P or tap to continue', w / 2, h / 2 + 30, 22, CONFIG.BRAND.accent);
  }

  /*** HUD: score, lives, timer ***/
  renderHUD(ctx, w, h) {
    // Score top-left: bold 28px (BRAND colour) with dark outline
    ctx.font = `bold 28px ${CONFIG.BRAND.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = CONFIG.BRAND.main;
    const label = `Score: ${this.score}`;
    ctx.strokeText(label, 16, 16);
    ctx.fillText(label, 16, 16);

    // Lives top-right: hearts, 34px wide, small gap
    const heartW = 34;
    const gap = 6;
    const heartImg = this.assets.heart;
    const heartH = (heartImg.naturalHeight / heartImg.naturalWidth) * heartW;
    for (let i = 0; i < CONFIG.RULES.lives; i++) {
      const src = i < this.lives ? this.assets.heart : this.assets.heartEmpty;
      // right-aligned, first heart on the far right
      const hx = w - 16 - (i + 1) * heartW - i * gap;
      ctx.drawImage(src, hx, 16, heartW, heartH);
    }

    // Timer top-centre: clock icon + seconds left
    const clock = this.assets.clock;
    const clockW = 30;
    const clockH = (clock.naturalHeight / clock.naturalWidth) * clockW;
    const secs = Math.ceil(this.timeLeft);
    const low = secs <= 10;
    // Pulse the number in the last 10 seconds
    ctx.font = `bold 28px ${CONFIG.BRAND.font}`;
    const numStr = String(secs);
    const numW = ctx.measureText(numStr).width;
    const groupW = clockW + 6 + numW;
    const startX = (w - groupW) / 2;
    ctx.drawImage(clock, startX, 16, clockW, clockH);
    let scale = 1;
    if (low) scale = 1 + 0.12 * Math.abs(Math.sin(performance.now() / 150));
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const numX = startX + clockW + 6;
    ctx.translate(numX, 16);
    ctx.scale(scale, scale);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = low ? '#ff3b3b' : CONFIG.BRAND.main;
    ctx.strokeText(numStr, 0, 0);
    ctx.fillText(numStr, 0, 0);
    ctx.restore();

    // Active power-ups: icon + shrinking bar under the score
    const iconW = CONFIG.POWERUPS.iconWidth;
    let ey = 54; // just under the score text
    for (const key of Object.keys(this.effects)) {
      const eff = this.effects[key];
      const ih = (eff.icon.naturalHeight / eff.icon.naturalWidth) * iconW;
      ctx.drawImage(eff.icon, 16, ey, iconW, ih);
      // bar
      const barX = 16 + iconW + 8;
      const barY = ey + ih / 2 - 5;
      const barW = 90, barH = 10;
      const frac = Math.max(0, eff.timeLeft / eff.duration);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = key === 'double' ? CONFIG.BRAND.accent : '#5bc8ff';
      ctx.fillRect(barX, barY, barW * frac, barH);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);
      ey += Math.max(ih, barH) + 8;
    }

    this.renderSpeaker(ctx, w, h);
  }

  /*** Speaker icon bottom-right (also a tap target for mute) ***/
  renderSpeaker(ctx, w, h) {
    const spSize = 40;
    const spx = w - spSize - 12;
    const spy = h - spSize - 12;
    this.speakerRect = { x: spx, y: spy, w: spSize, h: spSize };
    ctx.font = `30px ${CONFIG.BRAND.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CONFIG.BRAND.main;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    const spIcon = this.muted ? '🔇' : '🔊';
    ctx.strokeText(spIcon, spx + spSize / 2, spy + spSize / 2);
    ctx.fillText(spIcon, spx + spSize / 2, spy + spSize / 2);
  }

  /*** GAME OVER overlay: trophy, score, best, restart + menu ***/
  renderGameOver(ctx, w, h) {
    const cx = w / 2;
    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    // Trophy (90px) above the score
    const tr = this.assets.trophy;
    const trW = 90;
    const trH = (tr.naturalHeight / tr.naturalWidth) * trW;
    const trY = h * 0.18;
    ctx.drawImage(tr, cx - trW / 2, trY, trW, trH);

    this.drawText(ctx, 'GAME OVER', cx, trY + trH + 46, 52, CONFIG.BRAND.main);
    this.drawText(ctx, this.overReason, cx, trY + trH + 92, 26, CONFIG.BRAND.main);
    this.drawText(ctx, `Score: ${this.score}`, cx, trY + trH + 140, 36, CONFIG.BRAND.accent);

    // NEW BEST! with a little bounce, else show Best
    if (this.newBest) {
      const bounce = Math.abs(Math.sin(this.elapsed * 6)) * 6;
      this.drawText(ctx, 'NEW BEST!', cx, trY + trH + 184 - bounce, 30, CONFIG.BRAND.accent);
    } else {
      this.drawText(ctx, `Best: ${this.best}`, cx, trY + trH + 184, 26, CONFIG.BRAND.main);
    }

    // Restart button image (100px)
    const rb = this.assets.restartButton;
    const rbW = 100;
    const rbH = (rb.naturalHeight / rb.naturalWidth) * rbW;
    const rbX = cx - rbW / 2;
    const rbY = trY + trH + 220;
    ctx.drawImage(rb, rbX, rbY, rbW, rbH);
    this.restartRect = { x: rbX, y: rbY, w: rbW, h: rbH };

    // Menu text button below
    const menuY = rbY + rbH + 34;
    this.drawText(ctx, 'Menu', cx, menuY, 24, CONFIG.BRAND.main);
    const mw = 120, mh = 40;
    this.menuRect = { x: cx - mw / 2, y: menuY - mh / 2, w: mw, h: mh };
  }
}

// Kick‑off the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => new Game());
