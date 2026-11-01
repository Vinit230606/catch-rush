# Catch Rush

A simple browser game built with plain HTML, CSS, and JavaScript. No frameworks, no build step. Catch the stars, dodge the bombs, grab power-ups, and beat your best score before the timer runs out.

## Play

Double-click `index.html` to open it in a browser (works from a `file://` URL, no server needed).

## Modes

- Classic: single-player, 45 seconds, beat your best.
- Duel (local 2-player): enter both names, then play.
  - Laptop (landscape): the screen splits left/right, both sides upright.
    Player 1 uses A / D (left side), Player 2 uses the arrow keys (right side).
  - Phone (portrait): the screen splits top/bottom and the top half is rotated
    180° so two people facing each other both see their side upright. Each player
    drags in their own half.
  - Highest score when the timer ends wins (a knockout ends it early). The winner
    gets teased over the loser.
  - The layout is chosen automatically from the window orientation; force it with
    `CONFIG.DUEL.layout = "sideBySide"` or `"topBottom"`.

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
