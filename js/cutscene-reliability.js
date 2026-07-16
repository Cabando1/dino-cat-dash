(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.player||!D.ui)return;

  const S=D.state;
  const P=D.player;
  const stage=document.querySelector('.stage');
  if(!stage)return;

  const LEGACY_GUIDE_KEY='dinoCatDashPowerGuideSeen';
  const GUIDE_KEY='dinoCatDashPowerGuideSeenV223';
  const legacyCard=document.getElementById('storyCard');

  let guideSeen=false;
  try{
    guideSeen=Boolean(D.store.get(GUIDE_KEY,false));
    D.store.set(LEGACY_GUIDE_KEY,true);
  }catch{}

  const POWER_ROWS=[
    ['Flame Breath','Toasts obstacles. Also voids most backyard warranties.'],
    ['Laser Blaster','Precision problem-solving, now with unnecessary glowing lines.'],
    ['Shield Egg','Breakfast that blocks one bad decision.'],
    ['Super Sneakers','Tiny shoes. Huge jumps. No one knows where Rex found his size.'],
    ['Star Magnet','Pulls in stars because walking over there sounded exhausting.'],
    ['Time Freeze','Slows everything except Rex’s confidence.'],
    ['Golden Rex','Invincible, shiny, and impossible to ignore at parties.'],
    ['Mega Roar','Clears the screen and files a noise complaint against every cat.'],
    ['Extra Life','A complimentary do-over. Absolutely no receipt required.'],
    ['Bonus Star','Makes the score multiplier behave irresponsibly.']
  ];

  const card=document.createElement('section');
  card.id='reliableStoryCard';
  card.className='reliable-story-card hidden';
  card.setAttribute('role','dialog');
  card.setAttribute('aria-modal','true');
  card.innerHTML=`
    <div class="reliable-story-panel">
      <p id="reliableStoryKicker" class="reliable-story-kicker"></p>
      <h2 id="reliableStoryTitle"></h2>
      <canvas id="reliableStoryArt" width="960" height="210" aria-label="Story illustration"></canvas>
      <p id="reliableStoryCopy" class="reliable-story-copy"></p>
      <div id="reliablePowerGrid" class="reliable-power-grid hidden"></div>
      <button id="reliableStoryReady" type="button">Ready</button>
    </div>`;
  stage.appendChild(card);

  const ui={
    kicker:document.getElementById('reliableStoryKicker'),
    title:document.getElementById('reliableStoryTitle'),
    art:document.getElementById('reliableStoryArt'),
    copy:document.getElementById('reliableStoryCopy'),
    grid:document.getElementById('reliablePowerGrid'),
    ready:document.getElementById('reliableStoryReady')
  };
  const c=ui.art.getContext('2d');

  let activeKind=null;
  let powerBaseline=Number(S.stats&&S.stats.powers)||0;
  let bossIntroShown=false;

  function suppressLegacy(){
    if(legacyCard&&!legacyCard.classList.contains('hidden'))legacyCard.classList.add('hidden');
    document.body.classList.remove('story-open');
  }

  function rr(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }

  function drawRex(ctx,x,y,scale=1){
    const skin=D.skins[S.skin]||D.skins.jungle;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(28,50);ctx.quadraticCurveTo(-42,20,-78,54);ctx.quadraticCurveTo(-15,72,42,67);ctx.closePath();ctx.fill();
    ctx.fillStyle=skin.body;ctx.beginPath();ctx.ellipse(50,54,50,38,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.belly;ctx.beginPath();ctx.ellipse(61,63,25,24,.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=skin.stripe;ctx.lineWidth=7;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(25+i*16,26+i*2);ctx.lineTo(34+i*16,39+i*3);ctx.stroke()}
    for(const lx of[24,66]){ctx.fillStyle=skin.body;rr(ctx,lx,74,19,30,7);ctx.fill();ctx.fillStyle=skin.dark;rr(ctx,lx-8,96,35,11,5);ctx.fill()}
    ctx.fillStyle=skin.body;rr(ctx,68,14,38,54,14);ctx.fill();ctx.beginPath();ctx.ellipse(106,28,40,30,0,0,Math.PI*2);ctx.fill();rr(ctx,98,29,52,24,10);ctx.fill();
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(103,49);ctx.lineTo(149,49);ctx.lineTo(134,65);ctx.lineTo(101,58);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(108+i*9,49);ctx.lineTo(113+i*9,58);ctx.lineTo(118+i*9,49);ctx.fill()}
    ctx.beginPath();ctx.ellipse(117,21,10,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#142018';ctx.beginPath();ctx.arc(121,22,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.bandana;ctx.beginPath();ctx.moveTo(71,44);ctx.lineTo(96,51);ctx.lineTo(72,59);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawPowerScene(){
    const w=ui.art.width,h=ui.art.height;
    const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#17375f');g.addColorStop(.52,'#463071');g.addColorStop(1,'#873b60');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    drawRex(c,125,68,1.05);
    c.fillStyle='#fff';c.font='900 31px system-ui';c.fillText('REX FOUND A SHINY THING',330,49);
    c.font='700 17px system-ui';c.fillStyle='#dce9ff';c.fillText('This calls for a completely serious safety briefing.',330,77);
    const colors=['#ff7138','#6eeeff','#f7ead8','#ff6961','#ed4e5b','#8cecff','#ffd33e','#ff9b49','#ff6683','#ffe15b'];
    for(let i=0;i<10;i++){
      const x=350+(i%5)*112,y=127+Math.floor(i/5)*59;
      c.fillStyle='#081225bb';c.beginPath();c.arc(x,y,25,0,Math.PI*2);c.fill();
      c.fillStyle=colors[i];c.beginPath();
      if(i===9){for(let p=0;p<10;p++){const r=p%2?8:21,a=-Math.PI/2+p*Math.PI/5;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath()}
      else if(i===1){rr(c,x-20,y-7,34,14,4)}
      else c.arc(x,y,13+(i%3)*2,0,Math.PI*2);
      c.fill();
    }
  }

  function drawBossScene(){
    const w=ui.art.width,h=ui.art.height;
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#38285f');g.addColorStop(1,'#10152b');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='#fff';c.font='900 34px system-ui';c.fillText('SIR WHISKERS',45,58);
    c.font='700 18px system-ui';c.fillStyle='#dce5ff';c.fillText('Self-appointed king. Certified yarn hoarder.',45,91);
    c.fillText('Currently protected by one suspicious robot vacuum.',45,120);
    c.save();c.translate(530,15);
    c.fillStyle='#c9824e';c.beginPath();c.ellipse(100,130,88,72,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(140,63,66,0,0+Math.PI*2);c.fill();
    c.beginPath();c.moveTo(92,29);c.lineTo(102,-19);c.lineTo(127,27);c.moveTo(150,22);c.lineTo(183,-15);c.lineTo(188,39);c.fill();
    c.strokeStyle='#744425';c.lineWidth=9;for(let i=0;i<4;i++){c.beginPath();c.moveTo(76+i*25,89);c.lineTo(87+i*22,114);c.stroke()}
    c.fillStyle='#fff';c.beginPath();c.ellipse(124,61,13,17,0,0,Math.PI*2);c.ellipse(162,58,13,17,0,0,Math.PI*2);c.fill();
    c.fillStyle='#17201d';c.beginPath();c.arc(128,63,5,0,Math.PI*2);c.arc(159,60,5,0,Math.PI*2);c.fill();
    c.fillStyle='#ffd04d';c.beginPath();c.moveTo(101,13);c.lineTo(107,-21);c.lineTo(127,-2);c.lineTo(145,-30);c.lineTo(162,-2);c.lineTo(183,-22);c.lineTo(186,14);c.closePath();c.fill();
    c.restore();
    c.fillStyle='#364961';rr(c,735,112,178,60,25);c.fill();c.fillStyle='#6fe7ff';c.beginPath();c.arc(785,143,16,0,Math.PI*2);c.arc(862,143,16,0,Math.PI*2);c.fill();
  }

  function openCard(kind){
    if(activeKind)return;
    suppressLegacy();
    activeKind=kind;
    S.mode='story';
    document.body.classList.add('reliable-story-open');
    card.classList.remove('hidden');
    ui.grid.classList.toggle('hidden',kind!=='powers');

    if(kind==='powers'){
      ui.kicker.textContent='FIRST POWER-UP DISCOVERED';
      ui.title.textContent='Rex’s Questionably Responsible Power Guide';
      ui.copy.textContent='Rex has no instruction manual, but he does have confidence. Here is what every shiny object does before he starts pressing buttons.';
      ui.ready.textContent='Got It — Resume the Chaos';
      ui.grid.innerHTML=POWER_ROWS.map(([name,copy],i)=>`<article><i data-power="${i}"></i><div><strong>${name}</strong><span>${copy}</span></div></article>`).join('');
      drawPowerScene();
    }else{
      bossIntroShown=true;
      ui.kicker.textContent='FINAL BOSS AHEAD';
      ui.title.textContent='Sir Whiskers Requests Your Immediate Defeat';
      ui.copy.textContent='He declared himself king, taxed all yarn, and parked a robot vacuum in the arena. Rex considers this excessive.';
      ui.ready.textContent='I’m Ready — Ruin His Nap';
      ui.grid.innerHTML='';
      drawBossScene();
    }

    try{ui.ready.focus({preventScroll:true})}catch{ui.ready.focus()}
  }

  function closeCard(){
    if(!activeKind)return;
    if(activeKind==='powers'){
      guideSeen=true;
      try{D.store.set(GUIDE_KEY,true)}catch{}
    }
    activeKind=null;
    card.classList.add('hidden');
    document.body.classList.remove('reliable-story-open');
    suppressLegacy();
    S.mode='play';
    S.last=performance.now();
    grantBossAmmo();
  }

  function grantBossAmmo(){
    if(!S.boss)return;
    P.power='laser';
    P.ammo=9999;
    if(D.ui.power)D.ui.power.textContent='Laser Blaster (∞)';
    if(D.ui.shootBtn)D.ui.shootBtn.disabled=S.mode!=='play';
  }

  ui.ready.addEventListener('click',event=>{event.preventDefault();closeCard()});
  addEventListener('keydown',event=>{
    if(activeKind&&(event.key==='Enter'||event.key===' ')){
      event.preventDefault();event.stopPropagation();closeCard();
    }
  },true);

  const originalReset=D.game.reset;
  D.game.reset=()=>{
    activeKind=null;
    bossIntroShown=false;
    powerBaseline=0;
    card.classList.add('hidden');
    document.body.classList.remove('reliable-story-open');
    originalReset();
    suppressLegacy();
    if(S.mode==='story')S.mode='play';
    grantBossAmmo();
    if(S.boss&&!bossIntroShown)setTimeout(()=>{if(S.boss&&!bossIntroShown)openCard('boss')},0);
  };

  const originalShoot=D.game.shoot;
  D.game.shoot=()=>{
    grantBossAmmo();
    originalShoot();
    grantBossAmmo();
  };

  const originalUpdate=D.game.update;
  D.game.update=dt=>{
    const before=Number(S.stats&&S.stats.powers)||0;
    originalUpdate(dt);

    const legacyVisible=legacyCard&&!legacyCard.classList.contains('hidden');
    if(legacyVisible){
      suppressLegacy();
      if(S.mode==='story'&&!activeKind)S.mode='play';
    }

    grantBossAmmo();

    const after=Number(S.stats&&S.stats.powers)||0;
    if(!guideSeen&&!activeKind&&after>Math.max(before,powerBaseline))openCard('powers');
    powerBaseline=after;

    if(S.boss&&!bossIntroShown&&!activeKind){
      if(S.mode==='story')S.mode='play';
      if(S.mode==='play')openCard('boss');
    }

    if(S.boss&&D.ui.power)D.ui.power.textContent='Laser Blaster (∞)';
  };

  D.cutsceneReliability={
    showPowerGuide:()=>openCard('powers'),
    showBossIntro:()=>openCard('boss'),
    close:closeCard,
    get activeKind(){return activeKind},
    get bossIntroShown(){return bossIntroShown}
  };
})();