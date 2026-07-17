(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.player||!D.arrays)return;

  const S=D.state;
  const P=D.player;
  const A=D.arrays;
  const BOSS_SCORE=13500;
  const EARLY_BOSS_SCORE=8800;
  let bossCreated=false;
  let castleMessageShown=false;

  function suppressEarlyStory(){
    const legacy=document.getElementById('storyCard');
    if(legacy)legacy.classList.add('hidden');
    document.body.classList.remove('story-open');
    if(S.mode==='story')S.mode='play';
  }

  function startDelayedBoss(){
    if(S.boss||bossCreated)return;
    bossCreated=true;
    S.world=4;
    S.worldBanner=2.2;
    A.obstacles.length=0;
    A.items.length=0;
    A.enemies.length=0;
    S.boss={
      x:D.W+220,y:165,w:205,h:225,
      hp:42,maxHp:42,phase:1,cool:1.5,hit:0,
      intro:2.2,windup:0,jumpCue:0,pending:null,
      attackName:'Preparing mischief…'
    };
    P.power='laser';
    P.ammo=Math.max(P.ammo,45);
    P.roars=Math.max(P.roars,1);
    if(D.audio&&D.audio.sfx&&D.audio.sfx.bossIntro)D.audio.sfx.bossIntro();
    if(D.game.toast)D.game.toast('FINAL BOSS: Sir Whiskers has stopped pretending to be busy');
    D.game.updateHud();
  }

  function cancelEarlyBoss(){
    if(!S.boss||Number(S.selectedWorld)===4||S.score>=BOSS_SCORE)return;
    S.boss=null;
    A.enemies.length=0;
    S.world=4;
    S.worldBanner=2.2;
    P.power='none';
    P.ammo=0;
    suppressEarlyStory();
    if(!castleMessageShown){
      castleMessageShown=true;
      if(D.game.toast)D.game.toast('Cat Castle unlocked — survive the courtyard before Sir Whiskers appears');
    }
    D.game.updateHud();
  }

  const originalReset=D.game.reset;
  D.game.reset=()=>{
    bossCreated=false;
    castleMessageShown=false;
    originalReset();
    S.lives=5;
    D.game.updateHud();
  };

  const originalUpdate=D.game.update;
  D.game.update=dt=>{
    originalUpdate(dt);

    if(Number(S.selectedWorld)!==4&&S.boss&&S.score<BOSS_SCORE){
      cancelEarlyBoss();
    }

    if(Number(S.selectedWorld)!==4&&!S.boss&&S.world===4&&S.score>=BOSS_SCORE){
      startDelayedBoss();
    }

    if(S.mode==='play'&&!S.boss&&S.world===4&&S.score>=EARLY_BOSS_SCORE&&S.score<BOSS_SCORE&&D.ui.world){
      const remaining=Math.max(0,Math.ceil(BOSS_SCORE-S.score));
      D.ui.world.textContent=`Castle • ${remaining.toLocaleString()} to boss`;
    }
  };

  S.lives=5;
  if(D.ui&&D.ui.lives)D.ui.lives.textContent='❤❤❤❤❤';
  if(D.game.updateHud)D.game.updateHud();

  D.gameplayTuning={BOSS_SCORE,startDelayedBoss};
})();