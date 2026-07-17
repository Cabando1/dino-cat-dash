(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.state||!D.player)return;

  const card=document.getElementById('reliableStoryCard');
  if(!card)return;
  const panel=card.querySelector('.reliable-story-panel');
  const canvas=document.getElementById('reliableStoryArt');
  const copy=document.getElementById('reliableStoryCopy');
  const grid=document.getElementById('reliablePowerGrid');
  const ready=document.getElementById('reliableStoryReady');
  if(!panel||!canvas||!copy||!grid||!ready)return;

  const instructions=document.createElement('section');
  instructions.id='reliableStoryInstructions';
  instructions.className='reliable-story-instructions';
  copy.insertAdjacentElement('afterend',instructions);

  const note=document.createElement('p');
  note.id='reliableStoryNote';
  note.className='reliable-story-note';
  instructions.insertAdjacentElement('afterend',note);

  const powerDetails=[
    ['Flame Breath','Tap Shoot. You get 18 fire blasts that destroy obstacles and bounce once.'],
    ['Laser Blaster','Tap Shoot for fast straight shots. Regular ammo is limited; boss ammo is unlimited.'],
    ['Shield Egg','Blocks the next hit automatically. Rex can carry up to three shields.'],
    ['Super Sneakers','Immediately gives Rex an extra-high jump for 7 seconds. Tiny shoes, major insurance risk.'],
    ['Star Magnet','Pulls nearby stars and bonuses toward Rex for 8 seconds. Laziness becomes strategy.'],
    ['Time Freeze','Slows hazards and boss attacks for 6 seconds while Rex keeps moving normally.'],
    ['Golden Rex','Makes Rex invincible for 6 seconds. Shiny, fearless, and difficult to insure.'],
    ['Mega Roar','Press the orange Mega Roar button to clear hazards and damage Sir Whiskers.'],
    ['Extra Life','Restores one heart, up to the five-heart maximum. No paperwork required.'],
    ['Bonus Star','Raises the score combo. Keep collecting before the combo timer runs out.']
  ];

  function round(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }

  function box(ctx,x,y,w,h,r,fill,stroke){
    round(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
  }

  function drawRex(ctx,x,y,scale=1){
    const skin=D.skins[D.state.skin]||D.skins.jungle;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(15,54);ctx.quadraticCurveTo(-64,20,-92,58);ctx.quadraticCurveTo(-25,75,45,69);ctx.closePath();ctx.fill();
    ctx.fillStyle=skin.body;ctx.beginPath();ctx.ellipse(52,56,55,40,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.belly;ctx.beginPath();ctx.ellipse(65,66,28,25,.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=skin.stripe;ctx.lineWidth=8;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(23+i*18,25+i*3);ctx.lineTo(34+i*18,42+i*3);ctx.stroke()}
    for(const lx of[22,69]){box(ctx,lx,78,20,31,7,skin.body);box(ctx,lx-9,101,39,12,5,skin.dark)}
    box(ctx,72,12,41,58,15,skin.body);ctx.beginPath();ctx.ellipse(114,28,43,32,0,0,Math.PI*2);ctx.fill();box(ctx,105,29,56,25,10,skin.body);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(110,50);ctx.lineTo(160,50);ctx.lineTo(143,68);ctx.lineTo(107,59);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(115+i*10,50);ctx.lineTo(120+i*10,60);ctx.lineTo(125+i*10,50);ctx.fill()}
    ctx.beginPath();ctx.ellipse(125,20,11,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#122018';ctx.beginPath();ctx.arc(129,21,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.bandana;ctx.beginPath();ctx.moveTo(75,44);ctx.lineTo(100,52);ctx.lineTo(76,61);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawPowerIcon(ctx,type,x,y){
    ctx.save();ctx.translate(x,y);ctx.shadowColor='#ffffff77';ctx.shadowBlur=8;
    const colors=['#ff7138','#6eeeff','#f7ead8','#ff6961','#ed4e5b','#8cecff','#ffd33e','#ff9b49','#ff6683','#ffe15b'];
    ctx.fillStyle=colors[type];
    if(type===0){ctx.beginPath();ctx.moveTo(0,-25);ctx.quadraticCurveTo(25,-4,9,24);ctx.quadraticCurveTo(-8,30,-17,12);ctx.quadraticCurveTo(-18,-5,0,-25);ctx.fill()}
    else if(type===1){box(ctx,-24,-8,40,15,4,'#334158');box(ctx,-4,5,9,20,3,'#20283b');ctx.fillStyle='#6eeeff';ctx.fillRect(13,-4,25,7)}
    else if(type===2){ctx.beginPath();ctx.ellipse(0,0,18,27,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6eeeff';ctx.lineWidth=5;ctx.stroke()}
    else if(type===3){ctx.beginPath();ctx.moveTo(-27,-5);ctx.lineTo(5,-5);ctx.lineTo(24,11);ctx.lineTo(18,23);ctx.lineTo(-28,23);ctx.closePath();ctx.fill()}
    else if(type===4){ctx.strokeStyle='#ef4d5a';ctx.lineWidth=13;ctx.beginPath();ctx.arc(0,0,21,.15*Math.PI,.85*Math.PI,true);ctx.stroke()}
    else if(type===5){ctx.strokeStyle='#8cecff';ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(-25,0);ctx.lineTo(25,0);ctx.stroke();ctx.restore()}}
    else if(type===6){ctx.beginPath();ctx.ellipse(-3,4,23,17,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(17,-9,14,0,Math.PI*2);ctx.fill()}
    else if(type===7){ctx.strokeStyle='#ff9b49';ctx.lineWidth=6;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-11,0,13+i*10,-.8,.8);ctx.stroke()}}
    else if(type===8){ctx.beginPath();ctx.moveTo(0,26);ctx.bezierCurveTo(-34,2,-26,-23,-9,-23);ctx.bezierCurveTo(0,-23,7,-15,9,-9);ctx.bezierCurveTo(17,-23,38,-16,31,6);ctx.bezierCurveTo(25,16,12,26,0,34);ctx.fill()}
    else{ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?10:26,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}
    ctx.restore();
  }

  function drawPowerScene(){
    canvas.width=960;canvas.height=300;
    const ctx=canvas.getContext('2d');
    const g=ctx.createLinearGradient(0,0,960,300);g.addColorStop(0,'#16375d');g.addColorStop(.5,'#493172');g.addColorStop(1,'#8b3e62');ctx.fillStyle=g;ctx.fillRect(0,0,960,300);
    ctx.fillStyle='#ffffff12';for(let i=0;i<28;i++){ctx.beginPath();ctx.arc(20+i*39,24+(i%5)*52,3+(i%3),0,Math.PI*2);ctx.fill()}
    drawRex(ctx,122,118,1.08);
    box(ctx,292,24,630,72,18,'#071126aa','#ffffff24');
    ctx.fillStyle='#fff';ctx.font='900 30px system-ui';ctx.fillText('REX FOUND HIS FIRST POWER-UP',320,55);
    ctx.font='700 16px system-ui';ctx.fillStyle='#dce9ff';ctx.fillText('The game is paused. Read this once, then resume with the power already active.',320,80);
    for(let i=0;i<10;i++){
      const col=i%5,row=Math.floor(i/5),x=342+col*116,y=153+row*91;
      box(ctx,x-43,y-38,86,76,16,'#081225b8','#ffffff20');
      drawPowerIcon(ctx,i,x,y-6);
      ctx.fillStyle='#fff';ctx.font='800 11px system-ui';ctx.textAlign='center';ctx.fillText(String(i+1),x,y+29);ctx.textAlign='left';
    }
    ctx.fillStyle='#79f0c4';ctx.font='900 15px system-ui';ctx.fillText('COLLECT IT → READ THIS CARD → PRESS RESUME → USE THE BUTTONS BELOW',38,278);
  }

  function drawCat(ctx,x,y,scale=1){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle='#c9824e';ctx.beginPath();ctx.ellipse(80,120,84,70,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(126,57,63,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(80,25);ctx.lineTo(92,-21);ctx.lineTo(115,24);ctx.moveTo(138,19);ctx.lineTo(170,-18);ctx.lineTo(176,34);ctx.fill();
    ctx.strokeStyle='#744425';ctx.lineWidth=9;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(55+i*25,85);ctx.lineTo(68+i*23,111);ctx.stroke()}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(111,56,13,17,0,0,Math.PI*2);ctx.ellipse(149,53,13,17,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#15201c';ctx.beginPath();ctx.arc(115,58,5,0,Math.PI*2);ctx.arc(146,55,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffd04d';ctx.beginPath();ctx.moveTo(88,9);ctx.lineTo(95,-24);ctx.lineTo(115,-4);ctx.lineTo(133,-32);ctx.lineTo(151,-4);ctx.lineTo(172,-24);ctx.lineTo(175,11);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawBossScene(){
    canvas.width=960;canvas.height=300;
    const ctx=canvas.getContext('2d');
    const g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,'#39285f');g.addColorStop(1,'#10142a');ctx.fillStyle=g;ctx.fillRect(0,0,960,300);
    drawRex(ctx,112,129,.82);drawCat(ctx,700,77,.88);
    box(ctx,287,24,385,62,16,'#091126c7','#ffffff25');
    ctx.fillStyle='#fff';ctx.font='900 28px system-ui';ctx.textAlign='center';ctx.fillText('SIR WHISKERS: THREE PHASES',480,52);ctx.font='700 14px system-ui';ctx.fillStyle='#dce5ff';ctx.fillText('He brought yarn, fireballs, a giant paw, and a robot vacuum. Obviously.',480,74);
    const phases=[['PHASE 1','Yarn rolls low'],['PHASE 2','Fireballs + paw'],['PHASE 3','Faster attacks + vacuum']];
    phases.forEach(([a,b],i)=>{const x=300+i*128;box(ctx,x,112,116,62,13,['#30476a','#67405b','#713743'][i],'#ffffff24');ctx.fillStyle='#fff';ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.fillText(a,x+58,135);ctx.font='700 10px system-ui';ctx.fillStyle='#d9e3f4';ctx.fillText(b,x+58,155)});
    box(ctx,297,195,170,58,14,'#ffd34d','#fff2aa');ctx.fillStyle='#211900';ctx.font='900 16px system-ui';ctx.textAlign='center';ctx.fillText('1. GET READY',382,219);ctx.font='700 11px system-ui';ctx.fillText('Watch the warning',382,239);
    box(ctx,493,195,170,58,14,'#ff735d','#ffc0b5');ctx.fillStyle='#fff';ctx.font='900 16px system-ui';ctx.fillText('2. JUMP NOW',578,219);ctx.font='700 11px system-ui';ctx.fillText('Jump when prompted',578,239);
    ctx.strokeStyle='#6eeeff';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(232,167);ctx.lineTo(700,167);ctx.stroke();ctx.fillStyle='#6eeeff';ctx.beginPath();ctx.moveTo(700,167);ctx.lineTo(680,155);ctx.lineTo(680,179);ctx.closePath();ctx.fill();
    ctx.fillStyle='#79f0c4';ctx.font='900 14px system-ui';ctx.textAlign='left';ctx.fillText('SHOOT CONTINUOUSLY — BOSS LASER AMMO IS UNLIMITED',286,281);ctx.textAlign='left';
  }

  function setSteps(kind){
    panel.dataset.kind=kind;
    if(kind==='powers'){
      copy.textContent='The game pauses after the first power-up so nobody accidentally turns Rex golden, magnetic, and legally confusing without reading the instructions.';
      instructions.innerHTML=`
        <article><b>1</b><strong>Collect glowing items</strong><span>Run into the floating power-up. The game pauses only the first time.</span></article>
        <article><b>2</b><strong>Check the Power HUD</strong><span>The top bar shows the active power, ammunition, shield, or timer.</span></article>
        <article><b>3</b><strong>Use the correct control</strong><span>Tap Shoot for Flame or Laser. Tap Mega Roar when a roar is available.</span></article>
        <article><b>4</b><strong>Timed powers start now</strong><span>Sneakers, Magnet, Freeze, and Golden Rex activate immediately after this card.</span></article>`;
      note.innerHTML='<strong>Important:</strong> The power you just collected remains active. Press the button below to resume exactly where Rex stopped.';
      grid.classList.remove('hidden');
      grid.innerHTML=powerDetails.map(([name,text],i)=>`<article><i data-power="${i}"></i><div><strong>${name}</strong><span>${text}</span></div></article>`).join('');
      ready.textContent='Got It — Resume With My Power';
      drawPowerScene();
    }else{
      copy.textContent='The game is paused before the fight. Sir Whiskers has 42 health, three attack phases, and entirely too much confidence for a cat riding a robot vacuum.';
      instructions.innerHTML=`
        <article><b>1</b><strong>Watch GET READY</strong><span>The attack name appears before anything is launched. Put your thumb over Jump.</span></article>
        <article><b>2</b><strong>Jump on JUMP NOW</strong><span>Every boss projectile travels along the ground and can be cleared with the higher jump.</span></article>
        <article><b>3</b><strong>Keep shooting</strong><span>Your Laser Blaster has unlimited boss ammunition. Fire whenever the boss is visible.</span></article>
        <article><b>4</b><strong>Use Mega Roar</strong><span>Roar clears active hazards and removes boss health. Save it for a crowded moment.</span></article>`;
      note.innerHTML='<strong>You begin with five lives.</strong> Phase 2 starts at 28 health, Phase 3 starts at 14 health, and the attacks become faster each time.';
      grid.classList.add('hidden');grid.innerHTML='';
      ready.textContent='Ready — Start the Boss Fight';
      drawBossScene();
    }
  }

  function enhance(){
    if(card.classList.contains('hidden'))return;
    const kind=D.cutsceneReliability&&D.cutsceneReliability.activeKind;
    if(kind==='powers'||kind==='boss')setSteps(kind);
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  observer.observe(card,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',()=>{if(!card.classList.contains('hidden'))requestAnimationFrame(enhance)});
})();