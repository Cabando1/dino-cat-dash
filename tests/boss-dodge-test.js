const fs=require('fs'),vm=require('vm'),path=require('path');
class ClassList{add(){} remove(){} toggle(){}}
const element=()=>({textContent:'',innerHTML:'',disabled:false,style:{},classList:new ClassList(),dataset:{},addEventListener(){}});
const elements=new Proxy({}, {get:(t,k)=>t[k]||(t[k]=element())});
global.window=global;global.localStorage={getItem(){return null},setItem(){}};global.performance={now:()=>0};
global.document={getElementById:id=>elements[id],querySelectorAll:()=>[],hidden:false,addEventListener(){}};
global.AudioContext=function(){};global.webkitAudioContext=global.AudioContext;
const root=path.join(__dirname,'..','js');
vm.runInThisContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),{filename:'config.js'});
const D=global.Dino;
D.ui={score:element(),high:element(),lives:element(),world:element(),power:element(),combo:element(),missionText:element(),missionBar:element(),timerText:element(),timerBar:element(),overlay:element(),kicker:element(),title:element(),message:element(),menuHigh:element(),achievementTotal:element(),bestCombo:element(),dailyBest:element(),skinPicker:element(),worldPicker:element(),results:element(),achievements:element(),toast:element(),startBtn:element(),achievementsBtn:element(),jumpBtn:element(),shootBtn:element(),roarBtn:element(),pauseBtn:element(),soundBtn:element(),musicBtn:element()};
D.audio={init(){},musicUpdate(){},tone(){},sfx:new Proxy({}, {get:()=>()=>{}})};
vm.runInThisContext(fs.readFileSync(path.join(root,'mechanics.js'),'utf8'),{filename:'mechanics.js'});
function runPhase(phase,seconds,rand){
  const originalRandom=Math.random;Math.random=()=>rand;
  D.state.selectedWorld=4;D.game.reset();
  const S=D.state;S.boss.intro=0;S.boss.x=phase===3?690:705;S.boss.phase=phase;S.boss.cool=.05;S.lives=99;S.stats.bossDamage=0;
  let priorCue=0,attacks=0,reaction=-1;
  for(let n=0;n<seconds*60;n++){
    D.game.update(1/60);
    if(S.boss&&S.boss.jumpCue>0&&priorCue<=0){attacks++;reaction=8}
    if(reaction===0){D.game.jump();reaction=-1}else if(reaction>0)reaction--;
    priorCue=S.boss?S.boss.jumpCue:0;
  }
  Math.random=originalRandom;
  return {phase,attacks,damage:S.stats.bossDamage,lives:S.lives,enemies:D.arrays.enemies.length};
}
const cases=[runPhase(1,25,.1),runPhase(1,25,.9),runPhase(2,25,.1),runPhase(2,25,.9),runPhase(3,25,.1),runPhase(3,25,.9)];
console.log(cases);
if(cases.some(c=>c.attacks<4||c.damage!==0)){console.error('Boss dodge test failed');process.exit(1)}
console.log('Boss dodge test passed');
