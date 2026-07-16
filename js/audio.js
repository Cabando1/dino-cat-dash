(()=>{'use strict';
const D=window.Dino;
let ctx=null;
function init(){
  if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)()}catch{return null}}
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return ctx;
}
function tone(freq,duration=.08,type='square',volume=.03,slide=0,delay=0){
  if(!D.state.sound)return;
  const a=init();if(!a)return;
  const when=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(35,freq),when);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),when+duration);
  g.gain.setValueAtTime(volume,when);g.gain.exponentialRampToValueAtTime(.0001,when+duration);
  o.connect(g);g.connect(a.destination);o.start(when);o.stop(when+duration);
}
function noise(duration=.12,volume=.025,delay=0){
  if(!D.state.sound)return;
  const a=init();if(!a)return;
  const len=Math.max(1,Math.floor(a.sampleRate*duration)),b=a.createBuffer(1,len,a.sampleRate),data=b.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
  const s=a.createBufferSource(),g=a.createGain(),when=a.currentTime+delay;s.buffer=b;g.gain.value=volume;s.connect(g);g.connect(a.destination);s.start(when);
}
const sfx={
  jump(){tone(350,.07,'square',.03,240);tone(610,.05,'triangle',.018,70,.04)},
  land(){tone(115,.05,'sine',.022,-20)},
  hurt(){tone(150,.18,'sawtooth',.045,-80);noise(.12,.03)},
  star(){tone(740,.07,'triangle',.028,180);tone(980,.08,'triangle',.022,100,.06)},
  power(){tone(420,.07,'square',.025,220);tone(700,.1,'triangle',.028,180,.07)},
  laser(){tone(980,.06,'sawtooth',.028,-430)},
  flame(){tone(175,.12,'sawtooth',.028,-45);noise(.12,.02)},
  destroy(){tone(175,.07,'square',.03,-80);noise(.08,.032)},
  roar(){tone(95,.48,'sawtooth',.055,-48);noise(.34,.05)},
  bossHit(){tone(235,.08,'square',.035,-90)},
  bossIntro(){tone(112,.24,'sawtooth',.05,-22);tone(82,.34,'sawtooth',.05,-18,.2)},
  unlock(){[660,880,1100].forEach((f,i)=>tone(f,.11,'triangle',.028,60,i*.09))},
  win(){[523,659,784,1046].forEach((f,i)=>tone(f,.24,'triangle',.035,80,i*.14))},
  shield(){tone(680,.15,'triangle',.035,-120)},
  close(){tone(520,.05,'square',.018,160)}
};
function musicUpdate(dt){
  const s=D.state;if(!s.music||s.mode!=='play')return;
  s.musicBeat-=dt;if(s.musicBeat>0)return;
  s.musicBeat=s.boss?.23:.34;
  const a=init();if(!a)return;
  const normal=[[196,247,294,330,294,247],[220,277,330,392,330,277],[165,220,247,294,247,220],[147,196,247,294,247,196]];
  const boss=[110,131,147,165,147,131,123,98];
  const scale=s.boss?boss:normal[Math.min(3,s.world)];
  const f=scale[s.musicStep%scale.length];s.musicStep++;
  const when=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=s.boss?'sawtooth':'triangle';o.frequency.value=f;g.gain.value=s.boss?.012:.009;g.gain.exponentialRampToValueAtTime(.0001,when+.18);o.connect(g);g.connect(a.destination);o.start();o.stop(when+.18);
  if(s.musicStep%4===0){const bass=a.createOscillator(),bg=a.createGain();bass.type='sine';bass.frequency.value=f/2;bg.gain.value=.012;bg.gain.exponentialRampToValueAtTime(.0001,when+.2);bass.connect(bg);bg.connect(a.destination);bass.start();bass.stop(when+.2)}
}
D.audio={init,tone,noise,sfx,musicUpdate};
})();
