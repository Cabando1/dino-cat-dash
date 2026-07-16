const fs=require('fs'),vm=require('vm');
class ClassList{constructor(){this.values=new Set()}add(...items){items.forEach(item=>this.values.add(item))}remove(...items){items.forEach(item=>this.values.delete(item))}toggle(item,force){if(force===undefined)force=!this.values.has(item);force?this.values.add(item):this.values.delete(item);return force}contains(item){return this.values.has(item)}}
class Element{constructor(id){this.id=id;this.textContent='';this.innerHTML='';this.style={};this.disabled=false;this.dataset={};this.classList=new ClassList();this.listeners={}}addEventListener(name,handler){(this.listeners[name]??=[]).push(handler)}}
const ids=['game','musicBtn','soundBtn','score','high','lives','world','power','combo','missionText','missionBar','timerText','timerBar','overlay','kicker','title','message','menuStats','menuHigh','achievementTotal','bestCombo','dailyBest','skinPicker','worldPicker','results','achievements','toast','startBtn','achievementsBtn','jumpBtn','shootBtn','roarBtn','pauseBtn'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
const skins=['jungle','ocean','sunset'].map(value=>{const el=new Element(value);el.dataset.skin=value;return el});
const worlds=[0,1,2,3,4].map(value=>{const el=new Element(`world-${value}`);el.dataset.world=String(value);return el});
const gradient=()=>({addColorStop(){}});
const context=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient,measureText(){return{width:20}}},{get(target,key){if(key in target)return target[key];return()=>{}},set(target,key,value){target[key]=value;return true}});
elements.game.width=960;elements.game.height=540;elements.game.getContext=()=>context;
global.window=global;
global.document={hidden:false,getElementById:id=>elements[id]||new Element(id),querySelectorAll:selector=>selector==='.skin'?skins:selector==='.world-choice'?worlds:[],addEventListener(){}};
global.localStorage={values:new Map(),getItem(key){return this.values.has(key)?this.values.get(key):null},setItem(key,value){this.values.set(key,String(value))}};
global.navigator={};global.performance={now:()=>1000};global.requestAnimationFrame=()=>1;global.addEventListener=()=>{};global.setTimeout=handler=>{handler();return 1};
for(const file of ['config.js','audio.js','render.js','mechanics.js','main.js'])vm.runInThisContext(fs.readFileSync(`js/${file}`,'utf8'),{filename:file});
const D=global.Dino;
if(!D||D.state.mode!=='menu')throw new Error('Menu initialization failed');
D.game.reset();
for(let i=0;i<180;i++){D.game.update(1/60);D.render.draw()}
D.game.jump();for(let i=0;i<20;i++)D.game.update(1/60);
D.player.power='laser';D.player.ammo=3;D.game.shoot();for(let i=0;i<30;i++)D.game.update(1/60);
D.player.roars=1;D.game.megaRoar();D.game.pause();D.game.pause();
for(const target of [2250,4450,6650,8850]){D.state.score=target;D.game.update(.016);D.render.draw()}
if(!D.state.boss||D.state.world!==4)throw new Error('Boss did not start');
D.state.boss.intro=0;for(let i=0;i<10;i++){D.state.boss.cool=0;D.game.update(.016);D.render.draw()}
D.state.boss.hp=1;D.arrays.shots.push({x:D.state.boss.x+40,y:D.state.boss.y+50,w:60,h:20,vx:0,vy:0,type:'laser',life:1,bounces:0});D.game.update(.016);D.render.draw();
if(D.state.mode!=='over'||D.state.boss)throw new Error('Victory sequence failed');
console.log(JSON.stringify({mode:D.state.mode,world:D.state.world,maxWorld:D.state.maxWorld,score:Math.floor(D.state.score),status:'passed'}));
