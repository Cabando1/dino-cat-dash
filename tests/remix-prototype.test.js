const assert=require('assert');
const fs=require('fs');
const html=fs.readFileSync('remix/index.html','utf8');
const css=fs.readFileSync('remix/remix.css','utf8');
const game=fs.readFileSync('remix/remix.js','utf8');
const entry=fs.readFileSync('js/remix-entry.js','utf8');
const root=fs.readFileSync('index.html','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');

for(const phrase of['Rex Remix','Illustrated Backyard v0.3','id="game"','Start Remix','Classic Adventure'])assert.ok(html.includes(phrase),`Missing Remix HTML contract: ${phrase}`);
for(const phrase of['drawBackground','drawPlayer','drawObstacle','drawItem','state.lives=5','player.vy=-760','Shield blocked the obstacle','state.score>=GOAL','assets/rex-jump.webp','touchmove'])assert.ok(game.includes(phrase),`Missing Remix gameplay contract: ${phrase}`);
for(const phrase of['.controls','.hud','.stage','.instruction-grid','position:fixed','touch-action:none'])assert.ok(css.includes(phrase),`Missing Remix style: ${phrase}`);
assert.ok(entry.includes("location.href='./remix/'"),'Classic menu entry must launch Rex Remix');
assert.ok(root.includes('remix-entry.css?v=3.2.0'),'Classic page must load Remix entry styles');
assert.ok(root.includes('js/remix-entry.js?v=3.2.0'),'Classic page must load Remix entry script');
assert.ok(worker.includes("dino-cat-dash-v19-3.2.1"),'Service worker must use the v0.3 Remix cache');
for(const path of['./remix/index.html?v=0.3.0','./remix/remix.css?v=0.3.0','./remix/remix.js?v=0.3.0'])assert.ok(worker.includes(path),`Service worker must cache ${path}`);
for(const path of['rex-jump.webp','sleeping-cat.webp','rubber-duck.webp','tree-stump.webp','pizza-slice.webp','tall-tree.webp']){
  const full=`remix/assets/${path}`;
  assert.ok(fs.existsSync(full),`Missing illustrated asset: ${full}`);
  assert.ok(fs.statSync(full).size>1000,`Illustrated asset is unexpectedly small: ${full}`);
  assert.ok(worker.includes(`./${full}`),`Service worker must cache ${full}`);
}
assert.ok(!game.includes("'😴🐈'"),'Remix obstacles must not use emoji artwork');
console.log('Rex Remix v0.3 contract passed: illustrated assets, layered Backyard, readable powers, tighter jump, and iPad viewport lock are present.');
