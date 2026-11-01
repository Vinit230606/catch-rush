# Catch Rush

A simple browser game built with plain HTML, CSS, and JavaScript. No frameworks, no build step. Catch the stars, dodge the bombs, grab power-ups, and beat your best score before the timer runs out.

## Play

Double-click `index.html` to open it in a browser (works from a `file://` URL, no server needed).

## Modes

- Solo Survival (Classic): single-player, 45 seconds, 3 lives, beat your best.
- Local Duel (2-player): enter names, pick a chomper colour, then play.
  - Laptop (landscape): screen splits left/right, both sides upright.
    Player 1 = A / D + Z (ability), Player 2 = arrows + X (ability).
  - Phone (portrait): screen splits top/bottom; the top half is rotated 180° so
    two people facing each other both see their side upright. Each player drags in
    their own half and taps their on-screen ability button.
  - Both lanes use the same seeded item schedule, so neither player gets luckier
    drops. Highest score when the timer ends wins; equal scores are a draw. A
    knockout (out of lives) ends it early. The winner gets teased over the loser.
  - Layout auto-detects from orientation; force it with
    `CONFIG.DUEL.layout = "sideBySide"` or `"topBottom"`.
- Global Arena: shown as "Coming Soon". Real online multiplayer needs a backend
  and is intentionally not claimed as live.

## Secret abilities (duel)

Each player is dealt one of four hidden abilities with two charges for the match:
Gravity Surge, Control Flip, Sidewind, Chomper Shrink. You see your own ability
during the 3-2-1 countdown; your rival sees only that a mystery exists. Trigger
with Z (P1) / X (P2) or the on-screen button. Abilities are short, visible once
active, non-stacking, and never remove score or lives — they just make the next
few seconds harder. A 6-second lockout prevents accidental double use.

## The chomper

The duel catcher is an original round "chomper" character with an animated wedge
mouth and a glow in the player's chosen colour (not the basket image). Toggle it
with `CONFIG.FEATURES.chomper`. Solo mode keeps the original basket.

## Players, history and leaderboard

Register names on the device (stored locally). The game keeps a per-player score
history and a top-10 leaderboard, all saved in `localStorage` on the phone/laptop.
No account or server needed.

## Controls

- Move (Classic): Left/Right arrows or A/D, or drag with mouse/touch
- Move (Duel): P1 = A/D, P2 = arrows; or drag in each half on touch
- Pause: P (also pauses when the tab loses focus)
- Mute: M, or tap the speaker icon
- Restart: R / Space / Enter on the game-over screen

## Features

- Portrait 450x800 canvas, scaled to fit and sharp on high-DPI screens
- Falling items with weighted spawns: stars (points), bombs (lose a life), power-ups
- Power-ups: lightning (double points) and snowflake (slow fall)
- Difficulty ramp over a 45-second round
- Lives, timer, score, and best score saved in `localStorage`
- Visual effects (sparkle/explosion bursts, floating score, screen shake) and synthesized Web Audio sound
- Start screen, pause overlay, and game-over screen

## Customise

Change `CONFIG` at the top of `game.js` only. Swap images in `/assets` using the same file names, or change the paths in `CONFIG.ASSETS`. Every colour and font comes from `CONFIG.BRAND`, so changing two colours re-themes the whole game.

## Project structure

```
index.html   # canvas + script tags
style.css     # full-screen centred canvas, no scroll
game.js       # all game logic (CONFIG at the top)
assets/       # image files
```
