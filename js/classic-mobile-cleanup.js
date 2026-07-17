(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.player||!D.arrays||!D.ui||!D.render)return;

  const S=D.state;
  const P=D.player;
  const A=D.arrays;
  const TOTAL_BOSS_SECONDS=120;
  const CASTLE_SECONDS=30;
  const CASTLE_START_SECONDS=90;
  const BOSS_SCORE_FLOOR=13500;

  if(D.gameplayV3&&D.gameplayV3.profiles){
    Object.assign(D.gameplayV3.profiles.easy,{bossMin:TOTAL_BOSS_SECONDS,castleMin:CASTLE_SECONDS});
    Object.assign(D.gameplayV3.profiles.normal,{bossMin:110,castleMin:25});
    Object.assign(D.gameplayV3.profiles.wild,{bossMin:95,castleMin:20});
  }

  const obstacleNames=new Set([
    'SLEEPING CAT','TALL TREE','RUBBER DUCK','PIZZA SLICE','TREE STUMP','YARN BALL','TOAST',
    'STAND MIXER','ROLLING PIN','ROBOT VACUUM','FLOOR LAMP','ARMORED CAT','CASTLE BANNER','CROWN PILE'
  ]);

  let instructionsOpen=false;
  let instructionsReturnMode='menu';
  let bossIntroOpen=false;
  let bossStarted=false;
  let bossRecoveries=0;
  let bossVisibleTime=0;
  let suppressingOldModal=false;

  function normalizedStyle(value){return String(value||'').replace(/\s+/g,'')}

  const instructionModal=document.createElement('section');
  instructionModal.id='classicInstructions';
  instructionModal.className='classic-page hidden';
  instructionModal.setAttribute('role','dialog');
  instructionModal.setAttribute('aria-modal','true');
  instructionModal.innerHTML=`
    <div class="classic-page-panel">
      <p class="classic-kicker">GAME INSTRUCTIONS</p>
      <h2>How to Help Rex Survive</h2>
      <section class="classic-section">
        <h3>How to Play</h3>
        <div class="classic-instruction-grid">
          <article><b>JUMP</b><span>Tap for a regular jump. Hold briefly for the highest jump.</span></article>
          <article><b>SHOOT</b><span>Uses Flame Breath or the Laser Blaster when one is active.</span></article>
          <article><b>MEGA ROAR</b><span>Clears hazards and damages Sir Whiskers. Five stars recharge one roar.</span></article>
          <article><b>FIVE LIVES</b><span>Every run starts with five hearts. After a hit, Rex gets brief protection.</span></article>
        </div>
      </section>
      <section class="classic-section">
        <h3>Power-Ups</h3>
        <div class="classic-list">
          <article><b>🔥 Flame Breath</b><span>Tap Shoot. Fireballs destroy obstacles.</span></article>
          <article><b>🔫 Laser Blaster</b><span>Tap Shoot. The boss fight has unlimited laser ammunition.</span></article>
          <article><b>🥚 Shield Egg</b><span>Blocks hits automatically. Breakfast finally contributes.</span></article>
          <article><b>👟 Super Sneakers</b><span>Higher jumps for a short time. Tiny shoes, questionable physics.</span></article>
          <article><b>🧲 Star Magnet</b><span>Pulls stars and bonuses toward Rex.</span></article>
          <article><b>❄️ Time Freeze</b><span>Slows hazards while Rex keeps moving.</span></article>
          <article><b>⭐ Golden Rex</b><span>Temporary invincibility and excessive confidence.</span></article>
          <article><b>📣 Mega Roar</b><span>Press the orange button to clear the screen.</span></article>
          <article><b>❤️ Extra Life</b><span>Restores one heart, up to five.</span></article>
          <article><b>🌟 Bonus Star</b><span>Builds score combos and recharges Mega Roar.</span></article>
        </div>
      </section>
      <section class="classic-section">
        <h3>Obstacles</h3>
        <p>Small objects need a normal jump. Trees, lamps, mixers, armored cats, and castle banners need an earlier jump with a short hold. The game no longer places names or boxes over the obstacles.</p>
      </section>
      <section class="classic-section">
        <h3>Sir Whiskers</h3>
        <p>The first boss arrives after about two minutes, including roughly thirty seconds in Cat Castle. Shoot continuously, jump when the game says <strong>JUMP NOW</strong>, and save Mega Roar for crowded moments.</p>
      </section>
      <button id="classicInstructionsClose" type="button">Back to the Game</button>
    </div>`;
  document.body.appendChild(instructionModal);

  const bossIntro=document.createElement('section');
  bossIntro.id='classicBossIntro';
  bossIntro.className='classic-boss-intro hidden';
  bossIntro.setAttribute('role','dialog');
  bossIntro.setAttribute('aria-modal','true');
  bossIntro.innerHTML=`
    <div class="classic-boss-panel">
      <p class="classic-kicker">FINAL BOSS</p>
      <h2>Sir Whiskers Has Entered the Backyard</h2>
      <canvas id="classicBossArt" width="960" height="270" aria-label="Rex faces Sir Whiskers"></canvas>
      <p>He brought yarn, fireballs, and a robot vacuum because apparently one bad decision was not enough.</p>
      <button id="classicBossReady" type="button">Ready — Start the Boss</button>
    </div>`;
  document.body.appendChild(bossIntro);

  function roundRect(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }

  function drawRex(ctx,x,y,scale){
    const skin=D.skins[S.skin]||D.skins.jungle;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(24,52);ctx.quadraticCurveTo(-48,24,-82,58);ctx.quadraticCurveTo(-20,75,42,70);ctx.closePath();ctx.fill();
    ctx.fillStyle=skin.body;ctx.beginPath();ctx.ellipse(51,57,52,39,0,0,D.TAU);ctx.fill();
    ctx.fillStyle=skin.belly;ctx.beginPath();ctx.ellipse(63,66,26,24,.1,0,D.TAU);ctx.fill();
    for(const lx of[24,68]){roundRect(ctx,lx,80,20,30,7);ctx.fillStyle=skin.body;ctx.fill();roundRect(ctx,lx-8,102,36,11,5);ctx.fillStyle=skin.dark;ctx.fill()}
    roundRect(ctx,70,15,39,56,14);ctx.fillStyle=skin.body;ctx.fill();ctx.beginPath();ctx.ellipse(110,30,41,30,0,0,D.TAU);ctx.fill();roundRect(ctx,102,31,54,24,10);ctx.fill();
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(108,51);ctx.lineTo(155,51);ctx.lineTo(140,67);ctx.lineTo(106,60);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(121,23,10,11,0,0,D.TAU);ctx.fill();ctx.fillStyle='#172018';ctx.beginPath();ctx.arc(125,24,4,0,D.TAU);ctx.fill();
    ctx.fillStyle=skin.bandana;ctx.beginPath();ctx.moveTo(73,45);ctx.lineTo(98,52);ctx.lineTo(74,61);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawCat(ctx,x,y,scale){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle='#c9824e';ctx.beginPath();ctx.ellipse(78,126,88,72,0,0,D.TAU);ctx.fill();ctx.beginPath();ctx.arc(125,60,65,0,D.TAU);ctx.fill();
    ctx.beginPath();ctx.moveTo(78,27);ctx.lineTo(91,-20);ctx.lineTo(116,26);ctx.moveTo(140,21);ctx.lineTo(174,-16);ctx.lineTo(180,38);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(111,59,13,17,0,0,D.TAU);ctx.ellipse(149,56,13,17,0,0,D.TAU);ctx.fill();ctx.fillStyle='#172018';ctx.beginPath();ctx.arc(115,61,5,0,D.TAU);ctx.arc(146,58,5,0,D.TAU);ctx.fill();
    ctx.fillStyle='#ffd04d';ctx.beginPath();ctx.moveTo(87,12);ctx.lineTo(95,-22);ctx.lineTo(116,-3);ctx.lineTo(135,-31);ctx.lineTo(153,-3);ctx.lineTo(175,-22);ctx.lineTo(178,13);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawBossArt(){
    const canvas=document.getElementById('classicBossArt');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const gradient=ctx.createLinearGradient(0,0,960,270);gradient.addColorStop(0,'#173f31');gradient.addColorStop(.5,'#3e315f');gradient.addColorStop(1,'#743945');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,960,270);
    ctx.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<22;i++){ctx.beginPath();ctx.arc(22+i*44,30+(i%4)*54,4,0,D.TAU);ctx.fill()}
    drawRex(ctx,160,95,1.15);drawCat(ctx,700,65,1.05);
    ctx.fillStyle='#ffd45f';ctx.font='900 44px system-ui';ctx.textAlign='center';ctx.fillText('VS',480,138);
    ctx.font='900 18px system-ui';ctx.fillStyle='#fff';ctx.fillText('REX',215,238);ctx.fillText('SIR WHISKERS',790,238);ctx.textAlign='left';
  }

  function replaceGuideButton(){
    const oldPower=document.getElementById('v3PowerGuideBtn');
    if(oldPower){
      const button=oldPower.cloneNode(true);
      button.textContent='Instructions';
      oldPower.replaceWith(button);
      button.addEventListener('click',openInstructions);
    }
    const obstacle=document.getElementById('v3ObstacleGuideBtn');
    if(obstacle)obstacle.classList.add('classic-hidden');
  }

  function openInstructions(){
    instructionsReturnMode=S.mode;
    instructionsOpen=true;
    instructionModal.classList.remove('hidden');
    document.body.classList.add('classic-page-open');
    if(S.mode==='play')S.mode='classicInstructions';
    try{document.getElementById('classicInstructionsClose').focus({preventScroll:true})}catch{}
  }

  function closeInstructions(){
    instructionsOpen=false;
    instructionModal.classList.add('hidden');
    document.body.classList.remove('classic-page-open');
    if(instructionsReturnMode==='play'){
      S.mode='play';S.last=performance.now();
      if(D.ui.overlay)D.ui.overlay.classList.remove('visible');
    }else S.mode=instructionsReturnMode;
  }

  document.getElementById('classicInstructionsClose').addEventListener('click',closeInstructions);

  function dismissV3Modal(){
    const old=document.getElementById('v3Modal');
    if(!old||old.classList.contains('hidden')||suppressingOldModal)return;
    suppressingOldModal=true;
    const close=old.querySelector('#v3ModalClose');
    if(close)close.click();else old.classList.add('hidden');
    suppressingOldModal=false;
    if(instructionsOpen)S.mode='classicInstructions';
    if(bossIntroOpen)S.mode='classicBossIntro';
  }

  function forceCastleAtNinetySeconds(){
    if(Number(S.selectedWorld)===4||S.boss||bossStarted||bossIntroOpen)return;
    const elapsed=D.gameplayV3?D.gameplayV3.runTime:S.time;
    if(elapsed<CASTLE_START_SECONDS||S.world>=4)return;
    S.world=4;S.worldBanner=2.2;S.maxWorld=Math.max(4,S.maxWorld);
    try{D.store.set('dinoCatDashMaxWorld',S.maxWorld)}catch{}
    A.obstacles.length=0;A.enemies.length=0;
    if(D.game.toast)D.game.toast('Cat Castle — Sir Whiskers is almost done pretending to prepare');
    D.game.updateHud();
  }

  function bossGateMet(){
    if(Number(S.selectedWorld)===4)return true;
    const run=D.gameplayV3?D.gameplayV3.runTime:S.time;
    const castle=D.gameplayV3?D.gameplayV3.castleTime:Math.max(0,run-CASTLE_START_SECONDS);
    return S.world===4&&run>=TOTAL_BOSS_SECONDS&&castle>=CASTLE_SECONDS;
  }

  function removeUnexpectedBoss(previous){
    S.boss=null;A.enemies.length=0;
    P.power=previous.power;P.ammo=previous.ammo;P.roars=previous.roars;
    S.world=4;S.worldBanner=2.2;
    D.game.updateHud();
  }

  function openBossIntro(){
    if(bossIntroOpen||bossStarted)return;
    bossIntroOpen=true;
    S.boss=null;A.enemies.length=0;
    S.mode='classicBossIntro';
    bossIntro.classList.remove('hidden');
    document.body.classList.add('classic-page-open');
    drawBossArt();
    try{document.getElementById('classicBossReady').focus({preventScroll:true})}catch{}
  }

  function startBossNow(recovery=false){
    bossIntroOpen=false;bossStarted=true;
    bossIntro.classList.add('hidden');document.body.classList.remove('classic-page-open');
    S.world=4;S.worldBanner=2.2;S.score=Math.max(S.score,BOSS_SCORE_FLOOR);
    A.obstacles.length=0;A.items.length=0;A.enemies.length=0;
    S.boss={
      x:705,y:165,w:205,h:225,
      hp:42,maxHp:42,phase:1,cool:recovery?2.2:1.7,hit:0,
      intro:recovery?.5:1.2,windup:0,jumpCue:0,pending:null,
      attackName:'Preparing mischief…'
    };
    P.power='laser';P.ammo=9999;P.roars=Math.max(P.roars,1);P.shield=Math.max(P.shield,1);
    S.mode='play';S.last=performance.now();bossVisibleTime=0;
    if(D.ui.overlay)D.ui.overlay.classList.remove('visible');
    if(D.audio&&D.audio.sfx&&D.audio.sfx.bossIntro)D.audio.sfx.bossIntro();
    if(D.game.toast)D.game.toast(recovery?'Sir Whiskers recovered from a dramatic entrance error':'BOSS: SIR WHISKERS');
    D.game.updateHud();
  }

  document.getElementById('classicBossReady').addEventListener('click',()=>startBossNow(false));

  const originalReset=D.game.reset;
  D.game.reset=()=>{
    bossIntroOpen=false;bossStarted=false;bossRecoveries=0;bossVisibleTime=0;
    bossIntro.classList.add('hidden');
    originalReset();
    const direct=Number(S.selectedWorld)===4;
    if(direct){
      S.boss=null;A.enemies.length=0;openBossIntro();
      setTimeout(()=>{dismissV3Modal();if(bossIntroOpen)S.mode='classicBossIntro'},0);
    }
  };

  const originalUpdate=D.game.update;
  D.game.update=dt=>{
    const previous={power:P.power,ammo:P.ammo,roars:P.roars};
    const holdScore=Number(S.selectedWorld)!==4&&S.world===4&&!bossStarted&&!bossIntroOpen&&S.score>=13460;
    const savedScore=S.score;
    if(holdScore)S.score=13460;

    try{
      originalUpdate(dt);
    }catch(error){
      console.error('Dino Cat Dash gameplay recovery',error);
      if((bossStarted||bossIntroOpen)&&bossRecoveries<1){
        bossRecoveries++;startBossNow(true);return;
      }
      throw error;
    }

    if(holdScore){const earned=Math.max(0,S.score-13460);S.score=savedScore+earned;D.game.updateHud()}
    dismissV3Modal();
    if(instructionsOpen)S.mode='classicInstructions';
    if(bossIntroOpen)S.mode='classicBossIntro';

    forceCastleAtNinetySeconds();

    if(S.boss&&!bossStarted){
      if(bossGateMet()){
        S.boss=null;A.enemies.length=0;openBossIntro();
      }else removeUnexpectedBoss(previous);
    }

    if(!bossStarted&&!bossIntroOpen&&bossGateMet())openBossIntro();

    if(bossStarted&&S.boss){
      bossVisibleTime+=dt;
      if(bossVisibleTime>.6&&S.boss.x>D.W-180)S.boss.x=705;
      P.power='laser';P.ammo=9999;
    }else if(bossStarted&&!S.boss&&S.mode==='play'&&bossRecoveries<1){
      bossRecoveries++;startBossNow(true);
    }
  };

  const v3Draw=D.render.draw;
  D.render.draw=()=>{
    const ctx=D.ctx;
    const original={fill:ctx.fill,fillRect:ctx.fillRect,fillText:ctx.fillText,strokeRect:ctx.strokeRect};
    try{
      ctx.fill=function(...args){
        if(normalizedStyle(ctx.fillStyle)==='rgba(0,0,0,0.24)')return;
        return original.fill.apply(ctx,args);
      };
      ctx.fillRect=function(...args){
        if(normalizedStyle(ctx.fillStyle)==='rgba(7,12,25,0.9)')return;
        return original.fillRect.apply(ctx,args);
      };
      ctx.strokeRect=function(...args){
        if(normalizedStyle(ctx.strokeStyle)==='rgba(13,20,28,0.72)'&&Number(ctx.lineWidth)===4)return;
        return original.strokeRect.apply(ctx,args);
      };
      ctx.fillText=function(text,...args){
        if(obstacleNames.has(String(text)))return;
        return original.fillText.call(ctx,text,...args);
      };
      return v3Draw();
    }finally{
      ctx.fill=original.fill;ctx.fillRect=original.fillRect;ctx.fillText=original.fillText;ctx.strokeRect=original.strokeRect;
    }
  };

  addEventListener('keydown',event=>{
    if(instructionsOpen&&event.key==='Escape'){event.preventDefault();closeInstructions()}
    if(bossIntroOpen&&(event.key==='Enter'||event.key===' ')){event.preventDefault();startBossNow(false)}
  },true);

  replaceGuideButton();
  dismissV3Modal();
  D.classicMobile={
    version:'3.1.0',
    TOTAL_BOSS_SECONDS,
    CASTLE_SECONDS,
    CASTLE_START_SECONDS,
    openInstructions,
    openBossIntro,
    startBossNow,
    bossGateMet
  };
})();
