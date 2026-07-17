(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.gameplayV3||!D.state||!D.arrays)return;
  const S=D.state,A=D.arrays;
  let powerLabTimer=1;
  let powerLabChoice=0;
  const originalUpdate=D.game.update;

  function spawnPowerLabChoice(){
    if(A.items.some(item=>item.v3GuardChoice))return;
    const pairs=[['shield','laser'],['sneakers','magnet'],['freeze','golden'],['flame','roar']];
    const pair=pairs[powerLabChoice++%pairs.length],id=`guard-${powerLabChoice}`;
    A.items.push({kind:pair[0],x:D.W+70,y:250,w:46,h:46,phase:0,spin:0,v3GuardChoice:id});
    A.items.push({kind:pair[1],x:D.W+70,y:350,w:46,h:46,phase:2,spin:0,v3GuardChoice:id});
    if(D.game.toast)D.game.toast(`Power Lab choice: ${D.powerInfo[pair[0]][0]} or ${D.powerInfo[pair[1]][0]}`);
  }

  D.game.update=dt=>{
    const guardBoss=S.mode==='play'&&Number(S.selectedWorld)!==4&&S.world===4&&!D.gameplayV3.bossGateMet()&&S.score>=13460;
    const realScore=S.score;
    if(guardBoss)S.score=13460;

    originalUpdate(dt);

    if(guardBoss){
      const earned=Math.max(0,S.score-13460);
      S.score=realScore+earned;
      if(D.game.updateHud)D.game.updateHud();
    }

    if(S.v3Practice==='trees'||S.v3Practice==='powers'){
      S.world=0;
      if(S.boss)S.boss=null;
      A.enemies.length=0;
    }

    if(S.v3Practice==='powers'&&S.mode==='play'){
      A.obstacles.length=0;
      powerLabTimer-=dt;
      if(powerLabTimer<=0){spawnPowerLabChoice();powerLabTimer=7}
    }else powerLabTimer=1;
  };
})();
