(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.ui)return;
  const S=D.state,A=D.arrays;
  const stage=document.querySelector('.stage');
  if(!stage)return;

  const POWER_GUIDE_KEY='dinoCatDashPowerGuideSeen';
  const POWER_ROWS=[
    ['Flame Breath','Turns bad decisions into toasted obstacles.'],
    ['Laser Blaster','For dinosaurs who prefer extremely focused problem-solving.'],
    ['Shield Egg','Breakfast, but protective. Science refuses to comment.'],
    ['Super Sneakers','Tiny shoes. Huge jumps. Absolutely no explanation.'],
    ['Star Magnet','Because walking three inches for a star is exhausting.'],
    ['Time Freeze','Slows everything except Rex’s confidence.'],
    ['Golden Rex','Invincible, shiny, and legally impossible to ignore.'],
    ['Mega Roar','Clears the screen and annoys every cat in the neighborhood.'],
    ['Extra Life','One complimentary do-over. Receipt not required.'],
    ['Bonus Star','Makes the score multiplier behave irresponsibly.']
  ];

  const cutscene=document.createElement('section');
  cutscene.id='storyCard';
  cutscene.className='story-card hidden';
  cutscene.setAttribute('role','dialog');
  cutscene.setAttribute('aria-modal','true');
  cutscene.innerHTML=`
    <div class="story-panel">
      <p id="storyKicker" class="story-kicker"></p>
      <h2 id="storyTitle"></h2>
      <canvas id="storyArt" width="960" height="205" aria-label="Story illustration"></canvas>
      <p id="storyCopy" class="story-copy"></p>
      <div id="storyPowerGrid" class="story-power-grid hidden"></div>
      <button id="storyReady" type="button">Ready</button>
    </div>`;
  stage.appendChild(cutscene);

  const pace=document.createElement('div');
  pace.id='paceBadge';
  pace.className='pace-badge';
  pace.innerHTML='<span>Pace</span><strong>Warm-Up</strong><i><b></b></i>';
  stage.appendChild(pace);

  const story={
    kicker:document.getElementById('storyKicker'),
    title:document.getElementById('storyTitle'),
    art:document.getElementById('storyArt'),
    copy:document.getElementById('storyCopy'),
    grid:document.getElementById('storyPowerGrid'),
    ready:document.getElementById('storyReady')
  };
  const art=story.art.getContext('2d');
  let readyAction=null;
  let bossCardShown=false;
  let queuedBoss=false;
  let lastPowers=0;
  let paceTier=-1;

  const safeGet=(key,fallback)=>{try{return D.store.get(key,fallback)}catch{return fallback}};
  const safeSet=(key,value)=>{try{D.store.set(key,value)}catch{}};

  function rounded(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }
  function fillRounded(ctx,x,y,w,h,r,color){ctx.fillStyle=color;rounded(ctx,x,y,w,h,r);ctx.fill()}
  function line(ctx,x1,y1,x2,y2,color,width=4){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}

  function drawRex(ctx,x,y,scale=1){
    const skin=D.skins[S.skin]||D.skins.jungle;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(28,48);ctx.quadraticCurveTo(-30,24,-68,52);ctx.quadraticCurveTo(-13,66,38,66);ctx.closePath();ctx.fill();
    ctx.fillStyle=skin.body;ctx.beginPath();ctx.ellipse(49,53,47,36,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.belly;ctx.beginPath();ctx.ellipse(61,61,25,23,.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=skin.stripe;ctx.lineWidth=7;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(24+i*15,25+i*2);ctx.lineTo(33+i*15,38+i*3);ctx.stroke()}
    fillRounded(ctx,23,73,18,29,7,skin.body);fillRounded(ctx,16,94,34,11,5,skin.dark);
    fillRounded(ctx,65,73,18,29,7,skin.body);fillRounded(ctx,58,94,34,11,5,skin.dark);
    fillRounded(ctx,67,14,37,53,14,skin.body);ctx.fillStyle=skin.body;ctx.beginPath();ctx.ellipse(103,27,39,29,0,0,Math.PI*2);ctx.fill();fillRounded(ctx,96,28,50,24,10,skin.body);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(101,48);ctx.lineTo(145,48);ctx.lineTo(131,64);ctx.lineTo(99,57);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(106+i*9,48);ctx.lineTo(111+i*9,57);ctx.lineTo(116+i*9,48);ctx.fill()}
    ctx.beginPath();ctx.ellipse(114,20,10,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#142018';ctx.beginPath();ctx.arc(118,21,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.bandana;ctx.beginPath();ctx.moveTo(70,43);ctx.lineTo(94,50);ctx.lineTo(71,58);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(74,52);ctx.lineTo(57,63);ctx.lineTo(70,48);ctx.fill();
    ctx.restore();
  }

  function drawPowerIcon(ctx,type,x,y){
    ctx.save();ctx.translate(x,y);ctx.shadowColor='#ffffff88';ctx.shadowBlur=12;
    if(type===0){ctx.fillStyle='#ff6b2e';ctx.beginPath();ctx.moveTo(0,-24);ctx.quadraticCurveTo(24,-4,9,22);ctx.quadraticCurveTo(-5,31,-15,15);ctx.quadraticCurveTo(-22,-4,0,-24);ctx.fill();ctx.fillStyle='#ffe36b';ctx.beginPath();ctx.moveTo(1,-7);ctx.quadraticCurveTo(11,6,3,17);ctx.quadraticCurveTo(-8,6,1,-7);ctx.fill()}
    else if(type===1){fillRounded(ctx,-24,-8,41,15,5,'#35445f');fillRounded(ctx,-5,5,9,19,3,'#202a40');ctx.fillStyle='#66efff';ctx.fillRect(12,-4,23,7)}
    else if(type===2){ctx.fillStyle='#f9f1df';ctx.beginPath();ctx.ellipse(0,0,18,26,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#72e2ff';ctx.lineWidth=5;ctx.stroke()}
    else if(type===3){ctx.fillStyle='#ff625c';ctx.beginPath();ctx.moveTo(-25,-5);ctx.lineTo(4,-5);ctx.lineTo(22,10);ctx.lineTo(18,21);ctx.lineTo(-26,21);ctx.closePath();ctx.fill();line(ctx,-14,3,4,3,'#fff',3);line(ctx,-8,10,10,10,'#fff',3)}
    else if(type===4){ctx.strokeStyle='#ef4d5a';ctx.lineWidth=13;ctx.beginPath();ctx.arc(0,0,20,.15*Math.PI,.85*Math.PI,true);ctx.stroke();line(ctx,-19,11,-23,22,'#75def4',7);line(ctx,19,11,23,22,'#75def4',7)}
    else if(type===5){ctx.strokeStyle='#8cecff';ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);line(ctx,-24,0,24,0,'#8cecff',5);ctx.restore()}}
    else if(type===6){ctx.fillStyle='#ffd33e';ctx.beginPath();ctx.ellipse(-3,4,23,17,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(17,-9,14,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-20,5);ctx.lineTo(-36,-9);ctx.lineTo(-19,15);ctx.fill()}
    else if(type===7){for(let i=0;i<3;i++){ctx.strokeStyle='#ff9b49';ctx.lineWidth=6;ctx.beginPath();ctx.arc(-12,0,13+i*10,-.8,.8);ctx.stroke()}}
    else if(type===8){ctx.fillStyle='#ff6683';ctx.beginPath();ctx.moveTo(0,25);ctx.bezierCurveTo(-35,1,-26,-23,-9,-23);ctx.bezierCurveTo(0,-23,6,-16,9,-10);ctx.bezierCurveTo(16,-23,39,-17,31,5);ctx.bezierCurveTo(26,15,13,24,0,32);ctx.fill()}
    else{ctx.fillStyle='#ffe15b';ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?10:25,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}
    ctx.restore();
  }

  function drawPowerScene(){
    const w=story.art.width,h=story.art.height;
    const g=art.createLinearGradient(0,0,w,h);g.addColorStop(0,'#19345e');g.addColorStop(.5,'#3b2d6e');g.addColorStop(1,'#7c385c');art.fillStyle=g;art.fillRect(0,0,w,h);
    art.fillStyle='#ffffff16';for(let i=0;i<20;i++){art.beginPath();art.arc(30+i*51,25+(i%4)*46,3+(i%3),0,Math.PI*2);art.fill()}
    drawRex(art,118,63,1.05);
    art.fillStyle='#fff';art.font='900 30px system-ui';art.fillText('REX FOUND A SHINY THING',315,48);art.font='700 16px system-ui';art.fillStyle='#dce9ff';art.fillText('Naturally, this requires a complete safety briefing.',315,74);
    for(let i=0;i<10;i++){const x=340+(i%5)*116,y=126+Math.floor(i/5)*62;art.fillStyle='#0a1227aa';art.beginPath();art.arc(x,y,29,0,Math.PI*2);art.fill();drawPowerIcon(art,i,x,y)}
  }

  function drawBossScene(){
    const w=story.art.width,h=story.art.height;
    const g=art.createLinearGradient(0,0,0,h);g.addColorStop(0,'#322659');g.addColorStop(1,'#12142d');art.fillStyle=g;art.fillRect(0,0,w,h);
    art.fillStyle='#17162e';for(let i=0;i<8;i++){art.fillRect(i*135,56,92,h);art.beginPath();art.arc(i*135+46,58,46,Math.PI,0);art.fill()}
    art.save();art.translate(380,12);art.scale(1.05,1.05);
    art.fillStyle='#c9824e';art.beginPath();art.ellipse(90,125,83,70,0,0,Math.PI*2);art.fill();art.beginPath();art.arc(125,59,62,0,Math.PI*2);art.fill();
    art.beginPath();art.moveTo(78,25);art.lineTo(88,-20);art.lineTo(113,22);art.moveTo(135,18);art.lineTo(166,-17);art.lineTo(171,34);art.fill();
    art.strokeStyle='#744425';art.lineWidth=9;for(let i=0;i<4;i++){art.beginPath();art.moveTo(62+i*24,85);art.lineTo(73+i*21,110);art.stroke()}
    art.fillStyle='#fff';art.beginPath();art.ellipse(109,57,13,16,0,0,Math.PI*2);art.ellipse(146,54,13,16,0,0,Math.PI*2);art.fill();art.fillStyle='#17201d';art.beginPath();art.arc(113,59,5,0,Math.PI*2);art.arc(143,56,5,0,Math.PI*2);art.fill();
    line(art,96,38,120,44,'#4a2c20',7);line(art,136,44,159,35,'#4a2c20',7);
    art.fillStyle='#ffd04d';art.beginPath();art.moveTo(88,9);art.lineTo(94,-24);art.lineTo(113,-5);art.lineTo(130,-32);art.lineTo(146,-5);art.lineTo(166,-24);art.lineTo(169,10);art.closePath();art.fill();
    art.restore();
    fillRounded(art,620,102,220,65,28,'#32435e');art.fillStyle='#6fe7ff';art.beginPath();art.arc(680,136,17,0,Math.PI*2);art.arc(780,136,17,0,Math.PI*2);art.fill();
    art.fillStyle='#fff';art.font='900 31px system-ui';art.fillText('SIR WHISKERS',42,56);art.font='700 18px system-ui';art.fillStyle='#dce5ff';art.fillText('Self-appointed king. Certified yarn hoarder.',42,87);art.fillText('Currently armed with one suspicious robot vacuum.',42,114);
  }

  function closeStory(){
    cutscene.classList.add('hidden');document.body.classList.remove('story-open');
    const action=readyAction;readyAction=null;
    S.mode='play';S.last=performance.now();
    if(action)action();
    if(queuedBoss){queuedBoss=false;setTimeout(()=>showBossIntro(),0)}
  }

  function openStory(kind,action){
    readyAction=action||null;S.mode='story';document.body.classList.add('story-open');cutscene.classList.remove('hidden');
    story.grid.classList.toggle('hidden',kind!=='powers');
    if(kind==='powers'){
      story.kicker.textContent='FIRST POWER-UP DISCOVERED';story.title.textContent='Rex’s Questionably Responsible Power Guide';
      story.copy.textContent='Rex has no instruction manual, but he does have confidence. Here is what every shiny object does before he starts pressing buttons.';
      story.ready.textContent='Got It — Resume the Chaos';
      story.grid.innerHTML=POWER_ROWS.map(([name,copy],i)=>`<article><i data-power="${i}"></i><div><strong>${name}</strong><span>${copy}</span></div></article>`).join('');
      drawPowerScene();
    }else{
      story.kicker.textContent='FINAL BOSS AHEAD';story.title.textContent='Sir Whiskers Requests Your Immediate Defeat';
      story.copy.textContent='He has declared himself king, taxed all yarn, and parked a robot vacuum in the arena. This feels like an overreaction.';
      story.ready.textContent='I’m Ready — Ruin His Nap';story.grid.innerHTML='';drawBossScene();
    }
    try{story.ready.focus({preventScroll:true})}catch{story.ready.focus()}
  }

  story.ready.addEventListener('click',e=>{e.preventDefault();closeStory()});

  function showPowerGuide(){
    if(safeGet(POWER_GUIDE_KEY,false))return;
    safeSet(POWER_GUIDE_KEY,true);openStory('powers');
  }
  function showBossIntro(){
    if(bossCardShown)return;
    if(S.mode==='story'){queuedBoss=true;return}
    bossCardShown=true;openStory('boss');
  }

  function paceData(){
    const progress=D.clamp((S.time+S.world*20)/120,0,1);
    const tiers=[['Warm-Up',0],['Picking Up',.18],['Fast',.4],['Wild',.65],['Rex Mode',.85]];
    let index=0;for(let i=0;i<tiers.length;i++)if(progress>=tiers[i][1])index=i;
    return{progress,index,label:tiers[index][0],speed:Math.min(690,310+progress*310+S.world*18)};
  }

  function updatePaceBadge(data){
    pace.querySelector('strong').textContent=data.label;pace.querySelector('b').style.width=`${Math.round(data.progress*100)}%`;
    pace.classList.toggle('danger',data.index>=3);
    if(data.index>paceTier&&paceTier>=0&&S.time>8&&D.game.toast)D.game.toast(`Pace up: ${data.label}`);
    paceTier=data.index;
  }

  const originalReset=D.game.reset;
  D.game.reset=()=>{
    bossCardShown=false;queuedBoss=false;lastPowers=0;paceTier=-1;
    originalReset();
    S.spawn=1.85;
    updatePaceBadge(paceData());
    if(S.boss)showBossIntro();
  };

  const originalUpdate=D.game.update;
  D.game.update=dt=>{
    const hadBoss=!!S.boss;
    const powersBefore=S.stats&&Number(S.stats.powers)||0;
    const spawnBefore=S.spawn;
    originalUpdate(dt);

    if(S.mode==='play'){
      const data=paceData();
      const baseSpeed=S.speed;
      const delta=data.speed-baseSpeed;
      if(Math.abs(delta)>.01&&!S.boss){
        for(const o of A.obstacles)o.x-=delta*dt;
        for(const it of A.items)it.x-=delta*.78*dt;
        if(S.stats)S.stats.distance+=delta*dt/16;
      }
      S.speed=data.speed;
      if(!S.boss&&S.spawn>spawnBefore+.2){
        const min=1.55-.78*data.progress;
        const max=2.05-1.0*data.progress;
        S.spawn=D.rnd(Math.max(.72,min),Math.max(1.02,max));
      }
      updatePaceBadge(data);
    }

    const powersAfter=S.stats&&Number(S.stats.powers)||0;
    if(powersBefore===0&&powersAfter>0&&!safeGet(POWER_GUIDE_KEY,false))showPowerGuide();
    lastPowers=powersAfter;
    if(!hadBoss&&S.boss)showBossIntro();
    pace.classList.toggle('visible',S.mode==='play'||S.mode==='pause'||S.mode==='story');
  };

  addEventListener('keydown',e=>{
    if(S.mode==='story'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();closeStory()}
  });

  updatePaceBadge(paceData());
})();
