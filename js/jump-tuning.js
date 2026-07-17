(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.player)return;

  const S=D.state;
  const P=D.player;
  const NORMAL_JUMP=-850;
  const SNEAKERS_JUMP=-970;

  D.game.jump=()=>{
    if(S.mode!=='play'||!P.ground)return;
    P.vy=P.timed==='sneakers'?SNEAKERS_JUMP:NORMAL_JUMP;
    P.ground=false;
    P.anim='jump';
    if(S.stats)S.stats.jumps=(Number(S.stats.jumps)||0)+1;
    if(D.audio&&D.audio.sfx&&typeof D.audio.sfx.jump==='function')D.audio.sfx.jump();
  };

  D.jumpTuning=Object.freeze({
    normalVelocity:NORMAL_JUMP,
    sneakersVelocity:SNEAKERS_JUMP,
    gravity:1950,
    normalApexPixels:(NORMAL_JUMP*NORMAL_JUMP)/(2*1950),
    sneakersApexPixels:(SNEAKERS_JUMP*SNEAKERS_JUMP)/(2*1950)
  });
})();
