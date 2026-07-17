const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const code=fs.readFileSync('js/jump-tuning.js','utf8');
let jumpSoundCount=0;
const Dino={
  state:{mode:'play',stats:{jumps:0}},
  player:{ground:true,timed:'none',vy:0,anim:'run'},
  game:{jump(){throw new Error('Original jump should be replaced');}},
  audio:{sfx:{jump(){jumpSoundCount++;}}}
};

vm.runInNewContext(code,{window:{Dino},console});

Dino.game.jump();
assert.strictEqual(Dino.player.vy,-850,'Normal jump velocity should be -850');
assert.strictEqual(Dino.player.ground,false,'Jump should leave the ground');
assert.strictEqual(Dino.player.anim,'jump','Jump animation should activate');
assert.strictEqual(Dino.state.stats.jumps,1,'Jump should increment stats');
assert.strictEqual(jumpSoundCount,1,'Jump sound should play');

const normalApex=Dino.jumpTuning.normalApexPixels;
assert(normalApex>=185,'Normal jump should rise at least 185 pixels');
assert(normalApex-120>=65,'Normal jump should provide at least 65 pixels above the 120px tree height');

Dino.player.ground=true;
Dino.player.timed='sneakers';
Dino.game.jump();
assert.strictEqual(Dino.player.vy,-970,'Sneakers jump velocity should be -970');
assert(Dino.jumpTuning.sneakersApexPixels>240,'Sneakers should rise more than 240 pixels');

const jumpsBefore=Dino.state.stats.jumps;
Dino.game.jump();
assert.strictEqual(Dino.state.stats.jumps,jumpsBefore,'Mid-air taps must not create another jump');

Dino.player.ground=true;
Dino.state.mode='pause';
Dino.game.jump();
assert.strictEqual(Dino.state.stats.jumps,jumpsBefore,'Paused gameplay must not jump');

console.log(JSON.stringify({
  normalVelocity:Dino.jumpTuning.normalVelocity,
  normalApex:Number(normalApex.toFixed(1)),
  treeClearance:Number((normalApex-120).toFixed(1)),
  sneakersVelocity:Dino.jumpTuning.sneakersVelocity,
  sneakersApex:Number(Dino.jumpTuning.sneakersApexPixels.toFixed(1))
}));
