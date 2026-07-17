const assert=require('assert');
const fs=require('fs');

const source=fs.readFileSync('js/gameplay-v3.js','utf8');
const guard=fs.readFileSync('js/gameplay-v3-guard.js','utf8');
const cleanup=fs.readFileSync('js/classic-mobile-cleanup.js','utf8');
const preload=fs.readFileSync('js/classic-preload.js','utf8');
const css=fs.readFileSync('gameplay-v3.css','utf8');
const classicCss=fs.readFileSync('classic-mobile-cleanup.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');

const requiredFeatures=[
  "easy:{label:'Easy'",
  "normal:{label:'Normal'",
  "wild:{label:'Wild'",
  'Training',
  'Second Chance',
  'Tree Practice',
  'Power Lab',
  'Boss Practice',
  'Recovery shield',
  'Five stars charged a Mega Roar',
  'D.hit=(a,b)=>',
  'jumpBuffer=.13',
  'jumpHold<.19'
];
for(const phrase of requiredFeatures)assert.ok(source.includes(phrase),`Missing Version 3 gameplay feature: ${phrase}`);

for(const phrase of[
  'TOTAL_BOSS_SECONDS=120',
  'CASTLE_SECONDS=30',
  'CASTLE_START_SECONDS=90',
  "button.textContent='Instructions'",
  "x:705,y:165,w:205,h:225",
  'P.ammo=9999',
  'S.score=Math.max(S.score,BOSS_SCORE_FLOOR)',
  'Dino Cat Dash gameplay recovery',
  'obstacleNames.has(String(text))',
  "rgba(13,20,28,0.72)"
])assert.ok(cleanup.includes(phrase),`Missing Version 3.1 cleanup feature: ${phrase}`);

for(const key of['dinoCatDashPowerGuideSeen','dinoCatDashPowerGuideSeenV223','dinoCatDashPowerGuideSeenV3'])assert.ok(preload.includes(key),`Automatic guide key must be disabled: ${key}`);

assert.ok(classicCss.includes('#v3Warning,#v3Objective,#v3BossHud,#v3ModeBadge,#v3EndPanel,#v3Modal'),'Gameplay text overlays must be hidden');
assert.ok(classicCss.includes('.classic-page'),'A mobile Instructions page must be styled');
assert.ok(classicCss.includes('.classic-boss-intro'),'A simple boss image card must be styled');

assert.ok(index.includes('VERSION 3.1'),'Index must display the Version 3.1 banner');
assert.ok(index.includes('classic-mobile-cleanup.css?v=3.1.0'),'Index must load classic mobile styles');
assert.ok(index.includes('js/classic-preload.js?v=3.1.0'),'Index must load the tutorial preload');
assert.ok(index.includes('js/classic-mobile-cleanup.js?v=3.1.0'),'Index must load classic cleanup last');
assert.ok(worker.includes("dino-cat-dash-v17-3.1.0"),'Service worker must use the Version 3.1 cache');
assert.ok(worker.includes("./js/classic-mobile-cleanup.js?v=3.1.0"),'Service worker must cache classic cleanup');
assert.ok(worker.includes("./classic-mobile-cleanup.css?v=3.1.0"),'Service worker must cache classic styles');

for(const selector of['.v3-modal','.v3-warning','.v3-objective','.v3-boss-hud','.v3-menu-tools','.v3-practice-grid'])assert.ok(css.includes(selector),`Version 3 base style remains available: ${selector}`);

const preloadPosition=index.indexOf('js/classic-preload.js?v=3.1.0');
const cutscenePosition=index.indexOf('js/cutscene-reliability.js?v=3.1.0');
const gameplayPosition=index.indexOf('js/gameplay-v3.js?v=3.1.0');
const guardPosition=index.indexOf('js/gameplay-v3-guard.js?v=3.1.0');
const cleanupPosition=index.indexOf('js/classic-mobile-cleanup.js?v=3.1.0');
assert.ok(preloadPosition<cutscenePosition,'Tutorial preload must run before cutscene systems');
assert.ok(guardPosition>gameplayPosition,'Timing guard must load after Version 3 gameplay');
assert.ok(cleanupPosition>guardPosition,'Classic cleanup and boss controller must load last');

console.log('Version 3.1 contract passed: classic visuals, one Instructions page, hidden obstacle labels, two-minute boss timing, visible boss creation, and fail-safe recovery are present.');
