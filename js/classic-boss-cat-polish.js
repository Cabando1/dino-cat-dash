(()=>{
  'use strict';

  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.arrays||!D.render||!D.ctx||!D.classicMobile)return;

  const S=D.state;
  const A=D.arrays;
  const ctx=D.ctx;
  const TAU=D.TAU||Math.PI*2;
  const FIRST_BOSS_SECONDS=75;
  const CASTLE_START_SECONDS=55;
  const CASTLE_SECONDS=20;

  let forcedCastle=false;
  let introRequested=false;
  let introPolished=false;

  function line(x1,y1,x2,y2,color,width=2){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function roundRect(x,y,w,h,r){
    r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }
  function fillRoundRect(x,y,w,h,r,color){ctx.fillStyle=color;roundRect(x,y,w,h,r);ctx.fill()}

  function drawSleepingCat(obstacle){
    const x=obstacle.x;
    const y=obstacle.y+Math.sin(Number(obstacle.wobble)||0)*2;
    const w=obstacle.w;
    const h=obstacle.h;
    const fur='#d18a55';
    const light='#efb87f';
    const dark='#6f402a';

    ctx.save();
    ctx.translate(x,y);
    ctx.strokeStyle=dark;ctx.lineWidth=Math.max(2,w*.025);ctx.lineJoin='round';ctx.lineCap='round';

    ctx.fillStyle='rgba(31,22,18,.2)';ctx.beginPath();ctx.ellipse(w*.48,h*.91,w*.44,h*.12,0,0,TAU);ctx.fill();
    ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(w*.42,h*.65,w*.38,h*.29,-.04,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(w*.75,h*.49,h*.29,0,TAU);ctx.fill();ctx.stroke();

    ctx.fillStyle=fur;ctx.beginPath();ctx.moveTo(w*.61,h*.33);ctx.lineTo(w*.66,h*.05);ctx.lineTo(w*.76,h*.31);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(w*.78,h*.30);ctx.lineTo(w*.9,h*.05);ctx.lineTo(w*.95,h*.36);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f2a7a0';ctx.beginPath();ctx.moveTo(w*.65,h*.25);ctx.lineTo(w*.67,h*.12);ctx.lineTo(w*.72,h*.26);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(w*.83,h*.25);ctx.lineTo(w*.89,h*.12);ctx.lineTo(w*.91,h*.29);ctx.closePath();ctx.fill();

    ctx.strokeStyle=dark;ctx.lineWidth=Math.max(3,w*.035);ctx.beginPath();ctx.arc(w*.23,h*.63,w*.25,.35,4.7);ctx.stroke();
    ctx.fillStyle=light;ctx.beginPath();ctx.ellipse(w*.76,h*.62,w*.15,h*.12,0,0,TAU);ctx.fill();
    ctx.strokeStyle=dark;ctx.lineWidth=Math.max(1.5,w*.018);
    ctx.beginPath();ctx.arc(w*.69,h*.48,w*.055,.18,Math.PI-.18);ctx.stroke();
    ctx.beginPath();ctx.arc(w*.82,h*.48,w*.055,.18,Math.PI-.18);ctx.stroke();
    ctx.fillStyle='#7d3d42';ctx.beginPath();ctx.moveTo(w*.755,h*.56);ctx.lineTo(w*.79,h*.56);ctx.lineTo(w*.773,h*.6);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.arc(w*.773,h*.63,w*.05,.15,Math.PI-.15);ctx.stroke();
    for(const offset of[-.02,.055]){
      line(w*.67,h*(.59+offset),w*.52,h*(.55+offset),dark,Math.max(1,w*.012));
      line(w*.86,h*(.59+offset),w*.99,h*(.55+offset),dark,Math.max(1,w*.012));
    }

    ctx.strokeStyle='#9a5736';ctx.lineWidth=Math.max(2,w*.022);
    for(const px of[.28,.39,.5]){ctx.beginPath();ctx.moveTo(w*px,h*.43);ctx.lineTo(w*(px+.04),h*.55);ctx.stroke()}
    ctx.fillStyle=light;ctx.beginPath();ctx.ellipse(w*.54,h*.81,w*.16,h*.09,0,0,TAU);ctx.ellipse(w*.72,h*.81,w*.15,h*.09,0,0,TAU);ctx.fill();
    ctx.strokeStyle=dark;ctx.lineWidth=Math.max(1,w*.012);for(const px of[.49,.55,.67,.73])line(w*px,h*.79,w*(px+.015),h*.84,dark,Math.max(1,w*.01));

    ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle='rgba(59,43,65,.5)';ctx.lineWidth=1.5;ctx.font=`900 ${Math.max(11,h*.35)}px system-ui`;ctx.textAlign='center';ctx.strokeText('Z',w*.35,h*.2);ctx.fillText('Z',w*.35,h*.2);ctx.font=`900 ${Math.max(8,h*.24)}px system-ui`;ctx.strokeText('Z',w*.18,h*.06);ctx.fillText('Z',w*.18,h*.06);
    ctx.restore();
  }

  function drawArmoredCat(obstacle){
    const x=obstacle.x;
    const y=obstacle.y+Math.sin(Number(obstacle.wobble)||0)*2;
    const w=obstacle.w;
    const h=obstacle.h;
    const fur='#aeb8c1';
    const dark='#4d5964';
    const steel='#718391';
    const shine='#dbe8ef';

    ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';
    ctx.fillStyle='rgba(24,29,35,.22)';ctx.beginPath();ctx.ellipse(w*.5,h*.94,w*.39,h*.08,0,0,TAU);ctx.fill();
    ctx.fillStyle=fur;ctx.strokeStyle=dark;ctx.lineWidth=Math.max(2,w*.035);
    ctx.beginPath();ctx.ellipse(w*.48,h*.67,w*.32,h*.3,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(w*.52,h*.3,w*.31,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(w*.26,h*.22);ctx.lineTo(w*.3,h*.01);ctx.lineTo(w*.43,h*.18);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(w*.59,h*.17);ctx.lineTo(w*.73,h*.01);ctx.lineTo(w*.78,h*.23);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f4a8a2';ctx.beginPath();ctx.moveTo(w*.31,h*.17);ctx.lineTo(w*.32,h*.07);ctx.lineTo(w*.39,h*.17);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(w*.65,h*.15);ctx.lineTo(w*.72,h*.06);ctx.lineTo(w*.73,h*.19);ctx.closePath();ctx.fill();

    ctx.fillStyle=steel;roundRect(w*.17,h*.45,w*.62,h*.39,w*.09);ctx.fill();ctx.stroke();
    ctx.fillStyle='#596b78';roundRect(w*.24,h*.51,w*.48,h*.23,w*.05);ctx.fill();
    ctx.strokeStyle=shine;ctx.lineWidth=Math.max(1.5,w*.023);ctx.strokeRect(w*.31,h*.56,w*.34,h*.12);
    ctx.fillStyle='#c6d4dc';ctx.beginPath();ctx.moveTo(w*.22,h*.25);ctx.quadraticCurveTo(w*.5,h*.05,w*.8,h*.25);ctx.lineTo(w*.73,h*.35);ctx.quadraticCurveTo(w*.5,h*.22,w*.28,h*.35);ctx.closePath();ctx.fill();ctx.strokeStyle=dark;ctx.stroke();
    ctx.fillStyle='#f2cd51';ctx.beginPath();ctx.arc(w*.5,h*.63,w*.055,0,TAU);ctx.fill();

    line(w*.36,h*.3,w*.46,h*.33,'#26313a',Math.max(2,w*.03));line(w*.57,h*.33,w*.67,h*.3,'#26313a',Math.max(2,w*.03));
    ctx.fillStyle='#182129';ctx.beginPath();ctx.arc(w*.42,h*.35,w*.035,0,TAU);ctx.arc(w*.61,h*.35,w*.035,0,TAU);ctx.fill();
    ctx.fillStyle='#845057';ctx.beginPath();ctx.moveTo(w*.49,h*.41);ctx.lineTo(w*.55,h*.41);ctx.lineTo(w*.52,h*.46);ctx.closePath();ctx.fill();
    line(w*.52,h*.46,w*.52,h*.51,dark,Math.max(1.5,w*.018));

    ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(w*.28,h*.87,w*.14,h*.1,0,0,TAU);ctx.ellipse(w*.68,h*.87,w*.14,h*.1,0,0,TAU);ctx.fill();ctx.strokeStyle=dark;ctx.stroke();
    ctx.restore();
  }

  function drawSingleCrown(x,y,w,h,rotation,front=false){
    ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(rotation);ctx.translate(-w/2,-h/2);
    ctx.lineJoin='round';ctx.strokeStyle='#8b5816';ctx.lineWidth=Math.max(2,w*.045);
    const gold=ctx.createLinearGradient(0,0,w,h);gold.addColorStop(0,'#fff08a');gold.addColorStop(.45,'#f6c73e');gold.addColorStop(1,'#d58a18');ctx.fillStyle=gold;
    ctx.beginPath();ctx.moveTo(w*.08,h*.78);ctx.lineTo(w*.13,h*.22);ctx.lineTo(w*.35,h*.49);ctx.lineTo(w*.5,h*.08);ctx.lineTo(w*.66,h*.49);ctx.lineTo(w*.88,h*.22);ctx.lineTo(w*.93,h*.78);ctx.closePath();ctx.fill();ctx.stroke();
    fillRoundRect(w*.06,h*.7,w*.9,h*.25,h*.08,front?'#e6a52b':'#d99422');ctx.strokeStyle='#8b5816';ctx.stroke();
    const jewels=[['#ee4f63',.27],['#4ec5e8',.5],['#7fc45a',.73]];for(const [color,px] of jewels){ctx.fillStyle=color;ctx.beginPath();ctx.arc(w*px,h*.81,Math.max(2,w*.055),0,TAU);ctx.fill();ctx.strokeStyle='rgba(92,52,16,.65)';ctx.lineWidth=1;ctx.stroke()}
    ctx.strokeStyle='rgba(255,255,255,.68)';ctx.lineWidth=Math.max(1,w*.018);ctx.beginPath();ctx.moveTo(w*.22,h*.37);ctx.lineTo(w*.26,h*.63);ctx.stroke();
    ctx.restore();
  }

  function drawCrownPile(obstacle){
    const x=obstacle.x;
    const y=obstacle.y+Math.sin(Number(obstacle.wobble)||0)*2;
    const w=obstacle.w;
    const h=obstacle.h;
    ctx.save();
    ctx.fillStyle='rgba(41,25,13,.22)';ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.91,w*.47,h*.1,0,0,TAU);ctx.fill();
    drawSingleCrown(x+w*.02,y+h*.24,w*.58,h*.62,-.17,false);
    drawSingleCrown(x+w*.4,y+h*.27,w*.57,h*.59,.16,false);
    drawSingleCrown(x+w*.2,y+h*.02,w*.65,h*.72,-.015,true);
    ctx.restore();
  }

  function drawBossPolish(boss){
    if(!boss)return;
    const scale=Math.min((boss.w||205)/205,(boss.h||225)/225);
    ctx.save();ctx.translate(boss.x,boss.y);ctx.scale(scale,scale);
    drawSingleCrown(84,-39,84,54,-.015,true);
    ctx.fillStyle='#ef9d8e';ctx.beginPath();ctx.moveTo(88,12);ctx.lineTo(91,-8);ctx.lineTo(105,13);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(141,8);ctx.lineTo(160,-7);ctx.lineTo(162,18);ctx.closePath();ctx.fill();
    ctx.fillStyle='#efb27c';ctx.beginPath();ctx.ellipse(121,75,18,13,0,0,TAU);ctx.ellipse(141,74,18,13,0,0,TAU);ctx.fill();
    ctx.fillStyle='#884750';ctx.beginPath();ctx.moveTo(126,67);ctx.lineTo(137,67);ctx.lineTo(131.5,75);ctx.closePath();ctx.fill();
    line(131.5,75,131.5,82,'#5a3425',2);ctx.strokeStyle='#5a3425';ctx.lineWidth=2;ctx.beginPath();ctx.arc(124,80,8,.05,1.25);ctx.stroke();ctx.beginPath();ctx.arc(139,80,8,1.9,3.05);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(108,48,2.5,0,TAU);ctx.arc(143,45,2.5,0,TAU);ctx.fill();
    for(const yy of[70,78,86]){line(111,yy,71,yy-6,'#5a3425',2);line(151,yy,190,yy-6,'#5a3425',2)}
    ctx.restore();
  }

  function polishBossIntro(){
    const modal=document.getElementById('classicBossIntro');
    const canvas=document.getElementById('classicBossArt');
    if(!modal||!canvas||modal.classList.contains('hidden')){introPolished=false;return}
    if(introPolished)return;
    introPolished=true;
    const portrait=canvas.getContext('2d');
    portrait.save();portrait.translate(700,65);portrait.scale(1.05,1.05);
    try{
      portrait.save();portrait.translate(130,-10.5);portrait.rotate(-.015);portrait.translate(-48,-28.5);
      const crownGold=portrait.createLinearGradient(0,0,96,57);crownGold.addColorStop(0,'#fff08a');crownGold.addColorStop(.45,'#f6c73e');crownGold.addColorStop(1,'#d58a18');
      portrait.fillStyle=crownGold;portrait.strokeStyle='#8b5816';portrait.lineWidth=4;portrait.lineJoin='round';portrait.beginPath();portrait.moveTo(8,44);portrait.lineTo(13,13);portrait.lineTo(34,28);portrait.lineTo(48,5);portrait.lineTo(63,28);portrait.lineTo(85,13);portrait.lineTo(90,44);portrait.closePath();portrait.fill();portrait.stroke();
      portrait.fillStyle='#e6a52b';portrait.fillRect(6,40,86,14);portrait.strokeRect(6,40,86,14);
      for(const [color,jx] of [['#ee4f63',26],['#4ec5e8',48],['#7fc45a',70]]){portrait.fillStyle=color;portrait.beginPath();portrait.arc(jx,47,4,0,TAU);portrait.fill()}
      portrait.restore();
      portrait.fillStyle='#ef9d8e';portrait.beginPath();portrait.moveTo(89,21);portrait.lineTo(94,-4);portrait.lineTo(110,21);portrait.closePath();portrait.fill();portrait.beginPath();portrait.moveTo(143,17);portrait.lineTo(170,-2);portrait.lineTo(173,29);portrait.closePath();portrait.fill();
      portrait.fillStyle='#efb27c';portrait.beginPath();portrait.ellipse(119,82,20,14,0,0,TAU);portrait.ellipse(142,81,20,14,0,0,TAU);portrait.fill();
      portrait.fillStyle='#884750';portrait.beginPath();portrait.moveTo(125,72);portrait.lineTo(138,72);portrait.lineTo(131.5,81);portrait.closePath();portrait.fill();
      portrait.strokeStyle='#5a3425';portrait.lineWidth=2;portrait.lineCap='round';for(const yy of[77,87,97]){portrait.beginPath();portrait.moveTo(112,yy);portrait.lineTo(67,yy-7);portrait.stroke();portrait.beginPath();portrait.moveTo(151,yy);portrait.lineTo(194,yy-7);portrait.stroke()}
      portrait.fillStyle='#fff';portrait.beginPath();portrait.arc(115,57,2.8,0,TAU);portrait.arc(146,54,2.8,0,TAU);portrait.fill();
    }finally{portrait.restore()}
  }

  const originalDraw=D.render.draw;
  D.render.draw=()=>{
    const hidden=[];
    for(const obstacle of A.obstacles){
      if(obstacle.type==='cat'||obstacle.type==='armorCat'||obstacle.type==='crown'){
        hidden.push([obstacle,obstacle.type]);
        obstacle.type='classicPolishHidden';
      }
    }
    try{originalDraw()}finally{for(const [obstacle,type] of hidden)obstacle.type=type}
    for(const [obstacle,type] of hidden){
      if(type==='cat')drawSleepingCat(obstacle);
      else if(type==='armorCat')drawArmoredCat(obstacle);
      else drawCrownPile(obstacle);
    }
    if(S.boss)drawBossPolish(S.boss);
    polishBossIntro();
  };

  function runTime(){return D.gameplayV3?Number(D.gameplayV3.runTime)||0:Number(S.time)||0}
  function castleTime(){return D.gameplayV3?Number(D.gameplayV3.castleTime)||0:Math.max(0,runTime()-CASTLE_START_SECONDS)}

  function enterCastleEarly(){
    if(forcedCastle||Number(S.selectedWorld)===4||S.boss||S.world>=4)return;
    forcedCastle=true;
    S.world=4;S.worldBanner=2.2;S.maxWorld=Math.max(4,S.maxWorld||0);
    try{D.store.set('dinoCatDashMaxWorld',S.maxWorld)}catch{}
    A.obstacles.length=0;A.enemies.length=0;
    if(D.game.toast)D.game.toast('Cat Castle — Sir Whiskers appears in about 20 seconds');
    D.game.updateHud();
  }

  function requestBossIntro(){
    if(introRequested||Number(S.selectedWorld)===4||S.boss)return;
    introRequested=true;
    A.obstacles.length=0;A.enemies.length=0;
    D.classicMobile.openBossIntro();
    setTimeout(polishBossIntro,0);
  }

  const originalReset=D.game.reset;
  D.game.reset=()=>{
    forcedCastle=false;introRequested=false;introPolished=false;
    originalReset();
    setTimeout(polishBossIntro,0);
  };

  const originalUpdate=D.game.update;
  D.game.update=dt=>{
    originalUpdate(dt);
    const direct=Number(S.selectedWorld)===4;
    if(!direct&&!S.boss&&S.mode==='play'){
      const elapsed=runTime();
      if(elapsed>=CASTLE_START_SECONDS)enterCastleEarly();
      if(S.world===4&&!introRequested&&elapsed>=FIRST_BOSS_SECONDS&&castleTime()>=CASTLE_SECONDS)requestBossIntro();
      if(S.world===4&&D.ui&&D.ui.world&&!introRequested){
        const remaining=Math.max(0,Math.ceil(FIRST_BOSS_SECONDS-elapsed));
        D.ui.world.textContent=`Cat Castle · Boss ${remaining}s`;
      }
    }
    if(S.mode==='classicBossIntro')polishBossIntro();
  };

  const banner=document.querySelector('.release-banner span');
  if(banner)banner.textContent='CLASSIC VIEW • FASTER FIRST BOSS • POLISHED CATS & CROWNS';
  const instructions=document.getElementById('classicInstructions');
  if(instructions){
    const sections=[...instructions.querySelectorAll('.classic-section')];
    const bossSection=sections.find(section=>section.querySelector('h3')?.textContent.trim()==='Sir Whiskers');
    const paragraph=bossSection&&bossSection.querySelector('p');
    if(paragraph)paragraph.innerHTML='The first boss arrives after about <strong>75 seconds</strong>, including roughly twenty seconds in Cat Castle. Shoot continuously, jump when the game says <strong>JUMP NOW</strong>, and save Mega Roar for crowded moments.';
  }

  D.classicPolish={version:'3.1.1',FIRST_BOSS_SECONDS,CASTLE_START_SECONDS,CASTLE_SECONDS};
})();
