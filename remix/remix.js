(()=>{
'use strict';

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const W=960;
const H=540;
const G=438;
const GOAL=2500;
const $=id=>document.getElementById(id);

const PHYSICS={
  jumpVelocity:-835,
  gravity:2200,
  holdBoost:900,
  maxHold:.16,
  releaseCut:.8,
  releaseCutAfter:.045
};

const ui={
  score:$('score'),
  high:$('high'),
  lives:$('lives'),
  power:$('power'),
  speed:$('speed'),
  progressText:$('progressText'),
  progressBar:$('progressBar'),
  toast:$('toast'),
  overlay:$('overlay'),
  title:$('overlayTitle'),
  message:$('overlayMessage'),
  start:$('startBtn'),
  jump:$('jumpBtn'),
  shoot:$('shootBtn'),
  roar:$('roarBtn'),
  pause:$('pauseBtn'),
  instructions:$('instructions'),
  sound:$('soundBtn')
};

const assetPaths={
  rexJump:'assets/rex-jump.webp',
  cat:'assets/sleeping-cat.webp',
  duck:'assets/rubber-duck.webp',
  stump:'assets/tree-stump.webp',
  pizza:'assets/pizza-slice.webp',
  tree:'assets/tall-tree.webp'
};

const images={};
let assetsReady=false;
Promise.all(Object.entries(assetPaths).map(([key,src])=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{images[key]=image;resolve()};
  image.onerror=()=>resolve();
  image.src=src;
}))).then(()=>{assetsReady=true});

const obstacleDefs={
  cat:{image:'cat',w:142,h:80,padX:19,padY:21,score:120},
  duck:{image:'duck',w:92,h:86,padX:16,padY:17,score:130},
  stump:{image:'stump',w:128,h:86,padX:13,padY:17,score:145},
  pizza:{image:'pizza',w:108,h:80,padX:14,padY:15,score:140},
  tree:{image:'tree',w:108,h:158,padX:20,padY:18,score:185}
};

const state={
  mode:'menu',
  last:0,
  time:0,
  score:0,
  high:Number(localStorage.getItem('rexRemixHigh')||0),
  lives:5,
  speed:310,
  spawn:1.4,
  itemSpawn:6,
  objects:[],
  items:[],
  shots:[],
  particles:[],
  floaters:[],
  sound:localStorage.getItem('rexRemixSound')!=='false',
  distance:0,
  toastTime:0,
  won:false
};

const player={
  x:105,
  y:G-126,
  w:146,
  h:126,
  vy:0,
  ground:true,
  inv:0,
  shield:0,
  laser:0,
  roars:0,
  hold:false,
  holdTime:0,
  anim:0
};

let audioCtx=null;

function tone(freq=300,dur=.08,type='sine',vol=.04){
  if(!state.sound)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const oscillator=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    oscillator.type=type;
    oscillator.frequency.value=freq;
    gain.gain.value=vol;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
    oscillator.stop(audioCtx.currentTime+dur);
  }catch{}
}

function toast(text){
  ui.toast.textContent=text;
  ui.toast.classList.add('show');
  state.toastTime=2.2;
}

function reset(){
  state.mode='play';
  state.time=0;
  state.score=0;
  state.lives=5;
  state.speed=310;
  state.spawn=1.5;
  state.itemSpawn=5;
  state.objects.length=0;
  state.items.length=0;
  state.shots.length=0;
  state.particles.length=0;
  state.floaters.length=0;
  state.distance=0;
  state.won=false;
  Object.assign(player,{y:G-player.h,vy:0,ground:true,inv:0,shield:0,laser:0,roars:0,hold:false,holdTime:0});
  ui.overlay.classList.remove('visible');
  updateHud();
  state.last=performance.now();
  tone(420,.12,'triangle');
}

function showOverlay(title,message,button='Play Again'){
  state.mode='over';
  ui.title.textContent=title;
  ui.message.textContent=message;
  ui.start.textContent=button;
  ui.overlay.classList.add('visible');
}

function updateHud(){
  ui.score.textContent=Math.floor(state.score).toLocaleString();
  ui.high.textContent=Math.max(state.high,Math.floor(state.score)).toLocaleString();
  ui.lives.textContent='❤'.repeat(Math.max(0,state.lives))||'0';
  ui.lives.setAttribute('aria-label',`${state.lives} lives`);
  ui.power.textContent=player.laser?`Laser ${player.laser}`:player.shield?'Shield':player.roars?`Roar ${player.roars}`:'None';
  ui.speed.textContent=state.speed<350?'Warm-Up':state.speed<405?'Picking Up':state.speed<455?'Fast':'Wild';
  ui.progressText.textContent=`Backyard Run: ${Math.min(GOAL,Math.floor(state.score)).toLocaleString()} / ${GOAL.toLocaleString()}`;
  ui.progressBar.style.width=`${Math.min(100,state.score/GOAL*100)}%`;
  ui.shoot.disabled=player.laser<1||state.mode!=='play';
  ui.roar.disabled=player.roars<1||state.mode!=='play';
  ui.pause.textContent=state.mode==='pause'?'Resume':'Pause';
}

function jump(){
  if(state.mode!=='play'||!player.ground)return;
  player.vy=PHYSICS.jumpVelocity;
  player.ground=false;
  player.holdTime=0;
  tone(520,.08,'square');
  spawnDust(player.x+35,G-6,7);
}

function jumpDown(){
  player.hold=true;
  jump();
}

function jumpUp(){
  player.hold=false;
  if(player.holdTime>PHYSICS.releaseCutAfter&&player.vy<-420){
    player.vy*=PHYSICS.releaseCut;
  }
}

function nearestObstacle(){
  let nearest=null;
  for(const obstacle of state.objects){
    if(obstacle.x+obstacle.w<player.x+player.w)continue;
    if(!nearest||obstacle.x<nearest.x)nearest=obstacle;
  }
  return nearest;
}

function shoot(){
  if(state.mode!=='play'||player.laser<1)return;
  player.laser--;
  const target=nearestObstacle();
  const targetBox=target?objectBox(target):null;
  const shotH=14;
  const aimY=targetBox
    ?targetBox.y+targetBox.h/2-shotH/2
    :G-48-shotH/2;
  state.shots.push({
    x:player.x+118,
    prevX:player.x+118,
    y:Math.max(318,Math.min(G-30,aimY)),
    w:68,
    h:shotH,
    vx:1080,
    life:1.25,
    age:0,
    muzzleY:player.y+72
  });
  tone(780,.07,'sawtooth');
  updateHud();
}

function roar(){
  if(state.mode!=='play'||player.roars<1)return;
  player.roars--;
  let cleared=0;
  for(const obstacle of state.objects){
    burst(obstacle.x+obstacle.w/2,obstacle.y+obstacle.h/2,'#ffe066',16);
    cleared++;
    state.score+=90;
  }
  state.objects.length=0;
  toast(`Mega Roar cleared ${cleared} obstacle${cleared===1?'':'s'}`);
  tone(115,.35,'sawtooth',.07);
  updateHud();
}

function pause(){
  if(state.mode==='play'){
    state.mode='pause';
    ui.title.textContent='Paused';
    ui.message.textContent='Rex is waiting. Resume when ready.';
    ui.start.textContent='Resume';
    ui.overlay.classList.add('visible');
  }else if(state.mode==='pause'){
    state.mode='play';
    state.last=performance.now();
    ui.overlay.classList.remove('visible');
  }
  updateHud();
}

function spawnObstacle(){
  const pool=state.time<18
    ?['cat','duck','pizza','stump']
    :state.time<40
      ?['cat','duck','pizza','stump','tree']
      :['cat','duck','stump','pizza','tree','tree'];
  const type=pool[Math.floor(Math.random()*pool.length)];
  const def=obstacleDefs[type];
  state.objects.push({
    type,
    x:W+30,
    y:G-def.h,
    w:def.w,
    h:def.h,
    phase:Math.random()*Math.PI*2,
    passed:false
  });
  const minGap=state.time<20?1.55:1.25;
  const maxGap=state.time<20?2.25:1.9;
  state.spawn=minGap+Math.random()*(maxGap-minGap)+(type==='tree'?.35:0);
}

function spawnItem(){
  const random=Math.random();
  const kind=random<.35?'star':random<.6?'shield':random<.84?'laser':'roar';
  state.items.push({kind,x:W+30,y:250+Math.random()*105,w:74,h:70,phase:Math.random()*6});
  state.itemSpawn=5.7+Math.random()*4.2;
}

function playerBox(){
  return{x:player.x+32,y:player.y+20,w:player.w-62,h:player.h-28};
}

function objectBox(obstacle){
  const def=obstacleDefs[obstacle.type];
  return{
    x:obstacle.x+def.padX,
    y:obstacle.y+def.padY,
    w:obstacle.w-def.padX*2,
    h:obstacle.h-def.padY
  };
}

function hit(a,b){
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

function laserBox(shot){
  const left=Math.min(shot.prevX,shot.x);
  return{
    x:left,
    y:shot.y-18,
    w:Math.abs(shot.x-shot.prevX)+shot.w,
    h:shot.h+36
  };
}

function damage(){
  if(player.inv>0)return;
  if(player.shield){
    player.shield=0;
    player.inv=1.2;
    toast('Shield blocked the obstacle');
    tone(220,.18,'triangle');
    return;
  }
  state.lives--;
  player.inv=2;
  toast('Obstacle hit — recovery shield active');
  tone(120,.2,'sawtooth');
  if(state.lives<=0){
    state.high=Math.max(state.high,Math.floor(state.score));
    localStorage.setItem('rexRemixHigh',state.high);
    showOverlay('Rex Needs Another Run',`Score: ${Math.floor(state.score).toLocaleString()}. Try the higher jump and use the laser to clear the toughest obstacles.`);
  }
  updateHud();
}

function collect(item){
  if(item.kind==='star'){
    state.score+=180;
    floatText('+180 STAR',item.x,item.y,'#fff38a');
    tone(680,.09,'triangle');
  }else if(item.kind==='shield'){
    player.shield=1;
    toast('Shield collected');
    tone(480,.12,'sine');
  }else if(item.kind==='laser'){
    player.laser=Math.min(30,player.laser+12);
    toast('Laser collected — Shoot is ready');
    tone(760,.1,'square');
  }else{
    player.roars=Math.min(3,player.roars+1);
    toast('Mega Roar collected');
    tone(180,.22,'sawtooth');
  }
  updateHud();
}

function burst(x,y,color,count=10){
  for(let i=0;i<count;i++){
    state.particles.push({
      x,
      y,
      vx:(Math.random()-.5)*320,
      vy:-80-Math.random()*220,
      life:.45+Math.random()*.45,
      color,
      size:3+Math.random()*6
    });
  }
}

function spawnDust(x,y,count=4){
  for(let i=0;i<count;i++){
    state.particles.push({
      x:x+Math.random()*18,
      y:y-Math.random()*6,
      vx:-20-Math.random()*70,
      vy:-15-Math.random()*60,
      life:.25+Math.random()*.3,
      color:'rgba(255,255,255,.65)',
      size:4+Math.random()*6
    });
  }
}

function floatText(text,x,y,color){
  state.floaters.push({text,x,y,life:1,vy:-45,color});
}

function update(dt){
  if(state.toastTime>0){
    state.toastTime-=dt;
    if(state.toastTime<=0)ui.toast.classList.remove('show');
  }
  if(state.mode!=='play')return;

  state.time+=dt;
  state.distance+=state.speed*dt;
  state.score+=dt*17;
  state.speed=Math.min(480,310+state.time*3.2);
  player.inv=Math.max(0,player.inv-dt);
  player.anim+=dt;
  player.vy+=PHYSICS.gravity*dt;

  if(player.hold&&!player.ground&&player.vy<0&&player.holdTime<PHYSICS.maxHold){
    player.vy-=PHYSICS.holdBoost*dt;
    player.holdTime+=dt;
  }

  player.y+=player.vy*dt;
  if(player.y>=G-player.h){
    if(!player.ground&&player.vy>300){
      tone(180,.05,'triangle');
      spawnDust(player.x+38,G-5,5);
    }
    player.y=G-player.h;
    player.vy=0;
    player.ground=true;
  }

  state.spawn-=dt;
  state.itemSpawn-=dt;
  if(state.spawn<=0)spawnObstacle();
  if(state.itemSpawn<=0)spawnItem();

  for(const obstacle of state.objects){
    obstacle.x-=state.speed*dt;
    obstacle.phase+=dt*3;
  }
  for(const item of state.items){
    item.x-=state.speed*.82*dt;
    item.phase+=dt*4;
  }
  for(const shot of state.shots){
    shot.prevX=shot.x;
    shot.x+=shot.vx*dt;
    shot.life-=dt;
    shot.age+=dt;
  }

  const pb=playerBox();
  for(let i=state.objects.length-1;i>=0;i--){
    const obstacle=state.objects[i];
    if(hit(pb,objectBox(obstacle))){
      damage();
      state.objects.splice(i,1);
      continue;
    }
    if(!obstacle.passed&&obstacle.x+obstacle.w<player.x){
      obstacle.passed=true;
      state.score+=obstacleDefs[obstacle.type].score;
      floatText(`+${obstacleDefs[obstacle.type].score}`,obstacle.x,obstacle.y,'#fff');
      tone(390,.04,'triangle');
    }
    if(obstacle.x+obstacle.w<-40)state.objects.splice(i,1);
  }

  for(let i=state.items.length-1;i>=0;i--){
    const item=state.items[i];
    if(hit(pb,item)){
      collect(item);
      state.items.splice(i,1);
    }else if(item.x+item.w<-40){
      state.items.splice(i,1);
    }
  }

  for(let i=state.shots.length-1;i>=0;i--){
    const shot=state.shots[i];
    const beamBox=laserBox(shot);
    let used=false;
    for(let j=state.objects.length-1;j>=0;j--){
      if(hit(beamBox,objectBox(state.objects[j]))){
        const obstacle=state.objects[j];
        state.score+=90;
        floatText('+90 LASER',obstacle.x,obstacle.y,'#9af8ff');
        burst(obstacle.x+obstacle.w/2,obstacle.y+obstacle.h/2,'#7ef7ff',14);
        state.objects.splice(j,1);
        used=true;
        tone(260,.09,'square');
        break;
      }
    }
    if(used||shot.x>W+80||shot.life<=0)state.shots.splice(i,1);
  }

  for(const particle of state.particles){
    particle.x+=particle.vx*dt;
    particle.y+=particle.vy*dt;
    particle.vy+=500*dt;
    particle.life-=dt;
  }
  state.particles=state.particles.filter(particle=>particle.life>0);

  for(const floater of state.floaters){
    floater.y+=floater.vy*dt;
    floater.life-=dt;
  }
  state.floaters=state.floaters.filter(floater=>floater.life>0);

  if(state.score>=GOAL&&!state.won){
    state.won=true;
    state.high=Math.max(state.high,Math.floor(state.score));
    localStorage.setItem('rexRemixHigh',state.high);
    showOverlay('Backyard Complete!',`Rex cleared the illustrated Backyard with ${state.lives} ${state.lives===1?'life':'lives'} remaining.`,'Play Again');
  }

  updateHud();
}

function roundRect(c,x,y,w,h,r){
  c.beginPath();
  c.moveTo(x+r,y);
  c.arcTo(x+w,y,x+w,y+h,r);
  c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r);
  c.arcTo(x,y,x+w,y,r);
  c.closePath();
}

function drawCloud(x,y,scale){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.fillStyle='rgba(255,255,255,.9)';
  ctx.strokeStyle='rgba(70,145,185,.22)';
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.arc(0,8,28,Math.PI*.55,Math.PI*1.48);
  ctx.arc(30,-6,36,Math.PI,Math.PI*1.9);
  ctx.arc(67,4,30,Math.PI*1.22,Math.PI*2.1);
  ctx.arc(91,15,22,Math.PI*1.35,Math.PI*2.28);
  ctx.lineTo(5,35);
  ctx.quadraticCurveTo(-15,31,0,8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBird(x,y,scale){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.strokeStyle='rgba(25,73,104,.65)';
  ctx.lineWidth=3;
  ctx.lineCap='round';
  ctx.beginPath();
  ctx.arc(-9,0,10,Math.PI*1.08,Math.PI*1.82);
  ctx.arc(9,0,10,Math.PI*1.18,Math.PI*1.92);
  ctx.stroke();
  ctx.restore();
}

function drawHillLayer(offset,y,step,radius,fill,stroke){
  ctx.fillStyle=fill;
  ctx.strokeStyle=stroke;
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(-radius,H);
  for(let x=-radius-offset;x<W+radius;x+=step){
    ctx.arc(x,y,radius,Math.PI,0);
  }
  ctx.lineTo(W+radius,H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHouse(x,y,scale=1,toneIndex=0){
  const walls=['#f6d7a8','#ffd7c2','#f3e7b4'][toneIndex%3];
  const roofs=['#c94e3c','#e0613e','#9e4f43'][toneIndex%3];
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.lineJoin='round';
  ctx.strokeStyle='#6f4939';
  ctx.lineWidth=4;
  ctx.fillStyle=walls;
  roundRect(ctx,0,0,144,86,7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle=roofs;
  ctx.beginPath();
  ctx.moveTo(-13,4);
  ctx.lineTo(70,-48);
  ctx.lineTo(157,4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle='#75c7e6';
  ctx.fillRect(20,25,31,31);
  ctx.fillRect(92,25,31,31);
  ctx.strokeRect(20,25,31,31);
  ctx.strokeRect(92,25,31,31);
  ctx.strokeStyle='rgba(255,255,255,.8)';
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(35.5,25);ctx.lineTo(35.5,56);
  ctx.moveTo(20,40.5);ctx.lineTo(51,40.5);
  ctx.moveTo(107.5,25);ctx.lineTo(107.5,56);
  ctx.moveTo(92,40.5);ctx.lineTo(123,40.5);
  ctx.stroke();
  ctx.fillStyle='#94523a';
  ctx.fillRect(61,38,25,48);
  ctx.strokeStyle='#6f4939';
  ctx.strokeRect(61,38,25,48);
  ctx.fillStyle='#ffd447';
  ctx.beginPath();ctx.arc(79,62,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawTree(x,y,scale=1,front=false){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.lineJoin='round';
  ctx.strokeStyle=front?'#315c32':'#4b7340';
  ctx.lineWidth=4;
  ctx.fillStyle=front?'#87512f':'#9a6840';
  roundRect(ctx,-13,38,26,88,10);
  ctx.fill();
  ctx.stroke();
  const leaves=front?['#2f9c47','#45b956','#5bc864']:['#66ae5e','#78bd6c','#8fca79'];
  const clusters=[[-31,34,34],[8,15,39],[42,38,31],[-2,53,42]];
  for(let i=0;i<clusters.length;i++){
    const [cx,cy,r]=clusters[i];
    ctx.fillStyle=leaves[i%leaves.length];
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawFence(x,y){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle='#fff1c4';
  ctx.strokeStyle='#b88c5d';
  ctx.lineWidth=3;
  for(let i=0;i<3;i++){
    const px=i*42;
    ctx.beginPath();
    ctx.moveTo(px,70);
    ctx.lineTo(px+19,2);
    ctx.lineTo(px+38,70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillRect(-4,36,132,15);
  ctx.strokeRect(-4,36,132,15);
  ctx.fillRect(-4,69,132,15);
  ctx.strokeRect(-4,69,132,15);
  ctx.restore();
}

function drawBush(x,y,scale=1,flowers=true){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.fillStyle='#2f9d43';
  ctx.strokeStyle='#236c36';
  ctx.lineWidth=3;
  const bumps=[[-30,4,27],[-7,-9,34],[23,-4,29],[46,9,23],[8,14,39]];
  for(const [bx,by,r] of bumps){
    ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  if(flowers){
    const dots=[[-21,-3,'#ffd74a'],[3,-17,'#ff7cae'],[26,-4,'#fff'],[43,10,'#8ce9ff'],[8,13,'#ffd74a']];
    for(const [fx,fy,color] of dots){
      ctx.fillStyle=color;
      for(let i=0;i<5;i++){
        const angle=i*Math.PI*2/5;
        ctx.beginPath();
        ctx.arc(fx+Math.cos(angle)*5,fy+Math.sin(angle)*5,4,0,Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle='#f49b25';ctx.beginPath();ctx.arc(fx,fy,3,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrassTuft(x,y,scale=1){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.strokeStyle='#2d8f3a';
  ctx.lineWidth=3;
  ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(0,0);ctx.quadraticCurveTo(-8,-18,-14,-23);
  ctx.moveTo(0,0);ctx.quadraticCurveTo(0,-21,4,-28);
  ctx.moveTo(0,0);ctx.quadraticCurveTo(11,-17,18,-20);
  ctx.stroke();
  ctx.restore();
}

function drawBackground(){
  const t=state.distance;

  const sky=ctx.createLinearGradient(0,0,0,G);
  sky.addColorStop(0,'#43b9f1');
  sky.addColorStop(.62,'#a9e7ff');
  sky.addColorStop(1,'#effcff');
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,W,G);

  ctx.save();
  ctx.translate(805,82);
  ctx.fillStyle='rgba(255,220,74,.24)';
  ctx.beginPath();ctx.arc(0,0,69,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffd84b';
  ctx.strokeStyle='#e9a934';
  ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(0,0,43,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.restore();

  drawCloud(120-(t*.018)%1120,84,1.02);
  drawCloud(520-(t*.026)%1240,128,.78);
  drawCloud(885-(t*.02)%1320,58,.6);
  drawBird(350-(t*.035)%1160,83,.8);
  drawBird(430-(t*.035)%1160,67,.55);

  drawHillLayer((t*.035)%320,305,260,180,'#95d47a','#69ae62');
  drawHillLayer((t*.065)%255,343,210,128,'#70c56a','#4e9f55');

  for(let x=-260-(t*.09)%360,i=0;x<W+280;x+=360,i++){
    drawHouse(x,250,.84,i);
  }

  for(let x=-160-(t*.135)%250,i=0;x<W+210;x+=250,i++){
    drawTree(x,254,.74,false);
  }

  ctx.fillStyle='#59ad4e';
  ctx.fillRect(0,350,W,88);

  for(let x=-140-(t*.23)%126;x<W+140;x+=126){
    drawFence(x,329);
  }

  for(let x=-190-(t*.34)%185,i=0;x<W+190;x+=185,i++){
    drawBush(x,393,.7+(i%2)*.08,true);
  }

  ctx.fillStyle='#43a93f';
  ctx.fillRect(0,405,W,33);
  ctx.fillStyle='#64c94e';
  ctx.beginPath();
  ctx.moveTo(0,438);
  for(let x=0;x<=W;x+=16){
    ctx.lineTo(x,425-(x%32?7:0));
  }
  ctx.lineTo(W,438);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle='#9b5d32';
  ctx.fillRect(0,G,W,H-G);
  ctx.fillStyle='#b97943';
  ctx.fillRect(0,G,W,9);

  for(let x=-60-(t*.82)%112;x<W+112;x+=112){
    ctx.fillStyle='rgba(77,41,24,.32)';
    ctx.beginPath();ctx.ellipse(x,G+49,19,7,-.12,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+51,G+92,13,5,.1,0,Math.PI*2);ctx.fill();
  }

  for(let x=-30-(t*.5)%88;x<W+88;x+=88){
    drawGrassTuft(x,G+5,.72);
  }

  for(let x=-250-(t*.55)%420;x<W+240;x+=420){
    drawTree(x,G-124,.62,true);
  }
}

function drawImageFit(image,x,y,w,h,flip=false){
  if(!image)return;
  ctx.save();
  if(flip){
    ctx.translate(x+w,y);
    ctx.scale(-1,1);
    ctx.drawImage(image,0,0,w,h);
  }else{
    ctx.drawImage(image,x,y,w,h);
  }
  ctx.restore();
}

function drawPlayer(){
  const image=images.rexJump||images.rexRun;
  if(!image)return;
  ctx.save();
  if(player.inv>0&&Math.floor(player.inv*12)%2)ctx.globalAlpha=.35;
  const running=player.ground;
  const stride=Math.sin(player.anim*11);
  const bob=running?Math.abs(stride)*4:0;
  const tilt=running?-.055:Math.max(-.13,Math.min(.13,player.vy/4200));
  ctx.translate(player.x+player.w/2,player.y+player.h/2+bob+2);
  ctx.rotate(tilt);
  ctx.scale(running?1+stride*.012:1,running?.88-stride*.012:1);
  drawImageFit(image,-player.w/2,-player.h/2,player.w,player.h);
  ctx.restore();
  if(player.shield){
    const pulse=1+Math.sin(player.anim*8)*.025;
    ctx.strokeStyle='rgba(70,218,255,.96)';
    ctx.fillStyle='rgba(70,218,255,.12)';
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.ellipse(player.x+player.w/2,player.y+player.h/2,player.w*.57*pulse,player.h*.59*pulse,0,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawObstacle(obstacle){
  const def=obstacleDefs[obstacle.type];
  const image=images[def.image];
  let y=obstacle.y;
  if(obstacle.type==='cat')y+=Math.sin(obstacle.phase)*2;
  if(obstacle.type==='duck')y+=Math.sin(obstacle.phase*1.3)*4;
  drawImageFit(image,obstacle.x,y,obstacle.w,obstacle.h);
}

function drawItem(item){
  const cx=item.x+item.w/2;
  const cy=item.y+27;
  const pulse=1+Math.sin(item.phase)*.055;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.scale(pulse,pulse);
  ctx.shadowColor='rgba(0,0,0,.28)';
  ctx.shadowBlur=10;
  ctx.shadowOffsetY=5;
  const fill={star:'#ffd735',shield:'#39c8ff',laser:'#42d45a',roar:'#ff625d'}[item.kind];
  ctx.fillStyle=fill;
  ctx.strokeStyle='#fff';
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.arc(0,0,26,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor='transparent';
  ctx.strokeStyle='#12324d';
  ctx.fillStyle='#12324d';
  ctx.lineWidth=4;
  ctx.lineCap='round';
  ctx.lineJoin='round';

  if(item.kind==='star'){
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const angle=-Math.PI/2+i*Math.PI/5;
      const radius=i%2?10:21;
      const px=Math.cos(angle)*radius;
      const py=Math.sin(angle)*radius;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.closePath();
    ctx.fill();
  }else if(item.kind==='shield'){
    ctx.beginPath();
    ctx.moveTo(0,-18);ctx.lineTo(17,-11);ctx.lineTo(14,8);
    ctx.quadraticCurveTo(10,20,0,24);
    ctx.quadraticCurveTo(-10,20,-14,8);
    ctx.lineTo(-17,-11);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,15);ctx.stroke();
  }else if(item.kind==='laser'){
    ctx.fillRect(-18,-6,29,12);
    ctx.beginPath();ctx.moveTo(8,-10);ctx.lineTo(22,-5);ctx.lineTo(22,5);ctx.lineTo(8,10);ctx.closePath();ctx.fill();
    ctx.fillRect(-8,6,8,13);
    ctx.strokeStyle='#fff';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(25,0);ctx.lineTo(34,0);ctx.stroke();
  }else{
    ctx.beginPath();ctx.moveTo(-17,8);ctx.quadraticCurveTo(-17,-12,-2,-15);ctx.quadraticCurveTo(13,-17,18,-5);ctx.lineTo(9,-3);ctx.lineTo(17,4);ctx.quadraticCurveTo(4,18,-12,12);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(-3,-5,2,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(5,2,11,-.6,.65);ctx.stroke();
  }
  ctx.restore();

  const label={star:'BONUS',shield:'SHIELD',laser:'LASER',roar:'ROAR'}[item.kind];
  ctx.font='900 12px system-ui';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  const textWidth=ctx.measureText(label).width+18;
  ctx.fillStyle='rgba(5,30,52,.92)';
  roundRect(ctx,cx-textWidth/2,item.y+55,textWidth,21,10);
  ctx.fill();
  ctx.fillStyle='#fff';
  ctx.fillText(label,cx,item.y+65);
}

function drawLaser(shot){
  if(shot.age<.13){
    ctx.save();
    ctx.strokeStyle='rgba(129,249,255,.72)';
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(player.x+119,shot.muzzleY);
    ctx.lineTo(shot.x+7,shot.y+shot.h/2);
    ctx.stroke();
    ctx.restore();
  }
  const gradient=ctx.createLinearGradient(shot.x,shot.y,shot.x+shot.w,shot.y);
  gradient.addColorStop(0,'rgba(255,255,255,.98)');
  gradient.addColorStop(.34,'#8cf8ff');
  gradient.addColorStop(1,'rgba(39,201,255,.2)');
  ctx.save();
  ctx.shadowColor='#64efff';
  ctx.shadowBlur=12;
  ctx.fillStyle=gradient;
  roundRect(ctx,shot.x,shot.y,shot.w,shot.h,shot.h/2);
  ctx.fill();
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,W,H);
  drawBackground();
  for(const item of state.items)drawItem(item);
  for(const obstacle of state.objects)drawObstacle(obstacle);
  for(const shot of state.shots)drawLaser(shot);
  drawPlayer();

  for(const particle of state.particles){
    ctx.globalAlpha=Math.max(0,particle.life/.8);
    ctx.fillStyle=particle.color;
    ctx.beginPath();
    ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;

  for(const floater of state.floaters){
    ctx.globalAlpha=Math.max(0,floater.life);
    ctx.fillStyle=floater.color;
    ctx.strokeStyle='rgba(0,0,0,.65)';
    ctx.lineWidth=4;
    ctx.font='900 20px system-ui';
    ctx.textAlign='center';
    ctx.strokeText(floater.text,floater.x,floater.y);
    ctx.fillText(floater.text,floater.x,floater.y);
  }
  ctx.globalAlpha=1;
  ctx.textAlign='left';

  if(!assetsReady){
    ctx.fillStyle='rgba(4,20,38,.7)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    ctx.font='800 25px system-ui';
    ctx.textAlign='center';
    ctx.fillText('Loading illustrated Rex and obstacles…',W/2,H/2);
  }
}

function loop(ms){
  const dt=Math.min(.033,(ms-state.last)/1000||0);
  state.last=ms;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function openInstructions(){
  ui.instructions.classList.remove('hidden');
  if(state.mode==='play')state.mode='pause';
}

function closeInstructions(){
  ui.instructions.classList.add('hidden');
  if(!ui.overlay.classList.contains('visible')){
    state.mode='play';
    state.last=performance.now();
  }
}

const stopGesture=event=>{if(event.cancelable)event.preventDefault()};
document.addEventListener('touchmove',stopGesture,{passive:false});
document.addEventListener('gesturestart',stopGesture,{passive:false});
document.addEventListener('gesturechange',stopGesture,{passive:false});
window.addEventListener('scroll',()=>window.scrollTo(0,0),{passive:true});

ui.start.addEventListener('click',()=>{state.mode==='pause'?pause():reset()});
ui.jump.addEventListener('pointerdown',event=>{event.preventDefault();jumpDown()});
ui.jump.addEventListener('pointerup',jumpUp);
ui.jump.addEventListener('pointercancel',jumpUp);
canvas.addEventListener('pointerdown',event=>{event.preventDefault();jumpDown()});
canvas.addEventListener('pointerup',jumpUp);
canvas.addEventListener('pointercancel',jumpUp);
ui.shoot.addEventListener('pointerdown',event=>{event.preventDefault();shoot()});
ui.roar.addEventListener('pointerdown',event=>{event.preventDefault();roar()});
ui.pause.addEventListener('click',pause);
$('instructionsBtn').addEventListener('click',openInstructions);
$('overlayInstructionsBtn').addEventListener('click',openInstructions);
$('closeInstructionsBtn').addEventListener('click',closeInstructions);
ui.sound.addEventListener('click',()=>{
  state.sound=!state.sound;
  localStorage.setItem('rexRemixSound',state.sound);
  ui.sound.textContent=state.sound?'Sound On':'Sound Off';
  ui.sound.setAttribute('aria-pressed',String(state.sound));
});

addEventListener('keydown',event=>{
  if(event.code==='Space'||event.code==='ArrowUp'){
    event.preventDefault();
    if(!event.repeat)jumpDown();
  }else if(event.code==='KeyF'||event.code==='KeyX'){
    shoot();
  }else if(event.code==='KeyR'){
    roar();
  }else if(event.code==='Escape'||event.code==='KeyP'){
    pause();
  }
});
addEventListener('keyup',event=>{
  if(event.code==='Space'||event.code==='ArrowUp')jumpUp();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&state.mode==='play')pause();
});

ui.high.textContent=state.high.toLocaleString();
ui.sound.textContent=state.sound?'Sound On':'Sound Off';
updateHud();
requestAnimationFrame(loop);
})();
