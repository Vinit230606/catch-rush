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
    neonTheme: true,     // moonlight-blue neon look with glow
    duel: true,          // enable Duel mode (local 2-player + phone split-screen)
    profiles: true,      // register players, keep history + leaderboard on device
  },

  // ----- BRAND (theme the whole game from here) -----
  // Neon night palette: black base, moonlight blue, electric cyan accent.
  BRAND: {
    title: "Catch Rush",                              // shown on the logo badge
    tagline: "Catch the stars. Dodge the bombs.",     // start-screen subtitle
    hook: "Beat your best in 45 seconds.",            // one-line hook on the menu
    font: "sans-serif",                               // font family for ALL text
    main: "#dbe7ff",                                  // main text colour (moonlight white-blue)
    accent: "#5ad7ff",                                // accent / highlight colour (electric cyan)
  },

  // ----- THEME (neon look; used when FEATURES.neonTheme is on) -----
  THEME: {
    bgTop: "#060912",        // deep near-black (top of backdrop gradient)
    bgBottom: "#0d1a33",     // moonlight-blue navy (bottom of gradient)
    moonlight: "#8ab4f8",    // moonlight blue
    cyan: "#5ad7ff",         // electric cyan accent
    glow: "#5ad7ff",         // glow colour for text/sprites
    glowBlur: 16,            // shadowBlur used for the neon glow
    p1: "#5ad7ff",           // duel player 1 colour (cyan)
    p2: "#c08bff",           // duel player 2 colour (violet, complements cyan)
    grid: "rgba(138,180,248,0.08)", // faint grid lines on the backdrop
  },

  // ----- DUEL (local 2-player) -----
  DUEL: {
    roundSeconds: 45,        // duel round length (s)
    lives: 5,                // lives each (shared rules, a bit more forgiving)
    winBy: "score",          // highest score at time-up wins
    dividerColor: "#5ad7ff", // divider line between the two halves
    // Layout: "auto" picks side-by-side on landscape (laptop) and top/bottom
    // on portrait (phone). Force with "sideBySide" or "topBottom".
    layout: "auto",
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
      color: index === 0 ? t.p1 : t.p2,
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
    this.state = 'duelPlaying';
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
        case 'duelPlaying': {
          // Each touch controls the basket in the half it belongs to.
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

    // Menu-like screens animate decorative fallers only
    if (this.state === 'start' || this.state === 'menu' ||
        this.state === 'register' || this.state === 'leaderboard' ||
        this.state === 'duelSetup') {
      for (const d of this.decor) { d.y += d.speed * dt; d.spin += dt; }
      this.decor = this.decor.filter(d => d.y - d.h / 2 <= CONFIG.CANVAS_HEIGHT);
      while (this.decor.length < 6) this.spawnDecor(false);
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

    // Keyboard movement. p1 = A/D, p2 = arrows. In side-by-side both move
    // left/right normally. In top/bottom, p2 is rotated so we flip them.
    const z2 = this.duelZone(1);
    const moveAlong = (player, zone, neg, pos) => {
      let d = 0;
      if (this.keysDown[neg]) d -= 1;
      if (this.keysDown[pos]) d += 1;
      if (zone.rotated) d = -d; // rotated view: invert control direction
      player.pos = Math.max(zone.min, Math.min(zone.max, (player.pos ?? player.x) + d * speed * dt));
      player.x = player.pos;
    };
    moveAlong(p1, this.duelZone(0), 'p1left', 'p1right');
    moveAlong(p2, z2, 'p2left', 'p2right');

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

    // Spawn one item per player per interval
    const progress = 1 - (this.timeLeft / CONFIG.DUEL.roundSeconds);
    const curInterval = CONFIG.RULES.spawnIntervalStart +
      (CONFIG.RULES.spawnIntervalEnd - CONFIG.RULES.spawnIntervalStart) * progress;
    this.spawnTimer += dt;
    while (this.spawnTimer >= curInterval) {
      this.spawnTimer -= curInterval;
      this.spawnDuelItem(0);
      this.spawnDuelItem(1);
    }

    // Move + collide fallers (always fall vertically toward the basket row)
    const rampMul = 1 + (CONFIG.RULES.fallSpeedRampMax - 1) * progress;
    const H = CONFIG.CANVAS_HEIGHT;
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i];
      const zone = this.duelZone(f.half);
      f.y += f.speed * rampMul * dt * zone.fallDir;
      if (f.def.type === 'good') f.spin += dt * 2; else f.wobblePhase += dt * 6;

      const player = this.players[f.half];
      const bHalfW = (CONFIG.PLAYER.width * 0.7) / 2;
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

  /*** Spawn one star/bomb into a given player's zone. ***/
  spawnDuelItem(half) {
    const zone = this.duelZone(half);
    const pool = CONFIG.items.filter(it => it.type === 'good' || it.type === 'bad');
    const tw = pool.reduce((s, it) => s + it.weight, 0);
    let r = Math.random() * tw, def = pool[pool.length - 1];
    for (const it of pool) { r -= it.weight; if (r <= 0) { def = it; break; } }
    const img = this.assets.items[def.name];
    const w = def.width;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    // x within the zone's spawn range, clamped so the sprite stays on screen
    const lo = zone.spawnMin + w / 2, hi = zone.spawnMax - w / 2;
    const x = Math.max(w / 2, Math.min(CONFIG.CANVAS_WIDTH - w / 2, lo + Math.random() * Math.max(1, hi - lo)));
    const speed = CONFIG.RULES.fallSpeedMin +
      Math.random() * (CONFIG.RULES.fallSpeedMax - CONFIG.RULES.fallSpeedMin);
    const y = zone.fallDir > 0 ? -h / 2 : CONFIG.CANVAS_HEIGHT + h / 2;
    this.fallers.push({ def, img, w, h, x, y, speed, spin: 0, wobblePhase: Math.random() * Math.PI * 2, half });
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
    if (this.state === 'duelPlaying' || this.state === 'duelOver') { this.renderDuel(ctx, w, h); return; }

    // Screen shake: offset the whole world while shakeTime is active
    ctx.save();
    if (this.shakeTime > 0) {
      const mag = 10 * (this.shakeTime / 0.25);
      ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
    }

    // Draw background (cover-fill, centred)
    this.drawBackground(ctx, w, h);
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

  /*** Helper: cover-fill the background across the whole canvas.
   * With the neon theme, draw the image then overlay a moonlight gradient and
   * a faint grid so the world reads as a cool neon night. ***/
  drawBackground(ctx, w, h) {
    const bg = this.assets.background;
    const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
    const bgW = bg.naturalWidth * scale;
    const bgH = bg.naturalHeight * scale;
    ctx.drawImage(bg, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);

    if (CONFIG.FEATURES.neonTheme) {
      const t = CONFIG.THEME;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, this._hexA(t.bgTop, 0.82));
      g.addColorStop(1, this._hexA(t.bgBottom, 0.72));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // faint grid
      ctx.strokeStyle = t.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 45) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 45) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    }
  }

  /*** Flat neon backdrop (no sprite) for menu-style screens. ***/
  drawNeonBackdrop(ctx, w, h) {
    const t = CONFIG.THEME;
    if (CONFIG.FEATURES.neonTheme) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, t.bgTop);
      g.addColorStop(1, t.bgBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = t.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 45) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 45) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, w, h);
    }
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

  /*** START SCREEN ***/
  renderStart(ctx, w, h) {
    this.drawBackground(ctx, w, h);

    // Decorative stars/bombs drifting behind
    for (const d of this.decor) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.translate(d.x, d.y);
      ctx.rotate(d.spin);
      ctx.drawImage(d.img, -d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }

    // Logo badge (340px) in the upper third with the title on it
    const logo = this.assets.logo;
    const logoW = 340;
    const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
    const logoX = (w - logoW) / 2;
    const logoY = h * 0.14;
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);

    // Title text fitted inside the badge
    const cx = w / 2;
    const titleY = logoY + logoH / 2;
    let titleSize = 48;
    ctx.font = `bold ${titleSize}px ${CONFIG.BRAND.font}`;
    while (ctx.measureText(CONFIG.BRAND.title).width > logoW * 0.8 && titleSize > 20) {
      titleSize -= 2;
      ctx.font = `bold ${titleSize}px ${CONFIG.BRAND.font}`;
    }
    this.drawText(ctx, CONFIG.BRAND.title, cx, titleY, titleSize, CONFIG.BRAND.main);

    // Tagline under the badge
    this.drawText(ctx, CONFIG.BRAND.tagline, cx, logoY + logoH + 28, 22, CONFIG.BRAND.accent);

    // One-line hook + Best score (gives a reason to care)
    let infoY = logoY + logoH + 62;
    if (CONFIG.BRAND.hook) {
      this.drawText(ctx, CONFIG.BRAND.hook, cx, infoY, 20, CONFIG.BRAND.main);
      infoY += 32;
    }
    if (this.best > 0) {
      this.drawText(ctx, `Best: ${this.best}`, cx, infoY, 24, CONFIG.BRAND.accent);
    }

    // Pulsing play button (1.0 -> 1.08)
    const pulse = 1 + 0.04 + 0.04 * Math.sin(this.elapsed * 3);
    const pb = this.assets.playButton;
    const pbW = 120 * pulse;
    const pbH = (pb.naturalHeight / pb.naturalWidth) * pbW;
    const pbX = cx - pbW / 2;
    const pbY = h * 0.52 - pbH / 2;
    ctx.drawImage(pb, pbX, pbY, pbW, pbH);
    // Fixed hitbox (unscaled) for reliable tapping
    const baseW = 120, baseH = (pb.naturalHeight / pb.naturalWidth) * baseW;
    this.playRect = { x: cx - baseW / 2, y: h * 0.52 - baseH / 2, w: baseW, h: baseH };

    // How-to-play line near the bottom (bigger, 22px)
    const howTo = CONFIG.FEATURES.duel
      ? 'Tap anywhere to choose a mode.'
      : (CONFIG.FEATURES.tapAnywhereStart
          ? 'Tap anywhere to start. Catch stars, dodge bombs.'
          : 'Move: arrows / drag. Catch stars. Dodge bombs.');
    this.drawText(ctx, howTo, cx, h - 58, 22, CONFIG.BRAND.main);

    // Speaker toggle still available on the menu
    this.renderSpeaker(ctx, w, h);
  }

  /*** MODE-SELECT MENU: Classic / Duel / Leaderboard / Register ***/
  renderMenu(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2;
    this.drawText(ctx, CONFIG.BRAND.title, cx, h * 0.16, 46, CONFIG.THEME.cyan);
    this.drawText(ctx, 'Choose a mode', cx, h * 0.24, 22, CONFIG.BRAND.main);

    this.menuButtons = {};
    this.menuButtons.classic = this.drawButton(ctx, 'Classic', cx, h * 0.38, 240, 60, CONFIG.THEME.cyan);
    if (CONFIG.FEATURES.duel) {
      this.menuButtons.duel = this.drawButton(ctx, 'Duel (2 players)', cx, h * 0.50, 240, 60, CONFIG.THEME.p2);
    }
    this.menuButtons.leaderboard = this.drawButton(ctx, 'Leaderboard', cx, h * 0.62, 240, 56, CONFIG.THEME.moonlight);
    if (CONFIG.FEATURES.profiles) {
      this.menuButtons.register = this.drawButton(ctx, 'Register player', cx, h * 0.73, 240, 56, CONFIG.THEME.moonlight);
    }

    // Duel hint
    this.drawText(ctx, 'Duel: P1 = A / D   •   P2 = ← / →', cx, h * 0.85, 17, CONFIG.BRAND.main);
    this.drawText(ctx, 'On phone, sit on opposite sides.', cx, h * 0.885, 15, CONFIG.THEME.moonlight);

    this.renderSpeaker(ctx, w, h);
  }

  /*** REGISTER screen: type a name, Enter to save. ***/
  renderRegister(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2;
    this.drawText(ctx, 'Register player', cx, h * 0.2, 36, CONFIG.THEME.cyan);
    this.drawText(ctx, 'Type a name, then press Enter', cx, h * 0.28, 18, CONFIG.BRAND.main);

    // Input box with a blinking caret
    const bw = 300, bh = 60, bx = cx - bw / 2, by = h * 0.36;
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = CONFIG.THEME.cyan; ctx.shadowBlur = CONFIG.THEME.glowBlur; }
    ctx.fillStyle = 'rgba(10,20,40,0.85)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = CONFIG.THEME.cyan;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
    const caret = (Math.floor(this.elapsed * 2) % 2 === 0) ? '|' : '';
    this.drawText(ctx, (this.nameBuffer || 'Enter name') + caret, cx, by + bh / 2, 26,
      this.nameBuffer ? CONFIG.BRAND.main : 'rgba(219,231,255,0.4)');

    // Existing players
    const profs = Storage.getProfiles();
    if (profs.length) {
      this.drawText(ctx, 'Saved: ' + profs.slice(0, 6).join(', '), cx, by + bh + 40, 16, CONFIG.THEME.moonlight);
    }

    this.registerBackRect = this.drawButton(ctx, 'Back', cx, h * 0.8, 180, 52, CONFIG.THEME.moonlight);
    this.renderSpeaker(ctx, w, h);
  }

  /*** DUEL SETUP: both players type their names before the match. ***/
  renderDuelSetup(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2;
    const t = CONFIG.THEME;
    this.drawText(ctx, 'Duel setup', cx, h * 0.12, 40, t.cyan);
    this.drawText(ctx, 'Enter player names', cx, h * 0.19, 20, CONFIG.BRAND.main);

    this.duelNameRects = [];
    const drawField = (idx, label, yFrac, color) => {
      this.drawText(ctx, label, cx, h * yFrac - 36, 20, color);
      const bw = 300, bh = 58, bx = cx - bw / 2, by = h * yFrac - bh / 2;
      const active = this.duelNameActive === idx;
      ctx.save();
      if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = color; ctx.shadowBlur = active ? CONFIG.THEME.glowBlur : 6; }
      ctx.fillStyle = 'rgba(10,20,40,0.85)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.lineWidth = active ? 3.5 : 2;
      ctx.strokeStyle = color;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
      const caret = (active && Math.floor(this.elapsed * 2) % 2 === 0) ? '|' : '';
      const val = this.duelNames[idx];
      this.drawText(ctx, (val || (idx === 0 ? 'Player 1' : 'Player 2')) + caret, cx, by + bh / 2, 24,
        val ? CONFIG.BRAND.main : 'rgba(219,231,255,0.4)', 'center', color);
      this.duelNameRects[idx] = { x: bx, y: by, w: bw, h: bh };
    };

    drawField(0, 'Player 1  (A / D)', 0.34, t.p1);
    drawField(1, 'Player 2  (← / →)', 0.50, t.p2);

    const layoutLabel = this.duelLayout() === 'sideBySide'
      ? 'Laptop: side-by-side screen'
      : 'Phone: split screen, sit opposite';
    this.drawText(ctx, layoutLabel, cx, h * 0.60, 16, t.moonlight);

    this.duelStartRect = this.drawButton(ctx, 'Start Duel', cx, h * 0.72, 220, 60, t.cyan);
    this.duelSetupBackRect = this.drawButton(ctx, 'Back', cx, h * 0.83, 160, 50, t.moonlight);
    this.drawText(ctx, 'Tip: Tab switches fields, Enter confirms', cx, h * 0.90, 14, CONFIG.BRAND.main);
    this.renderSpeaker(ctx, w, h);
  }

  /*** LEADERBOARD screen: top scores + recent history. ***/
  renderLeaderboard(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
    const cx = w / 2;
    this.drawText(ctx, 'Leaderboard', cx, h * 0.12, 40, CONFIG.THEME.cyan);

    const board = Storage.getLeaderboard();
    let y = h * 0.22;
    if (!board.length) {
      this.drawText(ctx, 'No scores yet. Go play!', cx, y, 20, CONFIG.BRAND.main);
    } else {
      board.forEach((e, i) => {
        const col = i === 0 ? CONFIG.THEME.cyan : CONFIG.BRAND.main;
        this.drawText(ctx, `${i + 1}. ${e.name}`, w * 0.2, y, 22, col, 'left');
        this.drawText(ctx, `${e.score}`, w * 0.8, y, 22, col, 'right');
        y += 36;
      });
    }

    // Recent games
    const recent = Storage.getHistory(null, 5);
    if (recent.length) {
      y += 16;
      this.drawText(ctx, 'Recent games', cx, y, 20, CONFIG.THEME.moonlight); y += 30;
      recent.forEach(r => {
        const label = `${r.name} · ${r.score} · ${r.mode}${r.result ? ' · ' + r.result : ''}`;
        this.drawText(ctx, label, cx, y, 15, CONFIG.BRAND.main); y += 24;
      });
    }

    this.leaderboardBackRect = this.drawButton(ctx, 'Back', cx, h * 0.9, 180, 52, CONFIG.THEME.moonlight);
    this.renderSpeaker(ctx, w, h);
  }

  /*** DUEL render: two stacked halves; top half rotated 180° for the player
   * sitting across the table. Divider + per-player HUD + winner overlay. ***/
  renderDuel(ctx, w, h) {
    this.drawNeonBackdrop(ctx, w, h);
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
    const tCol = secs <= 10 ? '#ff6b6b' : CONFIG.THEME.cyan;
    if (sideBySide) this.drawText(ctx, String(secs), w / 2, 28, 30, tCol);
    else this.drawText(ctx, String(secs), w / 2, h / 2, 30, tCol);

    if (this.state === 'duelOver') this.renderDuelOver(ctx, w, h);
    else this.renderSpeaker(ctx, w, h);
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

    // Basket at the zone's fixed row, with a coloured glow
    const img = this.assets.basket;
    const sq = player.squash / 0.1 || 0;
    const bwid = CONFIG.PLAYER.width * (1 + 0.18 * sq);
    const bhei = (img.naturalHeight / img.naturalWidth) * bwid * (1 - 0.22 * sq);
    const by = zone.fixed - bhei / 2;
    ctx.save();
    if (CONFIG.FEATURES.neonTheme) { ctx.shadowColor = player.color; ctx.shadowBlur = 18; }
    ctx.drawImage(img, player.x - bwid / 2, by, bwid, bhei);
    ctx.restore();

    // Per-player HUD near the far (outer) edge of their zone
    let nameX, nameY, scoreY, livesX, livesY;
    if (sideBySide) {
      nameX = index === 0 ? 14 : w / 2 + 14;
      nameY = h - 70; scoreY = h - 44;
      livesX = index === 0 ? w / 2 - 14 : w - 14; livesY = h - 58;
      this.drawText(ctx, player.name, nameX, nameY, 18, player.color, 'left');
      this.drawText(ctx, `Score ${player.score}`, nameX, scoreY, 22, CONFIG.BRAND.main, 'left');
      this.drawText(ctx, '♥'.repeat(Math.max(0, player.lives)), livesX, livesY, 20, '#ff6b8b', 'right');
    } else {
      const baseY = index === 0 ? (h / 2 + 8) : (h / 2 - 8);
      this.drawText(ctx, player.name, 14, baseY + 14, 20, player.color, 'left');
      this.drawText(ctx, `Score ${player.score}`, 14, baseY + 42, 24, CONFIG.BRAND.main, 'left');
      this.drawText(ctx, '♥'.repeat(Math.max(0, player.lives)), w - 14, baseY + 20, 22, '#ff6b8b', 'right');
    }

    ctx.restore();
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

    this.duelRematchRect = this.drawButton(ctx, 'Rematch', cx, cy + 90, 200, 58, CONFIG.THEME.cyan);
    this.duelMenuRect = this.drawButton(ctx, 'Menu', cx, cy + 160, 160, 50, CONFIG.THEME.moonlight);
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
