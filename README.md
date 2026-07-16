# Dino Cat Dash: Rex's Big Adventure

A touch-friendly HTML5 runner built for desktop browsers and iPad. Guide Rex through five silly worlds, collect super powers, complete missions, unlock achievements, and defeat the three-phase tabby boss Sir Whiskers.

## Play

**https://cabando1.github.io/dino-cat-dash/**

For the best iPad experience, open the game in Safari, rotate to landscape, and use **Share → Add to Home Screen**.

## Controls

| Action | Keyboard | Touchscreen |
|---|---|---|
| Jump | Space or Up Arrow | Jump button or game screen |
| Shoot | F or X | Shoot button |
| Mega Roar | R | Mega Roar button |
| Pause | P or Escape | Pause button |

The crouch/duck mechanic is intentionally reserved for a sequel.

## Version 2 features

- Fully redrawn and procedurally animated T-Rex named Rex
- Run, jump, hurt, flame, laser, roar, idle, and victory animation states
- Three selectable Rex color schemes
- Custom canvas artwork with no external game assets
- Five themed worlds
- Flame Breath and Laser Blaster weapons
- Shield Egg, Super Sneakers, Star Magnet, Time Freeze, Golden Rex, Mega Roar, Extra Life, and bonus stars
- Clean-jump, close-call, destruction, combo, mission, world, and boss scoring bonuses
- A deterministic daily mission, daily best score, and 10 persistent achievements
- Separate synthesized music and sound-effect controls
- Three-phase Sir Whiskers boss battle
- Unlockable world selection and a detailed results screen with run statistics
- Offline caching and installable web-app support

## Project structure

- `index.html` — interface and controls
- `style.css` — responsive desktop/iPad layout
- `js/config.js` — game data and persistent state
- `js/audio.js` — synthesized music and sound effects
- `js/render.js` — procedural art and animation
- `js/mechanics.js` — gameplay, scoring, powers, missions, achievements, and boss logic
- `js/main.js` — input binding and animation loop
- `service-worker.js` — offline caching

## License

Released under the [MIT License](LICENSE).
