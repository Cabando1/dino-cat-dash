const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const tuning=fs.readFileSync('js/gameplay-tuning.js','utf8');
const details=fs.readFileSync('js/cutscene-detail-upgrade.js','utf8');

const state={mode:'menu',selectedWorld:0,score:0,lives:3,world:0,worldBanner:0,boss:null};
const player={power:'none',ammo:0,roars:0};
const arrays={obstacles:[],items:[],enemies:[]};
const ui={lives:{textContent:''},world:{textContent:''}};
let hudUpdates=0;
let baseUpdates=0;

const Dino={
  W:960,
  state,
  player,
  arrays,
  ui,
  audio:{sfx:{bossIntro(){}}},
  game:{
    reset(){
      state.mode='play';state.score=0;state.world=state.selectedWorld;state.boss=null;
      if(state.selectedWorld===4){state.boss={hp:42};player.power='laser';player.ammo=45}
    },
    update(){
      baseUpdates++;
      if(state.selectedWorld!==4&&state.world===3&&state.score>=8800&&!state.boss){
        state.world=4;state.boss={hp:42};state.mode='story';player.power='laser';player.ammo=45;
      }
    },
    updateHud(){hudUpdates++},
    toast(){}
  }
};

const legacy={classList:{add(){} }};
const body={classList:{remove(){}}};
const context={
  window:{Dino},
  document:{getElementById(){return legacy},body},
  console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(tuning,context);

Dino.game.reset();
assert.strictEqual(state.lives,5,'Every normal run should begin with five lives');
assert.strictEqual(ui.lives.textContent,'❤❤❤❤❤','The HUD should display five hearts');

state.selectedWorld=0;state.world=3;state.score=9000;state.boss=null;state.mode='play';
Dino.game.update(1/60);
assert.strictEqual(state.boss,null,'The boss should not begin at the old 8,800-point threshold');
assert.strictEqual(state.world,4,'The player should continue into Cat Castle');
assert.strictEqual(state.mode,'play','The early legacy boss story state should be cleared');

state.score=13499;Dino.game.update(1/60);
assert.strictEqual(state.boss,null,'The castle approach should continue below 13,500 points');

state.score=13500;Dino.game.update(1/60);
assert.ok(state.boss,'The boss should begin at 13,500 points');
assert.strictEqual(state.boss.hp,42,'Sir Whiskers should begin with full health');

state.selectedWorld=4;Dino.game.reset();
assert.ok(state.boss,'Selecting Boss from the menu should still start the boss directly');
assert.strictEqual(state.lives,5,'Direct Boss selection should also start with five lives');

for(const phrase of[
  'Collect glowing items',
  'Check the Power HUD',
  'Use the correct control',
  'Timed powers start now',
  'Watch GET READY',
  'Jump on JUMP NOW',
  'Keep shooting',
  'Use Mega Roar',
  'five lives',
  'unlimited boss ammunition'
]){
  assert.ok(details.includes(phrase),`Detailed cutscene instructions should include: ${phrase}`);
}

const powerNames=['Flame Breath','Laser Blaster','Shield Egg','Super Sneakers','Star Magnet','Time Freeze','Golden Rex','Mega Roar','Extra Life','Bonus Star'];
for(const power of powerNames)assert.ok(details.includes(power),`Power guide should explain ${power}`);

assert.ok(baseUpdates>0,'Wrapped gameplay update should call the original update');
assert.ok(hudUpdates>0,'Gameplay tuning should refresh the HUD');
console.log('Version 2.3 tests passed: five lives, longer castle run, delayed boss, direct boss selection, and detailed cutscene instructions.');