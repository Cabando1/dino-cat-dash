const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

class ClassList{
  constructor(initial=''){this.values=new Set(initial.split(/\s+/).filter(Boolean))}
  add(...names){names.forEach(n=>this.values.add(n))}
  remove(...names){names.forEach(n=>this.values.delete(n))}
  contains(name){return this.values.has(name)}
  toggle(name,force){
    if(force===undefined){if(this.values.has(name)){this.values.delete(name);return false}this.values.add(name);return true}
    if(force)this.values.add(name);else this.values.delete(name);
    return force;
  }
}
class Element{
  constructor(tag='div',id=''){this.tagName=tag;this.id=id;this.classList=new ClassList();this.children=[];this.style={};this.textContent='';this.disabled=false;this.dataset={};this.width=960;this.height=210;this.listeners={}}
  appendChild(child){this.children.push(child);if(child.id)elements.set(child.id,child);return child}
  setAttribute(){}
  addEventListener(type,fn){this.listeners[type]=fn}
  focus(){}
  set innerHTML(value){
    this._innerHTML=value;
    for(const id of ['reliableStoryKicker','reliableStoryTitle','reliableStoryArt','reliableStoryCopy','reliablePowerGrid','reliableStoryReady']){
      if(!elements.has(id)){
        const tag=id==='reliableStoryArt'?'canvas':id==='reliableStoryReady'?'button':'div';
        elements.set(id,new Element(tag,id));
      }
    }
  }
  get innerHTML(){return this._innerHTML||''}
  getContext(){return canvasContext}
}
const noop=()=>{};
const gradient={addColorStop:noop};
const canvasContext=new Proxy({
  createLinearGradient:()=>gradient,
  measureText:()=>({width:10}),
  save:noop,restore:noop,translate:noop,scale:noop,beginPath:noop,moveTo:noop,lineTo:noop,
  arcTo:noop,closePath:noop,fill:noop,stroke:noop,ellipse:noop,arc:noop,fillRect:noop,
  quadraticCurveTo:noop,fillText:noop
},{get(target,key){return key in target?target[key]:0},set(target,key,value){target[key]=value;return true}});

const elements=new Map();
const stage=new Element('section','stage');
const body=new Element('body','body');
const legacy=new Element('section','storyCard');
legacy.classList.add('hidden');
elements.set('storyCard',legacy);

const document={
  body,
  createElement:tag=>new Element(tag),
  querySelector:sel=>sel==='.stage'?stage:null,
  getElementById:id=>elements.get(id)||null
};
const storage=new Map();
let collectNext=false;
let bossOnReset=false;
const D={
  state:{mode:'play',last:0,stats:{powers:0},boss:null,skin:'jungle'},
  player:{power:'none',ammo:0},
  ui:{power:new Element('strong','power'),shootBtn:new Element('button','shootBtn')},
  skins:{jungle:{dark:'#1',body:'#2',belly:'#3',stripe:'#4',bandana:'#5'}},
  store:{get:(k,f)=>storage.has(k)?storage.get(k):f,set:(k,v)=>storage.set(k,v)},
  game:{
    reset(){D.state.mode='play';D.state.stats={powers:0};D.state.boss=bossOnReset?{hp:42}:null},
    shoot(){if(D.state.mode==='play'&&D.player.power==='laser'&&D.player.ammo>0)D.player.ammo--},
    update(){if(collectNext){collectNext=false;D.state.stats.powers++}}
  }
};
const window={Dino:D};
const context={
  window,document,performance:{now:()=>1234},
  addEventListener:noop,
  setTimeout:fn=>{fn();return 1},
  Math,Boolean,Number
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/cutscene-reliability.js','utf8'),context,{filename:'cutscene-reliability.js'});

assert(D.cutsceneReliability,'Reliability controller was not exposed');

collectNext=true;
D.game.update(1/60);
assert.strictEqual(D.state.mode,'story','Power-up did not pause the game');
assert.strictEqual(D.cutsceneReliability.activeKind,'powers','Power guide did not open');
D.cutsceneReliability.close();
assert.strictEqual(D.state.mode,'play','Power guide did not resume play');
assert.strictEqual(storage.get('dinoCatDashPowerGuideSeenV223'),true,'Power guide completion was not saved');

bossOnReset=true;
D.game.reset();
assert.strictEqual(D.state.mode,'story','Boss intro did not pause the game');
assert.strictEqual(D.cutsceneReliability.activeKind,'boss','Boss intro did not open');
D.cutsceneReliability.close();
assert.strictEqual(D.state.mode,'play','Boss intro did not resume play');

D.player.power='none';
D.player.ammo=0;
D.game.shoot();
assert.strictEqual(D.player.power,'laser','Boss laser was not restored');
assert.strictEqual(D.player.ammo,9999,'Boss laser ammo is not effectively unlimited');
assert.strictEqual(D.ui.power.textContent,'Laser Blaster (∞)','Boss HUD does not show unlimited ammo');

console.log('Cutscene reliability and boss ammo test passed.');
