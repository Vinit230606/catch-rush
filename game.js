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

  // ----- BRAND (theme the whole game from here) -----
  BRAND: {
    title: "Catch Rush",                              // shown on the logo badge
    tagline: "Catch the stars. Dodge the bombs.",     // start-screen subtitle
    font: "sans-serif",                               // font family for ALL text
    main: "#ffffff",                                  // main text colour
    accent: "#ffd23f",                                // accent / highlight colour
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

/*** Helper: load an image, return a Promise ***/
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
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
    this.state = 'start';             // "start" | "playing" | "paused" | "over"
    this.lives = CONFIG.RULES.lives;
    this.timeLeft = CONFIG.RULES.roundSeconds;
    this.overReason = '';
    this.shakeTime = 0;               // seconds left of screen shake
    this.best = this.loadBest();
    this.newBest = false;             // did this round beat the best?
    this.elapsed = 0;                 // total seconds, for animations/pulsing

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

  /*** Asset loading (all paths come from CONFIG.ASSETS / CONFIG.PLAYER / items) ***/
  async loadAssets() {
    const A = CONFIG.ASSETS;
    this.assets.background = await loadImage(A.background);
    this.assets.basket = await loadImage(CONFIG.PLAYER.img);
    // Load every item image declared in CONFIG.items
    this.assets.items = {};
    for (const it of CONFIG.items) {
      this.assets.items[it.name] = await loadImage(it.img);
    }
    // HUD + effect + screen sprites
    this.assets.heart = await loadImage(A.heart);
    this.assets.heartEmpty = await loadImage(A.heartEmpty);
    this.assets.clock = await loadImage(A.clock);
    this.assets.sparkle = await loadImage(A.sparkle);
    this.assets.explosion = await loadImage(A.explosion);
    this.assets.logo = await loadImage(A.logo);
    this.assets.playButton = await loadImage(A.playButton);
    this.assets.restartButton = await loadImage(A.restartButton);
    this.assets.trophy = await loadImage(A.trophy);
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
  }

  /*** Start a fresh round from the menu or restart; no page reload ***/
  startGame() {
    this.resetRound();
    this.state = 'playing';
  }
  restart() { this.startGame(); }

  /*** Back to the start screen ***/
  toMenu() {
    this.resetRound();
    this.state = 'start';
  }

  /*** Toggle pause (only meaningful while playing/paused) ***/
  togglePause() {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
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

  /*** Spawn one faller just above the top edge ***/
  spawnItem() {
    const def = this.pickItem();
    const img = this.assets.items[def.name];
    const w = def.width;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    const x = Math.random() * (CONFIG.CANVAS_WIDTH - w) + w / 2; // centre x, fully inside
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

      if (k === 'm' || k === 'M') { this.muted = !this.muted; e.preventDefault(); return; }

      // Movement (only matters while playing)
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { this.keysDown['left'] = true; e.preventDefault(); }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { this.keysDown['right'] = true; e.preventDefault(); }

      // Pause toggle
      if (k === 'p' || k === 'P') {
        if (this.state === 'playing' || this.state === 'paused') { this.togglePause(); e.preventDefault(); }
        return;
      }

      const confirmKey = (k === ' ' || k === 'Enter');
      if (this.state === 'start' && confirmKey) { this.startGame(); e.preventDefault(); }
      else if (this.state === 'paused' && (confirmKey || k === 'p' || k === 'P')) { this.togglePause(); e.preventDefault(); }
      else if (this.state === 'over' && (k === 'r' || k === 'R' || confirmKey)) { this.restart(); e.preventDefault(); }
    };
    const onKeyUp = e => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keysDown['left'] = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keysDown['right'] = false;
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
    const start = e => {
      e.preventDefault();
      this.ensureAudio(); // first gesture unlocks audio

      const px = getPointerX(e), py = getPointerY(e);

      // Speaker icon toggles mute from anywhere
      if (inRect(this.speakerRect, px, py)) { this.muted = !this.muted; return; }

      if (this.state === 'start') {
        if (inRect(this.playRect, px, py)) this.startGame();
        return;
      }
      if (this.state === 'paused') { this.togglePause(); return; }
      if (this.state === 'over') {
        if (inRect(this.restartRect, px, py)) this.restart();
        else if (inRect(this.menuRect, px, py)) this.toMenu();
        return;
      }
      // Playing: begin dragging the basket toward the pointer
      this.pointerActive = true;
      this.basketTargetX = px;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = e => {
      e.preventDefault();
      if (this.pointerActive && this.state === 'playing') this.basketTargetX = getPointerX(e);
    };
    const end = e => {
      e.preventDefault();
      this.pointerActive = false;
      canvas.releasePointerCapture(e.pointerId);
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

    // Start screen: animate decorative fallers only
    if (this.state === 'start') {
      for (const d of this.decor) { d.y += d.speed * dt; d.spin += dt; }
      this.decor = this.decor.filter(d => d.y - d.h / 2 <= CONFIG.CANVAS_HEIGHT);
      while (this.decor.length < 6) this.spawnDecor(false);
      return;
    }

    // Keyboard movement
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
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver("Time's up!");
      return;
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

  render() {
    const ctx = this.ctx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    // Clear
    ctx.clearRect(0, 0, w, h);
    if (this.loading) {
      ctx.fillStyle = CONFIG.BRAND.main;
      ctx.font = `24px ${CONFIG.BRAND.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', w / 2, h / 2);
      return;
    }

    // Start screen is its own layout
    if (this.state === 'start') { this.renderStart(ctx, w, h); return; }

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
    if (this.state === 'paused') this.renderPause(ctx, w, h);
    if (this.state === 'over') this.renderGameOver(ctx, w, h);
  }

  /*** Helper: cover-fill the background across the whole canvas ***/
  drawBackground(ctx, w, h) {
    const bg = this.assets.background;
    const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
    const bgW = bg.naturalWidth * scale;
    const bgH = bg.naturalHeight * scale;
    ctx.drawImage(bg, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);
  }

  /*** Outlined text using BRAND colours/font ***/
  drawText(ctx, text, x, y, size, fill = CONFIG.BRAND.main, align = 'center') {
    ctx.font = `bold ${size}px ${CONFIG.BRAND.font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size / 8);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = fill;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
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

    // How-to-play line near the bottom
    this.drawText(ctx, 'Move: arrows / drag. Catch stars. Dodge bombs.', cx, h - 60, 18, CONFIG.BRAND.main);

    // Speaker toggle still available on the menu
    this.renderSpeaker(ctx, w, h);
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
