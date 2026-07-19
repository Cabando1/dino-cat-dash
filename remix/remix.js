(()=>{
'use strict';

const canvas=document.getElementById('remixGame');
const ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height,GROUND=430,TAU=Math.PI*2;
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

const ui={
 score:$('score'),high:$('high'),lives:$('lives'),power:$('power'),speed:$('speed'),
 missionText:$('missionText'),missionBar:$('missionBar'),start:$('startOverlay'),
 pause:$('pauseOverlay'),over:$('gameOverOverlay'),toast:$('toast'),startBtn:$('startBtn'),
 resumeBtn:$('resumeBtn'),restartBtn:$('restartBtn'),playAgainBtn:$('playAgainBtn'),
 jumpBtn:$('jumpBtn'),shootBtn:$('shootBtn'),roarBtn:$('roarBtn'),pauseBtn:$('pauseBtn'),
 soundBtn:$('soundBtn'),instructionsBtn:$('instructionsBtn'),dialog:$('instructionsDialog'),
 closeInstructionsBtn:$('closeInstructionsBtn'),dialogPlayBtn:$('dialogPlayBtn'),
 gameOverTitle:$('gameOverTitle'),gameOverMessage:$('gameOverMessage')
};

const store={
 get(key,fallback){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}},
 set(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
};

const state={
 mode:'menu',last:0,time:0,score:0,high:store.get('rexRemixHigh',0),lives:5,speed:300,
 spawn:1.5,itemSpawn:5,groundShift:0,parallax:0,sound:store.get('rexRemixSound',true),
 power:'none',ammo:0,shield:0,roars:0,toast:0,shake:0,flash:0,completed:false,
 stats:{jumps:0,cleared:0,stars:0}
};
const player={x:132,y:GROUND-100,w:116,h:100,vy:0,ground:true,inv:0,run:0,hold:0,jumpHeld:false,attack:0};
const obstacles=[],items=[],shots=[],particles=[],floaters=[];

const obstacleDefs={
 cat:{w:115,h:57,padX:14,padY:14,score:100},
 duck:{w:70,h:72,padX:10,padY:12,score:100},
 stump:{w:94,h:72,padX:9,padY:8,score:120},
 pizza:{w:83,h:70,padX:9,padY:8,score:120},
 tree:{w:96,h:164,padX:14,padY:10,score:180}
};
const sequence=['cat','duck','stump','pizza','cat','tree','duck','stump','pizza','tree'];

function tone(freq,duration=.08,type='sine',volume=.025,end=freq){
 if(!state.sound)return;
 try{
   const A=window.AudioContext||window.webkitAudioContext;
   if(!A)return;
   if(!tone.audio)tone.audio=new A();
   const ac=tone.audio,o=ac.createOscillator(),g=ac.createGain();
   o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,end),ac.currentTime+duration);
   g.gain.setValueAtTime(volume,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+duration);
   o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+duration);
 }catch{}
}
function showToast(text){
 ui.toast.textContent=text;ui.toast.classList.add('show');state.toast=2.1;
}
function addParticle(x,y,color,count=10){
 for(let i=0;i<count;i++)particles.push({x,y,vx:rnd(-190,190),vy:rnd(-210,-30),life:rnd(.35,.75),color,size:rnd(3,8)});
}
function addFloater(text,x,y,color='#fff4a8'){floaters.push({text,x,y,life:1,vy:-42,color})}
function roundedRect(c,x,y,w,h,r){
 const rr=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath();
}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function playerBox(){return{x:player.x+24,y:player.y+13,w:player.w-42,h:player.h-18}}
function obstacleBox(o){const d=obstacleDefs[o.type];return{x:o.x+d.padX,y:o.y+d.padY,w:o.w-d.padX*2,h:o.h-d.padY*2}}

function reset(){
 state.mode='play';state.time=0;state.score=0;state.lives=5;state.speed=300;state.spawn=1.6;state.itemSpawn=5;
 state.groundShift=0;state.parallax=0;state.power='none';state.ammo=0;state.shield=0;state.roars=0;state.completed=false;
 state.stats={jumps:0,cleared:0,stars:0};state.shake=0;state.flash=0;
 Object.assign(player,{y:GROUND-player.h,vy:0,ground:true,inv:1.2,run:0,hold:0,jumpHeld:false,attack:0});
 obstacles.length=items.length=shots.length=particles.length=floaters.length=0;
 ui.start.classList.remove('visible');ui.pause.classList.remove('visible');ui.over.classList.remove('visible');
 updateHud();showToast('Backyard Remix started — five lives');
}
function finish(){
 state.mode='over';state.high=Math.max(state.high,Math.floor(state.score));store.set('rexRemixHigh',state.high);
 ui.gameOverTitle.textContent=state.completed?'Backyard prototype complete!':'Backyard needs another pass.';
 ui.gameOverMessage.textContent=`Rex scored ${Math.floor(state.score).toLocaleString()} and cleared ${state.stats.cleared} obstacles.`;
 ui.over.classList.add('visible');updateHud();
}
function pause(){
 if(state.mode==='play'){state.mode='pause';ui.pause.classList.add('visible')}
 else if(state.mode==='pause'){state.mode='play';state.last=performance.now();ui.pause.classList.remove('visible')}
}
function jump(){
 if(state.mode!=='play')return;
 if(player.ground){
   player.vy=-850;player.ground=false;player.hold=0;state.stats.jumps++;tone(420,.08,'square',.018,620);
 }
}
function jumpStart(){player.jumpHeld=true;jump()}
function jumpEnd(){player.jumpHeld=false;if(player.vy<-330)player.vy*=.62}
function shoot(){
 if(state.mode!=='play'||state.power!=='laser'||state.ammo<=0)return;
 state.ammo--;player.attack=.18;shots.push({x:player.x+94,y:player.y+42,w:48,h:8,vx:900,life:1.4});tone(680,.07,'sawtooth',.018,280);
 if(state.ammo<=0)state.power='none';updateHud();
}
function roar(){
 if(state.mode!=='play'||state.roars<1)return;
 state.roars--;state.shake=.45;let cleared=0;
 for(const o of obstacles){addParticle(o.x+o.w/2,o.y+o.h/2,'#ffd84c',12);cleared++}
 obstacles.length=0;state.stats.cleared+=cleared;state.score+=cleared*140;showToast(`Mega Roar cleared ${cleared} obstacle${cleared===1?'':'s'}`);tone(120,.45,'sawtooth',.035,55);updateHud();
}
function damage(type){
 if(player.inv>0||state.mode!=='play')return;
 if(state.shield>0){state.shield--;player.inv=1.5;showToast('Shield blocked the hit');tone(520,.15,'triangle',.025,760);updateHud();return}
 state.lives--;player.inv=2;state.shake=.45;state.flash=.18;addParticle(player.x+55,player.y+48,'#ffde5b',22);tone(160,.22,'sawtooth',.03,70);
 obstacles.splice(0,obstacles.length,...obstacles.filter(o=>o.x>player.x+360||o.x+o.w<player.x-40));
 showToast(`${type==='tree'?'Tree':'Obstacle'} hit — recovery shield active`);
 if(state.lives<=0)finish();updateHud();
}
let sequenceIndex=0;
function spawnObstacle(){
 const type=sequence[sequenceIndex++%sequence.length],d=obstacleDefs[type];
 obstacles.push({type,x:W+40,y:GROUND-d.h,w:d.w,h:d.h,passed:false,phase:rnd(0,TAU)});
 const minGap=state.time<25?1.55:state.time<55?1.28:1.08;
 state.spawn=rnd(minGap,minGap+.48);
}
function spawnItem(){
 const roll=Math.random(),kind=roll<.45?'star':roll<.7?'shield':roll<.92?'laser':'roar';
 items.push({kind,x:W+35,y:rnd(245,345),w:48,h:48,phase:rnd(0,TAU)});
 state.itemSpawn=rnd(5.7,8.4);
}
function collect(item){
 if(item.kind==='star'){state.stats.stars++;state.score+=180;addFloater('+180 STAR',item.x,item.y,'#fff08d');tone(820,.09,'sine',.02,1180)}
 else if(item.kind==='shield'){state.shield=Math.min(2,state.shield+1);addFloater('SHIELD',item.x,item.y,'#9beaff');showToast('Shield Orb — blocks one hit');tone(560,.15,'triangle',.024,880)}
 else if(item.kind==='laser'){state.power='laser';state.ammo=18;addFloater('LASER',item.x,item.y,'#b9ff80');showToast('Laser Orb — tap Shoot');tone(640,.16,'square',.018,920)}
 else{state.roars=Math.min(2,state.roars+1);addFloater('MEGA ROAR',item.x,item.y,'#ffd85e');showToast('Mega Roar charged');tone(240,.2,'sawtooth',.025,520)}
 updateHud();
}
function updateHud(){
 ui.score.textContent=Math.floor(state.score).toLocaleString();ui.high.textContent=Math.max(state.high,Math.floor(state.score)).toLocaleString();
 ui.lives.textContent='❤'.repeat(Math.max(0,state.lives))||'0';
 let power='None';if(state.power==='laser')power=`Laser ${state.ammo}`;else if(state.shield)power=`Shield ${state.shield}`;else if(state.roars)power=`Roar ${state.roars}`;
 ui.power.textContent=power;ui.shootBtn.disabled=state.mode!=='play'||state.power!=='laser'||state.ammo<1;ui.roarBtn.disabled=state.mode!=='play'||state.roars<1;
 const pace=state.time<25?'Warm-Up':state.time<55?'Picking Up':state.time<90?'Fast':'Wild';ui.speed.textContent=pace;
 const progress=clamp(state.score/2500,0,1);ui.missionText.textContent=`Backyard Run: ${Math.min(2500,Math.floor(state.score)).toLocaleString()} / 2,500`;ui.missionBar.style.width=`${progress*100}%`;
}
function update(dt){
 if(state.toast>0){state.toast-=dt;if(state.toast<=0)ui.toast.classList.remove('show')}
 if(state.mode!=='play')return;
 state.time+=dt;state.shake=Math.max(0,state.shake-dt);state.flash=Math.max(0,state.flash-dt);player.inv=Math.max(0,player.inv-dt);player.attack=Math.max(0,player.attack-dt);
 state.speed=300+Math.min(165,state.time*1.7);state.score+=dt*(15+state.speed/80);state.groundShift=(state.groundShift+state.speed*dt)%1200;state.parallax+=state.speed*dt;
 if(player.jumpHeld&&!player.ground&&player.vy<0&&player.hold<.18){player.vy-=1050*dt;player.hold+=dt}
 player.vy+=1950*dt;player.y+=player.vy*dt;
 if(player.y>=GROUND-player.h){player.y=GROUND-player.h;player.vy=0;player.ground=true}
 player.run+=dt*(state.speed/62);
 state.spawn-=dt;state.itemSpawn-=dt;if(state.spawn<=0)spawnObstacle();if(state.itemSpawn<=0)spawnItem();
 for(const o of obstacles){o.x-=state.speed*dt;o.phase+=dt*3}
 for(const i of items){i.x-=state.speed*.82*dt;i.phase+=dt*5}
 for(const s of shots){s.x+=s.vx*dt;s.life-=dt}
 const pb=playerBox();
 for(let i=obstacles.length-1;i>=0;i--){
   const o=obstacles[i],box=obstacleBox(o);
   if(hit(pb,box)){damage(o.type);obstacles.splice(i,1);continue}
   if(!o.passed&&o.x+o.w<player.x+15){o.passed=true;state.stats.cleared++;state.score+=obstacleDefs[o.type].score;addFloater(`+${obstacleDefs[o.type].score}`,o.x,o.y)}
   if(o.x+o.w<-80)obstacles.splice(i,1);
 }
 for(let i=items.length-1;i>=0;i--){const it=items[i];if(hit(pb,it)){collect(it);items.splice(i,1)}else if(it.x+it.w<-60)items.splice(i,1)}
 for(let i=shots.length-1;i>=0;i--){
   const s=shots[i];let used=false;
   for(let j=obstacles.length-1;j>=0;j--)if(hit(s,obstacleBox(obstacles[j]))){const o=obstacles[j];addParticle(o.x+o.w/2,o.y+o.h/2,'#76f7ff',14);state.score+=130;state.stats.cleared++;obstacles.splice(j,1);used=true;break}
   if(used||s.x>W+80||s.life<=0)shots.splice(i,1);
 }
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=620*dt;p.life-=dt}
 for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
 for(const f of floaters){f.y+=f.vy*dt;f.life-=dt}
 for(let i=floaters.length-1;i>=0;i--)if(floaters[i].life<=0)floaters.splice(i,1);
 if(!state.completed&&state.score>=2500){state.completed=true;showToast('Backyard milestone complete — keep running for a higher score');tone(520,.35,'triangle',.03,980)}
 updateHud();
}

function drawCloud(x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='rgba(255,255,255,.84)';ctx.beginPath();ctx.arc(0,15,28,0,TAU);ctx.arc(33,0,36,0,TAU);ctx.arc(70,16,30,0,TAU);ctx.arc(42,27,42,0,TAU);ctx.fill();ctx.restore();
}
function drawBackground(){
 const sky=ctx.createLinearGradient(0,0,0,GROUND);sky.addColorStop(0,'#48bdf4');sky.addColorStop(.54,'#9ee3ff');sky.addColorStop(1,'#effcff');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='rgba(255,255,255,.15)';for(let i=0;i<8;i++){ctx.save();ctx.translate(130+i*130,0);ctx.rotate(-.17);ctx.fillRect(0,-20,36,360);ctx.restore()}
 const cloudOffset=(state.parallax*.045)%1180;drawCloud(130-cloudOffset,92,1);drawCloud(610-cloudOffset,62,.78);drawCloud(1040-cloudOffset,125,1.1);drawCloud(1510-cloudOffset,75,.85);
 ctx.fillStyle='#79b45d';ctx.beginPath();ctx.moveTo(0,325);for(let x=0;x<=W;x+=80)ctx.quadraticCurveTo(x+40,260+Math.sin((x+state.parallax*.03)/120)*28,x+80,322);ctx.lineTo(W,GROUND);ctx.lineTo(0,GROUND);ctx.closePath();ctx.fill();
 const far=(state.parallax*.11)%520;
 for(let i=-1;i<4;i++)drawHouse(i*360-far+70,245,.72);
 const fence=(state.parallax*.22)%72;ctx.fillStyle='#fff7d8';ctx.strokeStyle='#c9b88b';ctx.lineWidth=3;
 ctx.fillRect(0,350,W,13);ctx.fillRect(0,397,W,11);
 for(let x=-72;x<W+72;x+=72){const xx=x-fence;ctx.beginPath();ctx.moveTo(xx,410);ctx.lineTo(xx,329);ctx.lineTo(xx+22,309);ctx.lineTo(xx+44,329);ctx.lineTo(xx+44,410);ctx.closePath();ctx.fill();ctx.stroke()}
 const ground=ctx.createLinearGradient(0,GROUND-15,0,H);ground.addColorStop(0,'#79ca3e');ground.addColorStop(.08,'#3a9b2f');ground.addColorStop(.12,'#7b4b26');ground.addColorStop(1,'#3b2316');ctx.fillStyle=ground;ctx.fillRect(0,GROUND-10,W,H-GROUND+10);
 ctx.fillStyle='#8be14a';for(let x=-60;x<W+60;x+=32){const xx=x-(state.groundShift%32);ctx.beginPath();ctx.moveTo(xx,GROUND);ctx.lineTo(xx+7,GROUND-13-rnd(0,7));ctx.lineTo(xx+14,GROUND);ctx.fill()}
 ctx.fillStyle='rgba(35,21,14,.32)';for(let i=0;i<32;i++){const x=(i*103-state.groundShift*.52)%1040;ctx.beginPath();ctx.ellipse(x,H-48-(i%3)*18,8+(i%4)*2,4+(i%2)*2,0,0,TAU);ctx.fill()}
}
function drawHouse(x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#f0d7a6';ctx.strokeStyle='#8c6040';ctx.lineWidth=5;ctx.fillRect(0,45,170,125);ctx.strokeRect(0,45,170,125);
 ctx.fillStyle='#b54b38';ctx.beginPath();ctx.moveTo(-20,52);ctx.lineTo(84,-5);ctx.lineTo(192,52);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#8fd3eb';ctx.fillRect(25,82,42,48);ctx.fillRect(105,82,42,48);ctx.strokeRect(25,82,42,48);ctx.strokeRect(105,82,42,48);
 ctx.fillStyle='#7a4c32';ctx.fillRect(73,106,28,64);ctx.restore();
}
function drawShadow(x,y,w,alpha=.24){ctx.fillStyle=`rgba(20,28,24,${alpha})`;ctx.beginPath();ctx.ellipse(x+w/2,y,w*.45,10,0,0,TAU);ctx.fill()}
function drawRex(){
 const flash=player.inv>0&&Math.floor(player.inv*9)%2===0;if(flash)ctx.globalAlpha=.43;
 const bob=player.ground?Math.sin(player.run)*3:0,leg=Math.sin(player.run)*9,tilt=player.ground?Math.sin(player.run*.5)*.035:clamp(player.vy/1800,-.2,.22);
 ctx.save();ctx.translate(player.x+58,player.y+53+bob);ctx.rotate(tilt);ctx.translate(-58,-53);
 drawShadow(8,94,105,.22);
 ctx.strokeStyle='#17452a';ctx.lineWidth=5;ctx.lineJoin='round';
 ctx.fillStyle='#35a84c';ctx.beginPath();ctx.moveTo(24,53);ctx.quadraticCurveTo(-4,45,-19,65);ctx.quadraticCurveTo(6,61,30,73);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#45c35d';roundedRect(ctx,20,30,76,58,28);ctx.fill();ctx.stroke();
 ctx.fillStyle='#c9e477';ctx.beginPath();ctx.ellipse(58,69,29,21,0,0,TAU);ctx.fill();
 ctx.fillStyle='#45c35d';ctx.beginPath();ctx.ellipse(83,31,34,29,-.2,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#3db555';ctx.beginPath();ctx.ellipse(96,42,25,18,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(78,23,10,13,0,0,TAU);ctx.fill();ctx.fillStyle='#312516';ctx.beginPath();ctx.arc(81,25,5,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(83,22,1.5,0,TAU);ctx.fill();
 ctx.fillStyle='#f8fbca';ctx.beginPath();ctx.moveTo(92,42);ctx.lineTo(99,48);ctx.lineTo(104,41);ctx.lineTo(110,47);ctx.lineTo(116,39);ctx.quadraticCurveTo(108,57,92,53);ctx.closePath();ctx.fill();
 ctx.fillStyle='#e34e42';ctx.beginPath();ctx.moveTo(42,39);ctx.lineTo(19,31);ctx.lineTo(29,47);ctx.lineTo(18,55);ctx.lineTo(48,54);ctx.closePath();ctx.fill();ctx.strokeStyle='#8b2825';ctx.lineWidth=3;ctx.stroke();
 ctx.strokeStyle='#16442a';ctx.lineWidth=7;ctx.lineCap='round';
 const legA=player.ground?leg:player.vy<0?-12:8,legB=player.ground?-leg:player.vy<0?12:-5;
 ctx.beginPath();ctx.moveTo(45,79);ctx.lineTo(35+legA,96);ctx.lineTo(48+legA,97);ctx.stroke();
 ctx.beginPath();ctx.moveTo(73,80);ctx.lineTo(82+legB,96);ctx.lineTo(95+legB,96);ctx.stroke();
 ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(49,48);ctx.lineTo(34,62);ctx.stroke();
 ctx.fillStyle='#234d2b';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(34+i*14,28);ctx.lineTo(40+i*14,16-(i%2)*4);ctx.lineTo(47+i*14,29);ctx.closePath();ctx.fill()}
 if(player.attack>0){ctx.fillStyle='rgba(105,245,255,.8)';ctx.beginPath();ctx.moveTo(111,45);ctx.lineTo(145,38);ctx.lineTo(145,52);ctx.closePath();ctx.fill()}
 ctx.restore();ctx.globalAlpha=1;
}
function drawCat(o){
 ctx.save();ctx.translate(o.x,o.y);drawShadow(0,o.h+4,o.w);
 const breathe=Math.sin(o.phase)*2;ctx.strokeStyle='#7a381d';ctx.lineWidth=5;ctx.lineJoin='round';ctx.fillStyle='#e9852e';
 ctx.beginPath();ctx.ellipse(61,36+breathe,47,24,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.arc(28,32+breathe,25,0,TAU);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(10,19+breathe);ctx.lineTo(16,1+breathe);ctx.lineTo(28,17+breathe);ctx.moveTo(31,17+breathe);ctx.lineTo(44,2+breathe);ctx.lineTo(47,22+breathe);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#7a381d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(74,38+breathe,32,.1,1.45);ctx.stroke();
 ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(19,31+breathe);ctx.quadraticCurveTo(24,36+breathe,29,31+breathe);ctx.moveTo(33,31+breathe);ctx.quadraticCurveTo(38,36+breathe,43,31+breathe);ctx.stroke();
 ctx.fillStyle='#f9c36d';ctx.beginPath();ctx.ellipse(33,42+breathe,16,8,0,0,TAU);ctx.fill();ctx.restore();
}
function drawDuck(o){
 ctx.save();ctx.translate(o.x,o.y+Math.sin(o.phase)*2);drawShadow(0,o.h+4,o.w);
 ctx.strokeStyle='#9b6500';ctx.lineWidth=4;ctx.fillStyle='#ffd72e';ctx.beginPath();ctx.ellipse(36,47,29,23,-.1,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(44,23,20,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ff8e1e';ctx.beginPath();ctx.moveTo(55,24);ctx.quadraticCurveTo(76,20,72,30);ctx.quadraticCurveTo(62,34,53,30);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(48,18,7,0,TAU);ctx.fill();ctx.fillStyle='#2c250f';ctx.beginPath();ctx.arc(50,19,3,0,TAU);ctx.fill();
 ctx.strokeStyle='#d29810';ctx.lineWidth=3;ctx.beginPath();ctx.arc(30,46,14,-.9,.8);ctx.stroke();ctx.restore();
}
function drawStump(o){
 ctx.save();ctx.translate(o.x,o.y);drawShadow(0,o.h+5,o.w);
 ctx.strokeStyle='#603417';ctx.lineWidth=5;ctx.fillStyle='#9e5b28';roundedRect(ctx,9,13,76,56,12);ctx.fill();ctx.stroke();
 ctx.fillStyle='#d8994c';ctx.beginPath();ctx.ellipse(47,14,38,13,0,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#8a4d25';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(47,14,25,8,0,0,TAU);ctx.stroke();ctx.beginPath();ctx.ellipse(47,14,13,4,0,0,TAU);ctx.stroke();
 ctx.fillStyle='#6b3b1c';ctx.beginPath();ctx.moveTo(9,54);ctx.lineTo(-3,68);ctx.lineTo(20,64);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function drawPizza(o){
 ctx.save();ctx.translate(o.x,o.y);drawShadow(0,o.h+5,o.w);
 ctx.strokeStyle='#7f3b17';ctx.lineWidth=5;ctx.lineJoin='round';ctx.fillStyle='#ffd250';ctx.beginPath();ctx.moveTo(10,61);ctx.lineTo(65,10);ctx.lineTo(76,66);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#e8912e';ctx.beginPath();ctx.moveTo(58,6);ctx.quadraticCurveTo(73,5,77,13);ctx.lineTo(80,66);ctx.lineTo(70,65);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#df3f2f';for(const [x,y,r] of [[43,28,8],[31,47,7],[57,51,6]]){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.stroke()}
 ctx.fillStyle='#fff3a8';ctx.beginPath();ctx.moveTo(15,57);ctx.quadraticCurveTo(22,65,27,56);ctx.lineTo(31,69);ctx.lineTo(38,53);ctx.closePath();ctx.fill();ctx.restore();
}
function drawTree(o){
 ctx.save();ctx.translate(o.x,o.y);drawShadow(0,o.h+5,o.w);
 ctx.strokeStyle='#553018';ctx.lineWidth=7;ctx.fillStyle='#8b4c24';ctx.beginPath();ctx.moveTo(38,160);ctx.quadraticCurveTo(26,104,41,64);ctx.lineTo(62,64);ctx.quadraticCurveTo(73,112,61,160);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle='#2b641d';ctx.lineWidth=5;ctx.fillStyle='#61a934';
 for(const [x,y,r] of [[24,55,30],[54,38,36],[80,58,30],[48,72,38],[73,83,25]]){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.stroke()}
 ctx.fillStyle='#87ce45';for(const [x,y] of [[20,48],[50,28],[72,51],[40,62],[68,77]]){ctx.beginPath();ctx.arc(x,y,10,0,TAU);ctx.fill()}
 ctx.restore();
}
function drawObstacle(o){if(o.type==='cat')drawCat(o);else if(o.type==='duck')drawDuck(o);else if(o.type==='stump')drawStump(o);else if(o.type==='pizza')drawPizza(o);else drawTree(o)}
function drawItem(i){
 ctx.save();ctx.translate(i.x+i.w/2,i.y+i.h/2+Math.sin(i.phase)*5);ctx.rotate(i.phase*.08);
 const colors={star:['#fff275','#efa514'],shield:['#91f4ff','#2986c8'],laser:['#a4ff70','#2d9e4c'],roar:['#ffd95c','#e05e28']}[i.kind];
 const g=ctx.createRadialGradient(-8,-10,3,0,0,25);g.addColorStop(0,'#fff');g.addColorStop(.25,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.strokeStyle='#fff4b0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,22,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#17304a';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i.kind==='star'?'★':i.kind==='shield'?'S':i.kind==='laser'?'L':'R',0,1);ctx.restore();
}
function draw(){
 ctx.save();if(state.shake>0)ctx.translate(rnd(-6,6)*state.shake/.45,rnd(-5,5)*state.shake/.45);
 drawBackground();for(const i of items)drawItem(i);for(const o of obstacles)drawObstacle(o);drawRex();
 ctx.fillStyle='#7ff5ff';for(const s of shots){ctx.shadowBlur=13;ctx.shadowColor='#6ff4ff';roundedRect(ctx,s.x,s.y,s.w,s.h,4);ctx.fill();ctx.shadowBlur=0}
 for(const p of particles){ctx.globalAlpha=clamp(p.life/.75,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill()}ctx.globalAlpha=1;
 ctx.font='900 18px system-ui';ctx.textAlign='center';for(const f of floaters){ctx.globalAlpha=clamp(f.life,0,1);ctx.fillStyle=f.color;ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=4;ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;
 if(state.flash>0){ctx.fillStyle='rgba(255,235,120,.24)';ctx.fillRect(0,0,W,H)}
 ctx.restore();
}
function loop(ms){const dt=Math.min(.033,(ms-state.last)/1000||0);state.last=ms;update(dt);draw();requestAnimationFrame(loop)}

ui.startBtn.addEventListener('click',reset);ui.playAgainBtn.addEventListener('click',reset);ui.restartBtn.addEventListener('click',reset);
ui.resumeBtn.addEventListener('click',pause);ui.pauseBtn.addEventListener('click',pause);
ui.jumpBtn.addEventListener('pointerdown',e=>{e.preventDefault();jumpStart()});ui.jumpBtn.addEventListener('pointerup',jumpEnd);ui.jumpBtn.addEventListener('pointercancel',jumpEnd);
canvas.addEventListener('pointerdown',e=>{e.preventDefault();jumpStart()});canvas.addEventListener('pointerup',jumpEnd);canvas.addEventListener('pointercancel',jumpEnd);
ui.shootBtn.addEventListener('pointerdown',e=>{e.preventDefault();shoot()});ui.roarBtn.addEventListener('pointerdown',e=>{e.preventDefault();roar()});
ui.soundBtn.addEventListener('click',()=>{state.sound=!state.sound;store.set('rexRemixSound',state.sound);ui.soundBtn.textContent=state.sound?'Sound On':'Sound Off';ui.soundBtn.setAttribute('aria-pressed',String(state.sound))});
ui.instructionsBtn.addEventListener('click',()=>ui.dialog.showModal());ui.closeInstructionsBtn.addEventListener('click',()=>ui.dialog.close());
ui.dialogPlayBtn.addEventListener('click',()=>{ui.dialog.close();if(state.mode==='menu'||state.mode==='over')reset()});
addEventListener('keydown',e=>{if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();if(!e.repeat)jumpStart()}else if(e.key==='f'||e.key==='F')shoot();else if(e.key==='r'||e.key==='R')roar();else if(e.key==='p'||e.key==='P'||e.key==='Escape')pause()});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp')jumpEnd()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='play')pause()});

ui.high.textContent=state.high.toLocaleString();ui.soundBtn.textContent=state.sound?'Sound On':'Sound Off';updateHud();requestAnimationFrame(loop);
})();
