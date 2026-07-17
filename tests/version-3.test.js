const assert=require('assert');
const fs=require('fs');

const source=fs.readFileSync('js/gameplay-v3.js','utf8');
const css=fs.readFileSync('gameplay-v3.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');

const requiredFeatures=[
  "easy:{label:'Easy'",
  "normal:{label:'Normal'",
  "wild:{label:'Wild'",
  'bossMin:270',
  'castleMin:70',
  'Power Guide',
  'Obstacle Guide',
  'Training',
  'Second Chance',
  'Tree Practice',
  'Power Lab',
  'Boss Practice',
  'WORLD COMPLETE',
  'WORLD OBJECTIVE',
  'Recovery shield',
  'First attempt help',
  'Five stars charged a Mega Roar',
  'hold Jump for maximum height',
  'Boss ammunition is unlimited',
  'Castle • ${wait}s to boss',
  'D.hit=(a,b)=>',
  'jumpBuffer=.13',
  'jumpHold<.19',
  'v3-boss-hud',
  'v3-warning'
];
for(const phrase of requiredFeatures)assert.ok(source.includes(phrase),`Missing Version 3 feature contract: ${phrase}`);

const powers=['Flame Breath','Laser Blaster','Shield Egg','Super Sneakers','Star Magnet','Time Freeze','Golden Rex','Mega Roar','Extra Life','Bonus Star'];
for(const name of powers)assert.ok(source.includes(name),`Power Guide must include ${name}`);

const obstacles=['Sleeping Cat','Tall Tree','Rubber Duck','Pizza Slice','Tree Stump','Yarn Ball','Toast','Stand Mixer','Rolling Pin','Robot Vacuum','Floor Lamp','Armored Cat','Castle Banner','Crown Pile'];
for(const name of obstacles)assert.ok(source.includes(name),`Obstacle Guide must include ${name}`);

assert.ok(index.includes('VERSION 3'),'Index must display the Version 3 banner');
assert.ok(index.includes('gameplay-v3.css?v=3.0.0'),'Index must load Version 3 styles');
assert.ok(index.includes('js/gameplay-v3.js?v=3.0.0'),'Index must load Version 3 gameplay last');
assert.ok(worker.includes("dino-cat-dash-v16-3.0.0"),'Service worker must use the Version 3 cache');
assert.ok(worker.includes("./js/gameplay-v3.js?v=3.0.0"),'Service worker must cache Version 3 gameplay');
assert.ok(worker.includes("./gameplay-v3.css?v=3.0.0"),'Service worker must cache Version 3 styles');

for(const selector of ['.v3-modal','.v3-warning','.v3-objective','.v3-boss-hud','.v3-menu-tools','.v3-practice-grid'])assert.ok(css.includes(selector),`Missing Version 3 style: ${selector}`);

const scriptPosition=index.indexOf('js/gameplay-v3.js?v=3.0.0');
const detailPosition=index.indexOf('js/cutscene-detail-upgrade.js?v=3.0.0');
assert.ok(scriptPosition>detailPosition,'Version 3 gameplay must load after earlier patch layers');

console.log('Version 3 contract passed: difficulty modes, permanent guides, fair movement, warnings, checkpoints, objectives, practice, boss assistance, second chance, and cache wiring are present.');
