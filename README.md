# Catch Rush

A simple browser game built with plain HTML, CSS, and JavaScript. No frameworks, no build step. Catch the stars, dodge the bombs, grab power-ups, and beat your best score before the timer runs out.

## Play

Double-click `index.html` to open it in a browser (works from a `file://` URL, no server needed).

## Controls

- Move: Left/Right arrows or A/D, or drag with mouse/touch
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
