const assert=require('assert');
const fs=require('fs');
const html=fs.readFileSync('remix/index.html','utf8');
const css=fs.readFileSync('remix/remix.css','utf8');
const game=fs.readFileSync('remix/remix.js','utf8');
const entry=fs.readFileSync('js/remix-entry.js','utf8');
const root=fs.readFileSync('index.html','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');

for(const phrase of['Rex Remix','Backyard prototype','remixGame','Start Backyard Run','Classic Adventure'])assert.ok(html.includes(phrase),`Missing Remix HTML contract: ${phrase}`);
for(const phrase of['drawBackground','drawRex','drawCat','drawDuck','drawStump','drawPizza','drawTree','state.lives=5','player.vy=-850','recovery shield','state.score>=2500'])assert.ok(game.includes(phrase),`Missing Remix gameplay contract: ${phrase}`);
for(const phrase of['remix-controls','remix-hud','game-frame','instruction-grid'])assert.ok(css.includes(phrase),`Missing Remix style: ${phrase}`);
assert.ok(entry.includes("location.href='./remix/'"),'Classic menu entry must launch Rex Remix');
assert.ok(root.includes('remix-entry.css?v=3.2.0'),'Classic page must load Remix entry styles');
assert.ok(root.includes('js/remix-entry.js?v=3.2.0'),'Classic page must load Remix entry script');
assert.ok(worker.includes("dino-cat-dash-v18-3.2.0"),'Service worker must use Remix prototype cache');
for(const path of['./remix/index.html?v=0.1.0','./remix/remix.css?v=0.1.0','./remix/remix.js?v=0.1.0'])assert.ok(worker.includes(path),`Service worker must cache ${path}`);
console.log('Rex Remix prototype contract passed.');
